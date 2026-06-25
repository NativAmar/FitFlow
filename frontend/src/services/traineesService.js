import { apiRequest } from "./api";

function getTrainees() {
  return apiRequest("/api/trainees");
}

function getTraineeById(id) {
  return apiRequest(`/api/trainees/${id}`);
}

function getMyTraineeProfile() {
  return apiRequest("/api/trainees/me");
}

function createTrainee(data) {
  return apiRequest("/api/trainees", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

function updateTrainee(id, data) {
  return apiRequest(`/api/trainees/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

function updateTraineeStatus(id, status) {
  return apiRequest(`/api/trainees/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

function reassignTrainee(id, trainerId) {
  return apiRequest(`/api/trainees/${id}/trainer`, {
    method: "PATCH",
    body: JSON.stringify({ trainerId }),
  });
}

function deleteTrainee(id) {
  return apiRequest(`/api/trainees/${id}`, {
    method: "DELETE",
  });
}

function getTraineeGoals(traineeId) {
  return apiRequest(`/api/trainees/${traineeId}/goals`);
}

function assignGoalToTrainee(traineeId, data) {
  return apiRequest(`/api/trainees/${traineeId}/goals`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

function updateTraineeGoal(traineeId, goalId, data) {
  return apiRequest(`/api/trainees/${traineeId}/goals/${goalId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

function removeGoalFromTrainee(traineeId, goalId) {
  return apiRequest(`/api/trainees/${traineeId}/goals/${goalId}`, {
    method: "DELETE",
  });
}

export {
  getTrainees,
  getTraineeById,
  getMyTraineeProfile,
  createTrainee,
  updateTrainee,
  updateTraineeStatus,
  reassignTrainee,
  deleteTrainee,
  getTraineeGoals,
  assignGoalToTrainee,
  updateTraineeGoal,
  removeGoalFromTrainee,
};
