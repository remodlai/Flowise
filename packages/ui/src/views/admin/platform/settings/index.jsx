import React, { useState } from 'react'
import { Typography, Box, Tabs, Tab, Paper } from '@mui/material'
import PlatformSettingsTab from './PlatformSettingsTab'
import SecretsTab from './SecretsTab'

const SystemSettings = () => {
    const [activeTab, setActiveTab] = useState(0)

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                System Settings
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
                Configure global platform settings and manage secrets.
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab label="Platform Settings" />
                    <Tab label="Secrets" />
                </Tabs>
            </Paper>

            {activeTab === 0 && <PlatformSettingsTab />}
            {activeTab === 1 && <SecretsTab />}
        </Box>
    )
}

export default SystemSettings 