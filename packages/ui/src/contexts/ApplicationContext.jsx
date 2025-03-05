import React, { createContext, useState, useEffect, useContext } from 'react'
import { getUserApplications } from '../api/applications'
import { useAuth } from './AuthContext'

// Create the context
export const ApplicationContext = createContext({
    applicationId: '',
    applications: [],
    setApplicationId: () => {},
    loading: false
})

// Create a provider component
export const ApplicationProvider = ({ children }) => {
    const { user, isAuthenticated, isPlatformAdmin } = useAuth()
    const [applicationId, setApplicationId] = useState(localStorage.getItem('selectedApplicationId') || '')
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(false)

    // Fetch applications when the user is authenticated
    useEffect(() => {
        const fetchApplications = async () => {
            if (!isAuthenticated || !user) {
                console.log('User not authenticated or no user object')
                return
            }
            
            setLoading(true)
            try {
                console.log('Fetching applications...', {
                    userId: user.userId,
                    isPlatformAdmin: isPlatformAdmin,
                    userMetadata: user.userMetadata,
                    role: user.userMetadata?.role
                })
                
                // Call the API to get applications the user has access to
                const response = await getUserApplications()
                console.log('Applications response:', response)
                
                // Handle the response correctly
                let apps = []
                if (response && Array.isArray(response)) {
                    // Direct array response
                    apps = response
                } else if (response && Array.isArray(response.data)) {
                    // Response wrapped in data property
                    apps = response.data
                }
                
                console.log('Processed apps:', apps)
                setApplications(apps)
                
                // If no application is selected, select the appropriate default
                if (!applicationId) {
                    if (isPlatformAdmin) {
                        // For platform admins, default to 'global'
                        updateApplicationId('global')
                    } else if (apps.length > 0) {
                        // For regular users, use the first available app
                        updateApplicationId(apps[0].id)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch applications:', error)
                setApplications([]) // Ensure applications is always an array
            } finally {
                setLoading(false)
            }
        }
        
        fetchApplications()
    }, [user, isAuthenticated, isPlatformAdmin, applicationId])
    
    // Update the application ID
    const updateApplicationId = (newApplicationId) => {
        console.log('Updating application ID to:', newApplicationId)
        setApplicationId(newApplicationId)
        localStorage.setItem('selectedApplicationId', newApplicationId)
    }
    
    // Context value
    const value = {
        applicationId,
        applications,
        setApplicationId: updateApplicationId,
        loading
    }
    
    return (
        <ApplicationContext.Provider value={value}>
            {children}
        </ApplicationContext.Provider>
    )
}

// Custom hook to use the application context
export const useApplication = () => {
    return useContext(ApplicationContext)
} 