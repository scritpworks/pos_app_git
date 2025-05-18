import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS, getAuthHeader } from '../apiConfig/apiConfig';


const PriceGroups = () => {
  // State
  const [priceTypes, setPriceTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [selectedPriceType, setSelectedPriceType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active'
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch price types
  const fetchPriceTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.priceTypes, getAuthHeader());
      if (response.data.success) {
        setPriceTypes(response.data.data);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error fetching price types',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceTypes();
  }, []);

  // Handlers
  const handleOpenDialog = (mode, priceType = null) => {
    setDialogMode(mode);
    setSelectedPriceType(priceType);
    if (mode === 'edit' && priceType) {
      setFormData({
        name: priceType.name,
        description: priceType.description || '',
        status: priceType.status || 'Active'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'Active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPriceType(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        throw new Error('Price type name is required');
      }

      const data = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status
      };

      let response;
      if (dialogMode === 'edit' && selectedPriceType) {
        response = await axios.put(
          `${API_ENDPOINTS.priceTypes}/${selectedPriceType.id}`,
          data,
          getAuthHeader()
        );
      } else {
        response = await axios.post(API_ENDPOINTS.priceTypes, data, getAuthHeader());
      }

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `Price type ${dialogMode === 'edit' ? 'updated' : 'created'} successfully`,
          severity: 'success'
        });
        handleCloseDialog();
        fetchPriceTypes();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message,
        severity: 'error'
      });
    }
  };

  const handleDelete = async (priceType) => {
    if (window.confirm(`Are you sure you want to delete ${priceType.name}?`)) {
      try {
        const response = await axios.delete(
          `${API_ENDPOINTS.priceTypes}/${priceType.id}`,
          getAuthHeader()
        );

        if (response.data.success) {
          setSnackbar({
            open: true,
            message: 'Price type deleted successfully',
            severity: 'success'
          });
          fetchPriceTypes();
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Error deleting price type',
          severity: 'error'
        });
      }
    }
  };

  return (
    <div className="page-content">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: 'rgb(26, 32, 53)', fontWeight: 600 }}>
          Price Groups
        </Typography>
      </Box>

      {/* Controls */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search price groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'rgb(156, 163, 175)', mr: 1 }} />,
            }}
            sx={{
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: 'white'
              }
            }}
          />

          {/* Add Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('add')}
            sx={{
              bgcolor: 'rgb(26, 32, 53)',
              borderRadius: '8px',
              '&:hover': {
                bgcolor: 'rgb(40, 50, 78)'
              }
            }}
          >
            Add Price Group
          </Button>
        </Box>
      </Paper>

      {/* Data Table */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgb(246, 248, 250)' }}>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {priceTypes
              .filter(pt => 
                pt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pt.description?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((priceType) => (
                <TableRow key={priceType.id}>
                  <TableCell>{priceType.name}</TableCell>
                  <TableCell>{priceType.description}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.5,
                        borderRadius: '4px',
                        backgroundColor: priceType.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: priceType.status === 'Active' ? '#166534' : '#991b1b'
                      }}
                    >
                      {priceType.status}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog('edit', priceType)}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(priceType)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'edit' ? 'Edit Price Group' : 'Add Price Group'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {dialogMode === 'edit' ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default PriceGroups; 