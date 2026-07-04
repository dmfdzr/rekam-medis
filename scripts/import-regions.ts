import { RegionType, PrismaClient } from "@prisma/client"
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
const baseUrl = "https://www.emsifa.com/api-wilayah-indonesia/api"
const concurrency = 8
const districtBatchSize = 500

type RemoteRegion = {
  id: string
  name: string
}

async function fetchRegions(path: string) {
  const response = await fetch(`${baseUrl}/${path}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`)
  }

  return (await response.json()) as RemoteRegion[]
}

async function runPool<T, R>(items: T[], worker: (item: T, index: number) => Promise<R>) {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await worker(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker))

  return results
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

async function main() {
  console.log("Resetting regions table...")
  await prisma.region.deleteMany()

  const provinces = await fetchRegions("provinces.json")

  await prisma.region.createMany({
    data: provinces.map((province) => ({
      code: province.id,
      name: province.name,
      type: RegionType.PROVINCE,
    })),
  })

  const savedProvinces = await prisma.region.findMany({
    where: { type: RegionType.PROVINCE },
    select: { id: true, code: true },
  })
  const provinceIdByCode = new Map(savedProvinces.map((province) => [province.code, province.id]))
  const cityGroups = await runPool(provinces, async (province) => ({
    province,
    cities: await fetchRegions(`regencies/${province.id}.json`),
  }))
  const cities = cityGroups.flatMap(({ province, cities }) =>
    cities.map((city) => ({
      code: city.id,
      name: city.name,
      type: RegionType.CITY,
      parentId: provinceIdByCode.get(province.id) ?? null,
    })),
  )

  await prisma.region.createMany({ data: cities })

  const savedCities = await prisma.region.findMany({
    where: { type: RegionType.CITY },
    select: { id: true, code: true },
  })
  const cityIdByCode = new Map(savedCities.map((city) => [city.code, city.id]))
  const districtGroups = await runPool(savedCities, async (city) => ({
    city,
    districts: await fetchRegions(`districts/${city.code}.json`),
  }))
  const districts = districtGroups.flatMap(({ city, districts }) =>
    districts.map((district) => ({
      code: district.id,
      name: district.name,
      type: RegionType.DISTRICT,
      parentId: cityIdByCode.get(city.code) ?? null,
    })),
  )

  for (const batch of chunk(districts, districtBatchSize)) {
    await prisma.region.createMany({ data: batch })
  }

  console.log(`Imported ${provinces.length} provinsi, ${cities.length} kabupaten/kota, ${districts.length} kecamatan.`)
  console.log("Centroid latitude/longitude remains nullable and can be filled from a vetted centroid dataset later.")
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
