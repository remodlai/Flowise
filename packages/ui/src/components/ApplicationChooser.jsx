import { useState, useEffect } from 'react'
import { Select, MenuItem, Typography, Box } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { getUserApplications } from '../api/applications'

/**
 * Application chooser component for the header
 * Allows users to switch between applications they have access to
 */
const ApplicationChooser = () => {
    const { user, isAuthenticated, isPlatformAdmin } = useAuth()
    const [applications, setApplications] = useState([])
    const [selectedApp, setSelectedApp] = useState(localStorage.getItem('selectedApplicationId') || '')
    const [loading, setLoading] = useState(false)
    
    console.log('ApplicationChooser rendering', { user, isAuthenticated, isPlatformAdmin })
    
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
                
                // If no application is selected, select the first one or 'global' for platform admins
                if (!selectedApp) {
                    if (apps.length > 0) {
                        handleAppChange(apps[0].id)
                    } else if (isPlatformAdmin) {
                        // For platform admins with no apps, use 'global'
                        handleAppChange('global')
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
    }, [user, isAuthenticated, isPlatformAdmin])
    
    const handleAppChange = (appId) => {
        console.log('Changing application to:', appId)
        setSelectedApp(appId)
        localStorage.setItem('selectedApplicationId', appId)
        
        // Update API client to include the application ID in requests
        updateApplicationContext(appId)
        
        // Refresh the current page to apply the new application context
        window.location.reload()
    }
    
    // Update the API client to include the application ID in requests
    const updateApplicationContext = (applicationId) => {
        // Store the application ID for use in API requests
        localStorage.setItem('selectedApplicationId', applicationId)
    }
    
    // Always render the component for debugging, even if there are no applications
    // if (!isAuthenticated || applications.length === 0) return null
    
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>
                Application: {applications.length === 0 && !isPlatformAdmin ? '(None available)' : ''}
            </Typography>
            {applications.length > 0 || isPlatformAdmin ? (
                <Select
                    value={selectedApp}
                    onChange={(e) => handleAppChange(e.target.value)}
                    size="small"
                    sx={{ 
                        minWidth: 150,
                        '& .MuiSelect-select': {
                            py: 0.5
                        }
                    }}
                    disabled={loading}
                >
                    {isPlatformAdmin && (
                        <MenuItem value="global">
                            <strong>Global (All Applications)</strong>
                        </MenuItem>
                    )}
                    
                    {applications.map((app) => (
                        <MenuItem key={app.id} value={app.id}>
                            {app.name}
                        </MenuItem>
                    ))}
                </Select>
            ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {loading ? 'Loading...' : 'No applications available'}
                </Typography>
            )}
        </Box>
    )
}

export default ApplicationChooser 