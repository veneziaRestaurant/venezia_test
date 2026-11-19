import type { ImageMetadata } from 'astro';
import site from '../content/site.json';
import type { Lang } from '../i18n/ui';
import type { AllergenCode } from './allergens';

/* ---------------------------------------------------------------- Typen */

export interface Dish {
  name: string;
  description?: string;
  name_en?: string;
  description_en?: string;
  name_nl?: string;
  description_nl?: string;
  group?: string;
  group_en?: string;
  group_nl?: string;
  price: string;
  size?: string;
  price2?: string;
  size2?: string;
  allergens?: AllergenCode[];
  tags?: ('vegetarian' | 'vegan' | 'spicy')[];
  recommended?: boolean;
  soldOut?: boolean;
  hidden?: boolean;
  image?: string | null;
  /** Echter 3D-Scan (GLB), z. B. aus Polycam – ersetzt das automatisch erzeugte Teller-Modell */
  model3d?: string | null;
  /** Optional: USDZ für iPhone (sonst wird es automatisch aus dem GLB erzeugt) */
  model3dIos?: string | null;
}

export interface Category {
  slug: string;
  name: string;
  name_en?: string;
  name_nl?: string;
  order?: number;
  hidden?: boolean;
  kind?: 'food' | 'drinks';
  image?: string | null;
  note?: string;
  note_en?: string;
  note_nl?: string;
  dishes: Dish[];
}

export type Site = typeof site;
export { site };

/* ------------------------------------------------------------- Bilder */

// Alle Bilder unter src/assets/images werden beim Build von Astro optimiert (AVIF/WebP, passende Größen).
const IMAGES = import.meta.glob<ImageMetadata>('/src/assets/images/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  import: 'default',
});

export function resolveImage(path?: string | null): ImageMetadata | undefined {
  if (!path) return undefined;
  const key = path.startsWith('/') ? path : `/${path}`;
  return IMAGES[key];
}

/** Automatische Zuordnung: Datei „src/assets/images/dishes/<gerichtname>.jpg" wird zum Foto des Gerichts. */
const DISH_IMAGES_BY_SLUG = new Map<string, ImageMetadata>();
for (const [key, img] of Object.entries(IMAGES)) {
  const m = key.match(/^\/src\/assets\/images\/dishes\/(.+)\.\w+$/);
  if (m) DISH_IMAGES_BY_SLUG.set(slugify(m[1].split('/').pop()!), img);
}

export function dishImage(dish: Dish, categorySlug: string): ImageMetadata | undefined {
  return (
    resolveImage(dish.image) ??
    DISH_IMAGES_BY_SLUG.get(slugify(dish.name)) ??
    DISH_IMAGES_BY_SLUG.get(`${categorySlug}-${slugify(dish.name)}`)
  );
}

/* --------------------------------------------------------- Speisekarte */

const MENU_FILES = import.meta.glob<Omit<Category, 'slug'>>('/src/content/menu/*.json', { eager: true, import: 'default' });

export function getMenu(): Category[] {
  return Object.entries(MENU_FILES)
    .map(([file, data]) => ({ ...data, slug: file.split('/').pop()!.replace(/\.json$/, '') }))
    .filter((c) => !c.hidden)
    .map((c) => ({ ...c, dishes: (c.dishes ?? []).filter((d) => !d.hidden) }))
    .filter((c) => c.dishes.length > 0)
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name, 'de'));
}

/* ------------------------------------------------------------- Helfer */

/** Liefert das Feld in der gewünschten Sprache; Fallback Niederländisch → Englisch → Deutsch. */
export function loc<T extends object>(obj: T, field: string, lang: Lang): string {
  const o = obj as Record<string, unknown>;
  const chain = lang === 'de' ? [field] : lang === 'en' ? [`${field}_en`, field] : [`${field}_nl`, `${field}_en`, field];
  for (const k of chain) {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "13,50" | "13.5" → 13.5 */
export function parsePrice(p?: string): number | undefined {
  if (!p) return undefined;
  const n = Number(String(p).replace(/[^\d,.-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

export function formatPrice(p: string | undefined, lang: Lang): string {
  const n = parsePrice(p);
  if (n === undefined) return p ?? '';
  return new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : lang === 'en' ? 'en-GB' : 'de-AT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function fullAddress() {
  return `${site.street}, ${site.zip} ${site.city}`;
}

export function mapsUrl() {
  return site.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${site.name}, ${fullAddress()}`)}`;
}

export function whatsappHref(text = '') {
  return `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export const DAY_ORDER = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'] as const;
export const SCHEMA_DAYS: Record<string, string> = {
  mo: 'Monday', tu: 'Tuesday', we: 'Wednesday', th: 'Thursday', fr: 'Friday', sa: 'Saturday', su: 'Sunday',
};

export function hoursByDay() {
  return DAY_ORDER.map((day) => ({
    day,
    slots: site.openingHours.filter((h) => h.day === day).map((h) => ({ open: h.open, close: h.close })),
  }));
}
