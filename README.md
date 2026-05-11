# FitFlow — Web Development Environments (Step 2 backend)

Express REST API with **mock in-memory data** (no database, no authentication).

## Run

```bash
npm install
npm start
```

Development with auto-restart (Node 18+):

```bash
npm run dev
```

Server listens on **http://localhost:3000**.

## Structure

- `server.js` — app entry
- `routes/` — `/users`, `/trainees`
- `controllers/` — request handling + validation
- `models/` — mock arrays + CRUD helpers
- `middleware/` — logger, role check, id validation, error handler
- `docs/API.md` — endpoint reference

Send header **`x-user-role`**: `admin` | `trainer` | `trainee`.

## Resources

- **Users** fields: `userId`, `firstName`, `lastName`, `createDate`, `updateDate`, `userRole`
- **Trainees** fields: `traineeId`, `userId`, `trainerId`, `fitnessGoal`, `experienceLevel`, `weeklyWorkouts`, `status`, `createDate`, `updateDate`

See [docs/API.md](docs/API.md) for endpoints and examples.
