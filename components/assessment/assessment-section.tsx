"use client"

import * as React from "react"
import { type ClinicalWorklistItem } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"
import { saveAssessmentAction, type ClinicFormState } from "@/app/actions/clinic"
import { icdDiagnoses, icdProcedures } from "@/lib/icd-data"

import { useRefreshOnSuccess } from "@/lib/hooks"
import { TextField, TextAreaField, FormMessage, ComboboxField as SharedComboboxField } from "@/components/shared/forms"
import { EmptyState, PermissionNotice } from "@/components/shared/feedback"
import { Panel, ModalDialog } from "@/components/shared/layout"
import { Button } from "@/components/ui/button"
import { ConfirmSubmitButton } from "@/components/shared/buttons"
import { Check, ChevronsUpDown, FileText, Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const initialClinicFormState: ClinicFormState = {}

function ComboboxField({
  label,
  namePrefix,
  items,
  placeholder,
  defaultValueName = "",
  defaultValueCode = "",
}: {
  label: string
  namePrefix: string
  items: { code: string; name: string }[]
  placeholder: string
  defaultValueName?: string
  defaultValueCode?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(defaultValueCode)
  const [query, setQuery] = React.useState("")

  const selectedItem = React.useMemo(
    () => items.find((item) => item.code === value),
    [value, items]
  )

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={`${namePrefix}Code`} value={selectedItem?.code || defaultValueCode} />
      <input type="hidden" name={`${namePrefix}Name`} value={selectedItem?.name || defaultValueName} />
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-11 w-full justify-between font-normal",
              !value && !defaultValueName && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {selectedItem ? `${selectedItem.code} - ${selectedItem.name}` : (defaultValueName ? `${defaultValueCode} - ${defaultValueName}` : placeholder)}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(40rem,calc(100vw-2rem))] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={`Cari ${label.toLowerCase()}...`} 
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>
              <CommandGroup>
                {items
                  .filter((item) => 
                    item.name.toLowerCase().includes(query.toLowerCase()) || 
                    item.code.toLowerCase().includes(query.toLowerCase())
                  )
                  .slice(0, 50)
                  .map((item) => (
                    <CommandItem
                      key={item.code}
                      value={`${item.code} ${item.name}`}
                      onSelect={() => {
                        setValue(item.code)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4 shrink-0",
                          value === item.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-medium text-muted-foreground mr-2">{item.code}</span>
                      <span>{item.name}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function DynamicList({
  label,
  namePrefix,
  items,
  placeholder,
  buttonLabel,
}: {
  label: string
  namePrefix: string
  items: { code: string; name: string }[]
  placeholder: string
  buttonLabel: string
}) {
  const nextFieldId = React.useRef(1)
  const [fields, setFields] = React.useState<{ id: number; value: string; initialName?: string; initialCode?: string }[]>([
    { id: 0, value: "" }
  ])

  const addField = () => {
    setFields((currentFields) => [...currentFields, { id: nextFieldId.current++, value: "" }])
  }

  const removeField = (id: number) => {
    setFields((currentFields) => {
      if (currentFields.length > 1) {
        return currentFields.filter((field) => field.id !== id)
      }

      return [{ id: nextFieldId.current++, value: "" }]
    })
  }

  return (
    <div className="grid gap-3 rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <Plus className="mr-1.5 size-3" />
          {buttonLabel}
        </Button>
      </div>

      <div className="grid gap-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2">
            <div className="flex-1">
              <ComboboxField
                label={`${label} ${index + 1}`}
                namePrefix={`${namePrefix}[${index}]`}
                items={items}
                placeholder={placeholder}
                defaultValueName={field.initialName}
                defaultValueCode={field.initialCode}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 text-destructive"
              onClick={() => removeField(field.id)}
              aria-label={`Hapus ${label.toLowerCase()}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AssessmentForm({ clinicalWorklist }: { clinicalWorklist: ClinicalWorklistItem[] }) {
  const [state, formAction, pending] = React.useActionState(saveAssessmentAction, initialClinicFormState)
  useRefreshOnSuccess(state)
  const [selectedVisitId, setSelectedVisitId] = React.useState(clinicalWorklist[0]?.id ?? "")
  const selectedVisit = clinicalWorklist.find((visit) => visit.id === selectedVisitId)
  const isSelectedRecordFinal = selectedVisit?.medicalRecord?.status === "Final"

  if (clinicalWorklist.length === 0) {
    return <EmptyState title="Belum ada kunjungan siap asesmen" detail="Kunjungan baru dari pendaftaran akan muncul di sini." />
  }

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <SharedComboboxField
        name="visitId"
        label="Kunjungan"
        items={clinicalWorklist.map(v => ({ value: v.id, label: `${v.medicalRecordNumber} - ${v.patientName} - ${v.service}` }))}
        placeholder="Pilih kunjungan"
        value={selectedVisitId}
        onValueChange={setSelectedVisitId}
      />

      <div key={selectedVisitId} className="grid gap-4">
        {isSelectedRecordFinal ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            Rekam medis ini sudah final. Data ditampilkan untuk referensi dan tidak dapat disimpan ulang.
          </div>
        ) : null}
        
        <div className="grid gap-3 sm:grid-cols-2">
          <TextAreaField 
            name="admissionDiagnosis" 
            label="Diagnosa masuk" 
            placeholder="Ketik diagnosa masuk secara manual..."
            defaultValue={selectedVisit?.medicalRecord?.assessment} 
          />
          <TextAreaField 
            name="medicalHistory" 
            label="Ringkasan riwayat penyakit" 
            placeholder="Ketik ringkasan riwayat penyakit sebelumnya secara manual..."
            defaultValue={selectedVisit?.medicalRecord?.subjective} 
          />
        </div>

        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-sm font-semibold mb-3">Pemeriksaan Fisik</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="grid grid-cols-2 gap-2">
              <TextField name="bloodPressureSystolic" label="Sistolik (mmHg)" placeholder="120" type="number" inputMode="numeric" step="1" min={0} defaultValue={selectedVisit?.vitalSign?.bloodPressure?.split('/')[0] || ""} />
              <TextField name="bloodPressureDiastolic" label="Diastolik (mmHg)" placeholder="80" type="number" inputMode="numeric" step="1" min={0} defaultValue={selectedVisit?.vitalSign?.bloodPressure?.split('/')[1] || ""} />
            </div>
            <TextField name="temperature" label="Suhu Tubuh (°C)" placeholder="36.5" type="number" inputMode="decimal" step="0.1" min={30} max={45} defaultValue={selectedVisit?.vitalSign?.temperature} />
            <TextField name="weight" label="Berat Badan (Kg)" placeholder="60.5" type="number" inputMode="decimal" step="0.1" min={0} defaultValue={selectedVisit?.vitalSign?.weight} />
            <TextField name="height" label="Tinggi Badan (Cm)" placeholder="165" type="number" inputMode="decimal" step="0.1" min={0} defaultValue={selectedVisit?.vitalSign?.height} />
            <TextField name="pulse" label="Nadi (/menit)" placeholder="80" type="number" inputMode="numeric" step="1" min={0} defaultValue={selectedVisit?.vitalSign?.pulse} />
            <TextField name="respiration" label="Respirasi (/menit)" placeholder="20" type="number" inputMode="numeric" step="1" min={0} defaultValue={selectedVisit?.vitalSign?.respiration} />
            <TextField name="oxygenSaturation" label="Saturasi Oksigen (%)" placeholder="98" type="number" inputMode="numeric" step="1" min={0} max={100} defaultValue={selectedVisit?.vitalSign?.oxygenSaturation} />
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-4">
          <ComboboxField
            label="Diagnosa Utama"
            namePrefix="primaryDiagnosis"
            items={icdDiagnoses}
            placeholder="Pilih diagnosa utama ICD-10..."
          />
        </div>

        <DynamicList
          label="Diagnosa Sekunder"
          namePrefix="secondaryDiagnoses"
          items={icdDiagnoses}
          placeholder="Pilih diagnosa sekunder ICD-10..."
          buttonLabel="Tambah Diagnosa"
        />

        <DynamicList
          label="Tindakan Medis"
          namePrefix="procedures"
          items={icdProcedures}
          placeholder="Pilih tindakan medis ICD-9-CM..."
          buttonLabel="Tambah Tindakan"
        />
      </div>
      
      <FormMessage state={state} />
      
      <div className="flex flex-col gap-2 sm:flex-row pt-2">
        <ConfirmSubmitButton
          message="Simpan asesmen pasien ini?"
          confirmLabel="Simpan Asesmen"
          pending={pending}
          pendingLabel="Menyimpan..."
          disabled={isSelectedRecordFinal}
        >
          Simpan Asesmen
        </ConfirmSubmitButton>
      </div>
    </form>
  )
}

function AssessmentList({ assessmentList }: { assessmentList: ClinicalWorklistItem[] }) {
  if (assessmentList.length === 0) {
    return <EmptyState title="Belum ada asesmen tersimpan" detail="Asesmen yang sudah disimpan akan tampil di sini." />
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {assessmentList.map((visit) => {
        const primaryDiagnosis = visit.medicalRecord?.diagnoses.find((diagnosis) => diagnosis.type === "PRIMARY")

        return (
          <div key={visit.id} className="rounded-md border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{visit.patientName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {visit.medicalRecordNumber} - {visit.service} - {visit.time}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm leading-6">
              <p>
                <span className="font-medium">Keluhan: </span>
                {visit.chiefComplaint}
              </p>
              <p>
                <span className="font-medium">Diagnosa masuk: </span>
                {visit.medicalRecord?.assessment || "-"}
              </p>
              <p>
                <span className="font-medium">Diagnosa utama: </span>
                {primaryDiagnosis ? `${primaryDiagnosis.code || "-"} - ${primaryDiagnosis.name}` : "-"}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <AssessmentDetailDialog visit={visit} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm leading-6">{value}</p>
    </div>
  )
}

function DetailList({
  title,
  items,
  renderItem,
}: {
  title: string
  items: readonly unknown[]
  renderItem: (item: never) => React.ReactNode
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-sm font-semibold">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Tidak ada data.</p>
      ) : (
        <div className="mt-3 grid gap-2">{items.map((item, index) => <React.Fragment key={index}>{renderItem(item as never)}</React.Fragment>)}</div>
      )}
    </div>
  )
}

function AssessmentDetailDialog({ visit }: { visit: ClinicalWorklistItem }) {
  const [open, setOpen] = React.useState(false)
  const primaryDiagnosis = visit.medicalRecord?.diagnoses.find((diagnosis) => diagnosis.type === "PRIMARY")
  const secondaryDiagnoses = visit.medicalRecord?.diagnoses.filter((diagnosis) => diagnosis.type === "SECONDARY") ?? []
  const vitalSign = visit.vitalSign

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileText className="size-3" aria-hidden="true" />
        Detail Asesmen
      </Button>
      <ModalDialog open={open} onOpenChange={setOpen} title={`Detail Asesmen - ${visit.patientName}`} description={`${visit.medicalRecordNumber} - ${visit.service} - ${visit.time}`}>
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Pasien" value={visit.patientName} />
            <DetailItem label="No. RM" value={visit.medicalRecordNumber} />
            <DetailItem label="Profil pasien" value={visit.patientMeta} />
            <DetailItem label="Alergi" value={visit.allergies} />
            <DetailItem label="Dokter" value={visit.doctor} />
            <DetailItem label="Layanan" value={visit.service} />
          </div>

          <div className="grid gap-3">
            <DetailItem label="Keluhan utama" value={visit.chiefComplaint} />
            <DetailItem label="Diagnosa masuk" value={visit.medicalRecord?.assessment || "-"} />
            <DetailItem label="Riwayat penyakit" value={visit.medicalRecord?.subjective || "-"} />
            <DetailItem label="Diagnosa utama" value={primaryDiagnosis ? `${primaryDiagnosis.code || "-"} - ${primaryDiagnosis.name}` : "-"} />
          </div>

          <div className="grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Tekanan darah" value={vitalSign?.bloodPressure || "-"} />
            <DetailItem label="Suhu tubuh" value={vitalSign?.temperature ? `${vitalSign.temperature} C` : "-"} />
            <DetailItem label="Berat badan" value={vitalSign?.weight ? `${vitalSign.weight} Kg` : "-"} />
            <DetailItem label="Tinggi badan" value={vitalSign?.height ? `${vitalSign.height} Cm` : "-"} />
            <DetailItem label="Nadi" value={vitalSign?.pulse ? `${vitalSign.pulse} /menit` : "-"} />
            <DetailItem label="Respirasi" value={vitalSign?.respiration ? `${vitalSign.respiration} /menit` : "-"} />
            <DetailItem label="Saturasi oksigen" value={vitalSign?.oxygenSaturation ? `${vitalSign.oxygenSaturation}%` : "-"} />
          </div>

          <DetailList
            title="Diagnosa sekunder"
            items={secondaryDiagnoses}
            renderItem={(diagnosis: NonNullable<ClinicalWorklistItem["medicalRecord"]>["diagnoses"][number]) => (
              <div className="rounded-md bg-muted p-3 text-sm leading-6">
                <p className="font-medium">{diagnosis.code || "-"} - {diagnosis.name}</p>
                <p className="text-muted-foreground">{diagnosis.note || "-"}</p>
              </div>
            )}
          />

          <DetailList
            title="Tindakan"
            items={visit.medicalRecord?.treatments ?? []}
            renderItem={(treatment: NonNullable<ClinicalWorklistItem["medicalRecord"]>["treatments"][number]) => (
              <div className="rounded-md bg-muted p-3 text-sm leading-6">
                <p className="font-medium">{treatment.code || "-"} - {treatment.name}</p>
                <p className="text-muted-foreground">{treatment.note || "-"}</p>
              </div>
            )}
          />
        </div>
      </ModalDialog>
    </>
  )
}

export function AssessmentSection({
  role,
  assessmentList,
  assessmentOptions,
  composerOpen,
  onComposerOpenChange,
}: {
  role: RoleKey
  assessmentList: ClinicalWorklistItem[]
  assessmentOptions: ClinicalWorklistItem[]
  composerOpen: boolean
  onComposerOpenChange: (open: boolean) => void
}) {
  const canInput = role === "master" || role === "doctor"

  return (
    <div className="grid gap-5">
      <Panel title="Data asesmen tersimpan" description="Daftar asesmen yang sudah dibuat dari kunjungan pasien.">
        <AssessmentList assessmentList={assessmentList} />
      </Panel>
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Asesmen Klinis" description="Pengisian diagnosa masuk, riwayat penyakit, diagnosa ICD-10, dan tindakan ICD-9-CM.">
        {canInput ? <AssessmentForm clinicalWorklist={assessmentOptions} /> : <PermissionNotice message="Role ini tidak memiliki akses untuk mengisi asesmen." />}
      </ModalDialog>
    </div>
  )
}
