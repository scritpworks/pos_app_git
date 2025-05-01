import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  Grid,
  Checkbox,
  Autocomplete,
  Popper,
  OutlinedInput
} from '@mui/material';
import DataTable from 'react-data-table-component';
import styled from 'styled-components';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import RefreshIcon from '@mui/icons-material/Refresh';
import ImageIcon from '@mui/icons-material/Image';
import PrintIcon from '@mui/icons-material/Print';
import QrCodeIcon from '@mui/icons-material/QrCode';
import './ManageProducts.css';

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

const AVAILABLE_BRANCHES = [
  { id: 1, name: 'Main Store' },
  { id: 2, name: 'Branch A' },
  { id: 3, name: 'Branch B' },
  { id: 4, name: 'Branch C' },
  { id: 5, name: 'Branch D' },
  { id: 6, name: 'Downtown Store' },
  { id: 7, name: 'Mall Branch' },
  { id: 8, name: 'Airport Store' },
  { id: 9, name: 'Express Branch' },
  { id: 10, name: 'Warehouse Store' }
];

const SAMPLE_PRODUCT_IMAGES = {
  Clothing: 'https://cdn-icons-png.flaticon.com/32/2405/2405604.png',
  Sports: 'https://cdn-icons-png.flaticon.com/32/857/857455.png',
  Accessories: 'https://cdn-icons-png.flaticon.com/32/3109/3109889.png',
  Watches: 'https://cdn-icons-png.flaticon.com/32/2972/2972531.png',
  'Home Appliances': 'https://cdn-icons-png.flaticon.com/32/1620/1620851.png',
  Electronics: 'https://cdn-icons-png.flaticon.com/32/3659/3659898.png',
  default: 'https://cdn-icons-png.flaticon.com/32/1524/1524855.png'
};

const BarcodeDialog = ({ open, onClose, product }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '12px',
          maxWidth: '300px'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 2,
        fontSize: '18px',
        fontWeight: 600,
        borderBottom: '1px solid #e5e7eb'
      }}>
        Product Barcode
      </DialogTitle>
      <DialogContent sx={{ p: 3, textAlign: 'center' }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 1 }}>
            {product?.name}
          </Typography>
          <img 
            src={`https://barcodeapi.org/api/code128/${product?.barcode}`}
            alt="Barcode"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <Typography sx={{ 
            fontFamily: 'monospace', 
            fontSize: '14px', 
            color: '#111827',
            mt: 1
          }}>
            {product?.barcode}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
          sx={{
            bgcolor: '#111827',
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            '&:hover': {
              bgcolor: 'rgba(17, 24, 39, 0.9)'
            }
          }}
        >
          Print Barcode
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const AddItemDialog = ({ open, onClose, title, placeholder, onSave }) => {
  const [newItem, setNewItem] = useState('');
  
  const handleSave = () => {
    if (newItem.trim()) {
      onSave(newItem.trim());
      setNewItem('');
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '12px',
          maxWidth: '400px',
          width: '100%'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: '20px 24px',
        fontSize: '18px',
        fontWeight: 600,
        color: '#111827',
        borderBottom: '1px solid #e5e7eb'
      }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ p: '24px' }}>
        <TextField
          autoFocus
          fullWidth
          placeholder={placeholder}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: '48px',
              fontSize: '16px',
              backgroundColor: '#fff',
              '& fieldset': {
                borderColor: '#e5e7eb',
                borderRadius: '8px'
              },
              '&:hover fieldset': {
                borderColor: '#d1d5db',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#2563EB',
                borderWidth: '1px'
              }
            }
          }}
        />
      </DialogContent>
      <DialogActions sx={{ 
        p: '16px 24px',
        borderTop: '1px solid #e5e7eb',
        gap: 1
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            height: '40px',
            px: 3,
            color: '#111827',
            borderColor: '#e5e7eb',
            borderRadius: '6px',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            '&:hover': {
              borderColor: '#d1d5db',
              backgroundColor: '#f9fafb'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!newItem.trim()}
          sx={{
            height: '40px',
            px: 3,
            bgcolor: '#111827',
            borderRadius: '6px',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            '&:hover': {
              bgcolor: 'rgba(17, 24, 39, 0.9)'
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(17, 24, 39, 0.4)'
            }
          }}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteConfirmationDialog = ({ open, onClose, onConfirm, productName, category }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '8px',
          maxWidth: '400px',
          width: '100%'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: '16px 20px',
        fontSize: '18px',
        fontWeight: 600,
        color: '#111827',
        borderBottom: '1px solid #e5e7eb'
      }}>
        Delete Product
      </DialogTitle>
      <DialogContent sx={{ p: '20px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: '64px',
              height: '64px',
              borderRadius: '8px',
              backgroundColor: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid #E5E7EB'
            }}
          >
            <img
              src={SAMPLE_PRODUCT_IMAGES[category] || SAMPLE_PRODUCT_IMAGES.default}
              alt=""
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain'
              }}
            />
          </Box>
          <Box>
            <Typography sx={{ 
              fontSize: '15px', 
              fontWeight: 500, 
              color: '#111827',
              mb: 0.5
            }}>
              {productName}
            </Typography>
            <Typography sx={{ 
              fontSize: '13px', 
              color: '#6B7280'
            }}>
              {category}
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ fontSize: '14px', color: '#4B5563' }}>
          Are you sure you want to delete this product? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ 
        p: '16px 20px',
        borderTop: '1px solid #e5e7eb',
        gap: 1
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            height: '36px',
            px: 2.5,
            color: '#111827',
            borderColor: '#e5e7eb',
            borderRadius: '6px',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            '&:hover': {
              borderColor: '#d1d5db',
              backgroundColor: '#f9fafb'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{
            height: '36px',
            px: 2.5,
            borderRadius: '6px',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            bgcolor: '#DC2626',
            '&:hover': {
              bgcolor: '#B91C1C'
            }
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ManageProducts = () => {
  // State management
  const [products, setProducts] = useState([
    {
      id: 1,
      barcode: '890123456789',
      name: 'Premium Cotton T-Shirt',
      category: 'Clothing',
      branch: 'Main Store',
      stock: 150,
      price: 29.99,
      status: 'Active'
    },
    {
      id: 2,
      barcode: '890123456790',
      name: 'Nike Air Max Running Shoes',
      category: 'Sports',
      branch: 'Sports Center',
      stock: 75,
      price: 129.99,
      status: 'Active'
    },
    {
      id: 3,
      barcode: '890123456791',
      name: 'Leather Crossbody Bag',
      category: 'Accessories',
      branch: 'Fashion Outlet',
      stock: 45,
      price: 89.99,
      status: 'Active'
    },
    {
      id: 4,
      barcode: '890123456792',
      name: 'Smart LED TV 55"',
      category: 'Home Appliances',
      branch: 'Electronics Hub',
      stock: 20,
      price: 699.99,
      status: 'Active'
    },
    {
      id: 5,
      barcode: '890123456793',
      name: 'Rolex Submariner Watch',
      category: 'Watches',
      branch: 'Luxury Store',
      stock: 5,
      price: 8999.99,
      status: 'Active'
    },
    {
      id: 6,
      barcode: '890123456794',
      name: 'Denim Slim Fit Jeans',
      category: 'Clothing',
      branch: 'Fashion Outlet',
      stock: 100,
      price: 59.99,
      status: 'Active'
    },
    {
      id: 7,
      barcode: '890123456795',
      name: 'Adidas Training Set',
      category: 'Sports',
      branch: 'Sports Center',
      stock: 30,
      price: 89.99,
      status: 'Active'
    },
    {
      id: 8,
      barcode: '890123456796',
      name: 'Sterling Silver Necklace',
      category: 'Accessories',
      branch: 'Jewelry Store',
      stock: 25,
      price: 149.99,
      status: 'Active'
    },
    {
      id: 9,
      barcode: '890123456797',
      name: 'Microwave Oven',
      category: 'Home Appliances',
      branch: 'Home Store',
      stock: 15,
      price: 199.99,
      status: 'Active'
    },
    {
      id: 10,
      barcode: '890123456798',
      name: 'Casio G-Shock Watch',
      category: 'Watches',
      branch: 'Main Store',
      stock: 40,
      price: 129.99,
      status: 'Active'
    },
    {
      id: 11,
      barcode: '890123456799',
      name: 'Summer Floral Dress',
      category: 'Clothing',
      branch: 'Fashion Outlet',
      stock: 60,
      price: 79.99,
      status: 'Active'
    },
    {
      id: 12,
      barcode: '890123456800',
      name: 'Yoga Mat Premium',
      category: 'Sports',
      branch: 'Sports Center',
      stock: 50,
      price: 39.99,
      status: 'Active'
    },
    {
      id: 13,
      barcode: '890123456801',
      name: 'Designer Sunglasses',
      category: 'Accessories',
      branch: 'Fashion Outlet',
      stock: 35,
      price: 159.99,
      status: 'Active'
    },
    {
      id: 14,
      barcode: '890123456802',
      name: 'Air Conditioner',
      category: 'Home Appliances',
      branch: 'Electronics Hub',
      stock: 10,
      price: 899.99,
      status: 'Active'
    },
    {
      id: 15,
      barcode: '890123456803',
      name: 'Apple Watch Series 7',
      category: 'Watches',
      branch: 'Electronics Hub',
      stock: 25,
      price: 399.99,
      status: 'Active'
    },
    {
      id: 16,
      barcode: '890123456804',
      name: 'Leather Jacket',
      category: 'Clothing',
      branch: 'Fashion Outlet',
      stock: 20,
      price: 199.99,
      status: 'Active'
    },
    {
      id: 17,
      barcode: '890123456805',
      name: 'Basketball',
      category: 'Sports',
      branch: 'Sports Center',
      stock: 45,
      price: 29.99,
      status: 'Active'
    },
    {
      id: 18,
      barcode: '890123456806',
      name: 'Leather Wallet',
      category: 'Accessories',
      branch: 'Main Store',
      stock: 75,
      price: 49.99,
      status: 'Active'
    },
    {
      id: 19,
      barcode: '890123456807',
      name: 'Coffee Maker',
      category: 'Home Appliances',
      branch: 'Home Store',
      stock: 30,
      price: 79.99,
      status: 'Active'
    },
    {
      id: 20,
      barcode: '890123456808',
      name: 'Fossil Chronograph Watch',
      category: 'Watches',
      branch: 'Fashion Outlet',
      stock: 15,
      price: 199.99,
      status: 'Active'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Form state
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: '',
    branchAvailability: [],  // Array of branches where product is available
    stock: '',
    price: '',
    status: 'Active',
    productType: '',
    pricingUnit: '',
    alertQuantity: '',
  });

  // New state for barcode dialog
  const [barcodeDialog, setBarcodeDialog] = useState({ open: false, product: null });

  const [categories, setCategories] = useState([
    'Electronics',
    'Clothing',
    'Food'
  ]);

  const [pricingUnits, setPricingUnits] = useState([
    'piece',
    'kg',
    'meter',
    'liter'
  ]);

  const [addCategoryDialog, setAddCategoryDialog] = useState(false);
  const [addUnitDialog, setAddUnitDialog] = useState(false);

  // Add new state for delete confirmation
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });

  // Handlers
  const handleOpenDialog = (mode, product = null) => {
    setDialogMode(mode);
    setSelectedProduct(product);
    if (mode === 'edit' && product) {
      setFormData({ ...product });
    } else {
      setFormData({
        barcode: '',
        name: '',
        category: '',
        branchAvailability: [],
        stock: '',
        price: '',
        status: 'Active',
        productType: '',
        pricingUnit: '',
        alertQuantity: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setBranchFilter('all');
    setStatusFilter('all');
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.includes(searchTerm);
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesBranch = branchFilter === 'all' || product.branch === branchFilter;
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesBranch && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, branchFilter, statusFilter]);

  // Table columns configuration
  const columns = [
    {
      name: 'Barcode',
      selector: row => row.barcode,
      sortable: true,
      cell: row => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%' 
        }}>
          <IconButton
            size="small"
            onClick={() => setBarcodeDialog({ open: true, product: row })}
            sx={{ 
              p: '6px',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <QrCodeIcon sx={{ fontSize: 18, color: '#6B7280' }} />
          </IconButton>
        </Box>
      ),
      width: '100px',
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
            src={SAMPLE_PRODUCT_IMAGES[row.category] || SAMPLE_PRODUCT_IMAGES.default}
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
      selector: row => row.category,
      sortable: true,
      cell: row => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1
        }}>
          <Chip
            label={row.category}
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
      width: '150px',
    },
    {
      name: 'Branch',
      selector: row => row.branch,
      sortable: true,
      cell: row => (
        <Typography sx={{ 
          fontSize: '0.75rem', 
          color: '#111827',
          maxWidth: '150px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {row.branch}
        </Typography>
      ),
      width: '150px',
    },
    {
      name: 'Stock',
      selector: row => row.stock,
      sortable: true,
      cell: row => (
        <Chip
          label={row.stock}
          size="small"
          sx={{
            fontSize: '0.7rem',
            height: '20px',
            backgroundColor: row.stock > 20 ? 'rgba(46, 204, 113, 0.1)' : row.stock > 10 ? 'rgba(246, 194, 62, 0.1)' : 'rgba(235, 87, 87, 0.1)',
            color: row.stock > 20 ? '#2ecc71' : row.stock > 10 ? '#f6c23e' : '#eb5757',
            fontWeight: 500,
            borderRadius: '4px'
          }}
        />
      ),
      width: '100px',
    },
    {
      name: 'Price',
      selector: row => row.price,
      sortable: true,
      cell: row => (
        <Typography sx={{ 
          fontSize: '0.75rem', 
          fontWeight: 500, 
          color: '#111827'
        }}>
          ${row.price.toFixed(2)}
        </Typography>
      ),
      width: '100px',
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
      width: '100px',
    },
    {
      name: 'Actions',
      cell: row => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit Product" arrow placement="top">
            <IconButton 
              size="small" 
              onClick={() => handleOpenDialog('edit', row)}
              sx={{ 
                padding: '2px',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <EditIcon sx={{ fontSize: 14, color: '#6B7280' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Product" arrow placement="top">
            <IconButton 
              size="small" 
              onClick={() => handleDeleteProduct(row)}
              sx={{ 
                padding: '2px',
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.04)'
                }
              }}
            >
              <DeleteIcon sx={{ fontSize: 14, color: '#EF4444' }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      width: '100px',
      right: true,
    },
  ];

  // Form handlers
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProduct = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (dialogMode === 'add') {
        const newProduct = {
          id: products.length + 1,
          ...formData
        };
        setProducts(prev => [...prev, newProduct]);
        setSnackbar({
          open: true,
          message: 'Product added successfully',
          severity: 'success'
        });
      } else {
        setProducts(prev => 
          prev.map(p => p.id === selectedProduct.id ? { ...p, ...formData } : p)
        );
        setSnackbar({
          open: true,
          message: 'Product updated successfully',
          severity: 'success'
        });
      }
      
      setLoading(false);
      handleCloseDialog();
    }, 1000);
  };

  const handleDeleteProduct = (product) => {
    setDeleteDialog({ open: true, product });
  };

  const handleConfirmDelete = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setProducts(prev => prev.filter(p => p.id !== deleteDialog.product.id));
      setSnackbar({
        open: true,
        message: 'Product deleted successfully',
        severity: 'success'
      });
      setLoading(false);
      setDeleteDialog({ open: false, product: null });
    }, 1000);
  };

  return (
    <Box className="roles-container">
      <Box className="roles-header">
        <Box>
          <Typography variant="h5" className="page-title">
            Manage Products
          </Typography>
          <Typography variant="body1" color="textSecondary" className="page-subtitle">
            Add, edit and manage your product inventory
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('add')}
          className="add-role-button"
          size="small"
        >
          ADD PRODUCT
        </Button>
      </Box>

      {/* Filter Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 4, 
          borderRadius: 2,
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 3 },
            width: '100%',
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between'
          }}
        >
          {/* Search Input */}
          <TextField
            placeholder="Search by name or barcode..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgb(100, 116, 139)', fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: { 
                fontSize: '0.875rem',
                color: 'rgb(100, 116, 139)',
              }
            }}
            sx={{
              width: '100%',
              flexGrow: { xs: 1, md: 1 },
              flexBasis: { md: '0' },
              maxWidth: { xs: '100%', md: '100%' },
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                height: '44px',
                borderColor: '#e2e8f0',
                backgroundColor: 'white',
                '&:hover': {
                  borderColor: '#cbd5e1',
                },
                '&.Mui-focused': {
                  borderColor: 'rgb(26, 32, 53)',
                  borderWidth: '1px',
                  boxShadow: 'none',
                }
              }
            }}
          />

          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: 2, 
            alignItems: 'center',
            width: { xs: '100%', md: '100%' },
            flexGrow: { md: 2 },
            flexBasis: { md: '0' },
            justifyContent: { md: 'flex-end' }
          }}>
            {/* Category Filter */}
            <FormControl
              variant="outlined"
              size="small"
              sx={{
                width: { xs: 'calc(50% - 8px)', sm: 'calc(50% - 8px)', md: '100%' },
                flexGrow: { xs: 1, sm: 1, md: 1 },
                flexBasis: { md: '0' },
                maxWidth: { md: '100%' },
                position: 'relative',
                zIndex: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: '44px',
                  backgroundColor: 'white',
                  borderColor: '#e2e8f0',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                  }
                }
              }}
            >
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                displayEmpty
                inputProps={{ 'aria-label': 'Category filter' }}
                renderValue={(selected) => {
                  if (selected === 'all') return 'All Categories';
                  return selected;
                }}
                sx={{ 
                  fontSize: '0.875rem',
                  color: 'rgb(100, 116, 139)',
                  '& .MuiSelect-select': { 
                    paddingTop: '11px',
                    paddingBottom: '11px',
                  },
                  position: 'relative',
                  zIndex: 10
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { 
                      maxHeight: 300,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      zIndex: 10001
                    }
                  },
                  disablePortal: false,
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  }
                }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All Categories</MenuItem>
                <MenuItem value="Electronics">Electronics</MenuItem>
                <MenuItem value="Clothing">Clothing</MenuItem>
                <MenuItem value="Food">Food</MenuItem>
              </Select>
            </FormControl>

            {/* Branch Filter */}
            <FormControl
              variant="outlined"
              size="small"
              sx={{
                width: { xs: 'calc(50% - 8px)', sm: 'calc(50% - 8px)', md: '100%' },
                flexGrow: { xs: 1, sm: 1, md: 1 },
                flexBasis: { md: '0' },
                maxWidth: { md: '100%' },
                position: 'relative',
                zIndex: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: '44px',
                  backgroundColor: 'white',
                  borderColor: '#e2e8f0',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                  }
                }
              }}
            >
              <Select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                displayEmpty
                inputProps={{ 'aria-label': 'Branch filter' }}
                renderValue={(selected) => {
                  if (selected === 'all') return 'All Branches';
                  return selected;
                }}
                sx={{ 
                  fontSize: '0.875rem',
                  color: 'rgb(100, 116, 139)',
                  '& .MuiSelect-select': { 
                    paddingTop: '11px',
                    paddingBottom: '11px',
                  },
                  position: 'relative',
                  zIndex: 10
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { 
                      maxHeight: 300,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      zIndex: 10001
                    }
                  },
                  disablePortal: false,
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  }
                }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All Branches</MenuItem>
                <MenuItem value="Main Store">Main Store</MenuItem>
                <MenuItem value="Branch A">Branch A</MenuItem>
                <MenuItem value="Branch B">Branch B</MenuItem>
              </Select>
            </FormControl>

            {/* Status Filter */}
            <FormControl
              variant="outlined"
              size="small"
              sx={{
                width: { xs: 'calc(50% - 8px)', sm: 'calc(50% - 8px)', md: '100%' },
                flexGrow: { xs: 1, sm: 1, md: 1 },
                flexBasis: { md: '0' },
                maxWidth: { md: '100%' },
                position: 'relative',
                zIndex: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: '44px',
                  backgroundColor: 'white',
                  borderColor: '#e2e8f0',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                  }
                }
              }}
            >
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
                inputProps={{ 'aria-label': 'Status filter' }}
                renderValue={(selected) => {
                  if (selected === 'all') return 'All Status';
                  if (selected === 'active') return 'Active';
                  if (selected === 'inactive') return 'Inactive';
                  return 'All Status';
                }}
                sx={{ 
                  fontSize: '0.875rem',
                  color: 'rgb(100, 116, 139)',
                  '& .MuiSelect-select': { 
                    paddingTop: '11px',
                    paddingBottom: '11px',
                  },
                  position: 'relative',
                  zIndex: 10
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { 
                      maxHeight: 200,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      zIndex: 10001
                    }
                  },
                  disablePortal: false,
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  }
                }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All Status</MenuItem>
                <MenuItem value="Active" sx={{ fontSize: '0.875rem' }}>Active</MenuItem>
                <MenuItem value="Inactive" sx={{ fontSize: '0.875rem' }}>Inactive</MenuItem>
              </Select>
            </FormControl>

            {/* Reset Button */}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
              onClick={handleResetFilters}
              sx={{
                color: 'rgb(26, 32, 53)',
                borderColor: '#e2e8f0',
                backgroundColor: 'white',
                borderRadius: '8px',
                height: '44px',
                fontSize: '0.875rem',
                textTransform: 'none',
                fontWeight: 500,
                padding: '0 16px',
                width: { xs: '100%', sm: 'calc(100% - 0px)', md: '100%' },
                flexGrow: { md: 1 },
                flexBasis: { md: '0' },
                maxWidth: { md: '100%' },
                '&:hover': {
                  backgroundColor: '#f8fafc',
                  borderColor: '#cbd5e1',
                },
              }}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Products Table */}
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
                {searchTerm || categoryFilter !== 'all' || branchFilter !== 'all' || statusFilter !== 'all'
                  ? 'No products found matching your search criteria'
                  : 'No products available'}
              </Typography>
            </Box>
          }
          progressPending={loading}
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
          conditionalRowStyles={[
            {
              when: row => !row.isActive,
              style: {
                backgroundColor: 'rgba(248, 250, 252, 0.4)',
                color: '#64748b',
              },
            },
          ]}
        />
      </Paper>

      {/* Add/Edit Product Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            m: { xs: 2, md: 2 },
            maxWidth: { xs: '100%', sm: '500px' }
          }
        }}
      >
        <DialogTitle sx={{ 
          p: '16px 20px',
          fontSize: '20px',
          fontWeight: 600,
          color: 'rgb(17, 24, 39)',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {dialogMode === 'add' ? 'Add New Product' : 'Edit Product'}
        </DialogTitle>
        
        <DialogContent sx={{ p: '20px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Product Type */}
            <FormControl fullWidth>
              <Select
                name="productType"
                value={formData.productType || ''}
                onChange={handleFormChange}
                displayEmpty
                sx={{ 
                  height: '40px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e5e7eb',
                    borderRadius: '6px'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d1d5db',
                  },
                }}
                renderValue={(value) => value || "Select Product Type"}
              >
                <MenuItem value="Physical">Physical Product</MenuItem>
                <MenuItem value="Digital">Digital Product</MenuItem>
                <MenuItem value="Service">Service</MenuItem>
              </Select>
            </FormControl>

            {/* Product Name */}
            <TextField
              name="name"
              placeholder="Product Name"
              value={formData.name}
              onChange={handleFormChange}
              fullWidth
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  height: '40px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  '& fieldset': {
                    borderColor: '#e5e7eb',
                    borderRadius: '6px'
                  },
                  '&:hover fieldset': {
                    borderColor: '#d1d5db',
                  },
                }
              }}
            />

            {/* Category with Add Button */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl fullWidth>
                <Select
                  name="category"
                  value={formData.category || ''}
                  onChange={handleFormChange}
                  displayEmpty
                  sx={{ 
                    height: '40px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e5e7eb',
                      borderRadius: '6px'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#d1d5db',
                    },
                  }}
                  renderValue={(value) => value || "Select Category"}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton 
                onClick={() => setAddCategoryDialog(true)}
                sx={{ 
                  width: '40px',
                  height: '40px',
                  minWidth: '40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  '&:hover': {
                    backgroundColor: '#f9fafb',
                    borderColor: '#d1d5db'
                  }
                }}
              >
                <AddIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Unit of Pricing with Add Button */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl fullWidth>
                <Select
                  name="pricingUnit"
                  value={formData.pricingUnit || ''}
                  onChange={handleFormChange}
                  displayEmpty
                  sx={{ 
                    height: '40px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e5e7eb',
                      borderRadius: '6px'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#d1d5db',
                    },
                  }}
                  renderValue={(value) => value || "Unit of Pricing"}
                >
                  {pricingUnits.map((unit) => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton 
                onClick={() => setAddUnitDialog(true)}
                sx={{ 
                  width: '40px',
                  height: '40px',
                  minWidth: '40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  '&:hover': {
                    backgroundColor: '#f9fafb',
                    borderColor: '#d1d5db'
                  }
                }}
              >
                <AddIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Branch Availability */}
            <Box>
              <Typography sx={{ 
                fontSize: '13px', 
                color: '#111827', 
                fontWeight: 500, 
                mb: 0.75 
              }}>
                Branch Availability
              </Typography>
              
              {/* Selected Branches Display */}
              {formData.branchAvailability?.length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 0.5, 
                  mb: 1,
                  p: 1,
                  backgroundColor: '#F9FAFB',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB'
                }}>
                  {AVAILABLE_BRANCHES
                    .filter(branch => formData.branchAvailability?.includes(branch.name))
                    .map((branch) => (
                      <Chip
                        key={branch.id}
                        label={branch.name}
                        onDelete={() => {
                          const newValue = formData.branchAvailability.filter(
                            b => b !== branch.name
                          );
                          setFormData(prev => ({
                            ...prev,
                            branchAvailability: newValue
                          }));
                        }}
                        sx={{
                          height: '24px',
                          fontSize: '12px',
                          backgroundColor: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '4px',
                          '& .MuiChip-label': {
                            px: 1,
                            color: '#111827'
                          },
                          '& .MuiChip-deleteIcon': {
                            fontSize: '14px',
                            color: '#6B7280',
                            mr: '2px',
                            '&:hover': {
                              color: '#111827'
                            }
                          }
                        }}
                      />
                    ))}
                </Box>
              )}

              {/* Branch Selection Dropdown */}
              <FormControl fullWidth>
                <Select
                  multiple
                  displayEmpty
                  value={[]}
                  onChange={(event) => {
                    const selectedBranch = event.target.value[0];
                    if (!formData.branchAvailability?.includes(selectedBranch)) {
                      setFormData(prev => ({
                        ...prev,
                        branchAvailability: [...(prev.branchAvailability || []), selectedBranch]
                      }));
                    }
                  }}
                  renderValue={() => "Select branches"}
                  sx={{
                    height: '40px',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E5E7EB',
                      borderRadius: '6px'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#D1D5DB'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2563EB',
                      borderWidth: '1px'
                    },
                    '& .MuiSelect-select': {
                      fontSize: '14px',
                      color: '#9CA3AF'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        maxHeight: '280px',
                        borderRadius: '6px',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        border: '1px solid #E5E7EB',
                        '& .MuiMenuItem-root': {
                          fontSize: '13px',
                          py: 0.75,
                          px: 1.5,
                          '&:hover': {
                            backgroundColor: '#F3F4F6'
                          }
                        }
                      }
                    }
                  }}
                >
                  {AVAILABLE_BRANCHES
                    .filter(branch => !formData.branchAvailability?.includes(branch.name))
                    .map((branch) => (
                      <MenuItem 
                        key={branch.id} 
                        value={branch.name}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        {branch.name}
                      </MenuItem>
                    ))}
                  {AVAILABLE_BRANCHES.length === formData.branchAvailability?.length && (
                    <MenuItem disabled sx={{ color: '#9CA3AF', fontSize: '13px' }}>
                      All branches selected
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>

            {/* Stock Management Section */}
            <Box>
              <Typography sx={{ 
                fontSize: '13px', 
                color: '#111827', 
                fontWeight: 500, 
                mb: 0.75 
              }}>
                Stock Management
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                '& .MuiFormControl-root': {
                  flex: 1
                }
              }}>
                <TextField
                  name="initialStock"
                  placeholder="Initial Stock"
                  type="number"
                  value={formData.initialStock}
                  onChange={handleFormChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ 
                          color: '#6B7280', 
                          fontSize: '13px',
                          pr: 1,
                          borderRight: '1px solid #E5E7EB'
                        }}>
                          Qty
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                      fontSize: '14px',
                      backgroundColor: '#fff',
                      '& fieldset': {
                        borderColor: '#e5e7eb',
                        borderRadius: '6px'
                      },
                      '&:hover fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '& .MuiInputAdornment-root': {
                        ml: 1,
                        mr: -0.5
                      }
                    },
                    '& input': {
                      pl: 1
                    }
                  }}
                />
                <TextField
                  name="alertQuantity"
                  placeholder="Alert Quantity"
                  type="number"
                  value={formData.alertQuantity}
                  onChange={handleFormChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ 
                          color: '#6B7280', 
                          fontSize: '13px',
                          pr: 1,
                          borderRight: '1px solid #E5E7EB'
                        }}>
                          Min
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                      fontSize: '14px',
                      backgroundColor: '#fff',
                      '& fieldset': {
                        borderColor: '#e5e7eb',
                        borderRadius: '6px'
                      },
                      '&:hover fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '& .MuiInputAdornment-root': {
                        ml: 1,
                        mr: -0.5
                      }
                    },
                    '& input': {
                      pl: 1
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Image Upload Section */}
            <Box
              sx={{
                border: '1px dashed #e5e7eb',
                borderRadius: '6px',
                p: 2.5,
                textAlign: 'center',
                backgroundColor: '#f9fafb',
                cursor: 'pointer',
                minHeight: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  borderColor: '#111827',
                  backgroundColor: '#f3f4f6'
                }
              }}
            >
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                id="product-image"
              />
              <label htmlFor="product-image" style={{ cursor: 'pointer', width: '100%' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                  <Box 
                    sx={{ 
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 20, color: 'rgb(107, 114, 128)' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '14px', color: '#111827', fontWeight: 500, mb: 0.5 }}>
                      Click to upload product image
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: 'rgb(107, 114, 128)' }}>
                      SVG, PNG, JPG or GIF (Max. 800x400px)
                    </Typography>
                  </Box>
                </Box>
              </label>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          gap: 1
        }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              height: '40px',
              px: 3,
              color: '#111827',
              borderColor: '#e5e7eb',
              borderRadius: '6px',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#d1d5db',
                backgroundColor: '#f9fafb'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProduct}
            variant="contained"
            sx={{
              height: '40px',
              px: 3,
              bgcolor: '#111827',
              borderRadius: '6px',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'rgba(17, 24, 39, 0.9)'
              }
            }}
          >
            {dialogMode === 'add' ? 'Add Product' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Barcode Dialog */}
      <BarcodeDialog 
        open={barcodeDialog.open}
        onClose={() => setBarcodeDialog({ open: false, product: null })}
        product={barcodeDialog.product}
      />

      {/* Add Category Dialog */}
      <AddItemDialog
        open={addCategoryDialog}
        onClose={() => setAddCategoryDialog(false)}
        title="Add New Category"
        placeholder="Enter category name"
        onSave={(newCategory) => {
          setCategories(prev => [...prev, newCategory]);
          setSnackbar({
            open: true,
            message: 'Category added successfully',
            severity: 'success'
          });
        }}
      />

      {/* Add Unit Dialog */}
      <AddItemDialog
        open={addUnitDialog}
        onClose={() => setAddUnitDialog(false)}
        title="Add New Unit"
        placeholder="Enter unit name"
        onSave={(newUnit) => {
          setPricingUnits(prev => [...prev, newUnit]);
          setSnackbar({
            open: true,
            message: 'Unit added successfully',
            severity: 'success'
          });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, product: null })}
        onConfirm={handleConfirmDelete}
        productName={deleteDialog.product?.name}
        category={deleteDialog.product?.category}
      />

      {/* Snackbar for notifications */}
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageProducts; 