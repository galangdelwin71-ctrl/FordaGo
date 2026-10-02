# Chapter I: The Problem and Its Background

## Chapter I

The Problem and Its Background

This chapter serves as the foundation upon which the entire study is built. It introduces the readers to the situation that led to the development of the project and explains why the study was conducted in the first place. This section establishes the context by describing the current situation, identifying the gaps or challenges in existing systems, and presenting the real-world issues that the project seeks to address.

### Introduction

Fitness centers and commercial gyms play an indispensable role in promoting physical health, athletic conditioning, and active lifestyles by providing communities with exercise machinery, conditioning spaces, and professional fitness instruction. As public consciousness regarding physical well-being continues to rise, fitness centers experience a steady influx of members who require systematic management of registration, attendance logging, personal workout tracking, equipment orientation, coaching consultation, and inventory management. To maintain operational efficiency, financial transparency, and high customer retention, modern fitness establishments must transition from traditional, manual workflows to integrated, database-driven digital platforms.

At present, AFFORDA Gym – Cabiao Branch, situated in the municipality of Cabiao, Nueva Ecija, operates primarily through manual and semi-manual administrative procedures. One of the most pronounced operational bottlenecks in the facility is attendance monitoring. The gym currently utilizes physical paper logbooks positioned at the front desk where entering members must queue, manually write down their full names, log their arrival timestamps, and append their signatures. During peak workout hours (early morning and late afternoon), this manual procedure causes severe front-desk congestion, introduces recording delays, and produces illegible or incomplete entries. Furthermore, paper logbooks are vulnerable to physical wear and tear, moisture damage, and unauthorized viewing of member names, while historical attendance retrieval for audit, membership verification, or capacity planning requires tedious, time-consuming manual leafing through stacks of past paper records.

In addition to attendance difficulties, managing membership plans and daily visit passes on physical ledgers or fragmented spreadsheets presents significant administrative challenges. Gym staff face difficulty in instantly verifying whether an entering patron possesses an active 30-day Premium Pass, an unexpired session pass, or an outstanding payment balance. Similarly, the gym’s inventory—consisting of protein powders, pre-workout supplements, energy drinks, and gym merchandise is tracked through manual stock counts, frequently leading to discrepancies between recorded sales and physical shelf inventory.

Another critical concern inside AFFORDA Gym – Cabiao Branch involves member onboarding and exercise guidance. Novice gym-goers and casual members often struggle with understanding the proper mechanics, safety adjustments, and targeted muscle groups of specialized exercise machines and free-weight equipment. Without immediate instructional guidance from on-duty staff, beginners risk improper exercise execution, muscular strain, and workout discouragement. While certified fitness coaches operate within the gym, there is no centralized, structured digital platform to connect members with trainers for private consultation, customized workout plan dispatching, scheduling, or group fitness class enrollment.

To solve these compounding operational and customer-support challenges, modern mobile computing and web technologies offer an efficient, scalable, and centralized solution. By leveraging Quick Response (QR) code technology, mobile applications, real-time WebSocket communication, and relational database systems, gym operations can be completely digitized into a paperless, interactive fitness ecosystem.

Review of Related Literature

Gym Management Systems and Digital Transformation

Information technology has significantly influenced the management and operation of various organizations, including fitness centers and gyms. As the number of gym members and services offered by fitness facilities continues to increase, traditional methods such as paper-based records, spreadsheets, and manual transactions are gradually being replaced by computerized management systems. These systems improve the efficiency, accuracy, accessibility, and security of organizational information.

Traditional gym operations that rely heavily on manual records may result in administrative delays, data duplication, human error, and difficulties in retrieving information. A Gym Management System (GMS) provides a centralized platform for managing essential gym activities, including member registration, membership monitoring, attendance recording, payment transactions, scheduling, and report generation. By automating these processes, gym personnel can manage daily operations more efficiently while providing members with improved access to their information and services.

Database Management Systems

Database Management Systems (DBMS) serve as an essential component of modern information systems because they provide an organized method for storing, managing, and retrieving large amounts of data. A DBMS enables organizations to structure information through tables, relationships, queries, and other database mechanisms. In a gym management environment, the database can store member profiles, account credentials, membership plans, attendance records, workout information, payment transactions, equipment records, and inventory data.

Relational Database Management Systems (RDBMS) organize information into related tables connected through primary and foreign keys. Proper relational database design helps minimize data redundancy while maintaining data integrity and consistency. For a gym management system, an RDBMS such as MySQL can establish relationships among members, subscriptions, attendance records, transactions, equipment, and inventory. This allows information to be stored systematically and retrieved efficiently when needed.

Attendance Monitoring and QR Code Technology

Attendance monitoring is an important function in organizations that need to track user presence and participation. Traditional attendance methods, such as paper logbooks, can result in inaccurate entries, lost records, and delays in retrieving attendance information. Digital attendance systems provide a more efficient approach by automatically recording user check-ins and storing attendance data in a centralized database.

QR code technology has become widely used for identification, authentication, payment, ticketing, and attendance monitoring. QR codes allow information to be encoded into a machine-readable format that can be quickly scanned using compatible devices. In a gym environment, QR codes can be assigned to members to facilitate faster attendance recording. QR codes can also be placed on gym equipment to provide members with digital access to equipment instructions, workout guides, and targeted muscle information. This functionality reduces reliance on manual procedures while improving accessibility to fitness-related resources.

Mobile-Based Application

The widespread use of smartphones has contributed to the development of mobile-based information systems that allow users to access services conveniently. Mobile applications can provide gym members with access to their profiles, membership information, attendance history, workout schedules, fitness records, notifications, and instructional materials. These features allow members to interact with gym services without relying solely on physical or desktop-based transactions.

Hybrid mobile application frameworks such as Ionic and Angular allow developers to build applications using web technologies while supporting deployment across multiple platforms. This approach provides a unified development environment while allowing access to device capabilities such as cameras and local storage. In the proposed system, mobile technology supports member access to gym services while also providing administrators and coaches with convenient tools for managing member activities.

Real-Time Communication and Notification Systems

Real-time communication is an important feature for applications that require immediate interaction between users. Traditional request-and-response methods may require repeated requests or page refreshing to retrieve updated information. WebSocket technology addresses this limitation by enabling persistent, bidirectional communication between clients and servers.

In a gym management environment, real-time communication can be used for coach–trainee messaging, workout proposal notifications, and other activity updates. Notification features can also remind members about scheduled workouts, activities, or other important updates. These functions can improve communication between gym members and coaches while supporting more consistent participation in fitness activities.

Inventory Management and Point-of-Sale Integration

Inventory management is another important component of gym operations, particularly for facilities that sell supplements and other fitness-related products. An inventory management system allows administrators to monitor product availability, stock quantities, and transaction records. Maintaining accurate inventory information helps prevent stock discrepancies and supports more efficient management of available resources.

Point-of-Sale (POS) integration further improves inventory and transaction management by connecting customer purchases with inventory records. POS transactions can automatically update product stock after an approved purchase while maintaining transaction records and verified receipts. Front-desk transaction logging and payment reference verification support accurate bookkeeping, eliminate physical ledger reconciliation errors, and improve financial record management.

Information Security and Data Privacy

Data security is an essential consideration in the development of information systems because these systems handle personal, financial, and operational information. Gym management systems may store information such as member profiles, account credentials, attendance records, payment information, and fitness-related records. Therefore, appropriate security measures must be implemented to prevent unauthorized access, data loss, and misuse of information.

Information systems can support data protection through mechanisms such as role-based access control, secure password hashing, user authentication, access restrictions, and secure data storage. These measures help maintain the confidentiality, integrity, and availability of information stored within the system while ensuring that users can only access information appropriate to their roles.

Data Analytics and Reporting

Information systems also support organizational decision-making through data analytics and report generation. By collecting and organizing operational data, systems can generate reports that provide administrators with useful information regarding attendance patterns, membership activities, transactions, inventory, and fitness progress. These reports can help administrators identify trends, monitor operations, and make informed management decisions.

For the proposed Gym Management System, automated reporting can generate attendance records, transaction histories, fitness progress summaries, inventory information, and administrative reports. Dynamic PDF and Excel exports can further improve the accessibility and usability of these records for documentation, monitoring, and evaluation.

System Development Methodology

The development of an information system requires a systematic approach to ensure that its requirements, functionality, usability, and reliability are properly addressed. The System Development Life Cycle (SDLC) provides a structured process for planning, analyzing, designing, developing, testing, implementing, and maintaining software systems.

For systems requiring continuous improvement and user feedback, Agile development practices can also be incorporated into the development process. Requirements can be analyzed and prioritized through iterative development cycles, allowing system features to be tested and refined based on identified requirements and evaluation results. In the proposed system, software development includes requirements analysis, system architecture and UI/UX design, database modeling, backend API development, mobile application development, system integration, testing, and quality evaluation.

Gaps in the Literature

Despite significant commercial advancements in fitness club software, several critical operational and research gaps remain evident in the existing literature and market solutions. First, most established platforms such as Virtuagym, Mindbody, and Glofox are architected as monolithic, high-cost enterprise SaaS systems designed for corporate franchise gyms with extensive front-desk QR scanner hardware and recurring subscription budgets. Consequently, independent and community-level gyms in emerging municipalities such as AFFORDA Gym – Cabiao Branch in Nueva Ecija remain unserved due to prohibitive subscription fees and complex hardware dependencies. Second, current gym solutions frequently maintain isolated functional silos: attendance tracking is segregated from inventory management, and equipment orientation lacks direct, interactive linkage with member routine planners. There is an absence of an affordable, mobile-centric ecosystem that integrates digital QR code attendance, real-time equipment visual guidance via direct machine scanning, certified coach-client consultation, and point-of-sale inventory tracking into a unified database architecture. These documented gaps substantiate the pressing necessity for FordaGO: a localized, responsive, and robust Mobile-Based Gym Database Management System engineered to address the specific socioeconomic and administrative requirements of local fitness enterprises.

Review of Related System

1. Virtuagym Fitness Management System

Virtuagym is a comprehensive fitness management platform designed for gyms, fitness centers, and personal trainers. It provides features such as membership management, workout tracking, scheduling, payment management, and mobile application access. Through its mobile platform, members can monitor their workouts and fitness progress, while coaches can provide training programs and guidance. Administrators can also manage member profiles, attendance, and subscriptions through a centralized system.

One of the major strengths of Virtuagym is its integration of fitness management and workout tracking within a single platform. However, its features are primarily designed for general fitness management and may not fully address localized workflows specific to smaller Philippine gyms.

Relation to the Proposed System:

Virtuagym is related to the proposed FordaGO system because both aim to digitalize gym operations and provide members with access to membership and workout-related information. However, FordaGO is specifically designed for AFFORDA Gym – Cabiao Branch and incorporates QR code attendance monitoring and equipment QR scanning for accessing machine instructions and media guides.

2. Zen Planner Gym Management Software

Zen Planner is a gym management platform designed to help fitness businesses manage memberships, attendance, scheduling, billing, and member activities. It provides administrators with tools for tracking member information, managing classes, processing payments, and generating operational reports.

The system reduces administrative workload by automating several tasks, including membership management, payment tracking, and notifications. However, its broad range of features may require staff training. It also does not specifically focus on equipment-level QR tutorials or integrated real-time coaching communication.

Relation to the Proposed System:

Zen Planner is similar to FordaGO in terms of membership management, attendance monitoring, payment processing, and reporting. However, FordaGO extends these functions through QR-based attendance, equipment information access, real-time coach–trainee communication, and workout proposal features designed for the specific needs of the target gym.

3. Mindbody Gym Management Software

Mindbody is a comprehensive business management platform used by fitness centers, wellness facilities, gyms, and other service-based businesses. Its features include membership management, class scheduling, payment processing, customer profiles, attendance tracking, and business reporting.

The platform provides a wide range of management tools that can help businesses organize their daily operations. However, its general-purpose design may require customization or additional services to accommodate specific local workflows.

Relation to the Proposed System:

Mindbody and FordaGO both aim to replace manual record-keeping with digital management systems. However, FordaGO focuses specifically on the operational requirements of AFFORDA Gym – Cabiao Branch. It incorporates QR-based attendance, equipment scanning, personal fitness records, real-time trainer communication, and localized payment verification.

4. Glofox Gym Management System

Glofox is a gym and fitness studio management platform designed to simplify membership management, class scheduling, digital check-ins, payment processing, and member engagement. It also provides mobile functionality that allows members to manage memberships, view schedules, and interact with gym services.

Glofox provides an organized digital environment for managing gym operations and monitoring member participation. However, some functionalities may depend on integrations with other services or hardware. It also does not primarily focus on equipment-level QR instructional content and integrated coaching proposals.

Relation to the Proposed System:

Glofox is comparable to FordaGO because both use digital and mobile technologies to manage gym operations and member activities. FordaGO, however, adds QR scanning for both attendance and equipment information, allowing members to access instructional content directly through their mobile devices.

5. TeamUp Fitness Management System

TeamUp is a cloud-based fitness management platform designed to help gyms and fitness studios manage memberships, schedules, bookings, attendance, and payments. Its digital dashboard provides administrators with tools for organizing member information and monitoring daily operations.

The platform provides a straightforward approach to managing memberships and group activities. However, its primary focus is on scheduling and customer management rather than personalized fitness tracking, equipment assistance, and real-time trainer communication.

Relation to the Proposed System:

TeamUp is related to FordaGO because both systems provide digital membership management and attendance monitoring. However, FordaGO expands these capabilities through QR-based attendance, equipment scanning, personal record tracking, real-time trainer communication, workout proposals, and localized transaction management.

### Conceptual Framework

The proposed Gym Management System follows the Input–Process–Output (IPO) model, which illustrates how data enters the system, undergoes various processes, and produces useful outputs. The inputs include user and account information, gym operational data, membership plans, attendance records, workout and fitness progress data, supplement and POS transaction records, hardware specifications, and evaluation parameters. These inputs are processed through system functions such as requirements analysis, system architecture and UI/UX design, database management, backend API development, real-time communication, mobile application development, optical QR code verification and scanning, POS transactions, report generation, and system testing and evaluation. The system then produces outputs such as deployed member and administrative platforms, digital QR attendance and traffic logs, personal workout records, real-time coach–trainee communication, verified POS transaction records and receipts, dynamic PDF/Excel reports, and administrative quality assessment reports. Overall, the framework provides a structured approach to managing gym data and operations while supporting efficient monitoring, automation, and evaluation of the system, as illustrated in the research paradigm in Figure 1.


> **Figure 1. Research Paradigm of FordaGO (IPO Model)**

### Statement of the Problem

General Problem Statement

AFFORDA Gym – Cabiao Branch provides fitness facilities and wellness services to fitness enthusiasts in Cabiao, Nueva Ecija. However, daily operations are severely hindered by manual paper logbooks for attendance tracking, disorganized membership pass monitoring, lack of accessible on-demand equipment instructions for beginners, manual supplement inventory logging, and the absence of a structured digital communication channel between gym coaches and trainees. These manual processes result in operational inefficiencies, data inaccuracies, front-desk congestion, security vulnerabilities, and suboptimal member engagement.

Specific Problem Statements

Specifically, this study seeks to answer the following research questions:

What are the operational problems and limitations encountered in the current gym management workflow of AFFORDA Gym – Cabiao Branch in terms of:

a. Member registration, account management, and membership pass verification;

b. Attendance recording, monitoring, and historical record retrieval through physical paper logbooks;

c. Availability of instructional guidance and safety information for gym equipment;

d. Personal workout tracking, routine scheduling, and coach-client consultations;

e. Inventory management, supplement sales recording, and payment verification; and

f. Generation of administrative, financial, and operational summaries?

What functional modules, system architecture, database design, and user interface features must be engineered in the proposed FordaGO: Mobile-Based Gym Database Management System to address the identified operational problems?

What is the technical quality of the developed FordaGO system as evaluated by IT professionals based on the ISO/IEC 25010 software quality standards in terms of:

a. Functional Suitability;

b. Performance Efficiency;

c. Compatibility;

d. Usability;

e. Reliability;

f. Security;

g. Maintainability; and

h. Portability?

What is the level of user acceptability of the system as evaluated by gym end-users (administrators, front-desk personnel, accredited coaches, and members) in terms of:

a. Functional Suitability;

b. Usability;

c. Reliability; and

d. Security?

### Significance of the Study

The development, deployment, and evaluation of FordaGO will deliver direct practical and academic value to the following beneficiaries:

To AFFORDA Gym – Cabiao Branch Management: Modernizes the facility’s business infrastructure by eliminating manual logbooks, preventing revenue leakage through automated pass verification, maintaining live stock inventory, and providing accurate data-driven business reports.

To Gym Administrators and Front-Desk Staff: Significantly reduces administrative workload by automating member check-ins, eliminating manual attendance handwriting, streamlining supplement point-of-sale audits, and providing one-click PDF/Excel report exports.

To Gym Coaches and Personal Trainers: Provides a professional digital workspace (Coach Studio) to showcase credentials, publish workout routines, establish availability hours, organize group classes, and communicate in real time with trainees through structured workout plan proposals.

To Gym Members and Fitness Enthusiasts: Enhances the workout experience through frictionless QR check-in, on-demand equipment usage tutorials via QR scanning, personal record and routine tracking, easy supplement ordering, and direct access to professional coaching consultations.

To Researchers: Serves as a comprehensive practical application of integrating modern full-stack web and mobile technologies (Ionic, Angular, Laravel, WebSockets, and MySQL) in solving real-world fitness facility operations, database management, and mobile attendance tracking challenges.

To Future Developers and Academics: Provides an architectural foundation and empirical benchmark for future research into fitness digitalization, real-time sports informatics, and automated sports facility management systems.

### Scope, Delimitations, and Limitations of the Study

Scope of the Study

This study encompasses the architectural design, full-stack software engineering, cloud VPS deployment, and empirical software quality evaluation of FordaGO: A Mobile-Based Gym Database Management System tailored exclusively for AFFORDA Gym – Cabiao Branch in Cabiao, Nueva Ecija. The system establishes an integrated operational ecosystem serving three distinct user classifications: Gym Members (Mobile Application / PWA Portal), Accredited Fitness Coaches (Trainer Studio), and Gym Administrators / Front-Desk Staff (Administrative Command Center).

The system’s functional scope is divided into eleven (11) major modules:

1. User Authentication & Role-Based Access Control Module:

Provides secure token-based authentication using Laravel Sanctum, encrypted password hashing (Bcrypt), role-based middleware access control, and self-service password recovery via security verification.

2. QR Code Attendance Monitoring Module:

Replaces physical paper logbooks with camera-based QR code verification. Front-desk staff utilize a recommended Android tablet kiosk (or reception PC/laptop web browser) to scan entering members' dynamic QR passes in real time, validating membership validity status within 500 milliseconds and automatically logging entry timestamps without requiring manual pen-and-paper writing.

3. Interactive Equipment QR Information & Guidance Module:

Members scan physical printed QR code labels affixed to gym machines using their smartphone cameras to immediately view high-resolution equipment photos, targeted muscle group diagrams, and step-by-step exercise execution instructions. Admins can generate and download printable printed QR code labels directly from the system.

4. Personal Record (PR) Tracker & Weekly Split Routine Builder:

Allows members to log personal record milestones (e.g., Bench Press, Squat, Deadlift) with automated percentage gain calculators, while enabling users to build custom daily workout splits (Monday to Sunday) with target durations and gym floor selections.

5. Coach Studio & Real-Time Consultation Module:

Accredited gym coaches manage their trainee roster, configure weekly working hours, publish public group fitness classes with participant seat limits, and engage in real-time private messaging powered by WebSockets. Coaches can compose and send structured in-chat Workout Plan Proposals (specifying dates, target muscles, routines, and pricing) that members can accept with a single tap.

6. Supplement Shop & Point-of-Sale (POS) Module:

Members browse gym supplements, energy drinks, and apparel, adding items to a multi-item cart and checking out via Over-the-Counter (OTC) Cash payment verification at the reception desk. Administrators review pending orders, verify physical cash payments, approve sales, and trigger atomic inventory stock deductions.

7. Membership Pass & Billing Management Module:

Tracks active membership passes (30-Day Premium Pass and Daily Visit Passes), monitors expiration dates, handles pass extension requests, and logs transparent transaction audit trails.

8. Real-Time Notification System:

Dispatches live WebSocket events and visual badge notifications for order approvals, workout proposals, chat messages, and administrative announcements.

9. Administrative Analytics & Export Engine:

Provides administrative dashboards with graphical operational summaries and vector PDF/Excel export engines for attendance traffic, sales revenues, inventory stock, and membership lists.

10. Administrative Activity Logs & Security Audit Trail Module:

Provides a real-time, immutable audit trail of administrator and staff actions within the system. It automatically logs staff login and logout timestamps, calculates exact active session durations, and tracks all data modifications including member approvals and removals, supplement inventory stock and pricing adjustments, equipment status updates, and daily attendance verifications storing associated JSON payloads, client IP addresses, and user-agent metadata for heightened institutional governance and accountability.

11. Member Feedback & Net Promoter Score (NPS) Evaluation Engine:

Facilitates continuous service quality monitoring by prompting member evaluations after active gym participation. Members submit 0–10 numerical ratings and qualitative commentary, enabling the system to automatically compute the gym's Net Promoter Score (NPS), categorize feedback into Promoters (9–10), Passives (7–8), and Detractors (0–6), and stream real-time satisfaction analytics directly into the administrative control center.

Technical Architecture and Implementation Environment


> **Table 1. Technical Architecture & Development Stack**

The proposed system was implemented and tested at AFFORDA Gym – Cabiao Branch during the Academic Year 2025–2026 as part of the Bachelor of Science in Information Technology capstone project.

### Delimitations of the Study

To maintain technical feasibility and ensure the study remains aligned with academic capstone parameters, the following explicit delimitations are established:

1. Single-Branch Implementation. The system is engineered exclusively for AFFORDA Gym – Cabiao Branch in Cabiao, Nueva Ecija. Centralized database schemas, role configurations, inventory catalogs, and operational parameters are tailored to this single physical facility, excluding multi-branch enterprise federation or cross-location data warehousing.

2. Optical Camera Scanning vs. Physical Turnstiles and Dedicated Workstations. Attendance check-in and machine lookup operate entirely through camera-based optical QR code scanning using member smartphone cameras and front-desk device webcams or tablet cameras. To accommodate the practical operational reality of AFFORDA Gym – Cabiao Branch where no permanent front-desk desktop PC is installed, the front-desk terminal is engineered and recommended to operate as a compact digital kiosk on an Android tablet positioned at the reception counter. Furthermore, the system remains cross-platform and fully accessible via web browser on any desktop PC or laptop through its live domain DNS (e.g., app.affordagym.com). Physical motorized turnstiles, magnetic RFID cards, and biometric hardware are excluded from this release.

3. Smart Wearables and Biometric Sensors. The system does not integrate with external wearable hardware (e.g., Apple Watch, Fitbit, Garmin) or real-time physiological telemetry sensors. Heart rate monitoring, caloric expenditure modeling, and sleep tracking are excluded from the system's operational boundaries.

4. Payment Transactions and Financial Gateway Budget Delimitation. The primary and official payment fulfillment for all gym services (membership passes, day visits, and supplement purchases) is conducted via physical Over-the-Counter (OTC) cash payment directly at the gym reception desk with manual staff receipt issuance and verification. To demonstrate modern digital transaction workflows and user experience, the mobile application features an interactive GCash checkout prototype where members can select a digital payment option, view the gym's official payment QR/account details, and submit a reference number or upload a proof-of-payment screenshot. However, this feature is strictly an interactive demonstration prototype and does NOT deduct actual monetary funds from member e-wallets, bank accounts, or financial gateways. Integrating fully automated commercial payment gateway APIs (such as PayMongo, Maya Business, or GCash for Business with real-time webhook clearing) requires formal commercial merchant accreditation, corporate SEC or DTI registration documents, corporate merchant bank accounts, and recurring per-transaction clearing fees. Due to the financial budget constraints and academic nature of this student capstone project, live commercial financial API integrations were deliberately excluded, preserving physical front-desk counter cash auditing as the authoritative transaction protocol.

5. Computer Vision & AI Motion Coaching. Equipment guidance is provided through pre-configured instructional media, descriptive exercise guides, and anatomical muscle diagrams. Automated computer vision motion tracking, sensor-based repetition counting, and real-time posture correction algorithms are excluded from this release.

6. Network Connectivity and Cloud VPS Accessibility. The application is deployed and hosted live on a production Linux Cloud Virtual Private Server (VPS) architecture. The mobile application and administrative portal require an active internet connection (Wi-Fi or cellular data) to synchronize attendance, process orders, and exchange messages with the centralized MySQL database.

7. User Base Restriction. System access is strictly restricted to registered gym members, accredited fitness coaches, front-desk staff, gym administrators, and super administrators authorized by AFFORDA Gym – Cabiao Branch. Public open access and unauthenticated operations are prevented through token authentication.

8. Facility Scope and Environmental Boundary. The application is optimized for indoor training operations within the physical premises of AFFORDA Gym – Cabiao Branch. External outdoor fitness tracking, GPS route mapping, and community-wide social feeds are excluded from the scope.

9. Medical Diagnosis and Nutritional Prescription. While the system collects standard health declarations (Physical Activity Readiness Questionnaire - PAR-Q) and fitness metrics, it does not provide clinical medical diagnosis or automated therapeutic dietary prescriptions. All exercise routines and coaching proposals serve solely as fitness guidelines.

10. Mobile Platform Deployment and iOS Operating System Delimitation. The native mobile application package is compiled and distributed exclusively as an Android Application Package (APK) for Android mobile phones and tablet devices. Unlike the Android platform, which allows straightforward direct installation and sideloading of compiled APK packages generated through Android Studio and Gradle without requiring paid developer distribution services, the Apple iOS ecosystem strictly prohibits unauthorized direct application sideloading or manual package installation on consumer devices without an active enterprise certificate or official Apple App Store distribution. Furthermore, publishing an official native iOS application to the Apple App Store requires an annual Apple Developer Program enrollment fee ($99 USD per annum), dedicated macOS compilation hardware (Apple Macintosh/MacBook computers), and formal organizational entity verification, which are beyond the financial budget constraints and technical resources of this undergraduate capstone study. Nevertheless, to ensure that gym members and stakeholders utilizing Apple iPhone or iPad devices are not excluded from system benefits, the FordaGO platform is engineered upon responsive Ionic 8 and Angular web technologies and hosted live on a public domain DNS (https://app.affordagym.com). Consequently, iOS users can seamlessly access and operate all member functionalities (including profile management, attendance logs, workout logging, equipment exercise guides, supplement store browsing, and coach consultations) directly through standard mobile web browsers such as Apple Safari and Google Chrome without requiring native App Store installation.

These delimitations define the operational boundaries of the study and ensure that the project remains technically sound, cost-effective, and fully achievable within academic capstone constraints.

### Limitations of the Study

While the delimitations represent deliberate scope boundaries established by the researchers, the study is subject to several inherent technical, environmental, behavioral, and operational limitations that are beyond the complete control of the developers:

1. Hardware and Camera Sensor Variance. The optical QR code decoding speed and responsiveness are subject to the camera sensor specifications, focal capabilities, and autofocus speeds of individual member smartphones and front-desk webcams. Devices with low-resolution camera modules or scratched lenses may experience slight scanning latency.

2. Ambient and Environmental Gym Lighting Conditions. Optical recognition of printed QR code labels affixed to gym machines and member digital screens is subject to ambient illumination within the facility. In areas with significant glare or dim lighting, scanning may require angle adjustments or smartphone flashlight activation.

3. Centralized Cloud Network Dependency and ISP Latency. Because FordaGO operates on a live centralized Linux Cloud Virtual Private Server (VPS) architecture, system responsiveness, attendance synchronization, and media streaming are dependent on external Internet Service Provider (ISP) uptime and local network bandwidth.

4. Mobile Operating System Background Execution Policies. Aggressive battery optimization and background app memory termination policies implemented by certain mobile operating systems (e.g., customized Android distributions) may occasionally delay local push notifications if the application is killed in the background.

5. Subjectivity of Self-Logged Fitness Progress. Workout performance metrics, Personal Record (PR) milestone weights, repetition counts, and routine completion statuses rely on manual user logging and self-reporting by gym members, which may introduce subjective variances or entry delays.

6. Front-Desk Counter Verification Latency. While digital order placement and attendance scanning are automated, manual payment confirmation and physical cash handling require active verification by front-desk personnel, introducing minor operational delays during peak arrival periods.

7. Evaluation Sample Size and Contextual Generalizability. The empirical evaluation of the system was conducted specifically within AFFORDA Gym – Cabiao Branch involving 5 IT experts and 30 gym end-users. The findings reflect the specific operational workflows of this facility and may vary in larger commercial fitness chains.

8. Physical Queuing and Terminal Concurrency. The physical check-in throughput during peak arrival hours is bounded by the number of active camera scanning stations operating at the front-desk counter.

9. Absence of Direct Electronic Medical Record (EMR) Integration. Member health declarations and PAR-Q screening records rely on self-disclosure by gym-goers rather than automated verification against clinical hospital or healthcare databases.

10. Native iOS Mobile Installation and Ecosystem Policy Constraint. Due to Apple Inc.'s closed sandbox and security policies that prohibit direct executable package (IPA) installations without App Store review and publishing, iOS users must access the system via mobile web browsers (e.g., Apple Safari or Google Chrome) rather than a standalone native application installed from an APK file. While the responsive web application provides full functional parity with the Android APK, native platform features such as background push notification persistence may exhibit slight behavioral differences on iOS web browsers compared to the native Android operating system environment.

These limitations are acknowledged as practical operational and technical boundaries of modern web and mobile information systems in fitness environments.

Terms and Definition

Angular – A web application framework used to develop the frontend interface of the FordaGO system.

API (Application Programming Interface) – A set of rules and protocols that allows the frontend application to communicate with the backend server and exchange data.

Attendance Monitoring – The process of recording and tracking gym members’ visits and check-ins.

Backend – The server-side component of the system responsible for processing requests, managing business logic, authentication, and database operations.

QR Code Scanner – A system feature that uses a device camera to scan machine-readable codes for identifying or accessing information.

Capacitor – A native runtime that enables web-based applications to access mobile device features such as the camera.

Database – An organized collection of data used to store and manage information such as member profiles, attendance records, transactions, and inventory.

Database Management System (DBMS) – Software used to create, store, organize, retrieve, and manage data within a database.

FordaGO – The proposed mobile-based gym database management system developed for AFFORDA Gym – Cabiao Branch.

Frontend – The user-facing part of the system through which administrators, coaches, and members interact with its features and services.

Gym Management System – A computerized system designed to manage gym operations such as membership, attendance, scheduling, transactions, inventory, and reports.

Ionic – A framework used to develop cross-platform mobile and web applications using web technologies.

Laravel – A PHP-based backend framework used to develop the RESTful API and server-side functions of the FordaGO system.

Laravel Echo – A JavaScript library used to interact with WebSocket channels and receive real-time updates from the server.

Laravel Reverb – A WebSocket server used by the system to provide real-time communication between the server and connected users.

Laravel Sanctum – An authentication system used to secure API access and manage authenticated users.

Member – A registered gym user who can access authorized features such as attendance monitoring, workout tracking, equipment information, and product ordering.

MySQL – A relational database management system used to store and manage the data of the FordaGO system.

QR Code (Quick Response Code) – A two-dimensional machine-readable code that can be scanned using a camera to access or process encoded information.

RESTful API – A web service architecture that enables applications to communicate with a server using standard HTTP methods for requesting and managing data.

SCSS (Sassy CSS) – A stylesheet language used to create and organize the visual design and styling of the system interface.

TypeScript – A programming language used in the development of the system’s frontend, providing typed features for JavaScript-based applications.

WebSocket – A communication protocol that enables continuous, two-way communication between a client and server for real-time data updates.

Workout Tracking – A system feature that allows members to record completed workouts, personal records, routines, and fitness progress.

Inventory Management – The process of monitoring, recording, and managing gym equipment, supplies, and products available for sale.

Point-of-Sale (POS) – A system function used to record product purchases, update inventory, and maintain transaction records.

Report Generation – The process of producing organized reports from system data, such as attendance, transactions, sales, and inventory records.

Functional Suitability – The degree to which the system provides functions that meet the specified requirements and intended user needs.

Usability – The degree to which users can effectively, efficiently, and satisfactorily use the system.

Reliability – The ability of the system to perform consistently and correctly under specified conditions.

Security – The capability of the system to protect data and prevent unauthorized access or actions.

Performance Efficiency – The ability of the system to provide appropriate performance in relation to the amount of resources used.

ISO/IEC 25010 – An international software quality model used to evaluate software based on defined quality characteristics, including functional suitability, usability, reliability, security, and performance efficiency.

