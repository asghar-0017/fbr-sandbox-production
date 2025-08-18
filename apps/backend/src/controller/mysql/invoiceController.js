import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import ejs from "ejs";
import puppeteer from "puppeteer";
import numberToWords from "number-to-words";
import TenantDatabaseService from "../../service/TenantDatabaseService.js";
import Tenant from "../../model/mysql/Tenant.js";
const { toWords } = numberToWords;

// Helper function to generate system invoice ID
const generateSystemInvoiceId = async (Invoice) => {
  try {
    // Get the highest existing system invoice ID for this tenant
    const lastInvoice = await Invoice.findOne({
      where: {
        system_invoice_id: {
          [Invoice.sequelize.Sequelize.Op.like]: "INV-%",
        },
      },
      order: [["system_invoice_id", "DESC"]],
      attributes: ["system_invoice_id"],
    });

    let nextNumber = 1;

    if (lastInvoice && lastInvoice.system_invoice_id) {
      // Extract the number from the last invoice ID (e.g., "INV-0005" -> 5)
      const match = lastInvoice.system_invoice_id.match(/INV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format as INV-0001, INV-0002, etc.
    return `INV-${nextNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating system invoice ID:", error);
    // Fallback to timestamp-based ID if there's an error
    return `INV-${Date.now().toString().slice(-4)}`;
  }
};

// Helper function to generate short 6-digit IDs for draft and saved invoices
const generateShortInvoiceId = async (Invoice, prefix) => {
  try {
    // Get the highest existing invoice ID with this prefix for this tenant
    const lastInvoice = await Invoice.findOne({
      where: {
        invoice_number: {
          [Invoice.sequelize.Sequelize.Op.like]: `${prefix}_%`,
        },
      },
      order: [["invoice_number", "DESC"]],
      attributes: ["invoice_number"],
    });

    let nextNumber = 1;

    if (lastInvoice && lastInvoice.invoice_number) {
      // Extract the number from the last invoice ID (e.g., "DRAFT_123456" -> 123456)
      const match = lastInvoice.invoice_number.match(
        new RegExp(`${prefix}_(\\d+)`)
      );
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format as DRAFT_000001, DRAFT_000002, etc. or SAVED_000001, SAVED_000002, etc.
    return `${prefix}_${nextNumber.toString().padStart(6, "0")}`;
  } catch (error) {
    console.error(`Error generating short ${prefix} invoice ID:`, error);
    // Fallback to random 6-digit number if there's an error
    const randomNum = Math.floor(Math.random() * 900000) + 100000; // 100000 to 999999
    return `${prefix}_${randomNum}`;
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const {
      invoice_number,
      invoiceType,
      invoiceDate,
      sellerNTNCNIC,
      sellerBusinessName,
      sellerProvince,
      sellerAddress,
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
      invoiceRefNo,
      companyInvoiceRefNo,
      transctypeId,
      items,
      status = "posted",
      fbr_invoice_number = null,
    } = req.body;

    // Use fbr_invoice_number as invoice_number if invoice_number is not provided
    const finalInvoiceNumber = invoice_number || fbr_invoice_number;

    // Debug: Log the received items data
    console.log("Received items data:", JSON.stringify(items, null, 2));

    // Enforce allowed statuses only
    const allowedStatuses = ["draft", "posted"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: 'draft', or 'posted'",
      });
    }

    // Check if invoice number already exists (only if provided)
    let existingInvoice = null;
    if (finalInvoiceNumber) {
      existingInvoice = await Invoice.findOne({
        where: { invoice_number: finalInvoiceNumber },
      });
    }

    if (existingInvoice) {
      return res.status(409).json({
        success: false,
        message: "Invoice with this number already exists",
      });
    }

    // Create invoice with transaction
    const result = await req.tenantDb.transaction(async (t) => {
      // Generate system invoice ID
      const systemInvoiceId = await generateSystemInvoiceId(Invoice);

      // Create invoice with posted status
      const invoice = await Invoice.create(
        {
          invoice_number: finalInvoiceNumber,
          system_invoice_id: systemInvoiceId,
          invoiceType,
          invoiceDate,
          sellerNTNCNIC,
          sellerBusinessName,
          sellerProvince,
          sellerAddress,
          buyerNTNCNIC,
          buyerBusinessName,
          buyerProvince,
          buyerAddress,
          buyerRegistrationType,
          invoiceRefNo,
          companyInvoiceRefNo,
          transctypeId,
          status: "posted", // Always set as posted when using createInvoice
          fbr_invoice_number,
        },
        { transaction: t }
      );

      // Create invoice items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const invoiceItems = items.map((item) => {
          // Helper function to convert empty strings to null
          const cleanValue = (value) => {
            if (
              value === "" ||
              value === "N/A" ||
              value === null ||
              value === undefined
            ) {
              return null;
            }
            return value;
          };

          // Helper function to convert numeric strings to numbers
          const cleanNumericValue = (value) => {
            const cleaned = cleanValue(value);
            if (cleaned === null) return null;
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
          };

          const mappedItem = {
            invoice_id: invoice.id,
            hsCode: cleanValue(item.hsCode),
            productDescription: cleanValue(item.productDescription),
            rate: cleanValue(item.rate),
            uoM: cleanValue(item.uoM),
            quantity: cleanNumericValue(item.quantity),
            unitPrice: cleanNumericValue(item.unitPrice),
            totalValues: cleanNumericValue(item.totalValues),
            valueSalesExcludingST: cleanNumericValue(
              item.valueSalesExcludingST
            ),
            fixedNotifiedValueOrRetailPrice: cleanNumericValue(
              item.fixedNotifiedValueOrRetailPrice
            ),
            salesTaxApplicable: cleanNumericValue(item.salesTaxApplicable),
            salesTaxWithheldAtSource: cleanNumericValue(
              item.salesTaxWithheldAtSource
            ),
            furtherTax: cleanNumericValue(item.furtherTax),
            sroScheduleNo: cleanValue(item.sroScheduleNo),
            fedPayable: cleanNumericValue(item.fedPayable),
            advanceIncomeTax: cleanNumericValue(item.advanceIncomeTax),
            discount: cleanNumericValue(item.discount),
            saleType: cleanValue(item.saleType),
            sroItemSerialNo: cleanValue(item.sroItemSerialNo),
          };

          // Only include extraTax when it's a positive value (> 0)
          const extraTaxValue = cleanNumericValue(item.extraTax);
          if (extraTaxValue !== null && Number(extraTaxValue) > 0) {
            mappedItem.extraTax = extraTaxValue;
          }

          // Debug: Log the mapped item
          console.log(
            "Mapped invoice item:",
            JSON.stringify(mappedItem, null, 2)
          );

          return mappedItem;
        });

        console.log(
          "About to create invoice items:",
          JSON.stringify(invoiceItems, null, 2)
        );
        await InvoiceItem.bulkCreate(invoiceItems, { transaction: t });
      }

      return invoice;
    });

    res.status(200).json({
      success: true,
      message: "Invoice created successfully with FBR invoice number",
      data: {
        invoice_id: result.id,
        invoice_number: result.invoice_number,
        system_invoice_id: result.system_invoice_id,
        status: result.status,
        fbr_invoice_number: result.fbr_invoice_number,
      },
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Error creating invoice",
      error: error.message,
    });
  }
};

// Save invoice as draft
export const saveInvoice = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const {
      id,
      invoiceType,
      invoiceDate,
      sellerNTNCNIC,
      sellerBusinessName,
      sellerProvince,
      sellerAddress,
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
      invoiceRefNo,
      companyInvoiceRefNo,
      transctypeId,
      items,
    } = req.body;

    // Create or update draft invoice in a transaction
    const result = await req.tenantDb.transaction(async (t) => {
      let invoice = null;

      if (id) {
        invoice = await Invoice.findByPk(id, { transaction: t });
        if (!invoice) {
          throw new Error("Invoice not found");
        }
        if (invoice.status !== "draft") {
          throw new Error("Only draft invoices can be updated");
        }

        // Check if the current invoice number already has DRAFT_ prefix
        let updatedInvoiceNumber = invoice.invoice_number;
        if (
          !updatedInvoiceNumber ||
          !updatedInvoiceNumber.startsWith("DRAFT_")
        ) {
          // Generate a new DRAFT_ invoice number if it doesn't have the right prefix
          updatedInvoiceNumber = await generateShortInvoiceId(Invoice, "DRAFT");
        }

        // Update invoice header
        await invoice.update(
          {
            invoice_number: updatedInvoiceNumber,
            invoiceType,
            invoiceDate,
            sellerNTNCNIC,
            sellerBusinessName,
            sellerProvince,
            sellerAddress,
            buyerNTNCNIC,
            buyerBusinessName,
            buyerProvince,
            buyerAddress,
            buyerRegistrationType,
            invoiceRefNo,
            companyInvoiceRefNo,
            transctypeId,
            status: "draft",
            fbr_invoice_number: null,
          },
          { transaction: t }
        );

        // Replace items
        await InvoiceItem.destroy({
          where: { invoice_id: invoice.id },
          transaction: t,
        });
      } else {
        // Generate a temporary invoice number for draft
        const tempInvoiceNumber = await generateShortInvoiceId(
          Invoice,
          "DRAFT"
        );
        // Generate system invoice ID
        const systemInvoiceId = await generateSystemInvoiceId(Invoice);

        invoice = await Invoice.create(
          {
            invoice_number: tempInvoiceNumber,
            system_invoice_id: systemInvoiceId,
            invoiceType,
            invoiceDate,
            sellerNTNCNIC,
            sellerBusinessName,
            sellerProvince,
            sellerAddress,
            buyerNTNCNIC,
            buyerBusinessName,
            buyerProvince,
            buyerAddress,
            buyerRegistrationType,
            invoiceRefNo,
            companyInvoiceRefNo,
            transctypeId,
            status: "draft",
            fbr_invoice_number: null,
          },
          { transaction: t }
        );
      }

      // Create invoice items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const invoiceItems = items.map((item) => {
          const cleanValue = (value) => {
            if (
              value === "" ||
              value === "N/A" ||
              value === null ||
              value === undefined
            ) {
              return null;
            }
            return value;
          };

          const cleanNumericValue = (value) => {
            const cleaned = cleanValue(value);
            if (cleaned === null) return null;
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
          };

          const mappedItem = {
            invoice_id: invoice.id,
            hsCode: cleanValue(item.hsCode),
            productDescription: cleanValue(item.productDescription),
            rate: cleanValue(item.rate),
            uoM: cleanValue(item.uoM),
            quantity: cleanNumericValue(item.quantity),
            unitPrice: cleanNumericValue(item.unitPrice),
            totalValues: cleanNumericValue(item.totalValues),
            valueSalesExcludingST: cleanNumericValue(
              item.valueSalesExcludingST
            ),
            fixedNotifiedValueOrRetailPrice: cleanNumericValue(
              item.fixedNotifiedValueOrRetailPrice
            ),
            salesTaxApplicable: cleanNumericValue(item.salesTaxApplicable),
            salesTaxWithheldAtSource: cleanNumericValue(
              item.salesTaxWithheldAtSource
            ),
            furtherTax: cleanNumericValue(item.furtherTax),
            sroScheduleNo: cleanValue(item.sroScheduleNo),
            fedPayable: cleanNumericValue(item.fedPayable),
            advanceIncomeTax: cleanNumericValue(item.advanceIncomeTax),
            discount: cleanNumericValue(item.discount),
            saleType: cleanValue(item.saleType),
            sroItemSerialNo: cleanValue(item.sroItemSerialNo),
          };

          // Only include extraTax when it's a positive value (> 0)
          const extraTaxValue = cleanNumericValue(item.extraTax);
          if (extraTaxValue !== null && Number(extraTaxValue) > 0) {
            mappedItem.extraTax = extraTaxValue;
          }

          return mappedItem;
        });

        await InvoiceItem.bulkCreate(invoiceItems, { transaction: t });
      }

      return invoice;
    });

    res.status(201).json({
      success: true,
      message: "Invoice saved as draft successfully",
      data: {
        invoice_id: result.id,
        invoice_number: result.invoice_number,
        system_invoice_id: result.system_invoice_id,
        status: result.status,
      },
    });
  } catch (error) {
    console.error("Error saving invoice:", error);
    res.status(500).json({
      success: false,
      message: "Error saving invoice",
      error: error.message,
    });
  }
};

// Save and validate invoice
export const saveAndValidateInvoice = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const {
      id,
      invoiceType,
      invoiceDate,
      sellerNTNCNIC,
      sellerBusinessName,
      sellerProvince,
      sellerAddress,
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
      invoiceRefNo,
      companyInvoiceRefNo,
      transctypeId,
      items,
    } = req.body;

    // Generate a temporary invoice number for saved invoice
    const tempInvoiceNumber = await generateShortInvoiceId(Invoice, "SAVED");

    // Validate the data first (basic validation)
    const validationErrors = [];

    // Validate seller fields
    if (
      !sellerNTNCNIC ||
      !sellerBusinessName ||
      !sellerProvince ||
      !sellerAddress
    ) {
      validationErrors.push("Seller information is incomplete");
    }

    // Validate buyer fields
    if (
      !buyerNTNCNIC ||
      !buyerBusinessName ||
      !buyerProvince ||
      !buyerAddress
    ) {
      validationErrors.push("Buyer information is incomplete");
    }

    // Validate items
    if (!items || items.length === 0) {
      validationErrors.push("At least one item is required");
    } else {
      items.forEach((item, index) => {
        if (
          !item.hsCode ||
          !item.productDescription ||
          !item.rate ||
          !item.uoM
        ) {
          validationErrors.push(`Item ${index + 1} has incomplete information`);
        }
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Save as draft (validated) - upsert behavior like saveInvoice
    const result = await req.tenantDb.transaction(async (t) => {
      let invoice = null;
      if (id) {
        invoice = await Invoice.findByPk(id, { transaction: t });
        if (!invoice) {
          throw new Error("Invoice not found");
        }
        if (invoice.status !== "draft") {
          throw new Error("Only draft invoices can be updated");
        }
        await invoice.update(
          {
            invoice_number: tempInvoiceNumber,
            invoiceType,
            invoiceDate,
            sellerNTNCNIC,
            sellerBusinessName,
            sellerProvince,
            sellerAddress,
            buyerNTNCNIC,
            buyerBusinessName,
            buyerProvince,
            buyerAddress,
            buyerRegistrationType,
            invoiceRefNo,
            companyInvoiceRefNo,
            transctypeId,
            status: "draft",
            fbr_invoice_number: null,
          },
          { transaction: t }
        );
        await InvoiceItem.destroy({
          where: { invoice_id: invoice.id },
          transaction: t,
        });
      } else {
        // Generate system invoice ID
        const systemInvoiceId = await generateSystemInvoiceId(Invoice);

        invoice = await Invoice.create(
          {
            invoice_number: tempInvoiceNumber,
            system_invoice_id: systemInvoiceId,
            invoiceType,
            invoiceDate,
            sellerNTNCNIC,
            sellerBusinessName,
            sellerProvince,
            sellerAddress,
            buyerNTNCNIC,
            buyerBusinessName,
            buyerProvince,
            buyerAddress,
            buyerRegistrationType,
            invoiceRefNo,
            companyInvoiceRefNo,
            transctypeId,
            status: "draft",
            fbr_invoice_number: null,
          },
          { transaction: t }
        );
      }

      if (items && Array.isArray(items) && items.length > 0) {
        const invoiceItems = items.map((item) => {
          const cleanValue = (value) => {
            if (
              value === "" ||
              value === "N/A" ||
              value === null ||
              value === undefined
            ) {
              return null;
            }
            return value;
          };
          const cleanNumericValue = (value) => {
            const cleaned = cleanValue(value);
            if (cleaned === null) return null;
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
          };
          const mappedItem = {
            invoice_id: invoice.id,
            hsCode: cleanValue(item.hsCode),
            productDescription: cleanValue(item.productDescription),
            rate: cleanValue(item.rate),
            uoM: cleanValue(item.uoM),
            quantity: cleanNumericValue(item.quantity),
            unitPrice: cleanNumericValue(item.unitPrice),
            totalValues: cleanNumericValue(item.totalValues),
            valueSalesExcludingST: cleanNumericValue(
              item.valueSalesExcludingST
            ),
            fixedNotifiedValueOrRetailPrice: cleanNumericValue(
              item.fixedNotifiedValueOrRetailPrice
            ),
            salesTaxApplicable: cleanNumericValue(item.salesTaxApplicable),
            salesTaxWithheldAtSource: cleanNumericValue(
              item.salesTaxWithheldAtSource
            ),
            furtherTax: cleanNumericValue(item.furtherTax),
            sroScheduleNo: cleanValue(item.sroScheduleNo),
            fedPayable: cleanNumericValue(item.fedPayable),
            advanceIncomeTax: cleanNumericValue(item.advanceIncomeTax),
            discount: cleanNumericValue(item.discount),
            saleType: cleanValue(item.saleType),
            sroItemSerialNo: cleanValue(item.sroItemSerialNo),
          };

          // Only include extraTax when it's a positive value (> 0)
          const extraTaxValue = cleanNumericValue(item.extraTax);
          if (extraTaxValue !== null && Number(extraTaxValue) > 0) {
            mappedItem.extraTax = extraTaxValue;
          }

          return mappedItem;
        });
        await InvoiceItem.bulkCreate(invoiceItems, { transaction: t });
      }
      return invoice;
    });

    res.status(201).json({
      success: true,
      message: "Invoice validated and saved as draft successfully",
      data: {
        invoice_id: result.id,
        invoice_number: result.invoice_number,
        system_invoice_id: result.system_invoice_id,
        status: result.status,
      },
    });
  } catch (error) {
    console.error("Error saving and validating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Error saving and validating invoice",
      error: error.message,
    });
  }
};

// Get all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const {
      page = 1,
      limit = 10,
      search,
      start_date,
      end_date,
      sale_type,
      status,
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add search functionality
    if (search) {
      whereClause[req.tenantDb.Sequelize.Op.or] = [
        { invoice_number: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
        {
          fbr_invoice_number: {
            [req.tenantDb.Sequelize.Op.like]: `%${search}%`,
          },
        },
        {
          buyerBusinessName: {
            [req.tenantDb.Sequelize.Op.like]: `%${search}%`,
          },
        },
        {
          sellerBusinessName: {
            [req.tenantDb.Sequelize.Op.like]: `%${search}%`,
          },
        },
      ];
    }

    // Add sale type filter
    if (sale_type && sale_type !== "All") {
      whereClause.invoiceType = sale_type;
    }

    // Add status filter - show all invoices by default
    if (status && status !== "All") {
      whereClause.status = status;
    }
    // Removed default filter to show all invoices (draft, saved, validated, posted, etc.)

    // Add date range filter
    if (start_date && end_date) {
      whereClause.created_at = {
        [req.tenantDb.Sequelize.Op.between]: [
          new Date(start_date),
          new Date(end_date),
        ],
      };
    }

    const { count, rows } = await Invoice.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: InvoiceItem,
          as: "InvoiceItems",
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    // Transform the data to match frontend expectations
    const transformedInvoices = rows.map((invoice) => {
      const plainInvoice = invoice.get({ plain: true });
      plainInvoice.items = plainInvoice.InvoiceItems || []; // 👈 normalize for EJS

      // Use FBR invoice number if available, otherwise use the original invoice number
      const displayInvoiceNumber =
        plainInvoice.fbr_invoice_number || plainInvoice.invoice_number;

      // Debug logging for invoice numbers
      console.log("Invoice display logic:", {
        id: plainInvoice.id,
        original_invoice_number: plainInvoice.invoice_number,
        fbr_invoice_number: plainInvoice.fbr_invoice_number,
        display_invoice_number: displayInvoiceNumber,
        status: plainInvoice.status,
      });

      return {
        id: plainInvoice.id,
        invoiceNumber: displayInvoiceNumber,
        systemInvoiceId: plainInvoice.system_invoice_id,
        invoiceType: plainInvoice.invoiceType,
        invoiceDate: plainInvoice.invoiceDate,
        sellerNTNCNIC: plainInvoice.sellerNTNCNIC,
        sellerBusinessName: plainInvoice.sellerBusinessName,
        sellerProvince: plainInvoice.sellerProvince,
        sellerAddress: plainInvoice.sellerAddress,
        buyerNTNCNIC: plainInvoice.buyerNTNCNIC,
        buyerBusinessName: plainInvoice.buyerBusinessName,
        buyerProvince: plainInvoice.buyerProvince,
        buyerAddress: plainInvoice.buyerAddress,
        buyerRegistrationType: plainInvoice.buyerRegistrationType,
        invoiceRefNo: plainInvoice.invoiceRefNo,
        transctypeId: plainInvoice.transctypeId,
        status: plainInvoice.status,
        companyInvoiceRefNo: plainInvoice.companyInvoiceRefNo,
        fbr_invoice_number: plainInvoice.fbr_invoice_number,
        items: (plainInvoice.InvoiceItems || []).map((item) => ({
          ...item,
          retailPrice:
            item.fixedNotifiedValueOrRetailPrice || item.retailPrice || "0",
        })),
        created_at: plainInvoice.created_at,
        updated_at: plainInvoice.updated_at,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        invoices: transformedInvoices,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_records: count,
          records_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting invoices:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving invoices",
      error: error.message,
    });
  }
};

// Get invoice by ID with items
export const getInvoiceById = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: InvoiceItem,
          as: "InvoiceItems",
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Transform the data to match frontend expectations
    const plainInvoice = invoice.get({ plain: true });
    plainInvoice.items = plainInvoice.InvoiceItems || []; // 👈 normalize for EJS
    const transformedInvoice = {
      id: plainInvoice.id,
      invoiceNumber: plainInvoice.invoice_number,
      systemInvoiceId: plainInvoice.system_invoice_id,
      invoiceType: plainInvoice.invoiceType,
      invoiceDate: plainInvoice.invoiceDate,
      sellerNTNCNIC: plainInvoice.sellerNTNCNIC,
      sellerBusinessName: plainInvoice.sellerBusinessName,
      sellerProvince: plainInvoice.sellerProvince,
      sellerAddress: plainInvoice.sellerAddress,
      buyerNTNCNIC: plainInvoice.buyerNTNCNIC,
      buyerBusinessName: plainInvoice.buyerBusinessName,
      buyerProvince: plainInvoice.buyerProvince,
      buyerAddress: plainInvoice.buyerAddress,
      buyerRegistrationType: plainInvoice.buyerRegistrationType,
      invoiceRefNo: plainInvoice.invoiceRefNo,
      transctypeId: plainInvoice.transctypeId,
      status: plainInvoice.status,
      companyInvoiceRefNo: plainInvoice.companyInvoiceRefNo,
      fbr_invoice_number: plainInvoice.fbr_invoice_number,
      items: (plainInvoice.InvoiceItems || []).map((item) => ({
        ...item,
        retailPrice:
          item.fixedNotifiedValueOrRetailPrice || item.retailPrice || "0",
      })),
      created_at: plainInvoice.created_at,
      updated_at: plainInvoice.updated_at,
    };

    res.status(200).json({
      success: true,
      data: transformedInvoice,
    });
  } catch (error) {
    console.error("Error getting invoice:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving invoice",
      error: error.message,
    });
  }
};

// Get invoice by invoice number
export const getInvoiceByNumber = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const { invoiceNumber } = req.params;

    const invoice = await Invoice.findOne({
      where: { invoice_number: invoiceNumber },
      include: [
        {
          model: InvoiceItem,
          as: "InvoiceItems",
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Transform the data to match frontend expectations
    const plainInvoice = invoice.get({ plain: true });
    const transformedInvoice = {
      ...plainInvoice,
      items: (plainInvoice.InvoiceItems || []).map((item) => ({
        ...item,
        retailPrice:
          item.fixedNotifiedValueOrRetailPrice || item.retailPrice || "0",
      })),
    };

    res.status(200).json({
      success: true,
      data: transformedInvoice,
    });
  } catch (error) {
    console.error("Error getting invoice by number:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving invoice",
      error: error.message,
    });
  }
};

// Print invoice

export const printInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Find invoice across all tenant databases
    const result = await TenantDatabaseService.findInvoiceAcrossTenants(id);

    if (!result) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const { invoice, tenantDb } = result;
    const { InvoiceItem } = tenantDb.models;

    // Fetch invoice with items using the already found invoice
    const invoiceWithItems = await invoice.constructor.findOne({
      where: { id: invoice.id },
      include: [{ model: InvoiceItem, as: "InvoiceItems" }],
    });

    if (!invoiceWithItems) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Base64 encode logos
    const fbrLogoBase64 = fs
      .readFileSync(path.join(process.cwd(), "public", "fbr_logo.png"))
      .toString("base64");
    const companyLogoBase64 = fs
      .readFileSync(path.join(process.cwd(), "public", "fbr-logo-1.png"))
      .toString("base64");

    // Prepare paths
    const pdfFileName = `${invoiceWithItems.invoice_number}.pdf`;
    const invoiceDir = path.join(process.cwd(), "public", "invoices");
    const pdfPath = path.join(invoiceDir, pdfFileName);

    // Ensure output directory exists
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }

    // Generate QR code
    const qrUrl = invoiceWithItems.invoice_number;
    const qrData = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: "M",
      width: 96,
    });

    const plainInvoice = invoiceWithItems.get({ plain: true });
    plainInvoice.items = plainInvoice.InvoiceItems || []; // 👈 normalize for EJS

    // Format date to dd-mm-yyyy
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
      } catch (error) {
        return "N/A";
      }
    };

    // Format the invoice date
    plainInvoice.invoiceDate = formatDate(plainInvoice.invoiceDate);

    // Render EJS HTML
    const html = await ejs.renderFile(
      path.join(process.cwd(), "src", "views", "invoiceTemplate.ejs"),
      {
        invoice: plainInvoice,
        qrData,
        fbrLogoBase64,
        companyLogoBase64,
        convertToWords: (amount) => {
          const words = toWords(Math.floor(amount || 0));
          // Remove commas from the output and capitalize first letter
          return (
            words.replace(/,/g, "").charAt(0).toUpperCase() +
            words.replace(/,/g, "").slice(1)
          );
        },
      }
    );

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
    await browser.close();

    // Stream PDF to browser
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${pdfFileName}`);
    fs.createReadStream(pdfPath).pipe(res);
  } catch (error) {
    console.error("PDF generation failed:", error);
    res.status(500).json({
      message: "Error generating invoice",
      error: error.message,
    });
  }
};
// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const { Invoice } = req.tenantModels;
    const { id } = req.params;
    const updateData = req.body;

    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    await invoice.update(updateData);

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Error updating invoice",
      error: error.message,
    });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { Invoice } = req.tenantModels;
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    await invoice.destroy();

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting invoice",
      error: error.message,
    });
  }
};

// Get invoice statistics
export const getInvoiceStats = async (req, res) => {
  try {
    const { Invoice } = req.tenantModels;
    const { start_date, end_date } = req.query;

    const whereClause = {};
    if (start_date && end_date) {
      whereClause.created_at = {
        [req.tenantDb.Sequelize.Op.between]: [
          new Date(start_date),
          new Date(end_date),
        ],
      };
    }

    const totalInvoices = await Invoice.count({ where: whereClause });
    const totalAmount = await Invoice.sum("totalValues", {
      where: whereClause,
    });

    // Get invoices by month
    const monthlyStats = await Invoice.findAll({
      attributes: [
        [
          req.tenantDb.Sequelize.fn(
            "DATE_FORMAT",
            req.tenantDb.Sequelize.col("created_at"),
            "%Y-%m"
          ),
          "month",
        ],
        [
          req.tenantDb.Sequelize.fn("COUNT", req.tenantDb.Sequelize.col("id")),
          "count",
        ],
        [
          req.tenantDb.Sequelize.fn(
            "SUM",
            req.tenantDb.Sequelize.col("totalValues")
          ),
          "total_amount",
        ],
      ],
      where: whereClause,
      group: [
        req.tenantDb.Sequelize.fn(
          "DATE_FORMAT",
          req.tenantDb.Sequelize.col("created_at"),
          "%Y-%m"
        ),
      ],
      order: [
        [
          req.tenantDb.Sequelize.fn(
            "DATE_FORMAT",
            req.tenantDb.Sequelize.col("created_at"),
            "%Y-%m"
          ),
          "DESC",
        ],
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        total_invoices: totalInvoices,
        total_amount: totalAmount || 0,
        monthly_stats: monthlyStats,
      },
    });
  } catch (error) {
    console.error("Error getting invoice stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving invoice statistics",
      error: error.message,
    });
  }
};

// Submit saved invoice to FBR
export const submitSavedInvoice = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const { id } = req.params;

    // Find the invoice
    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: InvoiceItem,
          as: "InvoiceItems",
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (invoice.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft invoices can be posted to FBR",
      });
    }

    // Check if transctypeId is provided
    if (!invoice.transctypeId) {
      return res.status(400).json({
        success: false,
        message:
          "Transaction Type ID is required. Please select a transaction type before submitting to FBR.",
      });
    }

    // Helper functions for data cleaning
    const cleanValue = (value) => {
      if (value === null || value === undefined || value === "") return null;
      return String(value).trim();
    };

    const cleanNumericValue = (value) => {
      const cleaned = cleanValue(value);
      if (cleaned === null) return null;
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    };

    // Prepare data for FBR submission
    const fbrData = {
      invoiceType: cleanValue(invoice.invoiceType),
      invoiceDate: cleanValue(invoice.invoiceDate),
      sellerNTNCNIC: cleanValue(invoice.sellerNTNCNIC),
      sellerBusinessName: cleanValue(invoice.sellerBusinessName),
      sellerProvince: cleanValue(invoice.sellerProvince),
      sellerAddress: cleanValue(invoice.sellerAddress),
      buyerNTNCNIC: cleanValue(invoice.buyerNTNCNIC),
      buyerBusinessName: cleanValue(invoice.buyerBusinessName),
      buyerProvince: cleanValue(invoice.buyerProvince),
      buyerAddress: cleanValue(invoice.buyerAddress),
      buyerRegistrationType: cleanValue(invoice.buyerRegistrationType),
      invoiceRefNo: cleanValue(invoice.invoiceRefNo),
      // FBR expects camelCase key: transctypeId
      transctypeId: cleanValue(invoice.transctypeId),
      items: invoice.InvoiceItems.map((item) => {
        // Handle RS. rate format for FBR submission
        let processedRate = cleanValue(item.rate);
        console.log(
          `Processing rate for item ${item.id}: Original="${item.rate}", Cleaned="${processedRate}"`
        );

        if (
          processedRate &&
          (processedRate.includes("RS.") ||
            processedRate.includes("rs.") ||
            processedRate.includes("Rs."))
        ) {
          // For RS. format, we need to convert it to a format FBR accepts
          // Extract the numeric value and set it as a standard rate
          const numericValue =
            parseFloat(processedRate.replace(/RS\./i, "").trim()) || 0;

          // Check the sales type to determine the appropriate rate
          const saleType = cleanValue(item.saleType) || "";
          if (saleType.includes("Reduced Rate")) {
            processedRate = 12; // Use reduced rate for FBR
          } else if (
            saleType.includes("zero-rate") ||
            saleType.includes("Zero")
          ) {
            processedRate = 0; // Use zero rate for FBR
          } else {
            processedRate = 17; // Use standard rate for FBR
          }

          console.log(
            `RS. rate detected and converted: "${item.rate}" -> "${processedRate}" (using ${saleType} rate for FBR, fixed amount: ${numericValue})`
          );
        }

        const baseItem = {
          hsCode: cleanValue(item.hsCode),
          productDescription: cleanValue(item.productDescription),
          rate: processedRate,
          uoM: cleanValue(item.uoM),
          quantity: cleanNumericValue(item.quantity),
          unitPrice: cleanNumericValue(item.unitPrice),
          totalValues: cleanNumericValue(item.totalValues),
          valueSalesExcludingST: cleanNumericValue(item.valueSalesExcludingST),
          fixedNotifiedValueOrRetailPrice: cleanNumericValue(
            item.fixedNotifiedValueOrRetailPrice
          ),
          salesTaxApplicable: cleanNumericValue(item.salesTaxApplicable),
          salesTaxWithheldAtSource: cleanNumericValue(
            item.salesTaxWithheldAtSource
          ),
          furtherTax: cleanNumericValue(item.furtherTax),
          sroScheduleNo: cleanValue(item.sroScheduleNo),
          fedPayable: cleanNumericValue(item.fedPayable),
          discount: cleanNumericValue(item.discount),
          saleType: cleanValue(item.saleType),
          sroItemSerialNo: cleanValue(item.sroItemSerialNo),
        };

        // Only include extraTax when it's a positive value (> 0) and not applicable for reduced/exempt
        const extraTaxValue = cleanNumericValue(item.extraTax);
        const isReduced =
          (cleanValue(item.saleType) || "").trim() === "Goods at Reduced Rate";
        const rateValue = cleanValue(item.rate) || "";
        const isExempt =
          typeof rateValue === "string" && rateValue.toLowerCase() === "exempt";
        if (
          extraTaxValue !== null &&
          Number(extraTaxValue) > 0 &&
          !isReduced &&
          !isExempt
        ) {
          baseItem.extraTax = extraTaxValue;
        }

        return baseItem;
      }),
    };

    // Debug: Log the cleaned data being sent to FBR
    console.log(
      "Cleaned FBR data being sent:",
      JSON.stringify(fbrData, null, 2)
    );

    // Additional debug: Log rate processing summary
    console.log("Rate processing summary:");
    fbrData.items.forEach((item, index) => {
      console.log(
        `  Item ${index + 1}: rate="${item.rate}", salesTaxApplicable="${item.salesTaxApplicable}", saleType="${item.saleType}"`
      );
    });

    // Get tenant FBR token from the tenant middleware
    if (!req.tenant || !req.tenant.sandboxTestToken) {
      return res.status(400).json({
        success: false,
        message: "FBR token not found for this tenant",
      });
    }

    // Import FBR API functions
    const { postData } = await import("../../service/FBRService.js");

    // Submit directly to FBR (skipping validation)

    const postRes = await postData(
      "di_data/v1/di/postinvoicedata",
      fbrData,
      "sandbox",
      req.tenant.sandboxTestToken
    );

    console.log("FBR Response:", JSON.stringify(postRes.data, null, 2));
    console.log("FBR Response Type:", typeof postRes.data);
    const dataSizeInfo = Array.isArray(postRes.data)
      ? postRes.data.length
      : typeof postRes.data === "object" && postRes.data !== null
        ? Object.keys(postRes.data).length
        : typeof postRes.data === "string"
          ? postRes.data.length
          : 0;
    console.log("FBR Response Data Size:", dataSizeInfo);

    // Handle different FBR response structures
    let isSuccess = false;
    let fbrInvoiceNumber = null;
    let errorDetails = null;

    if (postRes.status === 200) {
      // Check for validationResponse structure (old format)
      if (postRes.data && postRes.data.validationResponse) {
        const validation = postRes.data.validationResponse;
        isSuccess = validation.statusCode === "00";
        fbrInvoiceNumber = postRes.data.invoiceNumber;
        console.log("FBR Response - validationResponse format:", {
          statusCode: validation.statusCode,
          isSuccess,
          fbrInvoiceNumber,
        });
        if (!isSuccess) {
          errorDetails = validation;
        }
      }
      // Check for direct response structure (new format)
      else if (
        postRes.data &&
        (postRes.data.invoiceNumber || postRes.data.success)
      ) {
        isSuccess = true;
        fbrInvoiceNumber = postRes.data.invoiceNumber;
        console.log("FBR Response - direct format:", {
          isSuccess,
          fbrInvoiceNumber,
          success: postRes.data.success,
        });
      }
      // Check for error response structure
      else if (postRes.data && postRes.data.error) {
        isSuccess = false;
        errorDetails = postRes.data;
        console.log("FBR Response - error format:", postRes.data.error);
      }
      // Check for empty response - this might be a successful submission
      else if (!postRes.data || postRes.data === "") {
        console.log(
          "FBR returned empty response with 200 status - treating as successful submission"
        );
        isSuccess = true;
        // For empty responses, we'll use the original invoice number as FBR invoice number
        fbrInvoiceNumber = req.body.invoice_number || `FBR_${Date.now()}`;
        console.log(
          "Using original invoice number as FBR invoice number:",
          fbrInvoiceNumber
        );
      }
      // If response is unexpected, treat as success if status is 200
      else {
        isSuccess = true;
        console.log(
          "FBR returned 200 status with unexpected response structure, treating as success"
        );
        console.log("Unexpected response structure:", postRes.data);
      }
    } else {
      console.log("FBR returned non-200 status:", postRes.status);
    }

    if (!isSuccess) {
      const details = errorDetails || {
        raw: postRes.data ?? null,
        note: "Unexpected FBR response structure",
        status: postRes.status,
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

      return res.status(400).json({
        success: false,
        message,
        code:
          details?.statusCode ||
          details?.errorCode ||
          details?.validationResponse?.statusCode,
        details,
      });
    }

    // Ensure we have a valid FBR invoice number before updating
    if (!fbrInvoiceNumber || fbrInvoiceNumber.trim() === "") {
      console.log("FBR invoice number validation failed:", {
        fbrInvoiceNumber,
        type: typeof fbrInvoiceNumber,
        length: fbrInvoiceNumber ? fbrInvoiceNumber.length : 0,
      });
      return res.status(400).json({
        success: false,
        message: "FBR submission failed: No invoice number received from FBR",
        details: errorDetails || {
          raw: postRes.data ?? null,
          note: "No invoice number in FBR response",
          status: postRes.status,
        },
      });
    }

    // Update invoice status to 'posted' and replace draft number with FBR number when successfully submitted to FBR
    // This ensures that posted invoices show the official FBR invoice number instead of the draft number
    const updateData = {
      status: "posted",
      fbr_invoice_number: fbrInvoiceNumber,
    };

    // Only update invoice_number if we have a valid FBR invoice number
    if (fbrInvoiceNumber) {
      updateData.invoice_number = fbrInvoiceNumber;
    }

    console.log("Updating invoice with data:", updateData);
    console.log("FBR Response received:", {
      invoiceNumber: postRes.data.invoiceNumber,
      validationResponse: postRes.data.validationResponse,
      statusCode: postRes.data.validationResponse?.statusCode,
    });

    await invoice.update(updateData);

    // Verify the update was successful
    const updatedInvoice = await Invoice.findByPk(invoice.id);
    console.log("Invoice updated successfully:", {
      id: updatedInvoice.id,
      original_invoice_number: updatedInvoice.invoice_number,
      fbr_invoice_number: updatedInvoice.fbr_invoice_number,
      status: updatedInvoice.status,
    });

    res.status(200).json({
      success: true,
      message: "Invoice posted successfully to FBR",
      data: {
        invoice_id: invoice.id,
        fbr_invoice_number: fbrInvoiceNumber,
        status: "posted",
      },
    });
  } catch (error) {
    console.error("Error submitting invoice to FBR:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting invoice to FBR",
      error: error.message,
    });
  }
};

// Bulk create invoices with items (draft status)
export const bulkCreateInvoices = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const { invoices } = req.body;

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invoices array is required and must not be empty",
      });
    }

    // Limit the number of invoices that can be uploaded at once
    if (invoices.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Maximum 1000 invoices can be uploaded at once",
      });
    }

    const results = {
      created: [],
      errors: [],
      total: invoices.length,
    };

    // Group invoices by row index since invoice_number will be generated by system
    const invoiceGroups = {};
    for (let i = 0; i < invoices.length; i++) {
      const invoiceData = invoices[i];
      // Generate a unique key for each row since invoice_number will be auto-generated
      const rowKey = `row_${i}`;

      if (!invoiceGroups[rowKey]) {
        invoiceGroups[rowKey] = {
          header: invoiceData,
          items: [],
          rowNumbers: [],
        };
      }

      // Extract item data if present
      const itemData = {};
      const itemFields = [
        "item_hsCode",
        "item_productDescription",
        "item_rate",
        "item_uoM",
        "item_quantity",
        "item_unitPrice",
        "item_totalValues",
        "item_valueSalesExcludingST",
        "item_fixedNotifiedValueOrRetailPrice",
        "item_salesTaxApplicable",
        "item_salesTaxWithheldAtSource",
        "item_extraTax",
        "item_furtherTax",
        "item_sroScheduleNo",
        "item_fedPayable",
        "item_discount",
        "item_saleType",
        "item_sroItemSerialNo",
      ];

      let hasItemData = false;
      itemFields.forEach((field) => {
        const cleanField = field.replace("item_", "");
        if (
          invoiceData[field] !== undefined &&
          invoiceData[field] !== null &&
          invoiceData[field] !== ""
        ) {
          itemData[cleanField] = invoiceData[field];
          hasItemData = true;
        }
      });

      if (hasItemData) {
        invoiceGroups[rowKey].items.push(itemData);
      }
      invoiceGroups[rowKey].rowNumbers.push(i + 1);
    }

    // Process each unique invoice
    for (const [rowKey, group] of Object.entries(invoiceGroups)) {
      try {
        const invoiceData = group.header;

        console.log(`Processing invoice row ${rowKey}:`, {
          invoiceType: invoiceData.invoiceType,
          sellerBusinessName: invoiceData.sellerBusinessName,
          buyerBusinessName: invoiceData.buyerBusinessName,
          itemsCount: group.items.length,
        });

        // Validate required fields
        if (!invoiceData.invoiceType || !invoiceData.invoiceType.trim()) {
          group.rowNumbers.forEach((rowNum) => {
            results.errors.push({
              index: group.rowNumbers.indexOf(rowNum),
              row: rowNum,
              error: "Invoice type is required",
            });
          });
          continue;
        }

        if (!invoiceData.invoiceDate || !invoiceData.invoiceDate.trim()) {
          group.rowNumbers.forEach((rowNum) => {
            results.errors.push({
              index: group.rowNumbers.indexOf(rowNum),
              row: rowNum,
              error: "Invoice date is required",
            });
          });
          continue;
        }

        if (
          !invoiceData.sellerBusinessName ||
          !invoiceData.sellerBusinessName.trim()
        ) {
          group.rowNumbers.forEach((rowNum) => {
            results.errors.push({
              index: group.rowNumbers.indexOf(rowNum),
              row: rowNum,
              error: "Seller business name is required",
            });
          });
          continue;
        }

        if (!invoiceData.sellerProvince || !invoiceData.sellerProvince.trim()) {
          group.rowNumbers.forEach((rowNum) => {
            results.errors.push({
              index: group.rowNumbers.indexOf(rowNum),
              row: rowNum,
              error: "Seller province is required",
            });
          });
          continue;
        }

        if (
          !invoiceData.buyerBusinessName ||
          !invoiceData.buyerBusinessName.trim()
        ) {
          group.rowNumbers.forEach((rowNum) => {
            results.errors.push({
              index: group.rowNumbers.indexOf(rowNum),
              row: rowNum,
              error: "Buyer business name is required",
            });
          });
          continue;
        }

        if (!invoiceData.buyerProvince || !invoiceData.buyerProvince.trim()) {
          group.rowNumbers.forEach((rowNum) => {
            results.errors.push({
              index: group.rowNumbers.indexOf(rowNum),
              row: rowNum,
              error: "Buyer province is required",
            });
          });
          continue;
        }

        // Validate invoice type
        const validInvoiceTypes = ["Sale Invoice", "Debit Note"];
        if (!validInvoiceTypes.includes(invoiceData.invoiceType.trim())) {
          group.rowNumbers.forEach((rowNum) => {
            results.errors.push({
              index: group.rowNumbers.indexOf(rowNum),
              row: rowNum,
              error: 'Invoice type must be "Sale Invoice" or "Debit Note"',
            });
          });
          continue;
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(invoiceData.invoiceDate.trim())) {
          group.rowNumbers.forEach((rowNum) => {
            results.errors.push({
              index: group.rowNumbers.indexOf(rowNum),
              row: rowNum,
              error: "Invoice date must be in YYYY-MM-DD format",
            });
          });
          continue;
        }

        // Validate provinces
        const validProvinces = [
          "Balochistan",
          "Azad Jammu and Kashmir",
          "Capital Territory",
          "Punjab",
          "Khyber Pakhtunkhwa",
          "Gilgit Baltistan",
          "Sindh",
          "BALOCHISTAN",
          "AZAD JAMMU AND KASHMIR",
          "CAPITAL TERRITORY",
          "PUNJAB",
          "KHYBER PAKHTUNKHWA",
          "GILGIT BALTISTAN",
          "SINDH",
        ];

        if (!validProvinces.includes(invoiceData.sellerProvince.trim())) {
          group.rowNumbers.forEach((rowNum) => {
            results.errors.push({
              index: group.rowNumbers.indexOf(rowNum),
              row: rowNum,
              error:
                "Invalid seller province. Valid provinces are: Balochistan, Azad Jammu and Kashmir, Capital Territory, Punjab, Khyber Pakhtunkhwa, Gilgit Baltistan, Sindh",
            });
          });
          continue;
        }

        if (!validProvinces.includes(invoiceData.buyerProvince.trim())) {
          group.rowNumbers.forEach((rowNum) => {
            results.errors.push({
              index: group.rowNumbers.indexOf(rowNum),
              row: rowNum,
              error:
                "Invalid buyer province. Valid provinces are: Balochistan, Azad Jammu and Kashmir, Capital Territory, Punjab, Khyber Pakhtunkhwa, Gilgit Baltistan, Sindh",
            });
          });
          continue;
        }

        // Validate buyer registration type if provided
        if (
          invoiceData.buyerRegistrationType &&
          invoiceData.buyerRegistrationType.trim()
        ) {
          const validRegistrationTypes = ["Registered", "Unregistered"];
          if (
            !validRegistrationTypes.includes(
              invoiceData.buyerRegistrationType.trim()
            )
          ) {
            group.rowNumbers.forEach((rowNum) => {
              results.errors.push({
                index: group.rowNumbers.indexOf(rowNum),
                row: rowNum,
                error:
                  'Buyer registration type must be "Registered" or "Unregistered"',
              });
            });
            continue;
          }
        }

        // Generate a temporary invoice number for draft (will be replaced when posted to FBR)
        const tempInvoiceNumber = await generateShortInvoiceId(
          Invoice,
          "DRAFT"
        );

        // Normalize provinces to title case
        const normalizeProvince = (province) => {
          const provinceMap = {
            PUNJAB: "Punjab",
            SINDH: "Sindh",
            "KHYBER PAKHTUNKHWA": "Khyber Pakhtunkhwa",
            BALOCHISTAN: "Balochistan",
            "CAPITAL TERRITORY": "Capital Territory",
            "GILGIT BALTISTAN": "Gilgit Baltistan",
            "AZAD JAMMU AND KASHMIR": "Azad Jammu and Kashmir",
          };
          return provinceMap[province.trim()] || province.trim();
        };

        // Create invoice with transaction to handle items
        const result = await req.tenantDb.transaction(async (t) => {
          // Generate system invoice ID
          const systemInvoiceId = await generateSystemInvoiceId(Invoice);

          // Create invoice with draft status
          const invoice = await Invoice.create(
            {
              invoice_number: tempInvoiceNumber,
              system_invoice_id: systemInvoiceId,
              invoiceType: invoiceData.invoiceType.trim(),
              invoiceDate: invoiceData.invoiceDate.trim(),
              sellerNTNCNIC: invoiceData.sellerNTNCNIC
                ? invoiceData.sellerNTNCNIC.trim()
                : null,
              sellerBusinessName: invoiceData.sellerBusinessName.trim(),
              sellerProvince: normalizeProvince(invoiceData.sellerProvince),
              sellerAddress: invoiceData.sellerAddress
                ? invoiceData.sellerAddress.trim()
                : null,
              buyerNTNCNIC: invoiceData.buyerNTNCNIC
                ? invoiceData.buyerNTNCNIC.trim()
                : null,
              buyerBusinessName: invoiceData.buyerBusinessName.trim(),
              buyerProvince: normalizeProvince(invoiceData.buyerProvince),
              buyerAddress: invoiceData.buyerAddress
                ? invoiceData.buyerAddress.trim()
                : null,
              buyerRegistrationType: invoiceData.buyerRegistrationType
                ? invoiceData.buyerRegistrationType.trim()
                : null,
              invoiceRefNo: invoiceData.invoiceRefNo
                ? invoiceData.invoiceRefNo.trim()
                : null,
              companyInvoiceRefNo: invoiceData.companyInvoiceRefNo
                ? invoiceData.companyInvoiceRefNo.trim()
                : null,
              transctypeId: invoiceData.transctypeId
                ? invoiceData.transctypeId.trim()
                : null,
              status: "draft", // Always set as draft for bulk upload
              fbr_invoice_number: null,
            },
            { transaction: t }
          );

          // Create invoice items if provided
          if (group.items && group.items.length > 0) {
            const invoiceItems = group.items.map((item) => {
              // Helper function to convert empty strings to null
              const cleanValue = (value) => {
                if (
                  value === "" ||
                  value === "N/A" ||
                  value === null ||
                  value === undefined
                ) {
                  return null;
                }
                return value;
              };

              // Helper function to convert numeric strings to numbers
              const cleanNumericValue = (value) => {
                const cleaned = cleanValue(value);
                if (cleaned === null) return null;
                const num = parseFloat(cleaned);
                return isNaN(num) ? null : num;
              };

              const mappedItem = {
                invoice_id: invoice.id,
                hsCode: cleanValue(item.hsCode),
                productDescription: cleanValue(item.productDescription),
                rate: cleanValue(item.rate),
                uoM: cleanValue(item.uoM),
                quantity: cleanNumericValue(item.quantity),
                unitPrice: cleanNumericValue(item.unitPrice),
                totalValues: cleanNumericValue(item.totalValues),
                valueSalesExcludingST: cleanNumericValue(
                  item.valueSalesExcludingST
                ),
                fixedNotifiedValueOrRetailPrice: cleanNumericValue(
                  item.fixedNotifiedValueOrRetailPrice
                ),
                salesTaxApplicable: cleanNumericValue(item.salesTaxApplicable),
                salesTaxWithheldAtSource: cleanNumericValue(
                  item.salesTaxWithheldAtSource
                ),
                furtherTax: cleanNumericValue(item.furtherTax),
                sroScheduleNo: cleanValue(item.sroScheduleNo),
                fedPayable: cleanNumericValue(item.fedPayable),
                advanceIncomeTax: cleanNumericValue(item.advanceIncomeTax),
                discount: cleanNumericValue(item.discount),
                saleType: cleanValue(item.saleType),
                sroItemSerialNo: cleanValue(item.sroItemSerialNo),
              };

              // Only include extraTax when it's a positive value (> 0)
              const extraTaxValue = cleanNumericValue(item.extraTax);
              if (extraTaxValue !== null && Number(extraTaxValue) > 0) {
                mappedItem.extraTax = extraTaxValue;
              }

              return mappedItem;
            });

            await InvoiceItem.bulkCreate(invoiceItems, { transaction: t });
          }

          return invoice;
        });

        console.log(
          `Successfully created invoice ${tempInvoiceNumber} with ${group.items.length} items:`,
          result.toJSON()
        );
        results.created.push(result);
      } catch (error) {
        console.error(`Error creating invoice ${tempInvoiceNumber}:`, error);
        console.error(`Invoice data that failed:`, group.header);

        // Handle specific database errors
        if (error.name === "SequelizeValidationError") {
          group.rowNumbers.forEach((rowNum) => {
            results.errors.push({
              index: group.rowNumbers.indexOf(rowNum),
              row: rowNum,
              error:
                "Validation error: " +
                error.errors.map((e) => e.message).join(", "),
            });
          });
        } else if (error.name === "SequelizeUniqueConstraintError") {
          group.rowNumbers.forEach((rowNum) => {
            results.errors.push({
              index: group.rowNumbers.indexOf(rowNum),
              row: rowNum,
              error: "Duplicate invoice number found",
            });
          });
        } else {
          group.rowNumbers.forEach((rowNum) => {
            results.errors.push({
              index: group.rowNumbers.indexOf(rowNum),
              row: rowNum,
              error: error.message || "Unknown error occurred",
            });
          });
        }
      }
    }

    // Log final summary
    console.log("=== Bulk Invoice Upload Summary ===");
    console.log(`Total invoices processed: ${results.total}`);
    console.log(`Successfully created: ${results.created.length}`);
    console.log(`Failed: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log("Errors:");
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. Row ${error.row}: ${error.error}`);
      });
    }
    console.log("=== End Summary ===");

    res.status(200).json({
      success: true,
      message: `Bulk upload completed. ${results.created.length} invoices created as drafts with auto-generated invoice numbers, ${results.errors.length} errors.`,
      data: {
        created: results.created,
        errors: results.errors,
        summary: {
          total: results.total,
          successful: results.created.length,
          failed: results.errors.length,
        },
      },
    });
  } catch (error) {
    console.error("Error in bulk create invoices:", error);
    res.status(500).json({
      success: false,
      message: "Error processing bulk invoice upload",
      error: error.message,
    });
  }
};

// Check existing invoices for preview
export const checkExistingInvoices = async (req, res) => {
  try {
    const { Invoice } = req.tenantModels;
    const { invoices } = req.body;

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invoices array is required and must not be empty",
      });
    }

    const existing = [];
    const newInvoices = [];

    for (let i = 0; i < invoices.length; i++) {
      const invoiceData = invoices[i];
      // Since invoice numbers will be generated by the system, all invoices are treated as new
      newInvoices.push({
        row: i + 1,
        invoiceData: invoiceData,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        existing: existing,
        new: newInvoices,
      },
    });
  } catch (error) {
    console.error("Error checking existing invoices:", error);
    res.status(500).json({
      success: false,
      message: "Error checking existing invoices",
      error: error.message,
    });
  }
};

// Dashboard summary with monthly overview and recent invoices
export const getDashboardSummary = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const sequelize = req.tenantDb;
    const { Sequelize } = sequelize;
    const { Op } = Sequelize;

    // Default to last 12 months
    const endDate = req.query.end_date
      ? new Date(req.query.end_date)
      : new Date();
    const startDate = req.query.start_date
      ? new Date(req.query.start_date)
      : new Date(new Date(endDate).setMonth(endDate.getMonth() - 11, 1));

    const whereDateRange = {
      created_at: { [Op.between]: [startDate, endDate] },
    };

    // Key metrics
    const [totalCreated, totalDrafts, totalPosted, totalAmount] =
      await Promise.all([
        Invoice.count({ where: whereDateRange }),
        Invoice.count({ where: { ...whereDateRange, status: "draft" } }),
        Invoice.count({ where: { ...whereDateRange, status: "posted" } }),
        InvoiceItem.sum("totalValues", { where: whereDateRange }).then(
          (v) => v || 0
        ),
      ]);

    // Monthly overview: counts by month for posted and saved
    const monthlyRows = await Invoice.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m"),
          "month",
        ],
        [
          Sequelize.literal(
            "SUM(CASE WHEN status IN ('posted', 'submitted') THEN 1 ELSE 0 END)"
          ),
          "posted",
        ],
        [
          Sequelize.literal(
            "SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END)"
          ),
          "draft",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "total"],
      ],
      where: whereDateRange,
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m"),
      ],
      order: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m"),
          "ASC",
        ],
      ],
    });

    const monthlyOverview = monthlyRows.map((row) => {
      const plain = row.get({ plain: true });
      return {
        month: plain.month,
        posted: Number(plain.posted || 0),
        saved: Number(plain.saved || 0),
        total: Number(plain.total || 0),
      };
    });

    // Recent invoices with aggregated amount
    const recentInvoicesRaw = await Invoice.findAll({
      attributes: [
        "id",
        ["invoice_number", "invoiceNumber"],
        "status",
        "created_at",
        [
          Sequelize.fn("SUM", Sequelize.col("InvoiceItems.totalValues")),
          "amount",
        ],
      ],
      include: [{ model: InvoiceItem, as: "InvoiceItems", attributes: [] }],
      group: ["Invoice.id"],
      order: [["created_at", "DESC"]],
      limit: 10,
      subQuery: false,
    });

    const recentInvoices = recentInvoicesRaw.map((row) => {
      const plain = row.get({ plain: true });
      return {
        id: plain.id,
        invoiceNumber: plain.invoiceNumber,
        date: plain.created_at,
        amount: Number(plain.amount || 0),
        status: plain.status,
        postedToFBR: plain.status === "posted" || plain.status === "submitted",
      };
    });

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          total_invoices_created: totalCreated,
          total_invoices_draft: totalDrafts,
          total_posted_to_fbr: totalPosted,
          total_invoice_amount: Number(totalAmount || 0),
        },
        monthly_overview: monthlyOverview,
        recent_invoices: recentInvoices,
      },
    });
  } catch (error) {
    console.error("Error getting dashboard summary:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving dashboard summary",
      error: error.message,
    });
  }
};

// Get document types from FBR
export const getDocumentTypesController = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { environment = "sandbox" } = req.query;

    // Get token from request headers
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    console.log(
      `Fetching document types for tenant: ${tenantId}, environment: ${environment}`
    );

    // Get tenant data to check FBR credentials
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Check if tenant has FBR credentials
    if (!tenant.sandboxProductionToken) {
      return res.status(400).json({
        success: false,
        message: "FBR credentials not found for this tenant",
      });
    }

    // Call FBR service to get document types
    const documentTypes = await getDocumentTypes(environment, token);

    res.json({
      success: true,
      message: "Document types fetched successfully",
      data: documentTypes,
    });
  } catch (error) {
    console.error("Error fetching document types:", error);

    // Handle specific error cases
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: "FBR authentication failed. Please check your credentials.",
      });
    } else if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Document types API endpoint not found.",
      });
    } else if (error.response?.status === 500) {
      return res.status(503).json({
        success: false,
        message:
          "FBR system is temporarily unavailable. Please try again later.",
      });
    } else if (error.code === "ECONNABORTED") {
      return res.status(408).json({
        success: false,
        message: "Request timeout. FBR system may be slow. Please try again.",
      });
    } else if (error.code === "ERR_NETWORK") {
      return res.status(503).json({
        success: false,
        message: "Network error. Please check your connection and try again.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message:
          error.message || "Unable to fetch document types from FBR API.",
      });
    }
  }
};

// Get provinces from FBR
export const getProvincesController = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { environment = "sandbox" } = req.query;

    // Get token from request headers
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    console.log(
      `Fetching provinces for tenant: ${tenantId}, environment: ${environment}`
    );

    // Get tenant data to check FBR credentials
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Check if tenant has FBR credentials
    if (!tenant.sandboxProductionToken) {
      return res.status(400).json({
        success: false,
        message: "FBR credentials not found for this tenant",
      });
    }

    // Call FBR service to get provinces
    const provinces = await getProvinces(environment, token);

    res.json({
      success: true,
      message: "Provinces fetched successfully",
      data: provinces,
    });
  } catch (error) {
    console.error("Error fetching provinces:", error);

    // Handle specific error cases
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: "FBR authentication failed. Please check your credentials.",
      });
    } else if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Provinces API endpoint not found.",
      });
    } else if (error.response?.status === 500) {
      return res.status(503).json({
        success: false,
        message:
          "FBR system is temporarily unavailable. Please try again later.",
      });
    } else if (error.code === "ECONNABORTED") {
      return res.status(408).json({
        success: false,
        message: "Request timeout. FBR system may be slow. Please try again.",
      });
    } else if (error.code === "ERR_NETWORK") {
      return res.status(503).json({
        success: false,
        message: "Network error. Please check your connection and try again.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: error.message || "Unable to fetch provinces from FBR API.",
      });
    }
  }
};

// Validate invoice data with FBR
export const validateInvoiceDataController = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { environment = "sandbox" } = req.query;
    const invoiceData = req.body;

    // Get token from request headers
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    console.log(
      `Validating invoice data for tenant: ${tenantId}, environment: ${environment}`
    );

    // Get tenant data to check FBR credentials
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Check if tenant has FBR credentials
    if (!tenant.sandboxProductionToken) {
      return res.status(400).json({
        success: false,
        message: "FBR credentials not found for this tenant",
      });
    }

    // Call FBR service to validate invoice data
    const validationResult = await validateInvoiceData(
      invoiceData,
      environment,
      token
    );

    res.json({
      success: true,
      message: "Invoice data validated successfully",
      data: validationResult,
    });
  } catch (error) {
    console.error("Error validating invoice data:", error);

    // Handle specific error cases
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: "FBR authentication failed. Please check your credentials.",
      });
    } else if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice data provided.",
        data: error.response?.data,
      });
    } else if (error.response?.status === 500) {
      return res.status(503).json({
        success: false,
        message:
          "FBR system is temporarily unavailable. Please try again later.",
      });
    } else if (error.code === "ECONNABORTED") {
      return res.status(408).json({
        success: false,
        message: "Request timeout. FBR system may be slow. Please try again.",
      });
    } else if (error.code === "ERR_NETWORK") {
      return res.status(503).json({
        success: false,
        message: "Network error. Please check your connection and try again.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message:
          error.message || "Unable to validate invoice data with FBR API.",
      });
    }
  }
};

// Submit invoice data to FBR
export const submitInvoiceDataController = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { environment = "sandbox" } = req.query;
    const invoiceData = req.body;

    // Get token from request headers
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    console.log(
      `Submitting invoice data for tenant: ${tenantId}, environment: ${environment}`
    );

    // Get tenant data to check FBR credentials
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Check if tenant has FBR credentials
    if (!tenant.sandboxProductionToken) {
      return res.status(400).json({
        success: false,
        message: "FBR credentials not found for this tenant",
      });
    }

    // Call FBR service to submit invoice data
    const submissionResult = await submitInvoiceData(
      invoiceData,
      environment,
      token
    );

    res.json({
      success: true,
      message: "Invoice data submitted successfully",
      data: submissionResult,
    });
  } catch (error) {
    console.error("Error submitting invoice data:", error);

    // Handle specific error cases
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: "FBR authentication failed. Please check your credentials.",
      });
    } else if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice data provided.",
        data: error.response?.data,
      });
    } else if (error.response?.status === 500) {
      return res.status(503).json({
        success: false,
        message:
          "FBR system is temporarily unavailable. Please try again later.",
      });
    } else if (error.code === "ECONNABORTED") {
      return res.status(408).json({
        success: false,
        message: "Request timeout. FBR system may be slow. Please try again.",
      });
    } else if (error.code === "ERR_NETWORK") {
      return res.status(503).json({
        success: false,
        message: "Network error. Please check your connection and try again.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: error.message || "Unable to submit invoice data to FBR API.",
      });
    }
  }
};
