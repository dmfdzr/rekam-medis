import { icd10EklaimDiagnoses } from "@/lib/icd-diagnoses-eklaim"
import { icd9cmEklaimProcedures } from "@/lib/icd-procedures-eklaim"

export type IcdDiagnosisItem = {
  code: string
  name: string
}

export type IcdProcedureItem = {
  code: string
  name: string
}

/** Daftar diagnosa ICD-10 dari e-klaim. */
export const icdDiagnoses: IcdDiagnosisItem[] = icd10EklaimDiagnoses

/** Daftar tindakan medis ICD-9-CM dari e-klaim. */
export const icdProcedures: IcdProcedureItem[] = icd9cmEklaimProcedures
