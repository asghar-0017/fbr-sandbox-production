import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, TextField, Typography, CircularProgress } from "@mui/material";
import { Autocomplete } from "@mui/material";
import hsCodeCache from "../utils/hsCodeCache";

const OptimizedHSCodeSelector = ({
  index,
  item,
  handleItemChange,
  environment = "sandbox",
  label = "HS Code",
  placeholder = "Search HS Code...",
}) => {
  const [hsCodeList, setHsCodeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState([]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load HS codes with caching
  useEffect(() => {
    const loadHSCodes = async () => {
      setLoading(true);
      try {
        const data = await hsCodeCache.getHSCodes(environment);
        setHsCodeList(data);
      } catch (error) {
        console.error("Error loading HS codes:", error);
        setHsCodeList([]);
      } finally {
        setLoading(false);
      }
    };

    loadHSCodes();
  }, [environment]);

  // Filter options based on search term
  useEffect(() => {
    const updateFilteredOptions = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
        setFilteredOptions(hsCodeList.slice(0, 100));
        return;
      }

      try {
        const results = await hsCodeCache.searchHSCodesFromBackend(
          debouncedSearchTerm,
          50,
          environment
        );
        setFilteredOptions(results);
      } catch (error) {
        console.error("Error searching HS codes:", error);
        const localResults = hsCodeCache.searchHSCodes(debouncedSearchTerm, 50);
        setFilteredOptions(localResults);
      }
    };

    updateFilteredOptions();
  }, [hsCodeList, debouncedSearchTerm, environment]);

  // Handle HS code selection
  const handleHSCodeChange = useCallback(
    (_, newValue) => {
      console.log("HS Code Selection:", newValue);
      handleItemChange(index, "hsCode", newValue ? newValue.hS_CODE : "");
    },
    [index, handleItemChange]
  );

  // Get current value
  const currentValue = useMemo(() => {
    return hsCodeList.find((code) => code.hS_CODE === item.hsCode) || null;
  }, [hsCodeList, item.hsCode]);

  // Get description for selected HS code
  const selectedDescription = useMemo(() => {
    return (
      hsCodeList.find((code) => code.hS_CODE === item.hsCode)?.description || ""
    );
  }, [hsCodeList, item.hsCode]);

  return (
    <Box sx={{ width: "100%" }}>
      <Autocomplete
        fullWidth
        size="small"
        options={filteredOptions}
        getOptionLabel={(option) =>
          `${option.hS_CODE} - ${option.description || ""}`
        }
        value={currentValue}
        onChange={handleHSCodeChange}
        onInputChange={(_, newInputValue) => {
          setSearchTerm(newInputValue);
        }}
        loading={loading}
        filterOptions={(options) => {
          return options;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            variant="outlined"
            size="small"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          return (
            <Box component="li" key={key} {...otherProps}>
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {option.hS_CODE}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.description || "No description available"}
                </Typography>
              </Box>
            </Box>
          );
        }}
        isOptionEqualToValue={(option, value) =>
          option.hS_CODE === value.hS_CODE
        }
        noOptionsText={
          debouncedSearchTerm.length < 2
            ? "Type at least 2 characters to search..."
            : "No HS codes found"
        }
      />

      {selectedDescription && (
        <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
          {selectedDescription}
        </Typography>
      )}
    </Box>
  );
};

export default OptimizedHSCodeSelector;
