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

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FORDAGO SYSTEM ARCHITECTURE                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌─────────────────────┐     ┌────────────────────────────────────┐   │
│   │  MEMBER MOBILE APP  │     │   ADMIN / COACH WEB & MOBILE HUB   │   │
│   │   (Ionic / Angular) │     │         (Ionic / Angular)          │   │
│   └──────────┬──────────┘     └─────────────────┬──────────────────┘   │
│              │                                  │                      │
│              │ (HTTPS REST API / Sanctum Token) │                      │
│              ▼                                  ▼                      │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 LARAVEL 11 RESTful API BACKEND                 │   │
│   │   • Controllers   • Sanctum Auth   • Middleware Role Guards    │   │
│   │   • Eloquent ORM  • Business Logic • Vector PDF Export Engine  │   │
│   └──────────────┬──────────────────────────────┬──────────────────┘   │
│                  │                              │                      │
│     (Persistent TCP WebSockets)    (SQL Queries / Foreign Keys)        │
│                  ▼                              ▼                      │
│   ┌────────────────────────────┐  ┌────────────────────────────────┐   │
│   │   LARAVEL REVERB SERVER    │  │    MySQL 8.0 RELATIONAL DB     │   │
│   │   (Duplex Real-Time Chat & │  │  (Users, Attendance, Workouts, │   │
│   │    Instant Proposal Alerts)│  │   Equipment, Shop Inventory)   │   │
│   └────────────────────────────┘  └────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```
<p align="center"><b>Figure 5.</b> <i>FordaGO Full-Stack Architectural Framework</i></p>

---

#### Use Case Diagram
The Use Case Diagram illustrates the functional capabilities available to the three primary actors: **Gym Member**, **Gym Coach**, and **Gym Administrator / Front-Desk Staff**.

```
                           ┌──────────────────────────────────────────────┐
                           │          FordaGO SYSTEM BOUNDARY             │
                           │                                              │
                           │  ( Authenticate & Login ) ◄──────────────────┼── [ Member ]
                           │                                              │   [ Coach  ]
                           │  ( Check-In via QR Code ) ◄──────────────────┼── [ Admin  ]
                           │                                              │
                           │  ( Scan Equipment QR Guides ) ───────────────┼── [ Member ]
                           │                                              │
                           │  ( Log PRs & Split Routines ) ───────────────┼── [ Member ]
                           │                                              │
                           │  ( Browse Supplements & Cart Checkout ) ─────┼── [ Member ]
                           │                                              │
                           │  ( Real-Time Coach-Trainee Chat ) ───────────┼── [ Member ]
                           │         ▲                                    │   [ Coach  ]
                           │         │ <<includes>>                       │
                           │  ( In-Chat Workout Plan Proposals ) ─────────┼── [ Coach  ]
                           │                                              │
                           │  ( Manage Coach Availability & Classes ) ────┼── [ Coach  ]
                           │                                              │
                           │  ( Turnstile Camera QR Attendance ) ─────────┼── [ Admin ]
                           │                                              │
                           │  ( Verify Membership Passes & Renewals ) ────┼── [ Admin ]
                           │                                              │
                           │  ( Supplement POS & GCash Stock Audit ) ─────┼── [ Admin ]
                           │                                              │
                           │  ( Generate Equipment Placards & QRs ) ──────┼── [ Admin ]
                           │                                              │
                           │  ( Export PDF / Excel Business Reports ) ────┼── [ Admin ]
                           │                                              │
                           └──────────────────────────────────────────────┘
```
<p align="center"><b>Figure 6.</b> <i>Use Case Diagram of FordaGO</i></p>

---

#### Context Diagrams (Level 0 and Level 1)

##### Context Diagram Level 0
The Level 0 Context Diagram establishes the global boundary of FordaGO, illustrating data input and information feedback between the system and its primary external entities.

```
       ┌────────────────────────┐
       │       GYM MEMBER       │
       └─────┬────────────▲─────┘
             │            │
  Login / QR Data /       │ Check-in Status / Exercise Guides /
  Orders / PR Metrics /   │ Routine Plans / Coaching Proposals /
  Chat Messages           │ Order Invoices
             │            │
             ▼            │
       ┌──────────────────┴─────┐
       │           0            │
       │                        │
       │        FordaGO         │ ◄─── Credentials / Class Schedules /
       │      GYM DATABASE      │      Availability / Workout Proposals
       │   MANAGEMENT SYSTEM    │
       │                        │ ───► Trainee Inquiries / Booking Rosters /
       │                        │      Chat Messages / Earnings Insights
       └─────┬────────────▲─────┘
             │            │       ┌────────────────────────┐
             │            │       │       GYM COACH        │
  Operational Summaries / │       └────────────────────────┘
  Turnstile Scan Logs /   │ Credentials / Admin Commands /
  Sales & Inventory PDF/  │ Pass Approvals / Product Updates /
  Excel Reports           │ Equipment Details
             │            │
             ▼            │
       ┌──────────────────┴─────┐
       │   GYM ADMINISTRATOR    │
       └────────────────────────┘
```
<p align="center"><b>Figure 7.</b> <i>Context Diagram Level 0 of FordaGO</i></p>

---

##### Context Diagram Level 1 (Data Flow Diagram)
The Level 1 Diagram decomposes the system into its primary functional subprocesses and database stores.

```
                                  ┌───────────────┐
                                  │   users_tbl   │
                                  └───────┬───────┘
                                          │
 ┌──────────┐  (1.0) Auth & Sanctum Token │
 │   USER   ├─────────────────────────────┘
 └────┬─────┘
      │
      ├────────────────► (2.0) QR Turnstile Check-In ───► ┌──────────────────┐
      │                                                   │ attendances_tbl  │
      ├────────────────► (3.0) Equipment QR Scanner ────► ┌──────────────────┐
      │                                                   │  equipment_tbl   │
      ├────────────────► (4.0) PR & Split Workout Engine─►┌──────────────────┐
      │                                                   │  workouts_tbl    │
      ├────────────────► (5.0) WebSocket Chat & Proposal─►┌──────────────────┐
      │                                                   │ messages_tbl /   │
      │                                                   │ proposals_tbl    │
      ├────────────────► (6.0) Supplement POS & Cart ───► ┌──────────────────┐
      │                                                   │ products_tbl /   │
      │                                                   │ orders_tbl       │
      └────────────────► (7.0) PDF/Excel Export Engine ─► ┌──────────────────┐
                                                          │ System Summaries │
                                                          └──────────────────┘
```
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

```
UNNORMALIZED DATA (UNF):
user_id, first_name, last_name, email, password, role, contact_number,
membership_type, membership_start, membership_expiry, membership_status,
attendance_id, attendance_date, check_in_time, check_in_status,
equipment_id, equipment_name, equipment_category, muscle_group, media_url,
pr_id, exercise_name, max_weight, reps, pr_date,
workout_id, split_day, target_duration, routine_details,
coach_id, coach_specialty, coach_rate, availability_schedule,
proposal_id, proposal_title, proposal_price, proposal_status, proposal_date,
conversation_id, sender_id, receiver_id, message_text, message_timestamp,
product_id, product_name, product_category, price, stock_quantity,
order_id, order_date, payment_method, gcash_reference, order_total, order_status
```

##### 2. First Normal Form (1NF)
All multivalued attributes and repeating groups were eliminated. Atomic column structures were defined, and unique primary keys were designated for each distinct table.

```
1NF RELATION SCHEMAS:
• users (user_id [PK], first_name, last_name, email, password, role, contact_number, created_at)
• memberships (membership_id [PK], user_id, type, start_date, end_date, status, price)
• attendances (attendance_id [PK], user_id, date, check_in_time, status)
• equipment (equipment_id [PK], name, category, target_muscle, media_url, status)
• personal_records (pr_id [PK], user_id, exercise_name, weight, reps, record_date)
• workout_splits (workout_id [PK], user_id, day_of_week, duration_minutes, routine_json)
• coach_profiles (coach_id [PK], user_id, specialty, hourly_rate, bio, availability_json)
• workout_proposals (proposal_id [PK], coach_id, member_id, title, price, routine_json, status)
• chat_messages (message_id [PK], conversation_id, sender_id, message_text, created_at)
• products (product_id [PK], name, category, price, stock_quantity, image_url)
• orders (order_id [PK], user_id, total_amount, payment_method, gcash_ref, status, created_at)
• order_items (item_id [PK], order_id, product_id, quantity, unit_price, subtotal)
```

##### 3. Second Normal Form (2NF)
Partial functional dependencies were removed. All non-key attributes were made fully functionally dependent on the entire primary key of their respective tables.

##### 4. Third Normal Form (3NF)
Transitive dependencies were removed. Non-key attributes depend solely and directly on the primary key, preventing update, insertion, and deletion anomalies.

```
3NF NORMALIZED RELATIONAL SCHEMAS:
┌────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│ users                                  │   │ memberships                            │
├────────────────────────────────────────┤   ├────────────────────────────────────────┤
│ • user_id (PK)                         │   │ • membership_id (PK)                   │
│ • first_name, last_name, email         │   │ • user_id (FK -> users.user_id)        │
│ • password (Bcrypt Hash)               │   │ • pass_type, start_date, end_date      │
│ • role ('member','coach','admin'...)   │   │ • status ('active','expired')          │
│ • contact_number, fcm_token            │   │ • price_paid, created_at               │
└────────────────────────────────────────┘   └────────────────────────────────────────┘

┌────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│ attendances                            │   │ equipment                              │
├────────────────────────────────────────┤   ├────────────────────────────────────────┤
│ • attendance_id (PK)                   │   │ • equipment_id (PK)                    │
│ • user_id (FK -> users.user_id)        │   │ • name, category, target_muscle        │
│ • check_in_date, check_in_time         │   │ • media_url, qr_code_identifier        │
│ • status ('confirmed','rejected')      │   │ • maintenance_status, created_at       │
└────────────────────────────────────────┘   └────────────────────────────────────────┘

┌────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│ workout_proposals                      │   │ products                               │
├────────────────────────────────────────┤   ├────────────────────────────────────────┤
│ • proposal_id (PK)                     │   │ • product_id (PK)                      │
│ • coach_id (FK -> users.user_id)       │   │ • name, category, price                │
│ • member_id (FK -> users.user_id)      │   │ • stock_quantity, image_path           │
│ • title, scheduled_date, price         │   │ • status ('in_stock','out_of_stock')   │
│ • routine_data (JSON), status          │   │ • created_at, updated_at               │
└────────────────────────────────────────┘   └────────────────────────────────────────┘

┌────────────────────────────────────────┐   ┌────────────────────────────────────────┐
│ orders                                 │   │ order_items                            │
├────────────────────────────────────────┤   ├────────────────────────────────────────┤
│ • order_id (PK)                        │   │ • item_id (PK)                         │
│ • user_id (FK -> users.user_id)        │   │ • order_id (FK -> orders.order_id)     │
│ • total_amount, payment_method         │   │ • product_id (FK -> products.prod_id)  │
│ • gcash_reference, payment_proof_img   │   │ • quantity, unit_price, subtotal       │
│ • status ('pending','approved'...)     │   └────────────────────────────────────────┘
└────────────────────────────────────────┘
```

---

#### Entity-Relationship Diagram (ERD)
The Entity-Relationship Diagram illustrates the logical tables, primary keys, foreign keys, and cardinalities defining the FordaGO database structure.

```
       ┌──────────────────┐
       │   memberships    │
       └────────▲─────────┘
                │ (1:N)
       ┌────────┴─────────┐ (1:N) ┌──────────────────┐
       │      users       ├──────►│   attendances    │
       └───┬────┬────┬────┘       └──────────────────┘
           │    │    │ (1:N)      ┌──────────────────┐
     (1:N) │    │    └───────────►│ personal_records │
           │    │                 └──────────────────┘
           │    │ (1:N)           ┌──────────────────┐
           │    └────────────────►│ workout_sessions │
           │                      └──────────────────┘
           ├──────────────────────────────┐
           │ (1:N)                        │ (1:N)
           ▼                              ▼
┌──────────────────────┐       ┌──────────────────────┐
│  workout_proposals   │       │        orders        │
└──────────────────────┘       └──────────┬───────────┘
                                          │ (1:N)
┌──────────────────────┐                  ▼
│      equipment       │       ┌──────────────────────┐
└──────────────────────┘       │     order_items      │
                               └──────────▲───────────┘
                                          │ (N:1)
                               ┌──────────┴───────────┐
                               │       products       │
                               └──────────────────────┘
```
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
