import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Box, Grid, Typography, CircularProgress, Alert, Paper } from '@mui/material'

// project imports
import { gridSpacing } from '@/store/constant'
import NodeToggleCard from '@/ui-component/cards/NodeToggleCard'
import { CategoryFilter } from '@/ui-component/filters/CategoryFilter'
import { SearchInput } from '@/ui-component/filters/SearchInput'
import MainCard from '@/ui-component/cards/MainCard'

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
            setUpdating(true)
            await platformApi.toggleNodeEnabled(nodeType, enabled)
            setEnabledNodes(prev => ({
                ...prev,
                [nodeType]: enabled
            }))
            toast.success(`${nodeType} has been ${enabled ? 'enabled' : 'disabled'}.`)
        } catch (error) {
            console.error('Error toggling node:', error)
            toast.error(`Failed to ${enabled ? 'enable' : 'disable'} ${nodeType}.`)
        } finally {
            setUpdating(false)
        }
    }

    const filteredNodes = nodes.filter(node => {
        const categoryMatch = selectedCategory === 'All' || node.category === selectedCategory
        const searchMatch = !searchTerm || 
            (node.name && node.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
            (node.description && node.description.toLowerCase().includes(searchTerm.toLowerCase()))
        return categoryMatch && searchMatch
    })

    return (
        <MainCard title="Platform Nodes Management">
            <Grid container spacing={gridSpacing}>
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h4">
                            Manage Available Nodes
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                    <CategoryFilter 
                        categories={categories} 
                        selectedCategory={selectedCategory} 
                        onChange={setSelectedCategory} 
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <SearchInput 
                        searchTerm={searchTerm} 
                        onChange={setSearchTerm} 
                        placeholder="Search nodes..." 
                    />
                </Grid>
                {isLoading ? (
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <CircularProgress />
                    </Grid>
                ) : (
                    <>
                        {filteredNodes.length === 0 ? (
                            <Grid item xs={12}>
                                <Box sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h6" color="textSecondary">
                                        No nodes found
                                    </Typography>
                                </Box>
                            </Grid>
                        ) : (
                            filteredNodes.map((node) => (
                                <Grid item xs={12} sm={6} md={4} key={node.name}>
                                    <NodeToggleCard
                                        node={node}
                                        enabled={enabledNodes[node.name] !== false} // Default to enabled if not specified
                                        onToggle={(enabled) => handleToggle(node.name, enabled)}
                                    />
                                </Grid>
                            ))
                        )}
                    </>
                )}
            </Grid>
        </MainCard>
    )
}

export default PlatformNodesView 