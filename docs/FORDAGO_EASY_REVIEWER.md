# 🏋️ FordaGO — Complete System Reviewer
### Easy-to-Understand Guide for Capstone Defense Preparation

**Project:** FordaGO: An Automated Gym Management, Real-Time Interactive Coaching, and Optical Turnstile QR Access System
**Client:** AFFORDA Gym - Cabiao Branch, Nueva Ecija
**School:** Nueva Ecija University of Science and Technology (NEUST) - San Isidro Campus
**Program:** Bachelor of Science in Information Technology (BSIT)
**Team:** Bernaldo, Carl Andrew B. | Galang, Delwin F. | Javier, Jaylee T. | Medina, Ethan Jerome G. | Pongco, Ryza Mae M.

---

## TABLE OF CONTENTS

1. What is FordaGO? (The Big Picture)
2. The Problem FordaGO Solved
3. Who Uses the System? (User Roles)
4. What Can Each User Do? (Features)
5. How the System is Built (Architecture)
6. The Technology Stack Explained (Every Tool)
7. The Database (How Data is Stored)
8. Security (How the System Protects Data)
9. Real-Time Features (Live Updates)
10. Deployment (How the System Goes Online)
11. ISO/IEC 25010 Software Quality Evaluation
12. Common Defense Questions and Answers

---

## 1. What is FordaGO?

FordaGO is a complete digital gym management system built specifically for AFFORDA Gym in Cabiao, Nueva Ecija. Think of it as turning a traditional gym where everything is written on paper into a fully digital, connected, and smart gym.

### In Simple Terms:
- **Before FordaGO:** The gym used paper logbooks for attendance, sold supplements manually, and had no way for members to connect with coaches digitally.
- **After FordaGO:** Everything is digital. Members scan a QR code to enter the gym, coaches send workout plans through a chat app, and the admin sees all reports automatically.

### The System Has Three Parts:

| Part | Who Uses It | How They Access It |
|---|---|---|
| Member App | Gym Members | Android phone app or web browser |
| Coach Studio | Certified Gym Coaches | Same app, special coach menu |
| Admin Command Center | Gym Owner and Staff | Same app, special admin panel |

---

## 2. The Problem FordaGO Solved

Before this system existed, AFFORDA Gym had these real problems:

| Problem | Impact on the Gym |
|---|---|
| Attendance was recorded in a paper logbook | Easy to fake, hard to search, gets lost |
| No digital way to check if a member pass is valid | Staff had to memorize who has a pass |
| Members did not know how to use gym equipment properly | Risk of injury, especially for beginners |
| No direct communication between coaches and members | Coaching was informal, no written records |
| Inventory was tracked manually | Stock miscounts, theft easier to hide |
| Financial reports were computed by hand | Slow, prone to math errors |

FordaGO solved all of these by digitizing every operation of the gym into one connected system.

---

## 3. User Roles

The system has 4 distinct user roles, each with different permissions:

**Member** - A regular gym member who pays for a pass (Daily or 30-day Premium). Can generate their own QR code for entry. Can chat with coaches, track workouts, and order supplements.

**Coach** - A certified trainer registered by the admin. Gets a special Coach Studio panel inside the same app. Can manage clients, create workout plans, and set their schedule.

**Admin and Staff (Super Admin and Employee)** - The gym owner or front-desk employee. Has full access to all data: members, attendance, orders, reports. Super Admin has the highest permission including deleting accounts. Employee is a limited staff role that can approve orders and scan QR but cannot delete members.

**How Roles are Enforced:** The backend server checks the role of every user for every request. If a regular member tries to access the admin panel, the server automatically blocks it. This is not just hidden in the app — it is protected at the server level.

---

## 4. Features

### Member Features

**QR Code Attendance (Check-In)**
Every member gets a unique personal QR code displayed on their phone screen. When they arrive at the gym, the admin scans their QR code using the front-desk device. The system instantly records the time and date of their visit and automatically checks if their pass is still valid. If someone tries to share their pass, the system detects if it was already scanned too recently.

**Personal Record (PR) Tracker**
Members can log their personal bests for weight lifting exercises (example: Bench Press 80kg, Deadlift 120kg). The system shows percentage improvement over time, motivating members by showing their progress visually.

**Weekly Workout Planner (Split Routine)**
Members can plan their whole week of exercises. Example: Monday is Chest and Triceps at Floor A, Wednesday is Back and Biceps at Floor B. Each day can have different exercises with custom duration.

**Equipment QR Scanner (Gym Machine Tutorial)**
Every gym machine has a printed QR code sticker (called a QR placard) placed on it. Members scan this QR code with their phone camera. The app immediately shows a photo of the machine, which muscles it targets, and a step-by-step guide on how to use it safely. This prevents injuries for beginners.

**Supplement Shop (In-App Store)**
Members can browse available gym products: protein powder, pre-workout drinks, gym clothes, etc. They add items to a cart and checkout. Payment can be done at the counter (cash) or through GCash (the admin verifies the GCash reference number).

**Coach Chat (Real-Time Messaging)**
Members can browse the list of active coaches and send a coaching request to start a conversation. The chat works in real-time, messages appear instantly like WhatsApp. Coaches can send workout plan proposals directly inside the chat.

**Interactive App Tour (Onboarding)**
When a new member opens the app for the first time, a guided spotlight highlights each feature one by one. This helps new members understand the app without needing a manual.

### Coach Features

**Client Roster Management** - Coaches receive coaching requests from members and can accept or decline each request. Accepted members appear in their Clients list.

**In-Chat Workout Plan Proposals** - Inside the chat conversation with a client, the coach can create a structured workout plan with exercises, sets, reps, schedule date, duration, and price. The client receives the proposal in the chat and can accept or decline with one tap.

**Public Group Fitness Classes** - A coach can create a public fitness class (example: Zumba Class on Saturday 8AM, 20 slots). Regular members can browse these classes and book a seat. The coach sees a live roster of who booked.

**Weekly Availability Setting** - Coaches set which days and hours they are available for coaching. This prevents members from requesting coaching outside the coach schedule.

**Coach Dashboard** - Shows today scheduled sessions, pending client requests, and estimated monthly earnings. All information loads in a single action instead of clicking multiple pages.

### Admin Features

**Digital QR Turnstile Scanner** - The admin or staff uses a front-desk computer or phone to scan member QR codes. The system validates: Is the member registered? Is their pass active? When did they last check in? Anti-pass-sharing: If the same QR code was scanned less than a set time ago, the system flags it.

**Membership Pass Management** - Admin can view all members, their pass type (Daily or Premium), and expiry date. Admin can renew a member pass, upgrade from Daily to Premium, or deactivate it. Admin can create new member accounts manually.

**Shop Management and POS (Point of Sale)** - Admin sees all orders placed by members. For GCash payments: admin verifies the reference number before approving. For cash payments: admin confirms receipt and approves. Approved orders automatically deduct from the warehouse inventory.

**Equipment Management and QR Placard Generator** - Admin registers each gym machine (name, description, muscle group, photo, tutorial steps). After saving, the system generates a printable QR code that the admin prints and places on the machine.

**Coach Account Management** - Only the admin can register new coach accounts. Admin sets the coach profile, specialization, and contract expiry.

**Data Analytics and Reports** - Attendance Report (how many members visited), Sales Report (total revenue), Inventory Report (current stock levels), and Membership Report (active vs expired members). All reports can be downloaded as PDF or exported to CSV/Excel.

**Notifications Center** - Admin can send system-wide notifications to all members. Example: "Gym will be closed on December 25 for Christmas."

---

## 5. Architecture

The system follows a Tri-Tier Architecture meaning it has three separate layers that work together:

**TIER 1: PRESENTATION LAYER (What the user sees)**
- Ionic 8 + Angular 18 Mobile App (Android APK)
- Same app running as a web browser page
- Outputs: Screens, buttons, forms, QR codes, PDF reports
- Communicates via: HTTP REST API requests and WebSocket connection

**TIER 2: APPLICATION LAYER (The brain, processes all logic)**
- Laravel 11 REST API Server (Port 8000)
- Laravel Reverb WebSocket Server (Port 8080)
- Processes: Authentication, business rules, calculations

**TIER 3: DATA LAYER (Where data is permanently stored)**
- MySQL 8.0 Relational Database
- 21 tables: users, attendance, orders, equipment, messages, and more

### How a Typical Action Works (Example: Member Scans Equipment QR)

Step 1: Member points their phone camera at the QR placard on the Leg Press machine.
Step 2: The Capacitor Barcode Scanner reads the QR code and extracts the equipment ID (for example equipment_id: 7).
Step 3: The Angular app sends a request to the backend: "Give me information about equipment number 7."
Step 4: The Laravel server receives the request, checks that the user is logged in (token check), then queries the database.
Step 5: The MySQL database finds the record for equipment 7 and returns: name, photo URL, muscle group, tutorial steps.
Step 6: The Angular app receives the data and displays it on the member screen.
Step 7: The database also saves a log of this scan: who scanned it, which equipment, what time, for admin analytics.

This entire process takes less than 1 second.


---

## 6. Technology Stack

### FRONTEND TECHNOLOGIES (What the User Sees and Interacts With)

**Ionic Framework (Version 8)**
What it is: Ionic is a free, open-source toolkit for building mobile apps using web technologies (HTML, CSS, JavaScript) instead of native phone code.

Why we used it: Instead of learning two separate programming languages (one for Android in Java/Kotlin and one for iPhone in Swift), Ionic lets us write the app once and it works on both. It also works inside a web browser.

What it does in FordaGO: Provides all visual components that look like a real mobile app: buttons, cards, modal popups, tab bars at the bottom, loading spinners, alert dialogs, and input fields. Creates the dark-themed fitness design of the member app. Creates the clean white admin panel design. Makes the app feel native on Android with smooth transitions, swipe gestures, and back button behavior.

In the system: Every screen the member, coach, or admin sees is built with Ionic components. The tab bar at the bottom of the member app (Dashboard, Equipment, Shop, Profile) is an Ionic Tab Bar.

---

**Angular Framework (Version 18)**
What it is: Angular is a powerful JavaScript framework made by Google for building complex web applications. It organizes code into separate, reusable "components" (like building blocks).

Why we used it: Ionic requires Angular as the engine underneath. Angular is very structured, making it easier to build large applications without getting messy code. It handles routing (which page to show), data binding (showing live data on screen), and HTTP communication with the backend.

What it does in FordaGO:
- Controls which page/screen is displayed (routing)
- Loads data from the backend and displays it on screen
- Handles form validation (checking if an email format is correct before submitting)
- Protects pages from unauthorized access using Route Guards

Route Guards in FordaGO:
- authGuard: If a person is not logged in and tries to go to the dashboard, they are automatically redirected to the login page
- adminGuard: If a regular member tries to visit the admin panel, the app blocks them immediately
- guestGuard: If a person is already logged in and goes to the login page, they are redirected to the correct dashboard

---

**TypeScript**
What it is: TypeScript is an improved version of JavaScript. It adds "types" meaning you must declare what kind of data a variable holds (number, text, true/false, etc.).

Why we used it: Angular requires TypeScript. It catches mistakes before the app even runs. For example, if the backend sends member_count as a number but the code tries to use it as text, TypeScript flags the error immediately during development, not after deployment.

What it does in FordaGO: All Angular and Ionic logic in FordaGO is written in TypeScript. Defines data structures called Interfaces (for example, a User interface defines that every user has an id as a number, name as text, email as text, and role as text). This is why GitHub shows 82.8% TypeScript, because every page, service, and guard is a .ts file.

---

**SCSS (Sassy CSS)**
What it is: SCSS is an advanced version of regular CSS (the code that controls colors, sizes, and layout). It adds features like variables, nesting, and reusable code blocks.

Why we used it: Ionic uses SCSS by default. Variables let us define a color once and use it everywhere. If we want to change the main color of the whole app, we change one line, not hundreds.

What it does in FordaGO: Controls all visual design: dark theme colors, card styles, fonts, spacing, button shapes. Each page has its own .scss file for specific styling. Contains CSS animations for smooth screen transitions.

---

**Capacitor (Core and Android)**
What it is: Capacitor is a tool made by the Ionic team that wraps the web app inside a native Android (or iOS) shell, giving it access to the phone hardware.

Why we used it: A website running in a browser cannot access the phone camera or send push notifications by itself. Capacitor acts as a bridge connecting the web app to Android native camera, notification system, and file storage.

What it does in FordaGO: Allows the app to be compiled and installed as an actual Android APK file. Gives the app access to the phone camera for QR scanning. Enables receiving push notifications even when the app is closed.

---

**Capacitor Barcode Scanner (@capacitor-community/barcode-scanner)**
What it is: A plugin for Capacitor that activates the phone camera specifically for scanning QR codes and barcodes.

Why we used it: The default web camera API is not reliable on all Android devices. This plugin uses the native Android camera API directly, which is faster and works on all Android phones.

What it does in FordaGO: When a member taps "Scan Equipment" on the equipment page, this plugin activates the rear camera in full-screen mode. It detects QR codes and returns the encoded text (the equipment ID) to the app. Used only on the mobile Android app, not on the desktop web version.

---

**HTML5-QRCode**
What it is: A JavaScript library that uses the web browser built-in camera access (not a native plugin) to scan QR codes.

Why we used it: The desktop front-desk computer does not have the Capacitor native plugin, it runs the system in a regular web browser. This library provides QR scanning via the webcam for the desktop admin scanner.

What it does in FordaGO: Powers the Turnstile Scanner on the admin front-desk desktop computer. The admin opens the scanner page in the browser, the webcam activates, and they scan member QR codes as members arrive at the gym.

---

**angularx-qrcode and qrcode**
What it is: Libraries that generate QR code images inside the app without needing an internet connection.

Why we used it: We need to display each member personal QR code on their phone screen for gym entry. These libraries create the QR image directly in the browser, fast, with no server needed.

What it does in FordaGO: Generates the unique QR code shown on each member profile page. The QR code encodes the member unique ID. Also generates printable QR placard codes for gym equipment in the admin panel.

---

**jsPDF + jspdf-autotable**
What it is: JavaScript libraries that create PDF documents directly inside the browser, without needing a PDF program installed.

Why we used it: The admin needs professional, printable PDF reports. These libraries generate clean, formatted PDF documents with tables, headers, and data, all client-side, meaning no server processing is needed for PDF generation.

What it does in FordaGO: When admin clicks "Download PDF Report," the browser builds and downloads the PDF instantly. Creates formatted tables for Attendance Report, Sales Report, Inventory Report, and Membership Report. Each PDF has the FordaGO logo, date range, and formatted data tables.

---

**Laravel Echo + Pusher-JS**
What it is: JavaScript libraries that connect the browser/app to the WebSocket server for real-time, two-way communication.

Why we used it: Regular HTTP connections are one-way (the app asks, the server answers, then the connection closes). WebSockets stay open continuously, so the server can instantly push new messages to the app without the app asking.

What it does in FordaGO: Laravel Echo manages the WebSocket connection and listens to specific channels (like radio frequencies). Pusher-JS provides the protocol that Laravel Echo uses to connect. Together, they make chat messages appear instantly without refreshing. Also updates the notification badge count in real-time when a new notification arrives.

---

**Capacitor Firebase Messaging**
What it is: A plugin that connects the app to Google Firebase Cloud Messaging (FCM) service for sending push notifications to Android phones.

Why we used it: When the app is closed (user is not looking at it), the system still needs to notify them. For example: "Your supplement order was approved!" FCM handles this through the Android notification system.

What it does in FordaGO: When a member order is approved by admin, the backend sends a push notification to that member phone. When a coach sends a message, the member receives a notification even if the app is closed. Each device is registered with a unique FCM token, this is how the server knows which phone to send the notification to.

---

**RxJS (Reactive Extensions for JavaScript)**
What it is: A library for handling asynchronous data (data that arrives at different times, like loading from the internet).

Why we used it: Angular uses RxJS as its standard tool for HTTP requests and event handling. Instead of waiting for data to load (which would freeze the app), RxJS uses "Observables" which are subscriptions that automatically update the screen when data arrives.

What it does in FordaGO: Every API call in the app (for example, loading the list of products in the shop) uses RxJS Observables. Handles error catching: if the internet is down, RxJS catches the error and shows a user-friendly message. Manages real-time event streams from the WebSocket connection.

---

### BACKEND TECHNOLOGIES (The Brain, Processes All Logic)

**Laravel Framework (Version 11)**
What it is: Laravel is the most popular PHP web framework in the world. It provides a complete structure for building REST API servers, the brain of the application.

Why we used it: Building an API from scratch in raw PHP would take months and be insecure. Laravel provides ready-made solutions for authentication, database management, email sending, queuing, and more, all following industry best practices.

What it does in FordaGO: Handles all 120+ API endpoints (routes) that the frontend calls to get or save data. Manages authentication, database queries, and business logic. Sends automated emails. Processes background jobs (tasks that run in the background without making the user wait).

The 21 Controllers (departments of the backend):

| Controller | Responsibility |
|---|---|
| AuthController | Login, register, forgot password, change password |
| UserController | Manage member accounts, membership renewal |
| AttendanceController | QR check-in, attendance history, confirm/reject entries |
| EquipmentController | Add/edit/delete equipment, process equipment scans |
| InventoryController | Product management, cart checkout, order approval |
| ScheduleController | Gym class schedule management |
| WorkoutController | Store and retrieve member workout plans |
| WorkoutSessionController | Track personal workout sessions per day |
| PersonalRecordController | Save and update personal bests (PR tracking) |
| NotificationController | Send, list, and mark notifications as read |
| FeedbackController | Collect and summarize system feedback and ratings |
| ReportsController | Generate attendance, sales, inventory, and membership reports |
| CoachController | Browse coaches, coach profile, client list |
| AdminCoachController | Admin-only: create and manage coach accounts |
| CoachAvailabilityController | Coaches set their weekly available hours |
| CoachProgramController | Coaches create reusable workout program templates |
| CoachDashboardController | Loads all coach dashboard data in a single API call |
| ConversationController | Start, accept, decline, or delete coaching conversations |
| MessageController | Send messages, load chat history, mark as read |
| ProposalController | Send, accept, or cancel workout plan proposals in chat |
| ProgramBookingController | Book or cancel seats in public group fitness classes |

---

**PHP (Version 8.2+)**
What it is: PHP is the programming language that powers the backend. PHP 8.2 is a modern version with significant performance improvements.

Why we used it: Laravel is built on PHP. PHP 8.2 adds features like faster execution, better type checking, and readonly properties, making the code more reliable and secure.

What it does in FordaGO: All backend logic is written in PHP. Controllers, models, middleware, and database migrations are all PHP files.

---

**Laravel Sanctum (Bearer Tokens)**
What it is: A Laravel package that provides simple, secure token-based authentication for APIs and mobile applications.

Why we used it: When a member logs in, the system needs to remember who they are for all future requests. Sanctum generates a unique secret token (like a VIP wristband with an encoded serial number) that the app saves and sends with every request.

How it works in FordaGO step by step:
1. Member enters email and password on the login screen
2. The backend checks if the credentials are correct
3. If correct, Laravel Sanctum creates a Bearer Token (a long, random, encrypted string)
4. The app saves this token on the device (in localStorage)
5. For every future request (loading the shop, checking in), the app automatically sends this token in the request header
6. The backend reads the token, verifies it is valid, and identifies the user
7. When the member logs out, the token is deleted from the server and can never be used again

What "Bearer Token" means: "Bearer" means "the one carrying this token." The server trusts whoever presents the correct token.

---

**Bcrypt Password Hashing**
What it is: Bcrypt is a one-way mathematical algorithm that transforms a password into a scrambled, fixed-length string called a "hash." It cannot be reversed, even the system owner cannot see the original password.

Why we used it: Storing raw passwords in a database is extremely dangerous. If a hacker accessed the database, they would see all passwords. Bcrypt makes this impossible.

How it works in FordaGO:
1. Member registers with password: MyGymPass123
2. Bcrypt scrambles it into a 60-character unreadable hash. The actual hash is different every time due to "salt" (random extra characters added before hashing)
3. The database only stores the hash, never the original password
4. When the member logs in, Bcrypt hashes the entered password and compares the two hashes. If they match, login is approved

---

**Laravel Reverb (WebSocket Server)**
What it is: Laravel Reverb is a built-in WebSocket server for Laravel. A WebSocket is a persistent, two-way connection between the server and the app, unlike regular HTTP which closes after each request.

Why we used it: The chat system requires messages to appear instantly (sub-second). Regular HTTP would require the app to constantly check "any new messages?" every second, which is inefficient and laggy. WebSockets push new data the moment it is available.

What it does in FordaGO: Runs as a dedicated separate server process on port 8080. When a coach sends a message, the backend broadcasts the message through Reverb. The Reverb server instantly pushes the message to the member app. Also broadcasts new notification events, order status updates, and unread message counts.

The difference from regular HTTP: HTTP is like sending a letter (you send, wait, receive reply). WebSocket is like a phone call (both sides talk and hear in real time).

---

**Laravel Queue Worker**
What it is: A background process that handles tasks that should not make the user wait, like sending emails.

Why we used it: Sending an email takes a moment. If the server sends the email during the password-reset request, the user has to wait. Instead, the task is put in a queue (waiting line) and the queue worker handles it in the background.

What it does in FordaGO: Sends password reset emails after a member requests one. Sends Firebase push notification requests to Google servers. Configured with 3 retry attempts and 90-second timeout for reliability.

---

**Laravel Eloquent ORM**
What it is: ORM (Object-Relational Mapper) is a system that lets you interact with the database using PHP code instead of raw SQL queries. Eloquent is Laravel built-in ORM.

Why we used it: Writing raw SQL for every operation (SELECT, INSERT, UPDATE, DELETE) is repetitive and prone to errors, including SQL injection vulnerabilities. Eloquent automatically prevents SQL injection and makes database operations readable.

What it does in FordaGO: Every database table has a corresponding Model (for example, User.php, Product.php, Attendance.php). Models define relationships (for example, a User "has many" Orders, an Order "belongs to" a User). The 21 database models in FordaGO handle all data operations cleanly and safely.

---

**ACID Database Transactions + Row-Level Locking**
What it is: ACID stands for Atomicity, Consistency, Isolation, Durability. These are guarantees for database operations. A transaction groups multiple database operations so they either all succeed or all fail together. Row-level locking prevents two operations from modifying the same data row simultaneously.

Why we used it: The gym supplement shop has a critical problem: what if two members try to buy the last protein shake at the exact same time? Without protection, both could succeed, creating a negative stock count.

How it works in FordaGO (The Checkout Process):
1. Member A and Member B both click "Checkout" at the same time for the last Whey Protein
2. The system uses a Database Transaction (the checkout is treated as one complete operation)
3. Inside the transaction, the system applies a row-level lock on the Whey Protein product row, preventing other operations from modifying it at the same time
4. Member A checkout locks the row first, deducts the stock, and completes successfully
5. When Member B checkout tries to lock the same row, it waits, then finds the stock is now 0, and returns an error: "Item out of stock"
6. If anything fails during the checkout, the entire transaction rolls back (the stock count is restored automatically, as if nothing happened)


---

## 7. Database Tables

**MySQL (Version 8.0)**
What it is: MySQL is one of the most popular relational database management systems in the world. "Relational" means data is stored in structured tables with rows and columns, and tables can be connected to each other.

Why we used it: MySQL is reliable, fast, and works perfectly with Laravel. It supports the ACID transactions and row-level locking that the shop checkout system needs.

**Third Normal Form (3NF) Database Normalization**
What it is: 3NF is a standard rule for designing relational databases efficiently. It eliminates redundant (repeated) data by separating information into the correct tables and linking them with IDs.

Why we used it: If we stored the member name inside every attendance record, and the member changes their name, we would have to update hundreds of rows. With 3NF, the attendance table only stores the user_id. The name is always read from the users table. Change the name in one place, it updates everywhere.

**Database Performance Indexes**
What it is: A database index is like the index at the back of a textbook. Instead of reading every page to find a topic, you go directly to the index and it tells you the exact page.

Why we used it: As the gym grows, the database will have thousands of attendance records. Without indexes, every search scans the entire table. With indexes on frequently searched columns, the database jumps directly to the correct rows.

What was indexed in FordaGO: user_id columns in attendance, orders, messages, notifications, and workout tables (because the most common query is "get everything for this specific user"). created_at columns for date-range filtering in reports.

### All 21 Database Tables:

| Table Name | What It Stores |
|---|---|
| users | All accounts: members, coaches, admin, staff. Stores name, email, password hash, role, membership type, pass expiry, FCM token |
| personal_access_tokens | The Sanctum Bearer Tokens for each logged-in user |
| attendance | Every QR check-in event: who, when, which session, confirmed or pending |
| products | Supplement and merchandise catalog: name, price, stock quantity, photo |
| orders | Every purchase: which member, which product, payment method, status (pending/approved/rejected) |
| equipment | All gym machines: name, description, targeted muscles, photo URL, tutorial steps |
| equipment_scan_logs | Log of every equipment QR scan: who scanned, which machine, what time |
| sessions | Gym class schedule: class name, description, date, time, location |
| notifications | All notifications: message content, which user, read/unread status |
| workouts | Member weekly workout plans: day, exercises, duration, location |
| workout_sessions | Actual workout session logs per day: specific exercises, sets, reps completed |
| personal_records | Member personal bests: exercise name, max weight/reps, date set |
| conversations | Coaching chat threads: which member and which coach, status (pending/accepted) |
| messages | Individual chat messages: sender, content, timestamp, read status |
| workout_plan_proposals | Coach-sent workout plan proposals in chat: exercises, schedule, price, status |
| workout_plan_items | Individual exercises within a proposal: exercise name, sets, reps, notes |
| coach_profiles | Coach details: specialization, photo, bio, contract expiry, active status |
| coach_availability | Coach weekly schedule: day of week, start time, end time |
| coach_programs | Coach-created group workout templates: name, description, schedule, max participants |
| coach_program_items | Exercises within a coach program template |
| program_bookings | Members who booked a public group class: which member, which program, status |
| feedbacks | System quality ratings submitted by users (ISO 25010 survey) |
| password_resets | Temporary password reset tokens sent via email |

---

## 8. Security

FordaGO implements multiple layers of security to protect user data and system integrity.

**Layer 1: Authentication (Who Are You?)**
Every user must log in with their email and password. Passwords are protected by Bcrypt one-way hashing. The server never stores or sees the real password. Successful login generates a unique Sanctum Bearer Token required for all future requests. Tokens are deleted on logout.

**Layer 2: Authorization (What Can You Do?)**
Every protected API route checks the user role before executing. A regular member token cannot access admin routes. The server rejects the request with a "403 Forbidden" error. This is enforced on the server side. Even if someone bypasses the app, the API blocks unauthorized actions. Three permission groups: admin/super_admin (full access), employee (operational access), member (personal data only).

**Layer 3: Token Security**
Sanctum tokens are hashed in the database using SHA-256. The actual token is never stored as plain text. Tokens are revoked (deleted) when the user logs out. Each device gets its own token.

**Layer 4: Input Validation**
All data sent to the backend is validated before being processed. Email must be a valid email format, phone numbers must be numeric, required fields cannot be empty. Eloquent ORM parameterized queries prevent SQL injection attacks.

**Layer 5: Password Recovery Security**
Forgot password flow uses a 6-digit time-limited OTP sent to the user email. OTPs expire after a short period and cannot be reused. The OTP is stored as a hash in the database, not as plain text.

**Layer 6: Anti-Pass-Sharing**
The attendance system tracks the timestamp of the most recent check-in per member. If the same QR code is scanned again within a set minimum time interval, the system flags it as a potential shared pass. Admin is alerted to review the check-in.

---

## 9. Real-Time Features

Real-time means updates happen instantly without the user needing to refresh or click anything.

### How Real-Time Works in FordaGO:
1. The app connects to the Reverb WebSocket server on port 8080 when it starts
2. This connection stays open (persistent) as long as the app is running
3. When a coach sends a message, the Laravel backend broadcasts a "MessageSent" event through Reverb
4. The Reverb server instantly pushes this event to the member app through the open WebSocket connection
5. The member sees the new message appear in their chat screen immediately

### What is Real-Time in FordaGO:

| Feature | What Happens in Real-Time |
|---|---|
| Chat Messages | Messages appear instantly in both the sender and receiver screen |
| Unread Message Badge | The notification badge updates immediately when a new message arrives |
| Order Status | When admin approves an order, the member order status updates without refreshing |
| Push Notifications | When the app is closed, FCM delivers a push notification to the phone |

### How Channels Work:
- Each conversation has a private channel. Only the two participants (member and coach) can see messages in that channel.
- Notifications are on a private user channel. Each user only receives their own notifications.
- This prevents data leaks. A member cannot intercept another member messages.

---

## 10. Deployment

Deployment means making the system available online so the gym can actually use it.

### What is a VPS (Virtual Private Server)?
A VPS is a dedicated cloud computer that runs 24 hours a day, 7 days a week. Instead of the system running on a local computer at the gym (which would turn off at night), it runs on a cloud server in a data center that never turns off. AFFORDA Gym VPS runs Linux operating system and has a static public IP address, a permanent internet address that never changes.

### What is Docker?
Docker is a tool that packages the entire application (backend, database, frontend, and all their dependencies) into isolated "containers" (like self-contained boxes).

Without Docker: Installing the system on a new server requires manually installing the correct version of PHP, MySQL, Node.js, and Nginx, then configuring them all, and hoping everything works together.

With Docker: You run one command and all services start correctly every time, guaranteed.

### FordaGO 6 Docker Containers:

| Container Name | What It Runs | Port |
|---|---|---|
| fordago_db | MySQL 8.0 database server | Internal only |
| fordago_backend | Laravel PHP-FPM API server | Internal only |
| fordago_reverb | Laravel Reverb WebSocket server | Internal port 8080 |
| fordago_queue | Laravel Queue Worker (background email/push) | No port, background only |
| fordago_frontend | Built Ionic/Angular static web app files | Internal only |
| fordago_gateway | Nginx reverse proxy (traffic director) | Port 80 (HTTP) and 443 (HTTPS) |

### What is Nginx?
Nginx (pronounced "Engine-X") is a high-performance web server that acts as the "receptionist" of the system. All internet traffic first arrives at Nginx, which then directs each request to the correct container:
- Requests to /api/... go to the Laravel backend container
- Requests to / (the website) go to the Angular frontend container
- WebSocket requests go to the Reverb container

### What is Podman?
Podman is an alternative to Docker that runs without requiring administrator (root) privileges. FordaGO deployment script automatically detects whether Docker or Podman is installed and uses whichever is available.

### The Automated Deployment Script (deploy.sh):
This is a script that automates the entire process of updating the live server. Instead of manually doing 10 steps every time there is an update, the developer runs this script and it:
1. Checks if Docker or Podman is installed
2. Pulls the latest code changes from GitHub
3. Rebuilds the Docker containers with the new code
4. Runs database migrations (creates any new tables or columns)
5. Restarts all containers
6. The system is live with the new update

This is called Continuous Deployment (CD) in professional software development, a best practice that ensures updates are fast, consistent, and error-free.

---

## 11. ISO/IEC 25010 Software Quality Evaluation

ISO/IEC 25010 is an international standard from the International Organization for Standardization (ISO) that defines a framework for evaluating the quality of software products. The researchers evaluated FordaGO against 8 quality characteristics using a 4-point Likert scale (1 = Strongly Disagree, 4 = Strongly Agree). 15 evaluators participated.

### Overall Results:

| Evaluator Group | Average Rating | Interpretation |
|---|---|---|
| IT Experts (Panelists) | 3.75 out of 4.00 | Strongly Agree, Highly Acceptable |
| Staff and Coaches | 3.84 out of 4.00 | Strongly Agree, Highly Acceptable |
| Gym Members | 3.82 out of 4.00 | Strongly Agree, Highly Acceptable |

---

### The 8 Quality Characteristics:

**1. Functional Suitability - Does the system do everything it is supposed to do?**

What it measures: Whether all planned features work correctly and completely.

How FordaGO passes: QR attendance check-in works correctly for all pass types. Shop checkout correctly deducts inventory stock. Coach chat correctly delivers messages in real-time. PDF reports accurately display attendance, sales, and inventory data. Equipment QR scanner correctly shows the tutorial for each machine. All 21 API controllers handle their respective functions completely.

Evidence: All features planned in the system requirements were implemented and verified through User Acceptance Testing (UAT) with actual gym staff and members at AFFORDA Gym.

---

**2. Performance Efficiency - Is the system fast enough?**

What it measures: Response time, resource usage, and capacity under load.

How FordaGO passes: API responses return in under 500 milliseconds for standard queries. WebSocket messages (chat) deliver in under 50 milliseconds. QR code scanning and display takes less than 1 second end-to-end. Database indexes on user_id, created_at, and composite columns reduce query time significantly. The single dashboard endpoint for coaches loads all dashboard data in one call instead of 6 separate calls (reducing network round-trips by 83%).

Evidence: Database performance indexes were added in two dedicated migration files specifically targeting query performance on high-traffic tables.

---

**3. Compatibility - Does the system work across different devices and environments?**

What it measures: Whether the system works on different phones, browsers, and operating systems.

How FordaGO passes:
- Android Phones: Compiled as an APK using Capacitor, works on Android 8.0 and above
- Web Browser Desktop: The same Angular app runs in any modern browser (Chrome, Firefox, Edge) without installation
- Different Screen Sizes: SCSS responsive layouts adapt to different phone screen sizes and desktop screen resolutions
- Different Networks: Works on Wi-Fi, mobile data (4G/5G), and LAN connections

Evidence: Multiple APK versions (v14 through v22) show iterative testing across different device conditions.

---

**4. Usability - Is the system easy to understand and use?**

What it measures: How easy it is for users to learn, operate, and navigate the system.

How FordaGO passes:
- Ionic UI Components: Standard, recognizable mobile interface patterns (tab bars, cards, modals) that users are familiar with from other apps
- Interactive Onboarding Tour: New members are guided through every feature with spotlight tutorials, no need to read a manual
- Role-Based Navigation: Each user only sees what is relevant to them, members do not see admin options
- Consistent Design Language: Dark fitness theme for members, clean white for admin, visual distinction helps users orient themselves
- Clear Error Messages: All validation errors show specific, helpful messages
- Feedback Collection: Post-evaluation feedback form built into the system to continuously gather usability improvements

Evidence: Evaluated by gym members (non-technical users) with an average rating of 3.82 out of 4.00, indicating high usability even for first-time users.

---

**5. Reliability - Does the system work consistently without crashing?**

What it measures: How often the system fails, and how well it recovers from errors.

How FordaGO passes:
- ACID Transactions: If a checkout fails midway, the database automatically rolls back. Stock count is restored, no data is corrupted.
- Queue Worker with Retry: Background tasks (emails, push notifications) automatically retry up to 3 times if they fail
- Docker restart unless-stopped: All containers automatically restart if they crash, the system recovers without manual intervention
- Error Handling: All API endpoints have try-catch error handling. Unexpected errors return a structured error response instead of crashing the server.
- Token Validation: Every request is validated. Invalid tokens are rejected gracefully without exposing system details.

Evidence: The restart configuration in docker-compose.prod.yml and the --tries=3 --timeout=90 in the queue worker configuration demonstrate built-in fault tolerance.

---

**6. Security - Is user data and system access protected?**

What it measures: How well the system protects against unauthorized access, data breaches, and attacks.

How FordaGO passes:
- Bcrypt Password Hashing: User passwords are never stored as plain text. Even if the database is compromised, passwords cannot be recovered.
- Sanctum Bearer Tokens: Stateless, token-based authentication. No traditional session cookies vulnerable to CSRF attacks.
- Role-Based Access Control (RBAC): Every route is protected by role middleware. Unauthorized access is blocked at the server level, not just the UI level.
- SQL Injection Prevention: Eloquent ORM uses parameterized queries. User inputs are never directly embedded in SQL statements.
- OTP-Based Password Recovery: Forgot password uses a time-limited one-time code sent to the registered email, preventing account takeover.
- Anti-Pass-Sharing: Timestamp validation on QR scans prevents members from sharing gym access.

---

**7. Maintainability - Can the system be easily updated and improved?**

What it measures: How easily developers can modify, update, fix bugs, or add new features.

How FordaGO passes:
- MVC Architecture: Laravel Model-View-Controller separation means changing one part does not break others. Changing the checkout logic only touches InventoryController.php, not the database or the frontend.
- Angular Component Architecture: Each page is an independent, self-contained component. Fixing the QR scanner page does not affect the shop page.
- TypeScript Strong Typing: Type definitions catch errors during development, making future code changes safer.
- 42 Database Migrations: Every database change is tracked as a sequential migration file. The database can be rebuilt from scratch or rolled back to any previous version.
- Docker Containers: Updating PHP or MySQL is as simple as changing the version in the Dockerfile. Dependencies are isolated and never conflict with other server software.
- Automated Deploy Script: deploy.sh makes updates a single command instead of a 20-step manual process.

Evidence: 42 migration files in backend/database/migrations/ showing systematic, versioned database evolution from August 7 to August 27, 2026.

---

**8. Portability - Can the system be moved to a different environment easily?**

What it measures: How easily the system can be installed, moved, or adapted to different hardware or environments.

How FordaGO passes:
- Docker Containers: The entire system can be deployed on any Linux server running Docker. No manual environment setup required. The same Docker configuration that runs on the development laptop runs identically on the cloud VPS.
- Podman Compatibility: The deploy script detects and supports both Docker and Podman (two different container runtimes), making it compatible with more server environments.
- Android APK Distribution: Members can install the FordaGO app by downloading the .apk file directly. No Google Play Store required. Works on any Android 8.0+ phone.
- Progressive Web App (PWA): The same frontend code runs in any modern web browser without installation. The admin panel is accessible on any desktop computer.
- Environment Variables: All server addresses, database passwords, and API keys are stored in .env files. Changing environments (development to production) only requires changing one file, not the code.

Evidence: Multiple APK files in the project root demonstrate successful compilation for Android deployment.

---

## 12. Common Defense Questions and Answers

**Q: What is FordaGO?**
A: FordaGO is a full-stack, real-time gym management system developed for AFFORDA Gym in Cabiao, Nueva Ecija. It digitizes gym operations by providing QR code attendance, equipment tutorials, real-time coach-member chat, supplement ordering, and administrative analytics, all in one connected application accessible on Android phones and web browsers.

---

**Q: What problem does FordaGO solve?**
A: The gym was entirely paper-based: attendance in logbooks, no digital communication between coaches and members, manual inventory tracking, and no way to verify membership validity quickly. FordaGO eliminated all paper-based processes and replaced them with a secure, real-time digital system.

---

**Q: Why did you choose Ionic and Angular instead of React Native or Flutter?**
A: We chose Ionic 8 with Angular 18 because Ionic provides a complete mobile UI library that produces native-looking apps while running on web technologies. Additionally, Ionic allows the same codebase to produce an Android APK and a browser web app simultaneously, which was essential because the admin panel needs to run on a desktop browser while the member app runs on a mobile phone.

---

**Q: Why did you use Laravel instead of other backend frameworks?**
A: Laravel 11 was chosen for three main reasons: First, it provides built-in solutions for authentication (Sanctum), real-time WebSockets (Reverb), database migrations, and email, reducing development time significantly. Second, its Eloquent ORM provides SQL injection protection by default. Third, its expressive, readable code makes future maintenance easier for developers who may not have been part of the original team.

---

**Q: What is a Bearer Token and how does it protect the system?**
A: A Bearer Token is a unique, long, randomly generated string that acts as a digital identity card. When a user logs in, the server generates this token and sends it to the app. The app stores it and sends it with every future request in the HTTP header. The server checks this token on every request to verify the user identity and role. On logout, the token is deleted from the server, making it immediately invalid.

---

**Q: What happens if two people try to buy the last protein shake at the same time?**
A: The system uses ACID database transactions combined with row-level locking. When the first checkout starts, the database locks the product row. The second checkout waits for the lock to release. By the time it does, the first checkout has already deducted the stock. The second checkout detects that the stock is now 0 and returns an "out of stock" error. If anything fails midway, all changes are automatically rolled back. Stock count is always accurate.

---

**Q: How does the QR attendance anti-pass-sharing work?**
A: Each time a QR code is scanned and validated, the system records the timestamp of that check-in. When the same QR code is scanned again, the system compares the current time with the last scan time. If they are too close together (within the defined minimum interval), the system flags it as a potential pass-sharing violation. This cannot be bypassed because the check is done server-side. The app cannot alter the server timestamp records.

---

**Q: Why does GitHub show only 4.2% PHP if Laravel is the entire backend?**
A: GitHub language detection only measures the files we wrote, not the framework files in the vendor/ folder (which is excluded in .gitignore). The vendor/ folder contains millions of lines of Laravel framework code. Our custom controllers, models, and routes make up 4.2% of the tracked codebase. Meanwhile, 82.8% is TypeScript because every Angular page, service, interface, and guard is a separate .ts file, and there are 30+ pages in the frontend alone.

---

**Q: Why did you use Docker?**
A: Docker ensures the system runs identically in every environment. Without Docker, setting up the system on a new server requires manually installing the correct version of PHP, MySQL, Node.js, and Nginx, and configuring them to work together (a process prone to version conflicts and human error). With Docker, all dependencies are packaged into containers. The same setup runs on a developer laptop, a test server, and the production cloud VPS without any differences.

---

**Q: What is WebSocket and why is regular HTTP not enough for the chat?**
A: HTTP works like a postal service: the app sends a request (letter), the server sends back a response (reply), and the connection closes. For chat to work with HTTP, the app would need to ask "any new messages?" every second. This wastes bandwidth and still introduces a delay. WebSocket is like a phone call: the connection stays open continuously, and either side can send data at any moment. When a coach sends a message, the server pushes it to the member app immediately, appearing in under 50 milliseconds.

---

**Q: What is ISO/IEC 25010 and why did you use it?**
A: ISO/IEC 25010 is an international standard from the International Organization for Standardization (ISO) that defines a framework for evaluating the quality of software products. We used it because it provides a standardized, academically recognized method for measuring whether our system meets professional software quality standards across 8 characteristics: Functional Suitability, Performance Efficiency, Compatibility, Usability, Reliability, Security, Maintainability, and Portability.

---

**Q: Who were your evaluators and how many were there?**
A: We had 15 evaluators divided into three groups: IT Experts (technical panelists who evaluated the code and architecture), Gym Staff and Coaches (domain experts who evaluated operational functionality), and Gym Members (end users who evaluated usability and practicality). Each group used a 4-point Likert scale questionnaire with 20 items aligned to the 8 ISO/IEC 25010 quality characteristics.

---

**Q: What were your evaluation results?**
A: All three evaluator groups rated the system at or above 3.75 out of 4.00. IT Experts gave 3.75, Staff and Coaches gave 3.84, and Gym Members gave 3.82. All ratings fall within the "Strongly Agree, Highly Acceptable" interpretation range, indicating the system meets professional software quality standards across all eight ISO/IEC 25010 characteristics.

---

**Q: What is your research design or methodology?**
A: We used an Agile Developmental Research Design with iterative SDLC (Software Development Life Cycle) phases. The development proceeded in sprints (short cycles where features were planned, built, tested with actual gym users, refined based on feedback, and then deployed). This approach ensured the system evolved based on real user needs rather than assumptions. The final evaluation used a descriptive quantitative approach with the ISO/IEC 25010 questionnaire as the primary data collection instrument.

---

*This reviewer was prepared to help the FordaGO capstone team understand and confidently explain their complete system during the academic defense.*
*Copyright 2026 FordaGO Capstone Team - NEUST San Isidro Campus*
