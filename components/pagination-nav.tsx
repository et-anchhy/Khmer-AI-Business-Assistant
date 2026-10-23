import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Previous/next links that keep the current filters. Renders nothing for a single page. */
export function PaginationNav({
  page,
  totalPages,
  hrefForPage,
  labels,
}: {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
  labels: { previous: string; next: string; pageOf: string };
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between gap-2 pt-4" aria-label={labels.pageOf}>
      <p className="text-sm text-muted-foreground">{labels.pageOf}</p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={hrefForPage(page - 1)} rel="prev">
              <ChevronLeft aria-hidden />
              {labels.previous}
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft aria-hidden />
            {labels.previous}
          </Button>
        )}
        {page < totalPages ? (
          <Button asChild variant="outline" size="sm">
            <Link href={hrefForPage(page + 1)} rel="next">
              {labels.next}
              <ChevronRight aria-hidden />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            {labels.next}
            <ChevronRight aria-hidden />
          </Button>
        )}
      </div>
    </nav>
  );
}
