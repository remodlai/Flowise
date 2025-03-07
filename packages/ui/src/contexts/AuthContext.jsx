import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

// Create auth context
const AuthContext = createContext(null)

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
    const [userRoles, setUserRoles] = useState([])
    const navigate = useNavigate()
    
    // Function to refresh the token
    const refreshAuthToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token')
            if (!refreshToken) {
                console.error('No refresh token available')
                throw new Error('No refresh token available')
            }
            
            console.log('Attempting to refresh token')
            
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
                    console.log('Token refreshed successfully')
                    
                    // Update tokens in localStorage
                    localStorage.setItem('access_token', data.session.access_token)
                    localStorage.setItem('refresh_token', data.session.refresh_token)
                    localStorage.setItem('token_expiry', data.session.expires_at.toString())
                    
                    // Extract JWT claims
                    extractJwtClaims(data.session.access_token)
                    
                    return true
                } else {
                    console.error('Invalid response format from refresh token endpoint', data)
                }
            } else {
                const errorData = await response.json().catch(() => ({}))
                console.error('Failed to refresh token:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                })
            }
            return false
        } catch (error) {
            console.error('Error refreshing token:', error)
            return false
        }
    }
    
    // Extract claims from JWT
    const extractJwtClaims = (token) => {
        try {
            if (!token) return
            
            const decoded = jwtDecode(token)
            console.log('Decoded JWT:', decoded)
            
            // Check if user is platform admin from JWT claim
            const isPlatformAdminFromJwt = decoded.is_platform_admin === true
            setIsPlatformAdmin(isPlatformAdminFromJwt)
            console.log('Is platform admin from JWT:', isPlatformAdminFromJwt)
            
            // Extract user roles from JWT
            const roles = decoded.user_roles || []
            setUserRoles(roles)
            console.log('User roles from JWT:', roles)
            
            // Update user metadata with JWT claims
            if (user) {
                const updatedUser = {
                    ...user,
                    userMetadata: {
                        ...user.userMetadata,
                        first_name: decoded.first_name,
                        last_name: decoded.last_name,
                        organization_name: decoded.organization_name,
                        profile_role: decoded.profile_role,
                        is_platform_admin: decoded.is_platform_admin
                    }
                }
                setUser(updatedUser)
                localStorage.setItem('user', JSON.stringify(updatedUser))
            }
        } catch (error) {
            console.error('Error decoding JWT:', error)
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
            
            // Check if tokenExpiry is in seconds (Supabase format) or milliseconds
            let expiryTime
            if (tokenExpiry.length <= 10) {
                // Seconds format (Supabase standard)
                expiryTime = new Date(parseInt(tokenExpiry) * 1000)
            } else {
                // Already in milliseconds
                expiryTime = new Date(parseInt(tokenExpiry))
            }
            
            const now = new Date()
            
            // Calculate time until token expires (in milliseconds)
            const timeUntilExpiry = expiryTime.getTime() - now.getTime()
            
            console.log('Token expiry details:', {
                expiryTime: expiryTime.toISOString(),
                now: now.toISOString(),
                timeUntilExpiry: timeUntilExpiry / 1000 / 60 + ' minutes'
            })
            
            // If token is already expired or will expire in less than 5 minutes, refresh now
            if (timeUntilExpiry < 5 * 60 * 1000) {
                console.log('Token expired or expiring soon, refreshing now')
                refreshAuthToken()
                return
            }
            
            // Schedule refresh for 5 minutes before expiry
            const refreshTime = timeUntilExpiry - (5 * 60 * 1000)
            console.log(`Scheduling token refresh in ${refreshTime / 1000 / 60} minutes`)
            
            refreshTimer = setTimeout(async () => {
                console.log('Executing scheduled token refresh')
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
                
                console.log('Checking existing session:', { storedUser, hasToken: !!storedToken })
                
                if (storedUser && storedToken) {
                    // Check if token is expired
                    const tokenExpiry = localStorage.getItem('token_expiry')
                    
                    // Handle different timestamp formats
                    let expiryTime
                    if (tokenExpiry) {
                        if (tokenExpiry.length <= 10) {
                            // Seconds format (Supabase standard)
                            expiryTime = new Date(parseInt(tokenExpiry) * 1000)
                        } else {
                            // Already in milliseconds
                            expiryTime = new Date(parseInt(tokenExpiry))
                        }
                    }
                    
                    const isTokenValid = tokenExpiry && expiryTime > new Date()
                    
                    console.log('Token validity check:', {
                        expiryTime: expiryTime?.toISOString(),
                        now: new Date().toISOString(),
                        isTokenValid
                    })
                    
                    if (isTokenValid) {
                        const parsedUser = JSON.parse(storedUser)
                        console.log('Valid token, setting user:', parsedUser)
                        
                        setUser(parsedUser)
                        setIsAuthenticated(true)
                        
                        // Extract JWT claims
                        extractJwtClaims(storedToken)
                    } else {
                        console.log('Token expired, attempting to refresh')
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
                } else {
                    console.log('No stored user or token found')
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
            setIsPlatformAdmin(false)
            setUserRoles([])
        }
        
        checkExistingSession()
    }, [])

    // Login function
    const login = (userData) => {
        if (!userData || !userData.accessToken) {
            console.error('Invalid login data')
            return
        }
        
        console.log('Login with userData:', userData)
        
        // Store user data
        const userToStore = {
            email: userData.email,
            userId: userData.userId,
            provider: userData.provider || 'email',
            userMetadata: userData.userMetadata || {}
        }
        
        // Extract JWT claims
        extractJwtClaims(userData.accessToken)
        
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
            setIsPlatformAdmin(false)
            setUserRoles([])
            
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
    
    // Check if user has a specific permission
    const hasPermission = (permission) => {
        // Platform admins have all permissions
        if (isPlatformAdmin) return true
        
        // Check if any of the user's roles has the requested permission
        // This would require an API call to check the role_permissions table
        // For now, we'll just return false
        return false
    }
    
    // Check if user has a specific permission for a resource
    const hasResourcePermission = (permission, resourceType, resourceId) => {
        // Platform admins have all permissions
        if (isPlatformAdmin) return true
        
        // Check if any of the user's roles has the requested permission for the specific resource
        const hasPermission = userRoles.some(role => 
            (role.resource_type === resourceType && role.resource_id === resourceId) ||
            (role.resource_type === null && role.resource_id === null)
        )
        
        return hasPermission
    }

    // Auth context value
    const value = {
        user,
        isLoading,
        isAuthenticated,
        isPlatformAdmin,
        userRoles,
        login,
        logout,
        getAuthToken,
        hasPermission,
        hasResourcePermission
    }

    console.log('Auth context value:', { 
        hasUser: !!user, 
        isLoading, 
        isAuthenticated, 
        isPlatformAdmin,
        userRolesCount: userRoles.length
    })

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

// Custom hook to use auth context
export const useAuth = () => {
    return useContext(AuthContext)
}

export default AuthContext 