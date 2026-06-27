'use strict'

const { Op } = require('sequelize')

const PLAN_NAMES = [
  'Beginner Strength Foundation',
  'Intermediate Hypertrophy',
  'Advanced Performance Program',
  'Beginner Athletic Fundamentals',
  'Intermediate Conditioning Block',
  'Powerlifting Prep - 12 Weeks',
  'Starter Fitness Plan',
  'Progressive Overload - Phase 1'
]

const EXERCISE_NAMES = [
  'Bench Press', 'Pull-up', 'Shoulder Press', 'Barbell Squat', 'Plank',
  'Deadlift', 'Hip Thrust', 'Lat Pulldown', 'Bicep Curl', 'Tricep Dip',
  'Power Clean', 'Box Jump', 'Kettlebell Swing', 'Battle Rope', 'Romanian Deadlift'
]

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── Resolve exercise IDs ────────────────────────────────────────────────────
    const [exRows] = await queryInterface.sequelize.query(
      `SELECT id, name FROM exercises WHERE name IN (${EXERCISE_NAMES.map(() => '?').join(',')})`,
      { replacements: EXERCISE_NAMES }
    )
    if (exRows.length !== EXERCISE_NAMES.length) throw new Error('Some exercises not found — run 011-seed-exercises first')
    // Build map keyed by the canonical seeder name (case-insensitive match against DB)
    const lowerToCanonical = {}
    EXERCISE_NAMES.forEach(n => { lowerToCanonical[n.toLowerCase()] = n })
    const ex = {}
    exRows.forEach(r => {
      const canonical = lowerToCanonical[r.name.toLowerCase()]
      if (canonical) ex[canonical] = r.id
    })

    // ── Resolve sessions keyed by "planName::sessionName" ─────────────────────
    const [sessionRows] = await queryInterface.sequelize.query(`
      SELECT ws.id AS sessionId, ws.name AS sessionName, wp.name AS planName
      FROM workout_sessions ws
      JOIN workout_plans wp ON wp.id = ws.workoutPlanId
      WHERE wp.name IN (${PLAN_NAMES.map(() => '?').join(',')})
    `, { replacements: PLAN_NAMES })

    const sk = {}
    sessionRows.forEach(r => { sk[`${r.planName}::${r.sessionName}`] = r.sessionId })

    function s(plan, session) {
      const id = sk[`${plan}::${session}`]
      if (!id) throw new Error(`Session not found: "${plan}" / "${session}"`)
      return id
    }

    const now = new Date()

    const rows = [
      // ── Beginner Strength Foundation (Sam — Daniel's exercises) ──────────────
      { workoutSessionId: s('Beginner Strength Foundation', 'Full Body A'), exerciseId: ex['Bench Press'],    sets: 3, repetitions: 10, durationSeconds: null, restSeconds: 60,  notes: null,                  displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Beginner Strength Foundation', 'Full Body A'), exerciseId: ex['Barbell Squat'],  sets: 3, repetitions: 10, durationSeconds: null, restSeconds: 90,  notes: null,                  displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Beginner Strength Foundation', 'Full Body A'), exerciseId: ex['Plank'],          sets: 3, repetitions: null, durationSeconds: 30, restSeconds: 45,  notes: 'Hold a flat position', displayOrder: 3, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Beginner Strength Foundation', 'Full Body B'), exerciseId: ex['Pull-up'],        sets: 3, repetitions: 6,  durationSeconds: null, restSeconds: 90,  notes: 'Assisted if needed',  displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Beginner Strength Foundation', 'Full Body B'), exerciseId: ex['Shoulder Press'], sets: 3, repetitions: 10, durationSeconds: null, restSeconds: 60,  notes: null,                  displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Beginner Strength Foundation', 'Full Body B'), exerciseId: ex['Barbell Squat'],  sets: 3, repetitions: 10, durationSeconds: null, restSeconds: 90,  notes: null,                  displayOrder: 3, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Beginner Strength Foundation', 'Full Body C'), exerciseId: ex['Bench Press'],    sets: 3, repetitions: 12, durationSeconds: null, restSeconds: 60,  notes: null,                  displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Beginner Strength Foundation', 'Full Body C'), exerciseId: ex['Pull-up'],        sets: 3, repetitions: 6,  durationSeconds: null, restSeconds: 90,  notes: null,                  displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Beginner Strength Foundation', 'Full Body C'), exerciseId: ex['Plank'],          sets: 3, repetitions: null, durationSeconds: 40, restSeconds: 45,  notes: null,                  displayOrder: 3, createdAt: now, updatedAt: now },

      // ── Intermediate Hypertrophy (Lisa — Daniel's exercises) ─────────────────
      { workoutSessionId: s('Intermediate Hypertrophy', 'Upper Body A'), exerciseId: ex['Bench Press'],    sets: 4, repetitions: 8,  durationSeconds: null, restSeconds: 90,  notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Hypertrophy', 'Upper Body A'), exerciseId: ex['Pull-up'],        sets: 4, repetitions: 8,  durationSeconds: null, restSeconds: 90,  notes: null, displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Hypertrophy', 'Upper Body A'), exerciseId: ex['Shoulder Press'], sets: 3, repetitions: 10, durationSeconds: null, restSeconds: 60,  notes: null, displayOrder: 3, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Hypertrophy', 'Lower Body A'), exerciseId: ex['Barbell Squat'],  sets: 4, repetitions: 8,  durationSeconds: null, restSeconds: 120, notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Hypertrophy', 'Upper Body B'), exerciseId: ex['Bench Press'],    sets: 4, repetitions: 10, durationSeconds: null, restSeconds: 90,  notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Hypertrophy', 'Upper Body B'), exerciseId: ex['Shoulder Press'], sets: 4, repetitions: 10, durationSeconds: null, restSeconds: 60,  notes: null, displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Hypertrophy', 'Upper Body B'), exerciseId: ex['Pull-up'],        sets: 3, repetitions: 10, durationSeconds: null, restSeconds: 90,  notes: null, displayOrder: 3, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Hypertrophy', 'Lower Body B'), exerciseId: ex['Barbell Squat'],  sets: 4, repetitions: 10, durationSeconds: null, restSeconds: 120, notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Hypertrophy', 'Lower Body B'), exerciseId: ex['Plank'],          sets: 3, repetitions: null, durationSeconds: 60, restSeconds: 45,  notes: null, displayOrder: 2, createdAt: now, updatedAt: now },

      // ── Advanced Performance Program (Tom — Rachel's exercises) ───────────────
      { workoutSessionId: s('Advanced Performance Program', 'Push Day'),     exerciseId: ex['Lat Pulldown'], sets: 4, repetitions: 8,  durationSeconds: null, restSeconds: 90,  notes: null,                    displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Advanced Performance Program', 'Push Day'),     exerciseId: ex['Tricep Dip'],   sets: 4, repetitions: 10, durationSeconds: null, restSeconds: 60,  notes: null,                    displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Advanced Performance Program', 'Push Day'),     exerciseId: ex['Bicep Curl'],   sets: 3, repetitions: 12, durationSeconds: null, restSeconds: 60,  notes: null,                    displayOrder: 3, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Advanced Performance Program', 'Pull Day'),     exerciseId: ex['Deadlift'],     sets: 4, repetitions: 5,  durationSeconds: null, restSeconds: 180, notes: 'Heavy — focus on form', displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Advanced Performance Program', 'Pull Day'),     exerciseId: ex['Lat Pulldown'], sets: 4, repetitions: 10, durationSeconds: null, restSeconds: 90,  notes: null,                    displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Advanced Performance Program', 'Pull Day'),     exerciseId: ex['Bicep Curl'],   sets: 3, repetitions: 12, durationSeconds: null, restSeconds: 60,  notes: null,                    displayOrder: 3, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Advanced Performance Program', 'Leg Day'),      exerciseId: ex['Hip Thrust'],   sets: 4, repetitions: 10, durationSeconds: null, restSeconds: 90,  notes: null,                    displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Advanced Performance Program', 'Leg Day'),      exerciseId: ex['Deadlift'],     sets: 3, repetitions: 8,  durationSeconds: null, restSeconds: 120, notes: null,                    displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Advanced Performance Program', 'Upper Power'),  exerciseId: ex['Tricep Dip'],   sets: 5, repetitions: 8,  durationSeconds: null, restSeconds: 90,  notes: null,                    displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Advanced Performance Program', 'Upper Power'),  exerciseId: ex['Lat Pulldown'], sets: 5, repetitions: 8,  durationSeconds: null, restSeconds: 90,  notes: null,                    displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Advanced Performance Program', 'Conditioning'), exerciseId: ex['Hip Thrust'],   sets: 3, repetitions: 15, durationSeconds: null, restSeconds: 60,  notes: null,                    displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Advanced Performance Program', 'Conditioning'), exerciseId: ex['Deadlift'],     sets: 3, repetitions: 8,  durationSeconds: null, restSeconds: 120, notes: null,                    displayOrder: 2, createdAt: now, updatedAt: now },

      // ── Beginner Athletic Fundamentals (Emma — Marcus's exercises) ────────────
      { workoutSessionId: s('Beginner Athletic Fundamentals', 'Movement Basics A'), exerciseId: ex['Kettlebell Swing'],  sets: 3, repetitions: 12, durationSeconds: null, restSeconds: 60,  notes: null,                   displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Beginner Athletic Fundamentals', 'Movement Basics A'), exerciseId: ex['Romanian Deadlift'], sets: 3, repetitions: 10, durationSeconds: null, restSeconds: 90,  notes: 'Focus on hip hinge',   displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Beginner Athletic Fundamentals', 'Movement Basics B'), exerciseId: ex['Box Jump'],          sets: 3, repetitions: 8,  durationSeconds: null, restSeconds: 90,  notes: 'Low box, step down',   displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Beginner Athletic Fundamentals', 'Movement Basics B'), exerciseId: ex['Kettlebell Swing'],  sets: 3, repetitions: 12, durationSeconds: null, restSeconds: 60,  notes: null,                   displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Beginner Athletic Fundamentals', 'Conditioning'),      exerciseId: ex['Battle Rope'],       sets: 3, repetitions: null, durationSeconds: 30, restSeconds: 60,  notes: '30s on, 60s off',      displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Beginner Athletic Fundamentals', 'Conditioning'),      exerciseId: ex['Box Jump'],          sets: 3, repetitions: 8,  durationSeconds: null, restSeconds: 90,  notes: null,                   displayOrder: 2, createdAt: now, updatedAt: now },

      // ── Intermediate Conditioning Block (James — Daniel's exercises) ──────────
      { workoutSessionId: s('Intermediate Conditioning Block', 'Strength A'),     exerciseId: ex['Bench Press'],    sets: 4, repetitions: 6,  durationSeconds: null, restSeconds: 120, notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Conditioning Block', 'Strength A'),     exerciseId: ex['Pull-up'],        sets: 4, repetitions: 6,  durationSeconds: null, restSeconds: 120, notes: null, displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Conditioning Block', 'Conditioning A'), exerciseId: ex['Barbell Squat'],  sets: 4, repetitions: 10, durationSeconds: null, restSeconds: 90,  notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Conditioning Block', 'Conditioning A'), exerciseId: ex['Plank'],          sets: 3, repetitions: null, durationSeconds: 45, restSeconds: 45,  notes: null, displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Conditioning Block', 'Strength B'),     exerciseId: ex['Shoulder Press'], sets: 4, repetitions: 8,  durationSeconds: null, restSeconds: 90,  notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Conditioning Block', 'Strength B'),     exerciseId: ex['Pull-up'],        sets: 4, repetitions: 8,  durationSeconds: null, restSeconds: 90,  notes: null, displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Conditioning Block', 'Conditioning B'), exerciseId: ex['Barbell Squat'],  sets: 4, repetitions: 12, durationSeconds: null, restSeconds: 60,  notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Intermediate Conditioning Block', 'Conditioning B'), exerciseId: ex['Plank'],          sets: 3, repetitions: null, durationSeconds: 60, restSeconds: 45,  notes: null, displayOrder: 2, createdAt: now, updatedAt: now },

      // ── Powerlifting Prep - 12 Weeks (Sofia — Marcus's exercises) ────────────
      { workoutSessionId: s('Powerlifting Prep - 12 Weeks', 'Squat Day'),       exerciseId: ex['Power Clean'],       sets: 4, repetitions: 3,  durationSeconds: null, restSeconds: 180, notes: 'Bar speed focus',           displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Powerlifting Prep - 12 Weeks', 'Squat Day'),       exerciseId: ex['Romanian Deadlift'], sets: 4, repetitions: 6,  durationSeconds: null, restSeconds: 120, notes: null,                        displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Powerlifting Prep - 12 Weeks', 'Bench Day'),       exerciseId: ex['Kettlebell Swing'],  sets: 4, repetitions: 10, durationSeconds: null, restSeconds: 90,  notes: null,                        displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Powerlifting Prep - 12 Weeks', 'Bench Day'),       exerciseId: ex['Battle Rope'],       sets: 3, repetitions: null, durationSeconds: 40, restSeconds: 60, notes: null,                        displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Powerlifting Prep - 12 Weeks', 'Deadlift Day'),    exerciseId: ex['Romanian Deadlift'], sets: 5, repetitions: 5,  durationSeconds: null, restSeconds: 180, notes: 'Heavier than Squat Day',    displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Powerlifting Prep - 12 Weeks', 'Deadlift Day'),    exerciseId: ex['Power Clean'],       sets: 3, repetitions: 3,  durationSeconds: null, restSeconds: 180, notes: null,                        displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Powerlifting Prep - 12 Weeks', 'Accessory Work'),  exerciseId: ex['Box Jump'],          sets: 4, repetitions: 5,  durationSeconds: null, restSeconds: 120, notes: null,                        displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Powerlifting Prep - 12 Weeks', 'Accessory Work'),  exerciseId: ex['Kettlebell Swing'],  sets: 3, repetitions: 15, durationSeconds: null, restSeconds: 60,  notes: null,                        displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Powerlifting Prep - 12 Weeks', 'Active Recovery'), exerciseId: ex['Battle Rope'],       sets: 3, repetitions: null, durationSeconds: 30, restSeconds: 90, notes: 'Light effort, keep HR low', displayOrder: 1, createdAt: now, updatedAt: now },

      // ── Starter Fitness Plan (Liam — Rachel's exercises) ──────────────────────
      { workoutSessionId: s('Starter Fitness Plan', 'Session A'), exerciseId: ex['Deadlift'],   sets: 3, repetitions: 8,  durationSeconds: null, restSeconds: 90, notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Starter Fitness Plan', 'Session A'), exerciseId: ex['Hip Thrust'], sets: 3, repetitions: 10, durationSeconds: null, restSeconds: 60, notes: null, displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Starter Fitness Plan', 'Session B'), exerciseId: ex['Lat Pulldown'], sets: 3, repetitions: 10, durationSeconds: null, restSeconds: 60, notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Starter Fitness Plan', 'Session B'), exerciseId: ex['Bicep Curl'],   sets: 3, repetitions: 12, durationSeconds: null, restSeconds: 45, notes: null, displayOrder: 2, createdAt: now, updatedAt: now },

      // ── Progressive Overload - Phase 1 (Noah — Rachel's exercises) ────────────
      { workoutSessionId: s('Progressive Overload - Phase 1', 'Upper Strength A'), exerciseId: ex['Lat Pulldown'], sets: 4, repetitions: 8,  durationSeconds: null, restSeconds: 90,  notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Progressive Overload - Phase 1', 'Upper Strength A'), exerciseId: ex['Tricep Dip'],   sets: 4, repetitions: 10, durationSeconds: null, restSeconds: 60,  notes: null, displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Progressive Overload - Phase 1', 'Upper Strength A'), exerciseId: ex['Bicep Curl'],   sets: 3, repetitions: 12, durationSeconds: null, restSeconds: 45,  notes: null, displayOrder: 3, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Progressive Overload - Phase 1', 'Lower Strength A'), exerciseId: ex['Deadlift'],     sets: 4, repetitions: 6,  durationSeconds: null, restSeconds: 120, notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Progressive Overload - Phase 1', 'Lower Strength A'), exerciseId: ex['Hip Thrust'],   sets: 4, repetitions: 10, durationSeconds: null, restSeconds: 90,  notes: null, displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Progressive Overload - Phase 1', 'Upper Strength B'), exerciseId: ex['Lat Pulldown'], sets: 4, repetitions: 10, durationSeconds: null, restSeconds: 90,  notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Progressive Overload - Phase 1', 'Upper Strength B'), exerciseId: ex['Bicep Curl'],   sets: 3, repetitions: 12, durationSeconds: null, restSeconds: 45,  notes: null, displayOrder: 2, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Progressive Overload - Phase 1', 'Lower Strength B'), exerciseId: ex['Hip Thrust'],   sets: 4, repetitions: 12, durationSeconds: null, restSeconds: 90,  notes: null, displayOrder: 1, createdAt: now, updatedAt: now },
      { workoutSessionId: s('Progressive Overload - Phase 1', 'Lower Strength B'), exerciseId: ex['Deadlift'],     sets: 3, repetitions: 8,  durationSeconds: null, restSeconds: 120, notes: null, displayOrder: 2, createdAt: now, updatedAt: now }
    ]

    await queryInterface.bulkInsert('workout_session_exercises', rows)
  },

  async down(queryInterface, Sequelize) {
    const [planRows] = await queryInterface.sequelize.query(
      `SELECT id FROM workout_plans WHERE name IN (${PLAN_NAMES.map(() => '?').join(',')})`,
      { replacements: PLAN_NAMES }
    )
    if (planRows.length) {
      const [sessionRows] = await queryInterface.sequelize.query(
        `SELECT id FROM workout_sessions WHERE workoutPlanId IN (${planRows.map(() => '?').join(',')})`,
        { replacements: planRows.map(r => r.id) }
      )
      if (sessionRows.length) {
        await queryInterface.bulkDelete('workout_session_exercises', {
          workoutSessionId: { [Op.in]: sessionRows.map(r => r.id) }
        })
      }
    }
  }
}
