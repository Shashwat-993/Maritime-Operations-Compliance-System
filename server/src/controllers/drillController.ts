import type { Request, Response } from 'express'
import type { DrillType } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { resolveShipId, getAuthUser } from '../lib/scope.js'

const TYPES: DrillType[] = ['FIRE', 'EVACUATION', 'MOB']

function parseDateDay(dateStr: string | undefined): { start: Date; end: Date } | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999))
  return { start, end }
}

export async function listDrills(req: Request, res: Response) {
  const user = getAuthUser(req)!
  const ship = resolveShipId(user, req.query.ship_id as string | undefined)
  if (!ship.ok) return res.status(ship.status).json({ error: ship.message })

  const day = parseDateDay(req.query.date as string | undefined)

  const drills = await prisma.drill.findMany({
    where: {
      shipId: ship.shipId,
      ...(day
        ? {
            scheduledDate: {
              gte: day.start,
              lte: day.end,
            },
          }
        : {}),
    },
    orderBy: { scheduledDate: 'desc' },
    include: {
      attendance: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  })
  return res.json(drills)
}

export async function createDrill(req: Request, res: Response) {
  const { ship_id, type, scheduled_date } = req.body ?? {}
  if (!ship_id || typeof scheduled_date !== 'string') {
    return res.status(400).json({ error: 'ship_id and scheduled_date are required' })
  }
  if (!type || !TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid drill type' })
  }
  const when = new Date(scheduled_date)
  if (Number.isNaN(when.getTime())) {
    return res.status(400).json({ error: 'Invalid scheduled_date' })
  }
  const drill = await prisma.drill.create({
    data: {
      shipId: ship_id,
      type,
      scheduledDate: when,
    },
  })
  return res.status(201).json(drill)
}

export async function attendDrill(req: Request, res: Response) {
  const user = getAuthUser(req)!
  const { id } = req.params
  const attended = req.body?.attended
  if (typeof attended !== 'boolean') {
    return res.status(400).json({ error: 'attended boolean required' })
  }

  const drill = await prisma.drill.findUnique({ where: { id } })
  if (!drill) return res.status(404).json({ error: 'Drill not found' })

  if (user.role === 'CREW') {
    if (!user.shipId || drill.shipId !== user.shipId) {
      return res.status(403).json({ error: 'Forbidden' })
    }
  }

  const row = await prisma.drillAttendance.upsert({
    where: {
      drillId_userId: { drillId: id, userId: user.id },
    },
    create: {
      drillId: id,
      userId: user.id,
      attended,
    },
    update: {
      attended,
      submittedAt: new Date(),
    },
  })
  return res.json(row)
}
