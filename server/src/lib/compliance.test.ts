import { test } from 'node:test'
import assert from 'node:assert/strict'
import { maintenanceScore, drillScore, overdueTasks, missedDrills } from './compliance.js'

test('maintenanceScore is null when there are no tasks', () => {
  assert.equal(maintenanceScore([]), null)
})

test('maintenanceScore is the percentage of COMPLETED tasks', () => {
  const tasks = [
    { status: 'COMPLETED' as const },
    { status: 'COMPLETED' as const },
    { status: 'PENDING' as const },
    { status: 'IN_PROGRESS' as const },
  ]
  assert.equal(maintenanceScore(tasks), 50)
})

test('maintenanceScore is 100 when every task is COMPLETED', () => {
  assert.equal(maintenanceScore([{ status: 'COMPLETED' as const }]), 100)
})

test('drillScore is null when no attendance has been logged', () => {
  assert.equal(drillScore([]), null)
})

test('drillScore is the percentage of attended records', () => {
  const attendance = [
    { attended: true },
    { attended: true },
    { attended: false },
    { attended: false },
  ]
  assert.equal(drillScore(attendance), 50)
})

test('overdueTasks returns only past-due, non-completed tasks with a due date', () => {
  const past = new Date(Date.now() - 86_400_000)
  const future = new Date(Date.now() + 86_400_000)
  const tasks = [
    { id: '1', title: 'overdue', status: 'PENDING' as const, dueDate: past },
    { id: '2', title: 'done but past', status: 'COMPLETED' as const, dueDate: past },
    { id: '3', title: 'future', status: 'PENDING' as const, dueDate: future },
    { id: '4', title: 'no due date', status: 'PENDING' as const, dueDate: null },
  ]
  assert.deepEqual(
    overdueTasks(tasks).map((t) => t.id),
    ['1'],
  )
})

test('missedDrills returns past drills with zero attendance', () => {
  const past = new Date(Date.now() - 86_400_000)
  const future = new Date(Date.now() + 86_400_000)
  const drills = [
    { id: '1', type: 'FIRE' as const, scheduledDate: past, attendanceCount: 0 },
    { id: '2', type: 'FIRE' as const, scheduledDate: past, attendanceCount: 3 },
    { id: '3', type: 'MOB' as const, scheduledDate: future, attendanceCount: 0 },
  ]
  assert.deepEqual(
    missedDrills(drills).map((d) => d.id),
    ['1'],
  )
})
