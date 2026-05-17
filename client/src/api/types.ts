export type Role = 'ADMIN' | 'CREW'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: Role
  shipId: string | null
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export type DrillType = 'FIRE' | 'EVACUATION' | 'MOB'

export type MaintenanceTask = {
  id: string
  shipId: string
  assignedTo: string | null
  title: string
  description: string | null
  status: TaskStatus
  dueDate: string | null
  createdAt: string
  assignee?: { id: string; name: string; email?: string } | null
  comments?: TaskComment[]
}

export type TaskComment = {
  id: string
  taskId: string
  userId: string
  note: string
  createdAt: string
  user: { id: string; name: string }
}

export type Drill = {
  id: string
  shipId: string
  type: DrillType
  scheduledDate: string
  createdAt: string
  attendance: {
    id: string
    userId: string
    attended: boolean
    user: { id: string; name: string; email: string }
  }[]
}

export type ComplianceResponse = {
  shipId: string
  maintenanceScore: number | null
  drillScore: number | null
  overdue: { id: string; title: string; status: TaskStatus; dueDate: string | null }[]
  missedDrills: { id: string; type: DrillType; scheduledDate: string }[]
  counts: {
    tasksTotal: number
    tasksCompleted: number
    tasksPending: number
    drillsTotal: number
    drillsMissed: number
    attendanceMarked: number
    attendanceAttended: number
  }
}

export type Ship = {
  id: string
  name: string
  imoNumber: string
}

export type CrewMember = {
  id: string
  name: string
  email: string
  role: Role
  shipId: string | null
}
