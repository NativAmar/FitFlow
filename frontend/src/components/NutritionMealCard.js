// ── Formatting helpers ────────────────────────────────────────────────────────

const MEAL_TYPE_LABELS = {
  "breakfast":       "Breakfast",
  "morning-snack":   "Morning Snack",
  "lunch":           "Lunch",
  "afternoon-snack": "Afternoon Snack",
  "dinner":          "Dinner",
  "evening-snack":   "Evening Snack",
  "pre-workout":     "Pre-Workout",
  "post-workout":    "Post-Workout",
  "custom":          "Custom",
};

const DAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function formatMealType(mt) {
  return MEAL_TYPE_LABELS[mt] || mt;
}

function formatDayOfWeek(dow) {
  if (!dow) return "Every day";
  return DAY_LABELS[dow] || dow;
}

function formatScheduledTime(t) {
  if (!t) return null;
  // Normalize HH:MM:SS → HH:MM
  return t.length > 5 ? t.slice(0, 5) : t;
}

function formatQuantity(q) {
  if (q === null || q === undefined) return null;
  const n = parseFloat(q);
  if (isNaN(n)) return String(q);
  // Remove unnecessary trailing zeros
  return parseFloat(n.toFixed(10)).toString();
}

// ── Item row ──────────────────────────────────────────────────────────────────

function ItemRow({ item, isArchived, onEdit, onRemove }) {
  const isMeasured = item.quantity !== null && item.quantity !== undefined;

  return (
    <div className="np-item-row">
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
      {!isArchived && (
        <div className="np-item-actions">
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.foodName}`}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => onRemove(item)}
            aria-label={`Remove ${item.foodName}`}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ── Meal card ─────────────────────────────────────────────────────────────────

function NutritionMealCard({
  meal,
  isArchived = false,
  onEdit,
  onDelete,
  onAddItem,
  onEditItem,
  onRemoveItem,
}) {
  const items = meal.items || [];
  const scheduledTime = formatScheduledTime(meal.scheduledTime);

  return (
    <div className="np-meal-card">
      <div className="np-meal-header">
        <div className="np-meal-header-info">
          <span className="np-meal-name">{meal.name}</span>
          <span className="np-meal-type-badge">{formatMealType(meal.mealType)}</span>
          <span className="np-meal-day">{formatDayOfWeek(meal.dayOfWeek)}</span>
          {scheduledTime && (
            <span className="np-meal-time">{scheduledTime}</span>
          )}
          <span className="np-meal-item-count">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </div>
        {!isArchived && (
          <div className="np-meal-header-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => onEdit(meal)}
              aria-label={`Edit meal ${meal.name}`}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => onAddItem(meal)}
              aria-label={`Add item to ${meal.name}`}
            >
              + Food Item
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => onDelete(meal)}
              aria-label={`Delete meal ${meal.name}`}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {meal.instructions && (
        <p className="np-meal-instructions">{meal.instructions}</p>
      )}

      <div className="np-item-list">
        {items.length === 0 ? (
          <p className="np-empty-state">
            {isArchived ? "No food items." : "No food items yet. Add one above."}
          </p>
        ) : (
          items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              isArchived={isArchived}
              onEdit={onEditItem}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </div>
    </div>
  );
}

export { formatMealType, formatDayOfWeek, formatScheduledTime, formatQuantity };
export default NutritionMealCard;
