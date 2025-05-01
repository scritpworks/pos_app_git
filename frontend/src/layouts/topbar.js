import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu as MenuIcon,
  ShoppingCart as CartIcon,
  Mail as MailIcon,
  NotificationsNone as NotificationIcon,
  Circle as CircleIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  AccountBalanceWallet as WalletIcon,
  Help as HelpIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { Badge, IconButton, Popover, Typography, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import './topbar.css';

const Topbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [messageAnchor, setMessageAnchor] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Order Completed',
      text: 'Order #1234 has been successfully processed',
      time: '5 min ago',
      unread: true
    },
    {
      id: 2,
      type: 'warning',
      title: 'Low Stock Alert',
      text: 'Product "Coffee Beans" is running low on stock',
      time: '10 min ago',
      unread: true
    },
    {
      id: 3,
      type: 'error',
      title: 'Payment Failed',
      text: 'Transaction for Order #1235 failed to process',
      time: '15 min ago',
      unread: true
    },
    {
      id: 4,
      type: 'info',
      title: 'New Feature Available',
      text: 'Check out our new inventory management system',
      time: '1 hour ago',
      unread: false
    }
  ]);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleMessageClick = (event) => {
    setMessageAnchor(event.currentTarget);
  };

  const handleMessageClose = () => {
    setMessageAnchor(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      unread: false
    })));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const unreadCount = notifications.filter(notification => notification.unread).length;

  const messages = [
    {
      id: 1,
      sender: 'John Doe',
      avatar: 'JD',
      message: 'New order has been placed #123',
      time: '5 min ago',
      unread: true
    },
    {
      id: 2,
      sender: 'Sarah Smith',
      avatar: 'SS',
      message: 'Stock update for Product XYZ',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      sender: 'Mike Johnson',
      avatar: 'MJ',
      message: 'Monthly sales report ready',
      time: '2 hours ago',
      unread: true
    },
    {
      id: 4,
      sender: 'Anna White',
      avatar: 'AW',
      message: 'New supplier registration',
      time: '3 hours ago',
      unread: false
    }
  ];

  const handleProfileClick = (event) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchor(null);
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setIsLogoutDialogOpen(true);
  };

  const handleLogoutCancel = () => {
    setIsLogoutDialogOpen(false);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    
    try {
      // Simulate logout process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here you would typically clear any auth tokens, user data, etc.
      
      handleProfileClose();
      setIsLogoutDialogOpen(false);
      navigate('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <IconButton className="toggle-button" onClick={toggleSidebar}>
          <MenuIcon />
        </IconButton>
        <h1 className="brand-title">FlexPOS</h1>
      </div>
      
      <div className="topbar-right">
        <IconButton className="icon-button">
          <Badge badgeContent={4} color="error">
            <CartIcon />
          </Badge>
        </IconButton>
        
        <IconButton className="icon-button" onClick={handleMessageClick}>
          <Badge badgeContent={4} color="error">
            <MailIcon />
          </Badge>
        </IconButton>
        
        <IconButton className="icon-button" onClick={handleNotificationClick}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        
        <div className="profile-badge" onClick={handleProfileClick}>
          <span>JD</span>
        </div>

        <Popover
          open={Boolean(messageAnchor)}
          anchorEl={messageAnchor}
          onClose={handleMessageClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            elevation: 4,
            sx: { 
              mt: 1,
              maxHeight: '80vh',
              overflow: 'hidden',
              zIndex: 1300
            }
          }}
          slotProps={{
            paper: {
              sx: {
                overflow: 'hidden'
              }
            }
          }}
          sx={{
            zIndex: 1300
          }}
          disablePortal={isMobile}
        >
          <div className="message-dropdown">
            <div className="message-header">
              <Typography variant="h6">Messages</Typography>
              <Typography variant="body2" color="textSecondary">
                {messages.filter(m => m.unread).length} New Messages
              </Typography>
            </div>
            <div className="message-list">
              {messages.map((message) => (
                <div key={message.id} className={`message-item ${message.unread ? 'unread' : ''}`}>
                  <Avatar className="message-avatar">{message.avatar}</Avatar>
                  <div className="message-content">
                    <div className="message-top">
                      <Typography variant="subtitle2" className="sender-name">
                        {message.sender}
                      </Typography>
                      <Typography variant="caption" className="message-time">
                        {message.time}
                      </Typography>
                    </div>
                    <Typography variant="body2" className="message-text">
                      {message.message}
                    </Typography>
                  </div>
                  {message.unread && <CircleIcon className="unread-indicator" />}
                </div>
              ))}
            </div>
            <div className="message-footer">
              <Typography variant="button" className="view-all">
                View All Messages
              </Typography>
            </div>
          </div>
        </Popover>

        <Popover
          open={Boolean(notificationAnchorEl)}
          anchorEl={notificationAnchorEl}
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            elevation: 4,
            sx: { 
              mt: 1,
              maxHeight: '80vh',
              overflow: 'hidden',
              zIndex: 1300
            }
          }}
          slotProps={{
            paper: {
              sx: {
                overflow: 'hidden'
              }
            }
          }}
          sx={{
            zIndex: 1300
          }}
          disablePortal={isMobile}
        >
          <div className="notification-dropdown">
            <div className="notification-header">
              <Typography variant="h6">Notifications</Typography>
              <Typography variant="body2" color="textSecondary">
                {unreadCount} New
              </Typography>
            </div>
            <div className="notification-list">
              {notifications.map((notification) => (
                <div key={notification.id} className={`notification-item ${notification.unread ? 'unread' : ''}`}>
                  <div className={`notification-icon ${notification.type}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      <Typography variant="subtitle2">
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" className="notification-time">
                        {notification.time}
                      </Typography>
                    </div>
                    <Typography variant="body2" className="notification-text">
                      {notification.text}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
            <div className="notification-footer">
              <Typography 
                component="a" 
                href="#" 
                className="mark-all-read" 
                onClick={(e) => {
                  e.preventDefault();
                  handleMarkAllRead();
                }}
              >
                Mark all as read
              </Typography>
              <Typography 
                component="a" 
                href="#" 
                className="view-all"
                onClick={(e) => e.preventDefault()}
              >
                View all notifications
              </Typography>
            </div>
          </div>
        </Popover>

        <Dialog
          open={isLogoutDialogOpen}
          onClose={handleLogoutCancel}
          sx={{
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            },
            zIndex: 9999
          }}
          PaperProps={{
            sx: { 
              width: '100%',
              maxWidth: '400px',
              borderRadius: '16px',
              bgcolor: '#fff',
              p: 3,
              position: 'relative',
              zIndex: 9999
            }
          }}
          slotProps={{
            backdrop: {
              sx: {
                zIndex: 9998
              }
            }
          }}
        >
          <DialogTitle sx={{ 
            textAlign: 'center',
            fontSize: 24,
            fontWeight: 500,
            p: 0,
            mb: 2
          }}>
            Confirm Logout
          </DialogTitle>
          <DialogContent sx={{ 
            textAlign: 'center',
            p: 0,
            mb: 3
          }}>
            <Typography sx={{
              color: 'text.secondary',
              fontSize: 16
            }}>
              Are you sure you want to logout?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ 
            justifyContent: 'center',
            gap: 2,
            p: 0
          }}>
            <Button 
              onClick={handleLogoutCancel}
              disabled={isLoggingOut}
              variant="outlined"
              sx={{
                width: 120,
                height: 40,
                borderRadius: 2,
                borderColor: 'rgba(0, 0, 0, 0.23)',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                  bgcolor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              CANCEL
            </Button>
            <Button 
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
              variant="contained"
              sx={{
                width: 120,
                height: 40,
                borderRadius: 2,
                bgcolor: 'rgb(26, 32, 53)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgb(26, 32, 53)'
                }
              }}
            >
              {isLoggingOut ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'LOGOUT'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        <Popover
          open={Boolean(profileAnchor)}
          anchorEl={profileAnchor}
          onClose={handleProfileClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            elevation: 4,
            sx: { 
              mt: 1,
              overflow: 'hidden',
              zIndex: 1400
            }
          }}
          sx={{
            zIndex: 1400
          }}
          disablePortal={false}
        >
          <div className="profile-dropdown">
            <div className="profile-header">
              <Avatar className="profile-avatar">JD</Avatar>
              <Typography className="profile-name">John Doe</Typography>
              <Typography className="profile-role">Store Manager</Typography>
            </div>
            
            <div className="profile-menu">
              <a href="#" className="profile-menu-item" onClick={(e) => e.preventDefault()}>
                <PersonIcon className="icon" />
                <span className="text">My Profile</span>
              </a>
              <a href="#" className="profile-menu-item" onClick={(e) => e.preventDefault()}>
                <WalletIcon className="icon" />
                <span className="text">My Wallet</span>
              </a>
              <a href="#" className="profile-menu-item" onClick={(e) => e.preventDefault()}>
                <SettingsIcon className="icon" />
                <span className="text">Settings</span>
              </a>
              <a href="#" className="profile-menu-item" onClick={(e) => e.preventDefault()}>
                <HelpIcon className="icon" />
                <span className="text">Help & Support</span>
              </a>
            </div>
            
            <div className="profile-footer">
              <a href="#" className="logout-button" onClick={handleLogoutClick}>
                <LogoutIcon className="icon" />
                <span>Logout</span>
              </a>
            </div>
          </div>
        </Popover>
      </div>
    </div>
  );
};

export default Topbar; 