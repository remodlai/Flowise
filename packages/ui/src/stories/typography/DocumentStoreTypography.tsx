import React from 'react';
import { Box } from '@mui/material';

export interface DocumentStoreTypographyProps {
    variant: 'title' | 'description' | 'badge';
    text: string;
    isDarkMode?: boolean;
}

export const DocumentStoreTypography = ({ variant, text, isDarkMode = false }: DocumentStoreTypographyProps) => {
    const titleStyles = {
        display: '-webkit-box',
        fontSize: '1.25rem',
        fontWeight: 500,
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        marginRight: '8px'
    };

    const descriptionStyles = {
        display: '-webkit-box',
        marginTop: 10,
        overflowWrap: 'break-word' as const,
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        textOverflow: 'ellipsis',
        overflow: 'hidden'
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
        alignItems: 'center'
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
