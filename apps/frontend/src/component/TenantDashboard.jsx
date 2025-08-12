import React, { useState, useEffect } from "react";
import { useTenantSelection } from "../Context/TenantSelectionProvider";
import { useNavigate } from "react-router-dom";
import { api } from "../API/Api";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Skeleton,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
} from "@mui/material";
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  LocationOn as LocationIcon,
  SwapHoriz as SwapIcon,
} from "@mui/icons-material";
import { GoGraph } from "react-icons/go";
import { getCurrentTokenState } from "../API/Api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import CustomPagination from "./CustomPagination";

const TenantDashboard = () => {
  const { selectedTenant } = useTenantSelection();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null); // basic buyer/invoice counts
  const [dashboard, setDashboard] = useState(null); // detailed metrics and series
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const tokenState = getCurrentTokenState();
  // Table pagination for dashboard recent invoices
  const [tablePage, setTablePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "draft":
        return "#ff9800"; // Orange
      case "posted":
        return "#4caf50"; // Green
      case "saved":
        return "#2196f3"; // Blue
      default:
        return "#757575"; // Grey
    }
  };

  // Helper function to get status display text
  const getStatusText = (status) => {
    if (!status || status === "-" || status === "") {
      return "-";
    }
    switch (status) {
      case "draft":
        return "Draft";
      case "posted":
        return "Posted";
      case "saved":
        return "Saved";
      default:
        return status;
    }
  };

  // Helper function to get status chip color
  const getStatusChipColor = (status) => {
    switch (status) {
      case "posted":
        return "success";
      case "draft":
        return "warning";
      case "saved":
        return "info";
      default:
        return "default";
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      fetchTenantStats();
      fetchDashboard();
    }
  }, [selectedTenant]);

  const fetchTenantStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(
        `/admin/tenants/${selectedTenant.tenant_id}/stats`
      );

      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError("Failed to fetch Company statistics");
      }
    } catch (error) {
      console.error("Error fetching Company stats:", error);
      setError("Failed to fetch Company statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(
        `/tenant/${selectedTenant.tenant_id}/dashboard/summary`
      );
      if (res.data.success) {
        // Debug: Log dashboard data structure to understand invoice fields
        console.log("Dashboard API Response:", res.data.data);
        console.log("Recent Invoices:", res.data.data.recent_invoices);
        setDashboard(res.data.data);
      } else {
        setError("Failed to fetch dashboard");
      }
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      setError("Failed to fetch dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Function to get current month data for the bar graph
  const getCurrentMonthData = () => {
    if (!dashboard?.metrics) return [];

    const currentMonth = new Date().toLocaleString("en-US", { month: "long" });

    return [
      {
        name: currentMonth,
        "Posted to FBR": dashboard.metrics?.total_posted_to_fbr || 0,
        Draft: dashboard.metrics?.total_invoices_draft || 0,
      },
    ];
  };

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

  // Derive pagination for recent invoices (client-side)
  const recentInvoices = dashboard?.recent_invoices || [];
  const totalTablePages = Math.max(
    1,
    Math.ceil(recentInvoices.length / rowsPerPage)
  );
  const pagedInvoices = recentInvoices.slice(
    (tablePage - 1) * rowsPerPage,
    tablePage * rowsPerPage
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
          Dashboard
        </Typography>
        <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
          Here's your invoice summary for this month.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      {loading ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
            minWidth: 0,
          }}
        >
          {[0, 1, 2, 3].map((idx) => (
            <Card
              key={idx}
              sx={{
                borderRadius: 2,
                backgroundColor: idx % 2 === 0 ? "#E3F5FF" : "#E5ECF6",
                minHeight: 140,
                p: 1,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Skeleton variant="text" width={160} height={24} />
                </Stack>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                  sx={{ mt: 1, pt: 3 }}
                >
                  <Skeleton variant="text" width={120} height={40} />
                  <Skeleton
                    variant="rectangular"
                    width={60}
                    height={20}
                    sx={{ borderRadius: 1 }}
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : dashboard ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
            minWidth: 0,
          }}
        >
          {[
            {
              label: "Total Invoices Created",
              value: dashboard.metrics?.total_invoices_created || 0,
            },
            {
              label: "Total Invoices Saved",
              value: dashboard.metrics?.total_invoices_draft || 0,
            },
            {
              label: "Total Posted to FBR",
              value: dashboard.metrics?.total_posted_to_fbr || 0,
            },
            {
              label: "Total Invoice Amount",
              value: new Intl.NumberFormat("en-PK", {
                style: "currency",
                currency: "PKR",
                maximumFractionDigits: 0,
              }).format(dashboard.metrics?.total_invoice_amount || 0),
            },
          ].map((card, idx) => (
            <Card
              key={idx}
              sx={{
                borderRadius: 2,
                backgroundColor: idx % 2 === 0 ? "#E3F5FF" : "#E5ECF6",
                minHeight: 140,
                padding: 1,
              }}
            >
              <CardContent sx={{ padding: 2 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, fontSize: 16 }}
                    >
                      {card.label}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                  sx={{ mt: 1, paddingTop: 3 }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 500,
                      fontSize: { xs: "1.5rem", sm: "1.75rem", lg: "1.3rem" },
                      wordBreak: "break-word",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {card.value}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : null}

      {/* Current Month Overview Bar Chart */}
      {loading ? (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Skeleton variant="text" width={180} height={28} />
              <Skeleton variant="rounded" width={96} height={28} />
            </Box>
            <Skeleton
              variant="rounded"
              height={320}
              sx={{ width: "100%", borderRadius: 1 }}
            />
          </CardContent>
        </Card>
      ) : (
        dashboard && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">Month Overview</Typography>
                <Chip label="This Month" size="small" color="primary" />
              </Box>
              <Box sx={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={getCurrentMonthData()}
                    barSize={60}
                    barGap={20}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 14, fill: "#6b7280", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value, name) => [`${value} Invoices`, name]}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: 12,
                        marginBottom: 20,
                        marginTop: -10,
                      }}
                    />
                    <Bar
                      dataKey="Posted to FBR"
                      name="Posted to FBR"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Draft"
                      name="Draft"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        )
      )}

      {/* Recent Invoices Table */}
      {loading ? (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#EDEDED" }}>
                  <TableRow>
                    {[
                      "Invoice Number",
                      "Date",
                      "Amount",
                      "Status",
                      "Posted To FBR",
                    ].map((h) => (
                      <TableCell key={h}>
                        <Skeleton variant="text" width={120} />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...Array(5)].map((_, rowIdx) => (
                    <TableRow key={rowIdx}>
                      {[...Array(5)].map((__, colIdx) => (
                        <TableCell key={`${rowIdx}-${colIdx}`}>
                          <Skeleton
                            variant="text"
                            width={colIdx === 2 ? 100 : 160}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mt: 2,
              }}
            >
              <Skeleton variant="text" width={220} />
              <Skeleton variant="rounded" width={180} height={32} />
            </Box>
          </CardContent>
        </Card>
      ) : (
        dashboard && (
          <Card sx={{ mt: 3 }}>
            <Typography
              variant="h6"
              px={2}
              sx={{ fontWeight: 600, fontSize: 16, paddingTop: 2 }}
            >
              Recent Invoices
            </Typography>
            <CardContent>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "#EDEDED" }}>
                    <TableRow>
                      <TableCell>Invoice Number</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="left">Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Posted To FBR</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No recent invoices found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedInvoices.map((inv) => {
                        return (
                          <TableRow key={inv.id} hover>
                            <TableCell>{inv.invoiceNumber}</TableCell>
                            <TableCell>
                              {new Date(inv.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="left">
                              {new Intl.NumberFormat("en-PK", {
                                style: "currency",
                                currency: "PKR",
                                maximumFractionDigits: 0,
                              }).format(inv.amount || 0)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusText(
                                  inv.status || inv.invoiceStatus || "-"
                                )}
                                size="small"
                                variant={
                                  getStatusText(
                                    inv.status || inv.invoiceStatus || "-"
                                  ) === "-"
                                    ? "outlined"
                                    : "filled"
                                }
                                sx={{
                                  backgroundColor:
                                    getStatusText(
                                      inv.status || inv.invoiceStatus || "-"
                                    ) === "-"
                                      ? "transparent"
                                      : undefined,
                                  borderColor:
                                    getStatusText(
                                      inv.status || inv.invoiceStatus || "-"
                                    ) === "-"
                                      ? "transparent"
                                      : undefined,
                                  color:
                                    getStatusText(
                                      inv.status || inv.invoiceStatus || "-"
                                    ) === "-"
                                      ? "#000000"
                                      : undefined,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  inv.postedToFBR ||
                                  inv.isPostedToFBR ||
                                  inv.fbrPosted
                                    ? "YES"
                                    : "NO"
                                }
                                size="small"
                                color={
                                  inv.postedToFBR ||
                                  inv.isPostedToFBR ||
                                  inv.fbrPosted
                                    ? "success"
                                    : "error"
                                }
                                variant={"outlined"}
                                sx={{ borderRadius: 1.5, padding: 1.5 }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Showing{" "}
                  {recentInvoices.length === 0
                    ? 0
                    : (tablePage - 1) * rowsPerPage + 1}{" "}
                  to {Math.min(tablePage * rowsPerPage, recentInvoices.length)}{" "}
                  of {recentInvoices.length}
                </Typography>
                <CustomPagination
                  count={totalTablePages}
                  page={tablePage}
                  onChange={(_, value) => setTablePage(value)}
                  showFirstButton
                  showLastButton
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        )
      )}

      {/* Debug section - remove in production */}
      {process.env.NODE_ENV === "development" && (
        <Box mt={2} p={2} bgcolor="rgba(255,255,255,0.1)" borderRadius={1}>
          <Typography variant="caption" display="block" mb={1}></Typography>
          <Typography variant="caption" display="block"></Typography>
          <Typography variant="caption" display="block"></Typography>
          <Typography variant="caption" display="block"></Typography>
        </Box>
      )}
    </Box>
  );
};

export default TenantDashboard;
