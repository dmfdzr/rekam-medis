import { redirect } from "next/navigation"

import { MedRecordApp } from "@/app/medrecord-app"
import { getCurrentUser } from "@/lib/auth/current-user"
import {
  getClinicalWorklist,
  getAuditLogList,
  getDocumentFormOptions,
  getMedicineList,
  getMedicalDocumentList,
  getPatientList,
  getPrescriptionFormOptions,
  getPrescriptionList,
  getReportSummary,
  getVisitFormOptions,
  getVisitList,
} from "@/lib/data/clinic"

export default async function Page() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const [
    patients,
    visits,
    visitOptions,
    clinicalWorklist,
    prescriptions,
    medicines,
    prescriptionOptions,
    documents,
    documentOptions,
    reportSummary,
    auditLogs,
  ] = await Promise.all([
    getPatientList(),
    getVisitList(),
    getVisitFormOptions(),
    getClinicalWorklist(),
    getPrescriptionList(),
    getMedicineList(),
    getPrescriptionFormOptions(),
    getMedicalDocumentList(),
    getDocumentFormOptions(),
    getReportSummary(),
    getAuditLogList(),
  ])

  return (
    <MedRecordApp
      user={user}
      patients={patients}
      visits={visits}
      visitOptions={visitOptions}
      clinicalWorklist={clinicalWorklist}
      prescriptions={prescriptions}
      medicines={medicines}
      prescriptionOptions={prescriptionOptions}
      documents={documents}
      documentOptions={documentOptions}
      reportSummary={reportSummary}
      auditLogs={auditLogs}
    />
  )
}
