'use strict'

const { Op } = require('sequelize')

// Items keyed by "planName::mealName"
const MEAL_ITEMS = {
  // ── Bulking Basics ─────────────────────────────────────────────────────────
  'Bulking Basics::Morning Breakfast': [
    { foodName: 'Rolled oats',       quantity: 100,  unit: 'g',    notes: null,                             displayOrder: 1 },
    { foodName: 'Whole eggs',        quantity: 3,    unit: 'pcs',  notes: 'Scrambled or boiled',            displayOrder: 2 },
    { foodName: 'Whole milk',        quantity: 250,  unit: 'ml',   notes: null,                             displayOrder: 3 }
  ],
  'Bulking Basics::Pre-Workout Fuel': [
    { foodName: 'Banana',            quantity: 1,    unit: 'pcs',  notes: 'Large banana preferred',         displayOrder: 1 },
    { foodName: 'Peanut butter',     quantity: 30,   unit: 'g',    notes: null,                             displayOrder: 2 },
    { foodName: 'Rice cakes',        quantity: 2,    unit: 'pcs',  notes: null,                             displayOrder: 3 }
  ],
  'Bulking Basics::Post-Training Lunch': [
    { foodName: 'Chicken breast',    quantity: 200,  unit: 'g',    notes: 'Grilled or baked',               displayOrder: 1 },
    { foodName: 'White rice',        quantity: 150,  unit: 'g',    notes: 'Cooked weight',                  displayOrder: 2 },
    { foodName: 'Broccoli',          quantity: 100,  unit: 'g',    notes: 'Steamed',                        displayOrder: 3 }
  ],
  'Bulking Basics::High-Calorie Dinner': [
    { foodName: 'Beef mince (lean)', quantity: 200,  unit: 'g',    notes: null,                             displayOrder: 1 },
    { foodName: 'Pasta',             quantity: 200,  unit: 'g',    notes: 'Dry weight',                     displayOrder: 2 },
    { foodName: 'Olive oil',         quantity: 15,   unit: 'ml',   notes: 'For cooking',                    displayOrder: 3 }
  ],

  // ── Lean Muscle Nutrition ─────────────────────────────────────────────────
  'Lean Muscle Nutrition::Balanced Breakfast': [
    { foodName: 'Greek yoghurt',     quantity: 200,  unit: 'g',    notes: '0% fat',                         displayOrder: 1 },
    { foodName: 'Mixed berries',     quantity: 80,   unit: 'g',    notes: 'Fresh or frozen',                displayOrder: 2 },
    { foodName: 'Granola',           quantity: 40,   unit: 'g',    notes: 'Low-sugar variety',              displayOrder: 3 }
  ],
  'Lean Muscle Nutrition::Pre-Workout Snack': [
    { foodName: 'Apple',             quantity: 1,    unit: 'pcs',  notes: null,                             displayOrder: 1 },
    { foodName: 'Cottage cheese',    quantity: 100,  unit: 'g',    notes: null,                             displayOrder: 2 },
    { foodName: 'Rice cakes',        quantity: 2,    unit: 'pcs',  notes: null,                             displayOrder: 3 }
  ],
  'Lean Muscle Nutrition::Recovery Lunch': [
    { foodName: 'Turkey breast',     quantity: 180,  unit: 'g',    notes: 'Sliced',                         displayOrder: 1 },
    { foodName: 'Brown rice',        quantity: 130,  unit: 'g',    notes: 'Cooked weight',                  displayOrder: 2 },
    { foodName: 'Mixed salad leaves',quantity: 60,   unit: 'g',    notes: 'No dressing or light balsamic',  displayOrder: 3 }
  ],
  'Lean Muscle Nutrition::Lean Dinner': [
    { foodName: 'Salmon fillet',     quantity: 180,  unit: 'g',    notes: 'Baked',                          displayOrder: 1 },
    { foodName: 'Sweet potato',      quantity: 150,  unit: 'g',    notes: 'Baked',                          displayOrder: 2 },
    { foodName: 'Asparagus',         quantity: 100,  unit: 'g',    notes: 'Grilled',                        displayOrder: 3 }
  ],

  // ── Performance Fuel Plan ─────────────────────────────────────────────────
  'Performance Fuel Plan::Power Breakfast': [
    { foodName: 'Oatmeal',           quantity: 120,  unit: 'g',    notes: 'Dry weight, cook with water',    displayOrder: 1 },
    { foodName: 'Whole eggs',        quantity: 4,    unit: 'pcs',  notes: null,                             displayOrder: 2 },
    { foodName: 'Orange juice',      quantity: 200,  unit: 'ml',   notes: 'Freshly squeezed preferred',     displayOrder: 3 }
  ],
  'Performance Fuel Plan::Mid-Morning Snack': [
    { foodName: 'Protein shake',     quantity: 1,    unit: 'serving', notes: '~30g protein powder in water', displayOrder: 1 },
    { foodName: 'Banana',            quantity: 1,    unit: 'pcs',  notes: null,                             displayOrder: 2 },
    { foodName: 'Almonds',           quantity: 30,   unit: 'g',    notes: null,                             displayOrder: 3 }
  ],
  'Performance Fuel Plan::Performance Lunch': [
    { foodName: 'Chicken thighs',    quantity: 200,  unit: 'g',    notes: 'Skinless, baked',                displayOrder: 1 },
    { foodName: 'Basmati rice',      quantity: 180,  unit: 'g',    notes: 'Cooked weight',                  displayOrder: 2 },
    { foodName: 'Spinach',           quantity: 80,   unit: 'g',    notes: 'Sauteed in olive oil',           displayOrder: 3 }
  ],
  'Performance Fuel Plan::Recovery Dinner': [
    { foodName: 'Tuna steak',        quantity: 200,  unit: 'g',    notes: 'Pan-seared',                     displayOrder: 1 },
    { foodName: 'Quinoa',            quantity: 150,  unit: 'g',    notes: 'Cooked weight',                  displayOrder: 2 },
    { foodName: 'Roasted vegetables',quantity: 150,  unit: 'g',    notes: 'Bell peppers, courgette, onion', displayOrder: 3 }
  ],

  // ── Foundation Nutrition ─────────────────────────────────────────────────
  'Foundation Nutrition::Simple Breakfast': [
    { foodName: 'Wholegrain toast',  quantity: 2,    unit: 'slices', notes: null,                           displayOrder: 1 },
    { foodName: 'Eggs',              quantity: 2,    unit: 'pcs',  notes: 'Poached or scrambled',           displayOrder: 2 },
    { foodName: 'Orange',            quantity: 1,    unit: 'pcs',  notes: null,                             displayOrder: 3 }
  ],
  'Foundation Nutrition::Light Lunch': [
    { foodName: 'Chicken breast',    quantity: 150,  unit: 'g',    notes: null,                             displayOrder: 1 },
    { foodName: 'Wholegrain wrap',   quantity: 1,    unit: 'pcs',  notes: null,                             displayOrder: 2 },
    { foodName: 'Lettuce & tomato',  quantity: 50,   unit: 'g',    notes: null,                             displayOrder: 3 }
  ],
  'Foundation Nutrition::Afternoon Snack': [
    { foodName: 'Apple',             quantity: 1,    unit: 'pcs',  notes: null,                             displayOrder: 1 },
    { foodName: 'Peanut butter',     quantity: 20,   unit: 'g',    notes: null,                             displayOrder: 2 },
    { foodName: 'Water',             quantity: 500,  unit: 'ml',   notes: 'Stay hydrated',                  displayOrder: 3 }
  ],
  'Foundation Nutrition::Balanced Dinner': [
    { foodName: 'Salmon',            quantity: 160,  unit: 'g',    notes: 'Baked',                          displayOrder: 1 },
    { foodName: 'Brown rice',        quantity: 120,  unit: 'g',    notes: 'Cooked weight',                  displayOrder: 2 },
    { foodName: 'Broccoli',          quantity: 100,  unit: 'g',    notes: 'Steamed',                        displayOrder: 3 }
  ],

  // ── Maintenance & Performance ─────────────────────────────────────────────
  'Maintenance & Performance::Training Day Breakfast': [
    { foodName: 'Porridge oats',     quantity: 90,   unit: 'g',    notes: 'With water or skimmed milk',     displayOrder: 1 },
    { foodName: 'Egg whites',        quantity: 150,  unit: 'ml',   notes: 'Scrambled',                      displayOrder: 2 },
    { foodName: 'Berries',           quantity: 60,   unit: 'g',    notes: null,                             displayOrder: 3 }
  ],
  'Maintenance & Performance::Pre-Workout Meal': [
    { foodName: 'Rice cakes',        quantity: 4,    unit: 'pcs',  notes: null,                             displayOrder: 1 },
    { foodName: 'Tuna in water',     quantity: 120,  unit: 'g',    notes: 'Drained',                        displayOrder: 2 },
    { foodName: 'Cucumber',          quantity: 50,   unit: 'g',    notes: null,                             displayOrder: 3 }
  ],
  'Maintenance & Performance::Lunch': [
    { foodName: 'Grilled chicken',   quantity: 175,  unit: 'g',    notes: null,                             displayOrder: 1 },
    { foodName: 'New potatoes',      quantity: 150,  unit: 'g',    notes: 'Boiled',                         displayOrder: 2 },
    { foodName: 'Green beans',       quantity: 80,   unit: 'g',    notes: null,                             displayOrder: 3 }
  ],
  'Maintenance & Performance::Dinner': [
    { foodName: 'Lean beef steak',   quantity: 180,  unit: 'g',    notes: 'Grilled',                        displayOrder: 1 },
    { foodName: 'Sweet potato mash', quantity: 150,  unit: 'g',    notes: null,                             displayOrder: 2 },
    { foodName: 'Kale',              quantity: 80,   unit: 'g',    notes: 'Sauteed',                        displayOrder: 3 }
  ],

  // ── Athlete's Competition Diet ────────────────────────────────────────────
  "Athlete's Competition Diet::Competition Breakfast": [
    { foodName: 'White rice',        quantity: 150,  unit: 'g',    notes: 'Cooked — familiar, easy to digest', displayOrder: 1 },
    { foodName: 'Chicken breast',    quantity: 150,  unit: 'g',    notes: 'Plain, no spices',               displayOrder: 2 },
    { foodName: 'Sports drink',      quantity: 500,  unit: 'ml',   notes: 'For electrolyte balance',        displayOrder: 3 }
  ],
  "Athlete's Competition Diet::Pre-Lift Meal": [
    { foodName: 'White bagel',       quantity: 1,    unit: 'pcs',  notes: 'With honey only',                displayOrder: 1 },
    { foodName: 'Egg whites',        quantity: 120,  unit: 'ml',   notes: 'Hard boiled',                    displayOrder: 2 },
    { foodName: 'Banana',            quantity: 1,    unit: 'pcs',  notes: null,                             displayOrder: 3 }
  ],
  "Athlete's Competition Diet::Between Attempts Snack": [
    { foodName: 'Gummy bears',       quantity: 30,   unit: 'g',    notes: 'Fast sugar for between lifts',   displayOrder: 1 },
    { foodName: 'Sports drink',      quantity: 250,  unit: 'ml',   notes: null,                             displayOrder: 2 },
    { foodName: 'Rice cake',         quantity: 1,    unit: 'pcs',  notes: null,                             displayOrder: 3 }
  ],
  "Athlete's Competition Diet::Recovery Dinner": [
    { foodName: 'Salmon fillet',     quantity: 220,  unit: 'g',    notes: 'Baked',                          displayOrder: 1 },
    { foodName: 'White rice',        quantity: 200,  unit: 'g',    notes: 'Cooked weight',                  displayOrder: 2 },
    { foodName: 'Steamed broccoli',  quantity: 120,  unit: 'g',    notes: null,                             displayOrder: 3 }
  ]
}

const PLAN_NAMES = [
  'Bulking Basics', 'Lean Muscle Nutrition', 'Performance Fuel Plan',
  'Foundation Nutrition', 'Maintenance & Performance', "Athlete's Competition Diet"
]

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── Resolve meals keyed by "planName::mealName" ───────────────────────────
    const [planRows] = await queryInterface.sequelize.query(
      `SELECT id, name FROM nutrition_plans WHERE name IN (${PLAN_NAMES.map(() => '?').join(',')})`,
      { replacements: PLAN_NAMES }
    )
    const planIds = planRows.map(r => r.id)

    const [mealRows] = await queryInterface.sequelize.query(
      `SELECT nm.id AS mealId, nm.name AS mealName, np.name AS planName
       FROM nutrition_meals nm
       JOIN nutrition_plans np ON np.id = nm.nutritionPlanId
       WHERE nm.nutritionPlanId IN (${planIds.map(() => '?').join(',')})`,
      { replacements: planIds }
    )
    const mealKey = {}
    mealRows.forEach(r => { mealKey[`${r.planName}::${r.mealName}`] = r.mealId })

    const now = new Date()
    const items = []

    for (const [key, defs] of Object.entries(MEAL_ITEMS)) {
      const mealId = mealKey[key]
      if (!mealId) throw new Error(`Meal not found for key: "${key}"`)
      for (const def of defs) {
        items.push({
          nutritionMealId: mealId,
          foodName:        def.foodName,
          quantity:        def.quantity,
          unit:            def.unit,
          notes:           def.notes,
          displayOrder:    def.displayOrder,
          createdAt:       now,
          updatedAt:       now
        })
      }
    }

    await queryInterface.bulkInsert('nutrition_meal_items', items)
  },

  async down(queryInterface, Sequelize) {
    const [planRows] = await queryInterface.sequelize.query(
      `SELECT id FROM nutrition_plans WHERE name IN (${PLAN_NAMES.map(() => '?').join(',')})`,
      { replacements: PLAN_NAMES }
    )
    if (planRows.length) {
      const [mealRows] = await queryInterface.sequelize.query(
        `SELECT id FROM nutrition_meals WHERE nutritionPlanId IN (${planRows.map(() => '?').join(',')})`,
        { replacements: planRows.map(r => r.id) }
      )
      if (mealRows.length) {
        await queryInterface.bulkDelete('nutrition_meal_items', {
          nutritionMealId: { [Op.in]: mealRows.map(r => r.id) }
        })
      }
    }
  }
}
