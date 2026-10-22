import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/** Shows field errors returned by a Server Action under the matching inputs. */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: Record<string, string> | undefined,
): boolean {
  const entries = Object.entries(fieldErrors ?? {}).filter(([key]) => key !== "_form");
  entries.forEach(([key, message], index) =>
    setError(key as Path<T>, { type: "server", message }, { shouldFocus: index === 0 }),
  );
  return entries.length > 0;
}
