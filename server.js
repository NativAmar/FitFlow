require("dotenv").config();
const http    = require("http");
const express = require("express");
const cors    = require("cors");
const logger      = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const usersRoutes               = require("./routes/usersRoutes");
const traineesRoutes            = require("./routes/traineesRoutes");
const trainersRoutes            = require("./routes/trainersRoutes");
const goalsRoutes               = require("./routes/goalsRoutes");
const muscleGroupsRoutes        = require("./routes/muscleGroupsRoutes");
const exercisesRoutes           = require("./routes/exercisesRoutes");
const workoutPlansRoutes        = require("./routes/workoutPlansRoutes");
const workoutSessionsRoutes     = require("./routes/workoutSessionsRoutes");
const workoutSessionExercisesRoutes = require("./routes/workoutSessionExercisesRoutes");
const nutritionPlansRoutes      = require("./routes/nutritionPlansRoutes");
const nutritionMealsRoutes      = require("./routes/nutritionMealsRoutes");
const nutritionMealItemsRoutes  = require("./routes/nutritionMealItemsRoutes");
const authRoutes                = require("./routes/authRoutes");
const settingsRoutes            = require("./routes/settingsRoutes");
const aiRoutes                  = require("./routes/aiRoutes");
const { initializeSocketServer } = require("./socket/socketServer");

const app  = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(logger);

app.get("/", (req, res) => {
  res.json({
    success: true,
    data: { message: "FitFlow API" },
    error: null,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes);
app.use(["/users", "/api/users"], usersRoutes);
app.use(["/trainees", "/api/trainees"], traineesRoutes);
app.use("/api/trainers", trainersRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/muscle-groups", muscleGroupsRoutes);
app.use("/api/exercises", exercisesRoutes);
app.use("/api/workout-plans", workoutPlansRoutes);
app.use("/api/workout-sessions", workoutSessionsRoutes);
app.use("/api/workout-session-exercises", workoutSessionExercisesRoutes);
app.use("/api/nutrition-plans", nutritionPlansRoutes);
app.use("/api/nutrition-meals", nutritionMealsRoutes);
app.use("/api/nutrition-meal-items", nutritionMealItemsRoutes);
app.use("/api/ai", aiRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
      details: { path: req.originalUrl },
    },
  });
});

app.use(errorHandler);

// Create one HTTP server shared by Express and Socket.IO
const server = http.createServer(app);
initializeSocketServer(server);

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Preserve the Express app export for any tooling that imports it
module.exports = app;
