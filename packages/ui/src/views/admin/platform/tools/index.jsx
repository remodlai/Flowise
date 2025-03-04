import { useState } from 'react'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Box, Tab, Tabs, Typography } from '@mui/material'

// project imports
import PlatformNodesView from '../nodes'
import PlatformToolsView from './ToolsView'

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

// ==============================|| TOOLS AND NODES ||============================== //

const ToolsAndNodes = () => {
    const theme = useTheme()
    const [value, setValue] = useState(0)

    const handleChange = (event, newValue) => {
        setValue(newValue)
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Tools & Nodes
            </Typography>
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
        </Box>
    )
}

export default ToolsAndNodes 