import express from 'express'
import { supabase } from '../../utils/supabase'
import { authenticateUser } from '../../utils/supabaseAuth'
import { requirePlatformAdmin } from '../../utils/supabase'
import { IUser } from '../../Interface'

const router = express.Router()

// Protect this route with authentication and admin check
router.use(authenticateUser)
router.use(requirePlatformAdmin)

router.post('/', async (req, res) => {
  try {
    const { email, password, name } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    
    // Create the user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    
    if (error) {
      return res.status(400).json({ error: error.message })
    }
    
    const user: IUser = {
      userId: data.user.id,
      email: data.user.email,
      provider: 'email',
      userMetadata: {
        name: name || ''
      }
    }
    
    return res.json({ user })
  } catch (error) {
    console.error('User creation error:', error)
    return res.status(500).json({ error: 'Server error during user creation' })
  }
})

export default router 