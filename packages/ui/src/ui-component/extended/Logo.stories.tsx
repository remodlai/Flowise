import React from 'react';
import Logo from './Logo.jsx';
import { Provider } from 'react-redux';
import { store } from '@/store';
import type { Meta, StoryFn } from '@storybook/react';
import { ThemeProvider } from '@mui/material';
import { CssBaseline } from '@mui/material';
import { theme } from '../../themes';
import customizationReducer from '@/store/reducers/customizationReducer';

const meta: Meta<typeof Logo> = {
  title: 'UI Components/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    isDarkMode: { control: 'boolean', defaultValue: false },
  },
};



// Function to create a mock Redux store
const createMockStore = (isDarkMode: boolean) =>
  store(customizationReducer, { customization: { isDarkMode } });

// Template for rendering Logo with Redux and MUI theme
const template: StoryFn = (args) => {
  const mockStore = createMockStore(args.isDarkMode);
  return (
    <Provider store={mockStore}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Logo />
      </ThemeProvider>
    </Provider>
  );
};

// Define Light mode story
export const Light = template.bind({});
Light.args = {
  isDarkMode: false,
  src: "logo",
  alt: 'RemodlAI',
};

// Define Dark mode story
export const Dark = template.bind({});
Dark.args = {
  isDarkMode: true,
  src: "logoDark",
  alt: 'RemodlAI',
};
export default meta;
