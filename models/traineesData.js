let nextId = 4;

function now() {
  return new Date().toISOString();
}

let trainees = [
  {
    traineeId: 1,
    userId: 3,
    trainerId: 2,
    fitnessGoal: "Build strength",
    experienceLevel: "beginner",
    weeklyWorkouts: 3,
    status: "active",
    createDate: "2026-01-04T00:00:00.000Z",
    updateDate: "2026-01-04T00:00:00.000Z",
  },
  {
    traineeId: 2,
    userId: 3,
    trainerId: 2,
    fitnessGoal: "Weight loss",
    experienceLevel: "intermediate",
    weeklyWorkouts: 4,
    status: "active",
    createDate: "2026-01-05T00:00:00.000Z",
    updateDate: "2026-01-05T00:00:00.000Z",
  },
  {
    traineeId: 3,
    userId: 3,
    trainerId: 2,
    fitnessGoal: "General fitness",
    experienceLevel: "advanced",
    weeklyWorkouts: 5,
    status: "paused",
    createDate: "2026-01-06T00:00:00.000Z",
    updateDate: "2026-01-06T00:00:00.000Z",
  },
];

function getAll() {
  return trainees;
}

function getById(traineeId) {
  return trainees.find((t) => t.traineeId === traineeId);
}

function create(item) {
  const ts = now();
  const row = { traineeId: nextId++, ...item, createDate: ts, updateDate: ts };
  trainees.push(row);
  return row;
}

function update(traineeId, patch) {
  const idx = trainees.findIndex((t) => t.traineeId === traineeId);
  if (idx === -1) return null;
  trainees[idx] = { ...trainees[idx], ...patch, traineeId, updateDate: now() };
  return trainees[idx];
}

function remove(traineeId) {
  const idx = trainees.findIndex((t) => t.traineeId === traineeId);
  if (idx === -1) return null;
  const [removed] = trainees.splice(idx, 1);
  return removed;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
