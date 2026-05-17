import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { resolveShipId, getAuthUser } from '../lib/scope.js'
import { maintenanceScore, drillScore, overdueTasks, missedDrills } from '../lib/compliance.js'

export async function getCompliance(req: Request, res: Response) {
  const user = getAuthUser(req)!
  const ship = resolveShipId(user, req.query.ship_id as string | undefined)
  if (!ship.ok) return res.status(ship.status).json({ error: ship.message })

  const [tasks, drills, attendance] = await Promise.all([
    prisma.maintenanceTask.findMany({
      where: { shipId: ship.shipId },
      select: { id: true, title: true, status: true, dueDate: true },
    }),
    prisma.drill.findMany({
      where: { shipId: ship.shipId },
      select: {
        id: true,
        type: true,
        scheduledDate: true,
        _count: { select: { attendance: true } },
      },
    }),
    prisma.drillAttendance.findMany({
      where: { drill: { shipId: ship.shipId } },
      select: { attended: true },
    }),
  ])

  const drillsWithCounts = drills.map((d) => ({
    id: d.id,
    type: d.type,
    scheduledDate: d.scheduledDate,
    attendanceCount: d._count.attendance,
  }))
  const missed = missedDrills(drillsWithCounts)

  return res.json({
    shipId: ship.shipId,
    maintenanceScore: maintenanceScore(tasks),
    drillScore: drillScore(attendance),
    overdue: overdueTasks(tasks),
    missedDrills: missed.map((d) => ({ id: d.id, type: d.type, scheduledDate: d.scheduledDate })),
    counts: {
      tasksTotal: tasks.length,
      tasksCompleted: tasks.filter((t) => t.status === 'COMPLETED').length,
      tasksPending: tasks.filter((t) => t.status !== 'COMPLETED').length,
      drillsTotal: drills.length,
      drillsMissed: missed.length,
      attendanceMarked: attendance.length,
      attendanceAttended: attendance.filter((a) => a.attended).length,
    },
  })
}
