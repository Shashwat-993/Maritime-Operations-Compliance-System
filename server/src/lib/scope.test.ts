import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveShipId, type AuthUser } from './scope.js'

const crew: AuthUser = { id: 'u1', role: 'CREW', shipId: 'ship-a' }
const crewNoShip: AuthUser = { id: 'u2', role: 'CREW', shipId: null }
const admin: AuthUser = { id: 'u3', role: 'ADMIN', shipId: null }

test('crew resolves to their own ship when no ship_id is supplied', () => {
  assert.deepEqual(resolveShipId(crew, undefined), { ok: true, shipId: 'ship-a' })
})

test('crew resolves when the supplied ship_id matches their own', () => {
  assert.deepEqual(resolveShipId(crew, 'ship-a'), { ok: true, shipId: 'ship-a' })
})

test('crew is forbidden from another ship', () => {
  const result = resolveShipId(crew, 'ship-b')
  assert.deepEqual(result, { ok: false, status: 403, message: 'Cannot access another ship' })
})

test('crew without an assigned ship is forbidden', () => {
  const result = resolveShipId(crewNoShip, undefined)
  assert.equal(result.ok, false)
  assert.equal(result.ok === false && result.status, 403)
})

test('admin must supply a ship_id', () => {
  const result = resolveShipId(admin, undefined)
  assert.deepEqual(result, { ok: false, status: 400, message: 'ship_id is required' })
})

test('admin resolves to the requested ship', () => {
  assert.deepEqual(resolveShipId(admin, 'ship-b'), { ok: true, shipId: 'ship-b' })
})
