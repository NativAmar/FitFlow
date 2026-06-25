import { apiRequest } from "./api";

function getGoals() {
  return apiRequest("/api/goals");
}

function getGoalById(id) {
  return apiRequest(`/api/goals/${id}`);
}

function createGoal(data) {
  return apiRequest("/api/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

function updateGoal(id, data) {
  return apiRequest(`/api/goals/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

function deleteGoal(id) {
  return apiRequest(`/api/goals/${id}`, {
    method: "DELETE",
  });
}

export { getGoals, getGoalById, createGoal, updateGoal, deleteGoal };
