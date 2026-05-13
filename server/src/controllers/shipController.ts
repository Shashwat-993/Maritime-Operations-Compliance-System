import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

export async function listShips(_req: Request, res: Response) {
  const ships = await prisma.ship.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, imoNumber: true },
  })
  return res.json(ships)
}
