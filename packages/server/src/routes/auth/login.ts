import express from 'express'
import { supabase } from '../../utils/supabase'
import { IUser } from '../../Interface'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      return res.status(401).json({ error: error.message })
    }
    
    const user: IUser = {
      userId: data.user.id,
      email: data.user.email,
      provider: data.user.app_metadata?.provider || 'email',
      userMetadata: data.user.user_metadata || {}
    }
    
    return res.json({
      user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Server error during login' })
  }
})

export default router 