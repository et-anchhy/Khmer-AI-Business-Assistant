"use client";

import { useMemo, useTransition } from "react";
import { Controller, useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBusinessAction, updateBusinessAction } from "@/features/business/actions";
import { BUSINESS_LANGUAGES, BUSINESS_TYPES, CURRENCIES } from "@/features/business/constants";
import {
  createBusinessSchema,
  type BusinessFormInput,
  type BusinessFormValues,
} from "@/features/business/schemas";
import { applyFieldErrors } from "@/lib/forms";
import { useI18n } from "@/lib/i18n/client";

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

/** Used for onboarding (create) and Settings (edit). */
export function BusinessForm({
  mode,
  defaultValues,
}: {
  mode: "create" | "edit";
  defaultValues: DefaultValues<BusinessFormInput>;
}) {
  const { t } = useI18n();
  const f = t.business.fields;
  const p = t.business.placeholders;
  const [isPending, startTransition] = useTransition();
  const schema = useMemo(() => createBusinessSchema(t.validation), [t]);
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<BusinessFormInput, unknown, BusinessFormValues>({ resolver: zodResolver(schema), defaultValues });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = mode === "create" ? await createBusinessAction(values) : await updateBusinessAction(values);
      if (result.ok) {
        toast.success(result.message);
        reset(values);
        return;
      }
      if (!applyFieldErrors(setError, result.fieldErrors)) toast.error(result.error);
    }),
  );

  const textarea = (name: "description" | "openingHours" | "deliveryInfo" | "paymentInfo", rows: number) => (
    <FormField id={name} label={f[name]} error={errors[name]?.message} className="sm:col-span-2">
      {(control) => <Textarea {...control} rows={rows} placeholder={p[name]} {...register(name)} />}
    </FormField>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Section title={t.business.sections.basics} description={t.business.sections.basicsDescription}>
        <TextField id="name" label={f.name} placeholder={p.name} error={errors.name?.message} {...register("name")} />
        <FormField id="businessType" label={f.businessType} error={errors.businessType?.message}>
          {(fieldProps) => (
            <Controller
              control={control}
              name="businessType"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger {...fieldProps} ref={field.ref} onBlur={field.onBlur} className="w-full">
                    <SelectValue placeholder={f.selectType} />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t.business.types[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
        {textarea("description", 3)}
      </Section>

      <Section title={t.business.sections.contact} description={t.business.sections.contactDescription}>
        <TextField
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          label={f.phone}
          placeholder={p.phone}
          error={errors.phone?.message}
          {...register("phone")}
        />
        <TextField
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          label={f.email}
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField
          id="address"
          label={f.address}
          placeholder={p.address}
          autoComplete="street-address"
          error={errors.address?.message}
          className="sm:col-span-2"
          {...register("address")}
        />
      </Section>

      <Section title={t.business.sections.operations} description={t.business.sections.operationsDescription}>
        {textarea("openingHours", 2)}
        {textarea("deliveryInfo", 3)}
        {textarea("paymentInfo", 3)}
      </Section>

      <Section title={t.business.sections.preferences} description={t.business.sections.preferencesDescription}>
        <FormField id="currency" label={f.currency} error={errors.currency?.message}>
          {(fieldProps) => (
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger {...fieldProps} ref={field.ref} onBlur={field.onBlur} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {t.business.currencies[currency]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
        <FormField
          id="preferredLanguage"
          label={f.preferredLanguage}
          description={f.preferredLanguageHint}
          error={errors.preferredLanguage?.message}
        >
          {(fieldProps) => (
            <Controller
              control={control}
              name="preferredLanguage"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger {...fieldProps} ref={field.ref} onBlur={field.onBlur} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_LANGUAGES.map((language) => (
                      <SelectItem key={language} value={language}>
                        {t.business.languages[language]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
        <TextField
          id="lowStockThreshold"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          label={f.lowStockThreshold}
          description={f.lowStockThresholdHint}
          error={errors.lowStockThreshold?.message}
          {...register("lowStockThreshold")}
        />
      </Section>

      <div className="flex justify-end">
        <SubmitButton pending={isPending} size="lg" disabled={mode === "edit" && !isDirty} className="w-full sm:w-auto">
          {mode === "create" ? t.business.onboarding.submit : t.business.settings.submit}
        </SubmitButton>
      </div>
    </form>
  );
}
