// material-ui
import { styled } from '@mui/material/styles'
import PropTypes from 'prop-types'
// project imports
import MainCard from './MainCard'

const getNodeColors = (theme, nodeType) => {
    switch (nodeType) {
        case 'memory':
            return {
                background: 'rgba(103, 58, 183, 0.4)',
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
    nodeType: PropTypes.oneOf(['memory', 'llm', 'chain', 'tool'])
}

export default NodeCardWrapper
