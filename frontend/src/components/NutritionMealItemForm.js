import { useState } from "react";

function NutritionMealItemForm({
  mode = "create",
  initialData = null,
  onSubmit,
  onCancel,
  submitting = false,
  submitError = null,
}) {
  // Determine initial quantity mode from existing data
  const initialIsMeasured =
    initialData == null ||
    (initialData.quantity !== null && initialData.quantity !== undefined);

  const [foodName, setFoodName] = useState(initialData?.foodName ?? "");
  const [quantityMode, setQuantityMode] = useState(
    initialIsMeasured ? "measured" : "flexible"
  );
  const [quantity, setQuantity] = useState(
    initialData?.quantity != null ? String(initialData.quantity) : ""
  );
  const [unit, setUnit] = useState(initialData?.unit ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [displayOrder, setDisplayOrder] = useState(
    initialData?.displayOrder != null ? String(initialData.displayOrder) : ""
  );
  const [clientError, setClientError] = useState(null);

  const isMeasured = quantityMode === "measured";

  function validate() {
    const trimmedName = foodName.trim();
    if (!trimmedName) return "Food name is required.";
    if (trimmedName.length > 200) return "Food name must be 200 characters or fewer.";

    if (isMeasured) {
      if (!quantity || String(quantity).trim() === "") return "Quantity is required for measured amounts.";
      const n = Number(quantity);
      if (isNaN(n) || n <= 0) return "Quantity must be a number greater than zero.";
      if (!unit.trim()) return "Unit is required for measured amounts.";
      if (unit.trim().length > 50) return "Unit must be 50 characters or fewer.";
    }

    if (notes.trim().length > 2000) return "Notes must be 2000 characters or fewer.";

    if (displayOrder) {
      const ord = parseInt(displayOrder, 10);
      if (isNaN(ord) || ord <= 0) return "Display order must be a positive integer.";
    }

    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setClientError(err);
      return;
    }
    setClientError(null);

    const payload = { foodName: foodName.trim() };

    if (isMeasured) {
      payload.quantity = Number(quantity);
      payload.unit = unit.trim();
    } else {
      payload.quantity = null;
      payload.unit = null;
    }

    const trimmedNotes = notes.trim();
    payload.notes = trimmedNotes || null;

    if (displayOrder) {
      payload.displayOrder = parseInt(displayOrder, 10);
    }

    onSubmit(payload);
  }

  function handleModeChange(newMode) {
    setQuantityMode(newMode);
    setClientError(null);
    if (newMode === "flexible") {
      setQuantity("");
      setUnit("");
    }
  }

  const displayError = clientError || submitError;

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="ni-form-name">Food Name *</label>
        <input
          id="ni-form-name"
          type="text"
          value={foodName}
          onChange={(e) => { setFoodName(e.target.value); setClientError(null); }}
          maxLength={200}
          placeholder="e.g. Oats, Eggs, Chicken breast"
          disabled={submitting}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label>Quantity Mode *</label>
        <div className="np-radio-group">
          <label className="np-radio-label">
            <input
              type="radio"
              name="quantityMode"
              value="measured"
              checked={isMeasured}
              onChange={() => handleModeChange("measured")}
              disabled={submitting}
            />
            Measured amount
          </label>
          <label className="np-radio-label">
            <input
              type="radio"
              name="quantityMode"
              value="flexible"
              checked={!isMeasured}
              onChange={() => handleModeChange("flexible")}
              disabled={submitting}
            />
            Flexible / no fixed amount
          </label>
        </div>
      </div>

      {isMeasured && (
        <>
          <div className="form-group">
            <label htmlFor="ni-form-quantity">Quantity *</label>
            <input
              id="ni-form-quantity"
              type="number"
              min="0.001"
              step="any"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setClientError(null); }}
              placeholder="e.g. 80"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ni-form-unit">Unit *</label>
            <input
              id="ni-form-unit"
              type="text"
              value={unit}
              onChange={(e) => { setUnit(e.target.value); setClientError(null); }}
              maxLength={50}
              placeholder="e.g. grams, ml, units, cups"
              disabled={submitting}
            />
          </div>
        </>
      )}

      <div className="form-group">
        <label htmlFor="ni-form-notes">Notes</label>
        <textarea
          id="ni-form-notes"
          className="np-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Optional notes for this food item"
          disabled={submitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="ni-form-order">Display Order</label>
        <input
          id="ni-form-order"
          type="number"
          min="1"
          step="1"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
          placeholder="Leave blank for auto"
          disabled={submitting}
        />
      </div>

      {displayError && (
        <div className="alert alert-error" role="alert">
          {displayError}
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Add Item" : "Save Changes"}
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
  );
}

export default NutritionMealItemForm;
