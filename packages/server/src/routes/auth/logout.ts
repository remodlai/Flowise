import express from 'express'
import { supabase } from '../../utils/supabase'
import { authenticateUser } from '../../utils/supabaseAuth'

const router = express.Router()

/**
 * User logout
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    // The token is already validated by the authenticateUser middleware
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized Access' })
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1]
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut({
      scope: 'local' // Only sign out from this device
    })
    
    if (error) {
      console.error('Logout error:', error)
      return res.status(500).json({ error: error.message })
    }
    
    return res.json({ 
      message: 'Successfully logged out'
    })
  } catch (error) {
    console.error('Server error during logout:', error)
    return res.status(500).json({ error: 'Server error during logout' })
  }
})

export default router 