const express = require("express");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const usersRoutes = require("./routes/usersRoutes");
const traineesRoutes = require("./routes/traineesRoutes");

const app = express();
const port = 3000;

app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
  res.json({
    success: true,
    data: { message: "FitFlow API" },
    error: null,
  });
});

app.use("/users", usersRoutes);
app.use("/trainees", traineesRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
      details: req.originalUrl,
    },
  });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
