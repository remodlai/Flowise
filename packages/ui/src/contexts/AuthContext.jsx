import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession, useUser, useDescope } from '@descope/react-sdk'

// Create auth context
const AuthContext = createContext(null)

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [appUser, setAppUser] = useState(null)
    const [appLoading, setAppLoading] = useState(true)
    const navigate = useNavigate()
    
    // Get Descope authentication data
    const { isAuthenticated, isSessionLoading } = useSession()
    const { user: descopeUser, isUserLoading } = useUser()
    const { logout: descopeLogout } = useDescope()

    // Sync Descope user with our app's user state
    useEffect(() => {
        if (!isSessionLoading && !isUserLoading) {
            if (isAuthenticated && descopeUser) {
                // Create our app's user object from Descope user data
                const userData = {
                    email: descopeUser.email,
                    name: descopeUser.name || descopeUser.email?.split('@')[0] || 'User',
                    // Add any other user properties you need
                }
                setAppUser(userData)
                // Optionally store in localStorage for persistence
                localStorage.setItem('user', JSON.stringify(userData))
            } else {
                setAppUser(null)
                localStorage.removeItem('user')
            }
            setAppLoading(false)
        }
    }, [isAuthenticated, descopeUser, isSessionLoading, isUserLoading])

    // Login function - now just stores additional app-specific user data
    // The actual authentication is handled by Descope
    const login = (userData) => {
        setAppUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
    }

    // Logout function - uses Descope's logout
    const logout = () => {
        // Clear our app's user state
        setAppUser(null)
        localStorage.removeItem('user')
        
        // Call Descope's logout
        descopeLogout()
        
        // Navigate to login page
        navigate('/login')
    }

    // Auth context value
    const value = {
        user: appUser,
        loading: appLoading || isSessionLoading || isUserLoading,
        login,
        logout,
        isAuthenticated: isAuthenticated && !!appUser
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext 