/**
 * Color intention that you want to used in your theme
 * @param {JsonObject} theme Theme customization object
 */

export default function themePalette(theme) {
    return {
        mode: theme?.customization?.navType,
        transparent: theme.colors?.transparent,
        common: {
            black: theme.colors?.darkPaper,
            dark: theme.colors?.darkPrimaryMain
        },
        glass: theme.customization.isDarkMode
            ? {
                  background: 'rgba(41, 52, 71, 0.4)',
                  gradient: 'linear-gradient(45deg, rgba(41, 52, 71, 0.6) 0%, rgba(41, 52, 71, 0.4) 99%, rgba(41, 52, 71, 0.4) 100%)',
                  shadow: '10px 10px 10px rgba(0, 0, 0, 0.2)',
                  blur: 'blur(40px)'
              }
            : {
                  background: 'rgba(255, 255, 255, 0.7)',
                  gradient: 'linear-gradient(45deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 99%, rgba(255, 255, 255, 0.6) 100%)',
                  shadow: '0px 20px 27px rgba(0, 0, 0, 0.05)',
                  blur: 'blur(40px)'
              },
        primary: {
            light: theme.customization.isDarkMode ? theme.colors?.darkPrimaryLight : theme.colors?.primaryLight,
            main: theme.colors?.primaryMain,
            dark: theme.customization.isDarkMode ? theme.colors?.darkPrimaryDark : theme.colors?.primaryDark,
            200: theme.customization.isDarkMode ? theme.colors?.darkPrimary200 : theme.colors?.primary200,
            800: theme.customization.isDarkMode ? theme.colors?.darkPrimary800 : theme.colors?.primary800,
            900: theme.customization.isDarkMode ? theme.colors?.darkPrimary900 : theme.colors?.primary900
        },
        secondary: {
            light: theme.customization.isDarkMode ? theme.colors?.darkSecondaryLight : theme.colors?.secondaryLight,
            main: theme.customization.isDarkMode ? theme.colors?.darkSecondaryMain : theme.colors?.secondaryMain,
            dark: theme.customization.isDarkMode ? theme.colors?.darkSecondaryDark : theme.colors?.secondaryDark,
            200: theme.colors?.secondary200,
            800: theme.colors?.secondary800,
            900: theme.colors?.secondaryDarkBlue
        },
        error: {
            light: theme.colors?.errorLight,
            main: theme.colors?.errorMain,
            dark: theme.colors?.errorDark
        },
        orange: {
            light: theme.colors?.orangeLight,
            main: theme.colors?.orangeMain,
            dark: theme.colors?.orangeDark
        },
        teal: {
            light: theme.colors?.tealLight,
            main: theme.colors?.tealMain,
            dark: theme.colors?.tealDark
        },
        warning: {
            light: theme.colors?.warningLight,
            main: theme.colors?.warningMain,
            dark: theme.colors?.warningDark
        },
        success: {
            light: theme.colors?.successLight,
            200: theme.colors?.success200,
            main: theme.colors?.successMain,
            dark: theme.colors?.successDark
        },
        grey: {
            50: theme.colors?.grey50,
            100: theme.colors?.grey100,
            200: theme.colors?.grey200,
            300: theme.colors?.grey300,
            500: theme.darkTextSecondary,
            600: theme.heading,
            700: theme.darkTextPrimary,
            900: theme.textDark
        },
        dark: {
            light: theme.colors?.darkTextPrimary,
            main: theme.colors?.darkLevel1,
            dark: theme.colors?.darkLevel2,
            800: theme.colors?.darkBackground,
            900: theme.colors?.darkPaper
        },
        text: {
            primary: theme.darkTextPrimary,
            secondary: theme.darkTextSecondary,
            dark: theme.textDark,
            hint: theme.colors?.grey100
        },
        background: {
            paper: theme.paper,
            default: theme.backgroundDefault,
            white: theme.customization.isDarkMode ? theme.colors?.white : theme.colors?.white
        },
        card: {
            white: theme.customization.isDarkMode ? theme.darkGlass : theme.colors?.white,
            main: theme.customization.isDarkMode ? theme.colors?.darkPrimaryMain : theme.colors?.paper,
            light: theme.customization.isDarkMode ? theme.colors?.darkPrimary200 : theme.colors?.paper,
            hover: theme.customization.isDarkMode ? theme.colors?.darkPrimary800 : theme.colors?.paper
        },
        border: {
            main: theme.customization.isDarkMode ? theme.colors?.darkPrimaryMain : theme.colors?.grey50
        },
        asyncSelect: {
            main: theme.customization.isDarkMode ? theme.colors?.darkPrimary800 : theme.colors?.grey50
        },
        timeMessage: {
            main: theme.customization.isDarkMode ? theme.colors?.darkLevel2 : theme.colors?.grey200
        },
        canvasHeader: {
            deployLight: theme.colors?.primaryLight,
            deployDark: theme.colors?.primaryDark,
            saveLight: theme.colors?.secondaryLight,
            saveDark: theme.colors?.secondaryDark,
            settingsLight: theme.colors?.grey300,
            settingsDark: theme.colors?.grey700
        },
        codeEditor: {
            main: theme.customization.isDarkMode ? theme.colors?.darkPrimary800 : theme.colors?.primaryLight
        },
        nodeToolTip: {
            background: theme.customization.isDarkMode ? theme.colors?.darkPrimary800 : theme.colors?.paper,
            color: theme.customization.isDarkMode ? theme.colors?.paper : 'rgba(0, 0, 0, 0.87)'
        }
    }
}
