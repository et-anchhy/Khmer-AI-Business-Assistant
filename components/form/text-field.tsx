import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type TextFieldProps = React.ComponentProps<typeof Input> & {
  id: string;
  label: string;
  description?: string;
  error?: string;
  /** Classes for the field wrapper (e.g. grid spans). Use `inputClassName` for the input itself. */
  className?: string;
  inputClassName?: string;
  /** Replaces the default <Input>, e.g. with <PasswordInput>. */
  render?: (props: React.ComponentProps<typeof Input>) => React.ReactNode;
};

/** Label + input + description + error, wired up for accessibility. */
export function TextField({
  id,
  label,
  description,
  error,
  render,
  className,
  inputClassName,
  ...inputProps
}: TextFieldProps) {
  const describedBy = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(" ");
  const props = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
    className: inputClassName,
    ...inputProps,
  };

  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {render ? render(props) : <Input {...props} />}
      {description && !error && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}
