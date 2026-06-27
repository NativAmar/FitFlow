'use strict'

const { Op } = require('sequelize')

const EXERCISE_NAMES = [
  'Bench Press', 'Pull-up', 'Shoulder Press', 'Barbell Squat', 'Plank',
  'Deadlift', 'Hip Thrust', 'Lat Pulldown', 'Bicep Curl', 'Tricep Dip',
  'Power Clean', 'Box Jump', 'Kettlebell Swing', 'Battle Rope', 'Romanian Deadlift'
]

module.exports = {
  async up(queryInterface, Sequelize) {
    const [trainerRows] = await queryInterface.sequelize.query(
      "SELECT t.id AS trainerId, u.email FROM trainers t JOIN users u ON u.id = t.userId WHERE u.email IN ('trainer@fitflow.com','trainer2@fitflow.com','trainer3@fitflow.com')"
    )
    if (trainerRows.length !== 3) throw new Error('Trainer profiles not found')
    const tr = {}
    trainerRows.forEach(r => { tr[r.email] = r.trainerId })

    const mgNames = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Full Body', 'Cardio']
    const [mgRows] = await queryInterface.sequelize.query(
      `SELECT id, name FROM muscle_groups WHERE name IN (${mgNames.map(() => '?').join(',')})`,
      { replacements: mgNames }
    )
    if (mgRows.length !== mgNames.length) throw new Error('Muscle groups not found — run muscle-groups seeder first')
    const mg = {}
    mgRows.forEach(r => { mg[r.name] = r.id })

    const now = new Date()
    const d = tr['trainer@fitflow.com']
    const r = tr['trainer2@fitflow.com']
    const m = tr['trainer3@fitflow.com']

    await queryInterface.bulkInsert('exercises', [
      // Daniel Cohen (trainer@fitflow.com)
      { trainerId: d, muscleGroupId: mg['Chest'],     name: 'Bench Press',       description: 'Flat barbell bench press targeting the pectoral muscles.',                      createdAt: now, updatedAt: now },
      { trainerId: d, muscleGroupId: mg['Back'],      name: 'Pull-up',            description: 'Bodyweight pulling movement for the upper back and biceps.',                    createdAt: now, updatedAt: now },
      { trainerId: d, muscleGroupId: mg['Shoulders'], name: 'Shoulder Press',     description: 'Overhead dumbbell press for shoulder development.',                             createdAt: now, updatedAt: now },
      { trainerId: d, muscleGroupId: mg['Legs'],      name: 'Barbell Squat',      description: 'Compound lower-body movement with a barbell.',                                  createdAt: now, updatedAt: now },
      { trainerId: d, muscleGroupId: mg['Core'],      name: 'Plank',              description: 'Isometric core hold to build stability and endurance.',                         createdAt: now, updatedAt: now },
      // Rachel Turner (trainer2@fitflow.com)
      { trainerId: r, muscleGroupId: mg['Back'],      name: 'Deadlift',           description: 'Conventional barbell deadlift for posterior chain strength.',                   createdAt: now, updatedAt: now },
      { trainerId: r, muscleGroupId: mg['Legs'],      name: 'Hip Thrust',         description: 'Barbell hip thrust for glute activation and strength.',                         createdAt: now, updatedAt: now },
      { trainerId: r, muscleGroupId: mg['Back'],      name: 'Lat Pulldown',       description: 'Cable pulldown targeting the latissimus dorsi.',                                createdAt: now, updatedAt: now },
      { trainerId: r, muscleGroupId: mg['Biceps'],    name: 'Bicep Curl',         description: 'Dumbbell curl for biceps isolation.',                                           createdAt: now, updatedAt: now },
      { trainerId: r, muscleGroupId: mg['Triceps'],   name: 'Tricep Dip',         description: 'Parallel bar dip emphasising the triceps.',                                     createdAt: now, updatedAt: now },
      // Marcus Johnson (trainer3@fitflow.com)
      { trainerId: m, muscleGroupId: mg['Full Body'], name: 'Power Clean',        description: 'Olympic lift from floor to shoulders for explosive power.',                     createdAt: now, updatedAt: now },
      { trainerId: m, muscleGroupId: mg['Legs'],      name: 'Box Jump',           description: 'Explosive plyometric jump onto a raised platform.',                             createdAt: now, updatedAt: now },
      { trainerId: m, muscleGroupId: mg['Full Body'], name: 'Kettlebell Swing',   description: 'Hip-driven swing with a kettlebell for power and conditioning.',                createdAt: now, updatedAt: now },
      { trainerId: m, muscleGroupId: mg['Cardio'],    name: 'Battle Rope',        description: 'Alternating rope waves for cardiovascular conditioning.',                        createdAt: now, updatedAt: now },
      { trainerId: m, muscleGroupId: mg['Legs'],      name: 'Romanian Deadlift',  description: 'Hip-hinge movement targeting the hamstrings and glutes.',                       createdAt: now, updatedAt: now }
    ], { ignoreDuplicates: true })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('exercises', {
      name: { [Op.in]: EXERCISE_NAMES }
    })
  }
}
