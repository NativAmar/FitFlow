function WorkoutTrackingSummary({ summary }) {
  if (!summary) return null;
  const { plannedWorkouts, completedWorkouts, remainingWorkouts, completionRate } = summary;

  return (
    <div className="wt-summary">
      <div className="wt-summary-card">
        <div className="wt-summary-value">{plannedWorkouts}</div>
        <div className="wt-summary-label">Planned</div>
      </div>
      <div className="wt-summary-card wt-summary-card--completed">
        <div className="wt-summary-value">{completedWorkouts}</div>
        <div className="wt-summary-label">Completed</div>
      </div>
      <div className="wt-summary-card wt-summary-card--remaining">
        <div className="wt-summary-value">{remainingWorkouts}</div>
        <div className="wt-summary-label">Remaining</div>
      </div>
      <div className="wt-summary-card wt-summary-card--rate">
        <div className="wt-summary-value">{completionRate}%</div>
        <div className="wt-summary-label">Completion Rate</div>
      </div>
    </div>
  );
}

export default WorkoutTrackingSummary;
