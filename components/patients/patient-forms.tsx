"use client"

import { type PatientListItem } from "@/lib/data/clinic"
import { createPatientAction, updatePatientAction, deactivatePatientAction, type ClinicFormState } from "@/app/actions/clinic"

import * as React from "react"

import { useRefreshOnSuccess } from "@/lib/hooks"
import { TextField, TextAreaField, FieldError, FormMessage, DatePickerField, ComboboxField } from "@/components/shared/forms"
import { EmptyState, DestructiveActionNotice } from "@/components/shared/feedback"
import { ConfirmSubmitButton } from "@/components/shared/buttons"
import { Button } from "@/components/ui/button"

const initialClinicFormState: ClinicFormState = {}

type RegionOption = {
  code: string
  name: string
  type: "PROVINCE" | "CITY" | "DISTRICT"
  parentCode: string | null
  parentName: string | null
}

function toComboboxItems(regions: RegionOption[]) {
  return regions.map((region) => ({ value: region.code, label: region.name }))
}

function RegionAddressFields({
  required,
  errors,
}: {
  required: boolean
  errors?: Record<string, string[]>
}) {
  const [provinces, setProvinces] = React.useState<RegionOption[]>([])
  const [cities, setCities] = React.useState<RegionOption[]>([])
  const [districts, setDistricts] = React.useState<RegionOption[]>([])
  const [provinceCode, setProvinceCode] = React.useState("")
  const [cityCode, setCityCode] = React.useState("")
  const [districtCode, setDistrictCode] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  async function loadRegions(url: string) {
    const response = await fetch(url)

    if (!response.ok) {
      return []
    }

    const payload = (await response.json()) as { regions: RegionOption[] }

    return payload.regions
  }

  React.useEffect(() => {
    let ignore = false

    setLoading(true)
    loadRegions("/regions?type=PROVINCE")
      .then((items) => {
        if (!ignore) {
          setProvinces(items)
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  React.useEffect(() => {
    let ignore = false

    setCityCode("")
    setDistrictCode("")
    setCities([])
    setDistricts([])

    if (!provinceCode) {
      return () => {
        ignore = true
      }
    }

    setLoading(true)
    loadRegions(`/regions?type=CITY&parentCode=${encodeURIComponent(provinceCode)}`)
      .then((items) => {
        if (!ignore) {
          setCities(items)
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [provinceCode])

  React.useEffect(() => {
    let ignore = false

    setDistrictCode("")
    setDistricts([])

    if (!cityCode) {
      return () => {
        ignore = true
      }
    }

    setLoading(true)
    loadRegions(`/regions?type=DISTRICT&parentCode=${encodeURIComponent(cityCode)}`)
      .then((items) => {
        if (!ignore) {
          setDistricts(items)
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [cityCode])

  const selectedProvince = provinces.find((region) => region.code === provinceCode)
  const selectedCity = cities.find((region) => region.code === cityCode)
  const selectedDistrict = districts.find((region) => region.code === districtCode)

  return (
    <section className="grid gap-3 rounded-md border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold">Alamat</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Pilih wilayah sampai kecamatan untuk laporan persebaran diagnosis. Kelurahan, jalan, RT/RW, dan nomor rumah ditulis di detail alamat.
        </p>
      </div>
      <input type="hidden" name="province" value={selectedProvince?.name ?? ""} />
      <input type="hidden" name="city" value={selectedCity?.name ?? ""} />
      <input type="hidden" name="district" value={selectedDistrict?.name ?? ""} />
      <div className="grid gap-3 sm:grid-cols-3">
        <ComboboxField
          name="provinceCode"
          label="Provinsi"
          items={toComboboxItems(provinces)}
          placeholder={loading && provinces.length === 0 ? "Memuat provinsi..." : required ? "Pilih provinsi" : "Tidak diubah"}
          value={provinceCode}
          onValueChange={setProvinceCode}
          error={errors?.province}
        />
        <ComboboxField
          name="cityCode"
          label="Kabupaten/Kota"
          items={toComboboxItems(cities)}
          placeholder={!provinceCode ? "Pilih provinsi dulu" : loading && cities.length === 0 ? "Memuat kabupaten/kota..." : required ? "Pilih kabupaten/kota" : "Tidak diubah"}
          value={cityCode}
          onValueChange={setCityCode}
          error={errors?.city}
        />
        <ComboboxField
          name="districtCode"
          label="Kecamatan"
          items={toComboboxItems(districts)}
          placeholder={!cityCode ? "Pilih kabupaten/kota dulu" : loading && districts.length === 0 ? "Memuat kecamatan..." : required ? "Pilih kecamatan" : "Tidak diubah"}
          value={districtCode}
          onValueChange={setDistrictCode}
          error={errors?.district}
        />
      </div>
      {!required ? <p className="text-xs leading-5 text-muted-foreground">Kosongkan wilayah jika tidak ingin mengubah alamat terstruktur pasien.</p> : null}
    </section>
  )
}

export function CreatePatientForm() {
  const [state, formAction, pending] = React.useActionState(createPatientAction, initialClinicFormState)
  const today = React.useMemo(() => new Date(), [])
  useRefreshOnSuccess(state)

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <TextField name="fullName" label="Nama lengkap" error={state.errors?.fullName?.[0]} autoComplete="name" />
        <TextField name="nik" label="NIK" error={state.errors?.nik?.[0]} inputMode="numeric" maxLength={16} pattern="\d{16}" numbersOnly />
        <DatePickerField name="birthDate" label="Tanggal lahir" error={state.errors?.birthDate?.[0]} maxDate={today} />
        <ComboboxField
          name="gender"
          label="Jenis kelamin"
          items={[
            { value: "FEMALE", label: "Perempuan" },
            { value: "MALE", label: "Laki-laki" },
            { value: "UNDETERMINED", label: "Tidak dapat ditentukan" },
            { value: "UNKNOWN", label: "Tidak diketahui" },
            { value: "NOT_FILLED", label: "Tidak mengisi" },
          ]}
          placeholder="Pilih jenis kelamin"
          error={state.errors?.gender}
        />
        <TextField name="phone" label="Nomor telepon" error={state.errors?.phone?.[0]} inputMode="numeric" pattern="\d*" autoComplete="tel" numbersOnly />
        <TextField name="bloodType" label="Golongan darah" error={state.errors?.bloodType?.[0]} pattern="[A-Za-z]*" autoCapitalize="characters" lettersOnly />
        <RegionAddressFields required errors={state.errors} />
        <TextAreaField name="address" label="Detail alamat" error={state.errors?.address?.[0]} placeholder="Contoh: Kelurahan Sudimara Barat, Jl. HOS Cokroaminoto, RT 02/RW 04" />
        <TextAreaField name="allergies" label="Alergi" error={state.errors?.allergies?.[0]} placeholder="Contoh: Amoxicillin" />
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan pasien"}
      </Button>
    </form>
  )
}

export function UpdatePatientForm({ patients }: { patients: PatientListItem[] }) {
  const [state, formAction, pending] = React.useActionState(updatePatientAction, initialClinicFormState)
  useRefreshOnSuccess(state)

  if (patients.length === 0) {
    return <EmptyState title="Belum ada pasien" detail="Tambahkan pasien terlebih dahulu sebelum mengubah data dasar." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <div className="grid gap-3">
        <ComboboxField
          name="patientId"
          label="Pasien"
          items={patients.map(p => ({ value: p.id, label: `${p.medicalRecordNumber} - ${p.name}` }))}
          placeholder="Pilih pasien"
          error={state.errors?.patientId}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField name="fullName" label="Nama lengkap" error={state.errors?.fullName?.[0]} />
          <TextField name="phone" label="Nomor telepon" error={state.errors?.phone?.[0]} inputMode="numeric" pattern="\d*" autoComplete="tel" numbersOnly />
          <TextField name="bloodType" label="Golongan darah" error={state.errors?.bloodType?.[0]} pattern="[A-Za-z]*" autoCapitalize="characters" lettersOnly />
        </div>
        <RegionAddressFields required={false} errors={state.errors} />
        <TextAreaField name="address" label="Detail alamat" error={state.errors?.address?.[0]} />
        <TextAreaField name="allergies" label="Alergi" error={state.errors?.allergies?.[0]} />
        <ComboboxField
          name="status"
          label="Status pasien"
          items={[
            { value: "", label: "Tidak diubah" },
            { value: "ACTIVE", label: "Aktif" },
            { value: "INACTIVE", label: "Nonaktif" },
            { value: "DECEASED", label: "Meninggal" },
          ]}
          placeholder="Tidak diubah"
          error={state.errors?.status}
        />
      </div>
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={pending}>
        {pending ? "Memperbarui..." : "Update pasien"}
      </Button>
    </form>
  )
}

export function DeactivatePatientForm({ patients }: { patients: PatientListItem[] }) {
  const [state, formAction, pending] = React.useActionState(deactivatePatientAction, initialClinicFormState)
  useRefreshOnSuccess(state)
  const activePatients = patients.filter((patient) => patient.status !== "Nonaktif")

  if (activePatients.length === 0) {
    return <EmptyState title="Tidak ada pasien aktif" detail="Pasien aktif akan muncul di sini jika perlu dinonaktifkan." />
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <ComboboxField
        name="patientId"
        label="Pasien"
        items={activePatients.map(p => ({ value: p.id, label: `${p.medicalRecordNumber} - ${p.name} - ${p.status}` }))}
        placeholder="Pilih pasien"
        error={state.errors?.patientId}
      />
      <DestructiveActionNotice message="Pasien tidak dihapus permanen. Statusnya menjadi nonaktif agar riwayat klinis, dokumen, dan audit tetap tersimpan." />
      <FormMessage state={state} />
      <ConfirmSubmitButton
        message="Nonaktifkan pasien ini? Riwayat klinis tetap tersimpan."
        confirmLabel="Nonaktifkan pasien"
        pending={pending}
        pendingLabel="Menonaktifkan..."
        variant="destructive"
      >
        Nonaktifkan pasien
      </ConfirmSubmitButton>
    </form>
  )
}
