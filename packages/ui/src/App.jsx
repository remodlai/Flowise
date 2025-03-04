import { useSelector } from 'react-redux'
import { useEffect } from 'react'

import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, StyledEngineProvider } from '@mui/material'

// routing
import Routes from '@/routes'

// defaultTheme
import themes from '@/themes'

// project imports
import NavigationScroll from '@/layout/NavigationScroll'
import { AuthProvider } from '@/contexts/AuthContext'

// ==============================|| APP ||============================== //

const App = () => {
    const customization = useSelector((state) => state.customization)
    
    // Apply dark mode class to body and html elements
    useEffect(() => {
        if (customization.isDarkMode) {
            document.body.classList.add('dark-mode')
            document.documentElement.setAttribute('data-theme', 'dark')
        } else {
            document.body.classList.remove('dark-mode')
            document.documentElement.setAttribute('data-theme', 'light')
        }
    }, [customization.isDarkMode])

    // Create the theme based on customization
    const theme = themes(customization)
    
    // Set the palette mode for MUI
    theme.palette.mode = customization.isDarkMode ? 'dark' : 'light'

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AuthProvider>
                    <NavigationScroll>
                        <Routes />
                    </NavigationScroll>
                </AuthProvider>
            </ThemeProvider>
        </StyledEngineProvider>
    )
}

export default App
