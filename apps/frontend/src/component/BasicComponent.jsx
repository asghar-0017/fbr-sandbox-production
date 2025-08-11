import React, { useEffect, useState, useCallback } from "react";
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
  useTheme,
  CircularProgress,
  TextField,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";
import EditIcon from "@mui/icons-material/Edit";

import { api } from "../API/Api";
import SearchIcon from "@mui/icons-material/Search";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import Tooltip from "@mui/material/Tooltip";
import { useTenantSelection } from "../Context/TenantSelectionProvider";
import InvoiceViewModal from "./InvoiceViewModal";
import CustomPagination from "./CustomPagination";
import { useNavigate } from "react-router-dom";

export default function BasicTable() {
  const [invoices, setInvoices] = useState([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [saleType, setSaleType] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [invoiceDate, setInvoiceDate] = useState(null);
  const [goToPage, setGoToPage] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const theme = useTheme();
  const { selectedTenant } = useTenantSelection();
  const navigate = useNavigate();

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "draft":
        return "#ff9800"; // Orange
      case "saved":
        return "#2196f3"; // Blue
      case "validated":
        return "#9c27b0"; // Purple
      case "submitted":
        return "#ff9800"; // Orange (same as draft for now)
      case "posted":
        return "#4caf50"; // Green
      default:
        return "#757575"; // Grey
    }
  };

  // Helper function to get status display text
  const getStatusText = (status) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "saved":
        return "Saved";
      case "validated":
        return "Validated";
      case "submitted":
        return "Submitted";
      case "posted":
        return "Posted";
      default:
        return "Unknown";
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [search]);

  const getMyInvoices = async () => {
    setLoading(true);
    try {
      if (!selectedTenant) {
        console.error("No Company selected");
        setLoading(false);
        return;
      }

      // Build query parameters for server-side pagination and filtering
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", rowsPerPage.toString());

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      if (saleType && saleType !== "All") {
        params.append("sale_type", saleType);
      }

      if (statusFilter && statusFilter !== "All") {
        params.append("status", statusFilter);
      }

      if (invoiceDate) {
        params.append("start_date", dayjs(invoiceDate).format("YYYY-MM-DD"));
        params.append("end_date", dayjs(invoiceDate).format("YYYY-MM-DD"));
      }

      const response = await api.get(
        `/tenant/${selectedTenant.tenant_id}/invoices?${params.toString()}`
      );

      if (response.data.success) {
        console.log(response.data.data.invoices);
        setInvoices(response.data.data.invoices || []);
        // Update pagination info from server response
        if (response.data.data.pagination) {
          setTotalPages(response.data.data.pagination.total_pages);
          setTotalRecords(response.data.data.pagination.total_records);
        }
      } else {
        console.error("Failed to fetch invoices:", response.data.message);
        setInvoices([]);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      if (error.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
      }
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      getMyInvoices();
    }
  }, [
    selectedTenant,
    page,
    rowsPerPage,
    debouncedSearch,
    saleType,
    statusFilter,
    invoiceDate,
  ]);

  const handleButtonClick = async (invoice) => {
    try {
      if (!selectedTenant) {
        alert("No Company selected");
        return;
      }

      // Get the auth token
      const token =
        localStorage.getItem("tenantToken") || localStorage.getItem("token");
      if (!token) {
        alert("Authentication token not found");
        return;
      }

      const link = `https://fbrtestcase.inplsoftwares.online/api/print-invoice/${invoice.invoiceNumber}`;

      window.open(link, "_blank");
    } catch (error) {
      console.error("Error printing invoice:", error);
      if (error.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
      } else {
        alert("Error printing invoice. Check console for details.");
      }
    }
  };

  const handleViewInvoice = async (invoice) => {
    try {
      if (!selectedTenant) {
        alert("No Company selected");
        return;
      }

      const response = await api.get(
        `/tenant/${selectedTenant.tenant_id}/invoices/${invoice.id}`
      );

      if (response.data.success) {
        setSelectedInvoice(response.data.data);
        setViewModalOpen(true);
      } else {
        console.error("Failed to fetch invoice:", response.data.message);
        alert("Failed to fetch invoice details");
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      if (error.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
      } else {
        alert("Error fetching invoice details. Check console for details.");
      }
    }
  };

  const handleEditInvoice = async (invoice) => {
    try {
      if (!selectedTenant) {
        alert("No Company selected");
        return;
      }

      const response = await api.get(
        `/tenant/${selectedTenant.tenant_id}/invoices/${invoice.id}`
      );

      if (response.data.success) {
        setSelectedInvoice(response.data.data);

        if (invoice.status === "saved" || invoice.status === "draft") {
          // For saved and draft invoices, navigate to create form with data
          localStorage.setItem(
            "editInvoiceData",
            JSON.stringify(response.data.data)
          );
          navigate("/create-invoice");
        }
      } else {
        console.error("Failed to fetch invoice:", response.data.message);
        alert("Failed to fetch invoice details");
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      if (error.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
      } else {
        alert("Error fetching invoice details. Check console for details.");
      }
    }
  };

  // Since we're using server-side pagination, we don't need client-side filtering
  // The server handles all filtering and pagination
  const filteredInvoices = invoices || [];

  return (
    <>
      {!selectedTenant ? (
        <Box
          sx={{
            textAlign: "center",
            p: 4,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No Company Selected
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please select a Company to view invoices.
          </Typography>
        </Box>
      ) : loading ? (
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
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ p: { xs: 1, sm: 3 }, maxWidth: 1200, mx: "auto" }}>
          {/* Header Section */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                letterSpacing: 1,
                textShadow: "0 2px 8px #e3e3e3",
              }}
            >
              Your Invoices
            </Typography>
          </Box>
          {/* Search and Filter Controls */}
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search by Invoice # or Buyer NTN"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                minWidth: 260,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                },
                "& input::placeholder": {
                  fontSize: "0.8rem",
                  opacity: 1,
                },
              }}
            />
            <TextField
              select
              label="Sale Type"
              size="small"
              value={saleType}
              onChange={(e) => {
                setSaleType(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Sale Invoice">Sale Invoice</MenuItem>
              <MenuItem value="Debit Note">Debit Note</MenuItem>
            </TextField>
            <TextField
              select
              label="Status"
              size="small"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="saved">Saved</MenuItem>
              <MenuItem value="validated">Validated</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="posted">Posted</MenuItem>
            </TextField>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Invoice Date"
                value={invoiceDate}
                onChange={(val) => {
                  setInvoiceDate(val);
                  setPage(1);
                }}
                slotProps={{
                  textField: { size: "small", sx: { minWidth: 140 } },
                }}
              />
            </LocalizationProvider>
            <TextField
              select
              label="Rows per page"
              size="small"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              sx={{ minWidth: 120 }}
            >
              {[5, 10, 20, 50].map((num) => (
                <MenuItem key={num} value={num}>
                  {num}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Empty State */}
          {filteredInvoices.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8, color: "#90a4ae" }}>
              <SentimentDissatisfiedIcon sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                No invoices found
              </Typography>
              <Typography variant="body2">
                Try adjusting your search or filter criteria.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer
                component={Paper}
                elevation={4}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  boxShadow: 4,
                }}
              >
                <Table
                  size="small"
                  sx={{
                    minWidth: 650,
                    "& .MuiTableCell-root": { py: 1.9, px: 1, fontSize: 12 },
                    "& .MuiTableCell-head": {
                      py: 0.75,
                      fontSize: 13,
                      fontWeight: 700,
                    },
                  }}
                  aria-label="invoice table"
                >
                  <TableHead>
                    <TableRow
                      sx={{
                        background: "#EDEDED",
                      }}
                    >
                      {[
                        "System ID",
                        "Invoice Number", 
                        "Invoice Date",
                        "Invoice Type",
                        "Buyer",
                        "Buyer NTN",
                        "Scenario ID",
                        "HS Code",
                        "Actions",
                      ].map((heading) => (
                        <TableCell
                          key={heading}
                          align={
                            heading === "System ID" ||
                            heading === "Invoice Number" ||
                            heading === "Invoice Date"
                              ? "left"
                              : "center"
                          }
                          sx={{
                            fontWeight: "bold",
                            fontSize: 13,
                            letterSpacing: 0.3,
                          }}
                        >
                          {heading}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredInvoices.map((row, index) => (
                      <TableRow
                        key={row._id || index}
                        sx={{
                          "&:hover": {
                            backgroundColor: "#EDEDED",
                            transition: "background-color 0.3s",
                          },
                        }}
                      >
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: "#1976d2"
                          }}
                        >
                          {row.systemInvoiceId || "N/A"}
                        </TableCell>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {row.invoiceNumber}
                        </TableCell>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{ fontWeight: 500 }}
                        >
                          {row.invoiceDate}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 500 }}>
                          {row.invoiceType || "N/A"}
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              fontWeight: 500,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              justifyContent: "center",
                            }}
                          >
                            <Box>{row.buyerBusinessName || "N/A"}</Box>
                            <Tooltip
                              title={getStatusText(row.status)}
                              placement="top"
                              arrow
                            >
                              <Box
                                component="span"
                                bgcolor={getStatusColor(row.status)}
                                sx={{
                                  width: "10px",
                                  height: "10px",
                                  borderRadius: "50%",
                                  display: "inline-block",
                                }}
                              ></Box>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ fontWeight: 500 }}>
                            {row.buyerNTNCNIC || "N/A"}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {row.scenarioId || "N/A"}
                        </TableCell>
                        <TableCell align="center">
                          {row.items && row.items.length > 0
                            ? row.items
                                .map((item) => item.hsCode || "N/A")
                                .join(", ")
                            : "N/A"}
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              gap: 1,
                            }}
                          >
                            <Tooltip title="Print Invoice">
                              <Button
                                variant="outlined"
                                color="success"
                                size="small"
                                onClick={() => handleButtonClick(row)}
                                sx={{
                                  minWidth: "32px",
                                  width: "32px",
                                  height: "32px",
                                  p: 0,
                                  "&:hover": {
                                    backgroundColor: "success.main",
                                    color: "success.contrastText",
                                    borderColor: "success.main",
                                  },
                                }}
                              >
                                <PrintIcon fontSize="small" />
                              </Button>
                            </Tooltip>
                            <Tooltip title="View Invoice Details">
                              <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={() => handleViewInvoice(row)}
                                sx={{
                                  minWidth: "32px",
                                  width: "32px",
                                  height: "32px",
                                  p: 0,
                                  "&:hover": {
                                    backgroundColor: "primary.main",
                                    color: "primary.contrastText",
                                    borderColor: "primary.main",
                                  },
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </Button>
                            </Tooltip>
                            {row.status === "draft" && (
                              <Tooltip title={`Edit Draft Invoice`}>
                                <Button
                                  variant="outlined"
                                  color="warning"
                                  size="small"
                                  onClick={() => handleEditInvoice(row)}
                                  sx={{
                                    minWidth: "32px",
                                    width: "32px",
                                    height: "32px",
                                    p: 0,
                                    "&:hover": {
                                      backgroundColor: "warning.main",
                                      color: "warning.contrastText",
                                      borderColor: "warning.main",
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </Button>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Pagination Controls */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Showing {(page - 1) * rowsPerPage + 1} to{" "}
                  {Math.min(page * rowsPerPage, totalRecords)} of {totalRecords}{" "}
                  invoices
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CustomPagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    showFirstButton
                    showLastButton
                    size="small"
                  />
                </Box>
              </Box>
            </>
          )}

          {/* Invoice View Modal */}
          <InvoiceViewModal
            open={viewModalOpen}
            onClose={() => setViewModalOpen(false)}
            invoice={selectedInvoice}
            onPrint={() => {
              if (selectedInvoice) {
                handleButtonClick(selectedInvoice);
              }
            }}
          />
        </Box>
      )}
    </>
  );
}
