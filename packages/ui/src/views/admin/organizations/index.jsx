import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    Box, 
    Button, 
    IconButton, 
    Menu, 
    MenuItem, 
    ListItemIcon, 
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Typography
} from '@mui/material'
import { 
    IconPlus, 
    IconEdit, 
    IconTrash, 
    IconFilter, 
    IconDotsVertical, 
    IconUsers, 
    IconSettings,
    IconBuildingSkyscraper,
    IconMail,
    IconPhone,
    IconWorld,
    IconEye
} from '@tabler/icons-react'

// Import reusable components
import DataTable from '@/ui-component/table/DataTable'
import StatusChip from '@/ui-component/extended/StatusChip'
import OrganizationChip from '@/ui-component/extended/OrganizationChip'

// Sample data - replace with actual data fetching
const sampleOrganizations = [
    { 
        id: 1, 
        name: 'Acme Inc.', 
        domain: 'acme.com',
        email: 'contact@acme.com',
        phone: '+1 (555) 123-4567',
        status: 'Active', 
        memberCount: 24,
        plan: 'Enterprise',
        createdAt: '2023-01-15'
    },
    { 
        id: 2, 
        name: 'TechCorp', 
        domain: 'techcorp.io',
        email: 'info@techcorp.io',
        phone: '+1 (555) 987-6543',
        status: 'Active', 
        memberCount: 18,
        plan: 'Pro',
        createdAt: '2023-02-20'
    },
    { 
        id: 3, 
        name: 'Globex Solutions', 
        domain: 'globex-solutions.com',
        email: 'hello@globex-solutions.com',
        phone: '+1 (555) 456-7890',
        status: 'Inactive', 
        memberCount: 5,
        plan: 'Basic',
        createdAt: '2023-03-10'
    },
    { 
        id: 4, 
        name: 'Initech', 
        domain: 'initech.net',
        email: 'support@initech.net',
        phone: '+1 (555) 234-5678',
        status: 'Active', 
        memberCount: 12,
        plan: 'Pro',
        createdAt: '2023-04-05'
    },
    { 
        id: 5, 
        name: 'Umbrella Corp', 
        domain: 'umbrellacorp.org',
        email: 'contact@umbrellacorp.org',
        phone: '+1 (555) 876-5432',
        status: 'Pending', 
        memberCount: 3,
        plan: 'Enterprise',
        createdAt: '2023-05-18'
    }
];

const OrganizationsAdmin = () => {
    const navigate = useNavigate();
    // State for action menu
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedOrg, setSelectedOrg] = useState(null);
    
    // State for add/edit dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        email: '',
        phone: '',
        status: 'Active',
        plan: 'Basic'
    });
    
    // Handle menu open
    const handleMenuOpen = (event, org) => {
        setAnchorEl(event.currentTarget);
        setSelectedOrg(org);
    };
    
    // Handle menu close
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    
    // Handle dialog open for adding
    const handleAddOrg = () => {
        setDialogMode('add');
        setFormData({
            name: '',
            domain: '',
            email: '',
            phone: '',
            status: 'Active',
            plan: 'Basic'
        });
        setDialogOpen(true);
    };
    
    // Handle dialog open for editing
    const handleEditOrg = () => {
        setDialogMode('edit');
        setFormData({
            name: selectedOrg.name,
            domain: selectedOrg.domain,
            email: selectedOrg.email,
            phone: selectedOrg.phone,
            status: selectedOrg.status,
            plan: selectedOrg.plan
        });
        setDialogOpen(true);
        handleMenuClose();
    };
    
    // Handle dialog close
    const handleDialogClose = () => {
        setDialogOpen(false);
    };
    
    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    
    // Handle form submit
    const handleSubmit = () => {
        // Here you would typically save the data to your backend
        console.log('Form submitted:', formData);
        
        // Close the dialog
        handleDialogClose();
    };
    
    // Handle row click to navigate to detail page
    const handleRowClick = (row) => {
        navigate(`/admin/organizations/${row.id}`);
    };
    
    // Define table columns
    const columns = [
        {
            field: 'name',
            label: 'Organization',
            render: (row) => (
                <Box 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        cursor: 'pointer'
                    }}
                    onClick={() => handleRowClick(row)}
                >
                    <IconBuildingSkyscraper 
                        size={24} 
                        stroke={1.5} 
                        style={{ 
                            marginRight: '12px',
                            color: row.status === 'Active' ? '#4caf50' : 
                                   row.status === 'Inactive' ? '#f44336' : '#ff9800'
                        }} 
                    />
                    <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {row.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {row.domain}
                        </Typography>
                    </Box>
                </Box>
            )
        },
        {
            field: 'contact',
            label: 'Contact',
            render: (row) => (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <IconMail size={16} stroke={1.5} style={{ marginRight: '8px', opacity: 0.7 }} />
                        <Typography variant="body2">{row.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconPhone size={16} stroke={1.5} style={{ marginRight: '8px', opacity: 0.7 }} />
                        <Typography variant="body2">{row.phone}</Typography>
                    </Box>
                </Box>
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
            field: 'memberCount',
            label: 'Members',
            render: (row) => (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconUsers size={18} stroke={1.5} style={{ marginRight: '8px', opacity: 0.7 }} />
                    <Typography variant="body2">{row.memberCount}</Typography>
                </Box>
            )
        },
        {
            field: 'plan',
            label: 'Plan',
            render: (row) => (
                <OrganizationChip 
                    name={row.plan} 
                    variant="outlined"
                    color={
                        row.plan === 'Enterprise' ? '#9c27b0' :
                        row.plan === 'Pro' ? '#2196f3' :
                        '#4caf50'
                    }
                />
            )
        },
        {
            field: 'createdAt',
            label: 'Created'
        },
        {
            field: 'actions',
            label: 'Actions',
            align: 'right',
            render: (row) => (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton 
                        size="small"
                        onClick={() => handleRowClick(row)}
                        sx={{ mr: 1 }}
                    >
                        <IconEye size={18} stroke={1.5} />
                    </IconButton>
                    <IconButton 
                        size="small" 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, row);
                        }}
                    >
                        <IconDotsVertical size={18} stroke={1.5} />
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
            onClick={handleAddOrg}
        >
            Add Organization
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

    return (
        <>
            <DataTable
                columns={columns}
                data={sampleOrganizations}
                title="Organizations Management"
                description="Manage organizations, their members, and settings"
                searchPlaceholder="Search organizations..."
                searchFields={['name', 'domain', 'email', 'plan']}
                headerActions={headerActions}
                tableActions={tableActions}
                initialRowsPerPage={5}
                sx={{ p: { xs: 2, md: 3 } }}
                onRowClick={handleRowClick}
            />
            
            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    elevation: 3,
                    sx: { minWidth: 180, borderRadius: '8px' }
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <MenuItem onClick={() => {
                    handleMenuClose();
                    navigate(`/admin/organizations/${selectedOrg?.id}`);
                }}>
                    <ListItemIcon>
                        <IconEye size={18} stroke={1.5} />
                    </ListItemIcon>
                    <ListItemText>View Details</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleEditOrg}>
                    <ListItemIcon>
                        <IconEdit size={18} stroke={1.5} />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon>
                        <IconUsers size={18} stroke={1.5} />
                    </ListItemIcon>
                    <ListItemText>Manage Members</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon>
                        <IconSettings size={18} stroke={1.5} />
                    </ListItemIcon>
                    <ListItemText>Settings</ListItemText>
                </MenuItem>
                <MenuItem 
                    onClick={handleMenuClose}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon sx={{ color: 'error.main' }}>
                        <IconTrash size={18} stroke={1.5} />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
            
            {/* Add/Edit Organization Dialog */}
            <Dialog 
                open={dialogOpen} 
                onClose={handleDialogClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {dialogMode === 'add' ? 'Add New Organization' : 'Edit Organization'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <TextField
                                name="name"
                                label="Organization Name"
                                fullWidth
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="domain"
                                label="Domain"
                                fullWidth
                                value={formData.domain}
                                onChange={handleInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <IconWorld size={20} stroke={1.5} style={{ marginRight: '8px', opacity: 0.7 }} />
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="email"
                                label="Contact Email"
                                fullWidth
                                value={formData.email}
                                onChange={handleInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <IconMail size={20} stroke={1.5} style={{ marginRight: '8px', opacity: 0.7 }} />
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="phone"
                                label="Contact Phone"
                                fullWidth
                                value={formData.phone}
                                onChange={handleInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <IconPhone size={20} stroke={1.5} style={{ marginRight: '8px', opacity: 0.7 }} />
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="status"
                                label="Status"
                                select
                                fullWidth
                                value={formData.status}
                                onChange={handleInputChange}
                            >
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Inactive">Inactive</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="plan"
                                label="Subscription Plan"
                                select
                                fullWidth
                                value={formData.plan}
                                onChange={handleInputChange}
                            >
                                <MenuItem value="Basic">Basic</MenuItem>
                                <MenuItem value="Pro">Pro</MenuItem>
                                <MenuItem value="Enterprise">Enterprise</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                    >
                        {dialogMode === 'add' ? 'Create' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default OrganizationsAdmin 