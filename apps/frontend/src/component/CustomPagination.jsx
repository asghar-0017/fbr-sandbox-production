import React from "react";
import { Box, IconButton, Button, Typography } from "@mui/material";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";

const CustomPagination = ({
  count,
  page,
  onChange,
  showFirstButton = true,
  showLastButton = true,
  size = "small",
}) => {
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= count) {
      onChange(null, newPage);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (count <= maxVisiblePages) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= count; i++) {
        pages.push(
          <Button
            key={i}
            variant={page === i ? "contained" : "outlined"}
            size={size}
            onClick={() => handlePageChange(i)}
            sx={{
              minWidth: 32,
              height: 32,
              mx: 0.5,
              ...(page === i && {
                backgroundColor: "#1976d2",
                color: "white",
                "&:hover": {
                  backgroundColor: "#1565c0",
                },
              }),
            }}
          >
            {i}
          </Button>
        );
      }
    } else {
      // Show pages with ellipsis
      if (page <= 3) {
        // Show first 3 pages + ellipsis + last page
        for (let i = 1; i <= 3; i++) {
          pages.push(
            <Button
              key={i}
              variant={page === i ? "contained" : "outlined"}
              size={size}
              onClick={() => handlePageChange(i)}
              sx={{
                minWidth: 32,
                height: 32,
                mx: 0.5,
                ...(page === i && {
                  backgroundColor: "#1976d2",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#1565c0",
                  },
                }),
              }}
            >
              {i}
            </Button>
          );
        }
        pages.push(
          <Typography key="ellipsis1" sx={{ mx: 1, color: "text.secondary" }}>
            ...
          </Typography>
        );
        pages.push(
          <Button
            key={count}
            variant="outlined"
            size={size}
            onClick={() => handlePageChange(count)}
            sx={{ minWidth: 32, height: 32, mx: 0.5 }}
          >
            {count}
          </Button>
        );
      } else if (page >= count - 2) {
        // Show first page + ellipsis + last 3 pages
        pages.push(
          <Button
            key={1}
            variant="outlined"
            size={size}
            onClick={() => handlePageChange(1)}
            sx={{ minWidth: 32, height: 32, mx: 0.5 }}
          >
            1
          </Button>
        );
        pages.push(
          <Typography key="ellipsis2" sx={{ mx: 1, color: "text.secondary" }}>
            ...
          </Typography>
        );
        for (let i = count - 2; i <= count; i++) {
          pages.push(
            <Button
              key={i}
              variant={page === i ? "contained" : "outlined"}
              size={size}
              onClick={() => handlePageChange(i)}
              sx={{
                minWidth: 32,
                height: 32,
                mx: 0.5,
                ...(page === i && {
                  backgroundColor: "#1976d2",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#1565c0",
                  },
                }),
              }}
            >
              {i}
            </Button>
          );
        }
      } else {
        // Show first page + ellipsis + current page + ellipsis + last page
        pages.push(
          <Button
            key={1}
            variant="outlined"
            size={size}
            onClick={() => handlePageChange(1)}
            sx={{ minWidth: 32, height: 32, mx: 0.5 }}
          >
            1
          </Button>
        );
        pages.push(
          <Typography key="ellipsis3" sx={{ mx: 1, color: "text.secondary" }}>
            ...
          </Typography>
        );
        pages.push(
          <Button
            key={page}
            variant="contained"
            size={size}
            onClick={() => handlePageChange(page)}
            sx={{
              minWidth: 32,
              height: 32,
              mx: 0.5,
              backgroundColor: "#1976d2",
              color: "white",
              "&:hover": {
                backgroundColor: "#1565c0",
              },
            }}
          >
            {page}
          </Button>
        );
        pages.push(
          <Typography key="ellipsis4" sx={{ mx: 1, color: "text.secondary" }}>
            ...
          </Typography>
        );
        pages.push(
          <Button
            key={count}
            variant="outlined"
            size={size}
            onClick={() => handlePageChange(count)}
            sx={{ minWidth: 32, height: 32, mx: 0.5 }}
          >
            {count}
          </Button>
        );
      }
    }

    return pages;
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {showFirstButton && (
        <IconButton
          onClick={() => handlePageChange(1)}
          disabled={page === 1}
          size={size}
        >
          <FirstPageIcon />
        </IconButton>
      )}

      <IconButton
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        size={size}
      >
        <NavigateBeforeIcon />
      </IconButton>

      {renderPageNumbers()}

      <IconButton
        onClick={() => handlePageChange(page + 1)}
        disabled={page === count}
        size={size}
      >
        <NavigateNextIcon />
      </IconButton>

      {showLastButton && (
        <IconButton
          onClick={() => handlePageChange(count)}
          disabled={page === count}
          size={size}
        >
          <LastPageIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default CustomPagination;
