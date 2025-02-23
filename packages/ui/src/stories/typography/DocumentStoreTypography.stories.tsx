import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@mui/material';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../../themes';
import customizationReducer from '@/store/reducers/customizationReducer';

interface DocumentStoreTypographyProps {
    variant: 'title' | 'description' | 'badge';
    text: string;
    isDarkMode?: boolean;
}

const DocumentStoreTypography = ({ variant, text, isDarkMode = false }: DocumentStoreTypographyProps) => {
    const titleStyles = {
        display: '-webkit-box',
        fontSize: '1.25rem',
        fontWeight: 500,
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        marginRight: '8px',
        color: isDarkMode ? '#fff' : '#000'
    };

    const descriptionStyles = {
        display: '-webkit-box',
        marginTop: 10,
        overflowWrap: 'break-word' as const,
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
    };

    const badgeStyles = {
        paddingLeft: '7px',
        paddingRight: '7px',
        paddingTop: '3px',
        paddingBottom: '3px',
        fontSize: '11px',
        width: 'max-content',
        borderRadius: '25px',
        boxShadow: isDarkMode 
            ? '0 2px 14px 0 rgb(255 255 255 / 20%)'
            : '0 2px 14px 0 rgb(32 40 45 / 20%)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        color: isDarkMode ? '#fff' : '#000'
    };

    const getStyles = () => {
        switch (variant) {
            case 'title':
                return titleStyles;
            case 'description':
                return descriptionStyles;
            case 'badge':
                return badgeStyles;
            default:
                return {};
        }
    };

    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            <div style={getStyles()}>
                {text}
            </div>
        </Box>
    );
};

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
                <CssBaseline />
                <Box sx={{ 
                    p: 2, 
                    bgcolor: args.isDarkMode ? 'background.paper' : '#fff',
                    borderRadius: 1,
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    <DocumentStoreTypography {...args} />
                </Box>
            </ThemeProvider>
        </Provider>
    );
};

const meta = {
    title: 'UI Components/Document Store Typography',
    component: DocumentStoreTypography,
    parameters: {
        layout: 'centered',
    },
    argTypes: {
        variant: {
            control: 'select',
            options: ['title', 'description', 'badge'],
            description: 'Typography variant'
        },
        text: {
            control: 'text',
            description: 'Text content'
        },
        isDarkMode: {
            control: 'boolean',
            description: 'Dark mode toggle'
        }
    }
} satisfies Meta<typeof DocumentStoreTypography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Title: Story = {
    render: Template,
    args: {
        variant: 'title',
        text: 'This is a document store title that demonstrates the truncation after two lines with an ellipsis',
        isDarkMode: false
    }
};

export const TitleDark: Story = {
    render: Template,
    args: {
        variant: 'title',
        text: 'This is a document store title that demonstrates the truncation after two lines with an ellipsis',
        isDarkMode: true
    }
};

export const Description: Story = {
    render: Template,
    args: {
        variant: 'description',
        text: 'This is a document store description that shows how text will be truncated after two lines. It includes multiple sentences to demonstrate the ellipsis behavior.',
        isDarkMode: false
    }
};

export const DescriptionDark: Story = {
    render: Template,
    args: {
        variant: 'description',
        text: 'This is a document store description that shows how text will be truncated after two lines. It includes multiple sentences to demonstrate the ellipsis behavior.',
        isDarkMode: true
    }
};

export const Badge: Story = {
    render: Template,
    args: {
        variant: 'badge',
        text: '5 flows',
        isDarkMode: false
    }
};

export const BadgeDark: Story = {
    render: Template,
    args: {
        variant: 'badge',
        text: '5 flows',
        isDarkMode: true
    }
};

export const LongContent: Story = {
    render: Template,
    args: {
        variant: 'title',
        text: 'This is a very long title that will definitely need to be truncated because it exceeds the maximum number of lines we allow for titles in our document store cards and should show an ellipsis at the end to indicate there is more content',
        isDarkMode: false
    }
};
