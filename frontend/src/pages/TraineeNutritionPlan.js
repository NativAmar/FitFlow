import { useState, useEffect, useCallback } from "react";
import {
  getMyNutritionPlans,
  getMyActiveNutritionPlan,
  getNutritionPlan,
} from "../services/nutritionPlansService";
import {
  formatMealType,
  formatDayOfWeek,
  formatScheduledTime,
  formatQuantity,
} from "../components/NutritionMealCard";
import { useSocket } from "../context/SocketContext";

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

// ── Item view ─────────────────────────────────────────────────────────────────

function ItemView({ item }) {
  const isMeasured = item.quantity !== null && item.quantity !== undefined;
  return (
    <div className="np-item-row np-item-row--readonly">
      <div className="np-item-order">{item.displayOrder}.</div>
      <div className="np-item-body">
        <div className="np-item-name">{item.foodName}</div>
        <div className="np-item-quantity">
          {isMeasured
            ? `${formatQuantity(item.quantity)} ${item.unit}`
            : <span className="np-flexible-label">Flexible amount</span>
          }
        </div>
        {item.notes && (
          <div className="np-item-notes">{item.notes}</div>
        )}
      </div>
    </div>
  );
}

// ── Meal view ─────────────────────────────────────────────────────────────────

function MealView({ meal }) {
  const items = meal.items || [];
  const scheduledTime = formatScheduledTime(meal.scheduledTime);

  return (
    <div className="np-meal-card np-meal-card--readonly">
      <div className="np-meal-header">
        <div className="np-meal-header-info">
          <span className="np-meal-name">{meal.name}</span>
          <span className="np-meal-type-badge">{formatMealType(meal.mealType)}</span>
          <span className="np-meal-day">{formatDayOfWeek(meal.dayOfWeek)}</span>
          {scheduledTime && (
            <span className="np-meal-time">{scheduledTime}</span>
          )}
        </div>
      </div>
      {meal.instructions && (
        <p className="np-meal-instructions">{meal.instructions}</p>
      )}
      <div className="np-item-list">
        {items.length === 0 ? (
          <p className="np-empty-state">No food items in this meal.</p>
        ) : (
          items.map((item) => <ItemView key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

// ── Plan view ─────────────────────────────────────────────────────────────────

function PlanView({ plan, label }) {
  const meals = plan.meals || [];
  return (
    <div className="np-plan-detail">
      <div className="np-plan-header">
        <div className="np-plan-header-info">
          <div className="np-plan-header-row">
            <h2 className="np-plan-title">{plan.name}</h2>
            {label && <span className={`np-status-badge np-status-${plan.status}`}>{label}</span>}
          </div>
          <div className="np-plan-header-meta">
            {plan.startDate && (
              <span className="np-date-range">
                {formatDateOnly(plan.startDate)}
                {plan.endDate ? ` → ${formatDateOnly(plan.endDate)}` : " → ongoing"}
              </span>
            )}
          </div>
          {plan.description && (
            <p className="np-plan-description">{plan.description}</p>
          )}
        </div>
      </div>

      {plan.generalNotes && (
        <div className="np-general-notes">
          <h3 className="np-section-title">General Notes</h3>
          <p>{plan.generalNotes}</p>
        </div>
      )}

      <div className="np-meals-area">
        {meals.length === 0 ? (
          <p className="np-empty-state">No meals in this plan.</p>
        ) : (
          meals.map((meal) => <MealView key={meal.id} meal={meal} />)
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function TraineeNutritionPlan() {
  const { latestNotification } = useSocket();
  const [loading, setLoading]               = useState(true);
  const [pageError, setPageError]           = useState(null);
  const [activePlan, setActivePlan]         = useState(null);
  const [allPlans, setAllPlans]             = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [historyPlan, setHistoryPlan]       = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError]     = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const plans = await getMyNutritionPlans();
      setAllPlans(plans);

      const hasActive = plans.some((p) => p.status === "active");
      if (hasActive) {
        try {
          const active = await getMyActiveNutritionPlan();
          setActivePlan(active);
        } catch (err) {
          // ACTIVE_NUTRITION_PLAN_NOT_FOUND is an expected state, not a page error
          if (err.code === "ACTIVE_NUTRITION_PLAN_NOT_FOUND") {
            setActivePlan(null);
          } else {
            setPageError(err.message || "Failed to load your active nutrition plan.");
          }
        }
      } else {
        setActivePlan(null);
      }
    } catch (err) {
      setPageError(err.message || "Failed to load your nutrition plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Targeted refresh when a NUTRITION_PLAN_* notification arrives for this trainee
  useEffect(() => {
    if (!latestNotification) return;
    if (latestNotification.type && latestNotification.type.startsWith("NUTRITION_PLAN_")) {
      loadData();
    }
  }, [latestNotification, loadData]);

  async function loadHistoryPlan(planId) {
    if (historyLoading) return;
    setSelectedHistoryId(planId);
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryPlan(null);
    try {
      const plan = await getNutritionPlan(planId);
      setHistoryPlan(plan);
    } catch (err) {
      setHistoryError(err.message || "Failed to load plan.");
    } finally {
      setHistoryLoading(false);
    }
  }

  // Archived plans only (drafts excluded by backend, but filter defensively)
  const archivedPlans = allPlans.filter((p) => p.status === "archived");

  if (loading) {
    return (
      <div className="page">
        <h1>My Nutrition Plan</h1>
        <p className="loading">Loading your nutrition plan…</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="page">
        <h1>My Nutrition Plan</h1>
        <div className="alert alert-error">{pageError}</div>
        <button className="btn btn-secondary" onClick={loadData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page np-page">
      <h1>My Nutrition Plan</h1>

      {/* Current plan */}
      <section className="np-trainee-section">
        <h2>Current Nutrition Plan</h2>
        {activePlan ? (
          <PlanView plan={activePlan} label="Active" />
        ) : (
          <div className="np-trainee-empty">
            <p>Your trainer has not activated a nutrition plan yet.</p>
            <p className="np-trainee-empty-sub">
              Check back later or contact your trainer.
            </p>
          </div>
        )}
      </section>

      {/* Previous plans */}
      {archivedPlans.length > 0 && (
        <section className="np-trainee-section">
          <h2>Previous Nutrition Plans</h2>
          <div className="np-history">
            {archivedPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                className={`np-history-item${selectedHistoryId === plan.id ? " np-history-item--active" : ""}`}
                onClick={() => loadHistoryPlan(plan.id)}
              >
                <span className="np-history-name">{plan.name}</span>
                <span className="np-history-dates">
                  {formatDateOnly(plan.startDate) || "—"}
                  {plan.endDate ? ` → ${formatDateOnly(plan.endDate)}` : ""}
                </span>
              </button>
            ))}
          </div>

          {historyLoading && <p className="loading">Loading plan…</p>}
          {historyError && (
            <div className="alert alert-error">{historyError}</div>
          )}
          {historyPlan && !historyLoading && (
            <div className="np-history-detail">
              <div className="alert alert-error np-archived-notice">
                This plan is archived.
              </div>
              <PlanView plan={historyPlan} label="Archived" />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default TraineeNutritionPlan;
