import React, { useState, useEffect } from 'react'
import { Box, Button, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid } from '@mui/material'
import { IconPlus, IconEdit, IconTrash, IconFilter, IconEye } from '@tabler/icons-react'
import { useSnackbar } from 'notistack'
import { useNavigate } from 'react-router-dom'

// Import reusable components
import DataTable from '@/ui-component/table/DataTable'
import StatusChip from '@/ui-component/extended/StatusChip'

// Mock API functions - will be replaced with actual API calls
const getAllApplications = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                data: {
                    applications: [
                        {
                            id: '1',
                            name: 'Customer Portal',
                            description: 'Main customer-facing application',
                            organizationCount: 5,
                            userCount: 42,
                            createdAt: '2023-01-15T12:00:00Z',
                            status: 'Active'
                        },
                        {
                            id: '2',
                            name: 'Internal Tools',
                            description: 'Employee tools and dashboards',
                            organizationCount: 1,
                            userCount: 18,
                            createdAt: '2023-02-20T09:30:00Z',
                            status: 'Active'
                        },
                        {
                            id: '3',
                            name: 'Partner Portal',
                            description: 'Integration portal for partners',
                            organizationCount: 8,
                            userCount: 36,
                            createdAt: '2023-03-10T15:45:00Z',
                            status: 'Inactive'
                        }
                    ]
                }
            });
        }, 1000);
    });
};

const deleteApplication = (id) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true });
        }, 500);
    });
};

const createApplication = (data) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ 
                success: true,
                data: {
                    id: Math.random().toString(36).substring(7),
                    ...data,
                    organizationCount: 0,
                    userCount: 0,
                    createdAt: new Date().toISOString(),
                }
            });
        }, 500);
    });
};

const updateApplication = (id, data) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ 
                success: true,
                data: {
                    id,
                    ...data,
                }
            });
        }, 500);
    });
};

const ApplicationsAdmin = () => {
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [currentApplication, setCurrentApplication] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'Active'
    })
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()

    // Fetch applications on component mount
    useEffect(() => {
        fetchApplications()
    }, [])

    // Function to fetch applications
    const fetchApplications = async () => {
        try {
            setLoading(true)
            const response = await getAllApplications()
            setApplications(response.data.applications || [])
        } catch (error) {
            console.error('Error fetching applications:', error)
            enqueueSnackbar('Failed to load applications', { variant: 'error' })
        } finally {
            setLoading(false)
        }
    }

    // Function to handle application deletion
    const handleDeleteApplication = async (id) => {
        if (window.confirm('Are you sure you want to delete this application?')) {
            try {
                await deleteApplication(id)
                enqueueSnackbar('Application deleted successfully', { variant: 'success' })
                fetchApplications() // Refresh the list
            } catch (error) {
                console.error('Error deleting application:', error)
                enqueueSnackbar('Failed to delete application', { variant: 'error' })
            }
        }
    }

    // Function to handle application edit
    const handleEditApplication = (application) => {
        setCurrentApplication(application)
        setFormData({
            name: application.name,
            description: application.description,
            status: application.status
        })
        setDialogOpen(true)
    }

    // Function to handle application view
    const handleViewApplication = (id) => {
        navigate(`/admin/applications/${id}`)
    }

    // Function to handle application creation
    const handleCreateApplication = () => {
        setCurrentApplication(null)
        setFormData({
            name: '',
            description: '',
            status: 'Active'
        })
        setDialogOpen(true)
    }

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // Handle form submission
    const handleSubmit = async () => {
        try {
            if (currentApplication) {
                // Update existing application
                await updateApplication(currentApplication.id, formData)
                enqueueSnackbar('Application updated successfully', { variant: 'success' })
            } else {
                // Create new application
                await createApplication(formData)
                enqueueSnackbar('Application created successfully', { variant: 'success' })
            }
            setDialogOpen(false)
            fetchApplications() // Refresh the list
        } catch (error) {
            console.error('Error saving application:', error)
            enqueueSnackbar('Failed to save application', { variant: 'error' })
        }
    }

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    // Define table columns
    const columns = [
        {
            field: 'name',
            label: 'Application Name',
            render: (row) => (
                <Box>
                    <strong>{row.name}</strong>
                    <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        {row.description}
                    </Box>
                </Box>
            )
        },
        {
            field: 'organizationCount',
            label: 'Organizations',
            align: 'center',
            render: (row) => row.organizationCount
        },
        {
            field: 'userCount',
            label: 'Users',
            align: 'center',
            render: (row) => row.userCount
        },
        {
            field: 'createdAt',
            label: 'Created',
            render: (row) => formatDate(row.createdAt)
        },
        {
            field: 'status',
            label: 'Status',
            render: (row) => (
                <StatusChip status={row.status} />
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
                        onClick={() => handleViewApplication(row.id)}
                        title="View Details"
                    >
                        <IconEye size={18} stroke={1.5} />
                    </IconButton>
                    <IconButton 
                        size="small"
                        onClick={() => handleEditApplication(row)}
                        title="Edit Application"
                    >
                        <IconEdit size={18} stroke={1.5} />
                    </IconButton>
                    <IconButton 
                        size="small"
                        onClick={() => handleDeleteApplication(row.id)}
                        title="Delete Application"
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
            onClick={handleCreateApplication}
        >
            Add Application
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

    // Show loading state
    if (loading && applications.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={applications}
                title="Applications Management"
                description="Manage applications, their settings, and access controls"
                searchPlaceholder="Search applications..."
                searchFields={['name', 'description']}
                headerActions={headerActions}
                tableActions={tableActions}
                initialRowsPerPage={10}
                sx={{ p: { xs: 2, md: 3 } }}
            />

            {/* Add/Edit Application Dialog */}
            <Dialog 
                open={dialogOpen} 
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {currentApplication ? 'Edit Application' : 'Create New Application'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                name="name"
                                label="Application Name"
                                value={formData.name}
                                onChange={handleInputChange}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="description"
                                label="Description"
                                value={formData.description}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="status"
                                label="Status"
                                value={formData.status}
                                onChange={handleInputChange}
                                select
                                fullWidth
                                SelectProps={{
                                    native: true
                                }}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        disabled={!formData.name}
                    >
                        {currentApplication ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ApplicationsAdmin; 