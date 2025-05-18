import React, { useState, useEffect, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Button,
  Stack,
  Tabs,
  Tab,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS, getAuthHeader } from '../apiConfig/apiConfig';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Avatar from '@mui/material/Avatar';

const BranchPrices = () => {
  // States
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [priceTypes, setPriceTypes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPriceType, setSelectedPriceType] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedPrices, setEditedPrices] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [rowSetAllValues, setRowSetAllValues] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch functions
  const fetchProducts = async (branchId) => {
    try {
      if (!branchId) return;
      const response = await axios.get(
        `${API_ENDPOINTS.branchProducts}?branch_id=${branchId}`,
        getAuthHeader()
      );
      if (response.data.success) {
        const productsWithPrices = await Promise.all(
          response.data.data.map(async (product) => {
            const pricesResponse = await axios.get(
              `${API_ENDPOINTS.products}/${product.id}/prices`,
              getAuthHeader()
            );
            return {
              ...product,
              prices: pricesResponse.data.success ? pricesResponse.data.data : []
            };
          })
        );
        setProducts(productsWithPrices);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error loading products',
        severity: 'error'
      });
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
      throw error;
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
      throw error;
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        
        const token = localStorage.getItem('token');
        let branchId = null;
        if (token) {
          const decoded = jwtDecode(token);
          const userId = decoded.id;

          // Fetch user details to get the branch
          const userRes = await axios.get(`${API_ENDPOINTS.employees}/${userId}`, getAuthHeader());
          branchId = userRes.data.branch;

          setUserRole(decoded.role);
          setUserBranch(branchId);
          setSelectedBranch(branchId);
        }

        await Promise.all([
          fetchBranches(),
          fetchPriceTypes()
        ]);
        if (branchId) {
          await fetchProducts(branchId);
        }
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

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (userBranch) {
      fetchProducts(userBranch);
    }
  }, [userBranch]);

  // Handle price edit with debounce
  const handlePriceEdit = (productId, branchId, priceTypeId, value) => {
    setEditedPrices(prev => ({
      ...prev,
      [`${productId}-${branchId}-${priceTypeId}`]: value
    }));
  };

  // Toggle price type for product
  const handleTogglePriceType = async (productId, priceTypeId, enabled) => {
    setIsLoading(true);
    try {
      await axios.post(
        `${API_ENDPOINTS.products}/${productId}/price-types/${priceTypeId}`,
        { enabled },
        getAuthHeader()
      );

      setSnackbar({
        open: true,
        message: `Price type ${enabled ? 'enabled' : 'disabled'} successfully`,
        severity: 'success'
      });

      await fetchProducts(userBranch);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error updating price type status',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this new function after handlePriceEdit
  const handleSetAllPrices = (priceTypeId, value) => {
    if (!selectedProduct) return;

    const newEditedPrices = {};
    branches.filter(b => b.id == userBranch).forEach(branch => {
      newEditedPrices[`${selectedProduct.id}-${branch.id}-${priceTypeId}`] = value;
    });

    setEditedPrices(prev => ({
      ...prev,
      ...newEditedPrices
    }));
  };

  // Add this new function after handleSetAllPrices
  const handleSavePrices = async () => {
    if (!selectedProduct) return;
    setIsLoading(true);
    try {
      const updates = Object.entries(editedPrices).map(([key, value]) => {
        const [productId, , priceTypeId] = key.split('-');
        return {
          product_id: parseInt(productId),
          branch_id: userBranch,
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

      await fetchProducts(userBranch);
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

  // Product Table for selection
  const ProductTable = () => (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Product Name</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Unit</TableCell>
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
                const prices = await loadProductPrices(product.id, userBranch);
                const newEditedPrices = {};
                priceTypes.forEach(priceType => {
                  const price = prices.find(p => p.price_type_id == priceType.id);
                  // Set default value of 0 if no price is found
                  newEditedPrices[`${product.id}-${userBranch}-${priceType.id}`] = price ? price.price : '0';
                });
                setEditedPrices(newEditedPrices);

                // Update the product's prices array with default values of 0 for missing prices
                const updatedProduct = {
                  ...product,
                  prices: priceTypes.map(priceType => {
                    const existingPrice = prices.find(p => p.price_type_id == priceType.id);
                    return {
                      price_type_id: priceType.id,
                      branch_id: userBranch,
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Branch Prices
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={0}>
          <Tab label="Product Prices" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            label="Search Product"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            size="small"
            sx={{ width: 300, mr: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>
        <ProductTable />
        {selectedProduct && (
          <>
            <ProductDialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              product={selectedProduct}
              branches={branches}
              priceTypes={priceTypes}
              userBranch={userBranch}
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
      </Box>

      {/* Snackbar for notifications */}
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

// Move ProductDialog outside the main component
const ProductDialog = ({
  open,
  onClose,
  product,
  branches,
  priceTypes,
  userBranch,
  editedPrices,
  handlePriceEdit,
  editMode,
  setEditMode,
  setEditedPrices,
  handleSavePrices
}) => {
  // Get branch ID from branch name
  const branch = branches.find(b => b.name === userBranch);

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
            Set Prices
          </Typography>
          {/* Price Types Section - single column, label above input */}
          <Grid container spacing={2}>
            {priceTypes.map(priceType => {
              const key = `${product.id}-${branch?.id}-${priceType.id}`;
              const price = product.prices.find(
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
                    value={editedPrices[key] ?? price?.price ?? ''}
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

export default BranchPrices; 