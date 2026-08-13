<!--
FordaGO: Mobile-Based Gym Database Management System
for AFFORDA Gym – San Isidro Branch

A Thesis Proposal

GROUP MEMBERS:
BERNALDO, CARL ANDREW B.
GALANG, DELWIN F.
JAVIER, JAYLEE T.
MEDINA, ETHAN JEROME G.
PONGCO, RYZA MAE M.





CHAPTER I
INTRODUCTION

Fitness centers and gyms play an important role in promoting a healthy lifestyle by providing individuals with access to exercise facilities, workout programs, and fitness equipment. As the number of gym members increases, gym administrators are expected to manage registration, attendance, membership monitoring, schedules, equipment information, and inventory in an organized and efficient manner. For this reason, many fitness facilities are beginning to adopt technology-based systems that simplify daily operations and improve the overall experience of both staff and members.

At present, AFFORDA Gym – San Isidro Branch still experiences operational challenges that are commonly associated with manual or less organized processes. One of the major concerns is attendance monitoring, which may still depend on traditional logbooks or manual recording methods. This approach may consume time, cause recording errors, and make it difficult to verify and retrieve accurate attendance data. Manual handling of membership details, schedules, and inventory records may also affect the efficiency of staff in monitoring gym operations and updating data accurately.

Another challenge involves member convenience and guidance inside the gym. Some members, particularly beginners, may find it difficult to identify the proper use of gym equipment without immediate assistance or clear instructional material. This may affect their confidence, safety, and overall workout experience. In addition, members may also need timely reminders regarding schedules, attendance status, and membership-related updates so they can stay informed and consistent with their fitness activities.

To address these concerns, mobile technology can provide a practical and accessible solution. A mobile-based system allows users to access gym-related services through their smartphones while enabling administrators to manage records in a centralized database. More importantly, QR code technology can be used as the main mechanism for attendance recording, allowing members to scan and log their gym entry faster and more accurately than manual logbooks. QR codes may also be used to provide equipment-related information and usage guidance that can help users understand how machines and workout stations should be used properly.

The proposed system, FordaGO, is designed as a Mobile-Based Gym Database Management System for AFFORDA Gym – San Isidro Branch. The system includes user account management, member and admin access, QR code-based attendance recording as its core feature, equipment information access, workout or session scheduling, notification support, and inventory or product management. By integrating these functions into one mobile-based platform, the system aims to improve data organization, reduce dependence on manual logbooks, lessen administrative workload, and provide better service and convenience for gym members and administrators.

Therefore, this study proposes the development of FordaGO: Mobile-Based Gym Database Management System for AFFORDA Gym – San Isidro Branch. The system is intended to improve the management of gym records and operations by providing a centralized, accessible, and efficient digital solution, with QR code-based attendance monitoring serving as the primary response to the gym's manual logbook problem.

STATEMENT OF THE PROBLEM

General Problem Statement

AFFORDA Gym – San Isidro Branch offers fitness services and workout facilities to individuals who want to maintain a healthy and active lifestyle. However, some important operational activities may become inefficient when handled through manual or less organized processes. Attendance recording, especially when done through manual logbooks, may lead to delays, inaccuracies, and difficulty in monitoring member visits. Membership monitoring, schedule management, and inventory tracking also require accurate and timely updating of records. Without a centralized digital system, staff may experience delays in retrieving information, updating records, and monitoring daily gym operations.

In addition, some gym members, especially beginners, may have difficulty understanding how to properly use gym equipment when clear instructions are not readily available. This can affect their confidence and limit their ability to maximize the use of available facilities. Members may also miss important updates related to their schedules, attendance, or membership status if there is no accessible notification and monitoring feature in place.

Furthermore, administrators need an organized way to manage products, supplies, equipment records, and member-related information. If these records are not properly maintained in a database-driven system, inaccuracies and inefficiencies may occur in the daily operation of the gym. Because of these issues, there is a need to develop a mobile-based system that can improve data handling, especially attendance recording through QR code scanning, information access, and administrative monitoring at AFFORDA Gym – San Isidro Branch.

Therefore, this study aims to develop FordaGO: Mobile-Based Gym Database Management System for AFFORDA Gym – San Isidro Branch to provide a more efficient, organized, and user-friendly platform for gym management and member support, with QR code-based attendance monitoring as one of its central features.

Specific Problem Statements

Specifically, this study seeks to answer the following questions:

1. What problems are encountered in the current gym management process of AFFORDA Gym – San Isidro Branch in terms of:
a. member registration and account management;
b. attendance recording and monitoring through manual logbooks or traditional methods;
c. availability of guidance in using gym equipment;
d. session or workout schedule monitoring; and
e. management of products, equipment, and other gym-related records?

2. What features and functionalities should be included in the proposed Mobile-Based Gym Database Management System to address the identified problems?

3. How effective is the proposed system in terms of:
a. functionality;
b. usability;
c. reliability;
d. security; and
e. performance efficiency?

SCOPE AND DELIMITATIONS OF THE STUDY

Scope of the Study

This study focuses on the design, development, and evaluation of FordaGO: Mobile-Based Gym Database Management System for AFFORDA Gym – San Isidro Branch. The proposed system aims to improve the management of gym operations by providing a unified digital platform for handling member records, QR code-based attendance monitoring, equipment guidance and information access, workout schedule management, and inventory records.

The system will replace manual record-keeping processes currently used at AFFORDA Gym, particularly the paper-based logbook system for attendance tracking and the manual management of member and equipment records. Through a mobile application integrated with a centralized relational database, the system will enable gym administrators to store, organize, and retrieve operational information more efficiently while providing members with convenient access to gym-related services.

The proposed system includes the following functional modules:

1. User Registration and Account Management Module – Enables gym administrators to register new members and manage user accounts. Members can update their profile information including name, contact details, membership type, and membership status.

2. QR Code-Based Attendance Recording Module – Allows members to record their gym attendance by scanning a static QR code upon entry, replacing the manual logbook approach. This module provides faster and more accurate attendance recording with automatic timestamping.

3. Equipment Information and Guidance Module – Provides members with access to usage instructions and proper guidance on gym equipment through QR code scanning, helping improve member safety and confidence when using machines and equipment.

4. Workout Schedule and Session Monitoring Module – Allows members to view their scheduled workout sessions and receives notifications or reminders related to their fitness activities.

5. Notification and Communication Module – Enables administrators and the system to send alerts and reminders to members regarding schedules, membership status, payment deadlines, and other important announcements.

6. Gym Inventory and Equipment Management Module – Assists administrators in monitoring gym equipment and supplies by recording available equipment, maintenance status, and maintaining updated inventory records.

7. Membership Billing and Payment Processing Module – Enables members to view their membership payment status, and provides administrators with tools to manage membership billings and transaction records.

8. Report Generation Module – Enables administrators to generate instant reports related to attendance records, member activities, equipment usage, and inventory status for administrative decision-making and audit purposes.

The system will be developed as a mobile-based application supported by a centralized MySQL relational database. The primary users of the system include gym administrators and staff of AFFORDA Gym – San Isidro Branch, as well as registered gym members. The system will be implemented and tested specifically at the San Isidro Branch location during the Academic Year 2025–2026 as part of the Information Technology capstone project. The implementation will utilize current web technologies including Ionic and Angular for the mobile frontend, Node.js and Express.js for the backend application server, and MySQL for the database management system.

Delimitations of the Study

This study has defined boundaries to ensure the scope remains manageable, feasible, and achievable within the available resources and development timeframe:

1. Single-Location Implementation – The system will be implemented exclusively for AFFORDA Gym – San Isidro Branch. It is not designed to support multi-branch operations or integration with the Cabiao and Muñoz branches at this stage.

2. Data Retention Period – Operational data such as attendance logs, equipment scan records, and transaction history will be retained in the system database for audit and operational purposes, with data management policies to be determined by the gym management.

3. Feature Scope – The system focuses on gym management and member support features. It does not include advanced fitness tracking technologies such as wearable device integration, real-time biometric health monitoring, or AI-based personalized workout recommendations.

4. User Access – The mobile application is restricted to registered gym members and authorized administrators. Public access and social features such as fitness communities or member social networking are not included.

5. Equipment Guidance – The system provides basic instructional information for gym equipment through QR codes and text-based guidance. Advanced features such as live video coaching, real-time trainer support, or augmented reality (AR) exercise demonstrations are not included in this version.

6. Connectivity Requirements – The application operates primarily within the local network environment of AFFORDA Gym and requires internet connectivity for database synchronization. Offline functionality is limited to display of cached information.

7. Payment Processing – The system records membership payment status and transaction history. Full integration with external payment gateways and multiple digital payment platforms may be implemented in future versions based on gym requirements.

8. Scope of Testing – System evaluation will be conducted with a limited group of IT professionals and end-users from AFFORDA Gym. Broader public testing and large-scale deployment are beyond the scope of this thesis project.

These delimitations define the project boundaries and ensure that FordaGO remains a focused, achievable solution tailored to the specific operational needs of AFFORDA Gym – San Isidro Branch while maintaining feasibility within the academic thesis constraints.

SIGNIFICANCE OF THE STUDY

The development of the FordaGO system will provide benefits to the following:

1. AFFORDA Gym – San Isidro Branch. The proposed system will help improve gym operations by digitalizing member records, especially attendance monitoring through QR code scanning, as well as schedule management, equipment information access, and inventory or product monitoring. It can reduce dependence on manual logbooks, improve record organization, and support more efficient daily operations.

2. Gym Administrators and Staff. The system will help administrators and staff manage member information, monitor attendance through QR-based logs, organize schedules, update equipment and product records, and send or view notifications more efficiently through a centralized platform.

3. Gym Members. The system will provide members with more convenient access to their gym-related information through a mobile application. It will allow them to log attendance through QR code scanning instead of manual logbooks, view schedules, receive notifications, and access equipment guidance that may help them use gym facilities properly.

4. Researchers. The study may serve as a useful reference for future researchers who plan to develop similar mobile-based information systems for fitness centers, gyms, or other service-oriented organizations.

5. Future Developers. The proposed study may provide a practical basis for improving or expanding digital gym management systems by adding more advanced features and integrating additional modules in the future.

CONCEPTUAL FRAMEWORK

The proposed FordaGO system follows the Input-Process-Output (IPO) model. The inputs include member information, login credentials, attendance data, schedule details, equipment records, product or inventory information, and notification data. These inputs are processed by the system through modules such as authentication, QR code-based attendance checking, schedule management, equipment information access, notification handling, and inventory or product management. A major process in the system is the scanning of QR codes for attendance as a replacement for manual gym logbooks. The outputs include updated member records, attendance logs, schedule listings, equipment information displays, inventory records, and other administrative summaries. This framework shows how the proposed system transforms raw gym-related data into organized and useful information that supports efficient operations and improved member service.

REVIEW OF RELATED LITERATURE

Information technology has significantly influenced the management of different organizations, including fitness centers and gyms. With the increasing number of gym members and services offered by fitness facilities, traditional methods of managing records and operations are gradually being replaced by computerized systems. These systems help organizations improve efficiency, accuracy, and accessibility of information. In the context of fitness centers, technology-based management systems can simplify administrative tasks such as membership registration, attendance monitoring, scheduling, and equipment management.

A Gym Management System is a digital platform designed to assist gym administrators in organizing and managing daily operations. These systems commonly include features such as member registration, membership tracking, attendance monitoring, and report generation. By replacing manual processes with computerized systems, gym management systems help reduce paperwork, minimize human error, and allow staff to monitor member activities more efficiently.

Database Management Systems (DBMS) play an important role in modern information systems because they allow organizations to store, manage, and retrieve large amounts of structured data efficiently. A DBMS provides a systematic way of organizing data through tables, relationships, and queries. In the case of a gym management system, the database can store important information such as member profiles, membership plans, attendance records, schedule data, notifications, products, and equipment inventory. Through the use of relational databases, data redundancy can be minimized while ensuring data integrity and consistency.

Relational database design is an important concept in building efficient information systems. It organizes data into related tables that are connected through primary keys and foreign keys. Proper database design ensures that information is stored in a structured manner, which allows faster data retrieval and prevents duplication of records. In gym management systems, relational databases help manage connections between members, attendance records, schedules, notifications, products, and transaction histories.

Attendance monitoring systems are also widely used in organizations where tracking user presence is important. Traditional attendance systems rely on manual logbooks, which may lead to inaccurate records, lost data, or delays in retrieving information. Modern attendance systems use digital technologies such as QR codes, RFID, and biometric scanning to record attendance automatically. These technologies improve efficiency and accuracy while reducing the time required to record user attendance.

QR code technology has become a widely used tool in many information systems because of its ability to store data that can be easily accessed through scanning devices such as smartphones. QR codes are commonly used for identification, ticketing, payment systems, and attendance monitoring. In gym environments, QR codes can be assigned for digital attendance recording and can also be linked to equipment information so that members can access instructions and usage guidance by scanning through a mobile device.

Mobile applications have also become an essential part of modern information systems. With the widespread use of smartphones, mobile-based systems provide users with convenient access to services anytime and anywhere. Mobile applications can help gym members view schedules, track attendance history, receive notifications, and access instructional materials related to fitness exercises. For administrators, mobile technology allows easier monitoring of gym operations and member activities.

Notification systems are another important feature in modern applications because they help users stay informed about updates, reminders, and scheduled activities. In the context of gym management, notification features can remind members about schedules, membership-related concerns, or administrative announcements. These reminders improve communication and support better coordination between members and gym staff.

Inventory management systems are also commonly used in organizations that manage equipment and physical resources. These systems help administrators monitor the availability, condition, and usage of equipment or products. In fitness centers, inventory management can assist gym staff in tracking gym products, supplies, and selected equipment records. An organized inventory system ensures that available resources are properly monitored and updated.

Data security is another important consideration in developing information systems. Organizations must ensure that user information and operational records are protected from unauthorized access or loss. Database systems often implement security features such as user authentication, access control, and data backup mechanisms to maintain the confidentiality and integrity of stored information.

Another important concept related to information systems is data reporting. Information systems allow organizations to generate organized views of operational data such as attendance trends, membership status, schedules, and order records. These records provide administrators with useful information that can support decision-making and improve management strategies.

The development of information systems commonly follows the System Development Life Cycle (SDLC), which is a structured approach used to design, develop, test, and implement software systems. The SDLC ensures that system requirements are carefully analyzed and that the final system meets the needs of its users. By following a systematic development process, developers can create reliable and effective solutions for organizational management.

Overall, the concepts and technologies discussed in this section, including gym management systems, database management systems, QR code technology, mobile applications, notification systems, inventory management, data security, and system development methodologies, provide the theoretical and technological foundation for developing FordaGO: Mobile-Based Gym Database Management System. These technologies support the goal of improving operational efficiency, enhancing member experience, and assisting administrators in managing gym activities more effectively.

REVIEW OF RELATED SYSTEMS

1. Virtuagym Fitness Management System
Virtuagym is a comprehensive fitness management platform designed for gyms, fitness centers, and personal trainers. The system provides various features such as membership management, workout tracking, scheduling, and mobile application access for both administrators and members. Through its mobile platform, users can track their workouts, monitor their progress, and receive training programs from coaches. The system also allows administrators to manage member profiles, attendance records, and subscription payments within a centralized database.

One of the major advantages of Virtuagym is its ability to integrate workout tracking and gym management features into a single digital platform. This allows both gym staff and members to access important information through mobile devices. However, the system may require subscription fees and internet connectivity to access its full features, which may not be suitable for smaller gyms with limited resources.

Relation to the Proposed System: Virtuagym is related to the proposed FordaGO system because both systems aim to digitalize gym operations and provide a mobile platform for managing membership and workout information. However, the proposed FordaGO system focuses more directly on QR code-based attendance recording, equipment information access, schedule viewing, and inventory-related monitoring for AFFORDA Gym – San Isidro Branch.

2. Zen Planner Gym Management Software
Zen Planner is a gym management system developed to assist fitness businesses in managing membership records, scheduling, billing, and attendance monitoring. The system allows gym administrators to track member activity, manage class schedules, and automate payment processing. It also provides reporting tools that help gym owners analyze membership data and operational performance.

The platform helps reduce manual administrative work by automating several processes such as membership renewal notifications and payment tracking. However, the system may require training for staff to fully understand its features and may involve subscription costs for long-term usage.

Relation to the Proposed System: Zen Planner is closely related to the proposed FordaGO system because both systems focus on membership management, attendance monitoring, and administrative organization. The difference is that FordaGO is intended for the operational needs of AFFORDA Gym – San Isidro Branch and emphasizes QR code attendance, equipment guidance access, mobile schedule viewing, and inventory or product management.

3. Mindbody Gym Management Software
Mindbody is a widely used software platform designed for fitness centers, wellness facilities, and gyms. It provides tools for membership registration, scheduling classes, payment processing, and attendance monitoring. The system also allows gym administrators to manage customer profiles and track member visits through digital records.

One of the main advantages of Mindbody is its comprehensive set of business management tools that help gym owners manage operations efficiently. However, the platform may require significant financial investment due to subscription fees and additional costs for advanced features.

Relation to the Proposed System: Mindbody is related to the proposed FordaGO system because both systems aim to replace manual record-keeping with a digital management platform. However, FordaGO is more focused on the specific requirements of AFFORDA Gym – San Isidro Branch, particularly in attendance recording through QR code scanning, equipment information access, and centralized handling of gym-related records.

4. Glofox Gym Management System
Glofox is a management platform developed for gyms and fitness studios to simplify daily business operations. The system offers features such as membership registration, class scheduling, digital check-ins, and payment processing. It also provides a mobile application that allows members to book classes, view schedules, and manage their memberships conveniently.

The system helps gym administrators monitor member engagement and attendance through digital records. However, some features may require additional integrations, and the system may not be fully customizable for smaller gym facilities.

Relation to the Proposed System: Glofox is similar to the proposed FordaGO system because both use mobile technology to manage gym operations and member interactions. However, FordaGO focuses on integrating QR code scanning for attendance tracking and equipment information access while also supporting inventory or product monitoring for the gym.

5. TeamUp Fitness Management System
TeamUp is a cloud-based gym and fitness studio management platform designed to help fitness businesses manage scheduling, memberships, and payments. The system allows administrators to track member attendance, manage bookings, and monitor subscription status through an organized digital dashboard.

The platform provides a user-friendly interface that helps gym owners manage their operations more efficiently compared to manual record systems. However, some advanced reporting features and integrations may require additional configurations.

Relation to the Proposed System: TeamUp is related to the proposed FordaGO system because both systems support digital membership management and attendance monitoring. However, FordaGO enhances these functions by combining mobile access, QR code-based attendance, schedule viewing, equipment guidance access, and inventory-related management in one system intended for AFFORDA Gym – San Isidro Branch.

REFERENCES

Gym Management Systems
Glofox. (2024). Gym management software. Retrieved from https://www.glofox.com/gym-management-software
Mindbody. (2024). Gym management software. Retrieved from https://www.mindbodyonline.com/business/fitness/gym-software
TeamUp. (2024). Fitness management software. Retrieved from https://goteamup.com
Virtuagym. (2024). Gym management software solutions. Retrieved from https://business.virtuagym.com/gym-software
Zen Planner. (2023). Gym management software guide. Retrieved from https://zenplanner.com/gymowner/gym-management-software-guide

Database Management Systems
Hoffer, J. A., Ramesh, V., & Topi, H. (2020). Modern database management (13th ed.). Pearson Education.
IBM. (2023). What is a database management system (DBMS)? https://www.ibm.com/topics/dbms
Oracle. (2023). What is a database? https://www.oracle.com/database/what-is-database/
Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). Database system concepts (7th ed.). McGraw-Hill Education.

Systems Analysis and Design / SDLC
Dennis, A., Wixom, B. H., & Tegarden, D. (2021). Systems analysis and design: An object-oriented approach with UML (6th ed.). Wiley.
Kendall, K. E., & Kendall, J. E. (2019). Systems analysis and design (10th ed.). Pearson.

QR Code Technology
DENSO WAVE. (2023). What is a QR code? https://www.qrcode.com/en/about/

Mobile Applications / Information Systems
IBM. (2023). What are mobile applications? https://www.ibm.com/topics/mobile-application
Laudon, K. C., & Laudon, J. P. (2021). Management information systems: Managing the digital firm (17th ed.). Pearson.

Inventory / Operations Management
Heizer, J., Render, B., & Munson, C. (2020). Operations management: Sustainability and supply chain management (13th ed.). Pearson.
Stevenson, W. J. (2021). Operations management (14th ed.). McGraw-Hill Education.

Gym / Fitness Management
Baechle, T. R., & Earle, R. W. (2020). Essentials of strength training and conditioning (4th ed.). Human Kinetics.
NASM (National Academy of Sports Medicine). (2022). NASM essentials of personal fitness training (7th ed.). Jones & Bartlett Learning.

Software / Mobile System Implementation
Pressman, R. S., & Maxim, B. R. (2020). Software engineering: A practitioner's approach (9th ed.). McGraw-Hill Education.
Sommerville, I. (2019). Software engineering (10th ed.). Pearson.

TERMS AND DEFINITION

Access Control – A security mechanism used in this study to restrict and manage the permissions of gym administrators and members in accessing specific features, data, and functions within the FordaGO system.

Authentication – The process of verifying the identity of a user before granting access to the FordaGO system, ensuring that only registered members and authorized administrators can log in and use the application.

Computerized System – A digital and software-based solution used to replace manual and paper-based processes in gym operations, including membership management, attendance recording, scheduling, and inventory monitoring.

Database Management System (DBMS) – A software system used to store, organize, manage, and retrieve structured data efficiently. In this study, it serves as the foundation for handling member records, attendance logs, schedules, product information, and other gym-related data.

Equipment Guidance – Digital information or instructions provided through the FordaGO system to help gym members understand the correct use of selected gym equipment.

Inventory Record – A digitally maintained record of products, supplies, or equipment-related information stored in the FordaGO system for monitoring and updating gym resources.

Membership Monitoring – The process of tracking member details such as membership type, status, and expiration within the system.

Mobile Application – A software application designed to run on smartphones or mobile devices, allowing users to access gym services and information conveniently.

Notification – A message or alert generated by the system to inform users about important updates, reminders, or announcements related to gym activities.

QR Code – A two-dimensional barcode used in the FordaGO system for attendance recording and for accessing equipment-related information through scanning.

Schedule Management – The process of organizing and monitoring workout sessions or gym schedules within the system.

Security – The protection of system data and user information against unauthorized access, misuse, or loss through authentication and controlled access features.

System User – Any authorized individual who uses the FordaGO system, including gym administrators and members.

User Account – A digital account created in the system that stores login credentials and basic user information needed to access FordaGO.
-->
