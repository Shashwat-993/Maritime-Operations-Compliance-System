import { Router } from 'express'
import { authJWT } from '../middleware/authJWT.js'
import { roleCheck } from '../middleware/roleCheck.js'
import * as ships from '../controllers/shipController.js'

const router = Router()
router.use(authJWT)
router.use(roleCheck('ADMIN'))
router.get('/', ships.listShips)
export default router
