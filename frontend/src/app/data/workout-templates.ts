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

  // ── Rest Day ───────────────────────────────────────────
  'Rest Day': [
    { name: 'Light Walk',             sets: 1, reps: '20 min' },
    { name: 'Foam Rolling',           sets: 1, reps: '10 min' },
    { name: 'Hydrate',                sets: 1, reps: '2-3L'   },
  ],
};

// Default weekly sessions (index 0 = Mon … 6 = Sun)
export const defaultSessionsByDayIdx: Record<number, DefaultDaySession[]> = {
  0: [{
    timeVal: '7:00', timeAmpm: 'AM', title: 'Upper Body',
    duration: '60 min', location: 'Gym Floor B',
    coach: 'Coach Ethan', membersCount: 4, status: 'upcoming',
    customTarget: 'Back & Bicep',
  }],
  1: [{
    timeVal: '6:30', timeAmpm: 'AM', title: 'Cardio & Core',
    duration: '45 min', location: 'Cardio Area',
    coach: 'Coach Ryza', membersCount: 5, status: 'upcoming',
    customTarget: 'Core & Abs',
  }],
  2: [],
  3: [
    {
      timeVal: '6:00', timeAmpm: 'AM', title: 'Upper Body',
      duration: '60 min', location: 'Gym Floor B',
      coach: 'Coach Ethan', membersCount: 4, status: 'upcoming',
      customTarget: 'Chest & Tricep',
    },
    {
      timeVal: '8:30', timeAmpm: 'AM', title: 'Cardio & Core',
      duration: '45 min', location: 'Cardio Area',
      coach: 'Coach Ryza', membersCount: 7, status: 'optional',
    },
    {
      timeVal: '5:00', timeAmpm: 'PM', title: 'Lower Body / Leg Day',
      duration: '75 min', location: 'Weights Area',
      coach: '', membersCount: 0, status: 'upcoming',
      customTarget: 'Quads & Glutes',
    },
  ],
  4: [{
    timeVal: '7:30', timeAmpm: 'AM', title: 'Full Body',
    duration: '60 min', location: 'Functional Zone',
    coach: 'Coach Marco', membersCount: 3, status: 'upcoming',
    customTarget: 'Compound Lifts',
  }],
  5: [
    {
      timeVal: '9:00', timeAmpm: 'AM', title: 'Lower Body / Leg Day',
      duration: '75 min', location: 'Weights Area',
      coach: 'Coach Ethan', membersCount: 6, status: 'upcoming',
      customTarget: 'Hamstrings & Glutes',
    },
    {
      timeVal: '11:00', timeAmpm: 'AM', title: 'Mobility & Stretch',
      duration: '30 min', location: 'Gym Floor B',
      coach: '', membersCount: 0, status: 'optional',
      customTarget: 'Upper Back',
    },
  ],
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
