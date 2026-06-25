import { useEffect, useState, useCallback } from "react";
import TrainersTable from "../components/TrainersTable";
import TrainerForm from "../components/TrainerForm";
import ConfirmationDialog from "../components/ConfirmationDialog";
import {
  getTrainers,
  createTrainer,
  updateTrainer,
  updateTrainerStatus,
} from "../services/trainersService";

function AdminTrainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal / form state
  const [formMode, setFormMode] = useState(null); // null | 'create' | 'edit'
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Confirmation dialog state
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  // Client-side filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchTrainers = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setPageError("");
    try {
      const data = await getTrainers();
      setTrainers(data);
    } catch (err) {
      setPageError(err.message || "Failed to load trainers.");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainers(true);
  }, [fetchTrainers]);

  function flashSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  // ── Form handlers ────────────────────────────────────────────────────────────

  function openCreate() {
    setEditingTrainer(null);
    setFormError("");
    setFormMode("create");
  }

  function openEdit(trainer) {
    setEditingTrainer(trainer);
    setFormError("");
    setFormMode("edit");
  }

  function closeForm() {
    setFormMode(null);
    setEditingTrainer(null);
    setFormError("");
  }

  async function handleFormSubmit(payload) {
    setFormSubmitting(true);
    setFormError("");
    try {
      if (formMode === "create") {
        await createTrainer(payload);
        closeForm();
        flashSuccess("Trainer created successfully.");
      } else {
        await updateTrainer(editingTrainer.id, payload);
        closeForm();
        flashSuccess("Trainer updated successfully.");
      }
      await fetchTrainers();
    } catch (err) {
      setFormError(err.message || "Failed to save trainer.");
    } finally {
      setFormSubmitting(false);
    }
  }

  // ── Status change handlers ───────────────────────────────────────────────────

  function promptStatusChange(trainer) {
    setConfirmTarget(trainer);
  }

  async function handleStatusConfirm() {
    if (!confirmTarget) return;
    const newStatus =
      confirmTarget.accountStatus === "active" ? "inactive" : "active";
    setConfirmSubmitting(true);
    try {
      await updateTrainerStatus(confirmTarget.id, newStatus);
      const action = newStatus === "inactive" ? "deactivated" : "activated";
      const name =
        confirmTarget.user?.firstName
          ? `${confirmTarget.user.firstName} ${confirmTarget.user.lastName}`
          : `Trainer #${confirmTarget.id}`;
      setConfirmTarget(null);
      flashSuccess(`${name} was ${action} successfully.`);
      await fetchTrainers();
    } catch (err) {
      setPageError(err.message || "Failed to update trainer status.");
      setConfirmTarget(null);
    } finally {
      setConfirmSubmitting(false);
    }
  }

  // ── Client-side filtering ────────────────────────────────────────────────────

  const q = searchQuery.toLowerCase();
  const filteredTrainers = trainers.filter((trainer) => {
    const u = trainer.user || {};
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const spec = (trainer.specialization || "").toLowerCase();

    const matchesSearch =
      !q || fullName.includes(q) || email.includes(q) || spec.includes(q);

    const matchesStatus =
      statusFilter === "all" || trainer.accountStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ── Confirmation dialog content ──────────────────────────────────────────────

  const isDeactivating = confirmTarget?.accountStatus === "active";
  const trainerName =
    confirmTarget?.user?.firstName
      ? `${confirmTarget.user.firstName} ${confirmTarget.user.lastName}`
      : "this trainer";

  const confirmTitle = isDeactivating ? "Deactivate Trainer" : "Activate Trainer";
  const confirmMessage = isDeactivating
    ? `Deactivating ${trainerName} will block them from logging in. Their trainer profile and assigned trainees remain unchanged. You can reactivate their account at any time.`
    : `Activating ${trainerName} will restore their login access. Their trainer profile and assigned trainees remain unchanged.`;
  const confirmLabel = isDeactivating ? "Deactivate" : "Activate";
  const confirmVariant = isDeactivating ? "danger" : "primary";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Trainer Management</h1>
          <p className="page-description">
            View, create, and manage trainer accounts.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Create Trainer
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success" role="status" aria-live="polite">
          {successMsg}
        </div>
      )}

      {pageError && (
        <div className="alert alert-error" role="alert">
          {pageError}
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <input
          type="search"
          className="filter-input"
          placeholder="Search by name, email, or specialization…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search trainers"
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by account status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table section */}
      {loading ? (
        <p className="loading">Loading trainers…</p>
      ) : trainers.length === 0 ? (
        <p className="empty-state">
          No trainers found.{" "}
          <button type="button" className="btn-link" onClick={openCreate}>
            Create the first trainer.
          </button>
        </p>
      ) : filteredTrainers.length === 0 ? (
        <p className="empty-state">No trainers match the current filters.</p>
      ) : (
        <section className="trainers-table-section">
          <TrainersTable
            trainers={filteredTrainers}
            onEdit={openEdit}
            onStatusChange={promptStatusChange}
          />
          <p className="table-count">
            Showing {filteredTrainers.length} of {trainers.length} trainer
            {trainers.length !== 1 ? "s" : ""}
          </p>
        </section>
      )}

      {/* Create / Edit modal */}
      {formMode && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trainer-form-title"
        >
          <div className="modal">
            <div className="modal-header">
              <h2 id="trainer-form-title" className="modal-title">
                {formMode === "create" ? "Create Trainer" : "Edit Trainer"}
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={closeForm}
                disabled={formSubmitting}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <TrainerForm
                key={
                  formMode === "create"
                    ? "create"
                    : `edit-${editingTrainer?.id}`
                }
                mode={formMode}
                initialData={editingTrainer}
                onSubmit={handleFormSubmit}
                onCancel={closeForm}
                submitting={formSubmitting}
                submitError={formError}
              />
            </div>
          </div>
        </div>
      )}

      {/* Status confirmation dialog */}
      {confirmTarget && (
        <ConfirmationDialog
          title={confirmTitle}
          message={confirmMessage}
          confirmLabel={confirmLabel}
          confirmVariant={confirmVariant}
          onConfirm={handleStatusConfirm}
          onCancel={() => setConfirmTarget(null)}
          submitting={confirmSubmitting}
        />
      )}
    </div>
  );
}

export default AdminTrainers;
