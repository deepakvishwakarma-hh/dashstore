"use client";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import Select from "react-select";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";
import { useStores } from "@/hook/useStores";

const fetchRoles = async () => {
  const response = await strapiApi.get("/users-permissions/roles");
  // Strapi returns roles in response.data.roles
  return response.data?.roles || [];
};

const CreateManagerForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    password: "",
    role: "",
    stores: [],
  });
  const [showPassword, setShowPassword] = useState(false);

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

  // Auto-select first role when roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !formData.role) {
      setFormData((prev) => ({
        ...prev,
        role: String(roles[0].id),
      }));
    }
  }, [roles, formData.role]);

  const createManagerMutation = useMutation({
    mutationFn: async (data) => {
      // Generate email and username from mobile number
      const email = `${data.mobile}@gmail.com`;
      const username = email; // Use email as username

      const response = await strapiApi.post("/users", {
        name: data.name,
        mobile: data.mobile,
        email: email,
        username: username,
        password: data.password,
        type: "manager",
        confirmed: true, // Auto-confirm the user
        provider: "local",
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
      toast.success("Manager created successfully!");
      router.replace("/managers");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to create manager"
      );
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    // Validate password
    if (!formData.password || formData.password.trim() === "") {
      toast.error("Password is required");
      return;
    }

    // Password minimum length validation (Strapi requires minimum 6 characters)
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    // Validate role
    if (!formData.role || formData.role.trim() === "") {
      toast.error("Role is required");
      return;
    }

    createManagerMutation.mutate(formData);
  };

  // Auto-generate email preview
  const emailPreview = formData.mobile ? `${formData.mobile}@gmail.com` : "";

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Create New Manager</h5>
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
                Email and username will be auto-generated as:{" "}
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
              <label htmlFor="password" className="form-label">
                Password <span className="text-danger-600">*</span>
              </label>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  id="password"
                  name="password"
                  placeholder="Enter password (minimum 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-3"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    border: "none",
                    background: "none",
                    padding: 0,
                    textDecoration: "none",
                  }}
                >
                  <Icon
                    icon={showPassword ? "lucide:eye-off" : "lucide:eye"}
                    className="text-muted"
                  />
                </button>
              </div>
              <small className="text-muted d-block mt-2">
                Password must be at least 6 characters long
              </small>
            </div>

            {emailPreview && (
              <div className="col-12">
                <div className="alert alert-info" role="alert">
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
                  disabled={createManagerMutation.isPending}
                >
                  {createManagerMutation.isPending ? (
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
                      Create Manager
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

            {createManagerMutation.isError && (
              <div className="col-12">
                <div className="alert alert-danger" role="alert">
                  <Icon icon="lucide:alert-circle" className="me-2" />
                  Error:{" "}
                  {createManagerMutation.error?.response?.data?.error
                    ?.message ||
                    createManagerMutation.error?.message ||
                    "Failed to create manager"}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateManagerForm;
