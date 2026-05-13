import type { MaintenanceTask, DrillAttendance } from '@prisma/client'

export function maintenanceScore(tasks: Pick<MaintenanceTask, 'status'>[]): number | null {
  const total = tasks.length
  if (total === 0) return null
  const completed = tasks.filter((t) => t.status === 'COMPLETED').length
  return (completed / total) * 100
}

/** Percentage of submitted attendance records that were "attended = true". */
export function drillScore(attendance: Pick<DrillAttendance, 'attended'>[]): number | null {
  if (attendance.length === 0) return null
  return (attendance.filter((a) => a.attended).length / attendance.length) * 100
}

export function overdueTasks<T extends Pick<MaintenanceTask, 'id' | 'dueDate' | 'status' | 'title'>>(tasks: T[]) {
  const now = new Date()
  return tasks.filter(
    (t) => t.dueDate != null && t.dueDate < now && t.status !== 'COMPLETED',
  )
}
