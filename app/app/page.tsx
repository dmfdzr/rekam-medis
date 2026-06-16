import { redirect } from "next/navigation"

import { MedRecordApp } from "@/app/medrecord-app"
import { getCurrentUser } from "@/lib/auth/current-user"
import { canAccess } from "@/lib/auth/permissions"
import {
  getClinicalWorklist,
  getAuditLogList,
  getDashboardSummary,
  getDocumentFormOptions,
  getMedicineList,
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
}

const emptyPrescriptionOptions = {
  records: [],
  medicines: [],
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
  const canViewVitals = canAccess(user.role, "vitals")
  const canViewRecords = canAccess(user.role, "records")
  const canViewPrescriptions = canAccess(user.role, "prescriptions")
  const canViewMedicines = canAccess(user.role, "medicines")
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
    medicines,
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
    canViewVitals || canViewRecords ? getClinicalWorklist() : [],
    canViewRecords ? getMedicalRecordHistory() : [],
    canViewPrescriptions ? getPrescriptionList() : [],
    canViewMedicines ? getMedicineList() : [],
    canViewPrescriptions ? getPrescriptionFormOptions() : emptyPrescriptionOptions,
    canViewDocuments ? getMedicalDocumentList() : [],
    canViewDocuments ? getDocumentFormOptions() : emptyDocumentOptions,
    canViewReports ? getReportSummary() : [],
    canViewReports ? getReportDetails() : { diagnoses: [], treatments: [], medicineUsage: [], stockReport: [] },
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
      medicines={medicines}
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
