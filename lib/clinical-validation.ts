export function isOptionalNikValid(value: string | undefined | null) {
  const normalizedValue = value?.trim() ?? ""

  return normalizedValue === "" || /^\d{16}$/.test(normalizedValue)
}

export function isOptionalDigitsOnlyValid(value: string | undefined | null) {
  const normalizedValue = value?.trim() ?? ""

  return normalizedValue === "" || /^\d+$/.test(normalizedValue)
}

export function isOptionalLettersOnlyValid(value: string | undefined | null) {
  const normalizedValue = value?.trim() ?? ""

  return normalizedValue === "" || /^[A-Za-z]+$/.test(normalizedValue)
}

export function isBloodPressureInputValid(value: string | undefined | null) {
  const normalizedValue = value?.trim() ?? ""

  return normalizedValue === "" || /^\d{2,3}\/\d{2,3}$/.test(normalizedValue)
}

export function isOptionalDecimalInputValid(value: string | undefined | null) {
  const normalizedValue = value?.trim() ?? ""

  return normalizedValue === "" || /^\d+([.,]\d+)?$/.test(normalizedValue)
}

export function isOptionalIntegerInputValid(value: string | undefined | null) {
  const normalizedValue = value?.trim() ?? ""

  return normalizedValue === "" || /^\d+$/.test(normalizedValue)
}

export function parseOptionalDecimalInput(value: string | undefined | null) {
  const normalizedValue = value?.trim().replace(",", ".") ?? ""

  if (normalizedValue === "") {
    return null
  }

  const parsed = Number(normalizedValue)

  return Number.isFinite(parsed) && parsed >= 0 ? normalizedValue : null
}

export function parseOptionalIntegerInput(value: string | undefined | null) {
  const normalizedValue = value?.trim() ?? ""

  if (normalizedValue === "") {
    return null
  }

  const parsed = Number.parseInt(normalizedValue, 10)

  return Number.isNaN(parsed) ? null : parsed
}

export function parseNonNegativeIntegerInput(value: string | undefined | null) {
  const parsed = parseOptionalIntegerInput(value)

  return parsed === null || parsed < 0 ? null : parsed
}
