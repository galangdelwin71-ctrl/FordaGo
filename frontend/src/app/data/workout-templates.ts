// workout-templates.ts
//
// Single source of truth for the default weekly workout schedule and its
// exercise database. Shared by:
//  - SchedulePage            (renders/edits the visible week, seeds a
//                              viewed week on demand)
//  - WorkoutTrackerService   (seeds the WHOLE current month on app load,
//                              so the dashboard's "Upcoming Schedules"
//                              stat is correct even if the member never
//                              opens the Schedule page)
//
// Keeping this data in one place avoids the two seeding paths drifting
// out of sync with each other (previously this object was duplicated).

export interface WorkoutTemplateExercise {
  name: string;
  sets: number;
  reps: string;
}

export interface DefaultDaySession {
  timeVal: string;
  timeAmpm: string;
  title: string;
  duration: string;
  location: string;
  coach: string;
  membersCount: number;
  status: 'upcoming' | 'optional' | 'missed' | 'done';
  customTarget?: string;
}

// Key format: "WorkoutType|Target" or "WorkoutType" (fallback)
export const exerciseDatabase: Record<string, WorkoutTemplateExercise[]> = {

  // ── Upper Body targets ─────────────────────────────────
  'Upper Body|Back & Bicep': [
    { name: 'Barbell Row',          sets: 4, reps: '8-10'     },
    { name: 'Pull-up / Lat Pulldown', sets: 4, reps: '8-12'   },
    { name: 'Seated Cable Row',     sets: 3, reps: '10-12'    },
    { name: 'Single Arm DB Row',    sets: 3, reps: '12 each'  },
    { name: 'Barbell Curl',         sets: 3, reps: '10-12'    },
    { name: 'Incline DB Curl',      sets: 3, reps: '12-15'    },
    { name: 'Hammer Curl',          sets: 2, reps: '12-15'    },
  ],
  'Upper Body|Chest & Tricep': [
    { name: 'Flat Barbell Bench Press', sets: 4, reps: '8-10'  },
    { name: 'Incline DB Press',       sets: 3, reps: '10-12'   },
    { name: 'Cable Fly / Pec Deck',   sets: 3, reps: '12-15'   },
    { name: 'Dips',                   sets: 3, reps: '10-12'   },
    { name: 'Skull Crusher',          sets: 3, reps: '10-12'   },
    { name: 'Tricep Rope Pushdown',   sets: 3, reps: '12-15'   },
    { name: 'Overhead Tricep Ext.',   sets: 2, reps: '12-15'   },
  ],
  'Upper Body|Shoulders': [
    { name: 'Barbell Overhead Press', sets: 4, reps: '8-10'   },
    { name: 'DB Lateral Raise',       sets: 4, reps: '12-15'  },
    { name: 'Front Raise',            sets: 3, reps: '12-15'  },
    { name: 'Rear Delt Fly',          sets: 3, reps: '15'     },
    { name: 'Face Pull',              sets: 3, reps: '15'     },
    { name: 'Arnold Press',           sets: 3, reps: '10-12'  },
  ],
  'Upper Body|Back & Rear Delt': [
    { name: 'Deadlift',               sets: 4, reps: '5-6'    },
    { name: 'Bent Over Row',          sets: 4, reps: '8-10'   },
    { name: 'Wide Grip Lat Pulldown', sets: 3, reps: '10-12'  },
    { name: 'Face Pull',              sets: 4, reps: '15'     },
    { name: 'Rear Delt DB Fly',       sets: 3, reps: '15'     },
    { name: 'Shrugs',                 sets: 3, reps: '12-15'  },
  ],
  'Upper Body|Chest & Shoulder': [
    { name: 'Flat DB Press',          sets: 4, reps: '10-12'  },
    { name: 'Incline Barbell Press',  sets: 3, reps: '8-10'   },
    { name: 'Cable Crossover',        sets: 3, reps: '12-15'  },
    { name: 'Seated Shoulder Press',  sets: 3, reps: '10-12'  },
    { name: 'DB Lateral Raise',       sets: 3, reps: '12-15'  },
    { name: 'Push-up Finisher',       sets: 2, reps: 'failure' },
  ],
  'Upper Body|Arms (Bi & Tri)': [
    { name: 'Preacher Curl',          sets: 3, reps: '10-12'  },
    { name: 'EZ Bar Curl',            sets: 3, reps: '10-12'  },
    { name: 'Concentration Curl',     sets: 3, reps: '12 each'},
    { name: 'Close Grip Bench Press', sets: 3, reps: '10-12'  },
    { name: 'Dips',                   sets: 3, reps: '10-12'  },
    { name: 'Overhead Tricep Ext.',   sets: 3, reps: '12-15'  },
    { name: 'Reverse Curl',           sets: 2, reps: '15'     },
  ],
  // Default Upper Body (no specific target)
  'Upper Body': [
    { name: 'Bench Press',            sets: 4, reps: '8-10'   },
    { name: 'Bent Over Row',          sets: 4, reps: '8-10'   },
    { name: 'Shoulder Press',         sets: 3, reps: '10-12'  },
    { name: 'Pull-up',                sets: 3, reps: '8-12'   },
    { name: 'Barbell Curl',           sets: 3, reps: '12'     },
    { name: 'Tricep Pushdown',        sets: 3, reps: '12-15'  },
  ],

  // ── Lower Body targets ─────────────────────────────────
  'Lower Body / Leg Day|Quads & Glutes': [
    { name: 'Barbell Back Squat',     sets: 4, reps: '6-8'    },
    { name: 'Leg Press',              sets: 4, reps: '10-12'  },
    { name: 'Bulgarian Split Squat',  sets: 3, reps: '10 each'},
    { name: 'Walking Lunges',         sets: 3, reps: '12 each'},
    { name: 'Hip Thrust',             sets: 4, reps: '12-15'  },
    { name: 'Leg Extension',          sets: 3, reps: '15'     },
  ],
  'Lower Body / Leg Day|Hamstrings & Glutes': [
    { name: 'Romanian Deadlift',      sets: 4, reps: '8-10'   },
    { name: 'Hip Thrust',             sets: 4, reps: '12-15'  },
    { name: 'Leg Curl (Lying)',       sets: 3, reps: '12-15'  },
    { name: 'Sumo Deadlift',          sets: 3, reps: '8-10'   },
    { name: 'Glute Kickback',         sets: 3, reps: '15 each'},
    { name: 'Good Morning',           sets: 3, reps: '12'     },
  ],
  'Lower Body / Leg Day|Calves & Quads': [
    { name: 'Front Squat',            sets: 4, reps: '8-10'   },
    { name: 'Hack Squat',             sets: 4, reps: '10-12'  },
    { name: 'Leg Press',              sets: 3, reps: '12-15'  },
    { name: 'Leg Extension',          sets: 3, reps: '15'     },
    { name: 'Standing Calf Raise',    sets: 4, reps: '15-20'  },
    { name: 'Seated Calf Raise',      sets: 3, reps: '20'     },
  ],
  'Lower Body / Leg Day|Glutes Focus': [
    { name: 'Hip Thrust',             sets: 5, reps: '12-15'  },
    { name: 'Cable Kickback',         sets: 4, reps: '15 each'},
    { name: 'Bulgarian Split Squat',  sets: 3, reps: '12 each'},
    { name: 'Sumo Squat',             sets: 3, reps: '15'     },
    { name: 'Banded Lateral Walk',    sets: 3, reps: '20 each'},
    { name: 'Donkey Kick',            sets: 3, reps: '15 each'},
  ],
  'Lower Body / Leg Day|Full Legs': [
    { name: 'Barbell Squat',          sets: 4, reps: '8-10'   },
    { name: 'Romanian Deadlift',      sets: 3, reps: '8-10'   },
    { name: 'Leg Press',              sets: 3, reps: '12'     },
    { name: 'Hip Thrust',             sets: 3, reps: '12-15'  },
    { name: 'Leg Extension',          sets: 3, reps: '15'     },
    { name: 'Leg Curl',               sets: 3, reps: '15'     },
    { name: 'Standing Calf Raise',    sets: 3, reps: '20'     },
  ],
  // Default Lower Body
  'Lower Body / Leg Day': [
    { name: 'Barbell Squat',          sets: 4, reps: '8-10'   },
    { name: 'Leg Press',              sets: 3, reps: '10-12'  },
    { name: 'Romanian Deadlift',      sets: 3, reps: '10'     },
    { name: 'Leg Curl',               sets: 3, reps: '12-15'  },
    { name: 'Calf Raise',             sets: 4, reps: '20'     },
  ],

  // ── Cardio & Core targets ──────────────────────────────
  'Cardio & Core|HIIT': [
    { name: 'Sprint Intervals',       sets: 6, reps: '30s on / 30s off' },
    { name: 'Burpees',                sets: 4, reps: '15'     },
    { name: 'Jump Squat',             sets: 4, reps: '15'     },
    { name: 'Mountain Climbers',      sets: 3, reps: '30s'    },
    { name: 'Box Jump',               sets: 3, reps: '10'     },
  ],
  'Cardio & Core|Steady State': [
    { name: 'Treadmill Run',          sets: 1, reps: '25 min' },
    { name: 'Elliptical',             sets: 1, reps: '20 min' },
    { name: 'Cycling',                sets: 1, reps: '20 min' },
  ],
  'Cardio & Core|Core & Abs': [
    { name: 'Cable Crunch',           sets: 4, reps: '15-20'  },
    { name: 'Hanging Leg Raise',      sets: 4, reps: '12-15'  },
    { name: 'Plank',                  sets: 3, reps: '45s'    },
    { name: 'Russian Twist',          sets: 3, reps: '20 each'},
    { name: 'Ab Wheel Rollout',       sets: 3, reps: '10-12'  },
    { name: 'Bicycle Crunch',         sets: 3, reps: '20 each'},
  ],
  'Cardio & Core|Jump Rope HIIT': [
    { name: 'Jump Rope',              sets: 5, reps: '1 min'  },
    { name: 'Burpees',                sets: 3, reps: '12'     },
    { name: 'Mountain Climbers',      sets: 3, reps: '30s'    },
    { name: 'Double Unders',          sets: 3, reps: '30s'    },
  ],
  'Cardio & Core|Treadmill + Core': [
    { name: 'Incline Treadmill Walk', sets: 1, reps: '20 min' },
    { name: 'Plank',                  sets: 4, reps: '45s'    },
    { name: 'Hanging Knee Raise',     sets: 3, reps: '15'     },
    { name: 'Cable Woodchop',         sets: 3, reps: '12 each'},
    { name: 'Dead Bug',               sets: 3, reps: '10 each'},
  ],
  // Default Cardio & Core
  'Cardio & Core': [
    { name: 'Treadmill',              sets: 1, reps: '20 min' },
    { name: 'Plank',                  sets: 3, reps: '45s'    },
    { name: 'Bicycle Crunch',         sets: 3, reps: '20 each'},
    { name: 'Mountain Climbers',      sets: 3, reps: '30s'    },
    { name: 'Burpees',                sets: 3, reps: '10'     },
  ],

  // ── Full Body targets ──────────────────────────────────
  'Full Body|Push / Pull / Legs': [
    { name: 'Squat',                  sets: 3, reps: '10'     },
    { name: 'Bench Press',            sets: 3, reps: '10'     },
    { name: 'Bent Over Row',          sets: 3, reps: '10'     },
    { name: 'Shoulder Press',         sets: 3, reps: '10'     },
    { name: 'Romanian Deadlift',      sets: 3, reps: '10'     },
    { name: 'Pull-up',                sets: 3, reps: '8-10'   },
  ],
  'Full Body|Compound Lifts': [
    { name: 'Barbell Squat',          sets: 5, reps: '5'      },
    { name: 'Deadlift',               sets: 3, reps: '5'      },
    { name: 'Bench Press',            sets: 5, reps: '5'      },
    { name: 'Barbell Row',            sets: 3, reps: '8'      },
    { name: 'Overhead Press',         sets: 3, reps: '8'      },
  ],
  'Full Body|Circuit Training': [
    { name: 'Jump Squat',             sets: 3, reps: '15'     },
    { name: 'Push-up',                sets: 3, reps: '15'     },
    { name: 'DB Row',                 sets: 3, reps: '12 each'},
    { name: 'Lunge',                  sets: 3, reps: '12 each'},
    { name: 'Shoulder Press',         sets: 3, reps: '12'     },
    { name: 'Plank',                  sets: 3, reps: '45s'    },
  ],
  'Full Body|Functional Strength': [
    { name: 'Trap Bar Deadlift',      sets: 4, reps: '6-8'    },
    { name: 'Push Press',             sets: 4, reps: '6-8'    },
    { name: 'Goblet Squat',           sets: 3, reps: '12'     },
    { name: 'Farmer Carry',           sets: 3, reps: '40m'    },
    { name: 'TRX Row',                sets: 3, reps: '12-15'  },
    { name: 'Pallof Press',           sets: 3, reps: '12 each'},
  ],
  // Default Full Body
  'Full Body': [
    { name: 'Squat',                  sets: 4, reps: '10'     },
    { name: 'Bench Press',            sets: 3, reps: '10'     },
    { name: 'Deadlift',               sets: 3, reps: '8'      },
    { name: 'Pull-up',                sets: 3, reps: '8-10'   },
    { name: 'Plank',                  sets: 3, reps: '45s'    },
  ],

  // ── Mobility targets ───────────────────────────────────
  'Mobility & Stretch|Hip Flexors': [
    { name: 'Couch Stretch',          sets: 3, reps: '60s each'},
    { name: 'Pigeon Pose',            sets: 3, reps: '60s each'},
    { name: 'Hip Flexor Lunge Stretch', sets: 3, reps: '45s each'},
    { name: 'Deep Squat Hold',        sets: 3, reps: '45s'    },
    { name: '90/90 Hip Stretch',      sets: 3, reps: '60s each'},
  ],
  'Mobility & Stretch|Upper Back': [
    { name: 'Thoracic Rotation',      sets: 3, reps: '10 each'},
    { name: 'Cat-Cow',                sets: 3, reps: '15'     },
    { name: 'Thread the Needle',      sets: 3, reps: '10 each'},
    { name: 'Foam Roll Upper Back',   sets: 1, reps: '3 min'  },
    { name: 'Wall Angel',             sets: 3, reps: '12'     },
  ],
  'Mobility & Stretch|Shoulder Mobility': [
    { name: 'Band Pull Apart',        sets: 3, reps: '15'     },
    { name: 'Wall Slide',             sets: 3, reps: '12'     },
    { name: 'Cross Body Stretch',     sets: 3, reps: '30s each'},
    { name: 'Doorway Chest Stretch',  sets: 3, reps: '30s'    },
    { name: 'PVC Overhead Squat',     sets: 3, reps: '10'     },
  ],
  'Mobility & Stretch|Full Body Stretch': [
    { name: 'Downward Dog',           sets: 3, reps: '45s'    },
    { name: "World's Greatest Stretch", sets: 3, reps: '5 each'},
    { name: 'Hip Flexor Lunge',       sets: 3, reps: '45s each'},
    { name: 'Seated Hamstring Stretch', sets: 3, reps: '45s'  },
    { name: 'Pigeon Pose',            sets: 2, reps: '60s each'},
    { name: 'Child\'s Pose',          sets: 2, reps: '60s'    },
  ],
  'Mobility & Stretch|Spine & Core': [
    { name: 'Cat-Cow',                sets: 3, reps: '15'     },
    { name: 'Dead Bug',               sets: 3, reps: '10 each'},
    { name: 'Bird Dog',               sets: 3, reps: '10 each'},
    { name: 'Cobra Stretch',          sets: 3, reps: '30s'    },
    { name: 'Supine Spinal Twist',    sets: 3, reps: '45s each'},
  ],
  'Mobility & Stretch': [
    { name: 'Hip Flexor Stretch',     sets: 3, reps: '45s each'},
    { name: 'Hamstring Stretch',      sets: 3, reps: '45s'    },
    { name: 'Shoulder Mobility',      sets: 3, reps: '30s'    },
    { name: 'Cat-Cow Flow',           sets: 3, reps: '60s'    },
    { name: 'Foam Roll',              sets: 1, reps: '10 min' },
  ],

  // ── Obese Safe Low-Impact Routines (BMI >= 30) ────────
  'Full Body|Obese Low-Impact Full Body Circuit': [
    { name: 'Selectorized Chest Press Machine', sets: 3, reps: '12-15' },
    { name: 'Lat Pulldown Machine', sets: 3, reps: '12-15' },
    { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '12-15' },
    { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '12-15' },
    { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '15' },
  ],
  'Cardio & Core|Obese Safe Low-Impact Cardio': [
    { name: 'Treadmill (Flat/Gentle Incline Walk)', sets: 1, reps: '20-25 min' },
    { name: 'Multi-Function Cable Column (Seated Cable Rotations)', sets: 3, reps: '12 each' },
    { name: '45-Degree Hyperextension Bench (Supported Back Alignment)', sets: 3, reps: '10-12' },
    { name: 'Gentle Full-Body Stretching', sets: 1, reps: '10 min' },
  ],
  'Lower Body / Leg Day|Obese Seated Machine Lower Body': [
    { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '12-15' },
    { name: 'Leg Extension Machine', sets: 3, reps: '12-15' },
    { name: 'Leg Extension / Leg Curl Machine', sets: 3, reps: '12-15' },
    { name: 'Seated Calf Raise Machine', sets: 3, reps: '15-20' },
    { name: 'Hip Abductor / Adductor Machine', sets: 3, reps: '15' },
  ],
  'Upper Body|Obese Seated Machine Upper Sculpt': [
    { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '12-15' },
    { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '12-15' },
    { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '15' },
    { name: 'Seated Bicep Curl / Preacher Curl Machine', sets: 3, reps: '12-15' },
    { name: 'Dual Adjustable Pulley Machine (Face Pulls)', sets: 3, reps: '15' },
  ],
  'Cardio & Core|Obese Low-Impact Metabolic Finish': [
    { name: 'Treadmill (Steady-Pace Flat Walk)', sets: 1, reps: '20 min' },
    { name: 'Functional Trainer Cable Crossover Machine (Core Hold)', sets: 3, reps: '12' },
    { name: 'Dip / Leg Raise Station (Assisted Knee Tucks)', sets: 3, reps: '10-12' },
    { name: 'Full Body Stretching & Cooldown', sets: 1, reps: '10 min' },
  ],

  // ── Underweight Mass & Hypertrophy Routines (BMI < 18.5) ─
  'Upper Body|Underweight Mass Building (Chest & Back)': [
    { name: 'Plate-Loaded Incline Chest Press Machine', sets: 4, reps: '8-10' },
    { name: 'Plate-Loaded Lat Pulldown Machine', sets: 4, reps: '8-10' },
    { name: 'Selectorized Chest Press Machine', sets: 3, reps: '10' },
    { name: 'Pec Fly / Rear Delt Machine', sets: 3, reps: '10-12' },
    { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '10-12' },
  ],
  'Lower Body / Leg Day|Underweight Leg & Quad Hypertrophy': [
    { name: 'Hack Squat Machine', sets: 4, reps: '8-10' },
    { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 4, reps: '8-10' },
    { name: 'Leg Extension Machine', sets: 3, reps: '10-12' },
    { name: 'Leg Extension / Leg Curl Machine (Hamstrings)', sets: 3, reps: '10-12' },
    { name: 'Seated Calf Raise Machine', sets: 3, reps: '12-15' },
  ],
  'Upper Body|Underweight Back & Bicep Mass': [
    { name: 'Seated Row Machine / Low Row Machine', sets: 4, reps: '8-10' },
    { name: 'Wide Grip Lat Pulldown', sets: 3, reps: '10' },
    { name: 'Preacher Curl Bench (EZ Bar Curls)', sets: 3, reps: '10' },
    { name: 'Seated Bicep Curl / Preacher Curl Machine', sets: 3, reps: '10' },
    { name: 'Multi-Function Cable Column (Face Pulls)', sets: 3, reps: '12' },
  ],
  'Full Body|Underweight Compound Hypertrophy': [
    { name: 'Selectorized Chest Press Machine', sets: 3, reps: '10' },
    { name: '45-Degree Leg Press Machine', sets: 3, reps: '10' },
    { name: 'Lat Pulldown Machine', sets: 3, reps: '10' },
    { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '12' },
    { name: 'Dip / Leg Raise Station (Knee Tucks)', sets: 3, reps: '12' },
  ],

  // ── Obese Cardio & Stamina Targets (BMI >= 30, tone_endurance) ──
  'Cardio & Core|Obese Aerobic Conditioning & Incline Walk': [
    { name: 'Treadmill (Flat/Gentle Incline Walk)', sets: 1, reps: '25 min' },
    { name: 'Multi-Function Cable Column (Seated Cable Rotations)', sets: 3, reps: '12 each' },
    { name: 'Gentle Full-Body Stretching', sets: 1, reps: '10 min' },
  ],
  'Upper Body|Obese Seated Upper Stamina': [
    { name: 'Selectorized Chest Press Machine', sets: 3, reps: '15' },
    { name: 'Lat Pulldown Machine', sets: 3, reps: '15' },
    { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '15' },
    { name: '45-Degree Hyperextension Bench (Supported Back Alignment)', sets: 3, reps: '10' },
  ],
  'Lower Body / Leg Day|Obese Lower Machine Stamina': [
    { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '15' },
    { name: 'Seated Calf Raise Machine', sets: 3, reps: '15-20' },
    { name: 'Hip Abductor / Adductor Machine', sets: 3, reps: '15' },
    { name: 'Treadmill (Steady-Pace Flat Walk)', sets: 1, reps: '15 min' },
  ],
  'Cardio & Core|Obese Low-Impact Cardio & Posture': [
    { name: 'Treadmill (Flat/Gentle Incline Walk)', sets: 1, reps: '20 min' },
    { name: 'Dual Adjustable Pulley Machine (Face Pulls)', sets: 3, reps: '15' },
    { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '12-15' },
    { name: 'Full Body Stretching & Cooldown', sets: 1, reps: '10 min' },
  ],
  'Full Body|Obese Seated Conditioning Finisher': [
    { name: 'Selectorized Chest Press Machine', sets: 3, reps: '12' },
    { name: 'Lat Pulldown Machine', sets: 3, reps: '12' },
    { name: 'Dip / Leg Raise Station (Assisted Knee Tucks)', sets: 3, reps: '10' },
    { name: 'Treadmill (Cooldown Walk)', sets: 1, reps: '15 min' },
  ],

  // ── Obese Core Stability & Functional Mobility (BMI >= 30, strength) ──
  'Cardio & Core|Obese Core & Spine Stabilization': [
    { name: 'Multi-Function Cable Column (Seated Cable Rotations)', sets: 3, reps: '12 each' },
    { name: '45-Degree Hyperextension Bench (Supported Back Alignment)', sets: 3, reps: '10-12' },
    { name: 'Functional Trainer Cable Crossover Machine (Core Hold)', sets: 3, reps: '12' },
    { name: 'Gentle Full-Body Stretching', sets: 1, reps: '10 min' },
  ],
  'Lower Body / Leg Day|Obese Seated Lower Functional Strength': [
    { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '10-12' },
    { name: 'Leg Extension Machine', sets: 3, reps: '12' },
    { name: 'Seated Calf Raise Machine', sets: 3, reps: '15' },
    { name: 'Hip Abductor / Adductor Machine', sets: 3, reps: '12-15' },
  ],
  'Upper Body|Obese Seated Upper Strength & Posture': [
    { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '10-12' },
    { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '10-12' },
    { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '12' },
    { name: 'Dual Adjustable Pulley Machine (Face Pulls)', sets: 3, reps: '12-15' },
  ],
  'Full Body|Obese Functional Balance & Mobility': [
    { name: 'Dip / Leg Raise Station (Assisted Knee Tucks)', sets: 3, reps: '10' },
    { name: 'Treadmill (Steady-Pace Flat Walk)', sets: 1, reps: '20 min' },
    { name: 'Gentle Full-Body Stretching', sets: 1, reps: '15 min' },
  ],

  // ── Overweight Recomposition Targets (25 <= BMI < 30, muscle_gain) ──
  'Upper Body|Overweight Recomp Push Power': [
    { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '10-12' },
    { name: 'Selectorized Chest Press Machine', sets: 3, reps: '12' },
    { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '12' },
    { name: 'Dip / Leg Raise Station (Knee Tucks)', sets: 3, reps: '12' },
  ],
  'Upper Body|Overweight Recomp Pull & Lats': [
    { name: 'Plate-Loaded Lat Pulldown Machine', sets: 3, reps: '10-12' },
    { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '10-12' },
    { name: 'Preacher Curl Bench (EZ Bar Curls)', sets: 3, reps: '10-12' },
    { name: 'Dual Adjustable Pulley Machine (Face Pulls)', sets: 3, reps: '15' },
  ],
  'Lower Body / Leg Day|Overweight Recomp Leg Hypertrophy': [
    { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 4, reps: '10-12' },
    { name: 'Hip Thrust Machine', sets: 3, reps: '12' },
    { name: 'Leg Extension / Leg Curl Machine', sets: 3, reps: '12' },
    { name: 'Seated Calf Raise Machine', sets: 3, reps: '15' },
  ],
  'Upper Body|Overweight Recomp Shoulder & Arms': [
    { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '12-15' },
    { name: 'Seated Bicep Curl / Preacher Curl Machine', sets: 3, reps: '12' },
    { name: 'Dual Adjustable Pulley Machine (Rope Extensions)', sets: 3, reps: '12' },
    { name: 'Multi-Function Cable Column (Cable Crunches)', sets: 3, reps: '15' },
  ],
  'Full Body|Overweight Metabolic Recomp Finisher': [
    { name: 'Selectorized Squat Machine', sets: 3, reps: '12' },
    { name: 'Lat Pulldown Machine', sets: 3, reps: '12' },
    { name: 'Kettlebells (Goblet Squats & Swings)', sets: 3, reps: '12' },
    { name: 'Treadmill (Incline Cooldown Walk)', sets: 1, reps: '15 min' },
  ],

  // ── Overweight Athletic Tone Targets (25 <= BMI < 30, tone_endurance) ──
  'Full Body|Overweight Functional Tone Circuit': [
    { name: 'Functional Trainer Cable Crossover Machine', sets: 3, reps: '15' },
    { name: 'Selectorized Chest Press Machine', sets: 3, reps: '12-15' },
    { name: 'Lat Pulldown Machine', sets: 3, reps: '15' },
    { name: 'Kettlebells (Kettlebell Swings)', sets: 3, reps: '15-20' },
  ],
  'Cardio & Core|Overweight Incline Interval & Core': [
    { name: 'Treadmill (Interval Incline Walk)', sets: 1, reps: '25 min' },
    { name: 'Dip / Leg Raise Station (Captain’s Chair Leg Raises)', sets: 3, reps: '15' },
    { name: 'Multi-Function Cable Column (Cable Crunches)', sets: 3, reps: '15' },
  ],
  'Lower Body / Leg Day|Overweight Glutes & Leg Toning': [
    { name: 'Hip Thrust Machine', sets: 3, reps: '15' },
    { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '12-15' },
    { name: 'Hip Abductor / Adductor Machine', sets: 3, reps: '15-20' },
    { name: 'Seated Calf Raise Machine', sets: 3, reps: '15' },
  ],
  'Upper Body|Overweight Upper Cable Sculpt': [
    { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '12' },
    { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '12-15' },
    { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '15' },
    { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '15' },
  ],
  'Cardio & Core|Overweight Athletic Conditioning Finisher': [
    { name: 'Treadmill (Interval Incline Walk)', sets: 1, reps: '20 min' },
    { name: '45-Degree Hyperextension Bench', sets: 3, reps: '12-15' },
    { name: 'Functional Trainer Cable Crossover (Torso Twists)', sets: 3, reps: '15 each' },
    { name: 'Full Body Stretching & Cooldown', sets: 1, reps: '10 min' },
  ],

  // ── Underweight Strength Targets (BMI < 18.5, strength) ──
  'Lower Body / Leg Day|Underweight Heavy Compound Lower': [
    { name: 'Hack Squat Machine', sets: 4, reps: '6-8' },
    { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 4, reps: '6-8' },
    { name: 'Seated Calf Raise Machine', sets: 3, reps: '10-12' },
    { name: '45-Degree Hyperextension Bench', sets: 3, reps: '10' },
  ],
  'Upper Body|Underweight Heavy Push/Pull Strength': [
    { name: 'Plate-Loaded Incline Chest Press Machine', sets: 4, reps: '6-8' },
    { name: 'Plate-Loaded Lat Pulldown Machine', sets: 4, reps: '6-8' },
    { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '8' },
    { name: 'Dual Adjustable Pulley Machine (Heavy Tricep Pushdown)', sets: 3, reps: '8' },
  ],
  'Lower Body / Leg Day|Underweight Posterior & Leg Power': [
    { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 4, reps: '6-8' },
    { name: 'Leg Extension / Leg Curl Machine (Hamstrings)', sets: 3, reps: '8' },
    { name: 'Hack Squat Machine', sets: 3, reps: '6-8' },
    { name: 'Seated Calf Raise Machine', sets: 3, reps: '10' },
  ],
  'Upper Body|Underweight Upper Density & Arm Power': [
    { name: 'Selectorized Chest Press Machine', sets: 3, reps: '6-8' },
    { name: 'Wide Grip Lat Pulldown', sets: 3, reps: '8' },
    { name: 'Preacher Curl Bench (EZ Bar Curls)', sets: 3, reps: '8' },
    { name: 'Dip / Leg Raise Station (Knee Tucks)', sets: 3, reps: '10' },
  ],

  // ── Underweight Frame Sculpt Targets (BMI < 18.5, tone_endurance) ──
  'Upper Body|Underweight Shoulder & Lat Width': [
    { name: 'Plate-Loaded Lat Pulldown Machine', sets: 4, reps: '8-10' },
    { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 4, reps: '10-12' },
    { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '10' },
    { name: 'Dual Adjustable Pulley Machine (Face Pulls)', sets: 3, reps: '12' },
  ],
  'Lower Body / Leg Day|Underweight Leg & Glute Proportion': [
    { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '10' },
    { name: 'Hip Thrust Machine', sets: 3, reps: '10-12' },
    { name: 'Leg Extension Machine', sets: 3, reps: '10-12' },
    { name: 'Seated Calf Raise Machine', sets: 3, reps: '12' },
  ],
  'Upper Body|Underweight Chest & Bicep Sculpt': [
    { name: 'Selectorized Chest Press Machine', sets: 3, reps: '10' },
    { name: 'Seated Bicep Curl / Preacher Curl Machine', sets: 3, reps: '10' },
    { name: 'Pec Fly / Rear Delt Machine', sets: 3, reps: '10-12' },
    { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '10-12' },
  ],
  'Full Body|Underweight Symmetry & Frame Finisher': [
    { name: 'Lat Pulldown Machine', sets: 3, reps: '10' },
    { name: '45-Degree Leg Press Machine', sets: 3, reps: '10' },
    { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '12' },
    { name: 'Dip / Leg Raise Station (Knee Tucks)', sets: 3, reps: '12' },
  ],
  'Rest Day': [
    { name: 'Light Walk',             sets: 1, reps: '20 min' },
    { name: 'Foam Rolling',           sets: 1, reps: '10 min' },
    { name: 'Hydrate',                sets: 1, reps: '2-3L'   },
  ],
};

// ── Fitness Goals & Profile Definitions ───────────────────────────
export type FitnessGoalKey = 'weight_loss' | 'muscle_gain' | 'strength' | 'tone_endurance';

export interface FitnessGoalOption {
  id: FitnessGoalKey;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  badge: string;
  recommendedDays: string;
}

export const FITNESS_GOAL_OPTIONS: FitnessGoalOption[] = [
  {
    id: 'muscle_gain',
    title: 'Muscle Building & Hypertrophy',
    tagline: 'Pack on lean muscle mass with targeted splits',
    description: 'Progressive Push/Pull/Legs volume utilizing Afforda Gym plate-loaded presses, hack squats, and cable isolations.',
    icon: 'barbell-outline',
    badge: 'Build Muscle',
    recommendedDays: '5 days / week (Afternoon 5:00 PM)',
  },
  {
    id: 'strength',
    title: 'Strength & Heavy Power',
    tagline: 'Lift heavier and build maximum raw power',
    description: 'Compound lifts on Olympic power racks, heavy leg presses, and posterior chain stabilization for peak strength progression.',
    icon: 'flash-outline',
    badge: 'Raw Power',
    recommendedDays: '4 days / week (Afternoon 5:00 PM)',
  },
  {
    id: 'tone_endurance',
    title: 'Lean Tone & Endurance',
    tagline: 'Sculpt your body, tone muscles & boost stamina',
    description: 'Higher-rep isolation, hip thrusts, functional cable sculpting, and core endurance to stay lean, fit, and conditioned.',
    icon: 'body-outline',
    badge: 'Tone & Stamina',
    recommendedDays: '4-5 days / week (Afternoon 5:00 PM)',
  },
  {
    id: 'weight_loss',
    title: 'Body Fat Trimming & Definition',
    tagline: 'Shred body fat and reveal deep muscular definition',
    description: 'Metabolic conditioning, HIIT intervals, and resistance circuits to maintain muscle mass while dropping body fat percentage for a sharp, ripped look.',
    icon: 'flame-outline',
    badge: 'Cut & Define',
    recommendedDays: '4 days / week (Afternoon 5:00 PM)',
  },
];

/**
 * Tailored body goals for Underweight members (BMI < 18.5):
 * All goals focus on healthy weight gain, muscle mass, skeletal density, and frame expansion.
 */
export const UNDERWEIGHT_GOAL_OPTIONS: FitnessGoalOption[] = [
  {
    id: 'muscle_gain',
    title: 'Lean Mass Building & Caloric Surplus',
    tagline: 'Build dense muscle mass & healthy body weight safely',
    description: 'Specifically calibrated for underweight members (BMI < 18.5): High-efficiency hypertrophy splits to build dense muscle, increase body mass safely, and avoid burning excess calories.',
    icon: 'barbell-outline',
    badge: 'Underweight • Mass Gain',
    recommendedDays: '4 days / week (Afternoon 5:00 PM)',
  },
  {
    id: 'strength',
    title: 'Progressive Strength & Bone Density',
    tagline: 'Stimulate skeletal density and raw power with controlled compound lifts',
    description: 'Controlled compound lifts on plate-loaded machines with lower reps and full rest intervals to maximize muscle recruitment and bone density without burning excessive calories.',
    icon: 'flash-outline',
    badge: 'Underweight • Strength',
    recommendedDays: '3-4 days / week (Afternoon 5:00 PM)',
  },
  {
    id: 'tone_endurance',
    title: 'Full-Body Frame Sculpt & Hypertrophy',
    tagline: 'Widen your frame and sculpt full-body symmetry with targeted machines',
    description: 'Focused shoulder broadening, lat width, and glute/leg volume to build an aesthetic, proportioned muscular frame while maintaining optimal recovery.',
    icon: 'body-outline',
    badge: 'Underweight • Frame Sculpt',
    recommendedDays: '4 days / week (Afternoon 5:00 PM)',
  },
];

/**
 * Tailored body goals for Overweight members (25 <= BMI < 30):
 * All goals focus on joint-friendly fat burning, body recomposition, and metabolic conditioning.
 */
export const OVERWEIGHT_GOAL_OPTIONS: FitnessGoalOption[] = [
  {
    id: 'weight_loss',
    title: 'Active Metabolic Fat Burn & Conditioning',
    tagline: 'Joint-friendly metabolic circuits & calorie-burning splits',
    description: 'Specifically designed for overweight members (BMI 25–29.9): Calorie-burning machine circuits, functional cardio intervals, and low-impact movements to melt fat while protecting knee joints.',
    icon: 'flame-outline',
    badge: 'Overweight • Fat Burn',
    recommendedDays: '4-5 days / week (Afternoon 5:00 PM)',
  },
  {
    id: 'muscle_gain',
    title: 'Body Recomposition & Muscle Sculpting',
    tagline: 'Build lean muscle while burning fat simultaneously (Recomp)',
    description: 'Targeted hypertrophy and plate-loaded compound machines combined with metabolic tempo to stimulate muscle growth while utilizing stored body fat as fuel.',
    icon: 'barbell-outline',
    badge: 'Overweight • Recomp',
    recommendedDays: '4-5 days / week (Afternoon 5:00 PM)',
  },
  {
    id: 'tone_endurance',
    title: 'Aerobic Stamina & Athletic Toning',
    tagline: 'Sculpt muscle definition, increase stamina & enhance agility',
    description: 'Cable sculpting, moderate-rep compound isolation, functional core circuits, and brisk cardio pacing to tighten muscles and improve athletic conditioning.',
    icon: 'body-outline',
    badge: 'Overweight • Athletic Tone',
    recommendedDays: '4 days / week (Afternoon 5:00 PM)',
  },
];

/**
 * Tailored body goals for Obese members (BMI >= 30):
 * 100% low-impact, joint-safe seated machine exercises, cardiovascular stamina, and core stabilization.
 */
export const OBESE_GOAL_OPTIONS: FitnessGoalOption[] = [
  {
    id: 'weight_loss',
    title: 'Safe Low-Impact Fat Loss & Joint Protection',
    tagline: 'Zero joint-strain selectorized machine circuits & incline walks',
    description: 'Specifically calibrated for obesity (BMI ≥ 30): 100% seated selectorized machine exercises and flat/gentle incline treadmill walks with ZERO knee/spine impact to safely burn fat and protect joints.',
    icon: 'shield-checkmark-outline',
    badge: 'Obese • Joint Safe',
    recommendedDays: '4 days / week (Afternoon 5:00 PM)',
  },
  {
    id: 'tone_endurance',
    title: 'Cardiovascular Health & Stamina Building',
    tagline: 'Improve heart health, lower blood pressure & build steady aerobic stamina',
    description: 'Low-strain cardio pacing, steady incline walks, seated arm movements, and breathing endurance routines to strengthen your cardiovascular system and boost energy safely.',
    icon: 'heart-outline',
    badge: 'Obese • Cardio & Stamina',
    recommendedDays: '3-4 days / week (Afternoon 5:00 PM)',
  },
  {
    id: 'strength',
    title: 'Core Stability & Functional Mobility',
    tagline: 'Enhance daily movement, spinal support & posture',
    description: 'Seated core engagement, cable stabilizing movements, and supported hyperextensions designed to strengthen back muscles, reduce lower back pain, and improve overall balance.',
    icon: 'fitness-outline',
    badge: 'Obese • Core & Mobility',
    recommendedDays: '3-4 days / week (Afternoon 5:00 PM)',
  },
];

/**
 * Returns fitness goal options strictly tailored to the user's BMI category.
 * - Underweight (BMI < 18.5)      → Dedicated Underweight goal set (Mass Gain, Strength, Frame Sculpt)
 * - Obese (BMI >= 30)             → Dedicated Obese goal set (Joint-Safe Fat Loss, Cardio Stamina, Core Mobility)
 * - Overweight (25 <= BMI < 30)   → Dedicated Overweight goal set (Metabolic Fat Burn, Recomp, Athletic Tone)
 * - Normal Weight (18.5 - 24.9)   → Full baseline goal set (Muscle Building, Raw Power, Tone, Cut & Define)
 */
export function getGoalOptionsForBmi(bmi?: number | null): FitnessGoalOption[] {
  if (!bmi || bmi <= 0) {
    return FITNESS_GOAL_OPTIONS;
  }
  if (bmi < 18.5) {
    return UNDERWEIGHT_GOAL_OPTIONS;
  }
  if (bmi >= 30) {
    return OBESE_GOAL_OPTIONS;
  }
  if (bmi >= 25) {
    return OVERWEIGHT_GOAL_OPTIONS;
  }
  // Normal Weight (18.5 <= BMI < 25): Healthy baseline goals
  return FITNESS_GOAL_OPTIONS;
}

export interface WeekPlanTemplateDay {
  title: string;
  customTarget: string;
  duration: string;
  coach: string;
  location: string;
  time: string; // 24h "HH:MM" e.g. "17:00"
  isRest: boolean;
  exercises: Array<{ name: string; sets: number; reps: string }>;
}

export function computeBmi(heightCm?: number | null, weightKg?: number | null): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const hMeters = heightCm / 100;
  return Number((weightKg / (hMeters * hMeters)).toFixed(1));
}

export function getBmiCategory(bmi?: number | null): {
  label: string;
  color: string;
  advice: string;
  key: 'underweight' | 'normal' | 'overweight' | 'obese' | 'unknown';
} {
  if (!bmi || bmi <= 0) {
    return { label: 'Unknown', color: 'medium', advice: 'Enter height and weight to view your BMI category.', key: 'unknown' };
  }
  // WHO Standard BMI Classifications
  if (bmi < 18.5) {
    return {
      label: 'Underweight',
      color: 'warning',
      advice: 'Your BMI indicates you are underweight. Focus on muscle building and caloric surplus to reach a healthy weight.',
      key: 'underweight',
    };
  }
  if (bmi < 25) {
    return {
      label: 'Normal Weight',
      color: 'success',
      advice: 'Your BMI is within the healthy range (18.5–24.9). You can pursue any goal — muscle building, strength, or toning.',
      key: 'normal',
    };
  }
  if (bmi < 30) {
    return {
      label: 'Overweight',
      color: 'warning',
      advice: 'Your BMI (25–29.9) indicates overweight. Weight loss circuits with low-impact, joint-friendly machine exercises are recommended.',
      key: 'overweight',
    };
  }
  return {
    label: 'Obese',
    color: 'danger',
    advice: 'Your BMI (≥30) indicates obesity. Low-impact machine circuits, cardio conditioning, and gradual fat-burning routines are strongly recommended.',
    key: 'obese',
  };
}

export function formatTime24to12(time24: string): { time: string; ampm: 'AM' | 'PM' } {
  if (!time24) return { time: '5:00', ampm: 'PM' };
  const [hoursRaw, minutesRaw] = time24.split(':').map(Number);
  if (Number.isNaN(hoursRaw) || Number.isNaN(minutesRaw)) return { time: '5:00', ampm: 'PM' };
  const ampm: 'AM' | 'PM' = hoursRaw >= 12 ? 'PM' : 'AM';
  const hours12 = hoursRaw > 12 ? hoursRaw - 12 : hoursRaw === 0 ? 12 : hoursRaw;
  return { time: `${hours12}:${String(minutesRaw).padStart(2, '0')}`, ampm };
}

/**
 * Builds a tailored 7-day workout plan (index 0 = Mon … 6 = Sun) based on
 * the member's physical stats (BMI), chosen body goal, and preferred workout time.
 */
export function buildGoalWeekPlan(
  goal?: string | null,
  bmi?: number | null,
  preferredTime: string = '17:00'
): WeekPlanTemplateDay[] {
  const normTime = preferredTime?.trim() || '17:00';
  const normalizedGoal = (goal?.toLowerCase()?.trim() || 'muscle_gain') as FitnessGoalKey;

  // 1. OBESE (BMI >= 30): 100% joint-safe, low-impact routines tailored to chosen goal
  if (typeof bmi === 'number' && bmi >= 30) {
    if (normalizedGoal === 'tone_endurance') {
      return [
        // Mon (0): Obese Aerobic Conditioning & Incline Walk
        {
          title: 'Cardio & Core',
          customTarget: 'Obese Aerobic Conditioning & Incline Walk',
          duration: '40 min',
          coach: 'Coach Ryza',
          location: 'Cardio Area',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Treadmill (Flat/Gentle Incline Walk)', sets: 1, reps: '25 min' },
            { name: 'Multi-Function Cable Column (Seated Cable Rotations)', sets: 3, reps: '12 each' },
            { name: 'Gentle Full-Body Stretching', sets: 1, reps: '10 min' },
          ],
        },
        // Tue (1): Obese Seated Upper Stamina
        {
          title: 'Upper Body',
          customTarget: 'Obese Seated Upper Stamina',
          duration: '40 min',
          coach: 'Coach Marco',
          location: 'Gym Floor B',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Selectorized Chest Press Machine', sets: 3, reps: '15' },
            { name: 'Lat Pulldown Machine', sets: 3, reps: '15' },
            { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '15' },
            { name: '45-Degree Hyperextension Bench (Supported Back Alignment)', sets: 3, reps: '10' },
          ],
        },
        // Wed (2): Rest & Joint Decompression
        {
          title: 'Rest Day',
          customTarget: 'Active Recovery & Circulation',
          duration: '15 min',
          coach: '',
          location: 'Home / Recovery',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Gentle Mobility & Joint Rotations', sets: 1, reps: '15 min' },
            { name: 'Hydrate & Electrolytes', sets: 1, reps: '2-3 Liters' },
          ],
        },
        // Thu (3): Obese Lower Machine Stamina
        {
          title: 'Lower Body / Leg Day',
          customTarget: 'Obese Lower Machine Stamina',
          duration: '40 min',
          coach: 'Coach Ethan',
          location: 'Weights Area',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '15' },
            { name: 'Seated Calf Raise Machine', sets: 3, reps: '15-20' },
            { name: 'Hip Abductor / Adductor Machine', sets: 3, reps: '15' },
            { name: 'Treadmill (Steady-Pace Flat Walk)', sets: 1, reps: '15 min' },
          ],
        },
        // Fri (4): Obese Low-Impact Cardio & Posture
        {
          title: 'Cardio & Core',
          customTarget: 'Obese Low-Impact Cardio & Posture',
          duration: '40 min',
          coach: 'Coach Ryza',
          location: 'Cardio Area',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Treadmill (Flat/Gentle Incline Walk)', sets: 1, reps: '20 min' },
            { name: 'Dual Adjustable Pulley Machine (Face Pulls)', sets: 3, reps: '15' },
            { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '12-15' },
            { name: 'Full Body Stretching & Cooldown', sets: 1, reps: '10 min' },
          ],
        },
        // Sat (5): Obese Seated Conditioning Finisher
        {
          title: 'Full Body',
          customTarget: 'Obese Seated Conditioning Finisher',
          duration: '35 min',
          coach: 'Coach Ethan',
          location: 'Gym Floor B',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Selectorized Chest Press Machine', sets: 3, reps: '12' },
            { name: 'Lat Pulldown Machine', sets: 3, reps: '12' },
            { name: 'Dip / Leg Raise Station (Assisted Knee Tucks)', sets: 3, reps: '10' },
            { name: 'Treadmill (Cooldown Walk)', sets: 1, reps: '15 min' },
          ],
        },
        // Sun (6): Full Rest Day
        {
          title: 'Rest Day',
          customTarget: 'Full Recovery & Joint Rest',
          duration: '0 min',
          coach: '',
          location: 'Home',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Rest & Full Joint Recovery', sets: 1, reps: 'Full Day' },
            { name: 'Hydrate', sets: 1, reps: '2-3L' },
          ],
        },
      ];
    }

    if (normalizedGoal === 'strength') {
      return [
        // Mon (0): Obese Core & Spine Stabilization
        {
          title: 'Cardio & Core',
          customTarget: 'Obese Core & Spine Stabilization',
          duration: '45 min',
          coach: 'Coach Ryza',
          location: 'Functional Zone',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Multi-Function Cable Column (Seated Cable Rotations)', sets: 3, reps: '12 each' },
            { name: '45-Degree Hyperextension Bench (Supported Back Alignment)', sets: 3, reps: '10-12' },
            { name: 'Functional Trainer Cable Crossover Machine (Core Hold)', sets: 3, reps: '12' },
            { name: 'Gentle Full-Body Stretching', sets: 1, reps: '10 min' },
          ],
        },
        // Tue (1): Rest & Spine Decompression
        {
          title: 'Rest Day',
          customTarget: 'Spine & Joint Decompression',
          duration: '15 min',
          coach: '',
          location: 'Home / Recovery',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Gentle Mobility & Joint Rotations', sets: 1, reps: '15 min' },
            { name: 'Hydrate & Electrolytes', sets: 1, reps: '2-3 Liters' },
          ],
        },
        // Wed (2): Obese Seated Lower Functional Strength
        {
          title: 'Lower Body / Leg Day',
          customTarget: 'Obese Seated Lower Functional Strength',
          duration: '45 min',
          coach: 'Coach Ethan',
          location: 'Weights Area',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '10-12' },
            { name: 'Leg Extension Machine', sets: 3, reps: '12' },
            { name: 'Seated Calf Raise Machine', sets: 3, reps: '15' },
            { name: 'Hip Abductor / Adductor Machine', sets: 3, reps: '12-15' },
          ],
        },
        // Thu (3): Rest Day
        {
          title: 'Rest Day',
          customTarget: 'Active Recovery & Hydrate',
          duration: '0 min',
          coach: '',
          location: 'Home',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Light Walk', sets: 1, reps: '15 min' },
            { name: 'Hydrate', sets: 1, reps: '2-3L' },
          ],
        },
        // Fri (4): Obese Seated Upper Strength & Posture
        {
          title: 'Upper Body',
          customTarget: 'Obese Seated Upper Strength & Posture',
          duration: '45 min',
          coach: 'Coach Marco',
          location: 'Gym Floor B',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '10-12' },
            { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '10-12' },
            { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '12' },
            { name: 'Dual Adjustable Pulley Machine (Face Pulls)', sets: 3, reps: '12-15' },
          ],
        },
        // Sat (5): Obese Functional Balance & Mobility
        {
          title: 'Full Body',
          customTarget: 'Obese Functional Balance & Mobility',
          duration: '35 min',
          coach: 'Coach Ryza',
          location: 'Functional Zone',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Dip / Leg Raise Station (Assisted Knee Tucks)', sets: 3, reps: '10' },
            { name: 'Treadmill (Steady-Pace Flat Walk)', sets: 1, reps: '20 min' },
            { name: 'Gentle Full-Body Stretching', sets: 1, reps: '15 min' },
          ],
        },
        // Sun (6): Full Rest Day
        {
          title: 'Rest Day',
          customTarget: 'Full Recovery & Joint Rest',
          duration: '0 min',
          coach: '',
          location: 'Home',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Rest & Full Joint Recovery', sets: 1, reps: 'Full Day' },
            { name: 'Hydrate', sets: 1, reps: '2-3L' },
          ],
        },
      ];
    }

    // Default for Obese (weight_loss): Safe Low-Impact Fat Loss & Joint Protection
    return [
      // Mon (0): Obese Safe Full Body Circuit
      {
        title: 'Full Body',
        customTarget: 'Obese Low-Impact Full Body Circuit',
        duration: '45 min',
        coach: 'Coach Ethan',
        location: 'Gym Floor B & Functional Zone',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Selectorized Chest Press Machine', sets: 3, reps: '12-15' },
          { name: 'Lat Pulldown Machine', sets: 3, reps: '12-15' },
          { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '12-15' },
          { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '12-15' },
          { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '15' },
        ],
      },
      // Tue (1): Obese Low-Impact Cardio Conditioning
      {
        title: 'Cardio & Core',
        customTarget: 'Obese Safe Low-Impact Cardio',
        duration: '40 min',
        coach: 'Coach Ryza',
        location: 'Cardio Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Treadmill (Flat/Gentle Incline Walk)', sets: 1, reps: '20-25 min' },
          { name: 'Multi-Function Cable Column (Seated Cable Rotations)', sets: 3, reps: '12 each' },
          { name: '45-Degree Hyperextension Bench (Supported Back Alignment)', sets: 3, reps: '10-12' },
          { name: 'Gentle Full-Body Stretching', sets: 1, reps: '10 min' },
        ],
      },
      // Wed (2): Rest & Recovery
      {
        title: 'Rest Day',
        customTarget: 'Active Recovery & Joint Decompression',
        duration: '15 min',
        coach: '',
        location: 'Home / Recovery',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Gentle Mobility & Joint Rotations', sets: 1, reps: '15 min' },
          { name: 'Hydrate & Electrolytes', sets: 1, reps: '2-3 Liters' },
        ],
      },
      // Thu (3): Obese Seated Lower Body
      {
        title: 'Lower Body / Leg Day',
        customTarget: 'Obese Seated Machine Lower Body',
        duration: '45 min',
        coach: 'Coach Ethan',
        location: 'Weights Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '12-15' },
          { name: 'Leg Extension Machine', sets: 3, reps: '12-15' },
          { name: 'Leg Extension / Leg Curl Machine', sets: 3, reps: '12-15' },
          { name: 'Seated Calf Raise Machine', sets: 3, reps: '15-20' },
          { name: 'Hip Abductor / Adductor Machine', sets: 3, reps: '15' },
        ],
      },
      // Fri (4): Obese Seated Upper Body Sculpt
      {
        title: 'Upper Body',
        customTarget: 'Obese Seated Machine Upper Sculpt',
        duration: '45 min',
        coach: 'Coach Marco',
        location: 'Gym Floor B',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '12-15' },
          { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '12-15' },
          { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '15' },
          { name: 'Seated Bicep Curl / Preacher Curl Machine', sets: 3, reps: '12-15' },
          { name: 'Dual Adjustable Pulley Machine (Face Pulls)', sets: 3, reps: '15' },
        ],
      },
      // Sat (5): Obese Safe Cooldown & Metabolic Finish
      {
        title: 'Cardio & Core',
        customTarget: 'Obese Low-Impact Metabolic Finish',
        duration: '35 min',
        coach: 'Coach Ryza',
        location: 'Functional Zone & Cardio Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Treadmill (Steady-Pace Flat Walk)', sets: 1, reps: '20 min' },
          { name: 'Functional Trainer Cable Crossover Machine (Core Hold)', sets: 3, reps: '12' },
          { name: 'Dip / Leg Raise Station (Assisted Knee Tucks)', sets: 3, reps: '10-12' },
          { name: 'Full Body Stretching & Cooldown', sets: 1, reps: '10 min' },
        ],
      },
      // Sun (6): Full Rest Day
      {
        title: 'Rest Day',
        customTarget: 'Full Recovery & Joint Rest',
        duration: '0 min',
        coach: '',
        location: 'Home',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Rest & Full Joint Recovery', sets: 1, reps: 'Full Day' },
          { name: 'Hydrate', sets: 1, reps: '2-3L' },
        ],
      },
    ];
  }

  // 2. OVERWEIGHT (25 <= BMI < 30): Calorie burn, recomposition & athletic tone
  if (typeof bmi === 'number' && bmi >= 25) {
    if (normalizedGoal === 'muscle_gain') {
      return [
        // Mon (0): Overweight Recomp Push Power
        {
          title: 'Upper Body',
          customTarget: 'Overweight Recomp Push Power',
          duration: '50 min',
          coach: 'Coach Ethan',
          location: 'Gym Floor B',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '10-12' },
            { name: 'Selectorized Chest Press Machine', sets: 3, reps: '12' },
            { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '12' },
            { name: 'Dip / Leg Raise Station (Knee Tucks)', sets: 3, reps: '12' },
          ],
        },
        // Tue (1): Overweight Recomp Pull & Lats
        {
          title: 'Upper Body',
          customTarget: 'Overweight Recomp Pull & Lats',
          duration: '50 min',
          coach: 'Coach Marco',
          location: 'Gym Floor B',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Plate-Loaded Lat Pulldown Machine', sets: 3, reps: '10-12' },
            { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '10-12' },
            { name: 'Preacher Curl Bench (EZ Bar Curls)', sets: 3, reps: '10-12' },
            { name: 'Dual Adjustable Pulley Machine (Face Pulls)', sets: 3, reps: '15' },
          ],
        },
        // Wed (2): Rest & Recovery
        {
          title: 'Rest Day',
          customTarget: 'Active Recovery & Hydrate',
          duration: '20 min',
          coach: '',
          location: 'Home / Recovery',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Light Walk', sets: 1, reps: '20 min' },
            { name: 'Hydrate & Electrolytes', sets: 1, reps: '2-3 Liters' },
            { name: 'Gentle Full-Body Stretching', sets: 1, reps: '10 min' },
          ],
        },
        // Thu (3): Overweight Recomp Leg Hypertrophy
        {
          title: 'Lower Body / Leg Day',
          customTarget: 'Overweight Recomp Leg Hypertrophy',
          duration: '50 min',
          coach: 'Coach Ethan',
          location: 'Weights Area',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 4, reps: '10-12' },
            { name: 'Hip Thrust Machine', sets: 3, reps: '12' },
            { name: 'Leg Extension / Leg Curl Machine', sets: 3, reps: '12' },
            { name: 'Seated Calf Raise Machine', sets: 3, reps: '15' },
          ],
        },
        // Fri (4): Overweight Recomp Shoulder & Arms
        {
          title: 'Upper Body',
          customTarget: 'Overweight Recomp Shoulder & Arms',
          duration: '45 min',
          coach: 'Coach Marco',
          location: 'Gym Floor B',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '12-15' },
            { name: 'Seated Bicep Curl / Preacher Curl Machine', sets: 3, reps: '12' },
            { name: 'Dual Adjustable Pulley Machine (Rope Extensions)', sets: 3, reps: '12' },
            { name: 'Multi-Function Cable Column (Cable Crunches)', sets: 3, reps: '15' },
          ],
        },
        // Sat (5): Overweight Metabolic Recomp Finisher
        {
          title: 'Full Body',
          customTarget: 'Overweight Metabolic Recomp Finisher',
          duration: '45 min',
          coach: 'Coach Ryza',
          location: 'Functional Zone',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Selectorized Squat Machine', sets: 3, reps: '12' },
            { name: 'Lat Pulldown Machine', sets: 3, reps: '12' },
            { name: 'Kettlebells (Goblet Squats & Swings)', sets: 3, reps: '12' },
            { name: 'Treadmill (Incline Cooldown Walk)', sets: 1, reps: '15 min' },
          ],
        },
        // Sun (6): Rest Day
        {
          title: 'Rest Day',
          customTarget: 'Full Rest & Recovery',
          duration: '0 min',
          coach: '',
          location: 'Home',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Rest & Muscle Recovery', sets: 1, reps: 'Full Day' },
            { name: 'Hydrate', sets: 1, reps: '2-3L' },
          ],
        },
      ];
    }

    if (normalizedGoal === 'tone_endurance') {
      return [
        // Mon (0): Overweight Functional Tone Circuit
        {
          title: 'Full Body',
          customTarget: 'Overweight Functional Tone Circuit',
          duration: '45 min',
          coach: 'Coach Ethan',
          location: 'Functional Zone',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Functional Trainer Cable Crossover Machine', sets: 3, reps: '15' },
            { name: 'Selectorized Chest Press Machine', sets: 3, reps: '12-15' },
            { name: 'Lat Pulldown Machine', sets: 3, reps: '15' },
            { name: 'Kettlebells (Kettlebell Swings)', sets: 3, reps: '15-20' },
          ],
        },
        // Tue (1): Overweight Incline Interval & Core
        {
          title: 'Cardio & Core',
          customTarget: 'Overweight Incline Interval & Core',
          duration: '45 min',
          coach: 'Coach Ryza',
          location: 'Cardio Area',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Treadmill (Interval Incline Walk)', sets: 1, reps: '25 min' },
            { name: 'Dip / Leg Raise Station (Captain’s Chair Leg Raises)', sets: 3, reps: '15' },
            { name: 'Multi-Function Cable Column (Cable Crunches)', sets: 3, reps: '15' },
          ],
        },
        // Wed (2): Rest Day
        {
          title: 'Rest Day',
          customTarget: 'Active Recovery & Hydrate',
          duration: '20 min',
          coach: '',
          location: 'Home / Recovery',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Light Walk', sets: 1, reps: '20 min' },
            { name: 'Hydrate & Electrolytes', sets: 1, reps: '2-3 Liters' },
            { name: 'Gentle Full-Body Stretching', sets: 1, reps: '10 min' },
          ],
        },
        // Thu (3): Overweight Glutes & Leg Toning
        {
          title: 'Lower Body / Leg Day',
          customTarget: 'Overweight Glutes & Leg Toning',
          duration: '45 min',
          coach: 'Coach Ethan',
          location: 'Weights Area',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Hip Thrust Machine', sets: 3, reps: '15' },
            { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '12-15' },
            { name: 'Hip Abductor / Adductor Machine', sets: 3, reps: '15-20' },
            { name: 'Seated Calf Raise Machine', sets: 3, reps: '15' },
          ],
        },
        // Fri (4): Overweight Upper Cable Sculpt
        {
          title: 'Upper Body',
          customTarget: 'Overweight Upper Cable Sculpt',
          duration: '45 min',
          coach: 'Coach Marco',
          location: 'Gym Floor B',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '12' },
            { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '12-15' },
            { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '15' },
            { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '15' },
          ],
        },
        // Sat (5): Overweight Athletic Conditioning Finisher
        {
          title: 'Cardio & Core',
          customTarget: 'Overweight Athletic Conditioning Finisher',
          duration: '40 min',
          coach: 'Coach Ryza',
          location: 'Functional Zone',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Treadmill (Interval Incline Walk)', sets: 1, reps: '20 min' },
            { name: '45-Degree Hyperextension Bench', sets: 3, reps: '12-15' },
            { name: 'Functional Trainer Cable Crossover (Torso Twists)', sets: 3, reps: '15 each' },
            { name: 'Full Body Stretching & Cooldown', sets: 1, reps: '10 min' },
          ],
        },
        // Sun (6): Rest Day
        {
          title: 'Rest Day',
          customTarget: 'Full Rest & Recovery',
          duration: '0 min',
          coach: '',
          location: 'Home',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Rest & Muscle Recovery', sets: 1, reps: 'Full Day' },
            { name: 'Hydrate', sets: 1, reps: '2-3L' },
          ],
        },
      ];
    }

    // Default for Overweight (weight_loss): Active Metabolic Fat Burn & Conditioning
    return [
      // Mon (0): Full Body Metabolic Fat Burn
      {
        title: 'Full Body',
        customTarget: 'Metabolic Fat Burn Circuit',
        duration: '50 min',
        coach: 'Coach Ethan',
        location: 'Functional Zone & Cardio Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Selectorized Chest Press Machine', sets: 3, reps: '15' },
          { name: 'Lat Pulldown Machine', sets: 3, reps: '15' },
          { name: 'Selectorized Squat Machine', sets: 3, reps: '15' },
          { name: 'Dual Adjustable Pulley (Cable Crossover) Machine', sets: 3, reps: '15' },
          { name: 'Dip / Leg Raise Station (Knee Tucks)', sets: 3, reps: '12-15' },
        ],
      },
      // Tue (1): Cardio & Incline Conditioning
      {
        title: 'Cardio & Core',
        customTarget: 'Treadmill + Core Burn',
        duration: '45 min',
        coach: 'Coach Ryza',
        location: 'Cardio Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Treadmill (Interval Incline Walk)', sets: 1, reps: '20-25 min' },
          { name: 'Dip / Leg Raise Station (Captain’s Chair Leg Raises)', sets: 3, reps: '15' },
          { name: 'Multi-Function Cable Column (Cable Crunches)', sets: 3, reps: '15-20' },
          { name: 'Functional Trainer Cable Crossover (Torso Twists)', sets: 3, reps: '15 each' },
        ],
      },
      // Wed (2): Rest Day
      {
        title: 'Rest Day',
        customTarget: 'Active Recovery & Hydrate',
        duration: '20 min',
        coach: '',
        location: 'Home / Recovery',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Light Walk', sets: 1, reps: '20 min' },
          { name: 'Hydrate & Electrolytes', sets: 1, reps: '2-3 Liters' },
          { name: 'Gentle Full-Body Stretching', sets: 1, reps: '10 min' },
        ],
      },
      // Thu (3): Lower Body Calorie Burn
      {
        title: 'Lower Body / Leg Day',
        customTarget: 'Quads & Glutes Calorie Burn',
        duration: '50 min',
        coach: 'Coach Ethan',
        location: 'Weights Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '15' },
          { name: 'Hip Thrust Machine', sets: 3, reps: '12-15' },
          { name: 'Hip Abductor / Adductor Machine', sets: 3, reps: '15-20' },
          { name: 'Leg Extension / Leg Curl Machine', sets: 3, reps: '15' },
          { name: 'Seated Calf Raise Machine', sets: 3, reps: '15-20' },
        ],
      },
      // Fri (4): Upper Body Sculpt
      {
        title: 'Upper Body',
        customTarget: 'Chest & Back Sculpt',
        duration: '45 min',
        coach: 'Coach Marco',
        location: 'Gym Floor B',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '12-15' },
          { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '12-15' },
          { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '15' },
          { name: 'Assisted Pull-Up / Dip Machine', sets: 3, reps: '12' },
          { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '15' },
        ],
      },
      // Sat (5): Functional Fat Burn Finisher
      {
        title: 'Full Body',
        customTarget: 'Functional HIIT & Core',
        duration: '40 min',
        coach: 'Coach Ryza',
        location: 'Functional Zone',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Kettlebells (Goblet Squats & Swings)', sets: 3, reps: '12-15' },
          { name: '45-Degree Hyperextension / Back Extension Bench', sets: 3, reps: '15' },
          { name: 'Functional Trainer Cable Crossover Machine', sets: 3, reps: '15' },
          { name: 'Treadmill (Cooldown Walk)', sets: 1, reps: '15 min' },
        ],
      },
      // Sun (6): Rest Day
      {
        title: 'Rest Day',
        customTarget: 'Full Rest & Recovery',
        duration: '0 min',
        coach: '',
        location: 'Home',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Rest & Muscle Recovery', sets: 1, reps: 'Full Day' },
          { name: 'Hydrate', sets: 1, reps: '2-3L' },
        ],
      },
    ];
  }

  // 3. UNDERWEIGHT (BMI < 18.5): Caloric surplus, mass building & bone density
  if (typeof bmi === 'number' && bmi > 0 && bmi < 18.5) {
    if (normalizedGoal === 'strength') {
      return [
        // Mon (0): Underweight Heavy Compound Lower
        {
          title: 'Lower Body / Leg Day',
          customTarget: 'Underweight Heavy Compound Lower',
          duration: '50 min',
          coach: 'Coach Ethan',
          location: 'Weights Area',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Hack Squat Machine', sets: 4, reps: '6-8' },
            { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 4, reps: '6-8' },
            { name: 'Seated Calf Raise Machine', sets: 3, reps: '10-12' },
            { name: '45-Degree Hyperextension Bench', sets: 3, reps: '10' },
          ],
        },
        // Tue (1): Rest Day (Skeletal Remodeling)
        {
          title: 'Rest Day',
          customTarget: 'Skeletal Remodeling & Rest',
          duration: '0 min',
          coach: '',
          location: 'Home / Recovery',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Hydrate & High Protein Nutrition', sets: 1, reps: 'Full Day' },
            { name: 'Light Walk & Muscle Rest', sets: 1, reps: '15 min' },
          ],
        },
        // Wed (2): Underweight Heavy Push/Pull Strength
        {
          title: 'Upper Body',
          customTarget: 'Underweight Heavy Push/Pull Strength',
          duration: '50 min',
          coach: 'Coach Marco',
          location: 'Gym Floor B',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Plate-Loaded Incline Chest Press Machine', sets: 4, reps: '6-8' },
            { name: 'Plate-Loaded Lat Pulldown Machine', sets: 4, reps: '6-8' },
            { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '8' },
            { name: 'Dual Adjustable Pulley Machine (Heavy Tricep Pushdown)', sets: 3, reps: '8' },
          ],
        },
        // Thu (3): Rest Day
        {
          title: 'Rest Day',
          customTarget: 'Caloric Surplus & Recovery',
          duration: '0 min',
          coach: '',
          location: 'Home / Recovery',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Nutrition & Muscle Synthesis', sets: 1, reps: 'Full Day' },
          ],
        },
        // Fri (4): Underweight Posterior & Leg Power
        {
          title: 'Lower Body / Leg Day',
          customTarget: 'Underweight Posterior & Leg Power',
          duration: '50 min',
          coach: 'Coach Ethan',
          location: 'Weights Area',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 4, reps: '6-8' },
            { name: 'Leg Extension / Leg Curl Machine (Hamstrings)', sets: 3, reps: '8' },
            { name: 'Hack Squat Machine', sets: 3, reps: '6-8' },
            { name: 'Seated Calf Raise Machine', sets: 3, reps: '10' },
          ],
        },
        // Sat (5): Underweight Upper Density & Arm Power
        {
          title: 'Upper Body',
          customTarget: 'Underweight Upper Density & Arm Power',
          duration: '45 min',
          coach: 'Coach Ryza',
          location: 'Gym Floor B',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Selectorized Chest Press Machine', sets: 3, reps: '6-8' },
            { name: 'Wide Grip Lat Pulldown', sets: 3, reps: '8' },
            { name: 'Preacher Curl Bench (EZ Bar Curls)', sets: 3, reps: '8' },
            { name: 'Dip / Leg Raise Station (Knee Tucks)', sets: 3, reps: '10' },
          ],
        },
        // Sun (6): Full Rest Day
        {
          title: 'Rest Day',
          customTarget: 'Full Growth Recovery',
          duration: '0 min',
          coach: '',
          location: 'Home',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Sleep & Full Muscular Growth', sets: 1, reps: '8 Hours' },
            { name: 'Hydrate', sets: 1, reps: '2-3L' },
          ],
        },
      ];
    }

    if (normalizedGoal === 'tone_endurance') {
      return [
        // Mon (0): Underweight Shoulder & Lat Width
        {
          title: 'Upper Body',
          customTarget: 'Underweight Shoulder & Lat Width',
          duration: '50 min',
          coach: 'Coach Marco',
          location: 'Gym Floor B',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Plate-Loaded Lat Pulldown Machine', sets: 4, reps: '8-10' },
            { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 4, reps: '10-12' },
            { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '10' },
            { name: 'Dual Adjustable Pulley Machine (Face Pulls)', sets: 3, reps: '12' },
          ],
        },
        // Tue (1): Underweight Leg & Glute Proportion
        {
          title: 'Lower Body / Leg Day',
          customTarget: 'Underweight Leg & Glute Proportion',
          duration: '50 min',
          coach: 'Coach Ethan',
          location: 'Weights Area',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '10' },
            { name: 'Hip Thrust Machine', sets: 3, reps: '10-12' },
            { name: 'Leg Extension Machine', sets: 3, reps: '10-12' },
            { name: 'Seated Calf Raise Machine', sets: 3, reps: '12' },
          ],
        },
        // Wed (2): Rest Day
        {
          title: 'Rest Day',
          customTarget: 'Nutrient Absorption & Rest',
          duration: '0 min',
          coach: '',
          location: 'Home / Recovery',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Hydrate & High Protein Nutrition', sets: 1, reps: 'Full Day' },
            { name: 'Light Walk', sets: 1, reps: '15 min' },
          ],
        },
        // Thu (3): Underweight Chest & Bicep Sculpt
        {
          title: 'Upper Body',
          customTarget: 'Underweight Chest & Bicep Sculpt',
          duration: '50 min',
          coach: 'Coach Marco',
          location: 'Gym Floor B',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Selectorized Chest Press Machine', sets: 3, reps: '10' },
            { name: 'Seated Bicep Curl / Preacher Curl Machine', sets: 3, reps: '10' },
            { name: 'Pec Fly / Rear Delt Machine', sets: 3, reps: '10-12' },
            { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '10-12' },
          ],
        },
        // Fri (4): Rest Day
        {
          title: 'Rest Day',
          customTarget: 'Muscle Growth & Recovery',
          duration: '0 min',
          coach: '',
          location: 'Home / Recovery',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Rest & Nutrient Absorption', sets: 1, reps: 'Full Day' },
          ],
        },
        // Sat (5): Underweight Symmetry & Frame Finisher
        {
          title: 'Full Body',
          customTarget: 'Underweight Symmetry & Frame Finisher',
          duration: '45 min',
          coach: 'Coach Ryza',
          location: 'Functional Zone',
          time: normTime,
          isRest: false,
          exercises: [
            { name: 'Lat Pulldown Machine', sets: 3, reps: '10' },
            { name: '45-Degree Leg Press Machine', sets: 3, reps: '10' },
            { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '12' },
            { name: 'Dip / Leg Raise Station (Knee Tucks)', sets: 3, reps: '12' },
          ],
        },
        // Sun (6): Full Rest Day
        {
          title: 'Rest Day',
          customTarget: 'Full Growth Recovery',
          duration: '0 min',
          coach: '',
          location: 'Home',
          time: normTime,
          isRest: true,
          exercises: [
            { name: 'Sleep & Full Muscular Growth', sets: 1, reps: '8 Hours' },
            { name: 'Hydrate', sets: 1, reps: '2-3L' },
          ],
        },
      ];
    }

    // Default for Underweight (muscle_gain): Lean Mass Building & Caloric Surplus
    return [
      // Mon (0): Underweight Upper Body Mass
      {
        title: 'Upper Body',
        customTarget: 'Underweight Mass Building (Chest & Back)',
        duration: '50 min',
        coach: 'Coach Ethan',
        location: 'Gym Floor B',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Plate-Loaded Incline Chest Press Machine', sets: 4, reps: '8-10' },
          { name: 'Plate-Loaded Lat Pulldown Machine', sets: 4, reps: '8-10' },
          { name: 'Selectorized Chest Press Machine', sets: 3, reps: '10' },
          { name: 'Pec Fly / Rear Delt Machine', sets: 3, reps: '10-12' },
          { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '10-12' },
        ],
      },
      // Tue (1): Underweight Lower Body Hypertrophy
      {
        title: 'Lower Body / Leg Day',
        customTarget: 'Underweight Leg & Quad Hypertrophy',
        duration: '50 min',
        coach: 'Coach Ethan',
        location: 'Weights Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Hack Squat Machine', sets: 4, reps: '8-10' },
          { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 4, reps: '8-10' },
          { name: 'Leg Extension Machine', sets: 3, reps: '10-12' },
          { name: 'Leg Extension / Leg Curl Machine (Hamstrings)', sets: 3, reps: '10-12' },
          { name: 'Seated Calf Raise Machine', sets: 3, reps: '12-15' },
        ],
      },
      // Wed (2): Growth & Caloric Surplus Recovery
      {
        title: 'Rest Day',
        customTarget: 'Underweight Caloric Surplus & Rest',
        duration: '0 min',
        coach: '',
        location: 'Home / Recovery',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Hydrate & High Protein Nutrition', sets: 1, reps: 'Full Day' },
          { name: 'Light Walk & Muscle Rest', sets: 1, reps: '15 min' },
        ],
      },
      // Thu (3): Underweight Back & Bicep Mass
      {
        title: 'Upper Body',
        customTarget: 'Underweight Back & Bicep Mass',
        duration: '50 min',
        coach: 'Coach Marco',
        location: 'Gym Floor B',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Seated Row Machine / Low Row Machine', sets: 4, reps: '8-10' },
          { name: 'Wide Grip Lat Pulldown', sets: 3, reps: '10' },
          { name: 'Preacher Curl Bench (EZ Bar Curls)', sets: 3, reps: '10' },
          { name: 'Seated Bicep Curl / Preacher Curl Machine', sets: 3, reps: '10' },
          { name: 'Multi-Function Cable Column (Face Pulls)', sets: 3, reps: '12' },
        ],
      },
      // Fri (4): Rest Day (Avoid burning excess calories)
      {
        title: 'Rest Day',
        customTarget: 'Underweight Muscle Recovery',
        duration: '0 min',
        coach: '',
        location: 'Home / Recovery',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Rest & Nutrient Absorption', sets: 1, reps: 'Full Day' },
          { name: 'Light Stretching', sets: 1, reps: '10 min' },
        ],
      },
      // Sat (5): Compound Growth Finisher
      {
        title: 'Full Body',
        customTarget: 'Underweight Compound Hypertrophy',
        duration: '45 min',
        coach: 'Coach Ryza',
        location: 'Functional Zone',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Selectorized Chest Press Machine', sets: 3, reps: '10' },
          { name: '45-Degree Leg Press Machine', sets: 3, reps: '10' },
          { name: 'Lat Pulldown Machine', sets: 3, reps: '10' },
          { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '12' },
          { name: 'Dip / Leg Raise Station (Knee Tucks)', sets: 3, reps: '12' },
        ],
      },
      // Sun (6): Full Rest Day
      {
        title: 'Rest Day',
        customTarget: 'Full Growth Recovery',
        duration: '0 min',
        coach: '',
        location: 'Home',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Sleep & Full Muscular Growth', sets: 1, reps: '8 Hours' },
          { name: 'Hydrate', sets: 1, reps: '2-3L' },
        ],
      },
    ];
  }

  // 4. NORMAL WEIGHT OR GOAL-SPECIFIC PLANS (18.5 <= BMI < 25)
  if (normalizedGoal === 'weight_loss') {
    return [
      // Mon (0): Full Body Metabolic Circuit
      {
        title: 'Full Body',
        customTarget: 'Metabolic Fat Burn Circuit',
        duration: '50 min',
        coach: 'Coach Ethan',
        location: 'Functional Zone & Cardio Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Functional Trainer Cable Crossover Machine', sets: 3, reps: '15' },
          { name: 'Kettlebells (Kettlebell Swings)', sets: 3, reps: '20' },
          { name: 'Selectorized Chest Press Machine', sets: 3, reps: '12-15' },
          { name: 'Lat Pulldown Machine', sets: 3, reps: '12-15' },
          { name: '45-Degree Leg Press Machine', sets: 3, reps: '15' },
          { name: 'Dip / Leg Raise Station (Knee Tucks)', sets: 3, reps: '15' },
        ],
      },
      // Tue (1): Cardio & Core Conditioning
      {
        title: 'Cardio & Core',
        customTarget: 'Treadmill + Core Burn',
        duration: '45 min',
        coach: 'Coach Ryza',
        location: 'Cardio Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Treadmill (Interval Incline Walk)', sets: 1, reps: '20 min' },
          { name: 'Dip / Leg Raise Station (Captain’s Chair Leg Raises)', sets: 3, reps: '15' },
          { name: 'Multi-Function Cable Column (Cable Crunches)', sets: 3, reps: '15-20' },
          { name: 'Functional Trainer Cable Crossover (Torso Twists)', sets: 3, reps: '15 each' },
        ],
      },
      // Wed (2): Rest Day
      {
        title: 'Rest Day',
        customTarget: 'Active Recovery & Hydrate',
        duration: '20 min',
        coach: '',
        location: 'Home / Recovery',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Light Walk', sets: 1, reps: '20 min' },
          { name: 'Hydrate & Electrolytes', sets: 1, reps: '2-3 Liters' },
          { name: 'Gentle Full-Body Stretching', sets: 1, reps: '10 min' },
        ],
      },
      // Thu (3): Lower Body & Glutes Fat Burn
      {
        title: 'Lower Body / Leg Day',
        customTarget: 'Quads & Glutes Calorie Burn',
        duration: '50 min',
        coach: 'Coach Ethan',
        location: 'Weights Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '15' },
          { name: 'Hip Thrust Machine', sets: 3, reps: '12-15' },
          { name: 'Hip Abductor / Adductor Machine', sets: 3, reps: '15-20' },
          { name: 'Leg Extension / Leg Curl Machine', sets: 3, reps: '15' },
          { name: 'Seated Calf Raise Machine', sets: 3, reps: '15-20' },
        ],
      },
      // Fri (4): Upper Body Sculpt & Conditioning
      {
        title: 'Upper Body',
        customTarget: 'Chest & Back Sculpt',
        duration: '45 min',
        coach: 'Coach Marco',
        location: 'Gym Floor B',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '12-15' },
          { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '12-15' },
          { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '15' },
          { name: 'Assisted Pull-Up / Dip Machine', sets: 3, reps: '12' },
          { name: 'Dual Adjustable Pulley Machine (Tricep Pushdown)', sets: 3, reps: '15' },
        ],
      },
      // Sat (5): High-Calorie Functional Finisher
      {
        title: 'Full Body',
        customTarget: 'Functional HIIT & Core',
        duration: '40 min',
        coach: 'Coach Ryza',
        location: 'Functional Zone',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Kettlebells (Goblet Squats & Cleans)', sets: 3, reps: '12-15' },
          { name: '45-Degree Hyperextension / Back Extension Bench', sets: 3, reps: '15' },
          { name: 'Functional Trainer Cable Crossover Machine', sets: 3, reps: '15' },
          { name: 'Treadmill (Cooldown Walk)', sets: 1, reps: '15 min' },
        ],
      },
      // Sun (6): Rest Day
      {
        title: 'Rest Day',
        customTarget: 'Full Rest & Recovery',
        duration: '0 min',
        coach: '',
        location: 'Home',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Rest & Muscle Recovery', sets: 1, reps: 'Full Day' },
          { name: 'Hydrate', sets: 1, reps: '2-3L' },
        ],
      },
    ];
  }

  if (normalizedGoal === 'strength') {
    return [
      // Mon (0): Heavy Squat & Lower Power
      {
        title: 'Lower Body / Leg Day',
        customTarget: 'Heavy Squat & Leg Power',
        duration: '60 min',
        coach: 'Coach Ethan',
        location: 'Weights Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Olympic Power Rack / Squat Rack with Pull-Up Bar', sets: 5, reps: '5' },
          { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 4, reps: '6-8' },
          { name: 'Hack Squat Machine', sets: 3, reps: '8' },
          { name: '45-Degree Hyperextension Bench (Weighted)', sets: 3, reps: '10' },
          { name: 'Seated Calf Raise Machine', sets: 3, reps: '12' },
        ],
      },
      // Tue (1): Rest / Neurological Recovery
      {
        title: 'Rest Day',
        customTarget: 'Nervous System Recovery',
        duration: '20 min',
        coach: '',
        location: 'Home',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Light Walk', sets: 1, reps: '20 min' },
          { name: 'Mobility & Stretching', sets: 1, reps: '15 min' },
        ],
      },
      // Wed (2): Heavy Bench & Push Power
      {
        title: 'Upper Body',
        customTarget: 'Heavy Bench Press & Push',
        duration: '60 min',
        coach: 'Coach Marco',
        location: 'Gym Floor B',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Olympic Power Rack (Flat Barbell Bench Press)', sets: 5, reps: '5' },
          { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '6-8' },
          { name: 'Shoulder Press Machine', sets: 3, reps: '6-8' },
          { name: 'Plate-Loaded Seated Dip Machine', sets: 3, reps: '8' },
          { name: 'Dual Adjustable Pulley (Heavy Tricep Pushdown)', sets: 3, reps: '8-10' },
        ],
      },
      // Thu (3): Rest Day
      {
        title: 'Rest Day',
        customTarget: 'Rest & Muscle Repair',
        duration: '0 min',
        coach: '',
        location: 'Home',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Hydrate & High Protein Nutrition', sets: 1, reps: 'Full Day' },
        ],
      },
      // Fri (4): Heavy Deadlift & Posterior Chain
      {
        title: 'Upper Body',
        customTarget: 'Heavy Deadlift & Back Power',
        duration: '60 min',
        coach: 'Coach Ethan',
        location: 'Weights Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Olympic Power Rack (Barbell Deadlift)', sets: 5, reps: '5' },
          { name: 'Plate-Loaded Lat Pulldown Machine', sets: 4, reps: '6-8' },
          { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '8' },
          { name: 'Preacher Curl Bench (EZ Bar Curls)', sets: 3, reps: '8' },
          { name: 'Multi-Function Cable Column (Face Pulls)', sets: 3, reps: '12' },
        ],
      },
      // Sat (5): Overhead Power & Auxiliary Racks
      {
        title: 'Full Body',
        customTarget: 'Overhead Press & Core Power',
        duration: '50 min',
        coach: 'Coach Marco',
        location: 'Weights Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Smith Machine Power Rack Combo (Overhead Press)', sets: 4, reps: '6' },
          { name: 'Assisted Pull-Up / Dip Machine', sets: 4, reps: '6-8' },
          { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '10' },
          { name: 'Dip / Leg Raise Station (Weighted Leg Raises)', sets: 3, reps: '12' },
        ],
      },
      // Sun (6): Rest Day
      {
        title: 'Rest Day',
        customTarget: 'Weekly Rest',
        duration: '0 min',
        coach: '',
        location: 'Home',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Sleep & Full Recovery', sets: 1, reps: '8 Hours' },
        ],
      },
    ];
  }

  if (normalizedGoal === 'tone_endurance') {
    return [
      // Mon (0): Full Body Sculpt Circuit
      {
        title: 'Full Body',
        customTarget: 'Full Body Sculpt & Tone',
        duration: '50 min',
        coach: 'Coach Ryza',
        location: 'Functional Zone',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Selectorized Chest Press Machine', sets: 3, reps: '15' },
          { name: 'Lat Pulldown Machine', sets: 3, reps: '15' },
          { name: 'Selectorized Squat Machine', sets: 3, reps: '15-20' },
          { name: 'Dual Adjustable Pulley (Cable Crossover) Machine', sets: 3, reps: '15' },
          { name: 'Kettlebells (Goblet Squats & Swings)', sets: 3, reps: '15' },
        ],
      },
      // Tue (1): Cardio, Core & Posture
      {
        title: 'Cardio & Core',
        customTarget: 'Core Endurance & Posture',
        duration: '45 min',
        coach: 'Coach Ryza',
        location: 'Cardio Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Treadmill (Steady-State Incline Cardio)', sets: 1, reps: '25 min' },
          { name: 'Dip / Leg Raise Station (Knee Tucks)', sets: 3, reps: '15' },
          { name: 'Multi-Function Cable Column (Woodchoppers)', sets: 3, reps: '15 each' },
          { name: '45-Degree Hyperextension / Back Extension Bench', sets: 3, reps: '15' },
        ],
      },
      // Wed (2): Rest Day
      {
        title: 'Rest Day',
        customTarget: 'Rest & Mobility',
        duration: '15 min',
        coach: '',
        location: 'Home',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Foam Rolling & Full Body Stretch', sets: 1, reps: '15 min' },
          { name: 'Hydrate', sets: 1, reps: '2-3L' },
        ],
      },
      // Thu (3): Lower Body Firm & Glutes
      {
        title: 'Lower Body / Leg Day',
        customTarget: 'Glutes, Hips & Thigh Toning',
        duration: '50 min',
        coach: 'Coach Ethan',
        location: 'Weights Area',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Hip Thrust Machine', sets: 3, reps: '15' },
          { name: 'Hip Abductor / Adductor Machine', sets: 3, reps: '15-20' },
          { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 3, reps: '15' },
          { name: 'Leg Extension / Leg Curl Machine', sets: 3, reps: '15' },
          { name: 'Seated Calf Raise Machine', sets: 3, reps: '20' },
        ],
      },
      // Fri (4): Upper Body Tone & Shoulders
      {
        title: 'Upper Body',
        customTarget: 'Upper Body Sculpt & Shoulders',
        duration: '45 min',
        coach: 'Coach Marco',
        location: 'Gym Floor B',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Plate-Loaded Incline Chest Press Machine', sets: 3, reps: '12-15' },
          { name: 'Seated Row Machine / Low Row Machine', sets: 3, reps: '15' },
          { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 3, reps: '15-20' },
          { name: 'Dual Adjustable Pulley (Tricep Pushdown & Facepulls)', sets: 3, reps: '15' },
          { name: 'Preacher Curl Bench with Dumbbell', sets: 3, reps: '15' },
        ],
      },
      // Sat (5): Functional Endurance
      {
        title: 'Full Body',
        customTarget: 'Functional Conditioning',
        duration: '40 min',
        coach: 'Coach Ryza',
        location: 'Functional Zone',
        time: normTime,
        isRest: false,
        exercises: [
          { name: 'Assisted Pull-Up / Dip Machine', sets: 3, reps: '12-15' },
          { name: 'Kettlebells (Lunges & Cleans)', sets: 3, reps: '12 each' },
          { name: 'Functional Trainer Cable Crossover Machine', sets: 3, reps: '15' },
          { name: 'Treadmill (Cooldown Walk)', sets: 1, reps: '15 min' },
        ],
      },
      // Sun (6): Rest Day
      {
        title: 'Rest Day',
        customTarget: 'Full Rest & Recovery',
        duration: '0 min',
        coach: '',
        location: 'Home',
        time: normTime,
        isRest: true,
        exercises: [
          { name: 'Rest & Recharge', sets: 1, reps: 'Full Day' },
        ],
      },
    ];
  }

  // Default: muscle_gain (Hypertrophy Push / Pull / Legs Split)
  return [
    // Mon (0): Push (Chest, Shoulders & Triceps)
    {
      title: 'Upper Body',
      customTarget: 'Chest & Tricep (Push)',
      duration: '60 min',
      coach: 'Coach Ethan',
      location: 'Gym Floor B',
      time: normTime,
      isRest: false,
      exercises: [
        { name: 'Plate-Loaded Incline Chest Press Machine', sets: 4, reps: '8-10' },
        { name: 'Selectorized Chest Press Machine', sets: 3, reps: '10-12' },
        { name: 'Pec Fly / Rear Delt Machine', sets: 3, reps: '12-15' },
        { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 4, reps: '12-15' },
        { name: 'Plate-Loaded Seated Dip Machine', sets: 3, reps: '10-12' },
        { name: 'Dual Adjustable Pulley Machine (Tricep Rope Pushdown)', sets: 3, reps: '12-15' },
      ],
    },
    // Tue (1): Pull (Back, Rear Delts & Biceps)
    {
      title: 'Upper Body',
      customTarget: 'Back & Bicep (Pull)',
      duration: '60 min',
      coach: 'Coach Marco',
      location: 'Gym Floor B',
      time: normTime,
      isRest: false,
      exercises: [
        { name: 'Plate-Loaded Lat Pulldown Machine', sets: 4, reps: '8-10' },
        { name: 'Seated Row Machine / Low Row Machine', sets: 4, reps: '10-12' },
        { name: 'Pec Fly / Rear Delt Machine (Rear Delt Fly)', sets: 3, reps: '12-15' },
        { name: 'Preacher Curl Bench (EZ Bar Curl)', sets: 3, reps: '10-12' },
        { name: 'Seated Bicep Curl / Preacher Curl Machine', sets: 3, reps: '12' },
        { name: 'Multi-Function Cable Column (Face Pulls)', sets: 3, reps: '15' },
      ],
    },
    // Wed (2): Rest & Growth
    {
      title: 'Rest Day',
      customTarget: 'Muscle Growth & Rest',
      duration: '0 min',
      coach: '',
      location: 'Home / Recovery',
      time: normTime,
      isRest: true,
      exercises: [
        { name: 'Hydrate & High Protein Nutrition', sets: 1, reps: 'Full Day' },
        { name: 'Light Walk', sets: 1, reps: '20 min' },
      ],
    },
    // Thu (3): Legs & Glutes Hypertrophy
    {
      title: 'Lower Body / Leg Day',
      customTarget: 'Quads & Glutes Hypertrophy',
      duration: '65 min',
      coach: 'Coach Ethan',
      location: 'Weights Area',
      time: normTime,
      isRest: false,
      exercises: [
        { name: 'Hack Squat Machine', sets: 4, reps: '8-10' },
        { name: 'Plate-Loaded 45-Degree Leg Press Machine', sets: 4, reps: '10-12' },
        { name: 'Leg Extension Machine', sets: 3, reps: '12-15' },
        { name: 'Leg Extension / Leg Curl Machine (Hamstring Curl)', sets: 3, reps: '10-12' },
        { name: 'Hip Thrust Machine', sets: 3, reps: '10-12' },
        { name: 'Seated Calf Raise Machine', sets: 4, reps: '15' },
      ],
    },
    // Fri (4): Upper Body Pump & ISO Chest
    {
      title: 'Upper Body',
      customTarget: 'ISO Chest & Delts Pump',
      duration: '55 min',
      coach: 'Coach Marco',
      location: 'Gym Floor B',
      time: normTime,
      isRest: false,
      exercises: [
        { name: 'Iso-Lateral Plate-Loaded Chest Press', sets: 3, reps: '10-12' },
        { name: 'Shoulder Press Machine', sets: 3, reps: '10-12' },
        { name: 'Lat Pulldown Machine (Neutral Grip)', sets: 3, reps: '10-12' },
        { name: 'Dual Adjustable Pulley (Cable Crossover) Machine', sets: 3, reps: '12-15' },
        { name: 'Dumbbell Incline Bicep Curl', sets: 3, reps: '12' },
      ],
    },
    // Sat (5): Arms, Shoulders & Core
    {
      title: 'Full Body',
      customTarget: 'Arms, Shoulders & Abs',
      duration: '50 min',
      coach: 'Coach Ryza',
      location: 'Functional Zone',
      time: normTime,
      isRest: false,
      exercises: [
        { name: 'Preacher Curl Bench', sets: 3, reps: '10-12' },
        { name: 'Plate-Loaded Seated Dip Machine', sets: 3, reps: '10-12' },
        { name: 'Pin-Selected Standing Lateral Raise Machine', sets: 4, reps: '12-15' },
        { name: 'Dip / Leg Raise Station (Leg Raises)', sets: 3, reps: '15' },
        { name: '45-Degree Hyperextension / Back Extension Bench', sets: 3, reps: '15' },
      ],
    },
    // Sun (6): Rest Day
    {
      title: 'Rest Day',
      customTarget: 'Full Recovery',
      duration: '0 min',
      coach: '',
      location: 'Home',
      time: normTime,
      isRest: true,
      exercises: [
        { name: 'Rest & Recharge', sets: 1, reps: 'Full Day' },
      ],
    },
  ];
}

// Default weekly sessions scheduled in the AFTERNOON (5:00 PM / 17:00)
// matching the most popular gym-going hours (index 0 = Mon … 6 = Sun)
export const defaultSessionsByDayIdx: Record<number, DefaultDaySession[]> = {
  0: [{
    timeVal: '5:00', timeAmpm: 'PM', title: 'Upper Body',
    duration: '60 min', location: 'Gym Floor B',
    coach: '', membersCount: 0, status: 'upcoming',
    customTarget: 'Chest & Tricep',
  }],
  1: [{
    timeVal: '5:00', timeAmpm: 'PM', title: 'Upper Body',
    duration: '60 min', location: 'Gym Floor B',
    coach: '', membersCount: 0, status: 'upcoming',
    customTarget: 'Back & Bicep',
  }],
  2: [],
  3: [{
    timeVal: '5:00', timeAmpm: 'PM', title: 'Lower Body / Leg Day',
    duration: '65 min', location: 'Weights Area',
    coach: '', membersCount: 0, status: 'upcoming',
    customTarget: 'Quads & Glutes',
  }],
  4: [{
    timeVal: '5:00', timeAmpm: 'PM', title: 'Upper Body',
    duration: '55 min', location: 'Gym Floor B',
    coach: '', membersCount: 0, status: 'upcoming',
    customTarget: 'Chest & Shoulder',
  }],
  5: [{
    timeVal: '4:30', timeAmpm: 'PM', title: 'Full Body',
    duration: '50 min', location: 'Functional Zone',
    coach: '', membersCount: 0, status: 'upcoming',
    customTarget: 'Arms, Shoulders & Abs',
  }],
  6: [],
};

/**
 * Returns exercises for a given workout type/target.
 * Priority: "WorkoutType|CustomTarget" → "WorkoutType" → []
 */
export function buildExercisesFromTemplate(title: string, customTarget?: string): WorkoutTemplateExercise[] {
  const target = customTarget?.trim();
  if (target) {
    const specificKey = `${title}|${target}`;
    if (exerciseDatabase[specificKey]) {
      return exerciseDatabase[specificKey].map(ex => ({ ...ex }));
    }
  }
  return (exerciseDatabase[title] ?? []).map(ex => ({ ...ex }));
}

// ── Workout type / target picker (shared) ───────────────────────────────
//
// Single source of truth for the "Workout Type → Specific Target →
// recommended exercises" picker used by BOTH the member-facing Schedule
// page's "Add Workout" modal AND the coach's "Propose Workout Plan" modal
// (coaching/chat/chat.page.ts). Previously this list + the suggested-target
// map lived only inside schedule.page.ts, so the two "add exercises" flows
// could silently drift apart (e.g. a coach could never propose a Rest Day
// target the member-side picker already offered). Keeping it here means
// both consumers read the exact same list.

export const workoutTypes: string[] = [
  'Upper Body',
  'Lower Body / Leg Day',
  'Cardio & Core',
  'Full Body',
  'Mobility & Stretch',
];

export const suggestedTargetsMap: Record<string, string[]> = {
  'Upper Body': [
    'Back & Bicep',
    'Chest & Tricep',
    'Shoulders',
    'Back & Rear Delt',
    'Chest & Shoulder',
    'Arms (Bi & Tri)',
  ],
  'Lower Body / Leg Day': [
    'Quads & Glutes',
    'Hamstrings & Glutes',
    'Calves & Quads',
    'Glutes Focus',
    'Full Legs',
  ],
  'Cardio & Core': [
    'HIIT',
    'Steady State',
    'Core & Abs',
    'Jump Rope HIIT',
    'Treadmill + Core',
  ],
  'Full Body': [
    'Push / Pull / Legs',
    'Compound Lifts',
    'Circuit Training',
    'Functional Strength',
  ],
  'Mobility & Stretch': [
    'Hip Flexors',
    'Upper Back',
    'Full Body Stretch',
    'Shoulder Mobility',
    'Spine & Core',
  ],
  'Rest Day': [
    'Light Walk',
    'Foam Rolling',
    'Active Recovery',
  ],
};

/** All suggested targets for a workout type, or [] if it has none (e.g. an unrecognized type). */
export function getSuggestedTargets(workoutType: string): string[] {
  return suggestedTargetsMap[workoutType] ?? [];
}

/** Placeholder copy for the free-text target input, seeded from the first couple of suggestions. */
export function getTargetPlaceholder(workoutType: string): string {
  const suggestions = suggestedTargetsMap[workoutType];
  if (suggestions?.length) {
    return `e.g. ${suggestions[0]}, ${suggestions[1] ?? ''}`.replace(/, $/, '');
  }
  return 'Enter your focus area...';
}
