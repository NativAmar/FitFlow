import { formatDateTime } from "../utils/weekUtils";

const DAY_LABELS = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

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

function AssignmentRow({ assignment }) {
  const ex = assignment.exercise || {};
  const mg = ex.muscleGroup;
  return (
    <div className="wt-exercise-row">
      <div className="wt-exercise-order">{assignment.displayOrder}.</div>
      <div className="wt-exercise-body">
        <div className="wt-exercise-title">
          <span className="wt-exercise-name">{ex.name || "—"}</span>
          {mg && <span className="wt-exercise-muscle">{mg.name}</span>}
        </div>
        {ex.description && (
          <p className="wt-exercise-desc">{ex.description}</p>
        )}
        <div className="wt-exercise-meta">
          <span>
            {assignment.sets} set{assignment.sets !== 1 ? "s" : ""} × {formatExecution(assignment)}
          </span>
          <span className="wt-exercise-rest">Rest: {formatSeconds(assignment.restSeconds)}</span>
        </div>
        {assignment.notes && (
          <p className="wt-exercise-notes">Note: {assignment.notes}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Weekly workout card — editable for Trainee, read-only for Trainer.
 *
 * Props:
 *   session          — session object from tracker response
 *   editable         — true for Trainee, false for Trainer
 *   draftCompleted   — local boolean state (Trainee only)
 *   draftNotes       — local string state (Trainee only)
 *   onCompletedChange(sessionId, value) — Trainee only
 *   onNotesChange(sessionId, value)     — Trainee only
 *   onSave(sessionId)                   — Trainee only
 *   saving           — boolean (Trainee only)
 *   feedback         — { error, success } (Trainee only)
 */
function WeeklyWorkoutCard({
  session,
  editable,
  draftCompleted,
  draftNotes,
  onCompletedChange,
  onNotesChange,
  onSave,
  saving,
  feedback,
}) {
  const assignments = session.exerciseAssignments || [];
  const tracking    = session.tracking || {};
  const isCompleted = editable ? draftCompleted : tracking.isCompleted;

  return (
    <div className={`wt-session-card${isCompleted ? " wt-session-card--completed" : ""}`}>
      {/* Card header */}
      <div className="wt-session-header">
        <div className="wt-session-meta">
          <span className="wt-session-name">{session.name}</span>
          <div className="wt-session-tags">
            {session.scheduledDay && (
              <span className="wt-session-day">
                {DAY_LABELS[session.scheduledDay] || session.scheduledDay}
              </span>
            )}
            <span className="wt-session-count">
              {assignments.length} exercise{assignments.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="wt-session-status">
          {isCompleted ? (
            <span className="wt-status-badge wt-status-badge--done">✓ Completed</span>
          ) : (
            <span className="wt-status-badge wt-status-badge--pending">Pending</span>
          )}
        </div>
      </div>

      {session.description && (
        <p className="wt-session-description">{session.description}</p>
      )}

      {/* Exercise list */}
      {assignments.length > 0 && (
        <div className="wt-exercise-list">
          {assignments.map((a) => (
            <AssignmentRow key={a.id} assignment={a} />
          ))}
        </div>
      )}

      {/* Completion timestamp (read-only display when completed) */}
      {tracking.isCompleted && tracking.completedAt && !editable && (
        <p className="wt-completed-at">
          Completed: {formatDateTime(tracking.completedAt)}
        </p>
      )}
      {tracking.isCompleted && tracking.completedAt && editable && (
        <p className="wt-completed-at">
          Marked complete: {formatDateTime(tracking.completedAt)}
        </p>
      )}

      {/* Editable controls (Trainee) */}
      {editable && (
        <div className="wt-feedback">
          <label className="wt-checkbox-label">
            <input
              type="checkbox"
              checked={!!draftCompleted}
              disabled={saving}
              onChange={(e) => onCompletedChange(session.id, e.target.checked)}
            />
            <span>Completed this week</span>
          </label>

          <label className="wt-notes-label" htmlFor={`notes-${session.id}`}>
            Notes
          </label>
          <textarea
            id={`notes-${session.id}`}
            className="wt-notes-textarea"
            value={draftNotes || ""}
            placeholder="Add notes about this workout…"
            rows={3}
            maxLength={2000}
            disabled={saving}
            onChange={(e) => onNotesChange(session.id, e.target.value)}
          />

          <div className="wt-save-row">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={saving}
              onClick={() => onSave(session.id)}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {feedback?.success && (
              <span className="wt-save-success">Saved</span>
            )}
            {feedback?.error && (
              <span className="wt-save-error">{feedback.error}</span>
            )}
          </div>
        </div>
      )}

      {/* Read-only notes (Trainer view) */}
      {!editable && (
        <div className="wt-read-only-note">
          {tracking.notes ? (
            <>
              <span className="wt-note-label">Trainee note:</span>
              <p className="wt-note-text">{tracking.notes}</p>
            </>
          ) : (
            <span className="wt-note-empty">No notes recorded.</span>
          )}
        </div>
      )}
    </div>
  );
}

export default WeeklyWorkoutCard;
