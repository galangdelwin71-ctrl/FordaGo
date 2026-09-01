const fs = require('fs');
const path = require('path');

const brainDir = 'C:/Users/delwi/.gemini/antigravity-ide/brain/13e57574-9b61-4ae6-88cd-5b4f45cab5ae';
const guidesDir = 'c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/frontend/src/assets/guides';

const newCopies = [
  { src: 'guide_id52_flat_chest_press_1788225632813.jpg', dest: 'guide_id52_flat_chest_press.jpg' },
  { src: 'guide_id35_seated_chest_press_1788225659068.jpg', dest: 'guide_id35_seated_chest_press.jpg' },
  { src: 'guide_id9_white_vsquat_1788225758728.jpg', dest: 'guide_id9_white_vsquat.jpg' },
  { src: 'guide_id10_white_shoulder_press_1788225784206.jpg', dest: 'guide_id10_white_shoulder_press.jpg' },
  { src: 'guide_id11_white_hip_abductor_1788225809491.jpg', dest: 'guide_id11_white_hip_abductor.jpg' },
  { src: 'guide_id12_white_lat_pulldown_1788225832146.jpg', dest: 'guide_id12_white_lat_pulldown.jpg' }
];

newCopies.forEach(c => {
  const srcPath = path.join(brainDir, c.src);
  const destPath = path.join(guidesDir, c.dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${c.src} -> ${c.dest}`);
  }
});
