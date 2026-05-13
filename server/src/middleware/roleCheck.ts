import type { Request, Response, NextFunction } from 'express'
import type { Role } from '@prisma/client'

export function roleCheck(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.authUser
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    if (!allowed.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    return next()
  }
}
