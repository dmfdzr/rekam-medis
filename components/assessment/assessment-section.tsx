"use client"

import * as React from "react"
import { type ClinicalWorklistItem } from "@/lib/data/clinic"
import { RoleKey } from "@/lib/medical-data"
import { saveAssessmentAction, type ClinicFormState } from "@/app/actions/clinic"
import { icdDiagnoses, icdProcedures } from "@/lib/icd-data"

import { useRefreshOnSuccess } from "@/lib/hooks"
import { TextAreaField, FormMessage, ComboboxField as SharedComboboxField } from "@/components/shared/forms"
import { EmptyState, PermissionNotice } from "@/components/shared/feedback"
import { Panel, ModalDialog } from "@/components/shared/layout"
import { Button } from "@/components/ui/button"
import { ConfirmSubmitButton } from "@/components/shared/buttons"
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react"

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
  const [fields, setFields] = React.useState<{ id: number; value: string; initialName?: string; initialCode?: string }[]>([
    { id: Date.now(), value: "" }
  ])

  const addField = () => {
    setFields([...fields, { id: Date.now(), value: "" }])
  }

  const removeField = (id: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((field) => field.id !== id))
    } else {
      setFields([{ id: Date.now(), value: "" }])
    }
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
    return <EmptyState title="Belum ada pasien untuk asesmen" detail="Kunjungan aktif akan muncul setelah pasien didaftarkan." />
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

export function AssessmentSection({
  role,
  clinicalWorklist,
  composerOpen,
  onComposerOpenChange,
}: {
  role: RoleKey
  clinicalWorklist: ClinicalWorklistItem[]
  composerOpen: boolean
  onComposerOpenChange: (open: boolean) => void
}) {
  const canInput = role === "master" || role === "doctor"

  return (
    <div className="grid gap-5">
      <Panel title="Daftar pasien untuk asesmen" description="Pilih pasien untuk melakukan asesmen dan menentukan diagnosa ICD-10 serta tindakan ICD-9-CM.">
        {clinicalWorklist.length > 0 ? (
          <div className="grid gap-4">
            <div className="rounded-md border border-border bg-background p-4 text-center">
              <p className="text-sm text-muted-foreground mb-4">Ada {clinicalWorklist.length} pasien menunggu asesmen.</p>
              <Button onClick={() => onComposerOpenChange(true)}>Buka Form Asesmen</Button>
            </div>
          </div>
        ) : (
          <EmptyState title="Tidak ada pasien" detail="Daftar pasien kosong saat ini." />
        )}
      </Panel>
      <ModalDialog open={composerOpen} onOpenChange={onComposerOpenChange} title="Asesmen Klinis" description="Pengisian diagnosa masuk, riwayat penyakit, diagnosa ICD-10, dan tindakan ICD-9-CM.">
        {canInput ? <AssessmentForm clinicalWorklist={clinicalWorklist} /> : <PermissionNotice message="Role ini tidak memiliki akses untuk mengisi asesmen." />}
      </ModalDialog>
    </div>
  )
}
