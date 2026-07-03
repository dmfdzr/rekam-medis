"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format as formatDate, parse as parseDate } from "date-fns"
import { id } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"

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
        className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
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

export function DatePickerField({
  name,
  label,
  error,
  defaultValue,
  value,
  onValueChange,
  placeholder,
}: {
  name: string
  label: string
  error?: string
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)

  function toISO(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  }

  const raw = value ?? defaultValue
  const initialDate = React.useMemo(() => {
    if (!raw) return undefined
    const parsed = parseDate(raw, "yyyy-MM-dd", new Date())
    return isNaN(parsed.getTime()) ? undefined : parsed
  }, [raw])

  const [uncontrolledSelected, setUncontrolledSelected] = React.useState<Date | undefined>(initialDate)
  const selected = value !== undefined ? initialDate : uncontrolledSelected

  function handleSelect(date: Date | undefined) {
    setUncontrolledSelected(date)
    const iso = date ? toISO(date) : ""
    onValueChange?.(iso)
  }

  const isoValue = selected ? toISO(selected) : ""
  const displayText = selected
    ? formatDate(selected, "d MMMM yyyy", { locale: id })
    : ""
  const calendarStartMonth = React.useMemo(() => new Date(1900, 0), [])
  const calendarEndMonth = React.useMemo(() => {
    const today = new Date()

    return new Date(today.getFullYear() + 20, 11)
  }, [])

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25",
              !displayText && "text-muted-foreground",
            )}
          >
            <span>{displayText || placeholder || `Pilih ${label.toLowerCase()}`}</span>
            <CalendarIcon />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              handleSelect(date)
              setOpen(false)
            }}
            defaultMonth={initialDate}
            captionLayout="dropdown"
            startMonth={calendarStartMonth}
            endMonth={calendarEndMonth}
            locale={id}
          />
        </PopoverContent>
      </Popover>
      {name ? <input type="hidden" name={name} value={isoValue} /> : null}
      <FieldError message={error} />
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-4 text-muted-foreground"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
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

export function ComboboxField({
  name,
  label,
  items,
  placeholder,
  defaultValue = "",
  value: controlledValue,
  onValueChange,
  error,
}: {
  name: string
  label?: string
  items: { value: string; label: string }[]
  placeholder: string
  defaultValue?: string
  value?: string
  onValueChange?: (val: string) => void
  error?: string[]
}) {
  const [open, setOpen] = React.useState(false)
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const [query, setQuery] = React.useState("")

  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue
  const setValue = (val: string) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(val)
    }
    onValueChange?.(val)
  }

  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === value),
    [value, items]
  )

  return (
    <div className="grid gap-1.5">
      {label && <span className="text-sm font-medium">{label}</span>}
      <input type="hidden" name={name} value={value} />
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-11 w-full justify-between font-normal bg-background",
              !value && "text-muted-foreground",
              error ? "border-destructive focus:border-destructive focus:ring-destructive/25" : ""
            )}
          >
            <span className="truncate">
              {selectedItem ? selectedItem.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(40rem,calc(100vw-2rem))] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={`Cari ${label ? label.toLowerCase() : "pilihan"}...`} 
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>
              <CommandGroup>
                {items
                  .filter((item) => 
                    item.label.toLowerCase().includes(query.toLowerCase()) || 
                    item.value.toLowerCase().includes(query.toLowerCase())
                  )
                  .slice(0, 100) // limit for performance
                  .map((item) => (
                    <CommandItem
                      key={item.value}
                      value={`${item.value} ${item.label}`}
                      onSelect={() => {
                        setValue(item.value)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4 shrink-0",
                          value === item.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{item.label}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error ? (
        <span className="text-xs text-destructive" role="alert">
          {error.join(", ")}
        </span>
      ) : null}
    </div>
  )
}
