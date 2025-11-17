"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";
import { fetchStoreById } from "@/lib/storeApi";

const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const EditStoreForm = ({ storeId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    address: "",
  });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const {
    data: store,
    isLoading: storeLoading,
    error: storeError,
  } = useQuery({
    queryKey: ["store", storeId],
    queryFn: () => fetchStoreById(storeId),
    enabled: !!storeId,
  });

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || "",
        slug: store.slug || "",
        address: store.address || "",
      });
    }
  }, [store]);

  const updateStoreMutation = useMutation({
    mutationFn: async (data) => {
      const response = await strapiApi.put(`/stores/${storeId}`, {
        data: {
          name: data.name,
          slug: data.slug,
          address: data.address,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["store", storeId] });
      toast.success("Store updated successfully!");
      router.replace(`/stores/${storeId}`);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to update store"
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
      return;
    }

    if (name === "slug") {
      setIsSlugManuallyEdited(true);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Store name is required");
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    updateStoreMutation.mutate(formData);
  };

  if (storeLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading store...</p>
        </div>
      </div>
    );
  }

  if (storeError) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <Icon icon="lucide:alert-circle" className="me-2" />
            Error:{" "}
            {storeError?.response?.data?.error?.message ||
              storeError?.message ||
              "Failed to load store"}
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

  if (!store) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <Icon
            icon="solar:shop-2-bold"
            className="text-muted mb-3"
            style={{ fontSize: "48px" }}
          />
          <h5 className="mb-2">Store not found</h5>
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
      <div className="card-header d-flex align-items-center justify-content-between">
        <h5 className="card-title mb-0">Edit Store</h5>
        <button className="btn btn-secondary" onClick={() => router.back()}>
          <Icon icon="lucide:arrow-left" className="me-2" />
          Back
        </button>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row gy-3">
            <div className="col-12">
              <label htmlFor="name" className="form-label">
                Store Name <span className="text-danger-600">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                placeholder="Enter store name"
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
                  ? "Slug is manually edited. It won't auto-update when the name changes."
                  : "Slug is automatically generated from the store name. You can edit it manually if needed."}
              </small>
            </div>

            <div className="col-12">
              <label htmlFor="address" className="form-label">
                Address
              </label>
              <textarea
                className="form-control"
                id="address"
                name="address"
                rows={4}
                placeholder="Enter store address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <div className="d-flex gap-3">
                <button
                  type="submit"
                  className="btn btn-primary-600"
                  disabled={updateStoreMutation.isPending}
                >
                  {updateStoreMutation.isPending ? (
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
                      Update Store
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => router.replace(`/stores/${storeId}`)}
                >
                  Cancel
                </button>
              </div>
            </div>

            {updateStoreMutation.isError && (
              <div className="col-12">
                <div className="alert alert-danger" role="alert">
                  <Icon icon="lucide:alert-circle" className="me-2" />
                  Error:{" "}
                  {updateStoreMutation.error?.response?.data?.error?.message ||
                    updateStoreMutation.error?.message ||
                    "Failed to update store"}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const selectStyles = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    borderColor: state.isFocused ? "#6366f1" : "#e5e7eb",
    borderRadius: "8px",
    minHeight: "42px",
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
};

export default EditStoreForm;
