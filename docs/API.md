# FitFlow API (Step 2 backend)

All JSON responses use a consistent shape:

**Success**

```json
{ "success": true, "data": ..., "error": null }
```

**Error**

```json
{
  "success": false,
  "data": null,
  "error": { "code": "STRING", "message": "...", "details": ... }
}
```

Send header **`x-user-role`** with one of: `admin`, `trainer`, `trainee` (case-insensitive).

## Users

| Method | Path | Roles | Body (JSON) |
|--------|------|-------|----------------|
| GET | `/users` | admin, trainer, trainee | — |
| GET | `/users/:id` | admin, trainer, trainee | — |
| POST | `/users` | admin | `firstName`, `lastName`, `userRole` (`admin`\|`trainer`\|`trainee`) |
| PUT | `/users/:id` | admin | same as POST |
| DELETE | `/users/:id` | admin | — |

## Trainees

| Method | Path | Roles | Body (JSON) |
|--------|------|-------|----------------|
| GET | `/trainees` | admin, trainer, trainee | — |
| GET | `/trainees/:id` | admin, trainer, trainee | — |
| POST | `/trainees` | admin, trainer | `userId`, `trainerId`, `fitnessGoal`, `experienceLevel`, `weeklyWorkouts`, `status` |
| PUT | `/trainees/:id` | admin, trainer | same as POST |
| DELETE | `/trainees/:id` | admin | — |

## Examples

**GET /users** with `x-user-role: trainee`

```json
{
  "success": true,
  "data": [
    {
      "userId": 1,
      "firstName": "Admin",
      "lastName": "Root",
      "userRole": "admin",
      "createDate": "2026-01-01T00:00:00.000Z",
      "updateDate": "2026-01-01T00:00:00.000Z"
    }
  ],
  "error": null
}
```

**POST /trainees** with `x-user-role: trainer`

```json
{
  "userId": 3,
  "trainerId": 2,
  "fitnessGoal": "Half marathon prep",
  "experienceLevel": "intermediate",
  "weeklyWorkouts": 4,
  "status": "active"
}
```

**401** — missing role header

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "MISSING_ROLE",
    "message": "Missing role header",
    "details": { "header": "x-user-role" }
  }
}
```

**400** — invalid id

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid id",
    "details": { "param": "id", "value": "abc" }
  }
}
```
