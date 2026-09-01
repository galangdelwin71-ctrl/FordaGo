const fs = require('fs');
const path = require('path');

const root = 'c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo';
const serverEquip = JSON.parse(fs.readFileSync('C:/Users/delwi/.gemini/antigravity-ide/brain/13e57574-9b61-4ae6-88cd-5b4f45cab5ae/scratch/server_equipment.json', 'utf8'));

const guideMapping = {
  9: { guide: 'guide_id9_white_vsquat.jpg', target: 'Quadriceps, Gluteus Maximus', desc: 'Pin-loaded lever V-squat with angled footplate and shoulder pads.' },
  10: { guide: 'guide_id10_white_shoulder_press.jpg', target: 'Anterior & Medial Deltoids, Triceps', desc: 'Star Trac overhead seated shoulder press machine.' },
  11: { guide: 'guide_id11_white_hip_abductor.jpg', target: 'Gluteus Medius, Outer Thighs', desc: 'Selectorized hip abductor & adductor swivel thigh machine.' },
  12: { guide: 'guide_id12_white_lat_pulldown.jpg', target: 'Latissimus Dorsi, Biceps', desc: 'Freemotion overhead wide grip lat pulldown station.' },
  13: { guide: 'guide_id35_seated_chest_press.jpg', target: 'Pectoralis Major, Front Delts', desc: 'Selectorized seated horizontal chest press machine.' },
  14: { guide: 'seatedCalfRaise.jpg', target: 'Soleus, Gastrocnemius', desc: 'Warrior Fitness plate-loaded seated calf raise machine.' },
  15: { guide: 'guide_id35_seated_chest_press.jpg', target: 'Upper Pectoralis, Anterior Delts', desc: 'Precor plate-loaded incline chest press machine.' },
  16: { guide: 'guide_id16_dumbbells.jpg', target: 'Biceps Brachii, Forearm Flexors', desc: 'Commercial dumbbell rack free weights.' },
  17: { guide: 'hyperextension.jpg', target: 'Erector Spinae, Lower Back', desc: 'Commercial seated back extension machine.' },
  18: { guide: 'guide_id18_pickleball.jpg', target: 'Dynamic Agility, Lateral Footwork, Core', desc: 'Regulation indoor pickleball and badminton court.' },
  19: { guide: 'squatRack.jpg', target: 'Quadriceps, Gluteus Maximus, Core', desc: 'Heavy-duty open barbell squat rack.' },
  20: { guide: 'cableCrossover.jpg', target: 'Pectoralis Major, Anterior Deltoids', desc: 'Freemotion dual cable column with rotating swivel arms.' },
  21: { guide: 'hyperextension.jpg', target: 'Erector Spinae, Gluteals, Hamstrings', desc: 'Adjustable back extension and glute-ham bench.' },
  22: { guide: 'hyperextension.jpg', target: 'Lower Back Muscles, Gluteals', desc: '45-degree Roman chair hyperextension bench.' },
  23: { guide: 'squatRack.jpg', target: 'Full Lower Body, Upper Back', desc: 'Olympic 4-post power cage with pull-up bar.' },
  24: { guide: 'hipThrust.jpg', target: 'Gluteus Maximus, Hamstrings', desc: 'Commercial plate-loaded glute drive hip thrust machine.' },
  25: { guide: 'preacherCurl.jpg', target: 'Biceps Brachii (Short Head)', desc: 'Body-Solid slanted preacher arm curl bench.' },
  26: { guide: 'guide_id12_white_lat_pulldown.jpg', target: 'Latissimus Dorsi, Rhomboids', desc: 'Commercial plate-loaded iso-lateral lat pulldown machine.' },
  27: { guide: 'guide_id12_white_lat_pulldown.jpg', target: 'Latissimus Dorsi, Upper Back', desc: 'Plate-loaded iso-lateral high pulldown station.' },
  28: { guide: 'seatedRow.jpg', target: 'Middle Trapezius, Rhomboids, Lats', desc: 'Precor iso-lateral plate-loaded seated low row machine.' },
  29: { guide: 'cableCrossover.jpg', target: 'Pectoralis Major, Sternal Head', desc: 'Dual stack adjustable cable crossover machine.' },
  30: { guide: 'hackSquat.jpg', target: 'Quadriceps, Gluteus Maximus', desc: 'Heavy-duty 45-degree plate-loaded linear hack squat sled.' },
  31: { guide: 'squatRack.jpg', target: 'Quadriceps, Glutes, Spinal Erectors', desc: 'Full commercial power rack cage with weight storage.' },
  32: { guide: 'guide_id10_white_shoulder_press.jpg', target: 'Deltoid Group, Upper Trapezius', desc: 'Plate-loaded dual lever functional shoulder machine.' },
  33: { guide: 'guide_id35_seated_chest_press.jpg', target: 'Pectoralis Major, Anterior Delts', desc: 'Commercial iso-lateral plate-loaded flat/incline chest press.' },
  34: { guide: 'preacherCurl.jpg', target: 'Biceps Brachii, Brachialis', desc: 'Selectorized pin-stack seated bicep curl machine.' },
  35: { guide: 'guide_id35_seated_chest_press.jpg', target: 'Pectoralis Major, Triceps', desc: 'Selectorized pin-loaded seated chest press machine.' },
  36: { guide: 'guide_id35_seated_chest_press.jpg', target: 'Upper & Mid Pectorals', desc: 'Multi-position commercial adjustable workout bench.' },
  37: { guide: 'captainsChair.jpg', target: 'Rectus Abdominis, Triceps (Dips)', desc: "Captain's chair vertical knee raise and dip station." },
  38: { guide: 'standingLateralRaise.jpg', target: 'Lateral Deltoids (Side Delts)', desc: 'Selectorized standing lateral raise machine.' },
  39: { guide: 'legExtension.jpg', target: 'Quadriceps (Rectus Femoris)', desc: 'Star Trac Instinct selectorized leg extension machine.' },
  40: { guide: 'guide_id10_white_shoulder_press.jpg', target: 'Anterior & Medial Deltoids', desc: 'Selectorized shoulder press machine with dual grip handles.' },
  41: { guide: 'pecFly.jpg', target: 'Pectoralis Major, Rear Delts', desc: 'Commercial overhead swivel-arm pec fly & rear delt machine.' },
  42: { guide: 'cableCrossover.jpg', target: 'Full Body Functional Cable Movements', desc: 'Dual pulley functional cable trainer.' },
  43: { guide: 'legPress45.jpg', target: 'Quadriceps, Gluteal Complex, Hamstrings', desc: 'Plate-loaded 45-degree leg press machine.' },
  44: { guide: 'squatRack.jpg', target: 'Guided Barbell Squats, Presses', desc: 'Commercial Smith machine guided barbell rack.' },
  45: { guide: 'legPress45.jpg', target: 'Quadriceps, Gluteus Maximus, Calves', desc: 'Commercial heavy-duty incline sled leg press machine.' },
  46: { guide: 'guide_id12_white_lat_pulldown.jpg', target: 'Latissimus Dorsi, Biceps', desc: 'Star Trac Instinct high lat pulldown machine.' },
  47: { guide: 'guide_id47_ezbar_curl.jpg', target: 'Biceps Brachii, Forearms', desc: 'Barbell rack with fixed-weight EZ curl barbells.' },
  48: { guide: 'guide_id35_seated_chest_press.jpg', target: 'Pectoralis Major, Anterior Deltoids', desc: 'Star Trac Instinct seated chest press machine.' },
  49: { guide: 'seatedRow.jpg', target: 'Latissimus Dorsi, Rhomboids, Middle Back', desc: 'Plate-loaded seated low row bench with foot braces.' },
  50: { guide: 'guide_id10_white_shoulder_press.jpg', target: 'Anterior & Medial Deltoids, Triceps', desc: 'Star Trac Instinct seated shoulder press machine.' },
  51: { guide: 'legExtension.jpg', target: 'Quadriceps, Calves', desc: 'Freemotion cable dual leg extension / calf machine.' },
  52: { guide: 'guide_id52_flat_chest_press.jpg', target: 'Pectoralis Major', desc: 'Star Trac Instinct horizontal bench chest press machine.' },
  53: { guide: 'guide_id53_deadlift.jpg', target: 'Olympic Lifting, Deadlifts, Power Cleans (Full Body)', desc: 'Heavy-duty floor bumper plate toast rack & rubber plates.' },
  54: { guide: 'guide_id54_kettlebells.jpg', target: 'Gluteus Maximus, Hamstrings, Core Bracing', desc: 'Color-coded cast iron and competition kettlebells.' }
};

let content = `export interface ExerciseVariation {
  id: string;
  name: string;
  title: string;
  targetArea: string;
  targetMuscle: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  setupInstructions: string[];
  steps: string[];
  executionSteps: {
    stepNumber: number;
    title: string;
    description: string;
    breathing: string;
    formCue: string;
  }[];
  commonMistakes: string[];
  safetyTips: string[];
  safetyWarnings: string[];
  proTips: string[];
  illustration?: string;
  illustrationUrl?: string;
  recommendedSetsReps: string;
}

export interface EquipmentFullGuide {
  id: number;
  equipmentId: number;
  name: string;
  category: string;
  status?: string;
  imageUrl?: string;
  weightScale?: string;
  muscles?: string[];
  warning?: string;
  overview: string;
  machineAdjustments: string[];
  safetyRules: string[];
  variations: ExerciseVariation[];
  primaryIllustration?: string;
}

export interface EquipmentGuide {
  id: number;
  name: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  description: string;
  guideImage: string;
  steps: { stepNumber: number; title: string; instruction: string; tip?: string }[];
}

export const EQUIPMENT_GUIDES_MAP: Record<number, EquipmentFullGuide> = {
`;

serverEquip.sort((a,b) => a.id - b.id).forEach(e => {
  const meta = guideMapping[e.id] || { guide: 'guide_id35_seated_chest_press.jpg', target: 'Compound Muscles', desc: e.name };
  const targetArr = meta.target.split(',').map(s => s.trim());
  const primary = targetArr[0] || 'Target Muscles';
  const secondary = targetArr.slice(1);
  const guideImgPath = 'assets/guides/' + meta.guide;

  content += `  ${e.id}: {
    id: ${e.id},
    equipmentId: ${e.id},
    name: ${JSON.stringify(e.name)},
    category: ${JSON.stringify(e.category_name || 'Gym Equipment')},
    status: 'available',
    imageUrl: ${JSON.stringify(e.image_url || '')},
    weightScale: 'Pin / Plate Loaded Weight Stack',
    muscles: [${JSON.stringify(primary)}, ${secondary.map(s => JSON.stringify(s)).join(', ')}],
    warning: 'Maintain neutral spine alignment and controlled tempo.',
    overview: ${JSON.stringify(meta.desc)},
    primaryIllustration: ${JSON.stringify(guideImgPath)},
    machineAdjustments: [
      'Adjust seat height or platform so pivot points align with your joint axis.',
      'Select a manageable working resistance to ensure strict movement form.'
    ],
    safetyRules: [
      'Maintain continuous core engagement throughout every repetition.',
      'Avoid hyperextending or locking out joints under heavy load.',
      'Control the eccentric return tempo smoothly without dropping weights.'
    ],
    variations: [
      {
        id: 'primary',
        name: ${JSON.stringify(e.name)},
        title: ${JSON.stringify(e.name)},
        targetArea: ${JSON.stringify(meta.target)},
        targetMuscle: ${JSON.stringify(primary)},
        primaryMuscles: [${JSON.stringify(primary)}],
        secondaryMuscles: [${secondary.map(s => JSON.stringify(s)).join(', ')}],
        difficulty: 'Beginner',
        illustration: ${JSON.stringify(guideImgPath)},
        illustrationUrl: ${JSON.stringify(guideImgPath)},
        recommendedSetsReps: '3-4 sets of 8-12 reps',
        setupInstructions: [
          'Position your body firmly against support pads with neutral spinal alignment.',
          'Secure hand grips or foot placement shoulder-width apart.'
        ],
        steps: [
          'Step 1: Setup & Starting Position - Position your body firmly with core braced.',
          'Step 2: Execution & Peak Contraction - Drive against resistance and squeeze target muscles.'
        ],
        executionSteps: [
          {
            stepNumber: 1,
            title: 'Setup & Unrack',
            description: 'Brace your core and initiate the starting position smoothly.',
            breathing: 'Inhale deeply and stabilize your torso before moving.',
            formCue: 'Keep shoulders retracted and joints aligned.'
          },
          {
            stepNumber: 2,
            title: 'Execution & Peak Contraction',
            description: 'Drive against the resistance through full range of motion and squeeze target muscles.',
            breathing: 'Exhale forcefully as you reach peak muscular contraction.',
            formCue: 'Hold contraction for 1 second before controlled return.'
          }
        ],
        commonMistakes: [
          'Using excessive momentum instead of targeted muscle drive.',
          'Incomplete range of motion or dropping weights abruptly.'
        ],
        safetyTips: [
          'Ensure safety collars, pins, or catchers are securely engaged.'
        ],
        safetyWarnings: [
          'Do not lock out joints abruptly under heavy load.',
          'Always keep feet flat and back braced against support pads.'
        ],
        proTips: [
          'Focus on a 2-second eccentric lowering phase for maximum hypertrophy.'
        ]
      }
    ]
  },
`;
});

content += `};\n\n`;

content += `export const ALL_EQUIPMENT_GUIDES: EquipmentFullGuide[] = Object.values(EQUIPMENT_GUIDES_MAP);\n\n`;

content += `export const EQUIPMENT_GUIDES: Record<number, EquipmentGuide> = {};\n`;
content += `for (const g of ALL_EQUIPMENT_GUIDES) {
  EQUIPMENT_GUIDES[g.id] = {
    id: g.id,
    name: g.name,
    category: g.category,
    primaryMuscles: g.variations[0]?.primaryMuscles || ['Target Muscles'],
    secondaryMuscles: g.variations[0]?.secondaryMuscles || [],
    description: g.overview,
    guideImage: g.primaryIllustration || 'assets/guides/guide_id35_seated_chest_press.jpg',
    steps: (g.variations[0]?.executionSteps || []).map(s => ({
      stepNumber: s.stepNumber,
      title: s.title,
      instruction: s.description,
      tip: s.formCue
    }))
  };
}\n`;

fs.writeFileSync(path.join(root, 'frontend/src/app/data/equipment-guides.data.ts'), content, 'utf8');
console.log('Successfully updated equipment-guides.data.ts with White Anatomical guides!');
