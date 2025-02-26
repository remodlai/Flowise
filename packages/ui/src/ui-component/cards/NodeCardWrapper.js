// material-ui
import { styled } from '@mui/material/styles'
import PropTypes from 'prop-types'
// project imports
import MainCard from './MainCard'

const getNodeType = (label) => {
    console.log('Node Type:', label)
    const nodeType = (() => {
        const type = label?.toLowerCase() || ''
        switch (true) {
            case label.includes('Start'):
                return 'start'
            case label.includes('Memory'):
                return 'memory'
            case label.includes('Chat Model'):
                return 'llm'
            case label.includes('Chain'):
                return 'chain'
            case label.includes('Tool'):
                return 'tool'
            case label.includes('Condition'):
                return 'condition'
            case label.includes('Loop'):
                return 'loop'
            case label.includes('Model'):
                return 'model'
            default:
                return undefined
        }
    })()
    console.log('Determined Node Type:', nodeType)
    return nodeType
}

const getNodeColors = (theme, nodeType) => {
    switch (nodeType) {
        case 'Start':
            return {
                background: 'rgba(170, 255, 0, 8px)',
                gradient: 'linear-gradient(45deg, rgba(128, 255, 0, 0.6) 0%, rgba(75, 0, 203, 0.4) 100%)'
            }
        case 'memory':
            return {
                background: 'rgba(103, 58, 183, 0.8)',
                gradient: 'linear-gradient(45deg, rgba(103, 58, 183, 0.6) 0%, rgba(103, 58, 183, 0.4) 100%)'
            }
        case 'llm':
            return {
                background: 'rgba(33, 150, 243, 0.4)',
                gradient: 'linear-gradient(45deg, rgba(33, 150, 243, 0.6) 0%, rgba(33, 150, 243, 0.4) 100%)'
            }
        case 'chain':
            return {
                background: 'rgba(76, 175, 80, 0.4)',
                gradient: 'linear-gradient(45deg, rgba(76, 175, 80, 0.6) 0%, rgba(76, 175, 80, 0.4) 100%)'
            }
        case 'tool':
            return {
                background: 'rgba(255, 153, 0, 0.4)',
                gradient: 'linear-gradient(45deg, rgba(255, 171, 46, 0.6) 0%, rgba(255, 152, 0, 0.4) 100%)'
            }
        case 'end':
            return {
                background: 'rgba(202, 12, 12, 0.4)',
                gradient: 'linear-gradient(45deg, rgba(255, 0, 0, 0.6) 0%, rgba(255, 0, 0, 0.4) 100%)'
            }
        case 'agent':
            return {
                background: 'rgba(18, 187, 136, 0.8)',
                gradient: 'linear-gradient(45deg, rgba(103, 58, 183, 0.6) 0%, rgba(103, 58, 183, 0.4) 100%)'
            }
        default:
            return {
                background: theme.palette.glass.background,
                gradient: theme.palette.glass.gradient
            }
    }
}

const NodeCardWrapper = styled(MainCard)(({ theme, nodeType }) => {
    const nodeColors = getNodeColors(theme, nodeType)
    return {
        background: 'transparent !important',
        color: theme.palette.text.primary,
        border: 'solid 0px',
        overflow: 'visible',
        backgroundColor: 'transparent !important',
        position: 'relative',
        '& .MuiPaper-root': {
            backgroundColor: 'transparent !important',
            backgroundImage: 'none !important'
        },
        '& .MuiCard-root': {
            backgroundColor: 'transparent !important',
            backgroundImage: 'none !important'
        },
        '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: nodeColors.background,
            backgroundImage: 'transparent',
            backdropFilter: theme.palette.glass.blur,
            WebkitBackdropFilter: theme.palette.glass.blur,
            borderRadius: 'inherit',
            zIndex: -1
        },
        boxShadow: theme.palette.glass.shadow,
        borderColor: theme.palette.border.main,
        width: '300px',
        height: 'auto',
        padding: '10px',
        '&:hover': {
            borderColor: theme.palette.primary.main
        }
    }
})

NodeCardWrapper.propTypes = {
    nodeType: PropTypes.oneOf(['agentmemory', 'llm', 'chain', 'tool', 'Start', 'end'])
}

export default NodeCardWrapper
