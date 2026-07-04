import { Gender, PatientStatus, PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { config } from "dotenv"

config({ path: ".env.local" })
config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.")
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const province = "DKI JAKARTA"
const city = "KOTA JAKARTA TIMUR"

const patients = [
  ["3177286410660666", "Siti Saputra", "24-10-1966", Gender.FEMALE, "BIDARA CINA", "JATINEGARA", "Jl. Panglima Polim No. 42, RT 13/RW 09"],
  ["3172245503728614", "Ayu Pratama", "15-03-1972", Gender.FEMALE, "CAKUNG BARAT", "CAKUNG", "Jl. Imam Bonjol No. 102, RT 03/RW 01"],
  ["3171435011111586", "Dewi Wijaya", "10-11-2011", Gender.FEMALE, "CAKUNG TIMUR", "CAKUNG", "Jl. Anggrek No. 34, RT 10/RW 13"],
  ["3176366205741121", "Putri Permata", "22-05-1974", Gender.FEMALE, "CAWANG", "KRAMAT JATI", "Jl. Fatmawati No. 35, RT 02/RW 04"],
  ["3179566508700531", "Nabila Lestari", "25-08-1970", Gender.FEMALE, "CEGER", "CIPAYUNG", "Jl. Anggrek No. 52, RT 07/RW 09"],
  ["3178590804736927", "Andi Saputra", "08-04-1973", Gender.MALE, "CIBUBUR", "CIRACAS", "Jl. Rajawali No. 143, RT 05/RW 09"],
  ["3176895405268644", "Rina Kusuma", "14-05-2026", Gender.FEMALE, "CIJANTUNG", "PASAR REBO", "Jl. Rajawali No. 94, RT 10/RW 11"],
  ["3174692103896524", "Budi Pratama", "21-03-1989", Gender.MALE, "CILANGKAP", "CIPAYUNG", "Jl. Fatmawati No. 99, RT 03/RW 04"],
  ["3177650301248341", "Rizky Wijaya", "03-01-2024", Gender.MALE, "CILILITAN", "KRAMAT JATI", "Jl. Kenanga No. 154, RT 05/RW 11"],
  ["3174315204165044", "Intan Ramadhan", "12-04-2016", Gender.FEMALE, "CIPAYUNG", "CIPAYUNG", "Jl. Merdeka No. 6, RT 10/RW 03"],
  ["3175675012059378", "Lestari Maulana", "10-12-2005", Gender.FEMALE, "CIPINANG", "PULO GADUNG", "Jl. Kamboja No. 51, RT 07/RW 13"],
  ["3171635611437044", "Fitri Handayani", "16-11-1943", Gender.FEMALE, "CIPINANG BESAR SELAT", "JATINEGARA", "Jl. Imam Bonjol No. 127, RT 07/RW 05"],
  ["3179480110996457", "Fajar Permata", "01-10-1999", Gender.MALE, "CIPINANG BESAR UTARA", "JATINEGARA", "Jl. Melati No. 71, RT 13/RW 05"],
  ["3172111407225479", "Dimas Lestari", "14-07-2022", Gender.MALE, "CIPINANG CEMPEDAK", "JATINEGARA", "Jl. Pahlawan No. 52, RT 04/RW 02"],
  ["3172730304652462", "Agus Kusuma", "03-04-1965", Gender.MALE, "CIPINANG MELAYU", "MAKASAR", "Jl. Imam Bonjol No. 62, RT 05/RW 07"],
] as const

function parseIndonesianDate(value: string) {
  const [day, month, year] = value.split("-")

  return new Date(`${year}-${month}-${day}T00:00:00+07:00`)
}

async function generateMedicalRecordNumber() {
  const year = new Date().getFullYear()
  const yearShort = String(year).slice(-2)
  const prefix = `${yearShort}-`
  const latestPatient = await prisma.patient.findFirst({
    where: {
      medicalRecordNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      medicalRecordNumber: "desc",
    },
    select: {
      medicalRecordNumber: true,
    },
  })
  const parts = latestPatient?.medicalRecordNumber.split("-")
  const latestSequence = parts ? Number.parseInt(parts.slice(1).join(""), 10) : 0
  const nextSequence = (latestSequence || 0) + 1
  const padded = String(nextSequence).padStart(4, "0")

  return `${yearShort}-${padded.slice(0, 2)}-${padded.slice(2, 4)}`
}

async function main() {
  let created = 0
  let updated = 0

  for (const [nik, fullName, birthDate, gender, village, district, streetAddress] of patients) {
    const existing = await prisma.patient.findUnique({
      where: { nik },
      select: { id: true },
    })
    const data = {
      nik,
      fullName,
      birthDate: parseIndonesianDate(birthDate),
      gender,
      province,
      city,
      district,
      address: `${streetAddress}, Kel. ${village}`,
      phone: `0800000000${String(created + updated + 1).padStart(2, "0")}`,
      bloodType: "O",
      allergies: "Tidak ada",
      status: PatientStatus.ACTIVE,
    }

    if (existing) {
      await prisma.patient.update({
        where: { id: existing.id },
        data,
      })
      updated += 1
      continue
    }

    await prisma.patient.create({
      data: {
        ...data,
        medicalRecordNumber: await generateMedicalRecordNumber(),
      },
    })
    created += 1
  }

  console.log(`Imported patients. Created: ${created}, Updated: ${updated}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
