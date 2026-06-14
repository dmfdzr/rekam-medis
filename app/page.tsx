import { redirect } from "next/navigation"

import { MedRecordApp } from "@/app/medrecord-app"
import { getCurrentUser } from "@/lib/auth/current-user"
import {
  getClinicalWorklist,
  getAuditLogList,
  getDocumentFormOptions,
  getMedicineList,
  getMedicalRecordHistory,
  getMedicalDocumentList,
  getPatientList,
  getPrescriptionFormOptions,
  getPrescriptionList,
  getReportSummary,
  getRoleOptions,
  getUserList,
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
    medicalRecordHistory,
    prescriptions,
    medicines,
    prescriptionOptions,
    documents,
    documentOptions,
    reportSummary,
    auditLogs,
    userList,
    roleOptions,
  ] = await Promise.all([
    getPatientList(),
    getVisitList(),
    getVisitFormOptions(),
    getClinicalWorklist(),
    getMedicalRecordHistory(),
    getPrescriptionList(),
    getMedicineList(),
    getPrescriptionFormOptions(),
    getMedicalDocumentList(),
    getDocumentFormOptions(),
    getReportSummary(),
    getAuditLogList(),
    getUserList(),
    getRoleOptions(),
  ])

  return (
    <MedRecordApp
      user={user}
      patients={patients}
      visits={visits}
      visitOptions={visitOptions}
      clinicalWorklist={clinicalWorklist}
      medicalRecordHistory={medicalRecordHistory}
      prescriptions={prescriptions}
      medicines={medicines}
      prescriptionOptions={prescriptionOptions}
      documents={documents}
      documentOptions={documentOptions}
      reportSummary={reportSummary}
      auditLogs={auditLogs}
      userList={userList}
      roleOptions={roleOptions}
    />
  )
}
