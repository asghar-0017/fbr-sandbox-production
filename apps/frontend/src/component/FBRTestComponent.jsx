import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { getRegistrationType } from '../API/FBRService';

const FBRTestComponent = () => {
  const [ntnCnic, setNtnCnic] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!ntnCnic) {
      setResult({ success: false, message: 'Please enter an NTN/CNIC' });
      return;
    }

    setLoading(true);
    try {
      const response = await getRegistrationType(ntnCnic);
      setResult(response);
    } catch (error) {
      setResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          FBR API Test Component
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Test the FBR registration type API integration
        </Typography>
        
        <TextField
          fullWidth
          label="NTN/CNIC"
          value={ntnCnic}
          onChange={(e) => setNtnCnic(e.target.value)}
          placeholder="Enter NTN/CNIC to test"
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          onClick={handleTest}
          disabled={loading || !ntnCnic}
          sx={{ mb: 2 }}
        >
          {loading ? 'Testing...' : 'Test API'}
        </Button>

        {result && (
          <Alert 
            severity={result.success ? 'success' : 'error'}
            sx={{ mt: 2 }}
          >
            <Typography variant="body2">
              <strong>Result:</strong> {result.message}
            </Typography>
            {result.success && result.registrationType && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Registration Type:</strong> {result.registrationType}
              </Typography>
            )}
            {result.success && result.registrationNo && (
              <Typography variant="body2">
                <strong>Registration No:</strong> {result.registrationNo}
              </Typography>
            )}
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default FBRTestComponent;
