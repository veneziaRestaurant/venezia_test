#!/bin/bash
# Venezia Admin für macOS – im Finder doppelklicken (Gegenstück zu Venezia-Admin.cmd für Windows).
cd "$(dirname "$0")" || exit 1
URL="http://localhost:4321/keystatic"
echo ""
echo "  ============================================="
echo "    VENEZIA  |  Admin"
echo "  ============================================="
echo ""
if curl -s -o /dev/null -m 2 "$URL"; then
  echo "  Admin läuft bereits – Browser wird geöffnet."; open "$URL"; exit 0
fi
for cmd in git node; do
  if ! command -v $cmd >/dev/null; then
    echo "  $cmd fehlt. Bitte installieren: https://nodejs.org (LTS) bzw. im Terminal: xcode-select --install"
    read -r -p "  Enter zum Schließen"; exit 1
  fi
done
git config user.name >/dev/null || git config user.name "Venezia Admin ($(hostname -s))"
git config user.email >/dev/null || git config user.email "admin@venezia.local"
echo "  [1/3] Neueste Speisekarte von GitHub holen …"
git pull --rebase --autostash -q 2>/dev/null || echo "        (übersprungen)"
if [ ! -f node_modules/.package-lock.json ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  echo "  [2/3] Programme einrichten – nur beim ersten Mal …"
  npm ci --no-audit --no-fund --loglevel=error || { read -r -p "  Fehler. Enter zum Schließen"; exit 1; }
else
  echo "  [2/3] Programme sind aktuell."
fi
echo "  [3/3] Admin startet – Fenster offen lassen, zum Beenden schließen."
npx astro dev --port 4321 --open /keystatic
