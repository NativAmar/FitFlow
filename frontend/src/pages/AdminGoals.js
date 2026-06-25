import { useState, useEffect, useCallback } from "react";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from "../services/goalService";
import GoalForm from "../components/GoalForm";
import ConfirmationDialog from "../components/ConfirmationDialog";

function AdminGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form modal state
  const [formMode, setFormMode] = useState(null); // null | 'create' | 'edit'
  const [editingGoal, setEditingGoal] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const flashSuccess = useCallback((msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }, []);

  const fetchGoals = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setPageError(null);
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (err) {
      setPageError(err.message || "Failed to load goals.");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals(true);
  }, [fetchGoals]);

  const filteredGoals = goals.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      (g.description || "").toLowerCase().includes(q)
    );
  });

  // ——— Form handlers ———

  function openCreate() {
    setEditingGoal(null);
    setFormMode("create");
    setFormError(null);
  }

  function openEdit(goal) {
    setEditingGoal(goal);
    setFormMode("edit");
    setFormError(null);
  }

  function closeForm() {
    setFormMode(null);
    setEditingGoal(null);
    setFormError(null);
  }

  async function handleFormSubmit(payload) {
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (formMode === "create") {
        await createGoal(payload);
        flashSuccess("Goal created successfully.");
      } else {
        await updateGoal(editingGoal.id, payload);
        flashSuccess("Goal updated successfully.");
      }
      closeForm();
      fetchGoals();
    } catch (err) {
      setFormError(err.message || "An error occurred. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  }

  // ——— Delete handlers ———

  function openDeleteConfirm(goal) {
    setDeleteTarget(goal);
  }

  function closeDeleteConfirm() {
    setDeleteTarget(null);
  }

  async function handleDeleteConfirm() {
    setDeleteSubmitting(true);
    try {
      await deleteGoal(deleteTarget.id);
      flashSuccess(`Goal "${deleteTarget.name}" deleted.`);
      closeDeleteConfirm();
      fetchGoals();
    } catch (err) {
      setPageError(err.message || "Failed to delete goal.");
      closeDeleteConfirm();
    } finally {
      setDeleteSubmitting(false);
    }
  }

  // ——— Render ———

  if (loading) {
    return (
      <div className="goals-catalog-section">
        <p className="loading">Loading goals…</p>
      </div>
    );
  }

  return (
    <div className="goals-catalog-section">
      <div className="page-header">
        <div>
          <h1>Goal Catalog</h1>
          <p className="page-description">
            Manage the library of goals available for assignment to trainees.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Add Goal
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

      <div className="filter-bar">
        <input
          type="text"
          className="filter-input"
          placeholder="Search goals…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search goals"
        />
      </div>

      <p className="table-count">
        Showing {filteredGoals.length} of {goals.length} goal
        {goals.length !== 1 ? "s" : ""}
      </p>

      <div className="table-scroll-wrapper">
        {filteredGoals.length === 0 ? (
          <p className="goal-empty-state">No goals found.</p>
        ) : (
          <table className="goals-catalog-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGoals.map((goal) => (
                <tr key={goal.id}>
                  <td>{goal.id}</td>
                  <td className="goal-catalog-name">{goal.name}</td>
                  <td className="goal-catalog-desc">
                    {goal.description || <span className="muted-dash">—</span>}
                  </td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => openEdit(goal)}
                      aria-label={`Edit ${goal.name}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => openDeleteConfirm(goal)}
                      aria-label={`Delete ${goal.name}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit modal */}
      {formMode && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="goal-form-title"
        >
          <div className="modal modal--narrow">
            <div className="modal-header">
              <h2 id="goal-form-title" className="modal-title">
                {formMode === "create" ? "Add Goal" : "Edit Goal"}
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
              <GoalForm
                key={formMode === "create" ? "create" : `edit-${editingGoal?.id}`}
                mode={formMode}
                initialData={editingGoal}
                onSubmit={handleFormSubmit}
                onCancel={closeForm}
                submitting={formSubmitting}
                submitError={formError}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmationDialog
          title="Delete Goal"
          message={
            <span className="confirm-message">
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name}</strong>?{" "}
              Goals that are currently assigned to trainees cannot be deleted —
              remove all assignments first.
            </span>
          }
          confirmLabel="Delete goal"
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

export default AdminGoals;
