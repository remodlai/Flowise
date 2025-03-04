import React, { useState } from 'react'
import { 
    Typography, 
    Grid, 
    Box, 
    Button, 
    Card, 
    CardContent, 
    CardActions,
    Chip,
    Divider,
    Switch,
    FormControlLabel,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material'
import { 
    IconPlus, 
    IconEdit, 
    IconTrash, 
    IconDotsVertical, 
    IconCopy,
    IconCheck
} from '@tabler/icons-react'

// Sample data - replace with actual data fetching
const samplePlans = [
    { 
        id: 1, 
        name: 'Free', 
        description: 'Basic features for individuals',
        price: 0,
        billingPeriod: 'monthly',
        features: [
            '5 agents',
            '1,000 messages per month',
            'Community support'
        ],
        isPublic: true,
        isPopular: false
    },
    { 
        id: 2, 
        name: 'Pro', 
        description: 'Advanced features for professionals',
        price: 29,
        billingPeriod: 'monthly',
        features: [
            'Unlimited agents',
            '10,000 messages per month',
            'Email support',
            'Advanced analytics'
        ],
        isPublic: true,
        isPopular: true
    },
    { 
        id: 3, 
        name: 'Enterprise', 
        description: 'Complete solution for organizations',
        price: 99,
        billingPeriod: 'monthly',
        features: [
            'Unlimited agents',
            'Unlimited messages',
            'Priority support',
            'Advanced analytics',
            'Custom integrations',
            'SSO & SAML'
        ],
        isPublic: true,
        isPopular: false
    },
    { 
        id: 4, 
        name: 'Custom Plan', 
        description: 'For specific customer needs',
        price: null,
        billingPeriod: 'custom',
        features: [
            'Custom features',
            'Custom limits',
            'Dedicated support',
            'Custom integrations'
        ],
        isPublic: false,
        isPopular: false
    }
];

const PlansAndPricing = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [annualBilling, setAnnualBilling] = useState(false);

    const handleMenuOpen = (event, plan) => {
        setAnchorEl(event.currentTarget);
        setSelectedPlan(plan);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedPlan(null);
    };

    const handleBillingToggle = () => {
        setAnnualBilling(!annualBilling);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4">
                        Plans & Pricing
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<IconPlus size={18} />}
                    sx={{ height: 40 }}
                >
                    Create Plan
                </Button>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <FormControlLabel
                    control={
                        <Switch 
                            checked={annualBilling} 
                            onChange={handleBillingToggle}
                            color="primary"
                        />
                    }
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2">Annual Billing</Typography>
                            <Chip 
                                label="Save 20%" 
                                size="small" 
                                color="success" 
                                sx={{ ml: 1, height: 20 }}
                            />
                        </Box>
                    }
                />
            </Box>

            <Grid container spacing={3}>
                {samplePlans.map((plan) => (
                    <Grid item xs={12} sm={6} md={3} key={plan.id}>
                        <Card 
                            variant="outlined" 
                            sx={{ 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                ...(plan.isPopular && {
                                    borderColor: (theme) => theme.palette.primary.main,
                                    boxShadow: '0 0 0 1px #2196f3'
                                })
                            }}
                        >
                            {plan.isPopular && (
                                <Chip
                                    label="Popular"
                                    color="primary"
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        height: 24
                                    }}
                                />
                            )}
                            
                            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                <IconButton 
                                    size="small"
                                    onClick={(e) => handleMenuOpen(e, plan)}
                                >
                                    <IconDotsVertical size={18} />
                                </IconButton>
                            </Box>
                            
                            <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="h5" component="div" gutterBottom>
                                        {plan.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ height: 40 }}>
                                        {plan.description}
                                    </Typography>
                                </Box>
                                
                                <Box sx={{ mb: 2 }}>
                                    {plan.price !== null ? (
                                        <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                                            <Typography variant="h3" component="span">
                                                ${annualBilling ? (plan.price * 0.8).toFixed(0) : plan.price}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                /{plan.billingPeriod === 'custom' ? 'custom' : annualBilling ? 'year' : 'month'}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Typography variant="h5" component="div">
                                            Contact Sales
                                        </Typography>
                                    )}
                                </Box>
                                
                                <Divider sx={{ my: 2 }} />
                                
                                <Box>
                                    {plan.features.map((feature, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <IconCheck size={16} color="#4caf50" style={{ marginRight: 8 }} />
                                            <Typography variant="body2">
                                                {feature}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                            
                            <CardActions sx={{ p: 2, pt: 0 }}>
                                <Button 
                                    variant={plan.isPopular ? "contained" : "outlined"} 
                                    fullWidth
                                >
                                    {plan.price !== null ? 'Edit Plan' : 'Configure'}
                                </Button>
                            </CardActions>
                            
                            <Box 
                                sx={{ 
                                    p: 1, 
                                    borderTop: '1px solid', 
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            size="small"
                                            checked={plan.isPublic} 
                                        />
                                    }
                                    label={
                                        <Typography variant="caption">
                                            {plan.isPublic ? 'Public' : 'Hidden'}
                                        </Typography>
                                    }
                                />
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon>
                        <IconEdit size={18} />
                    </ListItemIcon>
                    <ListItemText>Edit Plan</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon>
                        <IconCopy size={18} />
                    </ListItemIcon>
                    <ListItemText>Duplicate</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuClose} disabled={selectedPlan?.name === 'Free'}>
                    <ListItemIcon>
                        <IconTrash size={18} color={selectedPlan?.name === 'Free' ? '#ccc' : '#f44336'} />
                    </ListItemIcon>
                    <ListItemText sx={{ color: selectedPlan?.name === 'Free' ? '#ccc' : 'inherit' }}>
                        Delete Plan
                    </ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    )
}

export default PlansAndPricing 