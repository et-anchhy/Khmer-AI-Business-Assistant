"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useI18n } from "@/lib/i18n/client";

const ALL = "__all__";

export type ToolbarFilter = {
  /** URL search param name. */
  key: string;
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
};

/**
 * Debounced search box plus select filters, all stored in the URL so results
 * are shareable and survive a refresh. Changing anything resets to page 1.
 */
export function ListToolbar({
  searchPlaceholder,
  searchLabel,
  filters,
}: {
  searchPlaceholder: string;
  searchLabel: string;
  filters: ToolbarFilter[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  const debouncedSearch = useDebouncedCallback((value: string) => update({ q: value.trim() || null }), 300);
  const keys = ["q", ...filters.map((f) => f.key)];
  const hasFilters = keys.some((key) => searchParams.get(key));

  return (
    <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={query}
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
          className="pl-8"
          onChange={(event) => {
            setQuery(event.target.value);
            debouncedSearch(event.target.value);
          }}
        />
        {isPending && <Spinner className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground" />}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={searchParams.get(filter.key) ?? ALL}
            onValueChange={(value) => update({ [filter.key]: value === ALL ? null : value })}
          >
            <SelectTrigger aria-label={filter.label} className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{filter.allLabel}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setQuery("");
              update(Object.fromEntries(keys.map((key) => [key, null])));
            }}
          >
            <X aria-hidden />
            {t.common.clearFilters}
          </Button>
        )}
      </div>
    </div>
  );
}
