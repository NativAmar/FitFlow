import { useState } from "react";

function GoalForm({ mode, initialData, onSubmit, onCancel, submitting, submitError }) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [fieldError, setFieldError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFieldError("Goal name is required.");
      return;
    }
    if (trimmedName.length > 100) {
      setFieldError("Goal name must be 100 characters or fewer.");
      return;
    }
    setFieldError(null);
    onSubmit({ name: trimmedName, description: description.trim() || null });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="goal-name">
          Name <span className="required-mark">*</span>
        </label>
        <input
          id="goal-name"
          type="text"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          disabled={submitting}
          placeholder="e.g. Build Strength"
          autoFocus
        />
        {fieldError && (
          <p className="field-error">{fieldError}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="goal-description">Description (optional)</label>
        <textarea
          id="goal-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
          placeholder="Brief description of this goal…"
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
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
            ? "Create Goal"
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default GoalForm;
