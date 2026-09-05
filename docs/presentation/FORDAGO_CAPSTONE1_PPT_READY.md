# FordaGO Capstone 1 Defense - PowerPoint Presentation Content

**Copy-paste ready for your PowerPoint slides.**

**Total Duration:** 12-15 minutes presentation + 5-10 minutes Q&A  
**Slide Count:** 11 slides (streamlined)  
**Team:** 5 members (Carl, Delwin, Jaylee, Ethan, Ryza)  
**Status:** Capstone 1 Milestone - Working Prototype (50% of full system)  
**Demo Timing:** After Slide 7 (before Slide 8)

---

## Slide 1 - Title

Title:
FordaGO: Mobile-Based Gym Database Management System

Subtitle:
For AFFORDA Gym - San Isidro Branch
Capstone 1 Defense
June 11, 2026

Footer:
Group Members: Carl, Delwin, Jaylee, Ethan, Ryza

Speaker:
Carl (30-40 seconds)

Speaker Notes:
Good day, panel. We are Team FordaGO. Our project is a mobile-based gym database management system designed for AFFORDA Gym - San Isidro Branch. For Capstone 1, we focused on building and validating the core system modules.

---

## Slide 2 - Problem Background

Title:
Current Problem in AFFORDA Gym

Bullets:
- Attendance is recorded manually in logbooks
- Manual process causes delays and possible errors
- Hard to generate reports quickly
- No centralized, searchable records
- Equipment usage tracking is limited

Visual:
- Left: manual logbook process
- Right: target digital process

Speaker:
Jaylee (1 minute)

Speaker Notes:
The current setup is mostly manual. Staff writes attendance in logbooks, then records are compiled manually. This takes time and creates a risk of missing or unclear data. The gym also needs better visibility for attendance and equipment usage records.

---

## Slide 3 - Project Objectives

Title:
Project Objectives

Bullets:
- Build a mobile-based gym management system
- Make QR attendance the core check-in mechanism
- Centralize records in a relational database
- Provide admin-side monitoring and reports
- Improve convenience for members and staff

Speaker:
Delwin (1 minute)

Speaker Notes:
Our objective is not just digitization for display. We built a working flow from user action to stored record and report output. The core value is faster attendance logging and better data management.

---

## Slide 4 - Methodology Used

Title:
Methodology

Bullets:
- Developmental Research Design
- Agile SDLC (Iterative Development)
- Five phases:
  - Requirements Analysis
  - System Design
  - Development
  - Testing
  - Evaluation

Speaker:
Ryza (45 seconds)

Speaker Notes:
We used Developmental Research Design because we needed to design, develop, and evaluate a working system. Agile SDLC allowed us to build iteratively and test each feature as we completed it.

---

## Slide 5 - System Architecture

Title:
System Architecture

Content:
Mobile App (Ionic/Angular)
→ Backend Server (Node.js/Express)
→ MySQL Database

Key Points:
- Three-layer architecture for scalability
- API handles communication between layers
- Database stores all operational records
- Designed for security and maintainability

Speaker:
Ethan (45 seconds)

Speaker Notes:
Our system follows a standard three-tier architecture. The mobile app is the user interface, the backend server handles business logic and validation, and MySQL stores persistent data. This architecture ensures separation of concerns and makes the system secure and maintainable.

---

## Slide 6 - Core Database Design

Title:
Database Schema

Tables:
- users (member and admin accounts)
- attendance (check-in records)
- equipment (gym equipment registry)
- equipment_scan_logs (equipment usage tracking)
- sessions (workout classes and schedules)
- notifications (alerts and messages)

Key Features:
- Relational structure with foreign keys
- Timestamped audit trail for all records
- Optimized queries for reporting
- Support for class scheduling and member notifications

Speaker:
Ryza (1 minute)

Speaker Notes:
Our database is designed for traceability and efficiency. All records are timestamped and linked to users. The sessions table stores class schedules, allowing admins to create and manage workouts. All data is interrelated so admins can query any date range and see who attended, what equipment was used, and what classes were scheduled.

---

## Slide 7 - Core Features (All in One)

Title:
Core Features Implemented

**Feature 1: Smart QR Attendance** (Core)
- Premium members: Scan QR → instant check-in (auto-paid)
- Daily pass members: Scan QR → awaits admin payment confirmation
- Complete audit trail with timestamps
- Prevents duplicate check-ins per day

**Feature 2: Admin Dashboard & Reports**
- View today's attendance with status (confirmed/pending)
- Filter attendance by date with date picker
- View equipment scan records by date
- Export attendance reports to PDF
- Export equipment scan logs to PDF
- Staff time saved: 3+ hours/month

**Feature 3: Payment Management**
- Admin sees pending daily pass payments
- Confirm or reject payment with single click
- Tracks payment method (cash, card, etc.)
- Automatic notifications to members on confirmation

**Feature 4: Equipment Usage Tracking**
- Members scan equipment QR codes during workout
- System logs: who, what equipment, exact timestamp
- Admin views usage history by date
- Helps identify which equipment needs maintenance first

**Feature 5: Workout/Session Scheduling**
- Admin creates multiple workout classes (yoga, CrossFit, boxing)
- Members view available sessions with coach info and time
- Supports recurring schedules
- Notifies members of new class schedules

Speaker:
Jaylee + Delwin + Ethan (2-2.5 minutes combined)

Speaker Notes:
Jaylee (45 sec): The QR attendance is our core feature solving manual logbooks. Smart workflow: premium auto-confirms, daily needs admin payment check.
Delwin (1 min): Admin dashboard gives complete visibility. Pending payments show immediately. Reports save hours of manual work.
Ethan (30 sec): Equipment tracking + scheduling complete the ecosystem. Everything connects through our API for real-time data.

---

## Slide 8 - Live System Demo

Title:
Live Demo Now

What We're Showing (3-4 minutes):

Step 1: Admin Dashboard (45 seconds)
- Login: admin@afforda.com / password: admin123
- Show Attendance tab with today's records
- Show "Pending Daily Payments" section (awaiting admin confirmation)
- Point out automatic timestamp tracking

Step 2: QR Code Generation & Member Scan (1 minute)
- Show QR code generation in admin dashboard
- Switch to Member Account (member@afforda.com / password: member123)
- Show member scanning the QR code from screen
- Show attendance record appear immediately with timestamp

Step 3: Admin Payment Confirmation (45 seconds)
- Return to admin account, look at pending payments
- Show confirming a daily pass payment with single click
- Payment status updates from "Pending" to "Confirmed" instantly

Step 4: View Reports & Export (45 seconds)
- Select a date from calendar picker
- Show attendance list for that date
- Show equipment scan records for that date
- Click export to download PDF (show file generated)

Demo Accounts (HAVE THESE READY):
- Admin: admin@afforda.com / password: admin123
- Member Demo: member@afforda.com / password: member123
- Optional: Use QR Scanner demo mode if login fails (no internet needed)

Speaker:
Ethan (handles demo, 3-4 minutes)

Speaker Notes:
"Welcome to FordaGO in action. I'm logging in as admin first to show the operations dashboard. You'll see we have today's attendance records automatically logged. We also have pending payments from daily pass members. I'll now switch to a member account to show the QR attendance flow. [Switch account, scan QR from screen] As you see, the check-in is instant - the attendance appears immediately in the admin dashboard with a timestamp. Now I'll go back to admin and show how payment confirmation works [confirm a payment]. Finally, let me show the reporting capability [select date, show attendance and equipment logs, export PDF]. If there's any network issue, we have backup screenshots."

Backup Plan:
- If network fails: Use demo scan mode (simulates attendance without login)
- If login fails: Show pre-recorded screenshots of each step
- Have screenshots saved in phone/laptop
- Have PDF files ready to show as examples

---

## Slide 9 - Testing and Validation

Title:
Functional Testing Completed ✓

Workflows Tested:
- Premium member QR attendance (auto check-in)
- Daily pass member QR attendance (pending payment flow)
- Admin payment confirmation workflow
- Attendance duplicate prevention (same member, same day)
- Attendance report by date with PDF export
- Equipment scan logging with timestamps
- Equipment usage report by date with PDF export
- Session/schedule creation and viewing
- Member notifications on payment confirmation

Technical Validation:
- Database schema verified with real data
- API endpoints tested with success/error cases
- Data integrity: payments, timestamps, user linking confirmed
- Performance: Database queries optimized for daily report generation
- Security: JWT token validation, role-based access control tested

Evaluation Framework:
- ISO/IEC 25010 quality criteria
- Functionality: All features working ✓
- Usability: Clear workflows, few clicks to complete tasks ✓
- Reliability: No data loss, consistent behavior ✓
- Security: Authentication and authorization working ✓
- Performance: Reports generated in <2 seconds ✓

Speaker:
Ethan (1 minute)

Speaker Notes:
We completed comprehensive testing of all workflows. Every major path is validated: from premium member auto-check-in to daily pass payment confirmation to admin reporting. The system handles edge cases like duplicate check-ins. Database and API are reliable and secure.

---

## Slide 10 - Capstone 1 vs Capstone 2

Title:
Capstone 1 Milestone vs Capstone 2 Plan

Capstone 1 (Current - 50%):
✓ Problem analysis
✓ System design
✓ Core module development
✓ Feature validation
✓ Database migration
✓ Initial testing

Capstone 2 (Next Phase):
- Production deployment
- Environment hardening
- Full user testing
- Operational rollout
- Monitoring and support

Speaker:
Carl (1 minute)

Speaker Notes:
Capstone 1 focuses on building and validating the working prototype. Capstone 2 will handle deployment and operationalization. This separation aligns with curriculum expectations and industry best practices.

---

## Slide 11 - Conclusion

Title:
Conclusion

Key Achievements:
- Real problem identified and validated
- System architecture designed and implemented
- Core features developed and tested
- Database deployed and operational
- Ready for Capstone 2 deployment phase

Summary:
Capstone 1 = Build and Validate ✓
Capstone 2 = Deploy and Operationalize

Closing Statement:
Thank you for your time. We're ready for your questions and open to feedback.

Speaker:
Carl (45 seconds)

Speaker Notes:
Thank you, panel. This concludes our Capstone 1 defense presentation. We have successfully delivered a working prototype that addresses AFFORDA Gym's operational needs. We are prepared for your questions.

---

## Speaking Distribution (Balanced for 5 members)

- **Carl:** Slides 1, 10, 11 (Opening, Capstone scope, Closing) - 2 min total
- **Jaylee:** Slides 2, 7 (Problem, Core features part 1) - 2 min total
- **Delwin:** Slides 3, 7 (Objectives, Core features part 2) - 2 min total
- **Ethan:** Slides 5, 7, 8, 9 (Architecture, Core features part 3, Live Demo, Testing) - 4-5 min total
- **Ryza:** Slides 4, 6 (Methodology, Database Schema) - 1.5 min total

**Total Speaking Time:** 12-15 minutes (leaves 8-10 min for Q&A)

**Note:** Ethan has more speaking time due to Slide 7 feature explanation (Feature 3-5) + handling the live demo

---

## Optional Live Demo (If Time Permits)

Best insertion point: **SLIDE 8 - During Live System Demo**

Demo sequence (3-4 minutes):
1. Show admin QR generation (30 sec)
2. Show member QR scan demo (60 sec)
3. Show admin report viewing (60 sec)
4. Show downloaded PDF (30 sec)

Backup: Use screenshots if live demo has issues

---

## PowerPoint Design Checklist

- [ ] 16:9 widescreen format
- [ ] Clean, professional theme (blue/white recommended)
- [ ] Title font: 40pt+
- [ ] Body font: 28pt+
- [ ] 4-6 bullets per slide maximum
- [ ] One concept per slide
- [ ] Simple diagrams, minimal text
- [ ] Consistent color scheme
- [ ] No animations needed (keep it professional)

---

## DEMO PREPARATION CHECKLIST (IMPORTANT!)

**Before June 11:**
- [ ] Test admin login (admin@afforda.com / admin123)
- [ ] Test member login (member@afforda.com / member123)
- [ ] Test QR code generation on admin dashboard
- [ ] Test QR scanning from screen (member account)
- [ ] Verify attendance record appears immediately after scan
- [ ] Test payment confirmation workflow (admin clicks confirm/reject)
- [ ] Test date-based report viewing (select date, see results)
- [ ] Test PDF export for attendance report
- [ ] Test PDF export for equipment scan logs
- [ ] Confirm backend server is running and stable (localhost:3001)
- [ ] Confirm database has sample attendance data
- [ ] Confirm database has pending payments for demo (important!)
- [ ] Test equipment QR scan logging (optional)
- [ ] Have backup screenshots saved on phone/laptop

**Admin Account (USE THIS FOR DEMO):**
- Email: admin@afforda.com
- Password: admin123
- Functions: 
  - Generate QR code
  - View attendance with payment status
  - Confirm/reject pending payments
  - View and export reports (attendance + equipment)

**Member Account (USE THIS FOR DEMO):**
- Email: member@afforda.com
- Password: member123
- Functions: Scan QR, see own attendance

**CRITICAL: Create sample data before June 11:**
- Add 2-3 members with "daily pass" membership type
- Have them show as "pending payment" in admin dashboard
- This is needed to demo the payment confirmation workflow
- Without it, the workflow will be incomplete

**Alternative: Demo Mode**
- If login fails, use QR Scanner's demo scan mode
- No internet/authentication needed, simulates scan immediately
- Falls back to this if system is down

**Day of Defense (June 11):**
- [ ] Arrive 20 min early, test all systems on projector
- [ ] Have phone/laptop with latest code ready
- [ ] Test projector + HDMI connection (hdmi cable ready)
- [ ] Have printed backup screenshots visible to panel
- [ ] Backend server running on localhost:3001
- [ ] Database responding quickly
- [ ] Download a sample PDF beforehand to show file format

---

## Presentation Tips

✓ Speak clearly and at normal pace
✓ Make eye contact with panel
✓ Point at visuals when explaining
✓ One speaker at a time (no overlap)
✓ Smooth transitions between speakers
✓ Show confidence in what you've built
✓ Answer questions honestly
✓ Admit if you don't know something (better than guessing)
✓ During demo: narrate what you're doing ("I'm now logging in as admin...")
✓ If demo fails: immediately show backup screenshots and continue
