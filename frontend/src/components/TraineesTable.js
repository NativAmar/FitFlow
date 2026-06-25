function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString();
}

function TraineesTable({ trainees }) {
  const empty = !trainees || trainees.length === 0;

  const headers = (
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Email</th>
      <th>Trainer</th>
      <th>Goals</th>
      <th>Experience</th>
      <th>Weekly Workouts</th>
      <th>Status</th>
      <th>Updated</th>
    </tr>
  );

  if (empty) {
    return (
      <table className="trainees-table">
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
    <table className="trainees-table">
      <thead>{headers}</thead>
      <tbody>
        {trainees.map((trainee) => {
          const u = trainee.user || {};
          const trainerUser = trainee.trainer?.user || {};
          const goals = trainee.goals || [];
          const name = u.firstName ? `${u.firstName} ${u.lastName}` : "—";
          const trainerName = trainerUser.firstName
            ? `${trainerUser.firstName} ${trainerUser.lastName}`
            : "—";
          const goalNames =
            goals.map((g) => g.name).join(", ") || "—";

          return (
            <tr key={trainee.id}>
              <td>{trainee.id}</td>
              <td>{name}</td>
              <td>{u.email || "—"}</td>
              <td>{trainerName}</td>
              <td>{goalNames}</td>
              <td>{trainee.experienceLevel}</td>
              <td>{trainee.weeklyWorkouts}</td>
              <td>
                <span className={`status-badge status-${trainee.status}`}>
                  {trainee.status}
                </span>
              </td>
              <td>{formatDate(trainee.updatedAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default TraineesTable;
