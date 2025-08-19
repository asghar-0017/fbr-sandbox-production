import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import { dirname } from "path";
import ejs from "ejs";

// Import MySQL connector instead of MongoDB
import mysqlConnector from "./dbConnector/mysqlConnector.js";

// Import schema checker for automatic database maintenance
import DatabaseSchemaChecker from "../check-missing-columns.js";

// Import new MySQL routes
import authRoutes from "./routes/authRoutes.js";
import tenantAuthRoutes from "./routes/tenantAuthRoutes.js";

import tenantRoutes from "./routes/tenantRoutes.js";
import buyerRoutes from "./routes/buyerRoutes.js";
import invoiceRoutes, { publicInvoiceRoutes } from "./routes/invoiceRoutes.js";
import hsCodeRoutes from "./routes/hsCodeRoutes.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "dist")));

app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "https://gw.fbr.gov.pk",
          "https://central-timber.inplsoftwares.online",
        ],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https:"],
      },
    },
  })
);
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "https://central-timber.inplsoftwares.online",
      "https://central-timber.inplsoftwares.online",
      "https://fbrtestcase.inplsoftwares.online",
      "*",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-ID"],
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/invoices",
  express.static(path.join(process.cwd(), "public/invoices"))
);
// MySQL Routes
app.use("/api/auth", authRoutes);
app.use("/api/tenant-auth", tenantAuthRoutes);
app.use("/api/admin", tenantRoutes);
app.use("/api/tenant/:tenantId", buyerRoutes);
app.use("/api/tenant/:tenantId", invoiceRoutes);

// HS Code Routes (with caching)
app.use("/api", hsCodeRoutes);

// Public Invoice Routes
app.use("/api", publicInvoiceRoutes);

// Manual schema check endpoint
app.post("/api/admin/check-schema", async (req, res) => {
  try {
    console.log("🔍 Manual schema check triggered via API...");
    const checker = new DatabaseSchemaChecker();
    await checker.checkAllTenants();
    res.json({ 
      success: true, 
      message: "Database schema check completed successfully" 
    });
  } catch (error) {
    console.error("❌ Manual schema check failed:", error);
    res.status(500).json({ 
      success: false, 
      message: "Schema check failed", 
      error: error.message 
    });
  }
});

// Catch-all route for SPA - must be last
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

export const logger = {
  info: (msg) => console.log(`INFO: ${msg}`),
  error: (msg) => console.error(`ERROR: ${msg}`),
};

const startServer = async () => {
  try {
    // Initialize MySQL instead of MongoDB
    await mysqlConnector({}, logger);
    console.log("✅ Connected to MySQL multi-tenant database system");

    // Auto-run database schema check on startup
    console.log("🔍 Running automatic database schema check...");
    try {
      const checker = new DatabaseSchemaChecker();
      await checker.checkAllTenants();
      console.log("✅ Database schema check completed successfully!");
    } catch (schemaError) {
      console.log("⚠️  Schema check had issues (continuing server startup):", schemaError.message);
    }

    const port = process.env.PORT || 5150;
    app.listen(port, () => {
      console.log("🚀 Server is running on port", port);
      console.log("📋 MySQL Multi-Tenant System Ready!");
      console.log("🔗 API Endpoints:");
    });
  } catch (error) {
    console.log("❌ Error starting server", error);
    process.exit(1);
  }
};

export default startServer;
