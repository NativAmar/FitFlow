function ExercisesTable({ exercises, onEdit, onDelete }) {
  if (exercises.length === 0) {
    return (
      <p className="exercise-empty-state">No exercises found.</p>
    );
  }

  return (
    <table className="exercises-table">
      <thead>
        <tr>
          <th>Exercise</th>
          <th>Muscle Group</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {exercises.map((ex) => (
          <tr key={ex.id}>
            <td className="exercise-name">{ex.name}</td>
            <td className="exercise-muscle-group">
              {ex.muscleGroup ? ex.muscleGroup.name : <span className="muted-dash">—</span>}
            </td>
            <td className="exercise-description">{ex.description}</td>
            <td className="table-actions">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => onEdit(ex)}
                aria-label={`Edit ${ex.name}`}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => onDelete(ex)}
                aria-label={`Delete ${ex.name}`}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ExercisesTable;
