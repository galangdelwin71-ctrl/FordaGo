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

    **FordaGo** is a gym management mobile application built using Ionic + Angular (frontend) and Node.js/Express with MySQL (backend). It is designed for AFFORDA Gym – San Isidro Branch to replace manual gym operations with a digital solution.

    **User Roles:**
    - **Member (User)** — login, dashboard, QR scanning, schedule, inventory, profile, transactions
    - **Admin** — all user features plus member management, attendance, inventory control, reports, and notifications

    ---

    ## 2. Technology Stack

    ### Frontend
    | Technology | Version | Purpose |
    |---|---|---|
    | Angular | ^20.0.0 | Core frontend framework |
    | Ionic Framework | ^8.0.0 | Mobile UI components |
    | Capacitor | 8.3.0 | Android/iOS native bridge |
    | TypeScript | ~5.9.0 | Programming language |
    | html5-qrcode | ^2.3.8 | QR code scanning |
    | jsPDF + jspdf-autotable | ^4.2.1 / ^5.0.7 | PDF report generation |

    ### Backend
    | Technology | Version | Purpose |
    |---|---|---|
    | Node.js + Express | ^4.18.2 | REST API server |
    | MySQL2 | ^3.6.0 | Database driver |
    | JSON Web Token (JWT) | ^9.0.2 | Authentication |
    | bcryptjs | ^2.4.3 | Password hashing |

    ---

    ## 3. System Architecture

    FordaGo uses a **three-tier architecture**:

    ```
    ┌─────────────────────────────────────────────────┐
    │              PRESENTATION TIER                  │
    │   Ionic/Angular SPA (Mobile + Web Browser)      │
    └────────────────────┬────────────────────────────┘
                        │ HTTP/REST (JSON) + JWT
    ┌────────────────────▼────────────────────────────┐
    │               LOGIC TIER                        │
    │        Node.js + Express REST API               │
    │   Port: 3001  |  Base URL: /api                 │
    └─────────────────── 
                        │ mysql2
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

