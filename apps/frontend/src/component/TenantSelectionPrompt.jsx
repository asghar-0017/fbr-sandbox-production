import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthProvider';
import { useTenantSelection } from '../Context/TenantSelectionProvider';
import { CircularProgress, Box } from '@mui/material';

const TenantSelectionPrompt = ({ children }) => {
  const { user } = useAuth();
  const { isTenantSelected } = useTenantSelection();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin' && !isTenantSelected()) {
      navigate('/tenant-management');
    }
  }, [user, isTenantSelected, navigate]);

  if (user?.role !== 'admin' || isTenantSelected()) {
    return children;
  }
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '50vh' 
    }}>
      <CircularProgress />
    </Box>
  );
};

export default TenantSelectionPrompt; 