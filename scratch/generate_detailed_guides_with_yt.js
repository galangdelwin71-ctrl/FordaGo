const fs = require('fs');
const path = require('path');

const root = 'c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo';
const serverEquip = JSON.parse(fs.readFileSync('C:/Users/delwi/.gemini/antigravity-ide/brain/13e57574-9b61-4ae6-88cd-5b4f45cab5ae/scratch/server_equipment.json', 'utf8'));

// Detailed database with comprehensive Dos, Don'ts, YouTube tutorial URLs, and Step instructions:
const comprehensiveGuideData = {
  9: {
    guide: 'guide_id9_white_vsquat.jpg',
    target: 'Quadriceps, Gluteus Maximus',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+v+squat+machine+tutorial',
    desc: 'Pin-loaded lever V-squat machine na may angled footplate, red back pad, at padded shoulder levers para sa isolated quad at glute development.',
    dos: [
      'Iposisyon ang mga balikat nang lapat sa ilalim ng shoulder pads bago bitawan ang safety lever.',
      'Panatilihing nakadikit ang buong talampakan sa angled footplate at idiin ang bigat sa mga sakong (heels).',
      'I-brace ang core muscles at panatilihing nakalapat ang likod sa back pad habang bumababa.',
      'Bumaba hanggang 90 degrees (parallel ang hita sa footplate) para sa buong stretch ng quadriceps.',
      'Huminga nang malalim (inhale) pababa at ibuga ang hangin (exhale) habang itinutulak ang bigat pataas.'
    ],
    donts: [
      'HUWAG i-lockout o i-snap nang mabilis ang mga tuhod sa tuktok ng pag-angat.',
      'HUWAG iangat ang mga sakong (heels) mula sa platform habang nag-squat.',
      'HUWAG hayaang bumaluktot ang ibabang bahagi ng likod (lower back) palayo sa backrest.',
      'HUWAG bumaba nang bigla; panatilihing kontrolado ang 2-segundong pagbaba.'
    ],
    steps: [
      'Step 1: Setup & Unrack - Tumayo sa gitna ng angled platform, ilapat ang mga balikat sa ilalim ng pads, at i-disengage ang safety handle.',
      'Step 2: Controlled Descent - Dahan-dahang i-flex ang mga tuhod at balakang pababa hanggang 90 degrees.',
      'Step 3: Concentric Drive & Lockout - Itulak ang bigat pataas gamit ang lakas ng hita at glutes nang hindi ini-lock ang tuhod.'
    ]
  },
  10: {
    guide: 'guide_id10_white_shoulder_press.jpg',
    target: 'Anterior & Lateral Deltoids, Triceps Brachii',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+seated+shoulder+press+machine+tutorial',
    desc: 'Star Trac selectorized overhead shoulder press machine para sa deltoid hypertrophy at upper body vertical pushing strength.',
    dos: [
      'I-adjust ang taas ng upuan upang ang mga handles ay kapantay ng iyong mga balikat sa simula.',
      'Panatilihing nakalapat ang likod at ulo sa backrest habang itinutulak ang bigat pataas.',
      'Itulak ang mga handles pataas sa maayos at tuluy-tuloy na arko hanggang sa halos tuwid na ang mga braso.',
      'I-retract at i-depress ang shoulder blades upang hindi magkaroon ng labis na stress sa leeg.'
    ],
    donts: [
      'HUWAG i-arch o i-curve ang ibabang likod palayo sa upuan para lamang maitulak ang mabigat na timbang.',
      'HUWAG i-lockout nang marahas ang mga siko sa tuktok.',
      'HUWAG hayaang bumagsak ang bigat pabalik sa stack; kontrolin ang eccentric return.'
    ],
    steps: [
      'Step 1: Seat Height & Grip Setup - Umupo nang lapat ang likod, hawakan ang handles nang bahagyang mas malapad sa balikat.',
      'Step 2: Overhead Drive - Itulak ang handles pataas habang nag-e-exhale at kinokontrata ang deltoids.',
      'Step 3: Controlled Lowering - Dahan-dahang ibaba ang handles pabalik sa antas ng tainga habang nag-i-inhale.'
    ]
  },
  11: {
    guide: 'guide_id11_white_hip_abductor.jpg',
    target: 'Gluteus Medius, Tensor Fasciae Latae (Outer Thighs)',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+hip+abductor+machine+tutorial',
    desc: 'Selectorized hip abductor machine na may swivel knee pads para sa pagpapalakas at paghubog ng outer glutes at hip stability.',
    dos: [
      'I-set ang swivel pads sa labas ng iyong mga tuhod at itapak ang mga paa sa pegs.',
      'Umupo nang tuwid at humawak sa side handles para sa matatag na suporta.',
      'Itulak ang mga tuhod palabas hanggang sa marating ang buong contraction ng outer glutes.',
      'Mag-pause nang 1 segundo sa peak abduction habang pinipiga ang gluteus medius.'
    ],
    donts: [
      'HUWAG gumamit ng momentum o pag-ugoy ng katawan para maitulak ang pads.',
      'HUWAG hayaang magbanggaan ang weight plates sa pagbalik sa gitna.'
    ],
    steps: [
      'Step 1: Start Setup - Pumasok sa machine, i-adjust ang pin para sa simulaang lapad ng mga binti.',
      'Step 2: Abduction Drive - Itulak ang dalawang tuhod palabas laban sa resistensya.',
      'Step 3: Peak Squeeze & Slow Return - Hawakan ang contraction ng 1 segundo bago dahan-dahang ibalik sa gitna.'
    ]
  },
  12: {
    guide: 'guide_id12_white_lat_pulldown.jpg',
    target: 'Latissimus Dorsi, Teres Major, Biceps',
    yt: 'https://www.youtube.com/results?search_query=how+to+do+lat+pulldown+proper+form',
    desc: 'Freemotion overhead lat pulldown station na may wide grip bar at thigh lock foam rollers para sa V-taper back development.',
    dos: [
      'I-lock nang maigi ang mga hita sa ilalim ng foam rollers upang hindi umangat ang katawan.',
      'Hawakan ang wide bar nang bahagyang lampas sa lapad ng mga balikat (overhand grip).',
      'I-puff ang dibdib at hilahin ang bar pababa patungo sa itaas na bahagi ng dibdib (collarbone).',
      'Pangunahan ang paghila gamit ang mga siko (drive elbows down and back).'
    ],
    donts: [
      'HUWAG hilahin ang bar sa likod ng leeg (behind the neck) upang maiwasan ang rotator cuff injury.',
      'HUWAG sumandal nang sobra sa likod o gamitin ang momentum ng baywang para humila.',
      'HUWAG hayaang mahila pataas ang mga balikat sa simula; panatilihing depressed ang scapula.'
    ],
    steps: [
      'Step 1: Grip & Thigh Setup - Hawakan ang wide bar, umupo at i-lock ang mga hita sa ilalim ng rollers.',
      'Step 2: Scapular Retraction & Pull - Hilahin ang bar pababa sa collarbone habang nag-e-exhale at idinidiin ang lats.',
      'Step 3: Full Controlled Stretch - Dahan-dahang i-extend ang mga braso pataas para sa buong stretch ng lats.'
    ]
  },
  13: {
    guide: 'guide_id35_seated_chest_press.jpg',
    target: 'Pectoralis Major, Front Deltoids, Triceps',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+seated+chest+press+machine+tutorial',
    desc: 'Selectorized seated chest press machine para sa ligtas at balanseng pagpapalaki ng dibdib at pushing power.',
    dos: [
      'I-adjust ang taas ng upuan upang ang handles ay eksaktong kapantay ng gitna ng iyong dibdib (nipple line).',
      'Panatilihing nakadiin ang likod at puwit sa upuan, at nakalapat ang mga paa sa sahig.',
      'Itulak pasulong ang handles nang sabay at kontrolado habang pinipiga ang pectorals.'
    ],
    donts: [
      'HUWAG hayaang lumipad paharap ang mga balikat (keep shoulder blades retracted).',
      'HUWAG i-lockout nang matigas ang mga siko sa dulo ng tulak.'
    ],
    steps: [
      'Step 1: Seat Alignment - Ayusin ang upuan at hawakan ang handles nang may 45-degree elbow flare.',
      'Step 2: Forward Push - Itulak pasulong habang nag-e-exhale at pinipiga ang dibdib.',
      'Step 3: Eccentric Return - Kontroladong ibalik ang handles hanggang maramdaman ang stretch sa dibdib.'
    ]
  },
  14: {
    guide: 'seatedCalfRaise.jpg',
    target: 'Soleus, Gastrocnemius (Calves)',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+seated+calf+raise+machine+tutorial',
    desc: 'Warrior Fitness plate-loaded seated calf raise machine para sa deep soleus muscle hypertrophy at lower leg strength.',
    dos: [
      'Ilagay ang mga unahang bahagi ng talampakan (balls of feet) sa step block.',
      'I-lock ang padded thigh lever nang mahigpit sa ibabaw ng mga tuhod bago alisin ang safety bar.',
      'Ibaba ang mga sakong nang buo (deep stretch) at iangat nang pinakamataas sa peak contraction.'
    ],
    donts: [
      'HUWAG mag-bounce o mag-pindot nang mabilis nang walang control.',
      'HUWAG gamitin ang ibabang likod para mag-angat ng bigat.'
    ],
    steps: [
      'Step 1: Thigh Pad Lock & Deep Stretch - I-secure ang pads sa tuhod at ibaba ang mga sakong nang sagad.',
      'Step 2: Plantarflexion Drive - Itulak ang bigat pataas gamit ang mga daliri ng paa.',
      'Step 3: Peak Hold - Hawakan ang contraction sa tuktok ng 1-2 segundo bago dahan-dahang ibaba.'
    ]
  },
  15: {
    guide: 'guide_id35_seated_chest_press.jpg',
    target: 'Upper Pectoralis Major (Clavicular Head), Triceps',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+plate+loaded+incline+chest+press+machine',
    desc: 'Precor plate-loaded incline chest press na may converging arms para sa upper chest mass at shoulder health.',
    dos: [
      'I-set ang upuan upang ang handles ay nakapantay sa itaas na bahagi ng dibdib.',
      'Itulak ang mga braso paitaas sa 45-degree diagonal trajectory.',
      'Panatilihing nakabaon ang shoulder blades sa incline backrest.'
    ],
    donts: [
      'HUWAG i-flare ang mga siko nang 90 degrees; panatilihing nasa 45-60 degrees.',
      'HUWAG i-arch ang likod palayo sa sandalan.'
    ],
    steps: [
      'Step 1: Setup & Grip - Umupo sa incline seat, hawakan ang handles nang may matatag na grip.',
      'Step 2: Diagonal Press - Itulak ang independent arms pataas at paloob.',
      'Step 3: Controlled Descent - Dahan-dahang ibaba hanggang sa antas ng itaas na dibdib.'
    ]
  },
  16: {
    guide: 'guide_id16_dumbbells.jpg',
    target: 'Biceps Brachii, Brachialis, Forearm Flexors',
    yt: 'https://www.youtube.com/results?search_query=dumbbell+bicep+curls+proper+form+tutorial',
    desc: 'Commercial dumbbell rack free weights para sa versatile isolation at compound upper/lower body exercises.',
    dos: [
      'Tumayo nang tuwid na may bahagyang nakabalingcore at nakadikit ang mga siko sa tagiliran.',
      'I-curl ang dumbbells pataas habang iniikot ang mga palad (supination) patungo sa kisame.',
      'Pigain nang mahigpit ang bicep peak sa tuktok ng bawat pag-angat.'
    ],
    donts: [
      'HUWAG i-ugoy ang likod (no swinging) para magbuhat ng mabigat na dumbbells.',
      'HUWAG iusog ang mga siko pasulong habang nagka-curl.'
    ],
    steps: [
      'Step 1: Neutral Stance - Humawak ng dalawang dumbbells sa tagiliran na nakaharap paloob ang mga palad.',
      'Step 2: Supinated Curl - Iangat ang dumbbells habang iniikot ang palad pataas.',
      'Step 3: Peak Contraction & Negative - Pigain ang bicep sa tuktok at dahan-dahang ibaba ng 2-3 segundo.'
    ]
  },
  17: {
    guide: 'hyperextension.jpg',
    target: 'Erector Spinae (Lower Back), Multifidus',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+seated+back+extension+machine',
    desc: 'Commercial seated back extension machine para sa ligtas na pagpapalakas ng lower back at posterior spinal chain.',
    dos: [
      'Iposisyon ang likod laban sa cylindrical padded roller sa antas ng scapula.',
      'I-extend ang katawan paatras gamit ang kontroladong lakas ng lower back muscles.',
      'Huminga nang maayos at panatilihing nakadikit ang puwit sa upuan.'
    ],
    donts: [
      'HUWAG mag-hyperextend nang sobra sa likod na lagpas sa neutral spinal alignment.',
      'HUWAG gamitin ang momentum ng ulo o leeg.'
    ],
    steps: [
      'Step 1: Machine Setup - Ayusin ang starting angle at ilapat ang likod sa cylindrical pad.',
      'Step 2: Extension Drive - Itulak paatras ang roller gamit ang spinal erectors habang nag-e-exhale.',
      'Step 3: Controlled Return - Dahan-dahang bumalik sa panimulang posisyon nang hindi bumabagsak ang bigat.'
    ]
  },
  18: {
    guide: 'guide_id18_pickleball.jpg',
    target: 'Dynamic Agility, Lateral Footwork, Core & Leg Power',
    yt: 'https://www.youtube.com/results?search_query=how+to+play+pickleball+rules+and+basics+for+beginners',
    desc: 'Indoor regulation pickleball and badminton court para sa cardiovascular conditioning, athletic agility, at racket sports training.',
    dos: [
      'Magsuot ng tamang non-marking court shoes para sa maayos na traction at lateral support.',
      'Magsagawa ng dynamic warm-up (high knees, butt kicks, lateral shuffles) bago maglaro.',
      'Manatili sa athletic ready stance: bahagyang nakabaluktot ang mga tuhod at nakataas ang paddle.',
      'Igalang ang Non-Volley Zone (Kitchen) rule: huwag mag-smash habang nakatapak sa loob ng NVZ.'
    ],
    donts: [
      'HUWAG maglaro nang walang warm-up upang maiwasan ang ankle sprains at hamstring strains.',
      'HUWAG tumapak sa Non-Volley Zone habang nagpapatama ng bola sa ere (volley).'
    ],
    steps: [
      'Step 1: Court Setup & Warm-up - I-check ang net height (34 inches sa gitna) at mag-warmup sa baseline.',
      'Step 2: Ready Stance & Split Step - Panatilihing nasa unahan ang paddle, nakabuka ang mga paa, at handang gumalaw pakaliwa/pakanan.',
      'Step 3: Kinetic Drive & Groundstroke - Gamitin ang rotational power ng hips at core para sa malinis na forehand/backhand drive.'
    ]
  },
  19: {
    guide: 'squatRack.jpg',
    target: 'Quadriceps, Gluteus Maximus, Hamstrings, Core',
    yt: 'https://www.youtube.com/results?search_query=how+to+barbell+back+squat+proper+form+tutorial',
    desc: 'Heavy-duty open Olympic barbell squat rack na may adjustable J-hooks at safety spotter arms.',
    dos: [
      'I-set ang J-hooks sa taas ng gitnang dibdib upang madaling mai-unrack ang barbell.',
      'Ipatong ang bar sa itaas na trapezius (high bar) o likod ng balikat (low bar).',
      'I-brace ang tiyan (Valsalva maneuver) at bumaba hanggang parallel ang balakang sa mga tuhod.',
      'Itulak ang sahig gamit ang buong talampakan habang tumatayo pabalik.'
    ],
    donts: [
      'HUWAG hayaang bumagsak paloob ang mga tuhod (knee caving / valgus collapse).',
      'HUWAG yumukod nang labis o iangat ang mga sakong mula sa sahig.'
    ],
    steps: [
      'Step 1: Unrack & Step Back - Pumasok sa ilalim ng bar, i-brace ang likod, mag-unrack, at umatras ng dalawang maikling hakbang.',
      'Step 2: Squat Descent - Humiwalay ang balakang paatras at ibaluktot ang tuhod pababa nang kontrolado.',
      'Step 3: Upward Drive & Re-rack - Itulak pataas pabalik sa tuwid na tindig at maingat na i-re-rack sa J-hooks.'
    ]
  },
  20: {
    guide: 'cableCrossover.jpg',
    target: 'Pectoralis Major, Sternal Head, Anterior Deltoids',
    yt: 'https://www.youtube.com/results?search_query=how+to+do+cable+chest+flyes+proper+form',
    desc: 'Freemotion dual multi-angle cable column na may rotating swivel arms para sa continuous tension chest flyes.',
    dos: [
      'I-set ang pulleys sa taas ng balikat at kumuha ng staggered stance para sa balanse.',
      'Panatilihing may bahagyang bend sa mga siko habang dinadala ang mga kamay paharap sa hugging arc.',
      'Pigain nang husto ang gitnang dibdib sa dulo ng bawat rep.'
    ],
    donts: [
      'HUWAG i-straight nang matigas o ibaluktot nang sobra ang mga braso habang nagfa-fly.',
      'HUWAG gumamit ng malakas na pag-ugoy ng katawan.'
    ],
    steps: [
      'Step 1: Grip & Stance - Hawakan ang D-handles, maglakad nang 1 hakbang pasulong sa staggered stance.',
      'Step 2: Hugging Arc Motion - Dalhin ang mga kamay papunta sa gitna na parang yumayakap sa malaking puno.',
      'Step 3: Controlled Negative - Dahan-dahang buksan ang mga braso para sa buong chest stretch.'
    ]
  },
  21: {
    guide: 'hyperextension.jpg',
    target: 'Erector Spinae, Gluteus Maximus, Hamstrings',
    yt: 'https://www.youtube.com/results?search_query=how+to+do+back+extensions+on+bench+proper+form',
    desc: 'Adjustable back extension and glute-ham bench na may ankle hold-down rollers para sa posterior chain strength.',
    dos: [
      'I-lock ang mga bukung-bukong sa likod ng lower roller pads.',
      'I-hinge ang katawan sa balakang (hip hinge) habang pinapanatiling tuwid ang likod.',
      'Iangat ang torso hanggang sa makabuo ng tuwid na linya mula ulo hanggang sakong.'
    ],
    donts: [
      'HUWAG mag-overextend nang lampas sa tuwid na linya ng katawan.',
      'HUWAG magbuhat gamit ang leeg.'
    ],
    steps: [
      'Step 1: Ankle Lock Setup - I-secure ang mga binti sa rollers at ilapat ang balakang sa pad.',
      'Step 2: Forward Hinge - Dahan-dahang ibaba ang torso patungo sa sahig.',
      'Step 3: Extension & Glute Squeeze - Iangat ang katawan pabalik at pigain ang glutes at lower back.'
    ]
  },
  22: {
    guide: 'hyperextension.jpg',
    target: 'Lower Back Muscles, Gluteals, Hamstring Origin',
    yt: 'https://www.youtube.com/results?search_query=how+to+do+45+degree+hyperextension+proper+form',
    desc: '45-degree Roman chair hyperextension bench para sa lower back conditioning at glute/hamstring endurance.',
    dos: [
      'I-adjust ang hip pad sa ibaba ng hip crease upang makayuko nang malaya.',
      'I-cross ang mga kamay sa dibdib o sa likod ng ulo.',
      'I-engage ang glutes habang umaangat pabalik sa 45-degree neutral line.'
    ],
    donts: [
      'HUWAG gumamit ng mabibilis na jerking motions.',
      'HUWAG i-round ang balikat pasulong.'
    ],
    steps: [
      'Step 1: Pelvic Rest - Ilapat ang balakang sa 45-degree pad na may naka-lock na sakong.',
      'Step 2: Lower Torso - Dahan-dahang yumuko sa balakang pababa.',
      'Step 3: Raise & Align - Iangat ang katawan pabalik sa 45-degree alignment.'
    ]
  },
  23: {
    guide: 'squatRack.jpg',
    target: 'Quadriceps, Glutes, Upper Back, Core',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+power+rack+cage+gym+tutorial',
    desc: 'Olympic 4-post power cage na may integrated pull-up station at adjustable safety pins para sa maximum safety heavy lifting.',
    dos: [
      'Palaging i-adjust ang horizontal safety bars sa antas sa ibaba ng iyong pinakamababang squat depth.',
      'Siguraduhing balanse ang pagkakalagay ng weight plates sa magkabilang dulo ng Olympic bar.',
      'Gamitin ang barbell collars o spring clips sa bawat set.'
    ],
    donts: [
      'HUWAG mag-squat nang walang safety bars na naka-set.',
      'HUWAG mag-drop ng loaded barbell sa safety bars maliban kung emergency.'
    ],
    steps: [
      'Step 1: Safety & Bar Setup - I-set ang safety rails at J-hooks sa tamang taas.',
      'Step 2: Execution - Isagawa ang barbell squats, overhead presses, o pull-ups nang may buong proteksyon.',
      'Step 3: Safe Re-rack - Ibalik nang maingat ang bar sa hooks bago bitawan ang grip.'
    ]
  },
  24: {
    guide: 'hipThrust.jpg',
    target: 'Gluteus Maximus (Peak Contraction), Hamstrings',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+hip+thrust+machine+glute+drive+tutorial',
    desc: 'Commercial plate-loaded Glute Drive hip thrust machine na may padded waist belt at dual safety release levers.',
    dos: [
      'Isuot at higpitan ang padded waist belt sa ibabaw ng iyong pelvic bones.',
      'Itapak ang mga paa nang flat sa textured platform na may 90-degree knee angle sa tuktok ng bridge.',
      'Itulak ang balakang pataas gamit ang glutes at pigain nang 2 segundo sa peak lockout.'
    ],
    donts: [
      'HUWAG i-hyperarch ang ibabang likod; panatilihing bahagyang nakatuck ang baba (chin tucked).',
      'HUWAG itulak gamit ang mga daliri ng paa; idiin ang buong sakong.'
    ],
    steps: [
      'Step 1: Belt & Foot Placement - Umupo, i-buckle ang belt, itapak ang mga paa, at i-release ang safety lever.',
      'Step 2: Explosive Hip Drive - Itulak ang balakang pataas hanggang maging parallel ang katawan sa sahig.',
      'Step 3: Peak Squeeze & Lowering - Pigain ang glutes sa tuktok at dahan-dahang ibaba ang balakang.'
    ]
  },
  25: {
    guide: 'preacherCurl.jpg',
    target: 'Biceps Brachii (Short Head Isolation)',
    yt: 'https://www.youtube.com/results?search_query=how+to+do+preacher+curls+proper+form+tutorial',
    desc: 'Body-Solid slanted preacher arm curl bench para sa striktong bicep isolation nang walang tulong ng balikat o momentum.',
    dos: [
      'Ilapat ang buong likod ng braso (triceps) sa 45-degree slanted pad.',
      'Hawakan ang EZ curl bar sa inner angled grips gamit ang underhand grip.',
      'I-curl ang bar pataas hanggang marating ang buong contraction ng bicep peak.'
    ],
    donts: [
      'HUWAG iangat ang mga siko o kilikili palayo sa pad habang nagka-curl.',
      'HUWAG i-hyperextend ang mga siko sa ilalim; panatilihin ang kaunting tensyon.'
    ],
    steps: [
      'Step 1: Arm Placement - Ipatong ang mga braso sa slanted pad at hawakan ang EZ-bar.',
      'Step 2: Strict Bicep Curl - Iangat ang bar patungo sa baba gamit lamang ang lakas ng biceps.',
      'Step 3: Slow Negative - Dahan-dahang ibaba ang bar sa loob ng 2-3 segundo.'
    ]
  },
  26: {
    guide: 'guide_id12_white_lat_pulldown.jpg',
    target: 'Latissimus Dorsi, Rhomboids, Middle Traps',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+plate+loaded+lat+pulldown+machine',
    desc: 'Plate-loaded iso-lateral lat pulldown machine para sa independent left/right back strength at symmetrical lats.',
    dos: [
      'I-adjust ang thigh hold-down pads upang mahigpit na nakalapat ang mga hita.',
      'Abutin ang independent handles at hilahin pababa habang dinidiin ang mga siko sa tagiliran.',
      'Panatilihing nakapuff ang dibdib sa bawat rep.'
    ],
    donts: [
      'HUWAG sumandal nang sobra paatras habang humihila.',
      'HUWAG bitawan nang bigla ang handles sa itaas.'
    ],
    steps: [
      'Step 1: Setup & Grip - Umupo, i-lock ang mga hita, at hawakan ang dalawang independent handles.',
      'Step 2: Symmetrical Pull - Hilahin ang dalawang braso pababa patungo sa balikat.',
      'Step 3: Full Upward Stretch - Kontroladong ibalik ang handles pataas para sa deep lat stretch.'
    ]
  },
  27: {
    guide: 'guide_id12_white_lat_pulldown.jpg',
    target: 'Latissimus Dorsi, Upper Back, Biceps',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+iso+lateral+high+pulldown+machine',
    desc: 'Plate-loaded high pulldown station na may diverging handles para sa targeted upper lat at lower trapezius activation.',
    dos: [
      'I-lock ang mga hita sa ilalim ng foam pads.',
      'Hilahin ang diverging handles pababa at palabas nang bahagya patungo sa collarbone.',
      'Pigain ang likod sa ilalim ng 1 segundo.'
    ],
    donts: [
      'HUWAG hilahin gamit lamang ang braso; pangunahan ng scapular depression.',
      'HUWAG mag-drop ng weights.'
    ],
    steps: [
      'Step 1: Grip Setup - Abutin ang mataas na handles at i-lock ang hita.',
      'Step 2: High Row Drive - Hilahin ang handles pababa habang pinipiga ang mga pakpak (lats).',
      'Step 3: Controlled Release - Ibalik sa itaas nang dahan-dahan.'
    ]
  },
  28: {
    guide: 'seatedRow.jpg',
    target: 'Middle Trapezius, Rhomboids, Latissimus Dorsi',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+seated+cable+row+machine+proper+form',
    desc: 'Precor iso-lateral plate-loaded seated low row machine na may vertical chest support pad at dual grip handles.',
    dos: [
      'I-adjust ang chest pad upang madaling maabot ang handles habang lapat ang dibdib.',
      'Itapak ang mga paa sa textured footplates.',
      'Hilahin ang handles paatras habang pinagdidiin ang shoulder blades sa likod.'
    ],
    donts: [
      'HUWAG iangat ang dibdib palayo sa support pad.',
      'HUWAG i-shrug ang mga balikat pataas patungo sa tainga.'
    ],
    steps: [
      'Step 1: Chest Pad Contact - Ilapat ang dibdib sa pad at hawakan ang handles nang may tuwid na likod.',
      'Step 2: Retraction & Row - Hilahin ang handles paatras habang nag-e-exhale at kinokontrata ang middle back.',
      'Step 3: Return Stretch - Dahan-dahang i-extend ang mga braso pasulong para sa stretch.'
    ]
  },
  29: {
    guide: 'cableCrossover.jpg',
    target: 'Pectoralis Major, Sternal & Clavicular Heads',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+cable+crossover+machine+tutorial',
    desc: 'Dual stack adjustable cable crossover machine para sa dynamic chest isolation mula high, mid, o low angles.',
    dos: [
      'Pumili ng tamang pulley height: High para sa lower chest, Mid para sa overall chest, Low para sa upper chest.',
      'Mag-stagger ng isang paa pasulong para sa matatag na balance base.',
      'Panatilihin ang bahagyang flex sa mga siko habang dinadala ang mga kamay sa gitna.'
    ],
    donts: [
      'HUWAG baguhin ang anggulo ng siko habang gumagalaw (it is a fly, not a press).',
      'HUWAG sumandal nang sobra pasulong.'
    ],
    steps: [
      'Step 1: Height & Grip - I-set ang pulleys at hawakan ang D-handles sa magkabilang gilid.',
      'Step 2: Crossover Motion - Dalhin ang mga kamay papunta sa gitna sa smooth hugging arc.',
      'Step 3: Peak Contraction - Pagdikitin o i-cross nang bahagya ang mga kamay at pigain ang dibdib.'
    ]
  },
  30: {
    guide: 'hackSquat.jpg',
    target: 'Quadriceps (Vastus Lateralis/Intermedius), Glutes',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+hack+squat+machine+proper+form',
    desc: 'Heavy-duty 45-degree plate-loaded linear hack squat sled para sa pure quad isolation nang may matatag na back support.',
    dos: [
      'Ilapat ang likod at ulo sa backrest, at ipatong ang mga balikat sa ilalim ng pads.',
      'Itapak ang mga paa sa gitna o bahagyang itaas ng footplate na shoulder-width apart.',
      'Bumaba nang kontrolado hanggang 90 degrees at itulak ang sled pataas gamit ang mga sakong.'
    ],
    donts: [
      'HUWAG iangat ang ibabang likod mula sa pad sa ilalim ng squat.',
      'HUWAG i-lockout ang mga tuhod sa tuktok.'
    ],
    steps: [
      'Step 1: Unrack Sled - Pumasok sa sled, itulak pataas nang kaunti, at alisin ang safety handles.',
      'Step 2: 90-Degree Descent - Dahan-dahang ibaba ang sled sa loob ng 2-3 segundo.',
      'Step 3: Quad Drive - Itulak pataas gamit ang lakas ng hita at i-lock pabalik ang safety handles pagkatapos ng set.'
    ]
  },
  31: {
    guide: 'squatRack.jpg',
    target: 'Quadriceps, Glutes, Hamstrings, Spinal Erectors',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+power+rack+squat+bench+tutorial',
    desc: 'Full commercial power rack cage na may weight plate storage horns para sa heavy free weight compound training.',
    dos: [
      'I-check ang safety pin levels bago maglagay ng mabigat na plates.',
      'Panatilihing pantay ang bigat sa magkabilang gilid ng barbell.',
      'I-brace ang buong core at panatilihing tuwid ang spine.'
    ],
    donts: [
      'HUWAG magbuhat nang lagpas sa kakayahan nang walang spotter o safety pins.',
      'HUWAG i-drop ang barbell sa sahig.'
    ],
    steps: [
      'Step 1: Equipment Check - I-set ang J-hooks at safety bars sa tamang taas.',
      'Step 2: Execution - Isagawa ang barbell squats o presses nang may kontroladong porma.',
      'Step 3: Re-rack - Ibalik ang bar nang diretso sa hooks.'
    ]
  },
  32: {
    guide: 'guide_id10_white_shoulder_press.jpg',
    target: 'Deltoid Muscle Group, Upper Trapezius',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+plate+loaded+shoulder+press+machine',
    desc: 'Plate-loaded dual lever functional shoulder press machine para sa overhead strength at deltoid mass.',
    dos: [
      'I-adjust ang upuan upang ang handles ay kapantay ng tainga sa simula.',
      'Itulak ang independent levers pataas nang sabay at maayos.',
      'Pigain ang mga balikat sa tuktok ng tulak.'
    ],
    donts: [
      'HUWAG i-arch ang likod palayo sa sandalan.',
      'HUWAG i-lockout ang siko nang marahas.'
    ],
    steps: [
      'Step 1: Position & Grip - Umupo nang lapat ang likod at hawakan ang overhead handles.',
      'Step 2: Upward Press - Itulak ang handles pataas hanggang halos tuwid na ang mga braso.',
      'Step 3: Slow Return - Dahan-dahang ibaba pabalik sa antas ng tainga.'
    ]
  },
  33: {
    guide: 'guide_id35_seated_chest_press.jpg',
    target: 'Pectoralis Major, Anterior Deltoids, Triceps',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+iso+lateral+chest+press+machine',
    desc: 'Commercial iso-lateral plate-loaded chest press na may converging arm action para sa maximum pectoral contraction.',
    dos: [
      'I-adjust ang upuan upang ang handles ay nakapantay sa gitna ng dibdib.',
      'Itulak pasulong ang independent arms sa natural na converging arc.',
      'Panatilihing nakadikit ang likod sa backrest.'
    ],
    donts: [
      'HUWAG i-flare ang mga siko nang masyadong mataas.',
      'HUWAG hayaang lumipad paharap ang mga balikat.'
    ],
    steps: [
      'Step 1: Seat Setup - Ayusin ang upuan at hawakan ang handles nang may neutral grip.',
      'Step 2: Converging Push - Itulak pasulong at paloob habang pinipiga ang dibdib.',
      'Step 3: Deep Stretch - Kontroladong ibalik ang handles para sa buong stretch.'
    ]
  },
  34: {
    guide: 'preacherCurl.jpg',
    target: 'Biceps Brachii, Brachialis',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+seated+bicep+curl+machine+tutorial',
    desc: 'Selectorized pin-stack seated bicep curl machine na may rotating cam handle para sa continuous bicep tension.',
    dos: [
      'I-adjust ang upuan upang ang mga siko ay nakalapat nang perpekto sa pivot point ng machine.',
      'Ilapat ang buong triceps sa padded rest.',
      'I-curl ang handles pataas gamit ang dalisay na lakas ng biceps.'
    ],
    donts: [
      'HUWAG iangat ang mga siko mula sa pad habang nagka-curl.',
      'HUWAG mag-lean back para makatulong sa buhat.'
    ],
    steps: [
      'Step 1: Pivot Alignment - I-align ang siko sa machine axis at hawakan ang swivel handles.',
      'Step 2: Concentric Curl - I-curl ang handles pataas patungo sa balikat.',
      'Step 3: Slow Negative - Dahan-dahang ibaba ang handles sa loob ng 2-3 segundo.'
    ]
  },
  35: {
    guide: 'guide_id35_seated_chest_press.jpg',
    target: 'Pectoralis Major, Front Deltoids, Triceps',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+seated+chest+press+machine+tutorial',
    desc: 'Selectorized pin-loaded seated chest press machine na may black frame para sa guided horizontal chest pressing.',
    dos: [
      'I-adjust ang upuan upang ang handles ay kapantay ng mid-chest.',
      'Itulak pasulong ang handles habang nag-e-exhale at kinokontrata ang pectorals.',
      'Panatilihing nakadikit ang likod sa vertical backrest.'
    ],
    donts: [
      'HUWAG i-lockout ang siko sa dulo ng bawat rep.',
      'HUWAG hayaang magbanggaan ang weight stack plates.'
    ],
    steps: [
      'Step 1: Start Stretch - Umupo nang lapat ang likod at hawakan ang horizontal handles.',
      'Step 2: Mid Press - Itulak pasulong nang may kontroladong lakas.',
      'Step 3: Peak Press & Squeeze - Pigain ang dibdib sa tuktok bago kontroladong ibalik.'
    ]
  },
  36: {
    guide: 'guide_id35_seated_chest_press.jpg',
    target: 'Upper & Mid Pectorals, Anterior Deltoids',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+adjustable+workout+bench+tutorial',
    desc: 'Multi-position commercial adjustable workout bench (Flat, Incline, Decline) para sa free weight dumbbell at barbell exercises.',
    dos: [
      'Siguraduhing naka-lock ang angle adjustment pin bago humiga sa bench.',
      'Panatilihing may 3 points of contact: ulo, likod, at puwit na nakalapat sa bench.',
      'Itapak nang flat ang dalawang paa sa sahig para sa solidong base.'
    ],
    donts: [
      'HUWAG gamitin ang bench kung hindi naka-lock nang buo ang safety pin.',
      'HUWAG iangat ang mga paa mula sa sahig habang nagbubuhat.'
    ],
    steps: [
      'Step 1: Angle Selection - I-set ang backrest sa nais na anggulo (Flat 0°, Incline 30°-45°).',
      'Step 2: Body Positioning - Humiga nang may neutral spine at nakalapat na mga paa.',
      'Step 3: Exercise Execution - Isagawa ang dumbbell presses, flyes, o curls nang may kontroladong porma.'
    ]
  },
  37: {
    guide: 'captainsChair.jpg',
    target: 'Rectus Abdominis, Hip Flexors, Triceps (Dips)',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+captains+chair+leg+raise+dip+station',
    desc: "Captain's chair vertical knee raise and dip station para sa core strengthening, lower abs, at bodyweight dips.",
    dos: [
      'Ilapat ang mga braso sa horizontal padded armrests at hawakan ang vertical grips.',
      'Panatilihing nakalapat ang likod sa vertical back pad.',
      'Iangat ang mga tuhod o tuwid na binti patungo sa dibdib gamit ang lakas ng abs.'
    ],
    donts: [
      'HUWAG mag-swing o mag-ugoy ng mga binti para makaangat (no momentum).',
      'HUWAG hayaang lumubog ang leeg sa pagitan ng mga balikat.'
    ],
    steps: [
      'Step 1: Forearm Pad Lock - Ilapat ang mga braso sa pads, hawakan ang grips, at ibitin ang katawan.',
      'Step 2: Controlled Knee Raise - Iangat ang mga tuhod pataas sa dibdib habang nag-e-exhale.',
      'Step 3: Slow Lowering - Dahan-dahang ibaba ang mga binti nang walang swinging.'
    ]
  },
  38: {
    guide: 'standingLateralRaise.jpg',
    target: 'Lateral Deltoids (Side Delts / Shoulder Width)',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+standing+lateral+raise+machine+tutorial',
    desc: 'Selectorized standing lateral raise machine na may red circular cam system para sa targeted side shoulder width.',
    dos: [
      'Tumayo sa gitna ng machine na nakalapat ang mga elbow pads sa labas ng iyong mga siko.',
      'Iangat ang mga braso paitaas sa gilid hanggang sa kapantay ng balikat.',
      'Pigain ang lateral deltoids sa tuktok ng 1 segundo.'
    ],
    donts: [
      'HUWAG iangat ang mga braso nang lagpas sa taas ng balikat upang maiwasan ang shoulder impingement.',
      'HUWAG mag-shrug gamit ang trapezius.'
    ],
    steps: [
      'Step 1: Stand & Align - Tumayo nang tuwid sa pagitan ng pads na may nakabaling core.',
      'Step 2: Lateral Raise - Iangat ang mga braso palabas at pataas sa gilid.',
      'Step 3: Peak Hold & Return - Pigain ang side delts sa tuktok at dahan-dahang ibaba.'
    ]
  },
  39: {
    guide: 'legExtension.jpg',
    target: 'Quadriceps (Rectus Femoris, Vastus Medialis)',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+leg+extension+machine+proper+form',
    desc: 'Star Trac Instinct selectorized leg extension machine para sa direct quadriceps isolation at knee joint stability.',
    dos: [
      'I-adjust ang backrest upang ang tuhod ay nakatapat sa pivot point ng machine.',
      'Iposisyon ang lower shin pad sa ibabaw ng iyong mga bukung-bukong (ankles).',
      'I-extend ang mga binti pataas hanggang sa tuwid na ang mga tuhod at pigain ang quads sa tuktok.'
    ],
    donts: [
      'HUWAG i-kick o i-jerk nang mabilis ang bigat pataas.',
      'HUWAG i-hyperextend ang tuhod nang marahas sa dulo.'
    ],
    steps: [
      'Step 1: Machine Setup - Ayusin ang backrest at shin roller, at humawak sa side handles.',
      'Step 2: Quad Extension - Iangat ang mga binti pataas habang nag-e-exhale at pinipiga ang quads.',
      'Step 3: Controlled Descent - Dahan-dahang ibaba ang bigat sa loob ng 2-3 segundo bago umabot sa stack.'
    ]
  },
  40: {
    guide: 'guide_id10_white_shoulder_press.jpg',
    target: 'Anterior & Medial Deltoids, Triceps',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+seated+shoulder+press+machine+tutorial',
    desc: 'Pin-loaded selectorized shoulder press machine na may dual grip handles para sa vertical pressing mass.',
    dos: [
      'I-adjust ang seat height upang ang handles ay kapantay ng iyong mga balikat.',
      'Itulak pataas sa isang tuwid at kontroladong linya.',
      'Panatilihing nakalapat ang likod sa back pad.'
    ],
    donts: [
      'HUWAG i-arch ang likod palayo sa sandalan.',
      'HUWAG i-lockout nang marahas ang mga siko.'
    ],
    steps: [
      'Step 1: Seat Alignment - Ayusin ang upuan at hawakan ang handles nang may matatag na grip.',
      'Step 2: Overhead Drive - Itulak pataas habang nag-e-exhale at kinokontrata ang mga balikat.',
      'Step 3: Return to Ear Level - Kontroladong ibaba pabalik sa antas ng tainga.'
    ]
  },
  41: {
    guide: 'pecFly.jpg',
    target: 'Pectoralis Major (Fly) / Rear Deltoids (Reverse Fly)',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+pec+fly+rear+delt+machine+tutorial',
    desc: 'Commercial overhead swivel-arm dual function pec fly and rear delt machine para sa complete chest and upper back balance.',
    dos: [
      'I-set ang overhead cam pins sa forward position para sa Pec Fly, o rear position para sa Rear Delt Fly.',
      'Panatilihing may bahagyang bend sa mga siko sa buong movement.',
      'Dalhin ang handles sa gitna at pigain ang dibdib nang 1 segundo.'
    ],
    donts: [
      'HUWAG i-straight nang matigas ang mga siko habang nagfa-fly.',
      'HUWAG hayaang mahila nang sobra paatras ang mga braso sa simula.'
    ],
    steps: [
      'Step 1: Pin Setup & Grip - I-set ang overhead pins at hawakan ang vertical handles nang nakalapat ang likod.',
      'Step 2: Squeezing Fly Motion - Dalhin ang handles papunta sa gitna sa malawak na hugging arc.',
      'Step 3: Controlled Negative - Dahan-dahang buksan ang mga braso hanggang sa natural chest stretch.'
    ]
  },
  42: {
    guide: 'cableCrossover.jpg',
    target: 'Full Body Functional Cable Movements, Chest, Core',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+functional+trainer+cable+machine+tutorial',
    desc: 'Dual pulley functional cable trainer na may adjustable height tracks at integrated pull-up station.',
    dos: [
      'I-adjust ang pulley height sa tamang track number para sa iyong partikular na exercise.',
      'Pumili ng tamang cable attachment (D-handles, rope, straight bar, ankle strap).',
      'Panatilihing naka-engage ang core sa buong galaw.'
    ],
    donts: [
      'HUWAG bitawan ang cable handle habang naka-angat ang weight stack.',
      'HUWAG gumamit ng mabigat na timbang kung nasisira ang porma.'
    ],
    steps: [
      'Step 1: Track Adjustment - Hilahin ang pin at i-slide ang pulley sa nais na taas.',
      'Step 2: Attachment & Stance - Ikabit ang handle at pumosisyon nang may matatag na balance.',
      'Step 3: Smooth Execution - Isagawa ang cable movement nang may tuluy-tuloy na tensyon.'
    ]
  },
  43: {
    guide: 'legPress45.jpg',
    target: 'Quadriceps, Gluteal Complex, Hamstrings',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+45+degree+leg+press+machine+proper+form',
    desc: 'Plate-loaded 45-degree heavy-duty leg press machine na may dual plate horns para sa safe maximal leg overload.',
    dos: [
      'Ilapat ang buong likod at puwit sa reclined seat cushion.',
      'Itapak ang mga paa sa gitna ng platform na shoulder-width apart.',
      'Ibaba ang sled hanggang sa marating ang 90-degree knee angle at itulak pataas gamit ang buong talampakan at sakong.'
    ],
    donts: [
      'HUWAG kailanman i-lockout ang mga tuhod (never lockout knees) sa tuktok upang maiwasan ang malubhang pinsala.',
      'HUWAG hayaang umangat ang puwit (butt lift) mula sa upuan habang bumababa.'
    ],
    steps: [
      'Step 1: Foot Placement & Unrack - Itapak ang mga paa, itulak ang sled nang kaunti, at i-disengage ang safety levers.',
      'Step 2: Controlled Lowering - Dahan-dahang ibaba ang sled hanggang 90 degrees sa tuhod habang nag-i-inhale.',
      'Step 3: Powerful Leg Drive - Itulak ang sled pataas gamit ang mga sakong habang nag-e-exhale, huminto bago mag-lockout.'
    ]
  },
  44: {
    guide: 'squatRack.jpg',
    target: 'Guided Barbell Squats, Overhead Press, Bench Press',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+smith+machine+squat+bench+tutorial',
    desc: 'Commercial Smith machine na may fixed vertical guided track at rotating lockout hooks sa bawat peg level.',
    dos: [
      'I-rotate ang bar gamit ang pulso upang ma-unhook mula sa safety pegs bago simulan ang rep.',
      'Iposisyon ang mga paa nang bahagyang pasulong sa bar line para sa komportableng squat mechanics.',
      'I-rotate pabalik ang bar upang ma-lock sa safety pegs sa pagtatapos ng set.'
    ],
    donts: [
      'HUWAG magsimula nang walang safety stopper pins na naka-set sa ilalim.',
      'HUWAG piliting baguhin ang natural bar path habang nasa fixed track.'
    ],
    steps: [
      'Step 1: Bar Alignment & Unhook - Pumasok sa ilalim ng bar, i-rotate ang pulso para kumalas sa safety pegs.',
      'Step 2: Vertical Track Movement - Isagawa ang squat, bench press, o shoulder press sa guided track.',
      'Step 3: Lockout & Re-hook - I-rotate pabalik ang pulso upang ligtas na kumagat ang hooks sa pegs.'
    ]
  },
  45: {
    guide: 'legPress45.jpg',
    target: 'Quadriceps, Gluteus Maximus, Calves',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+leg+press+machine+proper+form',
    desc: 'Commercial incline sled leg press machine na may wide multi-angle footplate para sa varied quad at glute emphasis.',
    dos: [
      'Panatilihing nakabaon ang likod at ulo sa sandalan.',
      'I-disengage ang safety handles bago ibaba ang sled.',
      'Itulak pataas gamit ang buong lakas ng hita nang may bahagyang bend sa tuhod sa tuktok.'
    ],
    donts: [
      'HUWAG i-lockout ang tuhod.',
      'HUWAG iangat ang mga sakong mula sa platform.'
    ],
    steps: [
      'Step 1: Setup & Safety Release - Itapak ang mga paa, itulak pataas, at alisin ang safety lock.',
      'Step 2: 90-Degree Knee Flexion - Dahan-dahang ibaba ang sled nang kontrolado.',
      'Step 3: Concentric Extension - Itulak pataas pabalik sa panimulang posisyon.'
    ]
  },
  46: {
    guide: 'guide_id12_white_lat_pulldown.jpg',
    target: 'Latissimus Dorsi, Biceps, Upper Back',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+lat+pulldown+machine+proper+form',
    desc: 'Star Trac Instinct high lat pulldown machine na may diverging overhead handles at thigh restraint rollers.',
    dos: [
      'I-adjust ang thigh rollers upang mahigpit na nakalapat sa iyong mga hita.',
      'Hawakan ang matataas na diverging handles at hilahin pababa patungo sa mga balikat.',
      'Pigain ang mga pakpak (lats) sa dulo ng hila.'
    ],
    donts: [
      'HUWAG sumandal nang sobra paatras habang humihila.',
      'HUWAG hayaang lumipad pataas ang mga balikat sa pagbalik.'
    ],
    steps: [
      'Step 1: Seat & Grip Setup - I-lock ang hita sa ilalim ng rollers at hawakan ang matataas na handles.',
      'Step 2: Downward Lat Drive - Hilahin ang handles pababa habang nag-e-exhale at pumu-puff ang dibdib.',
      'Step 3: Full Controlled Stretch - Dahan-dahang ibalik ang handles pataas para sa deep lat stretch.'
    ]
  },
  47: {
    guide: 'guide_id47_ezbar_curl.jpg',
    target: 'Biceps Brachii, Brachioradialis, Forearms',
    yt: 'https://www.youtube.com/results?search_query=how+to+do+ez+bar+bicep+curl+proper+form',
    desc: 'Barbell rack na may fixed-weight EZ-curl at straight barbells para sa ergonomic wrist angle bicep curling.',
    dos: [
      'Pumili ng tamang timbang mula sa rack at tumayo nang tuwid na may bahagyang nakabalingcore.',
      'Hawakan ang EZ-curl bar sa angled grooves gamit ang underhand grip.',
      'I-curl ang bar pataas patungo sa dibdib habang nakapako ang mga siko sa tagiliran.'
    ],
    donts: [
      'HUWAG mag-swing o gumamit ng momentum ng likod.',
      'HUWAG iusog ang mga siko pasulong habang nagbubuhat.'
    ],
    steps: [
      'Step 1: Underhand EZ-Grip - Hawakan ang EZ-bar sa angled grips nang may nakatayong maayos na postura.',
      'Step 2: Bicep Contraction - I-curl ang bar pataas patungo sa dibdib habang nag-e-exhale.',
      'Step 3: Slow Negative - Dahan-dahang ibaba ang bar sa loob ng 2-3 segundo.'
    ]
  },
  48: {
    guide: 'guide_id35_seated_chest_press.jpg',
    target: 'Pectoralis Major, Anterior Deltoids, Triceps',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+seated+chest+press+machine+tutorial',
    desc: 'Star Trac Instinct selectorized seated chest press machine na may horizontal push arms para sa strict pectoral isolation.',
    dos: [
      'I-adjust ang upuan upang ang horizontal handles ay nakapantay sa gitna ng iyong dibdib.',
      'Itulak pasulong ang handles habang nag-e-exhale at pinipiga ang pectorals.',
      'Panatilihing nakalapat ang likod sa back pad sa buong galaw.'
    ],
    donts: [
      'HUWAG i-lockout ang siko sa tuktok.',
      'HUWAG i-flare ang mga balikat pasulong.'
    ],
    steps: [
      'Step 1: Start Stretch - Umupo nang tuwid at hawakan ang handles nang may neutral wrist alignment.',
      'Step 2: Mid Press - Itulak pasulong ang handles nang may kontroladong puwersa.',
      'Step 3: Peak Press & Squeeze - Pigain ang dibdib sa tuktok at dahan-dahang ibalik.'
    ]
  },
  49: {
    guide: 'seatedRow.jpg',
    target: 'Latissimus Dorsi, Rhomboids, Middle Trapezius',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+seated+cable+low+row+machine',
    desc: 'Plate-loaded seated low row bench na may angled foot braces at wide row bar para sa lower at mid back thickness.',
    dos: [
      'Umupo sa mahabang bench at itapak ang mga paa sa angled footplates na may bahagyang bend sa tuhod.',
      'Hawakan ang row bar nang may tuwid na likod at bahagyang nakadikit na core.',
      'Hilahin ang bar patungo sa iyong puson (navel) habang pinipiga ang shoulder blades sa likod.'
    ],
    donts: [
      'HUWAG i-round ang ibabang likod pasulong habang umaabot sa bar.',
      'HUWAG sumandal nang sobra paatras habang humihila.'
    ],
    steps: [
      'Step 1: Foot Placement & Reach - Itapak ang mga paa, abutin ang bar nang may tuwid na spine.',
      'Step 2: Scapular Retraction & Row - Hilahin ang bar sa puson habang nag-e-exhale at pinipiga ang likod.',
      'Step 3: Controlled Extension - Dahan-dahang i-extend ang mga braso pasulong para sa deep lat stretch.'
    ]
  },
  50: {
    guide: 'guide_id10_white_shoulder_press.jpg',
    target: 'Anterior & Medial Deltoids, Triceps',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+seated+shoulder+press+machine+tutorial',
    desc: 'Star Trac Instinct seated shoulder press machine na may vertical overhead push levers para sa shoulder strength.',
    dos: [
      'I-adjust ang upuan upang ang handles ay kapantay ng iyong mga tainga sa simula.',
      'Itulak pataas sa isang tuwid at kontroladong vertical path.',
      'Panatilihing nakalapat ang likod sa backrest.'
    ],
    donts: [
      'HUWAG i-arch ang likod palayo sa upuan.',
      'HUWAG i-lockout ang siko nang marahas.'
    ],
    steps: [
      'Step 1: Seat Alignment - Ayusin ang upuan at hawakan ang overhead handles.',
      'Step 2: Vertical Overhead Drive - Itulak pataas habang nag-e-exhale at kinokontrata ang deltoids.',
      'Step 3: Slow Return - Dahan-dahang ibaba pabalik sa antas ng tainga.'
    ]
  },
  51: {
    guide: 'legExtension.jpg',
    target: 'Quadriceps, Patellar Tendon, Calves',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+leg+extension+machine+proper+form',
    desc: 'Freemotion cable dual leg extension and calf machine para sa dynamic leg extension at lower leg conditioning.',
    dos: [
      'Umupo nang lapat ang likod sa sandalan at ipatong ang mga paa sa foot pedals.',
      'I-extend ang mga binti palabas at pataas laban sa cable resistance.',
      'Pigain ang quadriceps sa dulo ng bawat rep.'
    ],
    donts: [
      'HUWAG mag-kick nang mabilis nang walang control.',
      'HUWAG i-lockout ang mga tuhod nang marahas.'
    ],
    steps: [
      'Step 1: Seat & Pedal Position - Umupo at iposisyon ang mga paa sa pedals.',
      'Step 2: Extension Drive - Itulak ang mga binti pataas habang nag-e-exhale.',
      'Step 3: Controlled Descent - Kontroladong ibaba pabalik sa panimulang posisyon.'
    ]
  },
  52: {
    guide: 'guide_id52_flat_chest_press.jpg',
    target: 'Pectoralis Major (Mid & Sternal Pectorals), Triceps',
    yt: 'https://www.youtube.com/results?search_query=how+to+use+horizontal+bench+chest+press+machine',
    desc: 'Star Trac Instinct horizontal flat bench chest press machine kung saan nakahiga ang lifter sa flat bench at itinutulak pataas ang overhead push levers.',
    dos: [
      'Humiga nang flat sa horizontal bench na may 3 points of contact (ulo, likod, at puwit).',
      'Itapak nang flat ang dalawang paa sa sahig para sa solidong push base.',
      'Hawakan ang overhead push lever handles sa antas ng mid-chest at itulak pataas palayo sa dibdib.',
      'Pigain ang pectoralis major sa tuktok habang pinapanatiling nakabaon ang shoulder blades sa bench.'
    ],
    donts: [
      'HUWAG iangat ang puwit o mag-arch nang sobra sa likod palayo sa horizontal bench.',
      'HUWAG i-lockout nang marahas ang mga siko sa tuktok ng tulak.',
      'HUWAG hayaang bumagsak ang levers pabalik sa dibdib; kontrolin ang eccentric lowering.'
    ],
    steps: [
      'Step 1: Lying Flat Setup - Humiga nang flat sa horizontal bench, itapak ang mga paa sa sahig, at hawakan ang overhead levers sa antas ng dibdib.',
      'Step 2: Mid Press Drive - Itulak ang levers pataas gamit ang puwersa ng dibdib habang nag-e-exhale.',
      'Step 3: Peak Press & Squeeze - Pigain ang pectoralis major sa full extension at dahan-dahang ibaba pabalik.'
    ]
  },
  53: {
    guide: 'guide_id53_deadlift.jpg',
    target: 'Posterior Chain, Gluteus Maximus, Hamstrings, Erector Spinae (Full Body)',
    yt: 'https://www.youtube.com/results?search_query=how+to+deadlift+proper+form+barbell+bumper+plates',
    desc: 'Heavy-duty floor bumper plate toast rack at Olympic rubber plates para sa Olympic weightlifting, deadlifts, at power cleans.',
    dos: [
      'Pumili ng tamang Olympic bumper plates mula sa rack at i-lock ang collars sa barbell.',
      'Tumayo nang ang bar ay nakatapat sa gitna ng iyong mga paa (mid-foot).',
      'I-hinge ang balakang, panatilihing flat ang likod, at iangat ang bar habang idinidiin ang mga sakong sa sahig.',
      'Tumayo nang tuwid sa lockout habang pinipiga ang glutes at itinutuwid ang balakang.'
    ],
    donts: [
      'HUWAG i-round ang likod (cat back) habang nag-aangat upang maiwasan ang herniated disc.',
      'HUWAG i-jerk ang bar mula sa sahig; lumikha ng tensyon (slack out of the bar) bago iangat.'
    ],
    steps: [
      'Step 1: Stance & Grip Setup - Mid-foot sa ilalim ng bar, hip hinge pababa, hawakan ang bar sa labas ng tuhod nang may flat back.',
      'Step 2: Leg & Hip Drive - Itulak ang sahig palayo gamit ang mga binti habang sabay na umaangat ang balakang at balikat.',
      'Step 3: Lockout & Return - Tumayo nang tuwid sa tuktok na may glute squeeze, at dahan-dahang ibaba pabalik sa sahig.'
    ]
  },
  54: {
    guide: 'guide_id54_kettlebells.jpg',
    target: 'Gluteus Maximus, Hamstrings, Core Bracing, Hip Power',
    yt: 'https://www.youtube.com/results?search_query=how+to+do+kettlebell+swings+proper+form+tutorial',
    desc: 'Color-coded cast iron at competition kettlebells para sa ballistic hip hinge power, kettlebell swings, at functional conditioning.',
    dos: [
      'Tumayo nang bahagyang mas malapad sa balikat at mag-hip hinge nang may neutral na spine.',
      'Hilahin ang kettlebell pabalik sa pagitan ng mga hita (hike the bell).',
      'I-snap ang balakang paharap nang eksplosibo gamit ang glutes upang lumutang ang bell sa antas ng dibdib.',
      'I-brace ang tiyan (hard abdominal brace) sa tuktok ng swing.'
    ],
    donts: [
      'HUWAG gamitin ang mga braso para iangat ang kettlebell (it is a hip drive, not a front raise).',
      'HUWAG mag-squat nang mababa; ito ay isang hip hinge movement.'
    ],
    steps: [
      'Step 1: Hike & Hip Hinge - Yumuko sa balakang, hawakan ang kettlebell, at i-hike pabalik sa pagitan ng mga hita.',
      'Step 2: Explosive Hip Snap - Itulak ang balakang paharap nang mabilis gamit ang glutes at hamstrings.',
      'Step 3: Float & Recoil - Hayaang lumutang ang bell sa taas ng dibdib bago kontroladong mag-hinge pabalik.'
    ]
  }
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
  youtubeUrl: string;
  setupInstructions: string[];
  steps: string[];
  dos: string[];
  donts: string[];
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
  youtubeUrl: string;
  weightScale?: string;
  muscles?: string[];
  warning?: string;
  overview: string;
  machineAdjustments: string[];
  safetyRules: string[];
  dos: string[];
  donts: string[];
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
  youtubeUrl: string;
  dos: string[];
  donts: string[];
  steps: { stepNumber: number; title: string; instruction: string; tip?: string }[];
}

export const EQUIPMENT_GUIDES_MAP: Record<number, EquipmentFullGuide> = {
`;

serverEquip.sort((a,b) => a.id - b.id).forEach(e => {
  const meta = comprehensiveGuideData[e.id] || {
    guide: 'guide_id35_seated_chest_press.jpg',
    target: 'Compound Muscles',
    yt: 'https://www.youtube.com/results?search_query=gym+machine+workout+tutorial',
    desc: e.name,
    dos: ['Panatilihing nakadikit ang core at maayos ang postura.', 'Kontrolin ang pagbaba at pag-angat ng bigat.'],
    donts: ['Huwag mag-lockout ng joints.', 'Huwag gumamit ng momentum.'],
    steps: ['Step 1: Setup - Posisyon ang katawan nang maayos.', 'Step 2: Execution - Isagawa ang pagbuhat nang may kontrol.']
  };

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
    youtubeUrl: ${JSON.stringify(meta.yt)},
    weightScale: 'Pin / Plate Loaded Weight Stack',
    muscles: [${JSON.stringify(primary)}, ${secondary.map(s => JSON.stringify(s)).join(', ')}],
    warning: 'Panatilihing neutral ang spinal alignment at kontrolado ang bilis ng pagbuhat.',
    overview: ${JSON.stringify(meta.desc)},
    primaryIllustration: ${JSON.stringify(guideImgPath)},
    dos: ${JSON.stringify(meta.dos, null, 6)},
    donts: ${JSON.stringify(meta.donts, null, 6)},
    machineAdjustments: [
      'I-adjust ang seat height o platform upang ang pivot point ng makina ay nakatapat sa iyong kasukasuan (joint axis).',
      'Pumili ng tamang working weight na kaya mong buhatin nang may striktong porma.'
    ],
    safetyRules: [
      'Panatilihing naka-engage ang core muscles sa bawat repitasyon.',
      'Iwasang mag-lockout o mag-snap ng mga tuhod at siko sa ilalim ng mabigat na karga.',
      'Kontrolin ang 2-3 segundong eccentric lowering phase nang hindi ibinabagsak ang bigat.'
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
        youtubeUrl: ${JSON.stringify(meta.yt)},
        illustration: ${JSON.stringify(guideImgPath)},
        illustrationUrl: ${JSON.stringify(guideImgPath)},
        recommendedSetsReps: '3-4 sets x 8-12 reps',
        setupInstructions: [
          'Ilapat ang katawan nang maayos sa support pads na may neutral spinal alignment.',
          'Hawakan ang grips o itapak ang mga paa nang shoulder-width apart.'
        ],
        steps: ${JSON.stringify(meta.steps, null, 8)},
        dos: ${JSON.stringify(meta.dos, null, 8)},
        donts: ${JSON.stringify(meta.donts, null, 8)},
        executionSteps: ${JSON.stringify(meta.steps.map((s, idx) => ({
          stepNumber: idx + 1,
          title: s.split(' - ')[0] || 'Step ' + (idx + 1),
          description: s.split(' - ')[1] || s,
          breathing: idx === 0 ? 'Inhale deeply at i-stabilize ang torso.' : 'Exhale habang kinokontrata ang target muscle.',
          formCue: 'Panatilihing retracted ang shoulder blades at aligned ang kasukasuan.'
        })), null, 8)},
        commonMistakes: ${JSON.stringify(meta.donts, null, 8)},
        safetyTips: [
          'Siguraduhing naka-lock ang safety collars, pins, o catchers bago simulan ang set.'
        ],
        safetyWarnings: ${JSON.stringify(meta.donts, null, 8)},
        proTips: [
          'Mag-focus sa 2-segundong pagbaba (eccentric lowering) para sa pinakamataas na muscle growth.'
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
    youtubeUrl: g.youtubeUrl || '',
    dos: g.dos || [],
    donts: g.donts || [],
    steps: (g.variations[0]?.executionSteps || []).map(s => ({
      stepNumber: s.stepNumber,
      title: s.title,
      instruction: s.description,
      tip: s.formCue
    }))
  };
}\n`;

fs.writeFileSync(path.join(root, 'frontend/src/app/data/equipment-guides.data.ts'), content, 'utf8');
console.log('Successfully updated equipment-guides.data.ts with detailed Dos, Donts, and YouTube links!');
