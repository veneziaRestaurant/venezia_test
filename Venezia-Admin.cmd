@echo off
rem ============================================================================
rem  Venezia Admin - Doppelklick genuegt.
rem  - prueft Node.js und Git (installiert sie bei Bedarf automatisch per winget)
rem  - holt die neueste Speisekarte von GitHub (andere PCs koennen auch pflegen)
rem  - installiert fehlende Pakete, startet die Admin-Seite und oeffnet den Browser
rem  - legt beim ersten Start ein Symbol "Venezia Admin" auf dem Desktop an
rem ============================================================================
setlocal EnableExtensions
chcp 65001 >nul
title Venezia Admin
cd /d "%~dp0"
set "URL=http://localhost:4321/keystatic"

echo.
echo   =============================================
echo     VENEZIA  ^|  Admin
echo   =============================================
echo.

rem --- Laeuft die Admin-Seite schon? Dann nur Browser oeffnen.
curl -s -o nul -m 2 "%URL%" && (
  echo   Admin laeuft bereits - Browser wird geoeffnet.
  start "" "%URL%"
  "%SystemRoot%\System32\timeout.exe" /t 3 /nobreak >nul
  exit /b 0
)

rem --- Node.js und Git pruefen, notfalls installieren
call :need node OpenJS.NodeJS.LTS "Node.js" || goto :fail
call :need git Git.Git "Git" || goto :fail

rem --- Desktop-Symbol anlegen bzw. aktualisieren (auch bei OneDrive-Desktop)
call :shortcut

rem --- Git braucht einen Namen fuer Aenderungen (nur auf neuen PCs noetig)
git config user.name >nul 2>nul || git config user.name "Venezia Admin (%COMPUTERNAME%)"
git config user.email >nul 2>nul || git config user.email "admin@venezia.local"

rem --- Neueste Inhalte holen (Fehler hier sind nicht schlimm, z. B. offline)
echo   [1/3] Neueste Speisekarte von GitHub holen ...
git pull --rebase --autostash -q 2>nul || echo         (uebersprungen - offline oder lokale Aenderungen)

rem --- Pakete installieren, wenn noetig (erster Start oder neue Version)
set "NEEDINSTALL="
if not exist "node_modules\.package-lock.json" set NEEDINSTALL=1
if exist "node_modules\.package-lock.json" (
  for /f %%A in ('powershell -NoProfile -Command "[int]((Get-Item package-lock.json).LastWriteTime -gt (Get-Item node_modules\.package-lock.json).LastWriteTime)"') do if "%%A"=="1" set NEEDINSTALL=1
)
if defined NEEDINSTALL (
  echo   [2/3] Programme einrichten - nur beim ersten Mal, ca. 1-3 Minuten ...
  call npm ci --no-audit --no-fund --loglevel=error || goto :fail
) else (
  echo   [2/3] Programme sind aktuell.
)

echo   [3/3] Admin startet - der Browser oeffnet sich gleich.
echo.
echo   ---------------------------------------------------------------
echo    WICHTIG: Dieses Fenster offen lassen, solange Sie arbeiten.
echo    Zum Beenden einfach dieses Fenster schliessen.
echo    Adresse: %URL%
echo   ---------------------------------------------------------------
echo.
call npx astro dev --port 4321 --open /keystatic
goto :eof

rem ============================================================================
:need
rem  %1 = Befehl, %2 = winget-ID, %3 = Anzeigename
where %1 >nul 2>nul && exit /b 0
echo   %~3 fehlt - wird jetzt installiert (bitte Rueckfragen mit "Ja" bestaetigen) ...
where winget >nul 2>nul || (
  echo   winget ist nicht verfuegbar. Bitte %~3 manuell installieren:
  if /i "%1"=="node" echo   https://nodejs.org  ^(LTS-Version^)
  if /i "%1"=="git"  echo   https://git-scm.com/download/win
  exit /b 1
)
winget install -e --id %2 --accept-source-agreements --accept-package-agreements --silent
rem  Neue Programme sind erst nach einem Neustart des Starters im PATH
echo.
echo   %~3 wurde installiert. Bitte dieses Fenster schliessen und
echo   "Venezia Admin" noch einmal doppelklicken.
pause
exit 1

:shortcut
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Venezia Admin.lnk');" ^
  "$s.TargetPath='%~f0'; $s.WorkingDirectory='%~dp0'; $s.IconLocation='%~dp0scripts\venezia-admin.ico';" ^
  "$s.Description='Venezia Speisekarte pflegen'; $s.WindowStyle=7; $s.Save()" >nul 2>nul
exit /b 0

:fail
echo.
echo   Es ist ein Fehler aufgetreten. Bitte ein Foto dieses Fensters an den Entwickler schicken.
pause
exit /b 1
