    # FordaGo — System Documentation

    **Project Title:** FordaGo: Mobile-Based Gym Database Management System  
    **Platform:** Mobile (Android/iOS) & Web Browser  
    **Date:** May 2026

    ---

    ## Table of Contents

    1. [System Overview](#1-system-overview)
    2. [Technology Stack](#2-technology-stack)
    3. [System Architecture](#3-system-architecture)
    4. [Database Design](#4-database-design)
    5. [Backend API Documentation](#5-backend-api-documentation)
    6. [Frontend Pages](#6-frontend-pages)
    7. [User Roles and Access Control](#7-user-roles-and-access-control)
    8. [Security Implementation](#8-security-implementation)
    9. [Known Limitations and Future Improvements](#9-known-limitations-and-future-improvements)

    ---

    ## 1. System Overview

    **FordaGo** is a gym management mobile application built using Ionic + Angular with Capacitor (frontend) and Laravel Framework with MySQL (backend). It is designed for AFFORDA Gym – San Isidro Branch to replace manual gym operations with a synchronized digital solution.

    **User Roles:**
    - **Member (User)** — login, biometric authentication, dashboard, QR scanning, schedule, inventory cart, profile, workout tracking
    - **Coach** — client consultations, workout proposal, schedule tracking, real-time messaging
    - **Admin / Super Admin** — member verification, attendance logs, equipment tracking, inventory control, PDF reporting, notifications, and security audit logs

    ---

    ## 2. Technology Stack

    ### Frontend & Mobile Client
    | Technology | Version | Purpose |
    |---|---|---|
    | Angular | ^20.3.0 | Core client Single Page Application framework |
    | Ionic Framework | ^8.0.0 | Mobile UI components and gestures |
    | Capacitor | ^8.3.0 | Android native runtime and hardware bridge |
    | TypeScript | ~5.9.0 | Strongly-typed programming language |
    | @aparajita/capacitor-biometric-auth | ^10.0.0 | Native fingerprint & biometric authentication |
    | html5-qrcode | ^2.3.8 | Real-time hardware camera QR code scanning |
    | jsPDF + jspdf-autotable | ^4.2.1 / ^5.0.7 | Client-side administrative PDF report generation |
    | Laravel Echo + Pusher-JS | ^2.4.0 / ^8.6.0 | Client WebSocket connection for real-time sync |

    ### Backend & Database Tier
    | Technology | Version | Purpose |
    |---|---|---|
    | Laravel Framework | ^12.0 / ^13.0 | Enterprise MVC RESTful JSON API server (PHP 8.3+) |
    | Laravel Sanctum | ^4.3 | Cryptographic Bearer Token authentication & RBAC |
    | Laravel Reverb | ^1.11 | High-throughput native WebSocket server |
    | MySQL / MariaDB | 8.0+ | Relational database management system |
    | Bcrypt Hashing | Cost 10 | Adaptive password cryptographic hashing |
    | SMS Gateway (SmsService) | Multi-carrier | Automated SMS via Semaphore / PhilSMS / Twilio |

    ---

    ## 3. System Architecture

    FordaGo uses a **decoupled three-tier and event-driven architecture**:

    ```
    ┌─────────────────────────────────────────────────┐
    │              PRESENTATION TIER                  │
    │   Ionic 8 / Angular 20 SPA (Android APK / Web)  │
    └───────────┬─────────────────────────┬───────────┘
                │ HTTPS REST API          │ WSS WebSockets
                │ Bearer Token            │ Laravel Echo
    ┌───────────▼─────────────────────────▼───────────┐
    │               LOGIC & API TIER                  │
    │        Laravel 12+ REST API & Reverb Server     │
    │   Sanctum Auth | Rate Limiter | Controllers     │
    └───────────────────┬─────────────────────────────┘
                        │ Eloquent ORM / PDO
    ┌───────────────────▼─────────────────────────────┐
    │               DATABASE TIER                     │
    │        MySQL 8.0+ Relational Database           │
    └─────────────────────────────────────────────────┘
    ┌────────────────────▼────────────────────────────┐
    │               DATA TIER                         │
    │         MySQL Database  (fordago)               │
    │              10 relational tables               │
    └─────────────────────────────────────────────────┘
    ```

    ---

    ## 4. Database Design

    Database name: **`fordago`**

    | Table | Description |
    |---|---|
    | `users` | Members and admins (username, email, password, role, membership) |
    | `workouts` | Workout entries created by users |
    | `schedule` | User workout bookings and status |
    | `sessions` | Gym class sessions created by admins |
    | `notifications` | In-app notifications (per user or broadcast) |
    | `attendance` | Gym check-in records with payment and confirmation status |
    | `products` | Gym merchandise available for order |
    | `orders` | Product orders placed by members |
    | `equipment` | Gym equipment catalog |
    | `equipment_scan_logs` | QR scan logs per user and equipment |

    ### Entity-Relationship Summary
    ```
    users ──< workouts ──< schedule
    users ──< attendance
    users ──< notifications
    users ──< orders >── products
    users ──< equipment_scan_logs >── equipment
    sessions (standalone)
    ```

    ---

    ## 5. Backend API Documentation

    **Base URL:** `http://localhost:3001/api`  
    **Auth Header:** `Authorization: Bearer <JWT_TOKEN>`

    ### Authentication
    | Method | Endpoint | Description | Auth |
    |---|---|---|---|
    | POST | `/api/auth/register` | Register new user | No |
    | POST | `/api/auth/login` | Login, returns JWT | No |

    ### User
    | Method | Endpoint | Description | Auth |
    |---|---|---|---|
    | GET | `/api/user/profile` | Get own profile | Yes |
    | PUT | `/api/user/profile` | Update profile | Yes |
    | GET | `/api/user/all` | All users | Admin |
    | PUT | `/api/user/:id/status` | Update member status | Admin |
    | DELETE | `/api/user/:id` | Delete user | Admin |

    ### Workouts
    | Method | Endpoint | Description | Auth |
    |---|---|---|---|
    | GET | `/api/workouts` | Get user workouts | Yes |
    | POST | `/api/workouts` | Add workout | Yes |
    | PUT | `/api/workouts/:id` | Update workout | Yes |
    | DELETE | `/api/workouts/:id` | Delete workout | Yes |

    ### Schedule
    | Method | Endpoint | Description | Auth |
    |---|---|---|---|
    | GET | `/api/schedule` | User's schedule | Yes |
    | POST | `/api/schedule` | Book a session | Yes |
    | PUT | `/api/schedule/:id` | Update schedule | Yes |
    | DELETE | `/api/schedule/:id` | Cancel schedule | Yes |
    | GET | `/api/schedule/sessions` | All available sessions | Yes |
    | POST | `/api/schedule/sessions` | Create session | Admin |

    ### Notifications
    | Method | Endpoint | Description | Auth |
    |---|---|---|---|
    | GET | `/api/notifications` | Get notifications | Yes |
    | POST | `/api/notifications` | Send notification | Admin |
    | PUT | `/api/notifications/:id/read` | Mark as read | Yes |
    | DELETE | `/api/notifications/:id` | Delete notification | Yes |

    ### Inventory
    | Method | Endpoint | Description | Auth |
    |---|---|---|---|
    | GET | `/api/inventory/products` | All products | Yes |
    | POST | `/api/inventory/products` | Add product | Admin |
    | PUT | `/api/inventory/products/:id` | Update product | Admin |
    | DELETE | `/api/inventory/products/:id` | Delete product | Admin |
    | POST | `/api/inventory/orders` | Place order | Yes |
    | GET | `/api/inventory/orders` | Get orders | Yes |
    | PUT | `/api/inventory/orders/:id` | Approve/reject order | Admin |

    ### Equipment
    | Method | Endpoint | Description | Auth |
    |---|---|---|---|
    | GET | `/api/equipment` | All equipment | Yes |
    | POST | `/api/equipment` | Add equipment | Admin |
    | PUT | `/api/equipment/:id` | Update equipment | Admin |
    | DELETE | `/api/equipment/:id` | Delete equipment | Admin |
    | POST | `/api/equipment/scan` | Log QR scan | Yes |
    | GET | `/api/equipment/scans` | Get scan logs | Yes |

    ### Attendance
    | Method | Endpoint | Description | Auth |
    |---|---|---|---|
    | GET | `/api/attendance` | User attendance | Yes |
    | POST | `/api/attendance` | Log check-in | Yes |
    | PUT | `/api/attendance/:id/confirm` | Confirm attendance | Admin |
    | GET | `/api/attendance/all` | All attendance records | Admin |

    ### Reports
    | Method | Endpoint | Description | Auth |
    |---|---|---|---|
    | GET | `/api/reports/membership` | Membership report | Admin |
    | GET | `/api/reports/attendance` | Attendance report | Admin |
    | GET | `/api/reports/revenue` | Revenue report | Admin |

    ---

    ## 6. Frontend Pages

    **Route Map:**
    ```
    /               → /login
    /login          → Login & Registration
    /dashboard      → Member Dashboard
    /admin          → Admin Panel          [Admin Only]
    /qr-scanner     → QR Equipment Scanner
    /schedule       → Schedule & Sessions
    /equipment      → Equipment Catalog
    /inventory      → Products & Orders
    /profile        → User Profile
    /transactions   → Order History
    /admin-reports  → Reports & PDF Export [Admin Only]
    ```

    ---

    ## 7. User Roles and Access Control

    | Feature | User | Admin |
    |---|---|---|
    | Login / Register | ✅ | ✅ |
    | Dashboard | ✅ | ✅ |
    | Scan Equipment QR | ✅ | ✅ |
    | View & Book Schedule | ✅ | ✅ |
    | Browse & Order Inventory | ✅ | ✅ |
    | View Profile & Transactions | ✅ | ✅ |
    | Manage Members | ❌ | ✅ |
    | Confirm Attendance | ❌ | ✅ |
    | Manage Products & Equipment | ❌ | ✅ |
    | Approve Orders | ❌ | ✅ |
    | Send Notifications | ❌ | ✅ |
    | Generate Reports (PDF) | ❌ | ✅ |

    ---

    ## 8. Security Implementation

    - **JWT Authentication** — All protected routes require a valid Bearer token signed with `JWT_SECRET`.
    - **Password Hashing** — bcryptjs hashes all passwords before storing; plain-text is never saved.
    - **Role-Based Access Control (RBAC)** — `adminGuard` on frontend routes; role check middleware on backend.
    - **SQL Injection Prevention** — Parameterized queries via `mysql2`.
    - **CORS** — Configured on the backend for cross-origin requests during development.

    ---

    ## 9. Known Limitations and Future Improvements

    ### Current Limitations
    - **Hardcoded API URL** — Frontend is hardcoded to `http://localhost:3001/api`. Physical devices or emulators need the server's LAN IP or `http://10.0.2.2:3001/api`.
    - **Image Storage** — Profile and product images are stored as Base64 in MySQL (`LONGTEXT`). Not ideal for production.
    - **No Email Verification** — Registration does not require email confirmation.

    ### Future Improvements
    - Dynamic API URL configuration for mobile builds
    - File storage service for images (e.g., Cloudinary)
    - Email verification and OTP-based password reset
    - Real-time notifications via WebSockets
    - GCash payment gateway integration
    - Android APK deployment via Capacitor

    ---

    *FordaGo Capstone Project — NEUST College of Information and Technology | ITIM-04*

