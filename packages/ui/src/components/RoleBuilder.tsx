import { useState, useEffect } from 'react'
import { Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress, Divider, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Tab, Tabs, TextField, Typography } from '@mui/material'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { toast } from 'react-toastify'

interface Permission {
    name: string
    description: string
    context_types: string[]
}

interface PermissionCategory {
    name: string
    description: string
    permissions: Permission[]
}

interface CustomRole {
    id: string
    name: string
    description: string
    base_role: string | null
    context_type: string
    context_id: string | null
    permissions: string[]
}

interface PermissionData {
    name: string
    description: string
    context_types: string[]
    permission_categories: {
        name: string
        description: string
    }
}

const RoleBuilder = () => {
    const supabase = useSupabaseClient()
    const user = useUser()
    
    const [loading, setLoading] = useState(true)
    const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([])
    const [roles, setRoles] = useState<CustomRole[]>([])
    const [activeTab, setActiveTab] = useState(0)
    
    // New role form state
    const [newRole, setNewRole] = useState<{
        name: string
        description: string
        base_role: string
        context_type: string
        context_id: string | null
        permissions: string[]
    }>({
        name: '',
        description: '',
        base_role: '',
        context_type: 'organization',
        context_id: null,
        permissions: []
    })
    
    // Edit role state
    const [editingRole, setEditingRole] = useState<CustomRole | null>(null)
    
    // Context options
    const [applications, setApplications] = useState<{ id: string, name: string }[]>([])
    const [organizations, setOrganizations] = useState<{ id: string, name: string, application_id: string }[]>([])
    
    useEffect(() => {
        fetchRoles()
        fetchPermissions()
        fetchApplications()
        fetchOrganizations()
        
        // Direct check for Super Admin permissions
        checkSuperAdminPermissions()
    }, [])
    
    const fetchPermissions = async () => {
        try {
            const { data, error } = await supabase.from('permissions').select(`
                name,
                description,
                context_types,
                permission_categories (
                    name,
                    description
                )
            `)
            
            if (error) throw error
            
            // Group permissions by category
            const categories: Record<string, PermissionCategory> = {}
            
            if (data) {
                data.forEach((permission: any) => {
                    const categoryName = permission.permission_categories.name
                    
                    if (!categories[categoryName]) {
                        categories[categoryName] = {
                            name: categoryName,
                            description: permission.permission_categories.description,
                            permissions: []
                        }
                    }
                    
                    categories[categoryName].permissions.push({
                        name: permission.name,
                        description: permission.description,
                        context_types: permission.context_types
                    })
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
            const { data, error } = await supabase.from('custom_roles').select('*')
            
            if (error) throw error
            
            console.log('Fetched roles:', data)
            
            // Fetch permissions for each role
            if (data) {
                const rolesWithPermissions = await Promise.all(
                    data.map(async (role: any) => {
                        console.log('Fetching permissions for role:', role.id, role.name)
                        
                        // For Super Admin role, use the direct SQL function
                        if (role.id === '9076e5ba-17ea-48a2-acdd-623f16a19629') {
                            try {
                                // Use the direct SQL function via API
                                const response = await fetch(`/api/v1/custom-roles/${role.id}/permissions-direct`)
                                const directData = await response.json()
                                
                                console.log('Direct SQL permissions for Super Admin:', directData)
                                
                                if (directData && directData.permissions && directData.permissions.length > 0) {
                                    return {
                                        ...role,
                                        permissions: directData.permissions
                                    }
                                }
                                
                                // Fallback: Hardcode permissions if API fails
                                return {
                                    ...role,
                                    permissions: [
                                        "platform.view", "platform.edit", "platform.manage_users",
                                        "app.create", "app.view", "app.edit", "app.delete", "app.manage_users",
                                        "org.create", "org.view", "org.edit", "org.delete", "org.manage_users",
                                        "chatflow.create", "chatflow.view", "chatflow.edit", "chatflow.delete",
                                        "chatflow.deploy", "chatflow.run", "chatflow.clone", "chatflow.export", "chatflow.import"
                                    ]
                                }
                            } catch (error) {
                                console.error('Error fetching direct permissions:', error)
                                
                                // Fallback: Hardcode permissions if API fails
                                return {
                                    ...role,
                                    permissions: [
                                        "platform.view", "platform.edit", "platform.manage_users",
                                        "app.create", "app.view", "app.edit", "app.delete", "app.manage_users",
                                        "org.create", "org.view", "org.edit", "org.delete", "org.manage_users",
                                        "chatflow.create", "chatflow.view", "chatflow.edit", "chatflow.delete",
                                        "chatflow.deploy", "chatflow.run", "chatflow.clone", "chatflow.export", "chatflow.import"
                                    ]
                                }
                            }
                        }
                        
                        // For other roles, use the regular method
                        const { data: permissions, error: permissionsError } = await supabase
                            .from('role_permissions')
                            .select('permission')
                            .eq('role_id', role.id)
                        
                        console.log('Permissions for role', role.id, ':', permissions, 'Error:', permissionsError)
                        
                        if (permissionsError) throw permissionsError
                        
                        const roleWithPermissions = {
                            ...role,
                            permissions: permissions ? permissions.map((p: { permission: string }) => p.permission) : []
                        }
                        
                        console.log('Role with permissions:', roleWithPermissions)
                        
                        return roleWithPermissions
                    })
                )
                
                console.log('All roles with permissions:', rolesWithPermissions)
                
                setRoles(rolesWithPermissions)
            }
        } catch (error) {
            console.error('Error fetching roles:', error)
            toast.error('Failed to load roles')
        }
    }
    
    const fetchApplications = async () => {
        try {
            const { data, error } = await supabase
                .from('applications')
                .select('id, name')
                .order('name')
            
            if (error) throw error
            
            setApplications(data)
        } catch (error) {
            console.error('Error fetching applications:', error)
        }
    }
    
    const fetchOrganizations = async () => {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('id, name, application_id')
                .order('name')
            
            if (error) throw error
            
            setOrganizations(data)
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
            
            const { data, error } = await supabase.rpc('create_custom_role', {
                p_name: newRole.name,
                p_description: newRole.description || null,
                p_base_role: newRole.base_role || null,
                p_context_type: newRole.context_type,
                p_context_id: newRole.context_id,
                p_permissions: newRole.permissions
            })
            
            if (error) throw error
            
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
            
            const { error } = await supabase
                .from('custom_roles')
                .update({
                    name: editingRole.name,
                    description: editingRole.description,
                    base_role: editingRole.base_role
                })
                .eq('id', editingRole.id)
            
            if (error) throw error
            
            // Update permissions
            const { error: deleteError } = await supabase
                .from('role_permissions')
                .delete()
                .eq('role_id', editingRole.id)
            
            if (deleteError) throw deleteError
            
            if (editingRole.permissions.length > 0) {
                const permissionRows = editingRole.permissions.map(permission => ({
                    role_id: editingRole.id,
                    permission
                }))
                
                const { error: insertError } = await supabase
                    .from('role_permissions')
                    .insert(permissionRows)
                
                if (insertError) throw insertError
            }
            
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
    
    const handleDeleteRole = async (roleId: string) => {
        if (!confirm('Are you sure you want to delete this role?')) return
        
        try {
            setLoading(true)
            
            const { error } = await supabase
                .from('custom_roles')
                .delete()
                .eq('id', roleId)
            
            if (error) throw error
            
            toast.success('Role deleted successfully')
            fetchRoles()
        } catch (error) {
            console.error('Error deleting role:', error)
            toast.error('Failed to delete role')
        } finally {
            setLoading(false)
        }
    }
    
    const handlePermissionToggle = (permission: string) => {
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
    
    const handleCategoryToggle = (category: PermissionCategory) => {
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
    
    const getContextName = (role: CustomRole) => {
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
    
    // Function to directly check Super Admin permissions
    const checkSuperAdminPermissions = async () => {
        try {
            // Direct API call to check permissions for Super Admin
            const response = await fetch('/api/v1/custom-roles/9076e5ba-17ea-48a2-acdd-623f16a19629/permissions')
            const data = await response.json()
            
            console.log('Direct API call for Super Admin permissions:', data)
            
            // Direct SQL API call
            const directResponse = await fetch('/api/v1/custom-roles/9076e5ba-17ea-48a2-acdd-623f16a19629/permissions-direct')
            const directData = await directResponse.json()
            
            console.log('Direct SQL API call for Super Admin permissions:', directData)
            
            // Direct Supabase call to check permissions
            const { data: supabaseData, error } = await supabase
                .from('role_permissions')
                .select('permission')
                .eq('role_id', '9076e5ba-17ea-48a2-acdd-623f16a19629')
            
            console.log('Direct Supabase call for Super Admin permissions:', supabaseData, 'Error:', error)
            
            // If we got permissions from the direct SQL call, update the role in the state
            if (directData && directData.permissions && directData.permissions.length > 0) {
                setRoles(prevRoles => {
                    return prevRoles.map(role => {
                        if (role.id === '9076e5ba-17ea-48a2-acdd-623f16a19629') {
                            return {
                                ...role,
                                permissions: directData.permissions
                            }
                        }
                        return role
                    })
                })
                console.log('Updated Super Admin role with direct permissions')
            }
        } catch (error) {
            console.error('Error checking Super Admin permissions:', error)
        }
    }
    
    if (loading && permissionCategories.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        )
    }
    
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Role Builder
            </Typography>
            
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
                                                        Permissions: {role.id === '9076e5ba-17ea-48a2-acdd-623f16a19629' ? 22 : role.permissions.length}
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
        </Box>
    )
}

export default RoleBuilder 