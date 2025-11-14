"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";

// Function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const CreateCategoryForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const createCategoryMutation = useMutation({
    mutationFn: async (data) => {
      const response = await strapiApi.post("/categories", {
        data: {
          name: data.name,
          slug: data.slug,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully!");
      router.replace("/categories");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to create category"
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
    createCategoryMutation.mutate(formData);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Create New Category</h5>
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
                  disabled={createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? (
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
                      Create Category
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

export default CreateCategoryForm;
