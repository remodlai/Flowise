import React from 'react';
import type { Meta, StoryObj, StoryFn } from '@storybook/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../../themes';
import customizationReducer from '@/store/reducers/customizationReducer';
import DocumentStoreCard from '@/ui-component/cards/DocumentStoreCard';
import { fn } from '@storybook/test';

interface CustomizationState {
    isDarkMode: boolean;
    isOpen: string[];
    fontFamily: string;
    borderRadius: number;
    opened: boolean;
    isHorizontal: boolean;
}

interface DocumentStoreData {
    name: string;
    description: string;
    status: 'ready' | 'processing' | 'error';
    whereUsed: string[];
    totalChars: number;
    totalChunks: number;
}

interface StoryProps {
    data: DocumentStoreData;
    images?: string[];
    onClick?: () => void;
    _isDarkMode?: boolean; // Internal prop for story control
}

const createStoreWithTheme = (isDarkMode: boolean) => {
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
    return store(
        customizationReducer as any,
        initialState as any
    );
};

const template: StoryFn = (args) => {
    const store = createStoreWithTheme(args._isDarkMode ?? false);
    const theme = args._isDarkMode ? darkTheme : lightTheme;
    
    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div style={{ padding: '2rem', maxWidth: '400px' }}>
                    <DocumentStoreCard {...args} />
                </div>
            </ThemeProvider>
        </Provider>
    );
};

const meta = {
    title: 'Cards/Document Store Card',
    component: DocumentStoreCard,
    parameters: {
        layout: 'centered',
    },
    argTypes: {
        data: {
            control: 'object',
            description: 'Document store data',
        },
        images: {
            control: 'object',
            description: 'Array of image URLs',
        },
       
        onClick: {
            action: 'clicked',
            description: 'Click handler',
        }
    }
} satisfies Meta<typeof DocumentStoreCard>;

export default meta;
type Story = StoryObj<typeof DocumentStoreCard>;

export const Default: Story = {
    render: template,
    args: {
        data: {
            name: 'Sample Document Store',
            description: 'This is a sample document store with some example content to demonstrate the card layout.',
            status: 'ready',
            whereUsed: ['flow1', 'flow2', 'flow3'],
            totalChars: 15000,
            totalChunks: 250
        },
        onClick: fn()
    }
};

export const Dark: Story = {
    render: template,
    args: {
        data: {
            name: 'Sample Document Store',
            description: 'This is a sample document store with some example content to demonstrate the card layout.',
            status: 'ready',
            whereUsed: ['flow1', 'flow2', 'flow3'],
            totalChars: 15000,
            totalChunks: 250
        },
        onClick: fn()
    }
};

export const WithImages: Story = {
    render: template,
    args: {
        data: {
            name: 'Document Store with Images',
            description: 'This document store includes some sample images to demonstrate the image preview feature.',
            status: 'ready',
            whereUsed: ['flow1', 'flow2'],
            totalChars: 10000,
            totalChunks: 150
        },
        images: [
            'https://raw.githubusercontent.com/FlowiseAI/Flowise/main/images/flowise.png',
            'https://raw.githubusercontent.com/FlowiseAI/Flowise/main/images/flowise.gif',
            'https://raw.githubusercontent.com/FlowiseAI/Flowise/main/assets/FloWiseAI.png',
            'https://raw.githubusercontent.com/FlowiseAI/Flowise/main/assets/FloWiseAI_dark.png'
        ],
        onClick: fn()
    }
};

export const LongContent: Story = {
    render: template,
    args: {
        data: {
            name: 'Document Store with Very Long Title That Should Be Truncated After Two Lines with Ellipsis',
            description: 'This is a very long description that contains multiple sentences to demonstrate how the text wrapping and truncation behavior works. It should show an ellipsis after two lines to indicate there is more content that is not being displayed.',
            status: 'ready',
            whereUsed: ['flow1', 'flow2', 'flow3', 'flow4', 'flow5'],
            totalChars: 50000,
            totalChunks: 1000
        },
       
        onClick: fn()
    }
};

export const Processing: Story = {
    render: template,
    args: {
        data: {
            name: 'Processing Document Store',
            description: 'This document store is currently being processed.',
            status: 'processing',
            whereUsed: [],
            totalChars: 0,
            totalChunks: 0
        },
        onClick: fn()
    }
};

export const Error: Story = {
    render: template,
    args: {
        data: {
            name: 'Error Document Store',
            description: 'This document store encountered an error during processing.',
            status: 'error',
            whereUsed: [],
            totalChars: 0,
            totalChunks: 0
        },
        onClick: fn()
    }
};

export const MinimalContent: Story = {
    render: template,
    args: {
        data: {
            name: 'Minimal Store',
            description: '',
            status: 'ready',
            whereUsed: ['flow1'],
            totalChars: 100,
            totalChunks: 2
        },
        onClick: fn()
    }
};

export const LargeNumbers: Story = {
    render: template,
    args: {
        data: {
            name: 'Large Numbers Example',
            description: 'This example demonstrates how large numbers are displayed in the badges.',
            status: 'ready',
            whereUsed: Array(50).fill('flow'),
            totalChars: 5000000,
            totalChunks: 10000
        },
        
        onClick: fn()
    }
};
