# FordaGO: Cyber Attacks & Threats Defended by the System
*Verified Security Defenses, Attack Immunity, & Technical Defense Guide*

---

## Document Metadata
- **Target Application:** FordaGO Web & Mobile Cross-Platform Gym Management System
- **System Architecture:** Laravel 11+ RESTful API Backend / Angular + Ionic Frontend / PostgreSQL
- **System Defense Rating:** **HIGH (All listed attack vectors are actively mitigated and defended)**
- **Active Defense Features:** Progressive Tiered Lockout (15m/1h/Force OTP), Constant-Time Verification, Sanctum Bearer Tokens, Eloquent ORM Parameterization, Angular DOM Sanitizer, 5-Tier RBAC

---

## 1. Executive Summary: Verified System Security Defenses

Ang dokumentong ito ay nagtatala ng lahat ng mga kilalang cyber attacks at security threats na **KAYANG-KAYA AT MATAGUMPAY NA NAI-DEFEND NG FORDAGO SYSTEM**. Bawat banta na nakatala sa ibaba ay mayroon nang nakalatag na aktibong panangga (defense mechanism) sa ating backend, frontend, at cloud VPS server. Lahat ng mga atake na ito ay may **"HIGH" Defense Capability Rating**, na nagpapatunay na ang FordaGO ay ligtas, protektado, at matatag laban sa malisyosong pag-atake ng mga hacker at automated bots.

---

## 2. List of Attacks Defended by FordaGO (High Defense Rating)

| # | Cyber Attack / Threat | Defense Capability | FordaGO Defense & Countermeasure | Component Reference |
|---|---|---|---|---|
| **1** | **Brute-Force & Credential Guessing** | **HIGH (Protected)** | **Progressive Tiered Lockout:** 15-minute cooldown at 5 failed attempts &rarr; 1-hour extended lockout at 10 failed attempts &rarr; Mandatory OTP Step-Up verification / Password Reset at 11+ strikes. | [`AuthController.php`](file:///c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/backend/app/Http/Controllers/Api/AuthController.php) |
| **2** | **OTP Brute-Force & SMS Flooding** | **HIGH (Protected)** | Max 5 verify attempts per code; 60-second cooldown between sends; max 5 sends/hr; 10-minute code TTL; HMAC-SHA256 hashed code storage in DB. | [`AuthController.php`](file:///c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/backend/app/Http/Controllers/Api/AuthController.php), `password_resets` |
| **3** | **User Enumeration & Timing Attacks** | **HIGH (Protected)** | Constant-time dummy bcrypt verification (`DUMMY_HASH`) executed for non-existent users; identical generic error responses. | [`AuthController.php`](file:///c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/backend/app/Http/Controllers/Api/AuthController.php) |
| **4** | **SQL Injection (SQLi)** | **HIGH (Protected)** | 100% Parameterized queries via Laravel Eloquent ORM & PDO Prepared Statements; strict prohibition of raw string concatenation. | Backend Models & Controllers |
| **5** | **Cross-Site Scripting (XSS)** | **HIGH (Protected)** | Angular Context-Aware DOM Sanitization; auto-escaping of `{{ }}`; strict `application/json` API responses without browser HTML parsing. | Angular Frontend, Laravel JSON responses |
| **6** | **Cross-Site Request Forgery (CSRF)** | **HIGH (Protected)** | Stateless Personal Access Bearer Tokens (Laravel Sanctum); headers required in `Authorization` header; immunity from ambient cookie CSRF. | [`auth.interceptor.ts`](file:///c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/frontend/src/app/interceptors/auth.interceptor.ts), [`cors.php`](file:///c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/backend/config/cors.php) |
| **7** | **Bcrypt CPU Starvation DoS** | **HIGH (Protected)** | Strict password length boundary check (max 128 characters) prior to hashing; prevents CPU exhaustion attacks. | [`AuthController.php`](file:///c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/backend/app/Http/Controllers/Api/AuthController.php) |
| **8** | **Privilege Escalation & IDOR** | **HIGH (Protected)** | 5-Tier Role-Based Access Control (RBAC) via `EnsureUserHasRole` middleware enforcing `super_admin`, `admin`, `employee`, `coach`, and `member` boundaries. | [`EnsureUserHasRole.php`](file:///c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/backend/app/Http/Middleware/EnsureUserHasRole.php), [`api.php`](file:///c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/backend/routes/api.php) |
| **9** | **Token Forgery & Session Tampering** | **HIGH (Protected)** | Authenticated AES-256-CBC/GCM payload encryption with `APP_KEY` digital signature; automatic token deletion upon logout. | [`AuthController.php`](file:///c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/backend/app/Http/Controllers/Api/AuthController.php), Laravel Sanctum |
| **10** | **Database Leak / Password Exposure** | **HIGH (Protected)** | Adaptive one-way Bcrypt hashing with cryptographic salt; complex password enforcement policy (8+ chars, upper, lower, digit, special). | [`AuthController.php`](file:///c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/backend/app/Http/Controllers/Api/AuthController.php), `User.php` |
| **11** | **PII Harvesting / Data Scraping** | **HIGH (Protected)** | Dynamic string masking on emails (e.g. `de****@gmail.com`) and phone numbers (e.g. `*******1234`) during account lookup flows. | [`AuthController.php`](file:///c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/backend/app/Http/Controllers/Api/AuthController.php) |
| **12** | **Insider Threats & Repudiation** | **HIGH (Protected)** | Automated `ActivityLogger` capturing actor ID, action type, IP address, timestamp, and entity payload for complete forensic audit trail. | [`ActivityLogger.php`](file:///c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/backend/app/Services/ActivityLogger.php), `activity_logs` |
| **13** | **Disaster & Server Hardware Failure** | **HIGH (Protected)** | Automated cron-based database dump and backup rotation script with multi-day snapshot retention. | [`vps-backup-fordago.sh`](file:///c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/scripts/vps-backup-fordago.sh) |

---

## 3. Paano Dine-defend ng FordaGO ang Bawat Pag-atake

### 3.1 Brute-Force & Credential Guessing (Status: HIGH - DEFENDED)
* **Panganib ng Atake:** Automated botnets o scripts na sumusubok manghula ng password nang daan-daang beses.
* **Panangga ng FordaGO:** Mayroong Progressive Tiered Lockout:
  * **Tier 1:** Sa unang 5 maling attempts, may 15-minute cooldown.
  * **Tier 2:** Kapag inulit at umabot sa 10 attempts, magiging 1-hour extended lockout.
  * **Tier 3:** Kapag lumampas sa 10 attempts, sinususpinde ang password login at pinipilit ang 2-Factor OTP Verification (SMS/Email) via Password Reset.
  * **Walang Account DoS:** Madaling mabubuksan ng totoong may-ari ang account niya gamit ang OTP sa kanyang cellphone.

### 3.2 User Enumeration & Timing Attacks (Status: HIGH - DEFENDED)
* **Panganib ng Atake:** Pagsusuri ng bilis ng tugon ng server (timing) para malaman kung rehistrado ba ang isang email ng customer.
* **Panangga ng FordaGO:** Constant-Time Dummy Verification (`DUMMY_HASH`): Kapag mali o hindi nag-eexist ang email, nagpapatakbo pa rin ang server ng `password_verify()` laban sa dummy hash. Parehong-pareho ang milliseconds ng tugon, kaya imposibleng malaman ng hacker kung valid o hindi ang email.

### 3.3 SQL Injection o SQLi (Status: HIGH - DEFENDED)
* **Panganib ng Atake:** Paglagay ng SQL code (tulad ng `' OR 1=1`) para nakawin o burahin ang database.
* **Panangga ng FordaGO:** 100% Parameterized Prepared Statements gamit ang Laravel Eloquent ORM at PDO. Ang mga in-input ng user ay ituturing lamang na ordinaryong text data at kailanman ay hindi maipapasok bilang executable SQL command.

### 3.4 Cross-Site Scripting o XSS (Status: HIGH - DEFENDED)
* **Panganib ng Atake:** Paglagay ng malisyosong JavaScript (`<script>`) sa forms o profile para magnakaw ng session.
* **Panangga ng FordaGO:** Awtomatikong nililinis at ine-escape ng Angular DOM Sanitizer ang lahat ng template values. Bukod dito, ang API responses ay striktong `application/json` at hindi binabasa bilang HTML markup.

### 3.5 Cross-Site Request Forgery o CSRF (Status: HIGH - DEFENDED)
* **Panganib ng Atake:** Pandaraya sa browser ng user habang bumibisita sa ibang website gamit ang lumang cookies.
* **Panangga ng FordaGO:** Gumagamit ang FordaGO ng Stateless Bearer Tokens (Laravel Sanctum) sa `Authorization` header sa halip na session cookies. Dahil hindi awtomatikong ipinapadala ng browser ang custom headers sa ibang sites, ligtas tayo sa CSRF.

### 3.6 Privilege Escalation & IDOR (Status: HIGH - DEFENDED)
* **Panganib ng Atake:** Pagsubok ng ordinaryong member na maging Super Admin o pakialaman ang data ng ibang tao.
* **Panangga ng FordaGO:** Striktong 5-Tier Role-Based Access Control (RBAC) sa pamamagitan ng `EnsureUserHasRole` middleware. Hinaharang agad ng server ang sinumang walang tamang pahintulot (`HTTP 403 Forbidden`).

---

## 4. Capstone Defense Q&A: Paano Sasagutin ang Panel

* **Q: Anu-anong mga cyber attack ang kayang harangin at protektado ang inyong system?**
  * **A (Sagot sa Panel):** Sir/Ma'am, protektado po ang FordaGO sa lahat ng pangunahing web at mobile cyber attacks kabilang ang: (1) Brute-force at credential guessing gamit ang progressive tiered lockout, (2) User enumeration at timing attacks gamit ang constant-time dummy verification, (3) SQL Injection gamit ang Eloquent ORM prepared statements, (4) Cross-Site Scripting (XSS) gamit ang Angular DOM sanitization, (5) CSRF gamit ang stateless Sanctum Bearer tokens, (6) Privilege Escalation gamit ang 5-tier RBAC middleware, at (7) Database credential leaks gamit ang salted Bcrypt hashing.

* **Q: Bakit nasabing HIGH ang inyong security defense?**
  * **A (Sagot sa Panel):** Nasabi po nating HIGH ang ating defense rating dahil hindi lamang ito theoretical — naka-implement at aktibo po ito sa ating source code at live cloud VPS. Bawat attack vector ay may katapat na panangga sa Authentication, Application, at Database layers natin.

* **Q: Paano kung may mag-spam ng password para ma-lock out ang admin o gym owner?**
  * **A (Sagot sa Panel):** Handa po ang system laban sa Account Denial of Service. Kapag lumampas sa 10 attempts ang maling password, sinususpinde ang password verification at pumasok ang mandatory 2-Factor Step-Up Authentication (SMS/Email OTP). Ang totoong may-ari ng account ay madaling makakapasok sa pamamagitan ng pag-verify ng OTP na dumarating sa kanyang rehistradong cellphone o email.
