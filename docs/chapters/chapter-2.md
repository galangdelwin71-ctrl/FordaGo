# Chapter II: Research Methodology

## Chapter II

Methodology

### Research Design

This chapter presents the research methodology employed in the conceptualization, development, testing, and evaluation of FordaGO: Mobile-Based Gym Database Management System for AFFORDA Gym – Cabiao Branch. It details the research design, System Development Life Cycle (SDLC), technical development environment, research locale, respondent selection and sampling technique, research instruments, data gathering procedures, ethical safeguards, and statistical tools used in data analysis.

This study utilizes a Developmental Research Design anchored on the Agile Software Development Methodology.

According to Richey (1994) and Richey and Klein (2007), developmental research is the systematic study of designing, developing, and evaluating instructional programs, processes, and software products that must meet criteria of internal consistency, effectiveness, and user acceptability. This research design is appropriate because the primary aim of the study is not merely theoretical inquiry, but the engineering, implementation, and empirical validation of a functional software artifact the FordaGO gym management platform tailored specifically to resolve operational bottlenecks at AFFORDA Gym – Cabiao Branch.


> **Table 1. Core Developmental Activities**

The developers chose the Agile Methodology (Pressman & Maxim, 2020; Sommerville, 2019) over traditional linear waterfall models due to the dynamic, multi-module nature of the project. Agile promotes iterative sprint cycles, frequent integration, continuous client feedback, and rapid response to evolving requirements. Developing FordaGO in modular iterations allowed the team to construct, test, and refine distinct features such as QR front-desk scanning check-ins, interactive equipment orientation catalogs, real-time WebSocket coaching chats, and point-of-sale inventory deductions ensuring seamless horizontal integration across the entire application ecosystem.

System Development Life Cycle (SDLC)

The engineering of FordaGO followed the Agile System Development Life Cycle (SDLC), structured into five systematic, iterative phases:


> **Figure 2. Agile Methodology Framework**


> **Table 2. System Development Life Cycle Phase**

Phase 1: Requirements Gathering and Analysis

The researchers conducted direct on-site observations, process mapping, and structured interviews with the gym owner, front-desk staff, personal trainers, and gym members of AFFORDA Gym – Cabiao Branch.

Problem Identification: Documented the specific operational bottlenecks in the facility, including front-desk queuing caused by manual attendance paper logbooks, unmonitored membership expirations, novice member difficulties with machine execution, lack of structured trainer consultation channels, and manual supplement inventory tracking.

Requirements Specification: Defined the software requirements specification (SRS), categorizing functional requirements into three distinct user roles (Members, Coaches, Administrators) and establishing non-functional benchmarks for security, database integrity, and real-time response latency.

Phase 2: System and Architectural Design

The gathered requirements were translated into comprehensive technical architectures and interface designs:

Database Modeling & Normalization: Modeled relational entity-relationship diagrams (ERD) and normalized database schemas in MySQL up to the Third Normal Form (3NF). Designed tables with strict foreign key constraints for users, membership passes, attendance logs, equipment catalogs, personal records (PRs), workout sessions, coaching proposals, conversations, chat messages, products, and order transactions.

API & WebSocket Channel Architecture: Designed RESTful API route structures in Laravel 11 following standard HTTP verb semantics, secured via Laravel Sanctum token middleware. Designed presence and private WebSocket channels in Laravel Reverb for real-time duplex chat events, unread notifications, and proposal alerts.

UI/UX Wireframing: Constructed high-contrast, theme-aware responsive wireframes using Ionic 8 component libraries, implementing dark fitness themes for mobile screens and structured analytical layouts for the administrative command center.

Phase 3: Development and Implementation

During this phase, full-stack programming was executed across all tiers:

Frontend Mobile & Web Client: Engineered using Ionic 8 and Angular (TypeScript, SCSS) utilizing standalone components and reactive form structures. Integrated Capacitor native plugins (html5-qrcode Web Camera API and QR Code Scanner) to enable high-speed optical QR code decoding via device cameras.

Backend Application Server: Developed using Laravel 11 (PHP 8.2+) implementing the Model-View-Controller (MVC) architectural pattern, Eloquent ORM, Sanctum authentication tokens, Bcrypt password hashing, and custom role-based route middleware (member, coach, admin, employee, super_admin).

Real-Time Communication Layer: Powered by Laravel Reverb and Laravel Echo, establishing continuous TCP WebSocket connections for sub-second in-chat messaging, live typing status broadcasts, and real-time proposal notifications.

Database Layer: Configured in MySQL 8.0, leveraging structured database migrations, database seeders, and atomic transaction rollbacks for concurrent point-of-sale orders and attendance check-ins.

Reporting Engine: Constructed using jsPDF and AutoTable to generate dynamic, client-side vector PDF reports and CSV/Excel spreadsheets.

Phase 4: Integration and System Testing

The system underwent rigorous multi-level verification to ensure functional correctness and system stability:

Unit Testing: Verified individual controller logic, authentication token generation, password recovery verification, and inventory deduction calculations.

Integration Testing: Verified end-to-end data synchronization between the Ionic Angular frontend, Laravel REST API, MySQL database, and Reverb WebSocket server.

Black-Box Functional Testing: Evaluated system operations against test matrices covering QR front-desk scanning check-ins, daily single-attendance constraint verification, equipment QR tutorial loading, in-chat proposal dispatching and acceptance, and Over-the-Counter cash order checkout across physical Android mobile phones and desktop web browsers.

Phase 5: Deployment, Demonstration, and Evaluation

The finalized FordaGO system was deployed to a live cloud Virtual Private Server (VPS) production environment at https://fordago.online and demonstrated to target stakeholders at AFFORDA Gym – Cabiao Branch. Hands-on testing sessions were conducted with gym staff, certified coaches, and members, followed by the administration of the standardized ISO/IEC 25010 software quality evaluation questionnaire.

### Research Locale

This study entitled FordaGO: Mobile-Based Gym Database Management System for AFFORDA Gym – Cabiao Branch was conducted in the Municipality of Cabiao, Nueva Ecija, specifically situated at AFFORDA Gym – Cabiao Branch. Cabiao is a first-class municipality in the southern portion of Nueva Ecija, experiencing sustained commercial growth and an increasing community interest in fitness and athletic wellness. The facility was purposively selected as the empirical research locale based on the following operational criteria:

a. Operational Need for Digitalization. The gym currently operates through manual and semi-manual processes for attendance tracking, pass monitoring, and supplement inventory counts, creating a genuine operational bottleneck suitable for database automation.

b. Diverse and Active Trainee Population. The facility accommodates a broad demographic of fitness enthusiasts ranging from novice gym-goers to seasoned lifters, offering a diverse user population for comprehensive usability and functional evaluation.

c. Support and Willingness from Management. The gym proprietor, administrative reception staff, and accredited fitness coaches demonstrated active willingness to collaborate, participate in pilot testing, and integrate mobile technology into daily workflows. The geographic location of the research locale is illustrated in Figure 3, showing the Municipality of Cabiao, Nueva Ecija where AFFORDA Gym – Cabiao Branch is situated.


> **Figure 3. Map of the Municipality of Cabiao, Nueva Ecija; the Research Locale**

### Respondents of the Study

This study employed Purposive Sampling, a non-probability sampling technique where respondents are chosen deliberately based on predefined inclusion criteria relevant to the technical and operational assessment of the system (Creswell & Creswell, 2018).

Inclusion Criteria:

Technical Experts: Must hold a bachelor’s degree or professional background in Information Technology, Computer Science, or Software Engineering, with at least two (2) years of professional experience in software development, database administration, or systems analysis.

End-Users: Must be an active member, certified personal trainer/coach, front-desk employee, or administrator of AFFORDA Gym – Cabiao Branch who actively engages in daily gym operations.

A total of twenty (20) respondents were selected using purposive sampling, categorized into two evaluation groups: five (5) Technical Experts (IT Professionals, Software Engineers, and Systems Analysts) and fifteen (15) End-Users of AFFORDA Gym – Cabiao Branch. The end-user cohort was specifically stratified into two (2) gym owners/administrators, one (1) front-desk administrative staff member, and twelve (12) active gym members and gym-goers.


> **Table 3. Total Respondents**

### Research Instrument

The primary research instrument used to evaluate the system was a structured survey questionnaire adapted from the ISO/IEC 25010 Systems and Software Quality Requirements and Evaluation (SQuaRE) model (ISO, 2011).

The evaluation instrument for IT Experts comprehensively assessed all eight (8) software product quality characteristics under the ISO/IEC 25010 model across thirty-three (33) standardized parameter indicators:

Functional Suitability: Evaluates the degree to which system features (QR front-desk QR scanner attendance, equipment tutorial scanner, PR milestone tracker, split routine planner, in-chat workout proposals, supplement POS, and PDF/Excel report export) completely and correctly satisfy user operational requirements.

Usability: Measures interface aesthetics, clarity of navigation, ease of learning, feature accessibility, and the effectiveness of interactive onboarding guides.

Reliability: Assesses system operational consistency, fault tolerance, transaction recoverability, and stable data persistence during concurrent operations.

Security: Evaluates role-based access control (RBAC), token authentication, password encryption (Bcrypt), and the safeguarding of user personal and transactional records against unauthorized manipulation.

Performance Efficiency: Evaluates API response speeds, database query execution times, WebSocket real-time message throughput, and mobile camera QR code scanning responsiveness under normal operational loads.

A 5-Point Likert Scale was utilized across all questionnaire items, consistent with the standard evaluation rubrics established by the College of Information and Communications Technology (CICT).


> **Table 4. The 5-Point Likert Scale Reference**

### Data Gathering Procedure

The researchers executed a systematic, five-stage data gathering procedure:


> **Table 5. The Five-Stage Data Gathering Procedure**

Phase 1: Protocol and Consent Securing

The researchers submitted a formal letter of request to the management of AFFORDA Gym – Cabiao Branch to obtain administrative authorization for research, personnel interviews, and on-site system testing. Informed consent forms outlining research objectives were distributed to all respondents prior to participation.

Phase 2: System Verification and Local Deployment

The FordaGO backend API, MySQL database, and Reverb WebSocket server were configured and deployed live on a dedicated Linux Cloud Virtual Private Server (VPS) utilizing Podman container orchestration. This live cloud hosting enabled 24/7 internet-based access for gym management, coaches, and members. Production APK builds were installed on Android mobile devices to test camera-based QR scanning and real-time WebSocket synchronization over public internet connections.

Phase 3: Live Demonstration and Hands-On User Testing

The researchers conducted comprehensive demonstration sessions at AFFORDA Gym – Cabiao Branch. Evaluators were given guided hands-on access to test all primary system workflows:

Members tested QR attendance check-in, equipment printed QR code label scanning, PR logging, split routine creation, coach messaging, and supplement cart checkout.

Coaches tested client roster management, availability configuration, group class publishing, and in-chat workout proposal dispatching.

Administrators tested camera front-desk scanning check-ins, order payment approvals, equipment printed label printing, and PDF/Excel report exporting.

Phase 4: Questionnaire Administration

Immediately following hands-on testing, the structured ISO/IEC 25010 survey questionnaires were administered to the technical experts and end-users. The researchers provided clarification on technical terms when requested while maintaining strict impartiality.

Phase 5: Statistical Processing and Interpretation

All completed questionnaires were gathered, tabulated, and entered into statistical spreadsheets for numerical computation, weighted mean calculation, and qualitative interpretation.

Ethical Considerations

The researchers strictly adhered to ethical research guidelines and legal standards throughout the study:

Informed Consent & Voluntary Participation:

All participants were fully briefed on the purpose, procedures, and scope of the evaluation before participating. Participation was entirely voluntary, and respondents retained the right to withdraw at any stage without consequence.

Confidentiality and Anonymity:

Personal information and individual scoring results were kept strictly confidential. Evaluation data were reported as aggregated statistical figures to protect the identity of all respondents.

Compliance with Republic Act No. 10173 (Data Privacy Act of 2012):

The FordaGO application adheres to principles of transparency, legitimate purpose, and proportionality. Sensitive member data, passwords, and transaction records stored within the MySQL database are protected using Bcrypt encryption, Sanctum authentication tokens, and strict role-based access controls.

Academic Integrity:

All literature, frameworks, software libraries, and methodologies referenced throughout this study are cited in accordance with APA 7th edition standards.

### Statistical Treatment of Data

The quantitative data gathered from the ISO/IEC 25010 evaluation questionnaires were analyzed using descriptive statistics, specifically the Weighted Mean (WM), Composite Mean (CM), and Percentage Distribution.

1. Percentage Distribution Formula

Used to determine the proportional distribution of respondent categories:

Where:

= Percentage

= Number of respondents in a specific category

N = Total number of respondents (N = 20; n = 5 for IT Experts, n = 15 for End-Users)

2. Weighted Mean Formula

The Weighted Mean was computed for each indicator across the evaluated software quality criteria:

Where:

= Weighted Mean of the criterion

= Frequency of responses for each rating scale

= Numerical weight assigned to each response scale ()

N = Total number of respondents (N = 20; n = 5 for IT Experts, n = 15 for End-Users)

3. Composite Mean Formula

The overall software quality of FordaGO across all evaluated ISO/IEC 25010 characteristics was calculated using the Composite Mean:

Where:

= Composite Mean of the overall software evaluation

= Sum of the weighted means of all criteria

k = Total number of evaluated quality criteria (k = 8 for IT Experts, k = 4 for End-Users)

4. Verbal Interpretation Scale

The calculated mean scores were interpreted using the following standard statistical range formula:


> **Table 6. The Verbal Interpretation Scale**

This statistical framework provided an objective, empirical basis for verifying whether FordaGO achieved the required software engineering standards for operational deployment at AFFORDA Gym – Cabiao Branch.

