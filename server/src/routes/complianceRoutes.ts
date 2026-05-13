import { Router } from 'express'
import { authJWT } from '../middleware/authJWT.js'
import * as compliance from '../controllers/complianceController.js'

const router = Router()
router.use(authJWT)
router.get('/', compliance.getCompliance)
export default router
