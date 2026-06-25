import { useState, useEffect, useCallback } from "react";
import {
  getMuscleGroups,
  getExercises,
  createExercise,
  updateExercise,
  deleteExercise,
} from "../services/exercisesService";
import ExercisesTable from "../components/ExercisesTable";
import ExerciseForm from "../components/ExerciseForm";
import ConfirmationDialog from "../components/ConfirmationDialog";

function TrainerExercises() {
  const [exercises, setExercises] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState("");

  // Form modal state
  const [formMode, setFormMode] = useState(null); // null | 'create' | 'edit'
  const [editingExercise, setEditingExercise] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const flashSuccess = useCallback((msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }, []);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setPageError(null);
    try {
      const [exerciseData, muscleGroupData] = await Promise.all([
        getExercises(),
        getMuscleGroups(),
      ]);
      setExercises(exerciseData);
      setMuscleGroups(muscleGroupData);
    } catch (err) {
      setPageError(err.message || "Failed to load exercises.");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Client-side filtering after data is loaded
  const filteredExercises = exercises.filter((ex) => {
    if (muscleGroupFilter && String(ex.muscleGroup?.id) !== muscleGroupFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!ex.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const hasActiveFilters = searchQuery || muscleGroupFilter;

  function resetFilters() {
    setSearchQuery("");
    setMuscleGroupFilter("");
  }

  // ——— Form handlers ———

  function openCreate() {
    setEditingExercise(null);
    setFormMode("create");
    setFormError(null);
  }

  function openEdit(exercise) {
    setEditingExercise(exercise);
    setFormMode("edit");
    setFormError(null);
  }

  function closeForm() {
    setFormMode(null);
    setEditingExercise(null);
    setFormError(null);
  }

  async function handleFormSubmit(payload) {
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (formMode === "create") {
        await createExercise(payload);
        flashSuccess("Exercise created successfully.");
      } else {
        await updateExercise(editingExercise.id, payload);
        flashSuccess("Exercise updated successfully.");
      }
      closeForm();
      fetchData();
    } catch (err) {
      setFormError(err.message || "An error occurred. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  }

  // ——— Delete handlers ———

  function openDeleteConfirm(exercise) {
    setDeleteTarget(exercise);
  }

  function closeDeleteConfirm() {
    setDeleteTarget(null);
  }

  async function handleDeleteConfirm() {
    setDeleteSubmitting(true);
    try {
      await deleteExercise(deleteTarget.id);
      flashSuccess(`Exercise "${deleteTarget.name}" deleted.`);
      closeDeleteConfirm();
      fetchData();
    } catch (err) {
      setPageError(err.message || "Failed to delete exercise.");
      closeDeleteConfirm();
    } finally {
      setDeleteSubmitting(false);
    }
  }

  // ——— Render ———

  if (loading) {
    return (
      <div className="exercises-section">
        <p className="loading">Loading exercises…</p>
      </div>
    );
  }

  return (
    <div className="exercises-section">
      <div className="page-header">
        <div>
          <h1>My Exercise Library</h1>
          <p className="page-description">
            Build and manage your personal catalog of exercises.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Add Exercise
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
          placeholder="Search by exercise name…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search exercises"
        />

        <select
          className="filter-select"
          value={muscleGroupFilter}
          onChange={(e) => setMuscleGroupFilter(e.target.value)}
          aria-label="Filter by muscle group"
        >
          <option value="">All Muscle Groups</option>
          {muscleGroups.map((mg) => (
            <option key={mg.id} value={String(mg.id)}>
              {mg.name}
            </option>
          ))}
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
        Showing {filteredExercises.length} of {exercises.length} exercise
        {exercises.length !== 1 ? "s" : ""}
      </p>

      <div className="table-scroll-wrapper">
        {exercises.length === 0 ? (
          <p className="exercise-empty-state">
            You have no exercises yet. Click <strong>+ Add Exercise</strong> to
            start building your library.
          </p>
        ) : (
          <ExercisesTable
            exercises={filteredExercises}
            onEdit={openEdit}
            onDelete={openDeleteConfirm}
          />
        )}
      </div>

      {/* Create / Edit modal */}
      {formMode && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exercise-form-title"
        >
          <div className="modal modal--narrow">
            <div className="modal-header">
              <h2 id="exercise-form-title" className="modal-title">
                {formMode === "create" ? "Add Exercise" : "Edit Exercise"}
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
              <ExerciseForm
                key={
                  formMode === "create"
                    ? "create"
                    : `edit-${editingExercise?.id}`
                }
                mode={formMode}
                initialData={editingExercise}
                muscleGroups={muscleGroups}
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
          title="Delete Exercise"
          message={
            <span className="confirm-message">
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name}</strong>? This cannot be undone.
            </span>
          }
          confirmLabel="Delete exercise"
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

export default TrainerExercises;
