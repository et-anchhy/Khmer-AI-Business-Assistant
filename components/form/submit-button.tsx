import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/** Disables itself while pending so a form cannot be submitted twice. */
export function SubmitButton({
  pending,
  disabled,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending && <Spinner aria-hidden />}
      {children}
    </Button>
  );
}
