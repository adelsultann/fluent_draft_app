/**
 * FluentDraft — Leaderboard period helpers
 *
 * Pure functions for calculating weekly (Monday–Sunday) period boundaries
 * in UTC. Used for querying and populating leaderboard_entries.
 *
 * Related docs:
 *   - docs/api-contracts.md § Leaderboards
 *   - docs/system-design.md § Gamification Design
 */

/**
 * Get the UTC Monday 00:00:00 of the current week as an ISO string.
 */
export function getWeekStartISO(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString();
}

/**
 * Get the UTC Sunday 23:59:59.999 of the current week as an ISO string.
 */
export function getWeekEndISO(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diffToSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setUTCDate(now.getUTCDate() + diffToSunday);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday.toISOString();
}

/**
 * Get the Monday date string ('YYYY-MM-DD') for the current week.
 */
export function getWeekStartDate(): string {
  const iso = getWeekStartISO();
  return iso.slice(0, 10);
}

/**
 * Get the Sunday date string ('YYYY-MM-DD') for the current week.
 */
export function getWeekEndDate(): string {
  const iso = getWeekEndISO();
  return iso.slice(0, 10);
}
