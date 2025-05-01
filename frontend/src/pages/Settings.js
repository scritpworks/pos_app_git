import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS, getAuthHeader } from '../apiConfig/apiConfig';
import './Settings.css';

const Settings = () => {
  const [companyDetails, setCompanyDetails] = useState({
    name: 'FlexPOS Solutions',
    phone: '+1 (555) 123-4567',
    email: 'contact@flexpos.com',
    address: '123 Business Street, Tech City, TC 12345',
    website: 'www.flexpos.com',
    companyLogo: null,
    receiptLogo: null,
    favicon: null
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [originalDetails, setOriginalDetails] = useState(companyDetails);

  // Add loading state
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        API_ENDPOINTS.settings,
        getAuthHeader()
      );
      setCompanyDetails(response.data);
      setOriginalDetails(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Handle error (show snackbar, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setCompanyDetails({
      ...companyDetails,
      [field]: event.target.value,
    });
  };

  const handleFileUpload = (field) => (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyDetails({
          ...companyDetails,
          [field]: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Update handleSave to use API
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await axios.post(
        API_ENDPOINTS.settings,
        companyDetails,
        getAuthHeader()
      );
      
      setOriginalDetails(companyDetails);
      setSaveSuccess(true);
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      // Handle error (show snackbar, etc.)
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCompanyDetails(originalDetails);
  };

  return (
    <Box className="settings-container">
      <Typography variant="h5" className="page-title">
        Settings
      </Typography>
      <Divider className="title-divider" />

      {/* Company Details Section */}
      <div className="settings-section">
        <h2 className="section-title">
          <BusinessIcon /> Company Details
        </h2>
        <div className="company-details-grid">
          <div className="detail-field">
            <BusinessIcon className="field-icon" />
            <TextField
              fullWidth
              label="Company Name"
              variant="outlined"
              value={companyDetails.name}
              onChange={handleChange('name')}
            />
          </div>
          <div className="detail-field">
            <PhoneIcon className="field-icon" />
            <TextField
              fullWidth
              label="Phone Number"
              variant="outlined"
              value={companyDetails.phone}
              onChange={handleChange('phone')}
            />
          </div>
          <div className="detail-field">
            <EmailIcon className="field-icon" />
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              value={companyDetails.email}
              onChange={handleChange('email')}
            />
          </div>
          <div className="detail-field">
            <WebsiteIcon className="field-icon" />
            <TextField
              fullWidth
              label="Website"
              variant="outlined"
              value={companyDetails.website}
              onChange={handleChange('website')}
            />
          </div>
          <div className="detail-field full-width">
            <LocationIcon className="field-icon" />
            <TextField
              fullWidth
              label="Address"
              variant="outlined"
              value={companyDetails.address}
              onChange={handleChange('address')}
              multiline
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Company Branding Section */}
      <Paper elevation={0} className="settings-section">
        <Typography variant="h6" className="section-title">
          Customize your company's visual identity
        </Typography>

        <Box className="upload-grid">
          {/* Company Logo - Full Width */}
          <Box className="upload-grid-item full-width">
            <Paper elevation={0} className="upload-container">
              <Box className="upload-preview large">
                {companyDetails.companyLogo ? (
                  <>
                    <img src={companyDetails.companyLogo} alt="Company Logo" className="preview-image" />
                    <Button
                      className="remove-image-button"
                      onClick={() => setCompanyDetails({ ...companyDetails, companyLogo: null })}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <Box className="placeholder-image large">
                    <BusinessIcon />
                  </Box>
                )}
              </Box>
              <Box className="upload-content">
                <Typography variant="h6">Company Logo</Typography>
                <Typography variant="body2" color="textSecondary">
                  Upload your company logo. Recommended size: 400x400px
                </Typography>
                <input
                  accept="image/*"
                  id="company-logo-upload"
                  type="file"
                  hidden
                  onChange={handleFileUpload('companyLogo')}
                />
                <label htmlFor="company-logo-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<UploadIcon />}
                    className="upload-button"
                  >
                    Upload Logo
                  </Button>
                </label>
              </Box>
            </Paper>
          </Box>

          {/* Bottom Grid for Receipt Logo and Favicon */}
          <Box className="upload-grid-bottom">
            {/* Receipt Logo */}
            <Box className="upload-grid-item half-width">
              <Paper elevation={0} className="upload-container">
                <Box className="upload-preview">
                  {companyDetails.receiptLogo ? (
                    <>
                      <img src={companyDetails.receiptLogo} alt="Receipt Logo" className="preview-image" />
                      <Button
                        className="remove-image-button"
                        onClick={() => setCompanyDetails({ ...companyDetails, receiptLogo: null })}
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <Box className="placeholder-image">
                      <BusinessIcon />
                    </Box>
                  )}
                </Box>
                <Box className="upload-content">
                  <Typography variant="h6">Receipt Logo</Typography>
                  <Typography variant="body2" color="textSecondary">
                    This logo will appear on your receipts and invoices
                  </Typography>
                  <input
                    accept="image/*"
                    id="receipt-logo-upload"
                    type="file"
                    hidden
                    onChange={handleFileUpload('receiptLogo')}
                  />
                  <label htmlFor="receipt-logo-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<UploadIcon />}
                      className="upload-button"
                    >
                      Upload Logo
                    </Button>
                  </label>
                </Box>
              </Paper>
            </Box>

            {/* Favicon */}
            <Box className="upload-grid-item half-width">
              <Paper elevation={0} className="upload-container">
                <Box className="upload-preview">
                  {companyDetails.favicon ? (
                    <>
                      <img src={companyDetails.favicon} alt="Favicon" className="preview-image" />
                      <Button
                        className="remove-image-button"
                        onClick={() => setCompanyDetails({ ...companyDetails, favicon: null })}
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <Box className="placeholder-image">
                      <BusinessIcon />
                    </Box>
                  )}
                </Box>
                <Box className="upload-content">
                  <Typography variant="h6">Favicon</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Website icon that appears in browser tabs (recommended: 32x32px)
                  </Typography>
                  <input
                    accept="image/*"
                    id="favicon-upload"
                    type="file"
                    hidden
                    onChange={handleFileUpload('favicon')}
                  />
                  <label htmlFor="favicon-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<UploadIcon />}
                      className="upload-button"
                    >
                      Upload Favicon
                    </Button>
                  </label>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Paper>

      <div className="actions-container">
        <Button
          variant="outlined"
          className="cancel-button"
          onClick={handleCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          className={`save-button ${isSaving ? 'loading' : ''} ${saveSuccess ? 'success' : ''}`}
          onClick={handleSave}
          disabled={isSaving || saveSuccess}
        >
          {!isSaving && !saveSuccess ? 'Save Changes' : ' '}
        </Button>
      </div>
    </Box>
  );
};

export default Settings;
