# ============================================================
#  FordaGo - MySQL Auto-Backup Script
#  Runs every 3 hours via Windows Task Scheduler
#  Keeps the latest 5 backups only (ZIP format)
#  Usage: .\scripts\backup-db.ps1
# ============================================================

# ── Config ──────────────────────────────────────────────────
$DB_NAME     = "fordago"
$DB_USER     = "root"
$DB_PASS     = ""                    # blank = no password
$DB_HOST     = "127.0.0.1"
$DB_PORT     = "3306"
$MAX_BACKUPS = 5                     # max number of backup ZIPs to keep

# Backup folder: fordaGo/backups/ (next to the scripts/ folder)
$SCRIPT_DIR  = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BACKUP_DIR  = Join-Path (Split-Path -Parent $SCRIPT_DIR) "backups"

# ── Locate mysqldump ─────────────────────────────────────────
$MYSQLDUMP = $null

# 1. Check if mysqldump is already in PATH
if (Get-Command mysqldump -ErrorAction SilentlyContinue) {
    $MYSQLDUMP = "mysqldump"
    Write-Host "[OK] mysqldump found in PATH" -ForegroundColor Green
} else {
    # 2. Auto-search common MySQL install locations
    $SEARCH_PATHS = @(
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.3\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.2\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.1\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysqldump.exe",
        "C:\xampp\mysql\bin\mysqldump.exe",
        "C:\wamp64\bin\mysql\mysql8.0\bin\mysqldump.exe",
        "C:\laragon\bin\mysql\mysql-8.0\bin\mysqldump.exe",
        "C:\laragon\bin\mysql\mysql-8.1\bin\mysqldump.exe",
        "C:\laragon\bin\mysql\mysql-8.2\bin\mysqldump.exe",
        "C:\laragon\bin\mysql\mysql-8.3\bin\mysqldump.exe",
        "C:\laragon\bin\mysql\mysql-8.4\bin\mysqldump.exe"
    )

    foreach ($path in $SEARCH_PATHS) {
        if (Test-Path $path) {
            $MYSQLDUMP = $path
            Write-Host "[OK] mysqldump found at: $path" -ForegroundColor Green
            break
        }
    }
}

if (-not $MYSQLDUMP) {
    Write-Host "[ERROR] mysqldump not found!" -ForegroundColor Red
    Write-Host "Please install MySQL or add its bin folder to your system PATH." -ForegroundColor Yellow
    Write-Host "Common location: C:\Program Files\MySQL\MySQL Server X.X\bin" -ForegroundColor Yellow
    exit 1
}

# ── Prepare backup folder ────────────────────────────────────
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "[OK] Created backup folder: $BACKUP_DIR" -ForegroundColor Green
}

# ── Generate filenames ────────────────────────────────────────
$TIMESTAMP   = Get-Date -Format "yyyy-MM-dd_HH-mm"
$SQL_FILE    = Join-Path $BACKUP_DIR "fordago_backup_$TIMESTAMP.sql"
$ZIP_FILE    = Join-Path $BACKUP_DIR "fordago_backup_$TIMESTAMP.zip"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  FordaGo Database Backup" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ── Run mysqldump ─────────────────────────────────────────────
Write-Host "`n[1/3] Dumping database '$DB_NAME'..." -ForegroundColor Yellow

# Build the mysqldump arguments
$DUMP_ARGS = @(
    "--host=$DB_HOST",
    "--port=$DB_PORT",
    "--user=$DB_USER",
    "--single-transaction",        # consistent snapshot without locking
    "--routines",                  # include stored procedures
    "--triggers",                  # include triggers
    "--result-file=$SQL_FILE",
    $DB_NAME
)

# Add password arg only if password is set
if ($DB_PASS -ne "") {
    $DUMP_ARGS = @("--password=$DB_PASS") + $DUMP_ARGS
}

& $MYSQLDUMP @DUMP_ARGS

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] mysqldump failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    # Clean up incomplete sql file if it exists
    if (Test-Path $SQL_FILE) { Remove-Item $SQL_FILE -Force }
    exit 1
}

$SQL_SIZE = [math]::Round((Get-Item $SQL_FILE).Length / 1KB, 2)
Write-Host "[OK] Dump complete - ${SQL_SIZE} KB" -ForegroundColor Green

# ── Compress to ZIP ───────────────────────────────────────────
Write-Host "`n[2/3] Compressing to ZIP..." -ForegroundColor Yellow

Compress-Archive -Path $SQL_FILE -DestinationPath $ZIP_FILE -CompressionLevel Optimal

# Remove the raw .sql file after zipping
Remove-Item $SQL_FILE -Force

$ZIP_SIZE = [math]::Round((Get-Item $ZIP_FILE).Length / 1KB, 2)
Write-Host "[OK] ZIP created - ${ZIP_SIZE} KB" -ForegroundColor Green
Write-Host "     Saved: $(Split-Path -Leaf $ZIP_FILE)" -ForegroundColor Gray

# ── Rotate old backups (keep only MAX_BACKUPS) ────────────────
Write-Host "`n[3/3] Rotating old backups (keeping latest $MAX_BACKUPS)..." -ForegroundColor Yellow

$ALL_BACKUPS = Get-ChildItem -Path $BACKUP_DIR -Filter "fordago_backup_*.zip" |
               Sort-Object LastWriteTime -Descending

$TOTAL = $ALL_BACKUPS.Count
Write-Host "     Total backup files: $TOTAL" -ForegroundColor Gray

if ($TOTAL -gt $MAX_BACKUPS) {
    $TO_DELETE = $ALL_BACKUPS | Select-Object -Skip $MAX_BACKUPS
    foreach ($OLD in $TO_DELETE) {
        Remove-Item $OLD.FullName -Force
        Write-Host "[DELETED] $(Split-Path -Leaf $OLD.FullName)" -ForegroundColor DarkGray
    }
    Write-Host "[OK] Deleted $($TO_DELETE.Count) old backup(s)" -ForegroundColor Green
} else {
    Write-Host "[OK] No cleanup needed" -ForegroundColor Green
}

# ── Summary ───────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Backup Complete!" -ForegroundColor Green
Write-Host "  File: fordago_backup_$TIMESTAMP.zip" -ForegroundColor White
Write-Host "  Folder: $BACKUP_DIR" -ForegroundColor White
Write-Host "  Current backups:" -ForegroundColor White

$FINAL_BACKUPS = Get-ChildItem -Path $BACKUP_DIR -Filter "fordago_backup_*.zip" |
                 Sort-Object LastWriteTime -Descending

foreach ($B in $FINAL_BACKUPS) {
    $SIZE = [math]::Round($B.Length / 1KB, 2)
    Write-Host "    - $($B.Name) (${SIZE} KB)" -ForegroundColor Gray
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
