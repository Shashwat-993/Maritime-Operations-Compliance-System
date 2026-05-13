import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import taskRoutes from './routes/taskRoutes.js'
import drillRoutes from './routes/drillRoutes.js'
import complianceRoutes from './routes/complianceRoutes.js'
import shipRoutes from './routes/shipRoutes.js'
import userRoutes from './routes/userRoutes.js'

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

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
