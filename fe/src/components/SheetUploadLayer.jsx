"use client";
import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { getAuthenticatedStrapiApi } from "@/lib/strapi";
import DownloadListings from "./DownloadListings";

const SheetUploadLayer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDateModal, setShowDateModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [dateData, setDateData] = useState({
    fromDate: "",
    toDate: "",
  });

  // Get first and last date of November 2025
  const getNovember2025Dates = () => {
    const firstDate = "2025-11-01"; // First day of November 2025
    const lastDate = "2025-11-30"; // Last day of November 2025
    return { firstDate, lastDate };
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validExtensions = [".xlsx", ".xls", ".csv"];
      const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        toast.error(
          "Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file."
        );
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error("File size exceeds 10MB limit.");
        return;
      }

      // Set default dates for November 2025
      const { firstDate, lastDate } = getNovember2025Dates();
      setDateData({
        fromDate: firstDate,
        toDate: lastDate,
      });

      // Store the file temporarily and show modal
      setPendingFile(file);
      setShowDateModal(true);
    }
  };

  // Convert Excel date to dd-mm-yyyy format
  const convertExcelDateToDDMMYYYY = (excelDate) => {
    if (!excelDate && excelDate !== 0) return "";

    // If it's already a string in dd-mm-yyyy format, return as is
    if (typeof excelDate === "string") {
      // Check if it's already in dd-mm-yyyy format
      if (/^\d{2}-\d{2}-\d{4}$/.test(excelDate)) {
        return excelDate;
      }
      // Try to parse date string
      const date = new Date(excelDate);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }

    // If it's a number (Excel serial date), convert it
    if (typeof excelDate === "number") {
      // Excel serial date: days since January 1, 1900
      // Excel incorrectly treats 1900 as a leap year, so we adjust by using Dec 30, 1899 as epoch
      const excelEpoch = new Date(1899, 11, 30); // December 30, 1899 (month is 0-indexed)
      const date = new Date(
        excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000
      );

      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }

    // If it's a Date object
    if (excelDate instanceof Date) {
      if (!isNaN(excelDate.getTime())) {
        const day = String(excelDate.getDate()).padStart(2, "0");
        const month = String(excelDate.getMonth() + 1).padStart(2, "0");
        const year = excelDate.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }

    return "";
  };

  // Convert YYYY-MM-DD to dd-mm-yyyy format
  const convertToDDMMYYYY = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  // Convert dd-mm-yyyy to YYYY-MM-DD format
  const convertToYYYYMMDD = (dateString) => {
    if (!dateString) return "";
    const [day, month, year] = dateString.split("-");
    return `${year}-${month}-${day}`;
  };

  const handleDateConfirm = () => {
    // Validate dates
    if (!dateData.fromDate || !dateData.toDate) {
      toast.error("Please select both from date and to date");
      return;
    }

    // Validate that from date is before to date
    const fromDateObj = new Date(dateData.fromDate);
    const toDateObj = new Date(dateData.toDate);

    if (fromDateObj > toDateObj) {
      toast.error("From date must be before or equal to To date");
      return;
    }

    // Confirm file selection
    setSelectedFile(pendingFile);
    setShowDateModal(false);
    setPendingFile(null);
    toast.success("File selected successfully");
  };

  const handleDateModalClose = () => {
    setShowDateModal(false);
    setPendingFile(null);
    setDateData({ fromDate: "", toDate: "" });
    // Reset file input
    document.getElementById("sheet-upload").value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    if (!dateData.fromDate || !dateData.toDate) {
      toast.error("Please enter both from date and to date");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Log sheet data
      console.log("=== Sheet Upload Data ===");
      console.log("File Name:", selectedFile.name);
      console.log("File Size:", selectedFile.size, "bytes");
      console.log("File Type:", selectedFile.type);
      console.log(
        "From Date:",
        dateData.fromDate,
        "->",
        convertToDDMMYYYY(dateData.fromDate)
      );
      console.log(
        "To Date:",
        dateData.toDate,
        "->",
        convertToDDMMYYYY(dateData.toDate)
      );
      console.log("========================");

      setUploadProgress(10);

      // Parse Excel/CSV file to JSON in frontend
      console.log("=== Parsing file to JSON ===");
      const fileExtension = selectedFile.name
        .substring(selectedFile.name.lastIndexOf("."))
        .toLowerCase();

      let workbook;
      const fileData = await selectedFile.arrayBuffer();

      if (fileExtension === ".csv") {
        // Read CSV file
        const text = new TextDecoder("utf-8").decode(fileData);
        workbook = XLSX.read(text, { type: "string" });
      } else {
        // Read Excel file (.xlsx, .xls) with date parsing enabled
        workbook = XLSX.read(fileData, {
          type: "array",
          cellDates: true, // Parse dates automatically
          cellNF: false,
          cellText: false,
        });
      }

      setUploadProgress(30);

      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON with header row and date parsing
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false, // Get formatted values (dates as strings)
        defval: "", // Default value for empty cells
      });

      console.log("=== Parsed JSON Data ===");
      console.log("Total Rows:", jsonData.length);
      console.log("Headers:", jsonData[0]);
      console.log("First 5 rows:", jsonData.slice(0, 5));
      console.log("Full Data:", jsonData);

      setUploadProgress(60);

      // Process the data into structured format
      // Expected format: Store, Day, Date, Category, Product, Quantity
      const headers = jsonData[0] || [];
      const processedData = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row.length > 0 && row[0]) {
          // Skip empty rows
          // Convert Excel date to dd-mm-yyyy format if it's a serial number
          const rawDate = row[2];
          const formattedDate = convertExcelDateToDDMMYYYY(rawDate);

          processedData.push({
            store: String(row[0] || "").trim(),
            day: String(row[1] || "").trim(),
            date: formattedDate,
            category: String(row[3] || "").trim(),
            product: String(row[4] || "").trim(),
            quantity: String(row[5] || "").trim(),
          });
        }
      }

      console.log("=== Processed Data ===");
      console.log("Total Processed Rows:", processedData.length);
      console.log("Sample Data:", processedData.slice(0, 10));
      console.log("Full Processed Data:", processedData);

      setUploadProgress(80);

      // Add date information (convert to dd-mm-yyyy format)
      const fromDateFormatted = convertToDDMMYYYY(dateData.fromDate);
      const toDateFormatted = convertToDDMMYYYY(dateData.toDate);

      // Send JSON data directly to Strapi API
      const payload = {
        fileName: selectedFile.name,
        fromDate: fromDateFormatted,
        toDate: toDateFormatted,
        headers: headers,
        rawData: jsonData,
        processedData: processedData,
      };

      console.log("=== Sending to Strapi API ===");
      console.log("Payload:", payload);

      // Get authenticated Strapi API instance
      const strapiApi = await getAuthenticatedStrapiApi();

      // Call Strapi API directly
      const response = await strapiApi.post("/stacks/process-sheet", payload);

      setUploadProgress(100);

      // Log response data
      console.log("=== Strapi API Response ===");
      console.log("Response:", response.data);
      console.log("===========================");

      toast.success("File processed and uploaded successfully!");

      // Reset form
      setSelectedFile(null);
      setDateData({ fromDate: "", toDate: "" });
      document.getElementById("sheet-upload").value = "";
      setUploadProgress(0);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error?.message || "Failed to upload file");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setDateData({ fromDate: "", toDate: "" });
    document.getElementById("sheet-upload").value = "";
    toast.success("File removed");
  };

  const handleDownloadSample = async () => {
    const loadingToast = toast.loading("Generating sample sheet...");

    try {
      const strapiApi = await getAuthenticatedStrapiApi();

      const [storesRes, categoriesRes, productsRes] = await Promise.all([
        strapiApi.get("/stores"),
        strapiApi.get("/categories"),
        strapiApi.get("/products"),
      ]);

      console.log("=== API Responses ===");
      console.log("Stores Response:", storesRes.data);
      console.log("Categories Response:", categoriesRes.data);
      console.log("Products Response:", productsRes.data);

      // Extract items - handle both Strapi v4 and v5 response formats
      const extractItems = (response) => {
        const data = response?.data?.data || response?.data || [];
        return data
          .map((item) => {
            // Handle Strapi v5 format (attributes)
            if (item.attributes) {
              return {
                id: item.id,
                name: item.attributes.name?.trim() || "",
              };
            }
            // Handle direct format
            return {
              id: item.id,
              name: item.name?.trim() || "",
            };
          })
          .filter((item) => item.name); // Filter out items without names
      };

      const stores = extractItems(storesRes);
      const categories = extractItems(categoriesRes);
      const products = extractItems(productsRes);

      console.log("=== Extracted Data ===");
      console.log("Stores:", stores);
      console.log("Categories:", categories);
      console.log("Products:", products);

      if (!stores.length || !categories.length || !products.length) {
        toast.dismiss(loadingToast);
        toast.error(
          `Please ensure stores, categories, and products exist in Strapi before generating a sample. Found: ${stores.length} stores, ${categories.length} categories, ${products.length} products.`
        );
        return;
      }

      const header = [
        "Store",
        "Day",
        "Date",
        "Category",
        "Product",
        "Quantity",
      ];
      const daysOfWeek = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      const sampleRows = [];

      // Build date list for entire November 2025
      const targetYear = 2025;
      const targetMonthIndex = 10; // November (0-based)
      const currentDate = new Date(targetYear, targetMonthIndex, 1);

      const dateEntries = [];
      while (currentDate.getMonth() === targetMonthIndex) {
        const isoDate = currentDate.toISOString().split("T")[0];
        dateEntries.push({
          isoDate,
          formattedDate: convertToDDMMYYYY(isoDate),
          dayOfWeek: daysOfWeek[currentDate.getDay()] || "Monday",
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Generate multiple rows per day to cover the entire month
      dateEntries.forEach((dateEntry, dateIndex) => {
        // We'll create up to 3 entries per day (adjust if fewer records exist)
        const entriesPerDay = Math.min(products.length, 3);

        for (let slot = 0; slot < entriesPerDay; slot++) {
          const store = stores[(dateIndex + slot) % stores.length];
          const category = categories[(dateIndex + slot) % categories.length];
          const product = products[(dateIndex + slot) % products.length];
          const quantity = Math.floor(Math.random() * 90) + 10;

          const storeName = store?.name;
          const categoryName = category?.name;
          const productName = product?.name;

          if (!storeName || !categoryName || !productName) {
            console.warn("Skipping row due to missing data:", {
              store,
              category,
              product,
            });
            continue;
          }

          sampleRows.push([
            storeName,
            dateEntry.dayOfWeek,
            dateEntry.formattedDate,
            categoryName,
            productName,
            String(quantity),
          ]);
        }
      });

      if (!sampleRows.length) {
        toast.dismiss(loadingToast);
        toast.error("Failed to build sample rows. Please check Strapi data.");
        return;
      }

      const sampleData = [header, ...sampleRows];

      // Convert to CSV format
      const csvContent = sampleData
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", "sample_sheet.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss(loadingToast);
      toast.success("Sample sheet downloaded with live data!");
    } catch (error) {
      console.error("Sample generation error:", error);
      toast.dismiss(loadingToast);
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to generate sample sheet"
      );
    }
  };

  return (
    <>
      {/* Date Selection Modal */}
      {showDateModal && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", zIndex: 1055 }}
            tabIndex="-1"
            role="dialog"
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Enter Date Range</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleDateModalClose}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row gy-3">
                    <div className="col-12">
                      <label htmlFor="fromDate" className="form-label">
                        From Date <span className="text-danger-600">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="fromDate"
                        value={dateData.fromDate}
                        onChange={(e) =>
                          setDateData({ ...dateData, fromDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="toDate" className="form-label">
                        To Date <span className="text-danger-600">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="toDate"
                        value={dateData.toDate}
                        onChange={(e) =>
                          setDateData({ ...dateData, toDate: e.target.value })
                        }
                      />
                    </div>
                    {pendingFile && (
                      <div className="col-12">
                        <div className="alert alert-info mb-0">
                          <Icon
                            icon="lucide:file-spreadsheet"
                            className="me-2"
                          />
                          <strong>Selected File:</strong> {pendingFile.name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleDateModalClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary-600"
                    onClick={handleDateConfirm}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1050 }}
            onClick={handleDateModalClose}
          ></div>
        </>
      )}

      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Upload Sheet</h5>
        </div>
        <div className="card-body">
          <div className="row gy-3">
            <div className="col-12">
              <label htmlFor="sheet-upload" className="form-label">
                Select File <span className="text-danger-600">*</span>
              </label>
              <div className="border border-dashed rounded p-4 text-center">
                <input
                  type="file"
                  className="form-control d-none"
                  id="sheet-upload"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <label
                  htmlFor="sheet-upload"
                  className="d-flex flex-column align-items-center justify-content-center"
                  style={{ minHeight: "150px", cursor: "pointer" }}
                >
                  <Icon
                    icon="solar:document-add-bold"
                    className="text-primary-600 mb-3"
                    style={{ fontSize: "48px" }}
                  />
                  <span className="fw-medium text-md mb-2">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-muted text-sm">
                    Excel (.xlsx, .xls) or CSV files (Max 10MB)
                  </span>
                </label>
              </div>
            </div>

            {selectedFile && (
              <div className="col-12">
                <div className="alert alert-info d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Icon icon="lucide:file-spreadsheet" className="text-lg" />
                    <div>
                      <strong>{selectedFile.name}</strong>
                      <br />
                      <small className="text-muted">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </small>
                      {(dateData.fromDate || dateData.toDate) && (
                        <>
                          <br />
                          <small className="text-muted">
                            Date Range: {convertToDDMMYYYY(dateData.fromDate)}{" "}
                            to {convertToDDMMYYYY(dateData.toDate)}
                          </small>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-danger p-0"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                  >
                    <Icon icon="lucide:x" className="text-lg" />
                  </button>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="col-12">
                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted">Uploading...</small>
                    <small className="text-muted">{uploadProgress}%</small>
                  </div>
                  <div className="progress" style={{ height: "8px" }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style={{ width: `${uploadProgress}%` }}
                      aria-valuenow={uploadProgress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div className="col-12">
              <div className="alert alert-info" role="alert">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <Icon icon="lucide:info" className="me-2" />
                    <strong>File Format Requirements:</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleDownloadSample}
                  >
                    <Icon icon="lucide:download" className="me-1" />
                    Download Sample Sheet
                  </button>
                </div>
                <ul className="mb-0 mt-2">
                  <li>
                    File name format: [fromdate]_to_[todate].xlsx (e.g.,
                    03-11-2024_to_10-11-2024.xlsx)
                  </li>
                  <li>Date format: dd-mm-yyyy_to_dd-mm-yyyy</li>
                  <li>
                    Required columns: Store, Day, Date, Category, Product,
                    Quantity
                  </li>
                  <li>Supported formats: .xlsx, .xls, .csv</li>
                </ul>
              </div>
            </div>

            <div className="col-12">
              <div className="d-flex gap-3">
                <button
                  type="button"
                  className="btn btn-primary-600"
                  onClick={handleUpload}
                  disabled={
                    !selectedFile ||
                    !dateData.fromDate ||
                    !dateData.toDate ||
                    isUploading
                  }
                >
                  {isUploading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:upload" className="icon me-2" />
                      Upload Sheet
                    </>
                  )}
                </button>
                {selectedFile && !isUploading && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleRemoveFile}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DownloadListings />
    </>
  );
};

export default SheetUploadLayer;
