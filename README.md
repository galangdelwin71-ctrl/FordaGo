# 🏋️‍♂️ FordaGO — Modern Gym Management & Interactive Fitness Platform

<p align="center">
  <img src="fordago.ico" alt="FordaGO Logo" width="96" height="96" />
</p>

<p align="center">
  <b>An all-in-one, real-time gym management and interactive mobile fitness web application.</b><br>
  Built with Ionic Angular for the frontend and Laravel with Reverb WebSockets for the backend.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Ionic%20%7C%20Angular-F04141?style=for-the-badge&logo=ionic&logoColor=white" />
  <img src="https://img.shields.io/badge/Backend-Laravel%2011-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" />
  <img src="https://img.shields.io/badge/RealTime-Laravel%20Reverb-FF6C37?style=for-the-badge&logo=pusher&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
</p>

---

## 🌟 Key Features

### 👤 1. Member App (User Portal)
* **Interactive Dashboard:** Quick glance at active membership status, Personal Record (PR) tracker, upcoming workout sessions, and gym check-ins.
* **Smart Workout Schedule & Planner:** Create custom split routines (Monday–Sunday), set session duration & target muscles, configure gym floor location, and log workout completion.
* **Personal Trainers & Group Classes:** Browse certified gym coaches, filter by specialty, avail group fitness classes, and hire personal trainers.
* **Real-Time Coaching Chat:** Instant messaging with trainers, workout plan proposals, and appointment scheduling powered by WebSockets.
* **Shop & Supplement Orders:** Digital cart and checkout system with GCash or counter cash payment options.
* **QR Equipment Scanner:** Instant scan to view machine exercise guides, safety instructions, and targeted muscle groups.
* **Interactive Onboarding Tours:** Smooth, step-by-step guided feature walkthroughs for first-time gym members.

### 🏋️ 2. Coach Studio (Trainer Dashboard)
* **Client Roster & Request Management:** Accept/decline coaching inquiries, manage active client rosters, and track trainee progress.
* **Real-Time 1-on-1 Chat & Proposal Sender:** Send structured workout proposals with session dates, times, and exercise routines directly inside the chat.
* **Group Fitness Classes:** Create public gym classes with capacity limits, session schedules, and participant roster tracking.
* **Availability Scheduler:** Set weekly available coaching hours and working days.
* **Trainer Earnings & Session Metrics:** Monthly earnings breakdown and daily session schedules.

### 🛡️ 3. Admin & Staff Dashboard
* **Member Management:** User registration, membership pass activation (Daily / Premium), and profile controls.
* **Attendance & Check-In Monitoring:** Scan member digital QR codes for real-time gym entry logging and daily traffic analytics.
* **Shop Orders Fulfillment:** Review pending orders, verify GCash/cash payments, update stock inventory, and manage order statuses.
* **Gym Equipment Catalog:** Add/edit workout machines, upload demo photos, and generate downloadable QR code placards for physical gym equipment.
* **Coach Account Management:** Register and manage certified trainers and review performance.
* **Reports & Data Export:** One-click generation of PDF and Excel reports for attendance logs, financial revenue, and inventory sales.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | [Ionic Framework](https://ionicframework.com/), [Angular](https://angular.dev/) (Standalone Components), TypeScript, SCSS |
| **Backend** | [Laravel 11](https://laravel.com/), PHP 8.2+, Eloquent ORM, RESTful API |
| **Real-Time WebSockets** | [Laravel Reverb](https://reverb.laravel.com/), Laravel Echo, Pusher.js Protocol |
| **Database** | MySQL / MariaDB |
| **Authentication** | Laravel Sanctum (Token-based API authentication) |
| **Deployment / Container** | Docker, Nginx, Podman, Cloudflare Tunnel support |

---

## 🚀 Quick Start & Installation

### Prerequisites
Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18 or v20 LTS)
* [PHP](https://www.php.net/) (v8.2 or higher) + [Composer](https://getcomposer.org/)
* [MySQL](https://www.mysql.com/) server (e.g., via XAMPP, Laragon, or standalone service)

---

### 📦 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install PHP dependencies
composer install

# Create environment configuration file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure your database credentials in .env, then run database migrations and seeders:
php artisan migrate --seed

# Start backend server
php artisan serve --host=0.0.0.0 --port=8000
```

*In a separate terminal, start the real-time WebSocket server:*
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

The web application will be accessible at `http://localhost:4200`.

---

### ⚡ 3. One-Click 1-LAN Startup (Windows)

For rapid local testing and accessing the app from mobile phones over the same Wi-Fi network:

1. Double-click **`start-dev-lan.bat`** in the project root directory.
2. All 4 services (*Backend, Reverb WebSockets, Queue Worker, and Frontend*) will automatically start in separate windows with your auto-detected local IP address.

---

## 👥 User Roles & Demo Credentials

| Role | Email | Password | Access / Panel |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@email.com` | *(configured in seeder)* | Full Admin Management Panel |
| **Coach** | `coach.alex@email.com` | *(configured in seeder)* | Coach Studio & Client Chat |
| **Member** | `carl.bernaldo@email.com` | *(configured in seeder)* | Member App (User Portal) |

---

## 📄 License
This project is developed as an academic capstone and gym management solution. All rights reserved.
