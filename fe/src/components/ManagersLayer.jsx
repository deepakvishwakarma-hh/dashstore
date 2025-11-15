"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";

const fetchManagers = async () => {
  const response = await strapiApi.get(
    "/users?filters[type][$eq]=manager&populate=*"
  );
  // Strapi v5 returns data in response.data.data for collections
  const managersData = response.data?.data || response.data || [];
  return Array.isArray(managersData) ? managersData : [];
};

const ManagersLayer = () => {
  const queryClient = useQueryClient();
  const {
    data: managers = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["managers"],
    queryFn: fetchManagers,
  });

  const deleteManagerMutation = useMutation({
    mutationFn: async (managerId) => {
      await strapiApi.delete(`/users/${managerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managers"] });
      toast.success("Manager deleted successfully!");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to delete manager"
      );
    },
  });

  const handleDelete = (managerId, managerName) => {
    if (
      confirm(
        `Are you sure you want to delete "${managerName}"? This action cannot be undone.`
      )
    ) {
      deleteManagerMutation.mutate(managerId);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading managers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to fetch managers. Please check if the Strapi backend is running and the API endpoint is correct.";
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <Icon icon="lucide:alert-circle" className="me-2" />
            Error: {errorMessage}
          </div>
        </div>
      </div>
    );
  }

  if (managers.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <Icon
            icon="lucide:users"
            className="text-muted mb-3"
            style={{ fontSize: "48px" }}
          />
          <h5 className="mb-2">No managers found</h5>
          <p className="text-muted mb-0">
            There are no managers available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card basic-data-table">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h5 className="card-title mb-0">Managers List</h5>
        <Link
          href="/managers/new"
          className="btn btn-primary-600 radius-8 px-20 py-11 d-flex align-items-center gap-2"
        >
          <Icon icon="lucide:plus" className="icon text-lg" />
          Create New Manager
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
                <th scope="col">Mobile Number</th>
                <th scope="col">Type</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((manager, index) => {
                const managerId = manager.documentId || manager.id;
                return (
                  <tr key={managerId || index}>
                    <td>
                      <div className="form-check style-check d-flex align-items-center">
                        <input className="form-check-input" type="checkbox" />
                        <label className="form-check-label">{index + 1}</label>
                      </div>
                    </td>
                    <td>
                      <h6 className="text-md mb-0 fw-medium">
                        {manager.name || "N/A"}
                      </h6>
                    </td>
                    <td>
                      <span className="text-sm mb-0">
                        {manager.mobile || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="bg-primary-light text-primary-600 px-12 py-4 rounded-pill fw-medium text-sm">
                        {manager.type || "manager"}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/managers/${managerId}/edit`}
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
                            managerId,
                            manager.name || manager.username
                          )
                        }
                        disabled={deleteManagerMutation.isPending}
                      >
                        {deleteManagerMutation.isPending ? (
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

export default ManagersLayer;
