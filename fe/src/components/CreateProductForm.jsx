"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import Select from "react-select";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";

const fetchCategories = async () => {
  const response = await strapiApi.get("/categories");
  const categoriesData = response.data?.data || response.data || [];
  return Array.isArray(categoriesData) ? categoriesData : [];
};

// Function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

const CreateProductForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    desc: "",
    slug: "",
    categories: [],
  });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Transform categories for react-select
  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.id,
      label: category.name,
    }));
  }, [categories]);

  // Get selected categories for react-select
  const selectedCategories = useMemo(() => {
    return categoryOptions.filter((option) =>
      formData.categories.includes(option.value)
    );
  }, [categoryOptions, formData.categories]);

  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      const response = await strapiApi.post("/products", {
        data: {
          name: data.name,
          desc: data.desc,
          slug: data.slug,
          categories: data.categories,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created successfully!");
      router.replace("/products");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to create product"
      );
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name" && !isSlugManuallyEdited) {
      // Auto-generate slug from name if slug hasn't been manually edited
      const generatedSlug = generateSlug(value);
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: generatedSlug,
      }));
    } else if (name === "slug") {
      // Track if slug is manually edited
      setIsSlugManuallyEdited(true);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCategoryChange = (selectedOptions) => {
    const selectedIds = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    setFormData((prev) => ({
      ...prev,
      categories: selectedIds,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    createProductMutation.mutate(formData);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Create New Product</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row gy-3">
            <div className="col-12">
              <label htmlFor="name" className="form-label">
                Name <span className="text-danger-600">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-12">
              <label htmlFor="desc" className="form-label">
                Description
              </label>
              <textarea
                className="form-control"
                id="desc"
                name="desc"
                rows={4}
                placeholder="Enter product description"
                value={formData.desc}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <label htmlFor="slug" className="form-label">
                Slug <span className="text-danger-600">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="slug"
                name="slug"
                placeholder="Slug will be auto-generated from name"
                value={formData.slug}
                onChange={handleChange}
                required
              />
              <small className="text-muted d-block mt-2">
                {isSlugManuallyEdited
                  ? "Slug is manually edited. It won't auto-update when name changes."
                  : "Slug is automatically generated from the product name. You can edit it manually if needed."}
              </small>
            </div>

            <div className="col-12">
              <label htmlFor="categories" className="form-label">
                Categories
              </label>
              {categoriesLoading ? (
                <div className="text-muted">Loading categories...</div>
              ) : (
                <Select
                  isMulti
                  name="categories"
                  options={categoryOptions}
                  value={selectedCategories}
                  onChange={handleCategoryChange}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Search and select categories..."
                  isSearchable
                  isClearable
                  noOptionsMessage={() => "No categories found"}
                  styles={{
                    control: (baseStyles, state) => ({
                      ...baseStyles,
                      borderColor: state.isFocused ? "#6366f1" : "#e5e7eb",
                      borderRadius: "8px",
                      minHeight: "38px",
                      "&:hover": {
                        borderColor: "#6366f1",
                      },
                    }),
                    option: (baseStyles, state) => ({
                      ...baseStyles,
                      backgroundColor: state.isSelected
                        ? "#6366f1"
                        : state.isFocused
                        ? "#eef2ff"
                        : "white",
                      color: state.isSelected ? "white" : "#1f2937",
                      "&:hover": {
                        backgroundColor: state.isSelected
                          ? "#6366f1"
                          : "#eef2ff",
                      },
                    }),
                    multiValue: (baseStyles) => ({
                      ...baseStyles,
                      backgroundColor: "#eef2ff",
                    }),
                    multiValueLabel: (baseStyles) => ({
                      ...baseStyles,
                      color: "#6366f1",
                    }),
                    multiValueRemove: (baseStyles) => ({
                      ...baseStyles,
                      color: "#6366f1",
                      "&:hover": {
                        backgroundColor: "#6366f1",
                        color: "white",
                      },
                    }),
                  }}
                />
              )}
            </div>

            <div className="col-12">
              <div className="d-flex gap-3">
                <button
                  type="submit"
                  className="btn btn-primary-600"
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:save" className="icon me-2" />
                      Create Product
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.back()}
                >
                  Cancel
                </button>
              </div>
            </div>

            {createProductMutation.isError && (
              <div className="col-12">
                <div className="alert alert-danger" role="alert">
                  <Icon icon="lucide:alert-circle" className="me-2" />
                  Error:{" "}
                  {createProductMutation.error?.response?.data?.error
                    ?.message ||
                    createProductMutation.error?.message ||
                    "Failed to create product"}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductForm;
