import React from 'react';
import LogoSection from '../layout/MainLayout/LogoSection/index.jsx';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import type { Meta } from '@storybook/react';
import { ThemeProvider } from '@mui/material';
import { CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../themes/index.js';
import customizationReducer from '@/store/reducers/customizationReducer';
import { BrowserRouter as Router } from 'react-router-dom';

const createStoreWithTheme = (isDarkMode: boolean) => {
  const initialState = {
    customization: {
      isDarkMode,
      isOpen: [],
      fontFamily: 'Roboto',
      borderRadius: 8
    }
  };
  return createStore(customizationReducer, initialState);
};

const Template = (args) => {
  const store = createStoreWithTheme(args.isDarkMode);
  const theme = args.isDarkMode ? darkTheme : lightTheme;
  
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Router>
          <CssBaseline />
          <LogoSection {...args} />
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export const Light = Template.bind({});
Light.args = {
  isDarkMode: false,
};

export const Dark = Template.bind({});
Dark.args = {
  isDarkMode: true,
};

export default {
  title: 'Layout/LogoSection',
  component: LogoSection,
} as Meta<typeof LogoSection>;