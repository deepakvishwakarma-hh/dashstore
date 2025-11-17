/**
 * Test script for process-sheet API endpoint
 * Run with: node test-process-sheet.js
 */

const axios = require("axios");

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337/api";
const API_TOKEN =
  process.env.API_TOKEN ||
  "63c26721cf3a6a03eb8ea2b0a4e4db97a347a17ba45c7e799caa6ceec3166fcdcc0af3211f1ebd8a12aea8d2778149b8be910ffc6b6819c7be883f08e8d0c09774aa46a0ca91e4c82c5532efe62075a05f0300099cf7f11f1f406b5a24663bf62a751f9880b4d139dbc4c6c374574cfd44b9eefc229bc90376c4cbf6960f4ead";

// Test data matching the expected format
const testData = {
  fileName: "test_sheet.xlsx",
  fromDate: "01-11-2024",
  toDate: "07-11-2024",
  headers: ["Store", "Day", "Date", "Category", "Product", "Quantity"],
  rawData: [
    ["Store", "Day", "Date", "Category", "Product", "Quantity"],
    ["Store A", "Monday", "03-11-2024", "Electronics", "Laptop", "10"],
    ["Store A", "Tuesday", "04-11-2024", "Electronics", "Mouse", "25"],
    ["Store B", "Monday", "03-11-2024", "Clothing", "T-Shirt", "50"],
  ],
  processedData: [
    {
      store: "Store A",
      day: "Monday",
      date: "03-11-2024",
      category: "Electronics",
      product: "Laptop",
      quantity: "10",
    },
    {
      store: "Store A",
      day: "Tuesday",
      date: "04-11-2024",
      category: "Electronics",
      product: "Mouse",
      quantity: "25",
    },
    {
      store: "Store B",
      day: "Monday",
      date: "03-11-2024",
      category: "Clothing",
      product: "T-Shirt",
      quantity: "50",
    },
  ],
};

async function testProcessSheet() {
  try {
    console.log("=== Testing Process Sheet API ===");
    console.log("Endpoint:", `${STRAPI_URL}/stacks/process-sheet`);
    console.log("Method: POST");
    console.log("Data:", JSON.stringify(testData, null, 2));
    console.log("\n--- Sending Request ---\n");

    const response = await axios.post(
      `${STRAPI_URL}/stacks/process-sheet`,
      testData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
      }
    );

    console.log("✅ Success!");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Error!");

    if (error.code === "ECONNREFUSED") {
      console.error("❌ Connection Refused!");
      console.error(
        "Make sure Strapi server is running on http://localhost:1337"
      );
      console.error("Start it with: cd be && npm run develop");
      return;
    }

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Status Text:", error.response.statusText);
      console.error(
        "Error Message:",
        error.response.data?.error?.message || error.message
      );
      console.error(
        "Response Data:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error("Error Message:", error.message);
      console.error("Error Code:", error.code);
      console.error("Full Error:", error);
    }
  }
}

// Run the test
testProcessSheet();
