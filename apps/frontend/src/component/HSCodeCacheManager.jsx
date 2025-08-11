import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Refresh, Clear, Info } from '@mui/icons-material';
import hsCodeCache from '../utils/hsCodeCache';

const HSCodeCacheManager = ({ environment = "sandbox" }) => {
  const [cacheStatus, setCacheStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Load cache status
  const loadCacheStatus = () => {
    const status = hsCodeCache.getCacheStatus();
    setCacheStatus(status);
  };

  useEffect(() => {
    loadCacheStatus();
  }, []);

  // Refresh cache
  const handleRefreshCache = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      await hsCodeCache.refreshCache(environment);
      setMessage({
        type: 'success',
        text: 'Cache refreshed successfully!'
      });
      loadCacheStatus();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Failed to refresh cache: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear cache
  const handleClearCache = () => {
    hsCodeCache.clearCache();
    setMessage({
      type: 'info',
      text: 'Cache cleared successfully!'
    });
    loadCacheStatus();
  };

  if (!cacheStatus) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
        <CardContent>
          <CircularProgress size={20} />
          <Typography variant="body2" sx={{ ml: 1 }}>
            Loading cache status...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Info sx={{ mr: 1 }} />
          <Typography variant="h6">
            HS Code Cache Manager
          </Typography>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Cache Status
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${cacheStatus.cacheSize} codes cached`}
              color={cacheStatus.hasCache ? "primary" : "default"}
              variant="outlined"
            />
            <Chip
              label={cacheStatus.isValid ? "Valid" : "Expired"}
              color={cacheStatus.isValid ? "success" : "warning"}
              variant="outlined"
            />
            {cacheStatus.isLoading && (
              <Chip
                label="Loading..."
                color="info"
                variant="outlined"
                icon={<CircularProgress size={16} />}
              />
            )}
          </Box>
        </Box>

        {cacheStatus.timestamp && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Last Updated: {cacheStatus.timestamp}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefreshCache}
            disabled={loading}
            size="small"
          >
            Refresh Cache
          </Button>
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={handleClearCache}
            disabled={loading}
            size="small"
            color="warning"
          >
            Clear Cache
          </Button>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
          Environment: {environment}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default HSCodeCacheManager; 