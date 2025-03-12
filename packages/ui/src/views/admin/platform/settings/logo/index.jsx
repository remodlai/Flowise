/**
 * Platform Logo Manager
 * 
 * This component allows platform admins to upload, view, and manage platform logos.
 * It's a basic test implementation for Supabase Storage integration.
 * 
 * CURRENT IMPLEMENTATION:
 * - Simple upload and display functionality
 * - Basic permission checking
 * - Soft delete and restore functionality
 * 
 * FUTURE ENHANCEMENTS:
 * - Support for multiple logos (different sizes, formats)
 * - Image cropping and resizing
 * - Better organization with virtual paths
 */
import React, { useState, useEffect, useRef } from 'react'
import {
    Box,
    Typography,
    Button,
    Paper,
    CircularProgress,
    TextField,
    IconButton,
    Divider,
    Alert,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Tooltip
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { IconUpload, IconDownload, IconTrash, IconArrowBack, IconRefresh } from '@tabler/icons-react'
import { useSnackbar } from 'notistack'

// Import platform API functions
import {
    listPlatformImages,
    uploadPlatformImage,
    deletePlatformImage,
    restorePlatformImage,
    getPlatformImageUrl,
    getPlatformImageContentUrl
} from '@/api/platform'

const LogoManager = () => {
    const [logos, setLogos] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [description, setDescription] = useState('')
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)
    const navigate = useNavigate()
    const { enqueueSnackbar } = useSnackbar()

    useEffect(() => {
        fetchLogos()
    }, [])

    const fetchLogos = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await listPlatformImages({
                contextType: 'platform',
                includeDeleted: true // Show deleted logos for admins
            })
            
            // Filter to only show logos (path starts with 'logos/')
            const logoImages = response.data?.data?.filter(img => 
                img.path.startsWith('logos/') || 
                img.virtual_path?.startsWith('logos/')
            ) || []
            
            setLogos(logoImages)
        } catch (error) {
            console.error('Error fetching logos:', error)
            setError('Failed to fetch logos. Please try again.')
            enqueueSnackbar('Failed to fetch logos', { variant: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (PNG, JPEG, WebP, SVG)')
            enqueueSnackbar('Invalid file type. Please select an image.', { variant: 'error' })
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size exceeds 5MB limit')
            enqueueSnackbar('File size exceeds 5MB limit', { variant: 'error' })
            return
        }

        setUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('contextType', 'platform')
            formData.append('description', description || `Platform logo: ${file.name}`)
            formData.append('isPublic', 'true')
            formData.append('isShareable', 'true')
            formData.append('virtualPath', 'logos')

            const response = await uploadPlatformImage(formData)
            
            if (response.data?.success) {
                enqueueSnackbar('Logo uploaded successfully', { variant: 'success' })
                setDescription('')
                await fetchLogos() // Refresh the list
            } else {
                throw new Error(response.data?.message || 'Upload failed')
            }
        } catch (error) {
            console.error('Error uploading logo:', error)
            setError('Failed to upload logo. Please try again.')
            enqueueSnackbar('Failed to upload logo', { variant: 'error' })
        } finally {
            setUploading(false)
            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDeleteLogo = async (id) => {
        if (!window.confirm('Are you sure you want to delete this logo?')) return

        try {
            const response = await deletePlatformImage(id)
            
            if (response.data?.success) {
                enqueueSnackbar('Logo deleted successfully', { variant: 'success' })
                // Update the logo in the state to show as deleted
                setLogos(logos.map(logo => 
                    logo.id === id ? { ...logo, is_deleted: true } : logo
                ))
            } else {
                throw new Error(response.data?.message || 'Delete failed')
            }
        } catch (error) {
            console.error('Error deleting logo:', error)
            enqueueSnackbar('Failed to delete logo', { variant: 'error' })
        }
    }

    const handleRestoreLogo = async (id) => {
        try {
            const response = await restorePlatformImage(id)
            
            if (response.data?.success) {
                enqueueSnackbar('Logo restored successfully', { variant: 'success' })
                // Update the logo in the state to show as not deleted
                setLogos(logos.map(logo => 
                    logo.id === id ? { ...logo, is_deleted: false } : logo
                ))
            } else {
                throw new Error(response.data?.message || 'Restore failed')
            }
        } catch (error) {
            console.error('Error restoring logo:', error)
            enqueueSnackbar('Failed to restore logo', { variant: 'error' })
        }
    }

    const handleDownloadLogo = async (id, name) => {
        try {
            // Get the content URL
            const contentUrl = getPlatformImageContentUrl(id)
            
            // Create a temporary link and trigger download
            const link = document.createElement('a')
            link.href = contentUrl
            link.download = name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Error downloading logo:', error)
            enqueueSnackbar('Failed to download logo', { variant: 'error' })
        }
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/admin/platform/settings')} sx={{ mr: 1 }}>
                    <IconArrowBack />
                </IconButton>
                <Typography variant="h4">Manage Platform Logo</Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 3 }}>
                Upload and manage logos for the platform. These logos can be used in various parts of the UI.
            </Typography>

            {/* Upload Section */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Upload New Logo
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Supported formats: PNG, JPEG, WebP, SVG. Maximum size: 5MB.
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        label="Description"
                        variant="outlined"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter a description for this logo"
                        disabled={uploading}
                        sx={{ mb: 2 }}
                    />
                    
                    <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    
                    <Button
                        variant="contained"
                        startIcon={uploading ? <CircularProgress size={20} /> : <IconUpload />}
                        onClick={handleUploadClick}
                        disabled={uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                </Box>
                
                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </Paper>

            {/* Logos Display Section */}
            <Typography variant="h6" gutterBottom>
                Platform Logos
            </Typography>
            
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : logos.length === 0 ? (
                <Alert severity="info">
                    No logos have been uploaded yet. Use the form above to upload your first logo.
                </Alert>
            ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {logos.map((logo) => (
                        <Card 
                            key={logo.id} 
                            sx={{ 
                                width: 250,
                                opacity: logo.is_deleted ? 0.6 : 1,
                                position: 'relative'
                            }}
                        >
                            {logo.is_deleted && (
                                <Box 
                                    sx={{ 
                                        position: 'absolute', 
                                        top: 0, 
                                        left: 0, 
                                        right: 0, 
                                        bottom: 0, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        zIndex: 1
                                    }}
                                >
                                    <Typography variant="body1" color="white" fontWeight="bold">
                                        DELETED
                                    </Typography>
                                </Box>
                            )}
                            <CardMedia
                                component="img"
                                height="140"
                                image={getPlatformImageContentUrl(logo.id)}
                                alt={logo.description || logo.name}
                                sx={{ objectFit: 'contain', p: 1 }}
                            />
                            <CardContent>
                                <Typography variant="subtitle1" noWrap>
                                    {logo.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" noWrap>
                                    {logo.description || 'No description'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" display="block">
                                    {new Date(logo.created_at).toLocaleString()}
                                </Typography>
                            </CardContent>
                            <Divider />
                            <CardActions>
                                {logo.is_deleted ? (
                                    <Tooltip title="Restore">
                                        <IconButton 
                                            color="primary" 
                                            onClick={() => handleRestoreLogo(logo.id)}
                                        >
                                            <IconRefresh size={20} />
                                        </IconButton>
                                    </Tooltip>
                                ) : (
                                    <>
                                        <Tooltip title="Download">
                                            <IconButton 
                                                color="primary" 
                                                onClick={() => handleDownloadLogo(logo.id, logo.name)}
                                            >
                                                <IconDownload size={20} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton 
                                                color="error" 
                                                onClick={() => handleDeleteLogo(logo.id)}
                                            >
                                                <IconTrash size={20} />
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )}
                            </CardActions>
                        </Card>
                    ))}
                </Box>
            )}
        </Box>
    )
}

export default LogoManager 