import express from 'express';

const router = express.Router();

router.get('/supabase-token', async (req, res) => {
  try {
    // The user is already authenticated via middleware
    const { user } = req;
    
    if (!user || !user.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Dynamically import jose
    const jose = await import('jose');
    
    // Create a JWT that Supabase will accept
    const secret = new TextEncoder().encode(
      process.env.SUPABASE_JWT_SECRET || ''
    );
    
    const jwt = await new jose.SignJWT({ 
      sub: user.userId,
      role: 'authenticated',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);
    
    return res.json({ token: jwt });
  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

export default router;
