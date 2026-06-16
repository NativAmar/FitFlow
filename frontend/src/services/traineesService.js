import { apiRequest } from "./api";

function getTrainees() {
  return apiRequest("/api/trainees");
}

export { getTrainees };
