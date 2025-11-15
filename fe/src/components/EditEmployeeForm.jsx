"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";

const fetchEmployee = async (id) => {
  const response = await strapiApi.get(`/users/${id}?populate=*`);
  return response.data?.data || response.data;
};

const EditEmployeeForm = ({ employeeId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
  });

  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => fetchEmployee(employeeId),
  });

  // Initialize form data when employee loads
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || "",
        mobile: employee.mobile || "",
      });
    }
  }, [employee]);

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data) => {
      // Generate email and username from mobile number
      const email = `${data.mobile}@gmail.com`;
      const username = email; // Use email as username

      const response = await strapiApi.put(`/users/${employeeId}`, {
        name: data.name,
        mobile: data.mobile,
        email: email,
        username: username,
        type: "employee",
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
      toast.success("Employee updated successfully!");
      router.replace("/employees");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to update employee"
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

    updateEmployeeMutation.mutate(formData);
  };

  // Auto-generate email preview
  const emailPreview = formData.mobile ? `${formData.mobile}@gmail.com` : "";

  if (employeeLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading employee...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <Icon icon="lucide:alert-circle" className="me-2" />
            Employee not found
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
        <h5 className="card-title mb-0">Edit Employee</h5>
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
                placeholder="Enter mobile number (e.g., 7354657459)"
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
                  disabled={updateEmployeeMutation.isPending}
                >
                  {updateEmployeeMutation.isPending ? (
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
                      Update Employee
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

            {updateEmployeeMutation.isError && (
              <div className="col-12">
                <div className="alert alert-danger" role="alert">
                  <Icon icon="lucide:alert-circle" className="me-2" />
                  Error:{" "}
                  {updateEmployeeMutation.error?.response?.data?.error
                    ?.message ||
                    updateEmployeeMutation.error?.message ||
                    "Failed to update employee"}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployeeForm;
