/** Builds a list URL that keeps the active filters and sets the page (page 1 is omitted). */
export function listHref(basePath: string, filters: Record<string, string | undefined>, page = 1): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
