import type { Request } from 'express'
import type { Role } from '@prisma/client'

export type AuthUser = {
  id: string
  role: Role
  shipId: string | null
}

/** Crew is fixed to their ship. Admin must provide shipId for multi-ship queries. */
export function resolveShipId(
  user: AuthUser,
  queryShipId: string | undefined,
): { ok: true; shipId: string } | { ok: false; status: number; message: string } {
  if (user.role === 'CREW') {
    if (!user.shipId) {
      return { ok: false, status: 403, message: 'Crew user has no assigned ship' }
    }
    if (queryShipId && queryShipId !== user.shipId) {
      return { ok: false, status: 403, message: 'Cannot access another ship' }
    }
    return { ok: true, shipId: user.shipId }
  }
  if (!queryShipId) {
    return { ok: false, status: 400, message: 'ship_id is required' }
  }
  return { ok: true, shipId: queryShipId }
}

export function getAuthUser(req: Request): AuthUser | undefined {
  return req.authUser
}
