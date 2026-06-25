import { apiRequest } from "./api";

// ── Trainer operations ────────────────────────────────────────────────────────

function getTraineeWorkoutPlans(traineeId) {
  return apiRequest(`/api/trainees/${traineeId}/workout-plans`);
}

function getTraineeActiveWorkoutPlan(traineeId) {
  return apiRequest(`/api/trainees/${traineeId}/workout-plan/active`);
}

function createWorkoutPlan(traineeId, data) {
  return apiRequest(`/api/trainees/${traineeId}/workout-plans`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

function getWorkoutPlan(planId) {
  return apiRequest(`/api/workout-plans/${planId}`);
}

function updateWorkoutPlan(planId, data) {
  return apiRequest(`/api/workout-plans/${planId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

function changeWorkoutPlanStatus(planId, status) {
  return apiRequest(`/api/workout-plans/${planId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

function deleteWorkoutPlan(planId) {
  return apiRequest(`/api/workout-plans/${planId}`, {
    method: "DELETE",
  });
}

// ── Session operations ────────────────────────────────────────────────────────

function createWorkoutSession(planId, data) {
  return apiRequest(`/api/workout-plans/${planId}/sessions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

function updateWorkoutSession(sessionId, data) {
  return apiRequest(`/api/workout-sessions/${sessionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

function deleteWorkoutSession(sessionId) {
  return apiRequest(`/api/workout-sessions/${sessionId}`, {
    method: "DELETE",
  });
}

// ── Exercise assignment operations ────────────────────────────────────────────

function createWorkoutExerciseAssignment(sessionId, data) {
  return apiRequest(`/api/workout-sessions/${sessionId}/exercises`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

function updateWorkoutExerciseAssignment(assignmentId, data) {
  return apiRequest(`/api/workout-session-exercises/${assignmentId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

function deleteWorkoutExerciseAssignment(assignmentId) {
  return apiRequest(`/api/workout-session-exercises/${assignmentId}`, {
    method: "DELETE",
  });
}

// ── Trainee operations ────────────────────────────────────────────────────────

function getMyWorkoutPlans() {
  return apiRequest("/api/trainees/me/workout-plans");
}

function getMyActiveWorkoutPlan() {
  return apiRequest("/api/trainees/me/workout-plan/active");
}

export {
  getTraineeWorkoutPlans,
  getTraineeActiveWorkoutPlan,
  createWorkoutPlan,
  getWorkoutPlan,
  updateWorkoutPlan,
  changeWorkoutPlanStatus,
  deleteWorkoutPlan,
  createWorkoutSession,
  updateWorkoutSession,
  deleteWorkoutSession,
  createWorkoutExerciseAssignment,
  updateWorkoutExerciseAssignment,
  deleteWorkoutExerciseAssignment,
  getMyWorkoutPlans,
  getMyActiveWorkoutPlan,
};
