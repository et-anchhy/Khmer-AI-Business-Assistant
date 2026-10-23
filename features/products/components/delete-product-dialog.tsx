"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteProductAction } from "@/features/products/actions";
import { useI18n } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
  redirectTo,
}: {
  product: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where to go after deleting, e.g. back to the list from the edit page. */
  redirectTo?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t.products.delete.title}
      description={interpolate(t.products.delete.description, { name: product.name })}
      confirmLabel={t.products.delete.confirm}
      onConfirm={() => deleteProductAction(product.id)}
      onDone={redirectTo ? () => router.replace(redirectTo) : undefined}
    />
  );
}
