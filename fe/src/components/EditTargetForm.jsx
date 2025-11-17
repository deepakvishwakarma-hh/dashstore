"use client";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";
import { useStores } from "@/hook/useStores";
import { fetchTargetById } from "@/lib/targetApi";

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const fetchCategories = async () => {
  const response = await strapiApi.get("/categories?pagination[limit]=1000");
  const data = response.data?.data || response.data || [];
  return Array.isArray(data) ? data : [];
};

const fetchProducts = async () => {
  const response = await strapiApi.get("/products?pagination[limit]=1000");
  const data = response.data?.data || response.data || [];
  return Array.isArray(data) ? data : [];
};

const fetchEmployees = async () => {
  const response = await strapiApi.get(
    "/users?filters[type][$eq]=employee&pagination[limit]=1000"
  );
  const data = response.data?.data || response.data || [];
  return Array.isArray(data) ? data : [];
};

const EditTargetForm = ({ targetId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: "store",
    store: "",
    period_type: "yearly",
    year: "",
    month: "",
    target_quantity: "",
    target_revenue_achieved: "",
    category: "",
    product: "",
    employee: "",
  });
  const {
    data: target,
    isLoading: targetLoading,
    error: targetError,
  } = useQuery({
    queryKey: ["target", targetId],
    queryFn: () => fetchTargetById(targetId),
    enabled: !!targetId,
  });

  const {
    stores = [],
    isLoading: storesLoading,
    isError: storesError,
    error: storesErrorObj,
  } = useStores({
    useSessionStores: false,
    enabled: true,
  });

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories", "target-options"],
    queryFn: fetchCategories,
  });

  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products", "target-options"],
    queryFn: fetchProducts,
  });

  const {
    data: employees = [],
    isLoading: employeesLoading,
    error: employeesError,
  } = useQuery({
    queryKey: ["employees", "target-options"],
    queryFn: fetchEmployees,
  });

  const referencesLoading =
    storesLoading || categoriesLoading || productsLoading || employeesLoading;

  const referencesError =
    storesError || categoriesError || productsError || employeesError;

  const referenceErrorMessage = useMemo(() => {
    if (storesError) {
      return (
        storesErrorObj?.response?.data?.error?.message ||
        storesErrorObj?.message ||
        "Failed to load stores."
      );
    }
    if (categoriesError) {
      return "Failed to load categories.";
    }
    if (productsError) {
      return "Failed to load products.";
    }
    if (employeesError) {
      return "Failed to load employees.";
    }
    return null;
  }, [
    storesError,
    categoriesError,
    productsError,
    employeesError,
    storesErrorObj,
  ]);

  useEffect(() => {
    if (target) {
      setFormData({
        type: target.type || "store",
        store: target.store?.id ? String(target.store.id) : "",
        period_type: target.period_type || "yearly",
        year: target.year || "",
        month: target.month || "",
        target_quantity:
          target.target_quantity !== null &&
          target.target_quantity !== undefined
            ? String(target.target_quantity)
            : "",
        target_revenue_achieved:
          target.target_revenue_achieved !== null &&
          target.target_revenue_achieved !== undefined
            ? String(target.target_revenue_achieved)
            : "",
        category: target.category?.id ? String(target.category.id) : "",
        product: target.product?.id ? String(target.product.id) : "",
        employee: target.employee?.id ? String(target.employee.id) : "",
      });
    }
  }, [target]);

  const updateTargetMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        type: data.type,
        period_type: data.period_type,
        year: data.year,
        month: data.period_type === "monthly" ? data.month : null,
        target_quantity:
          data.target_quantity !== "" ? Number(data.target_quantity) : null,
        target_revenue_achieved:
          data.target_revenue_achieved !== ""
            ? Number(data.target_revenue_achieved)
            : null,
      };

      if (data.type === "store" && data.store) {
        payload.store = Number(data.store);
      } else {
        payload.store = null;
      }
      payload.category = data.category ? Number(data.category) : null;
      payload.product = data.product ? Number(data.product) : null;
      payload.employee = data.employee ? Number(data.employee) : null;

      const response = await strapiApi.put(`/targets/${targetId}`, {
        data: payload,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targets"] });
      queryClient.invalidateQueries({ queryKey: ["target", targetId] });
      toast.success("Target updated successfully!");
      router.replace(`/targets/${targetId}`);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to update target"
      );
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "type" && value !== "store") {
        updated.store = "";
      }
      if (name === "period_type" && value !== "monthly") {
        updated.month = "";
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.type) {
      toast.error("Target type is required");
      return;
    }

    if (formData.type === "store" && !formData.store) {
      toast.error("Please select a store for this target");
      return;
    }

    if (!formData.period_type) {
      toast.error("Period type is required");
      return;
    }

    if (!formData.year.trim()) {
      toast.error("Year is required");
      return;
    }

    if (formData.period_type === "monthly" && !formData.month) {
      toast.error("Please select a month for monthly targets");
      return;
    }

    updateTargetMutation.mutate(formData);
  };

  if (targetLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading target...</p>
        </div>
      </div>
    );
  }

  if (targetError) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <Icon icon="lucide:alert-circle" className="me-2" />
            Error:{" "}
            {targetError?.response?.data?.error?.message ||
              targetError?.message ||
              "Failed to load target"}
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

  if (!target) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <Icon
            icon="solar:target-bold"
            className="text-muted mb-3"
            style={{ fontSize: "48px" }}
          />
          <h5 className="mb-2">Target not found</h5>
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
        <h5 className="card-title mb-0">Edit Target</h5>
        <button className="btn btn-secondary" onClick={() => router.back()}>
          <Icon icon="lucide:arrow-left" className="me-2" />
          Back
        </button>
      </div>
      <div className="card-body">
        {referencesError && (
          <div className="alert alert-warning" role="alert">
            <Icon icon="lucide:alert-triangle" className="me-2" />
            {referenceErrorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="row gy-3">
            <div className="col-12 col-md-6">
              <label htmlFor="type" className="form-label">
                Target Type <span className="text-danger-600">*</span>
              </label>
              <select
                id="type"
                name="type"
                className="form-select"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="store">Store</option>
                <option value="overall">Overall</option>
              </select>
            </div>

            {formData.type === "store" && (
              <div className="col-12 col-md-6">
                <label htmlFor="store" className="form-label">
                  Store <span className="text-danger-600">*</span>
                </label>
                {storesLoading ? (
                  <div className="text-muted">Loading stores...</div>
                ) : (
                  <select
                    id="store"
                    name="store"
                    className="form-select"
                    value={formData.store}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name || `Store ${store.id}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="col-12 col-md-6">
              <label htmlFor="period_type" className="form-label">
                Period Type <span className="text-danger-600">*</span>
              </label>
              <select
                id="period_type"
                name="period_type"
                className="form-select"
                value={formData.period_type}
                onChange={handleChange}
              >
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label htmlFor="year" className="form-label">
                Year <span className="text-danger-600">*</span>
              </label>
              <input
                id="year"
                name="year"
                type="text"
                className="form-control"
                placeholder="e.g., 2025"
                value={formData.year}
                onChange={handleChange}
                required
              />
            </div>

            {formData.period_type === "monthly" && (
              <div className="col-12 col-md-3">
                <label htmlFor="month" className="form-label">
                  Month <span className="text-danger-600">*</span>
                </label>
                <select
                  id="month"
                  name="month"
                  className="form-select"
                  value={formData.month}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select month</option>
                  {MONTH_OPTIONS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-12 col-md-6">
              <label htmlFor="target_quantity" className="form-label">
                Target Quantity
              </label>
              <input
                id="target_quantity"
                name="target_quantity"
                type="number"
                min="0"
                className="form-control"
                placeholder="Enter target quantity"
                value={formData.target_quantity}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="target_revenue_achieved" className="form-label">
                Target Revenue
              </label>
              <input
                id="target_revenue_achieved"
                name="target_revenue_achieved"
                type="number"
                min="0"
                className="form-control"
                placeholder="Enter target revenue"
                value={formData.target_revenue_achieved}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="category" className="form-label">
                Category
              </label>
              {categoriesLoading ? (
                <div className="text-muted">Loading categories...</div>
              ) : (
                <select
                  id="category"
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">None</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name || `Category ${category.id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="product" className="form-label">
                Product
              </label>
              {productsLoading ? (
                <div className="text-muted">Loading products...</div>
              ) : (
                <select
                  id="product"
                  name="product"
                  className="form-select"
                  value={formData.product}
                  onChange={handleChange}
                >
                  <option value="">None</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name || `Product ${product.id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="employee" className="form-label">
                Employee
              </label>
              {employeesLoading ? (
                <div className="text-muted">Loading employees...</div>
              ) : (
                <select
                  id="employee"
                  name="employee"
                  className="form-select"
                  value={formData.employee}
                  onChange={handleChange}
                >
                  <option value="">None</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name ||
                        employee.username ||
                        `Employee ${employee.id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="col-12">
              <div className="d-flex gap-3 flex-wrap">
                <button
                  type="submit"
                  className="btn btn-primary-600"
                  disabled={updateTargetMutation.isPending || referencesLoading}
                >
                  {updateTargetMutation.isPending ? (
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
                      Update Target
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => router.replace(`/targets/${targetId}`)}
                >
                  Cancel
                </button>
              </div>
            </div>

            {updateTargetMutation.isError && (
              <div className="col-12">
                <div className="alert alert-danger" role="alert">
                  <Icon icon="lucide:alert-circle" className="me-2" />
                  Error:{" "}
                  {updateTargetMutation.error?.response?.data?.error?.message ||
                    updateTargetMutation.error?.message ||
                    "Failed to update target"}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTargetForm;
