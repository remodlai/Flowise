import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    Link
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
import StatusChip from '../../../ui-component/extended/StatusChip';
import OrganizationChip from '../../../ui-component/extended/OrganizationChip';

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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <OrganizationChip 
                        name={organization?.name || 'Unknown Organization'} 
                        size="medium" 
                        sx={{ mr: 2, fontSize: '1.125rem' }} 
                    />
                    <StatusChip status={organization?.status} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box 
                        sx={{ 
                            border: '2px solid #FF5722', 
                            borderRadius: '4px', 
                            px: 2, 
                            py: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        <Typography variant="body1" fontWeight="500">
                            Application: {organization?.application?.name || 'RemodlAI'}
                        </Typography>
                    </Box>
                    <Button 
                        variant="contained" 
                        startIcon={<EditIcon />}
                        onClick={onEdit}
                    >
                        Edit Organization
                    </Button>
                </Box>
            </Box>
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
                        <Typography variant="subtitle1" color="textSecondary">
                            Organization Name
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {organization?.name}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Domain
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {organization?.domain}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Email
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {organization?.email}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Phone
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {organization?.phone}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Status
                        </Typography>
                        <StatusChip status={organization?.status} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Subscription Plan
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {organization?.plan}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Created Date
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString() : 'N/A'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Member Count
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {organization?.memberCount || 0}
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

// Main Organization Detail Component
const OrganizationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Sample data - would be replaced with actual API call
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setOrganization({
                id: id,
                name: 'Acme Corporation',
                domain: 'acmecorp.com',
                email: 'info@acmecorp.com',
                phone: '+1 (555) 123-4567',
                status: 'Active',
                memberCount: 24,
                plan: 'Enterprise',
                createdAt: '2023-01-15T00:00:00Z',
                members: [],
                applications: [],
                billingInfo: {
                    plan: 'Enterprise',
                    cycle: 'Annual',
                    nextBillingDate: '2024-01-15T00:00:00Z',
                    paymentMethod: 'Visa ending in 4242'
                }
            });
            setLoading(false);
        }, 1000);
    }, [id]);
    
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    
    const handleBack = () => {
        navigate('/admin/organizations');
    };
    
    const handleEdit = () => {
        // Would navigate to edit page or open edit dialog
        console.log('Edit organization', id);
    };
    
    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Loading organization details...</Typography>
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