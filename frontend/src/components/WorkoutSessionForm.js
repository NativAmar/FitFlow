import { useState } from "react";

const DAYS = [
  { value: "", label: "No fixed day" },
  { value: "monday",    label: "Monday" },
  { value: "tuesday",   label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday",  label: "Thursday" },
  { value: "friday",    label: "Friday" },
  { value: "saturday",  label: "Saturday" },
  { value: "sunday",    label: "Sunday" },
];

function WorkoutSessionForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [scheduledDay, setScheduledDay] = useState(initialData?.scheduledDay || "");
  const [displayOrder, setDisplayOrder] = useState(
    initialData?.displayOrder != null ? String(initialData.displayOrder) : ""
  );
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errors = {};
    if (!name.trim()) {
      errors.name = "Session name is required.";
    } else if (name.trim().length > 150) {
      errors.name = "Session name must be 150 characters or fewer.";
    }
    if (displayOrder !== "") {
      const n = parseInt(displayOrder, 10);
      if (isNaN(n) || n < 1 || String(n) !== displayOrder.trim()) {
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
      name: name.trim(),
      description: description.trim() || null,
      scheduledDay: scheduledDay || null,
    };
    if (displayOrder !== "") {
      payload.displayOrder = parseInt(displayOrder, 10);
    }
    onSubmit(payload);
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="session-name">
          Session Name <span className="required-mark">*</span>
        </label>
        <input
          id="session-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={150}
          disabled={submitting}
          placeholder="e.g. Push Day — Chest and Triceps"
          autoFocus
        />
        {fieldErrors.name && (
          <p className="field-error">{fieldErrors.name}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="session-description">Description</label>
        <textarea
          id="session-description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
          placeholder="Optional notes about this workout session…"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="session-day">Scheduled Day</label>
          <select
            id="session-day"
            value={scheduledDay}
            onChange={(e) => setScheduledDay(e.target.value)}
            disabled={submitting}
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="session-order">Display Order</label>
          <input
            id="session-order"
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
            ? mode === "create" ? "Creating…" : "Saving…"
            : mode === "create" ? "Add Session" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default WorkoutSessionForm;
