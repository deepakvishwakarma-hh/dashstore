"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import strapiApi from "@/lib/strapi";

const fetchCategory = async (id) => {
  const response = await strapiApi.get(`/categories/${id}?populate=*`);
  return response.data?.data || response.data;
};

const CategoryViewLayer = ({ categoryId }) => {
  const router = useRouter();
  const {
    data: category,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: () => fetchCategory(categoryId),
  });

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading category...</p>
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
              "Failed to load category"}
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

  if (!category) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <Icon
            icon="lucide:folder-x"
            className="text-muted mb-3"
            style={{ fontSize: "48px" }}
          />
          <h5 className="mb-2">Category not found</h5>
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

  const products = Array.isArray(category.products)
    ? category.products
    : category.product
    ? [category.product]
    : [];

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h5 className="card-title mb-0">Category Details</h5>
        <div className="d-flex gap-2">
          <Link
            href={`/categories/${categoryId}/edit`}
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
        <div className="mb-4">
          <h3 className="mb-2">{category.name || "N/A"}</h3>
          <p className="text-muted mb-0">Slug: {category.slug || "N/A"}</p>
        </div>

        <div className="mb-4">
          <h6 className="fw-semibold mb-2">Category ID</h6>
          <p className="text-muted">
            {category.id || category.documentId || "N/A"}
          </p>
        </div>

        {products.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-semibold mb-3">Products ({products.length})</h6>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.id || index}>
                      <td>{product.name || "N/A"}</td>
                      <td>
                        <span className="text-muted">
                          {product.slug || "N/A"}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/products/${product.documentId || product.id}`}
                          className="btn btn-sm btn-primary-600"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {products.length === 0 && (
          <div className="mb-4">
            <h6 className="fw-semibold mb-2">Products</h6>
            <p className="text-muted">No products in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryViewLayer;
