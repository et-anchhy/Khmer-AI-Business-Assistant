"use client";

import { useState } from "react";
import { PackagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { DeleteProductDialog } from "./delete-product-dialog";
import { StockDialog } from "./stock-dialog";

export function ProductDetailActions({ product }: { product: { id: string; name: string; stock_quantity: number } }) {
  const { t } = useI18n();
  const [open, setOpen] = useState<"stock" | "delete" | null>(null);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen("stock")}>
        <PackagePlus aria-hidden />
        {t.products.stock.action}
      </Button>
      <Button variant="destructive" onClick={() => setOpen("delete")}>
        <Trash2 aria-hidden />
        {t.common.delete}
      </Button>
      <StockDialog product={product} open={open === "stock"} onOpenChange={(o) => setOpen(o ? "stock" : null)} />
      <DeleteProductDialog
        product={product}
        open={open === "delete"}
        onOpenChange={(o) => setOpen(o ? "delete" : null)}
        redirectTo="/dashboard/products"
      />
    </>
  );
}
