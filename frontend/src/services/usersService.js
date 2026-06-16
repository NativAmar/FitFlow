import { apiRequest } from "./api";

function getMe() {
  return apiRequest("/api/users/me");
}

export { getMe };
