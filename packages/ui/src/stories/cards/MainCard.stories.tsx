import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MainCard from "../../ui-component/cards/MainCard";
import { Button, Typography, Stack } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../../themes';

const meta = {
  title: 'Cards/MainCard',
  component: MainCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem', maxWidth: '800px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MainCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Example content components
const ExampleContent = () => (
  <Stack spacing={2}>
    <Typography variant="body1">
      This is an example of card content with multiple elements.
    </Typography>
    <Typography variant="body2" color="textSecondary">
      Secondary text that provides additional information.
    </Typography>
  </Stack>
);

const ActionButtons = () => (
  <Stack direction="row" spacing={1}>
    <Button size="small" color="primary">Edit</Button>
    <Button size="small" color="secondary">Delete</Button>
  </Stack>
);

export const Basic: Story = {
  args: {
    title: "Basic Card",
    children: <ExampleContent />,
    boxShadow: true
  }
};

export const WithBoxShadow: Story = {
  args: {
    title: "Card with Shadow",
    boxShadow: true,
    shadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
    children: <ExampleContent />
  }
};

export const WithDarkTitle: Story = {
  args: {
    title: "Dark Title Card",
    darkTitle: true,
    boxShadow: true,
    children: <ExampleContent />
  }
};

export const WithSecondaryAction: Story = {
  args: {
    title: "Card with Actions",
    secondary: <ActionButtons />,
    boxShadow: true,
    children: <ExampleContent />
  }
};

export const ContentDisabled: Story = {
  args: {
    title: "No Content Padding",
    content: false,
    boxShadow: true,
    children: (
      <div style={{ padding: '16px' }}>
        <ExampleContent />
      </div>
    )
  }
};

export const CustomContentStyle: Story = {
  args: {
    title: "Custom Content Style",
    boxShadow: true,
    contentSX: {
      backgroundColor: 'rgba(0,0,0,0.03)',
      padding: 3,
      borderRadius: 1
    },
    children: <ExampleContent />
  }
}; 