import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Grid,
    CircularProgress,
    IconButton,
    Breadcrumbs,
    Link,
    Divider,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip
} from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { useSnackbar } from 'notistack'

// Import API functions
import { getUserById, updateUser, getUserCustomRoles, getUserOrganizations } from '@/api/users'
import { removeOrganizationMember } from '@/api/organizations'
import { getAllApplications } from '@/api/applications'

// Import components
import UserAvatar from '@/ui-component/extended/UserAvatar'
import StatusChip from '@/ui-component/extended/StatusChip'
import RoleChip from '@/ui-component/extended/RoleChip'
import OrganizationChip from '@/ui-component/extended/OrganizationChip'

const UserHeader = ({ user, onBack }) => {
    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={onBack} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link color="inherit" href="/admin/users">
                        Users
                    </Link>
                    <Typography color="textPrimary">{user?.email || 'User Details'}</Typography>
                </Breadcrumbs>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <UserAvatar 
                    name={user?.name || user?.email || 'Unknown User'} 
                    size="large" 
                    sx={{ mr: 2 }}
                />
                <Box>
                    <Typography variant="h4">
                        {user?.name || user?.email || 'Unknown User'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {user?.email}
                    </Typography>
                </Box>
            </Box>
        </Box>
    )
}

const UserDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { enqueueSnackbar } = useSnackbar()
    const [user, setUser] = useState(null)
    const [userRoles, setUserRoles] = useState([])
    const [userOrganizations, setUserOrganizations] = useState([])
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [tabValue, setTabValue] = useState(0)
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
    })

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true)
                const response = await getUserById(id)
                console.log('User data:', response.data)
                
                if (response.data && response.data.user) {
                    setUser(response.data.user)
                    
                    // Initialize form data from user metadata
                    const metadata = response.data.user.user_metadata || {}
                    setFormData({
                        first_name: metadata.first_name || '',
                        last_name: metadata.last_name || '',
                        email: response.data.user.email || '',
                        phone: metadata.phone || ''
                    })
                }
                
                // Fetch user roles
                try {
                    const rolesResponse = await getUserCustomRoles(id)
                    console.log('User roles:', rolesResponse.data)
                    if (rolesResponse.data && rolesResponse.data.roles) {
                        setUserRoles(rolesResponse.data.roles)
                    }
                } catch (roleError) {
                    console.error('Error fetching user roles:', roleError)
                }
                
                // Fetch user organizations
                try {
                    const orgsResponse = await getUserOrganizations(id)
                    console.log('User organizations:', orgsResponse.data)
                    if (orgsResponse.data && orgsResponse.data.organizations) {
                        setUserOrganizations(orgsResponse.data.organizations)
                    }
                } catch (orgsError) {
                    console.error('Error fetching user organizations:', orgsError)
                }
                
                // Fetch applications
                try {
                    const appsResponse = await getAllApplications()
                    console.log('Applications:', appsResponse.data)
                    if (appsResponse.data && appsResponse.data.applications) {
                        setApplications(appsResponse.data.applications)
                    }
                } catch (appsError) {
                    console.error('Error fetching applications:', appsError)
                }
                
            } catch (error) {
                console.error('Error fetching user:', error)
                enqueueSnackbar('Failed to load user details', { variant: 'error' })
            } finally {
                setLoading(false)
            }
        }
        
        if (id) {
            fetchUserData()
        }
    }, [id, enqueueSnackbar])

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })
    }

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setSaving(true)
            
            // Prepare user data for update
            const userData = {
                user_metadata: {
                    ...user.user_metadata,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone
                }
            }
            
            // Update email if changed
            if (formData.email !== user.email) {
                userData.email = formData.email
            }
            
            const response = await updateUser(id, userData)
            console.log('Update response:', response)
            
            enqueueSnackbar('User updated successfully', { variant: 'success' })
            
            // Update local user state
            setUser({
                ...user,
                ...response.data.user
            })
            
        } catch (error) {
            console.error('Error updating user:', error)
            enqueueSnackbar('Failed to update user', { variant: 'error' })
        } finally {
            setSaving(false)
        }
    }

    // Handle back button
    const handleBack = () => {
        navigate('/admin/users')
    }

    // Handle removing user from organization
    const handleRemoveFromOrganization = async (organizationId, organizationName) => {
        if (window.confirm(`Remove user from ${organizationName}?`)) {
            try {
                await removeOrganizationMember(organizationId, id)
                enqueueSnackbar(`User removed from ${organizationName}`, { variant: 'success' })
                
                // Update the organizations list
                setUserOrganizations(userOrganizations.filter(org => org.id !== organizationId))
            } catch (error) {
                console.error('Error removing user from organization:', error)
                enqueueSnackbar('Failed to remove user from organization', { variant: 'error' })
            }
        }
    }

    // Get application name by ID
    const getApplicationName = (applicationId) => {
        if (!applicationId) return 'None'
        const app = applications.find(app => app.id === applicationId)
        return app ? app.name : applicationId
    }

    // Show loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3 }}>
            <UserHeader user={user} onBack={handleBack} />
            
            <Box sx={{ mb: 3 }}>
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    aria-label="user tabs"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Profile" />
                    <Tab label="Roles & Permissions" />
                    <Tab label="Organizations" />
                    <Tab label="Activity" />
                </Tabs>
            </Box>
            
            {/* Profile Tab */}
            {tabValue === 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            User Profile
                        </Typography>
                        <Divider sx={{ mb: 3 }} />
                        
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="First Name"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Last Name"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            type="submit"
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            )}
            
            {/* Roles Tab */}
            {tabValue === 1 && (
                <Card>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            Roles & Permissions
                        </Typography>
                        <Divider sx={{ mb: 3 }} />
                        
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Assigned Roles
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {userRoles.length > 0 ? (
                                    userRoles.map((role) => (
                                        <RoleChip key={role.id} label={role.name} />
                                    ))
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        No roles assigned
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="outlined" color="primary">
                                Manage Roles
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}
            
            {/* Organizations Tab */}
            {tabValue === 2 && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5">
                                Organizations
                            </Typography>
                            <Button 
                                variant="contained" 
                                color="primary"
                                onClick={() => navigate(`/admin/organizations?addUser=${id}`)}
                            >
                                Add to Organization
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 3 }} />
                        
                        {userOrganizations.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                                <Typography variant="body1" color="textSecondary">
                                    This user is not a member of any organizations.
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Organization</TableCell>
                                            <TableCell>Role</TableCell>
                                            <TableCell>Application</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {userOrganizations.map((organization) => (
                                            <TableRow key={organization.id}>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <OrganizationChip label={organization.name} />
                                                        {organization.description && (
                                                            <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                                                                {organization.description}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <RoleChip label={organization.role} />
                                                </TableCell>
                                                <TableCell>
                                                    {getApplicationName(organization.application_id)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                        <Button 
                                                            size="small" 
                                                            onClick={() => navigate(`/admin/organizations/${organization.id}`)}
                                                            sx={{ mr: 1 }}
                                                        >
                                                            View
                                                        </Button>
                                                        <Button 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => handleRemoveFromOrganization(organization.id, organization.name)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            )}
            
            {/* Activity Tab */}
            {tabValue === 3 && (
                <Card>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            Activity Log
                        </Typography>
                        <Divider sx={{ mb: 3 }} />
                        
                        <Typography variant="body1">
                            Activity tracking coming soon.
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Box>
    )
}

export default UserDetail 