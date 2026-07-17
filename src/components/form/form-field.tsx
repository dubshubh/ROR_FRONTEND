import { FieldError } from "react-hook-form";

export function FormField({
  label,
  error,
  children
}: {
  label: string;
  error?: FieldError;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#d91b1b]">{label}</span>
      {children}
      {error ? <span className="text-xs font-normal text-destructive">{error.message}</span> : null}
    </label>
  );
}
