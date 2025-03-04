import React from 'react'
import { Typography, Grid } from '@mui/material'
import MainCard from '@/ui-component/cards/MainCard'

const Subscriptions = () => {
    return (
        <MainCard title="Subscriptions">
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="body1">
                        Manage user and organization subscriptions.
                    </Typography>
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default Subscriptions 