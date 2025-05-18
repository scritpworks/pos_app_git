import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Stack,
  Avatar,
  Chip,
  InputAdornment,
  Badge,
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
  Tooltip,
  CircularProgress,
  ButtonGroup,
  Fade,
  Zoom,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  LocalOffer as DiscountIcon,
  Person as CustomerIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Category as CategoryIcon,
  Payments as PaymentIcon,
  Calculate as CalculateIcon,
  LocalAtm as CashIcon,
  CreditCard as CardIcon,
  PhoneAndroid as MobileIcon,
  PersonAdd as AddCustomerIcon,
  Print as PrintIcon,
  History as HistoryIcon
} from '@mui/icons-material';

// Sample product image URL
const defaultProductImage = 'https://via.placeholder.com/150?text=Product';

// Sample categories with emojis
const sampleCategories = [
  { id: 1, name: 'All Products', icon: <CategoryIcon /> },
  { id: 2, name: 'Beverages', icon: '🥤' },
  { id: 3, name: 'Snacks', icon: '🍿' },
  { id: 4, name: 'Groceries', icon: '🛒' },
  { id: 5, name: 'Electronics', icon: '📱' },
  { id: 6, name: 'Household', icon: '🏠' }
];

// Sample products with more details
const sampleProducts = [
  {
    id: 1,
    name: 'Coca Cola',
    price: 5.99,
    category: 'Beverages',
    image: defaultProductImage,
    stock: 50,
    barcode: '123456789',
    unit: 'bottle'
  },
  {
    id: 2,
    name: 'Potato Chips',
    price: 3.99,
    category: 'Snacks',
    image: defaultProductImage,
    stock: 30,
    barcode: '987654321',
    unit: 'pack'
  },
  // Add more sample products...
];

// Quick amount buttons for payment
const quickAmounts = [10, 20, 50, 100, 200, 500];

const POS = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [quantityDialog, setQuantityDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customQuantity, setCustomQuantity] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Filter products based on category and search query
  const filteredProducts = sampleProducts.filter(product => {
    const matchesCategory = selectedCategory === 'All Products' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // Cart operations
  const addToCart = (product, quantity = 1) => {
    if (quantity <= 0) return;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          setSnackbar({
            open: true,
            message: 'Not enough stock available',
            severity: 'warning'
          });
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      if (quantity > product.stock) {
        setSnackbar({
          open: true,
          message: 'Not enough stock available',
          severity: 'warning'
        });
        return prevCart;
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const openQuantityDialog = (product) => {
    setSelectedProduct(product);
    setCustomQuantity('1');
    setQuantityDialog(true);
  };

  const handleQuantitySubmit = () => {
    const quantity = parseInt(customQuantity);
    if (quantity > 0) {
      addToCart(selectedProduct, quantity);
    }
    setQuantityDialog(false);
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      if (existingItem.quantity === 1) {
        return prevCart.filter(item => item.id !== productId);
      }
      return prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const updateCartItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) return;
    
    const product = sampleProducts.find(p => p.id === productId);
    if (newQuantity > product.stock) {
      setSnackbar({
        open: true,
        message: 'Not enough stock available',
        severity: 'warning'
      });
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const deleteFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;
  const change = amountReceived ? amountReceived - total : 0;

  // Handle quick amount selection
  const handleQuickAmount = (amount) => {
    setAmountReceived(amount);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', bgcolor: '#f5f5f5', gap: 2, p: 2 }}>
      {/* Left Side - Products */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Search and Categories */}
        <Paper elevation={3} sx={{ p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search products by name or scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
            {sampleCategories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                icon={typeof category.icon === 'string' ? undefined : category.icon}
                onClick={() => setSelectedCategory(category.name)}
                color={selectedCategory === category.name ? 'primary' : 'default'}
                sx={{
                  '& .MuiChip-icon': {
                    fontSize: typeof category.icon === 'string' ? '1.2rem' : undefined
                  },
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              />
            ))}
          </Stack>
        </Paper>

        {/* Products Grid */}
        <Paper elevation={3} sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Grid container spacing={2}>
              {filteredProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <Zoom in={true}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 8
                        }
                      }}
                      onClick={() => openQuantityDialog(product)}
                    >
                      <CardMedia
                        component="img"
                        height="140"
                        image={product.image}
                        alt={product.name}
                      />
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        <Typography gutterBottom variant="h6" component="div" noWrap>
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stock: {product.stock} {product.unit}s
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Barcode: {product.barcode}
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                          ₵{product.price.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      </Box>

      {/* Right Side - Cart */}
      <Paper elevation={3} sx={{ width: 400, display: 'flex', flexDirection: 'column', p: 2 }}>
        {/* Cart Header */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={cart.length} color="primary">
            <CartIcon />
          </Badge>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Shopping Cart</Typography>
          <IconButton color="error" onClick={() => setCart([])} disabled={cart.length === 0}>
            <ClearIcon />
          </IconButton>
        </Box>

        {/* Cart Items */}
        <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
          {cart.map((item) => (
            <Card key={item.id} sx={{ mb: 1, bgcolor: '#f8f9fa' }}>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={item.image} variant="rounded" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" noWrap>{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ₵{item.price.toFixed(2)} × {item.quantity}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ButtonGroup size="small" variant="outlined">
                      <IconButton size="small" onClick={() => removeFromCart(item.id)}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <TextField
                        size="small"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            updateCartItemQuantity(item.id, value);
                          }
                        }}
                        sx={{ width: '60px', '& input': { textAlign: 'center', p: '4px' } }}
                      />
                      <IconButton size="small" onClick={() => addToCart(item)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </ButtonGroup>
                    <IconButton size="small" color="error" onClick={() => deleteFromCart(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Cart Summary */}
        <Box sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 1 }}>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Subtotal</Typography>
              <Typography>₵{subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Tax (10%)</Typography>
              <Typography>₵{tax.toFixed(2)}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary">₵{total.toFixed(2)}</Typography>
            </Box>
          </Stack>
        </Box>

        {/* Action Buttons */}
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<PaymentIcon />}
            onClick={() => setPaymentDialog(true)}
            disabled={cart.length === 0}
            sx={{
              bgcolor: '#4caf50',
              '&:hover': {
                bgcolor: '#43a047'
              }
            }}
          >
            Proceed to Payment
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<AddCustomerIcon />}
          >
            Add Customer
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<DiscountIcon />}
          >
            Apply Discount
          </Button>
        </Stack>
      </Paper>

      {/* Quantity Dialog */}
      <Dialog open={quantityDialog} onClose={() => setQuantityDialog(false)}>
        <DialogTitle>Enter Quantity</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            type="number"
            label="Quantity"
            value={customQuantity}
            onChange={(e) => setCustomQuantity(e.target.value)}
            autoFocus
            InputProps={{
              inputProps: { min: 1, max: selectedProduct?.stock || 1 }
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Available Stock: {selectedProduct?.stock || 0}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuantityDialog(false)}>Cancel</Button>
          <Button onClick={handleQuantitySubmit} variant="contained">Add to Cart</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialog} 
        onClose={() => setPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" color="primary" gutterBottom>
              Total: ₵{total.toFixed(2)}
            </Typography>
          </Box>

          {/* Quick Amount Buttons */}
          <Typography variant="subtitle2" gutterBottom>Quick Amount</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outlined"
                onClick={() => handleQuickAmount(amount)}
                sx={{ minWidth: '80px' }}
              >
                ₵{amount}
              </Button>
            ))}
          </Box>

          <TextField
            fullWidth
            label="Amount Received"
            type="number"
            value={amountReceived}
            onChange={(e) => setAmountReceived(e.target.value)}
            sx={{ mb: 2 }}
          />

          {amountReceived >= total && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Change: ₵{change.toFixed(2)}
            </Alert>
          )}

          <Typography variant="subtitle2" gutterBottom>Payment Method</Typography>
          <Grid container spacing={2}>
            {[
              { method: 'Cash', icon: <CashIcon /> },
              { method: 'Card', icon: <CardIcon /> },
              { method: 'Mobile Money', icon: <MobileIcon /> }
            ].map(({ method, icon }) => (
              <Grid item xs={4} key={method}>
                <Button
                  variant={selectedPaymentMethod === method ? "contained" : "outlined"}
                  fullWidth
                  startIcon={icon}
                  onClick={() => setSelectedPaymentMethod(method)}
                  sx={{ height: '100%' }}
                >
                  {method}
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading || !selectedPaymentMethod || amountReceived < total}
            sx={{
              bgcolor: '#4caf50',
              '&:hover': {
                bgcolor: '#43a047'
              }
            }}
          >
            Complete Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Speed Dial for quick actions */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<CalculateIcon />}
          tooltipTitle="Calculator"
        />
        <SpeedDialAction
          icon={<PrintIcon />}
          tooltipTitle="Print Last Receipt"
        />
        <SpeedDialAction
          icon={<HistoryIcon />}
          tooltipTitle="Recent Sales"
        />
      </SpeedDial>
    </Box>
  );
};

export default POS; 