param()
# FordaGO Auto-Launcher - auto-detects tunnel URLs and updates api.config.ts

$SCRIPT_DIR = Split-Path $MyInvocation.MyCommand.Path -Parent
$ROOT       = Split-Path $SCRIPT_DIR -Parent
$BACKEND    = Join-Path $ROOT "backend"
$FRONTEND   = Join-Path $ROOT "frontend"
$CONFIG     = Join-Path $FRONTEND "src\app\config\api.config.ts"

Write-Host ""
Write-Host " =================================================" -ForegroundColor Yellow
Write-Host "  FordaGO Auto-Launcher" -ForegroundColor Yellow
Write-Host " =================================================" -ForegroundColor Yellow
Write-Host ""

# ── 0. Auto-detect WSL/Podman machine IP and patch api.config.ts ───────
Write-Host " [0/5] Detecting WSL/Podman backend IP..." -ForegroundColor Cyan
try {
  $wslIp = (podman machine ssh "ip addr show eth0 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | tr -s ' ' | cut -d' ' -f3 | cut -d'/' -f1" 2>$null).Trim()
  if ($wslIp -match '\d+\.\d+\.\d+\.\d+') {
    Write-Host "       WSL IP detected: $wslIp" -ForegroundColor Green
    $cfg = Get-Content $CONFIG -Raw -Encoding utf8
    $cfg = [regex]::Replace($cfg,
      "(export const WSL_BACKEND_HOST\s*=\s*')[^']*(';\s*//[^`r`n]*)",
      "`${1}$wslIp`${2}")
    [System.IO.File]::WriteAllText($CONFIG, $cfg, [System.Text.Encoding]::UTF8)
    Write-Host "       api.config.ts patched with WSL IP: $wslIp" -ForegroundColor Green
  } else {
    Write-Host "       Could not detect WSL IP. Using existing value." -ForegroundColor Yellow
  }
} catch {
  Write-Host "       Podman machine not running or WSL IP unavailable. Using existing value." -ForegroundColor Yellow
}
Write-Host ""
# ── 0.5. Ensure XAMPP MySQL is running ──────────────────────────────────
Write-Host " [0.5] Checking XAMPP MySQL..." -ForegroundColor Cyan
$mysqlRunning = netstat -ano | Select-String ":3306"
if (-not $mysqlRunning) {
  Write-Host "       MySQL is NOT running. Starting XAMPP MySQL..." -ForegroundColor Yellow
  Start-Process "C:\xampp\mysql\bin\mysqld.exe" `
    -ArgumentList "--defaults-file=C:\xampp\mysql\bin\my.ini" `
    -WindowStyle Hidden
  Start-Sleep -Seconds 4
  $mysqlRunning = netstat -ano | Select-String ":3306"
  if ($mysqlRunning) {
    Write-Host "       XAMPP MySQL started successfully!" -ForegroundColor Green
  } else {
    Write-Host "       WARNING: MySQL may not have started. Check XAMPP Control Panel." -ForegroundColor Red
  }
} else {
  Write-Host "       XAMPP MySQL is already running on port 3306." -ForegroundColor Green
}
Write-Host ""

Write-Host " [1/5] Starting Laravel backend (port 8000)..." -ForegroundColor Cyan
Start-Process "cmd" -ArgumentList "/k cd /d `"$BACKEND`" && php artisan serve --host=127.0.0.1 --port=8000" -WindowStyle Normal
Start-Sleep -Seconds 2

# ── 2. Reverb WebSocket ───────────────────────────────────────────────
Write-Host " [2/5] Starting Reverb WebSocket (port 8080)..." -ForegroundColor Cyan
Start-Process "cmd" -ArgumentList "/k cd /d `"$BACKEND`" && php artisan reverb:start --port=8080" -WindowStyle Normal
Start-Sleep -Seconds 2

# ── 3. Check for cloudflared / ngrok tunnels ────────────────────────────
Write-Host " [3/5] Checking public tunnels..." -ForegroundColor Cyan

$tunnelFound = $false

# Check cloudflared metrics on localhost:20245
try {
  $cfMetrics = (Invoke-RestMethod -Uri "http://127.0.0.1:20245/quicktunnel" -TimeoutSec 2 -ErrorAction SilentlyContinue)
  if ($cfMetrics.hostname) {
    $tunnelUrl = "https://" + $cfMetrics.hostname
    Write-Host "       Cloudflared tunnel detected: $tunnelUrl" -ForegroundColor Green
    $tunnelFound = $true
  }
} catch {}

# Fallback: check ngrok API on localhost:4040
if (-not $tunnelFound) {
  try {
    $ngrok = (Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2 -ErrorAction SilentlyContinue)
    $publicTunnel = $ngrok.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
    if ($publicTunnel) {
      $tunnelUrl = $publicTunnel.public_url
      Write-Host "       ngrok tunnel detected: $tunnelUrl" -ForegroundColor Green
      $tunnelFound = $true
    }
  } catch {}
}

if ($tunnelFound) {
  $cfg = Get-Content $CONFIG -Raw -Encoding utf8
  $cfg = [regex]::Replace($cfg,
    "(export const API_BASE_URL\s*=\s*')[^']*(';\s*//[^`r`n]*)",
    "`${1}$tunnelUrl`${2}")
  [System.IO.File]::WriteAllText($CONFIG, $cfg, [System.Text.Encoding]::UTF8)
  Write-Host "       api.config.ts updated with tunnel URL!" -ForegroundColor Green
} else {
  Write-Host "       No tunnel detected. Using local/LAN configuration." -ForegroundColor Yellow
}
Write-Host ""

# ── 4. Ionic / Angular Frontend ────────────────────────────────────────
Write-Host " [4/5] Starting Ionic/Angular frontend (port 4200)..." -ForegroundColor Cyan
Start-Process "cmd" -ArgumentList "/k cd /d `"$FRONTEND`" && npm start" -WindowStyle Normal
Start-Sleep -Seconds 2

# ── 5. Done ────────────────────────────────────────────────────────────
Write-Host ""
Write-Host " =================================================" -ForegroundColor Green
Write-Host "  FordaGO is ready!" -ForegroundColor Green
Write-Host "   Frontend : http://localhost:4200" -ForegroundColor White
Write-Host "   Backend  : http://localhost:8000/api" -ForegroundColor White
Write-Host "   WebSocket: ws://localhost:8080" -ForegroundColor White
if ($tunnelFound) {
Write-Host "   Public   : $tunnelUrl" -ForegroundColor White
}
Write-Host " =================================================" -ForegroundColor Green
Write-Host ""
