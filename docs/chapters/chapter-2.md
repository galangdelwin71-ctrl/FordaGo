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

# CHAPTER II: RESEARCH METHODOLOGY

This chapter presents the research methodology employed in the conceptualization, development, testing, and evaluation of **FordaGO: Mobile-Based Gym Database Management System for AFFORDA Gym – Cabiao Branch**. It details the research design, system development life cycle (SDLC), technical development environment, research locale, respondent selection and sampling technique, research instruments, data gathering procedures, ethical safeguards, and statistical tools used in data analysis.

---

## 2.1 Research Design

This study utilizes a **Developmental Research Design** anchored on the **Agile Software Development Methodology**.

According to Richey (1994) and Richey and Klein (2007), developmental research is the systematic study of designing, developing, and evaluating instructional programs, processes, and software products that must meet criteria of internal consistency, effectiveness, and user acceptability. This research design is appropriate because the primary aim of the study is not merely theoretical inquiry, but the engineering, implementation, and empirical validation of a functional software artifact—the FordaGO gym management platform—tailored specifically to resolve operational bottlenecks at **AFFORDA Gym – Cabiao Branch**.

| Phase / Track | Core Developmental Activities | Evaluative Feedback Loop |
| :--- | :--- | :--- |
| **Sprint Iterations (Engineering)** | **1.** Continuous Requirements Elicitation<br>**2.** UI/UX & Wireframe Prototyping<br>**3.** Full-Stack Programming (Ionic/Laravel)<br>**4.** Automated & Module Testing<br>**5.** Working Build Demonstrations | ➔ **Iterative Feedback** to Refine Features |
| **ISO/IEC 25010 Quality Evaluation** | **1.** Functional Suitability Testing<br>**2.** Usability & Navigation Audits<br>**3.** Operational Reliability Checks<br>**4.** Security & Encryption Verification<br>**5.** Performance Latency Benchmarks | ➔ **Refinements & Bug Resolution** to Sprints |
<p align="center"><b>Figure 3.</b> <i>Agile Developmental Research Workflow for FordaGO</i></p>

The researchers chose the **Agile Methodology** (Pressman & Maxim, 2020; Sommerville, 2019) over traditional linear waterfall models due to the dynamic, multi-module nature of the project. Agile promotes iterative sprint cycles, frequent integration, continuous client feedback, and rapid response to evolving requirements. Developing FordaGO in modular iterations allowed the team to construct, test, and refine distinct features—such as QR turnstile check-ins, interactive equipment orientation catalogs, real-time WebSocket coaching chats, and point-of-sale inventory deductions—ensuring seamless horizontal integration across the entire application ecosystem.

---

## 2.2 System Development Life Cycle (SDLC)

The engineering of FordaGO followed the **Agile System Development Life Cycle (SDLC)**, structured into five systematic, iterative phases:

| SDLC Phase | Focus Area | Key Deliverables & Outputs |
| :---: | :--- | :--- |
| **Phase 1** | **Requirements Gathering & Analysis** | On-site interviews, SRS documentation, role matrix definition |
| **Phase 2** | **System & Architectural Design** | 3NF database ERDs, RESTful API endpoints, UI wireframes |
| **Phase 3** | **Development & Implementation** | Ionic 8 / Angular frontend, Laravel 11 API, Reverb WebSockets |
| **Phase 4** | **Integration & System Testing** | Unit tests, camera barcode scanner tests, end-to-end verification |
| **Phase 5** | **Deployment & Evaluation** | On-premise deployment, live demos, ISO/IEC 25010 survey evaluation |
<p align="center"><b>Figure 4.</b> <i>Agile System Development Life Cycle (SDLC) Phases of FordaGO</i></p>

### Phase 1: Requirements Gathering and Analysis
The researchers conducted direct on-site observations, process mapping, and structured interviews with the gym owner, front-desk staff, personal trainers, and gym members of **AFFORDA Gym – Cabiao Branch**.
* **Problem Identification:** Documented the specific operational bottlenecks in the facility, including front-desk queuing caused by manual attendance paper logbooks, unmonitored membership expirations, novice member difficulties with machine execution, lack of structured trainer consultation channels, and manual supplement inventory tracking.
* **Requirements Specification:** Defined the software requirements specification (SRS), categorizing functional requirements into three distinct user roles (Members, Coaches, Administrators) and establishing non-functional benchmarks for security, database integrity, and real-time response latency.

### Phase 2: System and Architectural Design
The gathered requirements were translated into comprehensive technical architectures and interface designs:
* **Database Modeling & Normalization:** Modeled relational entity-relationship diagrams (ERD) and normalized database schemas in MySQL up to the Third Normal Form (3NF). Designed tables with strict foreign key constraints for users, membership passes, attendance logs, equipment catalogs, personal records (PRs), workout sessions, coaching proposals, conversations, chat messages, products, and order transactions.
* **API & WebSocket Channel Architecture:** Designed RESTful API route structures in Laravel 11 following standard HTTP verb semantics, secured via Laravel Sanctum token middleware. Designed presence and private WebSocket channels in Laravel Reverb for real-time duplex chat events, unread notifications, and proposal alerts.
* **UI/UX Wireframing:** Constructed high-contrast, theme-aware responsive wireframes using Ionic 8 component libraries, implementing dark fitness themes for mobile screens and structured analytical layouts for the administrative command center.

### Phase 3: Development and Implementation
During this phase, full-stack programming was executed across all tiers:
* **Frontend Mobile & Web Client:** Engineered using **Ionic 8** and **Angular** (TypeScript, SCSS) utilizing standalone components and reactive form structures. Integrated Capacitor native plugins (Capacitor Camera and Barcode Scanner) to enable high-speed optical QR code decoding via device cameras.
* **Backend Application Server:** Developed using **Laravel 11 (PHP 8.2+)** implementing the Model-View-Controller (MVC) architectural pattern, Eloquent ORM, Sanctum authentication tokens, Bcrypt password hashing, and custom role-based route middleware (`member`, `coach`, `admin`, `employee`, `super_admin`).
* **Real-Time Communication Layer:** Powered by **Laravel Reverb** and **Laravel Echo**, establishing continuous TCP WebSocket connections for sub-second in-chat messaging, live typing status broadcasts, and real-time proposal notifications.
* **Database Layer:** Configured in **MySQL 8.0**, leveraging structured database migrations, database seeders, and atomic transaction rollbacks for concurrent point-of-sale orders and attendance check-ins.
* **Reporting Engine:** Constructed using **jsPDF** and **AutoTable** to generate dynamic, client-side vector PDF reports and CSV/Excel spreadsheets.

### Phase 4: Integration and System Testing
The system underwent rigorous multi-level verification to ensure functional correctness and system stability:
* **Unit Testing:** Verified individual controller logic, authentication token generation, password recovery verification, and inventory deduction calculations.
* **Integration Testing:** Verified end-to-end data synchronization between the Ionic Angular frontend, Laravel REST API, MySQL database, and Reverb WebSocket server.
* **Black-Box Functional Testing:** Evaluated system operations against test matrices covering QR turnstile check-ins, anti-pass-sharing timestamp verification, equipment QR tutorial loading, in-chat proposal dispatching and acceptance, and GCash order checkout across physical Android mobile phones and desktop web browsers.

### Phase 5: Deployment, Demonstration, and Evaluation
The finalized FordaGO system was deployed in a local network test environment and demonstrated to target stakeholders at AFFORDA Gym – Cabiao Branch. Hands-on testing sessions were conducted with gym staff, certified coaches, and members, followed by the administration of the standardized **ISO/IEC 25010** software quality evaluation questionnaire.

---

## 2.3 Locale of the Study

The study was conducted at **AFFORDA Gym – Cabiao Branch**, located in the municipality of **Cabiao, Nueva Ecija, Philippines**.

| Parameter | Description |
| :--- | :--- |
| **Facility Name** | AFFORDA Gym – Cabiao Branch |
| **Location** | Cabiao, Nueva Ecija, Philippines |
| **Environment** | Commercial Fitness Center & Strength Conditioning Facility |
| **Target User Base** | Gym Owner, Front-Desk Staff, Certified Coaches, Active Gym Members |

AFFORDA Gym – Cabiao Branch was selected as the research locale because it represents an active commercial gym environment that currently utilizes manual logbooks for attendance, paper-based membership tracking, and physical inventory lists. This location provides an authentic operational setting to deploy, evaluate, and test the capabilities of the FordaGO platform under real daily gym conditions.

---

## 2.4 Population and Sampling Technique

This study employed **Purposive Sampling**, a non-probability sampling technique where respondents are chosen deliberately based on predefined inclusion criteria relevant to the technical and operational assessment of the system (Creswell & Creswell, 2018).

### Inclusion Criteria:
1. **Technical Experts:** Must hold a bachelor’s degree or professional background in Information Technology, Computer Science, or Software Engineering, with at least two (2) years of professional experience in software development, database administration, or systems analysis.
2. **End-Users:** Must be an active member, certified personal trainer/coach, front-desk employee, or administrator of AFFORDA Gym – Cabiao Branch who actively engages in daily gym operations.

A total of **fifteen (15) respondents** were selected, categorized into two evaluation groups:

| Evaluator Category | Specific Role / Expertise | Count ($n$) | Percentage (%) |
| :--- | :--- | :---: | :---: |
| **1. Technical Experts** | IT Professionals, Software Developers, Database Administrators | 5 | 33.33% |
| **2. End-Users** | Gym Owner & Front-Desk Staff | 2 | 13.33% |
| | Certified Personal Trainers / Coaches | 3 | 20.00% |
| | Active Gym Members | 5 | 33.34% |
| **TOTAL RESPONDENTS** | | **15** | **100.00%** |

---

## 2.5 Research Instrument

The primary research instrument used to evaluate the system was a structured survey questionnaire adapted from the **ISO/IEC 25010 Systems and Software Quality Requirements and Evaluation (SQuaRE)** model (ISO, 2011).

The instrument assessed five (5) core software product quality characteristics:

1. **Functional Suitability:** Evaluates the degree to which system features (QR turnstile attendance, equipment tutorial scanner, PR milestone tracker, split routine planner, in-chat workout proposals, supplement POS, and PDF/Excel report export) completely and correctly satisfy user operational requirements.
2. **Usability:** Measures interface aesthetics, clarity of navigation, ease of learning, feature accessibility, and the effectiveness of interactive onboarding guides.
3. **Reliability:** Assesses system operational consistency, fault tolerance, transaction recoverability, and stable data persistence during concurrent operations.
4. **Security:** Evaluates role-based access control (RBAC), token authentication, password encryption (Bcrypt), and the safeguarding of user personal and transactional records against unauthorized manipulation.
5. **Performance Efficiency:** Evaluates API response speeds, database query execution times, WebSocket real-time message throughput, and mobile camera barcode scanning responsiveness under normal operational loads.

A **4-Point Likert Scale (Forced-Choice)** was utilized across all questionnaire items, consistent with the standard evaluation rubrics established by the College of Information and Communications Technology (CICT).

| Scale | Numerical Range | Descriptive Rating | Verbal Interpretation |
| :---: | :---: | :--- | :--- |
| **4** | 3.26 – 4.00 | Strongly Agree (SA) | Excellent / Highly Acceptable |
| **3** | 2.51 – 3.25 | Agree (A) | Very Good / Acceptable |
| **2** | 1.76 – 2.50 | Disagree (D) | Fair / Needs Improvement |
| **1** | 1.00 – 1.75 | Strongly Disagree (SD) | Poor / Unacceptable |

---

## 2.6 Data Gathering Procedure

The researchers executed a systematic, five-stage data gathering procedure:

| Stage | Data Gathering Phase | Primary Activity |
| :---: | :--- | :--- |
| **Phase 1** | Protocol & Consent Securing | Submitting permission letters and distributing informed consent forms |
| **Phase 2** | System Verification & Deployment | Deploying LAN servers and configuring Android APK test builds |
| **Phase 3** | Demonstration & Hands-On User Testing | Guiding respondents through attendance, coaching, POS, and export workflows |
| **Phase 4** | Questionnaire Administration | Administering the 20-item ISO/IEC 25010 4-point Likert instrument |
| **Phase 5** | Statistical Processing & Analysis | Computing weighted means, composite means, and grand overall means |

### Phase 1: Protocol and Consent Securing
The researchers submitted a formal letter of request to the management of AFFORDA Gym – Cabiao Branch to obtain administrative authorization for research, personnel interviews, and on-site system testing. Informed consent forms outlining research objectives were distributed to all respondents prior to participation.

### Phase 2: System Verification and Local Deployment
The FordaGO backend API, MySQL database, and Reverb WebSocket server were configured and deployed within a local wireless area network (LAN) environment. APK builds were installed on mobile Android test devices to ensure full hardware camera scanner functionality.

### Phase 3: Live Demonstration and Hands-On User Testing
The researchers conducted comprehensive demonstration sessions at AFFORDA Gym – Cabiao Branch. Evaluators were given guided hands-on access to test all primary system workflows:
* Members tested QR attendance check-in, equipment QR placard scanning, PR logging, split routine creation, coach messaging, and supplement cart checkout.
* Coaches tested client roster management, availability configuration, group class publishing, and in-chat workout proposal dispatching.
* Administrators tested camera turnstile check-ins, order payment approvals, equipment placard printing, and PDF/Excel report exporting.

### Phase 4: Questionnaire Administration
Immediately following hands-on testing, the structured ISO/IEC 25010 survey questionnaires were administered to the technical experts and end-users. The researchers provided clarification on technical terms when requested while maintaining strict impartiality.

### Phase 5: Statistical Processing and Interpretation
All completed questionnaires were gathered, tabulated, and entered into statistical spreadsheets for numerical computation, weighted mean calculation, and qualitative interpretation.

---

## 2.7 Ethical Considerations

The researchers strictly adhered to ethical research guidelines and legal standards throughout the study:

* **Informed Consent & Voluntary Participation:** All participants were fully briefed on the purpose, procedures, and scope of the evaluation before participating. Participation was entirely voluntary, and respondents retained the right to withdraw at any stage without consequence.
* **Confidentiality and Anonymity:** Personal information and individual scoring results were kept strictly confidential. Evaluation data were reported as aggregated statistical figures to protect the identity of all respondents.
* **Compliance with Republic Act No. 10173 (Data Privacy Act of 2012):** The FordaGO application adheres to principles of transparency, legitimate purpose, and proportionality. Sensitive member data, passwords, and transaction records stored within the MySQL database are protected using Bcrypt encryption, Sanctum authentication tokens, and strict role-based access controls.
* **Academic Integrity:** All literature, frameworks, software libraries, and methodologies referenced throughout this study are cited in accordance with APA 7th edition standards.

---

## 2.8 Statistical Treatment of Data

The quantitative data gathered from the ISO/IEC 25010 evaluation questionnaires were analyzed using descriptive statistics, specifically the **Weighted Mean (WM)**, **Composite Mean (CM)**, and **Percentage Distribution**.

### 1. Percentage Distribution Formula
Used to determine the proportional distribution of respondent categories:

$$P = \left( \frac{n}{N} \right) \times 100$$

Where:
* $P$ = Percentage
* $n$ = Number of respondents in a specific category
* $N$ = Total number of respondents ($N = 15$)

### 2. Weighted Mean Formula
The Weighted Mean was computed for each indicator across the evaluated software quality criteria:

$$\overline{X} = \frac{\sum (f \cdot x)}{N}$$

Where:
* $\overline{X}$ = Weighted Mean of the criterion
* $f$ = Frequency of responses for each rating scale
* $x$ = Numerical weight assigned to each response scale ($4, 3, 2, 1$)
* $N$ = Total number of respondents ($N = 15$)

### 3. Composite Mean Formula
The overall software quality of FordaGO across all evaluated ISO/IEC 25010 characteristics was calculated using the Composite Mean:

$$CM = \frac{\sum \overline{X}}{k}$$

Where:
* $CM$ = Composite Mean of the overall software evaluation
* $\sum \overline{X}$ = Sum of the weighted means of all criteria
* $k$ = Total number of evaluated quality criteria ($k = 8$ for IT Experts, $k = 4$ for Staff, $k = 3$ for Members)

### 4. Verbal Interpretation Scale
The calculated mean scores were interpreted using the following standard statistical range formula:

$$\text{Scale Range} = \frac{\text{Highest Weight} - \text{Lowest Weight}}{\text{Number of Scales}} = \frac{4 - 1}{4} = \frac{3}{4} = 0.75$$

| Rating Scale | Weighted Mean Range | Descriptive Evaluation | Verbal Interpretation |
| :---: | :---: | :---: | :---: |
| **4** | **3.26 – 4.00** | **Strongly Agree** | **Excellent Quality / Highly Acceptable** |
| **3** | **2.51 – 3.25** | **Agree** | **Very Good Quality / Acceptable** |
| **2** | **1.76 – 2.50** | **Disagree** | **Fair Quality / Needs Improvement** |
| **1** | **1.00 – 1.75** | **Strongly Disagree** | **Poor Quality / Unacceptable** |

This statistical framework provided an objective, empirical basis for verifying whether FordaGO achieved the required software engineering standards for operational deployment at **AFFORDA Gym – Cabiao Branch**.

---

## 2.9 References

* Creswell, J. W., & Creswell, J. D. (2018). *Research design: Qualitative, quantitative, and mixed methods approaches* (5th ed.). SAGE Publications.
* International Organization for Standardization. (2011). *ISO/IEC 25010: Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*. ISO/IEC.
* Pressman, R. S., & Maxim, B. R. (2020). *Software engineering: A practitioner's approach* (9th ed.). McGraw-Hill Education.
* Republic Act No. 10173. (2012). *Data Privacy Act of 2012*. Republic of the Philippines.
* Richey, R. C. (1994). *Developmental research: The definition and scope*. Association for Educational Communications and Technology (AECT).
* Richey, R. C., & Klein, J. D. (2007). *Design and development research: Methods, strategies, and issues*. Lawrence Erlbaum Associates.
* Sommerville, I. (2019). *Software engineering* (10th ed.). Pearson Education.
