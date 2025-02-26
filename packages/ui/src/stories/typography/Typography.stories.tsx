import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Typography, Box } from '@mui/material';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../../themes';

const meta = {
  title: 'UI Components/Typography',
  component: Typography,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', maxWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'textPrimary', 'textSecondary', 'error'],
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
    },
  },
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

const withThemeProvider = (isDark: boolean) => (StoryFn: any) => {
  const store = configureStore({
    reducer: {
      customization: () => ({
        isDarkMode: isDark,
        fontFamily: 'Roboto',
        borderRadius: 8
      })
    }
  });

  return (
    <Provider store={store}>
      <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
        <CssBaseline />
        <StoryFn />
      </ThemeProvider>
    </Provider>
  );
};

// Card Title Style (used in DocumentStoreCard)
export const CardTitle: Story = {
  decorators: [withThemeProvider(false)],
  render: () => (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Typography
        sx={{
          display: '-webkit-box',
          fontSize: '1.25rem',
          fontWeight: 500,
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          mr: 1
        }}
      >
        This is a card title that might be very long and will be truncated after two lines with an ellipsis at the end to indicate there is more content
      </Typography>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Typography style used for card titles with 2-line truncation and ellipsis.'
      }
    }
  }
};

// Card Description Style
export const CardDescription: Story = {
  decorators: [withThemeProvider(false)],
  render: () => (
    <Box sx={{ width: '100%', mb: 2 }}>
      <span
        style={{
          display: '-webkit-box',
          marginTop: 10,
          overflowWrap: 'break-word',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textOverflow: 'ellipsis',
          overflow: 'hidden'
        }}
      >
        This is a longer description text that demonstrates how the content will be truncated after two lines. It includes multiple sentences to show the ellipsis behavior when there is more content than can fit in the allocated space.
      </span>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Typography style used for card descriptions with 2-line truncation and ellipsis.'
      }
    }
  }
};

// Stats Badge Text
export const StatsBadge: Story = {
  decorators: [withThemeProvider(false)],
  render: () => (
    <Box sx={{ width: '100%', mb: 2 }}>
      <div
        style={{
          paddingLeft: '7px',
          paddingRight: '7px',
          paddingTop: '3px',
          paddingBottom: '3px',
          fontSize: '11px',
          width: 'max-content',
          borderRadius: '25px',
          boxShadow: '0 2px 14px 0 rgb(32 40 45 / 20%)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        Stats Badge Text
      </div>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Typography style used in stats badges with custom padding and font size.'
      }
    }
  }
};

// Dark Theme Variants
export const DarkThemeTitle: Story = {
  decorators: [withThemeProvider(true)],
  render: () => (
    <Box sx={{ width: '100%', mb: 2, bgcolor: 'background.paper', p: 2 }}>
      <Typography
        sx={{
          display: '-webkit-box',
          fontSize: '1.25rem',
          fontWeight: 500,
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          mr: 1
        }}
      >
        Dark Theme Card Title Example
      </Typography>
    </Box>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Dark theme variant of the card title typography.'
      }
    }
  }
};

// More Count Typography
export const MoreCount: Story = {
  decorators: [withThemeProvider(false)],
  render: () => (
    <Typography sx={{ alignItems: 'center', display: 'flex', fontSize: '.9rem', fontWeight: 200 }}>
      + 2 More
    </Typography>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Typography style used for showing additional items count.'
      }
    }
  }
};

// Combined Example
export const CombinedExample: Story = {
  decorators: [withThemeProvider(false)],
  render: () => (
    <Box sx={{ width: '100%', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
      <Typography
        sx={{
          display: '-webkit-box',
          fontSize: '1.25rem',
          fontWeight: 500,
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          mb: 1
        }}
      >
        Document Store Title
      </Typography>
      <span
        style={{
          display: '-webkit-box',
          marginTop: 10,
          overflowWrap: 'break-word',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textOverflow: 'ellipsis',
          overflow: 'hidden'
        }}
      >
        This is the document store description that shows how different typography styles work together in a card layout.
      </span>
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <div
          style={{
            paddingLeft: '7px',
            paddingRight: '7px',
            paddingTop: '3px',
            paddingBottom: '3px',
            fontSize: '11px',
            width: 'max-content',
            borderRadius: '25px',
            boxShadow: '0 2px 14px 0 rgb(32 40 45 / 20%)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          5 flows
        </div>
        <div
          style={{
            paddingLeft: '7px',
            paddingRight: '7px',
            paddingTop: '3px',
            paddingBottom: '3px',
            fontSize: '11px',
            width: 'max-content',
            borderRadius: '25px',
            boxShadow: '0 2px 14px 0 rgb(32 40 45 / 20%)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          1.5K chars
        </div>
      </Box>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example showing how different typography styles are combined in a card layout.'
      }
    }
  }
};
