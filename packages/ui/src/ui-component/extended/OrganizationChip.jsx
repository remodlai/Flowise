import React from 'react'
import PropTypes from 'prop-types'
import { Chip, useTheme, alpha } from '@mui/material'

/**
 * A reusable organization chip component
 */
const OrganizationChip = ({
    name,
    label,
    color,
    size = 'small',
    variant = 'filled',
    sx = {}
}) => {
    const theme = useTheme()
    const isDark = theme.palette.mode === 'dark'
    
    // Use label prop if provided, otherwise use name prop
    const displayName = label || name
    
    // Generate a color based on the organization name if not provided
    const getOrgColor = (orgName) => {
        // If color prop is provided, use it
        if (color) return color
        
        // Predefined colors for common organizations
        const orgColors = {
            'remodl': '#2196f3',
            'acme': '#4caf50',
            'techcorp': '#ff9800',
            'default': '#9c27b0'
        }
        
        // Check if the org name contains any of the predefined keys
        const lowerOrgName = orgName.toLowerCase()
        for (const [key, value] of Object.entries(orgColors)) {
            if (lowerOrgName.includes(key)) {
                return value
            }
        }
        
        // If no match, use a hash function to generate a consistent color
        let hash = 0
        for (let i = 0; i < orgName.length; i++) {
            hash = orgName.charCodeAt(i) + ((hash << 5) - hash)
        }
        
        // Convert to hex color
        let colorHex = '#'
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF
            colorHex += ('00' + value.toString(16)).substr(-2)
        }
        
        return colorHex
    }
    
    const orgColor = getOrgColor(displayName)
    
    return (
        <Chip
            label={displayName}
            size={size}
            variant={variant}
            sx={{
                backgroundColor: variant === 'filled' ? 
                    (isDark ? alpha(orgColor, 0.15) : alpha(orgColor, 0.1)) : 
                    'transparent',
                color: isDark ? alpha(orgColor, 0.9) : orgColor,
                fontWeight: 500,
                borderRadius: '6px',
                border: variant === 'outlined' ? 
                    `1px solid ${isDark ? alpha(orgColor, 0.3) : alpha(orgColor, 0.2)}` : 
                    'none',
                ...sx
            }}
        />
    )
}

OrganizationChip.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
    color: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium']),
    variant: PropTypes.oneOf(['filled', 'outlined']),
    sx: PropTypes.object
}

// Ensure at least one of name or label is provided
OrganizationChip.defaultProps = {
    name: '',
    label: ''
}

export default OrganizationChip 