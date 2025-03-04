import React from 'react'
import { Typography, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { IconCreditCard, IconReceipt, IconReportMoney, IconChartBar } from '@tabler/icons-react'

// Billing admin navigation items
const billingNavItems = [
    { label: 'Plans & Pricing', path: '/admin/billing/plans', icon: <IconCreditCard size={20} /> },
    { label: 'Subscriptions', path: '/admin/billing/subscriptions', icon: <IconReceipt size={20} /> },
    { label: 'Invoices', path: '/admin/billing/invoices', icon: <IconReportMoney size={20} /> },
    { label: 'Usage Reports', path: '/admin/billing/usage', icon: <IconChartBar size={20} /> }
]

const BillingAdmin = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const currentPath = location.pathname
    const theme = useTheme()

    // Find the active item based on the current path
    const activeItem = billingNavItems.findIndex(
        (item) => currentPath.startsWith(item.path)
    )

    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Side Navigation */}
            <Box 
                sx={{ 
                    width: 180, 
                    borderRight: `1px solid ${theme.palette.divider}`,
                    height: '100%'
                }}
            >
                <List component="nav" sx={{ py: 1 }}>
                    {billingNavItems.map((item, index) => (
                        <ListItem key={index} disablePadding>
                            <ListItemButton 
                                selected={index === activeItem}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    py: 1.5,
                                    borderLeft: index === activeItem ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                                    '&.Mui-selected': {
                                        backgroundColor: theme.palette.mode === 'dark' 
                                            ? theme.palette.primary.dark + '20' 
                                            : theme.palette.primary.light + '20'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.label} 
                                    primaryTypographyProps={{ 
                                        variant: 'body2',
                                        fontWeight: index === activeItem ? 500 : 400
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
            
            {/* Content Area */}
            <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" gutterBottom sx={{ mb: 0.5 }}>
                        Billing Management
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Manage billing plans, subscriptions, invoices, and usage reports
                    </Typography>
                </Box>
                
                {activeItem === -1 ? (
                    <Typography variant="body1">
                        Select a billing section from the menu to get started.
                    </Typography>
                ) : (
                    <Outlet />
                )}
            </Box>
        </Box>
    )
}

export default BillingAdmin 