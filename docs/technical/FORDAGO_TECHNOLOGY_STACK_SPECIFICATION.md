# FordaGo — Technology Stack & Architectural Specification

**Project Title:** FordaGo: Mobile-Based Gym Database Management System  
**Document Type:** Technical & Defense Specification Document  
**Version:** 2.0 (Defense Ready)  
**Target Platform:** Mobile (Android Native APK & Cross-Platform iOS) / Progressive Web App  

---

## 1. Executive Summary & System Architecture

**FordaGo** is an enterprise-grade mobile gym management system developed specifically for **AffordaGym – San Isidro Branch**. The platform replaces error-prone manual paper logs and fragmented spreadsheets with a synchronized, real-time digital ecosystem.

The system adopts a **Decoupled Client-Server & Event-Driven Architecture**:
- **Presentation / Client Tier:** A high-performance hybrid mobile application built with **Ionic 8 + Angular 20**, packaged into native mobile binaries via **Capacitor 8**.
- **Application / API Tier:** A robust, secure RESTful API powered by **Laravel 12+ (PHP 8.3+)**, handling all business logic, role-based authorization, rate limiting, and transactions.
- **Real-Time Communication Layer:** **Laravel Reverb WebSockets** paired with **Laravel Echo** to power sub-second live attendance tracking, coaching messaging, and administrative broadcasts.
- **Data Persistence Tier:** **MySQL RDBMS** with foreign key constraints, ACID transaction isolation, and Eloquent ORM indexing.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FORDAGO CLIENT MOBILE APP                          │
│             (Ionic Framework 8 + Angular 20 + TypeScript)                │
│                                                                         │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌────────────────┐ │
│  │ Biometric Auth (Bio) │  │ Camera QR Scanner   │  │ jsPDF Engine   │ │
│  └──────────┬───────────┘  └──────────┬──────────┘  └────────┬───────┘ │
└─────────────┼─────────────────────────┼──────────────────────┼──────────┘
              │                         │                      │
              ▼                         ▼                      │
   ┌────────────────────────────────────────────────┐          │
   │            CAPACITOR 8 NATIVE BRIDGE           │          │
   │     (Android Hardware / Camera / Haptics)      │          │
   └──────────────────────┬─────────────────────────┘          │
                          │                                    │
       HTTPS REST API     │             WSS WebSockets         │
       (Bearer Sanctum)   │             (Reverb / Echo)        │
                          ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      FORDAGO BACKEND API SERVER                         │
│                    (Laravel 12+ Framework / PHP 8.3)                    │
│                                                                         │
│  ┌──────────────────┐  ┌─────────────────────┐  ┌────────────────────┐  │
│  │ Laravel Sanctum  │  │ Laravel Reverb      │  │ SMS Gateway        │  │
│  │ Token Auth & RBAC│  │ Real-Time WS Server │  │ Semaphore / PhilSMS│  │
│  └────────┬─────────┘  └──────────┬──────────┘  └────────┬───────────┘  │
└───────────┼───────────────────────┼──────────────────────┼──────────────┘
            │                       │                      │
            └───────────────────────┼──────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE STORAGE                              │
│                      (MySQL Relational Database)                        │
│                                                                         │
│  • Users & RBAC Roles          • Attendance & QR Scans                  │
│  • Workouts & Coaching Plans   • Inventory & Cart Orders                │
│  • Announcements & Notices     • System Activity Audit Logs             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Tier (Mobile Application)

### 2.1 Core Framework & Language
* **Framework:** [Ionic Framework](https://ionicframework.com/) (Version 8.0+)
* **Application Framework:** [Angular](https://angular.dev/) (Version 20.3+)
* **Language:** TypeScript 5.9+ with strict typing
* **Styling Architecture:** Vanilla SCSS utilizing custom design tokens, modern HSL color curves, CSS Flexbox/Grid, and responsive typography.

### 2.2 Native Runtime & Device Hardware Bridge
* **Mobile Engine:** **Capacitor 8 (v8.3+)**
* **Target OS:** Android 8.0+ (API Level 26 to API Level 35) & iOS 14+
* **Biometric Hardware Authentication:** `@aparajita/capacitor-biometric-auth` (Version 10.0+)
  * Interfaces with Android BiometricPrompt and iOS LocalAuthentication for fingerprint and face recognition.
  * Tokens are encrypted and bound locally to device storage.
* **Optical Camera & QR Code Scanner:** `html5-qrcode` (Version 2.3+)
  * High-speed hardware camera feed with live frame analysis for Equipment lookup and Front-Desk Attendance check-ins.
  * Real-time dual validation (Front-desk dynamic daily QR and static equipment asset tags).
* **Hardware Haptics & Feedback:** `@capacitor/haptics`
  * Haptic vibration triggers on successful QR detection, error alerts, and key interactions.
* **Hardware Status Bar & Keyboard Control:** `@capacitor/status-bar`, `@capacitor/keyboard`
  * Adaptive keyboard avoidance and native notch/status bar theming.
* **Secure Client Storage:** `@capacitor/preferences`
  * Encrypted persistent device store for active tokens, user preferences, and biometric consent states.

### 2.3 Client-Side Utilities & Offline Services
* **PDF Report Generation:** `jspdf` (v4.2+) & `jspdf-autotable` (v5.0+)
  * Generates administrative audit reports (Attendance summaries, inventory stock audits, financial summaries) client-side without overloading backend resources.
* **Reactive State & Interceptors:** `rxjs` (v7.8+)
  * Angular HTTP Interceptor automatically injects `Authorization: Bearer <token>` and intercepts `401 Unauthorized` responses to redirect cleanly to login.

---

## 3. Backend & API Tier

### 3.1 Application Framework
* **Framework:** [Laravel](https://laravel.com/) (Version 12+ / 13+)
* **Runtime Language:** PHP 8.3+ (Strict typing, typed properties, match expressions)
* **Architecture Pattern:** Model-View-Controller (MVC) implemented as a stateless RESTful JSON API.

### 3.2 Authentication, Authorization & Security
* **Authentication Engine:** **Laravel Sanctum (v4.3+)**
  * Issues cryptographic Bearer API Tokens upon validated login or biometric token exchange.
  * Tokens are checked on every protected endpoint via the `auth:sanctum` middleware.
* **Password Hashing:** **Bcrypt** cryptographic algorithm with adaptive work factor (`BCRYPT_ROUNDS=10`).
* **Role-Based Access Control (RBAC):**
  * `super_admin`: Full system control, activity logs, financial reports, employee provisioning.
  * `admin`: Member verification, attendance validation, inventory management, notification center.
  * `coach`: Workout plan proposition, member progress tracking, direct coaching chat.
  * `member`: QR check-in, equipment guides, personal workout logs, inventory ordering, profile management.
* **Security Defenses & Middleware:**
  * **Rate Limiting:** Granular rate limits per IP/token to thwart brute-force and DDoS attacks.
  * **SQL Injection Immunity:** 100% parameter-bound queries via Laravel Eloquent ORM and PDO.
  * **XSS & Input Sanitization:** Form Request Validation strips malicious payloads prior to controller execution.
  * **Comprehensive Audit Trail:** `ActivityLog` model records actor ID, target entity, action type, IP address, and timestamps.

### 3.3 Real-Time WebSocket Infrastructure
* **WebSocket Server:** **Laravel Reverb (v1.11+)**
  * First-party, native PHP asynchronous WebSocket server optimized for high-concurrency event broadcasting.
* **Client WebSocket Driver:** **Laravel Echo** + **Pusher-JS (v8.6+)**
  * Subscribes to private and presence channels:
    * `attendance-channel`: Instant front-desk check-in updates.
    * `chat.{conversationId}`: Real-time coach-member workout consultation.
    * `broadcast-notifs`: Gym-wide announcements pushed instantly to active screens.

### 3.4 SMS Gateway Integration
* **Service Layer:** `SmsService`
* **Supported Gateways:** **Semaphore**, **PhilSMS**, and **Twilio**
* **Capabilities:** Automated SMS dispatch for OTP verification, membership expiry reminders, and emergency gym alerts.

---

## 4. Database Tier

* **RDBMS Engine:** **MySQL 8.0+**
* **ORM:** Laravel Eloquent (ActiveRecord pattern)
* **Design Standards:** 3rd Normal Form (3NF) normalization, strict foreign key constraints, composite indexing on high-frequency search fields (e.g. `email`, `scanned_at`, `status`).

### Key Schema Entities
| Table | Description |
| :--- | :--- |
| `users` | Member, coach, and admin credentials, roles, membership types, expiry, and biometric enrollment. |
| `attendances` | Check-in records, scanned timestamps, payment statuses (Cash/GCash/Online), and desk verification. |
| `equipment` | Gym machines and free weights, categories, maintenance statuses, photos, and guide links. |
| `products` & `orders` | Gym shop inventory items, stock tracking, order line-items, and pickup statuses. |
| `notifications` | Direct user notifications, membership alerts, and gym-wide broadcast announcements. |
| `activity_logs` | Tamper-evident administrative audit trail recording every significant system mutation. |
| `coaching_sessions` | Assigned coach-member workout regimes, schedules, and progress logs. |

---

## 5. Panel Evaluation Defense Guide (Q&A)

### Q1: "Why did you choose Ionic + Angular instead of building a native Java/Kotlin Android app?"
> **Answer:**  
> *"Building with Ionic Framework and Angular allows for a **Single Codebase, Cross-Platform Architecture**. Instead of writing and maintaining two separate codebases for Android and iOS, our application runs at native speed through Capacitor while ensuring 100% UI and business logic consistency. Capacitor bridges all critical native device features—specifically Biometric Fingerprint authentication and hardware Camera QR scanning—giving our users a native experience at a fraction of the development and maintenance overhead."*

### Q2: "Why Laravel instead of Node.js/Express for your backend?"
> **Answer:**  
> *"While Node.js is lightweight, Laravel provides an enterprise-ready, robust ecosystem out of the box. Specifically for a database-heavy management system like FordaGo, Laravel provides:  
> 1. **Laravel Sanctum** for battle-tested token security and RBAC.  
> 2. **Eloquent ORM** with built-in protection against SQL Injection and automated migrations.  
> 3. **Laravel Reverb**, which gave us our own high-performance WebSocket server without paying costly monthly fees for external WebSocket providers like Pusher."*

### Q3: "How is data security handled in the system?"
> **Answer:**  
> *"Security is implemented at every layer:  
> • **In Transit:** All communications use encrypted HTTPS endpoints and secure WSS WebSocket connections.  
> • **Authentication:** Handled through cryptographic Bearer tokens via Sanctum. Passwords are never stored in plaintext; they are hashed with adaptive Bcrypt.  
> • **Device Authentication:** Sensitive biometric authentication delegates verification to the hardware's secure enclave (`BiometricPrompt` on Android).  
> • **Auditability:** Every administrative action—such as creating an account, approving payments, or editing equipment—is logged with the user ID, timestamp, and IP address in our tamper-resistant `activity_logs` table."*

### Q4: "What makes FordaGo real-time?"
> **Answer:**  
> *"Rather than relying on continuous, battery-draining HTTP polling, FordaGo uses **Laravel Reverb with Laravel Echo over WebSockets**. When an attendance QR code is scanned or a coach sends a message, a backend event is broadcasted. Active clients receive the socket payload within milliseconds, immediately updating the UI without any manual screen refresh."*

---

## 6. Strategic Business & Evaluation Reviewer (Core Call Questions)

### Question 1: "How do you save data and what do you plan to do with that?"
* **How Data is Saved:**
  * **Relational Database (MySQL):** Data is saved in structured, normalized relational tables (Users, Attendances, Equipment, Inventory Products, Shop Orders, Coaching Sessions, Notifications, and Activity Logs).
  * **Security & Integrity:** Passwords use adaptive **Bcrypt** hashing. Client requests are authenticated via **Laravel Sanctum Bearer tokens**. Critical actions use ACID database transactions (`DB::transaction`) to avoid data corruption.
* **What We Plan to Do with the Data:**
  1. **Operational Automation:** Real-time QR attendance check-in, automated tracking of daily walk-ins vs. monthly premium passes, auto-expiry detection, and live inventory stock level updates.
  2. **Business Intelligence & Reporting:** Aggregating data into actionable reports (peak gym hours, daily revenue, member retention trends, and expiring passes) exported to PDF via jsPDF.
  3. **Personalized Member Progress:** Using workout completion logs to calculate user streaks and enable coaches to propose tailored workout routines based on historical attendance.

---

### Question 2: "Was this a unique project and what is the use case that you built on?"
* **The Core Use Case:**
  * Built specifically for local community fitness centers (**AffordaGym – San Isidro Branch**) that currently rely on manual paper logbooks, paper receipts, unmonitored daily pass fees, and disconnected communication between members and fitness coaches.
* **What Makes FordaGo Unique (Novelty & Value Proposition):**
  1. **All-in-One Community Gym Ecosystem:** Unlike generic fitness tracker apps (which only track reps) or standalone POS systems (which only track payments), FordaGo unifies **hardware check-in, gym equipment training, coaching consultations, and inventory commerce** into a single mobile app.
  2. **Dual-Function QR Architecture:**
     * *Front-Desk QR:* High-speed contactless attendance and payment verification.
     * *Equipment QR:* Optical tags pasted on machines that open step-by-step video/visual exercise guides and muscle group target instructions.
  3. **Hardware Biometric Security:** Members can securely authenticate via their device's native fingerprint/biometric scanner.
  4. **Direct Coach-Member Consultation:** Members receive workout plans and chat directly with gym-assigned coaches within the platform.

---

### Question 3: "Did you think about the marketing side?"
* **Yes, Built-in Growth, Retention & Marketing Strategy:**
  1. **Member Retention through Gamification:** Visual workout streak counters and milestone badges incentivize members to return consistently, reducing gym membership churn.
  2. **Direct Marketing & Broadcast Announcements:** Gym administrators can push gym-wide marketing announcements (seasonal discount promos, supplement sales, holiday hours, fitness challenges) directly to every member's smartphone.
  3. **Daily-to-Premium Conversion Funnel:** Walk-in members who scan the Daily Pass QR are prompted with the transparent benefits of upgrading to a monthly Premium Pass, boosting recurring gym revenue.
  4. **Dynamic Capacity Marketing:** Peak hour analytics help gym management launch off-peak discounts or happy-hour promos to balance gym traffic.

---

### Question 4: "Does this all have basic features like push notifications and how do you manage it?"
* **Yes, Comprehensive Notification System:**
  * **Technology Engine:** Integrated using **Firebase Cloud Messaging (FCM)**, **Capacitor Local Notifications**, and **Laravel Reverb WebSockets** for instant real-time delivery.
  * **How It Is Managed (Admin Notification Center):**
    1. **Broadcast Announcements:** One-click modal dispatch to broadcast announcements to all registered gym members at once.
    2. **Targeted Direct Notices:** Admins can select an individual member from a searchable list to send private notices (e.g., payment confirmations, order pickup alerts, account verification).
    3. **Automated Event Triggers:** The system automatically notifies members when their membership is about to expire, when a coach proposes a new workout plan, or when an inventory order status changes.
    4. **Notification Management Hub:** Full administrative interface to filter notifications by member account, search past broadcasts, mark all as read, and delete obsolete entries.

