import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert, CircularProgress, MenuItem, Select, InputLabel, FormControl, Grid, Chip, Autocomplete, Stack, Card, CardContent, Collapse, Divider, Tooltip, Zoom
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { format } from 'date-fns';
import axios from 'axios';
import { API_ENDPOINTS, getAuthHeader } from '../apiConfig/apiConfig';

const paymentModes = ['Cash', 'Card', 'Mobile Money', 'Bank Transfer'];
const purchaseStatuses = ['Received', 'Ordered', 'Pending'];
const purchaseModes = ['Paid', 'On Credit'];

const Purchases = () => {

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { product: null, price: '', quantity: '', expiry: '' }
  ]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [statusFilter, setStatusFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null
  });

  const handleItemChange = useCallback((idx, field, value) => {
    if (field === 'product' && value) {
      if (items.some(item => item.product && item.product.id === value.id)) {
        setSnackbar({
          open: true,
          message: 'This product is already in the list',
          severity: 'warning'
        });
        return;
      }
    }
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }, [items]);

  const handleAddProductRow = useCallback(() => {
    setItems(prev => [...prev, { product: null, price: '', quantity: '', expiry: '' }]);
  }, []);

  const handleRemoveProductRow = useCallback((idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleCloseDialog = useCallback(() => {
    setAddDialogOpen(false);
  }, []);

  const activeSuppliers = useMemo(() => {
    return suppliers.filter(supplier => supplier.isActive);
  }, [suppliers]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseFloat(item.quantity) || 0;
      return sum + price * qty;
    }, 0);
  }, [items]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(purchase => {
      const matchesStatus = statusFilter === 'All' || purchase.status === statusFilter;
      const matchesMode = modeFilter === 'All' || purchase.mode === modeFilter;
      const purchaseDate = new Date(purchase.purchase_date);
      const matchesDate = (!dateRange.startDate || purchaseDate >= dateRange.startDate) &&
                         (!dateRange.endDate || purchaseDate <= dateRange.endDate);
      
      return matchesStatus && matchesMode && matchesDate;
    });
  }, [purchases, statusFilter, modeFilter, dateRange]);

  const summaryStats = useMemo(() => {
    return {
      totalPurchases: filteredPurchases.length,
      totalAmount: filteredPurchases.reduce((sum, p) => sum + (parseFloat(p.purchase_price || 0) * parseFloat(p.quantity || 0)), 0),
      pendingCount: filteredPurchases.filter(p => p.status === 'Pending').length,
      receivedCount: filteredPurchases.filter(p => p.status === 'Received').length
    };
  }, [filteredPurchases]);

  const fetchSuppliersAndProducts = useCallback(async () => {
    setLoadingSuppliers(true);
    setLoadingProducts(true);
    try {
      const [supRes, prodRes] = await Promise.all([
        axios.get(`${API_ENDPOINTS.suppliers}?active=true`, getAuthHeader()),
        axios.get(API_ENDPOINTS.products, getAuthHeader())
      ]);
      
      if (supRes.data.success) {
        setSuppliers(supRes.data.data);
      }
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error loading data', 
        severity: 'error' 
      });
    } finally {
      setLoadingSuppliers(false);
      setLoadingProducts(false);
    }
  }, []);

  const handleOpenAddDialog = useCallback(() => {
    setSelectedSupplier(null);
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setStatus('');
    setMode('');
    setPaymentMode('');
    setNotes('');
    setItems([{ product: null, price: '', quantity: '', expiry: '' }]);
    fetchSuppliersAndProducts();
    setAddDialogOpen(true);
  }, [fetchSuppliersAndProducts]);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.purchases, getAuthHeader());
      
      if (response.data.success) {
       
        const formattedPurchases = response.data.data.map(purchase => ({
          id: purchase.id,
          purchase_date: purchase.purchase_date,
          receipt_number: purchase.receipt_number,
          supplier_name: purchase.supplier_name,
          product_name: purchase.product_name,
          quantity: purchase.quantity,
          purchase_price: parseFloat(purchase.purchase_price),
          total: parseFloat(purchase.purchase_price) * purchase.quantity,
          status: purchase.status,
          mode: purchase.mode,
          payment_mode: purchase.payment_mode,
          notes: purchase.notes,
          expiry_date: purchase.expiry_date
        }));

        setPurchases(formattedPurchases);
      } else {
        throw new Error(response.data.message || 'Failed to fetch purchases');
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to load purchases. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const renderSupplierInput = useCallback((params) => (
    <TextField
      {...params}
      label="Supplier"
      size="small"
      fullWidth
      InputProps={{
        ...params.InputProps,
        endAdornment: (
          <>
            {loadingSuppliers ? <CircularProgress color="inherit" size={20} /> : null}
            {params.InputProps.endAdornment}
          </>
        ),
      }}
    />
  ), [loadingSuppliers]);

  const renderProductInput = useCallback((params) => (
    <TextField
      {...params}
      placeholder="Select..."
      size="small"
      fullWidth
      InputProps={{
        ...params.InputProps,
        endAdornment: (
          <>
            {loadingProducts ? <CircularProgress color="inherit" size={20} /> : null}
            {params.InputProps.endAdornment}
          </>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor: 'background.paper'
        }
      }}
    />
  ), [loadingProducts]);

  const SupplierAutocomplete = useCallback(() => (
    <Autocomplete
      options={activeSuppliers}
      getOptionLabel={(option) => option.name || ''}
      renderInput={renderSupplierInput}
      value={selectedSupplier}
      onChange={(_, value) => setSelectedSupplier(value)}
      isOptionEqualToValue={(option, value) => option.id === value?.id}
      size="small"
      loading={loadingSuppliers}
      loadingText="Loading suppliers..."
      noOptionsText="No active suppliers found"
      disablePortal
    />
  ), [activeSuppliers, selectedSupplier, loadingSuppliers, renderSupplierInput, setSelectedSupplier]);

  const ProductAutocomplete = useCallback((idx, item) => (
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
    />
  ), [products, loadingProducts, renderProductInput, handleItemChange]);

  const validatePurchase = useCallback(() => {
    const errors = [];

    if (!selectedSupplier) {
      errors.push('Please select a supplier');
    }

    if (!purchaseDate) {
      errors.push('Purchase date is required');
    }

    if (!status) {
      errors.push('Please select a status');
    }

    if (!mode) {
      errors.push('Please select a purchase mode');
    }

    if (mode === 'Paid' && !paymentMode) {
      errors.push('Please select a payment mode');
    }

    if (items.length === 0) {
      errors.push('Add at least one product');
    }

    const itemErrors = items.reduce((acc, item, index) => {
      if (!item.product) {
        acc.push(`Select a product for item #${index + 1}`);
      }
      if (!item.price || parseFloat(item.price) <= 0) {
        acc.push(`Enter a valid price for ${item.product ? item.product.name : `item #${index + 1}`}`);
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        acc.push(`Enter a valid quantity for ${item.product ? item.product.name : `item #${index + 1}`}`);
      }
      return acc;
    }, []);

    return [...errors, ...itemErrors];
  }, [selectedSupplier, purchaseDate, status, mode, paymentMode, items]);

  const handleSavePurchase = async () => {
    const validationErrors = validatePurchase();
    
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

      const purchaseData = {
        supplier_id: selectedSupplier.id,
        purchase_date: purchaseDate,
        status,
        mode,
        payment_mode: mode === 'Paid' ? paymentMode : null,
        notes: notes.trim(),
      
        items: items.map(item => ({
          product_id: item.product.id,
          price: parseFloat(item.price),
          quantity: parseFloat(item.quantity),
          expiry_date: item.expiry || null
        }))
      };

      const response = await axios.post(API_ENDPOINTS.purchases, purchaseData, getAuthHeader());
      
      if (response.data.success) {
 
        setSnackbar({
          open: true,
          message: 'Purchase saved successfully',
          severity: 'success'
        });

        setAddDialogOpen(false);
        fetchPurchases();

      } else {

        throw new Error(response.data.message || 'Failed to save purchase');

      }
    } catch (error) {

      console.error('Error saving purchase:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to save purchase. Please try again.',
        severity: 'error'
      });
      
    } finally {
      setSaving(false);
    }
  };

  const handleViewPurchase = useCallback((purchase) => {
    setSnackbar({
      open: true,
      message: `Viewing purchase ${purchase.receipt_number}`,
      severity: 'info'
    });
    console.log('View purchase:', purchase);
  }, []);

  const handleStatusChange = async (purchase, newStatus) => {
    try {
      setActionLoading(true);
      const response = await axios.put(
        `${API_ENDPOINTS.purchases}/${purchase.receipt_number}/status`,
        { status: newStatus },
        getAuthHeader()
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Purchase status updated successfully',
          severity: 'success'
        });
        fetchPurchases();
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

  const handleDelete = async (purchase) => {
    try {
      setActionLoading(true);
      const response = await axios.delete(
        `${API_ENDPOINTS.purchases}/${purchase.receipt_number}`,
        getAuthHeader()
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Purchase deleted successfully',
          severity: 'success'
        });
        fetchPurchases();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete purchase',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const confirmStatusChange = (purchase, newStatus) => {
    setConfirmDialog({
      open: true,
      title: 'Confirm Status Change',
      message: `Are you sure you want to mark this purchase as ${newStatus}? ${newStatus === 'Received' ? 'This will update the stock quantity.' : ''}`,
      action: () => handleStatusChange(purchase, newStatus)
    });
  };

  const confirmDelete = (purchase) => {
    let message = 'Are you sure you want to delete this purchase? This action cannot be undone.';
    
    if (purchase.status === 'Received') {
      message += ' This will also reduce the stock quantity.';
    }

    setConfirmDialog({
      open: true,
      title: 'Confirm Delete',
      message,
      action: () => handleDelete(purchase)
    });
  };

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
            Purchases
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your purchase orders and transactions
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
          Add Purchase
        </Button>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              borderRadius: 2,
              bgcolor: 'white',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
          >
            <Typography color="text.secondary" variant="subtitle2" gutterBottom>
              Total Purchases
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a237e' }}>
              {summaryStats.totalPurchases}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              borderRadius: 2,
              bgcolor: 'white',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
          >
            <Typography color="text.secondary" variant="subtitle2" gutterBottom>
              Total Amount
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a237e' }}>
              ₵{summaryStats.totalAmount.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              borderRadius: 2,
              bgcolor: 'white',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
          >
            <Typography color="text.secondary" variant="subtitle2" gutterBottom>
              Pending
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#ff9800' }}>
              {summaryStats.pendingCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              borderRadius: 2,
              bgcolor: 'white',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
          >
            <Typography color="text.secondary" variant="subtitle2" gutterBottom>
              Received
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#4caf50' }}>
              {summaryStats.receivedCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper 
        elevation={0} 
        sx={{ 
          mb: 3, 
          borderRadius: 2,
          bgcolor: 'white',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            bgcolor: 'rgba(25, 118, 210, 0.04)',
            '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' }
          }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Filters
            </Typography>
            {(dateRange.startDate || dateRange.endDate || statusFilter !== 'All' || modeFilter !== 'All') && (
              <Chip 
                size="small" 
                label="Active Filters" 
                color="primary" 
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          {showFilters ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </Box>
        <Collapse in={showFilters}>
          <Divider />
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Date Range
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={dateRange.startDate || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    value={dateRange.endDate || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Status & Mode
                </Typography>
                <Stack direction="row" spacing={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="All">All Status</MenuItem>
                      {purchaseStatuses.map(status => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Mode</InputLabel>
                    <Select
                      value={modeFilter}
                      label="Mode"
                      onChange={(e) => setModeFilter(e.target.value)}
                    >
                      <MenuItem value="All">All Modes</MenuItem>
                      {purchaseModes.map(mode => (
                        <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>
              <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => {
                    setStatusFilter('All');
                    setModeFilter('All');
                    setDateRange({ startDate: null, endDate: null });
                  }}
                  fullWidth
                  sx={{ height: 40 }}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

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
                <TableCell>Receipt No.</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1 }}>
                      No purchases found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your filters or add a new purchase
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map((purchase) => (
                  <TableRow 
                    key={purchase.id}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                        '& .actions': { opacity: 1 }
                      }
                    }}
                  >
                    <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                        {purchase.receipt_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{purchase.supplier_name}</TableCell>
                    <TableCell>{purchase.product_name}</TableCell>
                    <TableCell align="right">{purchase.quantity.toLocaleString()}</TableCell>
                    <TableCell align="right">₵{purchase.purchase_price.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 500 }}>
                        ₵{purchase.total.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={purchase.status}
                        color={
                          purchase.status === 'Received' ? 'success' :
                          purchase.status === 'Pending' ? 'warning' : 'info'
                        }
                        size="small"
                        sx={{ minWidth: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={purchase.mode}
                        color={purchase.mode === 'Paid' ? 'success' : 'warning'}
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
                        {['Pending', 'Ordered'].includes(purchase.status) && (
                          <Tooltip 
                            title="Mark as Received" 
                            placement="top" 
                            TransitionComponent={Zoom}
                            arrow
                          >
                            <span>
                              <IconButton 
                                size="small"
                                onClick={() => confirmStatusChange(purchase, 'Received')}
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
                        
                        {purchase.status !== 'Pending' && (
                          <Tooltip 
                            title={`Delete ${purchase.status === 'Received' ? '(will reduce stock)' : ''}`}
                            placement="top"
                            TransitionComponent={Zoom}
                            arrow
                          >
                            <span>
                              <IconButton 
                                size="small"
                                onClick={() => confirmDelete(purchase)}
                                disabled={actionLoading}
                                sx={{ 
                                  color: 'error.main',
                                  '&:hover': { 
                                    bgcolor: 'error.lighter',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'transform 0.2s'
                                }}
                              >
                                <DeleteIcon fontSize="small" />
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
                            onClick={() => handleViewPurchase(purchase)}
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

      <Dialog 
        open={addDialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
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
          Add New Purchase
        </DialogTitle>
        <DialogContent sx={{ 
          bgcolor: "#f8fafc", 
          p: { xs: 1, sm: 3 },
          overflowY: 'auto'
        }}>
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Purchase Details</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: '45%', md: '30%' } }}>
                <SupplierAutocomplete />
              </Box>
              <Box sx={{ width: { xs: '100%', sm: '45%', md: '20%' } }}>
                <TextField
                  label="Purchase Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box sx={{ width: { xs: '100%', sm: '30%', md: '15%' } }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={status} label="Status" onChange={e => setStatus(e.target.value)}>
                    {purchaseStatuses.map(status => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ width: { xs: '100%', sm: '30%', md: '15%' } }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mode</InputLabel>
                  <Select value={mode} label="Mode" onChange={e => setMode(e.target.value)}>
                    {purchaseModes.map(mode => (
                      <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              {mode === 'Paid' && (
                <Box sx={{ width: { xs: '100%', sm: '30%', md: '15%' } }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Payment Mode</InputLabel>
                    <Select value={paymentMode} label="Payment Mode" onChange={e => setPaymentMode(e.target.value)}>
                      {paymentModes.map(pm => (
                        <MenuItem key={pm} value={pm}>{pm}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
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

            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {items.map((item, idx) => (
                <Paper 
                  key={idx} 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    position: 'relative'
                  }}
                >
                  <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveProductRow(idx)}
                      disabled={items.length === 1}
                      sx={{ color: 'text.secondary' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    {ProductAutocomplete(idx, item)}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <TextField
                      placeholder="Purchase Price"
                      type="number"
                      size="small"
                      fullWidth
                      value={item.price}
                      onChange={e => handleItemChange(idx, 'price', e.target.value)}
                      InputProps={{
                        startAdornment: <Typography color="text.secondary" sx={{ mr: 1 }}>₵</Typography>
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'background.paper'
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <TextField
                      placeholder="Quantity"
                      type="number"
                      size="small"
                      fullWidth
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'background.paper'
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <TextField
                      type="date"
                      size="small"
                      fullWidth
                      value={item.expiry}
                      onChange={e => handleItemChange(idx, 'expiry', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'background.paper'
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography sx={{ fontWeight: 500 }}>
                      Subtotal: ₵{((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0)).toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>

            <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="35%">Product</TableCell>
                    <TableCell width="15%">Purchase Price</TableCell>
                    <TableCell width="15%">Quantity</TableCell>
                    <TableCell width="20%">Expiry Date</TableCell>
                    <TableCell width="10%">Subtotal</TableCell>
                    <TableCell width="5%" align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {ProductAutocomplete(idx, item)}
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={item.price}
                          onChange={e => handleItemChange(idx, 'price', e.target.value)}
                          InputProps={{
                            startAdornment: <Typography color="text.secondary" sx={{ mr: 1 }}>₵</Typography>
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="date"
                          size="small"
                          fullWidth
                          value={item.expiry}
                          onChange={e => handleItemChange(idx, 'expiry', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          ₵{((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0)).toFixed(2)}
                        </Typography>
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

          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={8}>
              <Paper elevation={1} sx={{ 
                p: 2, 
                borderRadius: 2,
                height: '100%',
                minHeight: { xs: '120px', md: '100%' }
              }}>
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
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={1} sx={{ 
                p: 2, 
                borderRadius: 2,
                bgcolor: '#f8fafc',
                display: 'flex',
                flexDirection: { xs: 'row', md: 'column' },
                alignItems: 'center',
                justifyContent: { xs: 'space-between', md: 'center' },
                gap: 2
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  color: 'text.secondary'
                }}>
                  Total:
                </Typography>
                <Chip 
                  label={`₵${total.toFixed(2)}`} 
                  color="primary" 
                  sx={{ 
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                    height: 'auto',
                    padding: '8px 16px',
                    fontWeight: 700,
                    '& .MuiChip-label': {
                      padding: 0
                    }
                  }} 
                />
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ height: { xs: '16px', md: 0 } }} />
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
            onClick={handleSavePurchase} 
            sx={{ minWidth: 120, fontWeight: 600 }}
            disabled={saving}
          >
            {saving ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Saving...
              </>
            ) : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
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

export default React.memo(Purchases); 