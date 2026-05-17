import 'dotenv/config'
import 'express-async-errors'
import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import { Prisma } from '@prisma/client'
import authRoutes from './routes/authRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import drillRoutes from './routes/drillRoutes.js'
import complianceRoutes from './routes/complianceRoutes.js'
import shipRoutes from './routes/shipRoutes.js'
import userRoutes from './routes/userRoutes.js'
import { ensureDemoUsers } from './lib/bootstrap.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const corsOrigin = process.env.CORS_ORIGIN

app.use(
  cors(
    corsOrigin
      ? { origin: corsOrigin, credentials: true }
      : { origin: true },
  ),
)
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/drills', drillRoutes)
app.use('/api/compliance', complianceRoutes)
app.use('/api/ships', shipRoutes)
app.use('/api/users', userRoutes)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Record not found' })
    if (err.code === 'P2002') return res.status(409).json({ error: 'Unique constraint violated' })
    if (err.code === 'P2003') return res.status(400).json({ error: 'Related record not found' })
  }
  console.error('[error]', err)
  return res.status(500).json({ error: 'Internal server error' })
})

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
  ensureDemoUsers().catch((err) => console.error('[bootstrap] ensureDemoUsers failed', err))
})
