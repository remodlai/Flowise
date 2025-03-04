import PropTypes from 'prop-types'
import { useState } from 'react'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Box, InputAdornment, OutlinedInput } from '@mui/material'

// icons
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'

// ==============================|| SEARCH INPUT ||============================== //

const SearchInput = ({ placeholder, onChange }) => {
    const theme = useTheme()
    const [searchTerm, setSearchTerm] = useState('')

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
        <Box sx={{ mb: 3, width: '100%' }}>
            <OutlinedInput
                value={searchTerm}
                onChange={handleChange}
                placeholder={placeholder || 'Search...'}
                fullWidth
                startAdornment={
                    <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                    </InputAdornment>
                }
                endAdornment={
                    searchTerm && (
                        <InputAdornment 
                            position="end" 
                            sx={{ cursor: 'pointer' }}
                            onClick={handleClear}
                        >
                            <ClearIcon fontSize="small" />
                        </InputAdornment>
                    )
                }
                sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? theme.palette.dark.light + 20 : theme.palette.grey[300]
                    }
                }}
            />
        </Box>
    )
}

SearchInput.propTypes = {
    placeholder: PropTypes.string,
    onChange: PropTypes.func.isRequired
}

export default SearchInput 