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

# CHAPTER I: INTRODUCTION

## 1.1 Background of the Study

Fitness centers and commercial gyms play an indispensable role in promoting physical health, athletic conditioning, and active lifestyles by providing communities with exercise machinery, conditioning spaces, and professional fitness instruction. As public consciousness regarding physical well-being continues to rise, fitness centers experience a steady influx of members who require systematic management of registration, attendance logging, personal workout tracking, equipment orientation, coaching consultation, and inventory management. To maintain operational efficiency, financial transparency, and high customer retention, modern fitness establishments must transition from traditional, manual workflows to integrated, database-driven digital platforms.

At present, **AFFORDA Gym – Cabiao Branch**, situated in the municipality of Cabiao, Nueva Ecija, operates primarily through manual and semi-manual administrative procedures. One of the most pronounced operational bottlenecks in the facility is attendance monitoring. The gym currently utilizes physical paper logbooks positioned at the front desk where entering members must queue, manually write down their full names, log their arrival timestamps, and append their signatures. During peak workout hours (early morning and late afternoon), this manual procedure causes severe front-desk congestion, introduces recording delays, and produces illegible or incomplete entries. Furthermore, paper logbooks are vulnerable to physical wear and tear, moisture damage, and unauthorized viewing of member names, while historical attendance retrieval for audit or capacity planning requires tedious manual leafing through stacks of past records.

In addition to attendance difficulties, managing membership plans and daily visit passes on physical ledgers or fragmented spreadsheets presents significant administrative challenges. Gym staff face difficulty in instantly verifying whether an entering patron possesses an active 30-day Premium Pass, an unexpired session pass, or an outstanding payment balance. Similarly, the gym’s inventory—consisting of protein powders, pre-workout supplements, energy drinks, and gym merchandise—is tracked through manual stock counts, frequently leading to discrepancies between recorded sales and physical shelf inventory.

Another critical concern inside AFFORDA Gym – Cabiao Branch involves member onboarding and exercise guidance. Novice gym-goers and casual members often struggle with understanding the proper mechanics, safety adjustments, and targeted muscle groups of specialized exercise machines and free-weight equipment. Without immediate instructional guidance from on-duty staff, beginners risk improper exercise execution, muscular strain, and workout discouragement. While certified fitness coaches operate within the gym, there is no centralized, structured digital platform to connect members with trainers for private consultation, customized workout plan dispatching, scheduling, or group fitness class enrollment.

To solve these compounding operational and customer-support challenges, modern mobile computing and web technologies offer an efficient, scalable, and centralized solution. By leveraging **Quick Response (QR) code technology**, mobile applications, real-time WebSocket communication, and relational database systems, gym operations can be completely digitized into a paperless, interactive fitness ecosystem.

The proposed system, **FordaGO: Mobile-Based Gym Database Management System for AFFORDA Gym – Cabiao Branch**, is specifically engineered to resolve these operational deficiencies. FordaGO establishes an interconnected, tri-tier digital platform linking **Members**, **Coaches**, and **Administrators**:

1. **Member Mobile Portal:** Provides members with a personal QR code for instant attendance check-in, an interactive camera-based equipment QR scanner for exercise execution tutorials, a Personal Record (PR) milestone tracker with automated gain calculators, a customizable weekly workout split routine planner (Monday–Sunday), an in-app supplement catalog with shopping cart and GCash reference verification, and real-time private messaging with certified coaches.
2. **Coach Studio (Trainer Hub):** Equips certified fitness coaches with tools to manage their client roster, publish recurring weekly availability hours, broadcast public group fitness classes, and transmit structured in-chat **Workout Plan Proposals** that members can accept with a single tap.
3. **Admin Command Center:** Provides gym administrators and front-desk staff with a digital turnstile camera scanner with anti-pass-sharing timestamp verification, pass status monitoring, supplement point-of-sale (POS) order audit and automated stock deduction, equipment QR placard generation, coach account administration, and instant PDF/Excel export engines for operational reporting.

Through the implementation of FordaGO, AFFORDA Gym – Cabiao Branch can modernize its operational infrastructure, eliminate paper logbooks, safeguard member data, enhance workout safety and consistency, and establish a data-driven standard for local gym management.

---

## 1.2 Theoretical Framework

The development and evaluation of the FordaGO system are anchored on several foundational theories in Information Systems, Computer Science, and Human-Computer Interaction:

```
┌────────────────────────────────────────────────────────────────────────┐
│                         THEORETICAL FOUNDATION                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Technology Acceptance Model (TAM) (Davis, 1989)                     │
│    • Perceived Usefulness (PU) & Perceived Ease of Use (PEOU)          │
│ 2. Relational Database Theory (Codd, 1970)                             │
│    • Schema Normalization, Referential Integrity & ACID Properties     │
│ 3. Client-Server & Real-Time Event Architecture (Fielding, 2000)       │
│    • RESTful API (Laravel 11) & Full-Duplex WebSockets (Reverb)        │
│ 4. ISO/IEC 25010 Software Product Quality Model (ISO, 2011)            │
│    • Functional Suitability, Usability, Reliability, Security, Perf.   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Technology Acceptance Model (TAM) (Davis, 1989):** TAM posits that the adoption and utilization of an information system depend fundamentally on two user beliefs: *Perceived Usefulness (PU)*—the degree to which a user believes the system enhances their task performance—and *Perceived Ease of Use (PEOU)*—the degree to which using the system is free of cognitive effort. In FordaGO, TAM guides the user interface (UI/UX) design, ensuring that QR attendance scanning, equipment guides, and mobile coaching are intuitive, fast, and accessible for both non-technical gym members and administrative personnel.
2. **Relational Database Theory (Codd, 1970):** Formulated by Edgar F. Codd, this theory dictates that data must be organized into normalized, two-dimensional relation tables linked through primary and foreign keys to prevent data redundancy and maintain referential integrity. FordaGO applies Boyce-Codd Normal Form (BCNF) / Third Normal Form (3NF) within MySQL to guarantee ACID (Atomicity, Consistency, Isolation, Durability) transaction compliance during concurrent check-ins and point-of-sale inventory deductions.
3. **Architectural Styles and the Design of Network-based Software Architectures (Fielding, 2000):** Governs the decoupled RESTful API design implemented via Laravel 11. Complementing REST, modern WebSocket event-driven communication (RFC 6455) maintains persistent, full-duplex TCP channels via Laravel Reverb to facilitate sub-second in-chat messaging and real-time proposal notifications without server-polling overhead.
4. **ISO/IEC 25010 Software Quality Standards (ISO, 2011):** Provides the formal theoretical and empirical criteria for evaluating the engineered software product across five essential quality dimensions: Functional Suitability, Usability, Reliability, Security, and Performance Efficiency.

---

## 1.3 Conceptual Framework

The conceptual model of this study is structured using the **Input-Process-Output (IPO)** framework, illustrating the transformation of raw operational gym inputs into structured digital outputs through iterative software engineering and quality evaluation.

```
┌──────────────────────────────────┐      ┌──────────────────────────────────┐      ┌──────────────────────────────────┐
│              INPUT               │      │             PROCESS              │      │              OUTPUT              │
├──────────────────────────────────┤      ├──────────────────────────────────┤      ├──────────────────────────────────┤
│ 1. User & Account Data:          │      │ 1. Requirements Analysis &       │      │ 1. Deployed FordaGO System:      │
│    • Member, Coach, Admin        │      │    Agile Sprint Planning         │      │    • Member Mobile Portal        │
│      Profiles & Credentials      │      │ 2. System Architecture & UI/UX   │      │    • Coach Studio Hub            │
│ 2. Gym Operational Data:         │      │    Wireframe Modeling            │      │    • Admin Command Center        │
│    • Membership Pass Types,      │      │ 3. Database Modeling &           │ 2. Digital QR Attendance        │
│      Durations & Pricing         │      │    Schema Normalization (MySQL)  │    Check-In & Traffic Logs       │
│    • Equipment Records, Specs    │ ───► │ 4. Backend REST API Development  │ ───► │ 3. Interactive Equipment QR      │
│      & Muscle Target Media       │      │    & Sanctum Auth (Laravel 11)   │    Tutorial & Media Catalog      │
│    • Personal Records (PR) &     │      │ 5. Real-Time WebSocket Event     │ 4. Personal Record (PR) &       │
│      Workout Split Routines      │      │    Broadcasting (Laravel Reverb) │    Weekly Split Workout Plans    │
│    • Supplement Products, Stock  │      │ 6. Mobile Cross-Platform Client  │ 5. Real-Time Coach-Trainee Chat │
│      Counts & POS Orders         │      │    Construction (Ionic/Angular)  │    & In-Chat Workout Proposals   │
│ 3. Hardware / Sensor Data:       │      │ 7. Camera Barcode QR Processing  │ 6. Supplement POS Transaction   │
│    • Mobile Camera QR Optical    │      │ 8. POS Cart Atomic Deductions    │    Records & Verified Receipts   │
│      Data Streams                │      │ 9. Vector PDF/Excel Export       │ 7. Dynamic Vector PDF/Excel     │
│ 4. Evaluation Parameters:        │      │ 10. ISO/IEC 25010 System Testing │    Administrative Reports        │
│    • ISO/IEC 25010 Criteria      │      │     & Statistical Evaluation     │ 8. Standardized Software         │
│      & 4-Point Likert Instrument │      │                                  │    Quality Assessment Report     │
└──────────────────────────────────┘      └──────────────────────────────────┘      └──────────────────────────────────┘
                 ▲                                                                                      │
                 │                                                                                      │
                 └────────────────────────────── FEEDBACK & ITERATION ──────────────────────────────────┘
```
<p align="center"><b>Figure 1.</b> <i>Conceptual Framework of the Study (Input-Process-Output Model)</i></p>

### Narrative Description of the IPO Components

* **Input:**
  - *User Information:* Account profiles, encrypted credentials, contact details, and role assignments (`member`, `coach`, `admin`, `employee`, `super_admin`).
  - *Gym Operational Data:* Membership plans (30-Day Premium, Daily Passes), active pass dates, equipment technical specifications, muscle group classifications, exercise tutorial media, personal record (PR) lift data, daily routine schedules, coach availability timeframes, supplement stock quantities, item prices, and GCash payment references.
  - *Hardware Input:* Optical data streams captured via mobile and webcam camera sensors for QR code decoding.
  - *Evaluation Input:* ISO/IEC 25010 software quality metrics administered to technical experts and gym respondents.

* **Process:**
  - *Requirements & Modeling:* On-site workflow analysis at AFFORDA Gym – Cabiao Branch, database normalization in MySQL, and architectural design.
  - *Backend & API Engineering:* Construction of secure RESTful API endpoints in Laravel 11, token-based Sanctum authentication, role-based route middleware, and atomic database transactions.
  - *Real-Time Layer:* Implementation of bidirectional WebSocket channels via Laravel Reverb and Laravel Echo for live chat messaging, instant typing indicators, and proposal notifications.
  - *Frontend & Device Interfacing:* Developing responsive standalone components in Ionic 8 and Angular, utilizing Capacitor Camera/Barcode Scanner plugins for native hardware camera access.
  - *Business Logic Processing:* Automated anti-pass-sharing timestamp verification, PR gain calculations, cart checkout with automated inventory stock deduction, and client-side vector PDF/Excel generation using jsPDF and AutoTable.
  - *Testing & Evaluation:* Unit testing, integration testing, black-box functional testing, and ISO/IEC 25010 quality evaluation.

* **Output:**
  - A fully functional, production-ready **FordaGO Mobile-Based Gym Database Management System** featuring the Member Mobile Portal, Coach Studio, and Admin Command Center.
  - Automated digital attendance logs with exact timestamps and active gym traffic statistics.
  - Interactive equipment orientation catalog accessible via machine-level QR code scanning.
  - Personalized workout tracking records and weekly split routines.
  - Real-time coaching consultations and formal in-chat workout plan proposals.
  - Digital supplement POS sales logs and GCash payment verification audit trails.
  - Formatted administrative PDF summaries and Excel spreadsheets for business reporting.
  - An empirical ISO/IEC 25010 software quality evaluation report validating system acceptability.

---

## 1.4 Statement of the Problem

### General Problem Statement
AFFORDA Gym – Cabiao Branch provides fitness facilities and wellness services to fitness enthusiasts in Cabiao, Nueva Ecija. However, daily operations are severely hindered by manual paper logbooks for attendance tracking, disorganized membership pass monitoring, lack of accessible on-demand equipment instructions for beginners, manual supplement inventory logging, and the absence of a structured digital communication channel between gym coaches and trainees. These manual processes result in operational inefficiencies, data inaccuracies, front-desk congestion, security vulnerabilities, and suboptimal member engagement.

### Specific Problem Statements
Specifically, this study seeks to answer the following research questions:

1. What are the operational problems and limitations encountered in the current gym management workflow of AFFORDA Gym – Cabiao Branch in terms of:
   - a. Member registration, account management, and membership pass verification;
   - b. Attendance recording and monitoring through manual paper logbooks;
   - c. Availability of instructional guidance and safety information for gym equipment;
   - d. Personal workout tracking, routine scheduling, and coach-client consultations;
   - e. Inventory management, supplement sales recording, and payment verification; and
   - f. Generation of administrative, financial, and operational summaries?

2. What functional modules, system architecture, database design, and user interface features must be engineered in the proposed **FordaGO: Mobile-Based Gym Database Management System** to address the identified operational problems?

3. What is the level of quality and acceptability of the developed FordaGO system as evaluated by IT professionals and gym end-users based on the **ISO/IEC 25010** software quality standard in terms of:
   - a. Functional Suitability;
   - b. Usability;
   - c. Reliability;
   - d. Security; and
   - e. Performance Efficiency?

---

## 1.5 Objectives of the Study

### General Objective
The general objective of this capstone project is to design, develop, and evaluate **FordaGO: Mobile-Based Gym Database Management System for AFFORDA Gym – Cabiao Branch**, providing a centralized, secure, and interactive mobile and web platform that automates attendance tracking, membership management, equipment orientation, workout tracking, coaching consultation, supplement inventory, and administrative reporting.

### Specific Objectives
To achieve the general objective, the study will accomplish the following specific targets:

1. To investigate, analyze, and document the existing operational workflows, manual procedures, and administrative challenges of AFFORDA Gym – Cabiao Branch through interviews, direct observations, and process mapping.
2. To design the system architecture, entity-relationship database models (ERD), WebSocket event schemas, and user interfaces (UI/UX) tailored for Members, Coaches, and Administrators.
3. To develop and implement the core functional modules of the FordaGO system, namely:
   - a. **User Authentication & Role-Based Access Control Module:** Implementing Laravel Sanctum token security, password recovery mechanisms, and route guarding for five user tiers (`member`, `coach`, `admin`, `employee`, `super_admin`);
   - b. **Digital QR Code Attendance Module:** Providing an administrative camera turnstile scanner, member QR check-in, anti-pass-sharing timestamp verification, and real-time attendance traffic logging;
   - c. **Interactive Equipment QR Guidance Module:** Providing mobile camera QR scanning of physical machine placards, displaying targeted muscle highlights, photos, and step-by-step exercise execution tutorials, alongside an administrative printable QR placard generator;
   - d. **Personal Workout Tracker & Split Routine Module:** Enabling members to log Personal Record (PR) lifting metrics with automated percentage gain calculators and construct custom weekly workout splits (Monday–Sunday);
   - e. **Coach Studio & Real-Time Consultation Module:** Providing certified coaches with client roster management, recurring availability scheduling, public group fitness class publishing, and real-time WebSocket private chat with in-chat **Workout Plan Proposals** featuring one-tap client acceptance;
   - f. **Gym Inventory & Supplement POS Module:** Delivering a multi-item shopping cart, Over-the-Counter Cash and GCash reference verification workflows, administrative order approvals, and atomic inventory stock deduction;
   - g. **Membership Pass & Billing Management Module:** Tracking 30-Day Premium Passes and Daily Visit Passes, monitoring expiration dates, logging renewal requests, and maintaining transaction audit trails;
   - h. **Notification & Communication Module:** Dispatching real-time in-app alerts and notifications for proposal submissions, order status changes, chat messages, and schedule updates; and
   - i. **Administrative Reporting & Analytics Module:** Generating dynamic, client-side vector PDF documents and Excel/CSV spreadsheets for attendance records, sales revenue, inventory stock, and membership lists.
4. To test and evaluate the technical performance, reliability, and usability of the developed FordaGO system using the ISO/IEC 25010 Software Quality Evaluation model through assessments administered to IT professionals and target gym respondents.

---

## 1.6 Scope and Delimitations of the Study

### Scope of the Study
This study encompasses the full design, development, integration, and empirical evaluation of **FordaGO: Mobile-Based Gym Database Management System for AFFORDA Gym – Cabiao Branch**. The system serves three primary user groups:

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
         ├─ QR Attendance Check-in       ├─ Trainee Roster Management    ├─ Digital QR Turnstile Scanner
         ├─ PR Metric Tracker            ├─ 1-on-1 Real-Time Chat        ├─ Pass Verification & Renewal
         ├─ Split Routine Planner        ├─ In-Chat Workout Proposals    ├─ Shop POS & GCash Audit
         ├─ Equipment QR Scanner         ├─ Public Group Fitness Classes ├─ Equipment Catalog & QRs
         ├─ Supplement Shop & Cart       ├─ Weekly Availability Slots    ├─ Coach Account Administration
         └─ Interactive Feature Guides   └─ Trainer Earnings Tracking    └─ PDF/Excel Export Engine
```
<p align="center"><b>Figure 2.</b> <i>FordaGO Tri-Tier Ecosystem Architecture</i></p>

The system's functional scope is divided into nine major modules:
1. **User Authentication & Role-Based Access Control Module:** Provides secure token-based authentication using Laravel Sanctum, encrypted password hashing (Bcrypt), role-based middleware access control, and self-service password recovery via security verification.
2. **QR Code Attendance Monitoring Module:** Replaces physical paper logbooks with camera-based QR code verification. Front-desk staff scan member QR codes using the digital turnstile scanner to instantly verify active pass validity, enforce anti-pass-sharing timestamp rules, and log check-in timestamps.
3. **Interactive Equipment QR Information & Guidance Module:** Members scan physical QR placards affixed to gym machines using their smartphone cameras to immediately view high-resolution equipment photos, targeted muscle group diagrams, and step-by-step exercise execution instructions. Admins can generate and download printable QR placards directly from the system.
4. **Personal Record (PR) Tracker & Weekly Split Routine Builder:** Allows members to log personal record milestones (e.g., Bench Press, Squat, Deadlift) with automated percentage gain calculators, while enabling users to build custom daily workout splits (Monday to Sunday) with target durations and gym floor selections.
5. **Coach Studio & Real-Time Consultation Module:** Accredited gym coaches manage their trainee roster, configure weekly working hours, publish public group fitness classes with participant seat limits, and engage in real-time private messaging powered by WebSockets. Coaches can compose and send structured in-chat **Workout Plan Proposals** (specifying dates, target muscles, routines, and pricing) that members can accept with a single tap.
6. **Supplement Shop & Point-of-Sale (POS) Module:** Members browse gym supplements, energy drinks, and apparel, adding items to a multi-item cart and checking out via Counter Cash or GCash reference verification. Administrators review pending orders, verify payment proofs, approve sales, and trigger atomic inventory stock deductions.
7. **Membership Pass & Billing Management Module:** Tracks active membership passes (30-Day Premium Pass and Daily Visit Passes), monitors expiration dates, handles pass extension requests, and logs transparent transaction audit trails.
8. **Real-Time Notification System:** Dispatches live WebSocket events and visual badge notifications for order approvals, workout proposals, chat messages, and administrative announcements.
9. **Administrative Analytics & Export Engine:** Provides administrative dashboards with graphical operational summaries and vector PDF/Excel export engines for attendance traffic, sales revenues, inventory stock, and membership lists.

**Technical Architecture & Development Stack:**
* **Frontend Mobile & Web Client:** Ionic 8 with Angular standalone components, TypeScript, and SCSS.
* **Backend Application Server:** Laravel 11 (PHP 8.2+) RESTful API architecture with Laravel Sanctum authentication.
* **Real-Time WebSockets:** Laravel Reverb WebSocket server integrated with Laravel Echo.
* **Database Management System:** MySQL relational database with strict foreign key constraints and transactional integrity.
* **Hardware Interfacing:** Capacitor Camera and Barcode Scanner plugins for mobile device camera integration.
* **Reporting Engine:** jsPDF and AutoTable for client-side formatted PDF generation and Excel export utilities.

### Delimitations of the Study
To maintain technical feasibility and ensure the study remains aligned with academic capstone parameters, the following explicit delimitations are established:

1. **Single-Branch Implementation:** The system is engineered exclusively for **AFFORDA Gym – Cabiao Branch** in Cabiao, Nueva Ecija. Distributed, multi-branch database synchronization across other branches (such as the San Isidro or Muñoz branches) is not included in this version.
2. **Optical Camera Scanning vs. Hardware Turnstiles:** Attendance check-in and equipment lookup operate entirely through camera-based optical QR code decoding on smartphones and webcams. The system does not interface with physical electromechanical turnstiles, magnetic door latches, RFID card readers, or biometric fingerprint scanners.
3. **Smart Wearables and Biometric Sensors:** The system does not integrate with external wearable hardware (e.g., Apple Watch, Fitbit, Garmin) or operating system health APIs (e.g., Apple HealthKit, Google Health Connect) for automated heart rate, pulse, or metabolic calorie tracking.
4. **Payment Gateway Integration:** GCash payment processing is handled through manual reference number logging and digital receipt upload, which is audited and approved by front-desk personnel at the counter. Automated payment gateway APIs (e.g., PayMongo, Xendit, PayPal) or direct credit card merchant acquiring are excluded.
5. **Computer Vision & AI Motion Coaching:** Equipment guidance is provided through pre-configured instructional media, descriptive execution steps, and anatomical diagrams. Real-time AI pose estimation and camera-based form-correction coaching are not included in this release.
6. **Network Connectivity Dependency:** The application requires an active local wireless network (LAN) or internet connection to communicate with the centralized Laravel API server and Reverb WebSocket server. Offline capability is delimited to displaying locally cached view states.
7. **User Base Restriction:** System access is restricted to registered members, accredited coaches, and authorized administrative staff of AFFORDA Gym – Cabiao Branch. Public social media feeds or open unauthenticated forums are excluded.

---

## 1.7 Significance of the Study

The development, deployment, and evaluation of FordaGO will deliver direct practical and academic value to the following beneficiaries:

1. **AFFORDA Gym – Cabiao Branch Management:** Modernizes the facility’s business infrastructure by eliminating manual logbooks, preventing revenue leakage through automated pass verification, maintaining live stock inventory, and providing accurate data-driven business reports.
2. **Gym Administrators and Front-Desk Staff:** Significantly reduces administrative workload by automating member check-ins, eliminating manual attendance handwriting, streamlining supplement point-of-sale audits, and providing one-click PDF/Excel report exports.
3. **Gym Coaches and Personal Trainers:** Provides a professional digital workspace (Coach Studio) to showcase credentials, publish workout routines, establish availability hours, organize group classes, and communicate in real time with trainees through structured workout plan proposals.
4. **Gym Members and Fitness Enthusiasts:** Enhances the workout experience through frictionless QR check-in, on-demand equipment usage tutorials via QR scanning, personal record and routine tracking, easy supplement ordering, and direct access to professional coaching consultations.
5. **Researchers:** Serves as a comprehensive practical application of integrating modern full-stack web and mobile technologies (Ionic, Angular, Laravel, WebSockets, and MySQL) in solving real-world business and health-management challenges.
6. **Future Developers and Academics:** Provides an architectural foundation and empirical benchmark for future research into fitness digitalization, real-time sports informatics, and automated sports facility management systems.

---

## 1.8 Review of Related Literature

The integration of information systems into sports, physical conditioning, and fitness facility management represents a growing domain in enterprise informatics. Modern gyms require automated workflows to maintain operational efficiency and customer retention.

### Gym Management Systems and Digital Transformation
Traditional gym operations reliant on paper logs, static spreadsheets, and verbal agreements suffer from high administrative friction, data duplication, and security vulnerabilities (Laudon & Laudon, 2021). According to Baechle and Earle (2020), operational consistency in fitness facilities directly influences member adherence and satisfaction. Modern Gym Management Systems (GMS) consolidate membership records, attendance logs, and financial transactions into unified database platforms, minimizing human error and providing real-time operational insights.

### Relational Database Management Systems (RDBMS)
Database management systems form the backbone of modern enterprise applications. Silberschatz et al. (2019) emphasize that relational databases utilizing structured schemas, primary/foreign key constraints, and ACID (Atomicity, Consistency, Isolation, Durability) transaction properties ensure high data integrity, prevent duplicate records, and support complex query operations. In a gym environment, an RDBMS such as MySQL efficiently correlates user profiles, membership durations, daily attendance entries, equipment records, coaching proposals, and inventory stocks (Hoffer et al., 2020).

### Quick Response (QR) Code Technology
Originally developed by Denso Wave in 1994, QR code technology has become ubiquitous in contactless identification, asset tracking, and authentication systems (Denso Wave, 2023). In facility access control, QR codes provide rapid optical machine-readable data transfer. Applied to gym attendance, QR code scanning replaces slow manual logbooks with sub-second digital verification. Furthermore, attaching QR code placards to gym equipment allows members to instantly retrieve digital instructional manuals and targeted muscle guides directly on their personal mobile devices.

### Mobile Hybrid Application Architecture
The rapid proliferation of mobile devices has shifted enterprise applications toward mobile-first architectures (Pressman & Maxim, 2020). Hybrid mobile frameworks such as Ionic combined with Angular leverage web standards (HTML5, SCSS, TypeScript) compiled into native mobile containers via Capacitor. This architecture ensures unified codebase maintenance across Android, iOS, and Web platforms while providing direct access to native device hardware, including the camera and local storage.

### Real-Time WebSockets Communication in Collaborative Systems
Real-time bi-directional communication is critical for modern interactive applications. Unlike traditional HTTP polling, which introduces significant latency and server overhead, WebSockets maintain persistent full-duplex TCP connections between clients and servers. Laravel Reverb provides high-throughput WebSocket event broadcasting, enabling instant chat message delivery, live typing indicators, and immediate workout proposal notifications between coaches and members without requiring manual page refreshes.

### Inventory Control and Point-of-Sale (POS) Integration
Effective inventory management ensures optimal stock availability and financial transparency (Heizer et al., 2020). Automated POS systems link customer orders with live inventory levels, deducting product stock atomically upon transaction approval. Providing support for digital payment verification (such as GCash reference logging) caters to the growing preference for cashless transactions in commercial establishments.

### Information Security and Data Privacy (Republic Act No. 10173)
Managing personal health and customer records necessitates strict compliance with data privacy regulations. In the Philippines, Republic Act No. 10173, known as the Data Privacy Act of 2012, mandates that personal information controllers implement organizational, physical, and technical measures to protect user data. Systems must enforce role-based access control (RBAC), password hashing (e.g., Bcrypt), and secure token authentication to safeguard user records against unauthorized access.

---

## 1.9 Review of Related Systems

To establish a comparative baseline, five existing commercial gym management platforms were examined alongside the proposed FordaGO system:

```
┌───────────────────────────────────┬───────────┬───────────┬───────────┬───────────┬───────────┬─────────────────────────┐
│ Feature / Capability              │ Virtuagym │ ZenPlan.  │ Mindbody  │ Glofox    │ TeamUp    │ **FordaGO (Proposed)**  │
├───────────────────────────────────┼───────────┼───────────┼───────────┼───────────┼───────────┼─────────────────────────┤
│ Target Environment                │ Int'l Gym │ Boutique  │ Spa/Yoga  │ Studios   │ Small Gym │ **AFFORDA Gym (Cabiao)**│
│ Mobile Member App                 │ Yes       │ Yes       │ Yes       │ Yes       │ Yes       │ **Yes (Ionic / Angular) │
│ Optical QR Attendance Scanner     │ Partial   │ Partial   │ Barcode   │ Barcode   │ No        │ **Yes (Turnstile Cam)** │
│ Equipment QR Guidance Scanner     │ No        │ No        │ No        │ No        │ No        │ **Yes (Target Muscles)**│
│ Personal Record (PR) Tracker      │ Yes       │ Yes       │ No        │ No        │ No        │ **Yes (Milestones & %)**│
│ Weekly Split Routine Planner      │ Yes       │ Partial   │ No        │ No        │ No        │ **Yes (Monday–Sunday)** │
│ In-Chat Workout Plan Proposals    │ No        │ No        │ No        │ No        │ No        │ **Yes (1-Tap Accept)**  │
│ Real-Time WebSocket Chat          │ No (Email)│ No        │ No        │ No        │ No        │ **Yes (Laravel Reverb)**│
│ Local Supplement POS & GCash Audit│ No        │ No        │ Add-on    │ No        │ No        │ **Yes (Cart & GCash)**  │
│ Client-Side Vector PDF/Excel Engine│ No (SaaS) │ No (SaaS) │ No (SaaS) │ No (SaaS) │ No (SaaS) │ **Yes (jsPDF/AutoTable) │
│ Pricing Model                     │ High SaaS │ High SaaS │ High SaaS │ High SaaS │ High SaaS │ **Custom / Standalone** │
└───────────────────────────────────┴───────────┴───────────┴───────────┴───────────┴───────────┴─────────────────────────┘
```

### 1. Virtuagym
Virtuagym is a fitness management system offering membership tracking and workout builders. While comprehensive, it targets large enterprise gym chains with high monthly SaaS fees. It lacks localized Philippine payment workflows (GCash verification) and does not provide an equipment QR scanner for on-premise machine tutorials.

### 2. Zen Planner
Zen Planner delivers scheduling, billing, and workout tracking for boutique fitness studios. However, its user interface is complex and requires specialized staff training. It lacks integrated real-time WebSocket coaching chat and machine-level equipment QR tutorials.

### 3. Mindbody
Mindbody is an enterprise-level wellness platform geared toward high-end spas and yoga studios. Its expensive subscription model and high transaction surcharge make it impractical for independent local fitness centers like AFFORDA Gym – Cabiao Branch.

### 4. Glofox
Glofox serves boutique fitness studios with class booking and member check-in. However, it relies heavily on third-party hardware for check-ins, lacks in-chat coaching proposals, and does not provide an interactive equipment tutorial catalog.

### 5. TeamUp
TeamUp focuses on customer management and group class schedules. It provides clean booking interfaces but lacks personal record milestone tracking, real-time trainer chat, and equipment scanning capabilities.

### Synthesis and Differentiation of FordaGO
Existing commercial gym systems are predominantly cloud SaaS platforms built for large international franchises, characterized by high recurring subscription fees, complex interfaces, and a lack of support for local Philippine operational workflows (e.g., GCash payment verification). 

FordaGO bridges this gap by delivering a purpose-built, cost-effective, and fully customized platform for **AFFORDA Gym – Cabiao Branch**. It uniquely synthesizes **digital camera turnstile QR attendance**, **equipment QR video/media guidance**, **real-time WebSocket trainer chat with in-chat workout proposals**, **personal record milestone analytics**, **local supplement POS with GCash audit**, and **offline-capable vector PDF/Excel reporting** into a unified, lightweight ecosystem.

---

## 1.10 Definition of Terms

To ensure conceptual clarity, the following technical and operational terms are defined conceptually and operationally:

* **Access Control:** *(Conceptual)* A security technique that regulates who can view or use resources in a computing environment. *(Operational)* The role-based permissions in FordaGO restricting access across `member`, `coach`, `admin`, `employee`, and `super_admin` tiers.
* **AFFORDA Gym – Cabiao Branch:** *(Operational)* The physical commercial fitness facility located in Cabiao, Nueva Ecija, Philippines serving as the primary client, case environment, and deployment locale of this study.
* **Authentication:** *(Conceptual)* The process of verifying the identity of a user or device. *(Operational)* The validation of user credentials in FordaGO via Laravel Sanctum, issuing secure bearer tokens for mobile and web API requests.
* **Capacitor:** *(Conceptual)* A cross-platform native runtime for web applications. *(Operational)* The runtime tool used to deploy FordaGO’s Ionic Angular codebase to native Android devices with direct hardware camera access.
* **Coach Studio (Trainer Hub):** *(Operational)* The specialized mobile module in FordaGO where accredited coaches manage client rosters, publish group classes, set availability hours, and send custom workout plan proposals.
* **Database Management System (DBMS):** *(Conceptual)* Software used to store, retrieve, and manage data in databases. *(Operational)* MySQL 8.0, utilized in FordaGO to maintain relational schemas for users, passes, check-ins, workouts, messages, products, and sales.
* **Equipment Guidance:** *(Operational)* On-demand multimedia, safety instructions, and targeted muscle group graphics presented to a member upon scanning an equipment QR placard.
* **FordaGO:** *(Operational)* The official title of the developed Mobile-Based Gym Database Management System for AFFORDA Gym – Cabiao Branch.
* **Ionic Framework:** *(Conceptual)* An open-source UI software development kit for cross-platform applications. *(Operational)* The frontend framework paired with Angular standalone components to build FordaGO's user interface.
* **ISO/IEC 25010:** *(Conceptual)* An international standard for evaluating software product quality. *(Operational)* The evaluation framework assessing FordaGO across Functional Suitability, Usability, Reliability, Security, and Performance Efficiency.
* **Laravel 11:** *(Conceptual)* An open-source PHP web framework following the MVC pattern. *(Operational)* The backend application framework hosting FordaGO’s RESTful API, business logic, and database migrations.
* **Laravel Reverb:** *(Conceptual)* A first-party, high-performance WebSocket server for Laravel. *(Operational)* The real-time messaging engine powering FordaGO’s instant 1-on-1 coach chat, live typing indicators, and proposal notifications.
* **Personal Record (PR):** *(Operational)* Maximum lifting metrics recorded by members for core lifts (Bench Press, Squat, Deadlift) with automated percentage gain calculators.
* **Point-of-Sale (POS):** *(Operational)* The digital supplement and merchandise storefront in FordaGO managing shopping carts, GCash reference verification, cash checkout, and automated inventory deduction.
* **Quick Response (QR) Code:** *(Conceptual)* A two-dimensional optical barcode capable of storing alphanumeric data. *(Operational)* The QR codes used in FordaGO for rapid member turnstile check-ins and equipment tutorial retrieval.
* **Workout Plan Proposal:** *(Operational)* A formal, structured routine schedule dispatched by a coach within a real-time chat conversation containing targeted exercises, time, and pricing for one-tap client acceptance.

---

## 1.11 References

* Baechle, T. R., & Earle, R. W. (2020). *Essentials of strength training and conditioning* (4th ed.). Human Kinetics.
* Codd, E. F. (1970). A relational model of data for large shared data banks. *Communications of the ACM*, 13(6), 377–387. https://doi.org/10.1145/362384.362685
* Creswell, J. W., & Creswell, J. D. (2018). *Research design: Qualitative, quantitative, and mixed methods approaches* (5th ed.). SAGE Publications.
* Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. *MIS Quarterly*, 13(3), 319–340. https://doi.org/10.2307/249008
* Denso Wave. (2023). *QR code essentials and optical barcode scanning*. Retrieved from https://www.qrcode.com/en/about/
* Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* (Doctoral dissertation). University of California, Irvine.
* Glofox. (2024). *Gym management software and boutique studio systems*. Retrieved from https://www.glofox.com/gym-management-software
* Heizer, J., Render, B., & Munson, C. (2020). *Operations management: Sustainability and supply chain management* (13th ed.). Pearson Education.
* Hoffer, J. A., Ramesh, V., & Topi, H. (2020). *Modern database management* (13th ed.). Pearson Education.
* International Organization for Standardization. (2011). *ISO/IEC 25010: Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*. ISO/IEC.
* Laudon, K. C., & Laudon, J. P. (2021). *Management information systems: Managing the digital firm* (17th ed.). Pearson Education.
* Mindbody. (2024). *Fitness and wellness enterprise management software*. Retrieved from https://www.mindbodyonline.com/business/fitness/gym-software
* National Academy of Sports Medicine (NASM). (2022). *NASM essentials of personal fitness training* (7th ed.). Jones & Bartlett Learning.
* Pressman, R. S., & Maxim, B. R. (2020). *Software engineering: A practitioner's approach* (9th ed.). McGraw-Hill Education.
* Republic Act No. 10173. (2012). *Data Privacy Act of 2012*. Republic of the Philippines.
* Richey, R. C. (1994). *Developmental research: The definition and scope*. Association for Educational Communications and Technology (AECT).
* Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). *Database system concepts* (7th ed.). McGraw-Hill Education.
* Sommerville, I. (2019). *Software engineering* (10th ed.). Pearson Education.
* TeamUp. (2024). *Fitness management and member scheduling software*. Retrieved from https://goteamup.com
* Virtuagym. (2024). *Gym management software and coaching mobile solutions*. Retrieved from https://business.virtuagym.com/gym-software
* Zen Planner. (2023). *Boutique gym management software guide*. Retrieved from https://zenplanner.com/gymowner/gym-management-software-guide
