import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Divider,
    Grid,
    TextField,
    Paper,
    Slider,
    Switch,
    FormControlLabel,
    InputAdornment,
    Chip,
    Alert,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    IconInfoCircle,
    IconDeviceFloppy,
    IconRefresh,
    IconSettings,
    IconUsers,
    IconDatabase,
    IconApi,
    IconCpu,
    IconCloudUpload
} from '@tabler/icons-react';

// Sample application settings data
const sampleAppSettings = {
    id: 'app-123',
    name: 'RemodlAI',
    version: '2.2.4',
    limits: {
        apiCalls: {
            daily: 10000,
            monthly: 300000,
            current: {
                daily: 2540,
                monthly: 45600
            }
        },
        storage: {
            maxGB: 50,
            currentGB: 12.4
        },
        users: {
            max: 25,
            current: 24
        },
        models: {
            enabled: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet', 'claude-3-opus'],
            available: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus', 'gemini-pro', 'llama-3']
        }
    },
    features: {
        fileUploads: true,
        customDomains: true,
        sso: true,
        apiAccess: true,
        advancedAnalytics: false
    }
};

const OrganizationApplications = ({ organizationId, appSettings = sampleAppSettings }) => {
    const [settings, setSettings] = useState(appSettings);
    const [isEditing, setIsEditing] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    // Handle form input change
    const handleInputChange = (section, field, value) => {
        setSettings({
            ...settings,
            [section]: {
                ...settings[section],
                [field]: value
            }
        });
    };
    
    // Handle nested input change
    const handleNestedInputChange = (section, subsection, field, value) => {
        setSettings({
            ...settings,
            [section]: {
                ...settings[section],
                [subsection]: {
                    ...settings[section][subsection],
                    [field]: value
                }
            }
        });
    };
    
    // Handle feature toggle
    const handleFeatureToggle = (feature) => {
        setSettings({
            ...settings,
            features: {
                ...settings.features,
                [feature]: !settings.features[feature]
            }
        });
    };
    
    // Handle save settings
    const handleSaveSettings = () => {
        // Here you would typically save the data to your backend
        console.log('Settings saved:', settings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };
    
    // Toggle edit mode
    const toggleEditMode = () => {
        setIsEditing(!isEditing);
    };
    
    // Format number with commas
    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    
    // Calculate percentage
    const calculatePercentage = (current, max) => {
        return (current / max) * 100;
    };
    
    return (
        <>
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconSettings size={24} stroke={1.5} style={{ marginRight: '8px' }} />
                            <Typography variant="h4">
                                Application Settings
                            </Typography>
                        </Box>
                        <Box>
                            {saveSuccess && (
                                <Alert 
                                    severity="success" 
                                    sx={{ 
                                        py: 0, 
                                        mr: 2, 
                                        display: 'inline-flex', 
                                        alignItems: 'center' 
                                    }}
                                >
                                    Settings saved successfully
                                </Alert>
                            )}
                            <Button 
                                variant="contained" 
                                startIcon={<IconDeviceFloppy size={18} />}
                                onClick={handleSaveSettings}
                                disabled={!isEditing}
                                sx={{ mr: 1 }}
                            >
                                Save Changes
                            </Button>
                            <Button 
                                variant={isEditing ? "outlined" : "contained"}
                                color={isEditing ? "secondary" : "primary"}
                                onClick={toggleEditMode}
                            >
                                {isEditing ? 'Cancel' : 'Edit Settings'}
                            </Button>
                        </Box>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    
                    {/* Application Info */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            Application Information
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Application Name
                                </Typography>
                                <Typography variant="body1">
                                    {settings.name}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Application ID
                                </Typography>
                                <Typography variant="body1">
                                    {settings.id}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Version
                                </Typography>
                                <Typography variant="body1">
                                    {settings.version}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                    
                    {/* Resource Limits */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            Resource Limits
                            <Tooltip title="These limits define the maximum resources available to this organization">
                                <IconButton size="small" sx={{ ml: 1 }}>
                                    <IconInfoCircle size={18} />
                                </IconButton>
                            </Tooltip>
                        </Typography>
                        
                        <Grid container spacing={3}>
                            {/* API Calls */}
                            <Grid item xs={12} md={4}>
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <IconApi size={20} style={{ marginRight: '8px' }} />
                                        <Typography variant="subtitle1">API Calls</Typography>
                                    </Box>
                                    
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        Daily Limit
                                    </Typography>
                                    {isEditing ? (
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="number"
                                            value={settings.limits.apiCalls.daily}
                                            onChange={(e) => handleNestedInputChange('limits', 'apiCalls', 'daily', parseInt(e.target.value))}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">calls</InputAdornment>,
                                            }}
                                        />
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="body1">
                                                {formatNumber(settings.limits.apiCalls.current.daily)} / {formatNumber(settings.limits.apiCalls.daily)}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                                                ({Math.round(calculatePercentage(settings.limits.apiCalls.current.daily, settings.limits.apiCalls.daily))}%)
                                            </Typography>
                                        </Box>
                                    )}
                                    
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                            Monthly Limit
                                        </Typography>
                                        {isEditing ? (
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="number"
                                                value={settings.limits.apiCalls.monthly}
                                                onChange={(e) => handleNestedInputChange('limits', 'apiCalls', 'monthly', parseInt(e.target.value))}
                                                InputProps={{
                                                    endAdornment: <InputAdornment position="end">calls</InputAdornment>,
                                                }}
                                            />
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography variant="body1">
                                                    {formatNumber(settings.limits.apiCalls.current.monthly)} / {formatNumber(settings.limits.apiCalls.monthly)}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                                                    ({Math.round(calculatePercentage(settings.limits.apiCalls.current.monthly, settings.limits.apiCalls.monthly))}%)
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>
                            
                            {/* Storage */}
                            <Grid item xs={12} md={4}>
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <IconDatabase size={20} style={{ marginRight: '8px' }} />
                                        <Typography variant="subtitle1">Storage</Typography>
                                    </Box>
                                    
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        Storage Limit
                                    </Typography>
                                    {isEditing ? (
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="number"
                                            value={settings.limits.storage.maxGB}
                                            onChange={(e) => handleNestedInputChange('limits', 'storage', 'maxGB', parseFloat(e.target.value))}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">GB</InputAdornment>,
                                            }}
                                        />
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body1">
                                                {settings.limits.storage.currentGB.toFixed(1)} / {settings.limits.storage.maxGB} GB
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                                                ({Math.round(calculatePercentage(settings.limits.storage.currentGB, settings.limits.storage.maxGB))}%)
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Grid>
                            
                            {/* Users */}
                            <Grid item xs={12} md={4}>
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <IconUsers size={20} style={{ marginRight: '8px' }} />
                                        <Typography variant="subtitle1">Users</Typography>
                                    </Box>
                                    
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        User Limit
                                    </Typography>
                                    {isEditing ? (
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="number"
                                            value={settings.limits.users.max}
                                            onChange={(e) => handleNestedInputChange('limits', 'users', 'max', parseInt(e.target.value))}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">users</InputAdornment>,
                                            }}
                                        />
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body1">
                                                {settings.limits.users.current} / {settings.limits.users.max} users
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                                                ({Math.round(calculatePercentage(settings.limits.users.current, settings.limits.users.max))}%)
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                    
                    {/* Features */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            Features
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.features.fileUploads}
                                            onChange={() => isEditing && handleFeatureToggle('fileUploads')}
                                            disabled={!isEditing}
                                        />
                                    }
                                    label="File Uploads"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.features.customDomains}
                                            onChange={() => isEditing && handleFeatureToggle('customDomains')}
                                            disabled={!isEditing}
                                        />
                                    }
                                    label="Custom Domains"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.features.sso}
                                            onChange={() => isEditing && handleFeatureToggle('sso')}
                                            disabled={!isEditing}
                                        />
                                    }
                                    label="Single Sign-On (SSO)"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.features.apiAccess}
                                            onChange={() => isEditing && handleFeatureToggle('apiAccess')}
                                            disabled={!isEditing}
                                        />
                                    }
                                    label="API Access"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.features.advancedAnalytics}
                                            onChange={() => isEditing && handleFeatureToggle('advancedAnalytics')}
                                            disabled={!isEditing}
                                        />
                                    }
                                    label="Advanced Analytics"
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                    
                    {/* Enabled Models */}
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="h5" gutterBottom>
                            Enabled AI Models
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Models available to this organization:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                {settings.limits.models.available.map((model) => (
                                    <Chip
                                        key={model}
                                        label={model}
                                        color={settings.limits.models.enabled.includes(model) ? "primary" : "default"}
                                        variant={settings.limits.models.enabled.includes(model) ? "filled" : "outlined"}
                                        onClick={() => {
                                            if (isEditing) {
                                                const newEnabled = settings.limits.models.enabled.includes(model)
                                                    ? settings.limits.models.enabled.filter(m => m !== model)
                                                    : [...settings.limits.models.enabled, model];
                                                
                                                setSettings({
                                                    ...settings,
                                                    limits: {
                                                        ...settings.limits,
                                                        models: {
                                                            ...settings.limits.models,
                                                            enabled: newEnabled
                                                        }
                                                    }
                                                });
                                            }
                                        }}
                                        clickable={isEditing}
                                        sx={{ mb: 1 }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Paper>
                </CardContent>
            </Card>
        </>
    );
};

export default OrganizationApplications; 