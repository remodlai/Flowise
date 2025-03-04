import PropTypes from 'prop-types'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Box, Chip, Stack, Typography } from '@mui/material'

// ==============================|| CATEGORY FILTER ||============================== //

const CategoryFilter = ({ categories, selectedCategory, onChange }) => {
    const theme = useTheme()

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Categories
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                    label="All"
                    clickable
                    color={selectedCategory === 'all' ? 'primary' : 'default'}
                    onClick={() => onChange('all')}
                    sx={{
                        mb: 1,
                        borderRadius: '16px',
                        '&:hover': {
                            background: selectedCategory !== 'all' ? (theme.palette.mode === 'dark' ? theme.palette.dark.dark : theme.palette.grey[100]) : ''
                        }
                    }}
                />
                {categories.map((category) => (
                    <Chip
                        key={category}
                        label={category}
                        clickable
                        color={selectedCategory === category ? 'primary' : 'default'}
                        onClick={() => onChange(category)}
                        sx={{
                            mb: 1,
                            borderRadius: '16px',
                            '&:hover': {
                                background: selectedCategory !== category ? (theme.palette.mode === 'dark' ? theme.palette.dark.dark : theme.palette.grey[100]) : ''
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

export default CategoryFilter 