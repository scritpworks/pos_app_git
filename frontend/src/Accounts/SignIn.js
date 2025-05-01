import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  Apple,
  Facebook,
} from '@mui/icons-material';
import './SignIn.css';
import axios from 'axios';
import { API_ENDPOINTS, getAuthHeader } from '../apiConfig/apiConfig';

const SignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    emailOrPhone: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTogglePassword = (e) => {
    e.preventDefault(); // Prevent any bubbling
    e.stopPropagation(); // Stop event propagation
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { emailOrPhone: '', password: '' };

    if (!formData.emailOrPhone) {
      newErrors.emailOrPhone = 'Email or phone number is required';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    console.log('Attempting login with:', formData); 

    try {
      const response = await axios.post(API_ENDPOINTS.login, {
        email: formData.emailOrPhone,
        password: formData.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Login response:', response.data);

      if (response.data.token) {
        const { token, user } = response.data;

        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Navigate to dashboard
        navigate('/admin-dashboard');
      } else {
        setErrors({
          ...errors,
          password: 'Invalid response from server'
        });
      }
      
    } catch (error) {
      console.error('Login error:', error); // Debug log
      
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Login failed. Please try again.';
        
      setErrors({
        ...errors,
        password: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Handle forgot password logic here
    console.log('Forgot password clicked');
  };

  const handleSocialLogin = (provider) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Handle social login logic here
    console.log(`${provider} login clicked`);
  };

  const handleSignupRequest = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Handle signup request logic here
    console.log('Signup request clicked');
  };

  return (
    <Box className="signin-container">
      <Box className="signin-card">
        <Typography variant="h4" className="signin-title">
          FlexPOS
        </Typography>
        
        <Typography variant="body1" className="signin-subtitle">
          Welcome back! Please enter your details
        </Typography>

        <Box component="form" onSubmit={handleSubmit} className="signin-form" noValidate>
          <TextField
            fullWidth
            name="emailOrPhone"
            label="Enter Email / Phone No"
            variant="outlined"
            value={formData.emailOrPhone}
            onChange={handleInputChange}
            className="signin-input"
            error={!!errors.emailOrPhone}
            helperText={errors.emailOrPhone}
            autoComplete="username"
          />

          <TextField
            fullWidth
            name="password"
            label="Passcode"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange}
            className="signin-input"
            error={!!errors.password}
            helperText={errors.password}
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={handleTogglePassword}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                    size="large"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="text"
            className="forgot-password"
            onClick={handleForgotPassword}
            onTouchStart={(e) => e.preventDefault()}
          >
            Having trouble in sign in?
          </Button>

          <Button
            fullWidth
            variant="contained"
            type="submit"
            className="signin-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="button-loading">
                <CircularProgress size={20} color="inherit" />
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign in'
            )}
          </Button>

          <Box className="divider-container">
            <Divider className="divider" />
            <Typography variant="body2" className="divider-text">
              Or Sign in with
            </Typography>
            <Divider className="divider" />
          </Box>

          <Box className="social-buttons">
            <Button
              variant="outlined"
              startIcon={<Google />}
              className="social-button"
              onClick={handleSocialLogin('Google')}
              onTouchStart={(e) => e.preventDefault()}
            >
              Google
            </Button>
            <Button
              variant="outlined"
              startIcon={<Apple />}
              className="social-button"
              onClick={handleSocialLogin('Apple')}
              onTouchStart={(e) => e.preventDefault()}
            >
              Apple ID
            </Button>
            <Button
              variant="outlined"
              startIcon={<Facebook />}
              className="social-button"
              onClick={handleSocialLogin('Facebook')}
              onTouchStart={(e) => e.preventDefault()}
            >
              Facebook
            </Button>
          </Box>

          <Button
            variant="text"
            className="signup-prompt"
            onClick={handleSignupRequest}
            onTouchStart={(e) => e.preventDefault()}
          >
            Don't have an account?{' '}
            <span className="signup-link">
              Request Now
            </span>
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SignIn;
