'use strict'

const { Op } = require('sequelize')

// Six Monday week-starts going back from 2026-06-23
const WEEKS = [
  '2026-06-23',
  '2026-06-16',
  '2026-06-09',
  '2026-06-02',
  '2026-05-26',
  '2026-05-19'
]

const DAY_OFFSET = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6
}

// Returns a UTC datetime for a completed session within the given week
function completedAt(weekStart, scheduledDay) {
  const offset = DAY_OFFSET[scheduledDay] ?? 0
  const [y, m, d] = weekStart.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + offset, 9, 30, 0))
}

// Completion patterns [weekIndex 0=most-recent .. 5=oldest][sessionIndex]
// true = completed, false = logged but not completed
const COMPLETION = {
  // Sam — 3 sessions — ~80% avg
  'Beginner Strength Foundation': [
    [true,  true,  true ],   // week 0
    [true,  false, true ],   // week 1
    [true,  true,  true ],   // week 2
    [false, true,  true ],   // week 3
    [true,  true,  true ],   // week 4
    [true,  false, false]    // week 5
  ],
  // Lisa — 4 sessions — ~85% avg
  'Intermediate Hypertrophy': [
    [true,  true,  true,  true ],  // week 0
    [true,  true,  false, true ],  // week 1
    [true,  true,  true,  true ],  // week 2
    [true,  false, true,  true ],  // week 3
    [true,  true,  true,  true ],  // week 4
    [false, true,  true,  false]   // week 5
  ],
  // Tom — 5 sessions — ~90% avg
  'Advanced Performance Program': [
    [true,  true,  true,  true,  true ],  // week 0
    [true,  true,  true,  false, true ],  // week 1
    [true,  true,  true,  true,  true ],  // week 2
    [true,  true,  false, true,  true ],  // week 3
    [true,  true,  true,  true,  true ],  // week 4
    [true,  false, true,  true,  true ]   // week 5
  ],
  // Emma — 3 sessions — ~67% avg (beginner, knee concern)
  'Beginner Athletic Fundamentals': [
    [true,  true,  false],   // week 0
    [true,  false, true ],   // week 1
    [false, true,  true ],   // week 2
    [true,  true,  false],   // week 3
    [false, true,  false],   // week 4
    [true,  false, true ]    // week 5
  ],
  // James — 4 sessions — ~75% avg
  'Intermediate Conditioning Block': [
    [true,  true,  false, true ],  // week 0
    [true,  false, true,  true ],  // week 1
    [true,  true,  true,  false],  // week 2
    [false, true,  true,  true ],  // week 3
    [true,  true,  false, true ],  // week 4
    [true,  false, true,  false]   // week 5
  ],
  // Sofia — 5 sessions — ~95% avg (competition prep)
  'Powerlifting Prep - 12 Weeks': [
    [true,  true,  true,  true,  true ],  // week 0
    [true,  true,  true,  true,  true ],  // week 1
    [true,  true,  true,  true,  false],  // week 2
    [true,  true,  true,  true,  true ],  // week 3
    [true,  true,  true,  true,  true ],  // week 4
    [true,  true,  true,  false, true ]   // week 5
  ],
  // Liam — archived plan, 2 sessions, only weeks 0-2 (plan ran 2026-06-02 to 2026-06-16)
  'Starter Fitness Plan': [
    null,                  // week 0 (2026-06-23) — plan ended
    null,                  // week 1 (2026-06-16) — last day = end date
    [true,  false],        // week 2 (2026-06-09)
    [false, true ],        // week 3 (2026-06-02) — plan started
    null,                  // week 4 — before plan start
    null                   // week 5 — before plan start
  ],
  // Noah — 4 sessions, only weeks 0-3 (plan started 2026-06-02)
  'Progressive Overload - Phase 1': [
    [true,  true,  true,  true ],  // week 0
    [true,  true,  false, true ],  // week 1
    [true,  false, true,  true ],  // week 2
    [false, true,  true,  true ],  // week 3 (2026-06-02 — start)
    null,                          // week 4 — before plan start
    null                           // week 5 — before plan start
  ]
}

// Feedback notes attached to specific log entries (plan, weekIndex, sessionIndex)
const NOTES = {
  'Beginner Strength Foundation': {
    '0:0': 'Felt strong today. Added 5 kg to the squat.',
    '2:2': 'Plank holds getting easier. Core is improving.',
    '5:0': 'Missed Wednesday and Friday — had a work deadline.'
  },
  'Intermediate Hypertrophy': {
    '0:1': 'Pull-ups felt smooth, managed 9 reps on last set.',
    '3:1': 'Skipped Tuesday — felt overtrained.',
    '4:2': 'Shoulder press PB today, very happy.'
  },
  'Advanced Performance Program': {
    '0:0': 'Deadlift session went great. Hit a new 5-rep PR.',
    '1:3': 'Upper power felt heavy today, took longer rest.',
    '5:1': 'Felt some tightness in lower back on pull day — stopped early.'
  },
  'Beginner Athletic Fundamentals': {
    '0:1': 'Knee felt fine during movement basics, no pain.',
    '2:0': 'Missed this one — knee flared up slightly.',
    '4:0': 'Resting the knee this week on advice of physio.'
  },
  'Intermediate Conditioning Block': {
    '0:2': 'Skipped Thursday — travelling for work.',
    '1:1': 'Conditioning felt tough, cardio needs work.',
    '3:0': 'Missed Monday — had an early flight.'
  },
  'Powerlifting Prep - 12 Weeks': {
    '0:0': 'Squat day went perfectly. On track for competition.',
    '2:4': 'Skipped recovery — felt good enough to rest at home.',
    '5:3': 'Accessory work felt a bit rushed today.'
  },
  'Starter Fitness Plan': {
    '2:0': 'Good first session back after a week off.',
    '3:1': 'Feeling unmotivated due to upcoming trip.'
  },
  'Progressive Overload - Phase 1': {
    '0:0': 'Upper session felt solid. Progressed lat pulldown by 5 kg.',
    '1:2': 'Missed Thursday — stayed late at the office.',
    '3:0': 'First week on the plan. Felt manageable.'
  }
}

const PLAN_NAMES = Object.keys(COMPLETION)

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── Resolve plans ──────────────────────────────────────────────────────────
    const [planRows] = await queryInterface.sequelize.query(
      `SELECT id, name FROM workout_plans WHERE name IN (${PLAN_NAMES.map(() => '?').join(',')})`,
      { replacements: PLAN_NAMES }
    )
    const planByName = {}
    planRows.forEach(r => { planByName[r.name] = r.id })

    // ── Resolve sessions per plan ──────────────────────────────────────────────
    const planIds = planRows.map(r => r.id)
    const [sessionRows] = await queryInterface.sequelize.query(
      `SELECT ws.id, ws.scheduledDay, ws.displayOrder, wp.name AS planName
       FROM workout_sessions ws
       JOIN workout_plans wp ON wp.id = ws.workoutPlanId
       WHERE ws.workoutPlanId IN (${planIds.map(() => '?').join(',')})
       ORDER BY ws.workoutPlanId, ws.displayOrder`,
      { replacements: planIds }
    )
    // Group sessions by plan name, ordered by displayOrder
    const sessionsByPlan = {}
    for (const row of sessionRows) {
      if (!sessionsByPlan[row.planName]) sessionsByPlan[row.planName] = []
      sessionsByPlan[row.planName].push({ id: row.id, scheduledDay: row.scheduledDay })
    }

    // ── Resolve trainee IDs per plan ───────────────────────────────────────────
    const [traineeRows] = await queryInterface.sequelize.query(
      `SELECT t.id AS traineeId, wp.name AS planName
       FROM trainees t
       JOIN workout_plans wp ON wp.traineeId = t.id
       WHERE wp.name IN (${PLAN_NAMES.map(() => '?').join(',')})`,
      { replacements: PLAN_NAMES }
    )
    const traineeByPlan = {}
    traineeRows.forEach(r => { traineeByPlan[r.planName] = r.traineeId })

    const now = new Date()
    const logs = []

    for (const [planName, weekMatrix] of Object.entries(COMPLETION)) {
      const planId   = planByName[planName]
      const traineeId = traineeByPlan[planName]
      const sessions  = sessionsByPlan[planName] || []
      const planNotes = NOTES[planName] || {}

      if (!planId || !traineeId) continue

      for (let w = 0; w < WEEKS.length; w++) {
        const weekRow = weekMatrix[w]
        if (!weekRow) continue   // null = week outside plan's active range

        for (let si = 0; si < sessions.length && si < weekRow.length; si++) {
          const session    = sessions[si]
          const completed  = weekRow[si]
          const noteKey    = `${w}:${si}`
          const noteText   = planNotes[noteKey] || null

          logs.push({
            traineeId,
            workoutPlanId:    planId,
            workoutSessionId: session.id,
            weekStartDate:    WEEKS[w],
            isCompleted:      completed,
            completedAt:      completed ? completedAt(WEEKS[w], session.scheduledDay) : null,
            notes:            noteText,
            createdAt:        now,
            updatedAt:        now
          })
        }
      }
    }

    await queryInterface.bulkInsert('weekly_workout_logs', logs)
  },

  async down(queryInterface, Sequelize) {
    const [planRows] = await queryInterface.sequelize.query(
      `SELECT id FROM workout_plans WHERE name IN (${PLAN_NAMES.map(() => '?').join(',')})`,
      { replacements: PLAN_NAMES }
    )
    if (planRows.length) {
      await queryInterface.bulkDelete('weekly_workout_logs', {
        workoutPlanId: { [Op.in]: planRows.map(r => r.id) }
      })
    }
  }
}
