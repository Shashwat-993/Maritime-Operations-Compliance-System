import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import * as auth from '../controllers/authController.js'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
})

const router = Router()
router.post('/login', loginLimiter, auth.login)
export default router
