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
          sx={{
            width: "100%",
            backgroundColor: "rgba(255, 245, 245, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 0, 0, 0.1)",
            color: "#d32f2f",
          }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Animated liquid background */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 1299,
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(119, 167, 255, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)
          `,
          animation: "liquidFloat 6s ease-in-out infinite alternate",
          "@keyframes liquidFloat": {
            "0%": {
              transform: "scale(1) rotate(0deg)",
            },
            "100%": {
              transform: "scale(1.1) rotate(2deg)",
            },
          },
        }}
      />

      {/* Main modal backdrop */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(8px)",
          zIndex: 1300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 2,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            width: { xs: "100%", sm: 450 },
            maxWidth: 450,
            borderRadius: 4,
            position: "relative",
            // Frosted glass effect like Apple notifications
            backgroundColor: "rgba(255, 255, 255, 0.55)",
            backdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.12),
              0 2px 8px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.6)
            `,
            // Smooth entrance animation
            animation: "modalSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            "@keyframes modalSlideUp": {
              "0%": {
                opacity: 0,
                transform: "translateY(30px) scale(0.95)",
              },
              "100%": {
                opacity: 1,
                transform: "translateY(0) scale(1)",
              },
            },
          }}
        >
          {/* Close button with hover effect */}
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              backgroundColor: "rgba(0, 0, 0, 0.05)",
              color: "#666",
              width: 36,
              height: 36,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                transform: "scale(1.1)",
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Title with modern typography */}
          <Typography
            variant="h5"
            fontWeight={600}
            align="center"
            gutterBottom
            sx={{
              color: "#1a1a1a",
              mt: 1,
              mb: 3,
              letterSpacing: "-0.02em",
              fontSize: { xs: "1.4rem", sm: "1.5rem" },
            }}
          >
            {buyer ? "Edit Buyer" : "Add Buyer"}
          </Typography>

          {/* Form container */}
          <Box component="form" onSubmit={handleSave} sx={{ width: "100%" }}>
            <Stack spacing={3}>
              {/* Modern text fields with frosted styling */}
              <TextField
                label="NTN/CNIC"
                name="buyerNTNCNIC"
                value={formData.buyerNTNCNIC}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                placeholder="Enter NTN/CNIC"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 2,
                    "& fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                      borderWidth: 1,
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.2)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#007AFF",
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#1a1a1a",
                    fontWeight: 500,
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "#1a1a1a",
                    fontWeight: 400,
                  },
                }}
              />

              <TextField
                label="Business Name"
                name="buyerBusinessName"
                value={formData.buyerBusinessName}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 2,
                    "& fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.2)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#007AFF",
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#1a1a1a",
                    fontWeight: 500,
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "#1a1a1a",
                  },
                }}
              />

              <FormControl
                fullWidth
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 2,
                    "& fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.2)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#007AFF",
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#1a1a1a",
                    fontWeight: 500,
                  },
                  "& .MuiSelect-select": {
                    color: "#1a1a1a",
                  },
                }}
              >
                <InputLabel id="buyerProvince-label">Province</InputLabel>
                <Select
                  labelId="buyerProvince-label"
                  name="buyerProvince"
                  value={formData.buyerProvince}
                  label="Province"
                  onChange={handleChange}
                  disabled={loadingProvinces}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: 2,
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                      },
                    },
                  }}
                >
                  {provinces.map((province) => (
                    <MenuItem
                      key={province.stateProvinceCode}
                      value={province.stateProvinceDesc}
                      sx={{
                        color: "#1a1a1a",
                        "&:hover": {
                          backgroundColor: "rgba(0, 122, 255, 0.1)",
                        },
                      }}
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
                multiline
                rows={2}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 2,
                    "& fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.2)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#007AFF",
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#1a1a1a",
                    fontWeight: 500,
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "#1a1a1a",
                  },
                }}
              />

              <FormControl
                fullWidth
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 2,
                    "& fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.2)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#007AFF",
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#1a1a1a",
                    fontWeight: 500,
                  },
                  "& .MuiSelect-select": {
                    color: "#1a1a1a",
                  },
                }}
              >
                <InputLabel id="buyerRegistrationType-label">
                  Registration Type
                </InputLabel>
                <Select
                  labelId="buyerRegistrationType-label"
                  name="buyerRegistrationType"
                  value={formData.buyerRegistrationType}
                  label="Registration Type"
                  onChange={handleChange}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: 2,
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                      },
                    },
                  }}
                >
                  <MenuItem
                    value="Registered"
                    sx={{
                      color: "#1a1a1a",
                      "&:hover": {
                        backgroundColor: "rgba(0, 122, 255, 0.1)",
                      },
                    }}
                  >
                    Registered
                  </MenuItem>
                  <MenuItem
                    value="Unregistered"
                    sx={{
                      color: "#1a1a1a",
                      "&:hover": {
                        backgroundColor: "rgba(0, 122, 255, 0.1)",
                      },
                    }}
                  >
                    Unregistered
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Action buttons with modern styling */}
              <Stack spacing={2} sx={{ mt: 4 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isSubmitting}
                  sx={{
                    backgroundColor: "#007AFF",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "16px",
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: "none",
                    boxShadow: "0 4px 20px rgba(0, 122, 255, 0.3)",
                    "&:hover": {
                      backgroundColor: "#0056CC",
                      transform: "translateY(-1px)",
                      boxShadow: "0 6px 25px rgba(0, 122, 255, 0.4)",
                    },
                    "&:disabled": {
                      backgroundColor: "rgba(0, 122, 255, 0.6)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress
                        size={20}
                        sx={{ mr: 1, color: "white" }}
                      />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={onClose}
                  variant="outlined"
                  fullWidth
                  sx={{
                    color: "#666",
                    borderColor: "rgba(0, 0, 0, 0.12)",
                    backgroundColor: "rgba(255, 255, 255, 0.4)",
                    backdropFilter: "blur(10px)",
                    fontWeight: 500,
                    fontSize: "16px",
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.6)",
                      borderColor: "rgba(0, 0, 0, 0.2)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default BuyerModal;
