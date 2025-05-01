import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Dialog,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Typography,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import MuiAlert from '@mui/material/Alert';
import DataTable from 'react-data-table-component';
import { API_ENDPOINTS, getAuthHeader } from '../apiConfig/apiConfig';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const ManageLoginStatus = () => {
  const [loginStatuses, setLoginStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: '', data: null });
  const navigate = useNavigate();

  // Fetch login statuses
  const fetchLoginStatuses = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        API_ENDPOINTS.loginStatus,
        getAuthHeader()
      );
      setLoginStatuses(response.data);
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: 'Error loading login statuses',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginStatuses();
  }, []);

  const handleSubmit = async () => {
    try {
      if (editingStatus) {
        // Update existing status
        await axios.put(
          `${API_ENDPOINTS.loginStatus}/${editingStatus.id}`,
          { 
            name: formData.name,
            oldName: editingStatus.name // Send old name for updating employee records
          },
          getAuthHeader()
        );
        
        setSnackbar({
          open: true,
          message: 'Login status updated successfully',
          severity: 'success'
        });
      } else {
        // Create new status
        await axios.post(
          API_ENDPOINTS.loginStatus,
          formData,
          getAuthHeader()
        );
        
        setSnackbar({
          open: true,
          message: 'Login status added successfully',
          severity: 'success'
        });
      }
      
      setIsModalOpen(false);
      setFormData({ name: '' });
      setEditingStatus(null);
      fetchLoginStatuses();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error processing login status',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${API_ENDPOINTS.loginStatus}/${id}`,
        getAuthHeader()
      );
      
      setSnackbar({
        open: true,
        message: 'Login status deleted successfully',
        severity: 'success'
      });
      
      setIsConfirmDeleteOpen(false);
      setStatusToDelete(null);
      fetchLoginStatuses();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error deleting login status',
        severity: 'error'
      });
    }
  };

  const handleSubmitClick = () => {
    if (!formData.name) {
      setSnackbar({
        open: true,
        message: 'Status name is required',
        severity: 'error'
      });
      return;
    }
    setConfirmAction({ 
      type: editingStatus ? 'update' : 'create', 
      data: formData 
    });
    setIsConfirmOpen(true);
  };

  // Add confirmation dialog component
  const ConfirmDialog = () => (
    <Dialog
      open={isConfirmOpen}
      onClose={() => setIsConfirmOpen(false)}
      maxWidth="xs"
      fullWidth
    >
      <Box sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Confirm {confirmAction.type === 'update' ? 'Update' : 
                  confirmAction.type === 'delete' ? 'Delete' : 'Create'}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2.5 }}>
          {confirmAction.type === 'delete' 
            ? 'Are you sure you want to delete this login status?' 
            : `Are you sure you want to ${confirmAction.type} this login status?`}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setIsConfirmOpen(false)}
            sx={{ 
              color: '#424242',
              borderColor: '#424242',
              '&:hover': { 
                borderColor: '#212121',
                bgcolor: 'rgba(33, 33, 33, 0.04)' 
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmAction.type === 'delete' ? 'error' : 'primary'}
            onClick={() => {
              if (confirmAction.type === 'delete') {
                handleDelete(confirmAction.data.id);
              } else {
                handleSubmit();
              }
              setIsConfirmOpen(false);
            }}
            sx={confirmAction.type === 'delete' 
              ? { 
                  bgcolor: '#d32f2f', 
                  '&:hover': { bgcolor: '#c62828' }
                }
              : {
                  bgcolor: '#1a237e', 
                  '&:hover': { bgcolor: '#283593' }
                }
            }
          >
            Confirm
          </Button>
        </Box>
      </Box>
    </Dialog>
  );

  const handleDeleteClick = (status) => {
    setConfirmAction({ 
      type: 'delete', 
      data: status 
    });
    setIsConfirmOpen(true);
  };

  const handleEditClick = (status) => {
    if (status.is_default) {
      setSnackbar({
        open: true,
        message: 'Cannot modify system default login status',
        severity: 'error'
      });
      return;
    }
    setEditingStatus(status);
    setFormData({ name: status.name });
    setIsModalOpen(true);
  };

  const columns = [
    {
      name: 'Login Status Name',
      selector: row => row.name,
      cell: row => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography>
            {row.name}
          </Typography>
          {row.is_default && (
            <Chip
              label="Default"
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      ),
      sortable: true,
      grow: 2
    },
    {
      name: 'Actions',
      cell: row => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!row.is_default && (
            <>
              <IconButton 
                size="small" 
                onClick={() => handleEditClick(row)}
                sx={{ 
                  color: '#1a237e',
                  '&:hover': { 
                    bgcolor: 'rgba(26, 35, 126, 0.04)' 
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => handleDeleteClick(row)}
                sx={{ 
                  color: '#d32f2f',
                  '&:hover': { 
                    bgcolor: 'rgba(211, 47, 47, 0.04)' 
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      ),
      width: '100px'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Login Status Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsModalOpen(true)}
          sx={{ bgcolor: '#1a237e', '&:hover': { bgcolor: '#283593' } }}  // Dark blue
        >
          Add New Status
        </Button>
      </Box>

      <Paper>
        <DataTable
          columns={columns}
          data={loginStatuses}
          pagination
          progressPending={isLoading}
          highlightOnHover
        />
      </Paper>

      {/* Add Modal */}
      <Dialog 
        open={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingStatus(null);
          setFormData({ name: '' });
        }}
        maxWidth="xs"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {editingStatus ? 'Edit Login Status' : 'Add New Login Status'}
          </Typography>
          
          <TextField
            fullWidth
            label="Status Name"
            value={formData.name}
            onChange={(e) => setFormData({ name: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={() => {
                setIsModalOpen(false);
                setEditingStatus(null);
                setFormData({ name: '' });
              }}
              sx={{ 
                color: '#424242',
                borderColor: '#424242',
                '&:hover': { 
                  borderColor: '#212121',
                  bgcolor: 'rgba(33, 33, 33, 0.04)' 
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained"
              onClick={handleSubmitClick}
              sx={{ 
                bgcolor: '#1a237e', 
                '&:hover': { bgcolor: '#283593' }
              }}
            >
              {editingStatus ? 'Update' : 'Add'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Confirm Delete
          </Typography>
          <Typography>
            Are you sure you want to delete this login status?
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
            <Button 
              onClick={() => setIsConfirmDeleteOpen(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleDelete(statusToDelete?.id)}
              variant="contained" 
              color="error"
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ConfirmDialog />
    </Box>
  );
};

export default ManageLoginStatus;