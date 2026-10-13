# FORDAGO: COMPLETE CAPSTONE DEFENSE PRESENTATION & LIVE DEMO SCRIPT
## Step-by-Step Verbatim Script, On-Screen Actions, and Presentation Guide
**System Title:** FordaGO: Mobile-Based Gym Database Management System  
**Client / Beneficiary:** AFFORDA Gym – Cabiao Branch (Cabiao, Nueva Ecija)  
**Target Duration:** 15 – 20 Minutes (Presentation & Live Demo) + Panel Q&A  
**Language:** Professional Academic Taglish (English Technical Terminology with Natural Filipino Delivery)  
**Document Version:** 2.0 (Final Oral Defense Ready)  

---

## 📋 PRE-DEMO SETUP & CHECKLIST (Gawin 30 Minutos Bago ang Defense)

Bago tawagin ang inyong grupo sa harap ng panel, tiyakin ang mga sumusunod:
1. **Device 1 (Presenter Laptop naka-connect sa Projector):**
   - Buksan ang Browser sa `https://app.affordagym.com` (o local test environment).
   - Naka-open na ang Tabs:
     * Tab 1: Slide Deck Presentation (PowerPoint / Canva / PDF).
     * Tab 2: Admin Command Center (`admin@affordagym.com` naka-pre-login).
     * Tab 3: Front-Desk Tablet Kiosk view (`staff@affordagym.com` para sa QR Scanner).
2. **Device 2 (Smartphone - Android Phone / Sideloaded APK):**
   - Naka-install ang `fordago_latest.apk`.
   - Naka-login bilang Member Account (`member@gmail.com`).
   - Screen Timeout naka-set sa "Never" o "10 Minutes" para hindi mag-lock habang nagde-demo.
3. **Physical Props na Nakalapag sa Harap:**
   - Printed/Laminated QR Code para sa Gym Attendance (`FORDAGO_GYM_CHECKIN_V1`).
   - Printed Sample Machine QR Code (e.g., Chest Press / Lat Pulldown).
   - Physical ₱50 o ₱40 bill pambayad kunwari sa counter cashier.
4. **Internet Fail-Safe:**
   - Tiyakin na naka-connect sa reliable Wi-Fi o naka-standby ang Mobile Data Personal Hotspot.

---

## ⏱️ PRESENTATION TIMELINE OVERVIEW

| Bahagi | Nilalaman | Target Oras |
| :--- | :--- | :---: |
| **Part 1** | Formal Opening, Problem Statement & Beneficiary | 0:00 – 2:30 |
| **Part 2** | System Architecture & Technology Stack Overview | 2:30 – 5:00 |
| **Part 3** | **Live System Demonstration (The 6 Core Scenes)** | 5:00 – 16:00 |
| **Part 4** | Research Methodology, ISO 25010 Results & Conclusion | 16:00 – 18:00 |
| **Part 5** | Formal Transition to Panel Questions & Answers (Q&A) | 18:00+ |

---

# 🎙️ PART 1: FORMAL OPENING & PROBLEM STATEMENT (2.5 MINUTES)

### 👤 Sino ang Magsasalita: **Project Leader / Lead Presenter**
### 🖥️ Screen / Slide: **Title Slide & Problem Domain**

#### 🗣️ SCRIPT (Verbatim Delivery):
> *"A pleasant morning/afternoon to our distinguished members of the panel—to our Panel Chair, to our Technical Evaluator, Subject Matter Specialist, and to our Capstone Adviser.*
>
> *We are the proponents of the study entitled: **'FordaGO: Mobile-Based Gym Database Management System'**, developed specifically for our client beneficiary, **AFFORDA Gym – Cabiao Branch**, located in Cabiao, Nueva Ecija.*
>
> *Panel members, across many municipalities in the Philippines, local fitness gyms remain the backbone of community physical wellness. However, during our formal baseline investigation at AFFORDA Gym, we discovered that their daily operations were severely hindered by three major operational bottlenecks:*
>
> 1. ***Manual Paper Logbooks:** Every walk-in guest and monthly member had to physically line up and write their name, time-in, and contact number in a paper logbook. During peak afternoon hours between 4:00 PM and 8:00 PM, this created counter congestion, taking 3 to 5 minutes per registrant, while generating illegible entries with zero audit trail.*
> 2. ***Novice Gym Intimidation & Injury Risks:** Out of 30 active gym members surveyed, 87% of beginners reported feeling overwhelmed and intimidated by gym machines, unsure of proper biomechanics and rep schemes due to the limited number of floor staff.*
> 3. ***Unmonitored Subscriptions & Discrepant Inventory:** Membership expiries were tracked manually by flipping through past logbook pages, leading to uncollected fees. At the same time, counter supplement sales and energy drinks lacked real-time stock reconciliation.*
>
> *Existing commercial solutions like Mindbody or Glofox cost hundreds of dollars monthly and require expensive foreign payment gateways that local community gyms simply cannot afford. Meanwhile, apps like MyFitnessPal only track personal calories without any facility integration.*
>
> *To solve this operational gap, we engineered **FordaGO**—a unified, cloud-hosted, mobile-first gym management ecosystem that digitizes front-desk attendance via sub-500ms optical QR scanning, automates WHO-standardized workout recommendations, enforces real-time WebSocket communication, and delivers transparent inventory and revenue analytics.*
>
> *Allow us now to present the technical architecture behind FordaGO."*

---

# 🏛️ PART 2: SYSTEM ARCHITECTURE & TECH STACK (2.5 MINUTES)

### 👤 Sino ang Magsasalita: **Systems Architect / Technical Lead**
### 🖥️ Screen / Slide: **System Architecture Framework Diagram**

#### 🗣️ SCRIPT (Verbatim Delivery):
> *"Distinguished panel, FordaGO is architected upon a robust **Three-Tier Modular Framework** designed for high security, low latency, and cross-platform flexibility:*
>
> * **Tier 1 — Presentation Layer (Client Touchpoints):**  
>   *On the client side, we developed a unified TypeScript codebase using **Angular 18 and Ionic Framework v8**, integrated with **Capacitor 6**.*  
>   *This single codebase powers our native **Android APK** for mobile members and coaches, while simultaneously providing a Progressive Web Application at **`app.affordagym.com`** for front-desk tablet kiosks and desktop administration.*
>
> * **Tier 2 — Application & Business Logic Tier:**  
>   *Our backend is powered by **PHP 8.2 with Laravel 11**, exposing secure RESTful API endpoints protected by **Laravel Sanctum Bearer Token Authentication**.*  
>   *For real-time full-duplex communication, we deployed **Laravel Reverb**—an asynchronous first-party WebSocket server running on port 8080 that pushes live attendance updates to the front desk in **less than 100 milliseconds**.*
>
> * **Tier 3 — Data Persistence Layer:**  
>   *All data is stored in an enterprise **MySQL 8.0 relational database**, fully normalized to **Third Normal Form (3NF)** with strict foreign key constraints, cascading policies, and atomic transactions.*
>
> * **Security & Compliance:**  
>   *In compliance with **Republic Act 10173 (The Data Privacy Act of 2012)**, all user credentials are encrypted at rest using **bcrypt hashing**, while client-server transit is strictly secured via **TLS 1.3 / HTTPS**.*  
>   *We enforce a strict **Role-Based Access Control (RBAC)** model separating Super Admins, Gym Admins, Front-Desk Staff, Coaches, and Members.*
>
> *Let us now transition from theory to practice with our live end-to-end system demonstration."*

---

# 📱 PART 3: THE LIVE SYSTEM DEMO WALKTHROUGH (11 MINUTES)

> **⚠️ Presenter Note:** Panatilihing kalmado ang boses. Habang may pinipindot ang kasama mo sa phone o laptop, sabayan mo agad ng paliwanag kung ano ang nangyayari behind the scenes.

---

### 🎬 SCENE 1: MEMBER ONBOARDING, PROFILE & WHO BMI ENGINE (2 Mins)

#### 🖥️ Action sa Screen:
1. Sa Mobile Device (o Browser Mobile View), ipakita ang **Member Login / Registration Screen**.
2. Mag-login gamit ang test Member Account (e.g., `member@affordagym.com`).
3. Mag-navigate sa **Profile Page** (`/profile`).
4. Ipakita ang Metrics: Height (170 cm) at Weight (88 kg).
5. I-tap ang **Calculate BMI** button.
6. Mag-navigate sa **Workout Page** (`/workout`) para ipakita ang na-generate na split.

#### 🗣️ SCRIPT (Verbatim Delivery):
> *"To begin our live demonstration, we are currently viewing the **FordaGO Member Mobile Application** running on Android.*
>
> *When a new member registers, our system collects only proportional, non-sensitive physical metrics: height, weight, and fitness experience. Let us navigate to the Profile screen.*
>
> *Notice that when we input a height of 170 centimeters and a weight of 88 kilograms, our algorithm executes the standardized World Health Organization (WHO) formula:*
> $$\text{BMI} = \frac{\text{Weight (kg)}}{[\text{Height (m)}]^2}$$
>
> *The system immediately calculates a **BMI of 30.45**, automatically classifying the user under the **Obese** category.*
>
> *Now, watch what happens when we switch to the Workout Module. Instead of giving a generic, dangerous routine with high-impact plyometrics or heavy spinal barbell squats, our **Deterministic Rule-Based Expert System** immediately constrains the routine to joint-safe, selectorized pin-loaded machines—such as the Seated Chest Press, Seated Cable Row, and Seated Leg Extension.*
>
> *This ensures zero axial spinal compression, protecting the novice user's lumbar vertebrae and knee joints from injury from Day 1 without requiring complex, slow machine learning training."*

---

### 🎬 SCENE 2: CONTACTLESS OPTICAL QR ATTENDANCE VIA WEBSOCKETS (2.5 Mins)

#### 🖥️ Action sa Screen:
1. Sa Mobile Phone ng Member: Buksan ang **Attendance Pass** (lalabas ang personal QR code).
2. Sa Laptop/Tablet ng Front-Desk: Buksan ang **Front-Desk Tablet Kiosk Scanner** (`/admin/attendance` o kiosk scanner).
3. I-tutok ang phone QR code sa camera ng tablet kiosk (o gamitin ang camera scanner).
4. **ANG WOW MOMENT:** Ipakita na sa screen ng tablet kiosk, biglang lumitaw nang kusa ang mukha, pangalan, at "CHECKED-IN" status ng member nang hindi nagre-refresh ang page!

#### 🗣️ SCRIPT (Verbatim Delivery):
> *"Next is our core operational innovation: **Contactless Gate Attendance with Instant WebSocket Synchronization**.*
>
> *Currently, on the left side of our screen, the member displays their dynamic Attendance QR Pass on their mobile phone.*
>
> *On the right side, the reception desk is running our **Front-Desk Tablet Kiosk**. Notice that there is no physical paper notebook.*
>
> *As the member walks in, they present their QR code to the tablet's optical camera... [SCAN THE QR CODE NOW].*
>
> *In less than 300 milliseconds, without refreshing the browser, the front-desk monitor instantly lights up via **Laravel Reverb WebSockets** over port 8080!*
>
> *The staff immediately sees the member's official profile photograph, registered full name, and active membership tier.*
>
> *Behind the scenes, the backend has executed three critical security checks:*
> 1. *It verified the cryptographic token.*
> 2. *It recorded an immutable timestamp in the `attendances` database table.*
> 3. *It enforced our **Anti-Passback Cooldown Rule**—if the member tries to pass their phone to a friend outside, duplicate check-ins within the cooldown window are instantly rejected by the server, completely eliminating buddy punching."*

---

### 🎬 SCENE 3: ON-DEMAND MACHINE QR TUTORIALS & PR TRACKER (1.5 Mins)

#### 🖥️ Action sa Screen:
1. Sa Mobile Phone ng Member: Pumunta sa **Equipment / QR Scanner Module**.
2. I-scan ang sample Equipment QR Code (e.g., Lat Pulldown Machine).
3. Ipakita ang nag-popup na Equipment Details: Pangalan ng Makina, Muscle Group, Animated Exercise Guide, at Step-by-Step Instructions.
4. I-tap ang **Personal Record (PR) Tracker** tab: Ipakita ang Bench Press / Deadlift milestone log.

#### 🗣️ SCRIPT (Verbatim Delivery):
> *"Once inside the facility, how does FordaGO address novice intimidation? Through our **On-Demand Machine QR Guidance System**.*
>
> *AFFORDA Gym's workout equipment is tagged with physical QR plates. When a beginner approaches a selectorized machine—for instance, the Lat Pulldown Machine—they simply tap the scanner on their mobile app... [SCAN EQUIPMENT QR].*
>
> *Immediately, the screen renders an on-demand tutorial containing:*
> * *The targeted anatomical muscle group (Latissimus Dorsi and Biceps).*
> * *Pin-adjustment instructions to ensure proper seat height.*
> * *An animated exercise demonstration showing correct biomechanical range of motion.*
>
> *Members can also record their lifts directly into the **Personal Record (PR) Tracker**, providing tangible motivation as they progressively overload their bench press, squat, and deadlift milestones over time."*

---

### 🎬 SCENE 4: COACH STUDIO & REAL-TIME TRAINEE COLLABORATION (1.5 Mins)

#### 🖥️ Action sa Screen:
1. Sa Browser o pangalawang window: Mag-login bilang **Coach Account** (`coach@affordagym.com`).
2. Buksan ang **Coach Studio Dashboard**.
3. Ipakita ang Trainee List: Piliin si Member.
4. Magpadala ng sample Chat Message: *"Don't forget to hydrate and hit your 4 sets of Seated Cable Rows today!"*
5. Ipakita sa Phone ng Member: Agad lumitaw ang chat message nang real-time via WebSocket!

#### 🗣️ SCRIPT (Verbatim Delivery):
> *"For members who require personalized coaching, FordaGO features a dedicated **Fitness Coach Studio**.*
>
> *Under our Role-Based Access Control, accredited fitness coaches can access their client roster, review individual workout compliance, and prescribe custom routine proposals that override baseline automated recommendations.*
>
> *Furthermore, as demonstrated on screen, our **1-on-1 Real-Time Chat Engine** allows coaches and trainees to communicate duplex messages without leaving the application. This closes the gap between professional guidance and member adherence."*

---

### 🎬 SCENE 5: FRONT-DESK POS SUPPLEMENT TRANSACTION & ATOMIC STOCK DEDUCT (1.5 Mins)

#### 🖥️ Action sa Screen:
1. Sa Front-Desk Staff account: Buksan ang **Point of Sale (POS) / Supplement Shop** (`/admin/inventory` o `/admin/pos`).
2. Ipakita ang listahan ng produkto (e.g., Whey Protein Shake, Pre-Workout Energy Drink).
3. Pansinin ang current stock: e.g., **Stock: 15 units**.
4. Mag-add ng **2 units** sa cart.
5. I-click ang **Counter Cash Checkout** (₱160 Total).
6. I-confirm ang transaction.
7. Ipakita na ang stock ay naging **13 units** na agad, at nag-generate ng printable digital receipt.

#### 🗣️ SCRIPT (Verbatim Delivery):
> *"Aside from attendance, front-desk staff frequently handle retail supplement and drink transactions. Let us demonstrate the **Point of Sale (POS) & Inventory Engine**.*
>
> *Here, the receptionist views our live supplement inventory. Notice that our Pre-Workout Energy Drink currently has exactly 15 units in stock.*
>
> *When a customer orders 2 bottles, the staff adds them to the cart and selects Over-the-Counter Cash payment.*
>
> *Watch closely as we click Confirm Checkout:*
> * *The transaction is committed inside an **Atomic Database Transaction (`DB::transaction`)** utilizing **Pessimistic Row-Level Locking (`lockForUpdate`)**.*
> * *This ensures that even if two customers buy the last item simultaneously, stock can never drop below zero, completely eliminating race conditions.*
> * *The stock count immediately decrements to 13, and a timestamped sales audit record is permanently stored in the `orders` table."*

---

### 🎬 SCENE 6: MEMBERSHIP RENEWAL, OVER-THE-COUNTER VERIFICATION & ADMIN AUDIT (2 Mins)

#### 🖥️ Action sa Screen:
1. Ipakita ang **Membership Management Screen** sa Admin Portal.
2. Ipakita ang isang Pending Member (₱500 Monthly Pass o ₱40 Daily Pass).
3. I-click ang **Verify & Activate** button matapos matanggap ang cash.
4. Mag-navigate sa **Analytics & Financial Reports** (`/admin/reports`).
5. I-click ang **Export Vector PDF** at **Export Excel** button.
6. Buksan saglit ang na-download na PDF para makita ng panel ang malinis na financial report.

#### 🗣️ SCRIPT (Verbatim Delivery):
> *"To conclude our live demo, we present **Membership Reconciliation and Executive Financial Analytics**.*
>
> *In rural Philippine community gyms, full online payment gateway APIs deduct steep merchant transaction fees that erode local revenues. FordaGO accommodates local reality through our **Desk-Assisted Verification Workflow**:*
> * *When a member avails of a ₱500 Monthly Pass or submits a simulated GCash payment reference, it enters a `Pending Verification` queue.*
> * *Once desk staff physically receive the payment at the counter, they tap **Verify & Activate**.*
> * *The backend immediately calculates a 30-day active validity window, updates the user's status to `Active Member`, and enables their gate pass.*
>
> *Finally, for the Gym Proprietor, our **Admin Command Center** synthesizes all operations into executive business intelligence.*
>
> *With a single click, as shown on screen, the owner can generate and download comprehensive **Vector PDF and Microsoft Excel Revenue Reports**—providing auditable breakdowns of daily entrance receipts, active member headcounts, and supplement sales margins.*
>
> *This replaces 2 to 3 hours of tedious month-end paper tallying with a 1-second automated audit."*

---

# 🧪 PART 4: RESEARCH METHODOLOGY & ISO/IEC 25010 RESULTS (2 MINUTES)

### 👤 Sino ang Magsasalita: **Quality Assurance / Research Specialist**
### 🖥️ Screen / Slide: **Statistical Summary & Evaluation Tables (Chapter 4)**

#### 🗣️ SCRIPT (Verbatim Delivery):
> *"Distinguished panel, to validate that FordaGO meets international software engineering benchmarks, we conducted a formal empirical evaluation using the **ISO/IEC 25010 Software Product Quality Model** across 8 standardized quality characteristics:*
>
> *We deployed **Purposive Sampling** across two distinct evaluation groups:*
> 1. ***IT Professionals and Senior Developers ($N = 5$):***  
>    *Evaluated our architectural structure, code maintainability, security, and database normalization. The IT expert evaluation yielded a composite grand mean of **4.82 out of 5.0**, interpreted as **'Excellent'**.*
> 2. ***Gym End-Users ($N = 33$, comprising 30 Gym Members and 3 Staff Members):***  
>    *Evaluated functional suitability, interface usability, and overall operational efficiency. The end-user evaluation yielded a composite grand mean of **4.87 out of 5.0**, interpreted as **'Highly Acceptable'**.*
>
> *These statistical metrics substantiate that the system successfully addresses the operational problems identified in Chapter 1 with exceptional usability and technical reliability."*

---

# 🏆 PART 5: FORMAL CONCLUSION & TRANSITION TO Q&A (1 MINUTE)

### 👤 Sino ang Magsasalita: **Project Leader / Lead Presenter**
### 🖥️ Screen / Slide: **Conclusion & Thank You Slide**

#### 🗣️ SCRIPT (Verbatim Delivery):
> *"In conclusion, distinguished members of the panel, **FordaGO** is more than just an academic software exercise. It is a production-ready, locally responsive gym management platform that proves cutting-edge web, mobile, and real-time cloud technologies can be pragmatically democratized to solve real-world problems in our local municipalities.*
>
> *It eliminates operational chaos, prevents inventory losses, and empowers everyday Filipino gym-goers with safe, dignified, and scientifically-tailored fitness guidance.*
>
> *Our live system is currently active and deployed on the cloud at **`https://app.affordagym.com`**.*
>
> *We now humbly submit our system and manuscript to the panel, and we are ready and eager to entertain your constructive questions, observations, and recommendations.*
>
> *Thank you very much, and good day!"*

---

## 🛡️ EMERGENCY PROCEDURES & TROUBLESHOOTING GUIDE (KAPAG MAY ABERYA)

| Scenario / Aberya | Anong Gagawin sa Hardware | Ano ang Sasabihin sa Panel (Script) |
| :--- | :--- | :--- |
| **Mabagal ang Wi-Fi o nag-timeout ang server** | Agad i-switch ang phone/laptop sa iyong **Mobile Hotspot**. | *"Pardon the brief network latency, esteemed panel. We are switching to our backup cellular gateway while our cloud VPS re-establishes the connection."* |
| **Ayaw mag-focus ng camera sa QR code dahil sa ilaw** | I-adjust ang angle ng phone o gamitin ang built-in **Fallback Demo Scan** button. | *"Due to the projector's ambient glare on the screen, allow us to utilize our verified software bypass scan to demonstrate the identical backend payload validation."* |
| **Nakakita ng maliit na UI bug ang panelist** | Huwag makipagtalo. Magpasalamat at isulat sa papel. | *"Thank you very much for pointing that out, Sir/Ma'am. That is an unhandled client-side edge case. We will patch that input validation immediately in our final revisions."* |
| **Nanghingi ang panel ng feature na wala sa scope (e.g., Face Recognition)** | Ipaalala ang Chapter 1 Scope at Delimitation nang magalang. | *"That is a very forward-looking recommendation, Sir. During our initial Chapter 1 scoping, we prioritized low-cost optical QR kiosks to fit the community gym's operational budget. We have noted facial recognition as a top recommendation for Version 2.0."* |

---
*Prepared and Compiled for the Capstone Research Proponents of FordaGO — CICT, NEUST San Isidro Campus.*
