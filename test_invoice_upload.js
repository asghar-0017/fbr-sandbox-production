const fs = require("fs");
const path = require("path");

// Read the test CSV file
const csvContent = fs.readFileSync("test_invoices.csv", "utf8");
const lines = csvContent.split("\n").filter((line) => line.trim());

// Parse CSV to JSON
const headers = lines[0].split(",");
const invoices = [];

for (let i = 1; i < lines.length; i++) {
  if (lines[i].trim()) {
    const values = lines[i].split(",");
    const invoice = {};
    headers.forEach((header, index) => {
      // Clean up any carriage return characters
      let value = values[index] || "";
      value = value.replace(/\r/g, "").trim();
      invoice[header] = value;
    });
    invoices.push(invoice);
  }
}

console.log("Parsed invoices:");
console.log(JSON.stringify(invoices, null, 2));

console.log("\nTest data ready for API testing:");
console.log("POST /tenant/{tenant_id}/invoices/bulk");
console.log("Body:", JSON.stringify({ invoices }, null, 2));
