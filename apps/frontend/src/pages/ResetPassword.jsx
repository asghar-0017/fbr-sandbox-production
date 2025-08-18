import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextField,
  Paper,
  Typography,
  Box,
  Avatar,
  InputAdornment,
  IconButton,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../Context/AuthProvider";
import axios from "axios";
import { API_CONFIG } from "../API/Api";
import { toast } from "react-toastify";

const { apiKeyLocal } = API_CONFIG;

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleClickShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (newPassword !== confirmPassword) {
      const errorMsg = "Passwords do not match!";
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setError(errorMsg);
      setLoading(false);
      return;
    }

    // Password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      const errorMsg =
        "Password must be at least 8 characters long and contain uppercase, lowercase, and number";
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setError(errorMsg);
      setLoading(false);
      return;
    }

    const email = localStorage.getItem("email");
    const code = localStorage.getItem("resetCode");
    console.log("Email in localStorage:", email);
    console.log("Reset code in localStorage:", code);

    if (!email) {
      const errorMsg = "Email not found. Please try again.";
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setError(errorMsg);
      setLoading(false);
      return;
    }

    if (!code) {
      const errorMsg = "Reset code not found. Please verify your code first.";
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setError(errorMsg);
      setLoading(false);
      return;
    }

    console.log("Sending reset request with:", { email, code, newPassword });

    try {
      const response = await axios.put(`${apiKeyLocal}/auth/reset-password`, {
        email,
        code,
        newPassword,
      });

      console.log("Reset response:", response);

      if (response.data.success) {
        // Clear stored data
        localStorage.removeItem("email");
        localStorage.removeItem("resetCode");

        // Show success toast and navigate
        toast.success(
          "Password reset successfully! Please login with your new password.",
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
        navigate("/login");
      } else {
        const errorMsg = response.data.message || "Failed to reset password";
        toast.error(errorMsg, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setError(errorMsg);
      }
    } catch (error) {
      console.error("Reset error:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Failed to reset password. Please try again.";
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row lg:h-screen">
      {/* Reset Password Form Section */}
      <div className="flex-1 bg-[#EDEDED] flex justify-center items-center p-4 lg:p-6 order-2 lg:order-1">
        <Paper
          elevation={6}
          sx={{
            padding: { xs: 2, sm: 3 },
            width: "100%",
            maxWidth: { xs: 350, sm: 420 },
            minHeight: { xs: "auto", sm: 420 },
            textAlign: "center",
            borderRadius: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Typography
              variant="h4"
              component="p"
              sx={{
                fontSize: { xs: "1.5rem", sm: "2rem" },
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Reset Password
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "gray",
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
              }}
            >
              Enter your new password below
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              variant="outlined"
              size="small"
              fullWidth
              margin="normal"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowNewPassword}
                      edge="end"
                      disableRipple
                      sx={{
                        "&:focus": {
                          outline: "none",
                        },
                      }}
                    >
                      {showNewPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              variant="outlined"
              size="small"
              fullWidth
              margin="normal"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                      disableRipple
                      sx={{
                        "&:focus": {
                          outline: "none",
                        },
                      }}
                    >
                      {showConfirmPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Typography
                color="error"
                variant="body2"
                sx={{ mt: 1, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              size="small"
              fullWidth
              disabled={loading}
              sx={{
                mt: { xs: 3, sm: 5 },
                backgroundColor: "#2655A2",
                height: { xs: 40, sm: 44 },
                borderRadius: 2,
                fontSize: { xs: "0.875rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "#1e4082",
                },
                "&:disabled": {
                  backgroundColor: "#ccc",
                },
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => navigate("/otp")}
              sx={{
                mt: 2,
                borderColor: "#2655A2",
                color: "#2655A2",
                height: { xs: 40, sm: 44 },
                borderRadius: 2,
                fontSize: { xs: "0.875rem", sm: "1rem" },
                "&:hover": {
                  borderColor: "#1e4082",
                  backgroundColor: "rgba(38, 85, 162, 0.04)",
                },
              }}
            >
              Back to OTP Verification
            </Button>
          </form>
        </Paper>
      </div>

      {/* Branding Section */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-6 order-1 lg:order-2 bg-white min-h-[50vh] lg:h-full lg:min-h-0">
        {/* Top Logos */}
        <div className="w-full flex justify-between items-center mb-4 lg:mb-6 max-w-md lg:max-w-lg">
          <img
            className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain"
            src="images/fbr-logo-1.png"
            alt="FBR Logo"
          />
          <img
            className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain"
            src="images/pral.png"
            alt="PRAL Logo"
          />
        </div>

        {/* Top Border Line */}
        <div className="w-full max-w-md lg:max-w-lg border-b-2 border-[#FB5B24] mb-4 lg:mb-6"></div>

        {/* Main Image and Text */}
        <div className="flex flex-col justify-center items-center flex-1 max-w-md lg:max-w-lg">
          <div className="relative w-full flex justify-center mb-4">
            <img
              src="images/innovative.png"
              className="w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 object-contain"
              alt="Innovation Logo"
            />
          </div>

          <Typography
            variant="h5"
            component="p"
            sx={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: { xs: "1rem", sm: "1.25rem", lg: "1.5rem" },
              lineHeight: 1.4,
              color: "#333",
              mb: 2,
            }}
          >
            FBR Digital Invoicing is Easy Now <br /> With INPL
          </Typography>
        </div>

        {/* Bottom Border Line */}
        <div className="w-full max-w-md lg:max-w-lg border-b-2 border-[#FB5B24] mt-4 lg:mt-6"></div>
      </div>
    </div>
  );
};

export default ResetPassword;
