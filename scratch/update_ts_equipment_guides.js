const fs = require('fs');
const path = require('path');

const root = 'c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo';
const serverEquip = JSON.parse(fs.readFileSync('C:/Users/delwi/.gemini/antigravity-ide/brain/13e57574-9b61-4ae6-88cd-5b4f45cab5ae/scratch/server_equipment.json', 'utf8'));

const guideMapping = {
  9: { guide: 'guide_id9_vsquat.jpg', target: 'Quadriceps, Glutes', desc: 'Pin-loaded lever V-squat with angled platform.' },
  10: { guide: 'shoulderPress.jpg', target: 'Anterior/Medial Deltoids, Triceps', desc: 'Overhead seated shoulder press.' },
  11: { guide: 'hipAbductor.jpg', target: 'Gluteus Medius, Outer Thighs', desc: 'Seated outer thigh hip abductor.' },
  12: { guide: 'latPulldown.jpg', target: 'Latissimus Dorsi, Upper Back', desc: 'Wide grip lat pulldown station.' },
  13: { guide: 'seatedChestPress.jpg', target: 'Pectoralis Major, Front Delts', desc: 'Selectorized horizontal chest press.' },
  14: { guide: 'seatedCalfRaise.jpg', target: 'Soleus, Gastrocnemius', desc: 'Plate-loaded seated calf raise.' },
  15: { guide: 'seatedChestPress.jpg', target: 'Upper Chest, Anterior Delts', desc: 'Plate-loaded incline chest press.' },
  16: { guide: 'guide_id16_dumbbells.jpg', target: 'Biceps Brachii, Forearms', desc: 'Commercial dumbbell rack free weights.' },
  17: { guide: 'hyperextension.jpg', target: 'Erector Spinae, Lower Back', desc: 'Seated back extension machine.' },
  18: { guide: 'guide_id18_pickleball.jpg', target: 'Dynamic Agility, Leg Power', desc: 'Regulation indoor pickleball court.' },
  19: { guide: 'squatRack.jpg', target: 'Quadriceps, Glutes, Hamstrings', desc: 'Heavy-duty open barbell squat rack.' },
  20: { guide: 'cableCrossover.jpg', target: 'Pectorals, Anterior Deltoids', desc: 'Dual swivel-arm cable column.' },
  21: { guide: 'hyperextension.jpg', target: 'Lower Back, Glutes, Hamstrings', desc: 'Back extension & glute-ham bench.' },
  22: { guide: 'hyperextension.jpg', target: 'Erector Spinae, Gluteals', desc: '45-degree hyperextension bench.' },
  23: { guide: 'squatRack.jpg', target: 'Lower Body & Back', desc: 'Olympic power cage with pull-up bar.' },
  24: { guide: 'hipThrust.jpg', target: 'Gluteus Maximus, Hamstrings', desc: 'Commercial glute drive hip thrust.' },
  25: { guide: 'preacherCurl.jpg', target: 'Biceps Brachii (Short Head)', desc: '45-degree preacher curl bench.' },
  26: { guide: 'latPulldown.jpg', target: 'Latissimus Dorsi, Biceps', desc: 'Plate-loaded iso-lateral lat pulldown.' },
  27: { guide: 'latPulldown.jpg', target: 'Latissimus Dorsi, Upper Back', desc: 'High pulldown machine station.' },
  28: { guide: 'seatedRow.jpg', target: 'Middle Traps, Rhomboids, Lats', desc: 'Iso-lateral plate-loaded seated row.' },
  29: { guide: 'cableCrossover.jpg', target: 'Pectoralis Major, Sternal Head', desc: 'Dual stack adjustable cable crossover.' },
  30: { guide: 'hackSquat.jpg', target: 'Quadriceps, Gluteus Maximus', desc: 'Plate-loaded 45-degree linear hack squat.' },
  31: { guide: 'squatRack.jpg', target: 'Full Lower Body & Core', desc: 'Full commercial power rack cage.' },
  32: { guide: 'shoulderPress.jpg', target: 'Deltoid Group, Triceps', desc: 'Plate-loaded dual lever shoulder machine.' },
  33: { guide: 'seatedChestPress.jpg', target: 'Pectoralis Major, Triceps', desc: 'Iso-lateral plate-loaded chest press.' },
  34: { guide: 'preacherCurl.jpg', target: 'Biceps Brachii, Brachialis', desc: 'Selectorized seated bicep curl machine.' },
  35: { guide: 'seatedChestPress.jpg', target: 'Pectoralis Major, Front Delts', desc: 'Selectorized seated chest press.' },
  36: { guide: 'seatedChestPress.jpg', target: 'Pectorals, Anterior Delts', desc: 'Multi-position adjustable incline bench.' },
  37: { guide: 'captainsChair.jpg', target: 'Rectus Abdominis, Triceps', desc: "Captain's chair knee raise & dip station." },
  38: { guide: 'standingLateralRaise.jpg', target: 'Lateral Deltoids (Side Delts)', desc: 'Standing lateral raise machine.' },
  39: { guide: 'legExtension.jpg', target: 'Quadriceps Femoris', desc: 'Selectorized leg extension machine.' },
  40: { guide: 'shoulderPress.jpg', target: 'Anterior & Medial Delts', desc: 'Pin-loaded shoulder press machine.' },
  41: { guide: 'pecFly.jpg', target: 'Pectoralis Major, Rear Delts', desc: 'Overhead swivel pec fly & rear delt.' },
  42: { guide: 'cableCrossover.jpg', target: 'Full Body Functional Cable', desc: 'Functional dual cable trainer.' },
  43: { guide: 'legPress45.jpg', target: 'Quadriceps, Glutes, Hamstrings', desc: 'Plate-loaded 45-degree leg press.' },
  44: { guide: 'squatRack.jpg', target: 'Full Body Guided Barbell', desc: 'Commercial Smith machine rack.' },
  45: { guide: 'legPress45.jpg', target: 'Quadriceps, Gluteus Maximus, Calves', desc: 'Heavy-duty incline sled leg press.' },
  46: { guide: 'latPulldown.jpg', target: 'Latissimus Dorsi, Biceps', desc: 'Star Trac high lat pulldown.' },
  47: { guide: 'guide_id47_ezbar_curl.jpg', target: 'Biceps Brachii, Forearms', desc: 'Barbell rack with fixed EZ curl bars.' },
  48: { guide: 'seatedChestPress.jpg', target: 'Pectoralis Major, Triceps', desc: 'Star Trac seated chest press machine.' },
  49: { guide: 'seatedRow.jpg', target: 'Latissimus Dorsi, Middle Back', desc: 'Plate-loaded seated low row bench.' },
  50: { guide: 'shoulderPress.jpg', target: 'Anterior & Medial Delts', desc: 'Star Trac seated shoulder press.' },
  51: { guide: 'legExtension.jpg', target: 'Quadriceps, Calves', desc: 'Freemotion dual leg extension/calf.' },
  52: { guide: 'seatedChestPress.jpg', target: 'Pectoralis Major', desc: 'Star Trac horizontal bench chest press.' },
  53: { guide: 'guide_id53_deadlift.jpg', target: 'Olympic Lifting, Deadlifts, Power Cleans (Full Body)', desc: 'Bumper plate toast rack.' },
  54: { guide: 'guide_id54_kettlebells.jpg', target: 'Glutes, Hamstrings, Core', desc: 'Cast iron & competition kettlebells.' }
};

let tsContent = `export interface EquipmentGuide {
  id: number;
  name: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  description: string;
  guideImage: string;
  steps: { stepNumber: number; title: string; instruction: string; tip?: string }[];
}

export const EQUIPMENT_GUIDES: Record<number, EquipmentGuide> = {
`;

serverEquip.sort((a,b) => a.id - b.id).forEach(e => {
  const meta = guideMapping[e.id] || { guide: 'seatedChestPress.jpg', target: 'Compound Muscles', desc: e.name };
  const targetArr = meta.target.split(',').map(s => s.trim());
  const primary = targetArr[0] || 'Target Muscles';
  const secondary = targetArr.slice(1).join(', ') || 'Core Stabilizers';

  tsContent += `  ${e.id}: {
    id: ${e.id},
    name: ${JSON.stringify(e.name)},
    category: ${JSON.stringify(e.category_name || 'Gym Equipment')},
    primaryMuscles: [${JSON.stringify(primary)}],
    secondaryMuscles: [${JSON.stringify(secondary)}],
    description: ${JSON.stringify(meta.desc)},
    guideImage: ${JSON.stringify('assets/guides/' + meta.guide)},
    steps: [
      {
        stepNumber: 1,
        title: 'Setup & Starting Position',
        instruction: 'Adjust the seat or position your body according to the machine guidelines, bracing your core.',
        tip: 'Ensure proper alignment with machine pivot points.'
      },
      {
        stepNumber: 2,
        title: 'Execution & Peak Contraction',
        instruction: 'Perform the exercise through a full range of motion, exhaling on exertion and squeezing target muscles.',
        tip: 'Maintain smooth tempo and control the eccentric return.'
      }
    ]
  },
`;
});

tsContent += `};\n`;

fs.writeFileSync(path.join(root, 'frontend/src/app/data/equipment-guides.data.ts'), tsContent, 'utf8');
console.log('Successfully updated equipment-guides.data.ts with new photorealistic guides!');
