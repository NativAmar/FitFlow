import { useEffect, useState } from "react";
import { getTrainees } from "../services/traineesService";
import InsightCard from "../components/InsightCard";
import TraineesTable from "../components/TraineesTable";

function getMostCommonGoal(trainees) {
  if (trainees.length === 0) return "No data";

  const counts = {};
  let topGoal = trainees[0].fitnessGoal;

  for (const trainee of trainees) {
    const goal = trainee.fitnessGoal;
    counts[goal] = (counts[goal] || 0) + 1;
    if (counts[goal] > counts[topGoal]) {
      topGoal = goal;
    }
  }

  return topGoal;
}

function Dashboard() {
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTrainees() {
      setLoading(true);
      setError("");
      try {
        const data = await getTrainees();
        if (!cancelled) {
          setTrainees(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load trainees.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTrainees();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalTrainees = trainees.length;

  const activeTrainees = trainees.filter(
    (trainee) => trainee.status === "active"
  ).length;

  const pausedTrainees = trainees.filter(
    (trainee) => trainee.status === "paused"
  ).length;

  const activeTraineesRate =
    totalTrainees > 0
      ? Math.round((activeTrainees / totalTrainees) * 100)
      : 0;

  const mostCommonGoal = getMostCommonGoal(trainees);

  const beginnerTrainees = trainees.filter(
    (trainee) => trainee.experienceLevel === "beginner"
  ).length;

  const highCommitmentTrainees = trainees.filter(
    (trainee) => Number(trainee.weeklyWorkouts) >= 4
  ).length;

  return (
    <div className="page">
      <h1>Dashboard</h1>

      {loading && <p className="loading">Loading trainees...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && trainees.length === 0 && (
        <p className="empty-state">No trainees found.</p>
      )}

      {!loading && !error && trainees.length > 0 && (
        <>
          <section className="overview-section">
            <h2>Overview</h2>
            <div className="summary-cards">
              <InsightCard
                title="Total Trainees"
                value={totalTrainees}
                description="All trainees in the system"
                variant="summary"
              />
              <InsightCard
                title="Active Trainees"
                value={activeTrainees}
                description="Currently active"
                variant="summary"
              />
              <InsightCard
                title="Paused Trainees"
                value={pausedTrainees}
                description="Temporarily paused"
                variant="summary"
              />
              <InsightCard
                title="Active Trainees Rate"
                value={`${activeTraineesRate}%`}
                description="Active out of total trainees"
                variant="summary"
              />
            </div>
          </section>

          <section className="insights-section">
            <h2>Training Insights</h2>
            <div className="insight-cards">
              <InsightCard
                title="Most Common Goal"
                value={mostCommonGoal}
                description="Top goal among trainees"
              />
              <InsightCard
                title="Beginner Trainees"
                value={beginnerTrainees}
                description="May need closer guidance"
                variant="accent"
              />
              <InsightCard
                title="High Commitment Trainees"
                value={highCommitmentTrainees}
                description="Training 4+ times per week"
              />
            </div>
          </section>

          <section className="trainees-table-section">
            <h2>All Trainees</h2>
            <TraineesTable trainees={trainees} />
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;
