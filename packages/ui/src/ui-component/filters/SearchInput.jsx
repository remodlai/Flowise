import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Box, InputAdornment, OutlinedInput } from '@mui/material'

// icons
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'

// ==============================|| SEARCH INPUT ||============================== //

export const SearchInput = ({ placeholder, onChange, searchTerm: externalSearchTerm }) => {
    const theme = useTheme()
    const [searchTerm, setSearchTerm] = useState(externalSearchTerm || '')

    useEffect(() => {
        if (externalSearchTerm !== undefined) {
            setSearchTerm(externalSearchTerm)
        }
    }, [externalSearchTerm])

    const handleChange = (event) => {
        const value = event.target.value
        setSearchTerm(value)
        onChange(value)
    }

    const handleClear = () => {
        setSearchTerm('')
        onChange('')
    }

    return (
        <Box sx={{ mb: 2, width: '100%' }}>
            <OutlinedInput
                value={searchTerm}
                onChange={handleChange}
                placeholder={placeholder || 'Search...'}
                fullWidth
                size="small"
                startAdornment={
                    <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                }
                endAdornment={
                    searchTerm && (
                        <InputAdornment 
                            position="end" 
                            sx={{ cursor: 'pointer' }}
                            onClick={handleClear}
                        >
                            <ClearIcon fontSize="small" color="action" />
                        </InputAdornment>
                    )
                }
                sx={{
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.dark.light : theme.palette.grey[50],
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.dark.light + 20 : theme.palette.grey[300]
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.light
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main
                    }
                }}
            />
        </Box>
    )
}

SearchInput.propTypes = {
    placeholder: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    searchTerm: PropTypes.string
}

// Also include a default export for backward compatibility
export default SearchInput 