import { apiRequest } from "./api";

function getMyWorkoutTracking(weekStart) {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : "";
  return apiRequest(`/api/trainees/me/workout-tracking${query}`);
}

function updateMyWorkoutTracking(workoutSessionId, weekStart, data) {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : "";
  return apiRequest(
    `/api/trainees/me/workout-tracking/${workoutSessionId}${query}`,
    { method: "PUT", body: JSON.stringify(data) }
  );
}

function getTraineeWorkoutTracking(traineeId, weekStart) {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : "";
  return apiRequest(`/api/trainees/${traineeId}/workout-tracking${query}`);
}

export {
  getMyWorkoutTracking,
  updateMyWorkoutTracking,
  getTraineeWorkoutTracking,
};
