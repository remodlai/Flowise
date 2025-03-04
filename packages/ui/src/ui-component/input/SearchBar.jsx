import React from 'react'
import PropTypes from 'prop-types'
import { TextField, InputAdornment, IconButton, useTheme, alpha } from '@mui/material'
import { IconSearch, IconX } from '@tabler/icons-react'

/**
 * A reusable search bar component
 */
const SearchBar = ({
    placeholder = 'Search...',
    value,
    onChange,
    onClear,
    startIcon = <IconSearch size={20} stroke={1.5} />,
    sx = {}
}) => {
    const theme = useTheme()
    const isDark = theme.palette.mode === 'dark'

    return (
        <TextField
            placeholder={placeholder}
            variant="outlined"
            size="small"
            fullWidth
            value={value}
            onChange={onChange}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        {React.cloneElement(startIcon, {
                            color: isDark ? 'rgba(255, 255, 255, 0.7)' : undefined
                        })}
                    </InputAdornment>
                ),
                endAdornment: value ? (
                    <InputAdornment position="end">
                        <IconButton 
                            size="small" 
                            onClick={onClear}
                            sx={{ 
                                color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary',
                                '&:hover': {
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : undefined
                                }
                            }}
                        >
                            <IconX size={16} stroke={1.5} />
                        </IconButton>
                    </InputAdornment>
                ) : null
            }}
            sx={{ 
                '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: isDark ? 
                        alpha(theme.palette.background.paper, 0.8) : 
                        theme.palette.background.paper
                },
                ...sx
            }}
        />
    )
}

SearchBar.propTypes = {
    placeholder: PropTypes.string,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    startIcon: PropTypes.node,
    sx: PropTypes.object
}

export default SearchBar 