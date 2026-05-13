import { Router } from 'express'
import { authJWT } from '../middleware/authJWT.js'
import { roleCheck } from '../middleware/roleCheck.js'
import * as drills from '../controllers/drillController.js'

const router = Router()
router.use(authJWT)
router.get('/', drills.listDrills)
router.post('/', roleCheck('ADMIN'), drills.createDrill)
router.delete('/:id', roleCheck('ADMIN'), drills.deleteDrill)
router.post('/:id/attend', drills.attendDrill)
export default router
