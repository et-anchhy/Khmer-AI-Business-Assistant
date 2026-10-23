"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, PackagePlus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/format/money";
import { useI18n } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";
import type { ProductView } from "../types";
import { DeleteProductDialog } from "./delete-product-dialog";
import { ProductThumbnail } from "./product-thumbnail";
import { StockCell } from "./stock-badge";
import { StockDialog } from "./stock-dialog";

type DialogState = { kind: "stock" | "delete"; product: ProductView } | null;

/** Name in the UI language, falling back to the other one. */
export function useProductName() {
  const { locale } = useI18n();
  return (p: Pick<ProductView, "name" | "name_km">) => (locale === "km" && p.name_km ? p.name_km : p.name);
}

export function ProductsTable({
  products,
  currency,
  lowStockThreshold,
}: {
  products: ProductView[];
  currency: string;
  lowStockThreshold: number;
}) {
  const { t, locale } = useI18n();
  const c = t.products.columns;
  const router = useRouter();
  const nameOf = useProductName();
  const [dialog, setDialog] = useState<DialogState>(null);

  const secondaryName = (p: ProductView) => (locale === "km" ? (p.name_km ? p.name : null) : p.name_km);

  const actions = (product: ProductView) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={interpolate(t.products.rowActions, { name: nameOf(product) })}>
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => router.push(`/dashboard/products/${product.id}`)}>
          <Pencil aria-hidden />
          {t.common.edit}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setDialog({ kind: "stock", product })}>
          <PackagePlus aria-hidden />
          {t.products.stock.action}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => setDialog({ kind: "delete", product })}>
          <Trash2 aria-hidden />
          {t.common.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const statusBadge = (product: ProductView) => (
    <Badge variant={product.is_active ? "outline" : "secondary"}>
      {product.is_active ? t.products.badges.active : t.products.badges.inactive}
    </Badge>
  );

  return (
    <>
      {/* Cards on phones */}
      <ul className="flex flex-col gap-2 md:hidden">
        {products.map((product) => (
          <li key={product.id} className="flex items-start gap-3 rounded-xl border bg-card p-3">
            <ProductThumbnail url={product.imageUrl} alt={nameOf(product)} className="size-14" />
            <div className="min-w-0 flex-1">
              <Link href={`/dashboard/products/${product.id}`} className="block truncate font-medium hover:underline">
                {nameOf(product)}
              </Link>
              {secondaryName(product) && <p className="truncate text-sm text-muted-foreground">{secondaryName(product)}</p>}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-medium tabular-nums">{formatMoney(product.price, currency)}</span>
                <StockCell quantity={product.stock_quantity} threshold={lowStockThreshold} />
                {!product.is_active && statusBadge(product)}
              </div>
            </div>
            {actions(product)}
          </li>
        ))}
      </ul>

      {/* Table from tablet up */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">{c.product}</TableHead>
              <TableHead>{c.sku}</TableHead>
              <TableHead className="hidden lg:table-cell">{c.category}</TableHead>
              <TableHead className="text-right">{c.price}</TableHead>
              <TableHead>{c.stock}</TableHead>
              <TableHead>{c.status}</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">{c.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <ProductThumbnail url={product.imageUrl} alt={nameOf(product)} />
                    <div className="min-w-0">
                      <Link href={`/dashboard/products/${product.id}`} className="block max-w-64 truncate font-medium hover:underline">
                        {nameOf(product)}
                      </Link>
                      {secondaryName(product) && (
                        <p className="max-w-64 truncate text-xs text-muted-foreground">{secondaryName(product)}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{product.sku ?? "—"}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{product.category ?? "—"}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatMoney(product.price, currency)}</TableCell>
                <TableCell>
                  <StockCell quantity={product.stock_quantity} threshold={lowStockThreshold} />
                </TableCell>
                <TableCell>{statusBadge(product)}</TableCell>
                <TableCell className="pr-4">{actions(product)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {dialog?.kind === "stock" && (
        <StockDialog product={dialog.product} open onOpenChange={(open) => !open && setDialog(null)} />
      )}
      {dialog?.kind === "delete" && (
        <DeleteProductDialog
          product={{ id: dialog.product.id, name: nameOf(dialog.product) }}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
    </>
  );
}
