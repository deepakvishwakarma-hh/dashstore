"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import strapiApi from "@/lib/strapi";

const fetchProduct = async (id) => {
  const response = await strapiApi.get(`/products/${id}?populate=*`);
  return response.data?.data || response.data;
};

const ProductViewLayer = ({ productId }) => {
  const router = useRouter();
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
  });

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <Icon icon="lucide:alert-circle" className="me-2" />
            Error:{" "}
            {error?.response?.data?.error?.message ||
              error?.message ||
              "Failed to load product"}
          </div>
          <button
            className="btn btn-secondary mt-3"
            onClick={() => router.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <Icon
            icon="lucide:package-x"
            className="text-muted mb-3"
            style={{ fontSize: "48px" }}
          />
          <h5 className="mb-2">Product not found</h5>
          <button
            className="btn btn-secondary mt-3"
            onClick={() => router.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Handle image URL
  let imageUrl = "/assets/images/product/product-img1.png";
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

  // Handle categories
  const categories = Array.isArray(product.categories)
    ? product.categories
    : product.category
    ? [product.category]
    : [];

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h5 className="card-title mb-0">Product Details</h5>
        <div className="d-flex gap-2">
          <Link
            href={`/products/${productId}/edit`}
            className="btn btn-success-600"
          >
            <Icon icon="lucide:edit" className="icon me-2" />
            Edit
          </Link>
          <button className="btn btn-secondary" onClick={() => router.back()}>
            <Icon icon="lucide:arrow-left" className="icon me-2" />
            Back
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-4 mb-4">
            <img
              src={imageUrl}
              alt={product.name || "Product"}
              className="img-fluid rounded"
              style={{ maxHeight: "400px", objectFit: "cover", width: "100%" }}
              onError={(e) => {
                e.target.src = "/assets/images/product/product-img1.png";
              }}
            />
          </div>
          <div className="col-md-8">
            <div className="mb-4">
              <h3 className="mb-2">{product.name || "N/A"}</h3>
              <p className="text-muted mb-0">Slug: {product.slug || "N/A"}</p>
            </div>

            <div className="mb-4">
              <h6 className="fw-semibold mb-2">Description</h6>
              <p className="text-muted">
                {product.desc || "No description available"}
              </p>
            </div>

            {categories.length > 0 && (
              <div className="mb-4">
                <h6 className="fw-semibold mb-2">Categories</h6>
                <div className="d-flex flex-wrap gap-2">
                  {categories.map((category, index) => (
                    <span
                      key={category.id || index}
                      className="bg-primary-light text-primary-600 px-12 py-4 rounded-pill fw-medium text-sm"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.price && (
              <div className="mb-4">
                <h6 className="fw-semibold mb-2">Price</h6>
                <p className="text-lg fw-bold text-primary-600">
                  ${parseFloat(product.price).toFixed(2)}
                </p>
              </div>
            )}

            <div className="mb-4">
              <h6 className="fw-semibold mb-2">Product ID</h6>
              <p className="text-muted">{product.id || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductViewLayer;
