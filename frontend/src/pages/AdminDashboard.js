import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  People as PeopleIcon,
  Store as StoreIcon,
  ShoppingCart as ProductsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const DashboardCard = ({ title, count, icon: Icon, color }) => (
  <Card sx={{ 
    height: '100%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    }
  }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          backgroundColor: `${color}15`, 
          borderRadius: '8px',
          p: 1,
          mr: 2
        }}>
          <Icon sx={{ color: color, fontSize: 24 }} />
        </Box>
        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
        {count}
      </Typography>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard 
            title="Total Employees"
            count="24"
            icon={PeopleIcon}
            color="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard 
            title="Total Branches"
            count="3"
            icon={StoreIcon}
            color="#16a34a"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard 
            title="Total Products"
            count="156"
            icon={ProductsIcon}
            color="#9333ea"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" sx={{ mt: 4, mb: 3, fontWeight: 600 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Activities
            </Typography>
            {/* Add recent activities list here */}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              System Overview
            </Typography>
            {/* Add system stats here */}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;