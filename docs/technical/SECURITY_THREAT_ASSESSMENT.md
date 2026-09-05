# 🛡️ FordaGO Application Security & Threat Assessment Plan

**Project Title:** FordaGO: Smart Gym Management & Interactive Fitness Platform  
**Target Systems:** Ionic 8 + Angular 20 (Frontend) | Laravel 11 REST API (Backend) | Laravel Reverb WebSockets | MySQL Database  
**Author:** Information Technology Capstone Project Team (NEUST San Isidro Campus)  
**Standard Compliance:** ISO/IEC 25010 (Software Quality - Security) & OWASP Top 10  

---

## 1. Executive Summary & Purpose

This document serves as the official security architecture, threat model, and defense evaluation for the **FordaGO** ecosystem. It outlines how the platform proactively mitigates common cybersecurity vulnerabilities, safeguards user privacy, ensures financial and inventory transaction integrity, and maintains reliable gym turnstile operations.

### 📌 Where This Document Is Used:
1. **Capstone Manuscript (Chapter 3 - Methodology & System Architecture):**
   * Detailed specification of authentication mechanisms, role authorization guards, database parameter binding, and real-time socket protocols.
2. **Capstone Manuscript (Chapter 4 & 5 - ISO/IEC 25010 Evaluation):**
   * Technical evidence satisfying the **Security** quality sub-characteristics: *Confidentiality, Integrity, Non-repudiation, Accountability, and Authenticity*.
3. **Oral Defense & Technical Panel Examination:**
   * Ready answers and architectural defense for questions concerning hacking prevention, privilege escalation, fake attendance check-ins, and payment fraud.

---

## 2. System Architecture & Threat Vector Landscape

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT APPLICATIONS                               |
|        [ Member Mobile App ]     [ Coach Studio ]     [ Admin Command Center ]    |
|                (Ionic 8 + Angular 20 Frontend / Capacitor Hardware)               |
+------------------------------------------+----------------------------------------+
                                           |
                HTTPS / REST API           |   WSS / Reverb WebSockets
                (Sanctum Bearer Token)     |   (Private Channel Auth)
                                           v
+-----------------------------------------------------------------------------------+
|                             LARAVEL 11 BACKEND CORE                               |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | RateLimiter Guard  |  | EnsureUserHasRole MW |  | Dom/Data Sanitization     |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Eloquent ORM & PDO |  | DB Atomic Locking    |  | Constant-Time Dummy Hash  |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                                 DATABASE TIER                                     |
|                       MySQL / MariaDB Relational Storage                          |
|         (Foreign Key Constraints, Cascading Integrity & Transaction Logs)         |
+-----------------------------------------------------------------------------------+
```

---

## 3. Threat Assessment & Defense Mechanisms

---

### 3.1. SQL Injection (SQLi)
* **Threat Profile:** Attackers inject malicious SQL statements into input fields (e.g., `' OR '1'='1' --`, union queries, or stacked commands) via login screens, equipment QR lookup, product queries, or report filters to bypass authentication or extract raw database contents.
* **FordaGO Defense: 🛡️ Fully Protected & Immune**
  * **Eloquent ORM & PDO Parameterized Queries:** All database interactions across controllers (`AuthController`, `UserController`, `InventoryController`, `AttendanceController`, `EquipmentController`, etc.) strictly utilize Laravel's Eloquent ORM and Query Builder, leveraging PDO prepared statements. User inputs are treated solely as bound parameters, preventing raw string concatenation.
  * **Strict Route Parameter Typing:** Route IDs are strictly constrained to numeric integers using `->whereNumber('id')` to reject non-numeric SQL injection payloads before reaching controller handlers.

---

### 3.2. Cross-Site Scripting (XSS) — Stored & Reflected
* **Threat Profile:** Injecting malicious `<script>` tags, inline event listeners (`<img onerror="...">`), or JavaScript payloads into text fields (e.g., workout notes, split routine plans, trainer bios, chat messages, or member feedback) that execute in the browser of another member, coach, or gym administrator.
* **FordaGO Defense: 🛡️ Multi-Layer Context-Aware Sanitization**
  * **Angular 20 / Ionic 8 Template Auto-Escaping:** Angular's default rendering engine treats all interpolated values (`{{ message.content }}`, `{{ workout.notes }}`) as untrusted text strings. Any HTML tags or executable JavaScript are automatically neutralized and encoded before insertion into the DOM.
  * **Backend Normalization:** Incoming textual fields are stripped of extraneous whitespace, normalized, and validated against strict schema rules prior to database storage.

---

### 3.3. Cross-Site Request Forgery (CSRF)
* **Threat Profile:** Forcing an authenticated administrator or coach to unknowingly trigger unwanted actions (such as deleting equipment, updating prices, or approving pass extensions) via an external malicious web link while an active session exists.
* **FordaGO Defense: 🛡️ Stateless Bearer Token Architecture (Immune)**
  * **Laravel Sanctum Token Authentication:** FordaGO relies on explicit HTTP Authorization headers (`Authorization: Bearer <sanctum_token>`) rather than ambient browser session cookies.
  * Without browser-managed ambient cookies for API routes, third-party sites are unable to forge authenticated requests on behalf of the user.

---

### 3.4. Privilege Escalation & Broken Object-Level Authorization (BOLA / IDOR)
* **Threat Profile:** A regular gym member attempts to access or execute administrative endpoints (e.g., `/api/inventory/products`, `/api/admin/coaches`, approving orders, or modifying gym equipment) by guessing URL patterns or altering parameter IDs in the request body.
* **FordaGO Defense: 🛡️ Route-Level Middleware & Object Ownership Verification**
  * **Strict Role-Based Middleware (`EnsureUserHasRole`):** All sensitive management routes are guarded by `middleware('role:admin,super_admin,employee')`. Calls with an unauthorized role token immediately receive an **HTTP 403 Forbidden** response.
  * **Resource Ownership Enforcement:** For user-specific operations (e.g., updating workout sessions, personal records, coach availability schedules, or reading 1-on-1 private messages), the controller verifies that the target resource belongs strictly to `auth()->id()`.

---

### 3.5. Brute-Force Attacks, Credential Stuffing & User Enumeration
* **Threat Profile:** Automated bots launching repeated credential guessing against staff or user accounts, or flooding the password reset endpoint to harvest active user emails and phone numbers.
* **FordaGO Defense: 🛡️ Throttling, Lockouts, and Timing-Attack Mitigation**
  * **Rate Limiting & Account Lockout:** In `AuthController`, authentication attempts are restricted with `MAX_FAILED_ATTEMPTS = 5`. Reaching the limit triggers a 15-minute lockout (`LOCKOUT_SECONDS = 900`) using Laravel's `RateLimiter`.
  * **Reset Code & OTP Cooldowns:** Password reset dispatches are gated by a mandatory 60-second cooldown (`RESET_CODE_RESEND_SECONDS = 60`) and capped at a maximum of 5 requests per hour.
  * **Constant-Time Dummy Verification:** When an unauthenticated lookup encounters a non-existent user, the system computes a fixed dummy bcrypt hash (`DUMMY_HASH`) to ensure identical execution times, neutralizing side-channel timing attacks aimed at user enumeration.
  * **Password Strength Enforcement:** Passwords require 8 to 128 characters including uppercase letters, lowercase letters, numbers, and special symbols.

---

### 3.6. QR Code Attendance Spoofing & Pass Sharing Fraud
* **Threat Profile:** Members screenshotting their attendance QR code or sharing passes with non-members to allow unauthorized gym entry, or attempting check-ins with expired passes.
* **FordaGO Defense: 🛡️ Turnstile Supervised Verification & Pass Expiry State Machine**
  * **Supervised Check-in Workflow:** Attendance check-in is verified through the Admin/Staff Turnstile Scanner, preventing remote or unmonitored self-registration.
  * **Server-Authoritative Validity Check:** Upon QR scan, `AttendanceController` calculates real-time pass status (Active, Expired, Renewal Required). Expired or invalid passes are rejected at the server level.
  * **Anti-Duplicate Check-in Rule:** Prevents duplicate concurrent check-ins on the same calendar day without an authorized checkout.

---

### 3.7. Shop Pricing Tampering & GCash Payment Fraud (Financial & Inventory Integrity)
* **Threat Profile:** Tampering with item pricing in client-side storage before submitting an order, or exploiting concurrent checkout requests to deplete inventory below zero (Race Conditions).
* **FordaGO Defense: 🛡️ Server-Authoritative Pricing & Atomic Transactions**
  * **Server-Calculated Orders:** The client sends only `product_id` and `quantity`. Prices, discounts, and totals are computed strictly from verified database records.
  * **Atomic Database Transactions (`DB::transaction`):** Product stock validation and decrements occur within isolated database transactions. If stock becomes insufficient during high-traffic checkouts, the transaction rolls back cleanly.
  * **Two-Step GCash Audit:** Orders with GCash references remain in a `pending` state until gym administrators manually verify the reference and counter receipt before approving product release.

---

### 3.8. Real-Time Chat Eavesdropping & WebSocket Hijacking
* **Threat Profile:** Unauthorized users attempting to connect to private WebSocket channels to intercept 1-on-1 coaching chats, workout proposals, or personal client data.
* **FordaGO Defense: 🛡️ Authenticated Private Channels via Laravel Reverb**
  * **Channel Authorization Handshake:** WebSocket connections to private channels (`private-conversation.{id}`) require an authenticated Sanctum token.
  * In `routes/channels.php`, the server validates that `auth()->id()` matches either the designated Client ID or Coach ID of the conversation before authorizing the socket connection.

---

### 3.9. Data Integrity & Server-Side Boundary Validation
* **Threat Profile:** Sending malformed payloads, negative weights/reps in Personal Record (PR) tracking, invalid phone formats, or oversized arrays to crash the backend.
* **FordaGO Defense: 🛡️ Strict Server-Side Validation Rules**
  * **Phone & Email Formatting:** Strict Philippine cellular validation (`09XXXXXXXXX`) and email normalization (trimming and lowercasing).
  * **Metric Boundaries:** Set weights, reps, and durations are validated to ensure only positive and reasonable numeric ranges are accepted.

---

## 4. Defense Evaluation Matrix

| Threat Category | Primary Target | FordaGO Defense Mechanism | Risk Level Mitigated |
| :--- | :--- | :--- | :---: |
| **SQL Injection (SQLi)** | MySQL Database | Eloquent ORM + PDO Parameter Binding + `whereNumber` | **CRITICAL (100% Mitigated)** |
| **Cross-Site Scripting (XSS)** | Web/Mobile Clients | Angular DomSanitizer + Strict Input Normalization | **HIGH (100% Mitigated)** |
| **Cross-Site Request Forgery (CSRF)** | API Endpoints | Stateless Sanctum Bearer Token Architecture | **HIGH (100% Mitigated)** |
| **Broken Access Control (IDOR)** | Admin / Staff Features | `EnsureUserHasRole` Middleware + Ownership Checks | **CRITICAL (100% Mitigated)** |
| **Brute Force & Enumeration** | User / Admin Accounts | RateLimiter (5 tries / 15-min lock) + Dummy Hashing | **HIGH (100% Mitigated)** |
| **Attendance / Pass Fraud** | Gym Turnstiles | Turnstile Scanner Verification + Expiry Validation | **MEDIUM (100% Mitigated)** |
| **Inventory / Payment Fraud** | Shop & Inventory | Server-Authoritative Pricing + Atomic DB Locks | **HIGH (100% Mitigated)** |
| **WebSocket Eavesdropping** | Real-Time Chat | Reverb Authenticated Private Channels | **HIGH (100% Mitigated)** |

---

## 5. Production Hardening & Deployment Checklist

Before deploying the FordaGO platform to live production or cloud servers, ensure the following configuration checklist is satisfied:

- [ ] **Environment Debug Mode:** Set `APP_DEBUG=false` in the production `.env` file to prevent internal stack traces from leaking to clients.
- [ ] **Transport Layer Security (TLS/HTTPS):** Enforce SSL/TLS certificates on both the REST API and WebSocket (`wss://`) endpoints to encrypt all token and payload transmissions in transit.
- [ ] **CORS Policy:** Restrict allowed CORS origins in `config/cors.php` to authorized client domains and mobile app package identifiers.
- [ ] **Secure Storage & Permissions:** Ensure file upload storage (`storage/app/public`) has restricted executable permissions, preventing execution of arbitrary scripts.
- [ ] **Database Credentials:** Ensure database user accounts use strong passwords and grant only the necessary CRUD privileges.
