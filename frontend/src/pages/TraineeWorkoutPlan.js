import { useState, useEffect, useCallback } from "react";
import {
  getMyWorkoutPlans,
  getMyActiveWorkoutPlan,
  getWorkoutPlan,
} from "../services/workoutPlansService";
import { useSocket } from "../context/SocketContext";

// ── Formatting helpers ────────────────────────────────────────────────────────

const DAY_LABELS = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

function formatDay(day) {
  return day ? (DAY_LABELS[day] || day) : "Flexible";
}

function formatDateOnly(str) {
  if (!str) return null;
  const parts = str.split("-");
  if (parts.length !== 3) return str;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (!y || !m || !d) return str;
  return `${months[m - 1]} ${d}, ${y}`;
}

function formatSeconds(secs) {
  if (secs === null || secs === undefined) return "—";
  if (secs === 0) return "No rest";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s} sec`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} sec`;
}

function formatExecution(a) {
  const hasReps = a.repetitions !== null && a.repetitions !== undefined;
  const hasDur  = a.durationSeconds !== null && a.durationSeconds !== undefined;
  if (hasReps && hasDur) return `${a.repetitions} reps / ${formatSeconds(a.durationSeconds)}`;
  if (hasReps)  return `${a.repetitions} rep${a.repetitions !== 1 ? "s" : ""}`;
  if (hasDur)   return formatSeconds(a.durationSeconds);
  return "—";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AssignmentView({ assignment }) {
  const ex = assignment.exercise || {};
  const mg = ex.muscleGroup;
  return (
    <div className="wp-assignment-row">
      <div className="wp-assignment-order">{assignment.displayOrder}.</div>
      <div className="wp-assignment-body">
        <div className="wp-assignment-title">
          <span className="wp-assignment-name">{ex.name || "—"}</span>
          {mg && <span className="wp-assignment-muscle">{mg.name}</span>}
        </div>
        {ex.description && (
          <p className="wp-assignment-ex-desc">{ex.description}</p>
        )}
        <div className="wp-assignment-meta">
          <span>{assignment.sets} set{assignment.sets !== 1 ? "s" : ""} × {formatExecution(assignment)}</span>
          <span className="wp-assignment-rest">Rest: {formatSeconds(assignment.restSeconds)}</span>
        </div>
        {assignment.notes && (
          <p className="wp-assignment-notes">Note: {assignment.notes}</p>
        )}
      </div>
    </div>
  );
}

function SessionView({ session }) {
  const assignments = session.exerciseAssignments || [];
  return (
    <div className="wp-session-card wp-session-card--readonly">
      <div className="wp-session-header">
        <div className="wp-session-meta">
          <span className="wp-session-name">{session.name}</span>
          <div className="wp-session-tags">
            <span className="wp-session-day">{formatDay(session.scheduledDay)}</span>
            <span className="wp-session-exercise-count">
              {assignments.length} exercise{assignments.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
      {session.description && (
        <p className="wp-session-description">{session.description}</p>
      )}
      <div className="wp-exercise-list">
        {assignments.length === 0 ? (
          <p className="wp-exercise-empty">No exercises assigned.</p>
        ) : (
          assignments.map((a) => <AssignmentView key={a.id} assignment={a} />)
        )}
      </div>
    </div>
  );
}

function PlanView({ plan, label }) {
  const sessions = plan.sessions || [];
  return (
    <div className="wp-plan-detail">
      <div className="wp-plan-header">
        <div className="wp-plan-header-info">
          <div className="wp-plan-header-row">
            <h2 className="wp-plan-title">{plan.name}</h2>
            {label && <span className="wp-plan-label-badge">{label}</span>}
          </div>
          <div className="wp-plan-header-meta">
            {plan.startDate && (
              <span className="wp-date-range">
                {formatDateOnly(plan.startDate)}
                {plan.endDate ? ` → ${formatDateOnly(plan.endDate)}` : " → ongoing"}
              </span>
            )}
          </div>
          {plan.description && (
            <p className="wp-plan-description">{plan.description}</p>
          )}
        </div>
      </div>

      <div className="wp-sessions-area">
        {sessions.length === 0 ? (
          <p className="wp-empty-state">No sessions in this plan.</p>
        ) : (
          sessions.map((s) => <SessionView key={s.id} session={s} />)
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function TraineeWorkoutPlan() {
  const { latestNotification } = useSocket();
  const [loading, setLoading]           = useState(true);
  const [pageError, setPageError]       = useState(null);
  const [activePlan, setActivePlan]     = useState(null);
  const [allPlans, setAllPlans]         = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [historyPlan, setHistoryPlan]   = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      // Load plan summaries first
      const plans = await getMyWorkoutPlans();
      setAllPlans(plans);

      // Load active plan separately (returns full nested data)
      const hasActive = plans.some((p) => p.status === "active");
      if (hasActive) {
        try {
          const active = await getMyActiveWorkoutPlan();
          setActivePlan(active);
        } catch {
          setActivePlan(null);
        }
      } else {
        setActivePlan(null);
      }
    } catch (err) {
      setPageError(err.message || "Failed to load your workout plan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Targeted refresh when a WORKOUT_PLAN_* notification arrives for this trainee
  useEffect(() => {
    if (!latestNotification) return;
    if (latestNotification.type && latestNotification.type.startsWith("WORKOUT_PLAN_")) {
      loadData();
    }
  }, [latestNotification, loadData]);

  async function loadHistoryPlan(planId) {
    if (historyLoading) return;
    setSelectedHistoryId(planId);
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryPlan(null);
    try {
      const plan = await getWorkoutPlan(planId);
      setHistoryPlan(plan);
    } catch (err) {
      setHistoryError(err.message || "Failed to load plan.");
    } finally {
      setHistoryLoading(false);
    }
  }

  // Archived plans that can serve as history
  const archivedPlans = allPlans.filter((p) => p.status === "archived");

  if (loading) {
    return (
      <div className="page">
        <h1>My Workout Plan</h1>
        <p className="loading">Loading your workout plan…</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="page">
        <h1>My Workout Plan</h1>
        <div className="alert alert-error">{pageError}</div>
        <button className="btn btn-secondary" onClick={loadData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>My Workout Plan</h1>

      {/* Active plan */}
      <section className="wp-trainee-section">
        <h2>Current Plan</h2>
        {activePlan ? (
          <PlanView plan={activePlan} label="Active" />
        ) : (
          <div className="wp-trainee-empty">
            <p>Your trainer has not activated a workout plan for you yet.</p>
            <p className="wp-trainee-empty-sub">
              Check back later or contact your trainer.
            </p>
          </div>
        )}
      </section>

      {/* Previous plans */}
      {archivedPlans.length > 0 && (
        <section className="wp-trainee-section">
          <h2>Previous Plans</h2>
          <div className="wp-history-list">
            {archivedPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                className={`wp-history-item ${selectedHistoryId === plan.id ? "wp-history-item--active" : ""}`}
                onClick={() => loadHistoryPlan(plan.id)}
              >
                <span className="wp-history-name">{plan.name}</span>
                <span className="wp-history-dates">
                  {formatDateOnly(plan.startDate) || "—"}
                  {plan.endDate ? ` → ${formatDateOnly(plan.endDate)}` : ""}
                </span>
              </button>
            ))}
          </div>

          {historyLoading && <p className="loading">Loading plan…</p>}
          {historyError && (
            <div className="alert alert-error">{historyError}</div>
          )}
          {historyPlan && !historyLoading && (
            <PlanView plan={historyPlan} label="Archived" />
          )}
        </section>
      )}

    </div>
  );
}

export default TraineeWorkoutPlan;
