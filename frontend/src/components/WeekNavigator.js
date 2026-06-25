import { addWeeks, currentWeekMonday, formatWeekRange, isCurrentWeek, isFutureWeek } from "../utils/weekUtils";

function WeekNavigator({ weekStart, onWeekChange }) {
  const current  = isCurrentWeek(weekStart);
  const nextWeek = addWeeks(weekStart, 1);
  const canGoNext = !isFutureWeek(nextWeek);

  return (
    <div className="wt-week-navigation">
      <button
        type="button"
        className="btn btn-sm btn-outline"
        onClick={() => onWeekChange(addWeeks(weekStart, -1))}
        aria-label="Previous week"
      >
        ← Prev
      </button>

      <div className="wt-week-label">
        <span className="wt-week-range">{formatWeekRange(weekStart)}</span>
        {!current && (
          <span className="wt-week-badge wt-week-badge--past">Past Week</span>
        )}
      </div>

      <div className="wt-week-nav-right">
        {!current && (
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => onWeekChange(currentWeekMonday())}
          >
            Current Week
          </button>
        )}
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => onWeekChange(nextWeek)}
          disabled={!canGoNext}
          aria-label="Next week"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default WeekNavigator;
