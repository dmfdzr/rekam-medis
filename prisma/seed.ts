import bcrypt from "bcryptjs"
import {
  PrismaClient,
  UserRole,
} from "@prisma/client"
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

const roles = [
  {
    key: UserRole.MASTER,
    name: "Master",
    description: "Akses penuh seluruh fitur aplikasi.",
  },
  {
    key: UserRole.ADMIN,
    name: "Admin Pendaftaran",
    description: "Mengelola data pasien dan kunjungan.",
  },
  {
    key: UserRole.DOCTOR,
    name: "Dokter",
    description: "Mengelola alur klinis selain pendaftaran, manajemen user, dan audit log.",
  },
]

const users = [
  {
    name: "Master User",
    email: "master@medrecord.local",
    username: "master",
    role: UserRole.MASTER,
    password: "master123",
  },
  {
    name: "Admin Pendaftaran",
    email: "admin@medrecord.local",
    username: "admin",
    role: UserRole.ADMIN,
    password: "admin123",
  },
  { name: "dr. Andi Pratama, Sp.PD", email: "andi@mail.com", username: "andi", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Siti Rahmawati, Sp.A", email: "siti@mail.com", username: "siti", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Budi Santoso, Sp.B", email: "budi@mail.com", username: "budi", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Rina Kartika, Sp.OG", email: "rina@mail.com", username: "rina", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Dedi Kurniawan, Sp.JP", email: "dedi@mail.com", username: "dedi", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Maya Lestari, Sp.N", email: "maya@mail.com", username: "maya", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Rizky Hidayat, Sp.THT-KL", email: "rizky@mail.com", username: "rizky", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Fitri Anggraini, Sp.M", email: "fitri@mail.com", username: "fitri", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Arief Nugroho, Sp.OT", email: "arief@mail.com", username: "arief", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Nabila Putri, Sp.KJ", email: "nabila@mail.com", username: "nabila", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Fajar Maulana, Sp.P", email: "fajar@mail.com", username: "fajar", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Intan Permata, Sp.KK", email: "intan@mail.com", username: "intan", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Yudha Saputra, Sp.U", email: "yudha@mail.com", username: "yudha", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Ratna Dewi, Sp.Rad", email: "ratna@mail.com", username: "ratna", role: UserRole.DOCTOR, password: "dokter123" },
  { name: "dr. Hendra Wijaya, Sp.An", email: "hendra@mail.com", username: "hendra", role: UserRole.DOCTOR, password: "dokter123" },
]

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: {
        name: role.name,
        description: role.description,
      },
      create: role,
    })
  }

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12)
    const role = await prisma.role.findUniqueOrThrow({
      where: { key: user.role },
      select: { id: true },
    })

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        username: user.username,
        roleId: role.id,
        passwordHash,
      },
      create: {
        name: user.name,
        email: user.email,
        username: user.username,
        passwordHash,
        roleId: role.id,
      },
    })
  }

  await prisma.user.deleteMany({
    where: {
      username: {
        notIn: users.map((user) => user.username),
      },
    },
  })

  await prisma.role.deleteMany({
    where: {
      key: {
        notIn: roles.map((role) => role.key),
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      action: "SEED_CORE_USERS",
      entityName: "Database",
      afterData: {
        users: users.length,
        roles: roles.length,
      },
    },
  })
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
