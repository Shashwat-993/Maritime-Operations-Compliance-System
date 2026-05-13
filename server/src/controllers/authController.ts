import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { signToken } from '../lib/jwt.js'

export async function login(req: Request, res: Response) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' })
  }
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const token = signToken({
    sub: user.id,
    role: user.role,
    shipId: user.shipId,
  })
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shipId: user.shipId,
    },
  })
}
