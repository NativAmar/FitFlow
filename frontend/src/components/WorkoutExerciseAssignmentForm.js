import { useState } from "react";
import { Link } from "react-router-dom";

function WorkoutExerciseAssignmentForm({
  mode,
  initialData,
  exercises,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}) {
  // Derive execution type from initialData
  function getInitialExecType() {
    if (!initialData) return "reps";
    if (initialData.repetitions !== null && initialData.repetitions !== undefined) return "reps";
    return "duration";
  }

  const [exerciseId, setExerciseId] = useState(
    initialData?.exerciseId ? String(initialData.exerciseId) : ""
  );
  const [sets, setSets] = useState(
    initialData?.sets != null ? String(initialData.sets) : ""
  );
  const [execType, setExecType] = useState(getInitialExecType);
  const [repetitions, setRepetitions] = useState(
    initialData?.repetitions != null ? String(initialData.repetitions) : ""
  );
  const [durationSeconds, setDurationSeconds] = useState(
    initialData?.durationSeconds != null ? String(initialData.durationSeconds) : ""
  );
  const [restSeconds, setRestSeconds] = useState(
    initialData?.restSeconds != null ? String(initialData.restSeconds) : "0"
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [displayOrder, setDisplayOrder] = useState(
    initialData?.displayOrder != null ? String(initialData.displayOrder) : ""
  );
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errors = {};
    if (!exerciseId) {
      errors.exerciseId = "Please select an exercise.";
    }
    const setsNum = parseInt(sets, 10);
    if (!sets.trim() || isNaN(setsNum) || setsNum < 1) {
      errors.sets = "Sets must be a positive whole number.";
    }
    if (execType === "reps") {
      const repsNum = parseInt(repetitions, 10);
      if (!repetitions.trim() || isNaN(repsNum) || repsNum < 1) {
        errors.repetitions = "Repetitions must be a positive whole number.";
      }
    } else {
      const durNum = parseInt(durationSeconds, 10);
      if (!durationSeconds.trim() || isNaN(durNum) || durNum < 1) {
        errors.durationSeconds = "Duration must be a positive number of seconds.";
      }
    }
    const restNum = parseInt(restSeconds, 10);
    if (restSeconds.trim() !== "" && (isNaN(restNum) || restNum < 0)) {
      errors.restSeconds = "Rest time must be 0 or more seconds.";
    }
    if (displayOrder.trim() !== "") {
      const orderNum = parseInt(displayOrder, 10);
      if (isNaN(orderNum) || orderNum < 1) {
        errors.displayOrder = "Display order must be a positive whole number.";
      }
    }
    return errors;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const payload = {
      exerciseId: parseInt(exerciseId, 10),
      sets: parseInt(sets, 10),
      repetitions: execType === "reps" ? parseInt(repetitions, 10) : null,
      durationSeconds: execType === "duration" ? parseInt(durationSeconds, 10) : null,
      restSeconds: restSeconds.trim() !== "" ? parseInt(restSeconds, 10) : 0,
      notes: notes.trim() || null,
    };
    if (displayOrder.trim() !== "") {
      payload.displayOrder = parseInt(displayOrder, 10);
    }
    onSubmit(payload);
  }

  if (exercises.length === 0) {
    return (
      <div className="wp-empty-catalog">
        <p>You have no exercises in your library yet.</p>
        <p>
          <Link to="/trainer/exercises" className="btn btn-outline btn-sm">
            Go to Exercise Library
          </Link>
        </p>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {/* Exercise */}
      <div className="form-group">
        <label htmlFor="asgn-exercise">
          Exercise <span className="required-mark">*</span>
        </label>
        <select
          id="asgn-exercise"
          value={exerciseId}
          onChange={(e) => setExerciseId(e.target.value)}
          disabled={submitting}
        >
          <option value="">Select an exercise…</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={String(ex.id)}>
              {ex.name}{ex.muscleGroup ? ` — ${ex.muscleGroup.name}` : ""}
            </option>
          ))}
        </select>
        {fieldErrors.exerciseId && (
          <p className="field-error">{fieldErrors.exerciseId}</p>
        )}
      </div>

      {/* Sets */}
      <div className="form-group">
        <label htmlFor="asgn-sets">
          Sets <span className="required-mark">*</span>
        </label>
        <input
          id="asgn-sets"
          type="number"
          min={1}
          value={sets}
          onChange={(e) => setSets(e.target.value)}
          disabled={submitting}
          placeholder="e.g. 3"
        />
        {fieldErrors.sets && (
          <p className="field-error">{fieldErrors.sets}</p>
        )}
      </div>

      {/* Execution type */}
      <div className="form-group">
        <label>Execution Type <span className="required-mark">*</span></label>
        <div className="wp-exec-type-toggle">
          <label className={`wp-toggle-option ${execType === "reps" ? "wp-toggle-option--active" : ""}`}>
            <input
              type="radio"
              name="execType"
              value="reps"
              checked={execType === "reps"}
              onChange={() => setExecType("reps")}
              disabled={submitting}
            />
            Repetitions
          </label>
          <label className={`wp-toggle-option ${execType === "duration" ? "wp-toggle-option--active" : ""}`}>
            <input
              type="radio"
              name="execType"
              value="duration"
              checked={execType === "duration"}
              onChange={() => setExecType("duration")}
              disabled={submitting}
            />
            Duration
          </label>
        </div>
      </div>

      {execType === "reps" ? (
        <div className="form-group">
          <label htmlFor="asgn-reps">
            Repetitions <span className="required-mark">*</span>
          </label>
          <input
            id="asgn-reps"
            type="number"
            min={1}
            value={repetitions}
            onChange={(e) => setRepetitions(e.target.value)}
            disabled={submitting}
            placeholder="e.g. 10"
          />
          {fieldErrors.repetitions && (
            <p className="field-error">{fieldErrors.repetitions}</p>
          )}
        </div>
      ) : (
        <div className="form-group">
          <label htmlFor="asgn-duration">
            Duration (seconds) <span className="required-mark">*</span>
          </label>
          <input
            id="asgn-duration"
            type="number"
            min={1}
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(e.target.value)}
            disabled={submitting}
            placeholder="e.g. 30"
          />
          {fieldErrors.durationSeconds && (
            <p className="field-error">{fieldErrors.durationSeconds}</p>
          )}
        </div>
      )}

      {/* Rest and order */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="asgn-rest">Rest Time (seconds)</label>
          <input
            id="asgn-rest"
            type="number"
            min={0}
            value={restSeconds}
            onChange={(e) => setRestSeconds(e.target.value)}
            disabled={submitting}
            placeholder="0"
          />
          {fieldErrors.restSeconds && (
            <p className="field-error">{fieldErrors.restSeconds}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="asgn-order">Display Order</label>
          <input
            id="asgn-order"
            type="number"
            min={1}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            disabled={submitting}
            placeholder="Auto"
          />
          {fieldErrors.displayOrder && (
            <p className="field-error">{fieldErrors.displayOrder}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="form-group">
        <label htmlFor="asgn-notes">Trainer Notes</label>
        <textarea
          id="asgn-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={submitting}
          placeholder="Optional coaching cues or notes…"
        />
      </div>

      {submitError && (
        <div className="alert alert-error">{submitError}</div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting
            ? mode === "create" ? "Adding…" : "Saving…"
            : mode === "create" ? "Add Exercise" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default WorkoutExerciseAssignmentForm;
