import PropTypes from 'prop-types'
import { useState } from 'react'

// material-ui
import { useTheme } from '@mui/material/styles'
import {
    Card,
    CardContent,
    Chip,
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

const ToolToggleCard = ({ tool, enabled, onToggle }) => {
    const theme = useTheme()
    const [isEnabled, setIsEnabled] = useState(enabled)

    const handleToggle = () => {
        const newState = !isEnabled
        setIsEnabled(newState)
        onToggle(tool.name, newState)
    }

    return (
        <Card
            sx={{
                p: 0,
                background: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.grey[50],
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'transparent' : theme.palette.grey[200],
                borderRadius: 2,
                boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
                '&:hover': {
                    borderColor: theme.palette.secondary.light,
                    boxShadow: theme.palette.mode === 'dark' ? '0 6px 16px rgba(0,0,0,0.3)' : '0 6px 16px rgba(0,0,0,0.1)'
                },
                transition: 'all 0.3s ease-in-out'
            }}
        >
            <CardContent sx={{ p: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar
                                    color="secondary"
                                    size="md"
                                    outline
                                    sx={{
                                        background: theme.palette.mode === 'dark' ? theme.palette.dark.dark : theme.palette.grey[100]
                                    }}
                                >
                                    {tool.icon || <BuildOutlinedIcon fontSize="small" />}
                                </Avatar>
                                <Stack spacing={0.5}>
                                    <Typography variant="h5" color="inherit">
                                        {tool.label || tool.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {tool.description || 'No description available'}
                                    </Typography>
                                </Stack>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                {tool.category && (
                                    <Chip
                                        label={tool.category}
                                        size="small"
                                        sx={{
                                            background: theme.palette.mode === 'dark' ? theme.palette.dark.dark : theme.palette.grey[100],
                                            borderRadius: '12px',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                )}
                                <Tooltip title="More information" arrow placement="top">
                                    <IconButton size="small" color="secondary">
                                        <InfoOutlinedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Switch
                                    checked={isEnabled}
                                    onChange={handleToggle}
                                    color="secondary"
                                    size="small"
                                    inputProps={{ 'aria-label': 'toggle tool' }}
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
    enabled: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired
}

export default ToolToggleCard 