import React from 'react'
import { Outlet } from 'react-router-dom'
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, useTheme, Divider } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { IconUsers, IconBuilding, IconApps, IconServer, IconCreditCard } from '@tabler/icons-react'
import { useSelector } from 'react-redux'

// Admin navigation items
const adminNavItems = [
    { label: 'Users & Access', path: '/admin/users', icon: <IconUsers size={20} stroke={1.8} /> },
    { label: 'Organizations', path: '/admin/organizations', icon: <IconBuilding size={20} stroke={1.8} /> },
    { label: 'Applications', path: '/admin/applications', icon: <IconApps size={20} stroke={1.8} /> },
    { label: 'Platform', path: '/admin/platform', icon: <IconServer size={20} stroke={1.8} /> },
    { label: 'Billing', path: '/admin/billing', icon: <IconCreditCard size={20} stroke={1.8} /> }
]

const AdminLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const currentPath = location.pathname
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const isDark = customization.isDarkMode

    // Find the active item based on the current path
    const activeItem = adminNavItems.findIndex(
        (item) => currentPath.startsWith(item.path)
    )

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                height: '100%', 
                width: '100%',
                backgroundColor: isDark ? theme.palette.background.default : '#f5f5f5'
            }}
        >
            {/* Side Navigation */}
            <Box 
                sx={{ 
                    width: 220, 
                    borderRight: isDark ? 
                        '1px solid rgba(255, 255, 255, 0.08)' : 
                        `1px solid ${theme.palette.divider}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: isDark ? 
                        theme.palette.background.paper : 
                        '#ffffff'
                }}
            >
                <Box 
                    sx={{ 
                        p: 2.5, 
                        borderBottom: isDark ? 
                            '1px solid rgba(255, 255, 255, 0.08)' : 
                            `1px solid ${theme.palette.divider}`
                    }}
                >
                    <Typography 
                        variant="h5" 
                        sx={{ 
                            fontWeight: 600,
                            color: isDark ? '#ffffff' : 'inherit'
                        }}
                    >
                        Admin
                    </Typography>
                </Box>
                <List 
                    component="nav" 
                    sx={{ 
                        flexGrow: 1, 
                        p: 1.5,
                        '& .MuiListItemIcon-root': {
                            color: isDark ? 
                                'rgba(255, 255, 255, 0.7)' : 
                                theme.palette.text.secondary
                        }
                    }}
                >
                    {adminNavItems.map((item, index) => (
                        <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton 
                                selected={index === activeItem}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    py: 1.2,
                                    borderRadius: '10px',
                                    '&.Mui-selected': {
                                        backgroundColor: isDark ? 
                                            'rgba(124, 77, 255, 0.15)' : 
                                            theme.palette.primary.light + '20',
                                        '& .MuiListItemIcon-root': {
                                            color: isDark ? 
                                                theme.palette.secondary.main : 
                                                theme.palette.primary.main
                                        },
                                        '& .MuiTypography-root': {
                                            color: isDark ? 
                                                '#ffffff' : 
                                                theme.palette.primary.main,
                                            fontWeight: 600
                                        }
                                    },
                                    '&:hover': {
                                        backgroundColor: isDark ? 
                                            'rgba(255, 255, 255, 0.05)' : 
                                            'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
                                <ListItemIcon 
                                    sx={{ 
                                        minWidth: 36,
                                        color: index === activeItem ? 
                                            (isDark ? 
                                                theme.palette.secondary.main : 
                                                theme.palette.primary.main) : 
                                            'inherit'
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.label} 
                                    primaryTypographyProps={{ 
                                        variant: 'body2',
                                        fontWeight: index === activeItem ? 600 : 500,
                                        color: index === activeItem ? 
                                            (isDark ? 
                                                '#ffffff' : 
                                                theme.palette.primary.main) : 
                                            'inherit'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>

            {/* Content Area */}
            <Box 
                sx={{ 
                    flexGrow: 1, 
                    p: 0, 
                    overflow: 'auto',
                    backgroundColor: isDark ? 
                        theme.palette.background.default : 
                        '#f5f5f5'
                }}
            >
                <Outlet />
            </Box>
        </Box>
    )
}

export default AdminLayout 