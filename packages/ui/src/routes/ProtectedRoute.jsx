import { Navigate, useLocation } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

// ==============================|| PROTECTED ROUTE ||============================== //

const ProtectedRoute = ({ children }) => {
    const location = useLocation()
    const { isAuthenticated, isLoading } = useAuth()
    
    // If still loading, show a loading indicator
    if (isLoading) {
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