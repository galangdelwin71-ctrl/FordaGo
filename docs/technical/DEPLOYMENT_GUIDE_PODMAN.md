# 🚀 FordaGO — Cloud Server Deployment Guide with Podman

This guide provides step-by-step instructions to deploy the entire **FordaGO System** (Laravel 11 API, MySQL 8.0, Reverb WebSocket, Queue Worker, Ionic 8/Angular Frontend, and Nginx Reverse Proxy Gateway) on any Linux Cloud VPS (such as AWS EC2, DigitalOcean, Linode, Hetzner, Vultr, or Contabo) using **Podman** and **Podman Compose**.

---

## 📑 Table of Contents
1. [Why Podman?](#1-why-podman)
2. [Cloud Server (VPS) Provisioning](#2-cloud-server-vps-provisioning)
3. [Installing Podman on Linux](#3-installing-podman-on-linux)
4. [Cloning & Repository Setup](#4-cloning--repository-setup)
5. [Configuring Production Environment Variables (.env)](#5-configuring-production-environment-variables-env)
6. [Orchestrating Services with Podman](#6-orchestrating-services-with-podman)
7. [Custom Domain & Free SSL (HTTPS) Configuration](#7-custom-domain--free-ssl-https-configuration)
8. [Essential Podman Maintenance & Monitoring Commands](#8-essential-podman-maintenance--monitoring-commands)

---

## 1. Why Podman?

* **Daemonless & Rootless Architecture**: Podman does not rely on a heavy, continuously running background root daemon like traditional Docker. This significantly reduces idle CPU and RAM consumption on your VPS.
* **100% Docker CLI Compatible**: Works out-of-the-box with standard commands (`podman compose`, `podman ps`, `podman logs`, `podman exec`).
* **Enhanced Security**: Containers can be executed in user namespaces without root privileges, isolating the host operating system from container escapes.

---

## 2. Cloud Server (VPS) Provisioning

Recommended hardware specifications:
* **Operating System**: Ubuntu 22.04 LTS / 24.04 LTS, Debian 12, or AlmaLinux 9
* **RAM**: Minimum 1 GB RAM *(2 GB+ recommended if building the Angular frontend bundle directly on the server)*
* **Disk Space**: At least 20 GB SSD
* **Open Firewall Ports (Security Groups)**:
  * Port `22` (SSH Access)
  * Port `80` (HTTP Ingress)
  * Port `443` (HTTPS Ingress)

---

## 3. Installing Podman on Linux

Connect to your cloud server via SSH:
```bash
ssh root@<YOUR_SERVER_IP>
```

### For Ubuntu / Debian Systems:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y podman podman-compose git curl
```

Verify that Podman and Compose are successfully installed:
```bash
podman --version
podman compose version || podman-compose --version
```

---

## 4. Cloning & Repository Setup

Navigate to your web directory and clone the official repository:
```bash
cd /opt
git clone https://github.com/galangdelwin71-ctrl/FordaGo.git fordago
cd fordago
```

*(Alternatively, if deploying via SCP/SFTP, upload your project files directly to `/opt/fordago` or `~/fordago`)*.

---

## 5. Configuring Production Environment Variables (.env)

Copy the production environment configuration template for the backend:
```bash
cp backend/.env.production.example backend/.env
nano backend/.env
```

Review and update the essential values:
```ini
APP_NAME=FordaGO
APP_ENV=production
APP_KEY=base64:...             # Generate with: php artisan key:generate --show
APP_DEBUG=false
APP_URL=https://yourdomain.com # Or http://<YOUR_SERVER_IP> if domain is not yet active

# Database Credentials
DB_CONNECTION=mysql
DB_HOST=fordago_db
DB_PORT=3306
DB_DATABASE=fordago
DB_USERNAME=fordago_user
DB_PASSWORD=YourStrongPasswordHere123!
DB_ROOT_PASSWORD=YourStrongRootPasswordHere123!

# Laravel Reverb Real-Time WebSockets
REVERB_HOST="0.0.0.0"
REVERB_PORT=8080
VITE_REVERB_HOST="yourdomain.com" # Or public server IP
VITE_REVERB_PORT="443"            # 80 for HTTP, 443 for HTTPS with SSL
VITE_REVERB_SCHEME="https"        # "http" if running without SSL

# PhilSMS / Resend Email Configuration
SMS_PROVIDER=philsms
PHILSMS_API_TOKEN=your_token_here
PHILSMS_SENDER_ID=PhilSMS
RESEND_API_KEY=your_resend_api_key_here
```
*Press `CTRL + O`, `ENTER` to save, and `CTRL + X` to exit nano.*

---

## 6. Orchestrating Services with Podman

Make the deployment script executable and trigger the automated build:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Or manually start the multi-container stack:
```bash
# 1. Build all container images
podman compose -f docker-compose.prod.yml build

# 2. Start all services in detached mode (-d)
podman compose -f docker-compose.prod.yml up -d
```

### What happens in the background?
1. 🗄️ **`fordago_db`**: Boots the MySQL 8.0 relational database engine and initializes the `fordago` schema.
2. ⚙️ **`fordago_backend`**: Initializes PHP 8.3 FPM, executes automated database migrations (`php artisan migrate --force`), and generates public asset symlinks.
3. ⚡ **`fordago_reverb`**: Starts the WebSocket engine on port `8080` for sub-second chat and push events.
4. 📬 **`fordago_queue`**: Starts the background queue worker daemon for asynchronous SMS OTP and email notifications.
5. 📱 **`fordago_frontend`**: Serves the compiled production Angular/Ionic Single Page Application (SPA).
6. 🌐 **`fordago_gateway`**: Reverse proxy gateway (Nginx) routing incoming traffic on Ports `80` and `443` to their respective microservices.

---

## 7. Custom Domain & Free SSL (HTTPS) Configuration

### Option A: Via Cloudflare (Recommended & Fastest)
1. Point your domain's DNS `A` record to `<YOUR_SERVER_IP>` in the Cloudflare dashboard.
2. Enable the **Cloudflare Proxy (Orange Cloud icon)**.
3. Under Cloudflare SSL/TLS settings, select **Full** or **Full (strict)**.
4. Deployment complete! Cloudflare automatically provisions and terminates free global HTTPS certificates without requiring Certbot installation on the VPS.

### Option B: Via Let's Encrypt / Certbot on VPS
If you prefer native SSL termination on the Nginx gateway container:
```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```
Then mount the `/etc/letsencrypt` certificate path into `docker-compose.prod.yml` under the `gateway` service definition.

---

## 8. Essential Podman Maintenance & Monitoring Commands

### 📊 Check Container Status
```bash
podman compose ps
```

### 📜 View Real-Time Application Logs
```bash
# Stream logs for all services:
podman compose logs -f

# Stream logs for specific containers:
podman compose logs -f backend
podman compose logs -f reverb
podman compose logs -f gateway
```

### 🔄 Restart All Services
```bash
podman compose restart
```

### 🛑 Stop Application Stack
```bash
podman compose down
```

### 💾 Backup MySQL Database to SQL File
```bash
podman exec -t fordago_db mysqldump -u root -p<DB_ROOT_PASSWORD> fordago > backup_$(date +%F).sql
```

### 📥 Restore MySQL Database from SQL File
```bash
podman exec -i fordago_db mysql -u root -p<DB_ROOT_PASSWORD> fordago < backup_file.sql
```

### 🚀 Deploying Code Updates (CI/CD Workflow)
```bash
git pull origin main
podman compose -f docker-compose.prod.yml build
podman compose -f docker-compose.prod.yml up -d
```

---

*FordaGO Gym Management System — Ready for Production Cloud Deployment! 🏋️‍♂️*
