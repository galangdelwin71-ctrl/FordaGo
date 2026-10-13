# FordaGo — Technology Stack & Architectural Specification

**Project Title:** FordaGo: Mobile-Based Gym Database Management System  
**Document Type:** Technical Architecture & Defense Specification  
**Version:** 3.0 (Defense Ready Edition)  

---

## 1. System Architecture Overview

FordaGo is an enterprise-grade mobile gym database management system engineered for **AffordaGym – San Isidro Branch**.

- **Frontend Client Tier:** Ionic 8 + Angular 20 + TypeScript + Capacitor 8
- **Backend API Tier:** Laravel 12+ (PHP 8.3+) + Laravel Sanctum Bearer Auth
- **Real-Time Tier:** Laravel Reverb WebSockets + Laravel Echo
- **Database Tier:** MySQL 8.0 RDBMS in 3rd Normal Form (3NF)

---

## 2. Top 20 Panelist Defense Questions & Answers (Tanong at Sagot)

### Tanong 1: Bakit Ionic + Angular + Capacitor ang pinili ninyo sa halip na Native Android (Java/Kotlin) o Flutter / React Native?

**Eksaktong Sagot:**  
> *"Dahil po sa Single Codebase. Isang code lang ang sinulat namin para sa frontend pero pwede nang gumana sa Android at iOS nang hindi dodoble ang trabaho at gastos sa maintenance. Gamit ang Capacitor 8, may direct access pa rin kami sa camera para sa QR scanner at fingerprint sensor tulad ng native app, habang ang Angular naman ang nagbibigay ng maayos at structured na code sa pamamagitan ng TypeScript."*

**Punto na dapat tandaan:** *Single Codebase Architecture, Native Hardware Bridge, at Zero Code Duplication.*

---

### Tanong 2: Ano ang Capacitor at ano ang pinagkaiba nito sa lumang Cordova?

**Eksaktong Sagot:**  
> *"Ang Capacitor ang tulay o bridge para magamit ng web code namin ang hardware ng phone tulad ng camera, fingerprint scanner, at haptics vibration. Mas bago at mas mabilis ito kaysa lumang Cordova dahil gumagamit ito ng modernong Promise-based APIs, mas magaan sa memory, at direktang binubuksan ang source code sa Android Studio nang walang magulong plugins."*

**Punto na dapat tandaan:** *Modern Hardware Bridge, Asynchronous Promises, at Native Studio Integration.*

---

### Tanong 3: Bakit Laravel 12 (PHP 8.3) ang backend ninyo at hindi Node.js o Python?

**Eksaktong Sagot:**  
> *"Dahil kumpleto na po ang built-in security at tools ng Laravel para sa transactional database tulad ng gym management. Mayroon na itong Laravel Sanctum para sa token login, Eloquent ORM na kusang pumipigil sa SQL Injection, at sariling WebSocket server (Laravel Reverb) kaya hindi na kailangang magbayad sa third-party services tulad ng Pusher."*

**Punto na dapat tandaan:** *Enterprise Batteries-Included, Built-in Sanctum Auth, Eloquent Security, at Native Reverb Sockets.*

---

### Tanong 4: Bakit Decoupled REST API ang ginawa ninyo at hindi simpleng Monolithic website (Laravel Blade)?

**Eksaktong Sagot:**  
> *"Dahil inihiwalay po namin ang mobile app sa server. Dahil REST API ito, magaang JSON data lang ang lumilipat sa network kaya napakabilis mag-load sa cellphone. Bukod dito, sa iisang API na ito ay pwedeng kumonekta ang Android app, admin web dashboard, at mga future hardware kiosks nang hindi binabago ang server code."*

**Punto na dapat tandaan:** *Separation of Concerns, Magaang JSON Payloads, at Multi-Platform Reusability.*

---

### Tanong 5: Paano tinitiyak na hindi masisira ang display ng app sa iba't ibang laki ng cellphone?

**Eksaktong Sagot:**  
> *"Gumamit po kami ng Ionic Responsive Grid System at SCSS Flexbox. Naka-set sa relative units tulad ng percentages at rem ang layout kaya kusa itong nag-a-adjust sa screen size. Mayroon din kaming Capacitor Keyboard plugin para kapag lumabas ang keypad, kusa itong umaatras at hindi natatakpan ang input fields."*

**Punto na dapat tandaan:** *Responsive Design Tokens, Relative Units, at Adaptive Keyboard Avoidance.*

---

### Tanong 6: Paano gumagana ang login at seguridad ng token (Laravel Sanctum)?

**Eksaktong Sagot:**  
> *"Kapag tama ang username at password o fingerprint ng user, bibigyan siya ng server ng Bearer Token. Itatago ito ng app sa encrypted storage ng phone (@capacitor/preferences). Sa bawat request ng user, ipinapadala ang token na ito sa header. Kung walang token o expired na, agad itong ibo-block ng server gamit ang 401 Unauthorized."*

**Punto na dapat tandaan:** *Stateless Bearer Tokens, SHA-256 Hashing sa Database, at auth:sanctum Middleware.*

---

### Tanong 7: Ligtas ba ang Biometric Login? Hindi ba nananakaw ang fingerprint ng member sa database?

**Eksaktong Sagot:**  
> *"Opo, 100% ligtas po dahil hindi kailanman ipinapadala o itinatago ang fingerprint sa aming database. Ang mismong operating system ng cellphone (BiometricPrompt ng Android) ang nagbeberipika ng daliri sa loob ng hardware secure enclave ng phone. Kapag sinabi ng phone na tama ang daliri, saka lang nagpapalitan ng login token ang app at ang server."*

**Punto na dapat tandaan:** *Hardware Secure Enclave, Android BiometricPrompt, at Zero Biometric Data Storage.*

---

### Tanong 8: Paano ninyo pinoprotektahan ang database laban sa SQL Injection attacks?

**Eksaktong Sagot:**  
> *"Gumagamit po kami ng 100% Parameter-Bound PDO Prepared Statements sa ilalim ng Eloquent ORM. Walang kahit anong raw SQL query na pinagdudugtong gamit ang string concatenation. Lahat ng input ng user ay awtomatikong itinuturing bilang data literal kaya imposible itong tumakbo bilang SQL command."*

**Punto na dapat tandaan:** *Parameter-Bound Queries, PDO Prepared Statements, at Eloquent ORM Abstraction.*

---

### Tanong 9: Paano ninyo pinipigilan ang XSS (Cross-Site Scripting) at Brute-Force attacks?

**Eksaktong Sagot:**  
> *"Sa XSS, awtomatikong nililinis ng Angular DomSanitizer ang inputs bago i-render sa screen, at may Form Request validation sa Laravel para i-strip ang scripts. Sa Brute-Force naman, may API Rate Limiting (throttle:api) kung saan kapag sunod-sunod na nagkamali ng login ang isang IP address, pansamantala itong ibo-block at magbabalik ng 429 Too Many Requests."*

**Punto na dapat tandaan:** *Angular DomSanitizer, Laravel Form Requests, at Route Throttling (throttle:api).*

---

### Tanong 10: Paano naipapatupad ang Role-Based Access Control (RBAC)? Pwede bang ma-hack ng member ang admin endpoints?

**Eksaktong Sagot:**  
> *"Hindi po, dahil sa Server-Side Middleware nakalagay ang security check, hindi lang sa pagtago ng buttons sa mobile. Bawat ruta ng admin ay may role middleware. Kahit subukan ng member na mag-send ng request gamit ang Postman papunta sa admin URL, iche-check ng server ang kanyang role sa token, at agad siyang ibo-block gamit ang 403 Forbidden."*

**Punto na dapat tandaan:** *Server-Side Middleware Enforcement, Token Payload Roles, at 403 Forbidden Response.*

---

### Tanong 11: Bakit Laravel Reverb WebSockets ang ginamit sa real-time features at hindi simpleng HTTP polling?

**Eksaktong Sagot:**  
> *"Dahil ang HTTP polling ay nagpapadala ng paulit-ulit na request bawat segundo kaya maaksaya sa data at malakas kumain ng battery ng phone. Sa WebSockets, isang bukas na koneksyon lang ang kailangan. Kapag may nag-check-in sa gym o may nag-chat na coach, agad itong lumalabas sa screen sa loob ng ilang milliseconds nang hindi nagre-refresh."*

**Punto na dapat tandaan:** *Full-Duplex Persistent TCP Sockets, Zero Battery Polling Drain, at Sub-second Latency.*

---

### Tanong 12: Paano tinitiyak na pribado ang chat sa pagitan ng coach at trainee sa WebSockets?

**Eksaktong Sagot:**  
> *"Naka-set po ito bilang Private Channel (private-chat.{id}). Bago makapasok ang user sa channel, hihingi muna ang WebSocket server ng pahintulot sa Laravel API gamit ang Bearer token. Tinitiyak ng server logic na ang naka-login na user ay siyang coach o trainee ng naturang conversation bago siya payagang makinig sa socket."*

**Punto na dapat tandaan:** *Private Channel Handshake, Broadcasting Authorization (/broadcasting/auth), at Sanctum Guard.*

---

### Tanong 13: Paano gumagana ang Camera QR Scanner at ano ang kaibahan ng Attendance QR sa Equipment QR?

**Eksaktong Sagot:**  
> *"Ginagamit ng app ang camera ng phone gamit ang html5-qrcode library. Ang Attendance QR sa entrance ay dynamic at nagpapalit araw-araw para hindi mapicturan o maipasa sa iba. Ang Equipment QR naman ay static tag na nakadikit sa bawat makina kung saan kapag ini-scan, agad na bubuksan ng app ang exercise video tutorial at tamang buhat para sa makina na iyon."*

**Punto na dapat tandaan:** *Dynamic Encrypted Session QR para sa Attendance vs. Static Asset Tag para sa Equipment Guides.*

---

### Tanong 14: Bakit sa mismong phone ginagawa ang PDF reports (jsPDF) at hindi sa backend server?

**Eksaktong Sagot:**  
> *"Para hindi bumigat ang server. Kapag sabay-sabay nag-download ng PDF reports ang mga admin, pwedeng mag-lag o mag-hang ang server CPU. Sa jsPDF, magaang JSON data lang ang kinukuha sa server, at ang mismong processor ng phone ang nagko-convert nito sa PDF file nang mabilis."*

**Punto na dapat tandaan:** *Client-Side Processing, Pag-iwas sa Server CPU Spikes, at Mabilisang Offline Export.*

---

### Tanong 15: Naka-Third Normal Form (3NF) ba ang database ninyo? Paano ninyo mapapatunayan?

**Eksaktong Sagot:**  
> *"Opo. Una, bawat column ay may iisang atomic value (1NF). Pangalawa, lahat ng table ay may sariling Primary Key na id (2NF). Pangatlo, inalis namin ang transitive dependencies (3NF)—halimbawa, ang coach details, workout proposals, at payments ay may sariling tables at konektado gamit ang Foreign Keys (FK), kaya walang redundant o paulit-ulit na data."*

**Punto na dapat tandaan:** *1NF Atomic Values, 2NF No Partial Dependency, at 3NF Removal of Transitive Dependency.*

---

### Tanong 16: Paano kung dalawang tao ang sabay na bumili ng huling supplement sa POS inventory?

**Eksaktong Sagot:**  
> *"Gumagamit po kami ng Database Transactions (DB::transaction) na may pessimistic row locking (lockForUpdate()). Pansamantalang ikino-lock ng database ang record ng produkto habang binabawasan ang stock. Ang unang makapindot ang makakabili, at ang pangalawa ay agad makakatanggap ng 'Out of Stock' error para hindi maging negative ang inventory."*

**Punto na dapat tandaan:** *ACID Transactions, lockForUpdate() Row Locking, at Race Condition Prevention.*

---

### Tanong 17: Bakit MySQL Relational Database ang pinili ninyo at hindi NoSQL tulad ng MongoDB?

**Eksaktong Sagot:**  
> *"Dahil ang mga transaksyon sa gym—tulad ng membership expiry, attendance logs, bayaran, at coach bookings—ay nangangailangan ng mahigpit na ugnayan at Foreign Key constraints. Mas garantisado sa MySQL ang ACID compliance (consistency ng pera at records) kaysa sa NoSQL na mas para sa unstructured data."*

**Punto na dapat tandaan:** *Relational Foreign Keys, Strict Referential Integrity, at ACID Transaction Compliance.*

---

### Tanong 18: Paano kung biglang mawalan ng internet habang nagwo-workout ang member?

**Eksaktong Sagot:**  
> *"May Offline Caching po ang app gamit ang @capacitor/preferences. Naka-save sa phone ang basic profile ng user at ang mga video/exercise guides ng equipment. Pwede pa rin niyang basahin ang mga workout instructions kahit walang signal. Magpapakita lang ang app ng offline badge at kusang magre-reconnect kapag bumalik ang internet."*

**Punto na dapat tandaan:** *Graceful Offline Degradation, Local Cache Storage, at Auto-reconnect Handling.*

---

### Tanong 19: Paano ide-deploy ang FordaGo sa tunay na operasyon (Production)?

**Eksaktong Sagot:**  
> *"Ilalagay po ang backend sa isang Linux Cloud VPS (Ubuntu) gamit ang Nginx web server na may libreng SSL/TLS encryption (HTTPS at WSS). Ang Supervisor daemon ang magpapanatiling laging bukas sa WebSocket server sa background. Ang mobile app naman ay ibi-build bilang signed production APK para mai-install sa Android phones ng mga miyembro."*

**Punto na dapat tandaan:** *Ubuntu Cloud VPS, Nginx Reverse Proxy with SSL, Supervisor Daemon, at Signed Production APK.*

---

### Tanong 20: Ano ang mga limitasyon ng inyong system ngayon at ano ang plano ninyo sa hinaharap (Future Works)?

**Eksaktong Sagot:**  
> *"Ang kasalukuyang saklaw ay para sa iisang branch pa lamang (AffordaGym – San Isidro), at ang bayaran ay cash at GCash manual reference confirmation. Sa future works, plano po naming magkabit ng IoT turnstile gates para kusang magbukas ang gate kapag nag-scan ng QR, at AI camera tracking na kusang magbibilang ng reps ng buhat gamit ang phone camera."*

**Punto na dapat tandaan:** *Single-Branch Scoping, IoT Turnstile Hardware Gate, at AI Computer Vision Rep Tracking.*

---

## 3. Strategic Business & Evaluation Questions

### Business Question 1: How do you save data and what do you plan to do with that?

**Sagot:**  
> *"Iniimbak po ang data sa relational MySQL tables (Users, Attendance, Equipment, Orders, Payments, Logs) na protektado ng Bcrypt hashing at Sanctum tokens. Ginagamit po namin ang data para sa: (1) Operational automation tulad ng real-time QR attendance at auto-expiry; (2) Business intelligence at downloadable audit PDF reports; at (3) Pagtatala ng workout streaks at personalized coaching routines para sa mga miyembro."*

---

### Business Question 2: Was this a unique project and what is the use case that you built on?

**Sagot:**  
> *"Opo, natatangi po ito dahil pinagsama namin sa iisang mobile app ang: (1) Dual QR scanning—entrance attendance at equipment exercise tutorials; (2) Native biometric fingerprint login; (3) Direct coach-trainee consultation at workout proposal generator; at (4) Point-of-Sale supplement ordering. Sinolusyunan nito ang manu-manong logbook at magulong papel sa AffordaGym."*

---

### Business Question 3: Did you think about the marketing side?

**Sagot:**  
> *"Opo, may built-in marketing tools ang FordaGo: (1) Admin broadcast announcements para sa mga promo at discounts; (2) Daily-to-Premium conversion funnel kung saan hinihikayat ang walk-ins na mag-monthly membership; (3) Member retention gamit ang workout streaks at badges; at (4) Peak hour analytics para makapagbigay ang gym ng happy-hour promos tuwing matumal ang oras."*

---

### Business Question 4: Does this all have basic features like push notifications and how do you manage it?

**Sagot:**  
> *"Opo, kumpleto po ito gamit ang Firebase Cloud Messaging (FCM) at Laravel Reverb WebSockets. May Admin Notification Hub kung saan pwedeng mag-broadcast sa lahat ng miyembro, magpadala ng private alert sa isang member (tulad ng payment approval o order pickup), at may automated notifications kapag malapit nang mag-expire ang membership o may bagong workout plan mula sa coach."*

---
