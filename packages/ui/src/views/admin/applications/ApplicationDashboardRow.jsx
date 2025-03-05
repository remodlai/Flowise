import React from 'react';
import PropTypes from 'prop-types';
import { 
    Box, 
    Typography, 
    IconButton, 
    Tooltip, 
    Grid, 
    Paper,
    Chip,
    useTheme
} from '@mui/material';
import { 
    IconEye, 
    IconEdit, 
    IconTrash, 
    IconWorld,
    IconUsers,
    IconApps,
    IconBuilding,
    IconCalendar,
    IconDatabase,
    IconKey,
    IconFileDescription,
    IconPhoto,
    IconDeviceFloppy,
    IconArrowDownRight,
    IconDotsVertical,
    IconFiles
} from '@tabler/icons-react';

// Import reusable components
import StatusChip from '@/ui-component/extended/StatusChip';

// Larger stat card for main metrics
const MainStatCard = ({ icon, value, label, iconColor }) => {
    return (
        <Paper
            sx={{ 
                height: '160px',
                backgroundColor: '#1E1E24',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#111',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: iconColor || '#FF6B00',
                    mb: 2
                }}
            >
                {icon}
            </Box>

            <Typography
                variant="h3"
                sx={{
                    fontWeight: 'bold',
                    color: '#fff',
                    fontSize: '32px',
                    lineHeight: 1.2,
                    mt: 'auto'
                }}
            >
                {value}
            </Typography>

            <Typography
                sx={{
                    fontWeight: 'normal',
                    color: '#aaa',
                    fontSize: '14px',
                    mt: 1
                }}
            >
                {label}
            </Typography>
        </Paper>
    );
};

// Smaller stat card for secondary metrics
const StatCard = ({ icon, value, label, iconColor, hasMenu = false }) => {
    return (
        <Paper
            sx={{ 
                height: '80px',
                backgroundColor: '#0F1117',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#000',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: iconColor || '#FF6B00'
                }}
            >
                {React.cloneElement(icon, { size: 18 })}
            </Box>

            <Box sx={{ ml: 2, flex: 1 }}>
                <Typography
                    sx={{
                        fontWeight: 'bold',
                        color: '#fff',
                        fontSize: '18px',
                        lineHeight: 1.2
                    }}
                >
                    {value}
                </Typography>

                <Typography
                    sx={{
                        fontWeight: 'normal',
                        color: '#aaa',
                        fontSize: '12px',
                    }}
                >
                    {label}
                </Typography>
            </Box>

            {hasMenu && (
                <Box sx={{ ml: 'auto' }}>
                    <IconButton size="small" sx={{ color: '#aaa', p: 0.5 }}>
                        <IconDotsVertical size={14} />
                    </IconButton>
                </Box>
            )}
        </Paper>
    );
};

const ApplicationDashboardRow = ({ 
    application, 
    onView, 
    onEdit, 
    onDelete,
    formatDate
}) => {
    const theme = useTheme();
    
    return (
        <Box
            sx={{
                backgroundColor: '#181A23',
                width: "100%",
                borderRadius: 2,
                overflow: 'hidden',
                p: 3,
                mb: 3,
                position: 'relative'
            }}
        >
            <Grid container spacing={3}>
                {/* Left section - Application info */}
                <Grid item xs={12} md={3}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 'bold',
                            color: '#fff',
                            mb: 1
                        }}
                    >
                        {application.name}
                    </Typography>

                    <Typography
                        sx={{
                            color: '#aaa',
                            fontSize: '14px',
                            mb: 2
                        }}
                    >
                        {application.description}
                    </Typography>

                    <Typography
                        sx={{
                            color: '#aaa',
                            fontSize: '14px',
                            mb: 0.5
                        }}
                    >
                        Website
                    </Typography>
                    <Typography
                        component="a"
                        href={application.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            color: '#3B82F6',
                            fontSize: '14px',
                            textDecoration: 'none',
                            mb: 2,
                            display: 'block'
                        }}
                    >
                        {application.website}
                    </Typography>

                    <Typography
                        sx={{
                            color: '#aaa',
                            fontSize: '14px',
                            mb: 0.5
                        }}
                    >
                        Version
                    </Typography>
                    <Typography
                        sx={{
                            color: '#aaa',
                            fontSize: '14px',
                            mb: 2
                        }}
                    >
                        {application.version || "0.0.0"}
                    </Typography>

                    <Chip
                        label={application.status}
                        sx={{
                            backgroundColor: application.status === 'Active' || application.status === 'Production' ? "#10B981" : "rgba(255,100,100,0.2)",
                            color: '#fff',
                            borderRadius: '16px',
                            fontSize: '14px',
                            fontWeight: 'medium'
                        }}
                    />
                </Grid>
                
                {/* Middle section - Main Stats (taller cards) */}
                <Grid item xs={12} md={5}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <MainStatCard 
                                icon={<IconApps size={24} />} 
                                value={application.flowCount || 12} 
                                label="Agent Flows" 
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <MainStatCard 
                                icon={<IconKey size={24} />} 
                                value={11} 
                                label="Credentials" 
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <MainStatCard 
                                icon={<IconDatabase size={24} />} 
                                value={3} 
                                label="Databases" 
                            />
                        </Grid>
                    </Grid>
                    
                    {/* Additional info */}
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', color: '#10B981' }}>
                        <IconArrowDownRight size={16} />
                        <Typography sx={{ ml: 1, fontSize: '14px', fontWeight: 'medium' }}>
                            +4.5%
                        </Typography>
                        <Typography sx={{ ml: 2, color: '#aaa', fontSize: '14px' }}>
                            • $3,440
                        </Typography>
                    </Box>
                </Grid>
                
                {/* Right section - Additional Stats (3 rows of 2 cards) */}
                <Grid item xs={12} md={4}>
                    <Grid container spacing={2}>
                        {/* Row 1 */}
                        <Grid item xs={6}>
                            <StatCard 
                                icon={<IconBuilding size={24} stroke={1.5} />} 
                                value={application.organizationCount || 12} 
                                label="Organizations" 
                                iconColor="#FF9500"
                                hasMenu
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <StatCard 
                                icon={<IconUsers size={24} stroke={1.5} />} 
                                value={application.userCount || 192} 
                                label="Users" 
                                iconColor="#10B981"
                                hasMenu
                            />
                        </Grid>
                        
                        {/* Row 2 */}
                        <Grid item xs={6}>
                            <StatCard 
                                icon={<IconPhoto size={24} stroke={1.5} />} 
                                value="12.5gb" 
                                label="Total Image Storage" 
                                iconColor="#3B82F6"
                                hasMenu
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <StatCard 
                                icon={<IconDeviceFloppy size={24} stroke={1.5} />} 
                                value="9.6gb" 
                                label="Total File Storage" 
                                iconColor="#3B82F6"
                                hasMenu
                            />
                        </Grid>
                        
                        {/* Row 3 */}
                        <Grid item xs={6}>
                            <StatCard 
                                icon={<IconPhoto size={24} stroke={1.5} />} 
                                value="1,523" 
                                label="Images" 
                                iconColor="#FF6B00"
                                hasMenu
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <StatCard 
                                icon={<IconFiles size={24} stroke={1.5} />} 
                                value="596" 
                                label="Files" 
                                iconColor="#3B82F6"
                                hasMenu
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Action Buttons - positioned absolutely */}
            <Box sx={{ 
                position: 'absolute', 
                top: 16, 
                right: 16,
                display: 'flex',
                gap: 1
            }}>
                <Tooltip title="View Details">
                    <IconButton 
                        onClick={() => onView(application.id)}
                        sx={{ 
                            color: '#fff',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <IconEye size={20} stroke={1.5} />
                    </IconButton>
                </Tooltip>
                
                <Tooltip title="Edit Application">
                    <IconButton 
                        onClick={() => onEdit(application)}
                        sx={{ 
                            color: '#fff',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <IconEdit size={20} stroke={1.5} />
                    </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete Application">
                    <IconButton 
                        onClick={() => onDelete(application.id)}
                        sx={{ 
                            color: '#fff',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <IconTrash size={20} stroke={1.5} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
};

MainStatCard.propTypes = {
    icon: PropTypes.element.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    iconColor: PropTypes.string
};

StatCard.propTypes = {
    icon: PropTypes.element.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    iconColor: PropTypes.string,
    hasMenu: PropTypes.bool
};

ApplicationDashboardRow.propTypes = {
    application: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        logo: PropTypes.string,
        website: PropTypes.string,
        version: PropTypes.string,
        organizationCount: PropTypes.number,
        userCount: PropTypes.number,
        flowCount: PropTypes.number,
        createdAt: PropTypes.string.isRequired,
        updatedAt: PropTypes.string,
        status: PropTypes.string.isRequired
    }).isRequired,
    onView: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    formatDate: PropTypes.func.isRequired
};

export default ApplicationDashboardRow; 