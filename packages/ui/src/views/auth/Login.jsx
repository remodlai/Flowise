import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '@/ui-component/extended/Logo'
import { Descope, useSession } from '@descope/react-sdk'
import colors from '@/assets/scss/_themes-vars.module.scss'
import { useTheme } from '@mui/material/styles'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'

// Force Graph
import ForceGraph from '@/ui-component/graphs/ForceGraph'

// ===========================|| LOGIN ||=========================== //

const Login = () => {
    const theme = useTheme()
    const navigate = useNavigate()
    const { login } = useAuth()
    const { isAuthenticated, isSessionLoading } = useSession()
    
    // Redirect if already authenticated
    useEffect(() => {
      if (isAuthenticated) {
        navigate('/')
      }
    }, [isAuthenticated, navigate])

    return (
        <Box sx={{
            display: 'flex',
            minHeight: '100vh',
            backgroundColor: colors.darkPaper,
            overflow: 'hidden'
        }}>
            {/* Login Form - Right Side */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                width: { xs: '100%', md: '40vw' },
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, sm: 4 },
                backgroundColor: theme.palette.mode === 'dark' ? colors.darkPaper : colors.paper
            }}>
                <Logo />
                
                <Typography variant="h4" sx={{ mt: 2, mb: 4 }}>
                    Welcome to Flowise
                </Typography>
                
                {isSessionLoading ? (
                    <CircularProgress sx={{ mt: 4 }} />
                ) : (
                    <Box sx={{ width: '100%', maxWidth: 400 }}>
                        <Descope
                            flowId='sign-in'
                            theme={theme.palette.mode}
                            appearance={{
                                theme: {
                                    primaryColor: theme.palette.primary.main,
                                },
                            }}
                            onSuccess={(e) => {
                                // Use your app's login function with Descope user data
                                login({
                                    email: e.detail.user.email,
                                    name: e.detail.user.name || e.detail.user.email.split('@')[0]
                                });
                                navigate('/');
                            }}
                            onError={(err) => {
                                console.log('Error!', err);
                            }}
                        />
                    </Box>
                )}
            </Box>

            {/* Force Graph Section - Left Side */}
            <Box sx={{
                display: { xs: 'none', md: 'flex' },
                position: 'relative',
                flex: '1 1 auto',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Box sx={{
                    position: 'relative',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    maxWidth: '60vw',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <ForceGraph />
                </Box>
            </Box>
        </Box>
    )
}

export default Login
