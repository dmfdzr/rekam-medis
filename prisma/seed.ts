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
  {
    name: "dr. Raka Mahendra",
    email: "dokter@medrecord.local",
    username: "dokter",
    role: UserRole.DOCTOR,
    password: "dokter123",
  },
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
