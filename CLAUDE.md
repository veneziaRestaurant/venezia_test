Du bist ein erfahrener Webdesigner und Fullstack-Entwickler. Baue eine
moderne, hochwertige Webseite mit digitaler Speisekarte für das
Restaurant "Venezia". Sie soll optisch und funktional besser sein als
die Referenzseite und besser als jede Konkurrenz.

AUSGANGSLAGE
- Bisher gibt es eine PDF-Speisekarte (angehängt: Venezia.pdf). Lies sie
  vollständig aus und übernimm alle Kategorien, Gerichte, Beschreibungen,
  Preise und Allergenangaben in die neue Datenstruktur. Prüfe die
  Übernahme auf Tippfehler und Preisabweichungen.
- Preise und Fotos ändern sich ständig, deshalb ersetzt die Webseite das PDF.
- Referenz: https://qr.secret-it.eu/marrusch (Stil und Aufbau als
  Inspiration, NICHT kopieren: eigenes Design, keine fremden Logos,
  Bilder oder Texte).
- Ich bin Softwareentwickler (Java), aber kein Frontend-Profi.

WAS ICH AN DER REFERENZ ÜBERNEHMEN UND VERBESSERN SOLL
- Kopfbereich: Logo, Name, Adresse und drei Aktionsbuttons
  (Anrufen, Route per Google Maps, Tisch reservieren)
- Sticky Kategorie-Navigation (horizontal scrollbar), die beim Scrollen
  die aktive Kategorie hervorhebt
- Gerichte mit Name, Beschreibung, Preis, Allergen-Kürzeln, Portions- oder
  Mengenangabe (z. B. "0,5 l", "150 g")
- Allergen-Legende am Ende (Buchstaben A bis R nach EU-Standard)
- Sprachumschalter (DE, EN, optional weitere) mit Rechts-nach-links-
  Unterstützung, falls eine arabische Sprache gewünscht ist
- Link "Auf Google bewerten"
- Schwächen der Referenz verbessern: keine Fotos bei den Gerichten, rein
  textlastige Listen, kein Suchfeld, keine Filter, wenig Atmosphäre

HAUPTFEATURE: TISCHRESERVIERUNG PER WHATSAPP
- Keine E-Mail-Reservierung, kein Backend-Formular.
- Button "Tisch reservieren" im Header, im Hero-Bereich und als fester
  Button am unteren Bildschirmrand auf dem Handy.
- Klick öffnet WhatsApp mit der Nummer des Restaurants und vorausgefüllter
  Nachricht. Kleines Formular (Name, Personenzahl, Datum, Uhrzeit) baut
  daraus einen wa.me-Link mit URL-kodiertem Text.
- Die WhatsApp-Nummer steht nur an EINER Stelle in der Konfiguration
  (site.json), im Format 491701234567 (ohne + und Leerzeichen).

HAUPTZIEL: EINFACHE PFLEGE DURCH MICH
Ohne Code-Änderung muss ich Folgendes können:
- Kategorien hinzufügen, umbenennen, sortieren, ausblenden
- Gerichte mit Name, Beschreibung, Preis, Allergenen, Foto und
  Mengenangabe anlegen, ändern, löschen
- Einzelne Gerichte als "ausverkauft" oder "Empfehlung" markieren
- Bilder einfach hochladen oder in einen Ordner legen (automatisch
  skaliert und optimiert)
- Öffnungszeiten, Adresse, Telefon, WhatsApp-Nummer ändern
Prüfe, ob ein Git-basiertes CMS (Decap CMS oder Keystatic) oder
Supabase mit einfacher Admin-Oberfläche besser passt, und begründe die
Wahl in drei Sätzen. Alternativ: eine einzige menu.json plus Bilderordner.

DESIGN
- Mobile-first, denn Gäste scannen meist einen QR-Code mit dem Handy
- Großes Hero-Foto, appetitliche Gerichtefotos, sanfte Animationen
- Hochwertige, zum italienischen Restaurant passende Typografie und
  Farbpalette (Vorschlag mit Begründung, anpassbar über Konfiguration)
- Helles und dunkles Design optional
- Bereiche: Start, Speisekarte, Galerie, Über uns, Öffnungszeiten,
  Anfahrt, Kontakt/Reservierung, Impressum, Datenschutz
- Zusätzlich: Suchfeld und Filter (vegetarisch, vegan, ohne bestimmte
  Allergene), QR-Code zur Seite zum Ausdrucken

TECHNIK
- Empfehlung: Next.js oder Astro (statisch), Tailwind CSS, Framer Motion;
  Bildoptimierung mit WebP/AVIF und Lazy Loading
- Sehr gute Lighthouse-Werte (Performance, SEO, Barrierefreiheit)
- SEO: Meta-Tags, Open Graph, Schema.org (Restaurant, Menu)
- Günstiges Hosting (Vercel, Netlify oder Cloudflare Pages)
- Nenne alle verwendeten Bibliotheken und Plugins mit je einer Zeile
  Begründung

RECHT
- DSGVO-konform (Schriften lokal einbinden, Karten erst nach
  Einwilligung laden, Cookie-Hinweis nur falls nötig)
- Impressum und Datenschutz als ausfüllbare Vorlage
- Allergen- und Zusatzstoffkennzeichnung wie im PDF

AKZEPTANZKRITERIEN
1. Alle Inhalte des PDFs sind vollständig und korrekt übernommen.
2. "Tisch reservieren" öffnet auf Handy und Desktop WhatsApp mit der
   richtigen Nummer und Vorlagentext.
3. Die Nummer lässt sich an genau einer Stelle ändern.
4. Neue Kategorie, neues Gericht, neuer Preis und neues Bild gelingen
   ohne Code-Änderung.
5. Neue Bilder werden automatisch optimiert.
6. Die Seite läuft auf dem Handy flüssig, Lighthouse über 90.
7. Die README erklärt jeden Pflegeschritt in höchstens 5 Zeilen
   ("Neues Gericht", "Neue Kategorie", "Bild austauschen", "Preis ändern",
   "Seite veröffentlichen").

ABLAUF
1. Analysiere die Referenzseite und das PDF, fasse Stärken und
   Schwächen kurz zusammen.
2. Schlage Stack und Struktur vor, kurz begründet.
3. Baue das komplette Projekt mit den echten Daten aus dem PDF.
4. Prüfe das Ergebnis selbst (Handy-Ansicht, WhatsApp-Link, Pflege-Test).
5. Frage nur nach, wenn etwas Wesentliches fehlt (Logo, Farben, Fotos,
   WhatsApp-Nummer, Öffnungszeiten).