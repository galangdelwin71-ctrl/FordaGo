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

set "ROOT=%~dp0"
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

:: ── 0. Clear config cache before starting ─────────────────────
echo  [0/4] Clearing Laravel config cache...
cd /d "%BACKEND%"
php artisan config:clear >nul 2>&1
php artisan cache:clear >nul 2>&1
echo  [OK] Cache cleared.
echo.

:: ── 1. Laravel Backend (API on 0.0.0.0:8000) ─────────────────
echo  [1/4] Starting Laravel backend on 0.0.0.0:8000...
start "FordaGO Backend (Laravel :8000)" cmd /k "cd /d "%BACKEND%" && echo [BACKEND] Starting Laravel API... && php artisan serve --host=0.0.0.0 --port=8000 --no-reload"

ping 127.0.0.1 -n 2 >nul

:: ── 2. Laravel Reverb (WebSocket on 0.0.0.0:8080) ───────────
echo  [2/4] Starting Reverb WebSocket server on 0.0.0.0:8080...
start "FordaGO Reverb (WebSocket :8080)" cmd /k "cd /d "%BACKEND%" && echo [REVERB] Starting WebSocket server... && php artisan reverb:start --host=0.0.0.0 --port=8080"

ping 127.0.0.1 -n 2 >nul

:: ── 3. Laravel Queue Worker ───────────────────────────────────
echo  [3/4] Starting Laravel Queue Worker...
start "FordaGO Queue Worker" cmd /k "cd /d "%BACKEND%" && echo [QUEUE] Starting Queue Worker (broadcast via sync - mail/SMS jobs only)... && php artisan queue:work --sleep=1 --tries=3 --max-time=3600"

ping 127.0.0.1 -n 2 >nul

:: ── 4. Ionic/Angular Frontend ─────────────────────────────────
echo  [4/4] Starting Ionic/Angular frontend dev server...
start "FordaGO Frontend (Ionic :4200)" cmd /k "cd /d "%FRONTEND%" && echo [FRONTEND] Starting dev server on 0.0.0.0:4200... && npx ng serve --host=0.0.0.0 --port=4200"

echo.
echo  =========================================================
echo  All services started in LAN Mode!
echo.
echo  Frontend:  http://localhost:4200
echo  API:       http://%LOCAL_IP%:8000
echo  WebSocket: ws://%LOCAL_IP%:8080
echo  =========================================================
echo.
pause
