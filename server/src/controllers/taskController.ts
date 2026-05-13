import type { Request, Response } from 'express'
import type { TaskStatus } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { resolveShipId, getAuthUser } from '../lib/scope.js'

const STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

function parseDateDay(dateStr: string | undefined): { start: Date; end: Date } | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999))
  return { start, end }
}

export async function listTasks(req: Request, res: Response) {
  const user = getAuthUser(req)!
  const ship = resolveShipId(user, req.query.ship_id as string | undefined)
  if (!ship.ok) return res.status(ship.status).json({ error: ship.message })

  const status = req.query.status as string | undefined
  const statusFilter =
    status && STATUSES.includes(status as TaskStatus) ? (status as TaskStatus) : undefined

  const day = parseDateDay(req.query.date as string | undefined)

  const tasks = await prisma.maintenanceTask.findMany({
    where: {
      shipId: ship.shipId,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(day
        ? {
            dueDate: {
              gte: day.start,
              lte: day.end,
            },
          }
        : {}),
    },
    orderBy: { dueDate: 'asc' },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      comments: { include: { user: { select: { id: true, name: true } } } },
    },
  })
  return res.json(tasks)
}

export async function createTask(req: Request, res: Response) {
  const user = getAuthUser(req)!
  const { ship_id, assigned_to, title, description, status, due_date } = req.body ?? {}
  if (!ship_id || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'ship_id and title are required' })
  }
  const st: TaskStatus =
    status && STATUSES.includes(status) ? status : 'PENDING'
  const dueDate = due_date ? new Date(due_date) : null
  if (due_date && dueDate && Number.isNaN(dueDate.getTime())) {
    return res.status(400).json({ error: 'Invalid due_date' })
  }
  const task = await prisma.maintenanceTask.create({
    data: {
      shipId: ship_id,
      assignedTo: typeof assigned_to === 'string' ? assigned_to : null,
      title: title.trim(),
      description: typeof description === 'string' ? description : null,
      status: st,
      dueDate,
    },
    include: { assignee: { select: { id: true, name: true } } },
  })
  return res.status(201).json(task)
}

export async function updateTask(req: Request, res: Response) {
  const user = getAuthUser(req)!
  const { id } = req.params
  const existing = await prisma.maintenanceTask.findUnique({ where: { id } })
  if (!existing) return res.status(404).json({ error: 'Task not found' })

  if (user.role === 'CREW') {
    if (!user.shipId || existing.shipId !== user.shipId) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const status = req.body?.status as TaskStatus | undefined
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }
    const allowed: Record<string, unknown> = {}
    if (status) allowed.status = status
    if (Object.keys(allowed).length === 0) {
      return res.status(400).json({ error: 'Crew may only update status' })
    }
    const task = await prisma.maintenanceTask.update({
      where: { id },
      data: allowed,
      include: { assignee: { select: { id: true, name: true } } },
    })
    return res.json(task)
  }

  const { title, description, status, due_date, assigned_to, ship_id } = req.body ?? {}
  const data: Record<string, unknown> = {}
  if (typeof title === 'string') data.title = title.trim()
  if (typeof description === 'string') data.description = description
  if (status && STATUSES.includes(status)) data.status = status
  if (due_date !== undefined) {
    const d = due_date ? new Date(due_date) : null
    if (due_date && d && Number.isNaN(d.getTime())) {
      return res.status(400).json({ error: 'Invalid due_date' })
    }
    data.dueDate = d
  }
  if (assigned_to !== undefined) {
    data.assignedTo = typeof assigned_to === 'string' ? assigned_to : null
  }
  if (typeof ship_id === 'string') data.shipId = ship_id
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' })
  }
  const task = await prisma.maintenanceTask.update({
    where: { id },
    data,
    include: { assignee: { select: { id: true, name: true } } },
  })
  return res.json(task)
}

export async function addComment(req: Request, res: Response) {
  const user = getAuthUser(req)!
  const { id } = req.params
  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : ''
  if (!note) return res.status(400).json({ error: 'note is required' })

  const task = await prisma.maintenanceTask.findUnique({ where: { id } })
  if (!task) return res.status(404).json({ error: 'Task not found' })
  if (user.role === 'CREW') {
    if (!user.shipId || task.shipId !== user.shipId) {
      return res.status(403).json({ error: 'Forbidden' })
    }
  }

  const comment = await prisma.taskComment.create({
    data: {
      taskId: id,
      userId: user.id,
      note,
    },
    include: { user: { select: { id: true, name: true } } },
  })
  return res.status(201).json(comment)
}
