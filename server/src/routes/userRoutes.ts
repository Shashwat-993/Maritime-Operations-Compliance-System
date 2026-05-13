import { Router } from 'express'
import { authJWT } from '../middleware/authJWT.js'
import * as users from '../controllers/userController.js'

const router = Router()
router.use(authJWT)
router.get('/', users.listUsersForShip)
export default router
