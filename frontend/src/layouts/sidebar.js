import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  SwapHoriz as StockTransferIcon,
  ShoppingBag as PurchasesIcon,
  History as PurchaseHistoryIcon,
  Assignment as PendingOrdersIcon,
  AccountBalance as DebtorsAccountIcon,
  People as PeopleIcon,
  AdminPanelSettings as RolesIcon,
  Payment as PaymentIcon,
  Receipt as TransactionsIcon,
  Assessment as ReportsIcon,
  LocalShipping as SuppliersIcon,
  Business as BranchesIcon,
  Help as SupportIcon,
  Settings as SettingsIcon,
  People,
  SupervisorAccount
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  
  const menuItems = [
    { title: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { title: 'Manage Products', icon: <InventoryIcon />, path: '/manage-products' },
    { title: 'Stock Transfer', icon: <StockTransferIcon />, path: '/stock-transfer' },
    { title: 'Purchases', icon: <PurchasesIcon />, path: '/purchases' },
    { title: 'Purchase History', icon: <PurchaseHistoryIcon />, path: '/purchase-history' },
    { title: 'Pending Orders', icon: <PendingOrdersIcon />, path: '/pending-orders' },
    { title: 'Debtors Account', icon: <DebtorsAccountIcon />, path: '/debtors-account' },
    { title: 'Sales History', icon: <PurchaseHistoryIcon />, path: '/sales-history' },
    {
      title: 'Employee Management',
      icon: <People />,
      path: '/employees'
    },
    { title: 'Manage Roles', icon: <RolesIcon />, path: '/manage-roles' },
    { title: 'Payment Methods', icon: <PaymentIcon />, path: '/payment-methods' },
    { title: 'Transactions', icon: <TransactionsIcon />, path: '/transactions' },
    { title: 'Reports', icon: <ReportsIcon />, path: '/reports' },
    { title: 'Manage Suppliers', icon: <SuppliersIcon />, path: '/manage-suppliers' },
    { title: 'Branches', icon: <BranchesIcon />, path: '/branches' },
    { title: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    {
      title: 'Login Status',
      icon: <SupervisorAccount />,
      path: '/login-status'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => {
          const active = isActive(item.path);
          return (
            <Tooltip 
              key={index}
              title={!isOpen ? item.title : ""}
              placement="right"
              arrow
            >
              <Link
                to={item.path}
                className={`nav-link ${active ? 'active' : ''}`}
              >
                <span className="icon">{item.icon}</span>
                <span className="title">{item.title}</span>
              </Link>
            </Tooltip>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <span>FlexPOS V 3.0</span>
      </div>
    </div>
  );
};

export default Sidebar;