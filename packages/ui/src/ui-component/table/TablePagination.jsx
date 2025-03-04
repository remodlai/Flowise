import React from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, IconButton, useTheme } from '@mui/material'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

/**
 * A custom table pagination component
 */
const TablePagination = ({
    count,
    page,
    rowsPerPage,
    rowsPerPageOptions = [5, 10, 25],
    onPageChange,
    onRowsPerPageChange,
    labelRowsPerPage = 'Rows per page:',
    sx = {}
}) => {
    const theme = useTheme()
    const isDark = theme.palette.mode === 'dark'
    
    const from = count === 0 ? 0 : page * rowsPerPage + 1
    const to = Math.min((page + 1) * rowsPerPage, count)
    
    return (
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            px: 3, 
            py: 1.5,
            mt: 'auto',
            borderTop: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'divider',
            ...sx
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography 
                    variant="body2"
                    sx={{ 
                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'
                    }}
                >
                    {labelRowsPerPage}
                </Typography>
                <select 
                    value={rowsPerPage}
                    onChange={onRowsPerPageChange}
                    style={{ 
                        marginLeft: 8, 
                        padding: '4px 8px', 
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)',
                        borderRadius: 6,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                        color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'inherit'
                    }}
                >
                    {rowsPerPageOptions.map(option => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography 
                    variant="body2" 
                    sx={{ 
                        mr: 2,
                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'
                    }}
                >
                    {from}-{to} of {count}
                </Typography>
                <IconButton 
                    size="small" 
                    onClick={(e) => onPageChange(e, page - 1)}
                    disabled={page === 0}
                    sx={{ 
                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                        '&.Mui-disabled': {
                            color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)'
                        },
                        '&:hover': {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : undefined
                        }
                    }}
                >
                    <IconChevronLeft size={20} stroke={1.5} />
                </IconButton>
                <IconButton 
                    size="small" 
                    onClick={(e) => onPageChange(e, page + 1)}
                    disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                    sx={{ 
                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                        '&.Mui-disabled': {
                            color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)'
                        },
                        '&:hover': {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : undefined
                        }
                    }}
                >
                    <IconChevronRight size={20} stroke={1.5} />
                </IconButton>
            </Box>
        </Box>
    )
}

TablePagination.propTypes = {
    count: PropTypes.number.isRequired,
    page: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
    rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
    onPageChange: PropTypes.func.isRequired,
    onRowsPerPageChange: PropTypes.func.isRequired,
    labelRowsPerPage: PropTypes.node,
    sx: PropTypes.object
}

export default TablePagination 