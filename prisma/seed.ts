import { PrismaClient, Priority } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const testTasks = [
    {
      userId: 'user1',
      taskName: 'Complete Project Proposal',
      description: 'Finish the draft for the new client project',
      priority: Priority.HIGH,
      project: 'Client A',
      deadline: new Date('2024-10-15'),
      timeRequired: '4 hours',
    },
    {
      userId: 'user1',
      taskName: 'Weekly Team Meeting',
      description: 'Discuss progress and blockers',
      priority: Priority.MEDIUM,
      project: 'Internal',
      deadline: new Date('2024-10-14'),
      timeRequired: '1 hour',
    },
    {
      userId: 'user1',
      taskName: 'Review Code PR',
      description: 'Review and merge the latest pull request',
      priority: Priority.LOW,
      project: 'Development',
      deadline: new Date('2024-10-16'),
      timeRequired: '2 hours',
    },
  ]

  for (const task of testTasks) {
    await prisma.task.create({
      data: task,
    })
  }

  console.log('Seed data inserted successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
