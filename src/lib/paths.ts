/**
 * Die Seite läuft auf GitHub Pages unter einem Unterpfad (z. B. /venezia/).
 * Der Unterpfad wird automatisch aus "url" in site.json gelesen (siehe astro.config.mjs).
 * Interne Links IMMER über withBase() bauen, damit sie überall funktionieren.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** "/impressum/" → "/venezia/impressum/" */
export function withBase(path = '/'): string {
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Vollständige URL inkl. Domain, z. B. für Canonical, Open Graph, QR-Code */
export function absUrl(path: string, site: URL | string): string {
  return new URL(withBase(path), site).href;
}
