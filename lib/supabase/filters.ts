/**
 * Builds a PostgREST `or=(...)` filter matching `term` anywhere in any of
 * `columns` (case-insensitive). User input is escaped twice: LIKE wildcards
 * (% _ \) so they match literally, and the value is double-quoted so commas,
 * parentheses and quotes cannot inject extra filter conditions.
 */
export function ilikeAnyFilter(columns: readonly string[], term: string): string {
  const likeEscaped = term.replace(/[\\%_]/g, (c) => `\\${c}`);
  const quoted = `"%${likeEscaped.replace(/["\\]/g, (c) => `\\${c}`)}%"`;
  return columns.map((column) => `${column}.ilike.${quoted}`).join(",");
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Route params are untrusted; reject non-UUIDs before they reach the database. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
