import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt.js'
import { prisma } from '../lib/prisma.js'

export async function authJWT(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' })
  }
  const token = header.slice('Bearer '.length)

  let userId: string
  try {
    userId = verifyToken(token).sub
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // Resolve role/ship from the DB rather than trusting the token claims, so
  // reassignments, role changes, and deletions take effect immediately instead
  // of lingering until the 7-day token expires.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, shipId: true },
  })
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  req.authUser = { id: user.id, role: user.role, shipId: user.shipId }
  return next()
}
