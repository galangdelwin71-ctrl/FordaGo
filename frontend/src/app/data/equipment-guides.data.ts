// equipment-guides.data.ts
// Comprehensive English Exercise & Multi-Pose Guides for all 46 AFFORDA Gym Equipment

export interface ExerciseVariation {
  id: string;
  title: string;
  targetMuscle: string;
  secondaryMuscles: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  illustrationUrl: string;
  steps: string[];
  safetyWarnings: string[];
  recommendedSetsReps: string;
}

export interface EquipmentFullGuide {
  equipmentId: number;
  name: string;
  category: string;
  overview: string;
  weightScale?: string | null;
  status: string;
  primaryMuscle: string;
  muscles: string[];
  warning: string;
  variations: ExerciseVariation[];
}

export const EQUIPMENT_GUIDES_MAP: Record<number, EquipmentFullGuide> = {
  "9": {
    "equipmentId": 9,
    "name": "Selectorized Squat Machine",
    "category": "strength training equipment",
    "overview": "A specialized strength training machine (often part of a FreeMotion line, as indicated by the placard) designed to perform squats or lower-body pressing movements in a guided, supported posture. It typically features a back pad, a foot platform, and a weighted cable stack to safely load the quadriceps, glutes, and hamstrings.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Core & Full Body Strength",
    "muscles": [
      "Core",
      "Primary Target Muscles",
      "Stabilizers"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "standard_guide_9",
        "title": "Standard Execution & Form Guide",
        "targetMuscle": "Primary Machine Target",
        "secondaryMuscles": [
          "Core",
          "Stabilizers"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/squat_rack_squats.svg",
        "steps": [
          "Adjust seat, pads, or pins to suit your body height and comfortable range of motion.",
          "Select an appropriate starting weight using the safety pin on the weight stack.",
          "Assume an athletic, balanced posture with core braced and spine neutral.",
          "Execute the primary movement under smooth control without using momentum or swinging.",
          "Control the return phase for 2-3 seconds before beginning the next repetition."
        ],
        "safetyWarnings": [
          "Always inspect equipment pins, cables, and safety catches before loading heavy weights.",
          "Stop immediately if you experience joint pain or discomfort."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "10": {
    "equipmentId": 10,
    "name": "Shoulder Press Machine",
    "category": "Upper body and Strength training",
    "overview": "A strength-training machine that targets the shoulders, especially the deltoid muscles, while also engaging the triceps and upper chest.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Deltoids (Front, Side & Rear)",
    "muscles": [
      "Lateral Deltoids",
      "Anterior Deltoids",
      "Trapezius"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "overhead_shoulder_press",
        "title": "Overhead Shoulder Press Machine",
        "targetMuscle": "Anterior & Medial Deltoids",
        "secondaryMuscles": [
          "Triceps Brachii",
          "Upper Trapezius",
          "Core"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/shoulder_press_machine.svg",
        "steps": [
          "Adjust seat so handles start at ear / chin level.",
          "Sit back with spine neutral against the support pad.",
          "Grip handles with an overhand or neutral grip.",
          "Exhale and press handles overhead until arms are nearly straight.",
          "Lower with control for 2-3 seconds until hands return to ear level."
        ],
        "safetyWarnings": [
          "Do not over-arch your lower back off the pad during the press.",
          "Avoid locking out elbows violently at the top."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-12 Reps"
      }
    ]
  },
  "11": {
    "equipmentId": 11,
    "name": "Hip Abductor / Adductor Machine",
    "category": "lower body isolation or accessory machines",
    "overview": "A dual-function selectorized machine used to target the inner thighs (adductors) or outer thighs and hips (abductors). Users sit with their legs against or between padded levers, pushing outward or pulling inward depending on the targeted muscle group.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Core & Full Body Strength",
    "muscles": [
      "Core",
      "Primary Target Muscles",
      "Stabilizers"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "standard_guide_11",
        "title": "Standard Execution & Form Guide",
        "targetMuscle": "Primary Machine Target",
        "secondaryMuscles": [
          "Core",
          "Stabilizers"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/squat_rack_squats.svg",
        "steps": [
          "Adjust seat, pads, or pins to suit your body height and comfortable range of motion.",
          "Select an appropriate starting weight using the safety pin on the weight stack.",
          "Assume an athletic, balanced posture with core braced and spine neutral.",
          "Execute the primary movement under smooth control without using momentum or swinging.",
          "Control the return phase for 2-3 seconds before beginning the next repetition."
        ],
        "safetyWarnings": [
          "Always inspect equipment pins, cables, and safety catches before loading heavy weights.",
          "Stop immediately if you experience joint pain or discomfort."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "12": {
    "equipmentId": 12,
    "name": "Lat Pulldown Machine",
    "category": "Upper Body at Pull training",
    "overview": "A strength-training machine that targets the latissimus dorsi (lats) and helps develop the back, shoulders, and arms. It is commonly used to improve upper-body pulling strength and posture.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Latissimus Dorsi (Upper & Outer Back)",
    "muscles": [
      "Latissimus Dorsi",
      "Biceps Brachii",
      "Rhomboids",
      "Rear Delts"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "wide_grip_lat_pulldown",
        "title": "Wide-Grip Front Lat Pulldown",
        "targetMuscle": "Latissimus Dorsi (Width & V-Taper)",
        "secondaryMuscles": [
          "Teres Major",
          "Biceps Brachii",
          "Middle Trapezius"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/lat_pulldown_machine.svg",
        "steps": [
          "Secure your thighs snugly under the padded rollers so your feet stay flat on the floor.",
          "Grip the bar with an overhand grip slightly wider than shoulder-width.",
          "Lean back slightly (approx 10-15 degrees) and keep your chest lifted.",
          "Drive your elbows down and back, pulling the bar to your upper collarbone.",
          "Pause and contract your lats at the bottom, then extend smoothly back up over 3 seconds."
        ],
        "safetyWarnings": [
          "Never pull the bar behind your neck to protect the cervical spine and rotator cuff.",
          "Do not swing your whole torso back and forth to generate momentum."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-12 Reps"
      },
      {
        "id": "close_grip_underhand_pulldown",
        "title": "Underhand (Reverse) Lat Pulldown",
        "targetMuscle": "Lower Lats & Biceps Peak",
        "secondaryMuscles": [
          "Brachialis",
          "Rhomboids"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/lat_pulldown_machine.svg",
        "steps": [
          "Grip the bar with an underhand (supinated) grip at shoulder-width.",
          "Keep your chest high and pull the bar straight down to your lower chest.",
          "Keep your elbows tucked close to your ribs for maximum lower lat activation.",
          "Squeeze for 1 second, then control the negative stretch back up to full extension."
        ],
        "safetyWarnings": [
          "Avoid wrist bending; keep your wrists in neutral alignment with your forearms."
        ],
        "recommendedSetsReps": "3 Sets · 10-12 Reps"
      }
    ]
  },
  "13": {
    "equipmentId": 13,
    "name": "Selectorized Chest Press / Pectoral Machine",
    "category": "upper body push or chest isolation machines.",
    "overview": "A seated gym machine used to work the chest, shoulders, and triceps safely. It features an adjustable seat and dual handles that allow for a guided, stable pressing motion against a stack of weights.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Pectoralis Major (Mid & Lower Chest)",
    "muscles": [
      "Pectoralis Major",
      "Anterior Deltoids",
      "Triceps Brachii"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "machine_chest_press",
        "title": "Seated Machine Chest Press",
        "targetMuscle": "Pectoralis Major (Sternal Head)",
        "secondaryMuscles": [
          "Front Deltoids",
          "Triceps Brachii"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Adjust the seat height so the handles align directly with the middle of your chest.",
          "Plant both feet flat on the floor and brace your core.",
          "Retract and depress your shoulder blades against the backrest.",
          "Grip the handles firmly and press forward until arms are almost fully extended.",
          "Slowly lower the weight over 2 to 3 seconds until elbows reach a 90-degree angle."
        ],
        "safetyWarnings": [
          "Do not slam the weight stack at the bottom of the movement.",
          "Keep your wrists straight and aligned with your forearms."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      },
      {
        "id": "single_arm_chest_press",
        "title": "Iso-Lateral Single Arm Press",
        "targetMuscle": "Unilateral Pectoralis Isolation",
        "secondaryMuscles": [
          "Core Anti-Rotation",
          "Triceps"
        ],
        "difficulty": "Intermediate",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Sit centered in the machine and grasp only one handle.",
          "Brace your core to prevent your torso from twisting.",
          "Drive the single handle forward to peak contraction, pausing for 1 second.",
          "Slowly return the handle under tension for 3 seconds."
        ],
        "safetyWarnings": [
          "Maintain balanced spine alignment without shifting your hips."
        ],
        "recommendedSetsReps": "3 Sets · 10-12 Reps per side"
      }
    ]
  },
  "14": {
    "equipmentId": 14,
    "name": "Seated Calf Raise Machine",
    "category": "lower body isolation or lower leg accessory machine.",
    "overview": "A strength training machine designed to isolate and build the calf muscles (specifically the soleus). Users sit on the bench with the balls of their feet on a foot platform and a padded lever resting just above their knees to lift weighted resistance.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Soleus & Gastrocnemius (Calves)",
    "muscles": [
      "Soleus",
      "Gastrocnemius",
      "Achilles Tendon"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "seated_calf_raise",
        "title": "Seated Soleus Calf Raise",
        "targetMuscle": "Soleus Muscle (Deep Calf Muscle)",
        "secondaryMuscles": [
          "Gastrocnemius",
          "Plantaris"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/leg_press_machine.svg",
        "steps": [
          "Sit on the machine with balls of your feet on the edge of the footplate.",
          "Adjust thigh pads snugly over lower thighs just above your knees.",
          "Release the safety catch and lower your heels into a deep, full calf stretch.",
          "Drive through the balls of your feet to raise heels as high as possible.",
          "Hold the top peak contraction for 1 second before lowering slowly."
        ],
        "safetyWarnings": [
          "Do not bounce rapidly at the bottom stretch — pause for 1 second to eliminate tendon bounce."
        ],
        "recommendedSetsReps": "4 Sets · 15-20 Reps"
      }
    ]
  },
  "15": {
    "equipmentId": 15,
    "name": "Plate-Loaded Incline Chest Press Machine",
    "category": "upper body compound push machine.",
    "overview": "A heavy-duty, plate-loaded machine built by Precor. It targets the upper portion of the chest and the front shoulders, utilizing independent moving arms that allow for converging pressing motions.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Clavicular Pectoralis (Upper Chest)",
    "muscles": [
      "Upper Chest",
      "Anterior Deltoids",
      "Triceps Brachii"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "incline_chest_press",
        "title": "Incline Machine Chest Press",
        "targetMuscle": "Upper Chest (Clavicular Head)",
        "secondaryMuscles": [
          "Front Deltoids",
          "Triceps Brachii"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Adjust seat height so handles align with your upper chest / collarbone level.",
          "Retract and pin your shoulder blades firmly against the back pad.",
          "Grip handles with an overhand or neutral grip and plant feet flat on the floor.",
          "Exhale and press handles forward along the machine's natural upward converging path.",
          "Inhale and control the return for 2-3 seconds until you feel a deep stretch in the upper chest."
        ],
        "safetyWarnings": [
          "Do not let your shoulders roll forward at the peak of the press.",
          "Keep your lower back in its natural arch without excessive arching off the seat."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-12 Reps"
      }
    ]
  },
  "16": {
    "equipmentId": 16,
    "name": "Dumbell",
    "category": "Free Weights at Strength Training Equipment",
    "overview": "A versatile free-weight equipment used for strength training, muscle development, and various exercises targeting different parts of the body.",
    "weightScale": "5 10 15 20 26 30 32.5 35 37.5 40 42,5 45 50 55 60 95",
    "status": "available",
    "primaryMuscle": "Biceps Brachii & Forearms",
    "muscles": [
      "Biceps Brachii",
      "Brachialis",
      "Forearms"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "preacher_bicep_curl",
        "title": "Preacher Bicep Isolation Curl",
        "targetMuscle": "Biceps Brachii (Short & Long Head)",
        "secondaryMuscles": [
          "Brachialis",
          "Forearm Flexors"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bicep_curl_preacher.svg",
        "steps": [
          "Adjust seat so your armpits rest comfortably over the top of the slanted preacher pad.",
          "Place the back of your upper arms flat against the pad and grip the bar with underhand grip.",
          "Curl the weight upward toward your shoulders, squeezing biceps hard at the peak.",
          "Lower the weight smoothly over 3 seconds until arms are almost fully extended."
        ],
        "safetyWarnings": [
          "Do NOT hyperextend or bounce the weight at the bottom of the pad to protect your bicep tendons.",
          "Keep your torso still and avoid leaning back."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "17": {
    "equipmentId": 17,
    "name": "Seated Back Extension Machine",
    "category": "core or posterior chain isolation machine.",
    "overview": "A selectorized machine designed to strengthen the lower back muscles (erector spinae). Users sit and press their upper back/shoulders backward against a padded roller lever to safely load the lower spine.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Erector Spinae & Posterior Chain",
    "muscles": [
      "Erector Spinae (Lower Back)",
      "Gluteus Maximus",
      "Hamstrings"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "hyperextension_45",
        "title": "45-Degree Lower Back Hyperextension",
        "targetMuscle": "Erector Spinae & Gluteal Hinge",
        "secondaryMuscles": [
          "Hamstrings",
          "Core Stabilizers"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/kettlebell_swings.svg",
        "steps": [
          "Step onto the footplate and adjust thigh pad so it rests just below your hip crease.",
          "Cross your arms across your chest or place hands behind your head.",
          "Hinge forward at the hips, lowering your torso with a flat, neutral spine.",
          "Contract your glutes and lower back muscles to raise your torso in line with your legs.",
          "Pause at neutral alignment — do NOT hyperextend past parallel."
        ],
        "safetyWarnings": [
          "Do NOT aggressively arch or throw your upper body backward at the top.",
          "Keep your movement smooth and controlled throughout both phases."
        ],
        "recommendedSetsReps": "3 Sets · 12-15 Reps"
      }
    ]
  },
  "18": {
    "equipmentId": 18,
    "name": "Pickleball Court",
    "category": "Racquet Sports (Paddle Sports)",
    "overview": "A dedicated court designed for playing pickleball, providing a safe and spacious area for recreational play, practice, and fitness activities.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Cardiovascular Endurance & Agility",
    "muscles": [
      "Quads",
      "Calves",
      "Shoulders",
      "Core Agility"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "pickleball_dink_drive",
        "title": "Forehand Drive & Kitchen Dink Drill",
        "targetMuscle": "Cardio, Agility & Core Balance",
        "secondaryMuscles": [
          "Forearms",
          "Shoulder Rotators",
          "Legs"
        ],
        "difficulty": "All Levels",
        "illustrationUrl": "assets/guides/kettlebell_swings.svg",
        "steps": [
          "Stand in an athletic ready stance behind the non-volley zone (the Kitchen line).",
          "Keep knees soft and paddle out in front with a continental or eastern grip.",
          "Step into the ball with balanced footwork and stroke through with a low-to-high paddle path.",
          "Recover immediately to center court ready position."
        ],
        "safetyWarnings": [
          "Wear proper court shoes with lateral support to prevent ankle rolling.",
          "Stay hydrated and perform dynamic leg warm-ups before matches."
        ],
        "recommendedSetsReps": "20-30 Minute Structured Rally / Game"
      }
    ]
  },
  "19": {
    "equipmentId": 19,
    "name": "Squat Rack",
    "category": "Strength Training Equipment  (Free Weight Stations)",
    "overview": "A heavy-duty steel frame designed to safely support a barbell during heavy resistance training. It features adjustable hooks to hold the weight at varying heights and safety arms to catch the bar if a lift fails, allowing users to perform exercises like squats, overhead presses, and bench presses safely without a spotter.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Full Body Compound (Quads, Chest, Back)",
    "muscles": [
      "Quadriceps",
      "Glutes",
      "Chest",
      "Shoulders",
      "Core"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "smith_squat",
        "title": "Smith Machine Back Squat",
        "targetMuscle": "Quadriceps & Gluteus Maximus",
        "secondaryMuscles": [
          "Hamstrings",
          "Core Stabilizers",
          "Calves"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/squat_rack_squats.svg",
        "steps": [
          "Adjust the bar height to sit across your upper trapezius muscles.",
          "Position feet slightly forward of the bar line with feet shoulder-width apart.",
          "Rotate your wrists to unhook the safety latches from the track.",
          "Inhale and descend into a deep squat until thighs are parallel with the floor.",
          "Drive through your heels, exhaling at the top, and re-engage safety hooks when done."
        ],
        "safetyWarnings": [
          "Always set the bottom safety stopper catches at hip height before loading heavy weights.",
          "Never place the bar on your cervical vertebrae (neck bones); keep it on upper trap muscles."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-12 Reps"
      },
      {
        "id": "smith_incline_press",
        "title": "Smith Machine Incline Bench Press",
        "targetMuscle": "Upper Chest (Clavicular Pectoralis)",
        "secondaryMuscles": [
          "Front Deltoids",
          "Triceps"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Position an incline bench (30-45 degrees) directly in the center of the Smith rack.",
          "Lie back and grip the bar slightly wider than shoulder-width.",
          "Unhook the bar and lower it smoothly to your upper chest.",
          "Press the bar upward along the fixed track to full extension, squeezing upper pecs."
        ],
        "safetyWarnings": [
          "Make sure the bench is locked dead-center to ensure symmetrical pushing."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-10 Reps"
      }
    ]
  },
  "20": {
    "equipmentId": 20,
    "name": "Multi-Function Cable / Pulley Column",
    "category": "Strength Training Equipment",
    "overview": "A single-column adjustable cable machine with a pivoting arm and high-low pulley system. It is ideal for functional training, isolation exercises, and unilateral cable movements.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Multi-Angle Cable Isolation",
    "muscles": [
      "Chest",
      "Triceps",
      "Biceps",
      "Shoulders",
      "Core"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "cable_tricep_pushdown",
        "title": "Cable Rope Tricep Pushdown",
        "targetMuscle": "Triceps Brachii (Lateral & Long Head)",
        "secondaryMuscles": [
          "Forearm Brachioradialis",
          "Core"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/cable_tricep_pushdown.svg",
        "steps": [
          "Set the pulley to the highest notch and attach the double-rope attachment.",
          "Grip ropes with neutral grip and tuck your elbows tightly against your ribcage.",
          "Hinge slightly at hips with core braced and feet in an athletic stance.",
          "Push the rope straight down, spreading the ends apart at the bottom lockout for maximum squeeze.",
          "Control the upward return to a 90-degree elbow bend over 2 seconds."
        ],
        "safetyWarnings": [
          "Keep your elbows pinned in place — do not allow them to swing forward and backward.",
          "Do not hunch your shoulders or use whole-body momentum."
        ],
        "recommendedSetsReps": "3-4 Sets · 12-15 Reps"
      },
      {
        "id": "cable_chest_fly",
        "title": "Standing Cable Chest Fly",
        "targetMuscle": "Pectoralis Major & Sternal Head",
        "secondaryMuscles": [
          "Anterior Deltoids",
          "Biceps Short Head"
        ],
        "difficulty": "Intermediate",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Set both pulleys at shoulder or chest height with D-handles.",
          "Take a step forward into a staggered stance with chest high.",
          "With a slight bend in your elbows, bring handles together in front of your chest in a hugging motion.",
          "Squeeze your pecs hard for 1 second, then control the opening stretch back."
        ],
        "safetyWarnings": [
          "Keep your core tight and maintain an athletic forward lean without swaying."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "21": {
    "equipmentId": 21,
    "name": "Back Extension Bench",
    "category": "Strength Training Equipment (Core/Posterior Chain Stations)",
    "overview": "A specialized exercise station designed to strengthen the lower back, glutes, and hamstrings. Users lock their ankles beneath padded rollers and rest their thighs against the hip pads, allowing them to safely hinge at the waist and perform back extensions or side bends.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Erector Spinae & Posterior Chain",
    "muscles": [
      "Erector Spinae (Lower Back)",
      "Gluteus Maximus",
      "Hamstrings"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "hyperextension_45",
        "title": "45-Degree Lower Back Hyperextension",
        "targetMuscle": "Erector Spinae & Gluteal Hinge",
        "secondaryMuscles": [
          "Hamstrings",
          "Core Stabilizers"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/kettlebell_swings.svg",
        "steps": [
          "Step onto the footplate and adjust thigh pad so it rests just below your hip crease.",
          "Cross your arms across your chest or place hands behind your head.",
          "Hinge forward at the hips, lowering your torso with a flat, neutral spine.",
          "Contract your glutes and lower back muscles to raise your torso in line with your legs.",
          "Pause at neutral alignment — do NOT hyperextend past parallel."
        ],
        "safetyWarnings": [
          "Do NOT aggressively arch or throw your upper body backward at the top.",
          "Keep your movement smooth and controlled throughout both phases."
        ],
        "recommendedSetsReps": "3 Sets · 12-15 Reps"
      }
    ]
  },
  "22": {
    "equipmentId": 22,
    "name": "45-Degree Hyperextension / Back Extension Bench",
    "category": "Free Weight / Bodyweight Equipment (specifically classified as a Core / Posterior Chain Bench)",
    "overview": "A machine designed to strengthen the lower back, glutes, and hamstrings. The padded supports secure the hips/legs while the user performs controlled back extensions.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Erector Spinae & Posterior Chain",
    "muscles": [
      "Erector Spinae (Lower Back)",
      "Gluteus Maximus",
      "Hamstrings"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "hyperextension_45",
        "title": "45-Degree Lower Back Hyperextension",
        "targetMuscle": "Erector Spinae & Gluteal Hinge",
        "secondaryMuscles": [
          "Hamstrings",
          "Core Stabilizers"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/kettlebell_swings.svg",
        "steps": [
          "Step onto the footplate and adjust thigh pad so it rests just below your hip crease.",
          "Cross your arms across your chest or place hands behind your head.",
          "Hinge forward at the hips, lowering your torso with a flat, neutral spine.",
          "Contract your glutes and lower back muscles to raise your torso in line with your legs.",
          "Pause at neutral alignment — do NOT hyperextend past parallel."
        ],
        "safetyWarnings": [
          "Do NOT aggressively arch or throw your upper body backward at the top.",
          "Keep your movement smooth and controlled throughout both phases."
        ],
        "recommendedSetsReps": "3 Sets · 12-15 Reps"
      }
    ]
  },
  "23": {
    "equipmentId": 23,
    "name": "Olympic Power Rack / Squat Rack with Pull-Up Bar",
    "category": "Free Weight / Bodyweight Equipment",
    "overview": "A larger rack system for barbell strength training, including squats, bench press, deadlifts, and pull-ups. The multiple uprights and safety attachments allow different exercise setups and heights.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Full Body Compound (Quads, Chest, Back)",
    "muscles": [
      "Quadriceps",
      "Glutes",
      "Chest",
      "Shoulders",
      "Core"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "smith_squat",
        "title": "Smith Machine Back Squat",
        "targetMuscle": "Quadriceps & Gluteus Maximus",
        "secondaryMuscles": [
          "Hamstrings",
          "Core Stabilizers",
          "Calves"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/squat_rack_squats.svg",
        "steps": [
          "Adjust the bar height to sit across your upper trapezius muscles.",
          "Position feet slightly forward of the bar line with feet shoulder-width apart.",
          "Rotate your wrists to unhook the safety latches from the track.",
          "Inhale and descend into a deep squat until thighs are parallel with the floor.",
          "Drive through your heels, exhaling at the top, and re-engage safety hooks when done."
        ],
        "safetyWarnings": [
          "Always set the bottom safety stopper catches at hip height before loading heavy weights.",
          "Never place the bar on your cervical vertebrae (neck bones); keep it on upper trap muscles."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-12 Reps"
      },
      {
        "id": "smith_incline_press",
        "title": "Smith Machine Incline Bench Press",
        "targetMuscle": "Upper Chest (Clavicular Pectoralis)",
        "secondaryMuscles": [
          "Front Deltoids",
          "Triceps"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Position an incline bench (30-45 degrees) directly in the center of the Smith rack.",
          "Lie back and grip the bar slightly wider than shoulder-width.",
          "Unhook the bar and lower it smoothly to your upper chest.",
          "Press the bar upward along the fixed track to full extension, squeezing upper pecs."
        ],
        "safetyWarnings": [
          "Make sure the bench is locked dead-center to ensure symmetrical pushing."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-10 Reps"
      }
    ]
  },
  "24": {
    "equipmentId": 24,
    "name": "Hip Thrust Machine",
    "category": "Strength Training Equipment (Glute-Isolation/Lower Body)",
    "overview": "A strength-training machine designed to target and strengthen the glutes, while also engaging the hamstrings and core for improved lower-body strength.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Gluteus Maximus & Hamstrings",
    "muscles": [
      "Gluteus Maximus",
      "Hamstrings",
      "Core",
      "Adductors"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "machine_hip_thrust",
        "title": "Machine Glute Hip Thrust",
        "targetMuscle": "Gluteus Maximus Peak Contraction",
        "secondaryMuscles": [
          "Hamstrings",
          "Core Stabilizers"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/leg_press_machine.svg",
        "steps": [
          "Sit inside the machine and secure the padded waist belt or lever across your pelvic crease.",
          "Plant your feet shoulder-width apart on the footplate with shins vertical at top lockout.",
          "Drive through your heels to thrust hips upward until your torso and thighs form a straight line.",
          "Hold and squeeze your glutes hard for 2 full seconds at the top.",
          "Lower hips under control without letting the weight stack touch down between reps."
        ],
        "safetyWarnings": [
          "Keep your chin tucked and ribs down to avoid hyperextending your lumbar spine at the top.",
          "Drive purely through heels, not your toes."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-15 Reps"
      }
    ]
  },
  "25": {
    "equipmentId": 25,
    "name": "Preacher Curl Bench",
    "category": "Strength Training Equipment (Arm-Isolation Stations)",
    "overview": "A dedicated strength-training station designed to isolate and build the biceps. The user sits on the seat, rests their upper arms over the angled pad, and curls a barbell, EZ bar, or dumbbells, eliminating momentum to ensure full tension on the biceps.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Biceps Brachii & Forearms",
    "muscles": [
      "Biceps Brachii",
      "Brachialis",
      "Forearms"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "preacher_bicep_curl",
        "title": "Preacher Bicep Isolation Curl",
        "targetMuscle": "Biceps Brachii (Short & Long Head)",
        "secondaryMuscles": [
          "Brachialis",
          "Forearm Flexors"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bicep_curl_preacher.svg",
        "steps": [
          "Adjust seat so your armpits rest comfortably over the top of the slanted preacher pad.",
          "Place the back of your upper arms flat against the pad and grip the bar with underhand grip.",
          "Curl the weight upward toward your shoulders, squeezing biceps hard at the peak.",
          "Lower the weight smoothly over 3 seconds until arms are almost fully extended."
        ],
        "safetyWarnings": [
          "Do NOT hyperextend or bounce the weight at the bottom of the pad to protect your bicep tendons.",
          "Keep your torso still and avoid leaning back."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "26": {
    "equipmentId": 26,
    "name": "Plate-Loaded Lat Pulldown Machine",
    "category": "Strength Training Equipment (Upper Body Pulling Machine)",
    "overview": "A plate-loaded lat pulldown machine is a back-training station designed to target the latissimus dorsi muscles. The user sits facing the machine with their thighs locked under the padded rollers, reaches up to grab the handles, and pulls downward using a smooth, plate-loaded lever mechanism.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Latissimus Dorsi (Upper & Outer Back)",
    "muscles": [
      "Latissimus Dorsi",
      "Biceps Brachii",
      "Rhomboids",
      "Rear Delts"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "wide_grip_lat_pulldown",
        "title": "Wide-Grip Front Lat Pulldown",
        "targetMuscle": "Latissimus Dorsi (Width & V-Taper)",
        "secondaryMuscles": [
          "Teres Major",
          "Biceps Brachii",
          "Middle Trapezius"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/lat_pulldown_machine.svg",
        "steps": [
          "Secure your thighs snugly under the padded rollers so your feet stay flat on the floor.",
          "Grip the bar with an overhand grip slightly wider than shoulder-width.",
          "Lean back slightly (approx 10-15 degrees) and keep your chest lifted.",
          "Drive your elbows down and back, pulling the bar to your upper collarbone.",
          "Pause and contract your lats at the bottom, then extend smoothly back up over 3 seconds."
        ],
        "safetyWarnings": [
          "Never pull the bar behind your neck to protect the cervical spine and rotator cuff.",
          "Do not swing your whole torso back and forth to generate momentum."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-12 Reps"
      },
      {
        "id": "close_grip_underhand_pulldown",
        "title": "Underhand (Reverse) Lat Pulldown",
        "targetMuscle": "Lower Lats & Biceps Peak",
        "secondaryMuscles": [
          "Brachialis",
          "Rhomboids"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/lat_pulldown_machine.svg",
        "steps": [
          "Grip the bar with an underhand (supinated) grip at shoulder-width.",
          "Keep your chest high and pull the bar straight down to your lower chest.",
          "Keep your elbows tucked close to your ribs for maximum lower lat activation.",
          "Squeeze for 1 second, then control the negative stretch back up to full extension."
        ],
        "safetyWarnings": [
          "Avoid wrist bending; keep your wrists in neutral alignment with your forearms."
        ],
        "recommendedSetsReps": "3 Sets · 10-12 Reps"
      }
    ]
  },
  "27": {
    "equipmentId": 27,
    "name": "Plate-Loaded Seated Dip Machine",
    "category": "Strength Training Equipment (Upper Body Pushing/Pressing Machine)",
    "overview": "A strength-training station designed to target the triceps and chest. The user sits facing outward with their thighs anchored under the padded roller, grips the overhead dynamic handles, and pushes downwards using a leverage-driven mechanism loaded with weight plates.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Lats, Upper Chest & Triceps",
    "muscles": [
      "Lats",
      "Pectorals",
      "Triceps",
      "Shoulders"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "assisted_pullup",
        "title": "Assisted Wide-Grip Pull-Up",
        "targetMuscle": "Latissimus Dorsi & Upper Back",
        "secondaryMuscles": [
          "Biceps",
          "Forearms",
          "Core"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/lat_pulldown_machine.svg",
        "steps": [
          "Select the counterweight pin (more weight provides more assistance).",
          "Climb up and place your knees firmly on the counterweight pad.",
          "Grip the overhead handles with an overhand wide grip.",
          "Pull your chest up toward the handles by driving elbows downward.",
          "Pause with chin clearing the bar, then lower with control until arms are fully extended."
        ],
        "safetyWarnings": [
          "Step off the assist pad carefully one foot at a time to prevent the pad from snapping up.",
          "Keep core engaged to prevent lower-body swinging."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-10 Reps"
      },
      {
        "id": "assisted_dips",
        "title": "Assisted Parallel Bar Dips",
        "targetMuscle": "Triceps Brachii & Lower Chest",
        "secondaryMuscles": [
          "Anterior Deltoids",
          "Core"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/cable_tricep_pushdown.svg",
        "steps": [
          "Set the assist pad and grip the parallel dip handles.",
          "Place your knees on the assist pad and lock out your arms.",
          "Lower your body by bending elbows until they reach a 90-degree angle.",
          "Keep elbows tucked close to your ribs for tricep focus (or lean forward for chest focus).",
          "Press through your palms to return to full lockout at the top."
        ],
        "safetyWarnings": [
          "Do not descend lower than a 90-degree elbow bend to prevent shoulder strain.",
          "Avoid flaring your elbows wide outward."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-12 Reps"
      }
    ]
  },
  "28": {
    "equipmentId": 28,
    "name": "Seated Row Machine",
    "category": "Strength Training Equipment (Upper Body Pulling/Back Machine)",
    "overview": "Aback-training station designed to build upper back thickness, target the rhomboids, and engage the lats. The user sits facing forward with their chest braced against the vertical pad, places their feet on the footplates, and pulls the handles toward their torso in a smooth row movement.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Mid-Back, Rhomboids & Lat Thickness",
    "muscles": [
      "Rhomboids",
      "Middle & Lower Traps",
      "Latissimus Dorsi",
      "Biceps"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "seated_cable_row",
        "title": "Seated Cable Row (Close-Grip V-Bar)",
        "targetMuscle": "Middle Trapezius & Rhomboids",
        "secondaryMuscles": [
          "Latissimus Dorsi",
          "Biceps Brachii",
          "Erector Spinae"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/lat_pulldown_machine.svg",
        "steps": [
          "Sit on the bench, place feet securely on the footrests with knees slightly bent.",
          "Reach forward with a flat back and grip the V-handle attachment.",
          "Sit upright with spine neutral, chest proud, and shoulders pulled back.",
          "Pull the handle toward your navel, driving elbows past your torso.",
          "Pinch your shoulder blades together at peak contraction, then extend arms with control."
        ],
        "safetyWarnings": [
          "Do NOT round your lower back when reaching forward at full extension.",
          "Do NOT violently yank your torso backward to move heavy weight."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "29": {
    "equipmentId": 29,
    "name": "Dual Adjustable Pulley (Cable Crossover) Machine",
    "category": "Functional / Cable-Based Equipment",
    "overview": "A versatile cable machine featuring two weight stacks and adjustable pulleys. It can be used for an extensive variety of exercises targeting virtually every muscle group, including cable flies, rows, curls, and tricep pushdowns.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Multi-Angle Cable Isolation",
    "muscles": [
      "Chest",
      "Triceps",
      "Biceps",
      "Shoulders",
      "Core"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "cable_tricep_pushdown",
        "title": "Cable Rope Tricep Pushdown",
        "targetMuscle": "Triceps Brachii (Lateral & Long Head)",
        "secondaryMuscles": [
          "Forearm Brachioradialis",
          "Core"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/cable_tricep_pushdown.svg",
        "steps": [
          "Set the pulley to the highest notch and attach the double-rope attachment.",
          "Grip ropes with neutral grip and tuck your elbows tightly against your ribcage.",
          "Hinge slightly at hips with core braced and feet in an athletic stance.",
          "Push the rope straight down, spreading the ends apart at the bottom lockout for maximum squeeze.",
          "Control the upward return to a 90-degree elbow bend over 2 seconds."
        ],
        "safetyWarnings": [
          "Keep your elbows pinned in place — do not allow them to swing forward and backward.",
          "Do not hunch your shoulders or use whole-body momentum."
        ],
        "recommendedSetsReps": "3-4 Sets · 12-15 Reps"
      },
      {
        "id": "cable_chest_fly",
        "title": "Standing Cable Chest Fly",
        "targetMuscle": "Pectoralis Major & Sternal Head",
        "secondaryMuscles": [
          "Anterior Deltoids",
          "Biceps Short Head"
        ],
        "difficulty": "Intermediate",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Set both pulleys at shoulder or chest height with D-handles.",
          "Take a step forward into a staggered stance with chest high.",
          "With a slight bend in your elbows, bring handles together in front of your chest in a hugging motion.",
          "Squeeze your pecs hard for 1 second, then control the opening stretch back."
        ],
        "safetyWarnings": [
          "Keep your core tight and maintain an athletic forward lean without swaying."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "30": {
    "equipmentId": 30,
    "name": "Hack Squat Machine",
    "category": "Strength Training Equipment (Lower Body/Leg Machines)",
    "overview": "A lower-body training station designed to target the quadriceps, glutes, and hamstrings. The user stands on the angled footplate with their back rested against the pad and shoulders under the shoulder cushions, releasing the safety handles to perform guided, full-range squats.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Core & Full Body Strength",
    "muscles": [
      "Core",
      "Primary Target Muscles",
      "Stabilizers"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "standard_guide_30",
        "title": "Standard Execution & Form Guide",
        "targetMuscle": "Primary Machine Target",
        "secondaryMuscles": [
          "Core",
          "Stabilizers"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/squat_rack_squats.svg",
        "steps": [
          "Adjust seat, pads, or pins to suit your body height and comfortable range of motion.",
          "Select an appropriate starting weight using the safety pin on the weight stack.",
          "Assume an athletic, balanced posture with core braced and spine neutral.",
          "Execute the primary movement under smooth control without using momentum or swinging.",
          "Control the return phase for 2-3 seconds before beginning the next repetition."
        ],
        "safetyWarnings": [
          "Always inspect equipment pins, cables, and safety catches before loading heavy weights.",
          "Stop immediately if you experience joint pain or discomfort."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "31": {
    "equipmentId": 31,
    "name": "Power Rack / Squat Rack",
    "category": "Free Weight Equipment",
    "overview": "A heavy-duty rack used for squats, bench presses, overhead presses, and other barbell exercises. It has adjustable J-hooks and safety bars to support the barbell and improve training safety.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Full Body Compound (Quads, Chest, Back)",
    "muscles": [
      "Quadriceps",
      "Glutes",
      "Chest",
      "Shoulders",
      "Core"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "smith_squat",
        "title": "Smith Machine Back Squat",
        "targetMuscle": "Quadriceps & Gluteus Maximus",
        "secondaryMuscles": [
          "Hamstrings",
          "Core Stabilizers",
          "Calves"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/squat_rack_squats.svg",
        "steps": [
          "Adjust the bar height to sit across your upper trapezius muscles.",
          "Position feet slightly forward of the bar line with feet shoulder-width apart.",
          "Rotate your wrists to unhook the safety latches from the track.",
          "Inhale and descend into a deep squat until thighs are parallel with the floor.",
          "Drive through your heels, exhaling at the top, and re-engage safety hooks when done."
        ],
        "safetyWarnings": [
          "Always set the bottom safety stopper catches at hip height before loading heavy weights.",
          "Never place the bar on your cervical vertebrae (neck bones); keep it on upper trap muscles."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-12 Reps"
      },
      {
        "id": "smith_incline_press",
        "title": "Smith Machine Incline Bench Press",
        "targetMuscle": "Upper Chest (Clavicular Pectoralis)",
        "secondaryMuscles": [
          "Front Deltoids",
          "Triceps"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Position an incline bench (30-45 degrees) directly in the center of the Smith rack.",
          "Lie back and grip the bar slightly wider than shoulder-width.",
          "Unhook the bar and lower it smoothly to your upper chest.",
          "Press the bar upward along the fixed track to full extension, squeezing upper pecs."
        ],
        "safetyWarnings": [
          "Make sure the bench is locked dead-center to ensure symmetrical pushing."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-10 Reps"
      }
    ]
  },
  "32": {
    "equipmentId": 32,
    "name": "Plate-Loaded / Cable Functional Shoulder Machine",
    "category": "Functional / Cable-Based Equipment",
    "overview": "An adjustable functional training station (often associated with brands like FreeMotion) featuring swivel pulleys. It allows users to perform overhead presses, lateral raises, and multi-planar movements to target the shoulder complex.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Multi-Angle Cable Isolation",
    "muscles": [
      "Chest",
      "Triceps",
      "Biceps",
      "Shoulders",
      "Core"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "cable_tricep_pushdown",
        "title": "Cable Rope Tricep Pushdown",
        "targetMuscle": "Triceps Brachii (Lateral & Long Head)",
        "secondaryMuscles": [
          "Forearm Brachioradialis",
          "Core"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/cable_tricep_pushdown.svg",
        "steps": [
          "Set the pulley to the highest notch and attach the double-rope attachment.",
          "Grip ropes with neutral grip and tuck your elbows tightly against your ribcage.",
          "Hinge slightly at hips with core braced and feet in an athletic stance.",
          "Push the rope straight down, spreading the ends apart at the bottom lockout for maximum squeeze.",
          "Control the upward return to a 90-degree elbow bend over 2 seconds."
        ],
        "safetyWarnings": [
          "Keep your elbows pinned in place — do not allow them to swing forward and backward.",
          "Do not hunch your shoulders or use whole-body momentum."
        ],
        "recommendedSetsReps": "3-4 Sets · 12-15 Reps"
      },
      {
        "id": "cable_chest_fly",
        "title": "Standing Cable Chest Fly",
        "targetMuscle": "Pectoralis Major & Sternal Head",
        "secondaryMuscles": [
          "Anterior Deltoids",
          "Biceps Short Head"
        ],
        "difficulty": "Intermediate",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Set both pulleys at shoulder or chest height with D-handles.",
          "Take a step forward into a staggered stance with chest high.",
          "With a slight bend in your elbows, bring handles together in front of your chest in a hugging motion.",
          "Squeeze your pecs hard for 1 second, then control the opening stretch back."
        ],
        "safetyWarnings": [
          "Keep your core tight and maintain an athletic forward lean without swaying."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "33": {
    "equipmentId": 33,
    "name": "ISO-LATERAL PLATE-LOADED CHEST PRESS",
    "category": "Strength Training Equipment (Upper Body Pushing/Pressing Machine)",
    "overview": "The plate-loaded Iso-Lateral Row machine strengthens your back and shoulders by allowing you to sit forward and pull the handles independently using manual weight plates.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Pectoralis Major (Mid & Lower Chest)",
    "muscles": [
      "Pectoralis Major",
      "Anterior Deltoids",
      "Triceps Brachii"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "machine_chest_press",
        "title": "Seated Machine Chest Press",
        "targetMuscle": "Pectoralis Major (Sternal Head)",
        "secondaryMuscles": [
          "Front Deltoids",
          "Triceps Brachii"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Adjust the seat height so the handles align directly with the middle of your chest.",
          "Plant both feet flat on the floor and brace your core.",
          "Retract and depress your shoulder blades against the backrest.",
          "Grip the handles firmly and press forward until arms are almost fully extended.",
          "Slowly lower the weight over 2 to 3 seconds until elbows reach a 90-degree angle."
        ],
        "safetyWarnings": [
          "Do not slam the weight stack at the bottom of the movement.",
          "Keep your wrists straight and aligned with your forearms."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      },
      {
        "id": "single_arm_chest_press",
        "title": "Iso-Lateral Single Arm Press",
        "targetMuscle": "Unilateral Pectoralis Isolation",
        "secondaryMuscles": [
          "Core Anti-Rotation",
          "Triceps"
        ],
        "difficulty": "Intermediate",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Sit centered in the machine and grasp only one handle.",
          "Brace your core to prevent your torso from twisting.",
          "Drive the single handle forward to peak contraction, pausing for 1 second.",
          "Slowly return the handle under tension for 3 seconds."
        ],
        "safetyWarnings": [
          "Maintain balanced spine alignment without shifting your hips."
        ],
        "recommendedSetsReps": "3 Sets · 10-12 Reps per side"
      }
    ]
  },
  "34": {
    "equipmentId": 34,
    "name": "Seated Bicep Curl / Preacher Curl Machine",
    "category": "Selectorized or Plate-Loaded Strength Equipment",
    "overview": "A cable-driven selectorized machine equipped with an angled arm pad. It isolates the biceps, allowing users to perform curl movements with proper form while eliminating momentum from the rest of the body.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Biceps Brachii & Forearms",
    "muscles": [
      "Biceps Brachii",
      "Brachialis",
      "Forearms"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "preacher_bicep_curl",
        "title": "Preacher Bicep Isolation Curl",
        "targetMuscle": "Biceps Brachii (Short & Long Head)",
        "secondaryMuscles": [
          "Brachialis",
          "Forearm Flexors"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bicep_curl_preacher.svg",
        "steps": [
          "Adjust seat so your armpits rest comfortably over the top of the slanted preacher pad.",
          "Place the back of your upper arms flat against the pad and grip the bar with underhand grip.",
          "Curl the weight upward toward your shoulders, squeezing biceps hard at the peak.",
          "Lower the weight smoothly over 3 seconds until arms are almost fully extended."
        ],
        "safetyWarnings": [
          "Do NOT hyperextend or bounce the weight at the bottom of the pad to protect your bicep tendons.",
          "Keep your torso still and avoid leaning back."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "35": {
    "equipmentId": 35,
    "name": "Selectorized Chest Press Machine",
    "category": "Selectorized Strength Equipment",
    "overview": "A seated machine designed to target the pectoral muscles (chest), anterior deltoids (shoulders), and triceps. It allows users to press weight forward in a safe, guided, and stable path of motion.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Pectoralis Major (Mid & Lower Chest)",
    "muscles": [
      "Pectoralis Major",
      "Anterior Deltoids",
      "Triceps Brachii"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "machine_chest_press",
        "title": "Seated Machine Chest Press",
        "targetMuscle": "Pectoralis Major (Sternal Head)",
        "secondaryMuscles": [
          "Front Deltoids",
          "Triceps Brachii"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Adjust the seat height so the handles align directly with the middle of your chest.",
          "Plant both feet flat on the floor and brace your core.",
          "Retract and depress your shoulder blades against the backrest.",
          "Grip the handles firmly and press forward until arms are almost fully extended.",
          "Slowly lower the weight over 2 to 3 seconds until elbows reach a 90-degree angle."
        ],
        "safetyWarnings": [
          "Do not slam the weight stack at the bottom of the movement.",
          "Keep your wrists straight and aligned with your forearms."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      },
      {
        "id": "single_arm_chest_press",
        "title": "Iso-Lateral Single Arm Press",
        "targetMuscle": "Unilateral Pectoralis Isolation",
        "secondaryMuscles": [
          "Core Anti-Rotation",
          "Triceps"
        ],
        "difficulty": "Intermediate",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Sit centered in the machine and grasp only one handle.",
          "Brace your core to prevent your torso from twisting.",
          "Drive the single handle forward to peak contraction, pausing for 1 second.",
          "Slowly return the handle under tension for 3 seconds."
        ],
        "safetyWarnings": [
          "Maintain balanced spine alignment without shifting your hips."
        ],
        "recommendedSetsReps": "3 Sets · 10-12 Reps per side"
      }
    ]
  },
  "36": {
    "equipmentId": 36,
    "name": "ADJUSTABLE INCLINE WEIGHT BENCH",
    "category": "Free Weight Training Equipment (Core Fitness Stations)",
    "overview": "The adjustable incline weight bench supports your body at various angles, allowing you to perform dumbbell, barbell, or bodyweight exercises targeting different parts of your chest, shoulders, and arms.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Core & Full Body Strength",
    "muscles": [
      "Core",
      "Primary Target Muscles",
      "Stabilizers"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "standard_guide_36",
        "title": "Standard Execution & Form Guide",
        "targetMuscle": "Primary Machine Target",
        "secondaryMuscles": [
          "Core",
          "Stabilizers"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/squat_rack_squats.svg",
        "steps": [
          "Adjust seat, pads, or pins to suit your body height and comfortable range of motion.",
          "Select an appropriate starting weight using the safety pin on the weight stack.",
          "Assume an athletic, balanced posture with core braced and spine neutral.",
          "Execute the primary movement under smooth control without using momentum or swinging.",
          "Control the return phase for 2-3 seconds before beginning the next repetition."
        ],
        "safetyWarnings": [
          "Always inspect equipment pins, cables, and safety catches before loading heavy weights.",
          "Stop immediately if you experience joint pain or discomfort."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "37": {
    "equipmentId": 37,
    "name": "Dip / Leg Raise Station",
    "category": "Bodyweight Equipment",
    "overview": "A multi-function bodyweight station featuring padded armrests and a back support. It is commonly used for vertical knee/leg raises to target the abs and core, as well as parallel bar dips for working the chest, triceps, and shoulders.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Core & Full Body Strength",
    "muscles": [
      "Core",
      "Primary Target Muscles",
      "Stabilizers"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "standard_guide_37",
        "title": "Standard Execution & Form Guide",
        "targetMuscle": "Primary Machine Target",
        "secondaryMuscles": [
          "Core",
          "Stabilizers"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/squat_rack_squats.svg",
        "steps": [
          "Adjust seat, pads, or pins to suit your body height and comfortable range of motion.",
          "Select an appropriate starting weight using the safety pin on the weight stack.",
          "Assume an athletic, balanced posture with core braced and spine neutral.",
          "Execute the primary movement under smooth control without using momentum or swinging.",
          "Control the return phase for 2-3 seconds before beginning the next repetition."
        ],
        "safetyWarnings": [
          "Always inspect equipment pins, cables, and safety catches before loading heavy weights.",
          "Stop immediately if you experience joint pain or discomfort."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "38": {
    "equipmentId": 38,
    "name": "PIN-SELECTED STANDING LATERAL RAISE MACHINE",
    "category": "Strength Training Equipment (Shoulder-Isolation Machine)",
    "overview": "The pin-selected Standing Lateral Raise machine isolates and builds your side shoulders (lateral deltoids) by allowing you to stand and push the padded levers outward against a selectorized weight stack.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Deltoids (Front, Side & Rear)",
    "muscles": [
      "Lateral Deltoids",
      "Anterior Deltoids",
      "Trapezius"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "overhead_shoulder_press",
        "title": "Overhead Shoulder Press Machine",
        "targetMuscle": "Anterior & Medial Deltoids",
        "secondaryMuscles": [
          "Triceps Brachii",
          "Upper Trapezius",
          "Core"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/shoulder_press_machine.svg",
        "steps": [
          "Adjust seat so handles start at ear / chin level.",
          "Sit back with spine neutral against the support pad.",
          "Grip handles with an overhand or neutral grip.",
          "Exhale and press handles overhead until arms are nearly straight.",
          "Lower with control for 2-3 seconds until hands return to ear level."
        ],
        "safetyWarnings": [
          "Do not over-arch your lower back off the pad during the press.",
          "Avoid locking out elbows violently at the top."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-12 Reps"
      }
    ]
  },
  "39": {
    "equipmentId": 39,
    "name": "Leg Extension Machine",
    "category": "Selectorized Strength Equipment",
    "overview": "A machine that mainly targets the quadriceps (front thigh muscles). The user sits and extends the legs upward against the padded rollers.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Quadriceps & Hamstrings",
    "muscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "seated_leg_extension",
        "title": "Seated Leg Extension",
        "targetMuscle": "Quadriceps (Rectus Femoris Isolation)",
        "secondaryMuscles": [
          "Vastus Medialis (Teardrop)"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/leg_press_machine.svg",
        "steps": [
          "Adjust back pad so the pivot axis of the machine aligns directly with your knee joints.",
          "Position the lower shin pad just above your ankles.",
          "Grip the side handles firmly to keep your pelvis anchored to the seat.",
          "Extend your legs upward until knees are almost straight.",
          "Hold and squeeze your quads for 1 full second at peak contraction, then lower over 3 seconds."
        ],
        "safetyWarnings": [
          "Do not use jerky momentum or kick the weight up rapidly.",
          "Do not lift your hips off the seat pad during the extension."
        ],
        "recommendedSetsReps": "3-4 Sets · 12-15 Reps"
      },
      {
        "id": "seated_leg_curl",
        "title": "Seated Hamstring Curl",
        "targetMuscle": "Hamstrings (Biceps Femoris & Semitendinosus)",
        "secondaryMuscles": [
          "Gastrocnemius (Upper Calves)"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/leg_press_machine.svg",
        "steps": [
          "Sit with your back against the pad and lock the upper thigh stabilizer firmly over your quads.",
          "Place the back of your lower calves/Achilles tendon against the roller pad.",
          "Curl your legs downward and back under the seat as far as comfortable.",
          "Squeeze your hamstrings at full contraction, then control the return to starting position."
        ],
        "safetyWarnings": [
          "Ensure the thigh restraint is locked securely to prevent knees from lifting."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "40": {
    "equipmentId": 40,
    "name": "Shoulder Press Machine",
    "category": "Selectorized Strength Equipment",
    "overview": "A machine used to strengthen the shoulders and triceps. The user sits and pushes the handles upward to perform the shoulder press.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Deltoids (Front, Side & Rear)",
    "muscles": [
      "Lateral Deltoids",
      "Anterior Deltoids",
      "Trapezius"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "overhead_shoulder_press",
        "title": "Overhead Shoulder Press Machine",
        "targetMuscle": "Anterior & Medial Deltoids",
        "secondaryMuscles": [
          "Triceps Brachii",
          "Upper Trapezius",
          "Core"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/shoulder_press_machine.svg",
        "steps": [
          "Adjust seat so handles start at ear / chin level.",
          "Sit back with spine neutral against the support pad.",
          "Grip handles with an overhand or neutral grip.",
          "Exhale and press handles overhead until arms are nearly straight.",
          "Lower with control for 2-3 seconds until hands return to ear level."
        ],
        "safetyWarnings": [
          "Do not over-arch your lower back off the pad during the press.",
          "Avoid locking out elbows violently at the top."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-12 Reps"
      }
    ]
  },
  "41": {
    "equipmentId": 41,
    "name": "PEC FLY /REAR DELT MACHINE",
    "category": "Strength Training Equipment (Upper Body Dual-Isolation Machine)",
    "overview": "The Pec Fly / Rear Delt machine targets your chest or rear shoulders depending on which direction you sit, allowing you to fly your arms outward or inward against a cable weight system.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Pectoralis Major & Posterior Deltoids",
    "muscles": [
      "Chest",
      "Rear Deltoids",
      "Rhomboids",
      "Middle Traps"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "pec_deck_fly",
        "title": "Seated Pec Deck Fly",
        "targetMuscle": "Pectoralis Major (Inner Chest Squeeze)",
        "secondaryMuscles": [
          "Anterior Deltoids",
          "Biceps Short Head"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Adjust the seat so the horizontal handles/elbow pads sit at mid-chest height.",
          "Set the arm levers to the rear setting for a full pectoral stretch.",
          "Maintain a slight, fixed bend in your elbows throughout the movement.",
          "Bring your arms together in a wide hugging arc until handles touch in front of you.",
          "Squeeze your chest hard for 1 second, then control the opening stretch for 3 seconds."
        ],
        "safetyWarnings": [
          "Do not set the starting arms too far back to prevent anterior shoulder impingement.",
          "Do not bend and straighten your elbows during the movement — keep elbow angle locked."
        ],
        "recommendedSetsReps": "3-4 Sets · 12-15 Reps"
      },
      {
        "id": "reverse_rear_delt_fly",
        "title": "Reverse Machine Rear Delt Fly",
        "targetMuscle": "Posterior Deltoids & Rhomboids",
        "secondaryMuscles": [
          "Middle Trapezius",
          "Infraspinatus",
          "Teres Minor"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/lat_pulldown_machine.svg",
        "steps": [
          "Face inward toward the machine pad with your chest supported against the cushion.",
          "Adjust levers to the innermost pin setting.",
          "Grip the neutral or horizontal handles with palms facing each other.",
          "Pull your arms outward and back in a wide arc leading with your elbows.",
          "Squeeze your upper back and rear shoulders at peak contraction, then slowly return."
        ],
        "safetyWarnings": [
          "Do not shrug your shoulders up toward your ears; keep traps depressed.",
          "Avoid using momentum or leaning backward off the chest pad."
        ],
        "recommendedSetsReps": "3-4 Sets · 12-15 Reps"
      }
    ]
  },
  "42": {
    "equipmentId": 42,
    "name": "FUNCTIONAL TRAINER CABLE CROSSOVER MACHINE",
    "category": "Strength Training Equipment (Multi-Functional Cable System)",
    "overview": "The functional trainer cable crossover machine offers full-body versatility by allowing you to adjust the height of dual independent pulleys to perform various pulling, pushing, and rotational exercises.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Multi-Angle Cable Isolation",
    "muscles": [
      "Chest",
      "Triceps",
      "Biceps",
      "Shoulders",
      "Core"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "cable_tricep_pushdown",
        "title": "Cable Rope Tricep Pushdown",
        "targetMuscle": "Triceps Brachii (Lateral & Long Head)",
        "secondaryMuscles": [
          "Forearm Brachioradialis",
          "Core"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/cable_tricep_pushdown.svg",
        "steps": [
          "Set the pulley to the highest notch and attach the double-rope attachment.",
          "Grip ropes with neutral grip and tuck your elbows tightly against your ribcage.",
          "Hinge slightly at hips with core braced and feet in an athletic stance.",
          "Push the rope straight down, spreading the ends apart at the bottom lockout for maximum squeeze.",
          "Control the upward return to a 90-degree elbow bend over 2 seconds."
        ],
        "safetyWarnings": [
          "Keep your elbows pinned in place — do not allow them to swing forward and backward.",
          "Do not hunch your shoulders or use whole-body momentum."
        ],
        "recommendedSetsReps": "3-4 Sets · 12-15 Reps"
      },
      {
        "id": "cable_chest_fly",
        "title": "Standing Cable Chest Fly",
        "targetMuscle": "Pectoralis Major & Sternal Head",
        "secondaryMuscles": [
          "Anterior Deltoids",
          "Biceps Short Head"
        ],
        "difficulty": "Intermediate",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Set both pulleys at shoulder or chest height with D-handles.",
          "Take a step forward into a staggered stance with chest high.",
          "With a slight bend in your elbows, bring handles together in front of your chest in a hugging motion.",
          "Squeeze your pecs hard for 1 second, then control the opening stretch back."
        ],
        "safetyWarnings": [
          "Keep your core tight and maintain an athletic forward lean without swaying."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "43": {
    "equipmentId": 43,
    "name": "PLATE LOADED 45 DEGREE LEG PRESS MACHINE",
    "category": "Strength Training Equipment (Lower Body Compound Machines)",
    "overview": "The plate-loaded 45-degree leg press machine builds your quadriceps, glutes, and hamstrings by allowing you to lie back and push a heavily loaded footplate upward along a guided track.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Quadriceps, Glutes & Hamstrings",
    "muscles": [
      "Quadriceps",
      "Gluteus Maximus",
      "Hamstrings",
      "Calves"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "standard_leg_press",
        "title": "45° Standard Stance Leg Press",
        "targetMuscle": "Quadriceps (Vastus Medialis & Lateralis)",
        "secondaryMuscles": [
          "Gluteus Maximus",
          "Hamstrings",
          "Calves"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/leg_press_machine.svg",
        "steps": [
          "Sit back firmly against the back pad with your lower back flat against the cushion.",
          "Place feet shoulder-width apart in the center of the footplate with toes pointing slightly out.",
          "Release the safety side handles while extending your legs (do NOT lock knees completely).",
          "Inhale and lower the weight sled until your knees form a 90-degree angle.",
          "Exhale and drive powerfully through your heels to press the sled back up."
        ],
        "safetyWarnings": [
          "NEVER lock your knees out violently at the top — keep a soft micro-bend at all times.",
          "Do not allow your lower back/glutes to curl off the seat pad at the bottom."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-15 Reps"
      },
      {
        "id": "high_wide_leg_press",
        "title": "High & Wide Glute-Focused Press",
        "targetMuscle": "Gluteus Maximus & Hamstrings",
        "secondaryMuscles": [
          "Adductors",
          "Upper Quads"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/leg_press_machine.svg",
        "steps": [
          "Place your feet high on the footplate near the top edge, slightly wider than shoulder-width.",
          "Lower the sled until your hips and knees are deeply flexed.",
          "Drive through your heels to emphasize glute and hamstring contraction."
        ],
        "safetyWarnings": [
          "Always keep safety lock handles within reach during heavy sets."
        ],
        "recommendedSetsReps": "3-4 Sets · 12-15 Reps"
      }
    ]
  },
  "44": {
    "equipmentId": 44,
    "name": "SMITH MACHINE POWER RACK COMBO",
    "category": "Strength Training Equipment (Hybrid Multi-Station)",
    "overview": "The Smith machine power rack combo provides a safe, guided track for barbell squats and presses, featuring built-in safety catches and an overhead multi-grip pull-up bar.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Full Body Compound (Quads, Chest, Back)",
    "muscles": [
      "Quadriceps",
      "Glutes",
      "Chest",
      "Shoulders",
      "Core"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "smith_squat",
        "title": "Smith Machine Back Squat",
        "targetMuscle": "Quadriceps & Gluteus Maximus",
        "secondaryMuscles": [
          "Hamstrings",
          "Core Stabilizers",
          "Calves"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/squat_rack_squats.svg",
        "steps": [
          "Adjust the bar height to sit across your upper trapezius muscles.",
          "Position feet slightly forward of the bar line with feet shoulder-width apart.",
          "Rotate your wrists to unhook the safety latches from the track.",
          "Inhale and descend into a deep squat until thighs are parallel with the floor.",
          "Drive through your heels, exhaling at the top, and re-engage safety hooks when done."
        ],
        "safetyWarnings": [
          "Always set the bottom safety stopper catches at hip height before loading heavy weights.",
          "Never place the bar on your cervical vertebrae (neck bones); keep it on upper trap muscles."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-12 Reps"
      },
      {
        "id": "smith_incline_press",
        "title": "Smith Machine Incline Bench Press",
        "targetMuscle": "Upper Chest (Clavicular Pectoralis)",
        "secondaryMuscles": [
          "Front Deltoids",
          "Triceps"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Position an incline bench (30-45 degrees) directly in the center of the Smith rack.",
          "Lie back and grip the bar slightly wider than shoulder-width.",
          "Unhook the bar and lower it smoothly to your upper chest.",
          "Press the bar upward along the fixed track to full extension, squeezing upper pecs."
        ],
        "safetyWarnings": [
          "Make sure the bench is locked dead-center to ensure symmetrical pushing."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-10 Reps"
      }
    ]
  },
  "45": {
    "equipmentId": 45,
    "name": "Leg Press Machine",
    "category": "Strength Training Equipment (Lower-Body Resistance)",
    "overview": "A lower-body strength machine that mainly targets the thighs, glutes, and hamstrings. The user pushes the footplate away using the legs.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Quadriceps, Glutes & Hamstrings",
    "muscles": [
      "Quadriceps",
      "Gluteus Maximus",
      "Hamstrings",
      "Calves"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "standard_leg_press",
        "title": "45° Standard Stance Leg Press",
        "targetMuscle": "Quadriceps (Vastus Medialis & Lateralis)",
        "secondaryMuscles": [
          "Gluteus Maximus",
          "Hamstrings",
          "Calves"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/leg_press_machine.svg",
        "steps": [
          "Sit back firmly against the back pad with your lower back flat against the cushion.",
          "Place feet shoulder-width apart in the center of the footplate with toes pointing slightly out.",
          "Release the safety side handles while extending your legs (do NOT lock knees completely).",
          "Inhale and lower the weight sled until your knees form a 90-degree angle.",
          "Exhale and drive powerfully through your heels to press the sled back up."
        ],
        "safetyWarnings": [
          "NEVER lock your knees out violently at the top — keep a soft micro-bend at all times.",
          "Do not allow your lower back/glutes to curl off the seat pad at the bottom."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-15 Reps"
      },
      {
        "id": "high_wide_leg_press",
        "title": "High & Wide Glute-Focused Press",
        "targetMuscle": "Gluteus Maximus & Hamstrings",
        "secondaryMuscles": [
          "Adductors",
          "Upper Quads"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/leg_press_machine.svg",
        "steps": [
          "Place your feet high on the footplate near the top edge, slightly wider than shoulder-width.",
          "Lower the sled until your hips and knees are deeply flexed.",
          "Drive through your heels to emphasize glute and hamstring contraction."
        ],
        "safetyWarnings": [
          "Always keep safety lock handles within reach during heavy sets."
        ],
        "recommendedSetsReps": "3-4 Sets · 12-15 Reps"
      }
    ]
  },
  "46": {
    "equipmentId": 46,
    "name": "Assisted Pull-Up / Dip Machine",
    "category": "Strength Training Equipment (Upper-Body Compound & Calisthenics Progression)",
    "overview": "A machine designed to assist with pull-ups and dips. It helps strengthen the back, shoulders, chest, and arms while allowing the user to adjust the level of assistance.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Lats, Upper Chest & Triceps",
    "muscles": [
      "Lats",
      "Pectorals",
      "Triceps",
      "Shoulders"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "assisted_pullup",
        "title": "Assisted Wide-Grip Pull-Up",
        "targetMuscle": "Latissimus Dorsi & Upper Back",
        "secondaryMuscles": [
          "Biceps",
          "Forearms",
          "Core"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/lat_pulldown_machine.svg",
        "steps": [
          "Select the counterweight pin (more weight provides more assistance).",
          "Climb up and place your knees firmly on the counterweight pad.",
          "Grip the overhead handles with an overhand wide grip.",
          "Pull your chest up toward the handles by driving elbows downward.",
          "Pause with chin clearing the bar, then lower with control until arms are fully extended."
        ],
        "safetyWarnings": [
          "Step off the assist pad carefully one foot at a time to prevent the pad from snapping up.",
          "Keep core engaged to prevent lower-body swinging."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-10 Reps"
      },
      {
        "id": "assisted_dips",
        "title": "Assisted Parallel Bar Dips",
        "targetMuscle": "Triceps Brachii & Lower Chest",
        "secondaryMuscles": [
          "Anterior Deltoids",
          "Core"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/cable_tricep_pushdown.svg",
        "steps": [
          "Set the assist pad and grip the parallel dip handles.",
          "Place your knees on the assist pad and lock out your arms.",
          "Lower your body by bending elbows until they reach a 90-degree angle.",
          "Keep elbows tucked close to your ribs for tricep focus (or lean forward for chest focus).",
          "Press through your palms to return to full lockout at the top."
        ],
        "safetyWarnings": [
          "Do not descend lower than a 90-degree elbow bend to prevent shoulder strain.",
          "Avoid flaring your elbows wide outward."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-12 Reps"
      }
    ]
  },
  "47": {
    "equipmentId": 47,
    "name": "Barbell Rack",
    "category": "Free Weights (Strength Training Equipment)",
    "overview": "Organizational storage station designed to hold set-weight barbells (both straight and EZ-curl variations) at pre-determined weights. It allows users to quickly select and grab a fully assembled barbell for exercises like biceps curls, triceps extensions, and upright rows without needing to manually load plate weights.",
    "weightScale": "30 40 50 60 70 80 90 100 110",
    "status": "available",
    "primaryMuscle": "Biceps Brachii & Forearms",
    "muscles": [
      "Biceps Brachii",
      "Brachialis",
      "Forearms"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "preacher_bicep_curl",
        "title": "Preacher Bicep Isolation Curl",
        "targetMuscle": "Biceps Brachii (Short & Long Head)",
        "secondaryMuscles": [
          "Brachialis",
          "Forearm Flexors"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bicep_curl_preacher.svg",
        "steps": [
          "Adjust seat so your armpits rest comfortably over the top of the slanted preacher pad.",
          "Place the back of your upper arms flat against the pad and grip the bar with underhand grip.",
          "Curl the weight upward toward your shoulders, squeezing biceps hard at the peak.",
          "Lower the weight smoothly over 3 seconds until arms are almost fully extended."
        ],
        "safetyWarnings": [
          "Do NOT hyperextend or bounce the weight at the bottom of the pad to protect your bicep tendons.",
          "Keep your torso still and avoid leaning back."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "48": {
    "equipmentId": 48,
    "name": "Lat Pulldown Machine",
    "category": "Strength Training Equipment (Upper-Body Pulling & Back Isolation)",
    "overview": "A strength-training machine used to work the back, shoulders, and arms. The user pulls the handles downward toward the chest to strengthen the upper body.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Latissimus Dorsi (Upper & Outer Back)",
    "muscles": [
      "Latissimus Dorsi",
      "Biceps Brachii",
      "Rhomboids",
      "Rear Delts"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "wide_grip_lat_pulldown",
        "title": "Wide-Grip Front Lat Pulldown",
        "targetMuscle": "Latissimus Dorsi (Width & V-Taper)",
        "secondaryMuscles": [
          "Teres Major",
          "Biceps Brachii",
          "Middle Trapezius"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/lat_pulldown_machine.svg",
        "steps": [
          "Secure your thighs snugly under the padded rollers so your feet stay flat on the floor.",
          "Grip the bar with an overhand grip slightly wider than shoulder-width.",
          "Lean back slightly (approx 10-15 degrees) and keep your chest lifted.",
          "Drive your elbows down and back, pulling the bar to your upper collarbone.",
          "Pause and contract your lats at the bottom, then extend smoothly back up over 3 seconds."
        ],
        "safetyWarnings": [
          "Never pull the bar behind your neck to protect the cervical spine and rotator cuff.",
          "Do not swing your whole torso back and forth to generate momentum."
        ],
        "recommendedSetsReps": "3-4 Sets · 8-12 Reps"
      },
      {
        "id": "close_grip_underhand_pulldown",
        "title": "Underhand (Reverse) Lat Pulldown",
        "targetMuscle": "Lower Lats & Biceps Peak",
        "secondaryMuscles": [
          "Brachialis",
          "Rhomboids"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/lat_pulldown_machine.svg",
        "steps": [
          "Grip the bar with an underhand (supinated) grip at shoulder-width.",
          "Keep your chest high and pull the bar straight down to your lower chest.",
          "Keep your elbows tucked close to your ribs for maximum lower lat activation.",
          "Squeeze for 1 second, then control the negative stretch back up to full extension."
        ],
        "safetyWarnings": [
          "Avoid wrist bending; keep your wrists in neutral alignment with your forearms."
        ],
        "recommendedSetsReps": "3 Sets · 10-12 Reps"
      }
    ]
  },
  "49": {
    "equipmentId": 49,
    "name": "Low Row Machine",
    "category": "Strength Training Equipment (Upper Body Pulling/Back Machine)",
    "overview": "A back-training station designed to build upper back thickness and target the lats and rhomboids. The user sits on the extended bench, places their feet against the foot pegs, and pulls the overhead wide-grip bar toward their waist through a plate-loaded lever mechanism.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Mid-Back, Rhomboids & Lat Thickness",
    "muscles": [
      "Rhomboids",
      "Middle & Lower Traps",
      "Latissimus Dorsi",
      "Biceps"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "seated_cable_row",
        "title": "Seated Cable Row (Close-Grip V-Bar)",
        "targetMuscle": "Middle Trapezius & Rhomboids",
        "secondaryMuscles": [
          "Latissimus Dorsi",
          "Biceps Brachii",
          "Erector Spinae"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/lat_pulldown_machine.svg",
        "steps": [
          "Sit on the bench, place feet securely on the footrests with knees slightly bent.",
          "Reach forward with a flat back and grip the V-handle attachment.",
          "Sit upright with spine neutral, chest proud, and shoulders pulled back.",
          "Pull the handle toward your navel, driving elbows past your torso.",
          "Pinch your shoulder blades together at peak contraction, then extend arms with control."
        ],
        "safetyWarnings": [
          "Do NOT round your lower back when reaching forward at full extension.",
          "Do NOT violently yank your torso backward to move heavy weight."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "50": {
    "equipmentId": 50,
    "name": "Seated Chest Press Machine",
    "category": "Strength Training Equipment (Upper-Body Pushing & Chest Isolation)",
    "overview": "A strength-training machine designed to work the chest, shoulders, and triceps. The user sits on the padded seat and pushes the handles forward, then slowly returns them to the starting position. It helps improve upper-body strength and can be adjusted for different users and resistance levels.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Pectoralis Major (Mid & Lower Chest)",
    "muscles": [
      "Pectoralis Major",
      "Anterior Deltoids",
      "Triceps Brachii"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "machine_chest_press",
        "title": "Seated Machine Chest Press",
        "targetMuscle": "Pectoralis Major (Sternal Head)",
        "secondaryMuscles": [
          "Front Deltoids",
          "Triceps Brachii"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Adjust the seat height so the handles align directly with the middle of your chest.",
          "Plant both feet flat on the floor and brace your core.",
          "Retract and depress your shoulder blades against the backrest.",
          "Grip the handles firmly and press forward until arms are almost fully extended.",
          "Slowly lower the weight over 2 to 3 seconds until elbows reach a 90-degree angle."
        ],
        "safetyWarnings": [
          "Do not slam the weight stack at the bottom of the movement.",
          "Keep your wrists straight and aligned with your forearms."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      },
      {
        "id": "single_arm_chest_press",
        "title": "Iso-Lateral Single Arm Press",
        "targetMuscle": "Unilateral Pectoralis Isolation",
        "secondaryMuscles": [
          "Core Anti-Rotation",
          "Triceps"
        ],
        "difficulty": "Intermediate",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Sit centered in the machine and grasp only one handle.",
          "Brace your core to prevent your torso from twisting.",
          "Drive the single handle forward to peak contraction, pausing for 1 second.",
          "Slowly return the handle under tension for 3 seconds."
        ],
        "safetyWarnings": [
          "Maintain balanced spine alignment without shifting your hips."
        ],
        "recommendedSetsReps": "3 Sets · 10-12 Reps per side"
      }
    ]
  },
  "51": {
    "equipmentId": 51,
    "name": "Leg Extension / Leg Curl Machine",
    "category": "Strength Training Equipment (Lower-Body Isolation)",
    "overview": "A strength-training machine designed to target the quadriceps, hamstrings, and lower-leg muscles. It can be used for leg extension and leg curl exercises by adjusting the leg pad and position to perform controlled leg movements against resistance.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Quadriceps & Hamstrings",
    "muscles": [
      "Quadriceps",
      "Hamstrings",
      "Calves"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "seated_leg_extension",
        "title": "Seated Leg Extension",
        "targetMuscle": "Quadriceps (Rectus Femoris Isolation)",
        "secondaryMuscles": [
          "Vastus Medialis (Teardrop)"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/leg_press_machine.svg",
        "steps": [
          "Adjust back pad so the pivot axis of the machine aligns directly with your knee joints.",
          "Position the lower shin pad just above your ankles.",
          "Grip the side handles firmly to keep your pelvis anchored to the seat.",
          "Extend your legs upward until knees are almost straight.",
          "Hold and squeeze your quads for 1 full second at peak contraction, then lower over 3 seconds."
        ],
        "safetyWarnings": [
          "Do not use jerky momentum or kick the weight up rapidly.",
          "Do not lift your hips off the seat pad during the extension."
        ],
        "recommendedSetsReps": "3-4 Sets · 12-15 Reps"
      },
      {
        "id": "seated_leg_curl",
        "title": "Seated Hamstring Curl",
        "targetMuscle": "Hamstrings (Biceps Femoris & Semitendinosus)",
        "secondaryMuscles": [
          "Gastrocnemius (Upper Calves)"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/leg_press_machine.svg",
        "steps": [
          "Sit with your back against the pad and lock the upper thigh stabilizer firmly over your quads.",
          "Place the back of your lower calves/Achilles tendon against the roller pad.",
          "Curl your legs downward and back under the seat as far as comfortable.",
          "Squeeze your hamstrings at full contraction, then control the return to starting position."
        ],
        "safetyWarnings": [
          "Ensure the thigh restraint is locked securely to prevent knees from lifting."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      }
    ]
  },
  "52": {
    "equipmentId": 52,
    "name": "Chest Press Machine",
    "category": "Strength Training Equipment (Upper-Body Pushing & Chest Compound)",
    "overview": "A strength-training machine designed to target the chest (pectorals), shoulders, and triceps. The user sits on the padded seat and pushes the handles forward against resistance to perform a chest-press movement.",
    "weightScale": null,
    "status": "available",
    "primaryMuscle": "Pectoralis Major (Mid & Lower Chest)",
    "muscles": [
      "Pectoralis Major",
      "Anterior Deltoids",
      "Triceps Brachii"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "machine_chest_press",
        "title": "Seated Machine Chest Press",
        "targetMuscle": "Pectoralis Major (Sternal Head)",
        "secondaryMuscles": [
          "Front Deltoids",
          "Triceps Brachii"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Adjust the seat height so the handles align directly with the middle of your chest.",
          "Plant both feet flat on the floor and brace your core.",
          "Retract and depress your shoulder blades against the backrest.",
          "Grip the handles firmly and press forward until arms are almost fully extended.",
          "Slowly lower the weight over 2 to 3 seconds until elbows reach a 90-degree angle."
        ],
        "safetyWarnings": [
          "Do not slam the weight stack at the bottom of the movement.",
          "Keep your wrists straight and aligned with your forearms."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      },
      {
        "id": "single_arm_chest_press",
        "title": "Iso-Lateral Single Arm Press",
        "targetMuscle": "Unilateral Pectoralis Isolation",
        "secondaryMuscles": [
          "Core Anti-Rotation",
          "Triceps"
        ],
        "difficulty": "Intermediate",
        "illustrationUrl": "assets/guides/bench_press_flat.svg",
        "steps": [
          "Sit centered in the machine and grasp only one handle.",
          "Brace your core to prevent your torso from twisting.",
          "Drive the single handle forward to peak contraction, pausing for 1 second.",
          "Slowly return the handle under tension for 3 seconds."
        ],
        "safetyWarnings": [
          "Maintain balanced spine alignment without shifting your hips."
        ],
        "recommendedSetsReps": "3 Sets · 10-12 Reps per side"
      }
    ]
  },
  "53": {
    "equipmentId": 53,
    "name": "Bumper Plate Rack",
    "category": "Strength Training Equipment (Upper Body Pulling/Back Machine)",
    "overview": "Low-profile floor storage unit designed with slots to keep rubber bumper plates organized, upright, and easy to roll in and out. It allows lifters to quickly access and transport heavy plates for Olympic weightlifting, powerlifting, or functional fitness workouts without heavy lifting off a wall tree.",
    "weightScale": "10 20 25 30 35 40 45 50",
    "status": "available",
    "primaryMuscle": "Full Body & Grip Strength",
    "muscles": [
      "Shoulders",
      "Core",
      "Forearms",
      "Trapezius"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "plate_gto",
        "title": "Plate Ground-to-Overhead",
        "targetMuscle": "Deltoids & Quadriceps",
        "secondaryMuscles": [
          "Core",
          "Hamstrings",
          "Upper Trapezius"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/shoulder_press_machine.svg",
        "steps": [
          "Stand over a bumper plate with feet shoulder-width apart.",
          "Squat down with a straight back and grip the sides of the plate at 9 and 3 o'clock.",
          "Drive through your legs and pull the plate upward past your chest.",
          "Rotate your wrists smoothly and press the plate directly overhead into full lockout.",
          "Lower with control back to the chest, then to the floor."
        ],
        "safetyWarnings": [
          "Keep the plate close to your body midline during the upward trajectory.",
          "Maintain a braced core to protect the lumbar spine at full overhead extension."
        ],
        "recommendedSetsReps": "3-4 Sets · 12-15 Reps"
      },
      {
        "id": "plate_pinch_carry",
        "title": "Plate Pinch Farmer Walk",
        "targetMuscle": "Forearm Flexors & Grip Strength",
        "secondaryMuscles": [
          "Trapezius",
          "Core Stabilizers",
          "Calves"
        ],
        "difficulty": "Intermediate",
        "illustrationUrl": "assets/guides/kettlebell_swings.svg",
        "steps": [
          "Pinch two smooth bumper plates together with your fingers on one side and thumb on the other.",
          "Stand tall with shoulders retracted and chest up.",
          "Walk with controlled, even strides across a 20-30 meter distance.",
          "Keep your torso upright and prevent any side-to-side tilting or swinging.",
          "Carefully set the plates down before your grip completely gives out."
        ],
        "safetyWarnings": [
          "Keep clear of other lifters and ensure the floor path is free of obstacles.",
          "Wear closed-toe training shoes to protect your feet in case of accidental drops."
        ],
        "recommendedSetsReps": "3-4 Rounds · 30-45 Seconds Walk"
      }
    ]
  },
  "54": {
    "equipmentId": 54,
    "name": "Kettlebells",
    "category": "Strength Training Equipment (Upper Body Pulling/Back Machine)",
    "overview": "Cast-iron or rubber-coated free weights with a single top handle, designed for dynamic strength and cardio exercises such as swings, snatches, goblet squats, and Turkish get-ups. Because their center of mass extends beyond the hand, they engage stabilizing muscles and enhance grip strength, core stability, and overall power.",
    "weightScale": "5 10 15 20 25",
    "status": "available",
    "primaryMuscle": "Glutes, Hamstrings & Shoulders",
    "muscles": [
      "Glutes",
      "Hamstrings",
      "Lower Back",
      "Core",
      "Shoulders"
    ],
    "warning": "Warm up thoroughly before beginning. Inspect pins and cable alignment. Do not drop weights.",
    "variations": [
      {
        "id": "kb_swing",
        "title": "Russian Kettlebell Swing",
        "targetMuscle": "Gluteus Maximus & Hamstrings",
        "secondaryMuscles": [
          "Core Bracing",
          "Latissimus Dorsi",
          "Forearms"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/kettlebell_swings.svg",
        "steps": [
          "Stand with feet shoulder-width apart, kettlebell placed 1 foot in front of you.",
          "Hinge at your hips with a flat back and grip the handle with both hands.",
          "Hike the kettlebell back between your thighs like a football snap.",
          "Explosively snap your hips forward and squeeze glutes to drive the bell to chest height.",
          "Let the bell arc naturally back down and hinge immediately into the next rep."
        ],
        "safetyWarnings": [
          "Do NOT squat the weight; this is a pure hip-hinge movement.",
          "Do NOT lift with your arms or round your lower back at the bottom of the swing."
        ],
        "recommendedSetsReps": "3-4 Sets · 12-15 Reps"
      },
      {
        "id": "kb_goblet_squat",
        "title": "Goblet Squat",
        "targetMuscle": "Quadriceps & Glutes",
        "secondaryMuscles": [
          "Core",
          "Upper Back",
          "Calves"
        ],
        "difficulty": "Beginner",
        "illustrationUrl": "assets/guides/squat_rack_squats.svg",
        "steps": [
          "Hold the kettlebell by the horns close against your upper chest.",
          "Set your stance with feet slightly wider than shoulders, toes angled out 15-30 degrees.",
          "Inhale deeply and descend between your hips until thighs break parallel.",
          "Keep your elbows inside your knees to prevent knee valgus (knees caving in).",
          "Drive through the whole foot and exhale at the top lockout."
        ],
        "safetyWarnings": [
          "Keep chest proud and elbows tucked — do not let the weight pull your torso forward.",
          "Keep heels firmly planted on the floor throughout the entire movement."
        ],
        "recommendedSetsReps": "3-4 Sets · 10-12 Reps"
      },
      {
        "id": "kb_clean_press",
        "title": "Single-Arm Clean & Press",
        "targetMuscle": "Deltoids & Trapezius",
        "secondaryMuscles": [
          "Triceps",
          "Core",
          "Glutes"
        ],
        "difficulty": "Intermediate",
        "illustrationUrl": "assets/guides/shoulder_press_machine.svg",
        "steps": [
          "Hinge down and grip the kettlebell with one hand in an overhand grip.",
          "Drive through your hips to clean the bell smoothly into the rack position at shoulder height.",
          "Brace your core, take a breath, and press the bell overhead in a smooth vertical path.",
          "Lock out the arm with bicep next to your ear.",
          "Lower under control back to the rack position, then hinge down to restart."
        ],
        "safetyWarnings": [
          "Do not hyperextend your lower back during the overhead pressing portion.",
          "Guide the kettlebell gently around your forearm to avoid slapping your wrist."
        ],
        "recommendedSetsReps": "3 Sets · 8-10 Reps each side"
      }
    ]
  }
};

export const ALL_EQUIPMENT_GUIDES: EquipmentFullGuide[] = Object.values(EQUIPMENT_GUIDES_MAP);
