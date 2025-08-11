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
import { useAuth } from "../Context/AuthProvider";
import axios from "axios";
import { API_CONFIG } from "../API/Api";

const { apiKeyLocal } = API_CONFIG;

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    const email = localStorage.getItem("email");
    console.log("Email in localStorage:", email);

    if (!email) {
      setError("Email not found. Please try again.");
      setLoading(false);
      return;
    }

    console.log("Sending reset request with:", { email, newPassword });

    try {
      const response = await axios.put(`${apiKeyLocal}/reset-password`, {
        email,
        newPassword,
      });

      console.log("Reset response:", response);
      // Optionally navigate
      navigate("/login");
    } catch (error) {
      console.error("Reset error:", error);
      setError(`Reset failed. ${error.message || "Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="professional-form"
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
          padding: 3,
          width: 320,
          textAlign: "center",
          borderRadius: 3,
        }}
      >
        <Avatar sx={{ bgcolor: "#2193b0", margin: "0 auto 10px" }}>
          <LockIcon />
        </Avatar>
        <Typography variant="h5" gutterBottom>
          Reset Password
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="New Password"
            variant="outlined"
            type="password"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <TextField
            label="Confirm Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            size="small"
            fullWidth
            sx={{ mt: 2, backgroundColor: "#2193b0", height: 36 }}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ResetPassword;
