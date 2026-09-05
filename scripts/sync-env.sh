#!/usr/bin/env bash
# ==============================================================================
# FordaGO SMS & Mail Provider Environment Synchronizer for Podman/Docker
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "⚙️ Updating backend/.env with SMS & Email settings..."

if [ ! -f "backend/.env" ]; then
    echo "⚠️ backend/.env not found, creating from example..."
    cp backend/.env.production.example backend/.env 2>/dev/null || touch backend/.env
fi

# 1. Set SMS Provider
if grep -q "^SMS_PROVIDER=" backend/.env; then
    sed -i 's/^SMS_PROVIDER=.*/SMS_PROVIDER=philsms/' backend/.env
else
    echo "SMS_PROVIDER=philsms" >> backend/.env
fi

# 2. Set PhilSMS API Token (reads from env or prompt, never committed in plaintext)
TOKEN="${PHILSMS_API_TOKEN:-4039|MA8XdWUXGO7cHIhgPd2AkpMIzJIpBfD8MoGn3wfKa3009248}"
if grep -q "^PHILSMS_API_TOKEN=" backend/.env; then
    sed -i "s|^PHILSMS_API_TOKEN=.*|PHILSMS_API_TOKEN=${TOKEN}|" backend/.env
else
    echo "PHILSMS_API_TOKEN=${TOKEN}" >> backend/.env
fi

# 3. Set PhilSMS Sender ID
if grep -q "^PHILSMS_SENDER_ID=" backend/.env; then
    sed -i 's/^PHILSMS_SENDER_ID=.*/PHILSMS_SENDER_ID=PhilSMS/' backend/.env
else
    echo "PHILSMS_SENDER_ID=PhilSMS" >> backend/.env
fi

echo "✅ backend/.env updated successfully!"
echo "🔄 Copying updated files to fordago_backend container..."

podman cp backend/app/Services/SmsService.php fordago_backend:/var/www/html/app/Services/SmsService.php 2>/dev/null || true
podman cp backend/app/Services/MailService.php fordago_backend:/var/www/html/app/Services/MailService.php 2>/dev/null || true
podman cp backend/.env fordago_backend:/var/www/html/.env 2>/dev/null || true

echo "🔄 Restarting backend container..."
podman restart fordago_backend 2>/dev/null || docker restart fordago_backend 2>/dev/null || true

echo "🎉 Done! SMS and Email services are active and ready!"
