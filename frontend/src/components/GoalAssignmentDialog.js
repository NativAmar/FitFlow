import { useState, useEffect, useCallback } from "react";
import {
  getTraineeGoals,
  assignGoalToTrainee,
  updateTraineeGoal,
  removeGoalFromTrainee,
} from "../services/traineesService";
import { getGoals } from "../services/goalService";

const STATUSES = ["in-progress", "achieved", "dropped"];

function GoalAssignmentDialog({ trainee, onClose, onRefresh }) {
  const traineeId = trainee.id;
  const u = trainee.user || {};
  const traineeName = u.displayName || (u.firstName ? `${u.firstName} ${u.lastName}` : `Trainee #${traineeId}`);

  const [assignments, setAssignments] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogError, setDialogError] = useState(null);

  // Per-assignment edit state: { [goalId]: { status, targetDate } }
  const [editStates, setEditStates] = useState({});
  const [savingGoalId, setSavingGoalId] = useState(null);
  const [removingGoalId, setRemovingGoalId] = useState(null);
  const [itemErrors, setItemErrors] = useState({});

  // New assignment form
  const [newGoalId, setNewGoalId] = useState("");
  const [newStatus, setNewStatus] = useState("in-progress");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setDialogError(null);
    try {
      const [assigns, goals] = await Promise.all([
        getTraineeGoals(traineeId),
        getGoals(),
      ]);
      setAssignments(assigns);
      setCatalog(goals);
      const states = {};
      assigns.forEach((a) => {
        states[a.id] = {
          status: a.assignment.status,
          targetDate: a.assignment.targetDate || "",
        };
      });
      setEditStates(states);
      setItemErrors({});
    } catch (err) {
      setDialogError(err.message || "Failed to load goal data.");
    } finally {
      setLoading(false);
    }
  }, [traineeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const unassigned = catalog.filter(
    (g) => !assignments.find((a) => a.id === g.id)
  );

  function setEditField(goalId, field, value) {
    setEditStates((prev) => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value },
    }));
  }

  function clearItemError(goalId) {
    setItemErrors((prev) => ({ ...prev, [goalId]: null }));
  }

  async function handleSave(goalId) {
    const es = editStates[goalId] || {};
    setSavingGoalId(goalId);
    clearItemError(goalId);
    try {
      await updateTraineeGoal(traineeId, goalId, {
        status: es.status,
        targetDate: es.targetDate || null,
      });
      await loadData();
      onRefresh();
    } catch (err) {
      setItemErrors((prev) => ({
        ...prev,
        [goalId]: err.message || "Failed to update.",
      }));
    } finally {
      setSavingGoalId(null);
    }
  }

  async function handleRemove(goalId) {
    setRemovingGoalId(goalId);
    clearItemError(goalId);
    try {
      await removeGoalFromTrainee(traineeId, goalId);
      await loadData();
      onRefresh();
    } catch (err) {
      setItemErrors((prev) => ({
        ...prev,
        [goalId]: err.message || "Failed to remove.",
      }));
    } finally {
      setRemovingGoalId(null);
    }
  }

  async function handleAssign(e) {
    e.preventDefault();
    if (!newGoalId) return;
    setAssignSubmitting(true);
    setAssignError(null);
    try {
      await assignGoalToTrainee(traineeId, {
        goalId: parseInt(newGoalId, 10),
        status: newStatus,
        targetDate: newTargetDate || null,
      });
      setNewGoalId("");
      setNewStatus("in-progress");
      setNewTargetDate("");
      await loadData();
      onRefresh();
    } catch (err) {
      setAssignError(err.message || "Failed to assign goal.");
    } finally {
      setAssignSubmitting(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-dialog-title"
    >
      <div className="modal modal--goal-assignment">
        <div className="modal-header">
          <h2 id="goal-dialog-title" className="modal-title">
            Manage Goals — {traineeName}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {dialogError && (
            <div className="alert alert-error">{dialogError}</div>
          )}

          {loading ? (
            <p className="loading">Loading goals…</p>
          ) : (
            <>
              {/* ── Current Assignments ─────────────────────────────── */}
              <section className="goal-dialog-section">
                <h3 className="goal-dialog-section-title">
                  Current Assignments ({assignments.length})
                </h3>

                {assignments.length === 0 ? (
                  <p className="goal-empty-state">No goals assigned yet.</p>
                ) : (
                  <div className="assignment-list">
                    {assignments.map((a) => {
                      const es = editStates[a.id] || {
                        status: a.assignment.status,
                        targetDate: a.assignment.targetDate || "",
                      };
                      const isSaving = savingGoalId === a.id;
                      const isRemoving = removingGoalId === a.id;
                      const busy = isSaving || isRemoving;

                      return (
                        <div key={a.id} className="assignment-item">
                          <div className="assignment-goal-name">{a.name}</div>
                          {a.description && (
                            <div className="assignment-goal-desc">
                              {a.description}
                            </div>
                          )}
                          <div className="assignment-fields">
                            <div className="form-group form-group--inline">
                              <label>Status</label>
                              <select
                                className="form-select"
                                value={es.status}
                                onChange={(e) =>
                                  setEditField(a.id, "status", e.target.value)
                                }
                                disabled={busy}
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="form-group form-group--inline">
                              <label>Target Date</label>
                              <input
                                type="date"
                                className="form-input"
                                value={es.targetDate}
                                onChange={(e) =>
                                  setEditField(
                                    a.id,
                                    "targetDate",
                                    e.target.value
                                  )
                                }
                                disabled={busy}
                              />
                            </div>
                            <div className="assignment-item-actions">
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => handleSave(a.id)}
                                disabled={busy}
                              >
                                {isSaving ? "Saving…" : "Save"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => handleRemove(a.id)}
                                disabled={busy}
                              >
                                {isRemoving ? "Removing…" : "Remove"}
                              </button>
                            </div>
                          </div>
                          {itemErrors[a.id] && (
                            <div className="alert alert-error assignment-item-error">
                              {itemErrors[a.id]}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* ── Assign New Goal ─────────────────────────────────── */}
              <section className="goal-dialog-section">
                <h3 className="goal-dialog-section-title">Assign New Goal</h3>

                {unassigned.length === 0 ? (
                  <p className="goal-empty-state">
                    All catalog goals are already assigned to this trainee.
                  </p>
                ) : (
                  <form onSubmit={handleAssign} className="assign-goal-form">
                    <div className="form-group">
                      <label htmlFor="new-goal-select">
                        Goal <span className="required-mark">*</span>
                      </label>
                      <select
                        id="new-goal-select"
                        className="form-select"
                        value={newGoalId}
                        onChange={(e) => setNewGoalId(e.target.value)}
                        required
                        disabled={assignSubmitting}
                      >
                        <option value="">Select a goal…</option>
                        {unassigned.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="assign-goal-row">
                      <div className="form-group">
                        <label htmlFor="new-goal-status">Initial Status</label>
                        <select
                          id="new-goal-status"
                          className="form-select"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          disabled={assignSubmitting}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="new-goal-date">
                          Target Date (optional)
                        </label>
                        <input
                          id="new-goal-date"
                          type="date"
                          className="form-input"
                          value={newTargetDate}
                          onChange={(e) => setNewTargetDate(e.target.value)}
                          disabled={assignSubmitting}
                        />
                      </div>
                    </div>

                    {assignError && (
                      <div className="alert alert-error">{assignError}</div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={assignSubmitting || !newGoalId}
                    >
                      {assignSubmitting ? "Assigning…" : "Assign Goal"}
                    </button>
                  </form>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GoalAssignmentDialog;
