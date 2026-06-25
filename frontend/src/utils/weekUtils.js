// ── DATEONLY-safe date helpers (no UTC / timezone shifting) ───────────────────

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_NAMES   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

/** Convert a local Date to YYYY-MM-DD without UTC conversion. */
function toDateString(d) {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string into a local Date (no UTC shift). */
function parseDateOnly(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Return the YYYY-MM-DD of the Monday of the week containing the given local Date. */
function getMondayOf(localDate) {
  const dow  = localDate.getDay();                  // 0=Sun … 6=Sat
  const diff = dow === 0 ? -6 : 1 - dow;            // days back to Monday
  return toDateString(
    new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate() + diff)
  );
}

/** YYYY-MM-DD of this week's Monday in local time. */
function currentWeekMonday() {
  return getMondayOf(new Date());
}

/** YYYY-MM-DD of the Sunday at the end of the given Monday week. */
function weekEndOf(weekStartStr) {
  const [y, m, d] = weekStartStr.split("-").map(Number);
  return toDateString(new Date(y, m - 1, d + 6));
}

/** Add (or subtract) n weeks from a YYYY-MM-DD weekStart string. */
function addWeeks(weekStartStr, n) {
  const [y, m, d] = weekStartStr.split("-").map(Number);
  return toDateString(new Date(y, m - 1, d + n * 7));
}

/** True when weekStartStr equals the current week's Monday. */
function isCurrentWeek(weekStartStr) {
  return weekStartStr === currentWeekMonday();
}

/** True when weekStartStr is strictly after the current week's Monday. */
function isFutureWeek(weekStartStr) {
  return weekStartStr > currentWeekMonday();
}

/**
 * Format a DATEONLY string as "Mon Jun 22, 2026" without timezone shift.
 */
function formatDateOnly(str) {
  if (!str) return "";
  const [y, m, d] = str.split("-").map(Number);
  return `${MONTH_SHORT[m - 1]} ${d}, ${y}`;
}

/**
 * Format a week range as "Mon Jun 22 – Sun Jun 28, 2026".
 */
function formatWeekRange(weekStartStr) {
  const [y, m, d] = weekStartStr.split("-").map(Number);
  const mon = new Date(y, m - 1, d);
  const sun = new Date(y, m - 1, d + 6);
  const monStr = `${DAY_NAMES[mon.getDay()].slice(0, 3)} ${MONTH_SHORT[mon.getMonth()]} ${mon.getDate()}`;
  const sunStr = `${DAY_NAMES[sun.getDay()].slice(0, 3)} ${MONTH_SHORT[sun.getMonth()]} ${sun.getDate()}`;
  return `${monStr} – ${sunStr}, ${sun.getFullYear()}`;
}

/**
 * Format a full ISO datetime string for display, e.g. "Jun 23, 2026 at 6:20 PM".
 * Safe to use on completedAt values from the server.
 */
function formatDateTime(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return null;
  const date = `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const h    = d.getHours();
  const min  = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h % 12 || 12;
  return `${date} at ${h12}:${min} ${ampm}`;
}

export {
  toDateString,
  parseDateOnly,
  getMondayOf,
  currentWeekMonday,
  weekEndOf,
  addWeeks,
  isCurrentWeek,
  isFutureWeek,
  formatDateOnly,
  formatWeekRange,
  formatDateTime,
};
