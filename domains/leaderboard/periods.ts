/**
 * FluentDraft — Leaderboard period helpers
 *
 * Pure functions for calculating weekly (Monday–Sunday) and monthly
 * (1st–last day) period boundaries in UTC.
 *
 * Related docs:
 *   - docs/api-contracts.md § Leaderboards
 *   - docs/system-design.md § Gamification Design
 */

// ---------------------------------------------------------------------------
// Weekly (Monday 00:00 – Sunday 23:59:59.999 UTC)
// ---------------------------------------------------------------------------

/** Get the UTC Monday 00:00:00 of the current week as an ISO string. */
export function getWeekStartISO(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString();
}

/** Get the UTC Sunday 23:59:59.999 of the current week as an ISO string. */
export function getWeekEndISO(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diffToSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setUTCDate(now.getUTCDate() + diffToSunday);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday.toISOString();
}

/** Get the Monday date string ('YYYY-MM-DD') for the current week. */
export function getWeekStartDate(): string {
  return getWeekStartISO().slice(0, 10);
}

/** Get the Sunday date string ('YYYY-MM-DD') for the current week. */
export function getWeekEndDate(): string {
  return getWeekEndISO().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Monthly (1st 00:00 – last day 23:59:59.999 UTC)
// ---------------------------------------------------------------------------

/** Get the UTC 1st day 00:00:00 of the current month as an ISO string. */
export function getMonthStartISO(): string {
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  return first.toISOString();
}

/** Get the UTC last day 23:59:59.999 of the current month as an ISO string. */
export function getMonthEndISO(): string {
  const now = new Date();
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return last.toISOString();
}

/** Get the 1st day date string ('YYYY-MM-DD') for the current month. */
export function getMonthStartDate(): string {
  return getMonthStartISO().slice(0, 10);
}

/** Get the last day date string ('YYYY-MM-DD') for the current month. */
export function getMonthEndDate(): string {
  return getMonthEndISO().slice(0, 10);
}
