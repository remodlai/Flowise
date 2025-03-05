import { useState, useEffect } from 'react'
import { Select, MenuItem, Typography, Box } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { useApplication } from '../contexts/ApplicationContext'
import { getUserApplications } from '../api/applications'

/**
 * Application chooser component for the header
 * Allows users to switch between applications they have access to
 */
const ApplicationChooser = () => {
    const { user, isAuthenticated, isPlatformAdmin } = useAuth()
    const { applicationId, applications, setApplicationId, loading } = useApplication()
    
    console.log('ApplicationChooser rendering', { user, isAuthenticated, isPlatformAdmin, applicationId })
    
    const handleAppChange = (appId) => {
        console.log('Changing application to:', appId)
        setApplicationId(appId)
        
        // Refresh the current page to apply the new application context
        window.location.reload()
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
                    value={applicationId}
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