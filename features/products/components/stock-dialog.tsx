"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateStockAction } from "@/features/products/actions";
import { createStockUpdateSchema } from "@/features/products/schemas";
import { formatNumber } from "@/lib/format/money";
import { useI18n } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

type Mode = "add" | "set";

export function StockDialog({
  product,
  open,
  onOpenChange,
}: {
  product: { id: string; name: string; stock_quantity: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const s = t.products.stock;
  const inputId = useId();
  const [mode, setMode] = useState<Mode>("add");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const schema = useMemo(() => createStockUpdateSchema(t.validation), [t]);

  const parsed = schema.safeParse({ mode, amount });
  const preview = parsed.success
    ? parsed.data.mode === "add"
      ? product.stock_quantity + parsed.data.amount
      : parsed.data.amount
    : null;

  function reset(nextOpen: boolean) {
    if (!nextOpen) {
      setAmount("");
      setError(null);
      setMode("add");
    }
    onOpenChange(nextOpen);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t.validation.stockChangeInvalid);
      return;
    }
    if (preview !== null && preview < 0) {
      setError(t.products.errors.stockBelowZero);
      return;
    }
    startTransition(async () => {
      const result = await updateStockAction(product.id, parsed.data);
      if (result.ok) {
        toast.success(result.message);
        reset(false);
      } else {
        setError(result.fieldErrors?.amount ?? result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{s.action}</DialogTitle>
            <DialogDescription>
              {interpolate(s.description, { name: product.name, count: formatNumber(product.stock_quantity) })}
            </DialogDescription>
          </DialogHeader>

          <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["add", "set"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => {
                  setMode(value);
                  setError(null);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "add" ? s.modeAdd : s.modeSet}
              </button>
            ))}
          </div>

          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={inputId}>{mode === "add" ? s.change : s.newQuantity}</FieldLabel>
            <Input
              id={inputId}
              type="number"
              inputMode="numeric"
              step={1}
              min={mode === "set" ? 0 : undefined}
              autoFocus
              value={amount}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setAmount(event.target.value);
                setError(null);
              }}
            />
            {error ? (
              <FieldError>{error}</FieldError>
            ) : mode === "add" ? (
              <FieldDescription>{s.changeHint}</FieldDescription>
            ) : null}
          </Field>

          {preview !== null && preview >= 0 && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {interpolate(s.result, { count: formatNumber(preview) })}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => reset(false)}>
              {t.common.cancel}
            </Button>
            <SubmitButton pending={isPending}>{s.submit}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
