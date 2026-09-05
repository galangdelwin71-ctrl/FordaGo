<div align="center">

  <img src="logo.png" alt="FordaGO Gym Logo" width="135" style="border-radius: 20px; margin-bottom: 12px;" />

  # **FordaGO**
  ### *Smart Gym Management & Interactive Fitness Platform*
  **AFFORDA Gym – Cabiao Branch**

  <p align="center">
    <b>A full-stack, real-time fitness ecosystem connecting Gym Members, Coaches, and Staff into one unified digital gym experience.</b>
  </p>

  <p align="center">
    <a href="#-core-modules"><img src="https://img.shields.io/badge/Status-Production%20Ready-22C55E?style=flat-square&logo=checkmarx&logoColor=white" alt="Status" /></a>
    <a href="#-technology-stack"><img src="https://img.shields.io/badge/Frontend-Ionic%208%20%7C%20Angular-F04141?style=flat-square&logo=ionic&logoColor=white" alt="Frontend" /></a>
    <a href="#-technology-stack"><img src="https://img.shields.io/badge/Backend-Laravel%2011-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Backend" /></a>
    <a href="#-technology-stack"><img src="https://img.shields.io/badge/Real--Time-Laravel%20Reverb-FF6C37?style=flat-square&logo=pusher&logoColor=white" alt="WebSockets" /></a>
    <a href="#-technology-stack"><img src="https://img.shields.io/badge/Database-MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="Database" /></a>
    <a href="#-license"><img src="https://img.shields.io/badge/License-Proprietary-EAB308?style=flat-square" alt="License" /></a>
  </p>

  <sub>Bachelor of Science in Information Technology — Capstone Project<br><b>Nueva Ecija University of Science and Technology (NEUST)</b>, San Isidro Campus</sub>

</div>

---

## 📌 Project Summary

**FordaGO** is an end-to-end gym digitalization platform engineered to modernize fitness operations, eliminate manual paper attendance logs, provide interactive equipment orientation, and facilitate real-time trainer-trainee collaboration. Developed specifically for **AFFORDA Gym – Cabiao Branch** (Cabiao, Nueva Ecija), the system empowers gym members with personal workout tracking, on-demand machine execution tutorials, and direct coach consultations, while providing gym owners and staff with automated QR attendance, inventory control, and instant financial and attendance reporting.

---

## 🏛️ Tri-Tier System Architecture & Experience

```
                           ┌───────────────────────────────┐
                            │      FordaGO Ecosystem        │
                            └──────────────┬────────────────┘
                                           │
          ┌────────────────────────────────┼────────────────────────────────┐
          │                                │                                │
          ▼                                ▼                                ▼
┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
│   MEMBER APP     │            │   COACH STUDIO   │            │   ADMIN PANEL    │
│  (Mobile Portal) │            │   (Trainer Hub)  │            │ (Command Center) │
└────────┬─────────┘            └────────┬─────────┘            └────────┬─────────┘
         │                               │                               │
         ├─ Personal QR Check-In         ├─ Trainee Roster Management    ├─ Digital QR Turnstile Scanner
         ├─ PR Metric Tracker            ├─ 1-on-1 Real-Time Chat        ├─ Anti-Pass-Sharing Check
         ├─ Split Routine Planner        ├─ In-Chat Workout Proposals    ├─ Pass Status & Renewals
         ├─ Equipment QR Scanner         ├─ Public Group Fitness Classes ├─ Shop POS & GCash Audit
         ├─ Supplement Shop & GCash      ├─ Weekly Availability Slots    ├─ Equipment Catalog & QRs
         └─ Interactive App Tour Guides  └─ Trainer Earnings Tracking    └─ PDF/Excel Export Engine
```

---

### 📱 1. Member Mobile Portal (Android APK / Web)
* **Personal QR Attendance Check-In:** Generate instant personal QR codes for turnstile check-in with live visit history and attendance heatmaps.
* **Personal Record (PR) Milestones:** Record bench press, deadlift, and squat metrics with automated percentage gain calculators and progress badges.
* **Weekly Split Planner:** Plan daily workouts (Monday to Sunday) with time duration targets (Min/Hrs), gym floor locations (Floor A/Floor B), and custom exercise builders.
* **Interactive QR Equipment Scanner:** Scan physical QR placards on gym machines using the device camera to view machine photos, targeted muscle group diagrams, and step-by-step exercise execution tutorials.
* **Real-Time Trainer Chat:** Message accredited coaches with live read receipts, instant typing updates, and interactive in-chat workout proposals.
* **Shop & Supplement Orders:** Add pre-workouts, protein powders, and gym apparel to cart with checkout via Counter Cash or GCash reference verification.
* **Guided Feature Onboarding:** Auto-centering interactive spotlights that guide new members step-by-step without blocking UI controls.

---

### 🏋️ 2. Coach Studio (Trainer Hub)
* **Client Roster Management:** Review incoming coaching applications, accept trainees, and manage active personal training clients.
* **In-Chat Workout Plan Proposals:** Compose and dispatch structured exercise routines with scheduled dates, time, price, and target muscles directly into chat with 1-tap client acceptance.
* **Group Fitness Classes:** Create public fitness classes with participant seat limits, schedules, and live roster tracking.
* **Availability Management:** Set weekly recurring coaching hours and working days.
* **Trainer Financial Insights:** Track completed client sessions and estimated monthly coaching earnings.

---

### 🛡️ 3. Admin Command Center
* **Digital QR Turnstile Scanner:** Instant camera scanner to log member daily check-ins with anti-pass-sharing timestamp verification.
* **Membership Pass Management:** Activate, monitor, and extend 30-day Premium Passes or Daily Visit passes.
* **Shop POS Orders & Stock Reconciliation:** Verify GCash reference numbers or cash payments, approve orders, and automatically deduct warehouse inventory atomically.
* **Equipment Management & QR Placard Generator:** Register gym equipment and download printable QR code stickers for gym machine placement.
* **Coach Account Administration:** Register certified gym coaches and manage credentials.
* **Data Analytics & Reports:** Instant export of attendance traffic, sales revenue, and inventory stock to vector PDF documents and Excel/CSV spreadsheets.

---

## 🛠️ Technology Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Mobile & Web Client** | **Ionic 8 + Angular** | Hybrid mobile UI (Android / iOS / Web) with standalone components |
| **Styling & Theming** | **SCSS + CSS Custom Properties** | Theme-aware interface (Dark fitness mode & Crisp white admin) |
| **Backend REST API** | **Laravel 11 (PHP 8.2+)** | Token authentication (Sanctum), business logic, and API routes |
| **Real-Time WebSockets** | **Laravel Reverb + Echo** | Sub-second real-time chat, unread notifications, and live status sync |
| **Database Management** | **MySQL 8.0** | Relational data persistence with strict foreign key constraints |
| **Hardware & Devices** | **Capacitor + Barcode Scanner** | Native device access for mobile camera QR scanning |
| **Reporting Engine** | **jsPDF + AutoTable** | Client-side vector PDF report generation and CSV/Excel exports |
| **Deployment / Containers**| **Docker + Nginx / Podman** | Production containerization and reverse proxy routing |

---

## ⚡ Quick Start (Local Development)

### 1. Backend Setup (Laravel API & WebSockets)

```bash
# Enter backend directory
cd backend

# Install dependencies & initialize environment
composer install
cp .env.example .env
php artisan key:generate

# Run migrations and seed default demo accounts
php artisan migrate --seed

# Launch Laravel API server
php artisan serve --host=0.0.0.0 --port=8000
```

*In a separate terminal, start the Reverb WebSocket engine:*
```bash
cd backend
php artisan reverb:start --host=0.0.0.0 --port=8080
```

---

### 2. Frontend Setup (Ionic / Angular)

```bash
# Enter frontend directory
cd frontend

# Install Node dependencies
npm install

# Start local dev server
npm start
```

Access the app in your browser at: `http://localhost:4200`

---

### 🚀 3. Automated Local & LAN Launchers (Windows)

To launch all servers simultaneously and test the app on your physical mobile phone over local Wi-Fi:

```cmd
# Double-click or execute the batch runner inside the scripts directory:
scripts\start-dev-lan.bat
```
*Auto-detects your local Wi-Fi IP address and boots Backend, Reverb, Queue Worker, and Frontend in dedicated windows for zero-latency testing.*

Or for local desktop development with automated XAMPP and tunnel detection:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-auto.ps1
```

---

## 👥 Demo Access Accounts

| Role | Email | Panel / Route |
| :--- | :--- | :--- |
| **Admin** | `admin@email.com` | `/admin` |
| **Coach** | `coach.alex@email.com` | Mobile Header → Coach Studio |
| **Member** | `carl.bernaldo@email.com` | `/dashboard` |

---

## 📚 Capstone Research & Technical Documentation

* 📖 **[Chapter 1: Introduction](./docs/chapters/chapter-1.md)** — Problem background, theoretical frameworks (TAM, Codd, Fielding, ISO), IPO conceptual model, scope & delimitations, and RRL.
* 🔬 **[Chapter 2: Research Methodology](./docs/chapters/chapter-2.md)** — Agile developmental design, SDLC phases, research locale, sampling, and 4-Point Likert statistical treatment.
* 📊 **[Chapter 3: Results and Discussions](./docs/chapters/chapter-3.md)** — System implementation, ISO/IEC 25010 evaluation results (IT Experts: 3.75, Staff/Coaches: 3.84, Members: 3.82), and synthesis of findings.
* 📋 **[Survey Questionnaire Instrument](./docs/SURVEY_QUESTIONNAIRE.md)** — Official 20-item ISO/IEC 25010 software quality evaluation survey.
* 📑 **[Capstone Defense Practical Guide](./docs/CAPSTONE_DEFENSE_PRACTICAL_GUIDE.md)** — Presentation talking points and live demo checklist.
* 🛡️ **[System Defense Reviewer](./docs/FORDAGO_SYSTEM_DEFENSE_REVIEWER.md)** — Master technical manual, full tech stack matrix, and panel defense Q&A.
* 📁 **[Codebase File Map](./docs/FORDAGO_CODEBASE_FILE_MAP.html)** — Directory architecture guide and codebase navigation manual.
* 📊 **[System Architecture & ERD Figures](./docs/figures/)** — Research figures, Gantt charts, 3NF normalization, ERD diagrams, and data dictionary.
* 🐳 **[Podman & Docker Deployment Guide](./docs/DEPLOYMENT_GUIDE_PODMAN.md)** — Containerized VPS deployment manual.

---

## 👥 Capstone Researchers & Proponents

**Bachelor of Science in Information Technology**  
*College of Information and Communications Technology (CICT)*  
**Nueva Ecija University of Science and Technology (NEUST) – San Isidro Campus**

* **BERNALDO, CARL ANDREW B.**
* **GALANG, DELWIN F.**
* **JAVIER, JAYLEE T.**
* **MEDINA, ETHAN JEROME G.**
* **PONGCO, RYZA MAE M.**

---

## 📜 Intellectual Property & License

This project is developed solely for academic capstone presentation and gym management evaluation. All rights reserved.

© 2026 Delwin Galang & FordaGO Capstone Team.
