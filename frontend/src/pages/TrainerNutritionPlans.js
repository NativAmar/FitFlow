import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getTraineeNutritionPlans,
  createNutritionPlan,
  getNutritionPlan,
  updateNutritionPlan,
  changeNutritionPlanStatus,
  deleteNutritionPlan,
  createNutritionMeal,
  updateNutritionMeal,
  deleteNutritionMeal,
  createNutritionMealItem,
  updateNutritionMealItem,
  deleteNutritionMealItem,
} from "../services/nutritionPlansService";
import { getTraineeById } from "../services/traineesService";
import NutritionPlanForm from "../components/NutritionPlanForm";
import NutritionMealForm from "../components/NutritionMealForm";
import NutritionMealItemForm from "../components/NutritionMealItemForm";
import NutritionMealCard from "../components/NutritionMealCard";
import ConfirmationDialog from "../components/ConfirmationDialog";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

const ERROR_MESSAGES = {
  NUTRITION_PLAN_NOT_FOUND: "Nutrition plan not found.",
  ACTIVE_NUTRITION_PLAN_NOT_FOUND: "No active nutrition plan found.",
  NUTRITION_PLAN_EMPTY: "The plan must contain at least one meal before activation.",
  NUTRITION_MEAL_EMPTY: "Every meal must contain at least one food item before activation.",
  NUTRITION_PLAN_ARCHIVED: "This plan is archived and cannot be modified.",
  INVALID_NUTRITION_PLAN_STATUS_TRANSITION: "This status change is not allowed for the current plan state.",
  NUTRITION_PLAN_DELETE_RESTRICTED: "Only draft plans can be deleted.",
  NUTRITION_MEAL_NOT_FOUND: "Meal not found.",
  NUTRITION_MEAL_ITEM_NOT_FOUND: "Food item not found.",
  TRAINEE_NOT_FOUND: "Trainee not found.",
  TRAINER_PROFILE_NOT_FOUND: "Trainer profile not found. The trainee must have an assigned trainer.",
  FORBIDDEN: "You do not have permission to perform this action.",
  VALIDATION_ERROR: null, // use raw message
};

function friendlyError(err) {
  if (err.code && ERROR_MESSAGES[err.code] !== undefined) {
    return ERROR_MESSAGES[err.code] || err.message || "An error occurred.";
  }
  return err.message || "An unexpected error occurred.";
}

// ── Status badge ──────────────────────────────────────────────────────────────

function PlanStatusBadge({ status }) {
  return (
    <span className={`np-status-badge np-status-${status}`}>
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
      className={`np-plan-card${isSelected ? " np-plan-card--selected" : ""}${isArchived ? " np-plan-card--archived" : ""}`}
      onClick={() => onSelect(plan)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(plan)}
      aria-pressed={isSelected}
    >
      <div className="np-plan-card-header">
        <span className="np-plan-card-name">{plan.name}</span>
        <PlanStatusBadge status={plan.status} />
      </div>

      {plan.description && (
        <p className="np-plan-card-desc">{plan.description}</p>
      )}

      <div className="np-plan-card-meta">
        <span>{plan.mealCount} meal{plan.mealCount !== 1 ? "s" : ""}</span>
        {plan.startDate && (
          <span>Started {formatDateOnly(plan.startDate)}</span>
        )}
        {isArchived && plan.endDate && (
          <span>Ended {formatDateOnly(plan.endDate)}</span>
        )}
      </div>

      <div className="np-plan-card-actions" onClick={(e) => e.stopPropagation()}>
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

function TrainerNutritionPlans() {
  const { traineeId } = useParams();
  const traineeIdNum = parseInt(traineeId, 10);

  // Page state
  const [loading, setLoading]         = useState(true);
  const [pageError, setPageError]     = useState(null);
  const [successMsg, setSuccessMsg]   = useState(null);
  const [traineeInfo, setTraineeInfo] = useState(null);
  const [plans, setPlans]             = useState([]);

  // Selected plan detail
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [fullPlan, setFullPlan]             = useState(null);
  const [planLoading, setPlanLoading]       = useState(false);
  const [planError, setPlanError]           = useState(null);

  // Modal: { type, target?, parentId? }
  const [modal, setModal]                   = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError]         = useState(null);

  // Confirmation dialog
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
      const [trainee, planList] = await Promise.all([
        getTraineeById(traineeIdNum),
        getTraineeNutritionPlans(traineeIdNum),
      ]);
      setTraineeInfo(trainee);
      setPlans(planList);
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
      const plan = await getNutritionPlan(planId);
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

  const refreshSummaries = useCallback(async () => {
    try {
      const planList = await getTraineeNutritionPlans(traineeIdNum);
      setPlans(planList);
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
      const created = await createNutritionPlan(traineeIdNum, payload);
      setModal(null);
      flashSuccess(`Plan "${created.name}" created.`);
      await refreshSummaries();
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
      await updateNutritionPlan(selectedPlanId, payload);
      setModal(null);
      flashSuccess("Plan updated.");
      await Promise.all([refreshSummaries(), refreshPlan()]);
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
      await changeNutritionPlanStatus(plan.id, "active");
      setConfirm(null);
      flashSuccess(`Plan "${plan.name}" activated.`);
      await refreshSummaries();
      if (selectedPlanId === plan.id) await refreshPlan();
      else {
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
      await changeNutritionPlanStatus(plan.id, "archived");
      setConfirm(null);
      flashSuccess(`Plan "${plan.name}" archived.`);
      await refreshSummaries();
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
      await deleteNutritionPlan(plan.id);
      setConfirm(null);
      flashSuccess(`Plan "${plan.name}" deleted.`);
      if (selectedPlanId === plan.id) {
        setSelectedPlanId(null);
        setFullPlan(null);
      }
      await refreshSummaries();
    } catch (err) {
      setConfirm((c) => ({ ...c, submitting: false, error: friendlyError(err) }));
    }
  }

  // ── Meal CRUD ──

  function openCreateMeal() {
    setModal({ type: "createMeal" });
    setModalError(null);
  }

  async function handleCreateMeal(payload) {
    setModalSubmitting(true);
    setModalError(null);
    try {
      await createNutritionMeal(selectedPlanId, payload);
      setModal(null);
      flashSuccess("Meal added.");
      await Promise.all([refreshSummaries(), refreshPlan()]);
    } catch (err) {
      setModalError(friendlyError(err));
    } finally {
      setModalSubmitting(false);
    }
  }

  function openEditMeal(meal) {
    setModal({ type: "editMeal", target: meal });
    setModalError(null);
  }

  async function handleEditMeal(payload) {
    setModalSubmitting(true);
    setModalError(null);
    try {
      await updateNutritionMeal(modal.target.id, payload);
      setModal(null);
      flashSuccess("Meal updated.");
      await refreshPlan();
    } catch (err) {
      setModalError(friendlyError(err));
    } finally {
      setModalSubmitting(false);
    }
  }

  function openDeleteMeal(meal) {
    setConfirm({ type: "deleteMeal", target: meal, submitting: false, error: null });
  }

  async function handleDeleteMeal() {
    const meal = confirm.target;
    setConfirm((c) => ({ ...c, submitting: true, error: null }));
    try {
      await deleteNutritionMeal(meal.id);
      setConfirm(null);
      flashSuccess(`Meal "${meal.name}" deleted.`);
      await Promise.all([refreshSummaries(), refreshPlan()]);
    } catch (err) {
      setConfirm((c) => ({ ...c, submitting: false, error: friendlyError(err) }));
    }
  }

  // ── Item CRUD ──

  function openCreateItem(meal) {
    setModal({ type: "createItem", parentId: meal.id });
    setModalError(null);
  }

  async function handleCreateItem(payload) {
    setModalSubmitting(true);
    setModalError(null);
    try {
      await createNutritionMealItem(modal.parentId, payload);
      setModal(null);
      flashSuccess("Food item added.");
      await refreshPlan();
    } catch (err) {
      setModalError(friendlyError(err));
    } finally {
      setModalSubmitting(false);
    }
  }

  function openEditItem(item) {
    setModal({ type: "editItem", target: item });
    setModalError(null);
  }

  async function handleEditItem(payload) {
    setModalSubmitting(true);
    setModalError(null);
    try {
      await updateNutritionMealItem(modal.target.id, payload);
      setModal(null);
      flashSuccess("Food item updated.");
      await refreshPlan();
    } catch (err) {
      setModalError(friendlyError(err));
    } finally {
      setModalSubmitting(false);
    }
  }

  function openRemoveItem(item) {
    setConfirm({ type: "removeItem", target: item, submitting: false, error: null });
  }

  async function handleRemoveItem() {
    const item = confirm.target;
    setConfirm((c) => ({ ...c, submitting: true, error: null }));
    try {
      await deleteNutritionMealItem(item.id);
      setConfirm(null);
      flashSuccess(`"${item.foodName}" removed.`);
      await refreshPlan();
    } catch (err) {
      setConfirm((c) => ({ ...c, submitting: false, error: friendlyError(err) }));
    }
  }

  // ── Confirm dispatch ──

  function handleConfirm() {
    if (!confirm) return;
    const t = confirm.type;
    if (t === "activate")   return handleActivate();
    if (t === "archive")    return handleArchive();
    if (t === "deletePlan") return handleDeletePlan();
    if (t === "deleteMeal") return handleDeleteMeal();
    if (t === "removeItem") return handleRemoveItem();
  }

  function confirmConfig() {
    if (!confirm) return {};
    const { type, target } = confirm;
    if (type === "activate") {
      return {
        title: "Activate Plan",
        message: `Activate "${target.name}"? If this trainee already has an active nutrition plan, it will be archived automatically. The plan must contain at least one meal and every meal must contain at least one food item.`,
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
        message: `Permanently delete "${target.name}"? All meals and food items inside this draft will also be deleted. The trainee and trainer are not affected.`,
        confirmLabel: "Delete Plan",
        confirmVariant: "danger",
      };
    }
    if (type === "deleteMeal") {
      return {
        title: "Delete Meal",
        message: `Delete meal "${target.name}"? All food items inside this meal will also be removed.`,
        confirmLabel: "Delete Meal",
        confirmVariant: "danger",
      };
    }
    if (type === "removeItem") {
      return {
        title: "Remove Food Item",
        message: `Remove "${target.foodName}" from this meal?`,
        confirmLabel: "Remove",
        confirmVariant: "danger",
      };
    }
    return {};
  }

  // ── Modal ──

  function closeModal() {
    setModal(null);
    setModalError(null);
  }

  function modalTitle() {
    if (!modal) return "";
    const t = modal.type;
    if (t === "createPlan") return "New Nutrition Plan";
    if (t === "editPlan")   return "Edit Plan";
    if (t === "createMeal") return "Add Meal";
    if (t === "editMeal")   return "Edit Meal";
    if (t === "createItem") return "Add Food Item";
    if (t === "editItem")   return "Edit Food Item";
    return "";
  }

  function modalContent() {
    if (!modal) return null;
    const t = modal.type;
    if (t === "createPlan") {
      return (
        <NutritionPlanForm
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
        <NutritionPlanForm
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
    if (t === "createMeal") {
      return (
        <NutritionMealForm
          key="create-meal"
          mode="create"
          onSubmit={handleCreateMeal}
          onCancel={closeModal}
          submitting={modalSubmitting}
          submitError={modalError}
        />
      );
    }
    if (t === "editMeal") {
      return (
        <NutritionMealForm
          key={`edit-meal-${modal.target?.id}`}
          mode="edit"
          initialData={modal.target}
          onSubmit={handleEditMeal}
          onCancel={closeModal}
          submitting={modalSubmitting}
          submitError={modalError}
        />
      );
    }
    if (t === "createItem") {
      return (
        <NutritionMealItemForm
          key={`create-item-${modal.parentId}`}
          mode="create"
          onSubmit={handleCreateItem}
          onCancel={closeModal}
          submitting={modalSubmitting}
          submitError={modalError}
        />
      );
    }
    if (t === "editItem") {
      return (
        <NutritionMealItemForm
          key={`edit-item-${modal.target?.id}`}
          mode="edit"
          initialData={modal.target}
          onSubmit={handleEditItem}
          onCancel={closeModal}
          submitting={modalSubmitting}
          submitError={modalError}
        />
      );
    }
    return null;
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="np-page">
        <p className="loading">Loading nutrition plans…</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="np-page">
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

  const meals = fullPlan?.meals || [];

  return (
    <div className="np-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="wp-breadcrumb">
            <Link to="/trainer/trainees">My Trainees</Link>
            <span> / </span>
            <span>{traineeName}</span>
          </div>
          <h1>Nutrition Plans</h1>
          <p className="page-description">
            Managing nutrition plans for <strong>{traineeName}</strong>
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreatePlan}>
          + New Plan
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success" role="status">{successMsg}</div>
      )}

      {/* Two-column layout */}
      <div className="np-layout">
        {/* Plan list */}
        <aside className="np-plan-list">
          <h2 className="np-section-title">All Plans</h2>
          {plans.length === 0 ? (
            <div className="np-empty-state">
              <p>No nutrition plans yet.</p>
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
        <section className="np-builder">
          {!selectedPlanId ? (
            <div className="np-builder-empty">
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
            <div className="np-plan-detail">
              {/* Plan header */}
              <div className="np-plan-header">
                <div className="np-plan-header-info">
                  <h2 className="np-plan-title">{fullPlan.name}</h2>
                  <div className="np-plan-header-meta">
                    <PlanStatusBadge status={fullPlan.status} />
                    {fullPlan.startDate && (
                      <span className="np-date-range">
                        {formatDateOnly(fullPlan.startDate)}
                        {fullPlan.endDate ? ` → ${formatDateOnly(fullPlan.endDate)}` : " → ongoing"}
                      </span>
                    )}
                  </div>
                  {fullPlan.description && (
                    <p className="np-plan-description">{fullPlan.description}</p>
                  )}
                </div>
                <div className="np-plan-header-actions">
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
                <div className="alert alert-error np-archived-notice">
                  This plan is archived and read-only.
                </div>
              )}

              {fullPlan.generalNotes && (
                <div className="np-general-notes">
                  <h3 className="np-section-title">General Notes</h3>
                  <p>{fullPlan.generalNotes}</p>
                </div>
              )}

              {/* Meals area */}
              <div className="np-meals-area">
                <div className="np-meals-header">
                  <h3 className="np-section-title">
                    Meals ({meals.length})
                  </h3>
                  {!isArchived && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={openCreateMeal}
                    >
                      + Add Meal
                    </button>
                  )}
                </div>

                {meals.length === 0 ? (
                  <div className="np-empty-state">
                    <p>
                      {isArchived
                        ? "No meals in this plan."
                        : "No meals yet. Add a meal to get started."}
                    </p>
                  </div>
                ) : (
                  meals.map((meal) => (
                    <NutritionMealCard
                      key={meal.id}
                      meal={meal}
                      isArchived={isArchived}
                      onEdit={openEditMeal}
                      onDelete={openDeleteMeal}
                      onAddItem={openCreateItem}
                      onEditItem={openEditItem}
                      onRemoveItem={openRemoveItem}
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
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="np-modal-title">
          <div className="modal modal--wide">
            <div className="modal-header">
              <h2 id="np-modal-title" className="modal-title">{modalTitle()}</h2>
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
                <span className="np-confirm-error">
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

export default TrainerNutritionPlans;
