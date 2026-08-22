@echo off
echo ================================================================
echo  FordaGO Tunnel Starter - HTTP/2 Mode (Faster, More Stable)
echo ================================================================
echo.
echo Starting API tunnel (Laravel port 8000) with HTTP/2...
echo Starting Reverb tunnel (WebSocket port 8080) with HTTP/2...
echo.
echo IMPORTANT: After both tunnels start, copy their URLs into:
echo   frontend\src\app\config\api.config.ts
echo.
echo   API_BASE_URL    = the *.trycloudflare.com URL for port 8000
echo   REVERB_TUNNEL_URL = the *.trycloudflare.com URL for port 8080
echo.
echo Press Ctrl+C to stop both tunnels.
echo ================================================================
echo.

:: Start Reverb (WebSocket) tunnel in a new window
start "FordaGO Reverb Tunnel (port 8080)" cmd /k "echo [Reverb WebSocket Tunnel] && cloudflared tunnel --url http://localhost:8080 --protocol http2 --no-autoupdate"

:: Small delay so both don't fight for stdout
timeout /t 2 /nobreak >nul

:: Start API tunnel in this window
echo [API Tunnel - port 8000]
cloudflared tunnel --url http://localhost:8000 --protocol http2 --no-autoupdate
