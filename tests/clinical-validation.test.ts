import { describe, it } from "node:test"
import assert from "node:assert/strict"

import {
  isBloodPressureInputValid,
  isOptionalDecimalInputValid,
  isOptionalDigitsOnlyValid,
  isOptionalIntegerInputValid,
  isOptionalLettersOnlyValid,
  isOptionalNikValid,
  parseNonNegativeIntegerInput,
  parseOptionalDecimalInput,
  parseOptionalIntegerInput,
} from "@/lib/clinical-validation"

describe("clinical input validation", () => {
  it("requires NIK to be empty or exactly 16 digits", () => {
    assert.equal(isOptionalNikValid(""), true)
    assert.equal(isOptionalNikValid("3273010101010001"), true)
    assert.equal(isOptionalNikValid("327301010101001"), false)
    assert.equal(isOptionalNikValid("32730101010100012"), false)
    assert.equal(isOptionalNikValid("32730101010100A1"), false)
  })

  it("limits patient phone and emergency contact to digits only", () => {
    assert.equal(isOptionalDigitsOnlyValid(""), true)
    assert.equal(isOptionalDigitsOnlyValid("081234567890"), true)
    assert.equal(isOptionalDigitsOnlyValid("0812-3456"), false)
    assert.equal(isOptionalDigitsOnlyValid("+6281234567890"), false)
    assert.equal(isOptionalDigitsOnlyValid("telepon"), false)
  })

  it("limits blood type to letters only", () => {
    assert.equal(isOptionalLettersOnlyValid(""), true)
    assert.equal(isOptionalLettersOnlyValid("A"), true)
    assert.equal(isOptionalLettersOnlyValid("AB"), true)
    assert.equal(isOptionalLettersOnlyValid("O"), true)
    assert.equal(isOptionalLettersOnlyValid("A+"), false)
    assert.equal(isOptionalLettersOnlyValid("B1"), false)
  })

  it("validates numeric vital sign fields while allowing empty optional values", () => {
    assert.equal(isOptionalDecimalInputValid(""), true)
    assert.equal(isOptionalDecimalInputValid("36.5"), true)
    assert.equal(isOptionalDecimalInputValid("36,5"), true)
    assert.equal(isOptionalDecimalInputValid("tiga puluh enam"), false)

    assert.equal(isOptionalIntegerInputValid(""), true)
    assert.equal(isOptionalIntegerInputValid("98"), true)
    assert.equal(isOptionalIntegerInputValid("98.5"), false)
    assert.equal(isOptionalIntegerInputValid("normal"), false)
  })

  it("validates blood pressure as numeric systolic and diastolic values", () => {
    assert.equal(isBloodPressureInputValid(""), true)
    assert.equal(isBloodPressureInputValid("120/80"), true)
    assert.equal(isBloodPressureInputValid("90/60"), true)
    assert.equal(isBloodPressureInputValid("120-80"), false)
    assert.equal(isBloodPressureInputValid("normal"), false)
  })

  it("normalizes decimal and integer inputs for persistence", () => {
    assert.equal(parseOptionalDecimalInput("36,5"), "36.5")
    assert.equal(parseOptionalDecimalInput("36.5"), "36.5")
    assert.equal(parseOptionalDecimalInput(""), null)
    assert.equal(parseOptionalDecimalInput("-1"), null)

    assert.equal(parseOptionalIntegerInput("98"), 98)
    assert.equal(parseOptionalIntegerInput(""), null)
    assert.equal(parseNonNegativeIntegerInput("0"), 0)
    assert.equal(parseNonNegativeIntegerInput("-1"), null)
  })
})
