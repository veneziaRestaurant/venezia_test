@echo off
rem ============================================================================
rem  Venezia Admin - Einrichtung auf einem NEUEN PC (einmalig).
rem  Diese eine Datei herunterladen und doppelklicken. Sie:
rem   1. installiert Git und Node.js (falls noetig, per winget)
rem   2. laedt das Projekt nach  %USERPROFILE%\Venezia-Admin-Test
rem   3. legt das Desktop-Symbol "Venezia Admin" an und startet die Admin-Seite
rem  Download: https://github.com/veneziaRestaurant/venezia_test/raw/main/Venezia-Admin-Einrichten.cmd
rem ============================================================================
setlocal EnableExtensions
chcp 65001 >nul
title Venezia Admin - Einrichtung
set "REPO=https://github.com/veneziaRestaurant/venezia_test.git"
set "DEST=%USERPROFILE%\Venezia-Admin-Test"

echo.
echo   =============================================
echo     VENEZIA  ^|  Admin einrichten
echo   =============================================
echo.

where winget >nul 2>nul || (
  echo   winget fehlt. Bitte im Microsoft Store "App-Installer" installieren
  echo   und diese Datei danach erneut starten.
  pause & exit /b 1
)

where git >nul 2>nul || (
  echo   Git wird installiert ...
  winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements --silent
)
where node >nul 2>nul || (
  echo   Node.js wird installiert ...
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
)

rem --- PATH neu einlesen, damit frisch installierte Programme sofort gefunden werden
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User')"`) do set "PATH=%%P"

where git >nul 2>nul || (echo   Git konnte nicht installiert werden. & pause & exit /b 1)
where node >nul 2>nul || (echo   Node.js konnte nicht installiert werden. & pause & exit /b 1)

if exist "%DEST%\.git" (
  echo   Projekt ist schon vorhanden: %DEST%
) else (
  echo   Projekt wird heruntergeladen nach %DEST% ...
  git clone -q "%REPO%" "%DEST%" || (echo   Download fehlgeschlagen. & pause & exit /b 1)
)

echo.
echo   Fertig eingerichtet. Ab jetzt immer das Desktop-Symbol "Venezia Admin" benutzen.
echo   Beim ersten Veroeffentlichen fragt GitHub einmalig nach der Anmeldung.
echo.
call "%DEST%\Venezia-Admin.cmd"
