import PropTypes from 'prop-types'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Box, Chip, Stack, Typography } from '@mui/material'

// ==============================|| CATEGORY FILTER ||============================== //

export const CategoryFilter = ({ categories, selectedCategory, onChange }) => {
    const theme = useTheme()

    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ mb: 1.5 }}>
                Categories
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {categories.map((category) => (
                    <Chip
                        key={category}
                        label={category}
                        clickable
                        color={selectedCategory === category ? 'primary' : 'default'}
                        onClick={() => onChange(category)}
                        sx={{
                            mb: 1,
                            borderRadius: '12px',
                            backgroundColor: selectedCategory === category 
                                ? theme.palette.primary.main 
                                : theme.palette.mode === 'dark' ? theme.palette.dark.light : theme.palette.grey[200],
                            color: selectedCategory === category 
                                ? theme.palette.primary.contrastText 
                                : theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.grey[900],
                            '&:hover': {
                                backgroundColor: selectedCategory !== category 
                                    ? theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.grey[300]
                                    : theme.palette.primary.dark
                            }
                        }}
                    />
                ))}
            </Stack>
        </Box>
    )
}

CategoryFilter.propTypes = {
    categories: PropTypes.array.isRequired,
    selectedCategory: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
}

// Also include a default export for backward compatibility
export default CategoryFilter 