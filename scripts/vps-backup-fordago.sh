#!/bin/bash
# ============================================================
#  FordaGo - MariaDB/MySQL Auto-Backup (VPS Host Production)
#  Cron: every 3 hours | keeps latest 5 GZIPs
# ============================================================

DB_NAME="fordago"
DB_USER="FordaGo"
# Password must be provided via /root/.fordago-backup.env or environment variable
[ -f /root/.fordago-backup.env ] && . /root/.fordago-backup.env
if [ -z "$DB_PASS" ]; then
  echo "[ERROR] Database password is not set. Please define DB_PASS in /root/.fordago-backup.env"
  exit 1
fi
MAX_BACKUPS=5
BACKUP_DIR="/root/fordago-backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
SQL_FILE="$BACKUP_DIR/fordago_backup_$TIMESTAMP.sql"
ZIP_FILE="$BACKUP_DIR/fordago_backup_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting FordaGo backup..."

# Dump MariaDB/MySQL from the active production database
mariadb-dump \
  --user="$DB_USER" \
  --password="$DB_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" > "$SQL_FILE" 2>/tmp/backup_err.log

if [ $? -ne 0 ]; then
  echo "[ERROR] mariadb-dump failed!"
  cat /tmp/backup_err.log
  rm -f "$SQL_FILE"
  exit 1
fi

SQL_SIZE=$(du -sh "$SQL_FILE" | cut -f1)
echo "[OK] Dump complete - $SQL_SIZE"

# Compress with gzip
gzip -9 "$SQL_FILE"
ZIP_SIZE=$(du -sh "$ZIP_FILE" | cut -f1)
echo "[OK] Compressed - $ZIP_SIZE -> $(basename $ZIP_FILE)"

# Rotate: keep only MAX_BACKUPS newest files
TOTAL=$(ls -1 "$BACKUP_DIR"/fordago_backup_*.sql.gz 2>/dev/null | wc -l)
echo "[INFO] Total backups: $TOTAL"

if [ "$TOTAL" -gt "$MAX_BACKUPS" ]; then
  ls -1t "$BACKUP_DIR"/fordago_backup_*.sql.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
  echo "[OK] Rotated old backups (keeping latest $MAX_BACKUPS)"
fi

echo ""
echo "[DONE] Backup complete: fordago_backup_$TIMESTAMP.sql.gz"
echo "Current backups in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"/fordago_backup_*.sql.gz 2>/dev/null
