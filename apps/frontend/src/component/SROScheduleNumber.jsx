import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import React, { useEffect, useState } from "react";
import { fetchData } from "../API/GetApi";
import { useTenantSelection } from "../Context/TenantSelectionProvider";

const SROScheduleNumber = ({
  index,
  item,
  handleItemChange,
  disabled,
  selectedProvince,
}) => {
  const { tokensLoaded } = useTenantSelection();
  const [sro, setSro] = useState([]);

  // Function to find province with flexible matching
  const findProvince = (provinceResponse, selectedProvince) => {
    if (!provinceResponse || !Array.isArray(provinceResponse)) {
      return null;
    }

    // First try exact match
    let province = provinceResponse.find(
      (prov) => prov.stateProvinceDesc === selectedProvince
    );

    if (province) {
      return province;
    }

    // Try case-insensitive match
    province = provinceResponse.find(
      (prov) =>
        prov.stateProvinceDesc.toLowerCase() === selectedProvince.toLowerCase()
    );

    if (province) {
      return province;
    }

    // Try partial match (e.g., "SINDH" might match "SINDH PROVINCE")
    province = provinceResponse.find(
      (prov) =>
        prov.stateProvinceDesc
          .toLowerCase()
          .includes(selectedProvince.toLowerCase()) ||
        selectedProvince
          .toLowerCase()
          .includes(prov.stateProvinceDesc.toLowerCase())
    );

    if (province) {
      return province;
    }

    // Try common variations
    const variations = {
      SINDH: ["SINDH PROVINCE", "SINDH", "Sindh", "Sindh Province"],
      PUNJAB: ["PUNJAB PROVINCE", "PUNJAB", "Punjab", "Punjab Province"],
      KPK: ["KHYBER PAKHTUNKHWA", "KPK", "Khyber Pakhtunkhwa"],
      BALOCHISTAN: ["BALOCHISTAN PROVINCE", "BALOCHISTAN", "Balochistan"],
      FEDERAL: [
        "FEDERAL TERRITORY",
        "FEDERAL",
        "Federal Territory",
        "ISLAMABAD",
      ],
      AJK: ["AZAD JAMMU & KASHMIR", "AJK", "Azad Jammu & Kashmir"],
      GB: ["GILGIT BALTISTAN", "GB", "Gilgit Baltistan"],
    };

    const selectedProvinceUpper = selectedProvince.toUpperCase();
    if (variations[selectedProvinceUpper]) {
      for (const variation of variations[selectedProvinceUpper]) {
        province = provinceResponse.find(
          (prov) =>
            prov.stateProvinceDesc.toUpperCase() === variation.toUpperCase()
        );
        if (province) {
          return province;
        }
      }
    }

    return null;
  };

  const getSRO = async () => {
    try {
      // Use item-specific rate ID instead of global one
      var RateId = localStorage.getItem(`selectedRateId_${index}`);
      console.log(`RateId for item ${index}:`, RateId);

      if (!RateId) {
        console.warn(`selectedRateId_${index} is missing in localStorage`);
        return;
      }

      // Check if tokens are loaded before making API call
      if (!tokensLoaded) {
        console.warn("Tokens not loaded yet, skipping SRO fetch");
        return;
      }

      const provinceResponse = JSON.parse(
        localStorage.getItem("provinceResponse") || "[]"
      );
      const selectedProvinceObj = findProvince(
        provinceResponse,
        selectedProvince
      );

      if (!selectedProvinceObj) {
        console.warn(
          `Province not found in provinceResponse: ${selectedProvince}`
        );
        return;
      }

      const stateProvinceCode = selectedProvinceObj?.stateProvinceCode;

      const response = await fetchData(
        `pdi/v1/SroSchedule?rate_id=${RateId}&date=04-Feb-2024&origination_supplier_csv=${stateProvinceCode}`
      );
      console.log(`SRO for item ${index}:`, response);
      setSro(response);
      return response;
    } catch (error) {
      console.error("Error fetching rates:", error);
      return [];
    }
  };

  // Fetch rates on component mount and when rate changes
  useEffect(() => {
    getSRO();
  }, [selectedProvince, tokensLoaded, index, item.rate]);

  // Handle editing case - set SROId when editing an invoice
  useEffect(() => {
    const isEditing = localStorage.getItem("editingInvoice") === "true";
    if (isEditing && item.sroScheduleNo && sro.length > 0) {
      console.log(
        `Editing mode detected for item ${index}, looking for SRO schedule:`,
        item.sroScheduleNo
      );
      console.log(
        `Available SRO schedules for item ${index}:`,
        sro.map((s) => s.srO_DESC)
      );
      const selectedSROObj = sro.find(
        (sroItem) => sroItem.srO_DESC === item.sroScheduleNo
      );
      if (selectedSROObj) {
        // Store SRO ID per item instead of globally
        localStorage.setItem(`SROId_${index}`, selectedSROObj.srO_ID);
        console.log(
          `Set SROId for item ${index} editing: ${selectedSROObj.srO_ID}`
        );
      } else {
        console.warn(
          `SRO schedule not found in available schedules for item ${index}: ${item.sroScheduleNo}`
        );
      }
    }
  }, [sro, item.sroScheduleNo, index]);

  // Additional effect to handle editing when SRO data is loaded after the editing flag is set
  useEffect(() => {
    const isEditing = localStorage.getItem("editingInvoice") === "true";
    if (isEditing && item.sroScheduleNo && sro.length > 0) {
      // This effect runs when SRO data is loaded and we're in editing mode
      const selectedSROObj = sro.find(
        (sroItem) => sroItem.srO_DESC === item.sroScheduleNo
      );
      if (selectedSROObj) {
        // Store SRO ID per item instead of globally
        localStorage.setItem(`SROId_${index}`, selectedSROObj.srO_ID);
        console.log(
          `Set SROId for item ${index} editing (delayed): ${selectedSROObj.srO_ID}`
        );
      }
    }
  }, [sro, item.sroScheduleNo, index]);

  const handleSROChange = (event) => {
    const selectedSRO = event.target.value; // e.g., "18%"
    const selectedSROObj = sro.find((sro) => sro.srO_DESC === selectedSRO);
    if (selectedSROObj) {
      // Store SRO ID per item instead of globally
      localStorage.setItem(`SROId_${index}`, selectedSROObj.srO_ID);
      console.log(
        `SAVED SROId for item ${index}: ${selectedSROObj.srO_ID} to localStorage`
      );
    }
    if (sro.length === 0) {
      localStorage.removeItem(`SROId_${index}`);
    }
    handleItemChange(index, "sroScheduleNo", selectedSRO);
  };
  return (
    <Box sx={{ flex: "1 1 22%", minWidth: "180px" }}>
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel id={`sro-schedule-${index}`}>SRO Schedule No</InputLabel>
        <Select
          labelId={`sro-schedule-${index}`}
          value={item.sroScheduleNo || "N/A"}
          label="SRO Schedule No"
          onChange={handleSROChange}
        >
          {sro.length === 0 ? (
            <MenuItem value="N/A">N/A</MenuItem>
          ) : (
            sro.map((curElem) => (
              <MenuItem key={curElem.srO_ID} value={curElem.srO_DESC}>
                {curElem.srO_DESC}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SROScheduleNumber;
