import { useState } from "react";
import { getTraineeProgressSummary } from "../services/aiService";
import {
  currentWeekMonday,
  addWeeks,
  formatWeekRange,
  formatDateTime,
} from "../utils/weekUtils";

// Returns true when weekStart is strictly after the current Monday
function isAfterCurrentMonday(weekStart) {
  return weekStart > currentWeekMonday();
}

function CompletionRateDisplay({ rate }) {
  if (rate === null || rate === undefined) return <span className="ai-ps-na">N/A</span>;
  return <span>{rate}%</span>;
}

export default function TraineeProgressSummary({ traineeId }) {
  const [endWeekStart, setEndWeekStart] = useState(() => currentWeekMonday());
  const [weeks, setWeeks]               = useState(4);
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  function handlePrevWeek() {
    setEndWeekStart((prev) => addWeeks(prev, -1));
    setResult(null);
    setError(null);
  }

  function handleNextWeek() {
    const next = addWeeks(endWeekStart, 1);
    if (isAfterCurrentMonday(next)) return;
    setEndWeekStart(next);
    setResult(null);
    setError(null);
  }

  function handleWeeksChange(e) {
    setWeeks(Number(e.target.value));
    setResult(null);
    setError(null);
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getTraineeProgressSummary(traineeId, {
        endWeekStart,
        weeks,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to generate AI summary.");
    } finally {
      setLoading(false);
    }
  }

  const canGoNext = !isAfterCurrentMonday(addWeeks(endWeekStart, 1));

  return (
    <div className="ai-ps-container">
      <div className="ai-ps-header">
        <h2 className="ai-ps-title">AI Progress Summary</h2>
        <p className="ai-ps-description">
          Generates an AI-assisted summary based on recorded FitFlow data for
          this trainee. Output is advisory only and is not a medical
          recommendation.
        </p>
      </div>

      {/* Controls */}
      <div className="ai-ps-controls">
        <div className="ai-ps-control-group">
          <label htmlFor="ai-ps-weeks" className="ai-ps-label">
            Weeks to review
          </label>
          <select
            id="ai-ps-weeks"
            className="ai-ps-select"
            value={weeks}
            onChange={handleWeeksChange}
            disabled={loading}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "week" : "weeks"}
              </option>
            ))}
          </select>
        </div>

        <div className="ai-ps-control-group">
          <label className="ai-ps-label">Ending week</label>
          <div className="ai-ps-week-nav">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePrevWeek}
              disabled={loading}
              type="button"
            >
              &laquo; Prev
            </button>
            <span className="ai-ps-week-label">
              {formatWeekRange(endWeekStart)}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleNextWeek}
              disabled={loading || !canGoNext}
              type="button"
            >
              Next &raquo;
            </button>
          </div>
        </div>

        <button
          className="btn btn-primary ai-ps-generate-btn"
          onClick={handleGenerate}
          disabled={loading}
          type="button"
        >
          {loading ? "Generating…" : "Generate Summary"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <p className="loading">Generating AI summary, please wait&hellip;</p>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="alert alert-error ai-ps-error">{error}</div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="ai-ps-result">
          {/* Meta */}
          <p className="ai-ps-meta">
            Generated at {formatDateTime(result.generatedAt)}
          </p>

          {/* Statistics */}
          <div className="ai-ps-section">
            <h3 className="ai-ps-section-title">Workout Statistics</h3>
            <div className="ai-ps-stats-summary">
              <span>
                <strong>{result.statistics.plannedWorkouts}</strong> planned
              </span>
              <span>
                <strong>{result.statistics.completedWorkouts}</strong> completed
              </span>
              <span>
                Overall:{" "}
                <strong>
                  <CompletionRateDisplay
                    rate={result.statistics.completionRate}
                  />
                </strong>
              </span>
              {result.statistics.feedbackCount > 0 && (
                <span>
                  <strong>{result.statistics.feedbackCount}</strong> feedback
                  note
                  {result.statistics.feedbackCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <table className="ai-ps-stats-table">
              <thead>
                <tr>
                  <th>Week starting</th>
                  <th>Planned</th>
                  <th>Completed</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {result.statistics.weeklyBreakdown.map((w) => (
                  <tr key={w.weekStartDate}>
                    <td>{w.weekStartDate}</td>
                    <td>{w.plannedWorkouts}</td>
                    <td>{w.completedWorkouts}</td>
                    <td>
                      <CompletionRateDisplay rate={w.completionRate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Context */}
          <div className="ai-ps-section ai-ps-context">
            {result.context.activeWorkoutPlan && (
              <span className="ai-ps-context-item">
                Plan: <strong>{result.context.activeWorkoutPlan}</strong>
              </span>
            )}
            <span className="ai-ps-context-item">
              Goals assigned: <strong>{result.context.assignedGoalCount}</strong>
            </span>
            <span className="ai-ps-context-item">
              Nutrition plan:{" "}
              <strong>
                {result.context.hasActiveNutritionPlan ? "Active" : "None"}
              </strong>
            </span>
          </div>

          {/* AI Headline */}
          <div className="ai-ps-section">
            <p className="ai-ps-headline">{result.summary.headline}</p>
          </div>

          {/* Overview */}
          <div className="ai-ps-section">
            <h3 className="ai-ps-section-title">Overview</h3>
            <p className="ai-ps-overview">{result.summary.overview}</p>
          </div>

          {/* Strengths */}
          {result.summary.strengths.length > 0 && (
            <div className="ai-ps-section">
              <h3 className="ai-ps-section-title">Strengths</h3>
              <ul className="ai-ps-list">
                {result.summary.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Attention Points */}
          {result.summary.attentionPoints.length > 0 && (
            <div className="ai-ps-section">
              <h3 className="ai-ps-section-title">Areas for Attention</h3>
              <ul className="ai-ps-list">
                {result.summary.attentionPoints.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Actions */}
          {result.summary.suggestedActions.length > 0 && (
            <div className="ai-ps-section">
              <h3 className="ai-ps-section-title">Suggested Actions</h3>
              <ol className="ai-ps-list">
                {result.summary.suggestedActions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Follow-up Questions */}
          {result.summary.followUpQuestions.length > 0 && (
            <div className="ai-ps-section">
              <h3 className="ai-ps-section-title">Follow-Up Questions</h3>
              <ul className="ai-ps-list">
                {result.summary.followUpQuestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Note */}
          <div className="ai-safety-note">
            <strong>Note: </strong>
            {result.summary.safetyNote}
          </div>
        </div>
      )}
    </div>
  );
}
