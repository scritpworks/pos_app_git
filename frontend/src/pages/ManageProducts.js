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
  OutlinedInput,
  Tabs,
  Tab
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
import axios from 'axios';
import { API_ENDPOINTS, getAuthHeader } from '../apiConfig/apiConfig';

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

const DeleteConfirmationDialog = ({ open, onClose, onConfirm, name, type = 'unit' }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: '8px', maxWidth: '400px' }
      }}
    >
      <DialogTitle sx={{ 
        p: '16px 20px',
        fontSize: '18px',
        fontWeight: 600,
        color: '#111827',
        borderBottom: '1px solid #e5e7eb'
      }}>
        Delete {type}
      </DialogTitle>
      <DialogContent sx={{ p: '20px' }}>
        <Typography sx={{ fontSize: '14px', color: '#4B5563' }}>
          Are you sure you want to delete "{name}"? This action cannot be undone.
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

const CategoryDialog = ({ 
  open, 
  onClose, 
  categories,
  onUpdateCategory,
  onDeleteCategory,
  onAddCategory,
  setSnackbar 
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!categoryName.trim()) return;
    setLoading(true);
    
    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, categoryName);
      } else {
        await onAddCategory(categoryName);
      }
      setCategoryName('');
      setEditingCategory(null);
      onClose();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error saving category',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '12px' }
      }}
    >
      <DialogTitle sx={{ 
        p: '20px 24px',
        fontSize: '18px',
        fontWeight: 600,
        borderBottom: '1px solid #e5e7eb'
      }}>
        Manage Categories
      </DialogTitle>
      <DialogContent sx={{ p: '24px' }}>
        {/* Add Category Form */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter category name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
          />
        </Box>

        {/* Categories List */}
        <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
          {categories.map((category) => (
            <Box
              key={category.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                borderBottom: '1px solid #e5e7eb',
                '&:last-child': {
                  borderBottom: 'none'
                }
              }}
            >
              <Typography sx={{ fontSize: '14px' }}>
                {category.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditingCategory(category);
                    setCategoryName(category.name);
                  }}
                >
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onDeleteCategory(category.id)}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        p: '16px 24px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <Button
          onClick={() => {
            setCategoryName('');
            setEditingCategory(null);
            onClose();
          }}
          variant="outlined"
          sx={{
            borderRadius: '8px',
            textTransform: 'none'
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!categoryName.trim() || loading}
          sx={{
            borderRadius: '8px',
            textTransform: 'none'
          }}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : editingCategory ? (
            'Update Category'
          ) : (
            'Add Category'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const UnitDialog = ({ 
  open, 
  onClose, 
  units = [], 
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  setSnackbar 
}) => {
  const [unitName, setUnitName] = useState('');
  const [editingUnit, setEditingUnit] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!unitName.trim()) return;
    
    setLoading(true);
    
    try {
      if (editingUnit) {
        // Update existing unit
        await onUpdateUnit(editingUnit.id, unitName);
        setEditingUnit(null);
      } else {
        // Add new unit
        await onAddUnit(unitName);
      }
      setUnitName('');
    } catch (error) {
      console.error('Error saving unit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '12px' }
      }}
    >
      <DialogTitle sx={{ 
        p: '20px 24px',
        fontSize: '18px',
        fontWeight: 600,
        borderBottom: '1px solid #e5e7eb'
      }}>
        Manage Units
      </DialogTitle>
      <DialogContent sx={{ p: '24px' }}>
        {/* Add/Edit Unit Form */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={editingUnit ? "Edit unit name" : "Enter unit name (e.g., piece, kg, meter)"}
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
          />
        </Box>

        {/* Units List */}
        <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
          {units && units.length > 0 ? (
            units.map((unit) => (
              <Box
                key={unit.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderBottom: '1px solid #e5e7eb',
                  '&:last-child': {
                    borderBottom: 'none'
                  }
                }}
              >
                <Typography sx={{ fontSize: '14px' }}>
                  {unit.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingUnit(unit);
                      setUnitName(unit.name);
                    }}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onDeleteUnit(unit.id)}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>
            ))
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography sx={{ color: '#6B7280', fontSize: '14px' }}>
                No units available
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        p: '16px 24px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <Button
          onClick={() => {
            setUnitName('');
            setEditingUnit(null);
            onClose();
          }}
          variant="outlined"
          sx={{
            borderRadius: '8px',
            textTransform: 'none'
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!unitName.trim() || loading}
          sx={{
            borderRadius: '8px',
            textTransform: 'none'
          }}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : editingUnit ? (
            'Update Unit'
          ) : (
            'Add Unit'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ManageProducts = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [branchPrices, setBranchPrices] = useState([]);
  const [selectedPriceGroup, setSelectedPriceGroup] = useState('retail');
  const [defaultPrices, setDefaultPrices] = useState({
    retail: 0,
    wholesale: 0,
    special: 0
  });
  
  // Dialog states
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addCategoryDialog, setAddCategoryDialog] = useState(false);
  const [addUnitDialog, setAddUnitDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    open: false,
    unitId: null,
    unitName: ''
  });
  const [barcodeDialog, setBarcodeDialog] = useState({ open: false, product: null });

  // Form state - single source of truth
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    productType: '', // Changed from product_type
    category: '', // This will hold the category name
    pricingUnit: '', // This will hold the unit name
    barcode: '',
    image: '',
    initialStock: '0',
    alertQuantity: '0',
    purchase_price: '0',
    status: 'Active',
    branchAvailability: []
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Price-related states
  const [priceTypes, setPriceTypes] = useState([]);
  const [productPrices, setProductPrices] = useState({});

  // Handlers
  const handleOpenDialog = async (mode, product = null) => {
    setDialogMode(mode);
    setSelectedProduct(product);
    
    if (mode === 'edit' && product) {
      try {
        const response = await axios.get(`${API_ENDPOINTS.products}/${product.id}`, getAuthHeader());
        if (response.data.success) {
          const productData = response.data.data;
          
          // Set form data
          setFormData({
            id: productData.id,
            name: productData.name,
            description: productData.description || '',
            productType: productData.product_type,
            category: productData.category_name,
            pricingUnit: productData.unit_name,
            barcode: productData.barcode || '',
            image: productData.image || '',
            initialStock: productData.stock_quantity?.toString() || '0',
            alertQuantity: productData.alert_quantity?.toString() || '0',
            purchase_price: productData.purchase_price?.toString() || '0',
            status: productData.status || 'Active',
            branchAvailability: productData.branch_products?.map(bp => bp.branch_name) || []
          });

          // Set branch prices
          const newProductPrices = {};
          
          // Initialize price types from the priceTypes state
          priceTypes.forEach(pt => {
            newProductPrices[pt.name.toLowerCase()] = { all: 0, byBranch: {} };
          });

          // Process branch prices
          Object.entries(productData.branch_prices || {}).forEach(([branchId, prices]) => {
            prices.forEach(price => {
              // Find price type name from ID
              const priceType = priceTypes.find(pt => pt.id === price.price_type_id);
              if (priceType) {
                const priceTypeName = priceType.name.toLowerCase();
                if (newProductPrices[priceTypeName]) {
                  newProductPrices[priceTypeName].byBranch[branchId] = price.price;
                }
              }
            });
          });

          setProductPrices(newProductPrices);

          // Set selected branches
          const selectedBranchIds = productData.branch_products?.map(bp => bp.branch_id) || [];
          setSelectedBranches(selectedBranchIds);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Error fetching product details',
          severity: 'error'
        });
      }
    } else {
      // Reset form for new product
      setFormData({
        id: '',
        name: '',
        description: '',
        productType: '',
        category: '',
        pricingUnit: '',
        barcode: '',
        image: '',
        initialStock: '0',
        alertQuantity: '0',
        purchase_price: '0',
        status: 'Active',
        branchAvailability: []
      });
      setProductPrices({
        retail: { all: 0, byBranch: {} },
        wholesale: { all: 0, byBranch: {} },
        special: { all: 0, byBranch: {} }
      });
      setSelectedBranches([]);
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
            src={row.image || SAMPLE_PRODUCT_IMAGES.default}
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
      width: '150px',
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
      width: '100px',
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
      width: '100px',
    },
    {
      name: 'Purchase Price',
      selector: row => row.purchase_price,
      sortable: true,
      cell: row => (
        <Typography sx={{ 
          fontSize: '0.75rem', 
          fontWeight: 500, 
          color: '#111827'
        }}>
          GH₵{parseFloat(row.purchase_price).toFixed(2)}
        </Typography>
      ),
      width: '120px',
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
          <IconButton 
            size="small"
            onClick={() => handleOpenDialog('edit', row)}
            sx={{ 
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small"
            onClick={() => handleDeleteProduct(row)}
            sx={{ 
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.04)'
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
      width: '120px',
      sortable: false
    }
  ];

  // Form handlers
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePriceChange = (priceType, branchId, value) => {
    setProductPrices(prev => ({
      ...prev,
      [priceType]: {
        ...prev[priceType],
        ...(branchId === 'all' 
          ? { all: value }
          : { 
              byBranch: {
                ...prev[priceType].byBranch,
                [branchId]: value
              }
            }
        )
      }
    }));
  };

  const handleApplyDefaultPrice = () => {
    const defaultPrice = defaultPrices[selectedPriceGroup];
    const branchPrices = {};
    
    formData.branchAvailability?.forEach(branchName => {
      const branch = branches.find(b => b.name === branchName);
      if (branch) {
        branchPrices[branch.id] = defaultPrice;
      }
    });

    setProductPrices(prev => ({
      ...prev,
      [selectedPriceGroup]: {
        ...prev[selectedPriceGroup],
        byBranch: branchPrices
      }
    }));
  };

  // Update the handleSaveProduct function to use formData
  const handleSaveProduct = async () => {
    try {
      // First, get the category and unit IDs
      const selectedCategory = categories.find(c => c.name === formData.category);
      const selectedUnit = units.find(u => u.name === formData.pricingUnit);

      // Prepare branch prices from productPrices state
      const branchPricesArray = [];
      formData.branchAvailability.forEach(branchName => {
        const branch = branches.find(b => b.name === branchName);
        if (!branch) return;

        // Add prices for each price type
        Object.entries(productPrices).forEach(([priceTypeName, priceData]) => {
          // Find the price type ID from the priceTypes array
          const priceType = priceTypes.find(pt => pt.name.toLowerCase() === priceTypeName);
          if (!priceType) return;

          const price = priceData.byBranch[branch.id] || priceData.all || 0;
          branchPricesArray.push({
            branch_id: branch.id,
            price_type_id: priceType.id,  // Send the ID instead of name
            price: parseFloat(price)
          });
        });
      });

      // Prepare the data exactly as the backend expects it
      const productData = {
        name: formData.name,
        description: formData.description || '',
        product_type: formData.productType,
        category_id: selectedCategory?.id,
        unit_id: selectedUnit?.id,
        barcode: formData.barcode || '',
        image: formData.image || '',
        initial_stock: parseInt(formData.initialStock) || 0,
        alert_quantity: parseInt(formData.alertQuantity) || 0,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        branch_prices: branchPricesArray,
        status: formData.status || 'Active'
      };

      // Validate required fields
      if (!productData.name || !productData.product_type || !productData.category_id || !productData.unit_id) {
        throw new Error('Please fill all required fields (Name, Product Type, Category, and Unit)');
      }

      let response;
      if (formData.id) {
        response = await axios.put(`${API_ENDPOINTS.products}/${formData.id}`, productData, getAuthHeader());
      } else {
        response = await axios.post(API_ENDPOINTS.products, productData, getAuthHeader());
      }

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `Product ${formData.id ? 'updated' : 'created'} successfully`,
          severity: 'success'
        });
        setOpenDialog(false);
        fetchProducts();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || `Error ${formData.id ? 'updating' : 'creating'} product`,
        severity: 'error'
      });
    }
  };

  // Update resetForm to work with formData
  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      productType: '', // Changed from product_type
      category: '', // This will hold the category name
      pricingUnit: '', // This will hold the unit name
      barcode: '',
      image: '',
      initialStock: '0',
      alertQuantity: '0',
      purchase_price: '0',
      status: 'Active',
      branchAvailability: []
    });
    setBranchPrices([]);
    setSelectedBranches([]);
  };

  const handleDeleteProduct = (product) => {
    setDeleteDialog({ open: true, product });
  };

  // Add handleConfirmDelete function here
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

  // Add these new category management functions
  const handleAddCategory = async (categoryName) => {
    try {
      await axios.post(
        API_ENDPOINTS.categories,
        { name: categoryName },
        getAuthHeader()
      );
      fetchCategories();
      setSnackbar({
        open: true,
        message: 'Category added successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error adding category',
        severity: 'error'
      });
      throw error;
    }
  };

  const handleUpdateCategory = async (categoryId, newName) => {
    try {
      await axios.put(
        API_ENDPOINTS.categoryById(categoryId),
        { name: newName },
        getAuthHeader()
      );
      fetchCategories();
      setSnackbar({
        open: true,
        message: 'Category updated successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error updating category',
        severity: 'error'
      });
      throw error;
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await axios.delete(
        API_ENDPOINTS.categoryById(categoryId),
        getAuthHeader()
      );
      fetchCategories();
      setSnackbar({
        open: true,
        message: 'Category deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error deleting category',
        severity: 'error'
      });
      throw error;
    }
  };

  // Add this function to fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.categories, getAuthHeader());
      setCategories(response.data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error fetching categories',
        severity: 'error'
      });
    }
  };

  // Update the fetchUnits function
  const fetchUnits = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.units, getAuthHeader());
      
      if (response.data.success) {
        setUnits(response.data.data || []);
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || 'Failed to fetch units',
          severity: 'error'
        });
        setUnits([]);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error fetching units',
        severity: 'error'
      });
      setUnits([]);
    }
  };

  // Add this function to fetch branches
  const fetchBranches = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.branches, getAuthHeader());
      if (response.data) {
        setBranches(response.data);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error fetching branches',
        severity: 'error'
      });
    }
  };

  // Add function to fetch price types
  const fetchPriceTypes = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.priceTypes, getAuthHeader());
      if (response.data.success) {
        setPriceTypes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching price types:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error fetching price types',
        severity: 'error'
      });
    }
  };

  // Update the fetchProducts function
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.products, getAuthHeader());
      
      if (response.data.success) {
        // Map the response data to match our table structure
        const formattedProducts = response.data.data.map(product => ({
          id: product.id,
          barcode: product.barcode || '',
          name: product.name,
          category_name: product.category_name,
          unit_name: product.unit_name,
          stock_quantity: product.stock_quantity,
          purchase_price: product.purchase_price,
          status: product.status,
          // Include other fields that might be needed for editing
          description: product.description,
          product_type: product.product_type,
          category_id: product.category_id,
          unit_id: product.unit_id,
          alert_quantity: product.alert_quantity,
          image: product.image
        }));
        
        setProducts(formattedProducts);
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || 'Failed to fetch products',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error fetching products',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Make sure to call fetchProducts in useEffect
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchUnits();
    fetchBranches();
    fetchPriceTypes();
  }, []);

  // Add unit management functions
  const handleAddUnit = async (unitName) => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.units,
        { name: unitName },
        getAuthHeader()
      );
      
      if (response.data.success) {
        // Fetch units after successful addition
        await fetchUnits();
        
        setSnackbar({
          open: true,
          message: 'Unit added successfully',
          severity: 'success'
        });
        
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to add unit');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || 'Error adding unit',
        severity: 'error'
      });
      return false;
    }
  };

  const handleUpdateUnit = async (unitId, newName) => {
    try {
      const response = await axios.put(
        API_ENDPOINTS.unitById(unitId),
        { name: newName },
        getAuthHeader()
      );
      
      if (response.data.success) {
        // Refresh the units list
        await fetchUnits();
        
        setSnackbar({
          open: true,
          message: 'Unit updated successfully',
          severity: 'success'
        });
        
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update unit');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || 'Error updating unit',
        severity: 'error'
      });
      return false;
    }
  };

  // Update the handleDeleteUnit function to first show confirmation
  const handleDeleteUnit = async (unitId) => {
    // Find the unit name for the confirmation message
    const unitToDelete = units.find(unit => unit.id === unitId);
    if (!unitToDelete) return;
    
    // Show confirmation dialog
    setDeleteConfirmation({
      open: true,
      unitId: unitId,
      unitName: unitToDelete.name
    });
  };

  // Add a function to handle the actual deletion after confirmation
  const confirmDeleteUnit = async () => {
    const unitId = deleteConfirmation.unitId;
    
    try {
      const response = await axios.delete(
        API_ENDPOINTS.unitById(unitId),
        getAuthHeader()
      );
      
      if (response.data.success) {
        // Refresh the units list
        await fetchUnits();
        
        setSnackbar({
          open: true,
          message: 'Unit deleted successfully',
          severity: 'success'
        });
      } else {
        throw new Error(response.data.message || 'Failed to delete unit');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || 'Error deleting unit',
        severity: 'error'
      });
    } finally {
      // Close the confirmation dialog
      setDeleteConfirmation({
        open: false,
        unitId: null,
        unitName: ''
      });
    }
  };

  // Add this component for the pricing section
  const PricingSection = () => {
    return (
      <Box sx={{ mt: 3 }}>
        <Typography sx={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: '#111827',
          mb: 2 
        }}>
          Pricing Configuration
        </Typography>

        {/* Price Group Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '13px', color: '#6B7280', mb: 1 }}>
            Select Price Group
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexWrap: 'wrap'
          }}>
            {priceTypes.map((priceType) => (
              <Chip
                key={priceType.id}
                label={priceType.name}
                onClick={() => setSelectedPriceGroup(priceType.name.toLowerCase())}
                sx={{
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: selectedPriceGroup === priceType.name.toLowerCase() 
                    ? '#2563EB'
                    : '#F3F4F6',
                  color: selectedPriceGroup === priceType.name.toLowerCase() 
                    ? 'white'
                    : '#374151',
                  '&:hover': {
                    backgroundColor: selectedPriceGroup === priceType.name.toLowerCase() 
                      ? '#2563EB'
                      : '#E5E7EB'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Default Price Setting */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 1
          }}>
            <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
              Default Price for {selectedPriceGroup.charAt(0).toUpperCase() + selectedPriceGroup.slice(1)}
            </Typography>
            <Button
              size="small"
              onClick={handleApplyDefaultPrice}
              sx={{ 
                fontSize: '12px',
                textTransform: 'none',
                color: '#2563EB',
                '&:hover': {
                  backgroundColor: 'rgba(37, 99, 235, 0.04)'
                }
              }}
            >
              Apply to All Branches
            </Button>
          </Box>
          <TextField
            fullWidth
            type="number"
            value={defaultPrices[selectedPriceGroup]}
            onChange={(e) => handleDefaultPriceChange(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                height: '40px',
                fontSize: '14px',
                backgroundColor: '#fff',
                '& fieldset': {
                  borderColor: '#E5E7EB',
                  borderRadius: '6px'
                }
              }
            }}
          />
        </Box>

        {/* Branch-specific Prices */}
        <Box>
          <Typography sx={{ fontSize: '13px', color: '#6B7280', mb: 1 }}>
            Branch-specific Prices
          </Typography>
          <Box sx={{ 
            maxHeight: '300px', 
            overflowY: 'auto',
            pr: 1,
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#F3F4F6',
              borderRadius: '2px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#CBD5E1',
              borderRadius: '2px'
            }
          }}>
            {formData.branchAvailability?.map((branchName) => {
              const branch = branches.find(b => b.name === branchName);
              if (!branch) return null;

              return (
                <Box
                  key={branch.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderBottom: '1px solid #E5E7EB',
                    '&:last-child': {
                      borderBottom: 'none'
                    }
                  }}
                >
                  <Box sx={{ minWidth: '150px' }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                      {branch.name}
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    type="number"
                    value={productPrices[selectedPriceGroup]?.byBranch[branch.id] || ''}
                    onChange={(e) => handleBranchPriceChange(branch.id, e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                        fontSize: '13px',
                        backgroundColor: '#fff',
                        '& fieldset': {
                          borderColor: '#E5E7EB',
                          borderRadius: '6px'
                        }
                      }
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    );
  };

  // Add these handler functions
  const handleDefaultPriceChange = (value) => {
    setDefaultPrices(prev => ({
      ...prev,
      [selectedPriceGroup]: value
    }));
  };

  const handleBranchPriceChange = (branchId, value) => {
    setProductPrices(prev => ({
      ...prev,
      [selectedPriceGroup]: {
        ...prev[selectedPriceGroup],
        byBranch: {
          ...prev[selectedPriceGroup]?.byBranch,
          [branchId]: value
        }
      }
    }));
  };

  // Update the handleEditProduct function to work with formData
  const handleEditProduct = async (productId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.products}/${productId}`, getAuthHeader());
      if (response.data.success) {
        const productData = response.data.data;
        
        // Set form data
        setFormData({
          id: productData.id,
          name: productData.name,
          description: productData.description || '',
          productType: productData.product_type,
          category: productData.category_name,
          pricingUnit: productData.unit_name,
          barcode: productData.barcode || '',
          image: productData.image || '',
          initialStock: productData.stock_quantity?.toString() || '0',
          alertQuantity: productData.alert_quantity?.toString() || '0',
          purchase_price: productData.purchase_price?.toString() || '0',
          status: productData.status || 'Active',
          branchAvailability: productData.branch_products?.map(bp => bp.branch_name) || []
        });

        // Set branch prices
        const newProductPrices = {};
        
        // Initialize price types from the priceTypes state
        priceTypes.forEach(pt => {
          newProductPrices[pt.name.toLowerCase()] = { all: 0, byBranch: {} };
        });

        // Process branch prices
        Object.entries(productData.branch_prices || {}).forEach(([branchId, prices]) => {
          prices.forEach(price => {
            // Find price type name from ID
            const priceType = priceTypes.find(pt => pt.id === price.price_type_id);
            if (priceType) {
              const priceTypeName = priceType.name.toLowerCase();
              if (newProductPrices[priceTypeName]) {
                newProductPrices[priceTypeName].byBranch[branchId] = price.price;
              }
            }
          });
        });

        setProductPrices(newProductPrices);

        // Set selected branches
        const selectedBranchIds = productData.branch_products?.map(bp => bp.branch_id) || [];
        setSelectedBranches(selectedBranchIds);

        // Open dialog
        setOpenDialog(true);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error fetching product details',
        severity: 'error'
      });
    }
  };

  // In your form fields, use formData and setFormData
  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
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
              onChange={handleInputChange('name')}
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

            {/* Purchase Price - Moved here */}
            <TextField
              name="purchase_price"
              placeholder="Purchase Price"
              type="number"
              value={formData.purchase_price}
              onChange={handleInputChange('purchase_price')}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ 
                      color: '#6B7280', 
                      fontSize: '13px',
                      pr: 1,
                      borderRight: '1px solid #E5E7EB'
                    }}>
                      $
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

            {/* Category with Add Button */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl fullWidth>
                <Select
                  name="category"
                  value={formData.category || ''}
                  onChange={handleInputChange('category')}
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
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
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
                  onChange={handleInputChange('pricingUnit')}
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
                  renderValue={(value) => value || "Select Unit"}
                >
                  {!unitsLoading && units && Array.isArray(units) && units.map((unit) => (
                    <MenuItem key={unit.id} value={unit.name}>
                      {unit.name}
                    </MenuItem>
                  ))}
                  {unitsLoading && (
                    <MenuItem disabled>Loading units...</MenuItem>
                  )}
                  {!unitsLoading && (!units || !Array.isArray(units) || units.length === 0) && (
                    <MenuItem disabled>No units available</MenuItem>
                  )}
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
                  {branches
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
                  {branches
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
                  {branches.length === formData.branchAvailability?.length && (
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
                  onChange={handleInputChange('initialStock')}
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
                  onChange={handleInputChange('alertQuantity')}
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

            {/* Only show pricing section if branches are selected */}
            {formData.branchAvailability?.length > 0 && (
              <PricingSection />
            )}
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
      <CategoryDialog
        open={addCategoryDialog}
        onClose={() => setAddCategoryDialog(false)}
        categories={categories}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onAddCategory={handleAddCategory}
        setSnackbar={setSnackbar}
      />

      {/* Add Unit Dialog */}
      <UnitDialog
        open={addUnitDialog}
        onClose={() => setAddUnitDialog(false)}
        units={units}
        onAddUnit={handleAddUnit}
        onUpdateUnit={handleUpdateUnit}
        onDeleteUnit={handleDeleteUnit}
        setSnackbar={setSnackbar}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, product: null })}
        onConfirm={handleConfirmDelete}
        productName={deleteDialog.product?.name}
        category={deleteDialog.product?.category}
      />

      {/* Delete Confirmation Dialog for units */}
      <DeleteConfirmationDialog
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, unitId: null, unitName: '' })}
        onConfirm={confirmDeleteUnit}
        name={deleteConfirmation.unitName}
        type="unit"
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
