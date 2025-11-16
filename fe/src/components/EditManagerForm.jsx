"use client";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import Select from "react-select";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";
import { useStores } from "@/hook/useStores";

const fetchManager = async (id) => {
  const response = await strapiApi.get(`/users/${id}?populate=*`);
  return response.data?.data || response.data;
};

const fetchRoles = async () => {
  const response = await strapiApi.get("/users-permissions/roles");
  // Strapi returns roles in response.data.roles
  return response.data?.roles || [];
};

const EditManagerForm = ({ managerId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    block: false,
    confirmed: false,
    role: "",
    stores: [],
  });

  const { data: manager, isLoading: managerLoading } = useQuery({
    queryKey: ["manager", managerId],
    queryFn: () => fetchManager(managerId),
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  });

  const { stores = [], isLoading: storesLoading } = useStores({
    filterByUserStores: false,
    useSessionStores: false,
  });

  // Transform stores for react-select
  const storeOptions = useMemo(() => {
    return stores.map((store) => ({
      value: store.id,
      label: store.name || store.attributes?.name || `Store ${store.id}`,
    }));
  }, [stores]);

  // Get selected stores for react-select
  const selectedStores = useMemo(() => {
    return storeOptions.filter((option) =>
      formData.stores.includes(String(option.value))
    );
  }, [storeOptions, formData.stores]);

  // Initialize form data when manager loads
  useEffect(() => {
    if (manager) {
      // Extract store IDs from manager's stores (handle both array and single store)
      const managerStores = manager.stores || [];
      const storeIds = Array.isArray(managerStores)
        ? managerStores.map((store) => String(store.id || store))
        : [];

      setFormData({
        name: manager.name || "",
        mobile: manager.mobile || "",
        block: manager.block || false,
        confirmed: manager.confirmed || false,
        role: manager.role?.id ? String(manager.role.id) : "",
        stores: storeIds,
      });
    }
  }, [manager]);

  // Auto-select first role if no role is set and roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !formData.role && manager) {
      // Only auto-select if manager doesn't have a role
      if (!manager.role?.id) {
        setFormData((prev) => ({
          ...prev,
          role: String(roles[0].id),
        }));
      }
    }
  }, [roles, formData.role, manager]);

  const updateManagerMutation = useMutation({
    mutationFn: async (data) => {
      // Generate email and username from mobile number
      const email = `${data.mobile}@gmail.com`;
      const username = email; // Use email as username

      const response = await strapiApi.put(`/users/${managerId}`, {
        name: data.name,
        mobile: data.mobile,
        email: email,
        username: username,
        type: "manager",
        block: data.block,
        confirmed: data.confirmed,
        role: data.role ? Number(data.role) : null,
        stores:
          data.stores && data.stores.length > 0
            ? data.stores.map((id) => Number(id))
            : [],
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managers"] });
      queryClient.invalidateQueries({ queryKey: ["manager", managerId] });
      toast.success("Manager updated successfully!");
      router.replace("/managers");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to update manager"
      );
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleStoreChange = (selectedOptions) => {
    const selectedIds = selectedOptions
      ? selectedOptions.map((option) => String(option.value))
      : [];
    setFormData((prev) => ({
      ...prev,
      stores: selectedIds,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate mobile number
    if (!formData.mobile || formData.mobile.trim() === "") {
      toast.error("Mobile number is required");
      return;
    }

    // Basic mobile number validation (digits only)
    if (!/^\d+$/.test(formData.mobile)) {
      toast.error("Mobile number should contain only digits");
      return;
    }

    // Validate role
    if (!formData.role || formData.role.trim() === "") {
      toast.error("Role is required");
      return;
    }

    updateManagerMutation.mutate(formData);
  };

  // Auto-generate email preview
  const emailPreview = formData.mobile ? `${formData.mobile}@gmail.com` : "";

  if (managerLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading manager...</p>
        </div>
      </div>
    );
  }

  if (!manager) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <Icon icon="lucide:alert-circle" className="me-2" />
            Manager not found
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
        <h5 className="card-title mb-0">Edit Manager</h5>
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
                placeholder="Enter manager name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-12">
              <label htmlFor="mobile" className="form-label">
                Mobile Number <span className="text-danger-600">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="mobile"
                name="mobile"
                placeholder="Enter mobile number (e.g., 1234567890)"
                value={formData.mobile}
                onChange={handleChange}
                required
                pattern="[0-9]+"
                title="Mobile number should contain only digits"
              />
              <small className="text-muted d-block mt-2">
                Email and username will be auto-updated as:{" "}
                {emailPreview || "Enter mobile number"}
              </small>
            </div>

            <div className="col-12">
              <label htmlFor="role" className="form-label">
                Role <span className="text-danger-600">*</span>
              </label>
              <select
                className="form-select"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                disabled={rolesLoading}
              >
                <option value="">
                  {rolesLoading ? "Loading roles..." : "Select a role"}
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {rolesLoading && (
                <small className="text-muted d-block mt-2">
                  Loading available roles...
                </small>
              )}
            </div>

            <div className="col-12">
              <label htmlFor="stores" className="form-label">
                Stores
              </label>
              {storesLoading ? (
                <div className="text-muted">Loading stores...</div>
              ) : (
                <Select
                  isMulti
                  name="stores"
                  options={storeOptions}
                  value={selectedStores}
                  onChange={handleStoreChange}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Search and select stores..."
                  isSearchable
                  isClearable
                  noOptionsMessage={() => "No stores found"}
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
                    }),
                  }}
                />
              )}
            </div>

            <div className="col-12">
              <div className="form-check">
                <input
                  className="form-check-input me-2"
                  type="checkbox"
                  id="block"
                  name="block"
                  checked={formData.block}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="block">
                  Block Manager
                </label>
              </div>
            </div>

            <div className="col-12">
              <div className="form-check">
                <input
                  className="form-check-input me-2"
                  type="checkbox"
                  id="confirmed"
                  name="confirmed"
                  checked={formData.confirmed}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="confirmed">
                  Confirmed
                </label>
              </div>
            </div>

            {emailPreview && (
              <div className="col-12">
                <div className="alert alert-info " role="alert">
                  <Icon icon="lucide:info" className="me-2" />
                  <strong>Auto-generated details:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Email: {emailPreview}</li>
                    <li>Username: {emailPreview}</li>
                    <li>Type: manager</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="col-12">
              <div className="d-flex gap-3">
                <button
                  type="submit"
                  className="btn btn-primary-600"
                  disabled={updateManagerMutation.isPending}
                >
                  {updateManagerMutation.isPending ? (
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
                      Update Manager
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

            {updateManagerMutation.isError && (
              <div className="col-12">
                <div className="alert alert-danger" role="alert">
                  <Icon icon="lucide:alert-circle" className="me-2" />
                  Error:{" "}
                  {updateManagerMutation.error?.response?.data?.error
                    ?.message ||
                    updateManagerMutation.error?.message ||
                    "Failed to update manager"}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditManagerForm;
