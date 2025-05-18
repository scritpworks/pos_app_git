import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Grid,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS, getAuthHeader } from '../apiConfig/apiConfig';

const AllBranchPrices = () => {
  // States
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [priceTypes, setPriceTypes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedPrices, setEditedPrices] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch functions
  const fetchProducts = async (branch_id) => {
    if (!branch_id) return;
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.branchProducts}`,
        {
          params: {
            branch_id: branch_id
          }
          ,
          ...getAuthHeader()
        }
      );
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error('Error in fetchProducts:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || 'Error loading products',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.branches, getAuthHeader());
      if (response.data) {
        setBranches(response.data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchPriceTypes = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.priceTypes, getAuthHeader());
      if (response.data.success) {
        setPriceTypes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching price types:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchBranches();
    fetchPriceTypes();
  }, []);

  // Load products when branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetchProducts(selectedBranch);
    }
  }, [selectedBranch]);

  const loadProductPrices = async (productId, branchId) => {
    try {
      const response = await axios.get(API_ENDPOINTS.loadProductPrices, {
        ...getAuthHeader(),
        params: {
          product_id: productId,
          branch_id: branchId
        }
      });

      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error loading prices:', error);
      return [];
    }
  };

  const handlePriceEdit = (productId, branchId, priceTypeId, value) => {
    setEditedPrices(prev => ({
      ...prev,
      [`${productId}-${branchId}-${priceTypeId}`]: value
    }));
  };

  const handleSavePrices = async () => {
    if (!selectedProduct || !selectedBranch) return;
    setIsLoading(true);
    try {
      const updates = Object.entries(editedPrices).map(([key, value]) => {
        const [productId, , priceTypeId] = key.split('-');
        return {
          product_id: parseInt(productId),
          branch_id: selectedBranch,
          price_type_id: parseInt(priceTypeId),
          price: parseFloat(value)
        };
      });

      await axios.post(
        API_ENDPOINTS.updateProductPrice,
        { prices: updates },
        getAuthHeader()
      );

      setSnackbar({
        open: true,
        message: 'Prices updated successfully',
        severity: 'success'
      });

      await fetchProducts(selectedBranch);
      setEditMode(false);
      setEditedPrices({});
      setDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error updating prices',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Product Table Component
  const ProductTable = () => (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Product Name</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredProducts.map(product => (
            <TableRow
              key={product.id}
              hover
              selected={selectedProduct && selectedProduct.id === product.id}
              onClick={async () => {
                setSelectedProduct(product);
                setDialogOpen(true);

                // Load prices from backend for this product and branch
                const prices = await loadProductPrices(product.id, selectedBranch);
                const newEditedPrices = {};
                priceTypes.forEach(priceType => {
                  const price = prices.find(p => p.price_type_id == priceType.id);
                  // Set default value of 0 if no price is found
                  newEditedPrices[`${product.id}-${selectedBranch}-${priceType.id}`] = price ? price.price : '0';
                });
                setEditedPrices(newEditedPrices);

                // Update the product's prices array with default values of 0 for missing prices
                const updatedProduct = {
                  ...product,
                  prices: priceTypes.map(priceType => {
                    const existingPrice = prices.find(p => p.price_type_id == priceType.id);
                    return {
                      price_type_id: priceType.id,
                      branch_id: selectedBranch,
                      price: existingPrice ? existingPrice.price : '0'
                    };
                  })
                };
                setSelectedProduct(updatedProduct);
              }}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.category_name}</TableCell>
              <TableCell>{product.unit_name}</TableCell>
              <TableCell>
                <Typography
                  sx={{
                    color: product.status === 'Active' ? 'success.main' : 'error.main',
                    fontWeight: 500
                  }}
                >
                  {product.status}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        All Branch Prices
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <Select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Select Branch
                </MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.name}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              label="Search Product"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {isLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : selectedBranch ? (
        <ProductTable />
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Please select a branch to view products
          </Typography>
        </Paper>
      )}

      {selectedProduct && (
        <>
          <ProductDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            product={selectedProduct}
            branches={branches}
            priceTypes={priceTypes}
            selectedBranch={selectedBranch}
            editedPrices={editedPrices}
            handlePriceEdit={handlePriceEdit}
            editMode={editMode}
            setEditMode={setEditMode}
            setEditedPrices={setEditedPrices}
            handleSavePrices={() => setConfirmDialogOpen(true)}
          />

          {/* Confirmation Dialog */}
          <Dialog
            open={confirmDialogOpen}
            onClose={() => setConfirmDialogOpen(false)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Confirm Save</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to save these price changes?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setConfirmDialogOpen(false)} 
                color="inherit"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setConfirmDialogOpen(false);
                  handleSavePrices();
                }} 
                color="primary" 
                variant="contained"
              >
                Save Changes
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Product Dialog Component
const ProductDialog = ({
  open,
  onClose,
  product,
  branches,
  priceTypes,
  selectedBranch,
  editedPrices,
  handlePriceEdit,
  editMode,
  setEditMode,
  setEditedPrices,
  handleSavePrices
}) => {
  // Get branch ID from branch name
  const branch = branches.find(b => b.name === selectedBranch);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontSize: 24 }}>
            {product.name ? product.name[0].toUpperCase() : '?'}
          </Avatar>
          <Box>
            <Typography variant="h6">{product.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Category: {product.category_name} | Unit: {product.unit_name}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" gutterBottom>
            Set Prices for {branch?.name}
          </Typography>
          <Grid container spacing={2}>
            {priceTypes.map(priceType => {
              const key = `${product.id}-${branch?.id}-${priceType.id}`;
              const price = product.prices?.find(
                p => p.price_type_id === priceType.id
              );
              return (
                <Grid item xs={12} key={priceType.id}>
                  <Typography
                    sx={{
                      fontWeight: 500,
                      textTransform: 'capitalize',
                      fontSize: { xs: 15, sm: 16 },
                      mb: 0.5
                    }}
                  >
                    {priceType.name}
                  </Typography>
                  <TextField
                    type="number"
                    value={editedPrices[key] ?? price?.price ?? '0'}
                    onChange={e =>
                      handlePriceEdit(product.id, branch?.id, priceType.id, e.target.value)
                    }
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    fullWidth
                  />
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, p: 2 }}>
        <Button onClick={onClose} color="inherit">Close</Button>
        <Button
          variant={editMode ? "contained" : "outlined"}
          color={editMode ? "primary" : "inherit"}
          onClick={editMode ? handleSavePrices : () => setEditMode(true)}
          startIcon={editMode ? <SaveIcon /> : <EditIcon />}
        >
          {editMode ? "Save Changes" : "Edit Prices"}
        </Button>
        {editMode && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              setEditMode(false);
              setEditedPrices({});
            }}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AllBranchPrices; 