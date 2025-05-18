import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Sidebar from './layouts/sidebar';
import Topbar from './layouts/topbar';
import Settings from './pages/Settings';
import ManageRoles from './pages/ManageRoles';
import PaymentAccounts from './pages/PaymentAccounts';
import ManageBranches from './pages/ManageBranches';
import ManageSuppliers from './pages/ManageSuppliers';
import ManageEmployee from './pages/ManageEmployee';
import SalesHistory from './pages/SalesHistory';
import Debtors from './pages/Debtors';
import ManageProducts from './pages/ManageProducts';
import SignIn from './Accounts/SignIn';
import { useMediaQuery, ThemeProvider, createTheme } from '@mui/material';
import AdminDashboard from './pages/AdminDashboard';
import ManageLoginStatus from './pages/ManageLoginStatus';
import PriceGroups from './pages/PriceGroups';
import BranchPrices from './pages/BranchPrices';
import AllBranchPrices from './pages/AllBranchPrices';
import { Link } from 'react-router-dom';
import { ListItem, ListItemIcon, ListItemText } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import BranchProducts from './pages/BranchProducts';
import Purchases from './pages/Purchases';
import StockTransfers from './pages/StockTransfers';
import POS from './pages/POS';

// Create theme with consistent breakpoints and z-index values
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  zIndex: {
    drawer: 1000,
    appBar: 1100,
    modal: 1300,
    popover: 1300,
    overlay: 1050
  },
});

// Placeholder components for routes
// const SalesHistory = () => <div className="page-content">Sales History</div>;
const Categories = () => <div className="page-content">Categories</div>;
const BranchAssignment = () => <div className="page-content">Branch Assignment</div>;
const ProductAssignment = () => <div className="page-content">Product Assignment</div>;
const EmployeeManagement = () => <div className="page-content">Employee Management</div>;
const Transactions = () => <div className="page-content">Transactions</div>;
const Reports = () => <div className="page-content">Reports</div>;
const Support = () => <div className="page-content">Support</div>;

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleClickOutside = (event) => {
    if (isMobile && isSidebarOpen) {
      // Check if click is outside the sidebar
      const sidebar = document.querySelector('.sidebar');
      if (sidebar && !sidebar.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/signin" />} />
          <Route path="/signin" element={<SignIn />} />

          {/* Protected routes with layout */}
          <Route path="/*" element={
            <div className="App" onClick={handleClickOutside}>
              <Sidebar isOpen={isSidebarOpen} />
              <Topbar toggleSidebar={toggleSidebar} />
              <div className={`main-content ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
                <Routes>
                  {/* Admin Dashboard */}
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  
                  {/* Other routes... */}
                  <Route path="/pos" element={<POS />} />
                  <Route path="/sales-history" element={<SalesHistory />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/branch-assignment" element={<BranchAssignment />} />
                  <Route path="/product-assignment" element={<ProductAssignment />} />
                  <Route path="/employees" element={<ManageEmployee />} /> {/* Updated to match sidebar path */}
                  <Route path="/manage-roles" element={<ManageRoles />} />
                  <Route path="/payment-methods" element={<PaymentAccounts />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/manage-suppliers" element={<ManageSuppliers />} />
                  <Route path="/branches" element={<ManageBranches />} />
                  <Route path="/login-status" element={<ManageLoginStatus />} />
                  <Route path="/debtors-account" element={<Debtors />} />
                  <Route path="/manage-products" element={<ManageProducts />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/price-groups" element={<PriceGroups />} />
                  <Route path="/branch-prices" element={<BranchPrices />} />
                  <Route path="/all-branch-prices" element={<AllBranchPrices />} />
                  <Route path="/stock-transfers" element={<StockTransfers />} />
                  <Route path="/branch-products" element={<BranchProducts />} />
                  <Route path="/purchases" element={<Purchases />} />
                  {/* Optional: Change default redirect to dashboard instead of sales-history */}
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
