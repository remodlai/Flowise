import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Create auth context
const AuthContext = createContext(null)

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const navigate = useNavigate()
    
    // Check for existing session on mount
    useEffect(() => {
        const checkExistingSession = () => {
            try {
                // Check for user data in localStorage
                const storedUser = localStorage.getItem('user')
                const storedToken = localStorage.getItem('access_token')
                
                if (storedUser && storedToken) {
                    // Check if token is expired
                    const tokenExpiry = localStorage.getItem('token_expiry')
                    const isTokenValid = tokenExpiry && new Date(parseInt(tokenExpiry) * 1000) > new Date()
                    
                    if (isTokenValid) {
                        setUser(JSON.parse(storedUser))
                        setIsAuthenticated(true)
                    } else {
                        // Token expired, clear storage
                        localStorage.removeItem('user')
                        localStorage.removeItem('access_token')
                        localStorage.removeItem('token_expiry')
                    }
                }
            } catch (error) {
                console.error('Error checking authentication:', error)
            } finally {
                setIsLoading(false)
            }
        }
        
        checkExistingSession()
    }, [])

    // Login function
    const login = (userData) => {
        if (!userData || !userData.accessToken) {
            console.error('Invalid login data')
            return
        }
        
        // Store user data
        const userToStore = {
            email: userData.email,
            userId: userData.userId,
            provider: userData.provider || 'email',
            userMetadata: userData.userMetadata || {}
        }
        
        // Save to state and localStorage
        setUser(userToStore)
        setIsAuthenticated(true)
        
        // Store in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userToStore))
        localStorage.setItem('access_token', userData.accessToken)
        
        if (userData.expiresAt) {
            localStorage.setItem('token_expiry', userData.expiresAt.toString())
        }
    }

    // Logout function
    const logout = async () => {
        try {
            // Call logout API endpoint
            await fetch('/api/v1/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            })
        } catch (error) {
            console.error('Error during logout:', error)
        } finally {
            // Clear user data regardless of API success
            setUser(null)
            setIsAuthenticated(false)
            
            // Clear localStorage
            localStorage.removeItem('user')
            localStorage.removeItem('access_token')
            localStorage.removeItem('token_expiry')
            
            // Navigate to login page
            navigate('/login')
        }
    }

    // Get auth token for API requests
    const getAuthToken = () => {
        return localStorage.getItem('access_token')
    }

    // Auth context value
    const value = {
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        getAuthToken
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