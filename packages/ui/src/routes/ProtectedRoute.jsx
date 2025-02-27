import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

// ==============================|| PROTECTED ROUTE ||============================== //

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth()
    const location = useLocation()

    // If still loading, don't render anything yet
    if (loading) {
        return null
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // If authenticated, render children
    return children
}

export default ProtectedRoute 