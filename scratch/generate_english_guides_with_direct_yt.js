const fs = require('fs');
const path = require('path');

const root = 'c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo';
const serverEquip = JSON.parse(fs.readFileSync('C:/Users/delwi/.gemini/antigravity-ide/brain/13e57574-9b61-4ae6-88cd-5b4f45cab5ae/scratch/server_equipment.json', 'utf8'));

// 100% Professional English Guides with Direct YouTube Video IDs and Embedded URLs:
const englishGuidesDatabase = {
  9: {
    guide: 'guide_id9_white_vsquat.jpg',
    target: 'Quadriceps, Gluteus Maximus, Hamstrings',
    videoId: 'Y4sIq6c34v0',
    desc: 'Leverage V-Squat Machine with angled textured footplate, red back support pad, and cushioned shoulder levers for targeted quad and glute hypertrophy.',
    dos: [
      'Position shoulders securely under the padded levers before releasing the safety latch.',
      'Keep your entire foot flat on the angled footplate, driving weight primarily through your heels.',
      'Brace your core tightly and maintain full back contact against the support pad throughout the movement.',
      'Descend to at least 90 degrees (thighs parallel to the platform) for complete quadriceps stretch.',
      'Inhale deeply on the descent and exhale forcefully as you drive the sled upward.'
    ],
    donts: [
      'DO NOT violently lockout or hyperextend your knees at the top of the extension.',
      'DO NOT allow your heels to rise or lift off the footplate during the squat.',
      'DO NOT round your lower spine away from the back pad under load.',
      'DO NOT drop down rapidly; maintain a controlled 2-3 second eccentric cadence.'
    ],
    steps: [
      'Step 1: Setup & Unrack - Step onto the center of the angled platform, rest shoulders under the pads, and disengage the side safety handles.',
      'Step 2: Controlled Descent - Inhale, brace core, and bend knees smoothly until thighs reach a 90-degree angle with the footplate.',
      'Step 3: Concentric Drive & Lockout - Press through heels to drive upward, squeezing quadriceps and glutes while keeping soft knees at top.'
    ]
  },
  10: {
    guide: 'guide_id10_white_shoulder_press.jpg',
    target: 'Anterior Deltoids, Lateral Deltoids, Triceps Brachii',
    videoId: '_ik7x2fM87I',
    desc: 'Star Trac selectorized overhead shoulder press machine engineered for isolated deltoid hypertrophy and vertical pressing strength.',
    dos: [
      'Adjust seat height so handles align directly at shoulder height in the start position.',
      'Keep back, head, and glutes firmly against the backrest throughout the press.',
      'Press handles upward in a smooth, continuous vertical arc until arms are nearly extended.',
      'Retract and depress your shoulder blades to prevent excessive neck strain and impingement.'
    ],
    donts: [
      'DO NOT arch your lower back excessively away from the seat to push heavy resistance.',
      'DO NOT slam or harshly lockout your elbow joints at the top.',
      'DO NOT let the weight stack crash down; control the negative lowering phase.'
    ],
    steps: [
      'Step 1: Seat Height & Grip Setup - Sit upright with back supported, gripping handles slightly wider than shoulder-width.',
      'Step 2: Overhead Drive - Exhale and press handles vertically overhead, focusing on deltoid contraction.',
      'Step 3: Controlled Lowering - Inhale and slowly lower handles back to ear level under continuous muscular tension.'
    ]
  },
  11: {
    guide: 'guide_id11_white_hip_abductor.jpg',
    target: 'Gluteus Medius, Tensor Fasciae Latae (Outer Thighs)',
    videoId: 'U3U2oX5YkX0',
    desc: 'Selectorized hip abductor machine with swivel knee pads designed to strengthen the outer hip complex and stabilize pelvic alignment.',
    dos: [
      'Position the swivel pads against the outside of your knees and place feet on the foot pegs.',
      'Sit tall with your spine neutral, holding the side stability handles for support.',
      'Push your knees outward in a wide arc until achieving full contraction in the gluteus medius.',
      'Hold and squeeze at peak abduction for 1 full second before returning.'
    ],
    donts: [
      'DO NOT use torso swinging or body momentum to push the lever arms outward.',
      'DO NOT allow the weight stack plates to collide or bounce together at the center.'
    ],
    steps: [
      'Step 1: Start Setup - Sit in the machine, adjust range-of-motion pin so pads rest against outer knees.',
      'Step 2: Abduction Drive - Exhale and push knees outward against resistance in a smooth, wide arc.',
      'Step 3: Peak Squeeze & Slow Return - Hold the contraction for 1 second, then return inward slowly under control.'
    ]
  },
  12: {
    guide: 'guide_id12_white_lat_pulldown.jpg',
    target: 'Latissimus Dorsi, Teres Major, Biceps Brachii',
    videoId: 'CAwf7n6Luuc',
    desc: 'Freemotion overhead lat pulldown machine with wide multi-grip bar and thigh restraint rollers for complete back V-taper development.',
    dos: [
      'Lock thighs snugly under the foam rollers so your lower body remains anchored.',
      'Grip the wide bar with an overhand grip slightly wider than shoulder-width.',
      'Puff chest upward with a slight backward torso lean (10-15 degrees) and pull bar to upper clavicle.',
      'Lead the downward motion with your elbows, driving them down and back into your sides.'
    ],
    donts: [
      'DO NOT pull the bar behind your neck; always pull to the front to safeguard rotator cuffs.',
      'DO NOT lean excessively backward or swing your hips to generate momentum.',
      'DO NOT let shoulders shrug upward at the top; keep scapulae depressed.'
    ],
    steps: [
      'Step 1: Grip & Thigh Setup - Grasp wide bar overhead, sit down, and secure thighs beneath foam rollers.',
      'Step 2: Scapular Retraction & Pull - Exhale, retract shoulder blades, and pull bar smoothly to upper chest.',
      'Step 3: Full Controlled Stretch - Inhale and slowly extend arms overhead for a deep, full lat stretch.'
    ]
  },
  13: {
    guide: 'guide_id13_white_chest_press.jpg',
    target: 'Pectoralis Major (Mid/Lower Chest), Anterior Deltoids, Triceps',
    videoId: '4YpxZXFADmc',
    desc: 'Selectorized horizontal seated chest press machine with dual-grip levers for strict pectoral hypertrophy, front shoulder development, and triceps pressing strength.',
    dos: [
      'Adjust seat height so horizontal handles align directly with your mid-chest (nipple line).',
      'Keep back and head firmly supported against the backrest pad with feet flat on the floor.',
      'Exhale and push the handles straight forward away from your chest in a strong, controlled press.',
      'Squeeze your chest muscles at full extension while keeping a soft bend in your elbows.',
      'Inhale and slowly lower handles back under control until you feel a gentle, safe chest stretch.'
    ],
    donts: [
      'DO NOT allow your shoulders to roll forward or lift away from the back pad during the press.',
      'DO NOT forcefully lockout or hyperextend your elbow joints at the end of the push.',
      'DO NOT let the weight stack crash down between reps; maintain continuous muscular tension.',
      'DO NOT arch your lower back excessively to heave heavy weight.'
    ],
    steps: [
      'Step 1: Seat & Grip Setup - Adjust seat height so handles sit at mid-chest level, grip handles firmly, and plant feet.',
      'Step 2: Forward Push - Exhale and drive handles forward horizontally away from chest with controlled power.',
      'Step 3: Full Extension & Return - Squeeze pectorals at full extension, then slowly lower back under a 2-3 second cadence.'
    ]
  },
  14: {
    guide: 'guide_id14_white_seated_calf_raise.jpg',
    target: 'Soleus, Gastrocnemius (Calf Complex)',
    videoId: 'HSGjUouQZCQ',
    desc: 'Warrior Fitness plate-loaded seated calf raise machine engineered for isolated soleus hypertrophy, Achilles tendon resilience, and lower leg strength.',
    dos: [
      'Place the balls of your feet securely on the lower edge of the footplate with heels hanging off.',
      'Lock the padded thigh lever securely over your lower quadriceps right above the knees.',
      'Disengage the safety support latch before initiating your working repetitions.',
      'Lower your heels as deep as comfortably possible to achieve a full, deep calf stretch.',
      'Exhale and drive upward through the balls of your feet to maximum peak plantarflexion.',
      'Pause and squeeze your calves at the top for 1-2 seconds on every repetition.'
    ],
    donts: [
      'DO NOT bounce or use rapid elastic recoil at the bottom of the stretch.',
      'DO NOT lean your upper body backward or use torso momentum to lift the knee pad.',
      'DO NOT place your arches or mid-foot on the foot block; use only the balls of your feet.'
    ],
    steps: [
      'Step 1: Setup & Deep Stretch - Lock knee pads snugly over lower quads, release safety bar, and drop heels fully below the footplate.',
      'Step 2: Plantarflexion Drive - Exhale and push through the balls of your feet and toes, elevating the lever smoothly.',
      'Step 3: Peak Contraction & Squeeze - Hold apex peak contraction for 1-2 seconds, then lower heels slowly under a 3-second negative.'
    ]
  },
  15: {
    guide: 'guide_id15_white_incline_chest_press.jpg',
    target: 'Upper Pectoralis Major (Clavicular Head), Anterior Deltoids, Triceps',
    videoId: 'VesHgJR14E8',
    desc: 'Pure Strength plate-loaded incline chest press machine engineered with converging lever arms for isolated upper pectoral hypertrophy (clavicular head) and shoulder strength.',
    dos: [
      'Load equal weight plates securely onto both side horns before starting.',
      'Adjust seat height so the press handles align directly across your upper chest (below collarbones).',
      'Plant both feet firmly on the floor and maintain a natural arch in your upper back against the incline pad.',
      'Exhale and push the plate-loaded levers upward and forward in a smooth converging arc.',
      'Squeeze upper chest firmly at peak extension while maintaining a slight bend in your elbows.',
      'Inhale and slowly lower the levers under control over a 2-3 second eccentric cadence.'
    ],
    donts: [
      'DO NOT allow shoulders to shrug or roll forward off the incline back pad.',
      'DO NOT bounce the weight or drop the levers harshly onto the bottom stops.',
      'DO NOT aggressively snap or lockout elbow joints under heavy plate resistance.'
    ],
    steps: [
      'Step 1: Incline Setup & Grip - Adjust seat height so handles sit at upper-chest level, grip firmly, and retract shoulder blades.',
      'Step 2: Upward Incline Drive - Exhale and drive the plate-loaded levers upward and forward in a converging motion.',
      'Step 3: Peak Contraction & Squeeze - Squeeze upper pectorals at the top, then lower levers back smoothly under control.'
    ]
  },
  16: {
    guide: 'guide_id16_white_dumbbells.jpg',
    target: 'Biceps Brachii, Brachialis, Forearm Flexors',
    videoId: 'ykJmrZ5v0Oo',
    desc: 'Commercial multi-tier dumbbell rack offering versatile free weight loading for standing supinated bicep curls, hammer curls, and upper-body arm hypertrophy.',
    dos: [
      'Stand tall with shoulder-width stance, core braced, and shoulders retracted.',
      'Keep elbows pinned closely to your torso sides throughout the entire curling range.',
      'Supinate wrists (rotate palms upward towards the ceiling) as you curl the dumbbells.',
      'Squeeze biceps forcefully at the top of the contraction for 1-2 seconds.',
      'Lower the dumbbells under strict control over a 2-3 second eccentric cadence.'
    ],
    donts: [
      'DO NOT swing your torso or use hip momentum to heave the weights upward.',
      'DO NOT let your elbows drift forward away from your ribs during the lift.',
      'DO NOT drop the dumbbells rapidly; maintain active eccentric resistance.'
    ],
    steps: [
      'Step 1: Neutral Stance & Grip - Stand upright holding dumbbells down at sides with palms facing inward.',
      'Step 2: Supinating Curl Drive - Exhale and curl dumbbells upward while rotating wrists until palms face shoulders.',
      'Step 3: Peak Contraction & Squeeze - Squeeze biceps at the apex, then lower weights slowly with a 3-second negative.'
    ]
  },
  17: {
    guide: 'guide_id17_white_seated_back_extension.jpg',
    target: 'Erector Spinae (Lower Back), Multifidus, Gluteus Maximus',
    videoId: 'HAS0dQ8O3-U',
    desc: 'Selectorized seated back extension machine engineered for safe, isolated strengthening of the lumbar spinal erectors and posterior chain through guided seated hip-back articulation.',
    dos: [
      'Place your feet firmly on the forward footplate with legs extended and knees slightly soft.',
      'Grip the metal side handles firmly down beside the seat cushion to stabilize your pelvis.',
      'Position the revolving cylindrical pad against your upper back (scapular region).',
      'Start hinged forward from the hips for a comfortable spinal stretch.',
      'Exhale and push your upper torso backward against the roller pad into full extension.',
      'Squeeze your lower back and glutes at peak extension, then return slowly under control over 2-3 seconds.'
    ],
    donts: [
      'DO NOT let your hands leave the side seat handles; holding them prevents hip shifting.',
      'DO NOT bend your knees excessively or try to kick the footplate.',
      'DO NOT let the weight stack slam on the eccentric return.'
    ],
    steps: [
      'Step 1: Setup & Forward Flexion - Extend legs on footplate, grip side handles firmly, and hinge forward with pad behind upper back.',
      'Step 2: Posterior Extension Drive - Exhale and drive upper torso backward against the roller pad smoothly.',
      'Step 3: Full Extension & Peak Squeeze - Push all the way back into full extension, contract spinal erectors, and lower slowly.'
    ]
  },
  18: {
    guide: 'guide_id18_white_pickleball.jpg',
    target: 'Cardiovascular Endurance, Dynamic Agility, Lateral Footwork, Core Obliques',
    videoId: 'fTvPYdKdnpE',
    desc: 'Regulation indoor pickleball court engineered for cardiovascular endurance, lateral agility, hand-eye coordination, and fast-paced strategic racket play.',
    dos: [
      'SERVE UNDERHAND: Hit the ball below waist level with paddle moving upward diagonally crosscourt past the opponent kitchen line.',
      'TWO-BOUNCE RULE: The ball must bounce once on the serve and once on the return before either player is permitted to volley.',
      'NON-VOLLEY ZONE (KITCHEN): Stay behind the 7-foot kitchen line when hitting volleys in the air; only step in after the ball bounces.',
      'SCORING: Points are only scored by the serving team; games are typically played to 11 points (win by 2 margin).',
      'COURT SAFETY: Always wear non-marking indoor court shoes with lateral support and perform dynamic warm-ups.'
    ],
    donts: [
      'DO NOT volley the ball (hit out of the air) while touching or stepping inside the Non-Volley Zone (Kitchen).',
      'DO NOT hit an overhand or overhead tennis-style serve; the contact point must be below your navel.',
      'DO NOT wear running shoes that lack lateral support to avoid ankle roll injuries during fast lateral cuts.'
    ],
    steps: [
      'Step 1: Underhand Crosscourt Serve - Serve underhand diagonally crosscourt from behind the baseline, clearing the NVZ kitchen.',
      'Step 2: Kitchen (NVZ) & Two-Bounce Rule - Allow the serve and return to bounce once before volleying; never volley inside the 7ft kitchen.',
      'Step 3: Dynamic Forehand Drive & Agility - Maintain an athletic split-step ready stance, rotating core and hips to drive the ball deep.'
    ]
  },
  19: {
    guide: 'squatRack.jpg',
    target: 'Quadriceps, Gluteus Maximus, Hamstrings, Core Stabilizers',
    videoId: 'ultWZbUMPL8',
    desc: 'Heavy-duty open Olympic barbell squat rack with adjustable J-hooks and heavy-duty safety spotter arms.',
    dos: [
      'Set J-hooks at mid-chest height for easy, safe unrack and re-rack.',
      'Rest barbell across upper trapezius (high bar) or rear deltoids (low bar).',
      'Take a deep breath, brace core (Valsalva), and squat until hip crease is parallel with knees.',
      'Drive through the entire foot, keeping chest proud on the ascent.'
    ],
    donts: [
      'DO NOT let knees cave inward (valgus collapse) during the drive.',
      'DO NOT round your lower back or let heels lift off the floor.'
    ],
    steps: [
      'Step 1: Unrack & Step Back - Step under bar, brace upper back, unrack, and take two short steps backward.',
      'Step 2: Squat Descent - Hinge hips back and bend knees smoothly to reach parallel depth.',
      'Step 3: Upward Drive & Re-rack - Drive through floor to stand upright, then step forward to re-rack in hooks.'
    ]
  },
  20: {
    guide: 'guide_id20_white_functional_trainer.jpg',
    target: 'Pectoralis Major (Mid & Sternal Head), Anterior Deltoids, Core Obliques',
    videoId: 'XKuB2QS_lBo',
    desc: 'Dual-arm multi-functional cable trainer engineered with independently rotating articulating arms for standing cable chest flys, functional strength, and multi-angle hypertrophy.',
    dos: [
      'Adjust both rotating cable arms to chest/shoulder height and attach standard D-handles.',
      'Take a forward staggered split-stance for maximal balance and core stabilization.',
      'Maintain a slight, fixed bend in your elbows throughout the entire fly movement.',
      'Sweep the D-handles forward in a wide hugging arc until your hands meet directly in front of your chest.',
      'Squeeze your pectorals tightly for 1-2 seconds at peak contraction.',
      'Inhale and slowly open your arms back under strict 2-3 second eccentric control to stretch the chest.'
    ],
    donts: [
      'DO NOT turn the fly into a chest press by bending and extending your elbows during the movement.',
      'DO NOT swing your torso or use excessive body momentum to bring the handles together.',
      'DO NOT let the weight stack crash on the return; maintain continuous cable tension.'
    ],
    steps: [
      'Step 1: Open Fly Stretch & Stance - Adopt a forward split-stance, holding D-handles with arms extended wide and chest stretched open.',
      'Step 2: Sweeping Fly Arc Drive - Exhale and bring handles forward in a wide hugging arc with a slight fixed elbow bend.',
      'Step 3: Peak Pectoral Contraction & Squeeze - Squeeze chest muscles firmly as hands meet in front, then slowly open arms back.'
    ]
  },
  21: {
    guide: 'guide_id21_white_hyperextension_bench.jpg',
    target: 'Erector Spinae (Lower Back), Gluteus Maximus, Biceps Femoris (Hamstrings)',
    videoId: 'ph3pddpKzzw',
    desc: 'Commercial 45-degree hyperextension and back extension bench engineered with dual thigh support pads and padded ankle rollers for posterior chain hypertrophy and spinal erector resilience.',
    dos: [
      'Adjust the thigh support pads so the top edge rests right below your hip crease, allowing full hip flexion.',
      'Lock your Achilles tendons and calves snugly under the lower padded ankle rollers with feet flat on the footplate.',
      'Cross your arms over your chest or place fingertips lightly behind your ears.',
      'Inhale and hinge forward at the hips, lowering your torso toward the floor for a deep hamstring and lower back stretch.',
      'Exhale and drive your hips into the pad, raising your torso until your body forms a straight 45-degree line with your legs.',
      'Squeeze your glutes, hamstrings, and lower back firmly at peak extension for 1-2 seconds.'
    ],
    donts: [
      'DO NOT forcefully hyperextend or arch your spine backward past a straight 45-degree neutral line.',
      'DO NOT use fast bouncing or swinging momentum from the bottom of the stretch.',
      'DO NOT pull on your neck or jerk your head upward during the ascent.'
    ],
    steps: [
      'Step 1: Setup & Lowering Stretch - Lock ankles under rollers, align hip pads below crease, and hinge forward smoothly.',
      'Step 2: Posterior Extension Drive - Exhale and drive hips into pad, raising torso smoothly along the 45-degree plane.',
      'Step 3: Peak Contraction & Alignment - Squeeze glutes and lower back in straight alignment, then lower over 3 seconds.'
    ]
  },
  22: {
    guide: 'guide_id21_white_hyperextension_bench.jpg',
    target: 'Erector Spinae (Lower Back), Gluteus Maximus, Hamstring Complex',
    videoId: 'ph3pddpKzzw',
    desc: 'Heavy-duty 45-degree hyperextension Roman chair bench for posterior chain strengthening, glute-ham isolation, and lumbar spine conditioning.',
    dos: [
      'Position hip pads just beneath the pelvic crease to ensure unrestricted hip hinging.',
      'Maintain a neutral spine throughout both the lowering stretch and upward drive.',
      'Contract glutes and hamstrings to initiate the upward ascent.',
      'Pause for 1-2 seconds at the top of each rep in full linear alignment.'
    ],
    donts: [
      'DO NOT hyperextend your lumbar spine beyond parallel alignment with your legs.',
      'DO NOT bounce out of the bottom stretch position.',
      'DO NOT round upper shoulders excessively.'
    ],
    steps: [
      'Step 1: Setup & Lowering Stretch - Lock ankles under rollers, align hip pads below crease, and hinge forward smoothly.',
      'Step 2: Posterior Extension Drive - Exhale and drive hips into pad, raising torso smoothly along the 45-degree plane.',
      'Step 3: Peak Contraction & Alignment - Squeeze glutes and lower back in straight alignment, then lower over 3 seconds.'
    ]
  },
  23: {
    guide: 'squatRack.jpg',
    target: 'Full Lower Body (Quads, Glutes), Upper Back (Pull-ups)',
    videoId: 'bEv6CCg2BC8',
    desc: 'Olympic 4-post power cage with multi-grip chin-up bar and adjustable safety pins for maximum-protection lifting.',
    dos: [
      'Always set horizontal safety bars just below your lowest squat depth.',
      'Ensure Olympic barbell is loaded evenly with matching plates on both sides.',
      'Secure barbell collars or spring clips on every loaded set.'
    ],
    donts: [
      'DO NOT squat heavy without safety bars properly positioned.',
      'DO NOT drop loaded barbell on safety rails unless in an emergency.'
    ],
    steps: [
      'Step 1: Safety & Bar Setup - Set safety rails and J-hooks to proper heights.',
      'Step 2: Safe Execution - Perform barbell squats, overhead presses, or pull-ups with full safety coverage.',
      'Step 3: Secure Re-rack - Walk bar directly into hooks before releasing your grip.'
    ]
  },
  24: {
    guide: 'hipThrust.jpg',
    target: 'Gluteus Maximus (Peak Contraction), Hamstrings',
    videoId: 'SEdqd1n012g',
    desc: 'Commercial plate-loaded Glute Drive hip thrust machine featuring padded waist harness and dual safety levers.',
    dos: [
      'Fasten and tighten padded waist belt securely over your pelvic hip bones.',
      'Place feet flat on textured platform, ensuring shins are vertical (90 degrees) at peak bridge.',
      'Drive hips upward forcefully through heels and squeeze glutes hard for 2 seconds at top.'
    ],
    donts: [
      'DO NOT hyper-arch your lower back; keep your chin tucked and ribs down.',
      'DO NOT push through your toes; maintain firm heel contact.'
    ],
    steps: [
      'Step 1: Belt & Foot Placement - Sit on seat, buckle belt, place feet flat, and disengage safety handle.',
      'Step 2: Explosive Hip Drive - Exhale and drive hips upward until torso and thighs form a straight horizontal line.',
      'Step 3: Peak Squeeze & Lowering - Squeeze glutes hard at top, then lower hips with control.'
    ]
  },
  25: {
    guide: 'preacherCurl.jpg',
    target: 'Biceps Brachii (Short Head Isolation)',
    videoId: 'fIWP-FRFNU0',
    desc: 'Body-Solid slanted preacher arm curl bench for strict bicep isolation without shoulder assistance or torso momentum.',
    dos: [
      'Rest the entire back of your upper arms (triceps) flat against the 45-degree pad.',
      'Grip the EZ-curl bar on the inner angled knurling with an underhand grip.',
      'Curl the bar upward until reaching full bicep peak contraction.'
    ],
    donts: [
      'DO NOT lift your elbows or armpits off the pad during the curl.',
      'DO NOT harshly hyperextend elbows at the bottom; maintain continuous muscular tension.'
    ],
    steps: [
      'Step 1: Arm Placement - Sit with upper arms flush on slanted pad, grasp inner EZ-bar grips.',
      'Step 2: Strict Bicep Curl - Exhale and curl bar toward chin using pure bicep flexion.',
      'Step 3: Slow Negative - Inhale and lower bar over 2-3 seconds with full control.'
    ]
  },
  26: {
    guide: 'guide_id26_white_plate_loaded_lat_pulldown.jpg',
    target: 'Latissimus Dorsi (Lats), Teres Major, Rhomboids (Mid-Back), Biceps',
    videoId: 'GibwvzLfwK8',
    desc: 'Commercial plate-loaded iso-lateral lat pulldown machine engineered with independent diverging lever arms for maximum lat width, scapular depression, and upper back thickness.',
    dos: [
      'Load equal weight plates securely onto both side horns before beginning your set.',
      'Adjust the orange padded thigh rollers snugly over your quads to anchor your lower body.',
      'Grip the overhead handles, sit down, and start with arms fully extended for a deep lat stretch.',
      'Exhale, depress your shoulder blades, and pull the independent levers down toward your upper chest.',
      'Drive your elbows down and slightly back, squeezing your lats hard at peak contraction.',
      'Inhale and slowly let the levers rise back under control over a 2-3 second eccentric stretch.'
    ],
    donts: [
      'DO NOT lean excessively backward or swing your torso to yank the heavy plates down.',
      'DO NOT pull the handles behind your neck; always pull down in front to upper chest.',
      'DO NOT let the weight crash onto the mechanical bottom stops.'
    ],
    steps: [
      'Step 1: Setup & Overhead Stretch - Lock thighs snugly under orange pads, reach overhead to grip handles, and stretch lats fully.',
      'Step 2: Downward Lat Drive - Exhale, retract scapulae, and pull levers downward driving elbows to your ribs.',
      'Step 3: Peak Contraction & Squeeze - Squeeze lats hard at collarbone height, then release upward smoothly over 3 seconds.'
    ]
  },
  27: {
    guide: 'guide_id12_white_lat_pulldown.jpg',
    target: 'Latissimus Dorsi, Upper Back, Biceps',
    videoId: '_aGgBvhz4n4',
    desc: 'Plate-loaded iso-lateral high pulldown station with diverging handles for targeted upper lat and lower trapezius activation.',
    dos: [
      'Secure thighs beneath foam support pads.',
      'Pull diverging handles downward and slightly outward toward collarbones.',
      'Squeeze back musculature at bottom for 1 second.'
    ],
    donts: [
      'DO NOT pull solely with arm strength; initiate movement with scapular depression.',
      'DO NOT drop weight plates.'
    ],
    steps: [
      'Step 1: Grip Setup - Reach high handles overhead and lock thighs under rollers.',
      'Step 2: High Row Drive - Exhale and pull handles down, squeezing lats firmly.',
      'Step 3: Controlled Release - Return upward slowly under tension.'
    ]
  },
  28: {
    guide: 'seatedRow.jpg',
    target: 'Middle Trapezius, Rhomboids, Latissimus Dorsi',
    videoId: 'GZbfZ033fBo',
    desc: 'Precor iso-lateral plate-loaded seated low row machine with vertical chest support pad and multi-grip handles.',
    dos: [
      'Adjust chest pad so handles are easily reachable with chest resting flush against pad.',
      'Plant feet firmly on textured footplates.',
      'Pull handles backward while retracting and squeezing shoulder blades together.'
    ],
    donts: [
      'DO NOT pull chest away from the support pad during the row.',
      'DO NOT shrug shoulders upward toward your ears.'
    ],
    steps: [
      'Step 1: Chest Pad Contact - Rest chest against pad, grasp handles with a neutral spine.',
      'Step 2: Retraction & Row - Exhale, pull handles back, and pinch shoulder blades together.',
      'Step 3: Return Stretch - Inhale and extend arms forward with control for a full stretch.'
    ]
  },
  29: {
    guide: 'cableCrossover.jpg',
    target: 'Pectoralis Major, Sternal & Clavicular Heads',
    videoId: 'taI4XduLp4M',
    desc: 'Dual stack adjustable cable crossover machine for dynamic chest isolation from high, middle, or low angles.',
    dos: [
      'Select pulley height: High for lower chest, Middle for overall chest, Low for upper chest.',
      'Stagger one foot forward for a stable foundation.',
      'Maintain a slight, fixed bend in elbows throughout the crossover sweep.'
    ],
    donts: [
      'DO NOT alter elbow angle during the movement (it is a fly, not a press).',
      'DO NOT excessively lean forward.'
    ],
    steps: [
      'Step 1: Height & Grip - Set pulley tracks and grip D-handles on both sides.',
      'Step 2: Crossover Motion - Sweep handles toward center in a smooth hugging arc.',
      'Step 3: Peak Contraction - Cross or touch hands at center and squeeze chest for 1 second.'
    ]
  },
  30: {
    guide: 'hackSquat.jpg',
    target: 'Quadriceps (Vastus Lateralis/Intermedius), Glutes',
    videoId: '0tn5K9NlCfo',
    desc: 'Heavy-duty 45-degree plate-loaded linear hack squat sled for pure quadriceps isolation with total spinal back support.',
    dos: [
      'Keep back and head firmly against backrest, resting shoulders under pads.',
      'Place feet shoulder-width apart in middle or upper region of footplate.',
      'Descend under control to 90 degrees and press sled upward through heels.'
    ],
    donts: [
      'DO NOT allow lower back to peel away from the pad at the bottom of the squat.',
      'DO NOT lock out knees harshly at the top.'
    ],
    steps: [
      'Step 1: Unrack Sled - Position yourself into sled, push upward slightly, and disengage safety handles.',
      'Step 2: 90-Degree Descent - Inhale and lower sled over 2-3 seconds until thighs reach 90 degrees.',
      'Step 3: Quad Drive - Exhale and drive upward through heels, re-engaging safety handles after set.'
    ]
  },
  31: {
    guide: 'squatRack.jpg',
    target: 'Quadriceps, Glutes, Hamstrings, Spinal Erectors',
    videoId: 'bEv6CCg2BC8',
    desc: 'Full commercial power rack cage with weight storage horns for heavy free weight compound lifts.',
    dos: [
      'Verify safety pin heights prior to loading heavy weight plates.',
      'Ensure barbell is evenly balanced with collars on both sleeves.',
      'Brace entire core and maintain neutral spinal alignment.'
    ],
    donts: [
      'DO NOT lift beyond capacity without spotters or safety bars.',
      'DO NOT drop barbell carelessly.'
    ],
    steps: [
      'Step 1: Equipment Check - Set J-hooks and safety rails to exact user height.',
      'Step 2: Controlled Execution - Perform squats or presses with strict technique.',
      'Step 3: Secure Re-rack - Walk barbell straight into J-hooks to finish.'
    ]
  },
  32: {
    guide: 'guide_id10_white_shoulder_press.jpg',
    target: 'Deltoid Muscle Complex, Upper Trapezius',
    videoId: 'qEwKCR5JCog',
    desc: 'Plate-loaded dual lever functional shoulder press machine for overhead pressing power and shoulder mass.',
    dos: [
      'Adjust seat so handles start level with your ears.',
      'Press independent levers upward smoothly in unison.',
      'Squeeze deltoids at top of extension.'
    ],
    donts: [
      'DO NOT arch lower back away from backrest.',
      'DO NOT lock elbows forcefully.'
    ],
    steps: [
      'Step 1: Position & Grip - Sit upright with back supported and grip overhead handles.',
      'Step 2: Upward Press - Exhale and push handles upward until arms are almost straight.',
      'Step 3: Slow Return - Inhale and lower handles slowly back to ear level.'
    ]
  },
  33: {
    guide: 'guide_id35_seated_chest_press.jpg',
    target: 'Pectoralis Major, Anterior Deltoids, Triceps',
    videoId: '8iPEnn-ltC8',
    desc: 'Commercial iso-lateral plate-loaded chest press with converging arm action for maximum pectoral contraction.',
    dos: [
      'Adjust seat so handles align with mid-chest level.',
      'Press independent levers forward along their converging arc.',
      'Keep back firmly planted against backrest.'
    ],
    donts: [
      'DO NOT flare elbows excessively high.',
      'DO NOT let shoulders roll forward off the pad.'
    ],
    steps: [
      'Step 1: Seat Setup - Set seat height, grip handles with a firm neutral wrist.',
      'Step 2: Converging Push - Exhale and press forward and slightly inward, squeezing chest.',
      'Step 3: Deep Stretch - Inhale and return handles under control for a complete chest stretch.'
    ]
  },
  34: {
    guide: 'preacherCurl.jpg',
    target: 'Biceps Brachii, Brachialis',
    videoId: 'XkZgXW2aQ5k',
    desc: 'Selectorized pin-stack seated bicep curl machine with rotating cam handles for continuous bicep tension.',
    dos: [
      'Adjust seat height so elbow joints align exactly with the machine pivot axis.',
      'Rest full triceps flat on the padded arm support.',
      'Curl handles upward using pure bicep contraction.'
    ],
    donts: [
      'DO NOT lift elbows off the pad during the curl.',
      'DO NOT lean back to assist the lift.'
    ],
    steps: [
      'Step 1: Pivot Alignment - Align elbows with machine axis and grip swivel handles.',
      'Step 2: Concentric Curl - Exhale and curl handles upward toward shoulders.',
      'Step 3: Slow Negative - Inhale and lower handles over 2-3 seconds with full control.'
    ]
  },
  35: {
    guide: 'guide_id35_seated_chest_press.jpg',
    target: 'Pectoralis Major, Front Deltoids, Triceps',
    videoId: 'sqOw2Y68ecY',
    desc: 'Selectorized pin-loaded seated chest press machine with black frame for safe, guided horizontal chest pressing.',
    dos: [
      'Adjust seat height so handles sit level with mid-chest.',
      'Press handles forward while exhaling and contracting chest.',
      'Keep back flat against the vertical back pad.'
    ],
    donts: [
      'DO NOT lockout elbows at the end of each rep.',
      'DO NOT allow weight stack plates to slam together.'
    ],
    steps: [
      'Step 1: Start Stretch - Sit with back flat against pad, grasp horizontal handles.',
      'Step 2: Mid Press - Drive handles forward with controlled pushing power.',
      'Step 3: Peak Press & Squeeze - Squeeze chest at peak extension and return with control.'
    ]
  },
  36: {
    guide: 'guide_id35_seated_chest_press.jpg',
    target: 'Upper & Mid Pectorals, Anterior Deltoids',
    videoId: 'VmB1G1K7v94',
    desc: 'Multi-position commercial adjustable workout bench (Flat, Incline, Decline) for dumbbell and barbell training.',
    dos: [
      'Verify angle adjustment pin is fully locked before lying on bench.',
      'Maintain 3 points of contact: head, upper back, and glutes flat on bench.',
      'Plant both feet flat on the floor for a sturdy foundation.'
    ],
    donts: [
      'DO NOT use bench if the angle pin is not completely engaged.',
      'DO NOT lift feet off the floor while pressing.'
    ],
    steps: [
      'Step 1: Angle Selection - Set backrest to desired angle (Flat 0°, Incline 30°-45°).',
      'Step 2: Body Positioning - Lie down with neutral spine and firmly planted feet.',
      'Step 3: Exercise Execution - Perform dumbbell presses, flyes, or curls with strict form.'
    ]
  },
  37: {
    guide: 'captainsChair.jpg',
    target: 'Rectus Abdominis, Hip Flexors, Triceps (Dips)',
    videoId: 'jmg_iY_iY48',
    desc: "Captain's chair vertical knee raise and dip station for abdominal conditioning, lower abs, and bodyweight dips.",
    dos: [
      'Rest forearms flat on horizontal padded armrests and grip vertical handles.',
      'Keep back firmly pressed against the vertical back support.',
      'Elevate knees or straight legs toward chest using abdominal contraction.'
    ],
    donts: [
      'DO NOT swing or use leg momentum to elevate knees (no swinging).',
      'DO NOT let neck sink into shoulders; keep neck long and shoulders depressed.'
    ],
    steps: [
      'Step 1: Forearm Pad Lock - Rest forearms on pads, grip handles, and suspend body with straight legs.',
      'Step 2: Controlled Knee Raise - Exhale and raise knees smoothly toward chest.',
      'Step 3: Slow Lowering - Inhale and lower legs under control without swinging.'
    ]
  },
  38: {
    guide: 'standingLateralRaise.jpg',
    target: 'Lateral Deltoids (Side Shoulder Width)',
    videoId: '3VcKaXpzqRo',
    desc: 'Selectorized standing lateral raise machine with circular cam system for isolated side deltoid capping and shoulder width.',
    dos: [
      'Stand in the center of machine with elbow pads resting against the outside of your elbows.',
      'Raise arms outward and upward to shoulder height.',
      'Hold and squeeze lateral deltoids at peak elevation for 1 second.'
    ],
    donts: [
      'DO NOT raise arms above shoulder height to prevent shoulder impingement.',
      'DO NOT shrug upward with your trapezius.'
    ],
    steps: [
      'Step 1: Stand & Align - Stand upright between pads with core braced.',
      'Step 2: Lateral Raise - Exhale and raise arms outward and upward to the sides.',
      'Step 3: Peak Hold & Return - Squeeze side delts at top and lower arms with control.'
    ]
  },
  39: {
    guide: 'legExtension.jpg',
    target: 'Quadriceps (Rectus Femoris, Vastus Medialis)',
    videoId: 'YyvSfVjQeL0',
    desc: 'Star Trac Instinct selectorized leg extension machine for direct quadriceps isolation and knee joint strengthening.',
    dos: [
      'Adjust backrest so knee joints align with machine pivot axis.',
      'Position lower roller pad snugly against the front of your lower shins/ankles.',
      'Extend legs upward until knees are straight, squeezing quads hard at the top.'
    ],
    donts: [
      'DO NOT kick or jerk the weight up with ballistic speed.',
      'DO NOT violently hyperextend knees at lockout.'
    ],
    steps: [
      'Step 1: Machine Setup - Adjust backrest and shin pad, holding side stability handles.',
      'Step 2: Quad Extension - Exhale and extend legs upward, contracting quadriceps.',
      'Step 3: Controlled Descent - Inhale and lower weight over 2-3 seconds before plates touch.'
    ]
  },
  40: {
    guide: 'guide_id10_white_shoulder_press.jpg',
    target: 'Anterior & Medial Deltoids, Triceps',
    videoId: '_ik7x2fM87I',
    desc: 'Pin-loaded selectorized shoulder press machine with dual grip handles for vertical pressing power.',
    dos: [
      'Adjust seat height so handles sit level with your shoulders.',
      'Press upward in a straight, controlled vertical path.',
      'Keep back flat against the back pad.'
    ],
    donts: [
      'DO NOT arch your back off the seat.',
      'DO NOT snap elbows into harsh lockout.'
    ],
    steps: [
      'Step 1: Seat Alignment - Adjust seat, grasp handles with a firm grip.',
      'Step 2: Overhead Drive - Exhale and press upward, contracting shoulder deltoids.',
      'Step 3: Return to Ear Level - Inhale and lower handles slowly to ear level.'
    ]
  },
  41: {
    guide: 'pecFly.jpg',
    target: 'Pectoralis Major (Fly) / Rear Deltoids (Reverse Fly)',
    videoId: 'eGjt4lkGeGo',
    desc: 'Commercial overhead swivel-arm dual function pec fly and rear delt machine for complete chest and upper back balance.',
    dos: [
      'Set overhead selector pins forward for Pec Fly, or rearward for Rear Delt Fly.',
      'Maintain a slight, fixed bend in elbows throughout the motion.',
      'Bring handles together at center and squeeze chest for 1 full second.'
    ],
    donts: [
      'DO NOT straighten elbows completely during the fly motion.',
      'DO NOT let arms overextend excessively backward on the stretch.'
    ],
    steps: [
      'Step 1: Pin Setup & Grip - Set overhead pins and grasp vertical handles with back supported.',
      'Step 2: Squeezing Fly Motion - Sweep handles toward center in a wide hugging arc.',
      'Step 3: Controlled Negative - Inhale and open arms slowly to a natural chest stretch.'
    ]
  },
  42: {
    guide: 'cableCrossover.jpg',
    target: 'Full Body Functional Cable Movements, Chest, Core',
    videoId: 'taI4XduLp4M',
    desc: 'Dual pulley functional cable trainer with adjustable height tracks and multi-grip chin-up station.',
    dos: [
      'Adjust pulley height to the exact numerical marker needed for your exercise.',
      'Select proper cable attachment (D-handles, rope, straight bar, ankle cuff).',
      'Keep core firmly braced on every movement.'
    ],
    donts: [
      'DO NOT let go of cable handles while weight stack is elevated.',
      'DO NOT sacrifice form for heavier weights.'
    ],
    steps: [
      'Step 1: Track Adjustment - Pull pin and slide pulley to desired height notch.',
      'Step 2: Attachment & Stance - Attach handle and set up in a stable athletic stance.',
      'Step 3: Smooth Execution - Perform the cable exercise with constant, smooth tension.'
    ]
  },
  43: {
    guide: 'legPress45.jpg',
    target: 'Quadriceps, Gluteal Complex, Hamstrings',
    videoId: 'IZxyjW7MPJQ',
    desc: 'Plate-loaded 45-degree heavy-duty leg press machine with dual plate horns for maximal lower body compound loading.',
    dos: [
      'Rest entire back and glutes flat against the reclined cushion.',
      'Place feet shoulder-width apart in the center of the footplate.',
      'Lower sled until knees reach 90 degrees, then press upward through entire foot and heels.'
    ],
    donts: [
      'NEVER lockout your knees (avoid knee hyperextension) at the top to prevent severe joint injury.',
      'DO NOT let your lower back or glutes lift off the seat during the descent.'
    ],
    steps: [
      'Step 1: Foot Placement & Unrack - Position feet, push sled up slightly, and disengage safety levers.',
      'Step 2: Controlled Lowering - Inhale and lower sled with control until knees reach 90 degrees.',
      'Step 3: Powerful Leg Drive - Exhale and drive sled upward through heels, stopping just before knee lockout.'
    ]
  },
  44: {
    guide: 'squatRack.jpg',
    target: 'Guided Barbell Squats, Overhead Press, Bench Press',
    videoId: 'fK0b1wK3V50',
    desc: 'Commercial Smith machine with fixed vertical guided track and rotating safety lockout pegs at every level.',
    dos: [
      'Rotate wrists to unhook barbell from safety pegs prior to initiating the rep.',
      'Position feet slightly forward of the bar line for comfortable squat mechanics.',
      'Rotate wrists back to lock bar into safety pegs immediately after completing set.'
    ],
    donts: [
      'DO NOT begin exercises without bottom safety stopper pins firmly locked.',
      'DO NOT attempt to force the barbell outside its fixed vertical track.'
    ],
    steps: [
      'Step 1: Bar Alignment & Unhook - Position under bar, rotate wrists to release hooks from pegs.',
      'Step 2: Vertical Track Movement - Execute squats, presses, or rows along the guided track.',
      'Step 3: Lockout & Re-hook - Rotate wrists back to engage hooks securely into safety pegs.'
    ]
  },
  45: {
    guide: 'legPress45.jpg',
    target: 'Quadriceps, Gluteus Maximus, Calves',
    videoId: 'IZxyjW7MPJQ',
    desc: 'Commercial incline sled leg press machine with wide multi-angle footplate for varied quad and glute emphasis.',
    dos: [
      'Keep back and head firmly against back cushion.',
      'Disengage safety handles before lowering sled.',
      'Drive upward with legs while maintaining soft knees at top.'
    ],
    donts: [
      'DO NOT lockout knees at top.',
      'DO NOT let heels lift off the platform.'
    ],
    steps: [
      'Step 1: Setup & Safety Release - Place feet flat, press upward, and release safety locks.',
      'Step 2: 90-Degree Knee Flexion - Inhale and lower sled under control.',
      'Step 3: Concentric Extension - Exhale and press upward back to starting position.'
    ]
  },
  46: {
    guide: 'guide_id12_white_lat_pulldown.jpg',
    target: 'Latissimus Dorsi, Biceps, Upper Back',
    videoId: 'CAwf7n6Luuc',
    desc: 'Star Trac Instinct high lat pulldown machine with diverging overhead handles and thigh restraint rollers.',
    dos: [
      'Adjust thigh rollers snugly over your thighs.',
      'Grip high diverging handles and pull down toward shoulders.',
      'Squeeze lats firmly at the bottom of the pull.'
    ],
    donts: [
      'DO NOT lean excessively backward while pulling.',
      'DO NOT allow shoulders to shrug upward on the return.'
    ],
    steps: [
      'Step 1: Seat & Grip Setup - Lock thighs under rollers, reach up to grasp high handles.',
      'Step 2: Downward Lat Drive - Exhale and pull handles down with chest proud.',
      'Step 3: Full Controlled Stretch - Inhale and return handles upward for a complete stretch.'
    ]
  },
  47: {
    guide: 'guide_id47_ezbar_curl.jpg',
    target: 'Biceps Brachii, Brachioradialis, Forearms',
    videoId: 'kwG2ipFRgfo',
    desc: 'Barbell rack with fixed-weight EZ-curl and straight barbells for ergonomic wrist angle bicep curling.',
    dos: [
      'Select desired fixed-weight bar from rack and stand tall with core braced.',
      'Grip EZ-bar on the angled grooves with an underhand grip.',
      'Curl bar upward toward chest while keeping elbows pinned at torso sides.'
    ],
    donts: [
      'DO NOT swing body or use lower back momentum.',
      'DO NOT drift elbows forward during the curl.'
    ],
    steps: [
      'Step 1: Underhand EZ-Grip - Hold EZ-bar at angled grips with an upright posture.',
      'Step 2: Bicep Contraction - Exhale and curl bar upward toward chest.',
      'Step 3: Slow Negative - Inhale and lower bar over 2-3 seconds with control.'
    ]
  },
  48: {
    guide: 'guide_id35_seated_chest_press.jpg',
    target: 'Pectoralis Major, Anterior Deltoids, Triceps',
    videoId: 'sqOw2Y68ecY',
    desc: 'Star Trac Instinct selectorized seated chest press machine with horizontal push arms for strict pectoral development.',
    dos: [
      'Adjust seat height so horizontal handles align with mid-chest.',
      'Press handles forward while exhaling and contracting pectorals.',
      'Keep back flat against the back pad throughout.'
    ],
    donts: [
      'DO NOT lockout elbows at the top.',
      'DO NOT roll shoulders forward off the pad.'
    ],
    steps: [
      'Step 1: Start Stretch - Sit upright, grasp handles with neutral wrists.',
      'Step 2: Mid Press - Drive handles forward with controlled force.',
      'Step 3: Peak Press & Squeeze - Squeeze chest at peak extension and return with control.'
    ]
  },
  49: {
    guide: 'seatedRow.jpg',
    target: 'Latissimus Dorsi, Rhomboids, Middle Trapezius',
    videoId: 'GZbfZ033fBo',
    desc: 'Plate-loaded seated low row bench with angled foot braces and wide row bar for lower and mid back thickness.',
    dos: [
      'Sit on bench, placing feet on angled footplates with slight knee bend.',
      'Grip row bar with a flat spine and engaged core.',
      'Pull bar smoothly into your navel while pinching shoulder blades together.'
    ],
    donts: [
      'DO NOT round your lower back forward when reaching for the bar.',
      'DO NOT lean excessively backward during the pull.'
    ],
    steps: [
      'Step 1: Foot Placement & Reach - Place feet, grasp bar with a neutral flat spine.',
      'Step 2: Scapular Retraction & Row - Exhale, pull bar to navel, squeezing mid back.',
      'Step 3: Controlled Extension - Inhale and extend arms forward for a full lat stretch.'
    ]
  },
  50: {
    guide: 'guide_id10_white_shoulder_press.jpg',
    target: 'Anterior & Medial Deltoids, Triceps',
    videoId: '_ik7x2fM87I',
    desc: 'Star Trac Instinct seated shoulder press machine with vertical overhead push levers for deltoid strength.',
    dos: [
      'Adjust seat so handles start level with your ears.',
      'Press upward in a smooth, vertical overhead path.',
      'Keep back flat against the backrest.'
    ],
    donts: [
      'DO NOT arch back away from seat.',
      'DO NOT snap elbows into harsh lockout.'
    ],
    steps: [
      'Step 1: Seat Alignment - Adjust seat, grasp overhead handles.',
      'Step 2: Vertical Overhead Drive - Exhale and push upward, contracting deltoids.',
      'Step 3: Slow Return - Inhale and lower handles slowly to ear level.'
    ]
  },
  51: {
    guide: 'legExtension.jpg',
    target: 'Quadriceps, Patellar Tendon, Calves',
    videoId: 'YyvSfVjQeL0',
    desc: 'Freemotion cable dual leg extension and calf machine for dynamic leg extension and lower leg conditioning.',
    dos: [
      'Sit with back flat against backrest and place feet on foot pedals.',
      'Extend legs outward and upward against cable resistance.',
      'Squeeze quadriceps at the end of each rep.'
    ],
    donts: [
      'DO NOT kick rapidly without control.',
      'DO NOT hyperextend knees harshly.'
    ],
    steps: [
      'Step 1: Seat & Pedal Position - Sit down and position feet on pedals.',
      'Step 2: Extension Drive - Exhale and extend legs upward against resistance.',
      'Step 3: Controlled Descent - Inhale and lower legs with control back to start.'
    ]
  },
  52: {
    guide: 'guide_id52_flat_chest_press.jpg',
    target: 'Pectoralis Major (Mid & Sternal Head), Anterior Deltoids, Triceps',
    videoId: 'rT7DgCr-3pg',
    desc: 'Star Trac Instinct horizontal flat bench chest press machine where the lifter lies flat on the bench and presses overhead levers vertically upward.',
    dos: [
      'Lie flat on the horizontal bench with 3 points of contact (head, upper back, and glutes).',
      'Plant both feet flat on the floor for a sturdy pressing base.',
      'Grip the overhead push handles at mid-chest level and press vertically upward.',
      'Squeeze pectoralis major hard at the top while keeping shoulder blades driven into the bench.'
    ],
    donts: [
      'DO NOT lift your glutes or excessively arch your lower back off the horizontal bench.',
      'DO NOT forcefully snap or lockout your elbows at the top of the press.',
      'DO NOT let the overhead levers crash down onto your chest; control the descent.'
    ],
    steps: [
      'Step 1: Lying Flat Setup - Lie flat on the horizontal bench, plant feet on floor, grasp overhead levers at mid-chest level.',
      'Step 2: Mid Press Drive - Exhale and press levers vertically upward using pectoral power.',
      'Step 3: Peak Press & Squeeze - Squeeze chest muscles at full extension and lower levers under control.'
    ]
  },
  53: {
    guide: 'guide_id53_deadlift.jpg',
    target: 'Posterior Chain, Gluteus Maximus, Hamstrings, Erector Spinae, Latissimus Dorsi',
    videoId: 'op9kVnSso6Q',
    desc: 'Heavy-duty floor bumper plate toast rack and Olympic rubber bumper plates for Olympic weightlifting, deadlifts, and power cleans.',
    dos: [
      'Select proper Olympic bumper plates from rack and secure barbell collars on sleeves.',
      'Stand with barbell over mid-foot with feet hip-width apart.',
      'Hinge at hips, keep spine flat, pull slack out of bar, and drive through heels to lift.',
      'Stand tall at lockout with glutes engaged and hips neutral.'
    ],
    donts: [
      'DO NOT round your lower back (cat back) while pulling to prevent lumbar disc herniation.',
      'DO NOT jerk the bar off the floor; build tension before lifting.'
    ],
    steps: [
      'Step 1: Stance & Grip Setup - Position bar over mid-foot, hinge hips back, grip bar outside knees with a flat back.',
      'Step 2: Leg & Hip Drive - Push floor away through heels while hips and shoulders rise at the same rate.',
      'Step 3: Lockout & Return - Stand tall with glute squeeze at top, then hinge at hips to lower bar to floor with control.'
    ]
  },
  54: {
    guide: 'guide_id54_kettlebells.jpg',
    target: 'Gluteus Maximus, Hamstrings, Core Bracing, Hip Hinge Power',
    videoId: 'sSESeQAir2M',
    desc: 'Color-coded cast iron and competition kettlebells for ballistic hip hinge power, kettlebell swings, and functional athletic conditioning.',
    dos: [
      'Stand with feet slightly wider than shoulder-width and hinge at hips with a neutral spine.',
      'Hike the kettlebell back between your upper thighs.',
      'Snap hips forward explosively using glutes and hamstrings to float kettlebell to chest height.',
      'Brace core tightly at the peak of the swing.'
    ],
    donts: [
      'DO NOT use your arms or front deltoids to lift the kettlebell (it is a hip drive, not a front raise).',
      'DO NOT squat low; this is a hip hinge movement.'
    ],
    steps: [
      'Step 1: Hike & Hip Hinge - Hinge at hips, grasp kettlebell handle, and hike bell back between thighs.',
      'Step 2: Explosive Hip Snap - Drive hips forward explosively using glutes and hamstrings.',
      'Step 3: Float & Recoil - Allow bell to float weightlessly to chest level before smoothly hinging back.'
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
  youtubeVideoId: string;
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
  youtubeVideoId: string;
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
  youtubeVideoId: string;
  dos: string[];
  donts: string[];
  steps: { stepNumber: number; title: string; instruction: string; tip?: string }[];
}

export const EQUIPMENT_GUIDES_MAP: Record<number, EquipmentFullGuide> = {
`;

serverEquip.sort((a,b) => a.id - b.id).forEach(e => {
  const meta = englishGuidesDatabase[e.id] || {
    guide: 'guide_id35_seated_chest_press.jpg',
    target: 'Compound Muscle Groups',
    videoId: 'sqOw2Y68ecY',
    desc: e.name,
    dos: [
      'Maintain tight core engagement and upright posture.',
      'Control both the lifting and lowering phases of the movement.'
    ],
    donts: [
      'DO NOT lockout joints under heavy resistance.',
      'DO NOT use excessive body momentum.'
    ],
    steps: [
      'Step 1: Setup - Position your body securely on support pads.',
      'Step 2: Execution - Move through full range of motion under strict control.'
    ]
  };

  const targetArr = meta.target.split(',').map(s => s.trim());
  const primary = targetArr[0] || 'Target Muscles';
  const secondary = targetArr.slice(1);
  const guideImgPath = 'assets/guides/' + meta.guide;
  const ytWatchUrl = 'https://www.youtube.com/watch?v=' + meta.videoId;

  content += `  ${e.id}: {
    id: ${e.id},
    equipmentId: ${e.id},
    name: ${JSON.stringify(e.name)},
    category: ${JSON.stringify(e.category_name || 'Gym Equipment')},
    status: 'available',
    imageUrl: ${JSON.stringify(e.image_url || '')},
    youtubeUrl: ${JSON.stringify(ytWatchUrl)},
    youtubeVideoId: ${JSON.stringify(meta.videoId)},
    weightScale: 'Pin / Plate Loaded Weight Stack',
    muscles: [${JSON.stringify(primary)}, ${secondary.map(s => JSON.stringify(s)).join(', ')}],
    warning: 'Maintain neutral spine alignment and controlled movement cadence at all times.',
    overview: ${JSON.stringify(meta.desc)},
    primaryIllustration: ${JSON.stringify(guideImgPath)},
    dos: ${JSON.stringify(meta.dos, null, 6)},
    donts: ${JSON.stringify(meta.donts, null, 6)},
    machineAdjustments: [
      'Adjust seat height or platform so the machine pivot aligns with your anatomical joint axis.',
      'Select a manageable working resistance to ensure strict technique.'
    ],
    safetyRules: [
      'Maintain core bracing throughout every repetition.',
      'Avoid hyperextending or locking out joints under heavy loads.',
      'Control the 2-3 second eccentric return phase smoothly without dropping weights.'
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
        youtubeUrl: ${JSON.stringify(ytWatchUrl)},
        youtubeVideoId: ${JSON.stringify(meta.videoId)},
        illustration: ${JSON.stringify(guideImgPath)},
        illustrationUrl: ${JSON.stringify(guideImgPath)},
        recommendedSetsReps: '3-4 sets x 8-12 reps',
        setupInstructions: [
          'Position your body firmly against support pads with neutral spinal alignment.',
          'Secure grips or foot placement shoulder-width apart.'
        ],
        steps: ${JSON.stringify(meta.steps, null, 8)},
        dos: ${JSON.stringify(meta.dos, null, 8)},
        donts: ${JSON.stringify(meta.donts, null, 8)},
        executionSteps: ${JSON.stringify(meta.steps.map((s, idx) => ({
          stepNumber: idx + 1,
          title: s.split(' - ')[0] || 'Step ' + (idx + 1),
          description: s.split(' - ')[1] || s,
          breathing: idx === 0 ? 'Inhale deeply and stabilize your torso.' : 'Exhale forcefully as you contract the target muscle.',
          formCue: 'Keep shoulder blades retracted and joints aligned.'
        })), null, 8)},
        commonMistakes: ${JSON.stringify(meta.donts, null, 8)},
        safetyTips: [
          'Ensure safety collars, pins, or catchers are securely engaged before lifting.'
        ],
        safetyWarnings: ${JSON.stringify(meta.donts, null, 8)},
        proTips: [
          'Focus on a 2-second eccentric lowering phase for maximum muscle hypertrophy.'
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
    youtubeVideoId: g.youtubeVideoId || '',
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
console.log('Successfully written 100% English equipment guides with direct YouTube Video IDs!');
