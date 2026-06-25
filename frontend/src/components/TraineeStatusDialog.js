import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "active", label: "Active — actively training" },
  { value: "paused", label: "Paused — training temporarily on hold" },
  { value: "completed", label: "Completed — training program finished" },
];

function TraineeStatusDialog({
  trainee,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}) {
  const [selectedStatus, setSelectedStatus] = useState(trainee.status);

  const traineeName = trainee.user?.firstName
    ? `${trainee.user.firstName} ${trainee.user.lastName}`
    : `Trainee #${trainee.id}`;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(selectedStatus);
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-dialog-title"
    >
      <div className="modal modal--narrow">
        <div className="modal-header">
          <h2 id="status-dialog-title" className="modal-title">
            Change Training Status
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
            disabled={submitting}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="dialog-subtitle">
            Trainee: <strong>{traineeName}</strong>
          </p>
          <p className="dialog-note">
            This changes the <strong>training program status</strong> only. It does not
            affect the trainee's login access.
          </p>

          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="ts-status">Training Status</label>
              <select
                id="ts-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={submitting}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {submitError && (
              <p className="error" role="alert">
                {submitError}
              </p>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "Updating…" : "Update Status"}
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
        </div>
      </div>
    </div>
  );
}

export default TraineeStatusDialog;
