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
    
    // Function to refresh the token
    const refreshAuthToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token')
            if (!refreshToken) {
                throw new Error('No refresh token available')
            }
            
            const response = await fetch(`${window.location.origin}/api/v1/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            })
            
            if (response.ok) {
                const data = await response.json()
                if (data.session && data.session.access_token) {
                    // Update tokens in localStorage
                    localStorage.setItem('access_token', data.session.access_token)
                    localStorage.setItem('refresh_token', data.session.refresh_token)
                    localStorage.setItem('token_expiry', data.session.expires_at.toString())
                    return true
                }
            }
            return false
        } catch (error) {
            console.error('Error refreshing token:', error)
            return false
        }
    }
    
    // Setup token refresh timer
    useEffect(() => {
        let refreshTimer = null
        
        const setupRefreshTimer = () => {
            // Clear any existing timer
            if (refreshTimer) clearTimeout(refreshTimer)
            
            // Only setup timer if authenticated
            if (!isAuthenticated) return
            
            const tokenExpiry = localStorage.getItem('token_expiry')
            if (!tokenExpiry) return
            
            const expiryTime = new Date(parseInt(tokenExpiry) * 1000)
            const now = new Date()
            
            // Calculate time until token expires (in milliseconds)
            const timeUntilExpiry = expiryTime.getTime() - now.getTime()
            
            // If token is already expired or will expire in less than 5 minutes, refresh now
            if (timeUntilExpiry < 5 * 60 * 1000) {
                refreshAuthToken()
                return
            }
            
            // Schedule refresh for 5 minutes before expiry
            const refreshTime = timeUntilExpiry - (5 * 60 * 1000)
            
            refreshTimer = setTimeout(async () => {
                const success = await refreshAuthToken()
                if (success) {
                    // Setup the next refresh timer
                    setupRefreshTimer()
                }
            }, refreshTime)
        }
        
        // Setup initial timer
        setupRefreshTimer()
        
        // Cleanup timer on unmount
        return () => {
            if (refreshTimer) clearTimeout(refreshTimer)
        }
    }, [isAuthenticated])
    
    // Check for existing session on mount
    useEffect(() => {
        const checkExistingSession = async () => {
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
                        // Token expired, try to refresh it if we have a refresh token
                        const refreshToken = localStorage.getItem('refresh_token')
                        if (refreshToken) {
                            const success = await refreshAuthToken()
                            if (success) {
                                // Set user as authenticated
                                setUser(JSON.parse(storedUser))
                                setIsAuthenticated(true)
                            } else {
                                // Failed to refresh token, clear storage
                                clearAuthData()
                            }
                        } else {
                            // No refresh token, clear storage
                            clearAuthData()
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking authentication:', error)
                clearAuthData()
            } finally {
                setIsLoading(false)
            }
        }
        
        const clearAuthData = () => {
            localStorage.removeItem('user')
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('token_expiry')
            setUser(null)
            setIsAuthenticated(false)
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
        
        // Store refresh token if available
        if (userData.refreshToken) {
            localStorage.setItem('refresh_token', userData.refreshToken)
        }
        
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
            localStorage.removeItem('refresh_token')
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