# FordaGO — Modern Gym Management & Interactive Fitness Platform

![License](https://img.shields.io/badge/license-Proprietary-red)
![Laravel](https://img.shields.io/badge/backend-Laravel%2011-FF2D20?logo=laravel&logoColor=white)
![PHP](https://img.shields.io/badge/php-8.2%2B-777BB4?logo=php&logoColor=white)
![Angular](https://img.shields.io/badge/frontend-Angular%20%2F%20Ionic%208-DD0031?logo=angular&logoColor=white)
![Database](https://img.shields.io/badge/database-MySQL%20%2F%20MariaDB-4479A1?logo=mysql&logoColor=white)
![Broadcasting](https://img.shields.io/badge/realtime-Laravel%20Reverb-FF2D20?logo=laravel&logoColor=white)
![Containers](https://img.shields.io/badge/containers-Podman%20%2F%20Docker-892CA0?logo=podman&logoColor=white)
![Platforms](https://img.shields.io/badge/platforms-Android%20%7C%20iOS%20%7C%20Web-3DDC84?logo=android&logoColor=white)

A full-stack, real-time gym management and interactive fitness mobile web platform engineered to modernize health club operations. It seamlessly connects gym members, certified fitness coaches, and administrative staff through sub-second WebSocket communication, digital QR attendance and equipment interaction, personalized workout scheduling, inventory e-commerce, and guided onboarding walkthroughs.

Bachelor of Science in Information Technology Capstone Project — Nueva Ecija University of Science and Technology, San Isidro Campus.

---

## Overview

The platform operates as a cohesive, multi-portal fitness ecosystem:

- **Member Mobile Application (Android / iOS / Web)** — Gym trainees log in to view active membership passes (Daily / Premium), track personal record (PR) milestones, schedule custom weekly workout splits with duration and gym floor targeting, browse coach profiles, chat with trainers in real-time, order supplements via GCash or counter cash, and scan QR codes on gym equipment for instant exercise video/photo tutorials.
- **Coach Studio (Trainer Hub)** — Certified trainers manage client rosters, receive and accept/decline trainee coaching requests, negotiate and transmit structured workout plan proposals with instant calendar sync, publish public group fitness classes, set recurring weekly availability slots, and track monthly coaching earnings.
- **Admin Management Command Center** — Master administrators and staff conduct digital QR badge check-ins, approve and extend 30-day membership passes, manage physical equipment catalogs and generate downloadable QR placards, fulfill supplement shop orders with payment verification, register coach credentials, and export comprehensive attendance and financial reports to PDF and Excel.
- **Backend API & Real-Time Engine (Laravel 11 & Reverb)** — High-performance RESTful API powered by Laravel Sanctum token authentication, optimized database transactions, automated push/in-app notifications, and sub-second WebSocket broadcasting via Laravel Reverb.

---

## Tech Stack

<table>
<tr>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/ionic/3880FF" width="40" height="40" alt="Ionic" pointer-events="none"/><br/><sub><b>Ionic 8</b></sub></td>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/angular/DD0031" width="40" height="40" alt="Angular" pointer-events="none"/><br/><sub><b>Angular (Standalone)</b></sub></td>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/capacitor/119EFF" width="40" height="40" alt="Capacitor" pointer-events="none"/><br/><sub><b>Capacitor</b></sub></td>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/typescript/3178C6" width="40" height="40" alt="TypeScript" pointer-events="none"/><br/><sub><b>TypeScript</b></sub></td>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/android/3DDC84" width="40" height="40" alt="Android" pointer-events="none"/><br/><sub><b>Android</b></sub></td>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/apple/000000" width="40" height="40" alt="iOS" pointer-events="none"/><br/><sub><b>iOS / Web</b></sub></td>
</tr>
<tr>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/laravel/FF2D20" width="40" height="40" alt="Laravel" pointer-events="none"/><br/><sub><b>Laravel 11</b></sub></td>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/php/777BB4" width="40" height="40" alt="PHP" pointer-events="none"/><br/><sub><b>PHP 8.2+</b></sub></td>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/mysql/4479A1" width="40" height="40" alt="MySQL" pointer-events="none"/><br/><sub><b>MySQL / MariaDB</b></sub></td>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/podman/892CA0" width="40" height="40" alt="Podman" pointer-events="none"/><br/><sub><b>Podman / Docker</b></sub></td>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/nginx/009639" width="40" height="40" alt="Nginx" pointer-events="none"/><br/><sub><b>Nginx</b></sub></td>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/socketdotio/010101" width="40" height="40" alt="Reverb" pointer-events="none"/><br/><sub><b>Laravel Reverb (WS)</b></sub></td>
</tr>
<tr>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/sass/CC6699" width="40" height="40" alt="SCSS" pointer-events="none"/><br/><sub><b>SCSS Styling</b></sub></td>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/qrcode/000000" width="40" height="40" alt="QR Code" pointer-events="none"/><br/><sub><b>QR Scanner / Gen</b></sub></td>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/chartdotjs/FF6384" width="40" height="40" alt="Chart.js" pointer-events="none"/><br/><sub><b>Chart Analytics</b></sub></td>
<td align="center" width="110"><img src="https://cdn.simpleicons.org/gnubash/4EAA25" width="40" height="40" alt="1-Click LAN" pointer-events="none"/><br/><sub><b>1-Click LAN Dev</b></sub></td>
<td align="center" width="110"></td>
<td align="center" width="110"></td>
</tr>
</table>

---

## Core Features

- **Real-Time WebSocket Synchronization** — Powered by Laravel Reverb and Laravel Echo; direct coach-client messages, workout proposals, unread badge counters, and live order approvals update instantaneously across devices without polling.
- **Interactive Onboarding Feature Tours** — Smart, auto-scrolling walkthrough system that spotlights elements in the vertical center of the viewport, guides new users across Dashboard, Schedule, Coach Studio, and Profile, with auto-flipping tooltip cards that never clip.
- **Personal Record (PR) Metric Tracker** — Members log and celebrate personal bests (Bench Press, Squat, Deadlift, etc.) with automated percentage calculations, milestone badges, and history logs.
- **Dynamic Weekly Split Scheduler** — Intuitive Monday–Sunday day picker with duration selectors (Min/Hrs), customizable gym floor locations (e.g. Gym Floor A/B), muscle target tags, and inline exercise routine builders.
- **Coach Proposal & Appointment Engine** — Trainers create structured workout plans with pricing, session dates, time, and exercise lists, sending them directly into the chat thread for one-tap client acceptance and automatic calendar synchronization.
- **Public Group Fitness Classes** — Coaches publish community classes with capacity limits, scheduled dates, and pricing; members can book instantly and coaches can inspect real-time participant rosters.
- **Digital QR Equipment Guidance** — Trainees scan QR code stickers attached to physical gym equipment to instantly view targeted muscle groups, setup instructions, and proper execution guides.
- **QR Digital Attendance & Turnstile Verification** — Admins scan member QR badges using camera scanners to log gym check-ins with timestamped analytics, preventing pass-sharing.
- **Supplement Shop & Inventory Control** — Full digital shopping experience featuring category filtering, quantity selectors, and dual-payment checkout (Counter Cash & GCash Reference submission).
- **Admin POS & Orders Verification** — Dedicated admin order management to verify GCash reference numbers, approve or decline orders with automatic stock reconciliation, and notify members.
- **Theme-Aware Aesthetics** — Sleek, modern dark aesthetic for mobile member/coach views with dedicated light-theme styling and a crisp white theme for the Admin Panel.
- **Role-Based Access Control (RBAC)** — Strict multi-tier authorization gating Member, Coach, Employee, Admin, and Super Admin access.
- **Comprehensive PDF & Excel Reporting** — Instant client-side report generation for financial summaries, member check-in trends, and inventory levels via `jspdf` and `jspdf-autotable`.

---

## User Guides & Roles Matrix

| Portal / Role | Target Audience | Key Capabilities |
|---|---|---|
| **Member App** | Gym Members & Trainees | Dashboard PR metrics, workout split planner, coach browsing & chat, QR equipment scanner, supplement shop orders, digital pass renewal. |
| **Coach Studio** | Certified Personal Trainers | Trainee roster management, 1-on-1 chat & workout proposal dispatch, group fitness class creation, availability scheduling, monthly earnings. |
| **Admin Panel** | Gym Staff & Managers | Attendance QR scanning, pass renewals, supplement order verification & inventory stock management, equipment catalog, coach setup, PDF/Excel reports. |

---

## Quick Start & Installation

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or v20 LTS)
* [PHP](https://www.php.net/) (v8.2 or higher) + [Composer](https://getcomposer.org/)
* [MySQL](https://www.mysql.com/) server (e.g. XAMPP, Laragon, or Docker)

---

### 📦 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install PHP dependencies
composer install

# Configure environment variables
cp .env.example .env

# Generate application key
php artisan key:generate

# Run database migrations and seed default demo accounts
php artisan migrate --seed

# Start Laravel API server
php artisan serve --host=0.0.0.0 --port=8000
```

*In a second terminal window, start the real-time WebSocket server:*
```bash
cd backend
php artisan reverb:start --host=0.0.0.0 --port=8080
```

---

### 💻 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Ionic / Angular development server
npm start
# or:
npx ng serve --host=0.0.0.0 --port=4200
```

The application will be accessible in your web browser at `http://localhost:4200`.

---

### ⚡ 3. One-Click 1-LAN Startup (Windows)

For rapid local development and seamless mobile testing across devices on the same Wi-Fi network:

1. Double-click **`start-dev-lan.bat`** in the project root directory.
2. All 4 background services (*Laravel API, Reverb WebSockets, Queue Worker, and Ionic Frontend*) will start in separate terminal windows with auto-detected local IP address broadcasting.

---

## Documentation Suite

| Section | Document | Summary |
|---|---|---|
| **Capstone Defense** | [Defense Practical Guide](./docs/CAPSTONE_DEFENSE_PRACTICAL_GUIDE.md) | Technical talking points, architectural defense rationale, and live demo sequence. |
| | [Defense Strategy](./docs/DEFENSE_STRATEGY.md) | Question-and-answer preparation, system flow walkthroughs, and panel presentations. |
| | [Demo Script Quick Ref](./docs/DEMO_SCRIPT_QUICK_REF.md) | Step-by-step role-by-role live presentation script. |
| **System Docs** | [System Documentation](./docs/SYSTEM_DOCUMENTATION.md) | Database schemas, API endpoints, WebSocket event contracts, and security models. |
| | [Project Narrative](./docs/PROJECT_NARRATIVE.md) | Business problem context, gym operational challenges, and solution architecture. |
| **Deployment** | [Deployment Guide (Podman/Docker)](./DEPLOYMENT_GUIDE_PODMAN.md) | Containerized production deployment instructions on Linux VPS. |

---

## Future Roadmap

1. **Wearable Device Integration** — Real-time biometric heart rate, calorie burn, and step tracking synchronization via Apple HealthKit and Google Health Connect.
2. **AI-Powered Exercise Form Correction** — On-device camera pose estimation to provide real-time audio and visual posture feedback during lifting.
3. **Automated Turnstile Hardware Integration** — Direct relay controller integration for automated biometric gym gate entry.

---

## License

This project is proprietary and developed for academic capstone presentation and gym management evaluation — copying, modifying, redistributing, or unauthorized commercial deployment without prior written authorization from the Author is prohibited.

© 2026 Delwin Galang & FordaGO Team. All rights reserved.
