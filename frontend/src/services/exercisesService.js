import { apiRequest } from "./api";

function getMuscleGroups() {
  return apiRequest("/api/muscle-groups");
}

function getExercises(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search)        params.set("search",        filters.search);
  if (filters.muscleGroupId) params.set("muscleGroupId", filters.muscleGroupId);
  if (filters.trainerId)     params.set("trainerId",     filters.trainerId);
  const qs = params.toString();
  return apiRequest(`/api/exercises${qs ? `?${qs}` : ""}`);
}

function getExerciseById(id) {
  return apiRequest(`/api/exercises/${id}`);
}

function createExercise(data) {
  return apiRequest("/api/exercises", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

function updateExercise(id, data) {
  return apiRequest(`/api/exercises/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

function deleteExercise(id) {
  return apiRequest(`/api/exercises/${id}`, {
    method: "DELETE",
  });
}

export {
  getMuscleGroups,
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
};
