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
    const { user, isAuthenticated, isPlatformAdmin, userRoles } = useAuth()
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
                    userRoles: userRoles,
                    userMetadata: user.userMetadata
                })
                
                // Call the API to get applications the user has access to
                const response = await getUserApplications()
                console.log('Applications response (raw):', response)
                
                // Handle the response correctly
                let apps = []
                if (response && Array.isArray(response)) {
                    // Direct array response
                    apps = response
                    console.log('Direct array response detected')
                } else if (response && Array.isArray(response.data)) {
                    // Response wrapped in data property
                    apps = response.data
                    console.log('Data property array response detected')
                } else {
                    console.log('Unexpected response format:', response)
                }
                
                console.log('Processed apps:', apps)
                
                // Check if Platform Sandbox exists
                const hasSandbox = apps.some(app => app.name === 'Platform Sandbox')
                console.log('Has Platform Sandbox in response:', hasSandbox)
                if (hasSandbox) {
                    console.log('Platform Sandbox details:', apps.find(app => app.name === 'Platform Sandbox'))
                }
                
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
                } else {
                    // Check if the selected application is still accessible
                    const isAccessible = isPlatformAdmin || 
                        apps.some(app => app.id === applicationId) ||
                        applicationId === 'global';
                    
                    if (!isAccessible && apps.length > 0) {
                        // If not accessible, select the first available app
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
    }, [user, isAuthenticated, isPlatformAdmin, userRoles])
    
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