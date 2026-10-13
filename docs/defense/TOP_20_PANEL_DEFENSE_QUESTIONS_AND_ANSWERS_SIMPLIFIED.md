# TOP 20 CAPSTONE DEFENSE QUESTIONS & ANSWERS (SIMPLIFIED & PRACTICAL EDITION)
## Madaling Intindihin, Walang Malalalim na Salita, at Diretso sa Punto
**System Title:** FordaGO: Mobile-Based Gym Database Management System  
**Client / Beneficiary:** AFFORDA Gym – Cabiao Branch (Cabiao, Nueva Ecija)  
**Target User:** Capstone Proponents (Para sa Madaling Pag-memorize at Komportableng Pagsagot)  
**Format:** Sa Madaling Salita + Eksaktong Sasabihin sa Panel + Keywords na Tatandaan  

---

## 💡 3 TIP BAGO MO BASAHIN ANG MGA SAGOT:
1. **Huwag subukang mag-English ng sobrang lalim.** Mas gusto ng panel ang estudyanteng naiintindihan ang gawa kaysa sa estudyanteng parang nagbabasa ng dictionary pero hindi maipaliwanag ang logic.
2. **Pwede ang Taglish.** Sa Philippine college defense, 100% accepted ang professional Taglish kung saan English ang technical terms (e.g., *database, QR code, WebSockets*) at Tagalog ang pagpapaliwanag.
3. **Tandaan lang ang "Keywords".** Huwag i-memorize word-for-word. Tandaan mo lang yung 2 hanggang 3 keywords sa bawat tanong, kaya mo na itong dugtungan gamit ang sarili mong boses.

---

# 🏛️ KATEGORYA 1: DAHILAN NG SYSTEM AT MGA GINAMIT NA REQUIREMENTS

---

### ❓ Question 1:
> **"Bakit pa kayo gumawa ng FordaGo kung marami nang sikat na fitness apps tulad ng MyFitnessPal o Mindbody? Ano ang pinagkaiba niyo?"**

* **🧠 Sa Madaling Salita:**  
  Ang *MyFitnessPal* ay pang-diet at calorie tracking lang sa phone ng tao—wala itong pakialam sa pinto ng gym o sa makina ng gym. Ang *Mindbody* naman ay pang-mayamang gym sa ibang bansa—libu-libo ang bayad kada buwan at kailangan ng international credit card. Ang *FordaGo* ay ginawa para sa Cabiao: may QR attendance sa pinto, naka-match sa totoong makina ng gym, at pwedeng magbayad ng cash (₱40/₱500) o GCash.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"Sir/Ma'am, apps like MyFitnessPal are only for personal calorie and workout logging—they don't connect to gym attendance or equipment. On the other hand, software like Mindbody is too expensive for local community gyms and requires credit cards.*  
  >  
  > *FordaGo is built specifically for AFFORDA Gym in Cabiao: it replaces the messy paper logbook with fast QR attendance, it gives workout guides using the gym's actual machines, and it supports local payments like cash and GCash."*

* **🔑 Keywords na Tatandaan:**  
  `MyFitnessPal = Personal tracker lang` | `Mindbody = Masyadong mahal` | `FordaGo = Swak sa Cabiao (QR + Makina + Cash/GCash)`

* **🚫 Wag na Wag Sasabihin:**  
  ❌ *"Wala pa po kasing app sa Cabiao kaya naisip namin 'to."* (Mababaw pakinggan).

---

### ❓ Question 2:
> **"Paano niyo nalaman ang kailangan ng gym? Anong patunay niyo na kailangan talaga nila itong system?"**

* **🧠 Sa Madaling Salita:**  
  Nag-interview kami kay Sir Norwin (may-ari ng gym) at sa staff sa counter. Nag-survey din kami sa 30 gym members. Nakita namin dalawa ang malaking problema: 1. Mahaba ang pila sa paper logbook kapag 4 PM hanggang 8 PM (umaabot ng 3-5 minutes bawat tao). 2. Halos 87% ng mga baguhan ay nahihiyang mag-workout dahil hindi nila alam kung paano gamitin ang mga makina.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"We conducted formal interviews with the gym owner, Sir Norwin, and the front-desk staff. We also surveyed 30 active members.*  
  >  
  > *We found two main problems: first, members line up for 3 to 5 minutes just to write on the paper logbook during peak hours. Second, 87% of beginners feel intimidated because they don't know how to use the gym machines. FordaGo directly solves both problems."*

* **🔑 Keywords na Tatandaan:**  
  `Interview kay Owner` | `Survey sa 30 members` | `3-5 mins na pila sa logbook` | `87% takot sa makina`

---

# 🧮 KATEGORYA 2: BMI AT WORKOUT RECOMMENDATIONS

---

### ❓ Question 3:
> **"AI o Machine Learning ba ang ginamit niyo sa pag-recommend ng workout o if-else lang? Bakit hindi kayo nag-AI?"**

* **🧠 Sa Madaling Salita:**  
  Rule-based po (if-else logic batay sa guidelines ng WHO), hindi AI. Bakit? Kasi delikado ang AI sa exercise—minsan nagkakamali o humuhula ang AI. Kung ang isang 100kg na baguhan ay utusan ng AI na mag-jumping squats, mababalian ng tuhod. Sa rule-based, 100% siguradong ligtas at nakaupong makina lang ang ibibigay sa matataba. Isa pa, ang AI kailangan ng libu-libong data bago matuto; ang rule-based, gumagana agad Day 1 pa lang.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"Our workout recommendation is rule-based following WHO guidelines, not Machine Learning or AI. We chose this intentionally for safety:*  
  >  
  > *An AI model can make mistakes and recommend heavy or dangerous exercises to an overweight beginner, which could cause injuries. With a rule-based system, we are 100% sure that an obese user will only receive joint-safe, seated machine exercises. It also works immediately from Day 1 without needing thousands of user records to train."*

* **🔑 Keywords na Tatandaan:**  
  `Rule-Based, hindi AI` | `Safety at Injury Prevention` | `Gumagana agad sa Day 1`

* **🚫 Wag na Wag Sasabihin:**  
  ❌ *"May AI po kami."* (Kapag sinabi mo ito, hahanapan ka ng Python machine learning code o tensor flow).

---

### ❓ Question 4:
> **"Ano ang formula ng BMI at ano ang pinagkaiba ng workout ng Obese sa Underweight?"**

* **🧠 Sa Madaling Salita:**  
  Formula: Timbang sa kilogram divided by Height sa meters squared ($\text{kg} / \text{m}^2$).  
  - **Underweight (< 18.5):** Pampalaki ng katawan at maraming rest days para hindi mangayayat lalo sa sobrang cardio.  
  - **Obese (≥ 30):** Bawal ang talon-talon at bawal ang mabigat sa likod. Puro nakaupong makina (Seated Chest Press, Seated Row) para hindi mapilipit ang tuhod at likod.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"We use the standard WHO formula: Weight in kilograms divided by Height in meters squared.*  
  >  
  > *For Underweight users, the routine focuses on muscle building with more rest days to conserve calories. For Obese users, we strictly avoid jumping or heavy spinal loads. We only prescribe seated, pin-loaded machines to protect their knees and spine from injury."*

* **🔑 Keywords na Tatandaan:**  
  `Formula: kg / m²` | `Underweight = More rest + Hypertrophy` | `Obese = Seated machines + Protect joints`

---

### ❓ Question 5:
> **"Paano kung bodybuilder na maskulado ang nag-register tapos Obese ang lumabas sa BMI kasi mabigat ang muscle niya?"**

* **🧠 Sa Madaling Salita:**  
  Alam po namin na may ganyang limitasyon ang BMI (hindi alam ng BMI kung taba o muscle ang bigat mo). Pero higit 90% ng naggi-gym sa Cabiao ay normal na tao at mga baguhan, hindi mga pro bodybuilder, kaya swak ang BMI sa kanila. At kung maskulado man siya, may Coach module kami kung saan pwedeng gawan ng Coach ng custom routine ang member para palitan ang automatic recommendation.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"That is a known limitation of BMI because it cannot separate muscle from fat. However, over 90% of members in AffordaGym are regular beginners, so BMI is very effective for them.*  
  >  
  > *For muscular athletes, our system has a Coaching Module where an accredited coach can create a custom workout plan that overrides the automatic recommendation."*

* **🔑 Keywords na Tatandaan:**  
  `90%+ ay beginners` | `May Coach Override sa Coaching Module`

---

# 🔒 KATEGORYA 3: SECURITY AT DATA PRIVACY

---

### ❓ Question 6:
> **"Paano kayo sumunod sa Data Privacy Act (RA 10173)?"**

* **🧠 Sa Madaling Salita:**  
  Tatlong bagay lang:  
  1. **Kakaunti lang ang kinukuhang data:** Pangalan, cellphone number, at height/weight lang. Walang ID card, walang credit card info.  
  2. **Naka-hash ang password:** Gumagamit kami ng bcrypt sa Laravel, kaya kahit buksan ang database, hindi mababasa ang password.  
  3. **Naka-HTTPS:** Lahat ng data sa internet ay naka-encrypt (SSL/TLS), kaya ligtas kahit mag-Wi-Fi sa gym.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"We comply with RA 10173 in three simple ways:*  
  > *1. Data Minimization: We only collect necessary info like name, phone number, and height/weight.*  
  > *2. Encrypted Passwords: Passwords are hashed using bcrypt, so no one, not even the admin, can read them in the database.*  
  > *3. Secure Transit: All connections use HTTPS and SSL encryption to protect user data from being intercepted."*

* **🔑 Keywords na Tatandaan:**  
  `Data Minimization` | `bcrypt password hash` | `HTTPS / SSL encryption`

---

### ❓ Question 7:
> **"Paano kung gamitan ng Postman o i-inspect element para gawing Admin ang sarili niya?"**

* **🧠 Sa Madaling Salita:**  
  Kahit palitan niya sa Postman ang role niya into `"admin"`, ibabagsak agad ito ng backend (`HTTP 403 Forbidden`). Ang backend ang may huling desisyon gamit ang Token at Middleware. Chine-check ng server sa database kung sino ka talaga bago ka papasukin sa admin page.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"The backend enforces strict server-side validation. Even if an attacker modifies the JSON payload using Postman or inspect element, our Laravel middleware verifies their token and checks their real role in the database.*  
  >  
  > *If they are not a legitimate admin, the server immediately blocks the request with an HTTP 403 Forbidden error."*

* **🔑 Keywords na Tatandaan:**  
  `Server-Side Validation` | `Sanctum Token & Middleware` | `HTTP 403 Forbidden`

---

### ❓ Question 8:
> **"Paano kung picturan o i-screenshot ng member ang QR niya tapos ibigay sa tropa para makapasok nang libre? (Buddy Punching)"**

* **🧠 Sa Madaling Salita:**  
  Pag-scan ng QR sa tablet sa pinto, lumalabas agad nang real-time sa screen ng cashier ang **picture at buong pangalan** ng member. Makikita agad ng staff kung lalaki o babae, o kung ibang tao ang may hawak ng phone. May cooldown din ang scan para hindi ma-scan nang dalawang beses nang sunod-sunod.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"When the QR code is scanned, the front-desk tablet instantly displays the member's photo and full name in real-time. The staff can immediately verify if the person matches the photo.*  
  >  
  > *Also, the system has an anti-passback cooldown that prevents the same QR from being scanned multiple times in a short period."*

* **🔑 Keywords na Tatandaan:**  
  `Lumalabas ang litrato at pangalan sa staff` | `Visual confirmation` | `Anti-passback cooldown`

---

### ❓ Question 9:
> **"Ligtas ba ang system niyo sa mga karaniwang cyber-attacks tulad ng SQL Injection at Brute Force?"**

* **🧠 Sa Madaling Salita:**  
  - **SQL Injection:** Ligtas, dahil ang Laravel ay gumagamit ng Eloquent ORM (parameterized queries). Hindi tumatakbo ang kahit anong injected SQL text.  
  - **XSS:** Ligtas, dahil nililinis ng Angular at backend ang mga input.  
  - **Brute Force (hulaan ng password):** May limitasyon na 6 na subok lang kada minuto (`throttle:6,1`). Pag sumobra, mala-lockout siya panandalian.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"Yes, Sir/Ma'am. For SQL Injection, Laravel uses parameterized queries through Eloquent ORM, making it impossible to inject raw SQL commands.*  
  >  
  > *For Brute-Force attacks, we implemented rate limiting that restricts users to 6 login attempts per minute before temporarily locking them out."*

* **🔑 Keywords na Tatandaan:**  
  `Eloquent ORM (No SQL Injection)` | `Rate Limiting (6 attempts per minute)`

---

# 💻 KATEGORYA 4: ARCHITECTURE AT DATABASE

---

### ❓ Question 10:
> **"Bakit Laravel sa backend at Ionic/Angular sa frontend? Bakit hindi Flutter?"**

* **🧠 Sa Madaling Salita:**  
  - **Ionic at Angular:** Isang code lang ang sinulat namin, pero nakagawa kami ng dalawa: isang Android APK para sa cellphone ng members, at isang Web Portal para sa laptop at tablet ng cashier. Sa Flutter, mas mahirap i-deploy sa web.  
  - **Laravel:** Kilalang matatag, kumpleto sa security, at may sarili nang WebSocket server (Laravel Reverb) para sa live attendance.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"We chose Angular and Ionic because a single TypeScript codebase allows us to build both the Android mobile app and the front-desk web portal without building two separate projects.*  
  >  
  > *We chose Laravel because it is mature, highly secure against common vulnerabilities, and has built-in WebSocket support through Laravel Reverb for real-time attendance."*

* **🔑 Keywords na Tatandaan:**  
  `Single Codebase (Mobile APK + Web Portal)` | `Laravel Security + Laravel Reverb`

---

### ❓ Question 11:
> **"Anong Normal Form ang database niyo at paano sinisiguro na walang sirang data?"**

* **🧠 Sa Madaling Salita:**  
  Naka-**Third Normal Form (3NF)** po. Ibig sabihin, walang paulit-ulit na data. May kanya-kanyang table ang bawat isa: `users`, `attendances`, `equipment`, at `payments`. Naka-konekta sila gamit ang Foreign Keys (tulad ng `user_id`), kaya kung may ma-delete na user, hindi magkakalat ang mga sirang records.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"Our database is normalized up to Third Normal Form (3NF). This means there are no repeating groups or duplicated fields.*  
  >  
  > *Entities like users, attendance, equipment, and payments have their own separate tables connected by Foreign Keys, ensuring strict referential integrity."*

* **🔑 Keywords na Tatandaan:**  
  `Third Normal Form (3NF)` | `Hiwa-hiwalay ang tables` | `Foreign Keys (user_id)`

---

### ❓ Question 12:
> **"Paano kung sabay na bumili ang dalawang tao sa counter ng huling energy drink? Hindi ba magiging negative ang stock?"**

* **🧠 Sa Madaling Salita:**  
  Hindi po magiging negative. Gumagamit kami ng Database Transaction at Row Locking (`lockForUpdate`). Kapag pinindot ang checkout, ila-lock ng database yung product ng ilang millisecond. Titignan kung may stock pa. Kung nabili na nung una, magpapakita ng error sa pangalawa na "Out of Stock".

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"We prevent negative stock by using database transactions with row-level locking.*  
  >  
  > *When an order is placed, the system locks that specific product row for a split second, verifies the remaining stock, and deducts it. If the item was already purchased by someone else, the second transaction is safely rejected."*

* **🔑 Keywords na Tatandaan:**  
  `Database Transaction` | `Row Locking (lockForUpdate)` | `Imposibleng maging negative`

---

# ⚡ KATEGORYA 5: REAL-TIME WEBSOCKETS AT OPERASYON

---

### ❓ Question 13:
> **"Ano ang Laravel Reverb at bakit WebSockets ang ginamit niyo sa halip na simpleng refresh o interval polling?"**

* **🧠 Sa Madaling Salita:**  
  Ang Reverb ay isang WebSocket server. Sa ordinaryong polling, paulit-ulit na nagtatanong ang browser sa server bawat 3 segundo: *"May pumasok ba? May pumasok ba?"*—nakakaubos ito ng bandwidth at nagpapabagal sa server. Sa WebSockets, laging bukas ang linya. Pag may nag-scan sa pinto, ibabato agad ng server sa screen sa loob ng 100 milliseconds.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"Laravel Reverb is a high-performance WebSocket server. With standard polling, the browser has to keep sending requests every few seconds, which wastes data and server memory.*  
  >  
  > *With WebSockets, the connection stays open. The instant a member scans their QR code, the server pushes the attendance event to the front-desk monitor in less than 100 milliseconds."*

* **🔑 Keywords na Tatandaan:**  
  `Laging bukas ang linya` | `Hindi kailangan mag-refresh` | `Bilis: sub-100ms`

---

### ❓ Question 14:
> **"Paano ang bayad? Bakit may simulated GCash checkout sa app pero may Cash verification pa sa counter?"**

* **🧠 Sa Madaling Salita:**  
  Kasi sa totoong buhay sa AffordaGym sa Cabiao, halos lahat ng tao nagbabayad ng cash sa counter (₱40 daily, ₱500 monthly). Ang mga totoong payment gateway tulad ng PayMongo ay nanghihingi ng DTI/SEC registration at kaltas na transaction fee na hindi afford ng mga estudyante. Kaya may simulated GCash sa app para makita ang workflow, pero ang staff pa rin ang pipindot ng "Verify" kapag nahawakan na ang cash.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"In AffordaGym, most members pay with cash at the reception counter. Real payment gateways like PayMongo require corporate business registrations and charge transaction fees.*  
  >  
  > *To keep the project realistic and within student research boundaries, we created a simulated GCash payment demo, but the counter staff performs the final cash verification before activating the membership."*

* **🔑 Keywords na Tatandaan:**  
  `Reality sa Cabiao: Cash at the counter` | `Walang corporate DTI/SEC papers` | `Staff verification for safety`

---

### ❓ Question 15:
> **"Anong nangyayari kapag nag-expire ang 30-day membership? Awtomatiko bang macha-charge ang card nila?"**

* **🧠 Sa Madaling Salita:**  
  Hindi po kami nagcha-charge ng card. Automatic lang na babalik ang status nila sa "Daily Pass" mode. May paalala rin sa app 3 araw at 1 araw bago mag-expire para malaman nilang kailangan na nilang magbayad ulit sa counter.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"We do not automatically charge cards. When the 30-day membership expires, the system automatically transitions their status back to 'Daily Walk-in' mode.*  
  >  
  > *The app also sends warning notices 3 days and 1 day before expiration so the member can renew at the front desk."*

* **🔑 Keywords na Tatandaan:**  
  `Babalik sa Daily Pass mode` | `Walang auto-charge` | `3-day at 1-day reminders`

---

# 🌐 KATEGORYA 6: OFFLINE SCENARIO AT CLOUD HOSTING

---

### ❓ Question 16:
> **"Paano kung mawalan ng internet o mag-brownout sa gym? Magagamit pa ba ang app?"**

* **🧠 Sa Madaling Salita:**  
  Oo, magagamit pa ng member ang app. Naka-save (cache) sa storage ng phone ang kanyang workout plan at ang kanyang QR pass code. Kahit walang signal sa loob ng gym, mabubuksan niya ang workout routine niya. Ang cashier naman sa counter ay pwedeng mag-connect sa mobile data hotspot para tuloy ang scanning.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"Yes, Sir/Ma'am. The mobile app saves the member's workout routine and QR code in local phone storage. Even without internet inside the gym, members can still open their app and follow their workout.*  
  >  
  > *For the front desk, the tablet can easily switch to a mobile phone hotspot to keep recording attendance."*

* **🔑 Keywords na Tatandaan:**  
  `Naka-save sa phone storage (Offline Cache)` | `Mababasa ang workouts kahit walang signal` | `Hotspot backup sa desk`

---

### ❓ Question 17:
> **"Saan naka-host ang system niyo ngayon at paano ang backup ng database?"**

* **🧠 Sa Madaling Salita:**  
  Naka-host po sa isang live Ubuntu Linux Cloud VPS gamit ang domain na `app.affordagym.com`. Gumagamit kami ng Docker containers para kung mag-restart man ang server, kusa itong babangon. Araw-araw ay may automatic script (cron job) na nagba-backup ng database (mysqldump).

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"Our system is deployed live on an Ubuntu Linux Cloud VPS under the domain `app.affordagym.com` using Docker containers with automatic restart policies.*  
  >  
  > *Database backups are automated through a daily cron job that generates timestamped SQL backups to ensure no data is lost."*

* **🔑 Keywords na Tatandaan:**  
  `Live sa Ubuntu Cloud VPS (app.affordagym.com)` | `Docker containers` | `Araw-araw na automatic backup`

---

# 🧪 KATEGORYA 7: RESEARCH METHODOLOGY AT EVALUATION

---

### ❓ Question 18:
> **"Paano niyo sinukat kung maganda ang system niyo? Ano ang naging resulta ng ISO 25010 survey?"**

* **🧠 Sa Madaling Salita:**  
  Gumamit kami ng **ISO/IEC 25010** software quality standards na may 8 criteria. Dalawa ang grupo ng sumagot:  
  1. **5 IT Experts:** Binigyan kami ng overall score na **4.82 out of 5.0 (Excellent)** para sa code at architecture.  
  2. **33 End-Users (30 members at 3 staff):** Binigyan kami ng overall score na **4.87 out of 5.0 (Highly Acceptable)** para sa dali ng paggamit.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"We evaluated our system using the international ISO 25010 software quality model across 8 characteristics.*  
  >  
  > *We had two respondent groups:*  
  > *First, 5 IT Experts evaluated our technical architecture and gave a composite mean score of 4.82, interpreted as Excellent.*  
  > *Second, 33 End-Users evaluated system usability and gave a composite mean score of 4.87, interpreted as Highly Acceptable."*

* **🔑 Keywords na Tatandaan:**  
  `ISO 25010 Model` | `IT Experts: 4.82 (Excellent)` | `End-Users: 4.87 (Highly Acceptable)`

---

### ❓ Question 19:
> **"Sino-sino ang sumagot sa survey at anong sampling method ang ginamit niyo?"**

* **🧠 Sa Madaling Salita:**  
  **Purposive Sampling** po. Ibig sabihin, pinili namin ang mga taong may kinalaman talaga: 5 IT professionals na marunong mag-code, at 30 totoong gym members at 3 staff ng AffordaGym. Bago ang survey, nag-testing muna kami (Unit testing, Integration testing, at UAT sa mismong gym).

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"We used Purposive Sampling because respondents needed direct experience: 5 IT professionals for the technical evaluation, and 33 actual gym members and staff for the end-user evaluation.*  
  >  
  > *Prior to evaluation, we also conducted unit testing, integration testing, and User Acceptance Testing directly on-site at the gym."*

* **🔑 Keywords na Tatandaan:**  
  `Purposive Sampling` | `5 IT Experts + 33 Gym Users` | `UAT sa mismong gym`

---

# 🔮 KATEGORYA 8: LIMITASYON AT KONTRIBUSYON

---

### ❓ Question 20:
> **"Ano ang pinakamalaking limitasyon ng FordaGo na hindi niyo nasama, at ano ang pinakamahalagang ambag niyo sa Cabiao?"**

* **🧠 Sa Madaling Salita:**  
  - **Limitasyon:** Wala kaming AI camera na nagbibilang ng reps o nagko-correct ng posture sa phone, kasi madaling uminit ang cellphone at mabilis maubos ang battery ng normal na Android phones. Nilagay namin ito sa rekomendasyon para sa Version 2.0.  
  - **Ambag:** Ginawa naming moderno ang isang maliit na gym sa probinsya—nawala ang magulong papel na logbook, naging 1 segundo na lang ang check-in, at natulungan ang mga baguhang taga-Cabiao na mag-gym nang ligtas at hindi nahihiya.

* **🗣️ Ang Sasabihin Mo sa Panel:**  
  > *"Our primary delimitation in Version 1.0 is the absence of live camera rep-counting, because running continuous AI computer vision overheats budget smartphones and drains the battery quickly. We documented this as a recommendation for Version 2.0.*  
  >  
  > *Our greatest contribution is modernizing a local community business in Cabiao: eliminating manual logbook congestion, providing fast and auditable QR attendance, and helping everyday gym beginners exercise safely without fear of injury."*

* **🔑 Keywords na Tatandaan:**  
  `Limitasyon: Walang Camera Rep Counter (mainit sa phone)` | `Ambag: Tinanggal ang logbook, modernong QR, ligtas na workout sa Cabiao`

---
*Prepared specifically for the BSIT Capstone Defense Proponents — CICT, NEUST San Isidro Campus.*
