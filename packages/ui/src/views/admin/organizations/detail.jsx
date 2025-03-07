import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Tabs,
    Tab,
    Divider,
    IconButton,
    Breadcrumbs,
    Link,
    CircularProgress
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
import StatusChip from '@/ui-component/extended/StatusChip';
import OrganizationChip from '@/ui-component/extended/OrganizationChip';

// Import API functions
import { getOrganizationById } from '@/api/organizations';
import { useSnackbar } from 'notistack';

// Import granular components
import OrganizationMembers from './components/OrganizationMembers';
import OrganizationApplications from './components/OrganizationApplications';
import OrganizationBilling from './components/OrganizationBilling';

// Organization Header Component
const OrganizationHeader = ({ organization, onBack, onEdit }) => {
    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={onBack} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link color="inherit" href="/admin/organizations">
                        Organizations
                    </Link>
                    <Typography color="textPrimary">{organization?.name || 'Organization Details'}</Typography>
                </Breadcrumbs>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h3" component="h1">
                    {organization?.name || 'Organization Details'}
                </Typography>
                <Button 
                    variant="outlined" 
                    startIcon={<EditIcon />}
                    onClick={onEdit}
                >
                    Edit
                </Button>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {organization?.description || 'No description provided'}
            </Typography>
        </Box>
    );
};

// Organization Info Card Component
const OrganizationInfoCard = ({ organization }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h4" gutterBottom>
                    Organization Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                                Name
                            </Typography>
                            <Typography variant="body1">
                                {organization?.name || 'N/A'}
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                                Created
                            </Typography>
                            <Typography variant="body1">
                                {organization?.created_at ? new Date(organization.created_at).toLocaleDateString() : 'N/A'}
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                                Description
                            </Typography>
                            <Typography variant="body1">
                                {organization?.description || 'No description provided'}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

const OrganizationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();
    
    // Get tab from URL query params
    const queryParams = new URLSearchParams(location.search);
    const initialTab = parseInt(queryParams.get('tab') || '0', 10);
    
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(initialTab);
    
    // Fetch organization data
    useEffect(() => {
        fetchOrganization();
    }, [id]);
    
    const fetchOrganization = async () => {
        try {
            setLoading(true);
            const response = await getOrganizationById(id);
            setOrganization(response.data.organization);
        } catch (error) {
            console.error('Error fetching organization:', error);
            enqueueSnackbar('Failed to load organization details', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };
    
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    
    const handleBack = () => {
        navigate('/admin/organizations');
    };
    
    const handleEdit = () => {
        // Open edit dialog in the parent component
        navigate(`/admin/organizations?edit=${id}`);
    };
    
    // Show loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }
    
    return (
        <Box sx={{ p: 3 }}>
            <OrganizationHeader 
                organization={organization} 
                onBack={handleBack} 
                onEdit={handleEdit} 
            />
            
            <Box sx={{ mb: 3 }}>
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    aria-label="organization tabs"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Overview" />
                    <Tab label="Members" />
                    <Tab label="Applications" />
                    <Tab label="Billing" />
                </Tabs>
            </Box>
            
            <Box sx={{ mt: 2 }}>
                {tabValue === 0 && (
                    <OrganizationInfoCard organization={organization} />
                )}
                
                {tabValue === 1 && (
                    <OrganizationMembers organizationId={id} />
                )}
                
                {tabValue === 2 && (
                    <OrganizationApplications organizationId={id} />
                )}
                
                {tabValue === 3 && (
                    <OrganizationBilling organizationId={id} />
                )}
            </Box>
        </Box>
    );
};

export default OrganizationDetail; 