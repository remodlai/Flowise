import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

const OrganizationApplications = ({ organizationId }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h4" gutterBottom>
                    Applications
                </Typography>
                <Typography variant="body1">
                    This feature is coming soon. You will be able to manage applications associated with this organization.
                </Typography>
            </CardContent>
        </Card>
    );
};

export default OrganizationApplications; 