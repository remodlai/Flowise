// project imports
import config from '@/config'

// action - state management
import * as actionTypes from '../actions'

// Parse localStorage value to boolean
const isDarkModeFromStorage = () => {
    const storedValue = localStorage.getItem('isDarkMode')
    return storedValue === 'true' ? true : false
}

export const initialState = {
    isOpen: [], // for active default menu
    fontFamily: config.fontFamily,
    borderRadius: config.borderRadius,
    opened: true,
    isHorizontal: localStorage.getItem('isHorizontal') === 'true' ? true : false,
    isDarkMode: isDarkModeFromStorage()
}

// ==============================|| CUSTOMIZATION REDUCER ||============================== //

const customizationReducer = (state = initialState, action) => {
    let id
    switch (action.type) {
        case actionTypes.MENU_OPEN:
            id = action.id
            return {
                ...state,
                isOpen: [id]
            }
        case actionTypes.SET_MENU:
            return {
                ...state,
                opened: action.opened
            }
        case actionTypes.SET_FONT_FAMILY:
            return {
                ...state,
                fontFamily: action.fontFamily
            }
        case actionTypes.SET_BORDER_RADIUS:
            return {
                ...state,
                borderRadius: action.borderRadius
            }
        case actionTypes.SET_LAYOUT:
            return {
                ...state,
                isHorizontal: action.isHorizontal
            }
        case actionTypes.SET_DARKMODE:
            // Ensure we're storing a boolean in state
            const isDarkMode = action.isDarkMode === true
            // Update localStorage
            localStorage.setItem('isDarkMode', isDarkMode)
            return {
                ...state,
                isDarkMode
            }
        default:
            return state
    }
}

export default customizationReducer
