# FordaGO Capstone 1 Defense - Practical Guide
## 5-Member Team Presentation  
**Defense Date:** June 11, 2026  
**Duration:** ~20-25 minutes presentation + 5-10 minutes Q&A  
**Team Members:** 5 (BERNALDO, GALANG, JAVIER, MEDINA, PONGCO)

---

## QUICK START CHECKLIST

```
📋 BEFORE DEFENSE DAY:
☐ All 5 team members practice speaking parts
☐ Practice transitions between speakers (smooth handoff)
☐ Test PowerPoint on actual projector
☐ Test live demo on laptop (database running, frontend working)
☐ Print backup screenshots if demo fails
☐ Create 1 practice run-through (full rehearsal)
☐ Prepare backup: USB with presentation, system backup, screenshots

🎯 MORNING OF DEFENSE (June 11):
☐ Arrive 20 minutes early
☐ Set up laptop, test projector connection
☐ Open PowerPoint, have demo app ready
☐ Have printed QR code visible on screen or printed
☐ Do final audio check (microphone if available)
☐ Deep breath - you built this, you got this! 💪
```

---

## PART 1: POWERPOINT SLIDE STRUCTURE

### Total Slides: 12-15 slides (rough estimate)
**Timing:** 2-3 minutes per main section

### Slide Layout

**SLIDE 1: Title Slide**
```
┌─────────────────────────────────────┐
│                                     │
│   FordaGO: Mobile-Based Gym        │
│   Database Management System        │
│                                     │
│   For AFFORDA Gym                  │
│   San Isidro Branch                │
│                                     │
│   Team Members:                     │
│   BERNALDO, CARL ANDREW B.         │
│   GALANG, DELWIN F.                │
│   JAVIER, JAYLEE T.                │
│   MEDINA, ETHAN JEROME G.          │
│   PONGCO, RYZA MAE M.              │
│                                     │
│   June 11, 2026                    │
│   Capstone 1 Project Defense       │
│                                     │
└─────────────────────────────────────┘

SPEAKER: CARL (Team Lead) - 30 seconds
```

---

**SLIDE 2: The Problem**
```
┌─────────────────────────────────────┐
│                                     │
│   Current Problem at AFFORDA Gym   │
│                                     │
│   ✗ Manual logbooks for attendance │
│   ✗ Illegible handwriting           │
│   ✗ Time-consuming data entry      │
│   ✗ No audit trail                  │
│   ✗ Equipment usage not tracked    │
│   ✗ Reports take hours to compile  │
│                                     │
│   [Show image of manual logbook]   │
│                                     │
└─────────────────────────────────────┘

SPEAKER: JAYLEE - 1 minute
TALKING POINTS:
- "Every day, gym staff manually writes member names in a logbook"
- "Takes hours to compile reports at month end"
- "Can't quickly answer 'was member X here on date Y?'"
- "If equipment breaks, no record of who used it when"
```

---

**SLIDE 3: The Solution - Overview**
```
┌─────────────────────────────────────┐
│                                     │
│   FordaGO Solution                 │
│                                     │
│   QR-Based Attendance System       │
│   Mobile App for Members           │
│   Admin Dashboard for Staff        │
│   Instant PDF Reports              │
│   Equipment Tracking               │
│                                     │
│   One scan = Complete Record       │
│   (WHO, WHAT, WHEN, WHERE)        │
│                                     │
│   [Show FordaGO logo/mockup]       │
│                                     │
└─────────────────────────────────────┘

SPEAKER: DELWIN - 1 minute
TALKING POINTS:
- "Instead of manual writing, members scan a QR code with their phone"
- "One scan takes 2 seconds"
- "Automatically records: member name, time, equipment (if scanned)"
- "No more manual data entry"
- "Admin can generate reports instantly"
```

---

**SLIDE 4: System Architecture (High Level)**
```
┌─────────────────────────────────────┐
│                                     │
│   How It All Works Together        │
│                                     │
│   Mobile App (Ionic/Angular)       │
│         ↓                           │
│   Backend Server (Node.js/Express) │
│         ↓                           │
│   Database (MySQL)                 │
│         ↓                           │
│   Admin Reports & PDFs             │
│                                     │
│   [Show simple flow diagram]       │
│                                     │
└─────────────────────────────────────┘

SPEAKER: ETHAN - 1.5 minutes
TALKING POINTS:
- "Members scan with the mobile app on their phone"
- "App sends the scan to our server (Node.js backend)"
- "Server saves it to the database with exact timestamp"
- "Admin can query the database anytime to see reports"
- "All data is protected - passwords hashed, user validated"
```

---

**SLIDE 5: Tech Stack**
```
┌─────────────────────────────────────┐
│                                     │
│   Technology Stack                 │
│                                     │
│   Frontend:                         │
│   • Ionic Framework v8 (mobile)    │
│   • Angular v20 (app logic)        │
│   • TypeScript 5.9 (type safety)   │
│                                     │
│   Backend:                          │
│   • Node.js + Express.js           │
│   • JWT Authentication             │
│   • RESTful APIs                   │
│                                     │
│   Database:                         │
│   • MySQL                           │
│   • Relational design               │
│   • 8 core tables                   │
│                                     │
│   Libraries:                        │
│   • qrcode (generate QR)           │
│   • html5-qrcode (scan QR)         │
│   • jsPDF (create PDFs)            │
│                                     │
└─────────────────────────────────────┘

SPEAKER: RYZA - 1 minute
(Note: This is technical, keep it brief - don't explain each tool)
```

---

**SLIDE 6: Feature 1 - QR Generation**
```
┌─────────────────────────────────────┐
│                                     │
│   Feature 1: Admin QR Generation   │
│                                     │
│   Step 1: Admin clicks "Generate"  │
│   Step 2: System creates QR code   │
│   Step 3: QR downloaded to print   │
│   Step 4: Posted at gym entrance   │
│                                     │
│   Result: Static gym QR code       │
│   All members scan same code       │
│   Backend identifies who scanned   │
│                                     │
│   [Show QR code image]             │
│                                     │
└─────────────────────────────────────┘

SPEAKER: CARL - 1 minute
TALKING POINTS:
- "Admin generates one QR code for the gym"
- "Same QR is scanned by all members"
- "System knows who scanned because they're logged in"
- "Much simpler than generating unique QR per member"
```

---

**SLIDE 7: Feature 2 - Member Scanner**
```
┌─────────────────────────────────────┐
│                                     │
│   Feature 2: Member QR Scanner     │
│                                     │
│   Member Experience:               │
│   1. Open FordaGO app              │
│   2. Go to Scanner tab             │
│   3. Point camera at QR            │
│   4. System recognizes QR          │
│   5. "Check-in successful!" ✓     │
│                                     │
│   Behind scenes:                   │
│   • Live camera access             │
│   • Instant backend sync           │
│   • Timestamped record created     │
│                                     │
│   [Show phone screenshot]          │
│                                     │
└─────────────────────────────────────┘

SPEAKER: JAYLEE - 1 minute
TALKING POINTS:
- "Member opens app → goes to scanner"
- "System asks for camera permission (first time only)"
- "Member points phone at the printed QR code"
- "Takes about 2 seconds to recognize"
- "Boom - checked in! Timestamped in database"
```

---

**SLIDE 8: Feature 3 - Equipment Tracking**
```
┌─────────────────────────────────────┐
│                                     │
│   Feature 3: Equipment Usage Log   │
│                                     │
│   Members also scan equipment QRs: │
│   • Treadmill                      │
│   • Free weights                   │
│   • Bench press                    │
│   • Etc.                           │
│                                     │
│   System logs:                      │
│   WHO used equipment               │
│   WHICH equipment                  │
│   EXACTLY WHEN (timestamp)         │
│                                     │
│   Admin benefit:                    │
│   "Which equipment breaks often?"  │
│   "Proof member used X equipment"  │
│                                     │
└─────────────────────────────────────┘

SPEAKER: DELWIN - 1 minute
TALKING POINTS:
- "Members can also scan equipment QR codes"
- "This tells us who used what equipment and when"
- "Admin can see: 'Treadmill #3 used 150 times this month'"
- "Helps with maintenance scheduling"
- "Proof of usage if member gets injured"
```

---

**SLIDE 9: Feature 4 - Admin Reports**
```
┌─────────────────────────────────────┐
│                                     │
│   Feature 4: Instant Reports       │
│                                     │
│   Admin Dashboard:                 │
│   1. Select date                   │
│   2. Click "Generate Report"       │
│   3. See attendance table          │
│   4. Download as PDF               │
│                                     │
│   Report includes:                 │
│   • Member Name                    │
│   • Check-in Time                  │
│   • Status (Present/Late/Absent)   │
│   • Payment Status                 │
│   • Equipment Used (if any)        │
│                                     │
│   What took 3 hours → Now 10 secs │
│                                     │
│   [Show sample PDF screenshot]     │
│                                     │
└─────────────────────────────────────┘

SPEAKER: ETHAN - 1 minute
TALKING POINTS:
- "Admin logs in, selects a date, clicks Download"
- "PDF shows all members who came that day"
- "Shows exact check-in times"
- "Can print for gym records or accounting"
- "Before: Staff manually copied logbook to Excel for 3 hours"
- "Now: Click download, done in 10 seconds"
```

---

**SLIDE 10: Database Design**
```
┌─────────────────────────────────────┐
│                                     │
│   Database Tables                  │
│                                     │
│   users ─────┐                     │
│              ├─→ attendance        │
│              ├─→ equipment_scans   │
│              └─→ notifications     │
│                                    │
│   equipment ────→ equipment_scans  │
│                                    │
│   Key Features:                    │
│   • Foreign keys (data integrity)  │
│   • Timestamps (audit trail)       │
│   • Normalized design              │
│   • No data duplication            │
│                                     │
│   [Show ERD diagram - entity boxes] │
│                                     │
└─────────────────────────────────────┘

SPEAKER: RYZA - 1 minute
(Technical but brief - don't deep-dive)
```

---

**SLIDE 11: Security & Protection**
```
┌─────────────────────────────────────┐
│                                     │
│   How We Protect Data              │
│                                     │
│   Passwords:                        │
│   • Hashed with bcryptjs           │
│   • Even admin can't see plaintext │
│                                     │
│   Login:                            │
│   • JWT tokens (signed, expire)    │
│   • Can't forge without secret key │
│                                     │
│   Database:                         │
│   • Only backend can access        │
│   • All queries validated          │
│                                     │
│   Scans:                            │
│   • Must be logged-in member       │
│   • Duplicate scans prevented      │
│   • Server timestamp (no cheating) │
│                                     │
└─────────────────────────────────────┘

SPEAKER: CARL - 1 minute
```

---

**SLIDE 12: Why This Matters (Significance)**
```
┌─────────────────────────────────────┐
│                                     │
│   Why FordaGO Matters              │
│                                     │
│   For AFFORDA Gym:                 │
│   ✓ Saves 3 hours/month data entry│
│   ✓ Eliminates manual logbooks     │
│   ✓ Instant searchable records     │
│   ✓ Equipment audit trail          │
│                                     │
│   For Members:                      │
│   ✓ Easy check-in (2 seconds)      │
│   ✓ Mobile convenience             │
│   ✓ Equipment guidance access      │
│                                     │
│   For Researchers:                 │
│   ✓ Template for similar gyms      │
│   ✓ QR approach is scalable        │
│                                     │
└─────────────────────────────────────┘

SPEAKER: JAYLEE - 1 minute
```

---

**SLIDE 13: Challenges We Overcame**
```
┌─────────────────────────────────────┐
│                                     │
│   Technical Challenges             │
│                                     │
│   Challenge 1: QR Payload Design   │
│   • Solved: Static payload works   │
│   • Backend handles user ID        │
│                                     │
│   Challenge 2: Camera Permissions  │
│   • Solved: Fallback demo mode     │
│   • Still works even if denied     │
│                                     │
│   Challenge 3: PDF Generation      │
│   • Solved: jspdf-autotable lib    │
│                                     │
│   Challenge 4: Build Optimization  │
│   • Solved: Configured allowlist   │
│                                     │
│   [Keep this simple, no deep tech] │
│                                     │
└─────────────────────────────────────┘

SPEAKER: ETHAN - 1 minute
```

---

**SLIDE 14: Project Impact & Conclusion**
```
┌─────────────────────────────────────┐
│                                     │
│   Project Impact                   │
│                                     │
│   System Status: ✓ Complete        │
│   ✓ All features working           │
│   ✓ Database deployed              │
│   ✓ Backend API tested             │
│   ✓ Mobile app functional          │
│   ✓ PDF exports working            │
│                                     │
│   From Problem → Solution:          │
│   Manual Logbook → QR Mobile App   │
│   Hours of data entry → 1 click    │
│   Scattered records → Organized DB │
│                                     │
│   Team: 5 developers, 1 vision     │
│                                     │
└─────────────────────────────────────┘

SPEAKER: DELWIN - 1 minute
```

---

**SLIDE 15: Thank You & Questions**
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         Thank You!                 │
│                                     │
│      Questions & Discussion        │
│                                     │
│      Ready for demo if needed      │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘

SPEAKER: CARL - Closing statement
"Thank you for listening. We're happy to answer any questions 
about FordaGO or do a quick live demo if you'd like to see 
the system in action."
```

---

## PART 2: TEAM ROLE ASSIGNMENTS

### Member Assignments by Strength

| Speaker | Role | What They Say | Duration |
|---------|------|--------------|----------|
| **CARL (Lead)** | Opening & Closing | Title slide, tech stack concepts, security, thank you | 2.5 min total |
| **JAYLEE** | Problem & Equipment | Problem statement, equipment tracking, significance | 2.5 min total |
| **DELWIN** | Solution Overview & Impact | Solution intro, equipment details, conclusion | 2 min total |
| **ETHAN** | Technical Architecture | How it works, feature 4 reports, challenges | 2.5 min total |
| **RYZA** | Database & Tech Depth | Tech stack details, database design, brief only | 1.5 min total |

**Total Speaking Time:** ~13 minutes (leaves 7-12 min for Q&A or demo)

---

## PART 3: LIVE DEMO - When & How to Show It

### Demo Timing: After Slide 10 (Database Design)

**Option A: Demo During Presentation** (recommended)
```
Timeline:
- Slides 1-10: 13 minutes of talking
- After Slide 10: "Let me show you the system in action"
- Demo: 5-7 minutes (see demo script below)
- Slides 11-15: Continue with security + conclusions
- Q&A: 5-10 minutes
```

**Option B: Demo at End (if time tight)**
```
Timeline:
- Slides 1-15: 18 minutes talking
- After Q&A: "Would you like to see it live? I can show the system"
- Demo: 5-7 minutes
```

### Live Demo Script (5-7 minutes)

**Setup Before Defense:**
- Laptop connected to projector
- Frontend app open in browser (already logged in as admin)
- Backend server running on localhost:3001
- Printed QR code visible or QR displayed on screen

---

### Demo Step 1: Admin QR Generation (1.5 min)

**NARRATOR:** One speaker talks while another operates laptop

```
SPEAKER (CARL): 
"Let me show you the admin dashboard. This is where gym staff 
manages everything. First, they can generate the QR code for 
the gym entrance."

OPERATOR (DELWIN):
1. Show "Admin Dashboard" tab on screen
2. Click "Gym QR Code Management" section
3. Click "Generate Gym Attendance QR" button
4. [QR code appears]
5. Click "Download" button
6. [File downloads - show in Downloads folder]

SPEAKER (CARL):
"So the admin clicks one button, the QR generates in a second, 
and they can download it to print. That's it. No complicated 
setup. One static QR, printed, laminated, posted at entrance."
```

---

### Demo Step 2: Member Scanner (2 min)

**SPEAKER (JAYLEE):**
"Now let's see what happens from the member's perspective. 
A member opens the app and goes to the scanner."

**OPERATOR (ETHAN):**
1. Logout from admin
2. Login as member account (show credentials: email@test.com / password)
3. Navigate to "QR Scanner" page
4. Show "Start Camera Scan" button and "Run Demo Scan" button

**SPEAKER (JAYLEE):**
"The member can scan with their phone camera, or for this demo, 
I'll click the demo button."

**OPERATOR (ETHAN):**
5. Click "Run Demo Scan"
6. [System shows "Check-in successful!" message]
7. Navigate to dashboard/history
8. [Show new attendance record appeared]

**SPEAKER (JAYLEE):**
"Boom! Scanned. Timestamped. Recorded. Took 2 seconds. 
No more writing in logbooks."
```

---

### Demo Step 3: Equipment Scan (1.5 min)

**SPEAKER (DELWIN):**
"Members can also scan equipment QR codes for guidance and 
tracking. Let me show that."

**OPERATOR (ETHAN):**
1. Go back to scanner
2. Show "Run Demo Equipment Scan" or equipment scan section
3. Click demo button
4. [System logs equipment scan]
5. Navigate to admin → Equipment section
6. Show equipment scan logs with Member Name | Equipment | Time

**SPEAKER (DELWIN):**
"Now the system knows: This member used this equipment at this 
exact time. That data helps with maintenance scheduling and 
liability tracking."

---

### Demo Step 4: Admin Reports (1.5 min)

**SPEAKER (ETHAN):**
"The most powerful part is instant reports. Watch this."

**OPERATOR (CARL):**
1. Logout member, login as admin
2. Go to Admin Dashboard → Attendance tab
3. Show date picker, select today's date
4. [Attendance table appears with data]
5. Click "Download Attendance PDF"
6. [PDF opens in browser]
7. Show PDF has: Member Name | Email | Check-in Time | Status | Payment

**SPEAKER (ETHAN):**
"Admin selects a date and clicks download. Report is ready. 
Before this, it took hours of manual work. Now it's instant."

---

## PART 4: Q&A PREPARATION

### Expected Questions & Who Answers

#### Q1: "Why QR codes and not RFID or fingerprint?"
**Answer:** CARL
```
"Good question. We considered other technologies:

RFID requires card readers - expensive hardware.
Fingerprint requires special devices and privacy concerns.

QR codes are practical because:
- Uses phone camera everyone already has
- Can print on paper and laminate for $1
- Free open-source libraries
- Works immediately, no setup

For AFFORDA Gym, QR is the right choice."
```

#### Q2: "What if someone's password is compromised?"
**Answer:** RYZA or ETHAN
```
"If a member's password is compromised, someone could log in 
as them and scan. 

Mitigations we could add:
- Two-factor authentication (2FA) via SMS
- Device fingerprinting
- Login alerts if unusual location

For now, AFFORDA Gym is small/trusted, so password security 
is sufficient. But yes, 2FA would be a good future enhancement."
```

#### Q3: "How does the database handle large volume?"
**Answer:** RYZA
```
"The MySQL database is designed to scale. We're using:
- Proper indexes on user_id and timestamps
- Foreign key relationships for data integrity
- Query optimization

For 10,000 members doing 1 scan each daily, the database 
handles it fine. If we need to scale beyond that, we could 
add caching or move to a more robust system."
```

#### Q4: "What if internet goes down?"
**Answer:** ETHAN
```
"Current version requires internet for each scan. That's 
acceptable because:
- AFFORDA Gym has stable WiFi
- Scan data syncs immediately
- Not a safety-critical system

Future enhancement: We could implement offline queueing where 
scans store locally and sync when internet returns."
```

#### Q5: "How long did this take to build?"
**Answer:** CARL
```
"We spent about 8-10 weeks on this project:
- 2 weeks: Backend setup and database design
- 2 weeks: Frontend basics and layout
- 2 weeks: QR generation and scanner implementation
- 2 weeks: PDF reporting and polish
- 1-2 weeks: Testing and refinement

As a team of 5, we worked in parallel on different modules, 
then integrated everything together."
```

---

## PART 5: PRESENTATION DAY CHECKLIST

### 1 Day Before (June 10)

```
☐ Final practice run-through (all 5 team members together)
☐ Time the presentation (should be 18-22 minutes)
☐ Test all transitions between speakers
☐ Finalize PowerPoint - no more edits
☐ Print backup copies of slides (in case projector fails)
☐ Charge laptops (all 3 if needed)
☐ Create USB backup: 
  - Presentation.pptx
  - Screenshots of system
  - Source code folder
☐ Prepare printed QR code
☐ Review Q&A answers together
☐ Get good sleep!
```

### Morning Of (June 11)

```
☐ Arrive at school 20 minutes early
☐ Set up laptop, test projector HDMI connection
☐ Test PowerPoint display (font size, colors visible)
☐ Open frontend app in browser (already logged in)
☐ Start backend server (if not already running)
☐ Do a quick sound check if using mic
☐ Have printed QR code on desk
☐ Have water available
☐ Final huddle: "You got this, let's show them what we built"
```

### During Presentation

```
☐ CARL: Welcome, be confident, speak clearly
☐ Each speaker: Speak to audience, not to screen
☐ Point at demo when showing features
☐ Speak in normal pace (not too fast)
☐ Make eye contact with panel
☐ Smile - you're proud of what you built!
☐ Listen carefully to questions before answering
☐ If unsure: "That's a good question, let me think about that..."
```

---

## PART 6: SPEAKING TIPS FOR EACH MEMBER

### CARL (Team Lead)
```
- Confident opening ("Good morning, thank you for having us")
- Keep title slide punchy (30 seconds)
- Security explanation: Use simple terms
- Closing: "We're happy to answer any questions"
- Time: ~2.5 minutes total
- Confidence: You created this project - own it!
```

### JAYLEE
```
- Problem statement: Show real pain points (illegible handwriting, hours)
- Equipment tracking: Explain business value ("maintenance," "liability")
- Use examples: "Member gets injured - proof they used equipment"
- Time: ~2.5 minutes
- Tone: Empathetic (you understand the gym's problems)
```

### DELWIN
```
- Solution intro: Make it exciting ("QR-based system that's simple")
- Explain how static QR works ("All members scan same code")
- Equipment details: "Tracks who used what, when"
- Keep technical jargon light
- Time: ~2 minutes
- Tone: Clear and concise
```

### ETHAN
```
- Architecture: Use the diagram ("Mobile app → Backend → Database")
- Explain without going too deep (they're not developers)
- Feature 4 (reports): "3 hours of manual work → 10 seconds"
- Challenges: "We solved X by doing Y"
- Time: ~2.5 minutes
- Tone: Problem-solver ("We faced this, here's how we fixed it")
```

### RYZA
```
- Tech stack: Brief overview (Ionic, Angular, Node.js, MySQL)
- Database: Show table relationships ("users linked to attendance")
- Don't explain every table - just key ones
- Keep it technical but understandable
- Time: ~1.5 minutes
- Tone: Confident in technical knowledge
```

---

## PART 7: BACKUP PLANS

### If Live Demo Fails

**Option 1: Use Screenshots**
```
Before defense, take screenshots of:
1. Admin dashboard with generated QR
2. QR scanner page with camera
3. "Check-in successful" message
4. Attendance report table
5. Downloaded PDF

If demo fails, show these screenshots instead
"Here's what the admin would see..." [click to screenshot]
```

**Option 2: Show Video**
```
Record a 2-minute video of demo flow:
1. Admin generates QR
2. Member scans
3. Report appears

If live demo has issues, play the video
"Let me show you the system in action [play video]"
```

**Option 3: Graceful Recovery**
```
If demo breaks during presentation:
"The live demo would show [explain] but we have these 
screenshots showing the exact output [click to screenshot].
The system is working on our laptop here; it's just a 
connectivity issue. Would you like to try it after?"

Keep talking, don't panic - panel understands tech issues
```

---

## PART 8: SCORING RUBRIC (What Panel Looks For)

Your capstone defense is judged on:

| Criteria | What They Want | How You Score Points |
|----------|---|---|
| **Problem Understanding** | Clear, specific gym problems | Mention manual logbooks, time waste, no audit trail |
| **Solution Design** | Thoughtful approach | Explain why QR (practical, scalable) |
| **Technical Implementation** | Working system | Show live demo or screenshots |
| **Database Design** | Good schema | Show table relationships, data integrity |
| **Presentation Quality** | Clear communication | Speak slowly, explain for non-devs |
| **Team Coordination** | Smooth transitions | Speakers transition smoothly, no dead time |
| **Innovation** | Something new | QR for gym attendance + equipment tracking |
| **Q&A Handling** | Think on your feet | Answer confidently, admit if unsure |

---

## PART 9: SUCCESS TIPS

### Do's ✓
```
✓ Practice together as a team (min 3 times)
✓ Speak clearly and at normal pace
✓ Make eye contact with panel
✓ Use examples from real gym operations
✓ Show the actual system working
✓ Admit when you don't know something
✓ Thank them at the end
✓ Be proud - you built a real system!
```

### Don'ts ✗
```
✗ Don't read slides word-for-word
✗ Don't speak too fast (nerves!)
✗ Don't use too much jargon
✗ Don't have dead time between speakers
✗ Don't defend choices too aggressively
✗ Don't dismiss questions
✗ Don't apologize for things (it's a capstone!)
✗ Don't forget to breathe!
```

---

## FINAL TEAM HUDDLE SCRIPT

### Read this together before going in:

```
"We're about to present FordaGO, a system we built to solve 
a real problem for a real gym. 

We understand the architecture. We built the code. We tested 
the features. We know this system inside and out.

Each of us has a part to play, and we've practiced together. 
When we present, we're confident, clear, and proud of what 
we've created.

If a question stumps us, we admit it and move on - that's 
professional.

If the demo breaks, we gracefully show screenshots - no big deal.

The panel is not our enemy - they want to see us succeed. 
They're curious about our approach.

We're going to walk in there, present this capstone with 
confidence, and answer their questions like the developers 
we are.

Let's do this. FordaGO is ready. We are ready.

Five people, one vision. Here we go!"
```

---

## REMEMBER

```
June 11, 2026 - Defense Day

You are not presenting a theoretical project.
You are presenting a WORKING SYSTEM.
You BUILT this.
You UNDERSTAND this.
You TESTED this.

The panel is not trying to catch you - they want to learn 
about your project.

Be confident. Be clear. Be proud.

Go show them what FordaGO is all about! 

🎯 QR codes + Mobile app + Real problem solved = Success

Good luck, Team! 💪
```
