import React, { useState, useEffect } from 'react'
import { Grid, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress, Divider, FormControl, InputLabel, MenuItem, Paper, Select, Tab, Tabs, TextField, Typography } from '@mui/material'
import MainCard from '@/ui-component/cards/MainCard'
import { useTheme } from '@mui/material/styles'
import { toast } from 'react-toastify'

// API
import * as rolesApi from '@/api/roles'

// Types
const RoleBuilderView = () => {
    const theme = useTheme()
    
    const [loading, setLoading] = useState(true)
    const [permissionCategories, setPermissionCategories] = useState([])
    const [roles, setRoles] = useState([])
    const [activeTab, setActiveTab] = useState(0)
    
    // New role form state
    const [newRole, setNewRole] = useState({
        name: '',
        description: '',
        base_role: '',
        context_type: 'organization',
        context_id: null,
        permissions: []
    })
    
    // Edit role state
    const [editingRole, setEditingRole] = useState(null)
    
    // Context options
    const [applications, setApplications] = useState([])
    const [organizations, setOrganizations] = useState([])
    
    useEffect(() => {
        fetchPermissions()
        fetchRoles()
        fetchApplications()
        fetchOrganizations()
    }, [])
    
    const fetchPermissions = async () => {
        try {
            const [categoriesResponse, permissionsResponse] = await Promise.all([
                rolesApi.getPermissionCategories(),
                rolesApi.getAllPermissions()
            ])
            
            // Group permissions by category
            const categories = {}
            
            if (permissionsResponse.data?.categories) {
                permissionsResponse.data.categories.forEach(category => {
                    categories[category.name] = category
                })
            }
            
            setPermissionCategories(Object.values(categories))
        } catch (error) {
            console.error('Error fetching permissions:', error)
            toast.error('Failed to load permissions')
        } finally {
            setLoading(false)
        }
    }
    
    const fetchRoles = async () => {
        try {
            const response = await rolesApi.getAllRoles()
            
            if (response.data?.roles) {
                setRoles(response.data.roles)
            }
        } catch (error) {
            console.error('Error fetching roles:', error)
            toast.error('Failed to load roles')
        }
    }
    
    const fetchApplications = async () => {
        try {
            // Use the client API
            const response = await fetch('/api/v1/applications')
            const data = await response.json()
            
            setApplications(data.applications || [])
        } catch (error) {
            console.error('Error fetching applications:', error)
        }
    }
    
    const fetchOrganizations = async () => {
        try {
            // Use the client API
            const response = await fetch('/api/v1/organizations')
            const data = await response.json()
            
            setOrganizations(data.organizations || [])
        } catch (error) {
            console.error('Error fetching organizations:', error)
        }
    }
    
    const handleCreateRole = async () => {
        try {
            setLoading(true)
            
            if (!newRole.name) {
                toast.error('Role name is required')
                return
            }
            
            if (newRole.context_type !== 'platform' && !newRole.context_id) {
                toast.error('Please select a context')
                return
            }
            
            const response = await rolesApi.createRole(newRole)
            
            toast.success('Role created successfully')
            
            // Reset form and refresh roles
            setNewRole({
                name: '',
                description: '',
                base_role: '',
                context_type: 'organization',
                context_id: null,
                permissions: []
            })
            
            fetchRoles()
        } catch (error) {
            console.error('Error creating role:', error)
            toast.error('Failed to create role')
        } finally {
            setLoading(false)
        }
    }
    
    const handleUpdateRole = async () => {
        if (!editingRole) return
        
        try {
            setLoading(true)
            
            const roleData = {
                name: editingRole.name,
                description: editingRole.description,
                base_role: editingRole.base_role,
                permissions: editingRole.permissions
            }
            
            await rolesApi.updateRole(editingRole.id, roleData)
            
            toast.success('Role updated successfully')
            setEditingRole(null)
            fetchRoles()
        } catch (error) {
            console.error('Error updating role:', error)
            toast.error('Failed to update role')
        } finally {
            setLoading(false)
        }
    }
    
    const handleDeleteRole = async (roleId) => {
        if (!confirm('Are you sure you want to delete this role?')) return
        
        try {
            setLoading(true)
            
            await rolesApi.deleteRole(roleId)
            
            toast.success('Role deleted successfully')
            fetchRoles()
        } catch (error) {
            console.error('Error deleting role:', error)
            toast.error('Failed to delete role')
        } finally {
            setLoading(false)
        }
    }
    
    const handlePermissionToggle = (permission) => {
        if (editingRole) {
            // Editing existing role
            const permissions = [...editingRole.permissions]
            
            if (permissions.includes(permission)) {
                setEditingRole({
                    ...editingRole,
                    permissions: permissions.filter(p => p !== permission)
                })
            } else {
                setEditingRole({
                    ...editingRole,
                    permissions: [...permissions, permission]
                })
            }
        } else {
            // Creating new role
            const permissions = [...newRole.permissions]
            
            if (permissions.includes(permission)) {
                setNewRole({
                    ...newRole,
                    permissions: permissions.filter(p => p !== permission)
                })
            } else {
                setNewRole({
                    ...newRole,
                    permissions: [...permissions, permission]
                })
            }
        }
    }
    
    const handleCategoryToggle = (category) => {
        const currentPermissions = editingRole ? [...editingRole.permissions] : [...newRole.permissions]
        const categoryPermissions = category.permissions.map(p => p.name)
        
        // Check if all permissions in this category are already selected
        const allSelected = categoryPermissions.every(p => currentPermissions.includes(p))
        
        if (allSelected) {
            // Remove all permissions from this category
            const newPermissions = currentPermissions.filter(p => !categoryPermissions.includes(p))
            
            if (editingRole) {
                setEditingRole({
                    ...editingRole,
                    permissions: newPermissions
                })
            } else {
                setNewRole({
                    ...newRole,
                    permissions: newPermissions
                })
            }
        } else {
            // Add all permissions from this category
            const newPermissions = [...new Set([...currentPermissions, ...categoryPermissions])]
            
            if (editingRole) {
                setEditingRole({
                    ...editingRole,
                    permissions: newPermissions
                })
            } else {
                setNewRole({
                    ...newRole,
                    permissions: newPermissions
                })
            }
        }
    }
    
    const filteredPermissionCategories = permissionCategories.filter(category => {
        // If editing a role or creating a new one, filter by context type
        const contextType = editingRole ? editingRole.context_type : newRole.context_type
        
        // Keep categories that have at least one permission applicable to this context
        return category.permissions.some(permission => 
            permission.context_types.includes(contextType)
        )
    })
    
    const getContextName = (role) => {
        if (role.context_type === 'platform') return 'Platform'
        
        if (role.context_type === 'application') {
            const app = applications.find(a => a.id === role.context_id)
            return app ? `App: ${app.name}` : 'Unknown App'
        }
        
        if (role.context_type === 'organization') {
            const org = organizations.find(o => o.id === role.context_id)
            return org ? `Org: ${org.name}` : 'Unknown Org'
        }
        
        return 'Unknown'
    }
    
    if (loading && permissionCategories.length === 0) {
        return (
            <MainCard title="Role Builder">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        )
    }
    
    return (
        <MainCard title="Role Builder">
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Create Role" />
                <Tab label="Manage Roles" />
            </Tabs>
            
            {activeTab === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Role Details
                                </Typography>
                                
                                <TextField
                                    label="Role Name"
                                    fullWidth
                                    margin="normal"
                                    value={newRole.name}
                                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                />
                                
                                <TextField
                                    label="Description"
                                    fullWidth
                                    margin="normal"
                                    multiline
                                    rows={2}
                                    value={newRole.description}
                                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                />
                                
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Context Type</InputLabel>
                                    <Select
                                        value={newRole.context_type}
                                        label="Context Type"
                                        onChange={(e) => setNewRole({ 
                                            ...newRole, 
                                            context_type: e.target.value,
                                            context_id: null // Reset context ID when type changes
                                        })}
                                    >
                                        <MenuItem value="platform">Platform</MenuItem>
                                        <MenuItem value="application">Application</MenuItem>
                                        <MenuItem value="organization">Organization</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                {newRole.context_type === 'application' && (
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel>Application</InputLabel>
                                        <Select
                                            value={newRole.context_id || ''}
                                            label="Application"
                                            onChange={(e) => setNewRole({ ...newRole, context_id: e.target.value })}
                                        >
                                            {applications.map(app => (
                                                <MenuItem key={app.id} value={app.id}>{app.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                                
                                {newRole.context_type === 'organization' && (
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel>Organization</InputLabel>
                                        <Select
                                            value={newRole.context_id || ''}
                                            label="Organization"
                                            onChange={(e) => setNewRole({ ...newRole, context_id: e.target.value })}
                                        >
                                            {organizations.map(org => (
                                                <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                                
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    onClick={handleCreateRole}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Create Role'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Permissions
                                </Typography>
                                
                                <Typography variant="body2" color="textSecondary" paragraph>
                                    Select the permissions for this role. Only permissions applicable to the selected context type are shown.
                                </Typography>
                                
                                {filteredPermissionCategories.map((category) => {
                                    // Filter permissions by context type
                                    const applicablePermissions = category.permissions.filter(
                                        permission => permission.context_types.includes(newRole.context_type)
                                    )
                                    
                                    if (applicablePermissions.length === 0) return null
                                    
                                    // Check if all permissions in this category are selected
                                    const allSelected = applicablePermissions.every(
                                        permission => newRole.permissions.includes(permission.name)
                                    )
                                    
                                    return (
                                        <Box key={category.name} sx={{ mb: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Checkbox
                                                    checked={allSelected}
                                                    indeterminate={
                                                        applicablePermissions.some(p => newRole.permissions.includes(p.name)) &&
                                                        !allSelected
                                                    }
                                                    onChange={() => handleCategoryToggle(category)}
                                                />
                                                <Typography variant="subtitle1">
                                                    {category.name}
                                                </Typography>
                                            </Box>
                                            
                                            <Box sx={{ pl: 4 }}>
                                                {applicablePermissions.map((permission) => (
                                                    <Box key={permission.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Checkbox
                                                            checked={newRole.permissions.includes(permission.name)}
                                                            onChange={() => handlePermissionToggle(permission.name)}
                                                        />
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {permission.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                {permission.description}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                            
                                            <Divider sx={{ my: 2 }} />
                                        </Box>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
            
            {activeTab === 1 && (
                <Grid container spacing={3}>
                    {editingRole ? (
                        // Edit role view
                        <>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Edit Role
                                        </Typography>
                                        
                                        <TextField
                                            label="Role Name"
                                            fullWidth
                                            margin="normal"
                                            value={editingRole.name}
                                            onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                                        />
                                        
                                        <TextField
                                            label="Description"
                                            fullWidth
                                            margin="normal"
                                            multiline
                                            rows={2}
                                            value={editingRole.description}
                                            onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                                        />
                                        
                                        <Typography variant="body2" sx={{ mt: 2 }}>
                                            Context: {getContextName(editingRole)}
                                        </Typography>
                                        
                                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={handleUpdateRole}
                                                disabled={loading}
                                            >
                                                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                                            </Button>
                                            
                                            <Button
                                                variant="outlined"
                                                onClick={() => setEditingRole(null)}
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            
                            <Grid item xs={12} md={8}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Permissions
                                        </Typography>
                                        
                                        {filteredPermissionCategories.map((category) => {
                                            // Filter permissions by context type
                                            const applicablePermissions = category.permissions.filter(
                                                permission => permission.context_types.includes(editingRole.context_type)
                                            )
                                            
                                            if (applicablePermissions.length === 0) return null
                                            
                                            // Check if all permissions in this category are selected
                                            const allSelected = applicablePermissions.every(
                                                permission => editingRole.permissions.includes(permission.name)
                                            )
                                            
                                            return (
                                                <Box key={category.name} sx={{ mb: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Checkbox
                                                            checked={allSelected}
                                                            indeterminate={
                                                                applicablePermissions.some(p => editingRole.permissions.includes(p.name)) &&
                                                                !allSelected
                                                            }
                                                            onChange={() => handleCategoryToggle(category)}
                                                        />
                                                        <Typography variant="subtitle1">
                                                            {category.name}
                                                        </Typography>
                                                    </Box>
                                                    
                                                    <Box sx={{ pl: 4 }}>
                                                        {applicablePermissions.map((permission) => (
                                                            <Box key={permission.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                <Checkbox
                                                                    checked={editingRole.permissions.includes(permission.name)}
                                                                    onChange={() => handlePermissionToggle(permission.name)}
                                                                />
                                                                <Box>
                                                                    <Typography variant="body2">
                                                                        {permission.name}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="textSecondary">
                                                                        {permission.description}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                    
                                                    <Divider sx={{ my: 2 }} />
                                                </Box>
                                            )
                                        })}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </>
                    ) : (
                        // Role list view
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Custom Roles
                            </Typography>
                            
                            {roles.length === 0 ? (
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body1">
                                        No custom roles found. Create your first role using the "Create Role" tab.
                                    </Typography>
                                </Paper>
                            ) : (
                                <Grid container spacing={2}>
                                    {roles.map((role) => (
                                        <Grid item xs={12} sm={6} md={4} key={role.id}>
                                            <Card>
                                                <CardContent>
                                                    <Typography variant="h6" gutterBottom>
                                                        {role.name}
                                                    </Typography>
                                                    
                                                    <Typography variant="body2" color="textSecondary" paragraph>
                                                        {role.description || 'No description'}
                                                    </Typography>
                                                    
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        Context: {getContextName(role)}
                                                    </Typography>
                                                    
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        Permissions: {role.permissions.length}
                                                    </Typography>
                                                    
                                                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={() => setEditingRole(role)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        
                                                        <Button
                                                            variant="outlined"
                                                            color="error"
                                                            size="small"
                                                            onClick={() => handleDeleteRole(role.id)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Grid>
                    )}
                </Grid>
            )}
        </MainCard>
    )
}

export default RoleBuilderView 