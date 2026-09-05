# FordaGO PowerPoint Slide Design Guide
**For 5-Member Team Defense - June 11, 2026**

---

## DESIGN GUIDELINES
 
### Color Scheme
```
Primary: Blue (#0066CC) - Professional, tech-focused
Accent: Green (#00AA00) - Success, check-in theme
Dark: Dark Blue (#003366) - Text, headers
Light: White/Light Gray - Background

Theme: Clean, modern, minimalist
Font: Arial or Calibri (easy to read from distance)
Title Font Size: 44pt
Body Font Size: 28pt
```

### Slide Template (All slides follow this)
```
┌──────────────────────────────────────────────────┐
│ FORDAGO (small logo top-right corner)           │
├──────────────────────────────────────────────────┤
│                                                   │
│   [SLIDE TITLE - Large, Bold]                   │
│                                                   │
│   • Bullet point 1                              │
│   • Bullet point 2                              │
│   • Bullet point 3                              │
│                                                   │
│   [IMAGE or DIAGRAM]                            │
│                                                   │
└──────────────────────────────────────────────────┘
Slide X of 15
```

---

## SLIDE-BY-SLIDE DESIGN

### SLIDE 1: Title Slide

```
═════════════════════════════════════════════════════
║                                                   ║
║   FordaGO                                        ║
║   Mobile-Based Gym Database                      ║
║   Management System                              ║
║                                                   ║
║   AFFORDA Gym - San Isidro Branch               ║
║                                                   ║
║                                                   ║
║   Team Members:                                  ║
║   Carl Bernaldo | Delwin Galang                 ║
║   Jaylee Javier | Ethan Medina                  ║
║   Ryza Pongco                                   ║
║                                                   ║
║   June 11, 2026                                 ║
║   Capstone 1 Project Defense                    ║
║                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Full screen, centered text
- Gym/FordaGO logo if available (or just text)
- Simple, clean layout
- No clutter
```

---

### SLIDE 2: The Problem

```
═════════════════════════════════════════════════════
║   THE PROBLEM AT AFFORDA GYM                     ║
════════════════════════════════════════════════════
║                                                   ║
║   Manual Logbook Challenges:                    ║
║   ✗ Illegible handwriting                       ║
║   ✗ Time-consuming data entry                   ║
║   ✗ Hours of compilation work                   ║
║   ✗ No audit trail                              ║
║   ✗ Equipment usage not tracked                 ║
║   ✗ Can't generate reports quickly              ║
║                                                   ║
║   Current Process:                              ║
║   Staff writes → Month-end compilation →        ║
║   Manual spreadsheet → Hours of work            ║
║                                                   ║
║   [IMAGE: Photo of actual logbook if available]║
║                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Red/orange accent color for problems
- X marks for "bad" things
- Show actual photo of manual logbook (if you have it)
- Keep text minimal, let speaker explain
```

---

### SLIDE 3: The Solution

```
═════════════════════════════════════════════════════
║   THE FORDAGO SOLUTION                           ║
════════════════════════════════════════════════════
║                                                   ║
║   QR-Based Attendance System                    ║
║   ✓ One scan = Complete record                  ║
║   ✓ Automatic timestamping                      ║
║   ✓ Instant report generation                   ║
║   ✓ Equipment tracking                          ║
║   ✓ Mobile-friendly                             ║
║   ✓ Data-driven insights                        ║
║                                                   ║
║                                                   ║
║        [VISUAL: Phone → QR → Database]          ║
║                                                   ║
║        Member scans QR                          ║
║        2 seconds                                 ║
║        Recorded ✓                               ║
║                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Green checkmarks for "good" things
- Simple icons or illustrations
- Show flow visually (phone camera → QR code → database)
- Don't use text-heavy bullets
```

---

### SLIDE 4: High-Level Architecture

```
═════════════════════════════════════════════════════
║   HOW FORDAGO WORKS                              ║
════════════════════════════════════════════════════
║                                                   ║
║                    System Architecture          ║
║                                                   ║
║                  [VISUAL DIAGRAM]               ║
║                                                   ║
║         Mobile App (Ionic/Angular)              ║
║               ↓                                  ║
║         Backend Server (Node.js)                ║
║               ↓                                  ║
║         Database (MySQL)                        ║
║               ↓                                  ║
║         Reports & Analytics                    ║
║                                                   ║
║   Three-tier architecture ensures               ║
║   security, scalability, and performance       ║
║                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Use arrows or boxes to show flow
- Keep architecture diagram simple
- Show 3 layers clearly (Frontend, Backend, Database)
- Add small icons next to each layer (phone, server, database)
```

---

### SLIDE 5: Tech Stack

```
═════════════════════════════════════════════════════
║   TECHNOLOGY STACK                               ║
════════════════════════════════════════════════════
║                                                   ║
║   Frontend:              Backend:               ║
║   • Ionic Framework v8   • Node.js              ║
║   • Angular v20          • Express.js           ║
║   • TypeScript           • JWT Auth             ║
║                                                   ║
║   Database:              Libraries:             ║
║   • MySQL                • qrcode               ║
║   • Relational Design    • html5-qrcode         ║
║   • 8 Tables             • jsPDF                ║
║                                                   ║
║   All open-source, production-ready            ║
║                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Two-column layout (Frontend | Backend)
- Simple bullet points, not too detailed
- Use icons if available (Ionic logo, Node.js logo)
- DON'T explain each technology in depth
- Keep it brief - just name the tech
```

---

### SLIDE 6: Feature 1 - QR Generation

```
═════════════════════════════════════════════════════
║   FEATURE 1: QR CODE GENERATION                 ║
════════════════════════════════════════════════════
║                                                   ║
║   Admin QR Generation Process:                  ║
║                                                   ║
║   1. Login to Admin Dashboard                   ║
║   2. Click "Generate Gym QR"                    ║
║   3. System creates QR code                     ║
║   4. Download and print                         ║
║   5. Post at gym entrance                       ║
║                                                   ║
║   [LARGE QR CODE IMAGE HERE]                    ║
║                                                   ║
║   Same QR for all members                       ║
║   Backend identifies who scanned               ║
║                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Show actual QR code (large, printable-looking)
- Numbered steps (clear flow)
- Add small screenshot of admin interface if possible
- Make QR code prominent (this is visual proof)
```

---

### SLIDE 7: Feature 2 - Member Scanner

```
═════════════════════════════════════════════════════
║   FEATURE 2: MEMBER QR SCANNER                  ║
════════════════════════════════════════════════════
║                                                   ║
║   Member Check-In Flow:                         ║
║                                                   ║
║   ┌─────────────────────────────────┐           ║
║   │ 1. Open FordaGO App             │           ║
║   │ 2. Go to Scanner Tab            │           ║
║   │ 3. Point camera at QR code      │           ║
║   │ 4. System recognizes QR         │           ║
║   │ 5. "Check-in successful!" ✓    │           ║
║   └─────────────────────────────────┘           ║
║                                                   ║
║   Behind the Scenes:                            ║
║   - Live camera access                          ║
║   - Instant backend sync                        ║
║   - Timestamped record created                  ║
║   - Complete audit trail                        ║
║                                                   ║
│   [SCREENSHOT: Phone with scanner screen]      ║
│                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Show box/flow of steps
- Include phone screenshot if available
- Green checkmark for successful scan
- Keep explanatory text brief
```

---

### SLIDE 8: Feature 3 - Equipment Tracking

```
═════════════════════════════════════════════════════
║   FEATURE 3: EQUIPMENT TRACKING                 ║
════════════════════════════════════════════════════
║                                                   ║
║   Members Scan Equipment QRs:                   ║
║                                                   ║
║   [ICONS]  🏋️ Weights  🚴 Bike  🏃 Treadmill  ║
║                                                   ║
║   System Logs:                                  ║
║   WHO:   Member name                           ║
║   WHAT:  Equipment scanned                     ║
║   WHEN:  Exact timestamp                       ║
║                                                   ║
║   Admin Benefits:                               ║
║   • Maintenance scheduling                      ║
║   • "Which equipment breaks most?"              ║
║   • Proof of usage for liability                ║
║   • Equipment popularity analytics              ║
║                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Use equipment emojis or icons
- WHO/WHAT/WHEN format (easy to understand)
- Show real business benefits
- Keep text scannable with bullets
```

---

### SLIDE 9: Feature 4 - Admin Reports

```
═════════════════════════════════════════════════════
║   FEATURE 4: INSTANT REPORTS                    ║
════════════════════════════════════════════════════
║                                                   ║
║   Before vs After:                              ║
║                                                   ║
║   BEFORE:          AFTER:                       ║
║   ✗ 3 hours        ✓ 10 seconds                ║
║   ✗ Manual entry   ✓ Automated                 ║
║   ✗ Prone to error ✓ 100% accurate             ║
║   ✗ Hard to find   ✓ Instantly searchable      ║
║                                                   ║
║   Admin Dashboard:                              ║
║   1. Select date → 2. Click download →          ║
║   3. PDF ready to print                         ║
║                                                   ║
║   PDF Includes:                                 ║
║   Member name | Check-in time | Status         ║
║   Payment status | Equipment used (if any)     ║
║                                                   ║
│   [SCREENSHOT: Sample PDF Report]              ║
│                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Show Before/After comparison (visual impact)
- ✗ and ✓ marks for clear contrast
- Show actual PDF screenshot
- Emphasize speed and accuracy
```

---

### SLIDE 10: Database Design

```
═════════════════════════════════════════════════════
║   DATABASE DESIGN                                ║
════════════════════════════════════════════════════
║                                                   ║
║   Core Tables:                                  ║
║                                                   ║
║        users                                    ║
║       /    |    \                              ║
║      /     |     \                             ║
║   attend equipment notifications               ║
║   ance     scans                               ║
║                                                   ║
║   Key Features:                                 ║
║   ✓ Foreign key relationships                   ║
║   ✓ Data integrity enforced                    ║
║   ✓ Normalized design                          ║
║   ✓ Indexed for fast queries                   ║
║                                                   ║
║   Sample Data:                                  ║
║   Attendance: user_id | check_in_time | status ║
║   Equipment: user_id | equipment | scan_time  ║
║                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Show simple entity-relationship diagram
- Show table names and key columns
- Use lines to show relationships
- Keep it simple, not too technical
- Show sample data row (concrete example)
```

---

### SLIDE 11: Security & Data Protection

```
═════════════════════════════════════════════════════
║   SECURITY & DATA PROTECTION                    ║
════════════════════════════════════════════════════
║                                                   ║
║   How We Protect Member Data:                   ║
║                                                   ║
║   🔐 Passwords:                                 ║
║      Hashed with bcryptjs (salted)             ║
║      Even admins can't see plaintext           ║
║                                                   ║
║   🔑 Authentication:                            ║
║      JWT tokens (signed, expiring)             ║
║      Can't be forged without secret key        ║
║                                                   ║
║   🛡️ Database Access:                           ║
║      Only backend API can access               ║
║      All queries validated server-side         ║
║                                                   ║
║   ✓ Duplicate scan prevention                  ║
║   ✓ Server-side timestamp (no cheating)        ║
║                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Use security icons (🔐 🔑 🛡️)
- Keep explanations simple
- Show security is taken seriously
- Don't go too deep into crypto details
```

---

### SLIDE 12: Why This Matters

```
═════════════════════════════════════════════════════
║   PROJECT SIGNIFICANCE & IMPACT                 ║
════════════════════════════════════════════════════
║                                                   ║
║   Impact on AFFORDA Gym:                        ║
║   ✓ Eliminates manual logbook process          ║
║   ✓ Saves 3+ hours per month on data entry     ║
║   ✓ Instant attendance verification            ║
║   ✓ Equipment maintenance audit trail          ║
║   ✓ Professional, searchable records           ║
║                                                   ║
║   Impact on Members:                            ║
║   ✓ Quick check-in (2 seconds)                 ║
║   ✓ Mobile convenience                         ║
║   ✓ Access to equipment info anytime           ║
║                                                   ║
║   Innovation:                                   ║
║   QR-based attendance + Equipment tracking     ║
║   Practical, scalable, low-cost solution       ║
║                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Use checkmarks for positive impacts
- Show benefits for different stakeholders
- Emphasize time savings (quantify!)
- Show it's a real, practical solution
```

---

### SLIDE 13: Challenges Overcome

```
═════════════════════════════════════════════════════
║   TECHNICAL CHALLENGES & SOLUTIONS              ║
════════════════════════════════════════════════════
║                                                   ║
║   Challenge 1: QR Payload Design               ║
║   ✓ Solution: Static payload approach          ║
║   ✓ Result: Simpler, more maintainable        ║
║                                                   ║
║   Challenge 2: Camera Permissions              ║
║   ✓ Solution: Added fallback demo mode         ║
║   ✓ Result: Works even if permission denied   ║
║                                                   ║
║   Challenge 3: PDF Report Generation           ║
║   ✓ Solution: Used jspdf-autotable library    ║
║   ✓ Result: Clean, printable reports          ║
║                                                   ║
║   Challenge 4: Build Optimization              ║
║   ✓ Solution: Configured CommonJS allowlist   ║
║   ✓ Result: Clean build, no warnings          ║
║                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Challenge → Solution → Result format
- Keep technical but understandable
- Show problem-solving skills
- Don't go too deep into implementation
```

---

### SLIDE 14: Project Status & Conclusion

```
═════════════════════════════════════════════════════
║   PROJECT COMPLETION & CONCLUSION              ║
════════════════════════════════════════════════════
║                                                   ║
║   System Status: COMPLETE ✓                     ║
║                                                   ║
║   ✓ All features implemented                    ║
║   ✓ Backend API tested                          ║
║   ✓ Mobile app functional                       ║
║   ✓ Database deployed                           ║
║   ✓ PDF exports working                         ║
║   ✓ Ready for demo                              ║
║                                                   ║
║   From Problem → Solution:                      ║
║   Manual Logbook → Mobile QR App               ║
║   Hours of work → One click                     ║
║   Scattered records → Centralized database      ║
║                                                   ║
║   Team: 5 developers                            ║
║   Vision: One integrated solution               ║
║   Result: Working system for real gym          ║
║                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Checkmarks for all completed items
- Show transformation (before → after)
- Emphasize team effort
- Build confidence for Q&A
```

---

### SLIDE 15: Thank You & Questions

```
═════════════════════════════════════════════════════
║                                                   ║
║                                                   ║
║             THANK YOU!                          ║
║                                                   ║
║           Questions & Discussion                ║
║                                                   ║
║    Ready for live demo if you'd like to         ║
║         see FordaGO in action                   ║
║                                                   ║
║                                                   ║
║                                                   ║
║  FordaGO: Solving gym attendance                ║
║  one QR code at a time                          ║
║                                                   ║
═════════════════════════════════════════════════════

DESIGN:
- Simple, clean closing slide
- Invite questions
- Show confidence and pride
- Optional tagline
```

---

## POWERPOINT CREATION CHECKLIST

### Step 1: Set Up Template
- [ ] Create blank presentation
- [ ] Set slide dimensions to 16:9 (widescreen)
- [ ] Choose professional theme (blue/white)
- [ ] Add FordaGO logo to slide master (top-right corner, small)

### Step 2: Create Each Slide
- [ ] Copy the content from above
- [ ] Add images/screenshots where indicated
- [ ] Use consistent fonts (Arial 28pt+ for readability)
- [ ] Use consistent colors (blue headers, green accents)
- [ ] Test readability from distance (16pt minimum)

### Step 3: Add Visuals
- [ ] Slide 1: Logo image
- [ ] Slide 2: Photo of actual manual logbook (if available)
- [ ] Slide 3: System flow diagram
- [ ] Slide 4: Architecture diagram (3 boxes connected)
- [ ] Slide 5: Tech logos if available
- [ ] Slide 6: Actual QR code screenshot
- [ ] Slide 7: Phone screenshot of scanner
- [ ] Slide 9: Before/after comparison visual
- [ ] Slide 10: Entity-relationship diagram
- [ ] Slide 14: Summary graphic

### Step 4: Final Polish
- [ ] Check all spelling/grammar
- [ ] Test presentation mode (F5 key)
- [ ] Verify font sizes visible from back of room
- [ ] Check for consistent formatting
- [ ] Save as PDF backup
- [ ] Save as .pptx file
- [ ] Create USB backup

---

## NOTES FOR PRESENTERS

```
Remember:
- DON'T read slides word-for-word
- Point at visuals when explaining
- Let images do the talking (minimal text)
- Speak naturally, not robotically
- Make eye contact with panel
- Use hand gestures to emphasize points
- Show enthusiasm - you built this!

If you use the visual design above, your presentation 
will look professional and be easy to understand.

The panel will see you understand the system, 
can communicate clearly, and are proud of what you built.

That's how you ace a capstone defense! 💪
```
