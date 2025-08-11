import React, { useState, useEffect } from "react";
import { Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { fetchData } from "../API/GetApi";
import { useTenantSelection } from "../Context/TenantSelectionProvider";

const RateSelector = ({
  index,
  item,
  handleItemChange,
  transactionTypeId,
  selectedProvince,
}) => {
  const { tokensLoaded } = useTenantSelection();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to fetch rate data
  const getRateData = async (overrideTransactionTypeId = null) => {
    const effectiveTransactionTypeId =
      overrideTransactionTypeId || transactionTypeId;

    if (!effectiveTransactionTypeId || !selectedProvince) {
      console.log("Missing required data:", {
        effectiveTransactionTypeId,
        selectedProvince,
      });
      setRates([]);
      return null;
    }

    // Check if tokens are loaded before making API call
    if (!tokensLoaded) {
      console.warn("Tokens not loaded yet, skipping rate fetch");
      setRates([]);
      return;
    }

    setLoading(true);
    try {
      // Get the full province data from localStorage
      const provinceResponseRaw = localStorage.getItem("provinceResponse");

      console.log("Province Response Raw:", provinceResponseRaw);

      // Parse the province data from localStorage
      let provinceResponse;
      try {
        provinceResponse = provinceResponseRaw
          ? JSON.parse(provinceResponseRaw)
          : [];
      } catch (parseError) {
        console.error("Error parsing province data:", parseError);
        provinceResponse = [];
      }

      // Ensure provinceResponse is an array
      if (!Array.isArray(provinceResponse)) {
        console.error("Province response is not an array:", provinceResponse);
        setRates([]);
        return;
      }

      console.log(
        "Available provinces:",
        provinceResponse.map((p) => ({
          desc: p.stateProvinceDesc,
          code: p.stateProvinceCode,
        }))
      );
      console.log("Looking for province:", selectedProvince);

      const selectedProvinceObj = provinceResponse.find(
        (prov) => prov.stateProvinceDesc === selectedProvince
      );

      if (!selectedProvinceObj) {
        console.error("Selected province not found in province data");
        console.log(
          "Available province descriptions:",
          provinceResponse.map((p) => p.stateProvinceDesc)
        );
        setRates([]);
        return;
      }

      const stateProvinceCode = selectedProvinceObj.stateProvinceCode;
      console.log("Found province code:", stateProvinceCode);

      const response = await fetchData(
        `pdi/v2/SaleTypeToRate?date=24-Feb-2024&transTypeId=${effectiveTransactionTypeId}&originationSupplier=${stateProvinceCode}`
      );
      console.log("Rate Response:", response);
      console.log("Transaction Type ID:", effectiveTransactionTypeId);
      console.log("Response type:", typeof response);
      console.log("Response is array:", Array.isArray(response));
      console.log(
        "Note: SaleTypeToRate API returns rate information, not transaction type information"
      );

      // Debug: Log the full response structure for SN007
      // Note: SaleTypeToRate API returns rate information (ratE_ID, ratE_DESC, ratE_VALUE)
      // but does NOT return transactioN_TYPE_ID - that comes from the transtypecode API
      if (effectiveTransactionTypeId === "80") {
        console.log(
          "SN007 Debug - Full API Response:",
          JSON.stringify(response, null, 2)
        );
        if (Array.isArray(response)) {
          console.log(
            "SN007 Debug - Response array items:",
            response.map((item) => ({
              ratE_ID: item.ratE_ID,
              ratE_DESC: item.ratE_DESC,
              ratE_VALUE: item.ratE_VALUE,
            }))
          );
        }
      }

      if (Array.isArray(response)) {
        setRates(response);
      } else if (response && typeof response === "object") {
        // Handle case where response might be wrapped in an object
        const ratesArray = response.data || response.rates || response;
        setRates(Array.isArray(ratesArray) ? ratesArray : []);
      } else {
        setRates([]);
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
      setRates([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch rates when dependencies change
  useEffect(() => {
    getRateData();
  }, [transactionTypeId, selectedProvince, tokensLoaded]);

  // Additional effect to handle editing when transactionTypeId is set after component mount
  useEffect(() => {
    const isEditing = localStorage.getItem("editingInvoice") === "true";
    if (isEditing && item.rate && transactionTypeId && rates.length === 0) {
      console.log(
        "Editing mode detected with transactionTypeId, fetching rates for:",
        item.rate
      );
      getRateData(transactionTypeId);
    }
  }, [transactionTypeId, item.rate]);

  // Fallback effect to set transactionTypeId for editing when scenario is known but transactionTypeId is missing
  useEffect(() => {
    const isEditing = localStorage.getItem("editingInvoice") === "true";
    if (isEditing && item.rate && !transactionTypeId) {
      // Try to get transactionTypeId from localStorage or set based on common scenarios
      const storedTransactionTypeId = localStorage.getItem("transactionTypeId");
      if (storedTransactionTypeId) {
        console.log(
          "Found stored transactionTypeId for editing:",
          storedTransactionTypeId
        );
        // The parent component should pick this up and set the state
        // Force a re-render by triggering the rate fetch
        if (selectedProvince) {
          console.log(
            "Triggering rate fetch with stored transactionTypeId:",
            storedTransactionTypeId
          );
          getRateData(storedTransactionTypeId);
        }
      } else {
        // Try to infer from the rate description or other context
        console.log(
          "No stored transactionTypeId found, checking for scenario-based fallback"
        );
      }
    }
  }, [item.rate, transactionTypeId, selectedProvince]);

  // Handle editing case - set selectedRateId when editing an invoice
  useEffect(() => {
    const isEditing = localStorage.getItem("editingInvoice") === "true";
    if (isEditing && item.rate && rates.length > 0) {
      console.log("Editing mode detected, looking for rate:", item.rate);
      console.log(
        "Available rates:",
        rates.map((r) => r.ratE_DESC)
      );
      const selectedRateObj = rates.find(
        (rate) => rate.ratE_DESC === item.rate
      );
      if (selectedRateObj) {
        // Store rate ID per item instead of globally
        localStorage.setItem(
          `selectedRateId_${index}`,
          selectedRateObj.ratE_ID
        );
        console.log(
          `Set selectedRateId for item ${index} editing: ${selectedRateObj.ratE_ID}`
        );
        // Clear the editing flag
        localStorage.removeItem("editingInvoice");
      } else {
        console.warn(`Rate not found in available rates: ${item.rate}`);
      }
    }
  }, [rates, item.rate, index]);

  // Additional effect to handle editing when rate data is loaded after the editing flag is set
  useEffect(() => {
    const isEditing = localStorage.getItem("editingInvoice") === "true";
    if (isEditing && item.rate && rates.length > 0) {
      // This effect runs when rate data is loaded and we're in editing mode
      console.log(
        "Editing mode detected (delayed), looking for rate:",
        item.rate
      );
      const selectedRateObj = rates.find(
        (rate) => rate.ratE_DESC === item.rate
      );
      if (selectedRateObj) {
        // Store rate ID per item instead of globally
        localStorage.setItem(
          `selectedRateId_${index}`,
          selectedRateObj.ratE_ID
        );
        console.log(
          `Set selectedRateId for item ${index} editing (delayed): ${selectedRateObj.ratE_ID}`
        );
        // Clear the editing flag
        localStorage.removeItem("editingInvoice");
      } else {
        console.warn(
          `Rate not found in available rates (delayed): ${item.rate}`
        );
      }
    }
  }, [rates, item.rate, index]);

  // Handle rate selection and save ratE_ID to localStorage per item
  const handleRateChange = (event) => {
    const selectedRate = event.target.value;
    const selectedRateObj = rates.find(
      (rate) => rate.ratE_DESC === selectedRate
    );
    if (selectedRateObj) {
      // Store rate ID per item instead of globally
      localStorage.setItem(`selectedRateId_${index}`, selectedRateObj.ratE_ID);
      console.log(
        `Selected Rate ID for item ${index}: ${selectedRateObj.ratE_ID}`
      );
    }
    handleItemChange(index, "rate", selectedRate);
  };

  // Check if we're in editing mode and have a rate value but no transactionTypeId
  const isEditingWithRate =
    localStorage.getItem("editingInvoice") === "true" &&
    item.rate &&
    !transactionTypeId;

  // Improved logic to determine when to show scenario message
  // Don't show scenario message if we have a rate value (editing mode) or if transactionTypeId is available
  const showScenarioMessage =
    !transactionTypeId && !isEditingWithRate && !item.rate;
  const showProvinceMessage = !showScenarioMessage && !selectedProvince;

  return (
    <Box sx={{ flex: "1 1 22%", minWidth: "180px" }}>
      <FormControl
        fullWidth
        size="small"
        error={showScenarioMessage || showProvinceMessage}
      >
        <InputLabel id={`rate-${index}`}>Rate</InputLabel>
        <Select
          labelId={`rate-${index}`}
          value={item.rate || ""}
          label="Rate"
          onChange={handleRateChange}
          disabled={showScenarioMessage || showProvinceMessage || loading}
        >
          {/* Debug info for editing mode */}
          {localStorage.getItem("editingInvoice") === "true" && item.rate && (
            <div style={{ display: "none" }}>
              Debug: Editing mode with rate "{item.rate}" for item {index}
            </div>
          )}
          {showScenarioMessage ? (
            <MenuItem value="">Please select scenario first</MenuItem>
          ) : showProvinceMessage ? (
            <MenuItem value="">Please select province first</MenuItem>
          ) : loading ? (
            <MenuItem value="">Loading rates...</MenuItem>
          ) : rates.length === 0 ? (
            <MenuItem value="">No rates available</MenuItem>
          ) : (
            rates.map((rate) => (
              <MenuItem key={rate.ratE_ID} value={rate.ratE_DESC}>
                {rate.ratE_DESC}
              </MenuItem>
            ))
          )}
        </Select>
        {showScenarioMessage && (
          <Box sx={{ color: "error.main", fontSize: 13, mt: 0.5, ml: 1 }}>
            {isEditingWithRate
              ? "Loading scenario data..."
              : "Please select scenario first."}
          </Box>
        )}
        {showProvinceMessage && (
          <Box sx={{ color: "error.main", fontSize: 13, mt: 0.5, ml: 1 }}>
            Please select province first.
          </Box>
        )}
      </FormControl>
    </Box>
  );
};

export default RateSelector;
