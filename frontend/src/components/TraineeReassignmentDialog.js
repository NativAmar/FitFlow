import { useState } from "react";

function TraineeReassignmentDialog({
  trainee,
  activeTrainers,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}) {
  const currentTrainerId = trainee.trainer?.id ?? null;

  const [selectedTrainerId, setSelectedTrainerId] = useState(
    currentTrainerId ? String(currentTrainerId) : ""
  );

  const traineeName = trainee.user?.firstName
    ? `${trainee.user.firstName} ${trainee.user.lastName}`
    : `Trainee #${trainee.id}`;

  const currentTrainer = trainee.trainer?.user
    ? `${trainee.trainer.user.firstName} ${trainee.trainer.user.lastName}`
    : currentTrainerId
    ? `Trainer #${currentTrainerId}`
    : "None";

  const isSameTrainer =
    selectedTrainerId !== "" &&
    parseInt(selectedTrainerId, 10) === currentTrainerId;

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedTrainerId || isSameTrainer) return;
    onSubmit(parseInt(selectedTrainerId, 10));
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reassign-dialog-title"
    >
      <div className="modal modal--narrow">
        <div className="modal-header">
          <h2 id="reassign-dialog-title" className="modal-title">
            Reassign Trainer
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
          <p className="info-text">
            Current trainer: <strong>{currentTrainer}</strong>
          </p>

          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="rd-trainerId">Assign to Trainer</label>
              <select
                id="rd-trainerId"
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                disabled={submitting}
              >
                <option value="">— Select a trainer —</option>
                {activeTrainers.map((trainer) => {
                  const tu = trainer.user || {};
                  const label = tu.firstName
                    ? `${tu.firstName} ${tu.lastName}`
                    : `Trainer #${trainer.id}`;
                  const spec = trainer.specialization
                    ? ` (${trainer.specialization})`
                    : "";
                  return (
                    <option key={trainer.id} value={String(trainer.id)}>
                      {label}{spec}
                    </option>
                  );
                })}
              </select>
            </div>

            {isSameTrainer && (
              <p className="info-text">
                This is already the trainee's current trainer. Select a
                different trainer to reassign.
              </p>
            )}

            {submitError && (
              <p className="error" role="alert">
                {submitError}
              </p>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !selectedTrainerId || isSameTrainer}
              >
                {submitting ? "Reassigning…" : "Confirm Reassignment"}
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

export default TraineeReassignmentDialog;
