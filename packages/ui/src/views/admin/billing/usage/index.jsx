import React from 'react'
import { Typography, Grid } from '@mui/material'
import MainCard from '@/ui-component/cards/MainCard'

const UsageReports = () => {
    return (
        <MainCard title="Usage Reports">
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="body1">
                        View platform usage metrics and reports.
                    </Typography>
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default UsageReports 