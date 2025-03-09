import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    CircularProgress,
    Tooltip,
    InputAdornment
} from '@mui/material'
import { IconEdit, IconTrash, IconPlus, IconEye, IconEyeOff, IconCopy } from '@tabler/icons-react'
import { useSnackbar } from 'notistack'

// Import the platform API
import { getSecrets, createSecret, updateSecret, deleteSecret } from '@/api/platform'

const SecretsTab = () => {
    const [secrets, setSecrets] = useState([])
    const [loading, setLoading] = useState(true)
    const [openDialog, setOpenDialog] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [currentSecret, setCurrentSecret] = useState({
        id: '',
        name: '',
        type: 'api_key',
        value: '',
        metadata: {}
    })
    const [visibleSecrets, setVisibleSecrets] = useState({})
    const { enqueueSnackbar } = useSnackbar()

    useEffect(() => {
        fetchSecrets()
    }, [])

    const fetchSecrets = async () => {
        setLoading(true)
        try {
            const response = await getSecrets()
            
            // Check if response.data is an array, if not, make it an empty array
            if (Array.isArray(response.data)) {
                setSecrets(response.data)
            } else if (response.data && Array.isArray(response.data.data)) {
                // Handle case where data is nested in a data property
                setSecrets(response.data.data)
            } else {
                console.error('Unexpected response format:', response.data)
                setSecrets([])
            }
        } catch (error) {
            console.error('Error fetching secrets:', error)
            enqueueSnackbar('Failed to fetch secrets', { variant: 'error' })
            
            // Set empty array if error
            setSecrets([])
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (secret = null) => {
        if (secret) {
            setCurrentSecret(secret)
            setEditMode(true)
        } else {
            setCurrentSecret({
                id: '',
                name: '',
                type: 'api_key',
                value: '',
                metadata: {}
            })
            setEditMode(false)
        }
        setOpenDialog(true)
    }

    const handleCloseDialog = () => {
        setOpenDialog(false)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setCurrentSecret({
            ...currentSecret,
            [name]: value
        })
    }

    const handleMetadataChange = (e) => {
        const { name, value } = e.target
        setCurrentSecret({
            ...currentSecret,
            metadata: {
                ...currentSecret.metadata,
                [name]: value
            }
        })
    }

    const handleSaveSecret = async () => {
        try {
            if (!currentSecret.name || !currentSecret.value) {
                enqueueSnackbar('Name and value are required', { variant: 'error' })
                return
            }

            if (editMode) {
                await updateSecret(currentSecret.id, currentSecret)
                setSecrets(secrets.map(secret => 
                    secret.id === currentSecret.id ? currentSecret : secret
                ))
                enqueueSnackbar('Secret updated successfully', { variant: 'success' })
            } else {
                const response = await createSecret(currentSecret)
                setSecrets([...secrets, response.data])
                enqueueSnackbar('Secret created successfully', { variant: 'success' })
            }
            handleCloseDialog()
        } catch (error) {
            console.error('Error saving secret:', error)
            enqueueSnackbar('Failed to save secret', { variant: 'error' })
        }
    }

    const handleDeleteSecret = async (id) => {
        if (window.confirm('Are you sure you want to delete this secret?')) {
            try {
                await deleteSecret(id)
                setSecrets(secrets.filter(secret => secret.id !== id))
                enqueueSnackbar('Secret deleted successfully', { variant: 'success' })
            } catch (error) {
                console.error('Error deleting secret:', error)
                enqueueSnackbar('Failed to delete secret', { variant: 'error' })
            }
        }
    }

    const toggleSecretVisibility = (id) => {
        setVisibleSecrets({
            ...visibleSecrets,
            [id]: !visibleSecrets[id]
        })
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        enqueueSnackbar('Copied to clipboard', { variant: 'success' })
    }

    const maskSecret = (value) => {
        if (!value) return ''
        const firstFour = value.substring(0, 4)
        const lastFour = value.substring(value.length - 4)
        return `${firstFour}...${lastFour}`
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Secrets</Typography>
                <Button
                    variant="contained"
                    startIcon={<IconPlus size={18} />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Secret
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Value</TableCell>
                                <TableCell>Key Name</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {secrets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No secrets found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                secrets.map((secret) => (
                                    <TableRow key={secret.id}>
                                        <TableCell>{secret.name}</TableCell>
                                        <TableCell>{secret.type}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {visibleSecrets[secret.id] ? secret.value : maskSecret(secret.value)}
                                                <Tooltip title={visibleSecrets[secret.id] ? "Hide" : "Show"}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => toggleSecretVisibility(secret.id)}
                                                    >
                                                        {visibleSecrets[secret.id] ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Copy">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => copyToClipboard(secret.value)}
                                                    >
                                                        <IconCopy size={18} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{secret.metadata?.keyName || '-'}</TableCell>
                                        <TableCell>
                                            {new Date(secret.metadata?.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenDialog(secret)}
                                            >
                                                <IconEdit size={18} />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeleteSecret(secret.id)}
                                            >
                                                <IconTrash size={18} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editMode ? 'Edit Secret' : 'Add Secret'}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        {editMode
                            ? 'Update the secret details below.'
                            : 'Enter the details for the new secret.'}
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="name"
                        label="Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={currentSecret.name}
                        onChange={handleInputChange}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        name="type"
                        label="Type"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={currentSecret.type}
                        onChange={handleInputChange}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        name="value"
                        label="Value"
                        type={visibleSecrets['current'] ? 'text' : 'password'}
                        fullWidth
                        variant="outlined"
                        value={currentSecret.value}
                        onChange={handleInputChange}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => toggleSecretVisibility('current')}
                                        edge="end"
                                    >
                                        {visibleSecrets['current'] ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        name="keyName"
                        label="Key Name (for API credentials)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={currentSecret.metadata?.keyName || ''}
                        onChange={handleMetadataChange}
                        sx={{ mb: 2 }}
                        helperText="This is the name used to reference this credential in the API"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSaveSecret} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default SecretsTab 