import React from 'react'
import PropTypes from 'prop-types'
import { Chip, useTheme } from '@mui/material'

/**
 * A reusable role chip component with predefined role types
 */
const RoleChip = ({
    role,
    customRoles,
    size = 'small',
    variant = 'outlined',
    sx = {}
}) => {
    const theme = useTheme()
    const isDark = theme.palette.mode === 'dark'
    
    // Default role configurations
    const defaultRoles = {
        admin: {
            label: 'Admin',
            color: 'primary',
            darkBg: 'rgba(33, 150, 243, 0.15)',
            darkColor: '#90caf9',
            darkBorder: 'rgba(33, 150, 243, 0.5)'
        },
        owner: {
            label: 'Owner',
            color: 'secondary',
            darkBg: 'rgba(156, 39, 176, 0.15)',
            darkColor: '#ce93d8',
            darkBorder: 'rgba(156, 39, 176, 0.5)'
        },
        editor: {
            label: 'Editor',
            color: 'info',
            darkBg: 'rgba(3, 169, 244, 0.15)',
            darkColor: '#81d4fa',
            darkBorder: 'rgba(3, 169, 244, 0.5)'
        },
        user: {
            label: 'User',
            color: 'default',
            darkBg: 'rgba(255, 255, 255, 0.08)',
            darkColor: 'rgba(255, 255, 255, 0.7)',
            darkBorder: 'rgba(255, 255, 255, 0.15)'
        },
        viewer: {
            label: 'Viewer',
            color: 'default',
            darkBg: 'rgba(255, 255, 255, 0.08)',
            darkColor: 'rgba(255, 255, 255, 0.7)',
            darkBorder: 'rgba(255, 255, 255, 0.15)'
        },
        guest: {
            label: 'Guest',
            color: 'default',
            darkBg: 'rgba(255, 255, 255, 0.08)',
            darkColor: 'rgba(255, 255, 255, 0.7)',
            darkBorder: 'rgba(255, 255, 255, 0.15)'
        }
    }
    
    // Merge default roles with custom roles
    const allRoles = { ...defaultRoles, ...customRoles }
    
    // Get role config or use a default
    const roleKey = role?.toLowerCase() || 'default'
    const roleConfig = allRoles[roleKey] || {
        label: role || 'Unknown',
        color: 'default',
        darkBg: 'rgba(255, 255, 255, 0.08)',
        darkColor: 'rgba(255, 255, 255, 0.7)',
        darkBorder: 'rgba(255, 255, 255, 0.15)'
    }
    
    return (
        <Chip 
            label={roleConfig.label}
            size={size}
            color={roleConfig.color}
            variant={variant}
            sx={{ 
                borderRadius: '6px',
                fontWeight: 500,
                backgroundColor: variant === 'filled' && isDark ? roleConfig.darkBg : undefined,
                color: isDark ? 
                    (variant === 'filled' ? roleConfig.darkColor : roleConfig.darkColor) : 
                    undefined,
                borderColor: variant === 'outlined' && isDark ? roleConfig.darkBorder : undefined,
                ...sx
            }}
        />
    )
}

RoleChip.propTypes = {
    role: PropTypes.string.isRequired,
    customRoles: PropTypes.object,
    size: PropTypes.oneOf(['small', 'medium']),
    variant: PropTypes.oneOf(['filled', 'outlined']),
    sx: PropTypes.object
}

export default RoleChip 