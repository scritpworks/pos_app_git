import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Dialog,
  TextField,
  Stack,
  FormControlLabel,
  Switch,
  Tooltip,
  Alert,
  Snackbar,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  Chip,
} from '@mui/material';
import DataTable from 'react-data-table-component';
import styled from 'styled-components';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  BusinessCenter as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import './PaymentAccounts.css'; // Reusing the same CSS for consistent styling

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
    padding: 6px 12px;
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

const ManageSuppliers = () => {
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      name: 'Global Electronics Inc.',
      contact: 'John Thompson',
      email: 'john.thompson@globalelectronics.com',
      phone: '+1 (212) 555-7890',
      category: 'Electronics',
      isActive: true,
    },
    {
      id: 2,
      name: 'Fresh Foods Distributors',
      contact: 'Sarah Miller',
      email: 'sarah.miller@freshfoods.com',
      phone: '+1 (415) 555-3421',
      category: 'Food & Beverage',
      isActive: true,
    },
    {
      id: 3,
      name: 'Office Supplies Co.',
      contact: 'Michael Davis',
      email: 'mdavis@officesupplies.com',
      phone: '+1 (312) 555-6543',
      category: 'Office Supplies',
      isActive: false,
    },
    {
      id: 4,
      name: 'Fashion Forward Apparel',
      contact: 'Jennifer Wilson',
      email: 'jwilson@fashionforward.com',
      phone: '+1 (617) 555-9876',
      category: 'Clothing',
      isActive: true,
    },
    {
      id: 5,
      name: 'Tech Hardware Solutions',
      contact: 'Robert Chen',
      email: 'rchen@techhardware.com',
      phone: '+1 (305) 555-2468',
      category: 'Hardware',
      isActive: true,
    },
    {
      id: 6,
      name: 'Global Furniture Inc.',
      contact: 'Lisa Adams',
      email: 'ladams@globalfurniture.com',
      phone: '+1 (206) 555-1357',
      category: 'Furniture',
      isActive: true,
    },
    {
      id: 7,
      name: 'Medical Supplies Corp',
      contact: 'Daniel Johnson',
      email: 'djohnson@medicalsupplies.com',
      phone: '+1 (404) 555-8642',
      category: 'Medical',
      isActive: true,
    },
    {
      id: 8,
      name: 'Organic Foods Ltd.',
      contact: 'Emily Parker',
      email: 'eparker@organicfoods.com',
      phone: '+1 (303) 555-9753',
      category: 'Food & Beverage',
      isActive: false,
    },
    {
      id: 9,
      name: 'Smart Tech Innovations',
      contact: 'William Brown',
      email: 'wbrown@smarttech.com',
      phone: '+1 (503) 555-3579',
      category: 'Electronics',
      isActive: true,
    },
    {
      id: 10,
      name: 'Industrial Equipment Co.',
      contact: 'Olivia Martinez',
      email: 'omartinez@industrialequip.com',
      phone: '+1 (312) 555-2468',
      category: 'Industrial',
      isActive: true,
    },
    {
      id: 11,
      name: 'Luxury Goods Imports',
      contact: 'James Lee',
      email: 'jlee@luxuryimports.com',
      phone: '+1 (214) 555-1234',
      category: 'Luxury Goods',
      isActive: false,
    },
    {
      id: 12,
      name: 'Digital Solutions Inc.',
      contact: 'Sophia Garcia',
      email: 'sgarcia@digitalsolutions.com',
      phone: '+1 (212) 555-5678',
      category: 'Software',
      isActive: true,
    },
    {
      id: 13,
      name: 'Green Energy Products',
      contact: 'Alexander Wright',
      email: 'awright@greenenergy.com',
      phone: '+1 (512) 555-9012',
      category: 'Energy',
      isActive: true,
    },
    {
      id: 14,
      name: 'Healthy Living Brands',
      contact: 'Isabella Taylor',
      email: 'itaylor@healthyliving.com',
      phone: '+1 (602) 555-3456',
      category: 'Health & Wellness',
      isActive: true,
    },
    {
      id: 15,
      name: 'Construction Materials Ltd.',
      contact: 'Matthew Robinson',
      email: 'mrobinson@constructionmaterials.com',
      phone: '+1 (213) 555-7890',
      category: 'Construction',
      isActive: false,
    }
  ]);

  // Table states
  const [searchTerm, setSearchTerm] = useState('');

  // Supplier edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    category: '',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    return [...new Set(suppliers.map(supplier => supplier.category))];
  }, [suppliers]);

  // Table filtering and sorting
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      // Text search filter
      const searchMatch = searchTerm === '' || 
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const categoryMatch = categoryFilter === 'all' || 
        supplier.category === categoryFilter;
      
      // Status filter
      const statusMatch = statusFilter === 'all' || 
        (statusFilter === 'active' && supplier.isActive) ||
        (statusFilter === 'inactive' && !supplier.isActive);
      
      return searchMatch && categoryMatch && statusMatch;
    });
  }, [suppliers, searchTerm, categoryFilter, statusFilter]);

  // Table handlers
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filter handlers
  const handleCategoryFilterChange = (event) => {
    setCategoryFilter(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  // Modal handlers
  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact: supplier.contact,
        email: supplier.email,
        phone: supplier.phone,
        category: supplier.category,
        isActive: supplier.isActive,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contact: '',
        email: '',
        phone: '',
        category: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      isActive: e.target.checked,
    }));
  };

  const handleSubmit = () => {
    if (editingSupplier) {
      setSuppliers((prev) =>
        prev.map((supplier) =>
          supplier.id === editingSupplier.id
            ? {
                ...supplier,
                ...formData,
              }
            : supplier
        )
      );
      setSnackbar({
        open: true,
        message: 'Supplier updated successfully',
        severity: 'success'
      });
    } else {
      const newSupplier = {
        id: suppliers.length + 1,
        ...formData,
      };
      setSuppliers((prev) => [...prev, newSupplier]);
      setSnackbar({
        open: true,
        message: 'New supplier added successfully',
        severity: 'success'
      });
    }
    handleCloseModal();
  };

  // Delete handlers
  const handleDeleteClick = (supplier) => {
    setSupplierToDelete(supplier);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    setSuppliers(suppliers.filter(supplier => supplier.id !== supplierToDelete.id));
    setIsConfirmDeleteOpen(false);
    setSupplierToDelete(null);
    setSnackbar({
      open: true,
      message: 'Supplier deleted successfully',
      severity: 'success'
    });
  };

  const handleCancelDelete = () => {
    setIsConfirmDeleteOpen(false);
    setSupplierToDelete(null);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // DataTable columns configuration
  const columns = [
    {
      name: 'Supplier Name',
      cell: row => (
        <Tooltip title={row.name} placement="top">
          <Typography
            component="span"
            sx={{
              fontWeight: 500,
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '150px',
              display: 'block'
            }}
          >
            {row.name}
          </Typography>
        </Tooltip>
      ),
      selector: row => row.name,
      sortable: true,
      id: 1,
      grow: 1.5,
    },
    {
      name: 'Contact Person',
      cell: row => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          maxWidth: '150px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          <PersonIcon sx={{ color: 'rgb(100, 116, 139)', fontSize: 14, flexShrink: 0 }} />
          <Tooltip title={row.contact} placement="top">
            <Typography
              component="span"
              sx={{
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {row.contact}
            </Typography>
          </Tooltip>
        </Box>
      ),
      sortable: true,
      selector: row => row.contact,
      id: 2,
      grow: 1,
    },
    {
      name: 'Email',
      cell: row => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          maxWidth: '180px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          <EmailIcon sx={{ color: 'rgb(100, 116, 139)', fontSize: 14, flexShrink: 0 }} />
          <Tooltip title={row.email} placement="top">
            <Typography
              component="span"
              sx={{
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {row.email}
            </Typography>
          </Tooltip>
        </Box>
      ),
      sortable: true,
      selector: row => row.email,
      id: 3,
      grow: 1.5,
    },
    {
      name: 'Phone',
      cell: row => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1
        }}>
          <PhoneIcon sx={{ color: 'rgb(100, 116, 139)', fontSize: 14, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.75rem' }}>
            {row.phone}
          </Typography>
        </Box>
      ),
      sortable: true,
      selector: row => row.phone,
      id: 4,
      grow: 1,
    },
    {
      name: 'Category',
      cell: row => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1
        }}>
          <BusinessIcon sx={{ color: 'rgb(100, 116, 139)', fontSize: 14, flexShrink: 0 }} />
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
      sortable: true,
      selector: row => row.category,
      id: 5,
      grow: 1,
    },
    {
      name: 'Status',
      cell: row => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          color={row.isActive ? 'success' : 'default'}
          size="small"
          sx={{ 
            fontWeight: 500,
            backgroundColor: row.isActive ? 'rgba(46, 204, 113, 0.1)' : 'rgba(158, 158, 158, 0.1)',
            color: row.isActive ? '#2ecc71' : '#9e9e9e',
            borderRadius: '4px',
            fontSize: '0.7rem',
            height: '20px'
          }}
        />
      ),
      sortable: true,
      selector: row => row.isActive,
      id: 6,
      sortFunction: (a, b) => {
        // Custom sort for boolean values
        if (a.isActive === b.isActive) return 0;
        return a.isActive ? 1 : -1;
      },
      grow: 0.5,
    },
    {
      name: 'Actions',
      cell: row => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit Supplier" arrow placement="top">
            <IconButton 
              size="small" 
              className="edit-button"
              onClick={() => handleOpenModal(row)}
              sx={{ padding: '2px' }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Supplier" arrow placement="top">
            <IconButton 
              size="small" 
              className="delete-button"
              onClick={() => handleDeleteClick(row)}
              sx={{ padding: '2px' }}
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      button: true,
      width: '80px',
      id: 7,
      sortable: false,
    },
  ];

  return (
    <Box className="roles-container">
      <Box className="roles-header">
        <Box>
          <Typography variant="h5" className="page-title">
            Manage Suppliers
          </Typography>
          <Typography variant="body1" color="textSecondary" className="page-subtitle">
            Add and manage your supply chain partners
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="add-role-button"
          onClick={() => handleOpenModal()}
          size="small"
        >
          ADD NEW SUPPLIER
        </Button>
      </Box>

      {/* Filter Controls */}
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
            placeholder="Search suppliers..."
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
                onChange={handleCategoryFilterChange}
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
                {categories.map((category) => (
                  <MenuItem key={category} value={category} sx={{ fontSize: '0.875rem' }}>
                    {category}
                  </MenuItem>
                ))}
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
                onChange={handleStatusFilterChange}
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
                <MenuItem value="active" sx={{ fontSize: '0.875rem' }}>Active</MenuItem>
                <MenuItem value="inactive" sx={{ fontSize: '0.875rem' }}>Inactive</MenuItem>
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

      {/* Data Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <StyledDataTable
          columns={columns}
          data={filteredSuppliers}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 15, 20]}
          defaultSortFieldId={1} // Default sort by supplier name (first column)
          defaultSortAsc={true}
          sortIcon={<span>▲</span>}
          persistTableHead
          noDataComponent={
            <Box sx={{ py: 5, px: 2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'rgb(100, 116, 139)' }}>
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                  ? 'No suppliers found matching your search criteria' 
                  : 'No suppliers available'}
              </Typography>
            </Box>
          }
          progressPending={false}
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

      {/* Supplier Modal */}
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
            maxWidth: '500px',
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
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
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
              label="Supplier Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)' }
              }}
              placeholder="Enter supplier name"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            <TextField
              fullWidth
              label="Contact Person"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)' }
              }}
              placeholder="Enter contact person name"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)' }
              }}
              placeholder="Enter email address"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)' }
              }}
              placeholder="Enter phone number"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            <TextField
              fullWidth
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)' }
              }}
              placeholder="Enter supplier category"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleSwitchChange}
                  color="success"
                />
              }
              label="Supplier Active"
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
              {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
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
            Delete Supplier
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: '#64748b', 
            mb: 3 
          }}>
            Are you sure you want to delete this supplier? This action cannot be undone.
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
              Delete Supplier
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

export default ManageSuppliers;
