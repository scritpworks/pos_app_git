import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import DataTable from 'react-data-table-component';
import styled from 'styled-components';
import axios from 'axios';
import { API_ENDPOINTS, getAuthHeader } from '../apiConfig/apiConfig';
import { jwtDecode } from 'jwt-decode';

// Styled components for data table
const StyledDataTable = styled(DataTable)`
  .rdt_TableHead {
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }
  
  .rdt_TableHeadRow {
    background-color: rgb(248, 250, 252);
    min-height: 42px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    border-bottom: 1px solid #e2e8f0;
  }

  .rdt_TableCol {
    padding: 12px !important;
    font-weight: 600 !important;
    color: #111827 !important;
    font-size: 0.75rem !important;
  }
  
  .rdt_TableRow {
    min-height: 38px;
    border-bottom: 1px solid #f1f5f9;
    transition: background-color 0.15s ease;
    
    &:hover {
      background-color: rgba(241, 245, 249, 0.7) !important;
      transform: translateY(-1px);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    }
  }
  
  .rdt_TableCell {
    font-size: 0.75rem;
    padding: 12px !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .rdt_Pagination {
    border-top: 1px solid #e2e8f0;
    font-size: 0.75rem;
    padding: 6px 12px;
  }
`;

const SAMPLE_PRODUCT_IMAGES = {
  Clothing: 'https://cdn-icons-png.flaticon.com/32/2405/2405604.png',
  Sports: 'https://cdn-icons-png.flaticon.com/32/857/857455.png',
  Accessories: 'https://cdn-icons-png.flaticon.com/32/3109/3109889.png',
  Watches: 'https://cdn-icons-png.flaticon.com/32/2972/2972531.png',
  'Home Appliances': 'https://cdn-icons-png.flaticon.com/32/1620/1620851.png',
  Electronics: 'https://cdn-icons-png.flaticon.com/32/3659/3659898.png',
  default: 'https://cdn-icons-png.flaticon.com/32/1524/1524855.png'
};

const BranchProducts = () => {
  // States
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedAlertQuantity, setEditedAlertQuantity] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Table columns configuration
  const columns = [
    {
      name: 'Barcode',
      selector: row => row.barcode,
      sortable: true,
      cell: row => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <QrCodeIcon sx={{ fontSize: 18, color: '#6B7280' }} />
        </Box>
      ),
      width: '60px',
    },
    {
      name: 'Product Name',
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          maxWidth: '250px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          <Box
            component="img"
            src={row.image || SAMPLE_PRODUCT_IMAGES[row.category_name] || SAMPLE_PRODUCT_IMAGES.default}
            alt=""
            sx={{
              width: 24,
              height: 24,
              objectFit: 'contain',
              borderRadius: '4px',
              p: '2px',
              bgcolor: '#F3F4F6'
            }}
          />
          <Tooltip title={row.name} placement="top">
            <Typography
              component="span"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: '#111827'
              }}
            >
              {row.name}
            </Typography>
          </Tooltip>
        </Box>
      ),
      grow: 1.5,
    },
    {
      name: 'Category',
      selector: row => row.category_name,
      sortable: true,
      cell: row => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1
        }}>
          <Chip
            label={row.category_name}
            size="small"
            sx={{ 
              fontWeight: 500,
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              color: '#6366f1',
              borderRadius: '4px',
              fontSize: '0.7rem',
              height: '20px'
            }}
          />
        </Box>
      ),
      width: '120px',
      hide: 'sm'
    },
    {
      name: 'Unit',
      selector: row => row.unit_name,
      sortable: true,
      cell: row => (
        <Typography sx={{ 
          fontSize: '0.75rem', 
          fontWeight: 500, 
          color: '#111827'
        }}>
          {row.unit_name}
        </Typography>
      ),
      width: '80px',
      hide: 'sm'
    },
    {
      name: 'Stock',
      selector: row => row.stock_quantity,
      sortable: true,
      cell: row => (
        <Chip
          label={row.stock_quantity}
          size="small"
          sx={{
            fontSize: '0.7rem',
            height: '20px',
            backgroundColor: row.stock_quantity > row.alert_quantity ? 'rgba(46, 204, 113, 0.1)' : 'rgba(235, 87, 87, 0.1)',
            color: row.stock_quantity > row.alert_quantity ? '#2ecc71' : '#eb5757',
            fontWeight: 500,
            borderRadius: '4px'
          }}
        />
      ),
      width: '80px'
    },
    {
      name: 'Low Stock',
      selector: row => row.alert_quantity,
      sortable: true,
      cell: row => (
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: row.stock_quantity <= row.alert_quantity ? '#eb5757' : '#2ecc71'
          }}
        >
          {row.alert_quantity}
        </Typography>
      ),
      width: '100px',
      hide: 'sm'
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <Chip
          label={row.status}
          size="small"
          sx={{
            fontSize: '0.7rem',
            height: '20px',
            backgroundColor: row.status === 'Active' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(235, 87, 87, 0.1)',
            color: row.status === 'Active' ? '#2ecc71' : '#eb5757',
            fontWeight: 500,
            borderRadius: '4px'
          }}
        />
      ),
      width: '80px'
    },
    {
      name: 'Actions',
      cell: row => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit Low Stock Level">
            <IconButton
              size="small"
              onClick={() => handleAlertQuantityEdit(row)}
              sx={{ 
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      width: '80px',
      sortable: false
    }
  ];

  // Fetch products
  const fetchProducts = async (branchId) => {
    if (!branchId) return;
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.branchProducts}`,
        {
          params: {
            branch_id: branchId
          },
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

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setSnackbar({
            open: true,
            message: 'No authentication token found',
            severity: 'error'
          });
          return;
        }

        const decoded = jwtDecode(token);
        const userId = decoded.id;

        // Fetch user details to get the branch
        const userRes = await axios.get(`${API_ENDPOINTS.employees}/${userId}`, getAuthHeader());
        const branchId = userRes.data.branch;

        setUserRole(decoded.role);
        setUserBranch(branchId);
        
        // Fetch products for the branch
        await fetchProducts(branchId);
      } catch (error) {
        console.error('Error initializing data:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Error initializing data',
          severity: 'error'
        });
      }
    };

    initializeData();
  }, []);

  // Handle alert quantity edit
  const handleAlertQuantityEdit = (product) => {
    setSelectedProduct(product);
    setEditedAlertQuantity(product.alert_quantity);
    setDialogOpen(true);
  };

  // Handle save alert quantity
  const handleSaveAlertQuantity = async () => {
    if (!selectedProduct) return;
    setIsLoading(true);
    try {
      await axios.put(
        `${API_ENDPOINTS.products}/${selectedProduct.id}`,
        {
          ...selectedProduct,
          alert_quantity: parseInt(editedAlertQuantity)
        },
        getAuthHeader()
      );

      setSnackbar({
        open: true,
        message: 'Alert quantity updated successfully',
        severity: 'success'
      });

      await fetchProducts(userBranch);
      setDialogOpen(false);
      setSelectedProduct(null);
      setEditedAlertQuantity('');
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error updating alert quantity',
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

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Branch Products
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
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

      <Paper sx={{ 
        width: '100%', 
        overflow: 'hidden', 
        borderRadius: 2, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
      }}>
        <StyledDataTable
          columns={columns}
          data={filteredProducts}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 15, 20]}
          defaultSortFieldId={1}
          defaultSortAsc={true}
          sortIcon={<span>▲</span>}
          persistTableHead
          noDataComponent={
            <Box sx={{ py: 5, px: 2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'rgb(100, 116, 139)' }}>
                {searchQuery
                  ? 'No products found matching your search criteria'
                  : 'No products available'}
              </Typography>
            </Box>
          }
          progressPending={isLoading}
          progressComponent={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <CircularProgress size={40} thickness={4} />
            </Box>
          }
          highlightOnHover
          pointerOnHover
          responsive
          fixedHeader
          fixedHeaderScrollHeight="calc(100vh - 350px)"
          subHeaderWrap
          dense
          customStyles={{
            table: {
              style: {
                minWidth: '100%',
                tableLayout: 'fixed'
              }
            },
            cells: {
              style: {
                paddingLeft: '8px',
                paddingRight: '8px'
              }
            }
          }}
        />
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Low Stock Level</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedProduct?.name}
            </Typography>
            <TextField
              label="Low Stock Level"
              type="number"
              value={editedAlertQuantity}
              onChange={(e) => setEditedAlertQuantity(e.target.value)}
              fullWidth
              size="small"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveAlertQuantity}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

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

export default BranchProducts; 