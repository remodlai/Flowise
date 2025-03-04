import React from 'react'
import { Box, Button, IconButton } from '@mui/material'
import { IconPlus, IconEdit, IconTrash, IconFilter } from '@tabler/icons-react'

// Import reusable components
import DataTable from '@/ui-component/table/DataTable'
import UserAvatar from '@/ui-component/extended/UserAvatar'
import StatusChip from '@/ui-component/extended/StatusChip'
import OrganizationChip from '@/ui-component/extended/OrganizationChip'
import RoleChip from '@/ui-component/extended/RoleChip'

// Sample data - replace with actual data fetching
const sampleUsers = [
    { 
        id: 1, 
        name: 'John Doe', 
        email: 'john@example.com', 
        role: 'Admin', 
        status: 'Active', 
        lastLogin: '2023-05-15',
        organization: 'Acme Inc.'
    },
    { 
        id: 2, 
        name: 'Jane Smith', 
        email: 'jane@example.com', 
        role: 'User', 
        status: 'Active', 
        lastLogin: '2023-05-14',
        organization: 'Acme Inc.'
    },
    { 
        id: 3, 
        name: 'Robert Johnson', 
        email: 'robert@example.com', 
        role: 'Editor', 
        status: 'Inactive', 
        lastLogin: '2023-04-20',
        organization: 'TechCorp'
    },
    { 
        id: 4, 
        name: 'Emily Davis', 
        email: 'emily@example.com', 
        role: 'User', 
        status: 'Active', 
        lastLogin: '2023-05-10',
        organization: 'TechCorp'
    },
    { 
        id: 5, 
        name: 'Michael Wilson', 
        email: 'michael@example.com', 
        role: 'Admin', 
        status: 'Active', 
        lastLogin: '2023-05-12',
        organization: 'Remodl'
    },
    { 
        id: 6, 
        name: 'Sarah Brown', 
        email: 'sarah@example.com', 
        role: 'User', 
        status: 'Pending', 
        lastLogin: 'Never',
        organization: 'Remodl'
    },
];

const UsersAdmin = () => {
    // Define table columns
    const columns = [
        {
            field: 'user',
            label: 'User',
            render: (row) => (
                <UserAvatar
                    name={row.name}
                    subtitle={row.email}
                    color={getOrgColor(row.organization)}
                />
            )
        },
        {
            field: 'organization',
            label: 'Organization',
            render: (row) => (
                <OrganizationChip name={row.organization} />
            )
        },
        {
            field: 'role',
            label: 'Role',
            render: (row) => (
                <RoleChip role={row.role} />
            )
        },
        {
            field: 'status',
            label: 'Status',
            render: (row) => (
                <StatusChip status={row.status} />
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
                    <IconButton size="small">
                        <IconEdit size={18} stroke={1.5} />
                    </IconButton>
                    <IconButton size="small">
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

    return (
        <DataTable
            columns={columns}
            data={sampleUsers}
            title="Users & Access Management"
            description="Manage platform users, roles, and permissions"
            searchPlaceholder="Search users..."
            searchFields={['name', 'email', 'organization']}
            headerActions={headerActions}
            tableActions={tableActions}
            initialRowsPerPage={5}
            sx={{ p: { xs: 2, md: 3 } }}
        />
    );
};

export default UsersAdmin; 