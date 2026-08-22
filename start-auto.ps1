param()
# FordaGO Auto-Launcher - auto-detects tunnel URLs and updates api.config.ts

$ROOT     = Split-Path $MyInvocation.MyCommand.Path -Parent
$BACKEND  = Join-Path $ROOT "backend"
$FRONTEND = Join-Path $ROOT "frontend"
$CONFIG   = Join-Path $FRONTEND "src\app\config\api.config.ts"

Write-Host ""
Write-Host " =================================================" -ForegroundColor Yellow
Write-Host "  FordaGO Auto-Launcher" -ForegroundColor Yellow
Write-Host " =================================================" -ForegroundColor Yellow
Write-Host ""

# ── 1. Laravel backend ────────────────────────────────────────────────
Write-Host " [1/5] Starting Laravel backend (port 8000)..." -ForegroundColor Cyan
Start-Process "cmd" -ArgumentList "/k cd /d `"$BACKEND`" && php artisan serve --host=127.0.0.1 --port=8000" -WindowStyle Normal
Start-Sleep -Seconds 2

# ── 2. Reverb WebSocket ───────────────────────────────────────────────
Write-Host " [2/5] Starting Reverb WebSocket (port 8080)..." -ForegroundColor Cyan
Start-Process "cmd" -ArgumentList "/k cd /d `"$BACKEND`" && php artisan reverb:start --port=8080" -WindowStyle Normal
Start-Sleep -Seconds 3

# ── 3 & 4. Tunnels — capture URLs via separate stderr/stdout files ─────
Write-Host " [3/5] Starting Cloudflare tunnels (auto-detecting URLs)..." -ForegroundColor Cyan
Write-Host "       Waiting up to 90 seconds..." -ForegroundColor Gray
Write-Host ""

$apiOut   = Join-Path $env:TEMP "fordago_api_stdout.log"
$apiErr   = Join-Path $env:TEMP "fordago_api_stderr.log"
$revOut   = Join-Path $env:TEMP "fordago_rev_stdout.log"
$revErr   = Join-Path $env:TEMP "fordago_rev_stderr.log"

# Clear old logs
"" | Set-Content $apiOut; "" | Set-Content $apiErr
"" | Set-Content $revOut; "" | Set-Content $revErr

# Start API tunnel (stdout + stderr to separate files)
$apiProc = Start-Process "cloudflared" `
  -ArgumentList "tunnel --url http://localhost:8000 --protocol http2 --edge-ip-version 4 --retries 5 --no-autoupdate" `
  -RedirectStandardOutput $apiOut `
  -RedirectStandardError  $apiErr `
  -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 2

# Start Reverb tunnel
$revProc = Start-Process "cloudflared" `
  -ArgumentList "tunnel --url http://localhost:8080 --protocol http2 --edge-ip-version 4 --retries 5 --no-autoupdate" `
  -RedirectStandardOutput $revOut `
  -RedirectStandardError  $revErr `
  -PassThru -WindowStyle Minimized

# ── Poll logs for the trycloudflare.com URLs ──────────────────────────
$apiUrl    = $null
$reverbUrl = $null
$maxWait   = 90
$elapsed   = 0

while ((-not $apiUrl -or -not $reverbUrl) -and $elapsed -lt $maxWait) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host -NoNewline "." -ForegroundColor Gray

    # Combine stdout + stderr for searching (they appear in stderr usually)
    foreach ($file in @($apiOut, $apiErr)) {
        if (-not $apiUrl) {
            $txt = Get-Content $file -Raw -ErrorAction SilentlyContinue
            if ($txt) {
                $m = [regex]::Match($txt, 'https://[a-z0-9\-]+\.trycloudflare\.com')
                if ($m.Success) { $apiUrl = $m.Value }
            }
        }
    }

    foreach ($file in @($revOut, $revErr)) {
        if (-not $reverbUrl) {
            $txt = Get-Content $file -Raw -ErrorAction SilentlyContinue
            if ($txt) {
                $m = [regex]::Match($txt, 'https://[a-z0-9\-]+\.trycloudflare\.com')
                if ($m.Success) { $reverbUrl = $m.Value }
            }
        }
    }
}

Write-Host ""

# Fallback: ask manually if auto-detect failed
if (-not $apiUrl) {
    Write-Host " Could not auto-detect API URL. Enter it manually:" -ForegroundColor Yellow
    $apiUrl = Read-Host " API tunnel URL (port 8000)"
}
if (-not $reverbUrl) {
    Write-Host " Could not auto-detect Reverb URL. Enter it manually:" -ForegroundColor Yellow
    $reverbUrl = Read-Host " Reverb tunnel URL (port 8080)"
}

Write-Host ""
Write-Host " Detected URLs:" -ForegroundColor Green
Write-Host "   API    : $apiUrl" -ForegroundColor White
Write-Host "   Reverb : $reverbUrl" -ForegroundColor White
Write-Host ""

# ── 4. Auto-update api.config.ts ──────────────────────────────────────
Write-Host " [4/5] Updating api.config.ts..." -ForegroundColor Cyan

$content = Get-Content $CONFIG -Raw -Encoding utf8

# Replace API_BASE_URL value (handles both single-line and multi-line)
$content = [regex]::Replace($content,
    "(export const API_BASE_URL\s*=\s*)\r?\n\s*'https://[^']*'",
    "`$1`n  '$apiUrl'")

# Replace REVERB_TUNNEL_URL value
$content = [regex]::Replace($content,
    "(export const REVERB_TUNNEL_URL\s*=\s*)\r?\n\s*'https://[^']*'",
    "`$1`n  '$reverbUrl'")

[System.IO.File]::WriteAllText($CONFIG, $content, [System.Text.Encoding]::UTF8)

Write-Host " api.config.ts updated automatically!" -ForegroundColor Green
Write-Host ""

# ── 5. Start Ionic frontend ───────────────────────────────────────────
Write-Host " [5/5] Starting Ionic frontend..." -ForegroundColor Cyan
Start-Process "cmd" -ArgumentList "/k cd /d `"$FRONTEND`" && npx ionic serve --port=4200" -WindowStyle Normal

Write-Host ""
Write-Host " =================================================" -ForegroundColor Yellow
Write-Host "  DONE! App running at: http://localhost:4200" -ForegroundColor Green
Write-Host " =================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host " Keep this window open (tunnels run here)." -ForegroundColor Gray
Write-Host " Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

# Keep alive while tunnels run
try { Wait-Process -Id $apiProc.Id -ErrorAction SilentlyContinue } catch {}
