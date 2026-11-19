/**
 * Prüft vor jedem Build die Inhalte (site.json + Speisekarte) und meldet Fehler verständlich auf Deutsch.
 * Aufruf: npm run check   (läuft automatisch bei npm run build)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const ALLERGENS = new Set('ABCDEFGHLMNOPR'.split(''));
const PRICE = /^\d{1,4}([.,]\d{1,2})?$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(join(root, rel), 'utf-8'));
  } catch (e) {
    errors.push(`${rel}: Datei ist kein gültiges JSON (${e.message}). Tipp: fehlendes Komma oder Anführungszeichen?`);
    return null;
  }
}
const imageExists = (p) => !p || existsSync(join(root, p.replace(/^\//, '')));

// ---- site.json
const site = readJson('src/content/site.json');
if (site) {
  if (!/^[1-9]\d{7,14}$/.test(site.whatsapp ?? ''))
    errors.push(`site.json: "whatsapp" muss nur aus Ziffern bestehen, mit Ländervorwahl, ohne + (z. B. 436641234567). Aktuell: "${site.whatsapp}"`);
  if (/^4366400000|^43664000000/.test(site.whatsapp)) warnings.push('site.json: WhatsApp-Nummer ist noch der Platzhalter.');
  if (!/^https?:\/\//.test(site.url ?? '')) errors.push('site.json: "url" muss mit https:// beginnen.');
  for (const h of site.openingHours ?? []) {
    if (!TIME.test(h.open) || !TIME.test(h.close)) errors.push(`site.json: Öffnungszeit "${h.day} ${h.open}–${h.close}" bitte im Format HH:MM.`);
  }
  for (const k of ['logo', 'heroImage', 'aboutImage']) if (!imageExists(site[k])) errors.push(`site.json: Bild "${site[k]}" (${k}) nicht gefunden.`);
  for (const g of site.gallery ?? []) if (!imageExists(g.image)) errors.push(`site.json: Galeriebild "${g.image}" nicht gefunden.`);
  for (const k of ['colorBrand', 'colorAccent', 'colorHighlight'])
    if (site[k] && !/^#[0-9a-fA-F]{3,8}$/.test(site[k])) errors.push(`site.json: Farbe ${k} "${site[k]}" muss wie #c49a52 aussehen.`);
  for (const [k, v] of Object.entries(site)) if (typeof v === 'string' && v.startsWith('[')) warnings.push(`site.json: "${k}" ist noch ein Platzhalter: ${v}`);
}

// ---- Speisekarte
const dir = join(root, 'src/content/menu');
let dishCount = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const rel = `src/content/menu/${file}`;
  const cat = readJson(rel);
  if (!cat) continue;
  if (!cat.name) errors.push(`${rel}: Kategorie hat keinen Namen.`);
  if (!imageExists(cat.image)) errors.push(`${rel}: Kategoriebild "${cat.image}" nicht gefunden.`);
  (cat.dishes ?? []).forEach((d, i) => {
    const where = `${rel} → "${d.name || `Eintrag ${i + 1}`}"`;
    dishCount++;
    if (!d.name) errors.push(`${where}: Name fehlt.`);
    if (!PRICE.test(String(d.price ?? '').trim())) errors.push(`${where}: Preis "${d.price}" ungültig (Beispiel: 13,50).`);
    if (d.price2 && !PRICE.test(String(d.price2).trim())) errors.push(`${where}: 2. Preis "${d.price2}" ungültig.`);
    if (d.price2 && !d.size2) warnings.push(`${where}: 2. Preis ohne 2. Mengenangabe.`);
    for (const a of d.allergens ?? []) if (!ALLERGENS.has(a)) errors.push(`${where}: Allergen "${a}" gibt es nicht (erlaubt: A–H, L–P, R).`);
    if (!imageExists(d.image)) errors.push(`${where}: Foto "${d.image}" nicht gefunden.`);
  });
}

for (const w of warnings) console.warn(`⚠️  ${w}`);
if (errors.length) {
  console.error(`\n❌ ${errors.length} Fehler in den Inhalten:\n`);
  for (const e of errors) console.error(`   • ${e}`);
  console.error('');
  process.exit(1);
}
console.log(`✅ Inhalte geprüft: ${dishCount} Einträge, keine Fehler.`);
