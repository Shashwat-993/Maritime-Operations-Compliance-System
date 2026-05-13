import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { resolveShipId, getAuthUser } from '../lib/scope.js'

export async function listUsersForShip(req: Request, res: Response) {
  const user = getAuthUser(req)!
  const ship = resolveShipId(user, req.query.ship_id as string | undefined)
  if (!ship.ok) return res.status(ship.status).json({ error: ship.message })

  const users = await prisma.user.findMany({
    where: { shipId: ship.shipId },
    select: { id: true, name: true, email: true, role: true, shipId: true },
    orderBy: { name: 'asc' },
  })
  return res.json(users)
}
