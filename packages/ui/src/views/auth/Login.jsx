import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '@/ui-component/extended/Logo'
// material-ui
import colors from '@/assets/scss/_themes-vars.module.scss'
import { useTheme } from '@mui/material/styles'
import {
    Box,
    Button,
    Checkbox,
    Divider,
    FormControl,
    FormControlLabel,
    FormHelperText,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    OutlinedInput,
    Stack,
    Typography
} from '@mui/material'
import palette from '@/themes/palette'
// project imports
import AnimateButton from '@/ui-component/button/AnimateButton'
import MainCard from '@/ui-component/cards/MainCard'
import { useAuth } from '@/contexts/AuthContext'

// assets
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

// ===========================|| LOGIN ||=========================== //

const Login = () => {
    const theme = useTheme()
    const navigate = useNavigate()
    const { login } = useAuth()
    
    const [checked, setChecked] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    
    const [errors, setErrors] = useState({
        email: '',
        password: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })
        
        // Clear error when user types
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            })
        }
    }

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword)
    }

    const handleMouseDownPassword = (event) => {
        event.preventDefault()
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        
        // Simple validation
        const newErrors = {}
        if (!formData.email) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid'
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required'
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }
        
        // For now, just use dummy authentication
        // In a real implementation, this would call an authentication API
        login({
            email: formData.email,
            name: formData.email.split('@')[0]
        })
        
        navigate('/')
    }

    return (
        <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: '100vh', backgroundColor: colors.darkPaper }}>
            <Grid item xs={11} sm={7} md={5} lg={4}>
                <MainCard
                    sx={{
                        p: 4,
                        boxShadow: '0 0px 0px 0 rgba(0,0,0,0.1)'
                    }}
                >
                    <Grid container spacing={2} direction="column" alignItems="center">
                        <Grid item xs={12}>
                            <Logo width={180} height="auto" forceDarkMode={true} objectFit="contain" />
                            <Typography variant="h2" align="center" gutterBottom>
                                Sign in to the platform
                            </Typography>
                            <Typography variant="body2" align="center" color="textSecondary">
                                Enter your credentials to continue
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sx={{ width: '100%' }}>
                            <form onSubmit={handleSubmit}>
                                <FormControl fullWidth sx={{ mb: 2 }} error={Boolean(errors.email)}>
                                    <InputLabel htmlFor="email-login">Email Address</InputLabel>
                                    <OutlinedInput
                                        id="email-login"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        label="Email Address"
                                    />
                                    {errors.email && <FormHelperText error>{errors.email}</FormHelperText>}
                                </FormControl>

                                <FormControl fullWidth sx={{ mb: 2 }} error={Boolean(errors.password)}>
                                    <InputLabel htmlFor="password-login">Password</InputLabel>
                                    <OutlinedInput
                                        id="password-login"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        endAdornment={
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={handleClickShowPassword}
                                                    onMouseDown={handleMouseDownPassword}
                                                    edge="end"
                                                    size="large"
                                                >
                                                    {showPassword ? <Visibility /> : <VisibilityOff />}
                                                </IconButton>
                                            </InputAdornment>
                                        }
                                        label="Password"
                                    />
                                    {errors.password && <FormHelperText error>{errors.password}</FormHelperText>}
                                </FormControl>

                                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={checked}
                                                onChange={(e) => setChecked(e.target.checked)}
                                                name="checked"
                                                color="primary"
                                            />
                                        }
                                        label="Remember me"
                                    />
                                    <Typography
                                        variant="subtitle1"
                                        color="primary"
                                        sx={{ textDecoration: 'none', cursor: 'pointer' }}
                                    >
                                        Forgot Password?
                                    </Typography>
                                </Stack>

                                <AnimateButton>
                                    <Button
                                        disableElevation
                                        fullWidth
                                        size="large"
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                    >
                                        Sign In
                                    </Button>
                                </AnimateButton>
                                
                                <Divider sx={{ my: 3 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        OR
                                    </Typography>
                                </Divider>
                                
                                <AnimateButton>
                                    <Button
                                        fullWidth
                                        size="large"
                                        variant="outlined"
                                        sx={{ 
                                            borderColor: theme.palette.grey[300],
                                            color: theme.palette.text.primary,
                                            '&:hover': {
                                                borderColor: theme.palette.primary.main
                                            }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <img src="/assets/images/google-login-white.png" alt="Google" width="20px" style={{ marginRight: '8px' }} />
                                            Sign in with Google
                                        </Box>
                                    </Button>
                                </AnimateButton>
                            </form>
                        </Grid>
                    </Grid>
                </MainCard>
            </Grid>
        </Grid>
    )
}

export default Login 