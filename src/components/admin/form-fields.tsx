"use client";

import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Controller,
  type Control,
  type FieldError,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { adminErrorKeys, type AdminErrorKey } from "@/lib/admin/validation";
import { cn } from "@/lib/utils";
import { toLatinDigits } from "@/lib/validation/phone";

function toErrorKey(message: string | undefined): AdminErrorKey {
  return adminErrorKeys.find((key) => key === message) ?? "invalid";
}

export function FieldError({ id, error }: { id: string; error?: FieldError | { message?: string } }) {
  const t = useTranslations("admin.errors");
  return error?.message ? (
    <p id={id} role="alert" className="text-xs text-destructive">
      {t(toErrorKey(error.message))}
    </p>
  ) : null;
}

type BaseProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  error?: FieldError;
  hint?: string;
  className?: string;
};

function Wrapper({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: FieldError;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p> : null}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

function describedBy(id: string, error?: FieldError, hint?: string) {
  return [error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
}

export function TextField<T extends FieldValues>({
  name,
  label,
  error,
  hint,
  className,
  register,
  dir,
  multiline = false,
  rows = 4,
  placeholder,
}: BaseProps<T> & {
  register: UseFormRegister<T>;
  dir?: "ltr" | "rtl" | "auto";
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  const id = useId();
  const common = {
    id,
    dir,
    placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy(id, error, hint),
  };
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} className={className}>
      {multiline ? (
        <Textarea rows={rows} className="rounded-xl px-3 py-2" {...common} {...register(name)} />
      ) : (
        <Input className="h-10 rounded-xl px-3 text-start" {...common} {...register(name)} />
      )}
    </Wrapper>
  );
}

/** Numeric input that accepts Persian/Arabic digits and thousands separators. */
export function NumberField<T extends FieldValues>({
  name,
  label,
  error,
  hint,
  className,
  register,
  nullable = false,
}: BaseProps<T> & { register: UseFormRegister<T>; nullable?: boolean }) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} className={className}>
      <Input
        id={id}
        inputMode="numeric"
        dir="ltr"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className="h-10 rounded-xl px-3 text-start tabular-nums"
        {...register(name, {
          setValueAs: (value: unknown) => {
            const text = toLatinDigits(String(value ?? "")).replace(/[,٬\s]/g, "");
            if (text === "") return nullable ? null : Number.NaN;
            return Number(text);
          },
        })}
      />
    </Wrapper>
  );
}

export function SelectField<T extends FieldValues>({
  name,
  label,
  error,
  hint,
  className,
  control,
  options,
  placeholder,
}: BaseProps<T> & {
  control: Control<T>;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} className={className}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={typeof field.value === "string" ? field.value : ""} onValueChange={field.onChange}>
            <SelectTrigger
              id={id}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy(id, error, hint)}
              className="h-10! w-full rounded-xl px-3"
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Wrapper>
  );
}

export function SwitchField<T extends FieldValues>({
  name,
  label,
  hint,
  control,
  className,
}: Omit<BaseProps<T>, "error"> & { control: Control<T> }) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-4 rounded-xl border border-border p-3", className)}>
      <div>
        <Label htmlFor={id}>{label}</Label>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Switch id={id} checked={field.value === true} onCheckedChange={field.onChange} />
        )}
      />
    </div>
  );
}
