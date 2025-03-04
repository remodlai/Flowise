import React, { useState } from 'react'
import { 
    Typography, 
    Box, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    TablePagination,
    Chip,
    Avatar,
    Button,
    TextField,
    InputAdornment,
    IconButton
} from '@mui/material'
import { IconSearch, IconPlus, IconFilter, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

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
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Filter users based on search term
    const filteredUsers = sampleUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organization.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h3" gutterBottom sx={{ mb: 0.5 }}>
                        Users & Access Management
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Manage platform users, roles, and permissions
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<IconPlus size={18} />}
                    sx={{ height: 40 }}
                >
                    Add User
                </Button>
            </Box>

            <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                    placeholder="Search users..."
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <IconSearch size={20} />
                            </InputAdornment>
                        )
                    }}
                    sx={{ maxWidth: 400, mr: 2 }}
                />
                <Button 
                    variant="outlined" 
                    startIcon={<IconFilter size={18} />}
                    sx={{ height: 40 }}
                >
                    Filters
                </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Organization</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Last Login</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar 
                                                sx={{ 
                                                    width: 32, 
                                                    height: 32, 
                                                    mr: 1.5,
                                                    bgcolor: user.organization === 'Remodl' ? '#2196f3' : 
                                                             user.organization === 'Acme Inc.' ? '#4caf50' : '#ff9800'
                                                }}
                                            >
                                                {user.name.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {user.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {user.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.organization}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={user.role} 
                                            size="small"
                                            color={user.role === 'Admin' ? 'primary' : 'default'}
                                            variant={user.role === 'Admin' ? 'filled' : 'outlined'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={user.status} 
                                            size="small"
                                            color={
                                                user.status === 'Active' ? 'success' : 
                                                user.status === 'Inactive' ? 'error' : 'warning'
                                            }
                                            variant="filled"
                                            sx={{ 
                                                minWidth: 75,
                                                '& .MuiChip-label': { px: 1 }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{user.lastLogin}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    px: 2, 
                    py: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Typography variant="body2">
                        Rows per page: 
                        <select 
                            value={rowsPerPage}
                            onChange={handleChangeRowsPerPage}
                            style={{ 
                                marginLeft: 8, 
                                padding: '4px 8px', 
                                border: '1px solid #ccc',
                                borderRadius: 4
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                        </select>
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 2 }}>
                            {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredUsers.length)} of {filteredUsers.length}
                        </Typography>
                        <IconButton 
                            size="small" 
                            disabled={page === 0}
                            onClick={(e) => handleChangePage(e, page - 1)}
                        >
                            <IconChevronLeft size={18} />
                        </IconButton>
                        <IconButton 
                            size="small" 
                            disabled={page >= Math.ceil(filteredUsers.length / rowsPerPage) - 1}
                            onClick={(e) => handleChangePage(e, page + 1)}
                        >
                            <IconChevronRight size={18} />
                        </IconButton>
                    </Box>
                </Box>
            </TableContainer>
        </Box>
    )
}

export default UsersAdmin 