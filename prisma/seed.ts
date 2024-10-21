import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // You can add some seed data here if needed
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
