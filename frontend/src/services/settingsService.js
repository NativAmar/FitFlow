import { apiRequest } from "./api";

function getSettings() {
  return apiRequest("/api/settings");
}

function updateSettings(settings) {
  return apiRequest("/api/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export { getSettings, updateSettings };
