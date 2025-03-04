import PropTypes from 'prop-types'
import { useState } from 'react'

// material-ui
import { useTheme } from '@mui/material/styles'
import {
    Card,
    CardContent,
    Grid,
    Stack,
    Switch,
    Typography,
    Tooltip,
    IconButton
} from '@mui/material'

// project imports
import Avatar from '../extended/Avatar'

// icons
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'

// ==============================|| TOOL TOGGLE CARD ||============================== //

const ToolToggleCard = ({ tool, onToggle, disabled = false }) => {
    const theme = useTheme()
    const [isEnabled, setIsEnabled] = useState(tool.enabled)

    const handleToggle = () => {
        if (disabled) return
        
        const newState = !isEnabled
        setIsEnabled(newState)
        onToggle(tool.name, newState)
    }

    return (
        <Card
            sx={{
                p: 2,
                background: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.grey[50],
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'transparent' : theme.palette.grey[100],
                '&:hover': {
                    borderColor: theme.palette.primary.main
                },
                height: '100%'
            }}
        >
            <CardContent sx={{ p: 0 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        background: theme.palette.mode === 'dark' ? theme.palette.dark.dark : theme.palette.grey[100],
                                        color: theme.palette.primary.main
                                    }}
                                    size="sm"
                                >
                                    <BuildOutlinedIcon fontSize="small" />
                                </Avatar>
                                <Stack spacing={0}>
                                    <Typography variant="h5" sx={{ fontWeight: 500 }}>
                                        {tool.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {tool.category}
                                    </Typography>
                                </Stack>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                {tool.description && (
                                    <Tooltip title={tool.description} placement="top">
                                        <IconButton size="small">
                                            <InfoOutlinedIcon sx={{ fontSize: '1.1rem', color: theme.palette.text.secondary }} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                <Switch
                                    checked={isEnabled}
                                    onChange={handleToggle}
                                    disabled={disabled}
                                    color="primary"
                                    inputProps={{ 'aria-label': 'toggle tool visibility' }}
                                />
                            </Stack>
                        </Stack>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}

ToolToggleCard.propTypes = {
    tool: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired,
    disabled: PropTypes.bool
}

export default ToolToggleCard 