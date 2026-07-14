"use client"

import * as React from "react"
import { type ClinicalWorklistItem } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"
import { saveAssessmentAction, type ClinicFormState } from "@/app/actions/clinic"
import { icdDiagnoses, icdProcedures } from "@/lib/icd-data"

import { useListControls, useRefreshOnSuccess } from "@/lib/hooks"
import { TextField, TextAreaField, FormMessage, ComboboxField as SharedComboboxField } from "@/components/shared/forms"
import { EmptyState, PermissionNotice } from "@/components/shared/feedback"
import { ChoiceFormSwitch, type ChoiceFormOption, Panel, ModalDialog } from "@/components/shared/layout"
import { ListToolbar, PaginationControls } from "@/components/shared/list-controls"
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
const COMBOBOX_INITIAL_LIMIT = 120
const COMBOBOX_LIMIT_STEP = 120

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
  const [visibleLimit, setVisibleLimit] = React.useState(COMBOBOX_INITIAL_LIMIT)

  const selectedItem = React.useMemo(
    () => items.find((item) => item.code === value),
    [value, items]
  )
  const codeInputName = namePrefix.includes("[") ? `${namePrefix}[code]` : `${namePrefix}Code`
  const nameInputName = namePrefix.includes("[") ? `${namePrefix}[name]` : `${namePrefix}Name`
  const normalizedQuery = query.trim().toLowerCase()
  const filteredItems = React.useMemo(() => {
    if (!normalizedQuery) {
      return items
    }

    return items.filter((item) =>
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.code.toLowerCase().includes(normalizedQuery)
    )
  }, [items, normalizedQuery])
  const visibleItems = filteredItems.slice(0, visibleLimit)
  const hasMoreItems = visibleItems.length < filteredItems.length

  React.useEffect(() => {
    setVisibleLimit(COMBOBOX_INITIAL_LIMIT)
  }, [normalizedQuery, open])

  const loadMoreItems = React.useCallback(() => {
    setVisibleLimit((currentLimit) => Math.min(currentLimit + COMBOBOX_LIMIT_STEP, filteredItems.length))
  }, [filteredItems.length])

  const handleListScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget
      const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight

      if (distanceFromBottom < 48 && hasMoreItems) {
        loadMoreItems()
      }
    },
    [hasMoreItems, loadMoreItems],
  )

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={codeInputName} value={selectedItem?.code || defaultValueCode} />
      <input type="hidden" name={nameInputName} value={selectedItem?.name || defaultValueName} />
      
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
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder={`Cari ${label.toLowerCase()}...`} 
              value={query}
              onValueChange={setQuery}
            />
            <CommandList onScroll={handleListScroll}>
              <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>
              <CommandGroup>
                {visibleItems.map((item) => (
                    <CommandItem
                      key={item.code}
                      value={`${item.code} ${item.name}`}
                      onSelect={() => {
                        setValue(item.code)
                        setQuery("")
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
                {filteredItems.length === 0 ? null : (
                  <div className="px-2.5 py-2 text-xs text-muted-foreground">
                    Menampilkan {visibleItems.length.toLocaleString("id-ID")} dari {filteredItems.length.toLocaleString("id-ID")} data.
                  </div>
                )}
                {hasMoreItems ? (
                  <div className="p-1">
                    <Button type="button" variant="ghost" size="sm" className="w-full" onClick={loadMoreItems}>
                      Muat lebih banyak
                    </Button>
                  </div>
                ) : null}
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
  initialItems = [],
}: {
  label: string
  namePrefix: string
  items: { code: string; name: string }[]
  placeholder: string
  buttonLabel: string
  initialItems?: { code?: string; name: string }[]
}) {
  const initialFields = React.useMemo(
    () =>
      initialItems.length > 0
        ? initialItems.map((item, index) => ({
            id: index,
            value: item.code ?? "",
            initialName: item.name,
            initialCode: item.code ?? "",
          }))
        : [{ id: 0, value: "" }],
    [initialItems],
  )
  const nextFieldId = React.useRef(initialFields.length)
  const [fields, setFields] = React.useState<{ id: number; value: string; initialName?: string; initialCode?: string }[]>(initialFields)

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

export function AssessmentForm({
  clinicalWorklist,
  emptyTitle = "Belum ada kunjungan siap asesmen",
  emptyDetail = "Kunjungan baru dari pendaftaran akan muncul di sini.",
  submitLabel = "Simpan Asesmen",
}: {
  clinicalWorklist: ClinicalWorklistItem[]
  emptyTitle?: string
  emptyDetail?: string
  submitLabel?: string
}) {
  const [state, formAction, pending] = React.useActionState(saveAssessmentAction, initialClinicFormState)
  useRefreshOnSuccess(state)
  const [selectedVisitId, setSelectedVisitId] = React.useState(clinicalWorklist[0]?.id ?? "")
  const selectedVisit = clinicalWorklist.find((visit) => visit.id === selectedVisitId)
  const isSelectedRecordFinal = selectedVisit?.medicalRecord?.status === "Final"
  const primaryDiagnosis = selectedVisit?.medicalRecord?.diagnoses.find((diagnosis) => diagnosis.type === "PRIMARY")
  const secondaryDiagnoses = selectedVisit?.medicalRecord?.diagnoses
    .filter((diagnosis) => diagnosis.type === "SECONDARY")
    .map((diagnosis) => ({ code: diagnosis.code, name: diagnosis.name })) ?? []
  const procedures = selectedVisit?.medicalRecord?.treatments.map((treatment) => ({ code: treatment.code, name: treatment.name })) ?? []

  if (clinicalWorklist.length === 0) {
    return <EmptyState title={emptyTitle} detail={emptyDetail} />
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
            defaultValueName={primaryDiagnosis?.name}
            defaultValueCode={primaryDiagnosis?.code}
          />
        </div>

        <DynamicList
          label="Diagnosa Sekunder"
          namePrefix="secondaryDiagnoses"
          items={icdDiagnoses}
          placeholder="Pilih diagnosa sekunder ICD-10..."
          buttonLabel="Tambah Diagnosa"
          initialItems={secondaryDiagnoses}
        />

        <DynamicList
          label="Tindakan Medis"
          namePrefix="procedures"
          items={icdProcedures}
          placeholder="Pilih tindakan medis ICD-9-CM..."
          buttonLabel="Tambah Tindakan"
          initialItems={procedures}
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
          {submitLabel}
        </ConfirmSubmitButton>
      </div>
    </form>
  )
}

function AssessmentList({ assessmentList }: { assessmentList: ClinicalWorklistItem[] }) {
  const searchSelector = React.useCallback(
    (visit: ClinicalWorklistItem) => [
      visit.patientName,
      visit.medicalRecordNumber,
      visit.patientMeta,
      visit.allergies,
      visit.service,
      visit.doctor,
      visit.status,
      visit.medicalRecord?.assessment ?? "",
      visit.medicalRecord?.subjective ?? "",
      ...(visit.medicalRecord?.diagnoses.map((diagnosis) => `${diagnosis.code} ${diagnosis.name} ${diagnosis.note}`) ?? []),
      ...(visit.medicalRecord?.treatments.map((treatment) => `${treatment.code} ${treatment.name} ${treatment.note}`) ?? []),
    ],
    [],
  )
  const controls = useListControls({
    items: assessmentList,
    pageSize: 6,
    search: searchSelector,
  })

  if (assessmentList.length === 0) {
    return <EmptyState title="Belum ada asesmen tersimpan" detail="Asesmen yang sudah disimpan akan tampil di sini." />
  }

  return (
    <div className="grid gap-4">
      <ListToolbar
        query={controls.query}
        onQueryChange={controls.setQuery}
        searchPlaceholder="Cari pasien, RM, ruang rawat, dokter, diagnosa, tindakan"
        resultCount={controls.totalItems}
        totalCount={assessmentList.length}
      />
      {controls.totalItems === 0 ? (
        <EmptyState title="Asesmen tidak ditemukan" detail="Ubah kata kunci pencarian untuk melihat data asesmen lain." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {controls.paginatedItems.map((visit) => {
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
      )}
      <PaginationControls page={controls.page} totalPages={controls.totalPages} onPageChange={controls.setPage} />
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 wrap-break-word text-sm leading-6">{value}</p>
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
            <DetailItem label="Ruang Rawat" value={visit.service} />
          </div>

          <div className="grid gap-3">
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
  const updatableAssessments = assessmentList.filter(
    (visit) => visit.workflowStatus === "VITAL_SIGN" && visit.medicalRecord?.status !== "Final",
  )
  const assessmentActions: ChoiceFormOption[] = canInput
    ? [
        {
          id: "create-assessment",
          title: "Tambah asesmen",
          description: "Isi asesmen awal untuk kunjungan yang baru masuk dari pendaftaran.",
          content: (
            <AssessmentForm
              clinicalWorklist={assessmentOptions}
              emptyTitle="Belum ada kunjungan siap asesmen"
              emptyDetail="Kunjungan baru dari pendaftaran akan muncul di sini."
              submitLabel="Simpan asesmen"
            />
          ),
        },
        {
          id: "update-assessment",
          title: "Update asesmen",
          description: "Perbarui asesmen yang sudah tersimpan selama belum masuk tahap laboratorium.",
          content: (
            <AssessmentForm
              clinicalWorklist={updatableAssessments}
              emptyTitle="Tidak ada asesmen yang bisa diupdate"
              emptyDetail="Asesmen hanya bisa diperbarui sebelum hasil laboratorium disimpan."
              submitLabel="Update asesmen"
            />
          ),
        },
      ]
    : []

  return (
    <div className="grid gap-5">
      <Panel title="Data asesmen tersimpan" description="Daftar asesmen yang sudah dibuat dari kunjungan pasien.">
        <AssessmentList assessmentList={assessmentList} />
      </Panel>
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Kelola asesmen" description="Pilih tambah asesmen baru atau update asesmen yang belum masuk tahap laboratorium.">
        {canInput ? (
          <ChoiceFormSwitch
            key={composerOpen ? "assessment-open" : "assessment-closed"}
            options={assessmentActions}
            emptyMessage="Role ini tidak memiliki akses untuk mengisi asesmen."
          />
        ) : (
          <PermissionNotice message="Role ini tidak memiliki akses untuk mengisi asesmen." />
        )}
      </ModalDialog>
    </div>
  )
}
