import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextField,
  Paper,
  Typography,
  Box,
  Avatar,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { Email } from "@mui/icons-material";
import axios from "axios";
import { API_CONFIG } from "../API/Api";

const { apiKeyLocal } = API_CONFIG;

const EmailVerification = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios
        .post(`${apiKeyLocal}/forget-password`, { email })
        .then((res) => {
          navigate("/otp");
          localStorage.setItem("email", email);
          console.log(res);
        })
        .catch((err) => {
          console.error(err);
        });
    } catch (error) {
      setError(
        `Email verification failed. ${error.message || "Please try again."}`
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row lg:h-screen">
      {/* Email Verification Form Section */}
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
              Email Verification
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "gray",
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
              }}
            >
              Enter your email to receive verification code
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              variant="outlined"
              size="small"
              fullWidth
              margin="normal"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              {loading ? "Sending..." : "Send Verification Code"}
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

export default EmailVerification;
