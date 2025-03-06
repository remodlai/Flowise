import { useState, useEffect } from 'react'
import { Select, MenuItem, Typography, Box } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { useApplication } from '../contexts/ApplicationContext'
import { getUserApplications } from '../api/applications'

/**
 * Application chooser component for the header
 * Allows users to switch between applications they have access to
 * For platform admins, shows Global and ALL applications
 * Global is for high-level operations like moving or copying between applications
 */
const ApplicationChooser = () => {
    const { user, isAuthenticated, isPlatformAdmin, userRoles } = useAuth()
    const { applicationId, applications, setApplicationId, loading } = useApplication()
    
    // Debug: Log applications whenever they change
    useEffect(() => {
        console.log('ApplicationChooser - Applications:', applications)
        console.log('ApplicationChooser - User Roles:', userRoles)
        
        // Check if Platform Sandbox exists
        const hasSandbox = applications.some(app => app.name === 'Platform Sandbox')
        console.log('Has Platform Sandbox:', hasSandbox)
        if (hasSandbox) {
            console.log('Platform Sandbox details:', applications.find(app => app.name === 'Platform Sandbox'))
        }
    }, [applications, userRoles])
    
    console.log('ApplicationChooser rendering', { user, isAuthenticated, isPlatformAdmin, applicationId, userRolesCount: userRoles.length })
    
    // Filter applications based on user roles
    const filteredApplications = applications.filter(app => {
        // Platform admins can see all applications
        if (isPlatformAdmin) return true;
        
        // Check if user has a role for this application
        return userRoles.some(role => 
            role.resource_type === 'application' && 
            role.resource_id === app.id
        );
    });
    
    const handleAppChange = (appId) => {
        console.log('Changing application to:', appId)
        setApplicationId(appId)
        
        // Refresh the current page to apply the new application context
        window.location.reload()
    }
    
    // Get the name of the current application for the debug message
    const currentAppName = applicationId === 'global' 
        ? 'Global' 
        : applications.find(app => app.id === applicationId)?.name || 'Unknown';
    
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>
                Application: {filteredApplications.length === 0 && !isPlatformAdmin ? '(None available)' : ''}
            </Typography>
            {filteredApplications.length > 0 || isPlatformAdmin ? (
                <>
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
                                <strong>Global (Admin Operations)</strong>
                            </MenuItem>
                        )}
                        
                        {filteredApplications.map((app) => (
                            <MenuItem key={app.id} value={app.id}>
                                {app.name}
                            </MenuItem>
                        ))}
                    </Select>
                    
                    {/* Debug message showing current active application context */}
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            ml: 1, 
                            color: 'text.secondary',
                            fontSize: '0.7rem',
                            opacity: 0.7
                        }}
                    >
                        [Active: {currentAppName}]
                    </Typography>
                </>
            ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {loading ? 'Loading...' : 'No applications available'}
                </Typography>
            )}
        </Box>
    )
}

export default ApplicationChooser 