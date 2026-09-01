const fs = require('fs');
const path = require('path');

const brainDir = 'C:/Users/delwi/.gemini/antigravity-ide/brain/13e57574-9b61-4ae6-88cd-5b4f45cab5ae';
const guidesDir = 'c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo/frontend/src/assets/guides';

// Copy generated high-res JPEGs:
const copies = [
  { src: 'guide_id18_pickleball_1788223846043.jpg', dest: 'guide_id18_pickleball.jpg' },
  { src: 'guide_id9_vsquat_1788223865702.jpg', dest: 'guide_id9_vsquat.jpg' },
  { src: 'guide_id16_dumbbells_1788223883678.jpg', dest: 'guide_id16_dumbbells.jpg' },
  { src: 'guide_id54_kettlebells_1788223901769.jpg', dest: 'guide_id54_kettlebells.jpg' },
  { src: 'guide_id47_ezbar_curl_1788223920210.jpg', dest: 'guide_id47_ezbar_curl.jpg' },
  { src: 'guide_id53_deadlift_1788223939272.jpg', dest: 'guide_id53_deadlift.jpg' }
];

copies.forEach(c => {
  const srcPath = path.join(brainDir, c.src);
  const destPath = path.join(guidesDir, c.dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${c.src} -> ${c.dest}`);
  } else {
    console.error(`Missing src: ${srcPath}`);
  }
});
