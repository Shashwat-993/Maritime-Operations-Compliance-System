import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10)

async function main() {
  await prisma.drillAttendance.deleteMany()
  await prisma.taskComment.deleteMany()
  await prisma.maintenanceTask.deleteMany()
  await prisma.drill.deleteMany()
  await prisma.user.deleteMany()
  await prisma.ship.deleteMany()

  // Create ships
  const ships = await prisma.ship.createMany({
    data: [
      { name: 'MV Horizon', imoNumber: '9123456' },
      { name: 'MV Compass', imoNumber: '9234567' },
      { name: 'MV Explorer', imoNumber: '9345678' },
      { name: 'MV Voyager', imoNumber: '9456789' },
      { name: 'MV Discovery', imoNumber: '9567890' },
    ],
  })
  // Fetch ships with IDs
  const allShips = await prisma.ship.findMany()
  const [shipA, shipB, shipC, shipD, shipE] = allShips

  // Create users
  const passwordHash = await bcrypt.hash('password123', rounds)
  const users = await prisma.user.createMany({
    data: [
      { name: 'Captain Nipun Chatrath', email: 'admin@fathommarine.com', passwordHash, role: 'ADMIN', shipId: null },
      { name: 'Shashwat Pal', email: 'crew@fathommarine.com', passwordHash, role: 'CREW', shipId: shipA.id },
      { name: 'Second Admin', email: 'admin2@example.com', passwordHash, role: 'ADMIN', shipId: null },
      { name: 'Crew Alpha', email: 'alpha@example.com', passwordHash, role: 'CREW', shipId: shipB.id },
      { name: 'Crew Bravo', email: 'bravo@example.com', passwordHash, role: 'CREW', shipId: shipC.id },
      { name: 'Crew Charlie', email: 'charlie@example.com', passwordHash, role: 'CREW', shipId: shipD.id },
      { name: 'Crew Delta', email: 'delta@example.com', passwordHash, role: 'CREW', shipId: shipE.id },
    ],
  })
  // Fetch users with IDs
  const allUsers = await prisma.user.findMany()
  const admin = allUsers.find(u => u.email === 'admin@fathommarine.com')
  const crew = allUsers.find(u => u.email === 'crew@fathommarine.com')
  const alpha = allUsers.find(u => u.email === 'alpha@example.com')
  const bravo = allUsers.find(u => u.email === 'bravo@example.com')
  const charlie = allUsers.find(u => u.email === 'charlie@example.com')
  const delta = allUsers.find(u => u.email === 'delta@example.com')

  // Create maintenance tasks
  await prisma.maintenanceTask.createMany({
    data: [
      // Ship A
      { shipId: shipA.id, assignedTo: crew.id, title: 'Engine room inspection', description: 'Weekly checklist', status: 'COMPLETED', dueDate: new Date(Date.now() - 86400000) },
      { shipId: shipA.id, assignedTo: crew.id, title: 'Lifeboat davits', status: 'IN_PROGRESS', dueDate: new Date() },
      { shipId: shipA.id, title: 'Fire pump test', status: 'PENDING', dueDate: new Date(Date.now() + 3 * 86400000) },
      { shipId: shipA.id, title: 'Overdue safety walkthrough', status: 'PENDING', dueDate: new Date(Date.now() - 5 * 86400000) },
      // Ship B
      { shipId: shipB.id, assignedTo: alpha.id, title: 'Hull inspection', status: 'IN_PROGRESS', dueDate: new Date(Date.now() + 2 * 86400000) },
      { shipId: shipB.id, assignedTo: alpha.id, title: 'Bridge electronics check', status: 'PENDING', dueDate: new Date(Date.now() + 5 * 86400000) },
      // Ship C
      { shipId: shipC.id, assignedTo: bravo.id, title: 'Anchor chain maintenance', status: 'COMPLETED', dueDate: new Date(Date.now() - 2 * 86400000) },
      // Ship D
      { shipId: shipD.id, assignedTo: charlie.id, title: 'Navigation lights test', status: 'PENDING', dueDate: new Date(Date.now() + 1 * 86400000) },
      // Ship E
      { shipId: shipE.id, assignedTo: delta.id, title: 'Galley safety check', status: 'IN_PROGRESS', dueDate: new Date() },
    ],
  })

  // Create drills
  const fireDrillA = await prisma.drill.create({ data: { shipId: shipA.id, type: 'FIRE', scheduledDate: new Date() } })
  const evacDrillB = await prisma.drill.create({ data: { shipId: shipB.id, type: 'EVACUATION', scheduledDate: new Date(Date.now() + 2 * 86400000) } })
  const fireDrillC = await prisma.drill.create({ data: { shipId: shipC.id, type: 'FIRE', scheduledDate: new Date(Date.now() - 3 * 86400000) } })
  const evacDrillD = await prisma.drill.create({ data: { shipId: shipD.id, type: 'EVACUATION', scheduledDate: new Date() } })

  // Drill attendance
  await prisma.drillAttendance.createMany({
    data: [
      { drillId: fireDrillA.id, userId: crew.id, attended: true },
      { drillId: evacDrillB.id, userId: alpha.id, attended: false },
      { drillId: fireDrillC.id, userId: bravo.id, attended: true },
      { drillId: evacDrillD.id, userId: charlie.id, attended: false },
    ],
  })

  console.log('Seed complete.', { admin: admin.email, crew: crew.email, ships: allShips.map(s => s.name) })
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
