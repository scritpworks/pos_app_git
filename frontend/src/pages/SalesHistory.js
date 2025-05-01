import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  InputAdornment,
  Chip,
  TextField,
  Badge,
  Switch,
  FormControlLabel
} from '@mui/material';
import DataTable from 'react-data-table-component';
import styled from 'styled-components';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import './SalesHistory.css';

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

// Add a spinning refresh icon animation
const SpinningRefreshIcon = styled(RefreshIcon)`
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  animation: ${props => props.spinning ? 'spin 1s linear' : 'none'};
`;

const SalesHistory = () => {
  // State management
  const [sales, setSales] = useState([
    {
      id: 1,
      invoiceNumber: 'INV-001',
      date: '2023-06-15',
      customer: 'John Doe',
      items: 5,
      total: 125.50,
      paymentMethod: 'Cash',
      status: 'Completed'
    },
    {
      id: 2,
      invoiceNumber: 'INV-002',
      date: '2023-06-16',
      customer: 'Jane Smith',
      items: 3,
      total: 78.25,
      paymentMethod: 'Credit Card',
      status: 'Completed'
    },
    {
      id: 3,
      invoiceNumber: 'INV-003',
      date: '2023-06-17',
      customer: 'Robert Johnson',
      items: 8,
      total: 230.75,
      paymentMethod: 'Mobile Money',
      status: 'Completed'
    },
    {
      id: 4,
      invoiceNumber: 'INV-004',
      date: '2023-06-18',
      customer: 'Alice Brown',
      items: 2,
      total: 45.00,
      paymentMethod: 'Cash',
      status: 'Refunded'
    },
    {
      id: 5,
      invoiceNumber: 'INV-005',
      date: '2023-06-19',
      customer: 'Michael Wilson',
      items: 6,
      total: 156.80,
      paymentMethod: 'Credit Card',
      status: 'Completed'
    },
    {
      id: 6,
      invoiceNumber: 'INV-006',
      date: '2023-06-20',
      customer: 'Emily Davis',
      items: 4,
      total: 95.20,
      paymentMethod: 'Mobile Money',
      status: 'Pending'
    },
    {
      id: 7,
      invoiceNumber: 'INV-007',
      date: '2023-06-21',
      customer: 'David Martinez',
      items: 7,
      total: 180.45,
      paymentMethod: 'Credit Card',
      status: 'Completed'
    },
    {
      id: 8,
      invoiceNumber: 'INV-008',
      date: '2023-06-22',
      customer: 'Sarah Thompson',
      items: 2,
      total: 35.99,
      paymentMethod: 'Cash',
      status: 'Refunded'
    },
    {
      id: 9,
      invoiceNumber: 'INV-009',
      date: '2023-06-23',
      customer: 'James Wilson',
      items: 5,
      total: 150.75,
      paymentMethod: 'Mobile Money',
      status: 'Completed'
    },
    {
      id: 10,
      invoiceNumber: 'INV-010',
      date: '2023-06-24',
      customer: 'Jessica Anderson',
      items: 3,
      total: 67.50,
      paymentMethod: 'Credit Card',
      status: 'Pending'
    }
  ]);

  // Table states
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewSaleDialog, setViewSaleDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Add refresh-related state
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [nextRefreshIn, setNextRefreshIn] = useState(30); // seconds until next refresh
  const autoRefreshInterval = useRef(null);
  const countdownInterval = useRef(null);

  // Table filtering
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Text search filter
      const searchMatch = searchTerm === '' || 
        sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date filter
      let dateMatch = true;
      if (dateFilter === 'range' && (startDate || endDate)) {
        const saleDate = new Date(sale.date);
        saleDate.setHours(0, 0, 0, 0); // Reset time part for comparison
        
        if (startDate && endDate) {
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);
          startDateObj.setHours(0, 0, 0, 0);
          endDateObj.setHours(23, 59, 59, 999);
          
          dateMatch = saleDate >= startDateObj && saleDate <= endDateObj;
        } else if (startDate) {
          const startDateObj = new Date(startDate);
          startDateObj.setHours(0, 0, 0, 0);
          dateMatch = saleDate >= startDateObj;
        } else if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          dateMatch = saleDate <= endDateObj;
        }
      } else {
        dateMatch = dateFilter === 'all' || 
          (dateFilter === 'today' && new Date(sale.date).toDateString() === new Date().toDateString()) ||
          (dateFilter === 'yesterday' && new Date(sale.date).toDateString() === new Date(Date.now() - 86400000).toDateString()) ||
          (dateFilter === 'thisWeek' && isDateInThisWeek(new Date(sale.date)));
      }
      
      // Payment method filter
      const matchesPaymentMethod = paymentMethodFilter === 'all' || 
        sale.paymentMethod === paymentMethodFilter;
      
      return searchMatch && dateMatch && matchesPaymentMethod;
    });
  }, [sales, searchTerm, dateFilter, startDate, endDate, paymentMethodFilter]);
  
  // Helper function to check if a date is in the current week
  const isDateInThisWeek = (date) => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(now.setDate(now.getDate() + 6));
    weekEnd.setHours(23, 59, 59, 999);
    return date >= weekStart && date <= weekEnd;
  };
  
  // Table handlers
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filter handlers
  const handleDateFilterChange = (event) => {
    const value = event.target.value;
    setDateFilter(value);
    if (value !== 'range') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handlePaymentMethodFilterChange = (event) => {
    setPaymentMethodFilter(event.target.value);
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
    // Automatically switch to range filter mode
    if (dateFilter !== 'range') {
      setDateFilter('range');
    }
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
    // Automatically switch to range filter mode
    if (dateFilter !== 'range') {
      setDateFilter('range');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setPaymentMethodFilter('all');
    setStartDate('');
    setEndDate('');
  };
  
  // Dialog handlers
  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setViewSaleDialog(true);
  };
  
  const handleCloseDialog = () => {
    setViewSaleDialog(false);
  };
  
  // Print receipt handler
  const handlePrintReceipt = () => {
    setSnackbar({
      open: true,
      message: 'Receipt sent to printer',
      severity: 'success'
    });
  };

  // Snackbar close handler
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };
  
  // DataTable columns configuration
  const columns = [
    {
      name: 'Invoice #',
      cell: row => (
        <Tooltip title={row.invoiceNumber} placement="top">
          <Typography
            component="span"
            sx={{
              fontWeight: 500,
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100px',
              display: 'block'
            }}
          >
            {row.invoiceNumber}
          </Typography>
        </Tooltip>
      ),
      selector: row => row.invoiceNumber,
      sortable: true,
      id: 1,
      width: '12%',
    },
    {
      name: 'Date',
      cell: row => (
        <Typography sx={{ fontSize: '0.75rem' }}>
          {new Date(row.date).toLocaleDateString()}
        </Typography>
      ),
      selector: row => row.date,
      sortable: true,
      id: 2,
      width: '12%',
    },
    {
      name: 'Customer',
      cell: row => (
        <Tooltip title={row.customer} placement="top">
          <Typography
            component="span"
            sx={{
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '150px',
              display: 'block'
            }}
          >
            {row.customer}
          </Typography>
        </Tooltip>
      ),
      selector: row => row.customer,
      sortable: true,
      id: 3,
      width: '17%',
    },
    {
      name: 'Items',
      cell: row => (
        <Typography sx={{ fontSize: '0.75rem', textAlign: 'center', width: '100%' }}>
          {row.items}
        </Typography>
      ),
      selector: row => row.items,
      sortable: true,
      id: 4,
      width: '9%',
      center: true,
    },
    {
      name: 'Total',
      cell: row => (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
          ${row.total.toFixed(2)}
        </Typography>
      ),
      selector: row => row.total,
      sortable: true,
      id: 5,
      width: '12%',
    },
    {
      name: 'Payment Method',
      cell: row => (
        <Typography sx={{ fontSize: '0.75rem' }}>
          {row.paymentMethod}
        </Typography>
      ),
      selector: row => row.paymentMethod,
      sortable: true,
      id: 6,
      width: '16%',
    },
    {
      name: 'Status',
      cell: row => (
        <Chip
          label={row.status}
          size="small"
          sx={{ 
            fontWeight: 500,
            backgroundColor: 
              row.status === 'Completed' ? 'rgba(46, 204, 113, 0.1)' : 
              row.status === 'Refunded' ? 'rgba(235, 87, 87, 0.1)' : 
              'rgba(246, 194, 62, 0.1)',
            color: 
              row.status === 'Completed' ? '#2ecc71' : 
              row.status === 'Refunded' ? '#eb5757' : 
              '#f6c23e',
            borderRadius: '4px',
            fontSize: '0.7rem',
            height: '20px'
          }}
        />
      ),
      selector: row => row.status,
      sortable: true,
      id: 7,
      width: '12%',
    },
    {
      name: 'Actions',
      cell: row => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details" arrow placement="top">
            <IconButton 
              size="small" 
              onClick={() => handleViewSale(row)}
              sx={{ padding: '2px' }}
            >
              <VisibilityIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Receipt" arrow placement="top">
            <IconButton 
              size="small"
              onClick={handlePrintReceipt}
              sx={{ padding: '2px' }}
            >
              <PrintIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      button: true,
      width: '10%',
      id: 8,
    },
  ];
  
  // Custom styles for DataTable
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f5f5f5',
        fontSize: '0.875rem',
        fontWeight: 'bold',
        color: '#333'
      },
    },
    rows: {
      style: {
        minHeight: '60px',
        fontSize: '0.875rem',
        '&:nth-of-type(odd)': {
          backgroundColor: '#fafafa',
        },
        '&:hover': {
          backgroundColor: '#f5f5f5',
          cursor: 'pointer',
        },
      },
    },
    pagination: {
      style: {
        fontSize: '0.875rem',
        minHeight: '56px',
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: '#eeeeee',
      },
      pageButtonsStyle: {
        color: '#0066cc',
        fill: '#0066cc',
        '&:disabled': {
          color: '#999999',
          fill: '#999999',
        },
      },
    },
  };

  // Auto-refresh setup
  useEffect(() => {
    // Set up auto-refresh timer
    if (autoRefresh) {
      // Reset countdown
      setNextRefreshIn(30);
      
      // Set up countdown timer
      countdownInterval.current = setInterval(() => {
        setNextRefreshIn(prevTime => {
          if (prevTime <= 1) {
            return 30; // Reset to 30 when it reaches 0
          }
          return prevTime - 1;
        });
      }, 1000);
      
      // Set up auto-refresh
      autoRefreshInterval.current = setInterval(() => {
        refreshData();
      }, 30000); // 30 seconds
    } else {
      // Clear countdown interval
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    }
    
    // Clean up intervals on component unmount
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [autoRefresh]);

  // Manual refresh function
  const refreshData = () => {
    setRefreshing(true);
    setLoading(true);
    setNextRefreshIn(30); // Reset countdown
    
    // In a real app, this is where you would fetch fresh sales data from your API
    // Simulating a data refresh with a timeout
    setTimeout(() => {
      // For demo, just setting the same data again
      // In a real app, this would be the result of an API call
      setLoading(false);
      setRefreshing(false);
      setLastRefresh(new Date());
      
      // Show a notification to the user
      setSnackbar({
        open: true,
        message: 'Sales data refreshed successfully',
        severity: 'success'
      });
    }, 1000);
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      // Turn off auto-refresh
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    } else {
      // Turn on auto-refresh and refresh immediately
      refreshData();
    }
    setAutoRefresh(!autoRefresh);
  };

  // Format the last refresh time
  const formatLastRefresh = () => {
    const now = new Date();
    const diff = Math.floor((now - lastRefresh) / 1000); // difference in seconds
    
    if (diff < 60) {
      return `${diff} second${diff !== 1 ? 's' : ''} ago`;
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return lastRefresh.toLocaleTimeString();
    }
  };

  return (
    <Box className="roles-container">
      <Box className="roles-header">
        <Box>
          <Typography variant="h5" className="page-title">
            Sales History
          </Typography>
          <Typography variant="body1" color="textSecondary" className="page-subtitle">
            View and manage your sales transactions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          className="add-role-button"
          onClick={handlePrintReceipt}
          size="small"
        >
          PRINT REPORT
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
        {/* All filters in one row on large screens */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: { xs: 2, lg: 2 },
          alignItems: { xs: 'stretch', lg: 'center' }
        }}>
          {/* Search Field */}
          <FormControl
            variant="outlined"
            size="small"
            sx={{
              width: { xs: '100%', lg: '280px' },
              flexShrink: 0
            }}
          >
            <Box
              component="div"
              sx={{
                position: 'relative',
                width: '100%',
              }}
            >
              <Box
                component="input"
                placeholder="Search invoice or customer..."
                value={searchTerm}
                onChange={handleSearchChange}
                sx={{
                  fontSize: '0.875rem',
                  color: 'rgb(100, 116, 139)',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  height: '44px',
                  width: '100%',
                  outline: 'none',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                  },
                  '&:focus': {
                    borderColor: 'rgb(26, 32, 53)',
                    boxShadow: 'none',
                  }
                }}
              />
              <SearchIcon 
                sx={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'rgb(100, 116, 139)', 
                  fontSize: 20 
                }} 
              />
            </Box>
          </FormControl>

          {/* Date Range Fields and Filters - Two Column Layout on Small/Medium */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'row', lg: 'row' },
            flexWrap: { xs: 'wrap', lg: 'nowrap' },
            gap: { xs: 1.5, lg: 2 },
            alignItems: 'center',
            width: { lg: '100%' }
          }}>
            {/* Date Range Fields */}
            <TextField
              type="date"
              label="From"
              value={startDate}
              onChange={handleStartDateChange}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{
                width: { xs: 'calc(50% - 0.75rem)', lg: '140px' },
                '& .MuiInputBase-root': {
                  height: '44px',
                  fontSize: '0.875rem',
                  borderRadius: '8px'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e2e8f0'
                },
                '& .MuiInputLabel-root': {
                  color: 'rgb(100, 116, 139)',
                  fontSize: '0.75rem',
                }
              }}
            />
            
            <TextField
              type="date"
              label="To"
              value={endDate}
              onChange={handleEndDateChange}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{
                width: { xs: 'calc(50% - 0.75rem)', lg: '140px' },
                '& .MuiInputBase-root': {
                  height: '44px',
                  fontSize: '0.875rem',
                  borderRadius: '8px'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e2e8f0'
                },
                '& .MuiInputLabel-root': {
                  color: 'rgb(100, 116, 139)',
                  fontSize: '0.75rem',
                }
              }}
            />

            {/* Payment Method Filter */}
            <FormControl
              variant="outlined"
              size="small"
              sx={{
                width: { xs: 'calc(50% - 0.75rem)', lg: '160px' },
                mt: { xs: 1.5, lg: 0 }
              }}
            >
              <Select
                value={paymentMethodFilter}
                onChange={handlePaymentMethodFilterChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Payment Method filter' }}
                renderValue={(selected) => {
                  return selected === 'all' ? 'All Payments' : selected;
                }}
                sx={{ 
                  fontSize: '0.875rem',
                  color: 'rgb(100, 116, 139)',
                  '& .MuiSelect-select': { 
                    paddingTop: '11px',
                    paddingBottom: '11px',
                  },
                  height: '44px',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { 
                      maxHeight: 300,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }
                  }
                }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All Payments</MenuItem>
                <MenuItem value="Cash" sx={{ fontSize: '0.875rem' }}>Cash</MenuItem>
                <MenuItem value="Credit Card" sx={{ fontSize: '0.875rem' }}>Credit Card</MenuItem>
                <MenuItem value="Mobile Money" sx={{ fontSize: '0.875rem' }}>Mobile Money</MenuItem>
              </Select>
            </FormControl>

            {/* Status Filter */}
            <FormControl
              variant="outlined"
              size="small"
              sx={{
                width: { xs: 'calc(50% - 0.75rem)', lg: '140px' },
                mt: { xs: 1.5, lg: 0 }
              }}
            >
              <Select
                value={dateFilter}
                onChange={handleDateFilterChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Status filter' }}
                renderValue={(selected) => {
                  switch(selected) {
                    case 'all': return 'All Dates';
                    case 'today': return 'Today';
                    case 'yesterday': return 'Yesterday';
                    case 'thisWeek': return 'This Week';
                    case 'range': return 'Custom Range';
                    default: return 'All Dates';
                  }
                }}
                sx={{ 
                  fontSize: '0.875rem',
                  color: 'rgb(100, 116, 139)',
                  '& .MuiSelect-select': { 
                    paddingTop: '11px',
                    paddingBottom: '11px',
                  },
                  height: '44px',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { 
                      maxHeight: 300,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }
                  }
                }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All Dates</MenuItem>
                <MenuItem value="today" sx={{ fontSize: '0.875rem' }}>Today</MenuItem>
                <MenuItem value="yesterday" sx={{ fontSize: '0.875rem' }}>Yesterday</MenuItem>
                <MenuItem value="thisWeek" sx={{ fontSize: '0.875rem' }}>This Week</MenuItem>
                <MenuItem value="range" sx={{ fontSize: '0.875rem' }}>Custom Range</MenuItem>
              </Select>
            </FormControl>

            {/* Reset Button */}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
              onClick={handleResetFilters}
              sx={{
                width: { xs: '100%', lg: '100px' },
                color: 'rgb(26, 32, 53)',
                borderColor: '#e2e8f0',
                backgroundColor: 'white',
                borderRadius: '8px',
                height: '44px',
                fontSize: '0.875rem',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#f8fafc',
                  borderColor: '#cbd5e1',
                },
                mt: { xs: 1.5, lg: 0 },
                ml: { lg: 'auto' }
              }}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Sales Data Table with Refresh Controls above it */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2 
      }}>
        {/* Auto-refresh toggle control */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={toggleAutoRefresh}
                color="primary"
                size="small"
              />
            }
            label={
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                Auto-refresh
              </Typography>
            }
            sx={{ mr: 2 }}
          />
          
          <Typography sx={{ 
            fontSize: '0.75rem', 
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            mr: 2
          }}>
            {autoRefresh 
              ? <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                  Refreshing in <Box component="span" sx={{ fontWeight: 600, mx: 0.5 }}>{nextRefreshIn}s</Box>
                </Box>
              : <Box component="span">Last updated: {formatLastRefresh()}</Box>
            }
          </Typography>
          
          <Tooltip title={refreshing ? "Refreshing..." : "Refresh now"}>
            <IconButton 
              onClick={refreshData} 
              disabled={refreshing}
              size="small"
              sx={{ 
                bgcolor: 'white', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                '&:hover': { bgcolor: 'white' },
                animation: nextRefreshIn <= 5 && autoRefresh ? 'pulse 1.5s infinite' : 'none'
              }}
              className={nextRefreshIn <= 5 && autoRefresh ? 'pulse-refresh' : ''}
            >
              <Badge 
                color="success" 
                variant="dot" 
                invisible={!autoRefresh || refreshing}
                sx={{ 
                  '& .MuiBadge-badge': {
                    animation: autoRefresh ? 'fadeInOut 2s infinite' : 'none',
                  }
                }}
              >
                <SpinningRefreshIcon spinning={refreshing ? 1 : 0} />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography sx={{ 
          fontSize: '0.75rem', 
          color: 'text.secondary' 
        }}>
          {filteredSales.length} {filteredSales.length === 1 ? 'sale' : 'sales'} found
        </Typography>
      </Box>
      
      <Paper sx={{ 
        width: '100%', 
        overflow: 'hidden', 
        borderRadius: 2, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        mb: 3
      }}>
        <StyledDataTable
          columns={columns}
          data={filteredSales}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 15, 20]}
          defaultSortFieldId={1}
          defaultSortAsc={false}
          sortIcon={<span>▲</span>}
          persistTableHead
          noDataComponent={
            <Box sx={{ py: 5, px: 2 }}>
              <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: 'rgb(100, 116, 139)' }}>
                {searchTerm || dateFilter !== 'all' || paymentMethodFilter !== 'all' 
                  ? 'No sales found matching your search criteria' 
                  : 'No sales available'}
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
          dense
        />
      </Paper>

      {/* View Sale Details Dialog */}
      <Dialog
        open={viewSaleDialog}
        onClose={handleCloseDialog}
        aria-labelledby="sale-details-title"
        maxWidth="md"
        fullWidth
        style={{ pointerEvents: 'auto' }}
        sx={{
          '.MuiDialog-paper': {
            borderRadius: '12px',
            overflow: 'visible',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
            pointerEvents: 'auto'
          },
          '.MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
        BackdropProps={{
          style: { 
            zIndex: 0,
            pointerEvents: 'auto' 
          }
        }}
        slotProps={{
          backdrop: {
            style: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 0
            }
          }
        }}
      >
        {selectedSale && (
          <>
            {/* Dialog Header */}
            <Box sx={{ 
              p: { xs: 2, sm: 2.5 },
              borderBottom: '1px solid #e2e8f0',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: 'white'
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" sx={{ 
                  color: 'rgb(26, 32, 53)',
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                  fontWeight: 600,
                  lineHeight: 1.2
                }}>
                  Invoice #{selectedSale.invoiceNumber}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'text.secondary',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  mt: 0.5 
                }}>
                  {new Date(selectedSale.date).toLocaleDateString()}
                </Typography>
              </Box>
              
              <Chip
                label={selectedSale.status}
                size="small"
                sx={{ 
                  fontWeight: 500,
                  backgroundColor: 
                    selectedSale.status === 'Completed' ? 'rgba(46, 204, 113, 0.1)' : 
                    selectedSale.status === 'Refunded' ? 'rgba(235, 87, 87, 0.1)' : 
                    'rgba(246, 194, 62, 0.1)',
                  color: 
                    selectedSale.status === 'Completed' ? '#2ecc71' : 
                    selectedSale.status === 'Refunded' ? '#eb5757' : 
                    '#f6c23e',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  height: '22px'
                }}
              />
            </Box>
            
            {/* Dialog Content */}
            <DialogContent sx={{ 
              p: { xs: 2, sm: 2.5 },
              pt: { xs: 2, sm: 2.5 },
              overflowX: 'hidden' 
            }}>
              {/* Sale Summary Information */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(3, 1fr)' 
                }, 
                gap: { xs: 1.5, sm: 2 },
                mb: { xs: 2.5, sm: 3 },
                p: { xs: 1.5, sm: 2 },
                backgroundColor: '#f8fafc',
                borderRadius: '8px' 
              }}>
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ color: 'rgb(100, 116, 139)', fontSize: '0.7rem', mb: 0.5 }}
                  >
                    Customer
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                    {selectedSale.customer}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ color: 'rgb(100, 116, 139)', fontSize: '0.7rem', mb: 0.5 }}
                  >
                    Payment Method
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {selectedSale.paymentMethod}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ color: 'rgb(100, 116, 139)', fontSize: '0.7rem', mb: 0.5 }}
                  >
                    Items
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {selectedSale.items} {selectedSale.items === 1 ? 'item' : 'items'}
                  </Typography>
                </Box>
              </Box>
              
              {/* Sale Items Table Section */}
              <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
                <Typography variant="h6" sx={{ 
                  mb: 1.5, 
                  fontSize: { xs: '0.85rem', sm: '0.9rem' }, 
                  fontWeight: 600 
                }}>
                  Sale Items
                </Typography>
                
                <Box sx={{ 
                  overflowX: 'auto'
                }}>
                  <table className="sale-items-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th style={{textAlign: 'center'}}>Qty</th>
                        <th style={{textAlign: 'right'}}>Price</th>
                        <th style={{textAlign: 'right'}}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.min(selectedSale.items, 30) }).map((_, index) => (
                        <tr key={index}>
                          <td>Sample Product {index + 1}</td>
                          <td style={{textAlign: 'center'}}>1</td>
                          <td style={{textAlign: 'right'}}>${(selectedSale.total / selectedSale.items).toFixed(2)}</td>
                          <td style={{textAlign: 'right'}}>${(selectedSale.total / selectedSale.items).toFixed(2)}</td>
                        </tr>
                      ))}
                      {selectedSale.items > 30 && (
                        <tr>
                          <td colSpan="4" style={{textAlign: 'center', fontStyle: 'italic', color: 'rgb(100, 116, 139)'}}>
                            ... and {selectedSale.items - 30} more items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Box>
              </Box>
              
              {/* Totals section */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                borderTop: '1px dashed #e2e8f0',
                pt: 2
              }}>
                <Box className="sale-summary">
                  <Box className="sale-summary-row">
                    <Typography sx={{ color: 'rgb(100, 116, 139)', fontWeight: 500 }}>
                      Subtotal:
                    </Typography>
                    <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      ${(selectedSale.total * 0.9).toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box className="sale-summary-row">
                    <Typography sx={{ color: 'rgb(100, 116, 139)', fontWeight: 500 }}>
                      Tax (10%):
                    </Typography>
                    <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      ${(selectedSale.total * 0.1).toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box className="sale-summary-row total">
                    <Typography sx={{ fontWeight: 600 }}>
                      Total:
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      ${selectedSale.total.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            
            {/* Dialog Actions */}
            <DialogActions sx={{ 
              p: { xs: 1.5, sm: 2 },
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              justifyContent: 'flex-end',
              gap: { xs: 1.5, sm: 2 }
            }}>
              <Button
                variant="outlined"
                onClick={handleCloseDialog}
                sx={{
                  color: 'rgb(26, 32, 53)',
                  borderColor: 'rgb(26, 32, 53)',
                  borderRadius: '8px',
                  '&:hover': {
                    borderColor: 'rgb(26, 32, 53)',
                    backgroundColor: 'rgba(26, 32, 53, 0.04)'
                  },
                  py: { xs: 0.5, sm: 0.75 },
                  px: { xs: 1.5, sm: 2 },
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  minWidth: { xs: '80px', sm: '100px' }
                }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                onClick={handlePrintReceipt}
                sx={{
                  bgcolor: 'rgb(26, 32, 53)',
                  borderRadius: '8px',
                  '&:hover': {
                    bgcolor: 'rgb(26, 32, 53, 0.9)'
                  },
                  py: { xs: 0.5, sm: 0.75 },
                  px: { xs: 1.5, sm: 2 },
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  minWidth: { xs: '120px', sm: '140px' }
                }}
              >
                Print Receipt
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
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

export default SalesHistory;