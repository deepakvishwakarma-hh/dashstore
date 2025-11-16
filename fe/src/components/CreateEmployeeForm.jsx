"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";

const CreateEmployeeForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const createEmployeeMutation = useMutation({
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
        type: "employee",
        confirmed: true, // Auto-confirm the user
        provider: "local",
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee created successfully!");
      router.replace("/employees");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to create employee"
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

    createEmployeeMutation.mutate(formData);
  };

  // Auto-generate email preview
  const emailPreview = formData.mobile ? `${formData.mobile}@gmail.com` : "";

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Create New Employee</h5>
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
                placeholder="Enter employee name"
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
                    <li>Type: employee</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="col-12">
              <div className="d-flex gap-3">
                <button
                  type="submit"
                  className="btn btn-primary-600"
                  disabled={createEmployeeMutation.isPending}
                >
                  {createEmployeeMutation.isPending ? (
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
                      Create Employee
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

            {createEmployeeMutation.isError && (
              <div className="col-12">
                <div className="alert alert-danger" role="alert">
                  <Icon icon="lucide:alert-circle" className="me-2" />
                  Error:{" "}
                  {createEmployeeMutation.error?.response?.data?.error
                    ?.message ||
                    createEmployeeMutation.error?.message ||
                    "Failed to create employee"}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEmployeeForm;
