import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert, CircularProgress, MenuItem, Select, InputLabel, FormControl, 
  Grid, Chip, Autocomplete, Stack, Tooltip, Zoom
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { API_ENDPOINTS, getAuthHeader } from '../apiConfig/apiConfig';
import axios from 'axios';

const transferStatuses = ['Pending', 'Received'];

const StockTransfers = () => {
  // State for transfers list
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // State for new transfer
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('Pending');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { product: null, quantity: '' }
  ]);

  // State for data loading
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add new state for product stock
  const [productStocks, setProductStocks] = useState({});

  // State for actions
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null
  });

  // Fetch data functions
  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.stockTransfers, getAuthHeader());
      
      if (response.data.success) {
        setTransfers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to load transfers',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBranchesAndProducts = useCallback(async () => {
    setLoadingBranches(true);
    setLoadingProducts(true);
    try {
      const [branchRes, prodRes] = await Promise.all([
        axios.get(API_ENDPOINTS.branches, getAuthHeader()),
        axios.get(API_ENDPOINTS.products, getAuthHeader())
      ]);
      
      if (branchRes.data) {
        // Filter out main store and inactive branches
        const filteredBranches = branchRes.data.filter(
          branch => branch.is_active === 1 && branch.name.toLowerCase() !== 'main store'
        );
        setBranches(filteredBranches);
      }

      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
        // Create a map of product stocks
        const stockMap = {};
        prodRes.data.data.forEach(product => {
          stockMap[product.id] = product.stock_quantity || 0;
        });
        setProductStocks(stockMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error loading data', 
        severity: 'error' 
      });
    } finally {
      setLoadingBranches(false);
      setLoadingProducts(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  // Handlers
  const handleOpenAddDialog = useCallback(() => {
    setSelectedBranch(null);
    setTransferDate(new Date().toISOString().slice(0, 10));
    setStatus('Pending');
    setNotes('');
    setItems([{ product: null, quantity: '' }]);
    fetchBranchesAndProducts();
    setAddDialogOpen(true);
  }, [fetchBranchesAndProducts]);

  const handleCloseDialog = useCallback(() => {
    setAddDialogOpen(false);
  }, []);

  // Product selection handler with duplicate and stock validation
  const handleItemChange = useCallback((idx, field, value) => {
    setItems(prev => {
      const newItems = [...prev];
      
      // If changing product, check if it's already selected in another row
      if (field === 'product' && value) {
        const isDuplicate = newItems.some((item, i) => 
          i !== idx && item.product && item.product.id === value.id
        );
        
        if (isDuplicate) {
          setSnackbar({
            open: true,
            message: 'This product is already selected',
            severity: 'error'
          });
          return prev;
        }
      }

      // If changing quantity, validate against available stock
      if (field === 'quantity' && newItems[idx].product) {
        const availableStock = productStocks[newItems[idx].product.id] || 0;
        if (parseInt(value) > availableStock) {
          setSnackbar({
            open: true,
            message: `Cannot transfer more than available stock (${availableStock})`,
            severity: 'error'
          });
          value = availableStock.toString();
        }
      }

      newItems[idx] = { ...newItems[idx], [field]: value };
      return newItems;
    });
  }, [productStocks]);

  const handleAddProductRow = useCallback(() => {
    setItems(prev => [...prev, { product: null, quantity: '' }]);
  }, []);

  const handleRemoveProductRow = useCallback((idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // Validation
  const validateTransfer = useCallback(() => {
    const errors = [];

    if (!selectedBranch) {
      errors.push('Please select a branch');
    }

    if (!transferDate) {
      errors.push('Transfer date is required');
    }

    if (items.length === 0) {
      errors.push('Add at least one product');
    }

    // Check for duplicate products
    const productIds = items.map(item => item.product?.id).filter(Boolean);
    if (new Set(productIds).size !== productIds.length) {
      errors.push('Duplicate products are not allowed');
    }

    const itemErrors = items.reduce((acc, item, index) => {
      if (!item.product) {
        acc.push(`Select a product for item #${index + 1}`);
      }
      if (!item.quantity || parseInt(item.quantity) <= 0) {
        acc.push(`Enter a valid quantity for ${item.product ? item.product.name : `item #${index + 1}`}`);
      }
      // Check if quantity exceeds available stock
      if (item.product && parseInt(item.quantity) > productStocks[item.product.id]) {
        acc.push(`Quantity exceeds available stock (${productStocks[item.product.id]}) for ${item.product.name}`);
      }
      return acc;
    }, []);

    return [...errors, ...itemErrors];
  }, [selectedBranch, transferDate, items, productStocks]);

  // Save transfer
  const handleSaveTransfer = async () => {
    const validationErrors = validateTransfer();
    
    if (validationErrors.length > 0) {
      setSnackbar({
        open: true,
        message: validationErrors[0],
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      const transferData = {
        branch_id: selectedBranch.id,
        transfer_date: transferDate,
        status,
        notes: notes.trim(),
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: parseInt(item.quantity)
        }))
      };

      const response = await axios.post(API_ENDPOINTS.stockTransfers, transferData, getAuthHeader());
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Transfer saved successfully',
          severity: 'success'
        });
        setAddDialogOpen(false);
        fetchTransfers();
      }
    } catch (error) {
      console.error('Error saving transfer:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to save transfer',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Status change handler
  const handleStatusChange = async (transfer, newStatus) => {
    try {
      setActionLoading(true);
      const response = await axios.put(
        `${API_ENDPOINTS.stockTransfers}/${transfer.id}/status`,
        { status: newStatus },
        getAuthHeader()
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Transfer status updated successfully',
          severity: 'success'
        });
        fetchTransfers();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update status',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  // Confirm status change
  const confirmStatusChange = (transfer, newStatus) => {
    setConfirmDialog({
      open: true,
      title: 'Confirm Status Change',
      message: `Are you sure you want to mark this transfer as ${newStatus}? This will update the branch stock quantity.`,
      action: () => handleStatusChange(transfer, newStatus)
    });
  };

  // Render product input with stock info
  const renderProductInput = useCallback((params) => (
    <TextField
      {...params}
      placeholder="Select product..."
      size="small"
      fullWidth
      helperText={
        params.inputProps['aria-activedescendant'] && params.inputProps.value ? 
        `Available Stock: ${productStocks[params.inputProps.value.id] || 0}` : 
        ''
      }
    />
  ), [productStocks]);

  return (
    <Box sx={{ p: 3, position: 'relative', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 3, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'white',
          borderRadius: 2
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a237e' }}>
            Stock Transfers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage stock transfers between main store and branches
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{
            bgcolor: '#1a237e',
            '&:hover': { bgcolor: '#0d47a1' },
            borderRadius: 2,
            px: 3
          }}
        >
          New Transfer
        </Button>
      </Paper>

      {/* Transfer Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          fontSize: 22, 
          pb: 0,
          position: 'sticky',
          top: 0,
          backgroundColor: 'background.paper',
          zIndex: 1
        }}>
          New Stock Transfer
        </DialogTitle>
        <DialogContent sx={{ 
          bgcolor: "#f8fafc", 
          p: { xs: 1, sm: 3 },
          overflowY: 'auto'
        }}>
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Transfer Details</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: '45%', md: '30%' } }}>
                <Autocomplete
                  options={branches}
                  getOptionLabel={(option) => option.name || ''}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Destination Branch"
                      size="small"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingBranches ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  value={selectedBranch}
                  onChange={(_, value) => setSelectedBranch(value)}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  loading={loadingBranches}
                  loadingText="Loading branches..."
                  noOptionsText="No active branches found"
                  disablePortal
                />
              </Box>
              <Box sx={{ width: { xs: '100%', sm: '45%', md: '20%' } }}>
                <TextField
                  label="Transfer Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={transferDate}
                  onChange={e => setTransferDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Products</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddProductRow}
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: 2,
                  color: 'primary.main',
                  '& .MuiButton-startIcon': { mr: 0.5 }
                }}
              >
                ADD PRODUCT
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="60%">Product</TableCell>
                    <TableCell width="30%">Quantity</TableCell>
                    <TableCell width="10%" align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Autocomplete
                          size="small"
                          options={products}
                          getOptionLabel={(option) => option.name || ''}
                          renderInput={renderProductInput}
                          value={item.product}
                          onChange={(_, value) => handleItemChange(idx, 'product', value)}
                          isOptionEqualToValue={(option, value) => option.id === value?.id}
                          loading={loadingProducts}
                          loadingText="Loading products..."
                          noOptionsText="No products found"
                          disablePortal
                          renderOption={(props, option) => (
                            <li {...props}>
                              <div>
                                {option.name}
                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                  Available Stock: {productStocks[option.id] || 0}
                                </Typography>
                              </div>
                            </li>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                          placeholder="Enter quantity"
                          inputProps={{
                            min: 1,
                            max: item.product ? productStocks[item.product.id] : 999999
                          }}
                          helperText={
                            item.product ? 
                            `Max: ${productStocks[item.product.id] || 0}` : 
                            ''
                          }
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleRemoveProductRow(idx)}
                          disabled={items.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Notes</Typography>
            <TextField
              multiline
              minRows={2}
              fullWidth
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any additional notes here..."
              variant="standard"
              sx={{ 
                '& .MuiInputBase-root': {
                  fontSize: '0.875rem'
                }
              }}
            />
          </Paper>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          pb: 2,
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button onClick={handleCloseDialog} variant="outlined" sx={{ minWidth: 120 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveTransfer} 
            sx={{ minWidth: 120, fontWeight: 600 }}
            disabled={saving}
          >
            {saving ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Saving...
              </>
            ) : 'Save Transfer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2,
          bgcolor: 'white',
          overflow: 'hidden'
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(25, 118, 210, 0.04)' }}>
                <TableCell>Date</TableCell>
                <TableCell>Transfer ID</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1 }}>
                      No transfers found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start by creating a new stock transfer
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((transfer) => (
                  <TableRow 
                    key={transfer.id}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                        '& .actions': { opacity: 1 }
                      }
                    }}
                  >
                    <TableCell>{new Date(transfer.transfer_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                        {transfer.transfer_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{transfer.branch_name}</TableCell>
                    <TableCell>{transfer.product_name}</TableCell>
                    <TableCell align="right">{transfer.quantity.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={transfer.status}
                        color={transfer.status === 'Received' ? 'success' : 'warning'}
                        size="small"
                        sx={{ minWidth: 80 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box 
                        className="actions" 
                        sx={{ 
                          display: 'flex',
                          gap: 1,
                          justifyContent: 'center',
                          opacity: { xs: 1, sm: 0.6 },
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            opacity: 1,
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        {transfer.status === 'Pending' && (
                          <Tooltip 
                            title="Mark as Received" 
                            placement="top" 
                            TransitionComponent={Zoom}
                            arrow
                          >
                            <span>
                              <IconButton 
                                size="small"
                                onClick={() => confirmStatusChange(transfer, 'Received')}
                                disabled={actionLoading}
                                sx={{ 
                                  color: 'success.main',
                                  '&:hover': { 
                                    bgcolor: 'success.lighter',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'transform 0.2s'
                                }}
                              >
                                <CheckCircleOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}

                        <Tooltip 
                          title="View Details" 
                          placement="top"
                          TransitionComponent={Zoom}
                          arrow
                        >
                          <IconButton 
                            size="small"
                            onClick={() => {}}
                            disabled={actionLoading}
                            sx={{ 
                              color: 'primary.main',
                              '&:hover': { 
                                bgcolor: 'primary.lighter',
                                transform: 'scale(1.1)'
                              },
                              transition: 'transform 0.2s'
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDialog.action}
            variant="contained"
            color="primary"
            disabled={actionLoading}
            sx={{ minWidth: 100 }}
          >
            {actionLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockTransfers; 