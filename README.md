# Venezia – Webseite & digitale Speisekarte

Statische, sehr schnelle Webseite (gehostet auf **GitHub Pages**) mit Speisekarte (DE/EN/NL), Suche, Filtern, Allergenen und
Tischreservierung per WhatsApp. Gepflegt wird über eine Admin-Oberfläche **ohne Code** (Bedienoberfläche auf Arabisch) mit Button **„Veröffentlichen“** (🚀) zum sofortigen Online-Stellen.

---

## Pflege in 5 Zeilen

> **Admin öffnen: Desktop-Symbol „Venezia Admin“ doppelklicken.** Der Browser öffnet sich von selbst.
> Das kleine schwarze Fenster offen lassen, solange gearbeitet wird; zum Beenden einfach schließen.

### Admin auf einem neuen PC einrichten (einmalig)
1. Datei herunterladen: https://github.com/veneziaRestaurant/venezia/raw/main/Venezia-Admin-Einrichten.cmd
2. Doppelklicken. Falls Windows warnt („Der Computer wurde durch Windows geschützt“): **Weitere Informationen → Trotzdem ausführen**.
3. Git und Node.js werden automatisch installiert (Rückfragen mit **Ja** bestätigen), das Projekt landet in `C:\Users\<Name>\Venezia-Admin`.
4. Danach liegt das Symbol **„Venezia Admin“** auf dem Desktop. Beim ersten Veröffentlichen fragt GitHub einmal nach der Anmeldung.
5. Mac: Projekt-Ordner öffnen und `Venezia-Admin.command` doppelklicken (Node.js von nodejs.org vorher installieren).

Der Starter holt bei jedem Start automatisch die neueste Speisekarte (mehrere PCs können abwechselnd pflegen)
und richtet fehlende Programme selbst ein. Für Entwickler geht weiterhin `npm run admin`.

### Neues Gericht
1. `npm run admin` → **Kategorien & Gerichte** → Kategorie anklicken.
2. Unten bei „Gerichte / Getränke" auf **Add**.
3. Name, Beschreibung, **Foto**, Preis (z. B. `13,50`), Menge, Allergene ankreuzen.
4. Mit ⠿ an die gewünschte Stelle ziehen → **Done** → **Speichern**.
5. Kontrolle unter `localhost:4321`, dann Button **🚀 Veröffentlichen** (siehe unten).

### Neue Kategorie
1. **Kategorien & Gerichte** → **Add** (oben).
2. Name (DE/EN/NL) und **Reihenfolge** eintragen (10, 20, 30 … – kleinere Zahl = weiter oben).
3. Art wählen: Speisen oder Getränke. Optional Kategoriebild = Ersatzfoto für Einträge ohne eigenes Foto.
4. Gerichte hinzufügen wie oben → **Speichern** → **Veröffentlichen**.
5. Ausblenden statt löschen: Häkchen **Kategorie ausblenden**.

### Bild austauschen
1. Gericht öffnen → **Foto des Gerichts** → **Choose file** → beliebiges Handy-Foto wählen (erscheint neben dem Gericht, halbe Kartenbreite).
2. **Done** → **Speichern** → **Veröffentlichen**. Größe egal: wird automatisch verkleinert (AVIF/WebP). Ohne Foto: Kategoriebild bzw. Platzhalter.
3. Ohne Admin: Datei mit Gerichtsnamen in `src/assets/images/dishes/` legen, z. B. `prosciutto.jpg`, `penne-al-tonno.jpg`.
4. Kategoriebild, Logo, Startbild, Galerie: gleiches Prinzip unter **Restaurant-Daten** bzw. Kategorie.
5. Ausverkauft / Empfehlung: Häkchen ⛔ / ⭐ beim Gericht setzen → **Speichern** → **Veröffentlichen**.

### Preis ändern
1. **Kategorien & Gerichte** → Kategorie → Gericht anklicken.
2. Feld **Preis in Euro** ändern (Komma oder Punkt, z. B. `14,90`). Zweite Größe: „2. Preis".
3. **Done** → **Speichern** → **Veröffentlichen**.
4. Alternativ direkt in `src/content/menu/<kategorie>.json` den Wert bei `"price"` ändern.
5. `npm run check` meldet Tippfehler (falscher Preis, unbekanntes Allergen, fehlendes Bild).

### Seite veröffentlichen
1. Im Admin auf **Speichern** klicken (blauer Button oben).
2. Unten links im Kasten **🚀 Veröffentlichen** klicken (macht automatisch `git commit` + `git push`, nur Inhalte und Bilder).
3. Der Kasten zeigt ⏳ (Seite wird gebaut) und nach 1–3 Minuten ✅ – dann ist alles online.
4. Live unter **https://veneziarestaurant.github.io/venezia/** (ohne Admin: `git add -A`, `git commit`, `git push`).
5. Bei ❌ zeigt GitHub → **Actions** eine deutsche Meldung der Inhaltsprüfung (z. B. falscher Preis).

**Restaurantdaten** (Adresse, Telefon, **WhatsApp-Nummer**, Öffnungszeiten, Farben, Impressum):
Admin → **Restaurant-Daten**, oder direkt `src/content/site.json`. Die WhatsApp-Nummer steht
**nur dort** (`"whatsapp": "436641234567"`: Ländervorwahl, ohne `+`, ohne Leerzeichen).

---

## Analyse: Referenz & PDF

**Referenz (qr.secret-it.eu/marrusch).** Stärken: drei Schnellaktionen (Anrufen, Route, Reservieren), Kategorie-Tabs mit Anzahl,
klare Preis-/Mengenangaben, Allergen-Legende A–R. Schwächen: keine Fotos, nur Deutsch, keine Suche und keine Filter,
keine Öffnungszeiten, Allergene nur am Seitenende auflösbar, wenig Atmosphäre.

**PDF.** Stärken: schöne Fotos, zweisprachig, Allergene vollständig vorhanden. Schwächen: Allergene als Zahlen statt der Buchstaben
aus der eigenen Legende, Tippfehler, falsch kopierte Übersetzungen, versteckte alte Preise, Doppelungen.
Details und alle offenen Fragen stehen in **[docs/PDF-PRUEFUNG.md](docs/PDF-PRUEFUNG.md)**.

**Was diese Seite besser macht:** Fotos und Kategorie-Bilder, Volltextsuche (findet auch „mushroom"),
Filter (vegetarisch, scharf, Empfehlungen, *ohne* bestimmte Allergene), Allergene direkt am Gericht
antippbar, „Jetzt geöffnet"-Anzeige, Reservierungsformular mit Ruhetag-Erkennung, DE/EN/NL,
Hell/Dunkel-Modus, druckbarer QR-Code, Schema.org-Speisekarte für Google.

## Entscheidung: Keystatic (Git-basiert) statt Decap oder Supabase

Keystatic speichert alles als JSON-Dateien und Bilder direkt im Projekt. Dadurch bleibt die Seite rein statisch
(schnell, kostenlos hostbar, kein Server und keine Datenbank, die gewartet oder abgesichert werden müssten),
und jede Änderung ist über Git versioniert und rückgängig machbar. Gegenüber Decap CMS hat es eine modernere,
typsichere Oberfläche mit Drag-&-Drop-Sortierung und Bild-Upload ohne Netlify-Identity-Abhängigkeit. Supabase
wäre nur nötig, wenn mehrere Personen ohne PC (z. B. per Handy) gleichzeitig pflegen sollen; das kostet
Komplexität und Performance ohne Mehrwert für eine Speisekarte.

*Ausbaustufe:* Keystatic kann später auf `storage: { kind: 'github' }` umgestellt werden, dann ist
die Pflege auch online über `/keystatic` möglich (erfordert Server-Adapter + GitHub-App).

## Stack & Bibliotheken

| Bibliothek | Warum |
|---|---|
| **Astro 5** (`astro`) | Erzeugt reines HTML ohne JS-Ballast → Lighthouse > 90 auf dem Handy; läuft mit Node 20. |
| **Tailwind CSS 4** (`tailwindcss`, `@tailwindcss/vite`) | Utility-Klassen für Layout; Design-Tokens zentral in `src/styles/global.css`. |
| **Keystatic** (`@keystatic/core`, `@keystatic/astro`) | Admin-Oberfläche für Speisekarte & Restaurantdaten, speichert als JSON im Repo. |
| **React** (`react`, `react-dom`, `@astrojs/react`) | Nur für die Admin-Oberfläche (lokal); auf der öffentlichen Seite wird kein React geladen. |
| **sharp** | Automatische Bildoptimierung (AVIF/WebP, mehrere Größen, Lazy Loading). |
| **@astrojs/sitemap** | Sitemap inkl. Sprachvarianten für Google. |
| **qrcode** | Erzeugt beim Build den druckbaren QR-Code (`/qr/`). |
| **@fontsource-variable/…** | Schriften lokal eingebunden (DSGVO, keine Google-Fonts-Verbindung). |

*Bewusst nicht verwendet:* **Framer Motion**. Es bräuchte React im Browser (ca. 50 KB+). Die sanften
Animationen (Einblenden, rotierender Teller, Dialog) sind mit CSS und einem 3-KB-Skript umgesetzt.

## Design

- **Schrift:** *Cormorant Garamond* (elegante italienische Antiqua für Überschriften und Gerichtsnamen) +
  *Inter* (sehr gut lesbar auf kleinen Displays, Preise mit gleich breiten Ziffern).
- **Farben** aus dem Logo abgeleitet: Espresso `#2b1a12` (Wärme, Holzofen), Gold `#c49a52` (Logo-Akzent,
  Buttons), Terrakotta `#a8432a` (Tomate/Ziegel, für „scharf" und Hinweise), Creme `#f7f1e7` als Papiergrund.
  Änderbar in `site.json` (`colorBrand`, `colorAccent`, `colorHighlight`).
- Mobile-first, Hell/Dunkel-Umschalter (folgt sonst der Handy-Einstellung), feste „Tisch reservieren"-Leiste unten auf dem Handy.

## Projektstruktur

```
src/content/site.json          ← Restaurantdaten (EINZIGE Stelle für WhatsApp-Nummer)
src/content/menu/*.json        ← je Kategorie eine Datei mit allen Gerichten
src/assets/images/…            ← Bilder (werden automatisch optimiert)
src/components/                ← Bausteine der Seite (Hero, Menu, DishItem, …)
src/i18n/ui.ts                 ← Texte der Oberfläche in DE/EN/NL
src/pages/                     ← /, /en/, /nl/, /impressum/, /datenschutz/, /qr/
scripts/validate-content.mjs   ← Inhaltsprüfung vor jedem Build
Venezia-Admin.cmd              ← Doppelklick-Starter für den Admin (Windows; .command = Mac)
Venezia-Admin-Einrichten.cmd   ← Einrichtung auf einem neuen PC (Git/Node installieren, Projekt laden)
keystatic.config.ts            ← Felder der Admin-Oberfläche (Arabisch)
src/admin/PublishButton.tsx    ← Button „Veröffentlichen“ im Admin
scripts/publish-plugin.mjs     ← lokaler Endpunkt dafür (git commit + push, Build-Status)
```

## Befehle

| Befehl | Wirkung |
|---|---|
| `npm install` | Einmalig: Abhängigkeiten installieren |
| `npm run admin` | Pflege-Oberfläche + Vorschau starten |
| `npm run dev` | Nur Vorschau unter `localhost:4321` |
| `npm run check` | Inhalte prüfen (Preise, Allergene, Bilder, WhatsApp-Nummer) |
| `npm run build` | Fertige Seite nach `dist/` bauen |
| `npm run preview` | Gebaute Seite lokal ansehen |

Empfohlen: **Node 22 LTS** (`.nvmrc`). Node 20.11 funktioniert, zeigt aber Hinweise „EBADENGINE".

## Hosting: GitHub Pages (einmalig einrichten)

Die Seite wird bei jedem Push auf `main` durch `.github/workflows/deploy.yml` gebaut und veröffentlicht.

1. Auf GitHub ein Repo **`venezia`** anlegen (öffentlich).
2. Im Projektordner:
   ```bash
   git init -b main
   git add -A && git commit -m "Venezia Webseite"
   git remote add origin https://github.com/veneziaRestaurant/venezia.git
   git push -u origin main
   ```
3. Im Repo: **Settings → Pages → Build and deployment → Source: „GitHub Actions“** auswählen.
4. Unter **Actions** den Lauf abwarten (grüner Haken). Danach ist die Seite unter
   `https://veneziarestaurant.github.io/venezia/` erreichbar.

**Unterpfad und Domain** ergeben sich automatisch aus `"url"` in `src/content/site.json`:
- anderer Repo-Name → `"url": "https://veneziarestaurant.github.io/<repo-name>/"`
- später eigene Domain → `"url": "https://www.venezia-pizzeria.at/"` und in GitHub unter Settings → Pages → *Custom domain* eintragen.

Alle internen Links laufen über `withBase()` (`src/lib/paths.ts`), funktionieren also unter jedem Unterpfad.
Lokal (`npm run dev`/`admin`) läuft die Seite ohne Unterpfad unter `localhost:4321/`, `npm run preview`
zeigt sie wie auf GitHub unter `localhost:4321/venezia/`.

> Hinweis: Den QR-Code (`/qr/`) erst drucken, wenn die endgültige Adresse feststeht. Er zeigt auf `"url"`.

## Recht & Datenschutz

- Keine Cookies, kein Tracking → **kein Cookie-Banner nötig**. Das Hell/Dunkel-Design wird nur im Browser gespeichert.
- Schriften lokal; **Google Maps wird erst nach Klick** auf „Karte laden" eingebettet.
- Reservierung: Die Seite speichert nichts; WhatsApp öffnet sich erst auf Klick des Gastes.
- `Impressum` und `Datenschutz` sind ausfüllbare Vorlagen (gelb markierte Stellen; Daten aus `site.json` → `legal…`).
  Keine Rechtsberatung, im Zweifel bei der WKO prüfen lassen.
- **Bildrechte:** Die Fotos stammen aus dem PDF. Bitte klären, ob die Nutzungsrechte auch fürs Web gelten
  (oft Stockfotos des Druckdienstleisters), und Bildnachweis im Impressum eintragen.

## Qualitätsprüfung (Stand der Auslieferung)

- Lighthouse mobil (simuliertes 4G): **DE 93 · EN 92 · (AR, jetzt NL) 91** Performance (auch unter `/venezia/` gemessen: 93), jeweils **100** Barrierefreiheit, Best Practices, SEO.
- WhatsApp-Link getestet: `https://wa.me/<nummer>?text=…` mit Name, Personen, Datum (mit Wochentag), Uhrzeit, Anmerkung;
  Sonderzeichen korrekt kodiert; Ruhetage sperren das Formular; Uhrzeiten richten sich nach den Öffnungszeiten.
- Pflege-Test im Admin: Preis geändert, Foto hochgeladen, gespeichert → sofort auf der Seite sichtbar.

## TEST: AR-Ansicht „Auf dem Tisch ansehen“
- Jedes Gericht mit Foto bekommt beim Build automatisch einen 3D-Teller (`npm run ar`, Ausgabe `public/ar/`).
- Auf dem Handy: Würfel-Button am Foto → „Auf den Tisch stellen“ → Kamera, Teller in Originalgröße.
- Echter 3D-Scan: in Polycam scannen → Export GLB → in der Admin-Oberfläche beim Gericht unter „AR – GLB“ hochladen.
- Getränke bekommen nur mit eigenem Scan einen AR-Button.
