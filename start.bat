@echo off
setlocal
chcp 65001 >nul
title Atlas Admin - Avvio server
cd /d "%~dp0"
echo.
echo  =============================================
echo        ATLAS ADMIN - AVVIO WORKSPACE
echo  =============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo [ERRORE] Node.js non e' installato o non e' nel PATH.
  echo Installa Node.js LTS da https://nodejs.org/ e poi riapri questo file.
  echo.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRORE] npm non e' disponibile. Reinstalla Node.js LTS includendo npm.
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo Node.js %%v rilevato.
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo [INFO] Creato il file .env dalle impostazioni di esempio.
  echo [INFO] Per uso online modifica subito le credenziali e SESSION_SECRET nel file .env.
)
if not exist "node_modules\express" (
  echo.
  echo [INFO] Installazione delle dipendenze necessarie al primo avvio...
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERRORE] Installazione non riuscita. Controlla la connessione e riprova.
    pause
    exit /b 1
  )
)
echo.
echo Il browser verra' aperto su http://127.0.0.1:3000
echo Per fermare il server premi CTRL+C in questa finestra.
start "Atlas Admin browser" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:3000"
echo.
call npm start
if errorlevel 1 (
  echo.
  echo [ERRORE] Il server si e' arrestato con un errore. Controlla il messaggio qui sopra.
)
echo.
echo Atlas Admin e' stato fermato.
pause
endlocal
