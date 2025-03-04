import express from 'express'
import customRolesRouter from './custom-roles'

const router = express.Router()

// Mount the custom-roles router
router.use('/:id/custom-roles', customRolesRouter)

export default router 