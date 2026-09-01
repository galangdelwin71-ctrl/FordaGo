const fs = require('fs');
const path = require('path');

const root = 'c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo';
const serverEquip = JSON.parse(fs.readFileSync('C:/Users/delwi/.gemini/antigravity-ide/brain/13e57574-9b61-4ae6-88cd-5b4f45cab5ae/scratch/server_equipment.json', 'utf8'));

// Load englishGuidesDatabase
const scriptContent = fs.readFileSync(path.join(root, 'scratch/generate_english_guides_with_direct_yt.js'), 'utf8');
const dataMatch = scriptContent.match(/const englishGuidesDatabase = ({[\s\S]*?^};)/m);
let englishGuidesDatabase = {};
if (dataMatch) {
  eval('englishGuidesDatabase = ' + dataMatch[1]);
}

let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>FordaGO - 100% Photo-Verified 46 Equipment Guide Review (English Edition with YouTube Tutorials)</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#0B132B; color:#f8fafc; margin:0; padding:24px; }
  h1 { text-align:center; color:#f59e0b; font-size:28px; margin-bottom:8px; }
  p.sub { text-align:center; color:#94a3b8; font-size:14px; margin-bottom:32px; }
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(500px, 1fr)); gap:24px; }
  .card { background:#1E293B; border:1px solid #334155; border-radius:14px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.35); display:flex; flex-direction:column; }
  .card-header { padding:14px 16px; background:#0f172a; border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center; }
  .card-title { font-size:15px; font-weight:700; color:#f1f5f9; }
  .badge-id { background:#f59e0b; color:#0f172a; font-weight:800; font-size:12px; padding:3px 8px; border-radius:6px; }
  .comparison { display:flex; border-bottom:1px solid #334155; }
  .photo-col, .guide-col { flex:1; padding:12px; text-align:center; }
  .photo-col { border-right:1px solid #334155; background:#182234; }
  .col-label { font-size:11px; font-weight:700; color:#94a3b8; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:8px; }
  .photo-col img { width:100%; height:200px; object-fit:cover; border-radius:8px; border:1px solid #475569; display:block; }
  .guide-col img { width:100%; height:200px; object-fit:contain; background:#0B132B; border-radius:8px; border:1px solid #475569; display:block; }
  
  .yt-box { padding:10px 14px; background:#0a0f1d; border-bottom:1px solid #334155; display:flex; align-items:center; justify-content:space-between; }
  .yt-brand { display:flex; align-items:center; gap:8px; font-size:12px; font-weight:800; color:#ffffff; }
  .yt-btn { display:inline-flex; align-items:center; gap:6px; background:#ef4444; color:#ffffff; padding:6px 12px; border-radius:8px; text-decoration:none; font-size:11.5px; font-weight:800; transition:all 0.2s; }
  .yt-btn:hover { background:#dc2626; }

  .card-body { padding:14px 16px; flex:1; }
  .target-box { background:#0f172a; padding:8px 12px; border-radius:6px; border-left:3px solid #f59e0b; margin-bottom:10px; }
  .target-title { font-size:11px; font-weight:700; color:#f59e0b; text-transform:uppercase; margin-bottom:2px; }
  .target-muscles { font-size:13px; color:#e2e8f0; font-weight:600; }
  
  .dos-box { background:rgba(34,197,94,0.08); border-left:3px solid #22c55e; border-radius:6px; padding:10px 12px; margin-bottom:10px; }
  .dos-title { font-size:11px; font-weight:800; color:#4ade80; text-transform:uppercase; margin-bottom:6px; }
  .dos-box ul { margin:0; padding-left:16px; font-size:12px; color:#e2e8f0; line-height:1.5; }
  .dos-box li { margin-bottom:4px; }

  .donts-box { background:rgba(239,68,68,0.08); border-left:3px solid #ef4444; border-radius:6px; padding:10px 12px; }
  .donts-title { font-size:11px; font-weight:800; color:#f87171; text-transform:uppercase; margin-bottom:6px; }
  .donts-box ul { margin:0; padding-left:16px; font-size:12px; color:#cbd5e1; line-height:1.5; }
  .donts-box li { margin-bottom:4px; }
</style>
</head>
<body>
<h1>🏋️ FordaGO Afforda Gym — 100% English Equipment Guides & Tutorial Hub</h1>
<p class="sub">100% English Form Essentials, Proper Cues, Common Mistakes to Avoid, and Direct YouTube Video Demos.</p>
<div class="grid">
`;

serverEquip.sort((a,b) => a.id - b.id).forEach(e => {
  const meta = englishGuidesDatabase[e.id] || {
    guide: 'guide_id35_seated_chest_press.jpg',
    target: 'Compound Muscle Groups',
    videoId: 'sqOw2Y68ecY',
    dos: ['Maintain proper posture and brace core.', 'Control the movement cadence.'],
    donts: ['DO NOT lockout joints forcefully.', 'DO NOT use excessive momentum.']
  };
  const photoSrc = e.image_url ? e.image_url : '../../docs/equipment_photos/id_' + e.id + '_' + e.name.replace(/[^a-zA-Z0-9]/g, '_') + '.jpg';
  const guideSrc = '../../frontend/src/assets/guides/' + meta.guide;
  const ytWatchUrl = 'https://www.youtube.com/watch?v=' + meta.videoId;
  
  html += `
  <div class="card">
    <div class="card-header">
      <span class="card-title">${e.name}</span>
      <span class="badge-id">ID ${e.id}</span>
    </div>
    <div class="comparison">
      <div class="photo-col">
        <div class="col-label">📸 Actual Photo from Gym</div>
        <img src="${photoSrc}" alt="${e.name}">
      </div>
      <div class="guide-col">
        <div class="col-label">🧬 White Anatomical Guide</div>
        <img src="${guideSrc}" alt="${meta.target}">
      </div>
    </div>
    <div class="yt-box">
      <div class="yt-brand">
        <svg viewBox="0 0 24 24" width="22" height="22" style="vertical-align:middle;">
          <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
          <path fill="#FFFFFF" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <span>Official YouTube Tutorial</span>
      </div>
      <a href="${ytWatchUrl}" target="_blank" rel="noopener noreferrer" class="yt-btn">
        ▶ Watch Video &rarr;
      </a>
    </div>
    <div class="card-body">
      <div class="target-box">
        <div class="target-title">🎯 Target Muscle Groups</div>
        <div class="target-muscles">${meta.target}</div>
      </div>
      <div class="dos-box">
        <div class="dos-title">✅ Form Essentials &amp; Proper Technique (Dos)</div>
        <ul>
          ${meta.dos.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>
      <div class="donts-box">
        <div class="donts-title">❌ Common Mistakes &amp; Safety Warnings (Don'ts)</div>
        <ul>
          ${meta.donts.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>
    </div>
  </div>
  `;
});

html += `
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'docs/qr-codes/all_equipment_guides_showcase.html'), html, 'utf8');
console.log('Successfully updated showcase HTML with English guides and official YouTube branding!');
