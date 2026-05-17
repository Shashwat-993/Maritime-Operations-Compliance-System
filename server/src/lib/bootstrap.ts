import bcrypt from 'bcryptjs'
import { prisma } from './prisma.js'

const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10)
const demoPassword = process.env.DEMO_PASSWORD ?? 'password123'

export async function ensureDemoUsers() {
  const passwordHash = await bcrypt.hash(demoPassword, rounds)

  let ship = await prisma.ship.findFirst({ orderBy: { id: 'asc' } })
  if (!ship) {
    ship = await prisma.ship.create({ data: { name: 'MV Horizon', imoNumber: '9123456' } })
  }

  await prisma.user.upsert({
    where: { email: 'admin@fathommarine.com' },
    update: { name: 'Captain Nipun Chatrath', role: 'ADMIN', shipId: null },
    create: {
      name: 'Captain Nipun Chatrath',
      email: 'admin@fathommarine.com',
      passwordHash,
      role: 'ADMIN',
      shipId: null,
    },
  })

  await prisma.user.upsert({
    where: { email: 'crew@fathommarine.com' },
    update: { name: 'Shashwat Pal', role: 'CREW', shipId: ship.id },
    create: {
      name: 'Shashwat Pal',
      email: 'crew@fathommarine.com',
      passwordHash,
      role: 'CREW',
      shipId: ship.id,
    },
  })

  console.log('[bootstrap] demo users ensured: admin@fathommarine.com, crew@fathommarine.com')
}
