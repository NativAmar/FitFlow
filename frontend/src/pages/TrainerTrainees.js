import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTrainees,
  createTrainee,
  updateTrainee,
  updateTraineeStatus,
} from "../services/traineesService";
import TrainerTraineesTable from "../components/TrainerTraineesTable";
import TraineeForm from "../components/TraineeForm";
import TraineeStatusDialog from "../components/TraineeStatusDialog";
import GoalAssignmentDialog from "../components/GoalAssignmentDialog";

function TrainerTrainees() {
  const navigate = useNavigate();
  const [trainees, setTrainees] = useState([]);
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

  // Goal assignment dialog state
  const [goalsTarget, setGoalsTarget] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const flashSuccess = useCallback((msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }, []);

  const fetchTrainees = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setPageError(null);
    try {
      const data = await getTrainees();
      setTrainees(data);
    } catch (err) {
      setPageError(err.message || "Failed to load trainees.");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainees(true);
  }, [fetchTrainees]);

  // Client-side filtering — operates on already-loaded owned trainees only
  const filteredTrainees = trainees.filter((trainee) => {
    const u = trainee.user || {};
    const goalNames = (trainee.goals || [])
      .map((g) => g.name.toLowerCase())
      .join(" ");
    const q = searchQuery.toLowerCase();

    if (q) {
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const displayNameVal = (u.displayName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const matches =
        fullName.includes(q) ||
        displayNameVal.includes(q) ||
        email.includes(q) ||
        goalNames.includes(q);
      if (!matches) return false;
    }

    if (statusFilter && trainee.status !== statusFilter) return false;
    if (levelFilter && trainee.experienceLevel !== levelFilter) return false;

    return true;
  });

  const hasActiveFilters = searchQuery || statusFilter || levelFilter;

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("");
    setLevelFilter("");
  }

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
      fetchTrainees();
    } catch (err) {
      // Keep form open so user can correct the error
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
      fetchTrainees();
    } catch (err) {
      setStatusError(err.message || "Failed to update status.");
    } finally {
      setStatusSubmitting(false);
    }
  }

  // ——— Goal dialog handlers ———

  function openGoalsDialog(trainee) {
    setGoalsTarget(trainee);
  }

  function closeGoalsDialog() {
    setGoalsTarget(null);
  }

  // ——— Workout Plans navigation ———

  function openWorkoutPlans(trainee) {
    navigate(`/trainer/trainees/${trainee.id}/workout-plans`);
  }

  // ——— Weekly Tracking navigation ———

  function openTracking(trainee) {
    navigate(`/trainer/trainees/${trainee.id}/tracking`);
  }

  // ——— Nutrition Plans navigation ———

  function openNutritionPlans(trainee) {
    navigate(`/trainer/trainees/${trainee.id}/nutrition-plans`);
  }

  // ——— Render ———

  if (loading) {
    return (
      <div className="trainer-trainees-section">
        <p className="loading">Loading trainees…</p>
      </div>
    );
  }

  return (
    <div className="trainer-trainees-section">
      <div className="page-header">
        <div>
          <h1>My Trainees</h1>
          <p className="page-description">
            Showing only trainees assigned to you.
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
          placeholder="Search by name, email, or goal…"
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

        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        )}
      </div>

      <p className="table-count">
        Showing {filteredTrainees.length} of {trainees.length} trainee
        {trainees.length !== 1 ? "s" : ""}
      </p>

      <div className="table-scroll-wrapper">
        <TrainerTraineesTable
          trainees={filteredTrainees}
          onEdit={openEdit}
          onStatusChange={openStatusDialog}
          onManageGoals={openGoalsDialog}
          onWorkoutPlans={openWorkoutPlans}
          onTracking={openTracking}
          onNutritionPlans={openNutritionPlans}
        />
      </div>

      {/* Create / Edit form modal */}
      {formMode && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trainer-trainee-form-title"
        >
          <div className="modal modal--wide">
            <div className="modal-header">
              <h2 id="trainer-trainee-form-title" className="modal-title">
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
                  formMode === "create"
                    ? "trainer-create"
                    : `trainer-edit-${editingTrainee?.id}`
                }
                mode={formMode}
                initialData={editingTrainee}
                activeTrainers={[]}
                roleMode="trainer"
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

      {/* Goal assignment dialog */}
      {goalsTarget && (
        <GoalAssignmentDialog
          trainee={goalsTarget}
          onClose={closeGoalsDialog}
          onRefresh={fetchTrainees}
        />
      )}
    </div>
  );
}

export default TrainerTrainees;
