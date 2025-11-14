"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";

const fetchProducts = async () => {
  const response = await strapiApi.get("/products?populate=*");
  // Strapi v5 returns data in response.data.data for collections
  const productsData = response.data?.data || response.data || [];
  return Array.isArray(productsData) ? productsData : [];
};

const ProductsLayer = () => {
  const queryClient = useQueryClient();
  const {
    data: products = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => {
      await strapiApi.delete(`/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully!");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to delete product"
      );
    },
  });

  const handleDelete = (productId, productName) => {
    if (
      confirm(
        `Are you sure you want to delete "${productName}"? This action cannot be undone.`
      )
    ) {
      deleteProductMutation.mutate(productId);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to fetch products. Please check if the Strapi backend is running and the API endpoint is correct.";
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <Icon icon="lucide:alert-circle" className="me-2" />
            Error: {errorMessage}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <Icon
            icon="lucide:package"
            className="text-muted mb-3"
            style={{ fontSize: "48px" }}
          />
          <h5 className="mb-2">No products found</h5>
          <p className="text-muted mb-0">
            There are no products available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card basic-data-table">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h5 className="card-title mb-0">Products List</h5>
        <Link
          href="/products/new"
          className="btn btn-primary-600 radius-8 px-20 py-11 d-flex align-items-center gap-2"
        >
          <Icon icon="lucide:plus" className="icon text-lg" />
          Create New Product
        </Link>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table bordered-table mb-0">
            <thead>
              <tr>
                <th scope="col">
                  <div className="form-check style-check d-flex align-items-center">
                    <input className="form-check-input" type="checkbox" />
                    <label className="form-check-label">S.L</label>
                  </div>
                </th>
                <th scope="col">Image</th>
                <th scope="col">Name</th>
                <th scope="col">Description</th>
                <th scope="col">Categories</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => {
                // Strapi v5 - no need for .attributes, data is directly on product
                // Handle image URL - Strapi v5 structure
                // Use fallback image from available product images (cycling through 1-5)
                const fallbackImages = [
                  "/assets/images/product/product-img1.png",
                  "/assets/images/product/product-img2.png",
                  "/assets/images/product/product-img3.png",
                  "/assets/images/product/product-img4.png",
                  "/assets/images/product/product-img5.png",
                ];
                const fallbackImage =
                  fallbackImages[index % fallbackImages.length];

                let imageUrl = fallbackImage;
                if (product.image) {
                  const imageData = Array.isArray(product.image)
                    ? product.image[0]
                    : product.image;
                  if (imageData?.url) {
                    const baseUrl =
                      process.env.NEXT_PUBLIC_STRAPI_URL?.replace("/api", "") ||
                      "http://localhost:1337";
                    imageUrl = imageData.url.startsWith("http")
                      ? imageData.url
                      : `${baseUrl}${imageData.url}`;
                  }
                }

                // Handle categories - Strapi v5: categories is directly an array with name property
                const categories = Array.isArray(product.categories)
                  ? product.categories.map((cat) => cat.name || cat)
                  : product.category
                  ? [product.category.name || product.category]
                  : [];

                return (
                  <tr key={product.id || index}>
                    <td>
                      <div className="form-check style-check d-flex align-items-center">
                        <input className="form-check-input" type="checkbox" />
                        <label className="form-check-label">{index + 1}</label>
                      </div>
                    </td>
                    <td>
                      <img
                        src={imageUrl}
                        alt={product.name || "Product"}
                        className="flex-shrink-0 radius-8"
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.target.src = fallbackImage;
                        }}
                      />
                    </td>
                    <td>
                      <h6 className="text-md mb-0 fw-medium">
                        {product.name || "N/A"}
                      </h6>
                    </td>
                    <td>
                      <p
                        className="text-sm mb-0 text-muted"
                        style={{ maxWidth: "300px" }}
                      >
                        {product.desc
                          ? product.desc.length > 100
                            ? `${product.desc.substring(0, 100)}...`
                            : product.desc
                          : "No description"}
                      </p>
                    </td>
                    <td>
                      {categories.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                          {categories.map((category, catIndex) => (
                            <span
                              key={catIndex}
                              className="bg-primary-light text-primary-600 px-12 py-4 rounded-pill fw-medium text-sm"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted text-sm">
                          No categories
                        </span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/products/${product.documentId}`}
                        className="w-32-px h-32-px me-8 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                        title="View"
                      >
                        <Icon icon="iconamoon:eye-light" />
                      </Link>
                      <Link
                        href={`/products/${product.documentId}/edit`}
                        className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                        title="Edit"
                      >
                        <Icon icon="lucide:edit" />
                      </Link>
                      <button
                        type="button"
                        className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0"
                        title="Delete"
                        onClick={() =>
                          handleDelete(product.documentId, product.name)
                        }
                        disabled={deleteProductMutation.isPending}
                      >
                        {deleteProductMutation.isPending ? (
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                        ) : (
                          <Icon icon="mingcute:delete-2-line" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductsLayer;
