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
    FormControlLabel,
    Switch,
    CircularProgress
} from '@mui/material'
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react'
import { useSnackbar } from 'notistack'

// Import the platform API
import { getPlatformSettings, createPlatformSetting, updatePlatformSetting, deletePlatformSetting } from '@/api/platform'

const PlatformSettingsTab = () => {
    const [settings, setSettings] = useState([])
    const [loading, setLoading] = useState(true)
    const [openDialog, setOpenDialog] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [currentSetting, setCurrentSetting] = useState({
        id: '',
        key: '',
        value: '',
        description: '',
        is_encrypted: false
    })
    const { enqueueSnackbar } = useSnackbar()

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        setLoading(true)
        try {
            const response = await getPlatformSettings()
            
            // Check if response.data is an array, if not, make it an empty array
            if (Array.isArray(response.data)) {
                setSettings(response.data)
            } else if (response.data && Array.isArray(response.data.data)) {
                // Handle case where data is nested in a data property
                setSettings(response.data.data)
            } else {
                console.error('Unexpected response format:', response.data)
                setSettings([])
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
            enqueueSnackbar('Failed to fetch platform settings', { variant: 'error' })
            
            // Set empty array if error
            setSettings([])
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (setting = null) => {
        if (setting) {
            setCurrentSetting(setting)
            setEditMode(true)
        } else {
            setCurrentSetting({
                id: '',
                key: '',
                value: '',
                description: '',
                is_encrypted: false
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
        setCurrentSetting({
            ...currentSetting,
            [name]: value
        })
    }

    const handleSwitchChange = (e) => {
        setCurrentSetting({
            ...currentSetting,
            is_encrypted: e.target.checked
        })
    }

    const handleSaveSetting = async () => {
        try {
            if (!currentSetting.key || !currentSetting.value) {
                enqueueSnackbar('Key and value are required', { variant: 'error' })
                return
            }

            if (editMode) {
                await updatePlatformSetting(currentSetting.id, currentSetting)
                setSettings(settings.map(setting => 
                    setting.id === currentSetting.id ? currentSetting : setting
                ))
                enqueueSnackbar('Setting updated successfully', { variant: 'success' })
            } else {
                const response = await createPlatformSetting(currentSetting)
                setSettings([...settings, response.data])
                enqueueSnackbar('Setting created successfully', { variant: 'success' })
            }
            handleCloseDialog()
        } catch (error) {
            console.error('Error saving setting:', error)
            enqueueSnackbar('Failed to save setting', { variant: 'error' })
        }
    }

    const handleDeleteSetting = async (id) => {
        if (window.confirm('Are you sure you want to delete this setting?')) {
            try {
                await deletePlatformSetting(id)
                setSettings(settings.filter(setting => setting.id !== id))
                enqueueSnackbar('Setting deleted successfully', { variant: 'success' })
            } catch (error) {
                console.error('Error deleting setting:', error)
                enqueueSnackbar('Failed to delete setting', { variant: 'error' })
            }
        }
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Platform Settings</Typography>
                <Button
                    variant="contained"
                    startIcon={<IconPlus size={18} />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Setting
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
                                <TableCell>Key</TableCell>
                                <TableCell>Value</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Encrypted</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {settings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No settings found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                settings.map((setting) => (
                                    <TableRow key={setting.id}>
                                        <TableCell>{setting.key}</TableCell>
                                        <TableCell>{setting.value}</TableCell>
                                        <TableCell>{setting.description}</TableCell>
                                        <TableCell>{setting.is_encrypted ? 'Yes' : 'No'}</TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenDialog(setting)}
                                            >
                                                <IconEdit size={18} />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeleteSetting(setting.id)}
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
                <DialogTitle>{editMode ? 'Edit Setting' : 'Add Setting'}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        {editMode
                            ? 'Update the platform setting details below.'
                            : 'Enter the details for the new platform setting.'}
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="key"
                        label="Key"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={currentSetting.key}
                        onChange={handleInputChange}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        name="value"
                        label="Value"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={currentSetting.value}
                        onChange={handleInputChange}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        name="description"
                        label="Description"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={currentSetting.description}
                        onChange={handleInputChange}
                        sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={currentSetting.is_encrypted}
                                onChange={handleSwitchChange}
                                name="is_encrypted"
                            />
                        }
                        label="Encrypt Value"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSaveSetting} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default PlatformSettingsTab 