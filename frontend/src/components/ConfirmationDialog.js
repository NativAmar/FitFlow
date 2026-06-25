function ConfirmationDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  submitting = false,
}) {
  const confirmClass =
    confirmVariant === "danger" ? "btn btn-danger" : "btn btn-primary";

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="modal modal--narrow">
        <div className="modal-header">
          <h2 id="confirm-dialog-title" className="modal-title">
            {title}
          </h2>
        </div>
        <div className="modal-body">
          <p className="confirm-message">{message}</p>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className={confirmClass}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? "Please wait…" : confirmLabel}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;
