import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getTraineeWorkoutPlans,
  createWorkoutPlan,
  getWorkoutPlan,
  updateWorkoutPlan,
  changeWorkoutPlanStatus,
  deleteWorkoutPlan,
  createWorkoutSession,
  updateWorkoutSession,
  deleteWorkoutSession,
  createWorkoutExerciseAssignment,
  updateWorkoutExerciseAssignment,
  deleteWorkoutExerciseAssignment,
} from "../services/workoutPlansService";
import { getTraineeById } from "../services/traineesService";
import { getExercises } from "../services/exercisesService";
import WorkoutPlanForm from "../components/WorkoutPlanForm";
import WorkoutSessionForm from "../components/WorkoutSessionForm";
import WorkoutExerciseAssignmentForm from "../components/WorkoutExerciseAssignmentForm";
import WorkoutSessionCard from "../components/WorkoutSessionCard";
import ConfirmationDialog from "../components/ConfirmationDialog";

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatDateOnly(str) {
  if (!str) return null;
  const parts = str.split("-");
  if (parts.length !== 3) return str;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (!y || !m || !d) return str;
  return `${months[m - 1]} ${d}, ${y}`;
}

// Map backend error codes to user-friendly messages
function friendlyError(err) {
  const codeMap = {
    WORKOUT_PLAN_EMPTY:           "This plan must have at least one workout session before it can be activated.",
    WORKOUT_SESSION_EMPTY:        "Every workout session must have at least one exercise before the plan can be activated.",
    WORKOUT_PLAN_ARCHIVED:        "This plan is archived and cannot be modified.",
    INVALID_PLAN_STATUS_TRANSITION: "This status change is not allowed for the current plan state.",
    WORKOUT_PLAN_DELETE_RESTRICTED: "Only draft plans can be deleted.",
    EXERCISE_NOT_OWNED_BY_TRAINER:  "The selected exercise does not belong to this trainee's current trainer.",
    EXERCISE_NOT_FOUND:           "Exercise not found.",
    FORBIDDEN:                    "You do not have permission to perform this action.",
  };
  if (err.code && codeMap[err.code]) return codeMap[err.code];
  return err.message || "An unexpected error occurred.";
}

// ── Status badge ──────────────────────────────────────────────────────────────

function PlanStatusBadge({ status }) {
  return (
    <span className={`status-badge wp-status-${status}`}>
      {status}
    </span>
  );
}

// ── Plan summary card ─────────────────────────────────────────────────────────

function PlanSummaryCard({ plan, isSelected, onSelect, onActivate, onArchive, onDelete }) {
  const isDraft    = plan.status === "draft";
  const isActive   = plan.status === "active";
  const isArchived = plan.status === "archived";

  return (
    <div
      className={`wp-plan-card ${isSelected ? "wp-plan-card--selected" : ""}`}
      onClick={() => onSelect(plan)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(plan)}
    >
      <div className="wp-plan-card-header">
        <span className="wp-plan-card-name">{plan.name}</span>
        <PlanStatusBadge status={plan.status} />
      </div>

      {plan.description && (
        <p className="wp-plan-card-desc">{plan.description}</p>
      )}

      <div className="wp-plan-card-meta">
        <span>{plan.sessionCount} session{plan.sessionCount !== 1 ? "s" : ""}</span>
        {plan.startDate && (
          <span>Started {formatDateOnly(plan.startDate)}</span>
        )}
        {isArchived && plan.endDate && (
          <span>Ended {formatDateOnly(plan.endDate)}</span>
        )}
      </div>

      <div className="wp-plan-card-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => onSelect(plan)}
        >
          {isArchived ? "View" : "Open"}
        </button>
        {isDraft && (
          <button
            type="button"
            className="btn btn-sm btn-accent"
            onClick={() => onActivate(plan)}
          >
            Activate
          </button>
        )}
        {(isDraft || isActive) && (
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => onArchive(plan)}
          >
            Archive
          </button>
        )}
        {isDraft && (
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => onDelete(plan)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function TrainerWorkoutPlans() {
  const { traineeId } = useParams();
  const traineeIdNum = parseInt(traineeId, 10);

  // Page-level state
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [traineeInfo, setTraineeInfo] = useState(null);
  const [plans, setPlans] = useState([]);
  const [exercises, setExercises] = useState([]);

  // Selected plan
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [fullPlan, setFullPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(null);

  // Modal: { type, target?, parentId? }
  const [modal, setModal] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Confirm dialog: { type, target, submitting, error }
  const [confirm, setConfirm] = useState(null);

  // ── Flash ──

  const flashSuccess = useCallback((msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }, []);

  // ── Load page data ──

  const loadPageData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setPageError(null);
    try {
      const [trainee, planList, exerciseList] = await Promise.all([
        getTraineeById(traineeIdNum),
        getTraineeWorkoutPlans(traineeIdNum),
        getExercises(),
      ]);
      setTraineeInfo(trainee);
      setPlans(planList);
      setExercises(exerciseList);
    } catch (err) {
      setPageError(friendlyError(err));
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [traineeIdNum]);

  useEffect(() => {
    loadPageData(true);
  }, [loadPageData]);

  // ── Load full plan ──

  const loadFullPlan = useCallback(async (planId) => {
    setPlanLoading(true);
    setPlanError(null);
    try {
      const plan = await getWorkoutPlan(planId);
      setFullPlan(plan);
    } catch (err) {
      setPlanError(friendlyError(err));
      setFullPlan(null);
    } finally {
      setPlanLoading(false);
    }
  }, []);

  function selectPlan(plan) {
    setSelectedPlanId(plan.id);
    loadFullPlan(plan.id);
    setModal(null);
  }

  // Reload plan summaries + refresh full plan if one is selected
  const refreshAll = useCallback(async () => {
    try {
      const [planList, exerciseList] = await Promise.all([
        getTraineeWorkoutPlans(traineeIdNum),
        getExercises(),
      ]);
      setPlans(planList);
      setExercises(exerciseList);
    } catch (err) {
      setPageError(friendlyError(err));
    }
  }, [traineeIdNum]);

  const refreshPlan = useCallback(async (planId) => {
    const id = planId || selectedPlanId;
    if (!id) return;
    await loadFullPlan(id);
  }, [selectedPlanId, loadFullPlan]);

  // ── Plan CRUD ──

  function openCreatePlan() {
    setModal({ type: "createPlan" });
    setModalError(null);
  }

  async function handleCreatePlan(payload) {
    setModalSubmitting(true);
    setModalError(null);
    try {
      const created = await createWorkoutPlan(traineeIdNum, payload);
      setModal(null);
      flashSuccess(`Plan "${created.name}" created.`);
      await refreshAll();
      // Auto-select the new plan
      setSelectedPlanId(created.id);
      await loadFullPlan(created.id);
    } catch (err) {
      setModalError(friendlyError(err));
    } finally {
      setModalSubmitting(false);
    }
  }

  function openEditPlan() {
    if (!fullPlan) return;
    setModal({ type: "editPlan" });
    setModalError(null);
  }

  async function handleEditPlan(payload) {
    setModalSubmitting(true);
    setModalError(null);
    try {
      await updateWorkoutPlan(selectedPlanId, payload);
      setModal(null);
      flashSuccess("Plan updated.");
      await Promise.all([refreshAll(), refreshPlan()]);
    } catch (err) {
      setModalError(friendlyError(err));
    } finally {
      setModalSubmitting(false);
    }
  }

  // Activate
  function openActivateConfirm(plan) {
    setConfirm({ type: "activate", target: plan, submitting: false, error: null });
  }

  async function handleActivate() {
    const plan = confirm.target;
    setConfirm((c) => ({ ...c, submitting: true, error: null }));
    try {
      await changeWorkoutPlanStatus(plan.id, "active");
      setConfirm(null);
      flashSuccess(`Plan "${plan.name}" activated.`);
      // Refresh all summaries (another plan may have been archived)
      await refreshAll();
      // If activating the currently selected plan, refresh it
      if (selectedPlanId === plan.id) await refreshPlan();
      else {
        // Select the now-active plan
        setSelectedPlanId(plan.id);
        await loadFullPlan(plan.id);
      }
    } catch (err) {
      setConfirm((c) => ({ ...c, submitting: false, error: friendlyError(err) }));
    }
  }

  // Archive
  function openArchiveConfirm(plan) {
    setConfirm({ type: "archive", target: plan, submitting: false, error: null });
  }

  async function handleArchive() {
    const plan = confirm.target;
    setConfirm((c) => ({ ...c, submitting: true, error: null }));
    try {
      await changeWorkoutPlanStatus(plan.id, "archived");
      setConfirm(null);
      flashSuccess(`Plan "${plan.name}" archived.`);
      await refreshAll();
      if (selectedPlanId === plan.id) await refreshPlan();
    } catch (err) {
      setConfirm((c) => ({ ...c, submitting: false, error: friendlyError(err) }));
    }
  }

  // Delete
  function openDeleteConfirm(plan) {
    setConfirm({ type: "deletePlan", target: plan, submitting: false, error: null });
  }

  async function handleDeletePlan() {
    const plan = confirm.target;
    setConfirm((c) => ({ ...c, submitting: true, error: null }));
    try {
      await deleteWorkoutPlan(plan.id);
      setConfirm(null);
      flashSuccess(`Plan "${plan.name}" deleted.`);
      if (selectedPlanId === plan.id) {
        setSelectedPlanId(null);
        setFullPlan(null);
      }
      await refreshAll();
    } catch (err) {
      setConfirm((c) => ({ ...c, submitting: false, error: friendlyError(err) }));
    }
  }

  // ── Session CRUD ──

  function openCreateSession() {
    setModal({ type: "createSession" });
    setModalError(null);
  }

  async function handleCreateSession(payload) {
    setModalSubmitting(true);
    setModalError(null);
    try {
      await createWorkoutSession(selectedPlanId, payload);
      setModal(null);
      flashSuccess("Session added.");
      await Promise.all([refreshAll(), refreshPlan()]);
    } catch (err) {
      setModalError(friendlyError(err));
    } finally {
      setModalSubmitting(false);
    }
  }

  function openEditSession(session) {
    setModal({ type: "editSession", target: session });
    setModalError(null);
  }

  async function handleEditSession(payload) {
    setModalSubmitting(true);
    setModalError(null);
    try {
      await updateWorkoutSession(modal.target.id, payload);
      setModal(null);
      flashSuccess("Session updated.");
      await refreshPlan();
    } catch (err) {
      setModalError(friendlyError(err));
    } finally {
      setModalSubmitting(false);
    }
  }

  function openDeleteSession(session) {
    setConfirm({ type: "deleteSession", target: session, submitting: false, error: null });
  }

  async function handleDeleteSession() {
    const session = confirm.target;
    setConfirm((c) => ({ ...c, submitting: true, error: null }));
    try {
      await deleteWorkoutSession(session.id);
      setConfirm(null);
      flashSuccess(`Session "${session.name}" deleted.`);
      await Promise.all([refreshAll(), refreshPlan()]);
    } catch (err) {
      setConfirm((c) => ({ ...c, submitting: false, error: friendlyError(err) }));
    }
  }

  // ── Assignment CRUD ──

  function openCreateAssignment(session) {
    setModal({ type: "createAssignment", parentId: session.id });
    setModalError(null);
  }

  async function handleCreateAssignment(payload) {
    setModalSubmitting(true);
    setModalError(null);
    try {
      await createWorkoutExerciseAssignment(modal.parentId, payload);
      setModal(null);
      flashSuccess("Exercise added.");
      await Promise.all([refreshAll(), refreshPlan()]);
    } catch (err) {
      setModalError(friendlyError(err));
    } finally {
      setModalSubmitting(false);
    }
  }

  function openEditAssignment(assignment) {
    setModal({ type: "editAssignment", target: assignment });
    setModalError(null);
  }

  async function handleEditAssignment(payload) {
    setModalSubmitting(true);
    setModalError(null);
    try {
      await updateWorkoutExerciseAssignment(modal.target.id, payload);
      setModal(null);
      flashSuccess("Exercise updated.");
      await refreshPlan();
    } catch (err) {
      setModalError(friendlyError(err));
    } finally {
      setModalSubmitting(false);
    }
  }

  function openRemoveAssignment(assignment) {
    setConfirm({ type: "removeAssignment", target: assignment, submitting: false, error: null });
  }

  async function handleRemoveAssignment() {
    const assignment = confirm.target;
    setConfirm((c) => ({ ...c, submitting: true, error: null }));
    try {
      await deleteWorkoutExerciseAssignment(assignment.id);
      setConfirm(null);
      flashSuccess("Exercise removed from session.");
      await Promise.all([refreshAll(), refreshPlan()]);
    } catch (err) {
      setConfirm((c) => ({ ...c, submitting: false, error: friendlyError(err) }));
    }
  }

  // ── Confirm dispatch ──

  function handleConfirm() {
    if (!confirm) return;
    const t = confirm.type;
    if (t === "activate")        return handleActivate();
    if (t === "archive")         return handleArchive();
    if (t === "deletePlan")      return handleDeletePlan();
    if (t === "deleteSession")   return handleDeleteSession();
    if (t === "removeAssignment") return handleRemoveAssignment();
  }

  // ── Confirm dialog config ──

  function confirmConfig() {
    if (!confirm) return {};
    const { type, target } = confirm;
    if (type === "activate") {
      return {
        title: "Activate Plan",
        message: `Activate "${target.name}"? Any currently active plan for this trainee will be automatically archived.`,
        confirmLabel: "Activate",
        confirmVariant: "primary",
      };
    }
    if (type === "archive") {
      return {
        title: "Archive Plan",
        message: `Archive "${target.name}"? The plan will become read-only and cannot be edited.`,
        confirmLabel: "Archive",
        confirmVariant: "danger",
      };
    }
    if (type === "deletePlan") {
      return {
        title: "Delete Plan",
        message: `Permanently delete "${target.name}"? This will also delete all its sessions and exercise assignments. Your Exercise Library is not affected.`,
        confirmLabel: "Delete Plan",
        confirmVariant: "danger",
      };
    }
    if (type === "deleteSession") {
      return {
        title: "Delete Session",
        message: `Delete "${target.name}"? All exercise assignments in this session will be removed. Exercises in your library are not deleted.`,
        confirmLabel: "Delete Session",
        confirmVariant: "danger",
      };
    }
    if (type === "removeAssignment") {
      const exName = target.exercise?.name || "this exercise";
      return {
        title: "Remove Exercise",
        message: `Remove ${exName} from this session? The exercise remains in your library and can be re-added.`,
        confirmLabel: "Remove",
        confirmVariant: "danger",
      };
    }
    return {};
  }

  // ── Modal config ──

  function closeModal() {
    setModal(null);
    setModalError(null);
  }

  function modalTitle() {
    if (!modal) return "";
    const t = modal.type;
    if (t === "createPlan")       return "New Workout Plan";
    if (t === "editPlan")         return "Edit Plan";
    if (t === "createSession")    return "Add Session";
    if (t === "editSession")      return "Edit Session";
    if (t === "createAssignment") return "Add Exercise";
    if (t === "editAssignment")   return "Edit Exercise";
    return "";
  }

  function modalContent() {
    if (!modal) return null;
    const t = modal.type;

    if (t === "createPlan") {
      return (
        <WorkoutPlanForm
          key="create-plan"
          mode="create"
          onSubmit={handleCreatePlan}
          onCancel={closeModal}
          submitting={modalSubmitting}
          submitError={modalError}
        />
      );
    }
    if (t === "editPlan") {
      return (
        <WorkoutPlanForm
          key={`edit-plan-${fullPlan?.id}`}
          mode="edit"
          initialData={fullPlan}
          onSubmit={handleEditPlan}
          onCancel={closeModal}
          submitting={modalSubmitting}
          submitError={modalError}
        />
      );
    }
    if (t === "createSession") {
      return (
        <WorkoutSessionForm
          key="create-session"
          mode="create"
          onSubmit={handleCreateSession}
          onCancel={closeModal}
          submitting={modalSubmitting}
          submitError={modalError}
        />
      );
    }
    if (t === "editSession") {
      return (
        <WorkoutSessionForm
          key={`edit-session-${modal.target?.id}`}
          mode="edit"
          initialData={modal.target}
          onSubmit={handleEditSession}
          onCancel={closeModal}
          submitting={modalSubmitting}
          submitError={modalError}
        />
      );
    }
    if (t === "createAssignment") {
      return (
        <WorkoutExerciseAssignmentForm
          key={`create-asgn-${modal.parentId}`}
          mode="create"
          exercises={exercises}
          onSubmit={handleCreateAssignment}
          onCancel={closeModal}
          submitting={modalSubmitting}
          submitError={modalError}
        />
      );
    }
    if (t === "editAssignment") {
      return (
        <WorkoutExerciseAssignmentForm
          key={`edit-asgn-${modal.target?.id}`}
          mode="edit"
          initialData={modal.target}
          exercises={exercises}
          onSubmit={handleEditAssignment}
          onCancel={closeModal}
          submitting={modalSubmitting}
          submitError={modalError}
        />
      );
    }
    return null;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="workout-plans-page">
        <p className="loading">Loading workout plans…</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="workout-plans-page">
        <div className="alert alert-error">{pageError}</div>
        <button className="btn btn-secondary" onClick={() => loadPageData(true)}>
          Retry
        </button>
      </div>
    );
  }

  const traineeName = traineeInfo
    ? `${traineeInfo.user?.firstName || ""} ${traineeInfo.user?.lastName || ""}`.trim() || `Trainee #${traineeIdNum}`
    : `Trainee #${traineeIdNum}`;

  const isArchived = fullPlan?.status === "archived";
  const cfgConfirm = confirmConfig();

  return (
    <div className="workout-plans-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="wp-breadcrumb">
            <Link to="/trainer/trainees">My Trainees</Link>
            <span> / </span>
            <span>{traineeName}</span>
          </div>
          <h1>Workout Plans</h1>
          <p className="page-description">
            Managing plans for <strong>{traineeName}</strong>
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreatePlan}>
          + New Plan
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success">{successMsg}</div>
      )}

      {/* Two-column layout */}
      <div className="wp-layout">
        {/* Plan list */}
        <aside className="wp-plan-list">
          <h2 className="wp-section-title">All Plans</h2>
          {plans.length === 0 ? (
            <div className="wp-empty-state">
              <p>No plans yet.</p>
              <p>
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreatePlan}>
                  Create First Plan
                </button>
              </p>
            </div>
          ) : (
            plans.map((plan) => (
              <PlanSummaryCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlanId === plan.id}
                onSelect={selectPlan}
                onActivate={openActivateConfirm}
                onArchive={openArchiveConfirm}
                onDelete={openDeleteConfirm}
              />
            ))
          )}
        </aside>

        {/* Plan builder */}
        <section className="wp-builder">
          {!selectedPlanId ? (
            <div className="wp-builder-empty">
              <p>Select a plan from the list to view or edit it.</p>
              <p>
                <button type="button" className="btn btn-outline" onClick={openCreatePlan}>
                  + Create a New Plan
                </button>
              </p>
            </div>
          ) : planLoading ? (
            <p className="loading">Loading plan…</p>
          ) : planError ? (
            <div>
              <div className="alert alert-error">{planError}</div>
              <button className="btn btn-secondary btn-sm" onClick={() => refreshPlan()}>
                Retry
              </button>
            </div>
          ) : fullPlan ? (
            <div className="wp-plan-detail">
              {/* Plan header */}
              <div className="wp-plan-header">
                <div className="wp-plan-header-info">
                  <h2 className="wp-plan-title">{fullPlan.name}</h2>
                  <div className="wp-plan-header-meta">
                    <PlanStatusBadge status={fullPlan.status} />
                    {fullPlan.startDate && (
                      <span className="wp-date-range">
                        {formatDateOnly(fullPlan.startDate)}
                        {fullPlan.endDate ? ` → ${formatDateOnly(fullPlan.endDate)}` : " → ongoing"}
                      </span>
                    )}
                  </div>
                  {fullPlan.description && (
                    <p className="wp-plan-description">{fullPlan.description}</p>
                  )}
                </div>
                <div className="wp-plan-header-actions">
                  {!isArchived && (
                    <button type="button" className="btn btn-sm btn-outline" onClick={openEditPlan}>
                      Edit Plan
                    </button>
                  )}
                  {fullPlan.status === "draft" && (
                    <button
                      type="button"
                      className="btn btn-sm btn-accent"
                      onClick={() => openActivateConfirm(fullPlan)}
                    >
                      Activate
                    </button>
                  )}
                  {(fullPlan.status === "draft" || fullPlan.status === "active") && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => openArchiveConfirm(fullPlan)}
                    >
                      Archive
                    </button>
                  )}
                  {fullPlan.status === "draft" && (
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => openDeleteConfirm(fullPlan)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {isArchived && (
                <div className="alert alert-error wp-archived-notice">
                  This plan is archived and read-only.
                </div>
              )}

              {/* Sessions */}
              <div className="wp-sessions-area">
                <div className="wp-sessions-header">
                  <h3 className="wp-section-title">
                    Sessions ({(fullPlan.sessions || []).length})
                  </h3>
                  {!isArchived && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={openCreateSession}
                    >
                      + Add Session
                    </button>
                  )}
                </div>

                {(fullPlan.sessions || []).length === 0 ? (
                  <div className="wp-empty-state">
                    <p>No sessions yet.{!isArchived && " Add a workout session to get started."}</p>
                  </div>
                ) : (
                  (fullPlan.sessions || []).map((session) => (
                    <WorkoutSessionCard
                      key={session.id}
                      session={session}
                      isArchived={isArchived}
                      onEdit={openEditSession}
                      onDelete={openDeleteSession}
                      onAddAssignment={openCreateAssignment}
                      onEditAssignment={openEditAssignment}
                      onRemoveAssignment={openRemoveAssignment}
                    />
                  ))
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="wp-modal-title">
          <div className="modal modal--wide">
            <div className="modal-header">
              <h2 id="wp-modal-title" className="modal-title">{modalTitle()}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={modalSubmitting}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {modalContent()}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirm && (
        <ConfirmationDialog
          title={cfgConfirm.title}
          message={
            <span>
              {cfgConfirm.message}
              {confirm.error && (
                <span className="wp-confirm-error">
                  <br /><br />{confirm.error}
                </span>
              )}
            </span>
          }
          confirmLabel={cfgConfirm.confirmLabel}
          confirmVariant={cfgConfirm.confirmVariant}
          submitting={confirm.submitting}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

export default TrainerWorkoutPlans;
