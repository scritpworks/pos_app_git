import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS, getAuthHeader } from '../apiConfig/apiConfig';
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
  const [suppliers, setSuppliers] = useState([]);

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
    address: '',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');

  // Table filtering and sorting
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      // Text search filter
      const searchMatch = searchTerm === '' || 
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const statusMatch = statusFilter === 'all' || 
        (statusFilter === 'active' && supplier.isActive) ||
        (statusFilter === 'inactive' && !supplier.isActive);
      
      return searchMatch && statusMatch;
    });
  }, [suppliers, searchTerm, statusFilter]);

  // Table handlers
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filter handlers
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
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
        address: supplier.address || '',
        isActive: supplier.isActive,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contact: '',
        email: '',
        phone: '',
        address: '',
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

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.contact) {
        setSnackbar({
          open: true,
          message: 'Supplier name and contact person are required',
          severity: 'error'
        });
        return;
      }

      if (editingSupplier) {
        const response = await axios.put(
          API_ENDPOINTS.supplierById(editingSupplier.id),
          formData,
          getAuthHeader()
        );
        if (response.data.success) {
          setSnackbar({
            open: true,
            message: 'Supplier updated successfully',
            severity: 'success'
          });
          fetchSuppliers();
        }
      } else {
        const response = await axios.post(
          API_ENDPOINTS.suppliers,
          formData,
          getAuthHeader()
        );
        if (response.data.success) {
          setSnackbar({
            open: true,
            message: 'New supplier added successfully',
            severity: 'success'
          });
          fetchSuppliers();
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error managing supplier:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error managing supplier',
        severity: 'error'
      });
    }
  };

  // Delete handlers
  const handleDeleteClick = (supplier) => {
    setSupplierToDelete(supplier);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await axios.delete(
        API_ENDPOINTS.supplierById(supplierToDelete.id),
        getAuthHeader()
      );
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Supplier deleted successfully',
          severity: 'success'
        });
        fetchSuppliers();
      }
      setIsConfirmDeleteOpen(false);
      setSupplierToDelete(null);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error deleting supplier',
        severity: 'error'
      });
    }
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

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.suppliers, getAuthHeader());
      if (response.data.success) {
        setSuppliers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching suppliers',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

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
      name: 'Address',
      cell: row => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          maxWidth: '200px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          <ShippingIcon sx={{ color: 'rgb(100, 116, 139)', fontSize: 14, flexShrink: 0 }} />
          <Tooltip title={row.address} placement="top">
            <Typography
              component="span"
              sx={{
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {row.address || 'N/A'}
            </Typography>
          </Tooltip>
        </Box>
      ),
      sortable: true,
      selector: row => row.address,
      grow: 1.5,
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
                {searchTerm || statusFilter !== 'all' 
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
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3
          }}>
            <Typography variant="h5">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </Typography>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Supplier Name *"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              variant="outlined"
              required
              error={!formData.name}
              helperText={!formData.name ? 'Supplier name is required' : ''}
            />
            <TextField
              fullWidth
              label="Contact Person *"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              variant="outlined"
              required
              error={!formData.contact}
              helperText={!formData.contact ? 'Contact person is required' : ''}
            />
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              variant="outlined"
              multiline
              rows={2}
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
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
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
