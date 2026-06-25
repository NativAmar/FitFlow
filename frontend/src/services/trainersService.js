import { apiRequest } from "./api";

function getTrainers() {
  return apiRequest("/api/trainers");
}

function getTrainerById(id) {
  return apiRequest(`/api/trainers/${id}`);
}

function createTrainer(data) {
  return apiRequest("/api/trainers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

function updateTrainer(id, data) {
  return apiRequest(`/api/trainers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

function updateTrainerStatus(id, status) {
  return apiRequest(`/api/trainers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export {
  getTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  updateTrainerStatus,
};
