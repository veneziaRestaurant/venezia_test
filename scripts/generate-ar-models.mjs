/**
 * Erzeugt für jedes Gericht mit Foto automatisch ein 3D-Modell (GLB) für die AR-Ansicht:
 * ein weißer Teller, auf dem das Foto als runde Scheibe liegt – in echter Größe (Meter).
 *
 *   npm run ar        → nur geänderte Fotos neu erzeugen
 *   npm run build     → läuft automatisch mit
 *
 * Ausgabe: public/ar/<kategorie>-<gericht>.glb
 * Echte 3D-Scans (Feld „model3d“ in der Admin-Oberfläche) haben Vorrang und werden hier nicht angefasst.
 * Getränke werden übersprungen (eine flache Scheibe passt nicht zu einem Glas).
 */
import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { Document, NodeIO } from '@gltf-transform/core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MENU_DIR = join(ROOT, 'src/content/menu');
const OUT_DIR = join(ROOT, 'public/ar');
const SEGMENTS = 96;

export function slugify(s) {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ------------------------------------------------------------ Geometrie */

/** Sammelt Dreiecke; y = oben, Maße in Metern. */
class Mesh {
  pos = []; nrm = []; uv = []; idx = [];
  vertex(p, n, t = [0, 0]) {
    this.pos.push(...p); this.nrm.push(...n); this.uv.push(...t);
    return this.pos.length / 3 - 1;
  }
}

const ring = (i) => {
  const a = (i / SEGMENTS) * Math.PI * 2;
  return [Math.cos(a), Math.sin(a)];
};

/** Flache Kreis- oder Ringfläche (nach oben bzw. unten zeigend). */
function annulus(m, rIn, rOut, y, up, withUv = false) {
  const n = [0, up ? 1 : -1, 0];
  const center = rIn === 0 ? m.vertex([0, y, 0], n, [0.5, 0.5]) : -1;
  for (let i = 0; i < SEGMENTS; i++) {
    const [c0, s0] = ring(i), [c1, s1] = ring(i + 1);
    const uvOf = (c, s, r) => (withUv ? [0.5 + (c * r) / (2 * rOut), 0.5 + (s * r) / (2 * rOut)] : [0, 0]);
    const o0 = m.vertex([c0 * rOut, y, s0 * rOut], n, uvOf(c0, s0, rOut));
    const o1 = m.vertex([c1 * rOut, y, s1 * rOut], n, uvOf(c1, s1, rOut));
    if (rIn === 0) {
      up ? m.idx.push(center, o1, o0) : m.idx.push(center, o0, o1);
    } else {
      const i0 = m.vertex([c0 * rIn, y, s0 * rIn], n), i1 = m.vertex([c1 * rIn, y, s1 * rIn], n);
      up ? m.idx.push(i0, o1, o0, i0, i1, o1) : m.idx.push(i0, o0, o1, i0, o1, i1);
    }
  }
}

/** Kegelstumpf-Mantel zwischen (r0, y0) und (r1, y1), Normale nach außen (out=true) oder innen. */
function band(m, r0, y0, r1, y1, out = true) {
  const dr = r1 - r0, dy = y1 - y0, len = Math.hypot(dr, dy);
  let nx = dy / len, ny = -dr / len;
  if (!out) { nx = -nx; ny = -ny; }
  for (let i = 0; i < SEGMENTS; i++) {
    const [c0, s0] = ring(i), [c1, s1] = ring(i + 1);
    const a = m.vertex([c0 * r0, y0, s0 * r0], [c0 * nx, ny, s0 * nx]);
    const b = m.vertex([c1 * r0, y0, s1 * r0], [c1 * nx, ny, s1 * nx]);
    const c = m.vertex([c0 * r1, y1, s0 * r1], [c0 * nx, ny, s0 * nx]);
    const d = m.vertex([c1 * r1, y1, s1 * r1], [c1 * nx, ny, s1 * nx]);
    out ? m.idx.push(a, c, b, b, c, d) : m.idx.push(a, b, c, b, d, c);
  }
}

/** Teller: Fuß, flacher Spiegel, nach außen ansteigende Fahne. */
function plateMesh(R) {
  const m = new Mesh();
  const foot = R * 0.55, well = R * 0.72, h = 0.006, rimH = 0.022;
  annulus(m, 0, foot, 0, false);                 // Unterseite
  band(m, foot, 0, R, rimH);                     // Außenwand
  annulus(m, 0, well, h, true);                  // Spiegel (wird vom Essen verdeckt)
  band(m, well, h, R * 0.99, rimH - 0.002, false); // Fahne innen
  band(m, R * 0.99, rimH - 0.002, R, rimH, false); // Rand
  return m;
}

/** Essen: leicht gewölbte, runde Scheibe mit Fototextur. */
function foodMesh(r, y) {
  const m = new Mesh();
  const dome = 0.008, rings = 8;
  // konzentrische Ringe mit leichter Wölbung, damit es nicht wie Papier wirkt
  const pts = [];
  for (let k = 0; k <= rings; k++) {
    const t = k / rings, rr = r * t, yy = y + dome * (1 - t * t);
    const row = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const [c, s] = ring(i);
      row.push(m.vertex([c * rr, yy, s * rr], [c * t * 0.3, 1, s * t * 0.3], [0.5 + (c * t) / 2, 0.5 + (s * t) / 2]));
    }
    pts.push(row);
  }
  for (let k = 0; k < rings; k++)
    for (let i = 0; i < SEGMENTS; i++) {
      const a = pts[k][i], b = pts[k][i + 1], c = pts[k + 1][i], d = pts[k + 1][i + 1];
      m.idx.push(a, d, c, a, b, d);
    }
  // Kante nach unten zum Teller
  band(m, r, y, r * 0.98, y - 0.003);
  return m;
}

function addPrimitive(doc, buffer, mesh, m, material) {
  const acc = (type, arr, Ctor) => doc.createAccessor().setType(type).setArray(new Ctor(arr)).setBuffer(buffer);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', acc('VEC3', m.pos, Float32Array))
    .setAttribute('NORMAL', acc('VEC3', m.nrm.map((v, i, a) => {
      const j = i - (i % 3); const l = Math.hypot(a[j], a[j + 1], a[j + 2]) || 1; return v / l;
    }), Float32Array))
    .setAttribute('TEXCOORD_0', acc('VEC2', m.uv, Float32Array))
    .setIndices(acc('SCALAR', m.idx, Uint32Array))
    .setMaterial(material);
  mesh.addPrimitive(prim);
}

async function buildGlb(photoPath, diameter) {
  const R = diameter / 2;
  // Foto quadratisch zuschneiden (Mitte), verkleinern und optimieren
  const jpeg = await sharp(photoPath).rotate().resize(1024, 1024, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 78, mozjpeg: true }).toBuffer();

  const doc = new Document();
  const buffer = doc.createBuffer();
  const tex = doc.createTexture('photo').setImage(jpeg).setMimeType('image/jpeg');
  const porcelain = doc.createMaterial('porcelain').setBaseColorFactor([0.96, 0.95, 0.93, 1]).setRoughnessFactor(0.25).setMetallicFactor(0);
  const food = doc.createMaterial('food').setBaseColorTexture(tex).setRoughnessFactor(0.6).setMetallicFactor(0);

  const mesh = doc.createMesh('dish');
  addPrimitive(doc, buffer, mesh, plateMesh(R), porcelain);
  addPrimitive(doc, buffer, mesh, foodMesh(R * 0.8, 0.0075), food);
  doc.createScene('scene').addChild(doc.createNode('dish').setMesh(mesh));
  return new NodeIO().writeBinary(doc);
}

/* ------------------------------------------------------------- Ablauf */

export async function generate({ log = console.log } = {}) {
  mkdirSync(OUT_DIR, { recursive: true });
  const wanted = new Set();
  let made = 0;
  for (const file of readdirSync(MENU_DIR).filter((f) => f.endsWith('.json'))) {
    const cat = JSON.parse(readFileSync(join(MENU_DIR, file), 'utf-8'));
    const catSlug = file.replace(/\.json$/, '');
    if (cat.kind === 'drinks') continue;
    for (const dish of cat.dishes ?? []) {
      if (!dish.image || dish.model3d) continue;
      const photo = join(ROOT, dish.image);
      if (!existsSync(photo)) continue;
      const name = `${catSlug}-${slugify(dish.name)}.glb`;
      const out = join(OUT_DIR, name);
      wanted.add(name);
      if (existsSync(out) && statSync(out).mtimeMs >= statSync(photo).mtimeMs) continue;
      const diameter = catSlug === 'pizza' ? 0.32 : 0.28;
      const glb = await buildGlb(photo, diameter);
      await import('node:fs/promises').then((fs) => fs.writeFile(out, glb));
      made++;
    }
  }
  // Modelle zu gelöschten Gerichten/Fotos aufräumen
  for (const f of readdirSync(OUT_DIR).filter((f) => f.endsWith('.glb'))) if (!wanted.has(f)) unlinkSync(join(OUT_DIR, f));
  log(`AR: ${wanted.size} Modelle (${made} neu erzeugt) in public/ar/`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  generate().catch((e) => { console.error(e); process.exit(1); });
}
