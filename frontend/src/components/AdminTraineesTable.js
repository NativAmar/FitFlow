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
              className={`status-badge status-${goal.goalStatus.replace(/\s+/g, "-")}`}
            >
              {goal.goalStatus}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function TrainerCell({ trainee, trainersById }) {
  const trainer = trainee.trainer;
  if (!trainer) return <span className="muted-dash">—</span>;

  const u = trainer.user || {};
  const name = u.firstName
    ? `${u.firstName} ${u.lastName}`.trim()
    : `Trainer #${trainer.id}`;

  const detail = trainersById ? trainersById[trainer.id] : null;
  const isInactive = detail ? detail.accountStatus === "inactive" : false;

  return (
    <span>
      {name}
      {isInactive && (
        <span
          className="trainer-inactive-badge"
          title="This trainer's account is inactive"
          aria-label="trainer account is inactive"
        >
          {" "}(Inactive)
        </span>
      )}
    </span>
  );
}

function AdminTraineesTable({
  trainees,
  trainersById,
  onEdit,
  onStatusChange,
  onReassign,
  onDelete,
  onManageGoals,
}) {
  const isEmpty = !trainees || trainees.length === 0;

  const headers = (
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Email</th>
      <th>Trainer</th>
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
            <td colSpan="9" className="table-empty">
              No trainees to display.
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
              <td>
                <TrainerCell trainee={trainee} trainersById={trainersById} />
              </td>
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
                  onClick={() => onReassign(trainee)}
                  aria-label={`Reassign ${name} to another trainer`}
                >
                  Reassign
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => onManageGoals(trainee)}
                  aria-label={`Manage goals for ${name}`}
                >
                  Goals
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => onDelete(trainee)}
                  aria-label={`Delete ${name} permanently`}
                >
                  Delete
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default AdminTraineesTable;
