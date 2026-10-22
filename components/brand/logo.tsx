import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="size-4" aria-hidden />
      </span>
      <span>{label}</span>
    </span>
  );
}
