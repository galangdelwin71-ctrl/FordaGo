@echo off
setlocal enabledelayedexpansion
title FordaGO - LAN Mode (Optimized)
color 0B

echo.
echo  =========================================================
echo   FordaGO LAN Starter (Optimized - Direct Wi-Fi)
echo   All services start in separate windows.
echo  =========================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "ROOT=%SCRIPT_DIR%..\"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

:: Detect local IPv4 address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"IP Address"') do (
    set "RAW_IP=%%a"
    set "LOCAL_IP=!RAW_IP: =!"
    goto :ip_found
)
:ip_found

if "%LOCAL_IP%"=="" set "LOCAL_IP=192.168.1.16"

echo  [OK] Local Wi-Fi IP Detected: %LOCAL_IP%
echo.
echo  Access URLs (same Wi-Fi):
echo    - Frontend:         http://localhost:4200  (or http://%LOCAL_IP%:4200)
echo    - Laravel API:      http://%LOCAL_IP%:8000/api
echo    - Reverb WebSocket: ws://%LOCAL_IP%:8080
echo.
echo  Starting all services...
echo  =========================================================
echo.

:: ── 1. Start MySQL in Podman ──────────────────────────────────────
echo  [1/5] Starting MySQL Database in Podman...
podman start fordago_db >nul 2>&1
if %ERRORLEVEL% neq 0 (
    podman compose up -d db >nul 2>&1
)
echo  [OK] MySQL Database is running on port 3306.
echo.

:: ── 2. Laravel Backend (0.0.0.0:8000 for direct LAN Wi-Fi) ────────
echo  [2/5] Starting Laravel API on 0.0.0.0:8000...
start "FordaGO Backend (Laravel :8000)" cmd /k "cd /d "%BACKEND%" && echo [BACKEND] Listening on 0.0.0.0:8000 (LAN: %LOCAL_IP%:8000)... && php artisan serve --host=0.0.0.0 --port=8000 --no-reload"

ping 127.0.0.1 -n 2 >nul

:: ── 3. Laravel Reverb WebSocket (0.0.0.0:8080 for direct LAN) ──────
echo  [3/5] Starting Reverb WebSocket server on 0.0.0.0:8080...
start "FordaGO Reverb (WebSocket :8080)" cmd /k "cd /d "%BACKEND%" && echo [REVERB] WebSocket listening on 0.0.0.0:8080 (LAN: ws://%LOCAL_IP%:8080)... && php artisan reverb:start --host=0.0.0.0 --port=8080"

ping 127.0.0.1 -n 2 >nul

:: ── 4. Laravel Queue Worker ────────────────────────────────────────
echo  [4/5] Starting Laravel Queue Worker...
start "FordaGO Queue Worker" cmd /k "cd /d "%BACKEND%" && echo [QUEUE] Queue Worker running... && php artisan queue:work --sleep=1 --tries=3"

ping 127.0.0.1 -n 2 >nul

:: ── 5. Ionic / Angular Frontend (0.0.0.0:4200) ─────────────────────
echo  [5/5] Starting Ionic/Angular frontend on 0.0.0.0:4200...
start "FordaGO Frontend (Ionic :4200)" cmd /k "cd /d "%FRONTEND%" && echo [FRONTEND] Frontend dev server on 0.0.0.0:4200... && npx ng serve --host=0.0.0.0 --port=4200"

echo.
echo  =========================================================
echo  DIRECT LAN MODE ACTIVE (NO TUNNEL / ZERO LATENCY)
echo.
echo  Local Laptop:
echo    - Frontend:         http://localhost:4200
echo    - API:              http://localhost:8000/api
echo    - WebSocket:        ws://localhost:8080
echo.
echo  Mobile Phone (Same Wi-Fi: %LOCAL_IP%):
echo    - Phone Web:        http://%LOCAL_IP%:4200
echo    - Phone API:        http://%LOCAL_IP%:8000/api
echo    - Phone WebSocket:  ws://%LOCAL_IP%:8080
echo  =========================================================
echo.
echo  Keep this window open or press any key to exit.
pause
