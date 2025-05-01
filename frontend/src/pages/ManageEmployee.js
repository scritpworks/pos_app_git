import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
  FormControlLabel,
  Switch
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Close as CloseIcon,
  Work as RoleIcon
} from '@mui/icons-material';
import MuiAlert from '@mui/material/Alert';
import DataTable from 'react-data-table-component';
import styled from 'styled-components';
import './PaymentAccounts.css'; // Reusing the same CSS for consistent styling
import { API_ENDPOINTS, getAuthHeader } from '../apiConfig/apiConfig';

// Alert component for notifications
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

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

const ManageEmployee = () => {
  const [employees, setEmployees] = useState([]);
  const [branchList, setBranchList] = useState([]);
  // Table states
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  // Employee edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  // Update the formData state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    branch: '',
    status: 'active',
    loginStatus: 'Regular User',
    hireDate: new Date().toISOString().split('T')[0]
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
 
  // Filter states
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const roles = ['System Administrator', 'Manager', 'Cashier', 'Inventory Clerk'];

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    return [...new Set(employees.map(employee => employee.role))];
  }, [employees]);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for sorting
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  
  // State for modals
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  
  // State for form validation
  const [formErrors, setFormErrors] = useState({});

  // Load employee data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    const decoded = jwtDecode(token);
    setUser(decoded);
    
    // Load employees after authentication
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          API_ENDPOINTS.employees,
          getAuthHeader()
        );
        
        const transformedData = response.data.map(emp => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          phone: emp.phone || '',
          role: emp.role,
          branch: emp.branch,
          status: emp.status ? 'active' : 'inactive',
          loginStatus: emp.loginStatus || 'Regular User',
          hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : null
        }));
        
        setEmployees(transformedData);
        console.log('Initial load of employees:', transformedData);
      } catch (error) {
        console.error('Error loading employees:', error);
        setSnackbar({
          open: true,
          message: 'Error loading employees',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []); // Empty dependency array means this runs once on mount

  // Table filtering and sorting
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      
      const searchMatch = searchTerm === '' || 
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.branch.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Role filter
      const roleMatch = roleFilter === 'all' || 
        employee.role === roleFilter;
      
      // Status filter
      const statusMatch = statusFilter === 'all' || 
        (statusFilter === 'active' && employee.status === 'active') ||
        (statusFilter === 'inactive' && employee.status === 'inactive');
      
      return searchMatch && roleMatch && statusMatch;
    });
  }, [employees, searchTerm, roleFilter, statusFilter]);

  // Handle sorting
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sort function for employees
  const sortedEmployees = React.useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      if (orderBy === 'name' || orderBy === 'email' || orderBy === 'role' || orderBy === 'branch') {
        const valueA = a[orderBy].toLowerCase();
        const valueB = b[orderBy].toLowerCase();
        return order === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      } else if (orderBy === 'hireDate') {
        return order === 'asc'
          ? new Date(a.hireDate) - new Date(b.hireDate)
          : new Date(b.hireDate) - new Date(a.hireDate);
      } else {
        return order === 'asc'
          ? a[orderBy] > b[orderBy] ? 1 : -1
          : a[orderBy] < b[orderBy] ? 1 : -1;
      }
    });
  }, [filteredEmployees, order, orderBy]);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Table handlers
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filter handlers
  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  // Modal handlers
  const handleOpenModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone || '',
        role: employee.role,
        branch: employee.branch,
        status: employee.status,
        loginStatus: employee.loginStatus,
        hireDate: employee.hireDate
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        branch: '',
        status: 'active',
        loginStatus: 'Regular User',
        hireDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
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
      status: e.target.checked ? 'active' : 'inactive',
    }));
  };

  // Add authentication state
  const [user, setUser] = useState(null);
  
  // Check authentication on component mount
  useEffect(() => {
    // const token = localStorage.getItem('token');
    // if (!token) {
    //   navigate('/login');
    //   return;
    // }

    fetchEmployees();
    fetchLoginStatuses(); // Add this line

    // try {
    //   const decoded = jwtDecode(token);
    //   setUser(decoded);
    //   // After authentication, fetch employees
      
    // } catch (error) {
    //   console.error('Auth error:', error);
    //   navigate('/login');
    // }
  }, [navigate]); // Keep the dependency array as is

  // Add new state for confirmation dialog
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);

  // Add new handlers
  const handleSubmitClick = () => {
    // Validate form data
    if (!formData.name || !formData.email || !formData.role || !formData.branch) {
      setSnackbar({
        open: true,
        message: 'Please fill all required fields',
        severity: 'error'
      });
      return;
    }
    // Open confirmation dialog
    setIsConfirmSubmitOpen(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsLoading(true);
      let response;

      const payload = {
        ...formData,
        status: formData.status === 'active' ? true : false
      };

      if (editingEmployee) {
        // Update existing employee
        response = await axios.put(
          `${API_ENDPOINTS.employees}/${editingEmployee.id}`,
          payload,
          getAuthHeader()
        );

        setSnackbar({
          open: true,
          message: 'Employee updated successfully',
          severity: 'success'
        });
      } else {
        // Create new employee
        response = await axios.post(
          API_ENDPOINTS.employees,
          payload,
          getAuthHeader()
        );

        setSnackbar({
          open: true,
          message: 'Employee created successfully',
          severity: 'success'
        });
      }

      // Close modals and refresh
      handleCloseModal();
      setIsConfirmSubmitOpen(false);
      fetchEmployees(); 
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error processing employee',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add fetchEmployees function
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        API_ENDPOINTS.employees,
        getAuthHeader()
      );
      
      // Transform the data to match your frontend format
      const transformedData = response.data.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone || '',
        role: emp.role,
        branch: emp.branch,
        status: emp.status ? 'active' : 'inactive',
        loginStatus: emp.loginStatus || 'Regular User',
        hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : null
      }));
      
      setEmployees(transformedData);
      console.log('Fetched employees:', transformedData); // Debug log
    } catch (error) {
      console.error('Error fetching employees:', error);
      setSnackbar({
        open: true,
        message: 'Error loading employees',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this with other state declarations at the top
  const [loginStatuses, setLoginStatuses] = useState([]);

  // Add this function to fetch login statuses
  const fetchLoginStatuses = async () => {
    try {
      const response = await axios.get(
        API_ENDPOINTS.loginStatus,
        getAuthHeader()
      );
      setLoginStatuses(response.data);
    } catch (error) {
      console.error('Error fetching login statuses:', error);
      setSnackbar({
        open: true,
        message: 'Error loading login statuses',
        severity: 'error'
      });
    }
  };

  // Add fetchLoginStatuses to your useEffect
  useEffect(() => {
    fetchEmployees();
    fetchLoginStatuses(); // Add this line
  }, []);

  // Add fetchBranches function
const fetchBranches = async () => {
  try {
    const response = await axios.get(
      API_ENDPOINTS.branches,
      getAuthHeader()
    );
    // Transform data to ensure we have proper structure
    const transformedData = response.data.map(branch => ({
      id: branch.id,
      name: branch.name,
      is_active: branch.is_active
    }));
    setBranchList(transformedData);
  } catch (error) {
    console.error('Error fetching branches:', error);
    setSnackbar({
      open: true,
      message: 'Error loading branches',
      severity: 'error'
    });
  }
};

const [roleList, setRoleList] = useState([]);
const fetchRoles = async () => {
  try {
    const response = await axios.get(
      API_ENDPOINTS.roles,
      getAuthHeader()
    );
    
    // Transform roles data to match the expected format
    const transformedRoles = response.data.map(role => ({
      id: role.id,
      name: role.name
    }));
    
    setRoleList(transformedRoles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    setSnackbar({
      open: true,
      message: 'Error loading roles',
      severity: 'error'
    });
  }
};
// Update the useEffect to include fetchBranches
useEffect(() => {
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchEmployees(),
        fetchLoginStatuses(),
        fetchBranches(),
        fetchRoles() // Add this line
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  loadInitialData();
}, []); // Empty dependency array means this runs once on mount

  // Delete handlers
  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setIsConfirmDeleteOpen(true);
  };
  const handleRoleChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      role: value,
      // Automatically set login status based on role
      loginStatus: value === 'System Administrator' ? 'System Admin' : 'Regular User'
    }));
  };

  
  const handleConfirmDelete = async () => {
    try {
      setIsLoading(true);
      
      // Send delete request to backend
      await axios.delete(
        `${API_ENDPOINTS.employees}/${employeeToDelete.id}`,
        getAuthHeader()
      );

      // After successful deletion
      setSnackbar({
        open: true,
        message: 'Employee deleted successfully',
        severity: 'success'
      });

      // Close the confirmation dialog
      setIsConfirmDeleteOpen(false);
      setEmployeeToDelete(null);

      // Refresh the employee list
      fetchEmployees();

    } catch (error) {
      console.error('Error deleting employee:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error deleting employee',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmDeleteOpen(false);
    setEmployeeToDelete(null);
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
      name: 'Employee Name',
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
      id: 2,
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
      id: 3,
      grow: 1,
    },
    {
      name: 'Role',
      cell: row => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1
        }}>
          <RoleIcon sx={{ color: 'rgb(100, 116, 139)', fontSize: 14, flexShrink: 0 }} />
          <Chip
            label={row.role}
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
      selector: row => row.role,
      id: 4,
      grow: 1,
    },
    {
      name: 'Branch',
      cell: row => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1
        }}>
          <BusinessIcon sx={{ color: 'rgb(100, 116, 139)', fontSize: 14, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.75rem' }}>
            {row.branch}
          </Typography>
        </Box>
      ),
      sortable: true,
      selector: row => row.branch,
      id: 5,
      grow: 1,
    },
    {
      name: 'Status',
      cell: row => (
        <Chip
          label={row.status === 'active' ? 'Active' : 'Inactive'}
          color={row.status === 'active' ? 'success' : 'default'}
          size="small"
          sx={{ 
            fontWeight: 500,
            backgroundColor: row.status === 'active' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(158, 158, 158, 0.1)',
            color: row.status === 'active' ? '#2ecc71' : '#9e9e9e',
            borderRadius: '4px',
            fontSize: '0.7rem',
            height: '20px'
          }}
        />
      ),
      sortable: true,
      selector: row => row.status,
      id: 6,
      grow: 0.5,
    },
    {
      name: 'Login Status',
      cell: row => (
        <Chip
          label={row.loginStatus || 'Regular User'}
          size="small"
          sx={{ 
            fontWeight: 500,
            backgroundColor: row.loginStatus === 'System Admin' 
              ? 'rgba(99, 102, 241, 0.1)' 
              : 'rgba(203, 213, 225, 0.1)',
            color: row.loginStatus === 'System Admin' 
              ? '#6366f1' 
              : '#64748b',
            borderRadius: '4px',
            fontSize: '0.7rem',
            height: '20px'
          }}
        />
      ),
      sortable: true,
      selector: row => row.loginStatus,
      id: 7,
      grow: 1,
    },
    {
      name: 'Hire Date',
      cell: row => (
        <Typography sx={{ fontSize: '0.75rem' }}>
          {new Date(row.hireDate).toLocaleDateString()}
        </Typography>
      ),
      sortable: true,
      selector: row => row.hireDate,
      id: 8,
      grow: 0.8,
    },
    {
      name: 'Actions',
      cell: row => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit Employee" arrow placement="top">
            <IconButton 
              size="small" 
              className="edit-button"
              onClick={() => handleOpenModal(row)}
              sx={{ padding: '2px' }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Employee" arrow placement="top">
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
      id: 9,
      sortable: false,
    },
  ];

  return (
    <Box className="roles-container">
      <Box className="roles-header">
        <Box>
          <Typography variant="h5" className="page-title">
            Employee Management
          </Typography>
          <Typography variant="body1" color="textSecondary" className="page-subtitle">
            Add and manage employees in your organization
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="add-role-button"
          onClick={() => handleOpenModal()}
          size="small"
        >
          ADD NEW EMPLOYEE
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
            placeholder="Search employees..."
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
            {/* Role Filter */}
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
                value={roleFilter}
                onChange={handleRoleFilterChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Role filter' }}
                renderValue={(selected) => {
                  if (selected === 'all') return 'All Roles';
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
                <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All Roles</MenuItem>
                {uniqueRoles.map((role) => (
                  <MenuItem key={role} value={role} sx={{ fontSize: '0.875rem' }}>
                    {role}
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
          progressPending={isLoading}
          progressComponent={
            <Box sx={{ py: 5, px: 2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'rgb(100, 116, 139)' }}>
                Loading employees...
              </Typography>
            </Box>
          }
          data={filteredEmployees}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 15, 20]}
          defaultSortFieldId={1} // Default sort by employee name (first column)
          defaultSortAsc={true}
          sortIcon={<span>▲</span>}
          persistTableHead
          noDataComponent={
            <Box sx={{ py: 5, px: 2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'rgb(100, 116, 139)' }}>
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                  ? 'No employees found matching your search criteria' 
                  : 'No employees available'}
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
              when: row => row.status === 'inactive',
              style: {
                backgroundColor: 'rgba(248, 250, 252, 0.4)',
                color: '#64748b',
              },
            },
          ]}
        />
      </Paper>

      {/* Employee Modal */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="xs"
        fullWidth
        scroll="paper"
        disablePortal={false}
        keepMounted={false}
        sx={{ 
          zIndex: 9999,
          '& .MuiDialog-paper': {
            borderRadius: '10px',
            maxWidth: '400px',
            margin: { xs: '16px', sm: '32px' },
            maxHeight: '90vh', // Set maximum height
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
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
        {/* Dialog Title */}
        <Box sx={{ 
          p: 2,
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 1,
          borderBottom: '1px solid #e2e8f0'
        }}>
          <Typography variant="h6" sx={{ 
            color: 'rgb(26, 32, 53)',
            fontSize: '1.25rem',
            fontWeight: 600
          }}>
            {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
          </Typography>
          <IconButton 
            onClick={handleCloseModal}
            size="small"
            sx={{ 
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'rgb(26, 32, 53)'
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Dialog Content */}
        <Box sx={{ 
          p: 2,
          overflowY: 'auto'
        }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)', fontSize: '0.8rem' }
              }}
              placeholder="Enter employee name"
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '6px',
                  fontSize: '0.8rem'
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
                sx: { color: 'rgb(100, 116, 139)', fontSize: '0.8rem' }
              }}
              placeholder="Enter email address"
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '6px',
                  fontSize: '0.8rem'
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
                sx: { color: 'rgb(100, 116, 139)', fontSize: '0.8rem' }
              }}
              placeholder="Enter phone number"
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '6px',
                  fontSize: '0.8rem'
                }
              }}
            />
            <FormControl fullWidth size="small">
              <Typography 
                component="label" 
                sx={{ 
                  fontSize: '0.8rem', 
                  color: 'rgb(100, 116, 139)',
                  mb: 0.5
                }}
              >
                Role
              </Typography>
              <Select
                name="role"
                value={formData.role}
                onChange={handleRoleChange}
                displayEmpty
                placeholder="Select role"
                sx={{ 
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.23)'
                  }
                }}
              >
                <MenuItem value="" disabled>Select role</MenuItem>
                {roleList.map(role => (
                  <MenuItem key={role.id} value={role.name} sx={{ fontSize: '0.8rem' }}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <Typography 
                component="label" 
                sx={{ 
                  fontSize: '0.8rem', 
                  color: 'rgb(100, 116, 139)',
                  mb: 0.5
                }}
              >
                Login Status
              </Typography>
              <Select
                name="loginStatus"
                value={formData.loginStatus}
                onChange={handleInputChange}
                displayEmpty
                sx={{ 
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: formData.loginStatus === 'System Admin' ? '#ef4444' : 'rgba(0, 0, 0, 0.23)',
                  }
                }}
              >
                {loginStatuses.map(status => (
                  <MenuItem 
                    key={status.id} 
                    value={status.name}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
              {formData.loginStatus === 'System Admin' && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#ef4444', 
                    mt: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontWeight: 500
                  }}
                >
                  ⚠️ Warning: This status grants full system access and permissions
                </Typography>
              )}
            </FormControl>
            <FormControl fullWidth size="small">
              <Typography 
                component="label" 
                sx={{ 
                  fontSize: '0.8rem', 
                  color: 'rgb(100, 116, 139)',
                  mb: 0.5
                }}
              >
                Branch
              </Typography>
              <Select
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                displayEmpty
                placeholder="Select branch"
                sx={{ 
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.23)'
                  }
                }}
              >
                <MenuItem value="" disabled>Select branch</MenuItem>
                {branchList
                  .filter(branch => Boolean(branch.is_active)) // Only show active branches
                  .map(branch => (
                    <MenuItem 
                      key={branch.id} 
                      value={branch.name}
                      sx={{ fontSize: '0.8rem' }}
                    >
                      {branch.name}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Hire Date"
              name="hireDate"
              type="date"
              value={formData.hireDate}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              InputLabelProps={{
                shrink: true,
                sx: { color: 'rgb(100, 116, 139)', fontSize: '0.8rem' }
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '6px',
                  fontSize: '0.8rem'
                }
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.status === 'active'}
                  onChange={handleSwitchChange}
                  color="success"
                  size="small"
                />
              }
              label={<Typography sx={{ fontSize: '0.8rem' }}>Employee Active</Typography>}
            />
          </Stack>
        </Box>

        {/* Dialog Actions */}
        <Box sx={{ 
          p: 2,
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'white',
          borderTop: '1px solid #e2e8f0',
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 1.5
        }}>
          <Button
            variant="outlined"
            onClick={handleCloseModal}
            size="small"
            sx={{
              color: 'rgb(26, 32, 53)',
              borderColor: 'rgb(26, 32, 53)',
              borderRadius: '6px',
              '&:hover': {
                borderColor: 'rgb(26, 32, 53)',
                backgroundColor: 'rgba(26, 32, 53, 0.04)'
              },
              px: 2,
              py: 0.75,
              textTransform: 'uppercase',
              fontWeight: 500,
              fontSize: '0.75rem',
              minWidth: '100px'
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitClick}
            size="small"
            sx={{
              bgcolor: 'rgb(26, 32, 53)',
              borderRadius: '6px',
              '&:hover': {
                bgcolor: 'rgb(26, 32, 53, 0.9)'
              },
              px: 2,
              py: 0.75,
              textTransform: 'uppercase',
              fontWeight: 500,
              fontSize: '0.75rem',
              minWidth: '100px'
            }}
          >
            {editingEmployee ? 'Update' : 'Add'}
          </Button>
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
            borderRadius: '10px',
            maxWidth: '350px',
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
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ 
            color: 'rgb(26, 32, 53)',
            fontWeight: 600,
            mb: 1.5,
            fontSize: '1.1rem'
          }}>
            Delete Employee
          </Typography>
          
          <Typography variant="body2" sx={{ 
            color: '#64748b', 
            mb: 2.5,
            fontSize: '0.85rem'
          }}>
            Are you sure you want to delete this employee? This action cannot be undone.
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 1.5
          }}>
            <Button
              variant="outlined"
              onClick={handleCancelDelete}
              size="small"
              sx={{
                color: 'rgb(26, 32, 53)',
                borderColor: 'rgb(26, 32, 53)',
                '&:hover': {
                  borderColor: 'rgb(26, 32, 53)',
                  backgroundColor: 'rgba(26, 32, 53, 0.04)'
                },
                px: 2,
                textTransform: 'uppercase',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmDelete}
              size="small"
              sx={{
                bgcolor: '#ef4444',
                '&:hover': {
                  bgcolor: '#dc2626'
                },
                px: 2,
                textTransform: 'uppercase',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            >
              Delete
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

      {/* Add the confirmation dialog inside the return statement */}
      <Dialog
        open={isConfirmSubmitOpen}
        onClose={() => setIsConfirmSubmitOpen(false)}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 9999 }}
      >
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Confirm {editingEmployee ? 'Update' : 'Add'} Employee
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2.5 }}>
            Are you sure you want to {editingEmployee ? 'update' : 'add'} this employee?
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => setIsConfirmSubmitOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmSubmit}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ManageEmployee;
