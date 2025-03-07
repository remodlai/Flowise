import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import { useSelector, useDispatch } from 'react-redux'
import Logo from '@/ui-component/extended/Logo'
import colors from '@/assets/scss/_themes-vars.module.scss'
import { SET_DARKMODE } from '@/store/actions'

import { 
  Box, 
  CircularProgress, 
  Typography, 
  TextField, 
  Button, 
  Divider, 
  Link,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  Stack 
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import EmailIcon from '@mui/icons-material/Email'

// Force Graph
import ForceGraph from '@/ui-component/graphs/ForceGraph'

// ===========================|| LOGIN ||=========================== //

const Login = () => {
    const theme = useTheme()
    const navigate = useNavigate()
    const customization = useSelector((state) => state.customization)
    const { isAuthenticated, login, isLoading } = useAuth()

    // Initialize dark mode from localStorage
    const storedDarkMode = localStorage.getItem('isDarkMode') === 'true'
    const dispatch = useDispatch()

    // Set Redux state to match localStorage on component mount
    useEffect(() => {
        if (customization.isDarkMode !== storedDarkMode) {
            dispatch({ type: SET_DARKMODE, isDarkMode: storedDarkMode })
        }
    }, [])

    const changeDarkMode = () => {
        const newDarkMode = !customization.isDarkMode
        dispatch({ type: SET_DARKMODE, isDarkMode: newDarkMode })
        localStorage.setItem('isDarkMode', newDarkMode)
    }
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [authMode, setAuthMode] = useState('password') // 'password' or 'magic-link'
    
    // Redirect if already authenticated
    useEffect(() => {
      if (isAuthenticated) {
        navigate('/chatflows')
      }
    }, [isAuthenticated, navigate])

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        // Clear errors when user types
        setError(null)
    }

    const handleTogglePassword = () => {
        setShowPassword(!showPassword)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)
        
        try {
            if (authMode === 'password') {
                // Handle email/password login
                const response = await fetch('/api/v1/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password
                    })
                })
                
                const data = await response.json()
                
                if (!response.ok) {
                    throw new Error(data.error || 'Login failed')
                }
                
                // Login successful
                login({
                    email: data.user.email,
                    accessToken: data.session.access_token,
                    refreshToken: data.session.refresh_token,
                    expiresAt: data.session.expires_at,
                    userId: data.user.userId,
                    provider: data.user.provider,
                    userMetadata: data.user.userMetadata
                })
                
                navigate('/chatflows')
            } else {
                // Handle magic link request
                const response = await fetch('/api/v1/auth/magic-link', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        redirectTo: `${window.location.origin}/auth/callback`
                    })
                })
                
                const data = await response.json()
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to send magic link')
                }
                
                // Show success message
                setSuccessMessage('Magic link sent! Check your email to log in.')
                setFormData({
                    ...formData,
                    password: ''
                })
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const switchAuthMode = (mode) => {
        setAuthMode(mode)
        setError(null)
        setSuccessMessage(null)
    }

    return (
        <Box sx={{
            display: 'flex',
            minHeight: '100vh',
            minWidth: '100vw',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: customization.isDarkMode ? '#191932' : '#191932',
            //backgroundColor: 'transparent',
            overflow: 'visible'
        }}>
            {/* Login Form - Right Side */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                width: { xs: '100%', md: '440px' },
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, sm: 4 },
                backgroundColor: '#191932',
                zIndex: 10000,
                borderRadius: '10px'
            }}>
                <Logo />
                
                <Typography variant="h4" sx={{ mt: 2, mb: 4 }}>
                    Welcome to Remodl AI Platform
                </Typography>
                
                {isLoading ? (
                    <CircularProgress sx={{ mt: 4 }} />
                ) : (
                    <Paper elevation={0} sx={{ backgroundColor: '#191932', boxShadow: 'none', width: '100%', maxWidth: 400, p: 3 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        
                        {successMessage && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                {successMessage}
                            </Alert>
                        )}
                        
                        <form onSubmit={handleSubmit}>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                
                                {authMode === 'password' && (
                                    <TextField
                                        fullWidth
                                        label="Password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={handleTogglePassword}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                                
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    size="large"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <CircularProgress size={24} />
                                    ) : (
                                        authMode === 'password' ? 'Sign In' : 'Send Magic Link'
                                    )}
                                </Button>
                            </Stack>
                        </form>
                        
                        <Divider sx={{ my: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                                OR
                            </Typography>
                        </Divider>
                        
                        <Box sx={{ textAlign: 'center' }}>
                            {authMode === 'password' ? (
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={() => switchAuthMode('magic-link')}
                                    underline="hover"
                                >
                                    Sign in with Magic Link
                                </Link>
                            ) : (
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={() => switchAuthMode('password')}
                                    underline="hover"
                                >
                                    Sign in with Password
                                </Link>
                            )}
                        </Box>
                    </Paper>
                )}
            </Box>

            {/* Force Graph Section - Left Side */}
            <Box sx={{
                display: { xs: 'none', md: 'flex' },
                position: 'absolute',
                flex: '1 1 auto',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Box sx={{
                    position: 'relative',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    overflow: 'hidden',
                    maxWidth: '100vw',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    
                }}>
                    <ForceGraph />
                </Box>
            </Box>
        </Box>
    )
}

export default Login
