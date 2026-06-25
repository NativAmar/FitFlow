import { useState } from "react";

function NutritionPlanForm({
  mode = "create",
  initialData = null,
  onSubmit,
  onCancel,
  submitting = false,
  submitError = null,
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [generalNotes, setGeneralNotes] = useState(initialData?.generalNotes ?? "");
  const [clientError, setClientError] = useState(null);

  function validate() {
    const trimmedName = name.trim();
    if (!trimmedName) return "Name is required.";
    if (trimmedName.length > 150) return "Name must be 150 characters or fewer.";
    if (generalNotes.trim().length > 5000) return "General notes must be 5000 characters or fewer.";
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

    const payload = { name: name.trim() };
    const trimmedDesc = description.trim();
    const trimmedNotes = generalNotes.trim();
    if (trimmedDesc) payload.description = trimmedDesc;
    else payload.description = null;
    if (trimmedNotes) payload.generalNotes = trimmedNotes;
    else payload.generalNotes = null;

    onSubmit(payload);
  }

  const displayError = clientError || submitError;

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="np-form-name">Name *</label>
        <input
          id="np-form-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setClientError(null); }}
          maxLength={150}
          placeholder="e.g. Weight Loss Phase 1"
          disabled={submitting}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="np-form-description">Description</label>
        <input
          id="np-form-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          disabled={submitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="np-form-notes">General Notes</label>
        <textarea
          id="np-form-notes"
          className="np-textarea"
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder="Overall notes for this nutrition plan (optional)"
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
          {submitting ? "Saving…" : mode === "create" ? "Create Plan" : "Save Changes"}
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

export default NutritionPlanForm;
