"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format/money";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { stockStatus } from "../stock";

export function StockCell({ quantity, threshold }: { quantity: number; threshold: number }) {
  const { t } = useI18n();
  const status = stockStatus(quantity, threshold);

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={cn("tabular-nums", status !== "in" && "font-medium")}>{formatNumber(quantity)}</span>
      {status !== "in" && (
        <Badge
          variant={status === "out" ? "destructive" : "secondary"}
          className={cn(status === "low" && "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200")}
        >
          <AlertTriangle aria-hidden />
          {t.products.badges[status]}
        </Badge>
      )}
    </span>
  );
}
