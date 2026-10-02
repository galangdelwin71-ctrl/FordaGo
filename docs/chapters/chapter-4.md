# Chapter IV: Summary of Findings, Conclusions, and Recommendations

## Chapter IV

### Summary of Findings, Conclusion, and Recommendation

This chapter presents the summary of the empirical findings derived from the development, deployment, and ISO/IEC 25010 software quality evaluation of the FordaGO: Mobile-Based Gym Database Management System for AFFORDA Gym – Cabiao Branch. It articulates the conclusive insights drawn from the investigation and outlines targeted, actionable recommendations for gym management, fitness coaches, gym members, and future software engineering researchers.

### Summary of Findings

1.1. Existing Operational Inefficiencies (SOP 1):

The pre-development assessment confirmed that AFFORDA Gym – Cabiao Branch suffered from critical operational bottlenecks due to reliance on manual, paper-bound workflows. Specifically:

(a) member registration and pass renewals were manually handwritten with disarranged physical ledger records;

(b) attendance logging required members to physically line up to sign paper logbooks, causing significant counter congestion and vulnerability to record falsification or water damage;

(c) beginner gym-goers lacked accessible, on-demand equipment guidance, leading to improper machine utilization and reliance on overextended staff;

(d) fitness consultations and workout routines lacked digital continuity, leaving client progress undocumented;

(e) supplement retail and counter sales depended on handwritten notebooks, resulting in untracked stock discrepancies and tedious manual cash payment recording; and

(f) administrative summary generation required manual mathematical consolidation across multiple disjointed notebooks, consuming hours of administrative effort.

1.2. Engineered System Architecture and Functional Modules (SOP 2):

The researchers successfully engineered, integrated, and deployed the FordaGO system across a robust three-tier architecture (Ionic 8 and Angular frontend client, Laravel 11 RESTful API backend, and MySQL relational database), containerized within a live Linux Cloud Virtual Private Server (VPS). The platform comprises eleven (11) functional modules:

Secure Authentication & RBAC,

Optical QR Code Attendance Monitoring,

Interactive Equipment QR Guidance Placards,

Personal Record (PR) Strength Milestone Tracker,

Coach Studio with In-Chat Structured Proposals,

Supplement Shop & Counter Point-of-Sale,

Membership Pass & Billing Lifecycle Management,

Real-Time WebSocket Notifications via Laravel Reverb,

Consolidated Revenue & Financial Analytics,

Administrator Activity Logs & Security Audit Trail, and

Member Feedback & Net Promoter Score (NPS) Evaluation Engine. Together, these modules established an automated, highly synchronized, and paperless operational environment.

1.3. Technical Quality and User Acceptability (SOP 3):

Empirical evaluation based on the ISO/IEC 25010 software quality model demonstrated exceptional ratings from both professional and end-user stakeholders:

a. IT professionals (n = 5) evaluated the system across all eight software characteristics using the institutional 5-point Likert instrument, awarding a Composite Grand Mean of 4.78 (Verbal Interpretation: Very Strong Evidence / Excellent), highlighted by top ratings in Maintainability (4.84), Security (4.80), Usability (4.80), Compatibility (4.80), Portability (4.80), Functional Suitability (4.73), Performance Efficiency (4.73), and Reliability (4.70); and

b. Gym end-users (n = 15), consisting of two gym owners, front-desk staff, and 12 active gym members, evaluated the live application, granting an overall Grand Mean of 4.84 (Verbal Interpretation: Very Strong Evidence / Excellent), with high acclaim for Security (4.90), Usability (4.85), Functional Suitability (4.80), and Reliability (4.80).

Conclusion

Conclusion 1: Traditional paper-based management methods are fundamentally obsolete, vulnerable to data loss, and insufficient for modern fitness facility management. The operational problems identified at AFFORDA Gym – Cabiao Branch underscored the imperative need for a centralized, database-driven, and mobile-accessible platform.

Conclusion 2: The successful design, full-stack development, and live VPS deployment of FordaGO validate that integrating camera-based optical QR code verification, real-time WebSocket communication, and responsive hybrid mobile frameworks provides an effective, high-performance, and scalable replacement for manual gym workflows. The system successfully democratizes equipment guidance, automates attendance tracking, accelerates supplement inventory deductions, and enforces administrative accountability through comprehensive activity audit trails.

Conclusion 3: The overwhelming 'Very Strong Evidence / Excellent' evaluation marks achieved across both IT experts (4.78) and gym end-users (4.84) substantiate that FordaGO meets international software quality standards defined by ISO/IEC 25010. The platform exhibits high operational reliability, robust data security, responsive real-time interaction, and superior usability, rendering it fully viable for production enterprise deployment in fitness facilities.

### Recommendations

3.1. For AFFORDA Gym Management & Owners:

It is strongly recommended that gym management fully institutionalize FordaGO as the standard operating system of AFFORDA Gym – Cabiao Branch. Management should retire paper logbooks, mandate digital QR scanning for all walk-in and regular members, and routinely monitor the newly engineered Activity Logs to maintain staff accountability and safeguard financial transaction integrity. Additionally, management should conduct periodic automated VPS database backups to ensure operational resilience.

3.2. For Gym Front-Desk Staff & Personnel:

Front-desk personnel should deploy an Android tablet mounted at the reception counter to serve as a compact, energy-efficient check-in and transaction verification kiosk. For comprehensive month-end revenue audits, inventory balancing, and PDF reporting, personnel may access the administrative command center via any laptop or desktop PC web browser using the live domain address.

3.3. For Gym Coaches & Personal Trainers:

Fitness coaches are encouraged to maximize the Coach Studio module by proactively publishing scheduled group classes and utilizing structured in-chat Workout Plan Proposals. This fosters professional transparency, establishes documented workout regimens for clients, and enhances coach–trainee retention through interactive WebSocket messaging.

3.4. For Gym Members & Fitness Enthusiasts:

Members are encouraged to consistently leverage the on-demand equipment printed QR code labels affixed to gym machinery to verify targeted muscle groups and execute correct biomechanical exercise forms. Furthermore, members should consistently log personal strength milestones (PRs) and submit timely post-workout feedback ratings to guide continuous gym facility improvements.

3.5. For Future Researchers & IT Developers:

Future researchers may expand upon this study by:

(a) acquiring an Apple Developer Program license to officially package and publish the native FordaGO iOS client on the Apple App Store for seamless one-tap iPhone installation; (b) integrating automated commercial merchant payment gateways (such as PayMongo, Maya Business, or GCash for Business) with live webhook settlement once commercial merchant registration and corporate funding are secured by gym management; (c) developing mobile computer-vision AI models for real-time exercise form correction and repetition counting using device cameras; (d) incorporating wearable biometric synchronization (Apple HealthKit, Google Health Connect) for automatic calorie and heart rate tracking; (e) interfacing the digital check-in module with physical electromechanical front-desk QR camera scanners or magnetic door locks via IoT microcontrollers; and (f) implementing distributed database replication to support multi-branch enterprise synchronization across regional gym chains.

References

Baechle, T. R., & Earle, R. W. (2020). Essentials of strength training and conditioning (4th ed.). Human Kinetics.

Codd, E. F. (1970). A relational model of data for large shared data banks. Communications of the ACM, 13(6), 377–387. https://doi.org/10.1145/362384.362685

Creswell, J. W., & Creswell, J. D. (2018). Research design: Qualitative, quantitative, and mixed methods approaches (5th ed.). SAGE Publications.

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. MIS Quarterly, 13(3), 319–340. https://doi.org/10.2307/249008

Dennis, A., Wixom, B. H., & Tegarden, D. (2021). Systems analysis and design: An object-oriented approach with UML (6th ed.). Wiley.

DENSO WAVE. (2023). What is a QR code? https://www.qrcode.com/en/about/

Fielding, R. T. (2000). Architectural styles and the design of network-based software architectures [Doctoral dissertation, University of California, Irvine].

