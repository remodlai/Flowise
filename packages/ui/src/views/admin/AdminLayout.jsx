import React from 'react'
import { Outlet } from 'react-router-dom'
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, useTheme } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { IconUsers, IconBuilding, IconApps, IconServer, IconCreditCard } from '@tabler/icons-react'

// Admin navigation items
const adminNavItems = [
    { label: 'Users & Access', path: '/admin/users', icon: <IconUsers size={20} /> },
    { label: 'Organizations', path: '/admin/organizations', icon: <IconBuilding size={20} /> },
    { label: 'Applications', path: '/admin/applications', icon: <IconApps size={20} /> },
    { label: 'Platform', path: '/admin/platform', icon: <IconServer size={20} /> },
    { label: 'Billing', path: '/admin/billing', icon: <IconCreditCard size={20} /> }
]

const AdminLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const currentPath = location.pathname
    const theme = useTheme()

    // Find the active item based on the current path
    const activeItem = adminNavItems.findIndex(
        (item) => currentPath.startsWith(item.path)
    )

    return (
        <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
            {/* Side Navigation */}
            <Box 
                sx={{ 
                    width: 200, 
                    borderRight: `1px solid ${theme.palette.divider}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="h4">
                        Admin
                    </Typography>
                </Box>
                <List component="nav" sx={{ flexGrow: 1, p: 0 }}>
                    {adminNavItems.map((item, index) => (
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
            <Box sx={{ flexGrow: 1, p: 0, overflow: 'auto' }}>
                <Outlet />
            </Box>
        </Box>
    )
}

export default AdminLayout 