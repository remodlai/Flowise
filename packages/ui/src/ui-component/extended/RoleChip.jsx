import React from 'react'
import PropTypes from 'prop-types'
import { Chip, useTheme } from '@mui/material'

/**
 * A component for displaying user roles as chips with appropriate styling
 */
const RoleChip = ({ role, size = 'small', variant = 'filled', sx = {} }) => {
    const theme = useTheme()
    const isDark = theme.palette.mode === 'dark'
    
    // Define role configurations with colors
    const roleConfigs = {
        Owner: {
            label: 'Owner',
            color: '#9c27b0', // purple
            darkBg: '#4a148c',
            darkColor: '#e1bee7'
        },
        Admin: {
            label: 'Admin',
            color: '#f44336', // red
            darkBg: '#b71c1c',
            darkColor: '#ffcdd2'
        },
        Manager: {
            label: 'Manager',
            color: '#ff9800', // orange
            darkBg: '#e65100',
            darkColor: '#ffe0b2'
        },
        Member: {
            label: 'Member',
            color: '#2196f3', // blue
            darkBg: '#0d47a1',
            darkColor: '#bbdefb'
        },
        Guest: {
            label: 'Guest',
            color: '#757575', // grey
            darkBg: '#424242',
            darkColor: '#e0e0e0'
        },
        Viewer: {
            label: 'Viewer',
            color: '#4caf50', // green
            darkBg: '#1b5e20',
            darkColor: '#c8e6c9'
        }
    }
    
    // Get role config or use a default
    const roleConfig = roleConfigs[role] || {
        label: role,
        color: '#757575',
        darkBg: '#424242',
        darkColor: '#e0e0e0'
    }
    
    // Determine styles based on variant and theme
    const getChipStyle = () => {
        if (variant === 'outlined') {
            return {
                color: isDark ? roleConfig.darkColor : roleConfig.color,
                borderColor: isDark ? roleConfig.darkColor : roleConfig.color,
                backgroundColor: 'transparent'
            }
        }
        
        return {
            color: '#fff',
            backgroundColor: isDark ? roleConfig.darkBg : roleConfig.color
        }
    }
    
    return (
        <Chip 
            label={roleConfig.label}
            size={size}
            variant={variant}
            sx={{
                fontWeight: 500,
                ...getChipStyle(),
                ...sx
            }}
        />
    )
}

RoleChip.propTypes = {
    role: PropTypes.string.isRequired,
    size: PropTypes.oneOf(['small', 'medium']),
    variant: PropTypes.oneOf(['filled', 'outlined']),
    sx: PropTypes.object
}

export default RoleChip 