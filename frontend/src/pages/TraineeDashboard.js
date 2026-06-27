import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyTraineeProfile } from "../services/traineesService";
import { getMyWorkoutTracking } from "../services/workoutTrackingService";
import InsightCard from "../components/InsightCard";
import WorkoutTrackingSummary from "../components/WorkoutTrackingSummary";

function TraineeDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [profileData, trackingData] = await Promise.all([
          getMyTraineeProfile(),
          getMyWorkoutTracking().catch(() => null),
        ]);
        if (!cancelled) {
          setProfile(profileData);
          setTracking(trackingData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load your profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName =
    user?.displayName || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Trainee";

  if (loading) {
    return (
      <div className="page">
        <h1>My Dashboard</h1>
        <p className="loading">Loading your profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h1>My Dashboard</h1>
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <h1>My Dashboard</h1>
        <p className="empty-state">Profile not found.</p>
      </div>
    );
  }

  const trainerUser = profile.trainer?.user;
  const trainerName = trainerUser
    ? `${trainerUser.firstName} ${trainerUser.lastName}`
    : "—";
  const goals = profile.goals || [];

  return (
    <div className="page">
      <h1>Welcome, {displayName}</h1>

      <section className="overview-section">
        <h2>My Profile</h2>
        <div className="summary-cards">
          <InsightCard
            title="Trainer"
            value={trainerName}
            description="Your assigned trainer"
            variant="summary"
          />
          <InsightCard
            title="Experience Level"
            value={profile.experienceLevel}
            description="Current experience level"
            variant="summary"
          />
          <InsightCard
            title="Weekly Workouts"
            value={profile.weeklyWorkouts}
            description="Sessions per week"
            variant="summary"
          />
          <InsightCard
            title="Training Status"
            value={profile.status}
            description="Current training status"
            variant="summary"
          />
        </div>
      </section>

      <section className="insights-section">
        <h2>My Goals</h2>
        {goals.length === 0 ? (
          <p className="empty-state">No goals assigned yet.</p>
        ) : (
          <div className="goals-list">
            {goals.map((goal) => (
              <div key={goal.id} className="goal-item">
                <span className="goal-name">{goal.name}</span>
                <span
                  className={`status-badge status-${goal.goalStatus?.replace(/\s+/g, "-")}`}
                >
                  {goal.goalStatus}
                </span>
                {goal.targetDate && (
                  <span className="goal-target-date">
                    Target: {goal.targetDate}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="insights-section">
        <h2>This Week's Training</h2>
        {tracking ? (
          <>
            <WorkoutTrackingSummary summary={tracking.summary} />
            {tracking.sessions && tracking.sessions.length > 0 && (
              <div className="goals-list" style={{ marginTop: "1rem" }}>
                {tracking.sessions.map((session) => (
                  <div key={session.id} className="goal-item">
                    <span className="goal-name">
                      {session.scheduledDay
                        ? session.scheduledDay.charAt(0).toUpperCase() + session.scheduledDay.slice(1)
                        : "Unscheduled"}{" "}
                      — {session.name}
                    </span>
                    <span
                      className={`status-badge ${session.tracking?.isCompleted ? "status-completed" : "status-pending"}`}
                    >
                      {session.tracking?.isCompleted ? "Done" : "Pending"}
                    </span>
                    <span className="goal-target-date">
                      {session.exerciseAssignments?.length ?? 0} exercises
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="empty-state">No active workout plan for this week.</p>
        )}
      </section>

      {profile.notes && (
        <section className="insights-section">
          <h2>Trainer Notes</h2>
          <p className="notes-text">{profile.notes}</p>
        </section>
      )}
    </div>
  );
}

export default TraineeDashboard;
