import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Box, Button, IconButton, Typography, Chip, Menu, MenuItem } from '@mui/material'

// project imports
import DataTable from '@/ui-component/table/DataTable'
import { IconFilter, IconSettings, IconInfoCircle, IconToggleRight, IconToggleLeft } from '@tabler/icons-react'

// API
import * as toolsApi from '@/api/tools'
import * as platformApi from '@/api/platform'

// ==============================|| PLATFORM TOOLS VIEW ||============================== //

const PlatformToolsView = () => {
    const theme = useTheme()
    const dispatch = useDispatch()

    const [isLoading, setIsLoading] = useState(true)
    const [tools, setTools] = useState([])
    const [enabledTools, setEnabledTools] = useState({})
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [error, setError] = useState(null)
    const [updating, setUpdating] = useState(false)
    const [filterAnchorEl, setFilterAnchorEl] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Fetch all tools
                const toolsResponse = await toolsApi.getAllTools()
                const allTools = toolsResponse.data || []
                
                // Fetch enabled status
                try {
                    const enabledResponse = await platformApi.getToolsWithEnabledStatus()
                    const enabledData = enabledResponse.data || {}
                    setEnabledTools(enabledData)
                } catch (error) {
                    console.error('Error fetching enabled tools:', error)
                    // If we can't fetch enabled status, assume all tools are enabled
                    const defaultEnabled = {}
                    allTools.forEach(tool => {
                        defaultEnabled[tool.name] = true
                    })
                    setEnabledTools(defaultEnabled)
                }
                
                // Extract unique categories
                const uniqueCategories = [...new Set(allTools.map(tool => tool.category))]
                setCategories(['All', ...uniqueCategories.filter(Boolean).sort()])
                
                setTools(allTools)
            } catch (error) {
                console.error('Error fetching tools:', error)
                setTools([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleToggle = async (toolType, enabled) => {
        try {
            // Create a temporary variable to track which tool is being updated
            const updatingTool = toolType;
            
            // Only set updating state for the specific tool being toggled
            setUpdating(updatingTool);
            
            await platformApi.toggleToolEnabled(toolType, enabled)
            
            // Update only the specific tool's enabled status
            setEnabledTools(prev => ({
                ...prev,
                [toolType]: enabled
            }))
            
            toast.success(`${toolType} has been ${enabled ? 'enabled' : 'disabled'}.`)
        } catch (error) {
            console.error('Error toggling tool:', error)
            toast.error(`Failed to ${enabled ? 'enable' : 'disable'} ${toolType}.`)
        } finally {
            // Clear the updating state
            setUpdating(false);
        }
    }

    const filteredTools = tools.filter(tool => {
        const categoryMatch = selectedCategory === 'All' || tool.category === selectedCategory
        return categoryMatch
    })

    // Handle filter menu
    const handleFilterClick = (event) => {
        setFilterAnchorEl(event.currentTarget)
    }

    const handleFilterClose = () => {
        setFilterAnchorEl(null)
    }

    const handleCategorySelect = (category) => {
        setSelectedCategory(category)
        handleFilterClose()
    }

    // Define table columns
    const columns = [
        {
            field: 'name',
            label: 'Tool',
            render: (row) => (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {row.icon && (
                        <Box 
                            component="img" 
                            src={row.icon} 
                            alt={row.name}
                            sx={{ 
                                width: 28, 
                                height: 28, 
                                mr: 2,
                                borderRadius: '4px'
                            }}
                        />
                    )}
                    <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {row.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {row.description?.substring(0, 60)}{row.description?.length > 60 ? '...' : ''}
                        </Typography>
                    </Box>
                </Box>
            )
        },
        {
            field: 'category',
            label: 'Category',
            width: 150,
            render: (row) => (
                <Chip 
                    label={row.category || 'Uncategorized'} 
                    size="small"
                    sx={{ 
                        minWidth: 90,
                        backgroundColor: theme.palette.mode === 'dark' 
                            ? theme.palette.primary.dark + '20' 
                            : theme.palette.primary.light + '20',
                        color: theme.palette.primary.main
                    }}
                />
            )
        },
        {
            field: 'status',
            label: 'Status',
            width: 120,
            align: 'center',
            render: (row) => (
                <Chip 
                    label={enabledTools[row.name] !== false ? 'Enabled' : 'Disabled'} 
                    size="small"
                    sx={{ 
                        minWidth: 80,
                        backgroundColor: enabledTools[row.name] !== false
                            ? theme.palette.success.light + '20'
                            : theme.palette.error.light + '20',
                        color: enabledTools[row.name] !== false
                            ? theme.palette.success.dark
                            : theme.palette.error.dark
                    }}
                />
            )
        },
        {
            field: 'actions',
            label: 'Actions',
            align: 'right',
            width: 120,
            render: (row) => (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton 
                        size="small"
                        onClick={() => handleToggle(row.name, enabledTools[row.name] === false)}
                        disabled={updating === row.name}
                        sx={{ mr: 1 }}
                        color={enabledTools[row.name] !== false ? "error" : "success"}
                    >
                        {enabledTools[row.name] !== false ? <IconToggleRight size={18} /> : <IconToggleLeft size={18} />}
                    </IconButton>
                    <IconButton 
                        size="small"
                        sx={{ mr: 1 }}
                    >
                        <IconInfoCircle size={18} />
                    </IconButton>
                </Box>
            )
        }
    ]

    // Header actions
    const headerActions = (
        <Button 
            variant="contained" 
            startIcon={<IconSettings size={18} />}
        >
            Manage Tool Settings
        </Button>
    )

    // Table actions
    const tableActions = (
        <>
            <Button 
                variant="outlined" 
                startIcon={<IconFilter size={18} />}
                onClick={handleFilterClick}
            >
                {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
            </Button>
            <Menu
                anchorEl={filterAnchorEl}
                open={Boolean(filterAnchorEl)}
                onClose={handleFilterClose}
                PaperProps={{
                    elevation: 3,
                    sx: { minWidth: 180, borderRadius: '8px' }
                }}
            >
                {categories.map((category) => (
                    <MenuItem 
                        key={category} 
                        onClick={() => handleCategorySelect(category)}
                        selected={selectedCategory === category}
                    >
                        {category}
                    </MenuItem>
                ))}
            </Menu>
        </>
    )

    return (
        <DataTable
            columns={columns}
            data={filteredTools}
            title="Platform Tools Management"
            description="Control which tools are available to users when building chatflows"
            searchPlaceholder="Search tools..."
            searchFields={['name', 'description', 'category']}
            headerActions={headerActions}
            tableActions={tableActions}
            initialRowsPerPage={10}
            isLoading={isLoading}
            emptyStateMessage="No tools found"
        />
    )
}

export default PlatformToolsView 