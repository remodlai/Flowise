import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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
    Paper,
    Chip
} from '@mui/material';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDotsVertical,
    IconBrandChrome,
    IconDeviceDesktop,
    IconRocket,
    IconSettings,
    IconExternalLink
} from '@tabler/icons-react';
import StatusChip from '../../../../ui-component/extended/StatusChip';

// Sample applications data
const sampleApplications = [
    {
        id: 1,
        name: 'Customer Portal',
        description: 'Customer self-service portal for account management',
        type: 'Web App',
        status: 'Active',
        createdAt: '2023-01-25',
        url: 'https://portal.acmecorp.com'
    },
    {
        id: 2,
        name: 'Sales Dashboard',
        description: 'Internal sales performance tracking application',
        type: 'Dashboard',
        status: 'Active',
        createdAt: '2023-02-10',
        url: 'https://sales.acmecorp.com'
    },
    {
        id: 3,
        name: 'Inventory Manager',
        description: 'Warehouse inventory tracking system',
        type: 'Desktop App',
        status: 'Inactive',
        createdAt: '2023-03-15',
        url: 'https://inventory.acmecorp.com'
    }
];

const OrganizationApplications = ({ organizationId, applications = sampleApplications }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedApp, setSelectedApp] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'Web App',
        status: 'Active',
        url: ''
    });
    
    // Handle menu open
    const handleMenuOpen = (event, app) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setSelectedApp(app);
    };
    
    // Handle menu close
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    
    // Handle dialog open for adding
    const handleAddApp = () => {
        setDialogMode('add');
        setFormData({
            name: '',
            description: '',
            type: 'Web App',
            status: 'Active',
            url: ''
        });
        setDialogOpen(true);
    };
    
    // Handle dialog open for editing
    const handleEditApp = () => {
        setDialogMode('edit');
        setFormData({
            name: selectedApp.name,
            description: selectedApp.description,
            type: selectedApp.type,
            status: selectedApp.status,
            url: selectedApp.url
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
    
    // Get icon for application type
    const getAppTypeIcon = (type) => {
        switch (type) {
            case 'Web App':
                return <IconBrandChrome size={20} stroke={1.5} />;
            case 'Desktop App':
                return <IconDeviceDesktop size={20} stroke={1.5} />;
            case 'Dashboard':
                return <IconRocket size={20} stroke={1.5} />;
            default:
                return <IconRocket size={20} stroke={1.5} />;
        }
    };
    
    return (
        <>
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h4">
                            Applications
                        </Typography>
                        <Button 
                            variant="contained" 
                            startIcon={<IconPlus size={18} />}
                            onClick={handleAddApp}
                        >
                            Add Application
                        </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    {applications.length === 0 ? (
                        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                            No applications found for this organization.
                        </Typography>
                    ) : (
                        <TableContainer component={Paper} elevation={0} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Application</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Created</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {applications.map((app) => (
                                        <TableRow key={app.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                        {app.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {app.description}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={getAppTypeIcon(app.type)}
                                                    label={app.type}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <StatusChip status={app.status} />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton 
                                                    size="small"
                                                    href={app.url}
                                                    target="_blank"
                                                    sx={{ mr: 1 }}
                                                >
                                                    <IconExternalLink size={18} stroke={1.5} />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={(e) => handleMenuOpen(e, app)}
                                                >
                                                    <IconDotsVertical size={18} stroke={1.5} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
            
            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    elevation: 3,
                    sx: { minWidth: 180, borderRadius: '8px' }
                }}
            >
                <MenuItem onClick={handleEditApp}>
                    <ListItemIcon>
                        <IconEdit size={18} stroke={1.5} />
                    </ListItemIcon>
                    <ListItemText>Edit Application</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon>
                        <IconSettings size={18} stroke={1.5} />
                    </ListItemIcon>
                    <ListItemText>Configure</ListItemText>
                </MenuItem>
                {selectedApp?.status === 'Active' ? (
                    <MenuItem onClick={handleMenuClose}>
                        <ListItemIcon>
                            <IconTrash size={18} stroke={1.5} />
                        </ListItemIcon>
                        <ListItemText>Deactivate</ListItemText>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={handleMenuClose}>
                        <ListItemIcon>
                            <IconRocket size={18} stroke={1.5} />
                        </ListItemIcon>
                        <ListItemText>Activate</ListItemText>
                    </MenuItem>
                )}
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
            
            {/* Add/Edit Application Dialog */}
            <Dialog 
                open={dialogOpen} 
                onClose={handleDialogClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {dialogMode === 'add' ? 'Add New Application' : 'Edit Application'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <TextField
                                name="name"
                                label="Application Name"
                                fullWidth
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="description"
                                label="Description"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.description}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="type"
                                label="Application Type"
                                select
                                fullWidth
                                value={formData.type}
                                onChange={handleInputChange}
                            >
                                <MenuItem value="Web App">Web App</MenuItem>
                                <MenuItem value="Desktop App">Desktop App</MenuItem>
                                <MenuItem value="Dashboard">Dashboard</MenuItem>
                                <MenuItem value="Mobile App">Mobile App</MenuItem>
                                <MenuItem value="API">API</MenuItem>
                            </TextField>
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
                                <MenuItem value="Development">Development</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="url"
                                label="Application URL"
                                fullWidth
                                value={formData.url}
                                onChange={handleInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <IconBrandChrome size={20} stroke={1.5} style={{ marginRight: '8px', opacity: 0.7 }} />
                                    )
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                    >
                        {dialogMode === 'add' ? 'Create Application' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default OrganizationApplications; 