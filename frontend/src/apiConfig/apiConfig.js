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
    settings: `${BASE_URL}/api/settings`,
    categories: `${BASE_URL}/api/categories`,
    categoryById: (id) => `${BASE_URL}/api/categories/${id}`,
    units: `${BASE_URL}/api/units`,
    unitById: (id) => `${BASE_URL}/api/units/${id}`,
    products: `${BASE_URL}/api/products`,
    productById: (id) => `${BASE_URL}/api/products/${id}`,
    getProduct: (id) => `/api/products/${id}`,
    priceTypes: `${BASE_URL}/api/price-types`,
    priceTypeById: (id) => `${BASE_URL}/api/price-types/${id}`,
    branchProducts: `${BASE_URL}/api/branch-products`,
    updateProductPrice: `${BASE_URL}/api/products/update-price`,
    loadPriceByBranch: `${BASE_URL}/api/products/load-price-by-branch`,
    loadProductPrices: `${BASE_URL}/api/product/load-product-prices`,
    suppliers: `${BASE_URL}/api/suppliers`,
    supplierById: (id) => `${BASE_URL}/api/suppliers/${id}`,
    // Purchase endpoints
    purchases: `${BASE_URL}/api/purchases`,
    purchaseById: (id) => `${BASE_URL}/api/purchases/${id}`,
    purchaseItems: (id) => `${BASE_URL}/api/purchases/${id}/items`,
    stockTransfers: `${BASE_URL}/api/stock-transfers`,
    stockTransferStatus: (reference) => `${BASE_URL}/api/stock-transfers/${reference}/status`,
};

export const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};
