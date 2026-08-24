# 🚀 FordaGO — Gabay sa Pag-Deploy sa Cloud Server gamit ang Podman

Ang gabay na ito ay naglalaman ng sunod-sunod na hakbang para i-deploy ang buong **FordaGO App** (Laravel API + MySQL + Reverb WebSocket + Queue Worker + Ionic/Angular Frontend + Nginx Gateway) sa iyong Linux Cloud Server (VPS tulad ng AWS EC2, DigitalOcean, Linode, Hetzner, Vultr, Contabo, etc.) gamit ang **Podman**.

---

## 📑 Talaan ng Nilalaman
1. [Bakit Podman?](#1-bakit-podman)
2. [Paghahanda ng Cloud Server (VPS)](#2-paghahanda-ng-cloud-server-vps)
3. [Pag-install ng Podman sa Server](#3-pag-install-ng-podman-sa-server)
4. [Pag-clone o Pag-upload ng FordaGO](#4-pag-clone-o-pag-upload-ng-fordago)
5. [Pag-configure ng Environment Variables (.env)](#5-pag-configure-ng-environment-variables-env)
6. [Pagpapatakbo ng Application gamit ang Podman](#6-pagpapatakbo-ng-application-gamit-ang-podman)
7. [Pag-setup ng Custom Domain at Libreng SSL (HTTPS)](#7-pag-setup-ng-custom-domain-at-libreng-ssl-https)
8. [Mahahalagang Podman Commands para sa Maintenance](#8-mahahalagang-podman-commands-para-sa-maintenance)

---

## 1. Bakit Podman?
- **Daemonless & Rootless**: Hindi kailangan ng root access at walang mabigat na background background daemon (tulad ng Docker daemon), kaya mas matipid sa RAM at CPU ng VPS.
- **Docker Compatible**: Parehong-pareho ang commands (`podman compose`, `podman ps`, `podman logs`).
- **Secure**: Mas ligtas sa cloud server dahil rootless ang pagtakbo ng mga containers.

---

## 2. Paghahanda ng Cloud Server (VPS)
Inirerekomendang specs para sa VPS:
- **OS**: Ubuntu 22.04 LTS o 24.04 LTS / Debian 12 / AlmaLinux 9
- **RAM**: Minimum 1GB RAM (Inirerekomenda: 2GB RAM kung magbi-build ng Angular diretso sa server)
- **Open Ports (Firewall / Security Group)**:
  - Port `22` (SSH)
  - Port `80` (HTTP)
  - Port `443` (HTTPS)

---

## 3. Pag-install ng Podman sa Server

Kumonekta sa iyong server gamit ang SSH:
```bash
ssh root@<YOUR_SERVER_IP>
```

### Para sa Ubuntu / Debian:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y podman podman-compose git curl
```

I-verify ang installation:
```bash
podman --version
podman compose version || podman-compose --version
```

---

## 4. Pag-clone o Pag-upload ng FordaGO

Pumunta sa home directory at i-clone ang repository:
```bash
cd /opt
git clone <URL_NG_IYONG_GIT_REPOSITORY> fordago
cd fordago
```

*(O kung gagamit ng SCP/SFTP, i-upload ang project folder sa `/opt/fordago` o `~/fordago`)*.

---

## 5. Pag-configure ng Environment Variables (.env)

Kopyahin ang production template para sa backend:
```bash
cp backend/.env.production.example backend/.env
nano backend/.env
```

I-update ang mga sumusunod na values:
```ini
APP_URL=https://yourdomain.com      # O http://<YOUR_SERVER_IP> kung wala pang domain
APP_DEBUG=false

DB_DATABASE=fordago
DB_USERNAME=fordago_user
DB_PASSWORD=SecureDbPasswordDito123!
DB_ROOT_PASSWORD=SuperSecureRootPassword123!

# Reverb Config
REVERB_HOST="0.0.0.0"
REVERB_PORT=8080
VITE_REVERB_HOST="yourdomain.com"  # O Server IP
VITE_REVERB_PORT="443"              # 80 kung HTTP, 443 kung HTTPS
VITE_REVERB_SCHEME="https"          # "http" kung wala pang SSL
```
*Pindutin ang `CTRL + O`, `ENTER` para i-save, at `CTRL + X` para lumabas sa nano.*

---

## 6. Pagpapatakbo ng Application gamit ang Podman

Gawing executable ang deploy script at patakbuhin:
```bash
chmod +x deploy.sh
./deploy.sh
```

O patakbuhin nang manual gamit ang `podman compose`:
```bash
# 1. I-build ang lahat ng container images
podman compose build

# 2. Simulan ang mga services sa background (-d)
podman compose up -d
```

### Ano ang mangyayari sa background?
1. 🗄️ **`fordago_db`**: Magsisimula ang MySQL 8.0 server at gagawa ng `fordago` database.
2. ⚙️ **`fordago_backend`**: Magsisimula ang PHP 8.3 FPM, magpapatakbo ng `php artisan migrate --force` at `storage:link`.
3. ⚡ **`fordago_reverb`**: Magsisimula ang Reverb WebSocket server sa port 8080.
4. 📬 **`fordago_queue`**: Magsisimula ang background queue worker para sa SMS/Email notifications.
5. 📱 **`fordago_frontend`**: Naka-serve ang compiled Angular/Ionic SPA.
6. 🌐 **`fordago_gateway`**: Ang Nginx reverse proxy na magko-connect ng lahat sa Port 80 / 443.

---

## 7. Pag-setup ng Custom Domain at Libreng SSL (HTTPS)

### Option A: Gamit ang Cloudflare (Pinakamadali at Libre)
1. Ituro ang iyong Domain DNS A record sa `<YOUR_SERVER_IP>` sa Cloudflare dashboard.
2. I-on ang **Cloudflare Proxy (Orange Cloud icon)**.
3. Sa Cloudflare SSL/TLS settings, piliin ang **Flexible** o **Full**.
4. Tapos na! Awtomatiko nang may HTTPS ang iyong domain nang hindi na kailangang mag-install ng Certbot sa server.

### Option B: Gamit ang Certbot / Let's Encrypt sa VPS
Kung direct HTTPS sa Nginx ang nais mo:
```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```
Pagkatapos ay i-mount ang `/etc/letsencrypt` folder sa `docker-compose.yml` sa gateway service.

---

## 8. Mahahalagang Podman Commands para sa Maintenance

### 📊 Tingnan ang status ng mga containers:
```bash
podman compose ps
```

### 📜 Tingnan ang live logs ng lahat ng services (o specific service):
```bash
podman compose logs -f
# O specific container:
podman compose logs -f backend
podman compose logs -f reverb
```

### 🔄 I-restart ang mga services:
```bash
podman compose restart
```

### 🛑 Itigil ang mga containers:
```bash
podman compose down
```

### 💾 Mag-backup ng MySQL Database:
```bash
podman exec -t fordago_db mysqldump -u root -p<DB_ROOT_PASSWORD> fordago > backup_$(date +%F).sql
```

### 📥 Mag-restore ng MySQL Database:
```bash
podman exec -i fordago_db mysql -u root -p<DB_ROOT_PASSWORD> fordago < backup_file.sql
```

### 🚀 Mag-update ng Code pagkatapos mag-git pull:
```bash
git pull origin main
podman compose build
podman compose up -d
```

---

*FordaGO Gym Management System — Ready for Production Cloud Deployment! 🏋️‍♂️*
