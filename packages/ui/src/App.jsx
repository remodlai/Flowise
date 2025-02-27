import { useSelector } from 'react-redux'

import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline, StyledEngineProvider } from '@mui/material'

// routing
import Routes from '@/routes'

// defaultTheme
import themes from '@/themes'

// project imports
import NavigationScroll from '@/layout/NavigationScroll'
import { AuthProvider as CustomAuthProvider } from '@/contexts/AuthContext'

// Descope import
import { AuthProvider as DescopeAuthProvider } from '@descope/react-sdk'

// ==============================|| APP ||============================== //

const App = () => {
    const customization = useSelector((state) => state.customization)

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={themes(customization)}>
                <CssBaseline />
                <DescopeAuthProvider projectId="P2qN8t4mIqaKVihBD18pVybYVukP">
                    <CustomAuthProvider>
                        <NavigationScroll>
                            <Routes />
                        </NavigationScroll>
                    </CustomAuthProvider>
                </DescopeAuthProvider>
            </ThemeProvider>
        </StyledEngineProvider>
    )
}

export default App
