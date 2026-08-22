@echo off
setlocal enabledelayedexpansion
title FordaGO - Fast LAN Starter (No Tunnel, 0ms Delay)
color 0B

echo.
echo  =========================================================
echo   FordaGO Fast LAN Starter (Direct Wi-Fi / 0ms Instant Chat)
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
echo  Access URLs for PC and Phone on the same Wi-Fi:
echo    - Frontend App:     http://localhost:4200 (or http://%LOCAL_IP%:4200)
echo    - Laravel API:      http://%LOCAL_IP%:8000/api
echo    - Reverb WebSocket: ws://%LOCAL_IP%:8080 (0ms Latency)
echo.
echo  Starting all services without tunnels...
echo  =========================================================
echo.

:: ── 1. Laravel Backend (API on 0.0.0.0:8000) ───────────────────
echo  [1/3] Starting Laravel backend on 0.0.0.0:8000...
start "FordaGO Backend (Laravel :8000)" cmd /k "cd /d "%BACKEND%" && echo [BACKEND] Starting Laravel API on 0.0.0.0:8000... && php artisan serve --host=0.0.0.0 --port=8000"

ping 127.0.0.1 -n 2 >nul

:: ── 2. Laravel Reverb (WebSocket on 0.0.0.0:8080) ─────────────
echo  [2/3] Starting Reverb WebSocket server on 0.0.0.0:8080...
start "FordaGO Reverb (WebSocket :8080)" cmd /k "cd /d "%BACKEND%" && echo [REVERB] Starting WebSocket server on 0.0.0.0:8080... && php artisan reverb:start --host=0.0.0.0 --port=8080"

ping 127.0.0.1 -n 2 >nul

:: ── 3. Ionic/Angular Frontend ─────────────────────────────────
echo  [3/3] Starting Ionic/Angular frontend dev server...
start "FordaGO Frontend (Ionic :4200)" cmd /k "cd /d "%FRONTEND%" && echo [FRONTEND] Starting dev server on 0.0.0.0:4200... && npx ng serve --host=0.0.0.0 --port=4200"

echo.
echo  =========================================================
echo  All services started in Direct LAN Mode (NO TUNNEL)!
echo  Chat messages and data will now transfer INSTANTLY.
echo  =========================================================
echo.
pause
