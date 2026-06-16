"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function TextField({
  name,
  label,
  error,
  type = "text",
  placeholder,
  autoComplete,
  autoCapitalize,
  inputMode,
  list,
  maxLength,
  max,
  min,
  pattern,
  step,
  defaultValue,
  value,
  onValueChange,
  numbersOnly,
  lettersOnly,
  showPasswordToggle,
}: {
  name: string
  label: string
  error?: string
  type?: string
  placeholder?: string
  autoComplete?: string
  autoCapitalize?: React.InputHTMLAttributes<HTMLInputElement>["autoCapitalize"]
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  list?: string
  maxLength?: number
  max?: number
  min?: number
  pattern?: string
  step?: string
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  numbersOnly?: boolean
  lettersOnly?: boolean
  showPasswordToggle?: boolean
}) {
  const [showPassword, setShowPassword] = React.useState(false)
  const isPassword = type === "password"
  const resolvedType = isPassword && showPasswordToggle ? (showPassword ? "text" : "password") : type

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const key = event.key
    if (key.length === 1) {
      if (numbersOnly && !/[0-9]/.test(key)) event.preventDefault()
      if (lettersOnly && !/[A-Za-z+\-]/.test(key)) event.preventDefault()
    }
  }

  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className={isPassword && showPasswordToggle ? "relative" : undefined}>
        <input
          name={name}
          type={resolvedType}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          inputMode={inputMode}
          list={list}
          max={max}
          maxLength={maxLength}
          min={min}
          pattern={pattern}
          step={step}
          defaultValue={defaultValue}
          value={value}
          onChange={onValueChange ? (event) => onValueChange(event.target.value) : undefined}
          onKeyDown={numbersOnly || lettersOnly ? handleKeyDown : undefined}
          className={cn(
            "h-11 rounded-md border border-input bg-background text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25",
            isPassword && showPasswordToggle ? "w-full px-3 pr-11" : "w-full px-3",
          )}
          placeholder={placeholder ?? `Isi ${label.toLowerCase()}`}
          aria-invalid={Boolean(error)}
        />
        {isPassword && showPasswordToggle ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        ) : null}
      </div>
      <FieldError message={error} />
    </label>
  )
}

export function TextAreaField({
  name,
  label,
  error,
  placeholder,
  defaultValue,
}: {
  name: string
  label: string
  error?: string
  placeholder?: string
  defaultValue?: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
        placeholder={placeholder ?? `Isi ${label.toLowerCase()}`}
        aria-invalid={Boolean(error)}
      />
      <FieldError message={error} />
    </label>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}

export function FormMessage({ state }: { state: { ok?: boolean; message?: string } }) {
  if (!state.message) {
    return null
  }

  return (
    <div
      className={cn(
        "rounded-md border p-3 text-sm leading-6",
        state.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"
          : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
      role="status"
    >
      {state.message}
    </div>
  )
}

