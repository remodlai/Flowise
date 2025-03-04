import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Divider,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    IconButton,
    Tabs,
    Tab
} from '@mui/material';
import {
    IconCreditCard,
    IconReceipt,
    IconCoin,
    IconChartBar,
    IconCalendar,
    IconDownload,
    IconEdit
} from '@tabler/icons-react';

// Sample billing data
const sampleBillingInfo = {
    plan: 'Enterprise',
    cycle: 'Annual',
    nextBillingDate: '2024-01-15T00:00:00Z',
    paymentMethod: 'Visa ending in 4242',
    amount: '$1,200.00',
    status: 'Active',
    invoices: [
        {
            id: 'INV-2023-001',
            date: '2023-01-15',
            amount: '$1,200.00',
            status: 'Paid',
            pdfUrl: '#'
        },
        {
            id: 'INV-2022-012',
            date: '2022-12-15',
            amount: '$1,200.00',
            status: 'Paid',
            pdfUrl: '#'
        },
        {
            id: 'INV-2022-011',
            date: '2022-11-15',
            amount: '$1,200.00',
            status: 'Paid',
            pdfUrl: '#'
        }
    ],
    usageData: {
        apiCalls: 125000,
        storage: 250,
        users: 24,
        limit: {
            apiCalls: 500000,
            storage: 1000,
            users: 50
        }
    }
};

const OrganizationBilling = ({ organizationId, billingInfo = sampleBillingInfo }) => {
    const [tabValue, setTabValue] = useState(0);
    const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
    const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(billingInfo.plan);
    const [selectedCycle, setSelectedCycle] = useState(billingInfo.cycle);
    
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    
    const handleChangePlanDialogOpen = () => {
        setChangePlanDialogOpen(true);
    };
    
    const handleChangePlanDialogClose = () => {
        setChangePlanDialogOpen(false);
    };
    
    const handlePaymentMethodDialogOpen = () => {
        setPaymentMethodDialogOpen(true);
    };
    
    const handlePaymentMethodDialogClose = () => {
        setPaymentMethodDialogOpen(false);
    };
    
    const handlePlanChange = (event) => {
        setSelectedPlan(event.target.value);
    };
    
    const handleCycleChange = (event) => {
        setSelectedCycle(event.target.value);
    };
    
    const handleChangePlanSubmit = () => {
        console.log('Plan changed to:', selectedPlan, selectedCycle);
        handleChangePlanDialogClose();
    };
    
    const handlePaymentMethodSubmit = () => {
        console.log('Payment method updated');
        handlePaymentMethodDialogClose();
    };
    
    // Get status color for invoice status
    const getInvoiceStatusColor = (status) => {
        switch (status) {
            case 'Paid':
                return '#4caf50';
            case 'Pending':
                return '#ff9800';
            case 'Overdue':
                return '#f44336';
            default:
                return '#757575';
        }
    };
    
    // Calculate usage percentage
    const calculateUsagePercentage = (used, limit) => {
        return Math.min(Math.round((used / limit) * 100), 100);
    };
    
    return (
        <>
            <Card>
                <CardContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" gutterBottom>
                            Billing Information
                        </Typography>
                        <Divider />
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                        <Tabs 
                            value={tabValue} 
                            onChange={handleTabChange} 
                            aria-label="billing tabs"
                            sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                            <Tab 
                                icon={<IconCreditCard size={18} />} 
                                iconPosition="start" 
                                label="Subscription" 
                            />
                            <Tab 
                                icon={<IconReceipt size={18} />} 
                                iconPosition="start" 
                                label="Invoices" 
                            />
                            <Tab 
                                icon={<IconChartBar size={18} />} 
                                iconPosition="start" 
                                label="Usage" 
                            />
                        </Tabs>
                    </Box>
                    
                    {/* Subscription Tab */}
                    {tabValue === 0 && (
                        <Box>
                            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle1" color="textSecondary">
                                                Current Plan
                                            </Typography>
                                            <Typography variant="h6">
                                                {billingInfo.plan}
                                            </Typography>
                                        </Box>
                                        
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle1" color="textSecondary">
                                                Billing Cycle
                                            </Typography>
                                            <Typography variant="h6">
                                                {billingInfo.cycle}
                                            </Typography>
                                        </Box>
                                        
                                        <Box>
                                            <Typography variant="subtitle1" color="textSecondary">
                                                Amount
                                            </Typography>
                                            <Typography variant="h6">
                                                {billingInfo.amount} / {billingInfo.cycle === 'Annual' ? 'year' : 'month'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle1" color="textSecondary">
                                                Status
                                            </Typography>
                                            <Chip 
                                                label={billingInfo.status} 
                                                color={billingInfo.status === 'Active' ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </Box>
                                        
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle1" color="textSecondary">
                                                Next Billing Date
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <IconCalendar size={18} style={{ marginRight: '8px', opacity: 0.7 }} />
                                                <Typography variant="h6">
                                                    {new Date(billingInfo.nextBillingDate).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        
                                        <Box>
                                            <Typography variant="subtitle1" color="textSecondary">
                                                Payment Method
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <IconCreditCard size={18} style={{ marginRight: '8px', opacity: 0.7 }} />
                                                <Typography variant="h6">
                                                    {billingInfo.paymentMethod}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                                
                                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                    <Button 
                                        variant="outlined" 
                                        startIcon={<IconCreditCard size={18} />}
                                        onClick={handlePaymentMethodDialogOpen}
                                    >
                                        Update Payment Method
                                    </Button>
                                    <Button 
                                        variant="contained" 
                                        startIcon={<IconEdit size={18} />}
                                        onClick={handleChangePlanDialogOpen}
                                    >
                                        Change Plan
                                    </Button>
                                </Box>
                            </Paper>
                        </Box>
                    )}
                    
                    {/* Invoices Tab */}
                    {tabValue === 1 && (
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Invoice ID</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {billingInfo.invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell>{invoice.id}</TableCell>
                                            <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{invoice.amount}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={invoice.status} 
                                                    size="small"
                                                    sx={{ 
                                                        backgroundColor: getInvoiceStatusColor(invoice.status),
                                                        color: '#fff'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton 
                                                    size="small" 
                                                    href={invoice.pdfUrl}
                                                    target="_blank"
                                                >
                                                    <IconDownload size={18} stroke={1.5} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                    
                    {/* Usage Tab */}
                    {tabValue === 2 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <IconCoin size={24} style={{ marginRight: '12px', opacity: 0.7 }} />
                                        <Typography variant="h6">API Calls</Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{ mb: 1 }}>
                                        {billingInfo.usageData.apiCalls.toLocaleString()}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="textSecondary">
                                            {calculateUsagePercentage(billingInfo.usageData.apiCalls, billingInfo.usageData.limit.apiCalls)}% of limit
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Limit: {billingInfo.usageData.limit.apiCalls.toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Box 
                                        sx={{ 
                                            mt: 1, 
                                            height: 4, 
                                            backgroundColor: 'rgba(0,0,0,0.1)', 
                                            borderRadius: 2,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <Box 
                                            sx={{ 
                                                height: '100%', 
                                                width: `${calculateUsagePercentage(billingInfo.usageData.apiCalls, billingInfo.usageData.limit.apiCalls)}%`,
                                                backgroundColor: '#2196f3',
                                                borderRadius: 2
                                            }} 
                                        />
                                    </Box>
                                </Paper>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <IconChartBar size={24} style={{ marginRight: '12px', opacity: 0.7 }} />
                                        <Typography variant="h6">Storage (GB)</Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{ mb: 1 }}>
                                        {billingInfo.usageData.storage}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="textSecondary">
                                            {calculateUsagePercentage(billingInfo.usageData.storage, billingInfo.usageData.limit.storage)}% of limit
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Limit: {billingInfo.usageData.limit.storage}
                                        </Typography>
                                    </Box>
                                    <Box 
                                        sx={{ 
                                            mt: 1, 
                                            height: 4, 
                                            backgroundColor: 'rgba(0,0,0,0.1)', 
                                            borderRadius: 2,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <Box 
                                            sx={{ 
                                                height: '100%', 
                                                width: `${calculateUsagePercentage(billingInfo.usageData.storage, billingInfo.usageData.limit.storage)}%`,
                                                backgroundColor: '#4caf50',
                                                borderRadius: 2
                                            }} 
                                        />
                                    </Box>
                                </Paper>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <IconChartBar size={24} style={{ marginRight: '12px', opacity: 0.7 }} />
                                        <Typography variant="h6">Users</Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{ mb: 1 }}>
                                        {billingInfo.usageData.users}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="textSecondary">
                                            {calculateUsagePercentage(billingInfo.usageData.users, billingInfo.usageData.limit.users)}% of limit
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Limit: {billingInfo.usageData.limit.users}
                                        </Typography>
                                    </Box>
                                    <Box 
                                        sx={{ 
                                            mt: 1, 
                                            height: 4, 
                                            backgroundColor: 'rgba(0,0,0,0.1)', 
                                            borderRadius: 2,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <Box 
                                            sx={{ 
                                                height: '100%', 
                                                width: `${calculateUsagePercentage(billingInfo.usageData.users, billingInfo.usageData.limit.users)}%`,
                                                backgroundColor: '#ff9800',
                                                borderRadius: 2
                                            }} 
                                        />
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                </CardContent>
            </Card>
            
            {/* Change Plan Dialog */}
            <Dialog 
                open={changePlanDialogOpen} 
                onClose={handleChangePlanDialogClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Change Subscription Plan
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Subscription Plan"
                                value={selectedPlan}
                                onChange={handlePlanChange}
                            >
                                <MenuItem value="Basic">Basic</MenuItem>
                                <MenuItem value="Pro">Pro</MenuItem>
                                <MenuItem value="Enterprise">Enterprise</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Billing Cycle"
                                value={selectedCycle}
                                onChange={handleCycleChange}
                            >
                                <MenuItem value="Monthly">Monthly</MenuItem>
                                <MenuItem value="Annual">Annual (Save 20%)</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                                Changing your plan will take effect immediately. You will be charged the prorated amount for the remainder of your billing cycle.
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleChangePlanDialogClose}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleChangePlanSubmit}
                    >
                        Confirm Change
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Update Payment Method Dialog */}
            <Dialog 
                open={paymentMethodDialogOpen} 
                onClose={handlePaymentMethodDialogClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Update Payment Method
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Card Number"
                                placeholder="•••• •••• •••• ••••"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Expiration Date"
                                placeholder="MM/YY"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="CVC"
                                placeholder="•••"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Cardholder Name"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handlePaymentMethodDialogClose}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handlePaymentMethodSubmit}
                    >
                        Update Payment Method
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default OrganizationBilling; 