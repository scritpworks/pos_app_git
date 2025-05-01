import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Checkbox,
  Modal,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS, getAuthHeader } from '../apiConfig/apiConfig';
import './ManageRoles.css';

const ManageRoles = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  // Update the formData state to use dynamic permissions
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {} // Will be populated dynamically from fetched permissions
  });
  // Add state for form validation
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchRoles = async () => {
    try {
      const response = await axios.get(
        API_ENDPOINTS.roles,
        getAuthHeader()
      );
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setSnackbar({
        open: true,
        message: 'Error loading roles',
        severity: 'error'
      });
    }
  };

  // Add/Update the permissions fetching code
  const fetchPermissions = async () => {
    try {
      const response = await axios.get(
        API_ENDPOINTS.permissions,
        getAuthHeader()
      );

      // Transform the permissions data
      const transformedPermissions = response.data.map(perm => ({
        id: perm.id,
        name: perm.name,
        display_name: perm.display_name,
        path: perm.path
      }));

      setPermissions(transformedPermissions);
      
      // Initialize formData permissions with fetched permissions
      const initialPermissions = transformedPermissions.reduce((acc, perm) => ({
        ...acc,
        [perm.id]: false
      }), {});
      
      setFormData(prev => ({
        ...prev,
        permissions: initialPermissions
      }));

    } catch (error) {
      console.error('Error fetching permissions:', error);
      setSnackbar({
        open: true,
        message: 'Error loading permissions',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchRoles(),
          fetchPermissions()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setSnackbar({
          open: true,
          message: 'Error loading data',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Update handleOpenModal to handle permission IDs
  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      // Convert array of permission IDs to object with boolean values
      const permissionState = permissions.reduce((acc, perm) => ({
        ...acc,
        [perm.id]: role.permissions.includes(perm.id)
      }), {});
      
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: permissionState
      });
    } else {
      setEditingRole(null);
      // Reset form with all permissions set to false
      const initialPermissions = permissions.reduce((acc, perm) => ({
        ...acc,
        [perm.id]: false
      }), {});
      
      setFormData({
        name: '',
        description: '',
        permissions: initialPermissions
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: {
        dashboard: false,
        inventory: false,
        sales: false,
        purchases: false,
        suppliers: false,
        customers: false,
        reports: false,
        settings: false,
      },
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add form validation function
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Role name is required';
    }
    
    const selectedPermissions = Object.values(formData.permissions).filter(Boolean);
    if (selectedPermissions.length === 0) {
      errors.permissions = 'At least one permission must be selected';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add submit handler
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Get selected permission IDs
      const selectedPermissions = Object.entries(formData.permissions)
        .filter(([_, value]) => value)
        .map(([key]) => Number(key)); // Convert ID back to number

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        permissions: selectedPermissions
      };

      if (editingRole) {
        await axios.put(
          `${API_ENDPOINTS.roles}/${editingRole.id}`,
          payload,
          getAuthHeader()
        );
        setSnackbar({
          open: true,
          message: 'Role updated successfully',
          severity: 'success'
        });
      } else {
        await axios.post(
          API_ENDPOINTS.roles,
          payload,
          getAuthHeader()
        );
        setSnackbar({
          open: true,
          message: 'Role created successfully',
          severity: 'success'
        });
      }

      handleCloseModal();
      fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error saving role',
        severity: 'error'
      });
    }
  };

  // Add permission change handler
  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }));
  };

  // Update the renderModalContent to use Material-UI components properly
  const renderModalContent = () => (
    <Paper 
      sx={{ 
        width: '100%',
        maxWidth: 600,
        mx: 'auto',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}
    >
      <Box sx={{ 
        p: 2,
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        bgcolor: 'white',
        zIndex: 1
      }}>
        <Typography variant="h6" sx={{ 
          color: 'rgb(26, 32, 53)',
          fontWeight: 600,
          fontSize: '1.25rem'
        }}>
          {editingRole ? 'Edit Role' : 'Create New Role'}
        </Typography>
        <IconButton
          onClick={() => setIsModalOpen(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'rgb(100, 116, 139)'
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Role Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={!!formErrors.name}
            helperText={formErrors.name}
            size="small"
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                fontSize: '0.875rem'
              }
            }}
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
            size="small"
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                fontSize: '0.875rem'
              }
            }}
          />

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography sx={{ 
              fontSize: '0.875rem',
              color: 'rgb(100, 116, 139)',
              mb: 2,
              fontWeight: 500
            }}>
              Permissions
            </Typography>
            {formErrors.permissions && (
              <Typography color="error" sx={{ 
                fontSize: '0.75rem',
                mb: 1 
              }}>
                {formErrors.permissions}
              </Typography>
            )}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 1,
              maxHeight: '300px',
              overflowY: 'auto',
              px: 1
            }}>
              {permissions.map(permission => (
                <FormControlLabel
                  key={permission.id}
                  control={
                    <Checkbox
                      checked={formData.permissions[permission.id] || false}
                      onChange={() => handlePermissionChange(permission.id)}
                      size="small"
                    />
                  }
                  label={
                    <Typography sx={{ 
                      fontSize: '0.875rem',
                      color: 'rgb(26, 32, 53)'
                    }}>
                      {permission.display_name}
                    </Typography>
                  }
                  sx={{
                    m: 0,
                    '& .MuiCheckbox-root': {
                      p: 1
                    }
                  }}
                />
              ))}
            </Box>
          </Paper>
        </Stack>
      </Box>

      <Box sx={{ 
        p: 2,
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 1,
        bgcolor: 'white',
        position: 'sticky',
        bottom: 0
      }}>
        <Button
          variant="outlined"
          onClick={() => setIsModalOpen(false)}
          size="small"
          sx={{
            color: 'rgb(26, 32, 53)',
            borderColor: '#e2e8f0',
            '&:hover': {
              borderColor: '#cbd5e1',
              bgcolor: '#f8fafc'
            },
            textTransform: 'uppercase',
            fontWeight: 500,
            fontSize: '0.75rem'
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          size="small"
          sx={{
            bgcolor: 'rgb(26, 32, 53)',
            '&:hover': {
              bgcolor: 'rgb(26, 32, 53, 0.9)'
            },
            textTransform: 'uppercase',
            fontWeight: 500,
            fontSize: '0.75rem'
          }}
        >
          {editingRole ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Paper>
  );

  const renderPermissions = (rolePermissions) => {
    return permissions.map(permission => (
      <Box key={permission.id} className="permission-item">
        <Checkbox 
          checked={rolePermissions.includes(permission.id)} 
          disabled 
        />
        <Typography>{permission.display_name}</Typography>
      </Box>
    ));
  };

  const handleDeleteClick = (role) => {
    setRoleToDelete(role);
    setIsConfirmDeleteOpen(true);
  };

  const handleCancelDelete = () => {
    setRoleToDelete(null);
    setIsConfirmDeleteOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(
        `${API_ENDPOINTS.roles}/${roleToDelete.id}`,
        getAuthHeader()
      );

      setSnackbar({
        open: true,
        message: 'Role deleted successfully',
        severity: 'success'
      });

      fetchRoles(); // Refresh the roles list
    } catch (error) {
      console.error('Error deleting role:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error deleting role',
        severity: 'error'
      });
    } finally {
      setIsConfirmDeleteOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Update the return statement and related components
  return (
    <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          bgcolor: 'white',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}>
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#1e293b',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                mb: 0.5
              }}
            >
              Role Management
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
              Create and manage user roles and their permissions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{
              bgcolor: '#0f172a',
              '&:hover': {
                bgcolor: '#1e293b'
              },
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              borderRadius: 2,
              px: 3,
              py: 1,
              boxShadow: 'none'
            }}
          >
            New Role
          </Button>
        </Box>
      </Paper>

      {/* Roles Grid */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)' 
        },
        gap: 3
      }}>
        {roles.map((role) => (
          <Paper
            key={role.id}
            elevation={0}
            sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: '#cbd5e1',
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <Box sx={{ 
              p: 2.5,
              borderBottom: '1px solid #e2e8f0',
              bgcolor: 'white'
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 1
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ 
                    fontWeight: 600,
                    color: '#0f172a',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    {role.name}
                    {role.name === 'Administrator' && (
                      <Box
                        component="span"
                        sx={{
                          fontSize: '0.75rem',
                          bgcolor: '#0f172a',
                          color: 'white',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '1rem',
                          fontWeight: 500
                        }}
                      >
                        System
                      </Box>
                    )}
                  </Typography>
                  <Typography sx={{ 
                    color: '#64748b',
                    fontSize: '0.875rem',
                    mt: 0.5,
                    lineHeight: 1.5
                  }}>
                    {role.description || 'No description provided'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenModal(role)}
                    sx={{ 
                      color: '#64748b',
                      '&:hover': { 
                        color: '#0f172a',
                        bgcolor: '#f1f5f9'
                      },
                      p: 1
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  {role.name !== 'Administrator' && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(role)}
                      sx={{ 
                        color: '#64748b',
                        '&:hover': { 
                          color: '#ef4444',
                          bgcolor: '#fef2f2'
                        },
                        p: 1
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>
            <Box sx={{ 
              p: 2,
              bgcolor: '#f8fafc',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1
              }}>
                {permissions.map(permission => (
                  <Box
                    key={permission.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'white',
                      border: '1px solid #e2e8f0',
                      '&:hover': {
                        borderColor: '#cbd5e1'
                      }
                    }}
                  >
                    <Checkbox
                      checked={role.permissions.includes(permission.id)}
                      disabled
                      size="small"
                      sx={{
                        color: '#94a3b8',
                        '&.Mui-checked': {
                          color: '#0f172a'
                        },
                        padding: 0
                      }}
                    />
                    <Typography sx={{ 
                      fontSize: '0.813rem',
                      color: '#334155',
                      fontWeight: 500,
                      lineHeight: 1.2
                    }}>
                      {permission.display_name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Add loading and empty states here */}
      {isLoading && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400 
        }}>
          <CircularProgress size={40} sx={{ color: '#0f172a' }} />
        </Box>
      )}

      {!isLoading && roles.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            textAlign: 'center',
            py: 8,
            px: 3,
            borderRadius: 3,
            border: '1px dashed #cbd5e1',
            bgcolor: 'white'
          }}
        >
          <Typography sx={{ 
            color: '#0f172a',
            fontWeight: 600,
            mb: 1
          }}>
            No Roles Found
          </Typography>
          <Typography sx={{ 
            color: '#64748b',
            fontSize: '0.875rem',
            mb: 3
          }}>
            Get started by creating your first role
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{
              color: '#0f172a',
              borderColor: '#cbd5e1',
              '&:hover': {
                borderColor: '#94a3b8',
                bgcolor: '#f8fafc'
              },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Add New Role
          </Button>
        </Paper>
      )}
      {/* Modal for Add/Edit Role */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4 }
        }}
      >
        {renderModalContent()}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        open={isConfirmDeleteOpen}
        onClose={handleCancelDelete}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4 }
        }}
      >
        <Paper sx={{ 
          width: '100%',
          maxWidth: 400,
          borderRadius: 2,
          p: 3
        }}>
          <Typography variant="h6" sx={{ 
            mb: 2,
            color: 'rgb(26, 32, 53)',
            fontWeight: 600
          }}>
            Delete Role
          </Typography>
          <Typography sx={{ 
            mb: 3,
            color: 'rgb(100, 116, 139)',
            fontSize: '0.875rem'
          }}>
            Are you sure you want to delete this role? This action cannot be undone.
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: 1.5
          }}>
            <Button
              variant="outlined"
              onClick={handleCancelDelete}
              sx={{
                color: 'rgb(26, 32, 53)',
                borderColor: '#e2e8f0',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  bgcolor: '#f8fafc'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmDelete}
              sx={{
                bgcolor: '#ef4444',
                '&:hover': {
                  bgcolor: '#dc2626'
                }
              }}
            >
              Delete
            </Button>
          </Box>
        </Paper>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageRoles;
