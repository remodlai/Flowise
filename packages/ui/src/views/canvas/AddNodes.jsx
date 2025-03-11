import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import styled from '@emotion/styled'

// material-ui
import { useTheme } from '@mui/material/styles'
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
    ClickAwayListener,
    Divider,
    InputAdornment,
    List,
    ListItemButton,
    ListItem,
    ListItemAvatar,
    ListItemText,
    OutlinedInput,
    Paper,
    Popper,
    Stack,
    Typography,
    Chip,
    Tab,
    Tabs,
    ListItemIcon,
    Grid,
    IconButton
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import Transitions from '@/ui-component/extended/Transitions'
import { StyledFab } from '@/ui-component/button/StyledFab'

// icons
import { IconPlus, IconSearch, IconMinus, IconX } from '@tabler/icons-react'
import LlamaindexPNG from '@/assets/images/llamaindex.png'
import LangChainPNG from '@/assets/images/langchain.png'
import utilNodesPNG from '@/assets/images/utilNodes.png'

// const
import { baseURL } from '@/store/constant'
import { SET_COMPONENT_NODES } from '@/store/actions'

// ==============================|| ADD NODES||============================== //
function a11yProps(index) {
    return {
        id: `attachment-tab-${index}`,
        'aria-controls': `attachment-tabpanel-${index}`
    }
}

const blacklistCategoriesForAgentCanvas = ['Agents', 'Memory', 'Record Manager', 'Utilities']

const agentMemoryNodes = ['agentMemory', 'sqliteAgentMemory', 'postgresAgentMemory', 'mySQLAgentMemory']

// Show blacklisted nodes (exceptions) for agent canvas
const exceptionsForAgentCanvas = {
    Memory: agentMemoryNodes,
    Utilities: ['getVariable', 'setVariable', 'stickyNote']
}

// Hide some nodes from the chatflow canvas
const blacklistForChatflowCanvas = {
    Memory: agentMemoryNodes
}

// Add these styles at the top
const BlockLibraryCard = styled(MainCard)(({ theme }) => ({
    background: theme.palette.card.main,
    border: 'none',
    color: theme.palette.text.primary,
    borderRadius: '12px',
    maxWidth: '1050px',
    width: '90vw',
    maxHeight: '85vh',
    overflow: 'hidden',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
}))

const SearchInput = styled(OutlinedInput)(({ theme }) => ({
    marginBottom: '20px',
    '& .MuiOutlinedInput-input': {
        padding: '12px 16px',
        background: theme.palette.background.white,
        color: theme.palette.text.primary,
        borderRadius: '8px'
    },
    '& .MuiOutlinedInput-notchedOutline': {
        border: 'none'
    }
}))

const CategoryButton = styled(ListItemButton)(({ theme }) => ({
    padding: '10px 16px',
    borderRadius: '8px',
    transition: 'background-color 0.2s ease-in-out',
    '&:hover': {
        background: theme.palette.card.white
    }
}))

const NodeCard = styled(MainCard)(({ theme }) => ({
    background: theme.palette.card.white,
    borderRadius: '10px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease-in-out',
    '&:hover': {
        background: theme.palette.card.white,
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    }
}))

// Add a wrapper component to handle the nodeType prop
const NodeCardWrapper = ({ children, ...props }) => {
    // Remove nodeType from props to prevent it from being passed to DOM elements
    const { nodeType, ...otherProps } = props;
    return <NodeCard {...otherProps}>{children}</NodeCard>;
};

// Add these new styled components
const ScrollableContent = styled(Box)({
    overflowY: 'auto',
    height: 'calc(85vh - 140px)', // Account for header and search
    '&::-webkit-scrollbar': {
        width: '8px'
    },
    '&::-webkit-scrollbar-track': {
        background: 'transparent'
    },
    '&::-webkit-scrollbar-thumb': {
        background: '#888',
        borderRadius: '4px'
    },
    // Prevent unwanted transitions
    '& *': {
        backfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d'
    }
})

const AddNodes = ({ nodesData, node, isAgentCanvas }) => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const dispatch = useDispatch()

    const [searchValue, setSearchValue] = useState('')
    const [nodes, setNodes] = useState({})
    const [open, setOpen] = useState(false)
    const [categoryExpanded, setCategoryExpanded] = useState({})
    const [tabValue, setTabValue] = useState(0)
    const [selectedCategory, setSelectedCategory] = useState('INPUT')

    const anchorRef = useRef(null)
    const prevOpen = useRef(open)
    const ps = useRef()

    const scrollTop = () => {
        const curr = ps.current
        if (curr) {
            curr.scrollTop = 0
        }
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
        filterSearch(searchValue, newValue)
    }

    const addException = (category) => {
        let nodes = []
        if (category) {
            const nodeNames = exceptionsForAgentCanvas[category] || []
            nodes = nodesData.filter((nd) => nd.category === category && nodeNames.includes(nd.name))
        } else {
            for (const category in exceptionsForAgentCanvas) {
                const nodeNames = exceptionsForAgentCanvas[category]
                nodes.push(...nodesData.filter((nd) => nd.category === category && nodeNames.includes(nd.name)))
            }
        }
        return nodes
    }

    const getSearchedNodes = (value) => {
        if (isAgentCanvas) {
            const nodes = nodesData.filter((nd) => !blacklistCategoriesForAgentCanvas.includes(nd.category))
            nodes.push(...addException())
            const passed = nodes.filter((nd) => {
                const passesName = nd.name.toLowerCase().includes(value.toLowerCase())
                const passesLabel = nd.label.toLowerCase().includes(value.toLowerCase())
                const passesCategory = nd.category.toLowerCase().includes(value.toLowerCase())
                return passesName || passesCategory || passesLabel
            })
            return passed
        }
        let nodes = nodesData.filter((nd) => nd.category !== 'Multi Agents' && nd.category !== 'Sequential Agents')

        for (const category in blacklistForChatflowCanvas) {
            const nodeNames = blacklistForChatflowCanvas[category]
            nodes = nodes.filter((nd) => !nodeNames.includes(nd.name))
        }

        const passed = nodes.filter((nd) => {
            const passesName = nd.name.toLowerCase().includes(value.toLowerCase())
            const passesLabel = nd.label.toLowerCase().includes(value.toLowerCase())
            const passesCategory = nd.category.toLowerCase().includes(value.toLowerCase())
            return passesName || passesCategory || passesLabel
        })
        return passed
    }

    const filterSearch = (value) => {
        setSearchValue(value)
        if (value) {
            const searchResults = getSearchedNodes(value)
            const categorizedResults = searchResults.reduce((acc, node) => {
                if (!acc[node.category]) {
                    acc[node.category] = []
                }
                acc[node.category].push(node)
                return acc
            }, {})
            setNodes(categorizedResults)
            // Select first category with results
            const firstCategory = Object.keys(categorizedResults)[0]
            if (firstCategory) {
                setSelectedCategory(firstCategory)
            }
        } else {
            groupByCategory(nodesData)
        }
    }

    const groupByTags = (nodes, newTabValue = 0) => {
        const langchainNodes = nodes.filter((nd) => !nd.tags)
        const llmaindexNodes = nodes.filter((nd) => nd.tags && nd.tags.includes('LlamaIndex'))
        const utilitiesNodes = nodes.filter((nd) => nd.tags && nd.tags.includes('Utilities'))
        if (newTabValue === 0) {
            return langchainNodes
        } else if (newTabValue === 1) {
            return llmaindexNodes
        } else {
            return utilitiesNodes
        }
    }

    const groupByCategory = (nodes, newTabValue, isFilter) => {
        if (isAgentCanvas) {
            const result = nodes.reduce((acc, node) => {
                // Skip blacklisted categories unless they're exceptions
                if (blacklistCategoriesForAgentCanvas.includes(node.category)) {
                    if (!exceptionsForAgentCanvas[node.category]?.includes(node.name)) {
                        return acc
                    }
                }
                
                // Skip LlamaIndex nodes
                if (node.tags?.includes('LlamaIndex')) {
                    return acc
                }

                if (!acc[node.category]) {
                    acc[node.category] = []
                }
                acc[node.category].push(node)
                return acc
            }, {})

            setNodes(result)
            // Select first category if none selected
            if (!selectedCategory || !result[selectedCategory]) {
                const firstCategory = Object.keys(result)[0]
                if (firstCategory) {
                    setSelectedCategory(firstCategory)
                }
            }
        } else {
            const taggedNodes = groupByTags(nodes, newTabValue)
            const result = taggedNodes.reduce((acc, node) => {
                // Skip specific categories
                if (node.category === 'Multi Agents' || node.category === 'Sequential Agents') {
                    return acc
                }
                
                // Skip blacklisted nodes
                if (blacklistForChatflowCanvas[node.category]?.includes(node.name)) {
                    return acc
                }

                if (!acc[node.category]) {
                    acc[node.category] = []
                }
                acc[node.category].push(node)
                return acc
            }, {})

            setNodes(result)
            // Select first category if none selected
            if (!selectedCategory || !result[selectedCategory]) {
                const firstCategory = Object.keys(result)[0]
                if (firstCategory) {
                    setSelectedCategory(firstCategory)
                }
            }
        }
    }

    const handleAccordionChange = (category) => (event, isExpanded) => {
        const accordianCategories = { ...categoryExpanded }
        accordianCategories[category] = isExpanded
        setCategoryExpanded(accordianCategories)
    }

    const handleClose = (event) => {
        // Simplified logic - just close the modal
        setOpen(false)
    }

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen)
    }

    const onDragStart = (event, node) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(node))
        event.dataTransfer.effectAllowed = 'move'
    }

    const getImage = (tabValue) => {
        if (tabValue === 0) {
            return LangChainPNG
        } else if (tabValue === 1) {
            return LlamaindexPNG
        } else {
            return utilNodesPNG
        }
    }

    useEffect(() => {
        if (prevOpen.current === true && open === false) {
            anchorRef.current.focus()
        }

        prevOpen.current = open
    }, [open])

    useEffect(() => {
        if (node) setOpen(false)
    }, [node])

    useEffect(() => {
        if (nodesData) {
            groupByCategory(nodesData)
            dispatch({ type: SET_COMPONENT_NODES, componentNodes: nodesData })
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodesData, dispatch])

    return (
        <>
            <StyledFab
                sx={{ left: 20, top: 20 }}
                ref={anchorRef}
                size='small'
                color='primary'
                aria-label='add'
                title='Add Node'
                onClick={handleToggle}
            >
                {open ? <IconMinus /> : <IconPlus />}
            </StyledFab>
            {open && (
                <Box
                    onClick={handleClose}
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Box 
                        onClick={(e) => e.stopPropagation()}
                        sx={{ width: 'auto', maxWidth: '90%', maxHeight: '90%' }}
                    >
                        <Transitions in={open} type="fade">
                            <BlockLibraryCard>
                                <Box sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant='h4'>Block Library</Typography>
                                        <IconButton onClick={() => setOpen(false)} size="small">
                                            <IconX size={20} />
                                        </IconButton>
                                    </Box>
                                    <SearchInput
                                        fullWidth
                                        placeholder="Search nodes..."
                                        value={searchValue}
                                        onChange={(e) => filterSearch(e.target.value)}
                                        startAdornment={
                                            <InputAdornment position='start'>
                                                <IconSearch stroke={1.5} size='1rem' />
                                            </InputAdornment>
                                        }
                                    />
                                    <Box sx={{ display: 'flex', gap: 2, height: 'calc(85vh - 140px)' }}>
                                        {/* Left sidebar */}
                                        <ScrollableContent sx={{ width: '200px' }}>
                                            <List sx={{ p: 0 }}>
                                                {Object.keys(nodes).sort().map((category) => (
                                                    <CategoryButton 
                                                        key={category}
                                                        selected={selectedCategory === category}
                                                        onClick={() => setSelectedCategory(category)}
                                                    >
                                                        <ListItemIcon>
                                                            <IconPlus size={20} />
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primary={category} 
                                                            secondary={`${nodes[category].length} nodes`}
                                                        />
                                                    </CategoryButton>
                                                ))}
                                            </List>
                                        </ScrollableContent>

                                        {/* Main content */}
                                        <ScrollableContent sx={{ flex: 1 }}>
                                            <Typography variant='h5' sx={{ mb: 2 }}>
                                                {selectedCategory} 
                                                {searchValue && ' - Search Results'}
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {(nodes[selectedCategory] || []).map((node) => (
                                                    <Grid item xs={12} sm={6} md={4} key={node.name}>
                                                        <NodeCardWrapper
                                                            onDragStart={(event) => onDragStart(event, node)}
                                                            draggable
                                                            sx={{ transform: 'translate(0, 0)' }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                                <Box
                                                                    sx={{
                                                                        width: 40,
                                                                        height: 40,
                                                                        borderRadius: '8px',
                                                                        background: 'white',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    <img
                                                                        style={{
                                                                            width: '24px',
                                                                            height: '24px',
                                                                            objectFit: 'contain'
                                                                        }}
                                                                        alt={node.name}
                                                                        src={`${baseURL}/api/v1/node-icon/${node.name}`}
                                                                    />
                                                                </Box>
                                                                <Typography variant='h6'>{node.label}</Typography>
                                                            </Box>
                                                            <Typography variant='body2' color="text.secondary">
                                                                {node.description}
                                                            </Typography>
                                                            <Box sx={{ mt: 1 }}>
                                                                <Typography variant='caption' sx={{ display: 'block' }}>
                                                                    Input: {Array.isArray(node.descriptionInputs) ? node.descriptionInputs.join(', ') : '-'}
                                                                </Typography>
                                                                <Typography variant='caption'>
                                                                    Output: {node.outputs?.length ? node.outputs.map(o => o.name).join(', ') : 'Dataset'}
                                                                </Typography>
                                                            </Box>
                                                        </NodeCardWrapper>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </ScrollableContent>
                                    </Box>
                                </Box>
                            </BlockLibraryCard>
                        </Transitions>
                    </Box>
                </Box>
            )}
        </>
    )
}

AddNodes.propTypes = {
    nodesData: PropTypes.array,
    node: PropTypes.object,
    isAgentCanvas: PropTypes.bool
}

export default AddNodes
