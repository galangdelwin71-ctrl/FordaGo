# FordaGo — Capstone Defense Reviewer: Technology Stack Q&A

Bilang inyong **Lead Technical Panelist**, narito ang **Top 10 Pinakamalulupit at Pinakamalamang na Itanong ng Panel** tungkol sa inyong **Technology Stack (Frontend, Backend, Database, Real-Time, at Deployment)**, kasama ang **"Kill Shot" Answers (Ang Perfect na Sagot)** para mapabilib ang panel.

---

### 1. FRONTEND: Ionic 8 + Angular 20

#### 🎤 Tanong ng Panel:
> *"Bakit **Ionic Angular** ang ginamit ninyo imbes na **Flutter** o **React Native** na mas sikat ngayon?"*

* **💡 Bakit ito tinatanong:** Gusto nilang malaman kung pinag-isipan ninyo ang architecture o nakiuso lang kayo.
* **🎯 Perfect na Sagot:**
  > *"Pinili po namin ang **Ionic Angular** dahil sa **True Cross-Platform Reusability (Write Once, Run Anywhere)**. Gamit ang iisang web codebase (HTML5, SCSS, TypeScript), nagagawa naming mag-output ng:
  > 1. Isang installable **Android APK** gamit ang Capacitor runtime, at
  > 2. Isang responsive **Web PWA** para sa administrative desktop monitor ng gym owner sa counter.
  > Kung Flutter po ang ginamit namin, magsusulat kami sa Dart language at mas matagal i-integrate sa browser-based camera libraries para sa admin kiosk. Bukod dito, ang **Angular 20 Standalone Components** ay nagbibigay ng matibay na Type-Safety, modularity, at mabilis na change detection na kritikal para sa real-time gym dashboards."*

---

#### 🎤 Tanong ng Panel:
> *"Paano nag-i-scan ang camera ng QR Code sa app? Native camera plugin ba o web library?"*

* **💡 Bakit ito tinatanong:** Tinitingnan kung alam ninyo ang exact library na nagpapagana sa attendance kiosk.
* **🎯 Perfect na Sagot:**
  > *"Gumamit po kami ng **`html5-qrcode` library** na direktang nakikipag-ugnayan sa **HTML5 MediaDevices Web Camera API**. Kinukuha nito ang live optical video stream mula sa camera ng device, kino-convert ang bawat frame sa canvas memory, at dine-decode ang 2D barcode pattern. Dahil web standard ito, gumagana ito nang pantay sa mobile browser, Android WebView, at desktop webcam nang hindi nangangailangan ng mabibigat na propriet
<truncated 5457 bytes>
lithic background daemon na tumatakbo bilang `root`, kaya kung ma-compromise ang isang container, maaaring mapasok ang buong host OS.
  > 2. Ang Podman naman po ay tumatakbo bilang regular non-root user. Kung magkaroon man ng container escape, limitado lamang ang attacker sa privileges ng unprivileged user, na lubos na nagpapataas ng server security alinsunod sa Data Privacy Act (RA 10173)."*

---

### 7. FAULT TOLERANCE: Offline & Edge Cases

#### 🎤 Tanong ng Panel:
> *"Paano kung biglang mawalan ng internet sa gym habang maraming nag-i-scan ng QR attendance sa entrance?"*

* **💡 Bakit ito tinatanong:** Real-world reliability test ng domain evaluator.
* **🎯 Perfect na Sagot:**
  > *"Ang admin kiosk po sa entrance ay may **local caching capability**. Kapag pansamantalang nawalan ng network connectivity, ang scanned payloads at local device timestamps ay pansamantalang itinatabi sa client browser memory/IndexedDB. Pagbalik ng internet connection, awtomatikong magti-trigger ang background sync service para ipadala ang queued check-in records sa server nang walang nawawalang logs."*

---

### 🏆 3 Golden Rules Kapag Sumasagot sa Panel:

1. **Rule of Directness:** Huwag magpaligoy-ligoy. Simulan agad sa technical keyword:
   * *Mali:* "Kasi po naisip namin na parang mas madali po kasi siya..."
   * *Tama:* "Pinili po namin ang **Laravel 13** dahil sa built-in **Eloquent ORM** na nagbibigay ng **PDO parameter binding** para sa SQL injection prevention..."
2. **Refer to the Manuscript:** Kapag tinanong kayo sa DB, sabihin:
   * *"Gaya po ng makikita sa **Figure 9 (ERD)** at **Table 11 (3NF Schema)** sa aming Chapter 4..."* (Napakalaking puntos nito dahil patunay na kayo mismo ang sumulat ng dokumento).
3. **Never Say 'Hindi po namin alam':**
   * Kung may itanong na advance feature na wala pa sa system:
   * *"Sa kasalukuyang scope po ng FordaGO, naka-focus kami sa core operations ng gym, ngunit isa po iyan sa magagandang rekomendasyon na maaari naming isama sa susunod na phase ng aming system development."*