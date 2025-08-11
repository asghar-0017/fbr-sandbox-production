import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthProvider";
import { useTenantSelection } from "../Context/TenantSelectionProvider";
import { Box, Alert, Button } from "@mui/material";

const TenantSelectionPrompt = ({ children }) => {
  const { user } = useAuth();
  const { selectedTenant } = useTenantSelection();
  const navigate = useNavigate();

  // Show the message for all users when no tenant is selected
  if (!selectedTenant) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          p: 3,
          textAlign: "center",
        }}
      >
        <Alert
          severity="warning"
          sx={{
            maxWidth: 500,
            mb: 3,
            "& .MuiAlert-message": {
              fontSize: "1.1rem",
              fontWeight: 500,
            },
          }}
        >
          Please select a Company to continue
        </Alert>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate("/tenant-management")}
          sx={{ mt: 2 }}
        >
          Select Company
        </Button>
      </Box>
    );
  }

  return children;
};

export default TenantSelectionPrompt;
