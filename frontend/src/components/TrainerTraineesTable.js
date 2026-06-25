function GoalSummary({ goals }) {
  if (!goals || goals.length === 0) {
    return <span className="muted-dash">—</span>;
  }
  return (
    <div className="goal-summary">
      {goals.map((goal) => (
        <div key={goal.id} className="goal-pill">
          <span className="goal-pill-name">{goal.name}</span>
          {goal.goalStatus && (
            <span
              className={`status-badge status-${goal.goalStatus.replace(
                /\s+/g,
                "-"
              )}`}
            >
              {goal.goalStatus}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function TrainerTraineesTable({ trainees, onEdit, onStatusChange, onManageGoals, onWorkoutPlans, onTracking, onNutritionPlans }) {
  const isEmpty = !trainees || trainees.length === 0;

  const headers = (
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Email</th>
      <th>Level</th>
      <th>Workouts/wk</th>
      <th>Training Status</th>
      <th>Goals</th>
      <th>Actions</th>
    </tr>
  );

  if (isEmpty) {
    return (
      <table className="admin-trainees-table">
        <thead>{headers}</thead>
        <tbody>
          <tr>
            <td colSpan="8" className="table-empty">
              No trainees assigned yet.
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className="admin-trainees-table">
      <thead>{headers}</thead>
      <tbody>
        {trainees.map((trainee) => {
          const u = trainee.user || {};
          const name = u.firstName
            ? `${u.firstName} ${u.lastName}`.trim()
            : "—";

          return (
            <tr key={trainee.id}>
              <td>{trainee.id}</td>
              <td>{name}</td>
              <td>{u.email || "—"}</td>
              <td style={{ textTransform: "capitalize" }}>
                {trainee.experienceLevel}
              </td>
              <td>{trainee.weeklyWorkouts}</td>
              <td>
                <span
                  className={`status-badge status-${trainee.status}`}
                  aria-label={`Training status: ${trainee.status}`}
                >
                  {trainee.status}
                </span>
              </td>
              <td>
                <GoalSummary goals={trainee.goals} />
              </td>
              <td className="table-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => onEdit(trainee)}
                  aria-label={`Edit ${name}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => onStatusChange(trainee)}
                  aria-label={`Change training status of ${name}`}
                >
                  Status
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => onManageGoals(trainee)}
                  aria-label={`Manage goals for ${name}`}
                >
                  Goals
                </button>
                {onWorkoutPlans && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => onWorkoutPlans(trainee)}
                    aria-label={`Workout plans for ${name}`}
                  >
                    Workout Plan
                  </button>
                )}
                {onTracking && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => onTracking(trainee)}
                    aria-label={`Weekly tracking for ${name}`}
                  >
                    Weekly Tracking
                  </button>
                )}
                {onNutritionPlans && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => onNutritionPlans(trainee)}
                    aria-label={`Nutrition plans for ${name}`}
                  >
                    Nutrition Plan
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default TrainerTraineesTable;
