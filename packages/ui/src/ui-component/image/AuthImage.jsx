import { useState, useEffect } from 'react'
import { CircularProgress, Typography, Box } from '@mui/material'

/**
 * AuthImage Component
 * 
 * A component that loads images with authentication headers
 * Especially useful for protected routes like node icons
 * 
 * @param {Object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {Object} props.alt - Alt text for the image
 * @param {Object} props.sx - MUI sx prop for styling
 * @param {Object} props.imgProps - Props to pass to the img element
 */
const AuthImage = ({ src, alt = '', sx = {}, imgProps = {}, ...rest }) => {
  const [imageSrc, setImageSrc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    if (!src) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    // Get auth token
    const token = localStorage.getItem('access_token')
    
    fetch(src, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.status}`)
        }
        return response.blob()
      })
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob)
        setImageSrc(objectUrl)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading authenticated image:', err)
        setError(err.message)
        setLoading(false)
      })
      
    // Cleanup function to revoke object URL
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc)
      }
    }
  }, [src])
  
  if (loading) {
    return (
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        sx={{ ...sx, minHeight: '40px', minWidth: '40px' }}
        {...rest}
      >
        <CircularProgress size={20} />
      </Box>
    )
  }
  
  if (error) {
    return (
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        sx={{ ...sx, minHeight: '40px', minWidth: '40px' }}
        {...rest}
      >
        <Typography variant="caption" color="error">
          !
        </Typography>
      </Box>
    )
  }
  
  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      style={{ ...sx }}
      {...imgProps}
      {...rest}
    />
  )
}

export default AuthImage 