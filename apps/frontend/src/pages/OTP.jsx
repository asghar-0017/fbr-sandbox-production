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
import { MuiOtpInput } from "mui-one-time-password-input";
import axios from "axios";
import {API_CONFIG} from "../API/Api";

const { apiKeyLocal } = API_CONFIG;

const OTP = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (newValue) => {
    setOtp(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios
        .post(`${apiKeyLocal}/verify-reset-code`, { code: otp })
        .then((res) => {
          navigate("/reset-password");
          console.log(res);
        })
        .catch((err) => {
          console.error(err);
        });
    } catch (error) {
      setError(
        `OTP verification failed. ${error.message || "Please try again."}`
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        background: "linear-gradient(to right, #2193b0, #6dd5ed)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 4,
          width: 500,
          textAlign: "center",
          borderRadius: 3,
        }}
      >
        <Avatar sx={{ bgcolor: "#2193b0", margin: "0 auto 10px" }}>
          <LockIcon />
        </Avatar>
        <Typography variant="h5" gutterBottom>
          OTP Verification
        </Typography>
        <form onSubmit={handleSubmit}>
          <MuiOtpInput length={6} value={otp} onChange={handleChange} />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2, backgroundColor: "#2193b0" }}
          >
            {loading ? "Sending..." : "Send OTP"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default OTP;
