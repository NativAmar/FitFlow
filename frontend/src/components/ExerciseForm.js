import { useState } from "react";

function ExerciseForm({
  mode,
  initialData,
  muscleGroups,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [muscleGroupId, setMuscleGroupId] = useState(
    initialData?.muscleGroup?.id ? String(initialData.muscleGroup.id) : ""
  );
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errors = {};
    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = "Exercise name is required.";
    } else if (trimmedName.length > 150) {
      errors.name = "Exercise name must be 150 characters or fewer.";
    }
    if (!muscleGroupId) {
      errors.muscleGroupId = "Muscle group is required.";
    }
    if (!description.trim()) {
      errors.description = "Description is required.";
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
      description: description.trim(),
      muscleGroupId: parseInt(muscleGroupId, 10),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="exercise-name">
          Name <span className="required-mark">*</span>
        </label>
        <input
          id="exercise-name"
          type="text"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={150}
          disabled={submitting}
          placeholder="e.g. Bench Press"
          autoFocus
        />
        {fieldErrors.name && (
          <p className="field-error">{fieldErrors.name}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="exercise-muscle-group">
          Muscle Group <span className="required-mark">*</span>
        </label>
        <select
          id="exercise-muscle-group"
          className="form-input"
          value={muscleGroupId}
          onChange={(e) => setMuscleGroupId(e.target.value)}
          disabled={submitting}
        >
          <option value="">Select a muscle group…</option>
          {muscleGroups.map((mg) => (
            <option key={mg.id} value={String(mg.id)}>
              {mg.name}
            </option>
          ))}
        </select>
        {fieldErrors.muscleGroupId && (
          <p className="field-error">{fieldErrors.muscleGroupId}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="exercise-description">
          Description <span className="required-mark">*</span>
        </label>
        <textarea
          id="exercise-description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
          placeholder="Describe the exercise, technique, and cues…"
        />
        {fieldErrors.description && (
          <p className="field-error">{fieldErrors.description}</p>
        )}
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
            ? "Create Exercise"
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default ExerciseForm;
