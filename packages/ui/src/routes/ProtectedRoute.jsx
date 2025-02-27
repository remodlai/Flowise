import { Navigate, useLocation } from 'react-router-dom'
import { useSession, useUser } from '@descope/react-sdk'
import { CircularProgress, Box } from '@mui/material'

// ==============================|| PROTECTED ROUTE ||============================== //

const ProtectedRoute = ({ children }) => {
    const location = useLocation()
    const { isAuthenticated, isSessionLoading } = useSession()
    const { user, isUserLoading } = useUser()
    
    // If still loading, show a loading indicator
    if (isSessionLoading || isUserLoading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                <CircularProgress />
            </Box>
        )
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // If authenticated, render children
    return children
}

export default ProtectedRoute 