import { readFileSync, writeFileSync } from "node:fs"

const sourcePath = "(PUBLIC) ICD-10 e-klaim.csv"
const targetPath = "lib/icd-diagnoses-eklaim.ts"

function escapeString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

const rows = readFileSync(sourcePath, "utf8")
  .replace(/^\uFEFF/, "")
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [code, name] = line.split(";")
    return { code: code?.trim(), name: name?.trim() }
  })
  .filter((item) => item.code && item.name)

const uniqueRows = Array.from(new Map(rows.map((item) => [item.code, item])).values())

const content = [
  'import type { IcdDiagnosisItem } from "@/lib/icd-data"',
  "",
  "// Generated from (PUBLIC) ICD-10 e-klaim.csv. Do not edit manually.",
  "export const icd10EklaimDiagnoses: IcdDiagnosisItem[] = [",
  ...uniqueRows.map((item) => `  { code: "${escapeString(item.code)}", name: "${escapeString(item.name)}" },`),
  "]",
  "",
].join("\n")

writeFileSync(targetPath, content)
console.log(`Generated ${uniqueRows.length} ICD-10 diagnosis rows in ${targetPath}`)
