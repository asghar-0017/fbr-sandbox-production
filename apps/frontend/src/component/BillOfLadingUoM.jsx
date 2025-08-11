import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import React, { useEffect, useState } from "react";
import hsCodeCache from "../utils/hsCodeCache";

const BillOfLadingUoM = ({ index, item, handleItemChange, hsCode }) => {
  const [billOfLadingUoM, setBillOfLadingUoM] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getBillOfLadingUoM = async () => {
      if (!hsCode) return;

      // Special handling for scenario SN018 with rate containing "/bill"
      if (item.rate && item.rate.includes("/bill")) {
        console.log(
          "Rate contains '/bill', setting billOfLadingUoM to 'Bill of lading'"
        );
        handleItemChange(index, "billOfLadingUoM", "Bill of lading");
        // Add "Bill of lading" as an option for the dropdown
        setBillOfLadingUoM([
          { uoM_ID: "bill_of_lading", description: "Bill of lading" },
        ]);
        return;
      }

      console.log("Fetching Bill of Lading UOM for hsCode:", hsCode);
      setIsLoading(true);

      try {
        // Use the new UOM caching system
        const response = await hsCodeCache.getUOM(hsCode);
        console.log("Bill of Lading UOM response:", response);

        if (response && Array.isArray(response)) {
          setBillOfLadingUoM(response);
          // Auto-select if only one UOM is returned and not already set
          if (response.length === 1 && !item.billOfLadingUoM) {
            handleItemChange(index, "billOfLadingUoM", response[0].description);
          }
        } else {
          console.warn("Invalid Bill of Lading UOM response format:", response);
          setBillOfLadingUoM([]);
        }
      } catch (error) {
        console.error("Error fetching Bill of Lading UOM:", error);
        // The caching system should have already provided fallback data
        // but if it didn't, we'll set an empty array
        setBillOfLadingUoM([]);
      } finally {
        setIsLoading(false);
      }
    };

    getBillOfLadingUoM();
  }, [hsCode, item.rate]);

  const handleBillOfLadingUoMChange = (event) => {
    const selectedUOM = event.target.value;
    handleItemChange(index, "billOfLadingUoM", selectedUOM);
  };

  // Only show if hsCode is available
  if (!hsCode) {
    return null;
  }

  return (
    <Box sx={{ flex: "1 1 23%", minWidth: "200px" }}>
      <FormControl fullWidth>
        <InputLabel id={`bill-of-lading-uom-${index}`}>
          Bill of Lading UoM {isLoading && "(Loading...)"}
        </InputLabel>
        <Select
          labelId={`bill-of-lading-uom-${index}`}
          value={item.billOfLadingUoM || ""}
          label={`Bill of Lading UoM ${isLoading ? "(Loading...)" : ""}`}
          onChange={handleBillOfLadingUoMChange}
          disabled={isLoading}
        >
          {billOfLadingUoM.map((curElem) => (
            <MenuItem key={curElem.uoM_ID} value={curElem.description}>
              {curElem.description}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default BillOfLadingUoM;
