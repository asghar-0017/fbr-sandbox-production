// Buyer controller for multi-tenant MySQL system
// This controller uses req.tenantModels.Buyer from tenant middleware

// Create new buyer
export const createBuyer = async (req, res) => {
  try {
    const { Buyer } = req.tenantModels;
    const {
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
    } = req.body;

    // Validate required fields
    if (!buyerProvince || !buyerRegistrationType) {
      return res.status(400).json({
        success: false,
        message: "Buyer province and registration type are required",
      });
    }

    // Check if buyer with same NTN already exists
    if (buyerNTNCNIC) {
      const existingBuyer = await Buyer.findOne({
        where: { buyerNTNCNIC: buyerNTNCNIC },
      });

      if (existingBuyer) {
        return res.status(409).json({
          success: false,
          message: `Buyer with NTN/CNIC "${buyerNTNCNIC}" already exists. Please use a different NTN/CNIC or update the existing buyer.`,
        });
      }
    }

    // Create buyer
    const buyer = await Buyer.create({
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
    });

    res.status(201).json({
      success: true,
      message: "Buyer created successfully",
      data: buyer,
    });
  } catch (error) {
    console.error("Error creating buyer:", error);

    // Handle specific database errors
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => e.message),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Buyer with this NTN/CNIC already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating buyer",
      error: error.message,
    });
  }
};

// Get all buyers
export const getAllBuyers = async (req, res) => {
  try {
    const { Buyer } = req.tenantModels;
    const { page = 1, limit = 10, search } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add search functionality
    if (search) {
      whereClause[req.tenantDb.Sequelize.Op.or] = [
        { buyerNTNCNIC: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
        {
          buyerBusinessName: {
            [req.tenantDb.Sequelize.Op.like]: `%${search}%`,
          },
        },
        { buyerProvince: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Buyer.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        buyers: rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_records: count,
          records_per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting buyers:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving buyers",
      error: error.message,
    });
  }
};

// Get buyer by ID
export const getBuyerById = async (req, res) => {
  try {
    const { Buyer } = req.tenantModels;
    const { id } = req.params;

    const buyer = await Buyer.findByPk(id);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Buyer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: buyer,
    });
  } catch (error) {
    console.error("Error getting buyer:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving buyer",
      error: error.message,
    });
  }
};

// Update buyer
export const updateBuyer = async (req, res) => {
  try {
    const { Buyer } = req.tenantModels;
    const { id } = req.params;
    const {
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
    } = req.body;

    const buyer = await Buyer.findByPk(id);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Buyer not found",
      });
    }

    // Check if the new NTN already exists with another buyer
    if (buyerNTNCNIC && buyerNTNCNIC !== buyer.buyerNTNCNIC) {
      const existingBuyer = await Buyer.findOne({
        where: {
          buyerNTNCNIC: buyerNTNCNIC,
          id: { [req.tenantDb.Sequelize.Op.ne]: id }, // Exclude current buyer from check
        },
      });

      if (existingBuyer) {
        return res.status(409).json({
          success: false,
          message: `Buyer with NTN/CNIC "${buyerNTNCNIC}" already exists. Please use a different NTN/CNIC.`,
        });
      }
    }

    await buyer.update({
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
    });

    res.status(200).json({
      success: true,
      message: "Buyer updated successfully",
      data: buyer,
    });
  } catch (error) {
    console.error("Error updating buyer:", error);

    // Handle specific database errors
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => e.message),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Buyer with this NTN/CNIC already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating buyer",
      error: error.message,
    });
  }
};

// Delete buyer
export const deleteBuyer = async (req, res) => {
  try {
    const { Buyer } = req.tenantModels;
    const { id } = req.params;

    const buyer = await Buyer.findByPk(id);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Buyer not found",
      });
    }

    await buyer.destroy();

    res.status(200).json({
      success: true,
      message: "Buyer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting buyer:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting buyer",
      error: error.message,
    });
  }
};

// Get buyers by province
export const getBuyersByProvince = async (req, res) => {
  try {
    const { Buyer } = req.tenantModels;
    const { province } = req.params;

    const buyers = await Buyer.findAll({
      where: { buyerProvince: province },
      order: [["buyerBusinessName", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: buyers,
    });
  } catch (error) {
    console.error("Error getting buyers by province:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving buyers by province",
      error: error.message,
    });
  }
};

// Bulk create buyers
export const bulkCreateBuyers = async (req, res) => {
  try {
    const { Buyer } = req.tenantModels;
    const { buyers } = req.body;

    if (!Array.isArray(buyers) || buyers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Buyers array is required and must not be empty",
      });
    }

    // Limit the number of buyers that can be uploaded at once
    if (buyers.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Maximum 1000 buyers can be uploaded at once",
      });
    }

    const results = {
      created: [],
      errors: [],
      total: buyers.length,
    };

    // Process each buyer
    for (let i = 0; i < buyers.length; i++) {
      const buyerData = buyers[i];

      console.log(`Processing buyer ${i + 1}:`, {
        buyerNTNCNIC: buyerData.buyerNTNCNIC,
        buyerBusinessName: buyerData.buyerBusinessName,
        buyerProvince: buyerData.buyerProvince,
        buyerRegistrationType: buyerData.buyerRegistrationType,
      });

      try {
        // Validate required fields
        if (!buyerData.buyerProvince || !buyerData.buyerProvince.trim()) {
          results.errors.push({
            index: i,
            row: i + 1,
            error: "Province is required",
          });
          continue;
        }

        if (
          !buyerData.buyerRegistrationType ||
          !buyerData.buyerRegistrationType.trim()
        ) {
          results.errors.push({
            index: i,
            row: i + 1,
            error: "Registration Type is required",
          });
          continue;
        }

        // Validate province - accept both uppercase and title case
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
        if (!validProvinces.includes(buyerData.buyerProvince.trim())) {
          results.errors.push({
            index: i,
            row: i + 1,
            error:
              "Invalid province. Valid provinces are: Balochistan, Azad Jammu and Kashmir, Capital Territory, Punjab, Khyber Pakhtunkhwa, Gilgit Baltistan, Sindh",
          });
          continue;
        }

        // Validate registration type
        const validRegistrationTypes = ["Registered", "Unregistered"];
        if (
          !validRegistrationTypes.includes(
            buyerData.buyerRegistrationType.trim()
          )
        ) {
          results.errors.push({
            index: i,
            row: i + 1,
            error: 'Registration Type must be "Registered" or "Unregistered"',
          });
          continue;
        }

        // Validate NTN/CNIC format if provided
        if (buyerData.buyerNTNCNIC && buyerData.buyerNTNCNIC.trim()) {
          const ntnCnic = buyerData.buyerNTNCNIC.trim();
          if (ntnCnic.length < 7 || ntnCnic.length > 15) {
            results.errors.push({
              index: i,
              row: i + 1,
              error: "NTN/CNIC should be between 7-15 characters",
            });
            continue;
          }
        }

        // Check if buyer with same NTN already exists
        if (buyerData.buyerNTNCNIC && buyerData.buyerNTNCNIC.trim()) {
          const existingBuyer = await Buyer.findOne({
            where: { buyerNTNCNIC: buyerData.buyerNTNCNIC.trim() },
          });

          if (existingBuyer) {
            results.errors.push({
              index: i,
              row: i + 1,
              error: `Buyer with NTN/CNIC "${buyerData.buyerNTNCNIC}" already exists in database`,
            });
            continue;
          }
        }

        // Check for duplicate NTN within the same upload batch
        if (buyerData.buyerNTNCNIC && buyerData.buyerNTNCNIC.trim()) {
          const duplicateInBatch = results.created.find(
            (createdBuyer) =>
              createdBuyer.buyerNTNCNIC === buyerData.buyerNTNCNIC.trim()
          );

          if (duplicateInBatch) {
            results.errors.push({
              index: i,
              row: i + 1,
              error: `Duplicate NTN/CNIC "${buyerData.buyerNTNCNIC}" found in upload file`,
            });
            continue;
          }
        }

        // Normalize province to title case
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

        // Create buyer with trimmed values
        const buyer = await Buyer.create({
          buyerNTNCNIC: buyerData.buyerNTNCNIC
            ? buyerData.buyerNTNCNIC.trim()
            : null,
          buyerBusinessName: buyerData.buyerBusinessName
            ? buyerData.buyerBusinessName.trim()
            : null,
          buyerProvince: normalizeProvince(buyerData.buyerProvince),
          buyerAddress: buyerData.buyerAddress
            ? buyerData.buyerAddress.trim()
            : null,
          buyerRegistrationType: buyerData.buyerRegistrationType.trim(),
        });

        console.log(`Successfully created buyer ${i + 1}:`, buyer.toJSON());
        results.created.push(buyer);
      } catch (error) {
        console.error(`Error creating buyer at index ${i}:`, error);
        console.error(`Buyer data that failed:`, buyerData);

        // Handle specific database errors
        if (error.name === "SequelizeValidationError") {
          results.errors.push({
            index: i,
            row: i + 1,
            error:
              "Validation error: " +
              error.errors.map((e) => e.message).join(", "),
          });
        } else if (error.name === "SequelizeUniqueConstraintError") {
          results.errors.push({
            index: i,
            row: i + 1,
            error: "Duplicate NTN/CNIC found",
          });
        } else {
          results.errors.push({
            index: i,
            row: i + 1,
            error: error.message || "Unknown error occurred",
          });
        }
      }
    }

    // Log final summary
    console.log("=== Bulk Upload Summary ===");
    console.log(`Total buyers processed: ${results.total}`);
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
      message: `Bulk upload completed. ${results.created.length} buyers created, ${results.errors.length} errors.`,
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
    console.error("Error in bulk create buyers:", error);
    res.status(500).json({
      success: false,
      message: "Error processing bulk buyer upload",
      error: error.message,
    });
  }
};

// Check existing buyers for preview
export const checkExistingBuyers = async (req, res) => {
  try {
    const { Buyer } = req.tenantModels;
    const { buyers } = req.body;

    if (!Array.isArray(buyers) || buyers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Buyers array is required and must not be empty",
      });
    }

    // Limit the number of buyers that can be checked at once
    if (buyers.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Maximum 1000 buyers can be checked at once",
      });
    }

    const results = {
      existing: [],
      new: [],
      total: buyers.length,
    };

    // Extract all NTN/CNIC values for batch checking
    const ntnCnicValues = buyers
      .map((buyer, index) => ({
        ntnCnic: buyer.buyerNTNCNIC?.trim(),
        index,
        buyerData: buyer,
      }))
      .filter((item) => item.ntnCnic); // Only check buyers with NTN/CNIC

    if (ntnCnicValues.length > 0) {
      // Batch query to find existing buyers
      const existingBuyers = await Buyer.findAll({
        where: {
          buyerNTNCNIC: ntnCnicValues.map((item) => item.ntnCnic),
        },
        attributes: ["buyerNTNCNIC", "buyerBusinessName"],
      });

      const existingNtnCnicSet = new Set(
        existingBuyers.map((buyer) => buyer.buyerNTNCNIC)
      );

      // Categorize buyers
      buyers.forEach((buyer, index) => {
        const ntnCnic = buyer.buyerNTNCNIC?.trim();

        if (ntnCnic && existingNtnCnicSet.has(ntnCnic)) {
          const existingBuyer = existingBuyers.find(
            (b) => b.buyerNTNCNIC === ntnCnic
          );
          results.existing.push({
            index,
            row: index + 1,
            buyerData: buyer,
            existingBuyer: {
              buyerNTNCNIC: existingBuyer.buyerNTNCNIC,
              buyerBusinessName: existingBuyer.buyerBusinessName,
            },
          });
        } else {
          results.new.push({
            index,
            row: index + 1,
            buyerData: buyer,
          });
        }
      });
    } else {
      // If no NTN/CNIC values, all buyers are considered new
      buyers.forEach((buyer, index) => {
        results.new.push({
          index,
          row: index + 1,
          buyerData: buyer,
        });
      });
    }

    res.status(200).json({
      success: true,
      data: {
        existing: results.existing,
        new: results.new,
        summary: {
          total: results.total,
          existing: results.existing.length,
          new: results.new.length,
        },
      },
    });
  } catch (error) {
    console.error("Error checking existing buyers:", error);
    res.status(500).json({
      success: false,
      message: "Error checking existing buyers",
      error: error.message,
    });
  }
};
