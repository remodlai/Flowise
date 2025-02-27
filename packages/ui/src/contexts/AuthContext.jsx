import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Create auth context
const AuthContext = createContext(null)

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    // Check if user is already logged in (from localStorage)
    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setLoading(false)
    }, [])

    // Login function
    const login = (userData) => {
        // In a real app, this would make an API call to authenticate
        // For now, just store the user data in localStorage
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
    }

    // Logout function
    const logout = () => {
        setUser(null)
        localStorage.removeItem('user')
        navigate('/login')
    }

    // Auth context value
    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user
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