// ── Formatting helpers ────────────────────────────────────────────────────────

const DAY_LABELS = {
  monday:    "Monday",
  tuesday:   "Tuesday",
  wednesday: "Wednesday",
  thursday:  "Thursday",
  friday:    "Friday",
  saturday:  "Saturday",
  sunday:    "Sunday",
};

function formatDay(day) {
  return day ? (DAY_LABELS[day] || day) : null;
}

function formatSeconds(secs) {
  if (secs === null || secs === undefined) return "—";
  if (secs === 0) return "No rest";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function formatExecution(a) {
  const hasReps = a.repetitions !== null && a.repetitions !== undefined;
  const hasDur  = a.durationSeconds !== null && a.durationSeconds !== undefined;
  if (hasReps && hasDur) return `${a.repetitions} reps / ${formatSeconds(a.durationSeconds)}`;
  if (hasReps)  return `${a.repetitions} reps`;
  if (hasDur)   return formatSeconds(a.durationSeconds);
  return "—";
}

// ── Assignment row ────────────────────────────────────────────────────────────

function AssignmentRow({ assignment, isArchived, onEdit, onRemove }) {
  const ex = assignment.exercise || {};
  const mg = ex.muscleGroup;

  return (
    <div className="wp-assignment-row">
      <div className="wp-assignment-order">{assignment.displayOrder}.</div>
      <div className="wp-assignment-body">
        <div className="wp-assignment-title">
          <span className="wp-assignment-name">{ex.name || "Unknown exercise"}</span>
          {mg && <span className="wp-assignment-muscle">{mg.name}</span>}
        </div>
        <div className="wp-assignment-meta">
          <span>{assignment.sets} sets × {formatExecution(assignment)}</span>
          <span className="wp-assignment-rest">Rest: {formatSeconds(assignment.restSeconds)}</span>
        </div>
        {assignment.notes && (
          <p className="wp-assignment-notes">{assignment.notes}</p>
        )}
      </div>
      {!isArchived && (
        <div className="wp-assignment-actions">
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => onEdit(assignment)}
            aria-label={`Edit assignment for ${ex.name}`}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => onRemove(assignment)}
            aria-label={`Remove ${ex.name} from session`}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ── Session card ──────────────────────────────────────────────────────────────

function WorkoutSessionCard({
  session,
  isArchived,
  onEdit,
  onDelete,
  onAddAssignment,
  onEditAssignment,
  onRemoveAssignment,
}) {
  const dayLabel = formatDay(session.scheduledDay);
  const assignments = session.exerciseAssignments || [];

  return (
    <div className="wp-session-card">
      <div className="wp-session-header">
        <div className="wp-session-meta">
          <span className="wp-session-name">{session.name}</span>
          <div className="wp-session-tags">
            {dayLabel && (
              <span className="wp-session-day">{dayLabel}</span>
            )}
            <span className="wp-session-order">Order {session.displayOrder}</span>
            <span className="wp-session-exercise-count">
              {assignments.length} exercise{assignments.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {!isArchived && (
          <div className="wp-session-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => onEdit(session)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => onDelete(session)}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {session.description && (
        <p className="wp-session-description">{session.description}</p>
      )}

      <div className="wp-exercise-list">
        {assignments.length === 0 ? (
          <p className="wp-exercise-empty">
            No exercises yet.{!isArchived && " Add one below."}
          </p>
        ) : (
          assignments.map((a) => (
            <AssignmentRow
              key={a.id}
              assignment={a}
              isArchived={isArchived}
              onEdit={onEditAssignment}
              onRemove={onRemoveAssignment}
            />
          ))
        )}
      </div>

      {!isArchived && (
        <button
          type="button"
          className="btn btn-sm btn-outline wp-add-exercise-btn"
          onClick={() => onAddAssignment(session)}
        >
          + Add Exercise
        </button>
      )}
    </div>
  );
}

export default WorkoutSessionCard;
