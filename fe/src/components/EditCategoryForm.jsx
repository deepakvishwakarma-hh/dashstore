"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";

const fetchCategory = async (id) => {
  const response = await strapiApi.get(`/categories/${id}?populate=*`);
  return response.data?.data || response.data;
};

// Function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const EditCategoryForm = ({ categoryId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: () => fetchCategory(categoryId),
  });

  // Initialize form data when category loads
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
      });
    }
  }, [category]);

  const updateCategoryMutation = useMutation({
    mutationFn: async (data) => {
      const response = await strapiApi.put(`/categories/${categoryId}`, {
        data: {
          name: data.name,
          slug: data.slug,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", categoryId] });
      toast.success("Category updated successfully!");
      router.replace(`/categories/${categoryId}`);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to update category"
      );
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name" && !isSlugManuallyEdited) {
      const generatedSlug = generateSlug(value);
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: generatedSlug,
      }));
    } else if (name === "slug") {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateCategoryMutation.mutate(formData);
  };

  if (categoryLoading) {
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

  if (!category) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <Icon icon="lucide:alert-circle" className="me-2" />
            Category not found
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

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Edit Category</h5>
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
                placeholder="Enter category name"
                value={formData.name}
                onChange={handleChange}
                required
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
                  : "Slug is automatically generated from the category name. You can edit it manually if needed."}
              </small>
            </div>

            <div className="col-12">
              <div className="d-flex gap-3">
                <button
                  type="submit"
                  className="btn btn-primary-600"
                  disabled={updateCategoryMutation.isPending}
                >
                  {updateCategoryMutation.isPending ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:save" className="icon me-2" />
                      Update Category
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryForm;
