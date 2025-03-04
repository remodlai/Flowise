import PropTypes from 'prop-types'
import { useState } from 'react'

// material-ui
import { useTheme } from '@mui/material/styles'
import {
    Box,
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

// ==============================|| NODE TOGGLE CARD ||============================== //

const NodeToggleCard = ({ node, onToggle, disabled = false }) => {
    const theme = useTheme()
    const [isEnabled, setIsEnabled] = useState(node.enabled)

    const handleToggle = () => {
        if (disabled) return
        
        const newState = !isEnabled
        setIsEnabled(newState)
        onToggle(node.name, newState)
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
                                {node.icon ? (
                                    <Avatar
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            background: theme.palette.mode === 'dark' ? theme.palette.dark.dark : theme.palette.grey[100],
                                            color: theme.palette.primary.main
                                        }}
                                        size="sm"
                                    >
                                        <img src={node.icon} alt={node.name} style={{ width: '60%', height: '60%' }} />
                                    </Avatar>
                                ) : (
                                    <Avatar
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            background: theme.palette.mode === 'dark' ? theme.palette.dark.dark : theme.palette.grey[100],
                                            color: theme.palette.primary.main
                                        }}
                                        size="sm"
                                    >
                                        {node.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                )}
                                <Stack spacing={0}>
                                    <Typography variant="h5" sx={{ fontWeight: 500 }}>
                                        {node.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {node.category}
                                    </Typography>
                                </Stack>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                {node.description && (
                                    <Tooltip title={node.description} placement="top">
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
                                    inputProps={{ 'aria-label': 'toggle node visibility' }}
                                />
                            </Stack>
                        </Stack>
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {node.tags && node.tags.map((tag, index) => (
                                <Chip
                                    key={index}
                                    label={tag}
                                    size="small"
                                    sx={{
                                        background: theme.palette.mode === 'dark' ? theme.palette.dark.dark : theme.palette.grey[100],
                                        color: theme.palette.text.secondary
                                    }}
                                />
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}

NodeToggleCard.propTypes = {
    node: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired,
    disabled: PropTypes.bool
}

export default NodeToggleCard 