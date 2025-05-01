import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import './PaymentAccounts.css';

const PaymentAccounts = () => {
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      name: 'Main Business Account',
      bank: 'Chase Bank',
      accountNumber: '****4567',
      startingCapital: 0,
      isDefault: true,
    },
    {
      id: 2,
      name: 'Savings Account',
      bank: 'Bank of America',
      accountNumber: '****7890',
      startingCapital: 0,
      isDefault: false,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    accountNumber: '',
    startingCapital: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [loadingDefaultId, setLoadingDefaultId] = useState(null);

  const handleOpenModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        bank: account.bank,
        accountNumber: account.accountNumber,
        startingCapital: account.startingCapital,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        bank: '',
        accountNumber: '',
        startingCapital: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    setFormData({
      name: '',
      bank: '',
      accountNumber: '',
      startingCapital: 0,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (editingAccount) {
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === editingAccount.id
            ? {
                ...account,
                ...formData,
              }
            : account
        )
      );
      setSnackbar({
        open: true,
        message: 'Payment method updated successfully',
        severity: 'success'
      });
    } else {
      const newAccount = {
        id: accounts.length + 1,
        ...formData,
        isDefault: accounts.length === 0,
      };
      setAccounts((prev) => [...prev, newAccount]);
      setSnackbar({
        open: true,
        message: 'New payment method added successfully',
        severity: 'success'
      });
    }
    handleCloseModal();
  };

  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    setAccounts(accounts.filter(account => account.id !== accountToDelete.id));
    setIsConfirmDeleteOpen(false);
    setAccountToDelete(null);
    setSnackbar({
      open: true,
      message: 'Payment method deleted successfully',
      severity: 'success'
    });
  };

  const handleCancelDelete = () => {
    setIsConfirmDeleteOpen(false);
    setAccountToDelete(null);
  };

  const handleSetDefault = async (accountId) => {
    setLoadingDefaultId(accountId);
    try {
      // Simulate API call with 1 second delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAccounts(accounts.map(account => ({
        ...account,
        isDefault: account.id === accountId
      })));
      
      setSnackbar({
        open: true,
        message: 'Default payment method updated',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update default payment method',
        severity: 'error'
      });
    } finally {
      setLoadingDefaultId(null);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box className="roles-container">
      <Box className="roles-header">
        <Box>
          <Typography variant="h5" className="page-title">
            Payment Methods
          </Typography>
          <Typography variant="body1" color="textSecondary" className="page-subtitle">
            Manage your bank accounts and payment methods
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="add-role-button"
          onClick={() => handleOpenModal()}
          size="small"
        >
          ADD PAYMENT METHOD
        </Button>
      </Box>

      <Box className="roles-grid">
        {accounts.map((account) => (
          <Paper key={account.id} className="role-card">
            <Box className="role-header">
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BankIcon sx={{ color: 'rgb(26, 32, 53)' }} />
                  <Typography variant="h6" className="role-title">
                    {account.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {account.bank}
                </Typography>
              </Box>
              <Box className="role-actions">
                <Tooltip title="Edit Payment Method" arrow placement="top">
                  <IconButton 
                    size="small" 
                    className="edit-button"
                    onClick={() => handleOpenModal(account)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                {!account.isDefault && (
                  <Tooltip title="Delete Payment Method" arrow placement="top">
                    <IconButton 
                      size="small" 
                      className="delete-button"
                      onClick={() => handleDeleteClick(account)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Account Number
                <br />
                <strong>{account.accountNumber}</strong>
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                Starting Capital
                <br />
                <strong>${account.startingCapital.toLocaleString()}</strong>
              </Typography>

              {!account.isDefault && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleSetDefault(account.id)}
                  fullWidth
                  disabled={loadingDefaultId === account.id}
                  sx={{
                    mt: 2,
                    borderColor: 'rgb(26, 32, 53)',
                    color: 'rgb(26, 32, 53)',
                    '&:hover': { borderColor: 'rgb(26, 32, 53)' },
                    minHeight: '32px'
                  }}
                >
                  {loadingDefaultId === account.id ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} thickness={4} sx={{ color: 'rgb(26, 32, 53)' }} />
                      <span>Setting Default...</span>
                    </Box>
                  ) : (
                    'Set as Default'
                  )}
                </Button>
              )}
              {account.isDefault && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1,
                    textAlign: 'center',
                    bgcolor: 'rgb(26, 32, 53)',
                    color: 'white',
                    borderRadius: 1,
                    fontSize: '0.875rem',
                  }}
                >
                  Default Account
                </Box>
              )}
            </Box>
          </Paper>
        ))}
      </Box>

      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        disablePortal={false}
        keepMounted={false}
        sx={{ 
          zIndex: 9999,
          '& .MuiDialog-paper': {
            borderRadius: '12px',
            maxWidth: '450px',
            margin: { xs: '16px', sm: '32px' },
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
            overflow: 'visible',
            position: 'relative',
            zIndex: 9999
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998,
            backdropFilter: 'none'
          }
        }}
      >
        <Box sx={{ 
          p: 3,
          position: 'relative',
          '&:focus': { outline: 'none' }
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3
          }}>
            <Typography variant="h5" sx={{ 
              color: 'rgb(26, 32, 53)',
              fontSize: '1.5rem',
              fontWeight: 600
            }}>
              {editingAccount ? 'Edit Payment Method' : 'Add Payment Method'}
            </Typography>
            <IconButton 
              onClick={handleCloseModal}
              size="small"
              sx={{ 
                color: 'rgb(26, 32, 53)',
                position: 'absolute',
                right: 16,
                top: 16,
                zIndex: 10000
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Account Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)' }
              }}
              placeholder="Account Name"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            <TextField
              fullWidth
              label="Bank Name"
              name="bank"
              value={formData.bank}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)' }
              }}
              placeholder="Bank Name"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            <TextField
              fullWidth
              label="Account Number"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)' }
              }}
              placeholder="Account Number"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            <TextField
              fullWidth
              label="Starting Capital"
              name="startingCapital"
              type="number"
              value={formData.startingCapital}
              onChange={handleInputChange}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <Typography sx={{ color: 'rgb(100, 116, 139)', mr: 1 }}>
                    $
                  </Typography>
                ),
              }}
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)' }
              }}
              placeholder="0"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Stack>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2,
            mt: 4
          }}>
            <Button
              variant="outlined"
              onClick={handleCloseModal}
              sx={{
                color: 'rgb(26, 32, 53)',
                borderColor: 'rgb(26, 32, 53)',
                borderRadius: '8px',
                '&:hover': {
                  borderColor: 'rgb(26, 32, 53)',
                  backgroundColor: 'rgba(26, 32, 53, 0.04)'
                },
                px: 3,
                py: 1,
                textTransform: 'uppercase',
                fontWeight: 500,
                minWidth: '120px'
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{
                bgcolor: 'rgb(26, 32, 53)',
                borderRadius: '8px',
                '&:hover': {
                  bgcolor: 'rgb(26, 32, 53, 0.9)'
                },
                px: 3,
                py: 1,
                textTransform: 'uppercase',
                fontWeight: 500,
                minWidth: '120px'
              }}
            >
              {editingAccount ? 'Save Changes' : 'Add Account'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Confirm Delete Modal */}
      <Dialog 
        open={isConfirmDeleteOpen} 
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
        disablePortal={false}
        keepMounted={false}
        sx={{ 
          zIndex: 9999,
          '& .MuiDialog-paper': {
            borderRadius: '12px',
            maxWidth: '400px',
            margin: { xs: '16px', sm: '32px' },
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
            overflow: 'visible',
            position: 'relative',
            zIndex: 9999
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998,
            backdropFilter: 'none'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ 
            color: 'rgb(26, 32, 53)',
            fontWeight: 600,
            mb: 2
          }}>
            Delete Payment Method
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: '#64748b', 
            mb: 3 
          }}>
            Are you sure you want to delete this payment method? This action cannot be undone.
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2 
          }}>
            <Button
              variant="outlined"
              onClick={handleCancelDelete}
              sx={{
                color: 'rgb(26, 32, 53)',
                borderColor: 'rgb(26, 32, 53)',
                '&:hover': {
                  borderColor: 'rgb(26, 32, 53)',
                  backgroundColor: 'rgba(26, 32, 53, 0.04)'
                },
                px: 3,
                textTransform: 'uppercase',
                fontWeight: 500
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
                },
                px: 3,
                textTransform: 'uppercase',
                fontWeight: 500
              }}
            >
              Delete Account
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        className="snackbar"
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentAccounts;
