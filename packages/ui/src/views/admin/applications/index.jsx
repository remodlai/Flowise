import React, { useState, useEffect } from 'react'
import { 
    Box, 
    Button, 
    IconButton, 
    CircularProgress, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField, 
    Grid,
    Typography,
    Divider,
    Tooltip,
    useTheme,
    InputAdornment
} from '@mui/material'
import { 
    IconPlus, 
    IconEdit, 
    IconTrash, 
    IconFilter, 
    IconEye, 
    IconWorld,
    IconUsers,
    IconApps,
    IconBuilding,
    IconCalendar,
    IconSearch
} from '@tabler/icons-react'
import { useSnackbar } from 'notistack'
import { useNavigate } from 'react-router-dom'

// Import reusable components
import ItemCard from '@/ui-component/cards/ItemCard'
import StatusChip from '@/ui-component/extended/StatusChip'
import MainCard from '@/ui-component/cards/MainCard'
import ApplicationDashboardRow from './ApplicationDashboardRow'

// Mock API functions - will be replaced with actual API calls
const getAllApplications = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                data: {
                    applications: [
                        {
                            id: '1',
                            name: 'RemodlConstruct AI',
                            description: 'Research the market and the main demands of users and the market as a whole.',
                            logo: 'https://via.placeholder.com/150',
                            website: 'https://remodlconstruct.ai',
                            version: '0.2.3',
                            organizationCount: 12,
                            userCount: 192,
                            flowCount: 12,
                            createdAt: '2023-01-15T12:00:00Z',
                            updatedAt: '2023-02-10T09:15:00Z',
                            status: 'Production'
                        },
                        {
                            id: '2',
                            name: 'Internal Tools',
                            description: 'Employee tools and dashboards',
                            logo: 'https://via.placeholder.com/150',
                            website: 'https://internal.example.com',
                            version: '2.0.1',
                            organizationCount: 1,
                            userCount: 18,
                            flowCount: 8,
                            createdAt: '2023-02-20T09:30:00Z',
                            updatedAt: '2023-03-05T14:20:00Z',
                            status: 'Active'
                        },
                        {
                            id: '3',
                            name: 'Partner Portal',
                            description: 'Integration portal for partners',
                            logo: 'https://via.placeholder.com/150',
                            website: 'https://partners.example.com',
                            version: '0.9.5',
                            organizationCount: 8,
                            userCount: 36,
                            flowCount: 5,
                            createdAt: '2023-03-10T15:45:00Z',
                            updatedAt: '2023-03-15T11:30:00Z',
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
                    flowCount: 0,
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
    const [searchTerm, setSearchTerm] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        website: '',
        version: '',
        status: 'Active'
    })
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()
    const theme = useTheme()

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
            website: application.website,
            version: application.version,
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
            website: '',
            version: '',
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

    // Filter applications based on search term
    const filteredApplications = applications.filter(app => 
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        app.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Show loading state
    if (loading && applications.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', bgcolor: '#0A0A0A' }}>
                <CircularProgress sx={{ color: '#3B82F6' }} />
            </Box>
        )
    }

    return (
        <Box sx={{ bgcolor: '#14161E', minHeight: '100vh', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    Applications Management
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<IconPlus size={18} />}
                    onClick={handleCreateApplication}
                    sx={{
                        bgcolor: '#3B82F6',
                        '&:hover': {
                            bgcolor: '#2563EB'
                        },
                        borderRadius: '8px',
                        px: 3
                    }}
                >
                    Add Application
                </Button>
            </Box>

            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                <TextField
                    placeholder="Search applications..."
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ 
                        maxWidth: 400,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: '#111',
                            borderRadius: '8px',
                            color: '#fff',
                            '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.1)'
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgba(255,255,255,0.2)'
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#3B82F6'
                            }
                        },
                        '& .MuiInputBase-input::placeholder': {
                            color: '#aaa'
                        }
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <IconSearch size={18} stroke={1.5} style={{ color: '#aaa' }} />
                            </InputAdornment>
                        )
                    }}
                />
                <Button 
                    variant="outlined" 
                    startIcon={<IconFilter size={18} stroke={1.5} />}
                    sx={{ 
                        ml: 2,
                        borderColor: 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        '&:hover': {
                            borderColor: '#3B82F6',
                            bgcolor: 'transparent'
                        },
                        borderRadius: '8px'
                    }}
                >
                    Filters
                </Button>
            </Box>

            {filteredApplications.map((app) => (
                <ApplicationDashboardRow
                    key={app.id}
                    application={app}
                    onView={handleViewApplication}
                    onEdit={handleEditApplication}
                    onDelete={handleDeleteApplication}
                    formatDate={formatDate}
                />
            ))}
            
            {filteredApplications.length === 0 && !loading && (
                <Box sx={{ 
                    textAlign: 'center', 
                    py: 6, 
                    bgcolor: '#181A23',
                    borderRadius: '12px',
                    border: '1px dashed rgba(255,255,255,0.1)',
                }}>
                    <Typography variant="h4" sx={{ color: '#fff' }}>No applications found</Typography>
                    <Typography variant="body1" sx={{ mt: 1, color: '#aaa' }}>
                        {searchTerm ? 'Try a different search term' : 'Create your first application to get started'}
                    </Typography>
                    {!searchTerm && (
                        <Button 
                            variant="contained" 
                            startIcon={<IconPlus size={18} />}
                            onClick={handleCreateApplication}
                            sx={{ 
                                mt: 3,
                                bgcolor: '#3B82F6',
                                '&:hover': {
                                    bgcolor: '#2563EB'
                                },
                                borderRadius: '8px'
                            }}
                        >
                            Add Application
                        </Button>
                    )}
                </Box>
            )}

            {/* Add/Edit Application Dialog */}
            <Dialog 
                open={dialogOpen} 
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#111',
                        backgroundImage: 'none',
                        borderRadius: '12px',
                        color: '#fff'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    p: 3
                }}>
                    {currentApplication ? 'Edit Application' : 'Create New Application'}
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <Grid container spacing={3} sx={{ mt: 0 }}>
                        <Grid item xs={12}>
                            <TextField
                                name="name"
                                label="Application Name"
                                value={formData.name}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#000',
                                        borderRadius: '8px',
                                        '& fieldset': {
                                            borderColor: 'rgba(255,255,255,0.1)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255,255,255,0.2)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#3B82F6'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#aaa'
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: '#fff'
                                    },
                                    '& .Mui-focused .MuiInputLabel-root': {
                                        color: '#3B82F6'
                                    }
                                }}
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
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#000',
                                        borderRadius: '8px',
                                        '& fieldset': {
                                            borderColor: 'rgba(255,255,255,0.1)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255,255,255,0.2)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#3B82F6'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#aaa'
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: '#fff'
                                    },
                                    '& .Mui-focused .MuiInputLabel-root': {
                                        color: '#3B82F6'
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="website"
                                label="Website URL"
                                value={formData.website}
                                onChange={handleInputChange}
                                fullWidth
                                placeholder="https://example.com"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#000',
                                        borderRadius: '8px',
                                        '& fieldset': {
                                            borderColor: 'rgba(255,255,255,0.1)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255,255,255,0.2)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#3B82F6'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#aaa'
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: '#fff'
                                    },
                                    '& .Mui-focused .MuiInputLabel-root': {
                                        color: '#3B82F6'
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="version"
                                label="Version"
                                value={formData.version}
                                onChange={handleInputChange}
                                fullWidth
                                placeholder="1.0.0"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#000',
                                        borderRadius: '8px',
                                        '& fieldset': {
                                            borderColor: 'rgba(255,255,255,0.1)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255,255,255,0.2)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#3B82F6'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#aaa'
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: '#fff'
                                    },
                                    '& .Mui-focused .MuiInputLabel-root': {
                                        color: '#3B82F6'
                                    }
                                }}
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
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#000',
                                        borderRadius: '8px',
                                        '& fieldset': {
                                            borderColor: 'rgba(255,255,255,0.1)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255,255,255,0.2)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#3B82F6'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#aaa'
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: '#fff'
                                    },
                                    '& .Mui-focused .MuiInputLabel-root': {
                                        color: '#3B82F6'
                                    },
                                    '& .MuiNativeSelect-select option': {
                                        backgroundColor: '#000'
                                    }
                                }}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Production">Production</option>
                            </TextField>
                        </Grid>
                        {/* Logo upload field would go here */}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Button 
                        onClick={() => setDialogOpen(false)}
                        sx={{
                            color: '#aaa',
                            '&:hover': {
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.05)'
                            },
                            borderRadius: '8px'
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        disabled={!formData.name}
                        sx={{
                            bgcolor: '#3B82F6',
                            '&:hover': {
                                bgcolor: '#2563EB'
                            },
                            borderRadius: '8px',
                            '&.Mui-disabled': {
                                bgcolor: 'rgba(59, 130, 246, 0.3)'
                            }
                        }}
                    >
                        {currentApplication ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ApplicationsAdmin; 