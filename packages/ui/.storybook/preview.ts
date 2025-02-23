import { CssBaseline, ThemeProvider } from '@mui/material';
import { withThemeFromJSXProvider } from '@storybook/addon-themes';
import { theme,lightTheme, darkTheme } from '../src/themes/index';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/material-icons';
import {Preview} from '@storybook/react'
import { Parameters } from '@storybook/react';
import themePalette from '../src/themes/palette';

export const decorators = [
    withThemeFromJSXProvider({
      themes: {
        light: lightTheme,
        dark: darkTheme,
      },
      defaultTheme: 'light',
      Provider: ThemeProvider,
      GlobalStyles: CssBaseline,
    }),
  ];

const preview: Preview = {
  parameters: {
    backgrounds: {
      disable: true, // Disable the background picker
      grid: {
        disable: true // Disable the grid
      }
    },
    themes: {
      default: 'light',
      clearable: false,
      list: [
        { name: 'light', class: '', color: lightTheme.palette.background.default },
        { name: 'dark', class: '', color: darkTheme.palette.background.default },
      ],
    }
  }
}

const parameters: Parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    expanded: true, // Adds the description and default columns
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export default preview;