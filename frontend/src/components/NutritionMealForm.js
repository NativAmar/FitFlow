import { useState } from "react";

const MEAL_TYPE_OPTIONS = [
  { value: "breakfast",       label: "Breakfast" },
  { value: "morning-snack",   label: "Morning Snack" },
  { value: "lunch",           label: "Lunch" },
  { value: "afternoon-snack", label: "Afternoon Snack" },
  { value: "dinner",          label: "Dinner" },
  { value: "evening-snack",   label: "Evening Snack" },
  { value: "pre-workout",     label: "Pre-Workout" },
  { value: "post-workout",    label: "Post-Workout" },
  { value: "custom",          label: "Custom" },
];

const DAY_OPTIONS = [
  { value: "",          label: "Every day / General" },
  { value: "monday",    label: "Monday" },
  { value: "tuesday",   label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday",  label: "Thursday" },
  { value: "friday",    label: "Friday" },
  { value: "saturday",  label: "Saturday" },
  { value: "sunday",    label: "Sunday" },
];

function NutritionMealForm({
  mode = "create",
  initialData = null,
  onSubmit,
  onCancel,
  submitting = false,
  submitError = null,
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [mealType, setMealType] = useState(initialData?.mealType ?? "breakfast");
  const [dayOfWeek, setDayOfWeek] = useState(initialData?.dayOfWeek ?? "");
  // scheduledTime comes back as "HH:MM:SS" — display as "HH:MM"
  const [scheduledTime, setScheduledTime] = useState(
    initialData?.scheduledTime ? initialData.scheduledTime.slice(0, 5) : ""
  );
  const [instructions, setInstructions] = useState(initialData?.instructions ?? "");
  const [displayOrder, setDisplayOrder] = useState(
    initialData?.displayOrder != null ? String(initialData.displayOrder) : ""
  );
  const [clientError, setClientError] = useState(null);

  function validate() {
    const trimmedName = name.trim();
    if (!trimmedName) return "Name is required.";
    if (trimmedName.length > 150) return "Name must be 150 characters or fewer.";
    if (!mealType) return "Meal type is required.";
    if (instructions.trim().length > 3000) return "Instructions must be 3000 characters or fewer.";
    if (displayOrder && (isNaN(parseInt(displayOrder, 10)) || parseInt(displayOrder, 10) <= 0)) {
      return "Display order must be a positive integer.";
    }
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setClientError(err);
      return;
    }
    setClientError(null);

    const payload = {
      name: name.trim(),
      mealType,
      dayOfWeek: dayOfWeek || null,
    };

    const trimmedTime = scheduledTime.trim();
    if (trimmedTime) payload.scheduledTime = trimmedTime;
    else payload.scheduledTime = null;

    const trimmedInst = instructions.trim();
    payload.instructions = trimmedInst || null;

    if (displayOrder) {
      payload.displayOrder = parseInt(displayOrder, 10);
    }

    onSubmit(payload);
  }

  const displayError = clientError || submitError;

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="nm-form-name">Name *</label>
        <input
          id="nm-form-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setClientError(null); }}
          maxLength={150}
          placeholder="e.g. Morning Oats"
          disabled={submitting}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="nm-form-mealtype">Meal Type *</label>
        <select
          id="nm-form-mealtype"
          value={mealType}
          onChange={(e) => { setMealType(e.target.value); setClientError(null); }}
          disabled={submitting}
        >
          {MEAL_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="nm-form-day">Day of Week</label>
        <select
          id="nm-form-day"
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
          disabled={submitting}
        >
          {DAY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="nm-form-time">Scheduled Time</label>
        <input
          id="nm-form-time"
          type="time"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="nm-form-instructions">Instructions</label>
        <textarea
          id="nm-form-instructions"
          className="np-textarea"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          maxLength={3000}
          placeholder="Preparation or eating instructions (optional)"
          disabled={submitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="nm-form-order">Display Order</label>
        <input
          id="nm-form-order"
          type="number"
          min="1"
          step="1"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
          placeholder="Leave blank for auto"
          disabled={submitting}
        />
      </div>

      {displayError && (
        <div className="alert alert-error" role="alert">
          {displayError}
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Add Meal" : "Save Changes"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default NutritionMealForm;
