import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// SafeCodeBlock - A wrapper around CopyBlock that catches errors
const SafeCodeBlock = ({ Component, ...props }) => {
    const theme = useTheme()
    const [hasError, setHasError] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        // Set a small delay to ensure the component doesn't try to render immediately
        // This helps avoid some race conditions with syntax highlighter registration
        const timer = setTimeout(() => {
            setIsLoaded(true)
        }, 100)
        
        return () => clearTimeout(timer)
    }, [])

    if (hasError) {
        // Fallback UI when the code block fails to render
        return (
            <Box 
                sx={{ 
                    p: 2, 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    overflowX: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre',
                    color: theme.palette.text.primary
                }}
            >
                <pre style={{ margin: 0 }}>{props.text || props.children || props.value}</pre>
            </Box>
        )
    }

    // Only render the code block component if it's loaded
    if (!isLoaded) {
        return (
            <Box sx={{ p: 2, backgroundColor: theme.palette.background.paper }}>
                <Typography>Loading code...</Typography>
            </Box>
        )
    }

    // Try to render the component but catch any errors
    try {
        return <Component {...props} />
    } catch (error) {
        console.error('Error rendering code block:', error)
        setHasError(true)
        
        // Render fallback UI
        return (
            <Box 
                sx={{ 
                    p: 2, 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    overflowX: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre',
                    color: theme.palette.text.primary
                }}
            >
                <pre style={{ margin: 0 }}>{props.text || props.children || props.value}</pre>
            </Box>
        )
    }
}

SafeCodeBlock.propTypes = {
    Component: PropTypes.elementType.isRequired,
    text: PropTypes.string,
    children: PropTypes.node,
    value: PropTypes.string
}

export default SafeCodeBlock 