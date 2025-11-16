"use client";
import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";
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

      // Store the file temporarily and show modal
      setPendingFile(file);
      setShowDateModal(true);
    }
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

      const formData = new FormData();
      formData.append("files", selectedFile);

      // Simulate progress (you can implement real progress tracking with axios)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Add date information to form data (convert to dd-mm-yyyy format)
      const fromDateFormatted = convertToDDMMYYYY(dateData.fromDate);
      const toDateFormatted = convertToDDMMYYYY(dateData.toDate);
      formData.append("fromDate", fromDateFormatted);
      formData.append("toDate", toDateFormatted);

      // Log FormData contents
      console.log("FormData contents:");
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(pair[0] + ":", pair[1].name, `(${pair[1].size} bytes)`);
        } else {
          console.log(pair[0] + ":", pair[1]);
        }
      }

      const response = await strapiApi.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Log response data
      console.log("=== Upload Response ===");
      console.log("Response:", response.data);
      console.log("======================");

      // Process the uploaded file (you may need to call a custom endpoint to process the sheet)
      // For now, we'll just show success
      toast.success("File uploaded successfully!");

      // Reset form
      setSelectedFile(null);
      setDateData({ fromDate: "", toDate: "" });
      document.getElementById("sheet-upload").value = "";
      setUploadProgress(0);

      // You can add additional processing here, like calling an API to process the sheet data
      // await strapiApi.post("/process-sheet", { fileId: response.data[0].id });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to upload file"
      );
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

  const handleDownloadSample = () => {
    // Sample data matching the required format
    const sampleData = [
      ["Store", "Day", "Date", "Category", "Product", "Quantity"],
      ["Store A", "Monday", "03-11-2024", "Electronics", "Laptop", "10"],
      ["Store A", "Tuesday", "04-11-2024", "Electronics", "Mouse", "25"],
      ["Store B", "Monday", "03-11-2024", "Clothing", "T-Shirt", "50"],
      ["Store B", "Wednesday", "05-11-2024", "Electronics", "Keyboard", "15"],
      ["Store C", "Tuesday", "04-11-2024", "Clothing", "Jeans", "30"],
      ["Store C", "Thursday", "06-11-2024", "Electronics", "Monitor", "8"],
      ["Store D", "Wednesday", "05-11-2024", "Food", "Bread", "100"],
      ["Store D", "Friday", "07-11-2024", "Electronics", "Headphones", "20"],
    ];

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

    toast.success("Sample sheet downloaded successfully!");
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
