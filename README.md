# FitFlow

Full-stack fitness management application. Express REST API backed by **MySQL + Sequelize**, JWT authentication, role-based access control, real-time notifications via Socket.IO, AI-powered insights, and a React frontend.

## Implementation status

| Area | Status |
|---|---|
| MySQL schema (migrations) | ✅ Complete |
| Seed data | ✅ Complete |
| Sequelize models and associations | ✅ Complete |
| JWT authentication | ✅ Complete |
| Role-based access control | ✅ Complete |
| Settings persistence | ✅ Complete |
| Trainer management API | ✅ Complete |
| Trainee management API | ✅ Complete |
| Users management API | ✅ Complete |
| Goals & TraineeGoals API | ✅ Complete |
| Muscle Groups API | ✅ Complete |
| Exercises API | ✅ Complete |
| Workout Plans API | ✅ Complete |
| Workout Sessions API | ✅ Complete |
| Workout Session Exercises API | ✅ Complete |
| Nutrition Plans API | ✅ Complete |
| Nutrition Meals API | ✅ Complete |
| Nutrition Meal Items API | ✅ Complete |
| AI (Google Genai) API | ✅ Complete |
| Real-time notifications (Socket.IO) | ✅ Complete |
| React frontend | ✅ Complete |

## Prerequisites

- **Node.js** 18+ (required for both backend and frontend)
- **MySQL 9.x** running locally (service must be started before the server)

### Create the database (one-time setup)

Open a MySQL client and run:

```sql
CREATE DATABASE IF NOT EXISTS fitflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### Configure environment variables

Copy `.env.example` to `.env` and fill in your local MySQL credentials and a JWT secret:

```bash
cp .env.example .env
```

Edit `.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fitflow
DB_USER=root
DB_PASSWORD=your_mysql_password_here
JWT_SECRET=any_long_random_string_here
PORT=3000
GEMINI_API_KEY=your_google_genai_key_here
```

## Backend setup

```bash
npm install
npm run db:migrate   # create all tables
npm run db:seed      # populate demo data
npm start
```

Development with auto-restart (Node 18+):

```bash
npm run dev
```

Server listens on **http://localhost:3000**.

## Frontend setup

```bash
cd frontend
npm install
npm start
```

React app listens on **http://localhost:3001**.

## Database scripts

| Script | What it does |
|---|---|
| `npm run db:migrate` | Run all pending migrations |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:seed` | Seed all demo data |
| `npm run db:undo` | Undo the most recent migration |
| `npm run db:reset` | Undo all migrations, re-migrate, re-seed |

## Demo accounts

All demo passwords are `123456`.

| Email | Role |
|---|---|
| admin@fitflow.com | admin |
| trainer@fitflow.com | trainer |
| trainer2@fitflow.com | trainer |
| trainee@fitflow.com | trainee |
| trainee2@fitflow.com | trainee |
| trainee3@fitflow.com | trainee |

## Structure

### Backend
- `server.js` — app entry
- `config/database.js` — Sequelize instance (runtime)
- `config/config.js` — sequelize-cli configuration
- `database/migrations/` — schema definitions
- `database/seeders/` — demo data
- `models/` — Sequelize model definitions and associations
- `routes/` — API route definitions
- `controllers/` — request handling and validation
- `middleware/` — auth, role check, id validation, error handler
- `socket/` — Socket.IO server initialization and event handlers
- `constants/` — shared constants
- `docs/API.md` — endpoint reference

### Frontend
- `frontend/src/pages/` — page-level components (Login, Dashboard, TrainerWorkoutPlans, TraineeWorkoutTracking, TrainerNutritionPlans, etc.)
- `frontend/src/components/` — reusable UI components
- `frontend/src/services/` — API service layer
- `frontend/src/context/` — React context (AuthContext, SocketContext)

## Authentication

All routes use JWT bearer-token authentication (bcryptjs passwords, 1-hour token expiry). Role-based authorization uses `requireAuth` + `requireRole` middleware derived from the token payload.

## Resources

- **Users** — id, firstName, lastName, email, role, status
- **Trainers** — id, userId, specialization
- **Trainees** — id, userId, trainerId, experienceLevel, weeklyWorkouts, status, notes
- **Goals** — id, name, description
- **TraineeGoals** — traineeId, goalId, status, targetDate
- **MuscleGroups** — id, name
- **Exercises** — id, name, muscleGroupId, description, difficulty
- **WorkoutPlans** — id, trainerId, traineeId, name, description
- **WorkoutSessions** — id, workoutPlanId, name, dayOfWeek
- **WorkoutSessionExercises** — sessionId, exerciseId, sets, reps, weight
- **NutritionPlans** — id, trainerId, traineeId, name, dailyCalories, description
- **NutritionMeals** — id, nutritionPlanId, name, mealOrder, calories
- **NutritionMealItems** — id, mealId, name, quantity, unit, calories, protein, carbs, fat
- **Notifications** — real-time via Socket.IO; persisted in database

See [docs/API.md](docs/API.md) for endpoints and examples.

## Real-time notifications

The server uses Socket.IO on the same HTTP port as Express. Clients connect with their JWT token; the server delivers per-user notifications (e.g., goal assigned, plan updated) instantly and falls back to polling for missed events.

## AI features

The `/api/ai` routes integrate Google Genai (`@google/genai`) to provide trainee progress insights and plan suggestions. Requires a valid `GEMINI_API_KEY` in `.env`.
