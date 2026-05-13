import { Router } from 'express'
import { authJWT } from '../middleware/authJWT.js'
import { roleCheck } from '../middleware/roleCheck.js'
import * as tasks from '../controllers/taskController.js'

const router = Router()
router.use(authJWT)
router.get('/', tasks.listTasks)
router.post('/', roleCheck('ADMIN'), tasks.createTask)
router.patch('/:id', tasks.updateTask)
router.post('/:id/comments', tasks.addComment)
export default router
