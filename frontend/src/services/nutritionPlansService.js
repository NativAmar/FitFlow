import { apiRequest } from "./api";

// ── Trainer: per-trainee plan operations ──────────────────────────────────────

function getTraineeNutritionPlans(traineeId) {
  return apiRequest(`/api/trainees/${traineeId}/nutrition-plans`);
}

function getTraineeActiveNutritionPlan(traineeId) {
  return apiRequest(`/api/trainees/${traineeId}/nutrition-plan/active`);
}

function createNutritionPlan(traineeId, data) {
  return apiRequest(`/api/trainees/${traineeId}/nutrition-plans`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Plan operations ───────────────────────────────────────────────────────────

function getNutritionPlan(planId) {
  return apiRequest(`/api/nutrition-plans/${planId}`);
}

function updateNutritionPlan(planId, data) {
  return apiRequest(`/api/nutrition-plans/${planId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

function changeNutritionPlanStatus(planId, status) {
  return apiRequest(`/api/nutrition-plans/${planId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

function deleteNutritionPlan(planId) {
  return apiRequest(`/api/nutrition-plans/${planId}`, {
    method: "DELETE",
  });
}

// ── Meal operations ───────────────────────────────────────────────────────────

function createNutritionMeal(planId, data) {
  return apiRequest(`/api/nutrition-plans/${planId}/meals`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

function updateNutritionMeal(mealId, data) {
  return apiRequest(`/api/nutrition-meals/${mealId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

function deleteNutritionMeal(mealId) {
  return apiRequest(`/api/nutrition-meals/${mealId}`, {
    method: "DELETE",
  });
}

// ── Meal item operations ──────────────────────────────────────────────────────

function createNutritionMealItem(mealId, data) {
  return apiRequest(`/api/nutrition-meals/${mealId}/items`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

function updateNutritionMealItem(itemId, data) {
  return apiRequest(`/api/nutrition-meal-items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

function deleteNutritionMealItem(itemId) {
  return apiRequest(`/api/nutrition-meal-items/${itemId}`, {
    method: "DELETE",
  });
}

// ── Trainee self-service ──────────────────────────────────────────────────────

function getMyNutritionPlans() {
  return apiRequest("/api/trainees/me/nutrition-plans");
}

function getMyActiveNutritionPlan() {
  return apiRequest("/api/trainees/me/nutrition-plan/active");
}

export {
  getTraineeNutritionPlans,
  getTraineeActiveNutritionPlan,
  createNutritionPlan,
  getNutritionPlan,
  updateNutritionPlan,
  changeNutritionPlanStatus,
  deleteNutritionPlan,
  createNutritionMeal,
  updateNutritionMeal,
  deleteNutritionMeal,
  createNutritionMealItem,
  updateNutritionMealItem,
  deleteNutritionMealItem,
  getMyNutritionPlans,
  getMyActiveNutritionPlan,
};
