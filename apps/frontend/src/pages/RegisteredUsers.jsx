import React, { useEffect, useState } from "react";
import {API_CONFIG} from "../API/Api";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Modal,
  TextField,
  IconButton,
  Divider,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { green, red } from "@mui/material/colors";
import Swal from "sweetalert2";

const { apiKeyLocal } = API_CONFIG;

export const RegisteredUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const theme = useTheme();

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiKeyLocal}/get-users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to delete this user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${apiKeyLocal}/delete-user/${userId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) throw new Error("Failed to delete user");

          Swal.fire("Deleted!", "User has been deleted.", "success");
          fetchUsers();
        } catch (err) {
          Swal.fire("Error!", err.message, "error");
        }
      }
    });
  };

  const handleUpdateUser = (userId) => {
    const user = users.users.find((u) => u._id === userId);
    if (user) {
      setSelectedUser({ ...user, password: "" });
      setModalOpen(true);
    }
  };

  const handleSaveUser = async (updatedData) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${apiKeyLocal}/update-user/${selectedUser._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) throw new Error("Failed to update user");

      Swal.fire("Success!", "User updated successfully.", "success");
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      Swal.fire("Error!", err.message, "error");
      // Don't close modal on error - let user fix the issue
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <Box
          sx={{
            textAlign: "center",
            p: 4,
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.palette.background.default,
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Box sx={{ p: { xs: 1, md: 4 } }}>
          <Typography
            variant="h6"
            sx={{
              mb: 3,
              fontWeight: "bold",
              color: theme.palette.primary.main,
              textAlign: "left",
            }}
          >
            Registered Users
          </Typography>

          <TableContainer
            component={Paper}
            elevation={3}
            sx={{
              borderRadius: 2,
              overflowX: "auto",
            }}
          >
            <Table
              sx={{
                minWidth: 650,
                "& th, & td": { whiteSpace: "nowrap", textAlign: "center" },
              }}
              aria-label="users table"
            >
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                  {[
                    "First Name",
                    "Last Name",
                    "Email",
                    "Role",
                    "Sandbox Test Token",
                    "Sandbox Publish Token",
                    "Actions",
                  ].map((heading) => (
                    <TableCell
                      key={heading}
                      align="center"
                      sx={{
                        color: theme.palette.primary.contrastText,
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                      }}
                    >
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {users.users && users.users.length > 0 ? (
                  users.users.map((user, index) => (
                    <TableRow
                      key={user._id || index}
                      sx={{
                        "&:nth-of-type(odd)": {
                          backgroundColor: theme.palette.action.hover,
                        },
                        "&:hover": {
                          backgroundColor: theme.palette.action.selected,
                        },
                        transition: "background-color 0.3s",
                      }}
                    >
                      <TableCell component="th" scope="row" align="center">
                        {user.firstName}
                      </TableCell>
                      <TableCell align="center">{user.lastName}</TableCell>
                      <TableCell align="center">{user.email}</TableCell>
                      <TableCell align="center">{user.role}</TableCell>
                      <TableCell align="center">
                        {user.sandBoxTestToken}
                      </TableCell>
                      <TableCell align="center">
                        {user.sandBoxPublishToken}
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          <Button
                            variant="outlined"
                            onClick={() => handleUpdateUser(user._id)}
                            size="small"
                            startIcon={<EditIcon />}
                            sx={{
                              textTransform: "none",
                              borderRadius: 2,
                              fontSize: "0.75rem",
                              padding: "4px 10px",
                              color: green[700],
                              borderColor: green[700],
                              "&:hover": {
                                backgroundColor: green[700],
                                color: "white",
                                borderColor: green[700],
                              },
                            }}
                          >
                            Update
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleDeleteUser(user._id)}
                            startIcon={<DeleteIcon />}
                            sx={{
                              textTransform: "none",
                              borderRadius: 2,
                              fontSize: "0.75rem",
                              padding: "4px 10px",
                              color: red[700],
                              borderColor: red[700],
                              "&:hover": {
                                backgroundColor: red[700],
                                color: "white",
                                borderColor: red[700],
                              },
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {error && (
            <Typography
              color="error"
              align="center"
              sx={{ mt: 2, fontWeight: "bold" }}
            >
              {error}
            </Typography>
          )}
        </Box>
      )}

      <UpdateUserModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        userData={selectedUser}
        handleSave={handleSaveUser}
        isLoading={modalLoading}
      />
    </>
  );
};

const UpdateUserModal = ({
  open,
  handleClose,
  userData,
  handleSave,
  isLoading,
}) => {
  const [formData, setFormData] = useState(userData || {});

  useEffect(() => {
    setFormData(userData || {});
  }, [userData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update it!",
    }).then((result) => {
      if (result.isConfirmed) {
        handleSave(formData);
      }
    });
  };

  return (
    <Modal sx={{ zIndex: 900 }} open={open} onClose={handleClose}>
      <Box
        sx={{
          maxWidth: 400,
          mx: "auto",
          mt: 20,
          background: "rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(100px)",
          WebkitBackdropFilter: "blur(100px)",
          borderRadius: 4,
          boxShadow: 24,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          position: "relative",
          p: 3,
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{ position: "absolute", top: 8, right: 8, color: "white" }}
          size="small"
        >
          <CloseIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            mb: 1,
            textAlign: "center",
            fontWeight: "bold",
            color: "white",
          }}
        >
          Update User
        </Typography>

        <Divider sx={{ mb: 2, bgcolor: "rgba(255, 255, 255, 0.3)" }} />

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <TextField
            variant="outlined"
            label="First Name"
            name="firstName"
            value={formData.firstName || ""}
            onChange={handleChange}
            fullWidth
            required
            InputLabelProps={{
              sx: {
                color: "white",
                "&.Mui-focused": {
                  color: "white",
                },
              },
            }}
            InputProps={{
              sx: {
                color: "white",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
              },
            }}
          />

          <TextField
            variant="outlined"
            label="Last Name"
            name="lastName"
            value={formData.lastName || ""}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{
              sx: {
                color: "white",
                "&.Mui-focused": {
                  color: "white",
                },
              },
            }}
            InputProps={{
              sx: {
                color: "white",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
              },
            }}
          />

          <TextField
            variant="outlined"
            label="Email"
            name="email"
            value={formData.email || ""}
            onChange={handleChange}
            fullWidth
            disabled
            InputLabelProps={{
              sx: {
                color: "white",
                "&.Mui-focused": {
                  color: "white",
                },
              },
            }}
            InputProps={{
              sx: {
                color: "white",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
              },
            }}
          />

          <TextField
            variant="outlined"
            label="Sandbox Test Token"
            name="sandBoxTestToken"
            value={formData.sandBoxTestToken || ""}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{
              sx: {
                color: "white",
                "&.Mui-focused": {
                  color: "white",
                },
              },
            }}
            InputProps={{
              sx: {
                color: "white",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
              },
            }}
          />

          <TextField
            variant="outlined"
            label="Sandbox Publish Token"
            name="sandBoxPublishToken"
            value={formData.sandBoxPublishToken || ""}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{
              sx: {
                color: "white",
                "&.Mui-focused": {
                  color: "white",
                },
              },
            }}
            InputProps={{
              sx: {
                color: "white",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
              },
            }}
          />

          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isLoading}
            sx={{ mt: 1 }}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Box>
    </Modal>
  );
};
