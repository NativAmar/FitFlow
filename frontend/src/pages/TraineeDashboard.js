import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyTraineeProfile } from "../services/traineesService";
import InsightCard from "../components/InsightCard";

function TraineeDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const data = await getMyTraineeProfile();
        if (!cancelled) {
          setProfile(data);
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

    loadProfile();
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
