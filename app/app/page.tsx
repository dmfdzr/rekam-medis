import { redirect } from "next/navigation"

import { MedRecordApp } from "@/app/medrecord-app"
import { getCurrentUser } from "@/lib/auth/current-user"
import { canAccess } from "@/lib/auth/permissions"
import {
  getClinicalWorklist,
  getAuditLogList,
  getDashboardSummary,
  getDocumentFormOptions,
  getMedicalRecordHistory,
  getMedicalDocumentList,
  getPatientList,
  getPrescriptionFormOptions,
  getPrescriptionList,
  getReportDetails,
  getReportSummary,
  getRoleOptions,
  getUserList,
  getVisitFormOptions,
  getVisitList,
} from "@/lib/data/clinic"

const emptyVisitOptions = {
  patients: [],
  doctors: [],
  services: [],
}

const emptyPrescriptionOptions = {
  records: [],
}

const emptyDocumentOptions = {
  patients: [],
  visits: [],
}

export default async function Page() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const canViewPatients = canAccess(user.role, "patients")
  const canViewVisits = canAccess(user.role, "visits")
  const canViewLaboratory = canAccess(user.role, "laboratory")
  const canViewRecords = canAccess(user.role, "records")
  const canViewPrescriptions = canAccess(user.role, "prescriptions")
    const canViewDocuments = canAccess(user.role, "documents")
  const canViewReports = canAccess(user.role, "reports")
  const canViewAudit = canAccess(user.role, "audit")
  const canViewUsers = canAccess(user.role, "users")

  const [
    dashboardSummary,
    patients,
    visits,
    visitOptions,
    clinicalWorklist,
    medicalRecordHistory,
    prescriptions,
    prescriptionOptions,
    documents,
    documentOptions,
    reportSummary,
    reportDetails,
    auditLogs,
    userList,
    roleOptions,
  ] = await Promise.all([
    getDashboardSummary(),
    canViewPatients ? getPatientList() : [],
    canViewVisits ? getVisitList() : [],
    canViewVisits ? getVisitFormOptions() : emptyVisitOptions,
    canViewLaboratory || canViewRecords ? getClinicalWorklist() : [],
    canViewRecords ? getMedicalRecordHistory() : [],
    canViewPrescriptions ? getPrescriptionList() : [],
    canViewPrescriptions ? getPrescriptionFormOptions() : emptyPrescriptionOptions,
    canViewDocuments ? getMedicalDocumentList() : [],
    canViewDocuments ? getDocumentFormOptions() : emptyDocumentOptions,
    canViewReports ? getReportSummary() : [],
    canViewReports ? getReportDetails() : { diagnoses: [], treatments: [] },
    canViewAudit ? getAuditLogList() : [],
    canViewUsers ? getUserList() : [],
    canViewUsers ? getRoleOptions() : [],
  ])

  return (
    <MedRecordApp
      user={user}
      dashboardSummary={dashboardSummary}
      patients={patients}
      visits={visits}
      visitOptions={visitOptions}
      clinicalWorklist={clinicalWorklist}
      medicalRecordHistory={medicalRecordHistory}
      prescriptions={prescriptions}
      prescriptionOptions={prescriptionOptions}
      documents={documents}
      documentOptions={documentOptions}
      reportSummary={reportSummary}
      reportDetails={reportDetails}
      auditLogs={auditLogs}
      userList={userList}
      roleOptions={roleOptions}
    />
  )
}
