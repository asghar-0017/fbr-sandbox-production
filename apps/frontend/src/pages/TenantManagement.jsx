import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthProvider';
import { useTenantSelection } from '../Context/TenantSelectionProvider';
import { api } from '../API/Api';
import Swal from 'sweetalert2';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

const TenantManagement = () => {
  const { user } = useAuth();
  const { selectedTenant, selectTenant } = useTenantSelection();
  const navigate = useNavigate();
  
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/admin/tenants');
      
      if (response.data.success) {
        console.log('Fetched Company:', response.data.data);
        setTenants(response.data.data);
      } else {
        setError('Failed to fetch Company');
      }
    } catch (error) {
      console.error('Error fetching Company:', error);
      setError(error.response?.data?.message || 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTenant = async (tenant) => {
    await selectTenant(tenant);
    
    Swal.fire({
      icon: 'success',
      title: 'Company Selected',
      text: `Now working with ${tenant.sellerBusinessName}`,
      timer: 2000,
      showConfirmButton: false
    }).then(() => {
      // Navigate to create invoice form and reload the page
      navigate('/', { replace: true });
      // Use setTimeout to ensure the navigation completes before reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Select Company
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Welcome!</strong> Please select a company to work with. Each company has its own separate database for invoices and buyers.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {selectedTenant && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Currently working with: <strong>{selectedTenant.sellerBusinessName}</strong>
        </Alert>
      )}

      <Grid container spacing={3}>
        {tenants.map((tenant) => (
          <Grid item xs={12} sm={6} lg={4} key={tenant.tenant_id}>
            <Card 
              sx={{ 
                height: '100%',
                border: selectedTenant?.tenant_id === tenant.tenant_id ? 2 : 1,
                borderColor: selectedTenant?.tenant_id === tenant.tenant_id ? 'primary.main' : 'divider'
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center">
                    <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2" noWrap>
                      {tenant.sellerBusinessName}
                    </Typography>
                  </Box>
                  <Chip 
                    label={tenant.is_active ? 'Active' : 'Inactive'} 
                    color={tenant.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center">
                    <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
                    {tenant.sellerNTNCNIC}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center">
                    <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                    {tenant.sellerProvince}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {tenant.sellerAddress}
                </Typography>

                <Box display="flex" justifyContent="center" alignItems="center">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleSelectTenant(tenant)}
                    disabled={!tenant.is_active}
                    fullWidth
                  >
                    {selectedTenant?.tenant_id === tenant.tenant_id ? 'Selected' : 'Select'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TenantManagement; 