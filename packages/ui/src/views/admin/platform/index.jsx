import React, { useState } from 'react'
import { Typography, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { IconFolder, IconTools, IconSettings } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

// material-ui
import { Tabs, Tab } from '@mui/material'

// project imports
import MainCard from '../../../ui-component/cards/MainCard'
import PlatformNodesView from './nodes'
import PlatformToolsView from './tools'

// icons
import ExtensionIcon from '@mui/icons-material/Extension'
import BuildIcon from '@mui/icons-material/Build'

// tab panel
function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`platform-tabpanel-${index}`}
            aria-labelledby={`platform-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    )
}

function a11yProps(index) {
    return {
        id: `platform-tab-${index}`,
        'aria-controls': `platform-tabpanel-${index}`
    }
}

// Platform admin navigation items
const platformNavItems = [
    { label: 'Platform Files', path: '/admin/platform/files', icon: <IconFolder size={20} /> },
    { label: 'Tools & Nodes', path: '/admin/platform/tools', icon: <IconTools size={20} /> },
    { label: 'System Settings', path: '/admin/platform/settings', icon: <IconSettings size={20} /> }
]

const PlatformAdmin = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const currentPath = location.pathname
    const theme = useTheme()
    const [value, setValue] = useState(0)

    // Find the active item based on the current path
    const activeItem = platformNavItems.findIndex(
        (item) => currentPath.startsWith(item.path)
    )

    const handleChange = (event, newValue) => {
        setValue(newValue)
    }

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
                    {platformNavItems.map((item, index) => (
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
                        Platform Management
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Manage platform files, tools, nodes, and system settings
                    </Typography>
                </Box>
                
                {activeItem === -1 ? (
                    <Typography variant="body1">
                        Select a platform section from the menu to get started.
                    </Typography>
                ) : (
                    <MainCard title="Platform Management">
                        <Typography variant="body1" sx={{ mb: 3 }}>
                            Control which nodes and tools are available to users when building chatflows.
                        </Typography>

                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs
                                value={value}
                                onChange={handleChange}
                                aria-label="platform management tabs"
                                variant="scrollable"
                                scrollButtons="auto"
                            >
                                <Tab
                                    icon={<ExtensionIcon />}
                                    label="Nodes"
                                    {...a11yProps(0)}
                                    sx={{
                                        minHeight: 'auto',
                                        minWidth: 'auto',
                                        px: 2,
                                        py: 1.5,
                                        mr: 2,
                                        color: theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[600],
                                        borderRadius: '12px 12px 0 0',
                                        '&.Mui-selected': {
                                            color: theme.palette.primary.main
                                        }
                                    }}
                                />
                                <Tab
                                    icon={<BuildIcon />}
                                    label="Tools"
                                    {...a11yProps(1)}
                                    sx={{
                                        minHeight: 'auto',
                                        minWidth: 'auto',
                                        px: 2,
                                        py: 1.5,
                                        mr: 2,
                                        color: theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[600],
                                        borderRadius: '12px 12px 0 0',
                                        '&.Mui-selected': {
                                            color: theme.palette.primary.main
                                        }
                                    }}
                                />
                            </Tabs>
                        </Box>

                        <TabPanel value={value} index={0}>
                            <PlatformNodesView />
                        </TabPanel>
                        <TabPanel value={value} index={1}>
                            <PlatformToolsView />
                        </TabPanel>
                    </MainCard>
                )}
            </Box>
        </Box>
    )
}

export default PlatformAdmin 