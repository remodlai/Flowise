import React, { useState, useEffect } from 'react';
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
    Paper,
    FormControl,
    InputLabel,
    Select,
    CircularProgress
} from '@mui/material';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDotsVertical
} from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import StatusChip from '@/ui-component/extended/StatusChip';
import RoleChip from '@/ui-component/extended/RoleChip';
import UserAvatar from '@/ui-component/extended/UserAvatar';

// Import API functions
import { 
    getOrganizationMembers, 
    addOrganizationMember, 
    updateOrganizationMember, 
    removeOrganizationMember 
} from '@/api/organizations';

const OrganizationMembers = ({ organizationId }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({
        email: '',
        role: 'member'
    });
    const { enqueueSnackbar } = useSnackbar();
    
    // Fetch members on component mount
    useEffect(() => {
        fetchMembers();
    }, [organizationId]);
    
    // Function to fetch members
    const fetchMembers = async () => {
        try {
            setLoading(true);
            const response = await getOrganizationMembers(organizationId);
            setMembers(response.data.members || []);
        } catch (error) {
            console.error('Error fetching organization members:', error);
            enqueueSnackbar('Failed to load organization members', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };
    
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
            email: '',
            role: 'member'
        });
        setDialogOpen(true);
    };
    
    // Handle dialog open for editing
    const handleEditMember = () => {
        setDialogMode('edit');
        setFormData({
            role: selectedMember.role
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
    const handleSubmit = async () => {
        try {
            if (dialogMode === 'add') {
                await addOrganizationMember(organizationId, formData);
                enqueueSnackbar('Member added successfully', { variant: 'success' });
            } else {
                await updateOrganizationMember(organizationId, selectedMember.id, { role: formData.role });
                enqueueSnackbar('Member updated successfully', { variant: 'success' });
            }
            
            // Refresh members list
            fetchMembers();
            
            // Close the dialog
            handleDialogClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            enqueueSnackbar(error.response?.data?.error || 'An error occurred', { variant: 'error' });
        }
    };
    
    // Handle member removal
    const handleRemoveMember = async () => {
        try {
            await removeOrganizationMember(organizationId, selectedMember.id);
            enqueueSnackbar('Member removed successfully', { variant: 'success' });
            
            // Refresh members list
            fetchMembers();
            
            // Close the menu
            handleMenuClose();
        } catch (error) {
            console.error('Error removing member:', error);
            enqueueSnackbar(error.response?.data?.error || 'An error occurred', { variant: 'error' });
        }
    };
    
    // Show loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <CircularProgress />
            </Box>
        );
    }
    
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
                    <ListItemText>Edit Role</ListItemText>
                </MenuItem>
                <MenuItem 
                    onClick={handleRemoveMember}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon sx={{ color: 'error.main' }}>
                        <IconTrash size={18} stroke={1.5} />
                    </ListItemIcon>
                    <ListItemText>Remove Member</ListItemText>
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
                    {dialogMode === 'add' ? 'Add Member' : 'Edit Member Role'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        {dialogMode === 'add' && (
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                margin="normal"
                                variant="outlined"
                                required
                                helperText="Enter the email of the user to add"
                            />
                        )}
                        
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Role</InputLabel>
                            <Select
                                name="role"
                                value={formData.role}
                                label="Role"
                                onChange={handleInputChange}
                            >
                                <MenuItem value="owner">Owner</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="member">Member</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        disabled={dialogMode === 'add' && !formData.email}
                    >
                        {dialogMode === 'add' ? 'Add' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default OrganizationMembers; 