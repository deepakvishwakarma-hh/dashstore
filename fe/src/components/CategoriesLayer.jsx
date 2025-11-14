"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";

const fetchCategories = async () => {
  const response = await strapiApi.get("/categories?populate=*");
  const categoriesData = response.data?.data || response.data || [];
  return Array.isArray(categoriesData) ? categoriesData : [];
};

const CategoriesLayer = () => {
  const queryClient = useQueryClient();
  const {
    data: categories = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId) => {
      await strapiApi.delete(`/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted successfully!");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to delete category"
      );
    },
  });

  const handleDelete = (categoryId, categoryName) => {
    if (
      confirm(
        `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`
      )
    ) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading categories...</p>
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
              "Failed to fetch categories"}
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <Icon
            icon="lucide:folder-x"
            className="text-muted mb-3"
            style={{ fontSize: "48px" }}
          />
          <h5 className="mb-2">No categories found</h5>
          <p className="text-muted mb-0">
            There are no categories available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card basic-data-table">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h5 className="card-title mb-0">Categories List</h5>
        <Link
          href="/categories/new"
          className="btn btn-primary-600 radius-8 px-20 py-11 d-flex align-items-center gap-2"
        >
          <Icon icon="lucide:plus" className="icon text-lg" />
          Create New Category
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
                <th scope="col">Name</th>
                <th scope="col">Slug</th>
                <th scope="col">Products Count</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => {
                const productsCount = Array.isArray(category.products)
                  ? category.products.length
                  : category.products
                  ? 1
                  : 0;

                return (
                  <tr key={category.id || index}>
                    <td>
                      <div className="form-check style-check d-flex align-items-center">
                        <input className="form-check-input" type="checkbox" />
                        <label className="form-check-label">{index + 1}</label>
                      </div>
                    </td>
                    <td>
                      <h6 className="text-md mb-0 fw-medium">
                        {category.name || "N/A"}
                      </h6>
                    </td>
                    <td>
                      <span className="text-muted">
                        {category.slug || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-primary-light text-primary-600">
                        {productsCount}{" "}
                        {productsCount === 1 ? "product" : "products"}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/categories/${
                          category.documentId || category.id
                        }`}
                        className="w-32-px h-32-px me-8 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                        title="View"
                      >
                        <Icon icon="iconamoon:eye-light" />
                      </Link>
                      <Link
                        href={`/categories/${
                          category.documentId || category.id
                        }/edit`}
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
                          handleDelete(
                            category.documentId || category.id,
                            category.name
                          )
                        }
                        disabled={deleteCategoryMutation.isPending}
                      >
                        {deleteCategoryMutation.isPending ? (
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

export default CategoriesLayer;
