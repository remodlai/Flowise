import React from 'react'
import PropTypes from 'prop-types'
import { Avatar, Box, Typography, useTheme } from '@mui/material'

/**
 * A reusable user avatar component with optional name and subtitle
 */
const UserAvatar = ({
    name,
    subtitle,
    src,
    color,
    size = 'medium',
    showInfo = true,
    sx = {}
}) => {
    const theme = useTheme()
    const isDark = theme.palette.mode === 'dark'
    
    // Size presets
    const sizeMap = {
        small: { avatar: 32, fontSize: '0.8rem' },
        medium: { avatar: 40, fontSize: '1rem' },
        large: { avatar: 48, fontSize: '1.2rem' }
    }
    
    const avatarSize = typeof size === 'string' ? sizeMap[size]?.avatar || 40 : size
    const fontSize = typeof size === 'string' ? sizeMap[size]?.fontSize || '1rem' : '1rem'
    
    // Get initials from name
    const getInitials = (name) => {
        if (!name) return '?'
        const parts = name.split(' ')
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }
    
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
            <Avatar 
                src={src}
                sx={{ 
                    width: avatarSize, 
                    height: avatarSize, 
                    mr: showInfo && (name || subtitle) ? 1.5 : 0,
                    bgcolor: color || theme.palette.primary.main,
                    fontWeight: 600,
                    fontSize: fontSize
                }}
            >
                {!src && name && getInitials(name)}
            </Avatar>
            
            {showInfo && (name || subtitle) && (
                <Box>
                    {name && (
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                fontWeight: 600,
                                color: isDark ? '#fff' : 'inherit',
                                lineHeight: subtitle ? 1.2 : 'inherit'
                            }}
                        >
                            {name}
                        </Typography>
                    )}
                    {subtitle && (
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary',
                                display: 'block'
                            }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    )
}

UserAvatar.propTypes = {
    name: PropTypes.string,
    subtitle: PropTypes.string,
    src: PropTypes.string,
    color: PropTypes.string,
    size: PropTypes.oneOfType([
        PropTypes.oneOf(['small', 'medium', 'large']),
        PropTypes.number
    ]),
    showInfo: PropTypes.bool,
    sx: PropTypes.object
}

export default UserAvatar 