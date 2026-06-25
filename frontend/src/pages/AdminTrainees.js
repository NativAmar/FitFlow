import { useState, useEffect, useCallback } from "react";
import {
  getTrainees,
  createTrainee,
  updateTrainee,
  updateTraineeStatus,
  reassignTrainee,
  deleteTrainee,
} from "../services/traineesService";
import { getTrainers } from "../services/trainersService";
import AdminTraineesTable from "../components/AdminTraineesTable";
import TraineeForm from "../components/TraineeForm";
import TraineeStatusDialog from "../components/TraineeStatusDialog";
import TraineeReassignmentDialog from "../components/TraineeReassignmentDialog";
import ConfirmationDialog from "../components/ConfirmationDialog";
import GoalAssignmentDialog from "../components/GoalAssignmentDialog";

function AdminTrainees() {
  const [trainees, setTrainees] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form modal state
  const [formMode, setFormMode] = useState(null); // null | 'create' | 'edit'
  const [editingTrainee, setEditingTrainee] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Status dialog state
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState(null);

  // Reassign dialog state
  const [reassignTarget, setReassignTarget] = useState(null);
  const [reassignSubmitting, setReassignSubmitting] = useState(false);
  const [reassignError, setReassignError] = useState(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Goal assignment dialog state
  const [goalsTarget, setGoalsTarget] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("");

  const flashSuccess = useCallback((msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }, []);

  const fetchAll = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setPageError(null);
    try {
      const [traineesData, trainersData] = await Promise.all([
        getTrainees(),
        getTrainers(),
      ]);
      setTrainees(traineesData);
      setTrainers(trainersData);
    } catch (err) {
      setPageError(err.message || "Failed to load data.");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(true);
  }, [fetchAll]);

  // Derived lookups
  const trainersById = Object.fromEntries(trainers.map((t) => [t.id, t]));
  const activeTrainers = trainers.filter((t) => t.accountStatus === "active");

  // Client-side filtering
  const filteredTrainees = trainees.filter((trainee) => {
    const u = trainee.user || {};
    const trainerUser = trainee.trainer?.user || {};
    const trainerName = trainerUser.firstName
      ? `${trainerUser.firstName} ${trainerUser.lastName}`.toLowerCase()
      : "";
    const goalNames = (trainee.goals || [])
      .map((g) => g.name.toLowerCase())
      .join(" ");
    const q = searchQuery.toLowerCase();

    if (q) {
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const displayName = (u.displayName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const matchesSearch =
        fullName.includes(q) ||
        displayName.includes(q) ||
        email.includes(q) ||
        trainerName.includes(q) ||
        goalNames.includes(q);
      if (!matchesSearch) return false;
    }

    if (statusFilter && trainee.status !== statusFilter) return false;
    if (levelFilter && trainee.experienceLevel !== levelFilter) return false;
    if (trainerFilter && String(trainee.trainer?.id) !== trainerFilter)
      return false;

    return true;
  });

  // ——— Form handlers ———

  function openCreate() {
    setEditingTrainee(null);
    setFormMode("create");
    setFormError(null);
  }

  function openEdit(trainee) {
    setEditingTrainee(trainee);
    setFormMode("edit");
    setFormError(null);
  }

  function closeForm() {
    setFormMode(null);
    setEditingTrainee(null);
    setFormError(null);
  }

  async function handleFormSubmit(payload) {
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (formMode === "create") {
        await createTrainee(payload);
        flashSuccess("Trainee created successfully.");
      } else {
        await updateTrainee(editingTrainee.id, payload);
        flashSuccess("Trainee updated successfully.");
      }
      closeForm();
      fetchAll();
    } catch (err) {
      setFormError(err.message || "An error occurred. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  }

  // ——— Status dialog handlers ———

  function openStatusDialog(trainee) {
    setStatusTarget(trainee);
    setStatusError(null);
  }

  function closeStatusDialog() {
    setStatusTarget(null);
    setStatusError(null);
  }

  async function handleStatusSubmit(newStatus) {
    setStatusSubmitting(true);
    setStatusError(null);
    try {
      await updateTraineeStatus(statusTarget.id, newStatus);
      flashSuccess("Training status updated.");
      closeStatusDialog();
      fetchAll();
    } catch (err) {
      setStatusError(err.message || "Failed to update status.");
    } finally {
      setStatusSubmitting(false);
    }
  }

  // ——— Reassign dialog handlers ———

  function openReassignDialog(trainee) {
    setReassignTarget(trainee);
    setReassignError(null);
  }

  function closeReassignDialog() {
    setReassignTarget(null);
    setReassignError(null);
  }

  async function handleReassignSubmit(trainerId) {
    setReassignSubmitting(true);
    setReassignError(null);
    try {
      await reassignTrainee(reassignTarget.id, trainerId);
      flashSuccess("Trainer reassigned successfully.");
      closeReassignDialog();
      fetchAll();
    } catch (err) {
      setReassignError(err.message || "Failed to reassign trainer.");
    } finally {
      setReassignSubmitting(false);
    }
  }

  // ——— Goal dialog handlers ———

  function openGoalsDialog(trainee) {
    setGoalsTarget(trainee);
  }

  function closeGoalsDialog() {
    setGoalsTarget(null);
  }

  // ——— Delete handlers ———

  function openDeleteConfirm(trainee) {
    setDeleteTarget(trainee);
  }

  function closeDeleteConfirm() {
    setDeleteTarget(null);
  }

  async function handleDeleteConfirm() {
    setDeleteSubmitting(true);
    try {
      await deleteTrainee(deleteTarget.id);
      const name = deleteTarget.user?.firstName
        ? `${deleteTarget.user.firstName} ${deleteTarget.user.lastName}`
        : `Trainee #${deleteTarget.id}`;
      flashSuccess(`Trainee "${name}" deleted permanently.`);
      closeDeleteConfirm();
      fetchAll();
    } catch (err) {
      setPageError(err.message || "Failed to delete trainee.");
      closeDeleteConfirm();
    } finally {
      setDeleteSubmitting(false);
    }
  }

  // ——— Render ———

  if (loading) {
    return (
      <div className="admin-trainees-section">
        <p className="loading">Loading trainees…</p>
      </div>
    );
  }

  const deleteTargetName = deleteTarget?.user?.firstName
    ? `${deleteTarget.user.firstName} ${deleteTarget.user.lastName}`
    : deleteTarget
    ? `Trainee #${deleteTarget.id}`
    : "";

  return (
    <div className="admin-trainees-section">
      <div className="page-header">
        <div>
          <h1>Trainee Management</h1>
          <p className="page-description">
            Create, edit, reassign, and manage all trainee accounts.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Add Trainee
        </button>
      </div>

      {pageError && (
        <div className="alert alert-error" role="alert">
          {pageError}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" role="status">
          {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <input
          type="text"
          className="filter-input"
          placeholder="Search by name, email, trainer, or goal…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search trainees"
        />

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by training status"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>

        <select
          className="filter-select"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          aria-label="Filter by experience level"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <select
          className="filter-select"
          value={trainerFilter}
          onChange={(e) => setTrainerFilter(e.target.value)}
          aria-label="Filter by trainer"
        >
          <option value="">All Trainers</option>
          {trainers.map((t) => {
            const tu = t.user || {};
            const label = tu.firstName
              ? `${tu.firstName} ${tu.lastName}`
              : `Trainer #${t.id}`;
            return (
              <option key={t.id} value={String(t.id)}>
                {label}
              </option>
            );
          })}
        </select>
      </div>

      <p className="table-count">
        Showing {filteredTrainees.length} of {trainees.length} trainee
        {trainees.length !== 1 ? "s" : ""}
      </p>

      <div className="table-scroll-wrapper">
        <AdminTraineesTable
          trainees={filteredTrainees}
          trainersById={trainersById}
          onEdit={openEdit}
          onStatusChange={openStatusDialog}
          onReassign={openReassignDialog}
          onDelete={openDeleteConfirm}
          onManageGoals={openGoalsDialog}
        />
      </div>

      {/* Create / Edit form modal */}
      {formMode && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trainee-form-title"
        >
          <div className="modal modal--wide">
            <div className="modal-header">
              <h2 id="trainee-form-title" className="modal-title">
                {formMode === "create" ? "Add Trainee" : "Edit Trainee"}
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={closeForm}
                disabled={formSubmitting}
                aria-label="Close form"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <TraineeForm
                key={
                  formMode === "create" ? "create" : `edit-${editingTrainee?.id}`
                }
                mode={formMode}
                initialData={editingTrainee}
                activeTrainers={activeTrainers}
                onSubmit={handleFormSubmit}
                onCancel={closeForm}
                submitting={formSubmitting}
                submitError={formError}
              />
            </div>
          </div>
        </div>
      )}

      {/* Training status dialog */}
      {statusTarget && (
        <TraineeStatusDialog
          trainee={statusTarget}
          onSubmit={handleStatusSubmit}
          onCancel={closeStatusDialog}
          submitting={statusSubmitting}
          submitError={statusError}
        />
      )}

      {/* Trainer reassignment dialog */}
      {reassignTarget && (
        <TraineeReassignmentDialog
          trainee={reassignTarget}
          activeTrainers={activeTrainers}
          onSubmit={handleReassignSubmit}
          onCancel={closeReassignDialog}
          submitting={reassignSubmitting}
          submitError={reassignError}
        />
      )}

      {/* Goal assignment dialog */}
      {goalsTarget && (
        <GoalAssignmentDialog
          trainee={goalsTarget}
          onClose={closeGoalsDialog}
          onRefresh={fetchAll}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <ConfirmationDialog
          title="Delete Trainee Permanently"
          message={
            <span className="confirm-message">
              Are you sure you want to permanently delete{" "}
              <strong>{deleteTargetName}</strong>? This will remove their account
              and all associated data. This action cannot be undone.
            </span>
          }
          confirmLabel="Delete trainee permanently"
          cancelLabel="Cancel"
          confirmVariant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={closeDeleteConfirm}
          submitting={deleteSubmitting}
        />
      )}
    </div>
  );
}

export default AdminTrainees;
