import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Divider,
  Stack,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { fetchData } from "../API/GetApi";
import { useTenantSelection } from "../Context/TenantSelectionProvider";

const BuyerModal = ({ isOpen, onClose, onSave, buyer }) => {
  const { tokensLoaded } = useTenantSelection();
  const [formData, setFormData] = useState({
    buyerNTNCNIC: "",
    buyerBusinessName: "",
    buyerProvince: "",
    buyerAddress: "",
    buyerRegistrationType: "",
  });
  const [provinces, setProvinces] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Reset form data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset error and success states
      setErrorMessage("");
      setShowError(false);
      setIsSubmitting(false);

      if (buyer) {
        // If editing an existing buyer, populate the form
        setFormData({
          buyerNTNCNIC: buyer.buyerNTNCNIC || "",
          buyerBusinessName: buyer.buyerBusinessName || "",
          buyerProvince: buyer.buyerProvince || "",
          buyerAddress: buyer.buyerAddress || "",
          buyerRegistrationType: buyer.buyerRegistrationType || "",
        });
      } else {
        // If adding a new buyer, reset the form to empty
        setFormData({
          buyerNTNCNIC: "",
          buyerBusinessName: "",
          buyerProvince: "",
          buyerAddress: "",
          buyerRegistrationType: "",
        });
      }
    }
  }, [isOpen, buyer]);

  // Fetch provinces from API
  useEffect(() => {
    const fetchProvinces = async () => {
      if (!tokensLoaded) {
        console.log("Tokens not loaded yet, skipping province fetch");
        return;
      }

      setLoadingProvinces(true);
      try {
        const response = await fetchData("pdi/v1/provinces");
        console.log("Provinces fetched:", response);
        setProvinces(response);
        // Store in localStorage for other components to use
        localStorage.setItem("provinceResponse", JSON.stringify(response));
      } catch (error) {
        console.error("Error fetching provinces:", error);
        setProvinces([]);
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, [tokensLoaded]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Don't proceed if already submitting
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Basic validation for required fields
      const {
        buyerNTNCNIC,
        buyerBusinessName,
        buyerProvince,
        buyerAddress,
        buyerRegistrationType,
      } = formData;
      if (
        !buyerNTNCNIC ||
        !buyerBusinessName ||
        !buyerProvince ||
        !buyerAddress ||
        !buyerRegistrationType
      ) {
        throw new Error("Please fill in all required fields.");
      }

      // Proceed with saving
      onSave(formData);
    } catch (error) {
      console.error("Error during save process:", error);

      // Show error message to user
      setErrorMessage(error.message || "Error saving buyer. Please try again.");
      setShowError(true);

      // Don't close modal on error - let user fix the issue
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowError(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          bgcolor: "rgba(0,0,0,0.4)",
          zIndex: 1300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: { xs: 2, sm: 4 },
            width: { xs: "90%", sm: 400 },
            borderRadius: 4,
            position: "relative",
            background: "linear-gradient(135deg, #f6f9fc 0%, #e0e7ff 100%)",
            boxShadow: "0 8px 32px rgba(31, 38, 135, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{ position: "absolute", top: 12, right: 12, color: "#888" }}
          >
            <CloseIcon fontSize="large" />
          </IconButton>
          <Typography
            variant="h5"
            fontWeight={700}
            align="center"
            gutterBottom
            sx={{ color: "#3f51b5", mt: 1 }}
          >
            {buyer ? "Edit Buyer" : "Add Buyer"}
          </Typography>
          <Divider sx={{ width: "100%", mb: 3, borderColor: "#3f51b5" }} />
          <Box
            component="form"
            onSubmit={handleSave}
            className="professional-form"
            sx={{ width: "100%" }}
          >
            <Stack spacing={2}>
              <TextField
                label="NTN/CNIC"
                name="buyerNTNCNIC"
                value={formData.buyerNTNCNIC}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                color="primary"
                placeholder="Enter NTN/CNIC"
              />
              <TextField
                label="Business Name"
                name="buyerBusinessName"
                value={formData.buyerBusinessName}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                color="primary"
              />
              <FormControl fullWidth required>
                <InputLabel id="buyerProvince-label">Province</InputLabel>
                <Select
                  labelId="buyerProvince-label"
                  name="buyerProvince"
                  value={formData.buyerProvince}
                  label="Province"
                  onChange={handleChange}
                  disabled={loadingProvinces}
                >
                  {provinces.map((province) => (
                    <MenuItem
                      key={province.stateProvinceCode}
                      value={province.stateProvinceDesc}
                    >
                      {province.stateProvinceDesc}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Address"
                name="buyerAddress"
                value={formData.buyerAddress}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                color="primary"
              />
              <FormControl fullWidth required>
                <InputLabel id="buyerRegistrationType-label">
                  Registration Type
                </InputLabel>
                <Select
                  labelId="buyerRegistrationType-label"
                  name="buyerRegistrationType"
                  value={formData.buyerRegistrationType}
                  label="Registration Type"
                  onChange={handleChange}
                >
                  <MenuItem value="Registered">Registered</MenuItem>
                  <MenuItem value="Unregistered">Unregistered</MenuItem>
                </Select>
              </FormControl>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="small"
                fullWidth
                disabled={isSubmitting}
                sx={{
                  fontWeight: 600,
                  fontSize: "13px",
                  py: 1,
                  height: 36,
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(63, 81, 181, 0.3)",
                }}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                variant="outlined"
                color="secondary"
                size="small"
                fullWidth
                sx={{
                  fontWeight: 600,
                  fontSize: "13px",
                  py: 1,
                  height: 36,
                  borderRadius: 2,
                }}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default BuyerModal;
