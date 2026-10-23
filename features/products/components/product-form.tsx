"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldDescription, FieldError } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveProductAction } from "@/features/products/actions";
import { createProductSchema, type ProductFormInput, type ProductFormValues } from "@/features/products/schemas";
import { applyFieldErrors } from "@/lib/forms";
import { formatNumber } from "@/lib/format/money";
import { useI18n } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";
import { PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES } from "@/lib/uploads/limits";
import { ProductThumbnail } from "./product-thumbnail";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

export function ProductForm({
  productId,
  defaultValues,
  imageUrl,
  currency,
  categories,
  currentStock,
}: {
  /** Present when editing. */
  productId?: string;
  /** Shown read-only when editing; stock then changes only through the stock dialog. */
  currentStock?: number;
  defaultValues: DefaultValues<ProductFormInput>;
  imageUrl: string | null;
  currency: string;
  categories: string[];
}) {
  const { t } = useI18n();
  const f = t.products.fields;
  const p = t.products.placeholders;
  const router = useRouter();
  const categoryListId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const schema = useMemo(() => createProductSchema(t.validation), [t]);
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({ resolver: zodResolver(schema), defaultValues });

  // Photo state lives outside react-hook-form: a File is not form data we validate with zod.
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const shownImage = preview ?? (removeImage ? null : imageUrl);
  const photoChanged = file !== null || removeImage;

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function pickFile(selected: File | undefined) {
    setImageError(null);
    if (!selected) return;
    if (!(PRODUCT_IMAGE_TYPES as readonly string[]).includes(selected.type)) {
      setImageError(t.products.errors.imageUnsupported);
      return;
    }
    if (selected.size > PRODUCT_IMAGE_MAX_BYTES) {
      setImageError(t.products.errors.imageTooLarge);
      return;
    }
    setFile(selected);
    setRemoveImage(false);
    setPreview(URL.createObjectURL(selected));
  }

  function clearPhoto() {
    setFile(null);
    setPreview(null);
    setRemoveImage(true);
    if (fileInput.current) fileInput.current.value = "";
  }

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const formData = new FormData();
      formData.set("values", JSON.stringify(values));
      if (productId) formData.set("id", productId);
      if (file) formData.set("image", file);
      if (removeImage) formData.set("removeImage", "1");

      const result = await saveProductAction(formData);
      if (!result.ok) {
        if (result.fieldErrors?.image) setImageError(result.fieldErrors.image);
        if (!applyFieldErrors(setError, result.fieldErrors) && !result.fieldErrors?.image) toast.error(result.error);
        return;
      }
      toast.success(result.message);
      if (!productId) {
        router.push("/dashboard/products");
        return;
      }
      reset(values);
      setFile(null);
      setPreview(null);
      setRemoveImage(false);
      router.refresh();
    }),
  );

  const textarea = (name: "description" | "descriptionKm") => (
    <FormField id={name} label={f[name]} error={errors[name]?.message}>
      {(control) => (
        <Textarea {...control} rows={3} placeholder={p[name]} lang={name === "descriptionKm" ? "km" : undefined} {...register(name)} />
      )}
    </FormField>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Section title={t.products.sections.details} description={t.products.sections.detailsDescription}>
        <TextField id="name" label={f.name} placeholder={p.name} error={errors.name?.message} {...register("name")} />
        <TextField id="nameKm" lang="km" label={f.nameKm} placeholder={p.nameKm} error={errors.nameKm?.message} {...register("nameKm")} />
        {textarea("description")}
        {textarea("descriptionKm")}
        <TextField
          id="sku"
          label={f.sku}
          description={f.skuHint}
          placeholder={p.sku}
          autoComplete="off"
          error={errors.sku?.message}
          inputClassName="font-mono"
          {...register("sku")}
        />
        <TextField
          id="category"
          label={f.category}
          placeholder={p.category}
          list={categoryListId}
          autoComplete="off"
          error={errors.category?.message}
          {...register("category")}
        />
        <datalist id={categoryListId}>
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </Section>

      <Section title={t.products.sections.pricing} description={t.products.sections.pricingDescription}>
        <TextField
          id="price"
          type="number"
          inputMode="decimal"
          min={0}
          step={currency === "KHR" ? 100 : 0.01}
          label={interpolate(f.price, { currency })}
          error={errors.price?.message}
          {...register("price")}
        />
        {productId ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{f.currentStock}</span>
            <span className="text-lg font-semibold tabular-nums">{formatNumber(currentStock ?? 0)}</span>
            <span className="text-sm text-muted-foreground">{f.currentStockHint}</span>
          </div>
        ) : (
          <TextField
            id="stockQuantity"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            label={f.stockQuantity}
            error={errors.stockQuantity?.message}
            {...register("stockQuantity")}
          />
        )}
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <div className="flex items-start gap-3 sm:col-span-2">
              <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} aria-describedby="isActive-hint" />
              <div className="grid gap-1">
                <label htmlFor="isActive" className="text-sm leading-none font-medium">
                  {f.isActive}
                </label>
                <p id="isActive-hint" className="text-sm text-muted-foreground">
                  {f.isActiveHint}
                </p>
              </div>
            </div>
          )}
        />
      </Section>

      <Section title={t.products.sections.image} description={t.products.sections.imageDescription}>
        <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center">
          <ProductThumbnail url={shownImage} alt={f.noImage} className="size-28 rounded-xl" />
          <div className="flex flex-col gap-2">
            <input
              ref={fileInput}
              type="file"
              accept={PRODUCT_IMAGE_TYPES.join(",")}
              className="sr-only"
              id="image"
              aria-describedby="image-help"
              onChange={(event) => pickFile(event.target.files?.[0])}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
                <ImagePlus aria-hidden />
                {shownImage ? f.changeImage : f.chooseImage}
              </Button>
              {shownImage && (
                <Button type="button" variant="ghost" onClick={clearPhoto}>
                  <Trash2 aria-hidden />
                  {f.removeImage}
                </Button>
              )}
            </div>
            {imageError ? (
              <FieldError id="image-help">{imageError}</FieldError>
            ) : (
              <FieldDescription id="image-help">{shownImage ? file?.name : f.noImage}</FieldDescription>
            )}
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <SubmitButton
          pending={isPending}
          size="lg"
          disabled={Boolean(productId) && !isDirty && !photoChanged}
          className="w-full sm:w-auto"
        >
          {productId ? t.products.submitUpdate : t.products.submitCreate}
        </SubmitButton>
      </div>
    </form>
  );
}
