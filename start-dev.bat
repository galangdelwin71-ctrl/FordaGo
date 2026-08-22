@echo off
setlocal enabledelayedexpansion
title FordaGO - Full Stack Starter
color 0A

echo.
echo  ██████╗  ██████╗ ██████╗ ██████╗  █████╗  ██████╗  ██████╗
echo  ██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝ ██╔═══██╗
echo  ██████╔╝██║   ██║██████╔╝██║  ██║███████║██║  ███╗██║   ██║
echo  ██╔══██╗██║   ██║██╔══██╗██║  ██║██╔══██║██║   ██║██║   ██║
echo  ██║  ██║╚██████╔╝██║  ██║██████╔╝██║  ██║╚██████╔╝╚██████╔╝
echo  ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝
echo.
echo  FordaGO Full Stack Launcher - Optimized for Beta Testing
echo  =========================================================
echo.

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

:: ── 1. Laravel Backend (API) ──────────────────────────────────────────
echo  [1/4] Starting Laravel backend on port 8000...
start "FordaGO Backend (Laravel :8000)" cmd /k "cd /d "%BACKEND%" && echo [BACKEND] Starting Laravel API... && php artisan serve --host=0.0.0.0 --port=8000"

timeout /t 2 /nobreak >nul

:: ── 2. Laravel Reverb (WebSocket) ────────────────────────────────────
echo  [2/4] Starting Reverb WebSocket server on port 8080...
start "FordaGO Reverb (WebSocket :8080)" cmd /k "cd /d "%BACKEND%" && echo [REVERB] Starting WebSocket server... && php artisan reverb:start --host=0.0.0.0 --port=8080"

timeout /t 3 /nobreak >nul

:: ── 3. Cloudflare Tunnels (HTTP/2 - fast mode) ───────────────────────
echo  [3/4] Starting Cloudflare tunnels (HTTP/2 mode)...
echo.
echo  ┌─────────────────────────────────────────────────────────────┐
echo  │  IMPORTANT - After tunnels start:                           │
echo  │                                                             │
echo  │  1. Copy the API tunnel URL    (port 8000 window)          │
echo  │  2. Copy the Reverb tunnel URL (port 8080 window)          │
echo  │  3. Paste both into:                                        │
echo  │     frontend\src\app\config\api.config.ts                  │
echo  │                                                             │
echo  │     API_BASE_URL    = https://xxxx.trycloudflare.com       │
echo  │     REVERB_TUNNEL_URL = https://yyyy.trycloudflare.com     │
echo  │                                                             │
echo  │  4. Then the frontend (step 4) will hot-reload itself.     │
echo  └─────────────────────────────────────────────────────────────┘
echo.

start "FordaGO API Tunnel (port 8000)" cmd /k "echo [API TUNNEL] Waiting for tunnel URL... && cloudflared tunnel --url http://localhost:8000 --protocol http2 --edge-ip-version 4 --retries 5 --no-autoupdate"

timeout /t 2 /nobreak >nul

start "FordaGO Reverb Tunnel (port 8080)" cmd /k "echo [REVERB TUNNEL] Waiting for tunnel URL... && cloudflared tunnel --url http://localhost:8080 --protocol http2 --edge-ip-version 4 --retries 5 --no-autoupdate"

timeout /t 2 /nobreak >nul

:: ── 4. Ionic/Angular Frontend ─────────────────────────────────────────
echo  [4/4] Starting Ionic frontend dev server...
start "FordaGO Frontend (Ionic)" cmd /k "cd /d "%FRONTEND%" && echo [FRONTEND] Starting dev server... && npx ionic serve --port=4200"

echo.
echo  =========================================================
echo  All services are starting in their own windows!
echo.
echo  Windows opened:
echo    - FordaGO Backend (Laravel :8000)
echo    - FordaGO Reverb  (WebSocket :8080)
echo    - FordaGO API Tunnel (port 8000)
echo    - FordaGO Reverb Tunnel (port 8080)
echo    - FordaGO Frontend (Ionic)
echo.
echo  App will be at: http://localhost:4200
echo  =========================================================
echo.
pause
