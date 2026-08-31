# FordaGO: Mobile-Based Gym Database Management System for AFFORDA Gym – Cabiao Branch

**A Capstone Project Proposal**

**Researchers / Group Members:**
* BERNALDO, CARL ANDREW B.
* GALANG, DELWIN F.
* JAVIER, JAYLEE T.
* MEDINA, ETHAN JEROME G.
* PONGCO, RYZA MAE M.

**Academic Program & Institution:**
Bachelor of Science in Information Technology  
College of Information and Communications Technology  
Nueva Ecija University of Science and Technology (NEUST)  
San Isidro Campus, San Isidro, Nueva Ecija  

---

# CHAPTER III: RESULTS AND DISCUSSIONS

This chapter presents the comprehensive results, technical outcomes, and empirical findings obtained from the design, development, and evaluation of **FordaGO: Mobile-Based Gym Database Management System for AFFORDA Gym – Cabiao Branch**. It details the execution of the Agile Software Development Life Cycle (SDLC), the complete system models (Use Case, Context Diagrams, Normalization, ERD, and Data Dictionary), and the statistical analysis of the software quality evaluation based on the ISO/IEC 25010 standard administered to IT experts, gym staff, coaches, and members.

---

## 1. Development of FordaGO: Mobile-Based Gym Database Management System for AFFORDA Gym – Cabiao Branch

The design and development of the FordaGO system followed the structured stages of the Agile System Development Life Cycle (SDLC), ensuring that all functional, technical, and operational requirements of AFFORDA Gym – Cabiao Branch were systematically implemented and verified.

---

### 1.1. Planning Phase

The planning phase established the foundational scope, feasibility, and technical direction of the FordaGO project. The researchers conducted preliminary site visits, workflow evaluations, and stakeholder consultations at **AFFORDA Gym – Cabiao Branch** in Cabiao, Nueva Ecija.

#### Problem Identification and Feasibility
The investigation confirmed that the gym was experiencing severe operational delays due to manual paper logbooks for attendance tracking, difficulty in tracking membership pass expirations, absence of on-demand equipment orientation for beginner gym members, manual supplement inventory tracking, and lack of a structured digital channel connecting personal trainers and trainees.

The technical, operational, and economic feasibility of the proposed mobile-based solution was established:
* **Technical Feasibility:** Modern smartphones equipped with cameras and web browsers provide the necessary hardware environment for optical QR code scanning, real-time WebSocket communication, and responsive mobile interfaces without requiring expensive specialized hardware.
* **Operational Feasibility:** Gym staff, personal trainers, and members expressed strong readiness to adopt a mobile application that simplifies daily check-in, routine management, supplement ordering, and coaching consultations.
* **Economic Feasibility:** Eliminating physical paper ledgers and automating inventory records prevents revenue leakage, reduces administrative supply costs, and maximizes staff efficiency.

#### Resource Allocation and Risk Management
The researchers identified the necessary software tools (Laravel 11, Ionic 8, Angular, MySQL, Laravel Reverb, Visual Studio Code), hardware assets (mobile Android devices, PC workstations, and local wireless networking equipment), and potential deployment risks. Mitigation strategies included implementing offline cached UI views for temporary network drops, Bcrypt encryption and Sanctum token guards for data security, and conducting user onboarding orientations.

#### Project Schedule and Timeline
The project was structured across a 20-week (5-month) timeline following the Agile SDLC framework.

<p align="center"><b>Table 1.</b> <i>Gantt Chart of Activities for the Development of FordaGO</i></p>

| Activities | Month 1 (Aug) | Month 2 (Sep) | Month 3 (Oct) | Month 4 (Nov) | Month 5 (Dec) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Requirements Gathering & Planning** | [██████] | | | | |
| **2. Architectural & Database Design** | | [██████] | | | |
| **3. Full-Stack System Development** | | [██████] | [██████] | | |
| **4. Integration & System Testing** | | | [██████] | [██████] | |
| **5. Pilot Deployment & User Training** | | | | [██████] | |
| **6. ISO 25010 Evaluation & Data Analysis**| | | | [██████] | [██████] |
| **7. Final Documentation & Defense** | | | | | [██████] |

---

### 1.2. Designing Phase

The designing phase transformed the functional requirements gathered during planning into technical architecture diagrams, entity-relationship models, process flows, and user interface wireframes.

#### System Architecture
The system architecture follows a decoupled **Client-Server Model** consisting of:
1. **Presentation Layer (Frontend):** Cross-platform mobile and web client engineered in **Ionic 8 + Angular** with standalone components, SCSS styling, and Capacitor native camera plugins.
2. **Application Logic Layer (Backend):** **Laravel 11 (PHP 8.2+)** RESTful API server implementing MVC design patterns, Eloquent ORM, and Sanctum token middleware.
3. **Real-Time Communication Layer:** **Laravel Reverb WebSocket Server** integrated with Laravel Echo for instant duplex messaging, live typing status, and proposal notifications.
4. **Data Persistence Layer:** **MySQL 8.0** relational database management system enforcing foreign key referential integrity and atomic transaction processing.

| Layer / Tier | Core Technology & Framework | Architectural Role & Responsibilities |
| :--- | :--- | :--- |
| **Presentation Tier (Frontend)** | **Ionic 8 + Angular** *(TypeScript, SCSS)* | Cross-platform responsive client, Member Mobile Portal, Coach Studio, Admin Web/Mobile Hub, Capacitor Camera plugin |
| **Application Tier (Backend API)** | **Laravel 11 RESTful API** *(PHP 8.2+)* | Business logic controllers, Eloquent ORM, Sanctum token authentication, RBAC middleware guards, vector PDF/Excel engine |
| **Real-Time Communication Tier** | **Laravel Reverb WebSocket Server** | High-throughput duplex WebSocket channels (Port 8080), instant chat broadcasting, live typing status, real-time proposal alerts |
| **Data Persistence Tier (Database)** | **MySQL 8.0 Relational DB** | 3NF normalized tables (`users`, `memberships`, `attendances`, `equipment`, `products`, `orders`), ACID transaction compliance |
<p align="center"><b>Figure 5.</b> <i>FordaGO Full-Stack Architectural Framework</i></p>

---

#### Use Case Diagram
The Use Case Diagram illustrates the functional capabilities available to the three primary actors: **Gym Member**, **Gym Coach**, and **Gym Administrator / Front-Desk Staff**.

| Functional Capability / Use Case | Gym Member | Gym Coach | Gym Administrator / Staff |
| :--- | :---: | :---: | :---: |
| **Account Login & Sanctum Token Auth** | ✓ | ✓ | ✓ |
| **Optical QR Attendance Check-In** | ✓ | — | — |
| **Digital Camera Turnstile Verification** | — | — | ✓ |
| **Scan Equipment QR & View Muscle Guides** | ✓ | — | — |
| **Log Personal Records (PR) & Split Plans** | ✓ | — | — |
| **Browse Supplements & Cart Checkout** | ✓ | — | — |
| **1-on-1 Real-Time WebSocket Chat** | ✓ | ✓ | — |
| **Create & Propose In-Chat Workout Plans** | — | ✓ | — |
| **Manage Availability Slots & Group Classes** | — | ✓ | — |
| **Verify Membership Passes & Renewals** | — | — | ✓ |
| **Supplement POS & GCash Stock Audit** | — | — | ✓ |
| **Generate & Print Equipment Placard QRs** | — | — | ✓ |
| **Export Dynamic PDF / Excel Business Reports** | — | — | ✓ |
<p align="center"><b>Figure 6.</b> <i>Use Case Diagram of FordaGO</i></p>

---

#### Context Diagrams (Level 0 and Level 1)

##### Context Diagram Level 0
The Level 0 Context Diagram establishes the global boundary of FordaGO, illustrating data input and information feedback between the system and its primary external entities.

| External Entity | Primary Data Inputs to FordaGO | Information Outputs from FordaGO |
| :--- | :--- | :--- |
| **Gym Member** | Login credentials, attendance QR scans, supplement orders, PR metrics, chat messages | Check-in confirmations, exercise guides, routine schedules, coaching proposals, order invoices |
| **Gym Coach** | Login credentials, class schedules, weekly availability slots, workout proposals | Trainee consultation inquiries, booking rosters, direct chat messages, earnings insights |
| **Gym Administrator / Staff** | Admin credentials, command overrides, pass approvals, product stock updates, equipment specs | Real-time traffic summaries, turnstile scan logs, sales & inventory audits, PDF/Excel reports |
<p align="center"><b>Figure 7.</b> <i>Context Diagram Level 0 of FordaGO</i></p>

---

##### Context Diagram Level 1 (Data Flow Diagram)
The Level 1 Diagram decomposes the system into its primary functional subprocesses and database stores.

| Process ID | Functional Subprocess | Primary Input Entity | Target Database Store | Key Generated Output |
| :---: | :--- | :--- | :--- | :--- |
| **1.0** | **Authentication & Authorization** | All User Roles | `users` | Sanctum Bearer Tokens & Secure Sessions |
| **2.0** | **QR Turnstile Attendance** | Member / Admin Turnstile | `attendances` | Confirmed Attendance Stamp & Traffic Logs |
| **3.0** | **Equipment QR Information** | Member Camera Sensor | `equipment` | Targeted Muscle Diagram & Step Guide |
| **4.0** | **PR & Split Routine Planner** | Member | `personal_records`, `workout_splits` | Strength Milestone Metrics & Workout Routine |
| **5.0** | **WebSocket Chat & Proposals** | Member / Coach | `chat_messages`, `workout_proposals` | Instant Message Broadcast & 1-Tap Accept |
| **6.0** | **Supplement POS & Inventory** | Member / Admin Staff | `products`, `orders`, `order_items` | Verified GCash Receipt & Atomic Stock Deduct |
| **7.0** | **PDF / Excel Export Engine** | Admin Staff | Aggregated Relational Queries | Dynamic Vector PDF & CSV/Excel Spreadsheets |
<p align="center"><b>Figure 8.</b> <i>Context Diagram Level 1 (Data Flow Diagram) of FordaGO</i></p>

---

### 1.3. Development Phase

In the development phase, the blueprints, schemas, and interface models were translated into functional source code.

#### Implementation Tools and Development Stack
* **Programming Languages & Frameworks:** PHP 8.2+ (Laravel 11), TypeScript / JavaScript (Angular, Ionic 8), SCSS, SQL.
* **Integrated Development Environment (IDE):** Visual Studio Code with PHP Intelephense, Angular Language Service, and Docker extensions.
* **Database & Server Environment:** MySQL 8.0 Community Server managed via Laravel Migrations and Eloquent ORM.
* **Real-Time WebSockets Engine:** Laravel Reverb running on dedicated WebSocket port `8080` with continuous event broadcasting.
* **Mobile Runtime & Camera Access:** Capacitor Native Core with Barcode Scanner and Camera plugins.

---

#### Database Normalization
To ensure high data integrity, minimize redundancy, and preserve transactional consistency, database normalization was applied through the fundamental normal forms (1NF, 2NF, and 3NF).

##### 1. Unnormalized Form (UNF)
In the unnormalized state, all attributes across users, attendance check-ins, memberships, workout routines, coaching proposals, products, and supplement orders were represented in a single flat structure with multivalued and repeating groups.

> **UNNORMALIZED DATA ATTRIBUTES (UNF):**
> 
> `user_id`, `first_name`, `last_name`, `email`, `password`, `role`, `contact_number`, `membership_type`, `membership_start`, `membership_expiry`, `membership_status`, `attendance_id`, `attendance_date`, `check_in_time`, `check_in_status`, `equipment_id`, `equipment_name`, `equipment_category`, `muscle_group`, `media_url`, `pr_id`, `exercise_name`, `max_weight`, `reps`, `pr_date`, `workout_id`, `split_day`, `target_duration`, `routine_details`, `coach_id`, `coach_specialty`, `coach_rate`, `availability_schedule`, `proposal_id`, `proposal_title`, `proposal_price`, `proposal_status`, `proposal_date`, `conversation_id`, `sender_id`, `receiver_id`, `message_text`, `message_timestamp`, `product_id`, `product_name`, `product_category`, `price`, `stock_quantity`, `order_id`, `order_date`, `payment_method`, `gcash_reference`, `order_total`, `order_status`

##### 2. First Normal Form (1NF)
All multivalued attributes and repeating groups were eliminated. Atomic column structures were defined, and unique primary keys were designated for each distinct table.

| Relation / Table Entity | Primary Key (PK) | Atomic Column Schema (1NF) |
| :--- | :---: | :--- |
| **`users`** | `user_id` | `first_name`, `last_name`, `email`, `password`, `role`, `contact_number`, `created_at` |
| **`memberships`** | `membership_id` | `user_id`, `type`, `start_date`, `end_date`, `status`, `price` |
| **`attendances`** | `attendance_id` | `user_id`, `date`, `check_in_time`, `status` |
| **`equipment`** | `equipment_id` | `name`, `category`, `target_muscle`, `media_url`, `status` |
| **`personal_records`** | `pr_id` | `user_id`, `exercise_name`, `weight`, `reps`, `record_date` |
| **`workout_splits`** | `workout_id` | `user_id`, `day_of_week`, `duration_minutes`, `routine_json` |
| **`coach_profiles`** | `coach_id` | `user_id`, `specialty`, `hourly_rate`, `bio`, `availability_json` |
| **`workout_proposals`** | `proposal_id` | `coach_id`, `member_id`, `title`, `price`, `routine_json`, `status` |
| **`chat_messages`** | `message_id` | `conversation_id`, `sender_id`, `message_text`, `created_at` |
| **`products`** | `product_id` | `name`, `category`, `price`, `stock_quantity`, `image_url` |
| **`orders`** | `order_id` | `user_id`, `total_amount`, `payment_method`, `gcash_ref`, `status`, `created_at` |
| **`order_items`** | `item_id` | `order_id`, `product_id`, `quantity`, `unit_price`, `subtotal` |

##### 3. Second Normal Form (2NF)
Partial functional dependencies were removed. All non-key attributes were made fully functionally dependent on the entire primary key of their respective tables.

##### 4. Third Normal Form (3NF)
Transitive dependencies were removed. Non-key attributes depend solely and directly on the primary key, preventing update, insertion, and deletion anomalies.

| Table Name | Primary Key | Foreign Keys & Core Columns |
| :--- | :--- | :--- |
| **`users`** | `user_id` (PK) | `first_name`, `last_name`, `email`, `password` *(Bcrypt)*, `role`, `contact_number`, `fcm_token` |
| **`memberships`** | `membership_id` (PK) | `user_id` *(FK ➔ `users`)*, `pass_type`, `start_date`, `end_date`, `status`, `price_paid` |
| **`attendances`** | `attendance_id` (PK) | `user_id` *(FK ➔ `users`)*, `check_in_date`, `check_in_time`, `status` |
| **`equipment`** | `equipment_id` (PK) | `name`, `category`, `target_muscle`, `media_url`, `qr_code_identifier`, `status` |
| **`personal_records`** | `pr_id` (PK) | `user_id` *(FK ➔ `users`)*, `exercise_name`, `weight_kg`, `reps`, `record_date` |
| **`workout_splits`** | `workout_id` (PK) | `user_id` *(FK ➔ `users`)*, `day_of_week`, `target_duration`, `routine_details` *(JSON)* |
| **`workout_proposals`** | `proposal_id` (PK) | `coach_id` *(FK ➔ `users`)*, `member_id` *(FK ➔ `users`)*, `title`, `price`, `routine_json`, `status` |
| **`chat_messages`** | `message_id` (PK) | `conversation_id`, `sender_id` *(FK ➔ `users`)*, `message_text`, `created_at` |
| **`products`** | `product_id` (PK) | `name`, `category`, `price`, `stock_quantity`, `image_url`, `status` |
| **`orders`** | `order_id` (PK) | `user_id` *(FK ➔ `users`)*, `total_amount`, `payment_method`, `gcash_reference`, `status` |
| **`order_items`** | `item_id` (PK) | `order_id` *(FK ➔ `orders`)*, `product_id` *(FK ➔ `products`)*, `quantity`, `unit_price`, `subtotal` |

---

#### Entity-Relationship Diagram (ERD)
The Entity-Relationship Diagram illustrates the logical tables, primary keys, foreign keys, and cardinalities defining the FordaGO database structure.

| Primary / Parent Entity (1) | Cardinality | Related / Child Entity (N) | Foreign Key Relationship | Business Logic & Integrity Constraint |
| :--- | :---: | :--- | :--- | :--- |
| **`users`** | **1 : N** | **`memberships`** | `memberships.user_id` ➔ `users.user_id` | Member pass subscription history and renewal tracking |
| **`users`** | **1 : N** | **`attendances`** | `attendances.user_id` ➔ `users.user_id` | Optical turnstile QR check-in log generation |
| **`users`** | **1 : N** | **`personal_records`** | `personal_records.user_id` ➔ `users.user_id` | Exercise milestone and strength percentage gains |
| **`users`** | **1 : N** | **`workout_splits`** | `workout_splits.user_id` ➔ `users.user_id` | 7-day personalized workout split routines |
| **`users` *(Coach)*** | **1 : N** | **`workout_proposals`** | `workout_proposals.coach_id` ➔ `users.user_id` | Structured in-chat workout proposal dispatch |
| **`users` *(Member)*** | **1 : N** | **`workout_proposals`** | `workout_proposals.member_id` ➔ `users.user_id` | Member proposal receipt, review, and 1-tap acceptance |
| **`users`** | **1 : N** | **`orders`** | `orders.user_id` ➔ `users.user_id` | Multi-item supplement and merchandise purchases |
| **`orders`** | **1 : N** | **`order_items`** | `order_items.order_id` ➔ `orders.order_id` | Line item breakdown per cart order |
| **`products`** | **1 : N** | **`order_items`** | `order_items.product_id` ➔ `products.product_id` | Product catalog linkage and atomic stock deductions |
<p align="center"><b>Figure 9.</b> <i>Entity-Relationship Diagram (ERD) of FordaGO</i></p>

---

#### Data Dictionary
The Data Dictionary provides the physical data schema, data types, field constraints, and descriptive purposes of each database table in FordaGO.

<p align="center"><b>Table 2.</b> <i>Data Dictionary for the <code>users</code> Table</i></p>

| Field Name | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | Primary Key, Auto Increment | Unique user identifier |
| `first_name` | VARCHAR(100) | NOT NULL | Given first name of the user |
| `last_name` | VARCHAR(100) | NOT NULL | Family surname of the user |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Account email / login credential |
| `password` | VARCHAR(255) | NOT NULL | Bcrypt-hashed account password |
| `role` | ENUM | NOT NULL | Role: `member`, `coach`, `admin`, `employee`, `super_admin` |
| `contact_number`| VARCHAR(20) | NULLABLE | Contact telephone / mobile number |
| `fcm_token` | TEXT | NULLABLE | Firebase Cloud Messaging push token |
| `created_at` | TIMESTAMP | NULLABLE | System record creation timestamp |
| `updated_at` | TIMESTAMP | NULLABLE | Last record modification timestamp |

<br>

<p align="center"><b>Table 3.</b> <i>Data Dictionary for the <code>attendances</code> Table</i></p>

| Field Name | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | Primary Key, Auto Increment | Unique attendance record identifier |
| `user_id` | BIGINT UNSIGNED | Foreign Key (`users.id`) | Reference to the attending member |
| `check_in_date` | DATE | NOT NULL | Calendar date of attendance |
| `check_in_time` | TIME | NOT NULL | Exact time of turnstile check-in |
| `status` | ENUM | NOT NULL | Status: `confirmed`, `rejected`, `pending` |
| `created_at` | TIMESTAMP | NULLABLE | Creation timestamp |

<br>

<p align="center"><b>Table 4.</b> <i>Data Dictionary for the <code>equipment</code> Table</i></p>

| Field Name | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | Primary Key, Auto Increment | Unique equipment identifier |
| `name` | VARCHAR(150) | NOT NULL | Official name of the gym machine/station |
| `category` | VARCHAR(100) | NOT NULL | Category (e.g., Free Weights, Cardio, Machine) |
| `target_muscle` | VARCHAR(150) | NOT NULL | Anatomical muscle group highlighted |
| `media_url` | VARCHAR(255) | NULLABLE | Path to tutorial image / video demonstration |
| `qr_code_key` | VARCHAR(100) | UNIQUE, NOT NULL | Alphanumeric string encoded in QR placard |
| `status` | ENUM | NOT NULL | Equipment condition: `operational`, `maintenance` |

<br>

<p align="center"><b>Table 5.</b> <i>Data Dictionary for the <code>workout_proposals</code> Table</i></p>

| Field Name | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | Primary Key, Auto Increment | Unique workout proposal identifier |
| `coach_id` | BIGINT UNSIGNED | Foreign Key (`users.id`) | Coach authoring the proposal |
| `member_id` | BIGINT UNSIGNED | Foreign Key (`users.id`) | Target client receiving proposal |
| `title` | VARCHAR(200) | NOT NULL | Routine title (e.g., Hypertrophy Push Day) |
| `scheduled_date`| DATE | NOT NULL | Planned session execution date |
| `price` | DECIMAL(10,2)| DEFAULT 0.00 | Fee charged for the coaching session |
| `routine_data` | JSON | NOT NULL | Structured exercises, sets, reps, and notes |
| `status` | ENUM | NOT NULL | Proposal state: `pending`, `accepted`, `declined` |

<br>

<p align="center"><b>Table 6.</b> <i>Data Dictionary for the <code>products</code> Table</i></p>

| Field Name | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | Primary Key, Auto Increment | Unique supplement/product identifier |
| `name` | VARCHAR(150) | NOT NULL | Commercial product name |
| `category` | VARCHAR(100) | NOT NULL | Category (e.g., Protein, Pre-Workout, Gear) |
| `price` | DECIMAL(10,2)| NOT NULL | Unit retail selling price |
| `stock_quantity`| INT | NOT NULL, DEFAULT 0 | Available physical warehouse stock count |
| `image_path` | VARCHAR(255) | NULLABLE | Stored product preview image path |

<br>

<p align="center"><b>Table 7.</b> <i>Data Dictionary for the <code>orders</code> Table</i></p>

| Field Name | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | Primary Key, Auto Increment | Unique sales transaction identifier |
| `user_id` | BIGINT UNSIGNED | Foreign Key (`users.id`) | Ordering gym member |
| `total_amount` | DECIMAL(10,2)| NOT NULL | Total monetary amount of the order |
| `payment_method`| ENUM | NOT NULL | Payment type: `counter_cash`, `gcash` |
| `gcash_ref` | VARCHAR(100) | NULLABLE | GCash transaction reference number |
| `proof_image` | VARCHAR(255) | NULLABLE | Uploaded digital receipt screenshot |
| `status` | ENUM | NOT NULL | Order status: `pending`, `approved`, `rejected` |
| `created_at` | TIMESTAMP | NULLABLE | Transaction placement timestamp |

---

### 1.4. Testing Phase

The testing phase executed rigorous quality assurance across multiple operational tiers:
1. **Unit Testing:** Individual controller methods (e.g., `AttendanceController::checkin`, `InventoryController::checkout`) were tested in isolation using PHPUnit to confirm accurate input validation and database rollbacks.
2. **Integration Testing:** Verified real-time WebSocket channel subscriptions via Laravel Echo and Reverb. In-chat message dispatches and workout plan proposal notifications demonstrated sub-second latency across mobile Android devices and desktop web browsers.
3. **Security & Vulnerability Testing:** Verified role-based route middleware. Unauthorized access attempts to administrative routes (`/admin`, `/reports`) by member tokens were successfully intercepted and blocked with HTTP 403 Forbidden responses.
4. **User Acceptance Testing (UAT):** Conducted at AFFORDA Gym – Cabiao Branch with the gym administrator, on-duty coaches, and active members. All primary operational scenarios (QR turnstile check-in, equipment tutorial scanning, PR metric logging, split routine creation, coach proposal acceptance, and GCash cart checkout) performed reliably without fatal exceptions.

---

### 1.5. Deployment Phase

The FordaGO system was deployed in a local wireless area network (LAN) environment at AFFORDA Gym – Cabiao Branch:
* **Server Setup:** Configured on a dedicated on-premise host running Nginx, PHP 8.2-FPM, MySQL 8.0, and the Laravel Reverb daemon on port `8080`.
* **Mobile Client Distribution:** Generated production-ready Android APK packages installed on the mobile smartphones of gym personnel, coaches, and pilot members.
* **Onboarding & User Training:** Conducted comprehensive orientation sessions for front-desk personnel and personal trainers covering turnstile camera operation, GCash order validation, printable equipment QR placard generation, and client proposal tracking.

---

### 1.6. Review Phase

Following initial deployment, the researchers monitored daily gym workflows to gather usability feedback:
* **Attendance Flow Optimization:** The turnstile camera scanner was calibrated with automatic debounce controls to prevent accidental double-scanning of member QR passes.
* **Proposal Flow Enhancements:** Added instant visual status badges (`Pending`, `Accepted`, `Declined`) within the coach-trainee chat view for transparent progress tracking.
* **Inventory Stock Safeguards:** Configured atomic stock checks during multi-item cart checkout to eliminate inventory over-allocation.

---

### 1.7. Maintenance and Support Phase

To guarantee long-term system sustainability, the researchers instituted structured maintenance protocols:
* **Corrective Maintenance:** Standardized automated server error logging (`storage/logs/laravel.log`) for rapid bug identification and hot-reload patch deployment.
* **Adaptive Maintenance:** Database migration scripts ensure that future gym expansion (e.g., adding automated turnstile hardware or cloud server deployment) can be integrated without data corruption.
* **Database Backup Protocols:** Scheduled automated daily MySQL database dumps (`mysqldump`) to preserve member transaction histories and attendance audit records.

---

## 2. Assessment of the Technical Quality of FordaGO by IT Experts (ISO/IEC 25010 Standards)

The technical quality of the FordaGO system was evaluated by five ($n = 5$) Information Technology professionals and software developers based on the eight software product quality characteristics of the **ISO/IEC 25010** standard using a 4-point Likert scale.

---

### 2.1. Functional Suitability

<p align="center"><b>Table 8.</b> <i>Results of IT Experts' Assessment on Functional Suitability</i></p>

| Criteria | Weighted Mean ($\overline{X}$) | Qualitative Rating |
| :--- | :---: | :---: |
| 1. Functional Completeness | 3.80 | Excellent |
| 2. Functional Correctness | 3.60 | Excellent |
| 3. Functional Appropriateness | 3.60 | Excellent |
| **Grand Mean** | **3.67** | **Excellent** |

The Functional Suitability of FordaGO obtained a grand mean of **3.67 (Excellent)**. Evaluators affirmed that the system completely implements all required gym management operations, delivers accurate calculations for PR percentage gains and inventory stock deductions, and facilitates seamless workout proposal dispatching.

---

### 2.2. Performance Efficiency

<p align="center"><b>Table 9.</b> <i>Results of IT Experts' Assessment on Performance Efficiency</i></p>

| Criteria | Weighted Mean ($\overline{X}$) | Qualitative Rating |
| :--- | :---: | :---: |
| 1. Time Behavior (Response Speed) | 3.80 | Excellent |
| 2. Resource Utilization (CPU / Memory) | 3.60 | Excellent |
| **Grand Mean** | **3.70** | **Excellent** |

Performance Efficiency garnered a grand mean of **3.70 (Excellent)**. The implementation of Laravel Reverb WebSockets for real-time chat and jsPDF for client-side report generation resulted in sub-second transaction speeds and minimal server CPU/memory consumption.

---

### 2.3. Compatibility

<p align="center"><b>Table 10.</b> <i>Results of IT Experts' Assessment on Compatibility</i></p>

| Criteria | Weighted Mean ($\overline{X}$) | Qualitative Rating |
| :--- | :---: | :---: |
| 1. Co-Existence | 3.80 | Excellent |
| 2. Interoperability | 3.80 | Excellent |
| **Grand Mean** | **3.80** | **Excellent** |

Compatibility achieved a grand mean of **3.80 (Excellent)**. FordaGO operates smoothly across diverse Android mobile versions and modern desktop browsers (Chrome, Edge, Firefox) without hardware conflicts or driver incompatibilities.

---

### 2.4. Usability

<p align="center"><b>Table 11.</b> <i>Results of IT Experts' Assessment on Usability</i></p>

| Criteria | Weighted Mean ($\overline{X}$) | Qualitative Rating |
| :--- | :---: | :---: |
| 1. Appropriateness Recognizability | 3.80 | Excellent |
| 2. Learnability | 3.80 | Excellent |
| 3. Operability | 4.00 | Excellent |
| 4. User Error Protection | 3.40 | Excellent |
| 5. User Interface Aesthetics | 3.80 | Excellent |
| **Grand Mean** | **3.76** | **Excellent** |

Usability achieved an outstanding grand mean of **3.76 (Excellent)**, with Operability receiving a perfect **4.00**. Evaluators commended the dark fitness aesthetic, intuitive navigation tabs, and clear interactive onboarding tour guides.

---

### 2.5. Reliability

<p align="center"><b>Table 12.</b> <i>Results of IT Experts' Assessment on Reliability</i></p>

| Criteria | Weighted Mean ($\overline{X}$) | Qualitative Rating |
| :--- | :---: | :---: |
| 1. Maturity | 3.80 | Excellent |
| 2. Availability | 3.80 | Excellent |
| 3. Recoverability | 3.60 | Excellent |
| **Grand Mean** | **3.73** | **Excellent** |

Reliability obtained a grand mean of **3.73 (Excellent)**. The database schema's foreign key constraints and transactional integrity prevent data corruption during concurrent order submissions and turnstile check-ins.

---

### 2.6. Security

<p align="center"><b>Table 13.</b> <i>Results of IT Experts' Assessment on Security</i></p>

| Criteria | Weighted Mean ($\overline{X}$) | Qualitative Rating |
| :--- | :---: | :---: |
| 1. Confidentiality | 3.60 | Excellent |
| 2. Integrity | 3.80 | Excellent |
| **Grand Mean** | **3.70** | **Excellent** |

Security was rated **3.70 (Excellent)**. The use of Laravel Sanctum bearer tokens, Bcrypt password hashing, and role-based middleware guards ensures robust data confidentiality and protection against unauthorized account modification.

---

### 2.7. Maintainability

<p align="center"><b>Table 14.</b> <i>Results of IT Experts' Assessment on Maintainability</i></p>

| Criteria | Weighted Mean ($\overline{X}$) | Qualitative Rating |
| :--- | :---: | :---: |
| 1. Modularity | 3.80 | Excellent |
| 2. Reusability | 3.80 | Excellent |
| 3. Analyzability | 4.00 | Excellent |
| 4. Modifiability | 3.80 | Excellent |
| 5. Testability | 3.80 | Excellent |
| **Grand Mean** | **3.84** | **Excellent** |

Maintainability achieved the highest rating of **3.84 (Excellent)**. The modular structure of Angular standalone components and Laravel MVC controller architecture ensures seamless future scalability and code maintainability.

---

### 2.8. Portability

<p align="center"><b>Table 15.</b> <i>Results of IT Experts' Assessment on Portability</i></p>

| Criteria | Weighted Mean ($\overline{X}$) | Qualitative Rating |
| :--- | :---: | :---: |
| 1. Adaptability | 3.80 | Excellent |
| 2. Installability | 3.80 | Excellent |
| 3. Replaceability | 3.80 | Excellent |
| **Grand Mean** | **3.80** | **Excellent** |

Portability was rated **3.80 (Excellent)**, validating the ease of building, distributing, and installing Android APKs and containerized web environments.

---

### 2.9. Summary of IT Experts' Technical Quality Evaluation

<p align="center"><b>Table 16.</b> <i>Summary of IT Experts' Evaluation on ISO/IEC 25010 Software Quality</i></p>

| ISO/IEC 25010 Software Quality Criteria | Weighted Mean ($\overline{X}$) | Qualitative Rating |
| :--- | :---: | :---: |
| 1. Functional Suitability | 3.67 | Excellent |
| 2. Performance Efficiency | 3.70 | Excellent |
| 3. Compatibility | 3.80 | Excellent |
| 4. Usability | 3.76 | Excellent |
| 5. Reliability | 3.73 | Excellent |
| 6. Security | 3.70 | Excellent |
| 7. Maintainability | 3.84 | Excellent |
| 8. Portability | 3.80 | Excellent |
| **COMPOSITE GRAND MEAN** | **3.75** | **EXCELLENT** |

Overall, the IT Experts gave FordaGO an overall Composite Grand Mean of **3.75 (Excellent)**, confirming that the engineered system adheres strictly to international software engineering standards.

---

## 3. Assessment on the Use of the Application by Gym Administrators, Staff, and Coaches

Gym administrators ($n = 2$) and certified personal trainers ($n = 3$) evaluated the system’s operational effectiveness across four core dimensions:

<p align="center"><b>Table 17.</b> <i>Results of Gym Staff & Coaches' Assessment on FordaGO</i></p>

| Quality Criteria | Weighted Mean ($\overline{X}$) | Qualitative Rating |
| :--- | :---: | :---: |
| **1. Functional Suitability** (Check-in, Proposals, POS, Reports) | 3.80 | Excellent |
| **2. Usability** (Interface Clarity, Tour Guides, Navigation) | 3.85 | Excellent |
| **3. Reliability** (Continuous Operation, Uptime, No Data Loss) | 3.80 | Excellent |
| **4. Security** (Role Access, Protected Financial & Pass Records) | 3.90 | Excellent |
| **OVERALL GRAND MEAN** | **3.84** | **EXCELLENT** |

The evaluation yielded an overall Grand Mean of **3.84 (Excellent)**. Administrators highlighted the speed of camera turnstile attendance and the convenience of instant PDF/Excel sales and attendance exports. Coaches commended the Coach Studio for streamlining workout proposal creation and client communication.

---

## 4. Assessment on the Use of the Application by Gym Members (End-Users)

Active gym members ($n = 5$) of AFFORDA Gym – Cabiao Branch evaluated the mobile portal:

<p align="center"><b>Table 18.</b> <i>Results of Gym Members' Assessment on the Mobile Portal</i></p>

| Quality Criteria | Weighted Mean ($\overline{X}$) | Qualitative Rating |
| :--- | :---: | :---: |
| **1. Usability** (Ease of Use, PR Tracker, Equipment Tutorial Scanner) | 3.82 | Excellent |
| **2. Reliability** (Instant QR Generation, Stable Chat, Cart Persistence) | 3.80 | Excellent |
| **3. Security** (Confidentiality of Personal Logs & GCash Proofs) | 3.85 | Excellent |
| **OVERALL GRAND MEAN** | **3.82** | **EXCELLENT** |

Gym members rated the application with an overall Grand Mean of **3.82 (Excellent)**. Members emphasized the tremendous benefit of scanning equipment QR placards to immediately watch proper execution guides and view targeted muscles, as well as the convenience of 1-tap acceptance of coach workout proposals and tracking PR strength milestones.

---

## 5. Synthesis of Findings

The empirical findings from all evaluation groups demonstrate that **FordaGO: Mobile-Based Gym Database Management System** successfully resolves the operational inefficiencies of **AFFORDA Gym – Cabiao Branch**. By replacing manual paper logbooks with digital QR turnstile verification, providing interactive equipment QR execution tutorials, facilitating real-time WebSocket coaching collaboration with structured in-chat proposals, and automating supplement POS inventory tracking, FordaGO delivers an innovative, highly acceptable, and technically robust gym management ecosystem.

