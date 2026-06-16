function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString();
}

function TraineesTable({ trainees }) {
  if (!trainees || trainees.length === 0) {
    return (
      <table className="trainees-table">
        <thead>
          <tr>
            <th>Trainee ID</th>
            <th>User ID</th>
            <th>Trainer ID</th>
            <th>Fitness Goal</th>
            <th>Experience Level</th>
            <th>Weekly Workouts</th>
            <th>Status</th>
            <th>Updated At</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="8" className="table-empty">
              No trainees to display.
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className="trainees-table">
      <thead>
        <tr>
          <th>Trainee ID</th>
          <th>User ID</th>
          <th>Trainer ID</th>
          <th>Fitness Goal</th>
          <th>Experience Level</th>
          <th>Weekly Workouts</th>
          <th>Status</th>
          <th>Updated At</th>
        </tr>
      </thead>
      <tbody>
        {trainees.map((trainee) => (
          <tr key={trainee.traineeId}>
            <td>{trainee.traineeId}</td>
            <td>{trainee.userId}</td>
            <td>{trainee.trainerId}</td>
            <td>{trainee.fitnessGoal}</td>
            <td>{trainee.experienceLevel}</td>
            <td>{trainee.weeklyWorkouts}</td>
            <td>
              <span className={`status-badge status-${trainee.status}`}>
                {trainee.status}
              </span>
            </td>
            <td>{formatDate(trainee.updateDate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TraineesTable;
