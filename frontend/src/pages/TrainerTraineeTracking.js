import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getTraineeWorkoutTracking } from "../services/workoutTrackingService";
import { getTraineeById } from "../services/traineesService";
import { currentWeekMonday, isFutureWeek } from "../utils/weekUtils";
import WeekNavigator from "../components/WeekNavigator";
import WorkoutTrackingSummary from "../components/WorkoutTrackingSummary";
import WeeklyWorkoutCard from "../components/WeeklyWorkoutCard";
import { useSocket } from "../context/SocketContext";
import TraineeProgressSummary from "../components/TraineeProgressSummary";

function TrainerTraineeTracking() {
  const { latestNotification } = useSocket();
  const { traineeId }   = useParams();
  const traineeIdNum    = parseInt(traineeId, 10);

  const [weekStart,    setWeekStart]    = useState(() => currentWeekMonday());
  const [tracker,      setTracker]      = useState(null);
  const [traineeInfo,  setTraineeInfo]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [pageError,    setPageError]    = useState(null);

  const activeWeekRef = useRef(weekStart);

  // Load trainee identity once on mount
  useEffect(() => {
    let cancelled = false;
    getTraineeById(traineeIdNum)
      .then((data) => { if (!cancelled) setTraineeInfo(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [traineeIdNum]);

  const loadTracker = useCallback(async (ws) => {
    activeWeekRef.current = ws;
    setTracker(null);
    setLoading(true);
    setPageError(null);

    try {
      const data = await getTraineeWorkoutTracking(traineeIdNum, ws);
      if (activeWeekRef.current !== ws) return;
      setTracker(data);
    } catch (err) {
      if (activeWeekRef.current !== ws) return;
      setPageError(err.message || "Failed to load tracking data.");
    } finally {
      if (activeWeekRef.current === ws) setLoading(false);
    }
  }, [traineeIdNum]);

  useEffect(() => {
    loadTracker(weekStart);
  }, [weekStart, loadTracker]);

  // Targeted refresh when a trainee submits/updates tracking for this specific trainee
  useEffect(() => {
    if (!latestNotification) return;
    if (
      latestNotification.type === "WORKOUT_TRACKING_UPDATED" &&
      latestNotification.metadata &&
      latestNotification.metadata.traineeId === traineeIdNum
    ) {
      loadTracker(weekStart);
    }
  }, [latestNotification, traineeIdNum, weekStart, loadTracker]);

  function handleWeekChange(ws) {
    if (isFutureWeek(ws)) return;
    setWeekStart(ws);
  }

  const traineeName = traineeInfo
    ? `${traineeInfo.user?.firstName || ""} ${traineeInfo.user?.lastName || ""}`.trim() ||
      `Trainee #${traineeIdNum}`
    : `Trainee #${traineeIdNum}`;

  const hasPlan  = tracker && tracker.plan !== null;
  const sessions = tracker ? tracker.sessions || [] : [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="wt-page">
      <div className="wt-header">
        <div className="wp-breadcrumb">
          <Link to="/trainer/trainees">My Trainees</Link>
          <span> / </span>
          <span>{traineeName}</span>
        </div>
        <h1>Weekly Tracking</h1>
        <p className="page-description">
          Viewing tracking for <strong>{traineeName}</strong>
        </p>
        {hasPlan && (
          <p className="wt-plan-name">
            Plan: <strong>{tracker.plan.name}</strong>
          </p>
        )}
      </div>

      <WeekNavigator weekStart={weekStart} onWeekChange={handleWeekChange} />

      {loading && <p className="loading">Loading tracking data…</p>}

      {!loading && pageError && (
        <div>
          <div className="alert alert-error">{pageError}</div>
          <button className="btn btn-secondary" onClick={() => loadTracker(weekStart)}>
            Retry
          </button>
        </div>
      )}

      {!loading && !pageError && (
        <>
          {!hasPlan ? (
            <div className="wt-no-plan">
              <p className="wt-no-plan-title">No workout plan for this week.</p>
              <p className="wt-no-plan-sub">
                This trainee has no active plan assigned for the selected week.
              </p>
            </div>
          ) : (
            <>
              <WorkoutTrackingSummary summary={tracker.summary} />

              <div className="wt-session-list">
                {sessions.map((session) => (
                  <WeeklyWorkoutCard
                    key={session.id}
                    session={session}
                    editable={false}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <TraineeProgressSummary traineeId={traineeIdNum} />
    </div>
  );
}

export default TrainerTraineeTracking;
