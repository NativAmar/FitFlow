import { apiRequest } from './api'

/**
 * Generate an AI-assisted progress summary for a trainee.
 * Called only from Trainer-role views; backend enforces ownership and role.
 *
 * @param {number} traineeId
 * @param {{ endWeekStart?: string, weeks?: number }} params
 * @returns {Promise<object>} Resolves to response data on success
 */
export function getTraineeProgressSummary(traineeId, params = {}) {
  return apiRequest(`/api/ai/trainees/${traineeId}/progress-summary`, {
    method: 'POST',
    body:   JSON.stringify(params)
  })
}
