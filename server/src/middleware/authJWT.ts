import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt.js'

export function authJWT(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' })
  }
  const token = header.slice('Bearer '.length)
  try {
    const payload = verifyToken(token)
    req.authUser = {
      id: payload.sub,
      role: payload.role,
      shipId: payload.shipId,
    }
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
