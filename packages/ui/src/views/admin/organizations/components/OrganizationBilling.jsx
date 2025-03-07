import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

const OrganizationBilling = ({ organizationId }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h4" gutterBottom>
                    Billing
                </Typography>
                <Typography variant="body1">
                    This feature is coming soon. You will be able to manage billing information for this organization.
                </Typography>
            </CardContent>
        </Card>
    );
};

export default OrganizationBilling; 