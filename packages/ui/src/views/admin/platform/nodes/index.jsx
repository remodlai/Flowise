import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Box, Button, IconButton, Typography, Chip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'

// project imports
import DataTable from '@/ui-component/table/DataTable'
import { IconFilter, IconPower, IconSettings, IconInfoCircle, IconToggleRight, IconToggleLeft } from '@tabler/icons-react'

// API
import * as nodesApi from '@/api/nodes'
import * as platformApi from '@/api/platform'

// ==============================|| PLATFORM NODES MANAGEMENT ||============================== //

const PlatformNodesView = () => {
    const theme = useTheme()
    const dispatch = useDispatch()

    const [isLoading, setIsLoading] = useState(true)
    const [nodes, setNodes] = useState([])
    const [enabledNodes, setEnabledNodes] = useState({})
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [searchTerm, setSearchTerm] = useState('')
    const [error, setError] = useState(null)
    const [updating, setUpdating] = useState(false)
    const [filterAnchorEl, setFilterAnchorEl] = useState(null)
    const [llamaIndexFilter, setLlamaIndexFilter] = useState('non-llama') // Default to showing non-LlamaIndex nodes
    const [llamaFilterAnchorEl, setLlamaFilterAnchorEl] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Fetch all nodes
                const nodesResponse = await nodesApi.getAllNodes()
                const allNodes = nodesResponse.data || []
                
                // Fetch enabled status
                try {
                    const enabledResponse = await platformApi.getNodesWithEnabledStatus()
                    const enabledData = enabledResponse.data || {}
                    setEnabledNodes(enabledData)
                } catch (error) {
                    console.error('Error fetching enabled nodes:', error)
                    // If we can't fetch enabled status, assume all nodes are enabled
                    const defaultEnabled = {}
                    allNodes.forEach(node => {
                        defaultEnabled[node.name] = true
                    })
                    setEnabledNodes(defaultEnabled)
                }
                
                // Extract unique categories
                const uniqueCategories = [...new Set(allNodes.map(node => node.category))]
                setCategories(['All', ...uniqueCategories.filter(Boolean).sort()])
                
                setNodes(allNodes)
            } catch (error) {
                console.error('Error fetching nodes:', error)
                setNodes([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleToggle = async (nodeType, enabled) => {
        try {
            // Create a temporary variable to track which node is being updated
            const updatingNode = nodeType;
            
            // Only set updating state for the specific node being toggled
            setUpdating(updatingNode);
            
            await platformApi.toggleNodeEnabled(nodeType, enabled)
            
            // Update only the specific node's enabled status
            setEnabledNodes(prev => ({
                ...prev,
                [nodeType]: enabled
            }))
            
            toast.success(`${nodeType} has been ${enabled ? 'enabled' : 'disabled'}.`)
        } catch (error) {
            console.error('Error toggling node:', error)
            toast.error(`Failed to ${enabled ? 'enable' : 'disable'} ${nodeType}.`)
        } finally {
            // Clear the updating state
            setUpdating(false);
        }
    }

    const filteredNodes = nodes.filter(node => {
        const categoryMatch = selectedCategory === 'All' || node.category === selectedCategory
        
        // LlamaIndex filtering
        let llamaIndexMatch = true;
        if (llamaIndexFilter === 'non-llama') {
            llamaIndexMatch = !node.name.includes('LlamaIndex');
        } else if (llamaIndexFilter === 'llama-only') {
            llamaIndexMatch = node.name.includes('LlamaIndex');
        }
        
        return categoryMatch && llamaIndexMatch;
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

    // Handle LlamaIndex filter menu
    const handleLlamaFilterClick = (event) => {
        setLlamaFilterAnchorEl(event.currentTarget)
    }

    const handleLlamaFilterClose = () => {
        setLlamaFilterAnchorEl(null)
    }

    const handleLlamaFilterSelect = (filter) => {
        setLlamaIndexFilter(filter)
        handleLlamaFilterClose()
    }

    // Get display text for current LlamaIndex filter
    const getLlamaFilterText = () => {
        switch (llamaIndexFilter) {
            case 'all':
                return 'All Nodes';
            case 'non-llama':
                return 'Non-LlamaIndex Nodes';
            case 'llama-only':
                return 'LlamaIndex Nodes Only';
            default:
                return 'Non-LlamaIndex Nodes';
        }
    }

    // Define table columns
    const columns = [
        {
            field: 'name',
            label: 'Node',
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
                            {row.description}
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
                    label={enabledNodes[row.name] !== false ? 'Enabled' : 'Disabled'} 
                    size="small"
                    sx={{ 
                        minWidth: 80,
                        backgroundColor: enabledNodes[row.name] !== false
                            ? theme.palette.success.light + '20'
                            : theme.palette.error.light + '20',
                        color: enabledNodes[row.name] !== false
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
                        onClick={() => handleToggle(row.name, enabledNodes[row.name] === false)}
                        disabled={updating === row.name}
                        sx={{ mr: 1 }}
                        color={enabledNodes[row.name] !== false ? "error" : "success"}
                    >
                        {enabledNodes[row.name] !== false ? <IconToggleRight size={18} /> : <IconToggleLeft size={18} />}
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
            sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
            Manage Node Settings
        </Button>
    )

    // Table actions
    const tableActions = (
        <>
            <Button 
                variant="outlined" 
                startIcon={<IconFilter size={18} />}
                onClick={handleFilterClick}
                sx={{ mr: { xs: 1, sm: 2 }, mb: { xs: 1, md: 0 } }}
            >
                {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
            </Button>
            <Button
                variant="outlined"
                startIcon={<IconFilter size={18} />}
                onClick={handleLlamaFilterClick}
                sx={{ mr: { xs: 1, sm: 2 }, mb: { xs: 1, md: 0 } }}
            >
                {getLlamaFilterText()}
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
            <Menu
                anchorEl={llamaFilterAnchorEl}
                open={Boolean(llamaFilterAnchorEl)}
                onClose={handleLlamaFilterClose}
                PaperProps={{
                    elevation: 3,
                    sx: { minWidth: 180, borderRadius: '8px' }
                }}
            >
                <MenuItem 
                    onClick={() => handleLlamaFilterSelect('all')}
                    selected={llamaIndexFilter === 'all'}
                >
                    All Nodes
                </MenuItem>
                <MenuItem 
                    onClick={() => handleLlamaFilterSelect('non-llama')}
                    selected={llamaIndexFilter === 'non-llama'}
                >
                    Non-LlamaIndex Nodes
                </MenuItem>
                <MenuItem 
                    onClick={() => handleLlamaFilterSelect('llama-only')}
                    selected={llamaIndexFilter === 'llama-only'}
                >
                    LlamaIndex Nodes Only
                </MenuItem>
            </Menu>
        </>
    )

    return (
        <DataTable
            columns={columns}
            data={filteredNodes}
            title="Platform Nodes Management"
            description="Control which nodes are available to users when building chatflows"
            searchPlaceholder="Search nodes..."
            searchFields={['name', 'description', 'category']}
            headerActions={headerActions}
            tableActions={tableActions}
            initialRowsPerPage={10}
            isLoading={isLoading}
            emptyStateMessage="No nodes found"
        />
    )
}

export default PlatformNodesView 