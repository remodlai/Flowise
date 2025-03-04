import React, { useState, useEffect } from 'react'
import { Box, Button, IconButton, CircularProgress } from '@mui/material'
import { IconPlus, IconEdit, IconTrash, IconFilter } from '@tabler/icons-react'
import { useSnackbar } from 'notistack'
import { useNavigate } from 'react-router-dom'

// Import reusable components
import DataTable from '@/ui-component/table/DataTable'
import UserAvatar from '@/ui-component/extended/UserAvatar'
import StatusChip from '@/ui-component/extended/StatusChip'
import OrganizationChip from '@/ui-component/extended/OrganizationChip'
import RoleChip from '@/ui-component/extended/RoleChip'

// Import API
import { getAllUsers, deleteUser } from '@/api/users'

const UsersAdmin = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers()
    }, [])

    // Function to fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await getAllUsers()
            setUsers(response.data.users || [])
        } catch (error) {
            console.error('Error fetching users:', error)
            enqueueSnackbar('Failed to load users', { variant: 'error' })
        } finally {
            setLoading(false)
        }
    }

    // Function to handle user deletion
    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteUser(userId)
                enqueueSnackbar('User deleted successfully', { variant: 'success' })
                fetchUsers() // Refresh the list
            } catch (error) {
                console.error('Error deleting user:', error)
                enqueueSnackbar('Failed to delete user', { variant: 'error' })
            }
        }
    }

    // Function to handle user edit
    const handleEditUser = (userId) => {
        navigate(`/admin/users/${userId}`)
    }

    // Function to handle user creation
    const handleCreateUser = () => {
        navigate('/admin/users/new')
    }

    // Define table columns
    const columns = [
        {
            field: 'user',
            label: 'User',
            render: (row) => (
                <UserAvatar
                    name={row.name || 'Unknown User'}
                    subtitle={row.email}
                    color={getOrgColor(row.organization)}
                />
            )
        },
        {
            field: 'organization',
            label: 'Organization',
            render: (row) => (
                <OrganizationChip name={row.organization || 'No Organization'} />
            )
        },
        {
            field: 'role',
            label: 'Role',
            render: (row) => (
                <RoleChip role={row.role || 'No Role'} />
            )
        },
        {
            field: 'status',
            label: 'Status',
            render: (row) => (
                <StatusChip status={row.status || 'Unknown'} />
            )
        },
        {
            field: 'lastLogin',
            label: 'Last Login'
        },
        {
            field: 'actions',
            label: 'Actions',
            align: 'right',
            render: (row) => (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton 
                        size="small"
                        onClick={() => handleEditUser(row.id)}
                    >
                        <IconEdit size={18} stroke={1.5} />
                    </IconButton>
                    <IconButton 
                        size="small"
                        onClick={() => handleDeleteUser(row.id)}
                    >
                        <IconTrash size={18} stroke={1.5} />
                    </IconButton>
                </Box>
            )
        }
    ];

    // Header actions
    const headerActions = (
        <Button 
            variant="contained" 
            startIcon={<IconPlus size={18} />}
            onClick={handleCreateUser}
        >
            Add User
        </Button>
    );

    // Table actions
    const tableActions = (
        <Button 
            variant="outlined" 
            startIcon={<IconFilter size={18} stroke={1.5} />}
        >
            Filters
        </Button>
    );

    // Get organization color
    const getOrgColor = (org) => {
        switch(org) {
            case 'Remodl':
                return '#2196f3';
            case 'Acme Inc.':
                return '#4caf50';
            case 'TechCorp':
                return '#ff9800';
            default:
                return '#9c27b0';
        }
    };

    // Show loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <DataTable
            columns={columns}
            data={users}
            title="Users & Access Management"
            description="Manage platform users, roles, and permissions"
            searchPlaceholder="Search users..."
            searchFields={['name', 'email', 'organization', 'role']}
            headerActions={headerActions}
            tableActions={tableActions}
            initialRowsPerPage={10}
            sx={{ p: { xs: 2, md: 3 } }}
        />
    );
};

export default UsersAdmin; 