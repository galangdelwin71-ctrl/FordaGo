# FordaGO — Database Architecture, Table Directory & Defense Guide

**Database System:** MariaDB 10.11 / MySQL 8.0 Engine (InnoDB)  
**Host & Environment:** Linux Cloud VPS (`168.144.141.27:3306`)  
**Container / Web GUI:** Podman `fordago_adminer` (`http://168.144.141.27:8085`)  
**Total Tables:** 29 Tables  
**Normalization Level:** Third Normal Form (3NF)  

---

## Executive Summary

The FordaGO database is designed with an enterprise-grade, highly normalized relational structure (3NF). It is composed of **29 modular tables** separated into nine (9) functional domains. It strictly enforces **Referential Integrity** via Foreign Keys with `ON DELETE CASCADE` and `ON UPDATE RESTRICT` rules, preventing orphan records and ensuring high data consistency across all mobile and web transactions.

---

## Complete Table Directory by Functional Module

### 👤 Module 1: User Accounts & Authentication
| Table Name | Primary Key | Key Foreign Keys | Key Columns / Content | Description & Role |
| :--- | :--- | :--- | :--- | :--- |
| **`users`** | `id` | None | `name`, `email`, `password`, `role`, `membership_type`, `membership_expiry`, `fcm_token`, `avatar`, `created_at` | Core user identity table. Stores Members, Coaches, Employees, and Administrators. Holds FCM push tokens and membership status. |
| **`personal_access_tokens`** | `id` | `tokenable_id` | `tokenable_type`, `name`, `token`, `abilities`, `last_used_at` | Managed by **Laravel Sanctum**. Handles secure, stateless API token authentication for the Ionic mobile app and Angular web portal. |
| **`password_resets`** | `email` | None | `token`, `created_at` | Temporary holding table for password reset and OTP verification requests. |

---

### ⏱️ Module 2: Attendance & Gym Sessions
| Table Name | Primary Key | Key Foreign Keys | Key Columns / Content | Description & Role |
| :--- | :--- | :--- | :--- | :--- |
| **`attendance`** | `id` | `user_id` -> `users(id)` | `user_id`, `check_in`, `check_out`, `status`, `created_at` | Logs daily gym attendance generated via member QR code scanning at the gym entrance. |
| **`sessions`** | `id` | `user_id` -> `users(id)` | `title`, `description`, `duration`, `status` | General scheduled gym training sessions and classes available for members. |
| **`workout_sessions`** | `id` | `user_id`, `coach_id`, `proposal_id`, `booking_id` | `duration`, `status`, `notes` | High-granularity log of individual workout sessions completed by members, linked to coach proposals or bookings. |

---

### 🏋️ Module 3: Workouts, Workout Plans & Personal Records
| Table Name | Primary Key | Key Foreign Keys | Key Columns / Content | Description & Role |
| :--- | :--- | :--- | :--- | :--- |
| **`workouts`** | `id` | `user_id` -> `users(id)` | `name`, `description`, `date`, `created_at` | Daily custom workout logs recorded by members to monitor their training activity. |
| **`workout_plan_proposals`** | `id` | `coach_id`, `user_id` | `title`, `notes`, `status` (`pending`, `approved`, `rejected`) | Structured workout programs proposed by certified Coaches to specific members. |
| **`workout_plan_items`** | `id` | `proposal_id` -> `workout_plan_proposals(id)` | `exercise_name`, `sets`, `reps`, `target_weight`, `notes` | The specific exercises, repetition targets, and set counts inside a proposed workout plan. |
| **`personal_records`** | `id` | `user_id` -> `users(id)` | `exercise_name`, `weight`, `reps`, `date_achieved` | Member's peak lifting metrics (e.g., Bench Press 100kg, Deadlift 150kg) for visual progress analytics. |

---

### 📷 Module 4: Gym Equipment & QR Code Tracking
| Table Name | Primary Key | Key Foreign Keys | Key Columns / Content | Description & Role |
| :--- | :--- | :--- | :--- | :--- |
| **`equipment`** | `id` | None | `name`, `category`, `description`, `thumbnail_url`, `youtube_url`, `status` | Master catalog of all gym machines and free weights, complete with official video tutorial URLs, best practices, and safety precautions. |
| **`equipment_scan_logs`** | `id` | `user_id`, `equipment_id` | `scanned_at` | Audit trail recording every time a user scans a physical QR code on an equipment item using their smartphone camera. |

---

### 🤝 Module 5: Coach Programs & Bookings
| Table Name | Primary Key | Key Foreign Keys | Key Columns / Content | Description & Role |
| :--- | :--- | :--- | :--- | :--- |
| **`coach_profiles`** | `id` | `user_id` -> `users(id)` | `specialization`, `bio`, `rate`, `photo_url`, `contract_expiry`, `is_active` | Extended profile of gym trainers, storing certifications, specialties (e.g., bodybuilding, weight loss), and coaching rates. |
| **`coach_availability`** | `id` | `coach_id` -> `coach_profiles(id)` | `day_of_week`, `start_time`, `end_time` | Working hours and availability schedules of coaches for member booking. |
| **`coach_programs`** | `id` | `coach_id` -> `coach_profiles(id)` | `title`, `description`, `price`, `is_public` | Specialized fitness packages or group classes offered by coaches. |
| **`coach_program_items`** | `id` | `program_id` -> `coach_programs(id)` | `day_number`, `exercise_name`, `details` | Granular training schedule detailing each day's routine within a coach's training package. |
| **`program_bookings`** | `id` | `user_id`, `program_id`, `coach_id` | `status`, `payment_status`, `created_at` | Booking transactions when a member subscribes to a specific coach program. |

---

### 💬 Module 6: Real-Time Messaging & Notifications
| Table Name | Primary Key | Key Foreign Keys | Key Columns / Content | Description & Role |
| :--- | :--- | :--- | :--- | :--- |
| **`conversations`** | `id` | `user1_id`, `user2_id` | `status`, `last_message_at` | Direct messaging channel between two users (e.g., Member-to-Coach or Member-to-Staff). |
| **`messages`** | `id` | `conversation_id`, `sender_id` | `message`, `is_read`, `created_at` | Individual chat messages broadcasted via Laravel Reverb WebSockets. |
| **`notifications`** | `id` | `user_id` -> `users(id)` | `title`, `body`, `type`, `is_read`, `created_at` | In-app alerts informing users of booking approvals, payment updates, and membership renewals. |

---

### 🛒 Module 7: Gym Shop, POS & Inventory
| Table Name | Primary Key | Key Foreign Keys | Key Columns / Content | Description & Role |
| :--- | :--- | :--- | :--- | :--- |
| **`products`** | `id` | None | `name`, `price`, `stock`, `category`, `thumbnail_url`, `is_active` | Inventory catalog of gym merchandise, supplements, beverages, and fitness accessories. |
| **`orders`** | `id` | `user_id`, `product_id` | `quantity`, `total_amount`, `status`, `receipt_url`, `created_at` | Member purchase orders placed via the in-app shop, complete with cashier approval and receipt validation. |

---

### ⭐ Module 8: Member Feedback
| Table Name | Primary Key | Key Foreign Keys | Key Columns / Content | Description & Role |
| :--- | :--- | :--- | :--- | :--- |
| **`feedbacks`** | `id` | `user_id` -> `users(id)` | `rating`, `comment`, `category`, `created_at` | Customer satisfaction ratings and feedback regarding gym cleanliness, equipment condition, and trainer hospitality. |

---

### ⚙️ Module 9: Queue, Caching & Database Migrations (Engine)
| Table Name | Description & Role |
| :--- | :--- |
| **`jobs`** | Asynchronous queue table where heavy background tasks (PhilSMS sending, emails, broadcast events) are queued to keep the API ultra-fast. |
| **`job_batches`** | Tracks batch execution of queued jobs. |
| **`failed_jobs`** | Error tracking table storing failed background tasks with complete stack traces for diagnostic review. |
| **`cache` & `cache_locks`** | Key-value data cache table for lightning-fast repeated queries and atomic locking. |
| **`migrations`** | Internal version control log recording every applied database migration in chronological order. |

---

## 5 Reasons Why This Database Design Passes Defense with Distinction

1. **Strict Third Normal Form (3NF):**  
   Every non-key attribute is dependent on the primary key, the whole key, and nothing but the key. There are no redundant repeating groups or transitive dependencies.
2. **Referential Integrity Enforcement:**  
   Unlike typical student projects that rely purely on application code, FordaGO enforces relational rules directly on the database level using `FOREIGN KEY ... ON DELETE CASCADE`. If an entity is deleted, child records are cleaned automatically without creating orphan records.
3. **Optimized B-Tree Indexing:**  
   Foreign keys and frequently filtered columns (`user_id`, `coach_id`, `status`, `date`) have explicit indexes. Queries execute in $O(\log N)$ time rather than full table scans ($O(N)$).
4. **Comprehensive Audit Trails:**  
   All core tables include `created_at` and `updated_at` timestamps, adhering to ISO standards for system auditing and reporting.
5. **Modern Decoupled Schema:**  
   Coaching, attendance, equipment tutorials, and inventory POS operate as distinct modular subsystems connected via clean relational foreign keys.

---

## Defense Q&A Cheat Sheet (How to Answer Panelists)

### Q1: "Naka-normalize ba ang database ninyo? Paano niyo mapapatunayan na 3NF ito?"
> **Sagot:**  
> *"Opo, Sir/Ma'am. Ang aming database ay mahigpit na sumusunod sa **Third Normal Form (3NF)**:*  
> *1. **1NF:** Bawat column ay atomic at walang repeating arrays.*  
> *2. **2NF:** Lahat ng non-key attributes ay fully functionally dependent sa buong Primary Key.*  
> *3. **3NF:** Walang transitive dependencies—halimbawa, ang `coach_profiles` ay hiwalay sa `users` table upang hindi maghalo ang user credentials sa coaching rates at bio."*

### Q2: "Paano ninyo pinipigilan ang pagkakaroon ng orphan records?"
> **Sagot:**  
> *"In-enforce po namin ang **Referential Integrity gamit ang Foreign Keys na may `ON DELETE CASCADE` at `ON UPDATE RESTRICT`** sa mismong InnoDB engine. Kapag ang isang member account ay nabura, awtomatikong lilinisin ng database ang kanyang workouts at attendance upang mapanatiling malinis at tumpak ang storage."*

### Q3: "Bakit umabot sa 29 ang tables ng system ninyo?"
> **Sagot:**  
> *"Ang 29 tables po ay sumasalamin sa **9 na modular domains** ng aming full-stack gym system: Users & Authentication, QR-based Attendance, Workouts & PRs, Equipment Tutorials, Coaching & Bookings, Live Chat, Shop POS, Feedback, at Queue Infrastructure. Ang modularity na ito ang dahilan kung bakit scalable at madaling palawakin ang system nang hindi nasisira ang lumang data."*

---

## How to View and Manage the Database Live

* **Web Browser GUI (Adminer):** `http://168.144.141.27:8085`  
  - **Server:** `127.0.0.1`  
  - **Username:** `FordaGo`  
  - **Password:** *(see .env file)*  
  - **Database:** `fordago`  
* **Terminal CLI:** Access via SSH to the VPS server.
