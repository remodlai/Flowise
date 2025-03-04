import React from 'react'
import { Typography, Grid } from '@mui/material'
import MainCard from '@/ui-component/cards/MainCard'

const Invoices = () => {
    return (
        <MainCard title="Invoices">
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="body1">
                        View and manage billing invoices.
                    </Typography>
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default Invoices 