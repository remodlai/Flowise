import express from 'express'
import { UserController } from '../../controllers/UserController'
import customRolesRouter from './custom-roles'

const router = express.Router()

// User CRUD routes
router.get('/', UserController.getAllUsers)
router.post('/', UserController.createUser)
router.get('/:id', UserController.getUserById)
router.put('/:id', UserController.updateUser)
router.delete('/:id', UserController.deleteUser)

// Mount the custom-roles router
router.use('/:id/custom-roles', customRolesRouter)

export default router 