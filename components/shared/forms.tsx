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
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react"
import { ToastBridge } from "@/components/shared/toast"

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
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")
  const isPassword = type === "password"
  const resolvedType = isPassword && showPasswordToggle ? (showPassword ? "text" : "password") : type
  const resolvedValue = value ?? internalValue

  React.useEffect(() => {
    if (value === undefined) {
      setInternalValue(defaultValue ?? "")
    }
  }, [defaultValue, value])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (value === undefined) {
      setInternalValue(event.target.value)
    }

    onValueChange?.(event.target.value)
  }

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
          value={resolvedValue}
          onChange={handleChange}
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
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")

  React.useEffect(() => {
    setInternalValue(defaultValue ?? "")
  }, [defaultValue])

  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        name={name}
        value={internalValue}
        onChange={(event) => setInternalValue(event.target.value)}
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
  minDate,
  maxDate,
}: {
  name: string
  label: string
  error?: string
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
}) {
  const [open, setOpen] = React.useState(false)
  const [activeCalendarPicker, setActiveCalendarPicker] = React.useState<"month" | "year" | null>(null)
  const [calendarPickerQuery, setCalendarPickerQuery] = React.useState("")

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
  const calendarStartMonth = React.useMemo(() => minDate ?? new Date(1900, 0), [minDate])
  const calendarEndMonth = React.useMemo(() => {
    if (maxDate) {
      return new Date(maxDate.getFullYear(), maxDate.getMonth())
    }

    const today = new Date()
    return new Date(today.getFullYear() + 20, 11)
  }, [maxDate])
  const [displayedMonth, setDisplayedMonth] = React.useState(() => clampCalendarMonth(initialDate ?? new Date(), calendarStartMonth, calendarEndMonth))

  React.useEffect(() => {
    setDisplayedMonth(clampCalendarMonth(initialDate ?? displayedMonth, calendarStartMonth, calendarEndMonth))
  }, [calendarEndMonth, calendarStartMonth, initialDate])

  function handleSelect(date: Date | undefined) {
    setUncontrolledSelected(date)
    const iso = date ? toISO(date) : ""
    onValueChange?.(iso)
  }

  const isoValue = selected ? toISO(selected) : ""
  const displayText = selected
    ? formatDate(selected, "d MMMM yyyy", { locale: id })
    : ""
  const disabledDates = React.useMemo(() => {
    if (minDate && maxDate) return [{ before: minDate }, { after: maxDate }]
    if (minDate) return { before: minDate }
    if (maxDate) return { after: maxDate }

    return undefined
  }, [minDate, maxDate])
  const canGoPrevious = compareMonth(addMonths(displayedMonth, -1), calendarStartMonth) >= 0
  const canGoNext = compareMonth(addMonths(displayedMonth, 1), calendarEndMonth) <= 0
  const yearOptions = React.useMemo(() => {
    const startYear = calendarStartMonth.getFullYear()
    const endYear = calendarEndMonth.getFullYear()

    return Array.from({ length: endYear - startYear + 1 }, (_, index) => {
      const year = startYear + index

      return { value: String(year), label: String(year) }
    })
  }, [calendarEndMonth, calendarStartMonth])
  const monthOptions = React.useMemo(() => {
    const year = displayedMonth.getFullYear()

    return Array.from({ length: 12 }, (_, month) => new Date(year, month, 1))
      .filter((month) => compareMonth(month, calendarStartMonth) >= 0 && compareMonth(month, calendarEndMonth) <= 0)
      .map((month) => ({
        value: String(month.getMonth()),
        label: formatDate(month, "MMMM", { locale: id }),
      }))
  }, [calendarEndMonth, calendarStartMonth, displayedMonth])

  function setCalendarMonth(nextMonth: Date) {
    setDisplayedMonth(clampCalendarMonth(nextMonth, calendarStartMonth, calendarEndMonth))
  }

  function moveCalendarMonth(offset: number) {
    setCalendarMonth(addMonths(displayedMonth, offset))
  }

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
          <div className="relative border-b border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <Button type="button" variant="ghost" size="icon" disabled={!canGoPrevious} onClick={() => moveCalendarMonth(-1)} aria-label="Bulan sebelumnya">
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_5rem] gap-2">
                <CalendarPickerButton
                  label="Bulan"
                  open={activeCalendarPicker === "month"}
                  value={formatDate(displayedMonth, "MMMM", { locale: id })}
                  onOpen={() => {
                    setActiveCalendarPicker(activeCalendarPicker === "month" ? null : "month")
                    setCalendarPickerQuery("")
                  }}
                />
                <CalendarPickerButton
                  label="Tahun"
                  open={activeCalendarPicker === "year"}
                  value={String(displayedMonth.getFullYear())}
                  onOpen={() => {
                    setActiveCalendarPicker(activeCalendarPicker === "year" ? null : "year")
                    setCalendarPickerQuery("")
                  }}
                />
              </div>
              <Button type="button" variant="ghost" size="icon" disabled={!canGoNext} onClick={() => moveCalendarMonth(1)} aria-label="Bulan berikutnya">
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
            {activeCalendarPicker ? (
              <CalendarPickerPanel
                query={calendarPickerQuery}
                onQueryChange={setCalendarPickerQuery}
                items={activeCalendarPicker === "month" ? monthOptions : yearOptions}
                selectedValue={activeCalendarPicker === "month" ? String(displayedMonth.getMonth()) : String(displayedMonth.getFullYear())}
                onSelect={(nextValue) => {
                  if (activeCalendarPicker === "month") {
                    setCalendarMonth(new Date(displayedMonth.getFullYear(), Number(nextValue), 1))
                  } else {
                    const nextYear = Number(nextValue)
                    const nextMonth = clampCalendarMonth(new Date(nextYear, displayedMonth.getMonth(), 1), calendarStartMonth, calendarEndMonth)

                    setCalendarMonth(nextMonth)
                  }
                  setActiveCalendarPicker(null)
                  setCalendarPickerQuery("")
                }}
              />
            ) : null}
          </div>
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              handleSelect(date)
              setOpen(false)
            }}
            month={displayedMonth}
            onMonthChange={setCalendarMonth}
            hideNavigation
            classNames={{
              month_caption: "sr-only",
            }}
            startMonth={calendarStartMonth}
            endMonth={calendarEndMonth}
            disabled={disabledDates}
            locale={id}
          />
        </PopoverContent>
      </Popover>
      {name ? <input type="hidden" name={name} value={isoValue} /> : null}
      <FieldError message={error} />
    </div>
  )
}

function addMonths(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

function compareMonth(left: Date, right: Date) {
  return left.getFullYear() * 12 + left.getMonth() - (right.getFullYear() * 12 + right.getMonth())
}

function clampCalendarMonth(date: Date, start: Date, end: Date) {
  const month = new Date(date.getFullYear(), date.getMonth(), 1)

  if (compareMonth(month, start) < 0) return new Date(start.getFullYear(), start.getMonth(), 1)
  if (compareMonth(month, end) > 0) return new Date(end.getFullYear(), end.getMonth(), 1)

  return month
}

function CalendarPickerButton({ label, open, value, onOpen }: { label: string; open: boolean; value: string; onOpen: () => void }) {
  return (
    <Button type="button" variant="outline" role="combobox" aria-label={label} aria-expanded={open} className="h-9 min-w-0 justify-between px-2 text-xs font-medium" onClick={onOpen}>
      <span className="truncate">{value}</span>
      <ChevronsUpDown className="ml-1 size-3.5 shrink-0 opacity-50" aria-hidden="true" />
    </Button>
  )
}

function CalendarPickerPanel({
  query,
  onQueryChange,
  items,
  selectedValue,
  onSelect,
}: {
  query: string
  onQueryChange: (value: string) => void
  items: { value: string; label: string }[]
  selectedValue: string
  onSelect: (value: string) => void
}) {
  const filteredItems = items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()) || item.value.includes(query))

  return (
    <div className="absolute left-3 right-3 top-[3.75rem] z-20 overflow-hidden rounded-md border border-border bg-popover shadow-md">
      <Command shouldFilter={false}>
        <CommandInput placeholder="Cari..." value={query} onValueChange={onQueryChange} />
        <CommandList>
          <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>
          <CommandGroup>
            {filteredItems.map((item) => (
              <CommandItem key={item.value} value={`${item.value} ${item.label}`} onSelect={() => onSelect(item.value)}>
                <Check className={cn("mr-2 size-4 shrink-0", selectedValue === item.value ? "opacity-100" : "opacity-0")} />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
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
  return <ToastBridge state={state} />
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
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
