import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Avatar,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaymentsIcon from '@mui/icons-material/Payments';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import './Debtors.css';

const Debtors = () => {
  // State
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [addDebtorDialog, setAddDebtorDialog] = useState(false);
  const [recordPaymentDialog, setRecordPaymentDialog] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [newDebtor, setNewDebtor] = useState({
    name: '',
    phone: '',
    location: '',
    amount: '',
    dueDate: '',
    notes: ''
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Mock data
  useEffect(() => {
    // Simulate fetching data
    setLoading(true);
    setTimeout(() => {
      const mockDebtors = [
        {
          id: 1,
          name: 'John Doe',
          phone: '+1 234-567-8900',
          location: 'New York',
          totalDebt: 1500.00,
          amountPaid: 0.00,
          balance: 1500.00,
          dueDate: '2024-03-15',
          status: 'pending',
          createdAt: '2024-01-01',
          lastPayment: null,
          notes: 'Customer promised to pay by due date',
          items: [
            { id: 1, name: 'Laptop HP', amount: 1000.00, date: '2024-01-01' },
            { id: 2, name: 'Extended Warranty', amount: 500.00, date: '2024-01-01' }
          ]
        },
        {
          id: 2,
          name: 'Jane Smith',
          phone: '+1 234-567-8901',
          location: 'Los Angeles',
          totalDebt: 2500.00,
          amountPaid: 0.00,
          balance: 2500.00,
          dueDate: '2024-03-10',
          status: 'pending',
          createdAt: '2024-01-15',
          lastPayment: null,
          notes: 'Corporate account, payment expected by due date',
          items: [
            { id: 1, name: 'Office Supplies', amount: 1200.00, date: '2024-01-15' },
            { id: 2, name: 'Furniture', amount: 1300.00, date: '2024-01-15' }
          ]
        },
        {
          id: 3,
          name: 'Michael Johnson',
          phone: '+1 234-567-8902',
          location: 'Chicago',
          totalDebt: 750.00,
          amountPaid: 250.00,
          balance: 500.00,
          dueDate: '2024-02-28',
          status: 'partial',
          createdAt: '2024-01-10',
          lastPayment: '2024-02-01',
          notes: 'Made partial payment, will clear by due date',
          items: [
            { id: 1, name: 'Smartphone', amount: 750.00, date: '2024-01-10' }
          ]
        },
        {
          id: 4,
          name: 'Sarah Williams',
          phone: '+1 234-567-8903',
          location: 'Boston',
          totalDebt: 3200.00,
          amountPaid: 1600.00,
          balance: 1600.00,
          dueDate: '2024-01-30',
          status: 'overdue',
          createdAt: '2023-12-15',
          lastPayment: '2024-01-15',
          notes: 'Paying in installments, behind schedule',
          items: [
            { id: 1, name: 'MacBook Pro', amount: 2400.00, date: '2023-12-15' },
            { id: 2, name: 'Accessories', amount: 800.00, date: '2023-12-15' }
          ]
        },
        {
          id: 5,
          name: 'David Brown',
          phone: '+1 234-567-8904',
          location: 'Miami',
          totalDebt: 900.00,
          amountPaid: 900.00,
          balance: 0.00,
          dueDate: '2024-02-15',
          status: 'paid',
          createdAt: '2024-01-05',
          lastPayment: '2024-02-10',
          notes: 'Paid in full before due date',
          items: [
            { id: 1, name: 'Software License', amount: 900.00, date: '2024-01-05' }
          ]
        }
      ];
      setDebtors(mockDebtors);
      setLoading(false);
    }, 800);
  }, []);

  // Handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleDateFromChange = (e) => {
    setDateFrom(e.target.value);
  };

  const handleDateToChange = (e) => {
    setDateTo(e.target.value);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleExpandCard = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAddDebtorOpen = () => {
    setAddDebtorDialog(true);
  };

  const handleAddDebtorClose = () => {
    setAddDebtorDialog(false);
    setNewDebtor({
      name: '',
      phone: '',
      location: '',
      amount: '',
      dueDate: '',
      notes: ''
    });
  };

  const handleDebtorInputChange = (e) => {
    const { name, value } = e.target;
    setNewDebtor({
      ...newDebtor,
      [name]: value
    });
  };

  const handleAddDebtor = () => {
    // Validate inputs
    if (!newDebtor.name || !newDebtor.amount || !newDebtor.dueDate) {
      setSnackbar({
        open: true,
        message: 'Please fill all required fields',
        severity: 'error'
      });
      return;
    }

    const newDebtorData = {
      id: debtors.length + 1,
      name: newDebtor.name,
      phone: newDebtor.phone,
      location: newDebtor.location || 'Not specified',
      totalDebt: parseFloat(newDebtor.amount),
      amountPaid: 0,
      balance: parseFloat(newDebtor.amount),
      dueDate: newDebtor.dueDate,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      lastPayment: null,
      notes: newDebtor.notes,
      items: [
        { id: 1, name: 'New Purchase', amount: parseFloat(newDebtor.amount), date: new Date().toISOString().split('T')[0] }
      ]
    };

    setDebtors([...debtors, newDebtorData]);
    handleAddDebtorClose();
    setSnackbar({
      open: true,
      message: 'Debtor added successfully',
      severity: 'success'
    });
  };

  const handleRecordPaymentOpen = (debtor) => {
    setSelectedDebtor(debtor);
    setRecordPaymentDialog(true);
    setPaymentAmount('');
  };

  const handleRecordPaymentClose = () => {
    setRecordPaymentDialog(false);
    setSelectedDebtor(null);
  };

  const handlePaymentAmountChange = (e) => {
    setPaymentAmount(e.target.value);
  };

  const handleRecordPayment = () => {
    // Validate payment amount
    if (!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid payment amount',
        severity: 'error'
      });
      return;
    }

    if (parseFloat(paymentAmount) > selectedDebtor.balance) {
      setSnackbar({
        open: true,
        message: 'Payment amount cannot exceed balance',
        severity: 'error'
      });
      return;
    }

    // Update the debtor with new payment
    const updatedDebtors = debtors.map(debtor => {
      if (debtor.id === selectedDebtor.id) {
        const amountPaid = debtor.amountPaid + parseFloat(paymentAmount);
        const balance = debtor.totalDebt - amountPaid;
        let status = 'pending';
        if (balance <= 0) {
          status = 'paid';
        } else if (balance < debtor.totalDebt) {
          status = 'partial';
        } else if (new Date(debtor.dueDate) < new Date()) {
          status = 'overdue';
        }
        
        return {
          ...debtor,
          amountPaid,
          balance,
          status,
          lastPayment: new Date().toISOString().split('T')[0]
        };
      }
      return debtor;
    });

    setDebtors(updatedDebtors);
    handleRecordPaymentClose();
    setSnackbar({
      open: true,
      message: 'Payment recorded successfully',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Filter debtors based on search, status, and date range
  const filteredDebtors = useMemo(() => {
    return debtors.filter(debtor => {
      const matchesSearch = debtor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           debtor.phone.includes(searchTerm) ||
                           debtor.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || debtor.status === statusFilter;
      
      const matchesDateRange = (!dateFrom || debtor.dueDate >= dateFrom) && 
                               (!dateTo || debtor.dueDate <= dateTo);
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [debtors, searchTerm, statusFilter, dateFrom, dateTo]);

  // Get the first letter of name for avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  // Format date to locale string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status chip
  const getStatusChip = (status) => {
    switch(status) {
      case 'paid':
        return <Chip label="Paid" className="status-chip-paid" size="small" />;
      case 'partial':
        return <Chip label="Partial" className="status-chip-partial" size="small" />;
      case 'overdue':
        return <Chip label="Overdue" className="status-chip-overdue" size="small" />;
      case 'pending':
      default:
        return <Chip label="Pending" className="status-chip-pending" size="small" />;
    }
  };

  // Calculate summary data
  const totalDebt = debtors.reduce((sum, debtor) => sum + debtor.totalDebt, 0);
  const totalCollected = debtors.reduce((sum, debtor) => sum + debtor.amountPaid, 0);
  const totalBalance = debtors.reduce((sum, debtor) => sum + debtor.balance, 0);
  const overdueCount = debtors.filter(debtor => debtor.status === 'overdue').length;

  return (
    <Box className="debtors-page">
      {/* Page Header */}
      <Box className="roles-header">
        <Box>
          <Typography variant="h5" className="page-title">
            Debtors Account
          </Typography>
          <Typography variant="body1" color="textSecondary" className="page-subtitle">
            Track and manage customer debts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          className="add-role-button"
          onClick={handleAddDebtorOpen}
          size="small"
        >
          ADD DEBTOR
        </Button>
      </Box>

      {/* Summary Cards */}
      <Box className="summary-cards">
        <Paper className="summary-card">
          <Typography className="summary-label">Total Debt</Typography>
          <Typography className="summary-value">${totalDebt.toFixed(2)}</Typography>
        </Paper>
        
        <Paper className="summary-card">
          <Typography className="summary-label">Collected</Typography>
          <Typography className="summary-value collected">${totalCollected.toFixed(2)}</Typography>
        </Paper>
        
        <Paper className="summary-card">
          <Typography className="summary-label">Outstanding</Typography>
          <Typography className="summary-value outstanding">${totalBalance.toFixed(2)}</Typography>
        </Paper>
        
        <Paper className="summary-card">
          <Typography className="summary-label">Overdue Accounts</Typography>
          <Typography className="summary-value overdue">{overdueCount}</Typography>
        </Paper>
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
                placeholder="Search debtors..."
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

          {/* Date Range Fields and Filters */}
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
              value={dateFrom}
              onChange={handleDateFromChange}
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
              value={dateTo}
              onChange={handleDateToChange}
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

            {/* Status Filter */}
            <FormControl
              variant="outlined"
              size="small"
              sx={{
                width: { xs: 'calc(50% - 0.75rem)', lg: '160px' },
                mt: { xs: 1.5, lg: 0 }
              }}
            >
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Status filter' }}
                renderValue={(selected) => {
                  return selected === 'all' ? 'All Status' : 
                         selected === 'pending' ? 'Pending' :
                         selected === 'partial' ? 'Partial' :
                         selected === 'paid' ? 'Paid' : 'Overdue';
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
                <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All Status</MenuItem>
                <MenuItem value="pending" sx={{ fontSize: '0.875rem' }}>Pending</MenuItem>
                <MenuItem value="partial" sx={{ fontSize: '0.875rem' }}>Partial</MenuItem>
                <MenuItem value="paid" sx={{ fontSize: '0.875rem' }}>Paid</MenuItem>
                <MenuItem value="overdue" sx={{ fontSize: '0.875rem' }}>Overdue</MenuItem>
              </Select>
            </FormControl>

            {/* Reset Button */}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
              onClick={handleResetFilters}
              sx={{
                width: { xs: 'calc(50% - 0.75rem)', lg: '100px' },
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

      {/* Debtors Cards */}
      <Box className="debtors-cards-container">
        {loading ? (
          <Box className="loading-container">
            <Typography>Loading...</Typography>
          </Box>
        ) : filteredDebtors.length === 0 ? (
          <Box className="no-results">
            <Typography variant="body1">No debtors found</Typography>
          </Box>
        ) : (
          filteredDebtors.map(debtor => (
            <Paper 
              key={debtor.id} 
              className="debtor-card"
              elevation={1}
            >
              {/* Card Header */}
              <Box className="debtor-card-header" onClick={() => handleExpandCard(debtor.id)}>
                <Box className="debtor-info">
                  <Avatar className={`debtor-avatar status-${debtor.status}`}>
                    {getInitial(debtor.name)}
                  </Avatar>
                  <Box className="debtor-details">
                    <Typography variant="h6" className="debtor-name">
                      {debtor.name}
                    </Typography>
                    <Box className="debtor-contact">
                      <Box className="debtor-phone">
                        <PhoneIcon fontSize="small" />
                        <Typography variant="body2">{debtor.phone}</Typography>
                      </Box>
                      <Box className="debtor-location">
                        <LocationOnIcon fontSize="small" />
                        <Typography variant="body2">{debtor.location}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                
                <Box className="debtor-amount-section">
                  <Typography variant="h6" className="debtor-amount">
                    ${debtor.balance.toFixed(2)}
                  </Typography>
                  <Box className="debtor-due-date">
                    <CalendarTodayIcon fontSize="small" />
                    <Typography variant="body2">
                      Due: {formatDate(debtor.dueDate)}
                    </Typography>
                  </Box>
                  <Box className="debtor-status">
                    {getStatusChip(debtor.status)}
                  </Box>
                  <IconButton 
                    className={`expand-button ${expandedId === debtor.id ? 'expanded' : ''}`}
                    onClick={() => handleExpandCard(debtor.id)}
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                </Box>
              </Box>
              
              {/* Expandable Content */}
              <Collapse in={expandedId === debtor.id} timeout="auto" unmountOnExit>
                <Box className="debtor-card-content">
                  <Divider />
                  
                  <Box className="payment-summary">
                    <Box className="payment-info">
                      <Typography variant="body2" className="payment-label">Total Debt:</Typography>
                      <Typography variant="body1" className="payment-value">
                        ${debtor.totalDebt.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box className="payment-info">
                      <Typography variant="body2" className="payment-label">Amount Paid:</Typography>
                      <Typography variant="body1" className="payment-value collected">
                        ${debtor.amountPaid.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box className="payment-info">
                      <Typography variant="body2" className="payment-label">Balance:</Typography>
                      <Typography variant="body1" className="payment-value outstanding">
                        ${debtor.balance.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box className="payment-info">
                      <Typography variant="body2" className="payment-label">Last Payment:</Typography>
                      <Typography variant="body1" className="payment-value">
                        {debtor.lastPayment ? formatDate(debtor.lastPayment) : 'No payments'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider />
                  
                  <Box className="debtor-items">
                    <Typography variant="subtitle2" className="items-heading">
                      <ReceiptLongIcon fontSize="small" />
                      Item Details
                    </Typography>
                    <List className="items-list">
                      {debtor.items.map(item => (
                        <ListItem key={item.id} className="item-row">
                          <ListItemText 
                            primary={item.name} 
                            secondary={`Purchased: ${formatDate(item.date)}`}
                          />
                          <Typography variant="body1" className="item-amount">
                            ${item.amount.toFixed(2)}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                  
                  {debtor.notes && (
                    <Box className="debtor-notes">
                      <Typography variant="subtitle2">Notes:</Typography>
                      <Typography variant="body2">{debtor.notes}</Typography>
                    </Box>
                  )}
                  
                  <Box className="debtor-actions">
                    {debtor.status !== 'paid' && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<PaymentsIcon />}
                        onClick={() => handleRecordPaymentOpen(debtor)}
                        className="record-payment-button"
                      >
                        RECORD PAYMENT
                      </Button>
                    )}
                  </Box>
                </Box>
              </Collapse>
            </Paper>
          ))
        )}
      </Box>

      {/* Add Debtor Dialog */}
      <Dialog open={addDebtorDialog} onClose={handleAddDebtorClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add New Debtor
          <IconButton
            aria-label="close"
            onClick={handleAddDebtorClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Customer Name"
                value={newDebtor.name}
                onChange={handleDebtorInputChange}
                fullWidth
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone Number"
                value={newDebtor.phone}
                onChange={handleDebtorInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="location"
                label="Location"
                value={newDebtor.location}
                onChange={handleDebtorInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="amount"
                label="Debt Amount"
                type="number"
                value={newDebtor.amount}
                onChange={handleDebtorInputChange}
                fullWidth
                required
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dueDate"
                label="Due Date"
                type="date"
                value={newDebtor.dueDate}
                onChange={handleDebtorInputChange}
                fullWidth
                required
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={newDebtor.notes}
                onChange={handleDebtorInputChange}
                fullWidth
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddDebtorClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddDebtor} color="primary" variant="contained">
            Add Debtor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={recordPaymentDialog} onClose={handleRecordPaymentClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Record Payment
          <IconButton
            aria-label="close"
            onClick={handleRecordPaymentClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDebtor && (
            <Box>
              <Box className="payment-customer-info">
                <Typography variant="body2" color="textSecondary">
                  Customer
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {selectedDebtor.name}
                </Typography>
              </Box>
              
              <Box className="payment-summary-dialog">
                <Box className="payment-info-dialog">
                  <Typography variant="body2" color="textSecondary">
                    Total Debt
                  </Typography>
                  <Typography variant="body1">
                    ${selectedDebtor.totalDebt.toFixed(2)}
                  </Typography>
                </Box>
                
                <Box className="payment-info-dialog">
                  <Typography variant="body2" color="textSecondary">
                    Amount Paid
                  </Typography>
                  <Typography variant="body1" className="collected">
                    ${selectedDebtor.amountPaid.toFixed(2)}
                  </Typography>
                </Box>
                
                <Box className="payment-info-dialog">
                  <Typography variant="body2" color="textSecondary">
                    Balance
                  </Typography>
                  <Typography variant="body1" className="outstanding">
                    ${selectedDebtor.balance.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <TextField
                label="Payment Amount"
                type="number"
                value={paymentAmount}
                onChange={handlePaymentAmountChange}
                fullWidth
                required
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRecordPaymentClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleRecordPayment}
            color="primary"
            variant="contained"
            startIcon={<PaymentsIcon />}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Debtors;
