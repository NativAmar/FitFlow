function TrainersTable({ trainers, onEdit, onStatusChange }) {
  const isEmpty = !trainers || trainers.length === 0;

  const headers = (
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Email</th>
      <th>Specialization</th>
      <th>Account Status</th>
      <th>Trainees</th>
      <th>Actions</th>
    </tr>
  );

  if (isEmpty) {
    return (
      <table className="trainers-table">
        <thead>{headers}</thead>
        <tbody>
          <tr>
            <td colSpan="7" className="table-empty">
              No trainers to display.
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className="trainers-table">
      <thead>{headers}</thead>
      <tbody>
        {trainers.map((trainer) => {
          const u = trainer.user || {};
          const name = u.firstName
            ? `${u.firstName} ${u.lastName}`.trim()
            : "—";
          const isActive = trainer.accountStatus === "active";

          return (
            <tr key={trainer.id}>
              <td>{trainer.id}</td>
              <td>{name}</td>
              <td>{u.email || "—"}</td>
              <td>{trainer.specialization || "—"}</td>
              <td>
                <span
                  className={`status-badge status-${trainer.accountStatus}`}
                  aria-label={`Account status: ${trainer.accountStatus}`}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td>{trainer.traineeCount ?? 0}</td>
              <td className="table-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => onEdit(trainer)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    isActive ? "btn-danger" : "btn-accent"
                  }`}
                  onClick={() => onStatusChange(trainer)}
                >
                  {isActive ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default TrainersTable;
