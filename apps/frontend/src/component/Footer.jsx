import React from "react";
import { Box } from "@mui/material";

const Footer = () => {
  return (
    <Box
      sx={{
        textAlign: "center",
        backgroundColor: "#2A69B0",
        color: "white",
        fontSize: 12,
        width: "100%",
        py: 1,
        px: 3,
        borderRadius: 1,
        position: "fixed",
        bottom: 0,
        left: 0,
        zIndex: 1000,
      }}
    >
      Powered by Innovative Network (Pvt.) Ltd.
    </Box>
  );
};

export default Footer;
