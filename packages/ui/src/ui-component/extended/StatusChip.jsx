import React from 'react'
import PropTypes from 'prop-types'
import { Chip, useTheme } from '@mui/material'

/**
 * A reusable status chip component with predefined status types
 */
const StatusChip = ({
    status,
    customStatuses,
    size = 'small',
    variant = 'filled',
    sx = {}
}) => {
    const theme = useTheme()
    const isDark = theme.palette.mode === 'dark'
    
    // Default status configurations
    const defaultStatuses = {
        active: {
            label: 'Active',
            color: 'success',
            darkBg: 'rgba(76, 175, 80, 0.15)',
            darkColor: '#81c784'
        },
        inactive: {
            label: 'Inactive',
            color: 'error',
            darkBg: 'rgba(244, 67, 54, 0.15)',
            darkColor: '#e57373'
        },
        pending: {
            label: 'Pending',
            color: 'warning',
            darkBg: 'rgba(255, 152, 0, 0.15)',
            darkColor: '#ffb74d'
        },
        blocked: {
            label: 'Blocked',
            color: 'error',
            darkBg: 'rgba(244, 67, 54, 0.15)',
            darkColor: '#e57373'
        },
        approved: {
            label: 'Approved',
            color: 'success',
            darkBg: 'rgba(76, 175, 80, 0.15)',
            darkColor: '#81c784'
        },
        rejected: {
            label: 'Rejected',
            color: 'error',
            darkBg: 'rgba(244, 67, 54, 0.15)',
            darkColor: '#e57373'
        },
        draft: {
            label: 'Draft',
            color: 'default',
            darkBg: 'rgba(255, 255, 255, 0.08)',
            darkColor: 'rgba(255, 255, 255, 0.7)'
        },
        published: {
            label: 'Published',
            color: 'success',
            darkBg: 'rgba(76, 175, 80, 0.15)',
            darkColor: '#81c784'
        }
    }
    
    // Merge default statuses with custom statuses
    const allStatuses = { ...defaultStatuses, ...customStatuses }
    
    // Get status config or use a default
    const statusKey = status?.toLowerCase() || 'default'
    const statusConfig = allStatuses[statusKey] || {
        label: status || 'Unknown',
        color: 'default',
        darkBg: 'rgba(255, 255, 255, 0.08)',
        darkColor: 'rgba(255, 255, 255, 0.7)'
    }
    
    return (
        <Chip 
            label={statusConfig.label}
            size={size}
            color={statusConfig.color}
            variant={variant}
            sx={{ 
                minWidth: 75,
                borderRadius: '6px',
                fontWeight: 500,
                '& .MuiChip-label': { px: 1 },
                backgroundColor: isDark && variant === 'filled' ? statusConfig.darkBg : undefined,
                color: isDark && variant === 'filled' ? statusConfig.darkColor : undefined,
                ...sx
            }}
        />
    )
}

StatusChip.propTypes = {
    status: PropTypes.string.isRequired,
    customStatuses: PropTypes.object,
    size: PropTypes.oneOf(['small', 'medium']),
    variant: PropTypes.oneOf(['filled', 'outlined']),
    sx: PropTypes.object
}

export default StatusChip 