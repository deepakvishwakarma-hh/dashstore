"use client";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";

const DownloadListings = () => {
  const handleDownloadStoreListing = async () => {
    try {
      // Fetch store listing from API
      const response = await strapiApi.get("/stores");

      const stores = response.data.data || [];

      // Convert to CSV format
      const headers = ["ID", "Name", "Slug", "Address", "Status"];
      const csvRows = [headers];

      stores.forEach((store) => {
        csvRows.push([
          store.id || "",
          store.name || "",
          store.slug || "",
          store.address || "",
        ]);
      });

      const csvContent = csvRows
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", "store_listing.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Store listing downloaded successfully!");
    } catch (error) {
      console.error("Error downloading store listing:", error);
      toast.error("Failed to download store listing");
    }
  };

  const handleDownloadCategoryListing = async () => {
    try {
      // Fetch category listing from API
      const response = await strapiApi.get("/categories");
      const categories = response.data.data || [];

      // Convert to CSV format
      const headers = ["ID", "Name", "Slug"];
      const csvRows = [headers];

      categories.forEach((category) => {
        csvRows.push([
          category.id || "",
          category.name || "",
          category.slug || "",
        ]);
      });

      const csvContent = csvRows
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", "category_listing.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Category listing downloaded successfully!");
    } catch (error) {
      console.error("Error downloading category listing:", error);
      toast.error("Failed to download category listing");
    }
  };

  const handleDownloadProductListing = async () => {
    try {
      // Fetch product listing from API
      const response = await strapiApi.get("/products?populate=categories");
      const products = response.data.data || [];

      // Convert to CSV format
      const headers = ["ID", "Name", "Categories", "Price", "Slug"];
      const csvRows = [headers];

      products.forEach((product) => {
        csvRows.push([
          product.id || "",
          product.name || "",
          product.categories.map((category) => category.name).join(",") || "",
          product.price || "",
          product.slug || "",
        ]);
      });

      const csvContent = csvRows
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", "product_listing.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Product listing downloaded successfully!");
    } catch (error) {
      console.error("Error downloading product listing:", error);
      toast.error("Failed to download product listing");
    }
  };

  return (
    <div className="card mt-4">
      <div className="card-header">
        <h5 className="card-title mb-0">Download Listings</h5>
      </div>
      <div className="card-body">
        <div className="row gy-3">
          <div className="col-12">
            <p className="text-muted mb-3">
              Download master data listings for reference
            </p>
          </div>
          <div className="col-12 col-md-4">
            <button
              type="button"
              className="btn btn-outline-primary w-100"
              onClick={handleDownloadStoreListing}
            >
              <Icon icon="lucide:store" className="me-2" />
              Download Store Listing
            </button>
          </div>
          <div className="col-12 col-md-4">
            <button
              type="button"
              className="btn btn-outline-primary w-100"
              onClick={handleDownloadCategoryListing}
            >
              <Icon icon="lucide:folder" className="me-2" />
              Download Category Listing
            </button>
          </div>
          <div className="col-12 col-md-4">
            <button
              type="button"
              className="btn btn-outline-primary w-100"
              onClick={handleDownloadProductListing}
            >
              <Icon icon="lucide:package" className="me-2" />
              Download Product Listing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadListings;
