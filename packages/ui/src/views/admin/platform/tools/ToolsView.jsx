import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Box, Grid, Typography, CircularProgress, Alert, Paper } from '@mui/material'

// project imports
import { gridSpacing } from '@/store/constant'
import ToolToggleCard from '@/ui-component/cards/ToolToggleCard'
import { CategoryFilter } from '@/ui-component/filters/CategoryFilter'
import { SearchInput } from '@/ui-component/filters/SearchInput'
import MainCard from '@/ui-component/cards/MainCard'

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
    const [searchTerm, setSearchTerm] = useState('')
    const [error, setError] = useState(null)
    const [updating, setUpdating] = useState(false)

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
            setUpdating(true)
            await platformApi.toggleToolEnabled(toolType, enabled)
            setEnabledTools(prev => ({
                ...prev,
                [toolType]: enabled
            }))
            toast.success(`${toolType} has been ${enabled ? 'enabled' : 'disabled'}.`)
        } catch (error) {
            console.error('Error toggling tool:', error)
            toast.error(`Failed to ${enabled ? 'enable' : 'disable'} ${toolType}.`)
        } finally {
            setUpdating(false)
        }
    }

    const filteredTools = tools.filter(tool => {
        const categoryMatch = selectedCategory === 'All' || tool.category === selectedCategory
        const searchMatch = !searchTerm || 
            (tool.name && tool.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
            (tool.description && tool.description.toLowerCase().includes(searchTerm.toLowerCase()))
        return categoryMatch && searchMatch
    })

    return (
        <MainCard title="Platform Tools Management">
            <Grid container spacing={gridSpacing}>
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h4">
                            Manage Available Tools
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
                        placeholder="Search tools..." 
                    />
                </Grid>
                {isLoading ? (
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <CircularProgress />
                    </Grid>
                ) : (
                    <>
                        {filteredTools.length === 0 ? (
                            <Grid item xs={12}>
                                <Box sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h6" color="textSecondary">
                                        No tools found
                                    </Typography>
                                </Box>
                            </Grid>
                        ) : (
                            filteredTools.map((tool) => (
                                <Grid item xs={12} sm={6} md={4} key={tool.name}>
                                    <ToolToggleCard
                                        tool={tool}
                                        enabled={enabledTools[tool.name] !== false} // Default to enabled if not specified
                                        onToggle={(enabled) => handleToggle(tool.name, enabled)}
                                        disabled={updating}
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

export default PlatformToolsView 