import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { 
    Box, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    Typography,
    useTheme,
    alpha
} from '@mui/material'
import TablePagination from './TablePagination'
import SearchBar from '../input/SearchBar'

/**
 * A reusable data table component with search, filtering, and pagination
 */
const DataTable = ({
    columns,
    data,
    title,
    description,
    searchPlaceholder = 'Search...',
    searchFields = [],
    initialRowsPerPage = 5,
    rowsPerPageOptions = [5, 10, 25],
    headerActions,
    tableActions,
    emptyStateMessage = 'No data available',
    onRowClick,
    sx = {}
}) => {
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage)
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredData, setFilteredData] = useState(data)
    const theme = useTheme()
    const isDark = theme.palette.mode === 'dark'

    // Update filtered data when data or search term changes
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredData(data)
            return
        }

        const lowercasedSearchTerm = searchTerm.toLowerCase()
        
        const filtered = data.filter(item => {
            // If no search fields are specified, search all fields
            if (searchFields.length === 0) {
                return Object.values(item).some(value => 
                    String(value).toLowerCase().includes(lowercasedSearchTerm)
                )
            }
            
            // Otherwise, search only the specified fields
            return searchFields.some(field => {
                const value = item[field]
                return value && String(value).toLowerCase().includes(lowercasedSearchTerm)
            })
        })
        
        setFilteredData(filtered)
    }, [data, searchTerm, searchFields])

    // Reset page when filtered data changes
    useEffect(() => {
        setPage(0)
    }, [filteredData])

    const handleChangePage = (event, newPage) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
    }

    // Handle row click if provided
    const handleRowClick = (row) => {
        if (onRowClick) {
            onRowClick(row);
        }
    };

    return (
        <Box sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            ...sx
        }}>
            {/* Header with title, description, and actions */}
            {(title || headerActions) && (
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 3,
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                    gap: 2
                }}>
                    {title && (
                        <Box>
                            <Typography 
                                variant="h4" 
                                gutterBottom 
                                sx={{ 
                                    mb: description ? 0.5 : 0, 
                                    fontWeight: 600,
                                    color: isDark ? '#fff' : 'inherit'
                                }}
                            >
                                {title}
                            </Typography>
                            {description && (
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'
                                    }}
                                >
                                    {description}
                                </Typography>
                            )}
                        </Box>
                    )}
                    {headerActions && (
                        <Box>
                            {headerActions}
                        </Box>
                    )}
                </Box>
            )}

            {/* Search and table actions */}
            {(searchFields.length > 0 || tableActions) && (
                <Box sx={{ 
                    display: 'flex', 
                    mb: 2,
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                    gap: 2
                }}>
                    {searchFields.length > 0 && (
                        <SearchBar
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClear={() => setSearchTerm('')}
                            sx={{ maxWidth: 400 }}
                        />
                    )}
                    {tableActions && (
                        <Box>
                            {tableActions}
                        </Box>
                    )}
                </Box>
            )}

            {/* Table */}
            <TableContainer 
                component={Paper} 
                variant="outlined" 
                sx={{ 
                    boxShadow: 'none',
                    borderRadius: '12px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    backgroundColor: isDark ? theme.palette.background.paper : '#fff',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow>
                            {columns.map((column, index) => (
                                <TableCell 
                                    key={index}
                                    align={column.align || 'left'}
                                    sx={{ 
                                        fontWeight: 600,
                                        color: isDark ? 'rgba(255, 255, 255, 0.9)' : undefined,
                                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : undefined,
                                        ...column.headerSx
                                    }}
                                >
                                    {column.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell 
                                    colSpan={columns.length} 
                                    align="center"
                                    sx={{ py: 4 }}
                                >
                                    <Typography variant="body1" color="textSecondary">
                                        {emptyStateMessage}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => (
                                    <TableRow 
                                        key={row.id || index}
                                        hover
                                        onClick={() => handleRowClick(row)}
                                        sx={{ 
                                            cursor: onRowClick ? 'pointer' : 'default',
                                            '&:last-child td, &:last-child th': { border: 0 }
                                        }}
                                    >
                                        {columns.map((column) => (
                                            <TableCell 
                                                key={column.field} 
                                                align={column.align || 'left'}
                                                sx={column.sx}
                                            >
                                                {column.render 
                                                    ? column.render(row) 
                                                    : row[column.field]
                                                }
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {filteredData.length > 0 && (
                    <TablePagination
                        count={filteredData.length}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        rowsPerPageOptions={rowsPerPageOptions}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                )}
            </TableContainer>
        </Box>
    )
}

DataTable.propTypes = {
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            field: PropTypes.string,
            label: PropTypes.node.isRequired,
            render: PropTypes.func,
            align: PropTypes.oneOf(['left', 'center', 'right']),
            headerSx: PropTypes.object,
            cellSx: PropTypes.object
        })
    ).isRequired,
    data: PropTypes.array.isRequired,
    title: PropTypes.node,
    description: PropTypes.node,
    searchPlaceholder: PropTypes.string,
    searchFields: PropTypes.arrayOf(PropTypes.string),
    initialRowsPerPage: PropTypes.number,
    rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
    headerActions: PropTypes.node,
    tableActions: PropTypes.node,
    emptyStateMessage: PropTypes.node,
    onRowClick: PropTypes.func,
    sx: PropTypes.object
}

export default DataTable 