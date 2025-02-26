import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CssBaseline, Grid } from '@mui/material';
import { lightTheme, darkTheme } from '@/themes';
import DocumentStoreStatus from '@/views/docstore/DocumentStoreStatus';

type DocumentStoreStatusType = 'STALE' | 'EMPTY' | 'SYNCING' | 'UPSERTING' | 'SYNC' | 'UPSERTED' | 'NEW';

interface DocumentStoreStatusProps {
  status: DocumentStoreStatusType;
  isTableView?: boolean;
  containerBorderRadius?: string;
  containerPaddingX?: string;
  containerPaddingY?: string;
  dotSize?: string;
  dotTableSize?: string;
  dotBorderWidth?: string;
  textFontSize?: string;
  textMarginLeft?: string;
}

interface StoryProps extends DocumentStoreStatusProps {
  isDarkMode?: boolean;
}

// Function to create a mock Redux store
const createMockStore = (isDarkMode: boolean) => {
  const initialState = {
    customization: {
      isDarkMode,
      isOpen: [] as string[],
      fontFamily: 'Roboto',
      borderRadius: 8,
      opened: false,
      isHorizontal: false
    }
  };
  return createStore((state = initialState) => state);
};

// Template for rendering with Redux and MUI theme
const Template: StoryFn<StoryProps> = (args) => {
  const { isDarkMode, ...componentProps } = args;
  const store = createMockStore(isDarkMode ?? false);
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ p: 2, bgcolor: isDarkMode ? 'background.paper' : '#fff' }}>
          <DocumentStoreStatus {...componentProps} />
        </Box>
      </ThemeProvider>
    </Provider>
  );
};

// Show all statuses in a grid
const StatusGrid: StoryFn<StoryProps> = (args) => {
  const { isDarkMode, ...componentProps } = args;
  const store = createMockStore(isDarkMode ?? false);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const statuses: DocumentStoreStatusType[] = ['STALE', 'EMPTY', 'SYNCING', 'UPSERTING', 'SYNC', 'UPSERTED', 'NEW'];
  
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ p: 2, bgcolor: isDarkMode ? 'background.paper' : '#fff' }}>
          <Grid container spacing={2}>
            {statuses.map((status) => (
              <Grid item key={status}>
                <DocumentStoreStatus 
                  {...componentProps}
                  status={status}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </ThemeProvider>
    </Provider>
  );
};

const meta: Meta<StoryProps> = {
  title: 'UI Components/Statuses/Document Store',
  component: DocumentStoreStatus as any,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Status indicator for document store states. Displays different colors and styles based on status and theme mode.'
      }
    }
  },
  argTypes: {
    // Core props
    status: {
      control: 'select',
      options: ['STALE', 'EMPTY', 'SYNCING', 'UPSERTING', 'SYNC', 'UPSERTED', 'NEW'],
      description: 'Current status state',
      table: { category: 'Core' }
    },
    isTableView: {
      control: 'boolean',
      description: 'Display as table view (dot only) or regular view (with text)',
      defaultValue: false,
      table: { category: 'Core' }
    },

    // Container styles
    containerBorderRadius: {
      control: 'text',
      description: 'Border radius of the container',
      defaultValue: '25px',
      table: { category: 'Container Styles' }
    },
    containerPaddingX: {
      control: 'text',
      description: 'Horizontal padding',
      defaultValue: '10px',
      table: { category: 'Container Styles' }
    },
    containerPaddingY: {
      control: 'text',
      description: 'Vertical padding',
      defaultValue: '3px',
      table: { category: 'Container Styles' }
    },

    // Dot styles
    dotSize: {
      control: 'text',
      description: 'Size of the status dot',
      defaultValue: '10px',
      table: { category: 'Dot Styles' }
    },
    dotTableSize: {
      control: 'text',
      description: 'Size of the dot in table view',
      defaultValue: '20px',
      table: { category: 'Dot Styles' }
    },
    dotBorderWidth: {
      control: 'text',
      description: 'Border width for empty state',
      defaultValue: '3px',
      table: { category: 'Dot Styles' }
    },

    // Text styles
    textFontSize: {
      control: 'text',
      description: 'Font size of the status text',
      defaultValue: '0.7rem',
      table: { category: 'Text Styles' }
    },
    textMarginLeft: {
      control: 'text',
      description: 'Space between dot and text',
      defaultValue: '5px',
      table: { category: 'Text Styles' }
    },

    // Story controls
    isDarkMode: {
      control: 'boolean',
      description: 'Theme mode (Redux state)',
      defaultValue: false,
      table: { category: 'Story Controls' }
    }
  }
};

export default meta;

type Story = StoryFn<StoryProps>;

export const Default: Story = Template.bind({});
Default.args = {
  status: 'SYNC',
  isTableView: false,
  isDarkMode: false
};

export const TableView: Story = Template.bind({});
TableView.args = {
  status: 'SYNC',
  isTableView: true,
  isDarkMode: false
};

export const Empty: Story = Template.bind({});
Empty.args = {
  status: 'EMPTY',
  isTableView: false,
  isDarkMode: false
};

export const Processing: Story = Template.bind({});
Processing.args = {
  status: 'SYNCING',
  isTableView: false,
  isDarkMode: false
};

export const CustomStyles: Story = Template.bind({});
CustomStyles.args = {
  status: 'SYNC',
  isTableView: false,
  isDarkMode: false,
  containerBorderRadius: '8px',
  containerPaddingX: '15px',
  containerPaddingY: '6px',
  dotSize: '12px',
  dotTableSize: '24px',
  dotBorderWidth: '4px',
  textFontSize: '0.8rem',
  textMarginLeft: '8px'
};

export const DarkMode: Story = Template.bind({});
DarkMode.args = {
  status: 'SYNC',
  isTableView: false,
  isDarkMode: true
};

export const AllStates: Story = StatusGrid.bind({});
AllStates.args = {
  isTableView: false,
  isDarkMode: false
};

export const AllStatesCustom: Story = StatusGrid.bind({});
AllStatesCustom.args = {
  isTableView: false,
  isDarkMode: false,
  containerBorderRadius: '8px',
  containerPaddingX: '15px',
  containerPaddingY: '6px',
  dotSize: '12px',
  textFontSize: '0.8rem',
  textMarginLeft: '8px'
};
