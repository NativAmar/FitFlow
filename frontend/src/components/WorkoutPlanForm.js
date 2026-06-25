import { useState } from "react";

function WorkoutPlanForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errors = {};
    const trimmed = name.trim();
    if (!trimmed) {
      errors.name = "Plan name is required.";
    } else if (trimmed.length > 150) {
      errors.name = "Plan name must be 150 characters or fewer.";
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
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="plan-name">
          Plan Name <span className="required-mark">*</span>
        </label>
        <input
          id="plan-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={150}
          disabled={submitting}
          placeholder="e.g. Push Pull Legs"
          autoFocus
        />
        {fieldErrors.name && (
          <p className="field-error">{fieldErrors.name}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="plan-description">Description</label>
        <textarea
          id="plan-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
          placeholder="Optional description of this plan's goals or structure…"
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
            ? mode === "create" ? "Creating…" : "Saving…"
            : mode === "create" ? "Create Plan" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default WorkoutPlanForm;
