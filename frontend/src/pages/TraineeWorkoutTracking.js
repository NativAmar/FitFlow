import { useState, useEffect, useCallback, useRef } from "react";
import {
  getMyWorkoutTracking,
  updateMyWorkoutTracking,
} from "../services/workoutTrackingService";
import { currentWeekMonday, isCurrentWeek, isFutureWeek } from "../utils/weekUtils";
import WeekNavigator from "../components/WeekNavigator";
import WorkoutTrackingSummary from "../components/WorkoutTrackingSummary";
import WeeklyWorkoutCard from "../components/WeeklyWorkoutCard";

function TraineeWorkoutTracking() {
  const [weekStart,    setWeekStart]    = useState(() => currentWeekMonday());
  const [tracker,      setTracker]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [pageError,    setPageError]    = useState(null);
  const [draftStates,  setDraftStates]  = useState({}); // { [sessionId]: { completed, notes } }
  const [cardFeedback, setCardFeedback] = useState({}); // { [sessionId]: { saving, error, success } }

  // Stale-response guard: only apply responses for the currently selected week
  const activeWeekRef = useRef(weekStart);

  const loadTracker = useCallback(async (ws) => {
    activeWeekRef.current = ws;
    setTracker(null);
    setDraftStates({});
    setCardFeedback({});
    setLoading(true);
    setPageError(null);

    try {
      const data = await getMyWorkoutTracking(ws);
      if (activeWeekRef.current !== ws) return;

      setTracker(data);
      const initial = {};
      for (const s of (data.sessions || [])) {
        initial[s.id] = {
          completed: s.tracking.isCompleted,
          notes:     s.tracking.notes || "",
        };
      }
      setDraftStates(initial);
    } catch (err) {
      if (activeWeekRef.current !== ws) return;
      setPageError(err.message || "Failed to load tracking data.");
    } finally {
      if (activeWeekRef.current === ws) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTracker(weekStart);
  }, [weekStart, loadTracker]);

  function handleWeekChange(ws) {
    if (isFutureWeek(ws)) return;
    setWeekStart(ws);
  }

  function handleCompletedChange(sessionId, value) {
    setDraftStates((prev) => ({
      ...prev,
      [sessionId]: { ...prev[sessionId], completed: value },
    }));
    // Clear any prior feedback when the user edits
    setCardFeedback((prev) => ({ ...prev, [sessionId]: { saving: false, error: null, success: false } }));
  }

  function handleNotesChange(sessionId, value) {
    setDraftStates((prev) => ({
      ...prev,
      [sessionId]: { ...prev[sessionId], notes: value },
    }));
    setCardFeedback((prev) => ({ ...prev, [sessionId]: { saving: false, error: null, success: false } }));
  }

  async function handleSave(sessionId) {
    const draft = draftStates[sessionId];
    if (!draft) return;

    setCardFeedback((prev) => ({
      ...prev,
      [sessionId]: { saving: true, error: null, success: false },
    }));

    try {
      const result = await updateMyWorkoutTracking(sessionId, weekStart, {
        completed: draft.completed,
        notes:     draft.notes,
      });

      if (activeWeekRef.current !== weekStart) return;

      setTracker(result);

      // Sync draft states: update the saved card from server; preserve other cards' edits
      setDraftStates((prev) => {
        const next = {};
        for (const s of (result.sessions || [])) {
          if (s.id === sessionId) {
            next[s.id] = { completed: s.tracking.isCompleted, notes: s.tracking.notes || "" };
          } else {
            next[s.id] = prev[s.id] || { completed: s.tracking.isCompleted, notes: s.tracking.notes || "" };
          }
        }
        return next;
      });

      setCardFeedback((prev) => ({
        ...prev,
        [sessionId]: { saving: false, error: null, success: true },
      }));

      setTimeout(() => {
        setCardFeedback((prev) => ({
          ...prev,
          [sessionId]: { ...prev[sessionId], success: false },
        }));
      }, 3000);
    } catch (err) {
      if (activeWeekRef.current !== weekStart) return;
      setCardFeedback((prev) => ({
        ...prev,
        [sessionId]: {
          saving:  false,
          error:   err.message || "Save failed. Please try again.",
          success: false,
        },
      }));
    }
  }

  const currentWeek = isCurrentWeek(weekStart);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="wt-page">
        <h1>Weekly Tracking</h1>
        <WeekNavigator weekStart={weekStart} onWeekChange={handleWeekChange} />
        <p className="loading">Loading tracking data…</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="wt-page">
        <h1>Weekly Tracking</h1>
        <WeekNavigator weekStart={weekStart} onWeekChange={handleWeekChange} />
        <div className="alert alert-error">{pageError}</div>
        <button className="btn btn-secondary" onClick={() => loadTracker(weekStart)}>
          Retry
        </button>
      </div>
    );
  }

  const hasPlan    = tracker && tracker.plan !== null;
  const sessions   = tracker ? tracker.sessions || [] : [];
  const summary    = tracker ? tracker.summary : null;

  return (
    <div className="wt-page">
      <div className="wt-header">
        <h1>Weekly Tracking</h1>
        {hasPlan && (
          <p className="wt-plan-name">
            Plan: <strong>{tracker.plan.name}</strong>
          </p>
        )}
      </div>

      <WeekNavigator weekStart={weekStart} onWeekChange={handleWeekChange} />

      {!currentWeek && (
        <div className="wt-past-notice">
          Viewing a past week — you can still update notes and completion status.
        </div>
      )}

      {!hasPlan ? (
        <div className="wt-no-plan">
          <p className="wt-no-plan-title">No workout plan for this week.</p>
          {currentWeek && (
            <p className="wt-no-plan-sub">
              Your trainer has not activated a workout plan yet. Check back later or contact your trainer.
            </p>
          )}
        </div>
      ) : (
        <>
          <WorkoutTrackingSummary summary={summary} />

          <div className="wt-session-list">
            {sessions.map((session) => {
              const draft    = draftStates[session.id] || { completed: session.tracking.isCompleted, notes: session.tracking.notes || "" };
              const feedback = cardFeedback[session.id] || { saving: false, error: null, success: false };
              return (
                <WeeklyWorkoutCard
                  key={session.id}
                  session={session}
                  editable
                  draftCompleted={draft.completed}
                  draftNotes={draft.notes}
                  onCompletedChange={handleCompletedChange}
                  onNotesChange={handleNotesChange}
                  onSave={handleSave}
                  saving={feedback.saving}
                  feedback={feedback}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default TraineeWorkoutTracking;
