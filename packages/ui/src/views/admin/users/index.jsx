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
    IconButton,
    useTheme,
    alpha
} from '@mui/material'
import { IconSearch, IconPlus, IconFilter, IconChevronLeft, IconChevronRight, IconDotsVertical, IconEdit, IconTrash } from '@tabler/icons-react'

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

const UsersAdmin = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

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
        <Box sx={{ 
            p: { xs: 2, md: 3 },
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                gap: 2
            }}>
                <Box>
                    <Typography 
                        variant="h4" 
                        gutterBottom 
                        sx={{ 
                            mb: 0.5, 
                            fontWeight: 600,
                            color: isDark ? '#fff' : 'inherit'
                        }}
                    >
                        Users & Access Management
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'
                        }}
                    >
                        Manage platform users, roles, and permissions
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<IconPlus size={18} />}
                    sx={{ 
                        height: 42,
                        px: 2,
                        background: isDark ? 
                            'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)' : 
                            theme.palette.primary.main,
                        '&:hover': {
                            background: isDark ? 
                                'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)' : 
                                theme.palette.primary.dark
                        }
                    }}
                >
                    Add User
                </Button>
            </Box>

            <Box sx={{ 
                display: 'flex', 
                mb: 2,
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                gap: 2
            }}>
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
                                <IconSearch size={20} stroke={1.5} color={isDark ? 'rgba(255, 255, 255, 0.7)' : undefined} />
                            </InputAdornment>
                        )
                    }}
                    sx={{ 
                        maxWidth: 400,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: isDark ? 
                                alpha(theme.palette.background.paper, 0.8) : 
                                theme.palette.background.paper
                        }
                    }}
                />
                <Button 
                    variant="outlined" 
                    startIcon={<IconFilter size={18} stroke={1.5} />}
                    sx={{ 
                        height: 40,
                        borderRadius: '8px',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : undefined,
                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : undefined,
                        '&:hover': {
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : undefined,
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : undefined
                        }
                    }}
                >
                    Filters
                </Button>
            </Box>

            <TableContainer 
                component={Paper} 
                variant="outlined" 
                sx={{ 
                    boxShadow: 'none',
                    borderRadius: '12px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    backgroundColor: isDark ? theme.palette.background.paper : '#fff',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell 
                                sx={{ 
                                    fontWeight: 600,
                                    color: isDark ? 'rgba(255, 255, 255, 0.9)' : undefined,
                                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : undefined
                                }}
                            >
                                User
                            </TableCell>
                            <TableCell 
                                sx={{ 
                                    fontWeight: 600,
                                    color: isDark ? 'rgba(255, 255, 255, 0.9)' : undefined,
                                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : undefined
                                }}
                            >
                                Organization
                            </TableCell>
                            <TableCell 
                                sx={{ 
                                    fontWeight: 600,
                                    color: isDark ? 'rgba(255, 255, 255, 0.9)' : undefined,
                                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : undefined
                                }}
                            >
                                Role
                            </TableCell>
                            <TableCell 
                                sx={{ 
                                    fontWeight: 600,
                                    color: isDark ? 'rgba(255, 255, 255, 0.9)' : undefined,
                                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : undefined
                                }}
                            >
                                Status
                            </TableCell>
                            <TableCell 
                                sx={{ 
                                    fontWeight: 600,
                                    color: isDark ? 'rgba(255, 255, 255, 0.9)' : undefined,
                                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : undefined
                                }}
                            >
                                Last Login
                            </TableCell>
                            <TableCell 
                                align="right"
                                sx={{ 
                                    fontWeight: 600,
                                    color: isDark ? 'rgba(255, 255, 255, 0.9)' : undefined,
                                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : undefined
                                }}
                            >
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((user) => {
                                const orgColor = getOrgColor(user.organization);
                                
                                return (
                                    <TableRow 
                                        key={user.id} 
                                        hover
                                        sx={{ 
                                            '&:hover': {
                                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : undefined
                                            },
                                            '&:last-child td': {
                                                borderBottom: 0
                                            }
                                        }}
                                    >
                                        <TableCell 
                                            sx={{ 
                                                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : undefined
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar 
                                                    sx={{ 
                                                        width: 36, 
                                                        height: 36, 
                                                        mr: 1.5,
                                                        bgcolor: orgColor,
                                                        fontWeight: 600,
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    {user.name.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            fontWeight: 600,
                                                            color: isDark ? '#fff' : 'inherit'
                                                        }}
                                                    >
                                                        {user.name}
                                                    </Typography>
                                                    <Typography 
                                                        variant="caption" 
                                                        sx={{ 
                                                            color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary'
                                                        }}
                                                    >
                                                        {user.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell 
                                            sx={{ 
                                                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : undefined
                                            }}
                                        >
                                            <Chip
                                                label={user.organization}
                                                size="small"
                                                sx={{
                                                    backgroundColor: isDark ? alpha(orgColor, 0.15) : alpha(orgColor, 0.1),
                                                    color: isDark ? alpha(orgColor, 0.9) : orgColor,
                                                    fontWeight: 500,
                                                    borderRadius: '6px',
                                                    border: `1px solid ${isDark ? alpha(orgColor, 0.3) : alpha(orgColor, 0.2)}`
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell 
                                            sx={{ 
                                                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : undefined
                                            }}
                                        >
                                            <Chip 
                                                label={user.role} 
                                                size="small"
                                                color={user.role === 'Admin' ? 'primary' : 'default'}
                                                variant={user.role === 'Admin' ? 'filled' : 'outlined'}
                                                sx={{ 
                                                    borderRadius: '6px',
                                                    fontWeight: 500,
                                                    backgroundColor: user.role === 'Admin' ? 
                                                        (isDark ? 'rgba(33, 150, 243, 0.15)' : undefined) : 
                                                        (isDark ? 'rgba(255, 255, 255, 0.08)' : undefined),
                                                    borderColor: user.role === 'Admin' ? 
                                                        (isDark ? 'rgba(33, 150, 243, 0.5)' : undefined) : 
                                                        (isDark ? 'rgba(255, 255, 255, 0.15)' : undefined),
                                                    color: user.role === 'Admin' ? 
                                                        (isDark ? '#90caf9' : undefined) : 
                                                        (isDark ? 'rgba(255, 255, 255, 0.7)' : undefined)
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell 
                                            sx={{ 
                                                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : undefined
                                            }}
                                        >
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
                                                    borderRadius: '6px',
                                                    fontWeight: 500,
                                                    '& .MuiChip-label': { px: 1 },
                                                    backgroundColor: user.status === 'Active' ? 
                                                        (isDark ? 'rgba(76, 175, 80, 0.15)' : undefined) : 
                                                        user.status === 'Inactive' ? 
                                                            (isDark ? 'rgba(244, 67, 54, 0.15)' : undefined) : 
                                                            (isDark ? 'rgba(255, 152, 0, 0.15)' : undefined),
                                                    color: user.status === 'Active' ? 
                                                        (isDark ? '#81c784' : undefined) : 
                                                        user.status === 'Inactive' ? 
                                                            (isDark ? '#e57373' : undefined) : 
                                                            (isDark ? '#ffb74d' : undefined)
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell 
                                            sx={{ 
                                                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : undefined,
                                                color: isDark ? 'rgba(255, 255, 255, 0.7)' : undefined
                                            }}
                                        >
                                            {user.lastLogin}
                                        </TableCell>
                                        <TableCell 
                                            align="right"
                                            sx={{ 
                                                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : undefined
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <IconButton 
                                                    size="small"
                                                    sx={{ 
                                                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : undefined,
                                                        '&:hover': {
                                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : undefined
                                                        }
                                                    }}
                                                >
                                                    <IconEdit size={18} stroke={1.5} />
                                                </IconButton>
                                                <IconButton 
                                                    size="small"
                                                    sx={{ 
                                                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : undefined,
                                                        '&:hover': {
                                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : undefined
                                                        }
                                                    }}
                                                >
                                                    <IconTrash size={18} stroke={1.5} />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    px: 3, 
                    py: 1.5,
                    mt: 'auto',
                    borderTop: '1px solid',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'divider'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography 
                            variant="body2"
                            sx={{ 
                                color: isDark ? 'rgba(255, 255, 255, 0.7)' : undefined
                            }}
                        >
                            Rows per page:
                        </Typography>
                        <select 
                            value={rowsPerPage}
                            onChange={handleChangeRowsPerPage}
                            style={{ 
                                marginLeft: 8, 
                                padding: '4px 8px', 
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)',
                                borderRadius: 6,
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                                color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'inherit'
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                        </select>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                mr: 2,
                                color: isDark ? 'rgba(255, 255, 255, 0.7)' : undefined
                            }}
                        >
                            {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredUsers.length)} of {filteredUsers.length}
                        </Typography>
                        <IconButton 
                            size="small" 
                            onClick={() => handleChangePage(null, page - 1)}
                            disabled={page === 0}
                            sx={{ 
                                color: isDark ? 'rgba(255, 255, 255, 0.7)' : undefined,
                                '&.Mui-disabled': {
                                    color: isDark ? 'rgba(255, 255, 255, 0.3)' : undefined
                                },
                                '&:hover': {
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : undefined
                                }
                            }}
                        >
                            <IconChevronLeft size={20} stroke={1.5} />
                        </IconButton>
                        <IconButton 
                            size="small" 
                            onClick={() => handleChangePage(null, page + 1)}
                            disabled={page >= Math.ceil(filteredUsers.length / rowsPerPage) - 1}
                            sx={{ 
                                color: isDark ? 'rgba(255, 255, 255, 0.7)' : undefined,
                                '&.Mui-disabled': {
                                    color: isDark ? 'rgba(255, 255, 255, 0.3)' : undefined
                                },
                                '&:hover': {
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : undefined
                                }
                            }}
                        >
                            <IconChevronRight size={20} stroke={1.5} />
                        </IconButton>
                    </Box>
                </Box>
            </TableContainer>
        </Box>
    )
}

export default UsersAdmin 