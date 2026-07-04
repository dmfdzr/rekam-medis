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
  const canViewAssessment = canAccess(user.role, "assessment")
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
    assessmentList,
    assessmentOptions,
    laboratoryList,
    laboratoryOptions,
    medicalRecordWorklist,
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
    canViewAssessment ? getClinicalWorklist("assessmentList", user) : [],
    canViewAssessment ? getClinicalWorklist("assessmentOptions", user) : [],
    canViewLaboratory ? getClinicalWorklist("laboratoryList", user) : [],
    canViewLaboratory ? getClinicalWorklist("laboratoryOptions", user) : [],
    canViewRecords ? getClinicalWorklist("recordable", user) : [],
    canViewRecords ? getMedicalRecordHistory(user) : [],
    canViewPrescriptions ? getPrescriptionList(user) : [],
    canViewPrescriptions ? getPrescriptionFormOptions(user) : emptyPrescriptionOptions,
    canViewDocuments ? getMedicalDocumentList(user) : [],
    canViewDocuments ? getDocumentFormOptions(user) : emptyDocumentOptions,
    canViewReports ? getReportSummary() : [],
    canViewReports ? getReportDetails() : { diagnoses: [], treatments: [], diagnosisOptions: [], diagnosisMap: { level: "district", totalCases: 0, totalPatients: 0, totalRegions: 0, mappedLocations: 0, locations: [] } },
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
      assessmentList={assessmentList}
      assessmentOptions={assessmentOptions}
      laboratoryList={laboratoryList}
      laboratoryOptions={laboratoryOptions}
      medicalRecordWorklist={medicalRecordWorklist}
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
