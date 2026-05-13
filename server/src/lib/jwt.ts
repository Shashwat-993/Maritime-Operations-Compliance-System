import jwt, { type SignOptions } from 'jsonwebtoken'
import type { Role } from '@prisma/client'

const secret = process.env.JWT_SECRET ?? 'dev-insecure-secret'

export type JwtPayload = {
  sub: string
  role: Role
  shipId: string | null
}

export function signToken(payload: JwtPayload, expiresIn: SignOptions['expiresIn'] = '7d'): string {
  const options: SignOptions = { subject: payload.sub, expiresIn }
  return jwt.sign({ role: payload.role, shipId: payload.shipId }, secret, options)
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload & {
    role: Role
    shipId: string | null
  }
  if (!decoded.sub) throw new Error('Invalid token')
  return {
    sub: decoded.sub,
    role: decoded.role,
    shipId: decoded.shipId ?? null,
  }
}
