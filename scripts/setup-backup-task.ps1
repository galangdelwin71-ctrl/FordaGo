# ============================================================
#  FordaGo - Setup Auto-Backup Task in Windows Task Scheduler
#  Run this ONCE as Administrator to register the 3-hour backup task.
#  Usage: Right-click > Run as Administrator
#         OR: PowerShell (Admin) > .\scripts\setup-backup-task.ps1
# ============================================================

$TASK_NAME   = "FordaGo-DB-AutoBackup"
$SCRIPT_DIR  = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BACKUP_SCRIPT = Join-Path $SCRIPT_DIR "backup-db.ps1"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  FordaGo - Setup Auto-Backup Task" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if script exists
if (-not (Test-Path $BACKUP_SCRIPT)) {
    Write-Host "[ERROR] backup-db.ps1 not found at: $BACKUP_SCRIPT" -ForegroundColor Red
    exit 1
}

# Check if running as admin
$IS_ADMIN = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $IS_ADMIN) {
    Write-Host "[ERROR] Please run this script as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell > Run as Administrator" -ForegroundColor Yellow
    pause
    exit 1
}

# Remove existing task if it exists
$EXISTING = Get-ScheduledTask -TaskName $TASK_NAME -ErrorAction SilentlyContinue
if ($EXISTING) {
    Write-Host "[INFO] Removing existing task '$TASK_NAME'..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false
}

# ── Create the scheduled task ─────────────────────────────────

# Action: run powershell.exe with the backup script
$ACTION = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -NoProfile -ExecutionPolicy Bypass -File `"$BACKUP_SCRIPT`""

# Trigger: every 3 hours, starting now
$TRIGGER = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Hours 3) -Once -At (Get-Date)

# Settings: run even if on battery, wake if asleep
$SETTINGS = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -DontStopIfGoingOnBatteries `
    -WakeToRun:$false

# Principal: run as current user
$PRINCIPAL = New-ScheduledTaskPrincipal `
    -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) `
    -LogonType Interactive `
    -RunLevel Highest

# Register the task
Register-ScheduledTask `
    -TaskName $TASK_NAME `
    -Action $ACTION `
    -Trigger $TRIGGER `
    -Settings $SETTINGS `
    -Principal $PRINCIPAL `
    -Description "FordaGo MySQL auto-backup every 3 hours. Keeps latest 5 ZIP files." `
    -Force | Out-Null

Write-Host "[OK] Task '$TASK_NAME' registered successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Details:" -ForegroundColor White
Write-Host "  Schedule  : Every 3 hours" -ForegroundColor Gray
Write-Host "  Script    : $BACKUP_SCRIPT" -ForegroundColor Gray
Write-Host "  Backup Dir: $(Join-Path (Split-Path -Parent $SCRIPT_DIR) 'backups')" -ForegroundColor Gray
Write-Host ""
Write-Host "You can view/manage this task in:" -ForegroundColor White
Write-Host "  Task Scheduler > Task Scheduler Library > FordaGo-DB-AutoBackup" -ForegroundColor Gray
Write-Host ""

# Run it immediately for the first time
Write-Host "[INFO] Running first backup now..." -ForegroundColor Yellow
Write-Host ""
& powershell.exe -NonInteractive -NoProfile -ExecutionPolicy Bypass -File "$BACKUP_SCRIPT"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "  Next backup in 3 hours" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
pause
