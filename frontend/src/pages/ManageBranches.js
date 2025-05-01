import React, { useState, useMemo, useEffect } from 'react';
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
  Place as PlaceIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import './PaymentAccounts.css'; // Reusing the same CSS for consistent styling
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

const ManageBranches = () => {
  // Update the initial branches state to an empty array
  const [branches, setBranches] = useState([]);

  // Table states
  const [searchTerm, setSearchTerm] = useState('');

  // Branch edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    manager: '',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Filter states
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add loading state
  const [isLoading, setIsLoading] = useState(true);

  // Fetch branches function
  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        API_ENDPOINTS.branches,
        getAuthHeader()
      );
      // Transform the data to convert is_active to boolean
      const transformedData = response.data.map(branch => ({
        ...branch,
        isActive: Boolean(branch.is_active) // Convert to boolean
      }));
      setBranches(transformedData);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error loading branches',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect to call fetchBranches on component mount
  useEffect(() => {
    fetchBranches();
  }, []); // Empty dependency array means this runs once on mount

  // Table filtering and sorting
  const filteredBranches = useMemo(() => {
    return branches.filter(branch => {
      // Text search filter
      const searchMatch = searchTerm === '' || 
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.manager.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Branch filter
      const branchMatch = branchFilter === 'all' || 
        (branchFilter === branch.id.toString());
      
      // Status filter
      const statusMatch = statusFilter === 'all' || 
        (statusFilter === 'active' && branch.isActive) ||
        (statusFilter === 'inactive' && !branch.isActive);
      
      return searchMatch && branchMatch && statusMatch;
    });
  }, [branches, searchTerm, branchFilter, statusFilter]);

  // Table handlers
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filter handlers
  const handleBranchFilterChange = (event) => {
    setBranchFilter(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setBranchFilter('all');
    setStatusFilter('all');
  };

  // Modal handlers
  const handleOpenModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        address: branch.address,
        phone: branch.phone || '',
        manager: branch.manager || '',
        isActive: Boolean(branch.is_active)
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        manager: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
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

  // Add new state for confirmation dialog
  const [isConfirmActionOpen, setIsConfirmActionOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'add' or 'update'

  // Update handleSubmit to show confirmation first
  const handleSubmitClick = () => {
    if (!formData.name || !formData.address) {
      setSnackbar({
        open: true,
        message: 'Name and address are required',
        severity: 'error'
      });
      return;
    }
    setActionType(editingBranch ? 'update' : 'add');
    setIsConfirmActionOpen(true);
  };

  // Add confirmation dialog component
  const ConfirmActionDialog = () => (
    <Dialog 
      open={isConfirmActionOpen} 
      onClose={() => setIsConfirmActionOpen(false)}
      maxWidth="xs"
      fullWidth
      sx={{ 
        zIndex: 9999,
        '& .MuiDialog-paper': {
          borderRadius: '12px',
          maxWidth: '400px',
          margin: { xs: '16px', sm: '32px' },
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ 
          color: 'rgb(26, 32, 53)',
          fontWeight: 600,
          mb: 2
        }}>
          {actionType === 'update' ? 'Update Branch' : 'Add Branch'}
        </Typography>
        
        <Typography variant="body1" sx={{ 
          color: '#64748b', 
          mb: 3 
        }}>
          Are you sure you want to {actionType === 'update' ? 'update' : 'add'} this branch?
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 2 
        }}>
          <Button
            variant="outlined"
            onClick={() => setIsConfirmActionOpen(false)}
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
            onClick={() => {
              handleSubmit();
              setIsConfirmActionOpen(false);
            }}
            sx={{
              bgcolor: 'rgb(26, 32, 53)',
              '&:hover': {
                bgcolor: 'rgba(26, 32, 53, 0.9)'
              },
              px: 3,
              textTransform: 'uppercase',
              fontWeight: 500
            }}
          >
            Confirm
          </Button>
        </Box>
      </Box>
    </Dialog>
  );

  // Update the modal submit button to use handleSubmitClick
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      if (editingBranch) {
        // Update existing branch
        await axios.put(
          `${API_ENDPOINTS.branches}/${editingBranch.id}`,
          formData,
          getAuthHeader()
        );

        setSnackbar({
          open: true,
          message: 'Branch updated successfully',
          severity: 'success'
        });
      } else {
        // Create new branch
        await axios.post(
          API_ENDPOINTS.branches,
          formData,
          getAuthHeader()
        );

        setSnackbar({
          open: true,
          message: 'Branch created successfully',
          severity: 'success'
        });
      }

      handleCloseModal();
      fetchBranches(); // Refresh the list after update/create
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error processing branch',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteClick = (branch) => {
    setBranchToDelete(branch);
    setIsConfirmDeleteOpen(true);
  };

  // Update handleConfirmDelete function
  const handleConfirmDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(
        `${API_ENDPOINTS.branches}/${branchToDelete.id}`,
        getAuthHeader()
      );

      setIsConfirmDeleteOpen(false);
      setBranchToDelete(null);
      setSnackbar({
        open: true,
        message: 'Branch deleted successfully',
        severity: 'success'
      });
      
      fetchBranches(); // Refresh the list after delete
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error deleting branch',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmDeleteOpen(false);
    setBranchToDelete(null);
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
      name: 'Branch Name',
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
              display: 'block',
              color: row.name === 'Main Store' ? '#2563eb' : 'inherit', // Special color for Main Store
            }}
          >
            {row.name}
            {row.name === 'Main Store' && (
              <Typography
                component="span"
                sx={{
                  ml: 1,
                  fontSize: '0.65rem',
                  color: '#2563eb',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600
                }}
              >
                DEFAULT
              </Typography>
            )}
          </Typography>
        </Tooltip>
      ),
      selector: row => row.name,
      sortable: true,
      id: 1,
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
          whiteSpace: 'nowrap'
        }}>
          <PlaceIcon sx={{ color: 'rgb(100, 116, 139)', fontSize: 14, flexShrink: 0 }} />
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
              {row.address}
            </Typography>
          </Tooltip>
        </Box>
      ),
      grow: 2,
      id: 2,
      sortable: true,
      selector: row => row.address,
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
      id: 3,
      grow: 1,
    },
    {
      name: 'Manager',
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
          <Tooltip title={row.manager} placement="top">
            <Typography
              component="span"
              sx={{
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {row.manager}
            </Typography>
          </Tooltip>
        </Box>
      ),
      sortable: true,
      selector: row => row.manager,
      id: 4,
      grow: 1,
    },
    {
      name: 'Status',
      cell: row => (
        <Chip
          label={Boolean(row.is_active) ? 'Active' : 'Inactive'}
          color={Boolean(row.is_active) ? 'success' : 'default'}
          size="small"
          sx={{ 
            fontWeight: 500,
            backgroundColor: Boolean(row.is_active) ? 'rgba(46, 204, 113, 0.1)' : 'rgba(158, 158, 158, 0.1)',
            color: Boolean(row.is_active) ? '#2ecc71' : '#9e9e9e',
            borderRadius: '4px',
            fontSize: '0.7rem',
            height: '20px'
          }}
        />
      ),
      sortable: true,
      selector: row => Boolean(row.is_active),
      id: 5,
      sortFunction: (a, b) => {
        if (Boolean(a.is_active) === Boolean(b.is_active)) return 0;
        return Boolean(a.is_active) ? -1 : 1;
      },
      grow: 0.5,
    },
    {
      name: 'Actions',
      cell: row => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit Branch" arrow placement="top">
            <IconButton 
              size="small" 
              className="edit-button"
              onClick={() => handleOpenModal(row)}
              sx={{ padding: '2px' }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          {row.name !== 'Main Store' && (
            <Tooltip title="Delete Branch" arrow placement="top">
              <IconButton 
                size="small" 
                className="delete-button"
                onClick={() => handleDeleteClick(row)}
                sx={{ padding: '2px' }}
              >
                <DeleteIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
      button: true,
      width: '80px',
      id: 6,
      sortable: false,
    },
  ];

  return (
    <Box className="roles-container">
      <Box className="roles-header">
        <Box>
          <Typography variant="h5" className="page-title">
            Manage Branches
          </Typography>
          <Typography variant="body1" color="textSecondary" className="page-subtitle">
            Add and manage your business locations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="add-role-button"
          onClick={() => handleOpenModal()}
          size="small"
        >
          ADD NEW BRANCH
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
            placeholder="Search branches..."
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
                onChange={handleBranchFilterChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Branch filter' }}
                renderValue={(selected) => {
                  if (selected === 'all') return 'All Branches';
                  const selectedBranch = branches.find(branch => branch.id.toString() === selected);
                  return selectedBranch ? selectedBranch.name : 'All Branches';
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
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id.toString()} sx={{ fontSize: '0.875rem' }}>
                    {branch.name}
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
          data={filteredBranches}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 15, 20]}
          defaultSortFieldId={1} // Default sort by branch name (first column)
          defaultSortAsc={true}
          sortIcon={<span>▲</span>}
          persistTableHead
          noDataComponent={
            <Box sx={{ py: 5, px: 2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'rgb(100, 116, 139)' }}>
                {searchTerm || branchFilter !== 'all' || statusFilter !== 'all' 
                  ? 'No branches found matching your search criteria' 
                  : 'No branches available'}
              </Typography>
            </Box>
          }
          progressPending={isLoading}
          progressComponent={
            <Box sx={{ py: 5, px: 2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'rgb(100, 116, 139)' }}>
                Loading branches...
              </Typography>
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

      {/* Branch Modal */}
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
              {editingBranch ? 'Edit Branch' : 'Add New Branch'}
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
              label="Branch Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)' }
              }}
              placeholder="Enter branch name"
              disabled={editingBranch?.name === 'Main Store'}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
            />
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)' }
              }}
              placeholder="Enter full address"
              multiline
              rows={2}
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
              label="Branch Manager"
              name="manager"
              value={formData.manager}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)' }
              }}
              placeholder="Enter manager name"
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
              label="Branch Active"
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
              onClick={handleSubmitClick}
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
              {editingBranch ? 'Update Branch' : 'Add Branch'}
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
            Delete Branch
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: '#64748b', 
            mb: 3 
          }}>
            Are you sure you want to delete this branch? This action cannot be undone.
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
              Delete Branch
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

      {/* Add the ConfirmActionDialog to your return statement */}
      <ConfirmActionDialog />
    </Box>
  );
};

export default ManageBranches;
