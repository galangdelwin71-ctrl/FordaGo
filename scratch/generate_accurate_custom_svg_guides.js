const fs = require('fs');
const path = require('path');

const root = 'c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo';

// Detailed anatomical path templates:
const muscleGlowDefs = `
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B132B"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="metalGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#64748b"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="padGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>
    <linearGradient id="glowOrange" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff7a00"/>
      <stop offset="50%" stop-color="#ff4500"/>
      <stop offset="100%" stop-color="#ff0044"/>
    </linearGradient>
    <radialGradient id="muscleRadial" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff9900" stop-opacity="0.9"/>
      <stop offset="70%" stop-color="#ff3300" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#ff0000" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
`;

// 1. Pickleball Court & Athletic Stance Guide (ID 18)
const pickleballSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" width="100%" height="100%">
  ${muscleGlowDefs}
  <rect width="900" height="480" fill="url(#bgGrad)"/>
  
  <!-- Header -->
  <text x="450" y="36" fill="#f8fafc" font-family="-apple-system, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" letter-spacing="1">PICKLEBALL COURT &amp; DYNAMIC AGILITY GUIDE</text>
  <text x="450" y="58" fill="#38bdf8" font-family="-apple-system, sans-serif" font-size="12" font-weight="600" text-anchor="middle">PRIMARY TARGET: Dynamic Agility, Lateral Footwork, Core &amp; Leg Power</text>

  <!-- Left: 3D Court Layout -->
  <g transform="translate(40, 80)">
    <rect width="380" height="340" rx="10" fill="#182234" stroke="#334155" stroke-width="1.5"/>
    <text x="190" y="30" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">PHASE 1: REGULATION COURT ZONES</text>
    
    <!-- 3D Isometric Pickleball Court -->
    <g transform="translate(190, 180)">
      <!-- Outer Court Boundary (Green/Blue) -->
      <polygon points="0,-90 140,-20 0,60 -140,-20" fill="#15803d" stroke="#f8fafc" stroke-width="2.5"/>
      <!-- Right Service Box (Navy) -->
      <polygon points="0,-90 70,-55 0,-15 -70,-55" fill="#3b82f6" stroke="#f8fafc" stroke-width="1.5" opacity="0.85"/>
      <!-- Left Service Box (Navy) -->
      <polygon points="0,60 70,25 0,-15 -70,25" fill="#3b82f6" stroke="#f8fafc" stroke-width="1.5" opacity="0.85"/>
      <!-- Kitchen / Non-Volley Zone (7ft both sides of net - Purple/Red) -->
      <polygon points="0,-40 50,-15 0,10 -50,-15" fill="#7c3aed" stroke="#f8fafc" stroke-width="2" opacity="0.9"/>
      <text x="0" y="-12" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="10" font-weight="bold" text-anchor="middle">KITCHEN (NVZ)</text>
      <!-- Center Net -->
      <line x1="-75" y1="-28" x2="75" y2="28" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
      <line x1="-75" y1="-28" x2="-75" y2="-45" stroke="#94a3b8" stroke-width="3"/>
      <line x1="75" y1="28" x2="75" y2="12" stroke="#94a3b8" stroke-width="3"/>
    </g>
    
    <!-- Callout Labels -->
    <text x="30" y="300" fill="#cbd5e1" font-family="-apple-system, sans-serif" font-size="11">✓ Baseline &amp; Service Line Position</text>
    <text x="30" y="320" fill="#cbd5e1" font-family="-apple-system, sans-serif" font-size="11">✓ Non-Volley Zone Rule (No smashes in NVZ)</text>
  </g>

  <!-- Right: Player Athletic Stance & Kinetic Drive -->
  <g transform="translate(480, 80)">
    <rect width="380" height="340" rx="10" fill="#182234" stroke="#334155" stroke-width="1.5"/>
    <text x="190" y="30" fill="#f59e0b" font-family="-apple-system, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">PHASE 2: READY STANCE &amp; FOREHAND DRIVE</text>
    
    <!-- Anatomical Player Figure -->
    <g transform="translate(190, 60)">
      <!-- Shadow -->
      <ellipse cx="0" cy="220" rx="65" ry="12" fill="#000000" opacity="0.4"/>
      
      <!-- Legs (Squat / Athletic Stance with Glowing Quads & Calves) -->
      <!-- Left Leg -->
      <path d="M-25,110 Q-45,150 -40,190 L-35,215 L-55,220 L-50,190 Q-55,140 -35,110 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <path d="M-25,115 Q-42,145 -38,170 Q-32,150 -25,115 Z" fill="url(#glowOrange)" filter="url(#glow)"/>
      <path d="M-40,175 Q-45,195 -38,210 Q-35,195 -40,175 Z" fill="url(#glowOrange)" filter="url(#glow)"/>

      <!-- Right Leg -->
      <path d="M20,110 Q45,150 40,190 L35,215 L55,220 L50,190 Q55,140 30,110 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <path d="M20,115 Q42,145 38,170 Q32,150 20,115 Z" fill="url(#glowOrange)" filter="url(#glow)"/>
      <path d="M40,175 Q45,195 38,210 Q35,195 40,175 Z" fill="url(#glowOrange)" filter="url(#glow)"/>

      <!-- Hips / Shorts -->
      <path d="M-30,95 L30,95 L25,120 L-25,120 Z" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>

      <!-- Torso with Glowing Obliques/Core -->
      <path d="M-28,45 Q-32,70 -25,95 L25,95 Q32,70 28,45 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <!-- Core Muscle Glow -->
      <path d="M-18,55 Q-22,75 -15,90 L15,90 Q22,75 18,55 Z" fill="url(#glowOrange)" filter="url(#glow)"/>
      <!-- Chest / Pectorals -->
      <path d="M-28,45 Q0,55 28,45 L22,25 L-22,25 Z" fill="#cbd5e1" stroke="#0f172a" stroke-width="1"/>

      <!-- Left Arm (Balance) -->
      <path d="M-25,30 Q-55,40 -65,25 L-60,18 Q-50,30 -22,25 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>

      <!-- Right Arm (Holding Paddle in Forehand Drive) -->
      <path d="M25,30 Q55,50 65,35 Q80,20 90,5 L82,-2 Q70,12 55,25 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <!-- Shoulder Glow -->
      <circle cx="28" cy="32" r="10" fill="url(#glowOrange)" filter="url(#glow)"/>
      <!-- Paddle -->
      <rect x="85" y="-35" width="28" height="40" rx="6" fill="#f59e0b" stroke="#ffffff" stroke-width="2" transform="rotate(-20, 85, -35)"/>
      <line x1="85" y1="5" x2="80" y2="20" stroke="#334155" stroke-width="5" stroke-linecap="round"/>

      <!-- Head & Neck -->
      <path d="M-10,25 L10,25 L8,12 L-8,12 Z" fill="#e2e8f0"/>
      <ellipse cx="0" cy="0" rx="14" ry="16" fill="#f8fafc" stroke="#0f172a" stroke-width="1"/>
    </g>
    
    <text x="30" y="300" fill="#cbd5e1" font-family="-apple-system, sans-serif" font-size="11">✓ Knees bent at 45°, weight on balls of feet</text>
    <text x="30" y="320" fill="#cbd5e1" font-family="-apple-system, sans-serif" font-size="11">✓ Paddle up, kinetic drive from glutes &amp; core</text>
  </g>
</svg>`;

// 2. Dumbbell Bicep Curl & Press Guide (ID 16)
const dumbbellSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" width="100%" height="100%">
  ${muscleGlowDefs}
  <rect width="900" height="480" fill="url(#bgGrad)"/>
  
  <text x="450" y="36" fill="#f8fafc" font-family="-apple-system, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" letter-spacing="1">DUMBBELL BICEP CURL &amp; FREE WEIGHT GUIDE</text>
  <text x="450" y="58" fill="#38bdf8" font-family="-apple-system, sans-serif" font-size="12" font-weight="600" text-anchor="middle">PRIMARY TARGET: Biceps Brachii, Brachialis, Forearms, Core Stabilizers</text>

  <!-- Step 1: Dumbbells at Sides -->
  <g transform="translate(40, 80)">
    <rect width="380" height="340" rx="10" fill="#182234" stroke="#334155" stroke-width="1.5"/>
    <text x="190" y="30" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">STEP 1: START POSITION (DUMBBELLS AT SIDES)</text>
    
    <g transform="translate(190, 60)">
      <ellipse cx="0" cy="225" rx="55" ry="10" fill="#000000" opacity="0.4"/>
      <!-- Legs -->
      <path d="M-22,110 L-22,215 L-35,215 L-35,110 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <path d="M22,110 L22,215 L35,215 L35,110 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <path d="M-30,95 L30,95 L25,120 L-25,120 Z" fill="#1e293b"/>
      <!-- Torso -->
      <path d="M-28,40 Q-32,70 -25,95 L25,95 Q32,70 28,40 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <path d="M-28,40 Q0,50 28,40 L24,20 L-24,20 Z" fill="#cbd5e1" stroke="#0f172a" stroke-width="1"/>
      <!-- Arms Hanging Holding Dumbbells -->
      <path d="M-28,25 Q-40,65 -38,105 L-48,105 Q-50,65 -38,25 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <path d="M28,25 Q40,65 38,105 L48,105 Q50,65 38,25 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <!-- Dumbbells Left & Right -->
      <!-- Left Dumbbell -->
      <rect x="-55" y="95" width="24" height="35" rx="4" fill="#334155" stroke="#f8fafc" stroke-width="1.5"/>
      <circle cx="-43" cy="112" r="14" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
      <!-- Right Dumbbell -->
      <rect x="31" y="95" width="24" height="35" rx="4" fill="#334155" stroke="#f8fafc" stroke-width="1.5"/>
      <circle cx="43" cy="112" r="14" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
      <!-- Head -->
      <ellipse cx="0" cy="0" rx="14" ry="16" fill="#f8fafc" stroke="#0f172a" stroke-width="1"/>
    </g>
    <text x="30" y="315" fill="#cbd5e1" font-family="-apple-system, sans-serif" font-size="11">✓ Stand tall with core braced, elbows tucked by ribs</text>
  </g>

  <!-- Step 2: Peak Curl Contraction -->
  <g transform="translate(480, 80)">
    <rect width="380" height="340" rx="10" fill="#182234" stroke="#334155" stroke-width="1.5"/>
    <text x="190" y="30" fill="#f59e0b" font-family="-apple-system, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">STEP 2: FULL CURL &amp; BICEP CONTRACTION</text>
    
    <g transform="translate(190, 60)">
      <ellipse cx="0" cy="225" rx="55" ry="10" fill="#000000" opacity="0.4"/>
      <!-- Legs -->
      <path d="M-22,110 L-22,215 L-35,215 L-35,110 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <path d="M22,110 L22,215 L35,215 L35,110 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <path d="M-30,95 L30,95 L25,120 L-25,120 Z" fill="#1e293b"/>
      <!-- Torso -->
      <path d="M-28,40 Q-32,70 -25,95 L25,95 Q32,70 28,40 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <path d="M-28,40 Q0,50 28,40 L24,20 L-24,20 Z" fill="#cbd5e1" stroke="#0f172a" stroke-width="1"/>
      
      <!-- Glowing Biceps -->
      <!-- Left Upper Arm & Curled Forearm -->
      <path d="M-28,25 Q-42,50 -40,75 L-30,75 Q-32,50 -20,25 Z" fill="#e2e8f0"/>
      <path d="M-40,75 L-32,35 L-20,40 L-28,75 Z" fill="#e2e8f0"/>
      <!-- Left Glowing Bicep Peak -->
      <ellipse cx="-33" cy="48" rx="10" ry="16" fill="url(#glowOrange)" filter="url(#glow)"/>
      <!-- Left Dumbbell near Shoulder -->
      <circle cx="-25" cy="30" r="14" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>

      <!-- Right Upper Arm & Curled Forearm -->
      <path d="M28,25 Q42,50 40,75 L30,75 Q32,50 20,25 Z" fill="#e2e8f0"/>
      <path d="M40,75 L32,35 L20,40 L28,75 Z" fill="#e2e8f0"/>
      <!-- Right Glowing Bicep Peak -->
      <ellipse cx="33" cy="48" rx="10" ry="16" fill="url(#glowOrange)" filter="url(#glow)"/>
      <!-- Right Dumbbell near Shoulder -->
      <circle cx="25" cy="30" r="14" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>

      <!-- Head -->
      <ellipse cx="0" cy="0" rx="14" ry="16" fill="#f8fafc" stroke="#0f172a" stroke-width="1"/>
    </g>
    <text x="30" y="315" fill="#cbd5e1" font-family="-apple-system, sans-serif" font-size="11">✓ Squeeze biceps at peak, control descent without swinging</text>
  </g>
</svg>`;

// 3. Kettlebell Swing Guide (ID 54)
const kettlebellSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" width="100%" height="100%">
  ${muscleGlowDefs}
  <rect width="900" height="480" fill="url(#bgGrad)"/>
  
  <text x="450" y="36" fill="#f8fafc" font-family="-apple-system, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" letter-spacing="1">KETTLEBELL SWING &amp; POSTERIOR CHAIN GUIDE</text>
  <text x="450" y="58" fill="#38bdf8" font-family="-apple-system, sans-serif" font-size="12" font-weight="600" text-anchor="middle">PRIMARY TARGET: Gluteus Maximus, Hamstrings, Erector Spinae, Core Bracing</text>

  <!-- Step 1: Hip Hinge -->
  <g transform="translate(40, 80)">
    <rect width="380" height="340" rx="10" fill="#182234" stroke="#334155" stroke-width="1.5"/>
    <text x="190" y="30" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">STEP 1: HIP HINGE &amp; BACK LOAD</text>
    
    <g transform="translate(190, 60)">
      <ellipse cx="0" cy="225" rx="55" ry="10" fill="#000000" opacity="0.4"/>
      <!-- Bent Hips & Knees -->
      <path d="M-30,105 Q-55,145 -35,215 L-50,215 Q-70,145 -45,105 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <path d="M20,105 Q-5,145 15,215 L0,215 Q-20,145 5,105 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <!-- Loaded Hamstrings Glow -->
      <path d="M-48,125 Q-60,165 -45,195 Q-40,165 -35,125 Z" fill="url(#glowOrange)" filter="url(#glow)"/>
      <!-- Hinged Torso (Tilted 45 degrees) -->
      <path d="M-35,105 Q-10,75 35,60 L45,75 Q0,95 -25,120 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <!-- Arms Hanging Holding Kettlebell between legs -->
      <path d="M35,65 Q10,105 -5,145 L5,145 Q20,105 45,75 Z" fill="#e2e8f0"/>
      <!-- Kettlebell -->
      <circle cx="0" cy="160" r="18" fill="#1e293b" stroke="#f59e0b" stroke-width="2.5"/>
      <path d="M-10,145 Q0,135 10,145" stroke="#94a3b8" stroke-width="3.5" fill="none"/>
      <!-- Head -->
      <ellipse cx="50" cy="50" rx="14" ry="14" fill="#f8fafc" stroke="#0f172a" stroke-width="1"/>
    </g>
    <text x="30" y="315" fill="#cbd5e1" font-family="-apple-system, sans-serif" font-size="11">✓ Hinge back at hips, keep spine neutral and shins vertical</text>
  </g>

  <!-- Step 2: Explosive Glute Snap -->
  <g transform="translate(480, 80)">
    <rect width="380" height="340" rx="10" fill="#182234" stroke="#334155" stroke-width="1.5"/>
    <text x="190" y="30" fill="#f59e0b" font-family="-apple-system, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">STEP 2: EXPLOSIVE GLUTE SNAP &amp; SWING</text>
    
    <g transform="translate(190, 60)">
      <ellipse cx="0" cy="225" rx="55" ry="10" fill="#000000" opacity="0.4"/>
      <!-- Straight Locked Legs with Glowing Glutes -->
      <path d="M-22,100 L-22,215 L-35,215 L-35,100 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <path d="M22,100 L22,215 L35,215 L35,100 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <!-- Glowing Glutes & Hamstrings -->
      <ellipse cx="-20" cy="110" rx="14" ry="18" fill="url(#glowOrange)" filter="url(#glow)"/>
      <ellipse cx="20" cy="110" rx="14" ry="18" fill="url(#glowOrange)" filter="url(#glow)"/>

      <!-- Upright Torso & Core Glow -->
      <path d="M-28,35 Q-32,65 -25,95 L25,95 Q32,65 28,35 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <path d="M-18,45 Q-22,70 -15,90 L15,90 Q22,70 18,45 Z" fill="url(#glowOrange)" filter="url(#glow)"/>

      <!-- Arms Extended Forward with Kettlebell Floating at Chest Height -->
      <path d="M0,35 Q40,30 75,35 L75,25 Q40,20 0,25 Z" fill="#e2e8f0"/>
      <!-- Floating Kettlebell -->
      <circle cx="95" cy="30" r="18" fill="#1e293b" stroke="#f59e0b" stroke-width="2.5"/>
      <path d="M75,25 Q85,15 95,25" stroke="#94a3b8" stroke-width="3.5" fill="none"/>

      <!-- Head -->
      <ellipse cx="0" cy="-5" rx="14" ry="16" fill="#f8fafc" stroke="#0f172a" stroke-width="1"/>
    </g>
    <text x="30" y="315" fill="#cbd5e1" font-family="-apple-system, sans-serif" font-size="11">✓ Drive hips forward powerfully; bell floats from hip momentum</text>
  </g>
</svg>`;

// 4. Selectorized V-Squat Machine Guide (ID 9)
const vSquatSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" width="100%" height="100%">
  ${muscleGlowDefs}
  <rect width="900" height="480" fill="url(#bgGrad)"/>
  
  <text x="450" y="36" fill="#f8fafc" font-family="-apple-system, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" letter-spacing="1">SELECTORIZED LEVER V-SQUAT MACHINE GUIDE</text>
  <text x="450" y="58" fill="#38bdf8" font-family="-apple-system, sans-serif" font-size="12" font-weight="600" text-anchor="middle">PRIMARY TARGET: Quadriceps (Vastus Medialis/Lateralis), Gluteus Maximus</text>

  <!-- Step 1: Unrack & Setup -->
  <g transform="translate(40, 80)">
    <rect width="380" height="340" rx="10" fill="#182234" stroke="#334155" stroke-width="1.5"/>
    <text x="190" y="30" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">STEP 1: SHOULDER PAD SETUP &amp; UNRACK</text>
    
    <!-- Machine Profile: Slanted Footplate, Pivoting Arm & Weight Tower -->
    <g transform="translate(80, 70)">
      <!-- Slanted Footplate -->
      <polygon points="20,200 120,180 120,195 20,215" fill="url(#metalGrad)" stroke="#475569" stroke-width="1.5"/>
      <!-- Base Frame & Pivot Hinge -->
      <line x1="120" y1="190" x2="220" y2="190" stroke="#334155" stroke-width="6"/>
      <circle cx="200" cy="170" r="10" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5"/>
      <!-- Weight Tower (Right) -->
      <rect x="210" y="20" width="40" height="175" rx="4" fill="url(#metalGrad)" stroke="#475569" stroke-width="1.5"/>
      <rect x="218" y="50" width="24" height="120" fill="#0f172a" stroke="#64748b" stroke-width="1"/>

      <!-- Pivoting Lever Arm & Red Back Pad -->
      <line x1="200" y1="170" x2="80" y2="40" stroke="#64748b" stroke-width="8"/>
      <rect x="90" y="55" width="22" height="75" rx="4" fill="url(#padGrad)" stroke="#f8fafc" stroke-width="1" transform="rotate(-40, 90, 55)"/>

      <!-- Lifter Standing Under Shoulder Pads -->
      <!-- Legs straight on slanted plate -->
      <path d="M70,185 L90,110 L105,110 L85,185 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <!-- Torso against back pad -->
      <path d="M90,110 L115,55 L130,62 L105,110 Z" fill="#cbd5e1" stroke="#0f172a" stroke-width="1"/>
      <!-- Shoulder under pad & Head -->
      <ellipse cx="120" cy="38" rx="10" ry="12" fill="#f8fafc" stroke="#0f172a" stroke-width="1"/>
    </g>
    <text x="30" y="315" fill="#cbd5e1" font-family="-apple-system, sans-serif" font-size="11">✓ Stand on angled plate, lock shoulders snugly under pads</text>
  </g>

  <!-- Step 2: Deep Squat & Drive -->
  <g transform="translate(480, 80)">
    <rect width="380" height="340" rx="10" fill="#182234" stroke="#334155" stroke-width="1.5"/>
    <text x="190" y="30" fill="#f59e0b" font-family="-apple-system, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">STEP 2: DEEP LEVER SQUAT &amp; QUAD DRIVE</text>
    
    <!-- Machine Profile at bottom of squat -->
    <g transform="translate(80, 70)">
      <!-- Slanted Footplate -->
      <polygon points="20,200 120,180 120,195 20,215" fill="url(#metalGrad)" stroke="#475569" stroke-width="1.5"/>
      <line x1="120" y1="190" x2="220" y2="190" stroke="#334155" stroke-width="6"/>
      <circle cx="200" cy="170" r="10" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5"/>
      <!-- Weight Tower -->
      <rect x="210" y="20" width="40" height="175" rx="4" fill="url(#metalGrad)" stroke="#475569" stroke-width="1.5"/>
      <rect x="218" y="50" width="24" height="120" fill="#0f172a" stroke="#64748b" stroke-width="1"/>

      <!-- Lowered Pivoting Lever Arm & Red Back Pad -->
      <line x1="200" y1="170" x2="70" y2="90" stroke="#64748b" stroke-width="8"/>
      <rect x="80" y="100" width="22" height="75" rx="4" fill="url(#padGrad)" stroke="#f8fafc" stroke-width="1" transform="rotate(-25, 80, 100)"/>

      <!-- Lifter in Deep Squat (90 degrees) with Glowing Quads -->
      <!-- Lower Legs -->
      <path d="M65,185 L50,135 L65,135 L80,185 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1"/>
      <!-- Thighs / Quads (Parallel to footplate, glowing orange) -->
      <path d="M50,135 L105,130 L110,145 L60,150 Z" fill="url(#glowOrange)" filter="url(#glow)" stroke="#0f172a" stroke-width="1"/>
      <!-- Glutes Glowing -->
      <circle cx="105" cy="140" r="14" fill="url(#glowOrange)" filter="url(#glow)"/>
      <!-- Torso -->
      <path d="M100,130 L115,85 L130,92 L110,135 Z" fill="#cbd5e1" stroke="#0f172a" stroke-width="1"/>
      <!-- Head -->
      <ellipse cx="120" cy="72" rx="10" ry="12" fill="#f8fafc" stroke="#0f172a" stroke-width="1"/>
    </g>
    <text x="30" y="315" fill="#cbd5e1" font-family="-apple-system, sans-serif" font-size="11">✓ Squat to 90°, keep knees in line with toes, drive through heels</text>
  </g>
</svg>`;

// Save all generated accurate vector artworks:
const guidesDir = path.join(root, 'frontend/src/assets/guides');
fs.writeFileSync(path.join(guidesDir, 'pickleball_court_guide.svg'), pickleballSvg, 'utf8');
fs.writeFileSync(path.join(guidesDir, 'dumbbell_curl_guide.svg'), dumbbellSvg, 'utf8');
fs.writeFileSync(path.join(guidesDir, 'kettlebell_swing_guide.svg'), kettlebellSvg, 'utf8');
fs.writeFileSync(path.join(guidesDir, 'v_squat_lever_guide.svg'), vSquatSvg, 'utf8');

console.log('Saved custom vector guides for Pickleball, Dumbbells, Kettlebells, and V-Squat!');
