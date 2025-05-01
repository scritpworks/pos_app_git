// apiConfig.js
import { useNavigate } from 'react-router-dom';
const isDevelopment = process.env.NODE_ENV === 'development';

export const BASE_URL = isDevelopment
    ? 'http://localhost:5000'
    : 'http://192.168.0.2:5000';

export const API_ENDPOINTS = {
  login: `${BASE_URL}/api/login`,
  changePassword: `${BASE_URL}/api/change-password`,
  employees: `${BASE_URL}/api/employees`,
  deleteEmployee: (id) => `${BASE_URL}/api/employees/${id}`,
  loginStatus: `${BASE_URL}/api/login-status`,
  branches: `${BASE_URL}/api/branches`,
  branchById: (id) => `${BASE_URL}/api/branches/${id}`,
  roles: `${BASE_URL}/api/roles`,
  roleById: (id) => `${BASE_URL}/api/roles/${id}`,
  permissions: `${BASE_URL}/api/permissions`,
  settings: `${BASE_URL}/api/settings`
};

export const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};
