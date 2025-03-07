import React, { useState, useEffect } from 'react'
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
    Typography,
    FormControl,
    InputLabel,
    Select,
    CircularProgress
} from '@mui/material'
import { 
    IconPlus, 
    IconEdit, 
    IconTrash, 
    IconDotsVertical, 
    IconEye, 
    IconUsers, 
    IconBuildingSkyscraper
} from '@tabler/icons-react'
import { useSnackbar } from 'notistack'

// Import reusable components
import DataTable from '@/ui-component/table/DataTable'
import StatusChip from '@/ui-component/extended/StatusChip'

// Import API functions
import { getAllOrganizations, createOrganization, updateOrganization, deleteOrganization } from '@/api/organizations'
import { getAllApplications } from '@/api/applications'

const OrganizationsAdmin = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    
    // State for organizations and applications
    const [organizations, setOrganizations] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State for action menu
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedOrg, setSelectedOrg] = useState(null);
    
    // State for add/edit dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        application_id: ''
    });
    
    // Fetch organizations and applications on component mount
    useEffect(() => {
        fetchOrganizations();
        fetchApplications();
    }, []);
    
    // Function to fetch organizations
    const fetchOrganizations = async () => {
        try {
            setLoading(true);
            console.log('Fetching organizations...');
            
            // Test the regular endpoint directly with fetch
            try {
                console.log('Testing regular organizations endpoint directly...');
                const directResponse = await fetch('/api/v1/organizations', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'X-Application-ID': localStorage.getItem('selectedApplicationId') || ''
                    }
                });
                const directData = await directResponse.json();
                console.log('Direct organizations response:', directData);
                
                // Use the direct data
                if (directData && directData.organizations) {
                    console.log('Using direct data for organizations:', directData.organizations);
                    setOrganizations(directData.organizations);
                }
            } catch (directError) {
                console.error('Error testing regular organizations endpoint directly:', directError);
            }
            
            // Use the API client as a fallback
            if (organizations.length === 0) {
                console.log('Falling back to API client...');
                const response = await getAllOrganizations();
                console.log('Organizations response from API client:', response);
                
                if (response && response.data && response.data.organizations) {
                    console.log('Using API client response for organizations:', response.data.organizations);
                    setOrganizations(response.data.organizations);
                }
            }
            
            // Test the debug endpoint as a last resort
            if (organizations.length === 0) {
                try {
                    console.log('Testing debug organizations endpoint...');
                    const debugResponse = await fetch('/api/v1/debug/organizations', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                            'X-Application-ID': localStorage.getItem('selectedApplicationId') || ''
                        }
                    });
                    const debugData = await debugResponse.json();
                    console.log('Debug organizations response:', debugData);
                    
                    // Use the debug data for testing
                    if (debugData && debugData.filteredOrganizations && debugData.filteredOrganizations.length > 0) {
                        console.log('Using debug data for organizations:', debugData.filteredOrganizations);
                        setOrganizations(debugData.filteredOrganizations);
                    }
                } catch (debugError) {
                    console.error('Error testing debug organizations endpoint:', debugError);
                }
            }
            
        } catch (error) {
            console.error('Error fetching organizations:', error);
            enqueueSnackbar('Failed to load organizations', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };
    
    // Function to fetch applications
    const fetchApplications = async () => {
        try {
            const response = await getAllApplications();
            setApplications(response.data?.applications || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            enqueueSnackbar('Failed to load applications', { variant: 'error' });
        }
    };
    
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
            description: '',
            application_id: applications.length > 0 ? applications[0].id : ''
        });
        setDialogOpen(true);
    };
    
    // Handle dialog open for editing
    const handleEditOrg = () => {
        setDialogMode('edit');
        setFormData({
            name: selectedOrg.name,
            description: selectedOrg.description || '',
            application_id: selectedOrg.application_id
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
    const handleSubmit = async () => {
        try {
            if (dialogMode === 'add') {
                await createOrganization(formData);
                enqueueSnackbar('Organization created successfully', { variant: 'success' });
            } else {
                await updateOrganization(selectedOrg.id, formData);
                enqueueSnackbar('Organization updated successfully', { variant: 'success' });
            }
            
            // Refresh organizations list
            fetchOrganizations();
            
            // Close the dialog
            handleDialogClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            enqueueSnackbar(error.response?.data?.error || 'An error occurred', { variant: 'error' });
        }
    };
    
    // Handle organization deletion
    const handleDeleteOrg = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedOrg.name}? This action cannot be undone.`)) {
            try {
                await deleteOrganization(selectedOrg.id);
                enqueueSnackbar('Organization deleted successfully', { variant: 'success' });
                
                // Refresh organizations list
                fetchOrganizations();
                
                // Close the menu
                handleMenuClose();
            } catch (error) {
                console.error('Error deleting organization:', error);
                enqueueSnackbar(error.response?.data?.error || 'An error occurred', { variant: 'error' });
            }
        }
    };
    
    // Handle row click to navigate to detail page
    const handleRowClick = (row) => {
        navigate(`/admin/organizations/${row.id}`);
    };
    
    // Get application name by ID
    const getApplicationName = (applicationId) => {
        const app = applications.find(app => app.id === applicationId);
        return app ? app.name : 'Unknown Application';
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
                            color: '#4caf50'
                        }} 
                    />
                    <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {row.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {row.description || 'No description'}
                        </Typography>
                    </Box>
                </Box>
            )
        },
        {
            field: 'application',
            label: 'Application',
            render: (row) => (
                <Typography variant="body2">
                    {getApplicationName(row.application_id)}
                </Typography>
            )
        },
        {
            field: 'created_at',
            label: 'Created',
            render: (row) => (
                <Typography variant="body2">
                    {new Date(row.created_at).toLocaleDateString()}
                </Typography>
            )
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
    const tableActions = null;
    
    // Show loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={organizations}
                title="Organizations Management"
                description="Manage organizations, their members, and settings"
                searchPlaceholder="Search organizations..."
                searchFields={['name', 'description']}
                headerActions={headerActions}
                tableActions={tableActions}
                initialRowsPerPage={10}
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
                <MenuItem onClick={() => {
                    handleMenuClose();
                    navigate(`/admin/organizations/${selectedOrg?.id}?tab=1`);
                }}>
                    <ListItemIcon>
                        <IconUsers size={18} stroke={1.5} />
                    </ListItemIcon>
                    <ListItemText>Manage Members</ListItemText>
                </MenuItem>
                <MenuItem 
                    onClick={handleDeleteOrg}
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
                    {dialogMode === 'add' ? 'Add Organization' : 'Edit Organization'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            margin="normal"
                            variant="outlined"
                            required
                        />
                        
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            margin="normal"
                            variant="outlined"
                            multiline
                            rows={3}
                        />
                        
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Application</InputLabel>
                            <Select
                                name="application_id"
                                value={formData.application_id}
                                label="Application"
                                onChange={handleInputChange}
                            >
                                {applications.map(app => (
                                    <MenuItem key={app.id} value={app.id}>{app.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        disabled={!formData.name || !formData.application_id}
                    >
                        {dialogMode === 'add' ? 'Create' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default OrganizationsAdmin 