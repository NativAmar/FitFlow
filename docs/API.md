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

## Authentication

All protected routes (every endpoint under `/users` and `/trainees`) require the request header:

`x-user-role: admin | trainer | trainee`

The value is case-insensitive. If the header is missing, or the role is not allowed for the route, the API responds with `403 FORBIDDEN` using the standard error envelope.

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

**POST /users** with `x-user-role: admin`

Request body:

```json
{
  "firstName": "Sara",
  "lastName": "Ben",
  "userRole": "trainer"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "userId": 4,
    "firstName": "Sara",
    "lastName": "Ben",
    "userRole": "trainer",
    "createDate": "2026-05-19T09:00:00.000Z",
    "updateDate": "2026-05-19T09:00:00.000Z"
  },
  "error": null
}
```

**PUT /users/:id** with `x-user-role: admin` (e.g. `PUT /users/4`)

Request body:

```json
{
  "firstName": "Sara",
  "lastName": "Ben-David",
  "userRole": "trainee"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "userId": 4,
    "firstName": "Sara",
    "lastName": "Ben-David",
    "userRole": "trainee",
    "createDate": "2026-05-19T09:00:00.000Z",
    "updateDate": "2026-05-19T09:15:00.000Z"
  },
  "error": null
}
```

**DELETE /users/:id** with `x-user-role: admin` (e.g. `DELETE /users/4`)

Response `200`:

```json
{
  "success": true,
  "data": {
    "userId": 4,
    "firstName": "Sara",
    "lastName": "Ben-David",
    "userRole": "trainee",
    "createDate": "2026-05-19T09:00:00.000Z",
    "updateDate": "2026-05-19T09:15:00.000Z"
  },
  "error": null
}
```

**POST /trainees** — response `201` (request body shown above)

```json
{
  "success": true,
  "data": {
    "traineeId": 4,
    "userId": 3,
    "trainerId": 2,
    "fitnessGoal": "Half marathon prep",
    "experienceLevel": "intermediate",
    "weeklyWorkouts": 4,
    "status": "active",
    "createDate": "2026-05-19T09:00:00.000Z",
    "updateDate": "2026-05-19T09:00:00.000Z"
  },
  "error": null
}
```

**PUT /trainees/:id** with `x-user-role: trainer` (e.g. `PUT /trainees/4`)

Request body:

```json
{
  "userId": 3,
  "trainerId": 2,
  "fitnessGoal": "Marathon prep",
  "experienceLevel": "advanced",
  "weeklyWorkouts": 5,
  "status": "active"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "traineeId": 4,
    "userId": 3,
    "trainerId": 2,
    "fitnessGoal": "Marathon prep",
    "experienceLevel": "advanced",
    "weeklyWorkouts": 5,
    "status": "active",
    "createDate": "2026-05-19T09:00:00.000Z",
    "updateDate": "2026-05-19T09:15:00.000Z"
  },
  "error": null
}
```

**DELETE /trainees/:id** with `x-user-role: admin` (e.g. `DELETE /trainees/4`)

Response `200`:

```json
{
  "success": true,
  "data": {
    "traineeId": 4,
    "userId": 3,
    "trainerId": 2,
    "fitnessGoal": "Marathon prep",
    "experienceLevel": "advanced",
    "weeklyWorkouts": 5,
    "status": "active",
    "createDate": "2026-05-19T09:00:00.000Z",
    "updateDate": "2026-05-19T09:15:00.000Z"
  },
  "error": null
}
```

**403** — missing role header

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": { "header": "x-user-role" }
  }
}
```

**403** — role not allowed for this route

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": { "role": "trainee", "allowedRoles": ["admin"] }
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
