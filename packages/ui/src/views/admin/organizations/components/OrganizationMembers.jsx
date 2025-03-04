import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Paper
} from '@mui/material';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDotsVertical,
    IconMail,
    IconUser,
    IconUserCheck,
    IconUserX
} from '@tabler/icons-react';
import StatusChip from '../../../../ui-component/extended/StatusChip';
import RoleChip from '../../../../ui-component/extended/RoleChip';
import UserAvatar from '../../../../ui-component/extended/UserAvatar';

// Sample members data
const sampleMembers = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@acmecorp.com',
        role: 'Admin',
        status: 'Active',
        joinedAt: '2023-01-20',
        avatar: null
    },
    {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@acmecorp.com',
        role: 'Member',
        status: 'Active',
        joinedAt: '2023-02-15',
        avatar: null
    },
    {
        id: 3,
        name: 'Robert Johnson',
        email: 'robert.johnson@acmecorp.com',
        role: 'Owner',
        status: 'Active',
        joinedAt: '2023-01-10',
        avatar: null
    },
    {
        id: 4,
        name: 'Emily Davis',
        email: 'emily.davis@acmecorp.com',
        role: 'Member',
        status: 'Pending',
        joinedAt: '2023-03-05',
        avatar: null
    }
];

const OrganizationMembers = ({ organizationId, members = sampleMembers }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'Member',
        status: 'Pending'
    });
    
    // Handle menu open
    const handleMenuOpen = (event, member) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setSelectedMember(member);
    };
    
    // Handle menu close
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    
    // Handle dialog open for adding
    const handleAddMember = () => {
        setDialogMode('add');
        setFormData({
            name: '',
            email: '',
            role: 'Member',
            status: 'Pending'
        });
        setDialogOpen(true);
    };
    
    // Handle dialog open for editing
    const handleEditMember = () => {
        setDialogMode('edit');
        setFormData({
            name: selectedMember.name,
            email: selectedMember.email,
            role: selectedMember.role,
            status: selectedMember.status
        });
        setDialogOpen(true);
        handleMenuClose();
    };
    
    // Handle dialog close
    const handleDialogClose = () => {
        setDialogOpen(false);
    };
    
    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    
    // Handle form submit
    const handleSubmit = () => {
        // Here you would typically save the data to your backend
        console.log('Form submitted:', formData);
        
        // Close the dialog
        handleDialogClose();
    };
    
    return (
        <>
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h4">
                            Members
                        </Typography>
                        <Button 
                            variant="contained" 
                            startIcon={<IconPlus size={18} />}
                            onClick={handleAddMember}
                        >
                            Add Member
                        </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    {members.length === 0 ? (
                        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                            No members found for this organization.
                        </Typography>
                    ) : (
                        <TableContainer component={Paper} elevation={0} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Member</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Joined</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {members.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <UserAvatar 
                                                        name={member.name} 
                                                        src={member.avatar}
                                                        subtitle={member.email}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <RoleChip role={member.role} />
                                            </TableCell>
                                            <TableCell>
                                                <StatusChip status={member.status} />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(member.joinedAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={(e) => handleMenuOpen(e, member)}
                                                >
                                                    <IconDotsVertical size={18} stroke={1.5} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
            
            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    elevation: 3,
                    sx: { minWidth: 180, borderRadius: '8px' }
                }}
            >
                <MenuItem onClick={handleEditMember}>
                    <ListItemIcon>
                        <IconEdit size={18} stroke={1.5} />
                    </ListItemIcon>
                    <ListItemText>Edit Member</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon>
                        <IconUserCheck size={18} stroke={1.5} />
                    </ListItemIcon>
                    <ListItemText>Change Role</ListItemText>
                </MenuItem>
                {selectedMember?.status === 'Active' ? (
                    <MenuItem onClick={handleMenuClose}>
                        <ListItemIcon>
                            <IconUserX size={18} stroke={1.5} />
                        </ListItemIcon>
                        <ListItemText>Deactivate</ListItemText>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={handleMenuClose}>
                        <ListItemIcon>
                            <IconUserCheck size={18} stroke={1.5} />
                        </ListItemIcon>
                        <ListItemText>Activate</ListItemText>
                    </MenuItem>
                )}
                <MenuItem 
                    onClick={handleMenuClose}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon sx={{ color: 'error.main' }}>
                        <IconTrash size={18} stroke={1.5} />
                    </ListItemIcon>
                    <ListItemText>Remove</ListItemText>
                </MenuItem>
            </Menu>
            
            {/* Add/Edit Member Dialog */}
            <Dialog 
                open={dialogOpen} 
                onClose={handleDialogClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {dialogMode === 'add' ? 'Add New Member' : 'Edit Member'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        {dialogMode === 'add' && (
                            <>
                                <Grid item xs={12}>
                                    <TextField
                                        name="email"
                                        label="Email Address"
                                        fullWidth
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        InputProps={{
                                            startAdornment: (
                                                <IconMail size={20} stroke={1.5} style={{ marginRight: '8px', opacity: 0.7 }} />
                                            )
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        name="name"
                                        label="Full Name (Optional)"
                                        fullWidth
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        InputProps={{
                                            startAdornment: (
                                                <IconUser size={20} stroke={1.5} style={{ marginRight: '8px', opacity: 0.7 }} />
                                            )
                                        }}
                                    />
                                </Grid>
                            </>
                        )}
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="role"
                                label="Role"
                                select
                                fullWidth
                                value={formData.role}
                                onChange={handleInputChange}
                            >
                                <MenuItem value="Owner">Owner</MenuItem>
                                <MenuItem value="Admin">Admin</MenuItem>
                                <MenuItem value="Member">Member</MenuItem>
                                <MenuItem value="Guest">Guest</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="status"
                                label="Status"
                                select
                                fullWidth
                                value={formData.status}
                                onChange={handleInputChange}
                            >
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Inactive">Inactive</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                    >
                        {dialogMode === 'add' ? 'Invite Member' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default OrganizationMembers; 