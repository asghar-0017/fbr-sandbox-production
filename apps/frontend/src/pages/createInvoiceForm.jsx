import * as React from "react";
import {
  Box,
  InputLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Autocomplete,
  CircularProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from "@mui/material";
import {
  Business,
  CreditCard,
  LocationOn,
  Map as MapIcon,
} from "@mui/icons-material";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { FaTrash, FaEdit } from "react-icons/fa";
import { IoIosAddCircle } from "react-icons/io";
import dayjs from "dayjs";
import { getTransactionTypes } from "../API/FBRService";
import { fetchData, postData } from "../API/GetApi";
import RateSelector from "../component/RateSelector";
import SROScheduleNumber from "../component/SROScheduleNumber";
import SROItem from "../component/SROItem";
import UnitOfMeasurement from "../component/UnitOfMeasurement";
import BillOfLadingUoM from "../component/BillOfLadingUoM";
import OptimizedHSCodeSelector from "../component/OptimizedHSCodeSelector";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, API_CONFIG, debugTokenManager } from "../API/Api";

import TenantSelectionPrompt from "../component/TenantSelectionPrompt";
import { useTenantSelection } from "../Context/TenantSelectionProvider";
import BuyerModal from "../component/BuyerModal";
// import TenantDashboard from "../component/TenantDashboard";

// Utility function to format numbers with commas
const formatNumberWithCommas = (value) => {
  if (!value || isNaN(parseFloat(value))) return "";
  const num = parseFloat(value);
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Utility function to format integers with commas
const formatIntegerWithCommas = (value) => {
  if (!value || isNaN(parseInt(value))) return "";
  const num = parseInt(value);
  return num.toLocaleString("en-US");
};

// Utility function to format editable numbers with commas but without decimals
const formatEditableNumberWithCommas = (value) => {
  if (!value || isNaN(parseFloat(value))) return "";
  const num = parseFloat(value);
  return num.toLocaleString("en-US");
};

// Utility function to remove commas and convert back to number
const removeCommas = (value) => {
  if (!value) return "";
  return value.replace(/,/g, "");
};

export default function CreateInvoice() {
  const { selectedTenant, tokensLoaded, retryTokenFetch } =
    useTenantSelection();

  const [formData, setFormData] = React.useState({
    invoiceType: "",
    invoiceDate: dayjs(),
    sellerNTNCNIC: "",
    sellerBusinessName: "",
    sellerProvince: "",
    sellerAddress: "",
    buyerNTNCNIC: "",
    buyerBusinessName: "",
    buyerProvince: "",
    buyerAddress: "",
    buyerRegistrationType: "",
    invoiceRefNo: "",
    companyInvoiceRefNo: "",
    transctypeId: "",
    items: [
      {
        hsCode: "",
        productDescription: "",
        rate: "",
        uoM: "",
        quantity: "1",
        unitPrice: "0.00", // Calculated field: Retail Price ÷ Quantity
        retailPrice: "0", // User input field
        totalValues: "0",
        valueSalesExcludingST: "0",
        salesTaxApplicable: "0",
        salesTaxWithheldAtSource: "0",
        sroScheduleNo: "",
        sroItemSerialNo: "",
        billOfLadingUoM: "",
        saleType: "",
        isSROScheduleEnabled: false,
        isSROItemEnabled: false,
        extraTax: "",
        furtherTax: "0",
        fedPayable: "0",
        discount: "0",
        isValueSalesManual: false,
        isTotalValuesManual: false,
        isSalesTaxManual: false,
        isSalesTaxWithheldManual: false,
        isFurtherTaxManual: false,
        isFedPayableManual: false,
      },
    ],
  });

  // Add state for tracking added items
  const [addedItems, setAddedItems] = React.useState([]);
  const [editingItemIndex, setEditingItemIndex] = React.useState(null);

  const [transactionTypes, setTransactionTypes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [saveValidateLoading, setSaveValidateLoading] = React.useState(false);
  const [isPrintable, setIsPrintable] = React.useState(false);
  const [province, setProvince] = React.useState([]);
  const [hsCodeList, setHsCodeList] = React.useState([]);
  const [invoiceTypes, setInvoiceTypes] = React.useState([]);
  const [buyers, setBuyers] = useState([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const [isBuyerModalOpen, setIsBuyerModalOpen] = useState(false);
  const navigate = useNavigate();
  const [allLoading, setAllLoading] = React.useState(true);
  const [transactionTypeId, setTransactionTypeId] = React.useState(null);
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [isSubmitVisible, setIsSubmitVisible] = React.useState(false);

  // Add timeout mechanism to prevent infinite loading
  React.useEffect(() => {
    if (!tokensLoaded && selectedTenant) {
      const timeout = setTimeout(() => {
        console.log(
          "createInvoiceForm: Loading timeout reached - tokens still not loaded after 10 seconds"
        );
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [tokensLoaded, selectedTenant]);

  // Hide Submit button whenever form data changes after a successful validation
  React.useEffect(() => {
    if (isSubmitVisible) {
      setIsSubmitVisible(false);
    }
    // We intentionally ignore dependencies like setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update form data when selected tenant changes
  React.useEffect(() => {
    console.log("SelectedCompany changed:", selectedTenant);
    if (selectedTenant) {
      console.log("Company data fields:", {
        sellerNTNCNIC: selectedTenant.sellerNTNCNIC,
        sellerBusinessName: selectedTenant.sellerBusinessName,
        sellerProvince: selectedTenant.sellerProvince,
        sellerAddress: selectedTenant.sellerAddress,
      });
      console.log("Available provinces:", province);
      console.log("Company province value:", selectedTenant.sellerProvince);
      localStorage.setItem("sellerProvince", selectedTenant.sellerProvince);
      console.log(
        "Province match found:",
        province.find(
          (p) => p.stateProvinceDesc === selectedTenant.sellerProvince
        )
      );

      setFormData((prev) => ({
        ...prev,
        sellerNTNCNIC: selectedTenant.sellerNTNCNIC || "",
        sellerBusinessName: selectedTenant.sellerBusinessName || "",
        sellerProvince: selectedTenant.sellerProvince || "",
        sellerAddress: selectedTenant.sellerAddress || "",
      }));
    } else {
      // Clear seller fields if no tenant is selected
      setFormData((prev) => ({
        ...prev,
        sellerNTNCNIC: "",
        sellerBusinessName: "",
        sellerProvince: "",
        sellerAddress: "",
      }));
    }
  }, [selectedTenant, province]);

  // Check for draft invoice data to edit
  React.useEffect(() => {
    const editInvoiceData = localStorage.getItem("editInvoiceData");
    if (editInvoiceData) {
      try {
        const invoiceData = JSON.parse(editInvoiceData);
        console.log("Loading draft invoice data for editing:", invoiceData);
        // Track editing draft id
        if (invoiceData.id) {
          setEditingId(invoiceData.id);
        }

        // Convert the invoice data to form format
        const formDataFromInvoice = {
          invoiceType: invoiceData.invoiceType || "",
          invoiceDate: invoiceData.invoiceDate
            ? dayjs(invoiceData.invoiceDate)
            : dayjs(),
          sellerNTNCNIC: invoiceData.sellerNTNCNIC || "",
          sellerBusinessName: invoiceData.sellerBusinessName || "",
          sellerProvince: invoiceData.sellerProvince || "",
          sellerAddress: invoiceData.sellerAddress || "",
          buyerNTNCNIC: invoiceData.buyerNTNCNIC || "",
          buyerBusinessName: invoiceData.buyerBusinessName || "",
          buyerProvince: invoiceData.buyerProvince || "",
          buyerAddress: invoiceData.buyerAddress || "",
          buyerRegistrationType: invoiceData.buyerRegistrationType || "",
          invoiceRefNo: invoiceData.invoiceRefNo || "",
          companyInvoiceRefNo: invoiceData.companyInvoiceRefNo || "",
          transctypeId:
            invoiceData.transctypeId ||
            invoiceData.scenario_id ||
            invoiceData.scenarioId ||
            "",
          items:
            invoiceData.items && invoiceData.items.length > 0
              ? invoiceData.items.map((item) => ({
                  hsCode: item.hsCode || "",
                  productDescription: item.productDescription || "",
                  rate: item.rate || "",
                  uoM: item.uoM || "",
                  quantity: item.quantity || "1",
                  unitPrice: item.unitPrice
                    ? parseFloat(item.unitPrice).toFixed(2)
                    : "0.00", // This will be recalculated from retail price
                  retailPrice: item.retailPrice || "0",
                  totalValues: item.totalValues || "0",
                  valueSalesExcludingST: item.valueSalesExcludingST || "0",
                  salesTaxApplicable: item.salesTaxApplicable || "0",
                  salesTaxWithheldAtSource:
                    item.salesTaxWithheldAtSource || "0",
                  sroScheduleNo: item.sroScheduleNo || "",
                  sroItemSerialNo: item.sroItemSerialNo || "",
                  billOfLadingUoM: item.billOfLadingUoM || "",
                  saleType: item.saleType || "",
                  isSROScheduleEnabled: item.rate ? true : false,
                  isSROItemEnabled: item.sroScheduleNo ? true : false,
                  extraTax: item.extraTax || "",
                  furtherTax: item.furtherTax || "0",
                  fedPayable: item.fedPayable || "0",
                  discount: item.discount || "0",
                  isValueSalesManual: false,
                  isTotalValuesManual: false,
                  isSalesTaxManual: false,
                  isSalesTaxWithheldManual: false,
                  isFurtherTaxManual: false,
                  isFedPayableManual: false,
                }))
              : [
                  {
                    hsCode: "",
                    productDescription: "",
                    rate: "",
                    uoM: "",
                    quantity: "1",
                    unitPrice: "0.00", // Calculated field: Retail Price ÷ Quantity
                    retailPrice: "0", // User input field
                    totalValues: "0",
                    valueSalesExcludingST: "0",
                    salesTaxApplicable: "0",
                    salesTaxWithheldAtSource: "0",
                    sroScheduleNo: "",
                    sroItemSerialNo: "",
                    billOfLadingUoM: "",
                    saleType: "",
                    isSROScheduleEnabled: false,
                    isSROItemEnabled: false,
                    extraTax: "",
                    furtherTax: "0",
                    fedPayable: "0",
                    discount: "0",
                    isValueSalesManual: false,
                    isTotalValuesManual: false,
                    isSalesTaxManual: false,
                    isSalesTaxWithheldManual: false,
                    isFurtherTaxManual: false,
                    isFedPayableManual: false,
                  },
                ],
        };

        setFormData(formDataFromInvoice);

        // Set the transactionTypeId and other required data for editing
        const scenarioId = invoiceData.scenario_id || invoiceData.scenarioId;
        if (scenarioId) {
          // Set transactionTypeId based on scenario
          let transactionTypeId = null;
          if (scenarioId === "SN016") {
            transactionTypeId = "25";
          } else if (scenarioId === "SN024") {
            transactionTypeId = "139";
          } else if (scenarioId === "SN002") {
            transactionTypeId = "75";
          } else if (scenarioId === "SN007") {
            transactionTypeId = "80"; // Zero rated sale
          } else {
            // For other scenarios, try to find from scenario data
            const scenarioData = JSON.parse(
              localStorage.getItem("scenarioData") || "[]"
            );
            const matchingScenario = scenarioData.find(
              (scenario) => scenario.scenarioId === scenarioId
            );
            if (matchingScenario) {
              transactionTypeId = matchingScenario.transactionTypeId;
            }
          }

          if (transactionTypeId) {
            localStorage.setItem("transactionTypeId", transactionTypeId);
            setTransactionTypeId(transactionTypeId);
            console.log(
              "Set transactionTypeId for editing:",
              transactionTypeId
            );
          }
        }

        // Set saleType if available from items
        if (
          invoiceData.items &&
          invoiceData.items.length > 0 &&
          invoiceData.items[0].saleType
        ) {
          localStorage.setItem("saleType", invoiceData.items[0].saleType);
        }

        // Set selectedRateId if available from items (for SRO components)
        if (
          invoiceData.items &&
          invoiceData.items.length > 0 &&
          invoiceData.items[0].rate
        ) {
          // We need to find the rate ID from the rate description
          // This will be handled by the RateSelector component when it loads
          // For now, we'll set a flag to indicate we're editing
          localStorage.setItem("editingInvoice", "true");
          console.log(
            "Set editing flag for invoice with rate:",
            invoiceData.items[0].rate
          );
          console.log("Rate field will be preserved during editing mode");
        }

        // Set buyer ID for editing - this is the key fix for buyer data not coming
        if (invoiceData.buyerNTNCNIC && invoiceData.buyerBusinessName) {
          // We'll set this after buyers are loaded
          localStorage.setItem(
            "editingBuyerData",
            JSON.stringify({
              buyerNTNCNIC: invoiceData.buyerNTNCNIC,
              buyerBusinessName: invoiceData.buyerBusinessName,
              buyerProvince: invoiceData.buyerProvince,
              buyerAddress: invoiceData.buyerAddress,
              buyerRegistrationType: invoiceData.buyerRegistrationType,
            })
          );
        }

        // Debug logging for edit data
        console.log("Edit data summary:", {
          transctypeId:
            invoiceData.transctypeId ||
            invoiceData.scenario_id ||
            invoiceData.scenarioId,
          transactionTypeId: transactionTypeId,
          hasItems: invoiceData.items && invoiceData.items.length > 0,
          firstItemRate:
            invoiceData.items && invoiceData.items.length > 0
              ? invoiceData.items[0].rate
              : null,
          firstItemSRO:
            invoiceData.items && invoiceData.items.length > 0
              ? invoiceData.items[0].sroScheduleNo
              : null,
          firstItemSROItem:
            invoiceData.items && invoiceData.items.length > 0
              ? invoiceData.items[0].sroItemSerialNo
              : null,
          buyerData: {
            buyerNTNCNIC: invoiceData.buyerNTNCNIC,
            buyerBusinessName: invoiceData.buyerBusinessName,
          },
        });

        // Clear the localStorage data after loading (keep id in state)
        localStorage.removeItem("editInvoiceData");

        // Show a notification that we're editing an invoice
        Swal.fire({
          icon: "info",
          title: "Editing Invoice",
          text: "Invoice data loaded for editing. Please review and make any necessary changes.",
          timer: 3000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error parsing edit invoice data:", error);
        localStorage.removeItem("editInvoiceData");
      }
    }
  }, [selectedTenant, tokensLoaded]);

  // Handle setting buyer ID when editing and buyers are loaded
  useEffect(() => {
    const editingBuyerData = localStorage.getItem("editingBuyerData");
    if (editingBuyerData && buyers.length > 0) {
      try {
        const buyerData = JSON.parse(editingBuyerData);
        console.log("Looking for buyer in loaded buyers:", buyerData);
        console.log("Available buyers:", buyers);

        // Find the buyer by matching NTN/CNIC and business name
        const matchingBuyer = buyers.find(
          (buyer) =>
            buyer.buyerNTNCNIC === buyerData.buyerNTNCNIC &&
            buyer.buyerBusinessName === buyerData.buyerBusinessName
        );

        if (matchingBuyer) {
          console.log("Found matching buyer:", matchingBuyer);
          setSelectedBuyerId(matchingBuyer.id);
        } else {
          console.warn("No matching buyer found for editing data:", buyerData);
        }

        // Clear the editing buyer data
        localStorage.removeItem("editingBuyerData");
      } catch (error) {
        console.error("Error parsing editing buyer data:", error);
        localStorage.removeItem("editingBuyerData");
      }
    }
  }, [buyers]);

  // Fix unit cost calculation when editing - ensure unit cost is calculated from retail price and quantity
  useEffect(() => {
    const isEditing = localStorage.getItem("editingInvoice") === "true";
    if (isEditing && formData.items && formData.items.length > 0) {
      console.log("Fixing unit cost calculation for editing mode");
      setFormData((prev) => {
        const updatedItems = prev.items.map((item) => {
          if (item.retailPrice && item.quantity && !item.isValueSalesManual) {
            const retailPrice = parseFloat(
              parseFloat(item.retailPrice || 0).toFixed(2)
            );
            const quantity = parseFloat(item.quantity || 0);
            const unitCost = quantity > 0 ? retailPrice / quantity : 0;
            console.log(
              `Recalculating unit cost for editing: ${retailPrice} ÷ ${quantity} = ${unitCost.toFixed(2)}`
            );
            return {
              ...item,
              unitPrice: unitCost.toFixed(2),
              valueSalesExcludingST: retailPrice.toString(),
            };
          }
          return item;
        });
        return { ...prev, items: updatedItems };
      });
    }
  }, [formData.items]);

  // Ensure rate field is properly set when editing
  useEffect(() => {
    const isEditing = localStorage.getItem("editingInvoice") === "true";
    if (isEditing && formData.items && formData.items.length > 0) {
      console.log("Ensuring rate field is properly set for editing mode");
      // The rate field should already be set from the form data initialization
      // This effect ensures that if there are any timing issues, the rate is preserved
      const hasRateValues = formData.items.some(
        (item) => item.rate && item.rate.trim() !== ""
      );
      if (hasRateValues) {
        console.log(
          "Rate values found in form data:",
          formData.items.map((item) => item.rate)
        );
        // Ensure the editing flag is maintained until rates are loaded
        localStorage.setItem("editingInvoice", "true");
      }
    }
  }, [formData.items]);

  React.useEffect(() => {
    console.log("useEffect triggered - selectedTenant:", selectedTenant);
    console.log("Tokens loaded:", tokensLoaded);

    // Debug token manager state
    debugTokenManager();

    // Don't make API calls if tokens are not loaded yet
    if (!selectedTenant || !tokensLoaded) {
      console.log("Skipping API calls - tokens not loaded yet");
      setAllLoading(false);
      return;
    }

    // Add a small delay to ensure token manager is properly updated
    const timer = setTimeout(() => {
      console.log("Starting API calls after token manager update delay");
      setAllLoading(true);

      Promise.allSettled([
        fetchData("pdi/v1/provinces").then((response) => {
          setProvince(response);
          localStorage.setItem("provinceResponse", JSON.stringify(response));
        }),
        // HS codes will be loaded by OptimizedHSCodeSelector component with caching
        Promise.resolve([]),
        (async () => {
          try {
            const token = API_CONFIG.getCurrentToken("sandbox");
            console.log(
              "Token for doctypecode API:",
              token ? "Available" : "Not available"
            );

            if (!token) {
              console.error("No token available for doctypecode API");
              setInvoiceTypes([
                { docTypeId: 4, docDescription: "Sale Invoice" },
                { docTypeId: 9, docDescription: "Debit Note" },
              ]);
              return;
            }

            const response = await fetch(
              "https://gw.fbr.gov.pk/pdi/v1/doctypecode",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (response.ok) {
              const data = await response.json();
              setInvoiceTypes(data);
            } else {
              console.error(
                "Doctypecode API failed with status:",
                response.status
              );
              setInvoiceTypes([
                { docTypeId: 4, docDescription: "Sale Invoice" },
                { docTypeId: 9, docDescription: "Debit Note" },
              ]);
            }
          } catch (error) {
            console.error("Error fetching doctypecode:", error);
            setInvoiceTypes([
              { docTypeId: 4, docDescription: "Sale Invoice" },
              { docTypeId: 9, docDescription: "Debit Note" },
            ]);
          }
        })(),
        (async () => {
          try {
            const data = await getTransactionTypes();
            console.log("Transaction types from API:", data);

            if (Array.isArray(data)) {
              console.log("Setting transaction types with array data:", data);
              setTransactionTypes(data);
            } else if (data && typeof data === "object") {
              // If it's a single object, wrap it in an array
              console.log(
                "Setting transaction types with single object wrapped in array:",
                [data]
              );
              setTransactionTypes([data]);
            } else {
              console.error("Unexpected data format:", data);
              setTransactionTypes([]);
            }
          } catch (error) {
            console.error("Error fetching transaction types:", error);
            setTransactionTypes([]);
          }
        })(),
      ]).finally(() => setAllLoading(false));
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedTenant, tokensLoaded]);

  // Monitor token availability and retry if needed
  useEffect(() => {
    if (selectedTenant && tokensLoaded) {
      const token = API_CONFIG.getCurrentToken("sandbox");
      if (!token) {
        console.log(
          "Token not available despite tokensLoaded=true, this might indicate a race condition"
        );
        // Don't automatically retry - let the user handle it manually if needed
        console.log(
          "Consider using the 'Retry Loading Credentials' button if data doesn't load"
        );
      }
    }
  }, [selectedTenant, tokensLoaded]);

  // Handle editing when scenario data is loaded
  useEffect(() => {
    const isEditing = localStorage.getItem("editingInvoice") === "true";
    const currentTransctypeId = formData.transctypeId;

    if (
      isEditing &&
      currentTransctypeId &&
      transactionTypes.length > 0 &&
      !transactionTypeId
    ) {
      console.log(
        "Editing mode detected with transaction types data loaded, setting transactionTypeId for:",
        currentTransctypeId
      );

      // Set transactionTypeId based on transctypeId
      const newTransactionTypeId = currentTransctypeId;

      if (newTransactionTypeId) {
        localStorage.setItem("transactionTypeId", newTransactionTypeId);
        setTransactionTypeId(newTransactionTypeId);
        console.log(
          "Set transactionTypeId for editing after transaction types data loaded:",
          newTransactionTypeId
        );
      }
    }
  }, [transactionTypes, formData.transctypeId, transactionTypeId]);

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        if (!selectedTenant) {
          console.error("No Company selected");
          setBuyers([]);
          return;
        }

        const response = await api.get(
          `/tenant/${selectedTenant.tenant_id}/buyers`
        );

        if (response.data.success) {
          setBuyers(response.data.data.buyers || []);
        } else {
          console.error("Failed to fetch buyers:", response.data.message);
          setBuyers([]);
        }
      } catch (error) {
        console.error("Error fetching buyers:", error);
        setBuyers([]);
      }
    };

    fetchBuyers();
  }, [selectedTenant]);

  // BuyerModal functions
  const openBuyerModal = () => {
    setIsBuyerModalOpen(true);
  };

  const closeBuyerModal = () => {
    setIsBuyerModalOpen(false);
  };

  const handleSaveBuyer = async (buyerData) => {
    try {
      const transformedData = {
        buyerNTNCNIC: buyerData.buyerNTNCNIC,
        buyerBusinessName: buyerData.buyerBusinessName,
        buyerProvince: buyerData.buyerProvince,
        buyerAddress: buyerData.buyerAddress,
        buyerRegistrationType: buyerData.buyerRegistrationType,
      };

      // Create new buyer
      const response = await api.post(
        `/tenant/${selectedTenant.tenant_id}/buyers`,
        transformedData
      );

      // Add the new buyer to the list
      setBuyers([...buyers, response.data.data]);

      // Close modal on success
      closeBuyerModal();

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Buyer Added Successfully!",
        text: "The buyer has been added to your system.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error saving buyer:", error);

      let errorMessage = "Error saving buyer.";

      if (error.response) {
        const { status, data } = error.response;

        if (status === 400) {
          if (data.message && data.message.includes("already exists")) {
            errorMessage =
              "A buyer with this NTN/CNIC already exists. Please use a different NTN/CNIC.";
          } else if (data.message && data.message.includes("validation")) {
            errorMessage =
              "Please check your input data. Some fields may be invalid or missing.";
          } else {
            errorMessage =
              data.message || "Invalid data provided. Please check all fields.";
          }
        } else if (status === 409) {
          errorMessage = "This buyer already exists in our system.";
        } else if (status === 500) {
          errorMessage = "Server error occurred. Please try again later.";
        } else {
          errorMessage =
            data.message || "An error occurred while saving the buyer.";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
      });
    }
  };

  useEffect(() => {
    if (!selectedBuyerId) return;
    const buyer = buyers.find((b) => b.id === selectedBuyerId);
    if (buyer) {
      setFormData((prev) => ({
        ...prev,
        buyerNTNCNIC: buyer.buyerNTNCNIC || "",
        buyerBusinessName: buyer.buyerBusinessName || "",
        buyerProvince: buyer.buyerProvince || "",
        buyerAddress: buyer.buyerAddress || "",
        buyerRegistrationType: buyer.buyerRegistrationType || "",
      }));
    }
  }, [selectedBuyerId, buyers]);

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[index] };

      // Utility to parse values for calculations
      const parseValue = (val, isFloat = true) =>
        val === "" ? (isFloat ? 0 : "") : isFloat ? parseFloat(val) || 0 : val;

      // Update the field - store the raw string value for display
      if (
        [
          "quantity",
          "unitPrice", // Calculated field
          "retailPrice", // User input field
          "valueSalesExcludingST",
          "salesTaxApplicable",
          "totalValues",
          "salesTaxWithheldAtSource",
          "extraTax",
          "furtherTax",
          "fedPayable",
          "discount",
        ].includes(field)
      ) {
        // Store the raw string value for display
        item[field] = value;
        if (field === "valueSalesExcludingST") {
          item.isValueSalesManual = true;
        }
        if (field === "totalValues") {
          item.isTotalValuesManual = true;
        }
        if (field === "salesTaxApplicable") {
          item.isSalesTaxManual = true;
        }
        if (field === "salesTaxWithheldAtSource") {
          item.isSalesTaxWithheldManual = true;
        }
        if (field === "furtherTax") {
          item.isFurtherTaxManual = true;
        }
        if (field === "fedPayable") {
          item.isFedPayableManual = true;
        }
      } else {
        item[field] = value;
      }

      // Handle SRO reset logic
      if (field === "rate" && value) {
        item.isSROScheduleEnabled = true;
        item.sroScheduleNo = "";
        item.sroItemSerialNo = "";
        item.isSROItemEnabled = false;
        item.isValueSalesManual = false;

        // Auto-set uoM to "Bill of lading" for transaction type when rate contains "/bill"
        if (value.includes("/bill")) {
          item.uoM = "Bill of lading";
          console.log(
            `Auto-setting uoM to "Bill of lading" for rate "${value}"`
          );
        }
        if (value.includes("/SqY")) {
          item.uoM = "SqY";
          console.log(`Auto-setting uoM to "SqY" for rate "${value}"`);
        }
      }

      if (field === "sroScheduleNo" && value) {
        item.isSROItemEnabled = true;
        item.sroItemSerialNo = "";
      }

      // Begin calculations
      const isThirdSchedule =
        item.saleType === "3rd Schedule Goods" ||
        prev.scenarioId === "SN027" ||
        prev.scenarioId === "SN008";

      // Auto-calculate unit cost and sales tax if not manual
      if (!item.isValueSalesManual) {
        const retailPrice = parseFloat(
          parseFloat(item.retailPrice || 0).toFixed(2)
        );
        const quantity = parseFloat(item.quantity || 0);

        // Calculate unit cost: Retail Price ÷ Quantity
        const unitCost = quantity > 0 ? retailPrice / quantity : 0;
        item.unitPrice = unitCost.toFixed(2);
        item.valueSalesExcludingST = retailPrice.toString();

        // Ensure unit cost is always calculated when retail price or quantity changes
        if (field === "retailPrice" || field === "quantity") {
          console.log(
            `Recalculating unit cost: ${retailPrice} ÷ ${quantity} = ${unitCost.toFixed(2)}`
          );
        }

        // Only calculate sales tax if not manually entered
        if (!item.isSalesTaxManual) {
          if (
            item.rate &&
            item.rate.toLowerCase() !== "exempt" &&
            item.rate !== "0%"
          ) {
            let salesTax = 0;

            // Check if rate is in "/bill" format (fixed amount per item)
            if (item.rate.includes("/bill")) {
              const fixedAmount =
                parseFloat(item.rate.replace("/bill", "")) || 0;
              const quantity = parseFloat(item.quantity || 0);
              salesTax = fixedAmount * quantity; // Fixed amount per item × quantity
            } else if (item.rate.includes("/SqY")) {
              // Check if rate is in "/SqY" format (fixed amount per SqY)
              const fixedAmount =
                parseFloat(item.rate.replace("/SqY", "")) || 0;
              const quantity = parseFloat(item.quantity || 0);
              salesTax = fixedAmount * quantity; // Fixed amount per SqY × quantity
            } else {
              // Handle percentage rates - use valueSalesExcludingST instead of retailPrice
              const rate = parseFloat((item.rate || "0").replace("%", "")) || 0;
              const rateFraction = rate / 100;
              const valueSales = parseFloat(item.valueSalesExcludingST || 0);
              salesTax = valueSales * rateFraction;
            }

            item.salesTaxApplicable = salesTax.toString();
          } else {
            item.salesTaxApplicable = "0";
          }
        }
      } else if (item.isValueSalesManual) {
        // If user manually entered value sales, only calculate sales tax if not manually entered
        if (!item.isSalesTaxManual) {
          if (
            item.rate &&
            item.rate.toLowerCase() !== "exempt" &&
            item.rate !== "0%"
          ) {
            let salesTax = 0;

            // Check if rate is in "/bill" format (fixed amount per item)
            if (item.rate.includes("/bill")) {
              const fixedAmount =
                parseFloat(item.rate.replace("/bill", "")) || 0;
              const quantity = parseFloat(item.quantity || 0);
              salesTax = fixedAmount * quantity; // Fixed amount per item × quantity
            } else if (item.rate.includes("/SqY")) {
              // Check if rate is in "/SqY" format (fixed amount per SqY)
              const fixedAmount =
                parseFloat(item.rate.replace("/SqY", "")) || 0;
              const quantity = parseFloat(item.quantity || 0);
              salesTax = fixedAmount * quantity; // Fixed amount per SqY × quantity
            } else {
              // Handle percentage rates - use valueSalesExcludingST
              const rate = parseFloat((item.rate || "0").replace("%", "")) || 0;
              const rateFraction = rate / 100;
              const valueSales = parseFloat(item.valueSalesExcludingST || 0);
              salesTax = valueSales * rateFraction;
            }

            item.salesTaxApplicable = salesTax.toString();
          } else {
            item.salesTaxApplicable = "0";
          }
        }
      }

      // Recalculate total value if it's not manually entered
      if (!item.isTotalValuesManual) {
        const calculatedTotalBeforeDiscount =
          parseFloat(item.valueSalesExcludingST || 0) +
          parseFloat(item.salesTaxApplicable || 0) +
          parseFloat(item.furtherTax || 0) +
          parseFloat(item.fedPayable || 0) +
          parseFloat(item.extraTax || 0);

        const discountAmount = parseFloat(item.discount || 0);

        const totalAfterDiscount =
          calculatedTotalBeforeDiscount - discountAmount;

        const taxWithheld = parseFloat(item.salesTaxWithheldAtSource || 0);

        const calculatedTotal = Number(
          (totalAfterDiscount + taxWithheld).toFixed(2)
        );
        item.totalValues = calculatedTotal.toString();
      }

      updatedItems[index] = item;
      return { ...prev, items: updatedItems };
    });
  };

  const addNewItem = () => {
    // Check if current item has required fields filled
    const currentItem = formData.items[0];
    if (!currentItem.hsCode || !currentItem.productDescription) {
      // Show error message if required fields are empty
      Swal.fire({
        icon: "warning",
        title: "Required Fields Missing",
        text: "Please fill in HS Code and Product Description before adding item.",
        confirmButtonColor: "#2A69B0",
      });
      return;
    }

    // Add current item to addedItems list
    const itemToAdd = { ...currentItem, id: Date.now() }; // Add unique ID
    setAddedItems((prev) => [...prev, itemToAdd]);

    // Reset the form to initial state
    const saleType =
      localStorage.getItem("saleType") || "Goods at Standard Rate (default)";
    setFormData((prev) => ({
      ...prev,
      items: [
        {
          hsCode: "",
          productDescription: "",
          rate: "",
          uoM: "",
          quantity: "1",
          unitPrice: "0.00", // Calculated field: Retail Price ÷ Quantity
          retailPrice: "0", // User input field
          totalValues: "0",
          valueSalesExcludingST: "0",
          salesTaxApplicable: "0",
          salesTaxWithheldAtSource: "0",
          sroScheduleNo: "",
          sroItemSerialNo: "",
          billOfLadingUoM: "",
          extraTax: "",
          furtherTax: "0",
          fedPayable: "0",
          discount: "0",
          saleType,
          isSROScheduleEnabled: false,
          isSROItemEnabled: false,
          isValueSalesManual: false,
          isTotalValuesManual: false,
          isSalesTaxManual: false,
          isSalesTaxWithheldManual: false,
          isFurtherTaxManual: false,
          isFedPayableManual: false,
        },
      ],
    }));

    // Clear editing state
    setEditingItemIndex(null);

    // Show success message
    Swal.fire({
      icon: "success",
      title: editingItemIndex
        ? "Item Updated Successfully"
        : "Item Added Successfully",
      text: editingItemIndex
        ? "Item has been updated in the list."
        : "Item has been added to the list.",
      confirmButtonColor: "#2A69B0",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const removeItem = (index) => {
    // Clean up item-specific localStorage entries and reindex remaining items
    const currentItems = formData.items;

    // Remove the current item's entries
    localStorage.removeItem(`selectedRateId_${index}`);
    localStorage.removeItem(`SROId_${index}`);

    // Reindex remaining items (shift down by 1)
    for (let i = index + 1; i < currentItems.length; i++) {
      const oldRateId = localStorage.getItem(`selectedRateId_${i}`);
      const oldSROId = localStorage.getItem(`SROId_${i}`);

      if (oldRateId) {
        localStorage.setItem(`selectedRateId_${i - 1}`, oldRateId);
        localStorage.removeItem(`selectedRateId_${i}`);
      }

      if (oldSROId) {
        localStorage.setItem(`SROId_${i - 1}`, oldSROId);
        localStorage.removeItem(`SROId_${i}`);
      }
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Function to delete item from addedItems list
  const deleteAddedItem = (itemId) => {
    setAddedItems((prev) => prev.filter((item) => item.id !== itemId));
    Swal.fire({
      icon: "success",
      title: "Item Deleted",
      text: "Item has been removed from the list.",
      confirmButtonColor: "#2A69B0",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Function to edit item from addedItems list
  const editAddedItem = (itemId) => {
    const itemToEdit = addedItems.find((item) => item.id === itemId);
    if (itemToEdit) {
      // Remove the item from addedItems
      setAddedItems((prev) => prev.filter((item) => item.id !== itemId));

      // Set the form data with the item to edit
      setFormData((prev) => ({
        ...prev,
        items: [itemToEdit],
      }));

      // Set editing state
      setEditingItemIndex(itemId);

      Swal.fire({
        icon: "info",
        title: "Edit Mode",
        text: "Item loaded for editing. Make changes and click Add to update.",
        confirmButtonColor: "#2A69B0",
      });
    }
  };

  const handleTransactionTypeChange = (transctypeId) => {
    console.log("Selected transaction type ID:", transctypeId);

    if (!transctypeId) {
      setFormData((prev) => ({
        ...prev,
        transctypeId: "",
      }));
      localStorage.removeItem("saleType");
      setTransactionTypeId(null);
      return;
    }

    // Check if there are added items and show warning
    if (addedItems.length > 0) {
      Swal.fire({
        title: "Warning",
        text: "Changing the transaction type will reset your list of added items. Are you sure you want to continue?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, change it!",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          // User confirmed - proceed with transaction type change and clear added items
          proceedWithTransactionTypeChange(transctypeId);
          // Clear added items
          setAddedItems([]);
          Swal.fire({
            title: "Items Cleared",
            text: "Your added items have been cleared due to transaction type change.",
            icon: "info",
            confirmButtonColor: "#2A69B0",
            timer: 2000,
            showConfirmButton: false,
          });
        }
        // If user cancels, do nothing - the transaction type remains unchanged
      });
      return;
    }

    // If no added items, proceed normally
    proceedWithTransactionTypeChange(transctypeId);
  };

  const proceedWithTransactionTypeChange = (transctypeId) => {
    // Find the selected transaction type from the API data
    const selectedTransactionType = transactionTypes.find(
      (item) => item.transactioN_TYPE_ID === transctypeId
    );

    if (!selectedTransactionType) {
      console.error("Selected transaction type not found in API data");
      return;
    }

    const saleType = selectedTransactionType.transactioN_DESC || "";

    console.log("Selected transaction type:", selectedTransactionType);
    console.log("Sale type:", saleType);
    console.log("Transaction type ID:", transctypeId);

    // Update localStorage and state
    localStorage.setItem("saleType", saleType);
    localStorage.setItem("transactionTypeId", transctypeId);
    setTransactionTypeId(transctypeId);

    // Update form data
    setFormData((prev) => {
      const isEditing = localStorage.getItem("editingInvoice") === "true";
      const items =
        prev.items.length > 0
          ? prev.items.map((item) => ({
              ...item,
              // Don't update product description - keep existing or clear if no HS code
              productDescription: item.hsCode ? item.productDescription : "",
              saleType: saleType,
              rate: isEditing ? item.rate : "", // Preserve rate when editing
            }))
          : [
              {
                hsCode: "",
                productDescription: "", // Don't set scenario description automatically
                rate: "",
                uoM: "",
                quantity: 1,
                totalValues: 0,
                valueSalesExcludingST: 0,
                fixedNotifiedValueOrRetailPrice: 1,
                salesTaxApplicable: 0,
                salesTaxWithheldAtSource: 0,
                sroScheduleNo: "",
                sroItemSerialNo: "",
                extraTax: "",
                furtherTax: 0,
                fedPayable: 0,
                discount: 0,
                saleType,
                isSROScheduleEnabled: false,
                isSROItemEnabled: false,
                isValueSalesManual: false,
              },
            ];
      return {
        ...prev,
        transctypeId: transctypeId,
        items,
      };
    });
  };

  const isFormEmptyForDraft = (data) => {
    const isNonEmptyString = (value) =>
      typeof value === "string" && value.trim() !== "";

    const nonSellerFields = [
      // Only consider buyer and basic invoice fields here; seller is auto-populated after company selection
      "buyerNTNCNIC",
      "buyerBusinessName",
      "buyerProvince",
      "buyerAddress",
      "invoiceRefNo",
      "companyInvoiceRefNo",
      "scenarioId",
    ];

    const hasBuyerOrInvoiceData = nonSellerFields.some((key) =>
      isNonEmptyString(data[key])
    );

    // Check both formData.items and addedItems for data
    const hasItemsData =
      (Array.isArray(data.items) &&
        data.items.some((item) => {
          const hasTextFields =
            (item.hsCode && item.hsCode.trim() !== "") ||
            (item.productDescription &&
              item.productDescription.trim() !== "") ||
            (item.rate && item.rate.trim() !== "") ||
            (item.uoM && item.uoM.trim() !== "");

          const hasNumericFields =
            Number(item.unitPrice) > 0 ||
            Number(item.valueSalesExcludingST) > 0 ||
            Number(item.salesTaxApplicable) > 0 ||
            Number(item.salesTaxWithheldAtSource) > 0 ||
            Number(item.totalValues) > 0 ||
            Number(item.extraTax) > 0 ||
            Number(item.furtherTax) > 0 ||
            Number(item.fedPayable) > 0 ||
            Number(item.discount) > 0;

          return hasTextFields || hasNumericFields;
        })) ||
      (Array.isArray(addedItems) && addedItems.length > 0);

    return !(hasBuyerOrInvoiceData || hasItemsData);
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      // Any new save invalidates prior validation
      setIsSubmitVisible(false);
      // Basic validation for save
      if (!selectedTenant) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please select a Company before saving the invoice.",
          confirmButtonColor: "#d33",
        });
        setSaveLoading(false);
        return;
      }

      // Prevent saving an empty form as draft
      if (isFormEmptyForDraft(formData)) {
        Swal.fire({
          icon: "warning",
          title: "Form is empty",
          text: "Please fill some fields before saving a draft.",
          confirmButtonColor: "#d33",
        });
        setSaveLoading(false);
        return;
      }

      // Use addedItems for saving if available, otherwise use formData.items
      const itemsToSave = addedItems.length > 0 ? addedItems : formData.items;

      // Validate all items before proceeding (for draft save, we can be more lenient)
      const validationErrors = [];
      itemsToSave.forEach((item, index) => {
        const itemErrors = validateItem(item, index + 1);
        if (itemErrors.length > 0) {
          validationErrors.push({
            itemNumber: index + 1,
            errors: itemErrors,
          });
        }
      });

      // If there are validation errors, show them and stop
      if (validationErrors.length > 0) {
        const errorMessages = validationErrors
          .map(
            (error) =>
              `Item ${error.itemNumber} validation failed: ${error.errors.join(", ")}`
          )
          .join("\n");

        Swal.fire({
          icon: "error",
          title: "Item Validation Failed",
          text: errorMessages,
          confirmButtonColor: "#d33",
        });
        setSaveLoading(false);
        return;
      }

      const cleanedData = {
        ...formData,
        invoiceDate: dayjs(formData.invoiceDate).format("YYYY-MM-DD"),
        transctypeId: formData.transctypeId,
        items: itemsToSave.map(
          (
            {
              isSROScheduleEnabled,
              isSROItemEnabled,
              retailPrice,
              isValueSalesManual,
              isTotalValuesManual,
              isSalesTaxManual,
              isSalesTaxWithheldManual,
              isFurtherTaxManual,
              isFedPayableManual,
              ...rest
            },
            index
          ) => {
            let uoMValue = rest.uoM?.trim() || null;
            if (rest.rate && rest.rate.includes("/bill")) {
              uoMValue = "Bill of lading";
            }
            if (rest.rate && rest.rate.includes("/SqY")) {
              uoMValue = "SqY";
            }

            const baseItem = {
              ...rest,
              fixedNotifiedValueOrRetailPrice: Number(
                Number(retailPrice).toFixed(2)
              ),
              quantity: rest.quantity === "" ? 0 : parseInt(rest.quantity, 10),
              unitPrice: Number(Number(rest.unitPrice || 0).toFixed(2)),
              valueSalesExcludingST: Number(
                Number(rest.valueSalesExcludingST || 0).toFixed(2)
              ),
              salesTaxApplicable:
                Math.round(Number(rest.salesTaxApplicable) * 100) / 100,
              salesTaxWithheldAtSource: Number(
                Number(rest.salesTaxWithheldAtSource || 0).toFixed(2)
              ),
              totalValues: Number(Number(rest.totalValues).toFixed(2)),
              sroScheduleNo: rest.sroScheduleNo?.trim() || null,
              sroItemSerialNo: rest.sroItemSerialNo?.trim() || null,
              uoM: uoMValue,
              productDescription: rest.productDescription?.trim() || null,
              saleType:
                rest.saleType?.trim() || "Goods at standard rate (default)",
              furtherTax: Number(Number(rest.furtherTax || 0).toFixed(2)),
              fedPayable: Number(Number(rest.fedPayable || 0).toFixed(2)),
              discount: Number(Number(rest.discount || 0).toFixed(2)),
            };

            if (rest.saleType?.trim() !== "Goods at Reduced Rate") {
              baseItem.extraTax = rest.extraTax;
            }

            return baseItem;
          }
        ),
      };

      // Include id when editing to update the same draft instead of creating a new one
      const payload = editingId
        ? { id: editingId, ...cleanedData }
        : cleanedData;
      const response = await api.post(
        `/tenant/${selectedTenant.tenant_id}/invoices/save`,
        payload
      );

      if (response.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Invoice Saved Successfully!",
          text: `Draft saved with number: ${response.data.data.invoice_number}`,
          confirmButtonColor: "#28a745",
        });
        // If this was a new draft, start editing that id from now on
        if (!editingId && response.data?.data?.invoice_id) {
          setEditingId(response.data.data.invoice_id);
        }
      }
    } catch (error) {
      console.error("Save Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to save invoice: ${
          error.response?.data?.message || error.message
        }`,
        confirmButtonColor: "#d33",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  // Function to validate individual items
  const validateItem = (item, itemNumber) => {
    const errors = [];

    // Required field validations
    if (!item.hsCode || item.hsCode.trim() === "") {
      errors.push("HS Code is required");
    }

    if (!item.productDescription || item.productDescription.trim() === "") {
      errors.push("Product Description is required");
    }

    if (!item.rate || item.rate.trim() === "") {
      errors.push("Rate is required");
    }

    if (!item.uoM || item.uoM.trim() === "") {
      errors.push("Unit of Measurement is required");
    }

    if (
      !item.quantity ||
      item.quantity === "" ||
      parseFloat(item.quantity) <= 0
    ) {
      errors.push("Quantity must be greater than 0");
    }

    if (
      !item.retailPrice ||
      item.retailPrice === "" ||
      parseFloat(item.retailPrice) < 0
    ) {
      errors.push("Retail Price cannot be negative");
    }

    // Validate retail price format (should be a valid number with up to 2 decimal places)
    if (item.retailPrice && !/^\d+(\.\d{1,2})?$/.test(item.retailPrice)) {
      errors.push(
        "Retail Price must be a valid number with up to 2 decimal places"
      );
    }

    if (
      !item.totalValues ||
      item.totalValues === "" ||
      parseFloat(item.totalValues) <= 0
    ) {
      errors.push("Total Value must be greater than 0");
    }

    // Numeric validations
    if (item.quantity && isNaN(parseFloat(item.quantity))) {
      errors.push("Quantity must be a valid number");
    }

    if (item.retailPrice && isNaN(parseFloat(item.retailPrice))) {
      errors.push("Retail Price must be a valid number");
    }

    if (item.totalValues && isNaN(parseFloat(item.totalValues))) {
      errors.push("Total Value must be a valid number");
    }

    if (item.salesTaxApplicable && isNaN(parseFloat(item.salesTaxApplicable))) {
      errors.push("Sales Tax must be a valid number");
    }

    if (item.furtherTax && isNaN(parseFloat(item.furtherTax))) {
      errors.push("Further Tax must be a valid number");
    }

    if (item.fedPayable && isNaN(parseFloat(item.fedPayable))) {
      errors.push("FED Payable must be a valid number");
    }

    return errors;
  };

  const handleSaveAndValidate = async () => {
    setSaveValidateLoading(true);
    try {
      // Basic validation for save and validate
      if (!selectedTenant) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please select a Company before saving the invoice.",
          confirmButtonColor: "#d33",
        });
        setSaveValidateLoading(false);
        return;
      }

      // Validate seller fields
      const sellerRequiredFields = [
        { field: "sellerNTNCNIC", label: "Seller NTN/CNIC" },
        { field: "sellerBusinessName", label: "Seller Business Name" },
        { field: "sellerProvince", label: "Seller Province" },
        { field: "sellerAddress", label: "Seller Address" },
      ];

      for (const { field, label } of sellerRequiredFields) {
        if (!formData[field] || formData[field].trim() === "") {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `${label} is required. Please select a Company to populate seller information.`,
            confirmButtonColor: "#d33",
          });
          setSaveValidateLoading(false);
          return;
        }
      }

      // Use addedItems for saving if available, otherwise use formData.items
      const itemsToSave = addedItems.length > 0 ? addedItems : formData.items;

      // Validate all items before proceeding
      const validationErrors = [];
      itemsToSave.forEach((item, index) => {
        const itemErrors = validateItem(item, index + 1);
        if (itemErrors.length > 0) {
          validationErrors.push({
            itemNumber: index + 1,
            errors: itemErrors,
          });
        }
      });

      // If there are validation errors, show them and stop
      if (validationErrors.length > 0) {
        const errorMessages = validationErrors
          .map(
            (error) =>
              `Item ${error.itemNumber} validation failed: ${error.errors.join(", ")}`
          )
          .join("\n");

        Swal.fire({
          icon: "error",
          title: "Item Validation Failed",
          text: errorMessages,
          confirmButtonColor: "#d33",
        });
        setSaveValidateLoading(false);
        return;
      }

      const cleanedData = {
        ...formData,
        invoiceDate: dayjs(formData.invoiceDate).format("YYYY-MM-DD"),
        transctypeId: formData.transctypeId,
        items: itemsToSave.map(
          (
            {
              isSROScheduleEnabled,
              isSROItemEnabled,
              retailPrice,
              isValueSalesManual,
              isTotalValuesManual,
              isSalesTaxManual,
              isSalesTaxWithheldManual,
              isFurtherTaxManual,
              isFedPayableManual,
              ...rest
            },
            index
          ) => {
            let uoMValue = rest.uoM?.trim() || null;
            if (rest.rate && rest.rate.includes("/bill")) {
              uoMValue = "Bill of lading";
            }
            if (rest.rate && rest.rate.includes("/SqY")) {
              uoMValue = "SqY";
            }

            const baseItem = {
              ...rest,
              fixedNotifiedValueOrRetailPrice: Number(
                Number(retailPrice).toFixed(2)
              ),
              quantity: rest.quantity === "" ? 0 : parseInt(rest.quantity, 10),
              unitPrice: Number(Number(rest.unitPrice || 0).toFixed(2)),
              valueSalesExcludingST: Number(
                Number(rest.valueSalesExcludingST || 0).toFixed(2)
              ),
              salesTaxApplicable:
                Math.round(Number(rest.salesTaxApplicable) * 100) / 100,
              salesTaxWithheldAtSource: Number(
                Number(rest.salesTaxWithheldAtSource || 0).toFixed(2)
              ),
              totalValues: Number(Number(rest.totalValues).toFixed(2)),
              sroScheduleNo: rest.sroScheduleNo?.trim() || null,
              sroItemSerialNo: rest.sroItemSerialNo?.trim() || null,
              uoM: uoMValue,
              productDescription: rest.productDescription?.trim() || null,
              saleType:
                rest.saleType?.trim() || "Goods at standard rate (default)",
              furtherTax: Number(Number(rest.furtherTax || 0).toFixed(2)),
              fedPayable: Number(Number(rest.fedPayable || 0).toFixed(2)),
              discount: Number(Number(rest.discount || 0).toFixed(2)),
            };

            if (rest.saleType?.trim() !== "Goods at Reduced Rate") {
              baseItem.extraTax = rest.extraTax;
            }

            return baseItem;
          }
        ),
      };

      // Debug: Log the cleaned data being sent
      console.log(
        "Cleaned data being sent to FBR validation:",
        JSON.stringify(cleanedData, null, 2)
      );

      const token = API_CONFIG.getCurrentToken("sandbox");
      console.log("Token used:", token ? "Available" : "Not available");

      // First, validate with FBR API
      const validateRes = await postData(
        "di_data/v1/di/validateinvoicedata",
        cleanedData,
        "sandbox"
      );

      // Handle different FBR response structures
      const hasValidationResponse =
        validateRes.data && validateRes.data.validationResponse;
      const isSuccess =
        validateRes.status === 200 &&
        (hasValidationResponse
          ? validateRes.data.validationResponse.statusCode === "00"
          : true);

      if (isSuccess) {
        // If validation passes, save the invoice with status 'saved'
        const payload = editingId
          ? { id: editingId, ...cleanedData }
          : cleanedData;
        const response = await api.post(
          `/tenant/${selectedTenant.tenant_id}/invoices/save-validate`,
          payload
        );

        if (response.status === 201) {
          Swal.fire({
            icon: "success",
            title: "Invoice Saved and Validated Successfully!",
            text: `Invoice validated with FBR and saved with number: ${response.data.data.invoice_number}`,
            confirmButtonColor: "#28a745",
          });
          if (!editingId && response.data?.data?.invoice_id) {
            setEditingId(response.data.data.invoice_id);
          }
          // Allow submission only after a successful save & validate
          setIsSubmitVisible(true);
        }
      } else {
        // If validation fails, show detailed FBR validation error
        let errorMessage = "Invoice validation with FBR failed.";
        let errorDetails = [];

        // Handle different error response structures
        if (hasValidationResponse) {
          const validation = validateRes.data.validationResponse;
          if (validation.error) {
            errorMessage = validation.error;
          }
          // Check for item-specific errors
          if (
            validation.invoiceStatuses &&
            Array.isArray(validation.invoiceStatuses)
          ) {
            validation.invoiceStatuses.forEach((status, index) => {
              if (status.error) {
                errorDetails.push(`Item ${index + 1}: ${status.error}`);
              }
            });
          }
        } else if (validateRes.data.error) {
          errorMessage = validateRes.data.error;
        } else if (validateRes.data.message) {
          errorMessage = validateRes.data.message;
        }

        // Check for additional error details in the response
        if (
          validateRes.data.invoiceStatuses &&
          Array.isArray(validateRes.data.invoiceStatuses)
        ) {
          validateRes.data.invoiceStatuses.forEach((status, index) => {
            if (status.error) {
              errorDetails.push(`Item ${index + 1}: ${status.error}`);
            }
          });
        }

        // Combine error message with details
        const fullErrorMessage =
          errorDetails.length > 0
            ? `${errorMessage}\n\nDetails:\n${errorDetails.join("\n")}`
            : errorMessage;

        Swal.fire({
          icon: "error",
          title: "FBR Validation Failed",
          text: fullErrorMessage,
          confirmButtonColor: "#d33",
          width: "600px",
          customClass: {
            popup: "swal-wide",
          },
        });
      }
    } catch (error) {
      console.error("Save and Validate Error:", error);

      // Enhanced error handling for different types of errors
      let errorTitle = "Error";
      let errorMessage = "Failed to save and validate invoice";
      let errorDetails = [];

      // Check if it's a validation error from FBR
      const errorResponse = error.response?.data;

      if (errorResponse) {
        // Handle FBR API validation errors
        const fbrError =
          errorResponse?.validationResponse?.error ||
          errorResponse?.error ||
          errorResponse?.message;

        if (fbrError) {
          errorTitle = "FBR Validation Error";
          errorMessage = fbrError;

          // Check for item-specific errors in validation response
          if (errorResponse.validationResponse?.invoiceStatuses) {
            errorResponse.validationResponse.invoiceStatuses.forEach(
              (status, index) => {
                if (status.error) {
                  errorDetails.push(`Item ${index + 1}: ${status.error}`);
                }
              }
            );
          }
        } else {
          // Handle other API response errors
          if (errorResponse.errors && Array.isArray(errorResponse.errors)) {
            errorDetails = errorResponse.errors;
          } else if (errorResponse.message) {
            errorMessage = errorResponse.message;
          }
        }
      } else {
        // Handle network and other errors
        if (error.code === "ECONNABORTED") {
          errorTitle = "Request Timeout";
          errorMessage = "FBR API request timed out. Please try again.";
        } else if (error.code === "ERR_NETWORK") {
          errorTitle = "Network Error";
          errorMessage =
            "Unable to connect to FBR API. Please check your internet connection.";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      // Combine error message with details
      const fullErrorMessage =
        errorDetails.length > 0
          ? `${errorMessage}\n\nDetails:\n${errorDetails.join("\n")}`
          : errorMessage;

      Swal.fire({
        icon: "error",
        title: errorTitle,
        text: fullErrorMessage,
        confirmButtonColor: "#d33",
        width: "600px",
        customClass: {
          popup: "swal-wide",
        },
      });
    } finally {
      setSaveValidateLoading(false);
    }
  };

  const handleSubmitChange = async () => {
    setLoading(true);
    try {
      // Validate that a tenant is selected and seller information is populated
      if (!selectedTenant) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please select a Company before creating an invoice.",
          confirmButtonColor: "#d33",
        });
        setLoading(false);
        return;
      }

      // Validate seller fields
      const sellerRequiredFields = [
        { field: "sellerNTNCNIC", label: "Seller NTN/CNIC" },
        { field: "sellerBusinessName", label: "Seller Business Name" },
        { field: "sellerProvince", label: "Seller Province" },
        { field: "sellerAddress", label: "Seller Address" },
      ];

      for (const { field, label } of sellerRequiredFields) {
        if (!formData[field] || formData[field].trim() === "") {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `${label} is required. Please select a Company to populate seller information.`,
            confirmButtonColor: "#d33",
          });
          setLoading(false);
          return;
        }
      }

      // Check if there are any items to validate
      if (
        addedItems.length === 0 &&
        (!formData.items || formData.items.length === 0)
      ) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "At least one item is required. Please add items to the list.",
          confirmButtonColor: "#d33",
        });
        setLoading(false);
        return;
      }

      // Use addedItems for validation if available, otherwise use formData.items
      const itemsToValidate =
        addedItems.length > 0 ? addedItems : formData.items;

      for (const [index, item] of itemsToValidate.entries()) {
        const itemRequiredFields = [
          {
            field: "hsCode",
            message: `HS Code is required for item ${index + 1}`,
          },
          {
            field: "productDescription",
            message: `Product Description is required for item ${index + 1}`,
          },
          { field: "rate", message: `Rate is required for item ${index + 1}` },
          {
            field: "uoM",
            message: `Unit of Measurement is required for item ${index + 1}`,
          },
          {
            field: "quantity",
            message: `Quantity is required for item ${index + 1}`,
          },
          {
            field: "retailPrice",
            message: `Retail Price is required for item ${index + 1}`,
          },
          {
            field: "valueSalesExcludingST",
            message: `Value Sales Excluding ST is required for item ${
              index + 1
            }`,
          },
          ...(item.rate && item.rate.toLowerCase() === "exempt"
            ? [
                {
                  field: "sroScheduleNo",
                  message: `SRO Schedule Number is required for exempt item ${
                    index + 1
                  }`,
                },
                {
                  field: "sroItemSerialNo",
                  message: `SRO Item Serial Number is required for exempt item ${
                    index + 1
                  }`,
                },
              ]
            : []),
          ...(item.rate &&
          item.rate.includes("/bill") &&
          formData.scenarioId === "SN018"
            ? []
            : []),
        ];

        // Debug: Log validation fields for this item
        console.log(`Validation for item ${index + 1}:`, {
          item: item,
          requiredFields: itemRequiredFields,
          billOfLadingUoM: item.billOfLadingUoM,
          rate: item.rate,
          transctypeId: formData.transctypeId,
        });

        for (const { field, message } of itemRequiredFields) {
          if (
            !item[field] ||
            (field === "valueSalesExcludingST" && item[field] <= 0) ||
            (field === "retailPrice" && parseFloat(item[field]) <= 0)
          ) {
            console.log(`Validation failed for field '${field}':`, {
              value: item[field],
              message: message,
            });
            Swal.fire({
              icon: "error",
              title: "Error",
              text: message,
              confirmButtonColor: "#d33",
            });
            setLoading(false);
            return;
          }
        }
      }

      // Use addedItems instead of formData.items for submission
      const itemsToSubmit = addedItems.length > 0 ? addedItems : formData.items;

      const cleanedItems = itemsToSubmit.map(
        (
          {
            isSROScheduleEnabled,
            isSROItemEnabled,
            retailPrice,
            isValueSalesManual,
            isTotalValuesManual,
            isSalesTaxManual,
            isSalesTaxWithheldManual,
            isFurtherTaxManual,
            isFedPayableManual,
            ...rest
          },
          index
        ) => {
          // Debug: Log the original billOfLadingUoM value
          console.log(`Data cleaning for item ${index}:`, {
            originalBillOfLadingUoM: rest.billOfLadingUoM,
            trimmedBillOfLadingUoM: rest.billOfLadingUoM?.trim(),
            finalBillOfLadingUoM: rest.billOfLadingUoM?.trim() || null,
          });

          // Special handling for uoM based on rate content
          let uoMValue = rest.uoM?.trim() || null;
          if (rest.rate && rest.rate.includes("/bill")) {
            uoMValue = "Bill of lading";
            console.log(
              `Forcing uoM to "Bill of lading" for rate "${rest.rate}"`
            );
          }
          if (rest.rate && rest.rate.includes("/SqY")) {
            uoMValue = "SqY";
            console.log(`Forcing uoM to "SqY" for rate "${rest.rate}"`);
          }

          const baseItem = {
            ...rest,
            fixedNotifiedValueOrRetailPrice: Number(
              Number(retailPrice).toFixed(2)
            ), // send as required by FBR
            quantity: rest.quantity === "" ? 0 : parseInt(rest.quantity, 10),
            unitPrice: Number(Number(rest.unitPrice || 0).toFixed(2)),
            valueSalesExcludingST: Number(
              Number(rest.valueSalesExcludingST || 0).toFixed(2)
            ),
            salesTaxApplicable:
              Math.round(Number(rest.salesTaxApplicable) * 100) / 100,
            salesTaxWithheldAtSource: Number(
              Number(rest.salesTaxWithheldAtSource || 0).toFixed(2)
            ),
            totalValues: Number(Number(rest.totalValues).toFixed(2)),
            sroScheduleNo: rest.sroScheduleNo?.trim() || null,
            sroItemSerialNo: rest.sroItemSerialNo?.trim() || null,
            uoM: uoMValue,
            productDescription: rest.productDescription?.trim() || null,
            saleType:
              rest.saleType?.trim() || "Goods at standard rate (default)",
            furtherTax: Number(Number(rest.furtherTax || 0).toFixed(2)),
            fedPayable: Number(Number(rest.fedPayable || 0).toFixed(2)),
            discount: Number(Number(rest.discount || 0).toFixed(2)),
          };

          // Only include extraTax if saleType is NOT "Goods at Reduced Rate"
          if (rest.saleType?.trim() !== "Goods at Reduced Rate") {
            baseItem.extraTax = rest.extraTax;
          }

          return baseItem;
        }
      );

      const cleanedData = {
        ...formData,
        invoiceDate: dayjs(formData.invoiceDate).format("YYYY-MM-DD"),
        transctypeId: formData.transctypeId,
        items: cleanedItems,
      };

      // Debug: Log the cleaned data being sent to FBR
      console.log(
        "Cleaned data being sent to FBR:",
        JSON.stringify(cleanedData, null, 2)
      );

      const token = API_CONFIG.getCurrentToken("sandbox");
      console.log("Token used:", token ? "Available" : "Not available");

      // STEP 1: Hit FBR API First
      console.log("Step 1: Calling FBR API to submit invoice data...");
      const fbrResponse = await postData(
        "di_data/v1/di/postinvoicedata",
        cleanedData,
        "sandbox"
      );
      console.log("FBR Response:", fbrResponse);

      // Handle different FBR response structures
      let fbrInvoiceNumber = null;
      let isSuccess = false;
      let errorDetails = null;

      if (fbrResponse.status === 200) {
        // Check for validationResponse structure (old format)
        if (fbrResponse.data && fbrResponse.data.validationResponse) {
          const validation = fbrResponse.data.validationResponse;
          isSuccess = validation.statusCode === "00";
          fbrInvoiceNumber = fbrResponse.data.invoiceNumber;
          if (!isSuccess) {
            errorDetails = validation;
          }
        }
        // Check for direct response structure (new format)
        else if (
          fbrResponse.data &&
          (fbrResponse.data.invoiceNumber || fbrResponse.data.success)
        ) {
          isSuccess = true;
          fbrInvoiceNumber = fbrResponse.data.invoiceNumber;
        }
        // Check for error response structure
        else if (fbrResponse.data && fbrResponse.data.error) {
          isSuccess = false;
          errorDetails = fbrResponse.data;
        }
        // Check for empty response - this might be a successful submission
        else if (!fbrResponse.data || fbrResponse.data === "") {
          console.log(
            "FBR returned empty response with 200 status - treating as successful submission"
          );
          isSuccess = true;
          fbrInvoiceNumber = `FBR_${Date.now()}`;
        }
        // If response is unexpected, treat as success if status is 200
        else {
          isSuccess = true;
          console.log(
            "FBR returned 200 status with unexpected response structure, treating as success"
          );
        }
      }

      if (!isSuccess) {
        const details = errorDetails || {
          raw: fbrResponse.data ?? null,
          note: "Unexpected FBR response structure",
          status: fbrResponse.status,
        };

        const collectErrorMessages = (det) => {
          const messages = [];
          if (det && typeof det === "object") {
            if (det.error) messages.push(det.error);
            if (Array.isArray(det.invoiceStatuses)) {
              det.invoiceStatuses.forEach((s) => {
                if (s?.error) messages.push(`Item ${s.itemSNo}: ${s.error}`);
              });
            }
            if (det.validationResponse) {
              const v = det.validationResponse;
              if (v?.error) messages.push(v.error);
              if (Array.isArray(v?.invoiceStatuses)) {
                v.invoiceStatuses.forEach((s) => {
                  if (s?.error) messages.push(`Item ${s.itemSNo}: ${s.error}`);
                });
              }
            }
          }
          return messages.filter(Boolean);
        };

        const errorMessages = collectErrorMessages(details);
        const message = errorMessages.length
          ? `FBR submission failed: ${errorMessages.join("; ")}`
          : "FBR submission failed";

        throw new Error(message);
      }

      // Ensure we have a valid FBR invoice number
      if (!fbrInvoiceNumber || fbrInvoiceNumber.trim() === "") {
        throw new Error(
          "FBR submission failed: No invoice number received from FBR"
        );
      }

      console.log("FBR API Success - Invoice Number:", fbrInvoiceNumber);

      // STEP 2: Hit Your Backend API Second
      console.log(
        "Step 2: Calling backend API to save invoice with FBR invoice number..."
      );

      // Prepare data for backend with FBR invoice number
      // Note: We need to include the original form data fields that were removed during FBR cleaning
      const backendData = {
        ...formData, // Use original form data to preserve all fields
        invoiceDate: dayjs(formData.invoiceDate).format("YYYY-MM-DD"),
        transctypeId: formData.transctypeId,
        items: cleanedItems, // Use cleaned items for consistency
        fbr_invoice_number: fbrInvoiceNumber,
        status: "posted", // Set status as posted since it's been submitted to FBR
      };

      console.log(
        "Backend data being sent:",
        JSON.stringify(backendData, null, 2)
      );

      // Call backend API to save invoice
      const backendResponse = await api.post(
        `/tenant/${selectedTenant.tenant_id}/invoices`,
        backendData
      );

      console.log("Backend API Response:", backendResponse);

      if (backendResponse.status !== 200) {
        throw new Error(
          `Failed to save invoice to backend database. Status: ${backendResponse.status}`
        );
      }

      console.log(
        "Backend API Success - Invoice saved with ID:",
        backendResponse.data?.data?.invoice_id
      );

      // STEP 3: Delete the saved invoice if it exists
      if (editingId) {
        try {
          console.log("Step 3: Deleting saved invoice with ID:", editingId);
          const deleteResponse = await api.delete(
            `/tenant/${selectedTenant.tenant_id}/invoices/${editingId}`
          );

          if (deleteResponse.status === 200) {
            console.log("Saved invoice deleted successfully");
          } else {
            console.warn(
              "Failed to delete saved invoice, but submission was successful"
            );
          }
        } catch (deleteError) {
          console.warn("Error deleting saved invoice:", deleteError);
          // Don't show error to user since the main submission was successful
        }
      }

      // STEP 4: Show Success Message
      Swal.fire({
        icon: "success",
        title: "Invoice Submitted Successfully!",
        text: `FBR Invoice Number: ${fbrInvoiceNumber}`,
        showCancelButton: true,
        confirmButtonText: "View Invoice",
        cancelButtonText: "Create New",
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#6c757d",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/your-invoices");
        } else {
          resetForm();
        }
        // Always reset editingId after successful submission
        setEditingId(null);
      });
      setIsPrintable(true);
    } catch (error) {
      console.error("Submit Error:", error);

      // Provide more specific error messages based on error type
      let errorMessage = "Failed to submit invoice";
      let errorTitle = "Submission Error";

      if (error.response) {
        // Backend API error
        if (error.response.status === 401) {
          errorTitle = "Authentication Error";
          errorMessage = "Please log in again. Your session may have expired.";
        } else if (error.response.status === 403) {
          errorTitle = "Access Denied";
          errorMessage = "You don't have permission to perform this action.";
        } else if (error.response.status === 409) {
          errorTitle = "Duplicate Invoice";
          errorMessage = "An invoice with this number already exists.";
        } else if (error.response.status >= 500) {
          errorTitle = "Server Error";
          errorMessage = "Backend server error. Please try again later.";
        } else {
          errorMessage =
            error.response.data?.message ||
            `Backend error: ${error.response.status}`;
        }
      } else if (error.request) {
        // Network error
        errorTitle = "Network Error";
        errorMessage =
          "Unable to connect to server. Please check your internet connection.";
      } else {
        // Other errors (like FBR API errors)
        errorMessage = error.message || "An unexpected error occurred";
      }

      Swal.fire({
        icon: "error",
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    // Use addedItems for printing if available, otherwise use formData
    const dataToPrint =
      addedItems.length > 0 ? { ...formData, items: addedItems } : formData;
    printInvoice(dataToPrint);
  };

  const resetForm = () => {
    // Clean up all item-specific localStorage entries
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("selectedRateId_") || key.startsWith("SROId_"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    setFormData({
      invoiceType: "",
      invoiceDate: dayjs(),
      sellerNTNCNIC: selectedTenant?.sellerNTNCNIC || "",
      sellerBusinessName: selectedTenant?.sellerBusinessName || "",
      sellerProvince: selectedTenant?.sellerProvince || "",
      sellerAddress: selectedTenant?.sellerAddress || "",
      buyerNTNCNIC: "",
      buyerBusinessName: "",
      buyerProvince: "",
      buyerAddress: "",
      buyerRegistrationType: "",
      invoiceRefNo: "",
      companyInvoiceRefNo: "",
      transctypeId: "",
      items: [
        {
          hsCode: "",
          productDescription: "",
          rate: "",
          uoM: "",
          quantity: "1",
          unitPrice: "0.00", // Calculated field: Retail Price ÷ Quantity
          retailPrice: "0", // User input field
          totalValues: "0",
          valueSalesExcludingST: "0",
          salesTaxApplicable: "0",
          salesTaxWithheldAtSource: "0",
          sroScheduleNo: "",
          sroItemSerialNo: "",
          billOfLadingUoM: "",
          saleType: "",
          isSROScheduleEnabled: false,
          isSROItemEnabled: false,
          extraTax: "",
          furtherTax: "0",
          fedPayable: "0",
          discount: "0",
          isValueSalesManual: false,
          isTotalValuesManual: false,
          isSalesTaxManual: false,
          isSalesTaxWithheldManual: false,
          isFurtherTaxManual: false,
          isFedPayableManual: false,
        },
      ],
    });
    setIsSubmitVisible(false);
    setSelectedBuyerId("");
    setTransactionTypeId(null);
    setAddedItems([]);
    setEditingItemIndex(null);
  };

  // Show loading state when tokens are not loaded
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

  if (!tokensLoaded && selectedTenant) {
    console.log(
      "createInvoiceForm: Showing loading state - tokensLoaded:",
      tokensLoaded
    );
    console.log(
      "createInvoiceForm: selectedTenant:",
      selectedTenant ? "exists" : "null"
    );
    console.log("createInvoiceForm: loadingTimeout:", loadingTimeout);

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          flexDirection: "column",
        }}
      >
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          {loadingTimeout
            ? "Loading is taking longer than expected..."
            : "Loading Company credentials..."}
        </Typography>
        <Button variant="outlined" onClick={retryTokenFetch} sx={{ mt: 2 }}>
          Retry Loading Credentials
        </Button>
        {loadingTimeout && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 2, textAlign: "center" }}
          >
            If the issue persists, try refreshing the page or selecting a
            different Company.
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <TenantSelectionPrompt>
      <Box
        className="professional-form"
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          mt: selectedTenant ? 1 : 4,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          maxWidth: "100%",
          mx: "auto",
          mb: 0,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
            borderRadius: 2,
            pointerEvents: "none",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            gap: 1,
            mb: 1.5,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            Invoice Creation
          </Typography>
          {selectedTenant && (
            <Tooltip
              title={`${selectedTenant.sellerBusinessName} | ${selectedTenant.sellerNTNCNIC} | ${selectedTenant.sellerProvince} | ${selectedTenant.sellerAddress}`}
              arrow
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.8,
                  borderRadius: 25,
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  backdropFilter: "blur(10px)",
                  maxWidth: { xs: "100%", sm: 600 },
                  overflow: "hidden",
                }}
              >
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    minWidth: 0,
                  }}
                >
                  <Business fontSize="small" />
                  <strong>{selectedTenant.sellerBusinessName}</strong>
                </Typography>
                <Typography variant="body2" noWrap>
                  |
                </Typography>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <CreditCard fontSize="small" />
                  {selectedTenant.sellerNTNCNIC}
                </Typography>
                <Typography variant="body2" noWrap>
                  |
                </Typography>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <MapIcon fontSize="small" />
                  {selectedTenant.sellerProvince}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
        {/* Invoice Type Section */}
        <Box
          className="form-section"
          sx={{
            border: "none",
            borderRadius: 2,
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            background: "rgba(255, 255, 255, 0.95)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Typography
            className="section-title"
            variant="h6"
            sx={{
              mb: 1.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontSize: "1rem",
            }}
          >
            Invoice Details
          </Typography>
          <Box
            className="compact-grid"
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 2,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel id="invoice-type-label">Invoice Type</InputLabel>
              <Select
                labelId="invoice-type-label"
                value={formData.invoiceType}
                label="Invoice Type"
                onChange={(e) => handleChange("invoiceType", e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#e5e7eb" },
                  },
                }}
              >
                {invoiceTypes.map((type) => (
                  <MenuItem key={type.docTypeId} value={type.docDescription}>
                    {type.docDescription}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Invoice Date"
                value={formData.invoiceDate}
                onChange={(date) => handleChange("invoiceDate", date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    sx: {
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#e5e7eb" },
                      },
                      "& .MuiInputLabel-root": { color: "#6b7280" },
                    },
                  },
                }}
              />
            </LocalizationProvider>

            <TextField
              fullWidth
              size="small"
              label="Invoice Ref No."
              value={formData.invoiceRefNo}
              onChange={(e) => handleChange("invoiceRefNo", e.target.value)}
              variant="outlined"
              disabled={formData.invoiceType === "Sale Invoice"}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#e5e7eb" },
                },
                "& .MuiInputLabel-root": { color: "#6b7280" },
              }}
            />

            <TextField
              fullWidth
              size="small"
              label="Company Invoice Ref No."
              value={formData.companyInvoiceRefNo}
              onChange={(e) =>
                handleChange("companyInvoiceRefNo", e.target.value)
              }
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#e5e7eb" },
                },
                "& .MuiInputLabel-root": { color: "#6b7280" },
              }}
            />
          </Box>
        </Box>

        {/* Buyer Detail Section */}
        <Box
          className="form-section"
          sx={{
            border: "none",
            borderRadius: 2,
            p: { xs: 1.5, sm: 4 },
            mb: 2,
            background: "rgba(255, 255, 255, 0.95)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 2,
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Box
                sx={{
                  position: "absolute",
                  top: -31,
                  right: 0,
                  zIndex: 2,
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={openBuyerModal}
                  sx={{
                    color: "#007AFF",
                    borderColor: "#007AFF",
                    backgroundColor: "rgba(0, 122, 255, 0.05)",
                    fontSize: "0.75rem",
                    padding: "2px 4px",
                    minWidth: "auto",
                    height: "23px",
                    "&:hover": {
                      backgroundColor: "rgba(0, 122, 255, 0.1)",
                      borderColor: "#0056CC",
                    },
                  }}
                >
                  Add Buyer
                </Button>
              </Box>
              <Autocomplete
                fullWidth
                size="small"
                options={buyers}
                getOptionLabel={(option) =>
                  option.buyerBusinessName
                    ? `${option.buyerBusinessName} (${option.buyerNTNCNIC})`
                    : ""
                }
                value={buyers.find((b) => b.id === selectedBuyerId) || null}
                onChange={(_, newValue) =>
                  setSelectedBuyerId(newValue ? newValue.id : "")
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Buyer"
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#e5e7eb" },
                      },
                      "& .MuiInputLabel-root": { color: "#6b7280" },
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionKey={(option) =>
                  option.id ||
                  option.buyerNTNCNIC ||
                  option.buyerBusinessName ||
                  option.buyerAddress ||
                  Math.random()
                }
              />
            </Box>
            <Box>
              <Autocomplete
                options={transactionTypes}
                getOptionLabel={(option) =>
                  typeof option === "string"
                    ? option
                    : `${option.transactioN_TYPE_ID} - ${option.transactioN_DESC}`
                }
                value={
                  transactionTypes.find(
                    (type) => type.transactioN_TYPE_ID === formData.transctypeId
                  ) || null
                }
                onChange={(event, newValue) => {
                  if (newValue) {
                    handleTransactionTypeChange(newValue.transactioN_TYPE_ID);
                  } else {
                    handleTransactionTypeChange("");
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Transaction Type"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#e5e7eb" },
                      },
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option.transactioN_TYPE_ID === value.transactioN_TYPE_ID
                }
                freeSolo
                selectOnFocus
                clearOnBlur={false}
                handleHomeEndKeys
              />
            </Box>
          </Box>

          {/* Only keeping Select Buyer field; removing other buyer detail fields */}
        </Box>
        {/* Items Section */}
        <Box
          sx={{
            border: "none",
            borderRadius: 2,
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            background: "rgba(255, 255, 255, 0.95)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 1.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontSize: "1rem",
            }}
          >
            Items
          </Typography>

          {formData.items.map((item, index) => (
            <Box
              key={index}
              sx={{
                mb: 1,
                border: "1px solid rgba(99, 102, 241, 0.15)",
                borderRadius: 1,
                p: { xs: 1, sm: 1.25 },
                background: "rgba(248, 250, 252, 0.7)",
                position: "relative",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 3px 10px rgba(99, 102, 241, 0.15)",
                  background: "rgba(248, 250, 252, 0.9)",
                },
              }}
            >
              {/* HS Code Section - Full Line */}
              <Box
                sx={{
                  border: "none",
                  borderRadius: 1,
                  p: 1,
                  mb: 1,
                  background: "rgba(255, 255, 255, 0.6)",
                  transition: "all 0.2s ease",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: 1,
                  }}
                >
                  <OptimizedHSCodeSelector
                    index={index}
                    item={item}
                    handleItemChange={handleItemChange}
                    environment="sandbox"
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 1,
                  mb: 1,
                }}
              >
                <RateSelector
                  key={`RateSelector-${index}`}
                  index={index}
                  item={item}
                  handleItemChange={handleItemChange}
                  transactionTypeId={transactionTypeId}
                  selectedProvince={formData.sellerProvince}
                />
                <SROScheduleNumber
                  key={`SROScheduleNumber-${index}`}
                  index={index}
                  item={item}
                  disabled={!item.isSROScheduleEnabled}
                  handleItemChange={handleItemChange}
                  selectedProvince={formData.sellerProvince}
                />
                <SROItem
                  key={`SROItem-${index}`}
                  index={index}
                  disabled={!item.isSROItemEnabled}
                  item={item}
                  handleItemChange={handleItemChange}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: 1,
                  mb: 1,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Product Description"
                  value={item.productDescription || ""}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      "productDescription",
                      e.target.value
                    )
                  }
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#e5e7eb" },
                    },
                    "& .MuiInputLabel-root": { color: "#6b7280" },
                  }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Sales Type"
                  type="text"
                  value={item.saleType || ""}
                  onChange={(e) =>
                    handleItemChange(index, "saleType", e.target.value)
                  }
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#e5e7eb" },
                      backgroundColor: "#f9fafb",
                    },
                    "& .MuiInputLabel-root": { color: "#6b7280" },
                  }}
                />
                <UnitOfMeasurement
                  key={`UnitOfMeasurement-${index}`}
                  index={index}
                  item={item}
                  handleItemChange={handleItemChange}
                  hsCode={item.hsCode}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 1,
                  mb: 1,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Unit Cost"
                  type="text"
                  value={formatNumberWithCommas(item.unitPrice)}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#e5e7eb" },
                    },
                    "& .MuiInputLabel-root": { color: "#6b7280" },
                    "& .MuiInputBase-input.Mui-readOnly": {
                      backgroundColor: "#f5f5f5",
                      cursor: "not-allowed",
                    },
                  }}
                />
                <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Qty"
                    type="text"
                    value={formatIntegerWithCommas(item.quantity)}
                    onChange={(e) => {
                      const value = removeCommas(e.target.value);
                      // Allow only numbers
                      if (value === "" || /^\d*$/.test(value)) {
                        handleItemChange(index, "quantity", value);
                      }
                    }}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Total Price"
                    type="text"
                    value={formatEditableNumberWithCommas(item.retailPrice)}
                    onChange={(e) => {
                      const value = removeCommas(e.target.value);
                      // Allow only numbers and decimal points
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        handleItemChange(index, "retailPrice", value);
                      }
                    }}
                    onBlur={(e) => {
                      // Format to 2 decimal places when leaving the field
                      const value = removeCommas(e.target.value);
                      if (value && !isNaN(parseFloat(value))) {
                        const formattedValue = parseFloat(value).toFixed(2);
                        handleItemChange(index, "retailPrice", formattedValue);
                      }
                    }}
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#e5e7eb" },
                      },
                      "& .MuiInputLabel-root": { color: "#6b7280" },
                    }}
                  />
                </Box>
                <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value Sales (Excl. ST)"
                    type="text"
                    value={formatNumberWithCommas(item.valueSalesExcludingST)}
                    InputProps={{
                      readOnly: true,
                    }}
                    variant="outlined"
                    sx={{
                      "& .MuiInputBase-input.Mui-readOnly": {
                        backgroundColor: "#f5f5f5",
                        cursor: "not-allowed",
                      },
                    }}
                  />
                </Box>

                <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Sales Tax Applicable"
                    type="text"
                    value={formatNumberWithCommas(item.salesTaxApplicable)}
                    InputProps={{
                      readOnly: true,
                    }}
                    variant="outlined"
                    sx={{
                      "& .MuiInputBase-input.Mui-readOnly": {
                        backgroundColor: "#f5f5f5",
                        cursor: "not-allowed",
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 1 }}>
                <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="ST Withheld at Source"
                    type="text"
                    value={formatEditableNumberWithCommas(
                      item.salesTaxWithheldAtSource
                    )}
                    onChange={(e) => {
                      const value = removeCommas(e.target.value);
                      // Allow only numbers and decimal points
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        handleItemChange(
                          index,
                          "salesTaxWithheldAtSource",
                          value
                        );
                      }
                    }}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Extra Tax"
                    type="text"
                    value={formatEditableNumberWithCommas(item.extraTax)}
                    onChange={(e) => {
                      const value = removeCommas(e.target.value);
                      // Allow only numbers and decimal points
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        handleItemChange(index, "extraTax", value);
                      }
                    }}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Further Tax"
                    type="text"
                    value={formatEditableNumberWithCommas(item.furtherTax)}
                    onChange={(e) => {
                      const value = removeCommas(e.target.value);
                      // Allow only numbers and decimal points
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        handleItemChange(index, "furtherTax", value);
                      }
                    }}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="FED Payable"
                    type="text"
                    value={formatEditableNumberWithCommas(item.fedPayable)}
                    onChange={(e) => {
                      const value = removeCommas(e.target.value);
                      // Allow only numbers and decimal points
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        handleItemChange(index, "fedPayable", value);
                      }
                    }}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ flex: "1 1 18%", minWidth: "150px" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Discount"
                    type="text"
                    value={formatEditableNumberWithCommas(item.discount)}
                    onChange={(e) => {
                      const value = removeCommas(e.target.value);
                      // Allow only numbers and decimal points
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        handleItemChange(index, "discount", value);
                      }
                    }}
                    variant="outlined"
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1.5,
                  mt: 1,
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ flex: "0 1 18%", minWidth: "150px" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Total Values: {formatNumberWithCommas(item.totalValues)}
                  </Typography>
                </Box>
                <Tooltip title={editingItemIndex ? "Update Item" : "Add Item"}>
                  <IconButton
                    aria-label={editingItemIndex ? "update item" : "add item"}
                    onClick={addNewItem}
                    sx={{
                      color: editingItemIndex ? "#f57c00" : "#2A69B0",
                      transition: "color 0.2s ease",
                    }}
                  >
                    <IoIosAddCircle size={35} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* <Box sx={{ position: "relative", mt: 0.5, textAlign: "left" }}>
                <IconButton
                  aria-label="remove item"
                  color="error"
                  size="small"
                  onClick={() => removeItem(index)}
                  sx={{
                    mt: 0.5,
                    borderRadius: 1.5,
                  }}
                >
                  <FaTrash />
                </IconButton>
              </Box> */}
            </Box>
          ))}
        </Box>

        {/* Helper message when no items are added */}
        {addedItems.length === 0 && (
          <Box
            sx={{
              border: "2px dashed #2A69B0",
              borderRadius: 2,
              p: 3,
              mb: 2,
              background: "rgba(248, 250, 252, 0.7)",
              textAlign: "center",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: "#2A69B0",
                fontWeight: 500,
                mb: 1,
              }}
            >
              📋 No items added yet
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#2A69B0",
                fontSize: "0.875rem",
              }}
            >
              Fill in the item details above and click the + button to add
              items. Save and Validate buttons will appear once you add items.
            </Typography>
          </Box>
        )}

        {/* Added Items Table */}
        {addedItems.length > 0 && (
          <Box
            sx={{
              border: "none",
              borderRadius: 2,
              p: { xs: 1.5, sm: 2 },
              mb: 2,
              background: "rgba(255, 255, 255, 0.95)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 1.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                fontSize: "1rem",
              }}
            >
              Added Items ({addedItems.length})
            </Typography>

            <Box
              sx={{
                overflowX: "auto",
                border: "1px solid rgba(99, 102, 241, 0.15)",
                borderRadius: 1,
                background: "rgba(248, 250, 252, 0.7)",
              }}
            >
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "rgba(99, 102, 241, 0.1)" }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                        HS Code
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                        Product Description
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                        Rate
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                        UoM
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                        Quantity
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                        Unit Cost
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                        Total Value
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {addedItems.map((item, index) => (
                      <TableRow
                        key={item.id}
                        sx={{
                          "&:nth-of-type(odd)": {
                            background: "rgba(255, 255, 255, 0.5)",
                          },
                          "&:hover": {
                            background: "rgba(99, 102, 241, 0.05)",
                          },
                        }}
                      >
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {item.hsCode}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {item.productDescription}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {item.rate}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {item.uoM}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {item.quantity}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {parseFloat(item.unitPrice || 0).toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {parseFloat(item.totalValues || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => editAddedItem(item.id)}
                              sx={{
                                borderRadius: 1,
                                "&:hover": {
                                  background: "rgba(99, 102, 241, 0.1)",
                                },
                              }}
                            >
                              <FaEdit size={16} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => deleteAddedItem(item.id)}
                              sx={{
                                borderRadius: 1,
                                "&:hover": {
                                  background: "rgba(244, 67, 54, 0.1)",
                                },
                              }}
                            >
                              <FaTrash size={16} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        )}

        <Box
          className="button-group"
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mt: 0.5,
            mb: 0,
            py: 0,
            minHeight: "auto",
            height: "auto",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Show Save Draft and Save & Validate buttons only when there are added items */}
            {addedItems.length > 0 && (
              <>
                <Button
                  onClick={handleSave}
                  variant="outlined"
                  color="info"
                  size="small"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    px: 2,
                    py: 0.5,
                    fontSize: 12,
                    letterSpacing: 0.5,
                    boxShadow: 1,
                    transition: "all 0.2s",
                    "&:hover": {
                      background: "#0288d1",
                      color: "white",
                      boxShadow: 2,
                    },
                  }}
                  disabled={saveLoading}
                >
                  {saveLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    "Save Draft"
                  )}
                </Button>
                <Button
                  onClick={handleSaveAndValidate}
                  variant="outlined"
                  color="warning"
                  size="small"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    px: 2,
                    py: 0.5,
                    fontSize: 12,
                    letterSpacing: 0.5,
                    boxShadow: 1,
                    transition: "all 0.2s",
                    "&:hover": {
                      background: "#f57c00",
                      color: "white",
                      boxShadow: 2,
                    },
                  }}
                  disabled={saveValidateLoading}
                >
                  {saveValidateLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    "Save & Validate"
                  )}
                </Button>
              </>
            )}
            {isSubmitVisible && (
              <Button
                onClick={handleSubmitChange}
                variant="contained"
                size="small"
                sx={{
                  background: "#2E7D32",
                  borderRadius: 2,
                  fontWeight: 600,
                  px: 2,
                  py: 0.5,
                  fontSize: 12,
                  letterSpacing: 0.5,
                  boxShadow: 1,
                  transition: "background 0.2s",
                  "&:hover": { background: "#256e2b" },
                }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  "Submit"
                )}
              </Button>
            )}
          </Box>
        </Box>
        {allLoading && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              bgcolor: "rgba(255,255,255,0.7)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={50} color="primary" />
          </Box>
        )}

        {/* Buyer Modal */}
        <BuyerModal
          isOpen={isBuyerModalOpen}
          onClose={closeBuyerModal}
          onSave={handleSaveBuyer}
          buyer={null}
        />
      </Box>
    </TenantSelectionPrompt>
  );
}
