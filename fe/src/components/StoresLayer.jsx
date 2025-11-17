"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";
import { normalizeStore } from "@/lib/normalizeStore";

const fetchStores = async () => {
  const response = await strapiApi.get("/stores?pagination[limit]=1000");
  const storesData = response.data?.data || response.data || [];
  return storesData
    .map((store) => normalizeStore(store))
    .filter((store) => store);
};

const StoresLayer = () => {
  const queryClient = useQueryClient();
  const {
    data: stores = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchStores,
  });

  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId) => {
      await strapiApi.delete(`/stores/${storeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast.success("Store deleted successfully!");
    },
    onError: (mutationError) => {
      toast.error(
        mutationError?.response?.data?.error?.message ||
          mutationError?.message ||
          "Failed to delete store"
      );
    },
  });

  const handleDelete = (storeId, storeName) => {
    if (!storeId) return;
    if (
      confirm(
        `Are you sure you want to delete "${storeName}"? This action cannot be undone.`
      )
    ) {
      deleteStoreMutation.mutate(storeId);
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading stores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to fetch stores. Please check if the Strapi backend is running and the API endpoint is correct.";
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

  if (stores.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <Icon
            icon="solar:shop-2-bold"
            className="text-muted mb-3"
            style={{ fontSize: "48px" }}
          />
          <h5 className="mb-2">No stores found</h5>
          <p className="text-muted mb-4">
            There are no stores available at the moment.
          </p>
          <Link
            href="/stores/new"
            className="btn btn-primary-600 radius-8 px-20 py-11 d-inline-flex align-items-center gap-2"
          >
            <Icon icon="lucide:plus" className="icon text-lg" />
            Create New Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card basic-data-table">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h5 className="card-title mb-0">Stores List</h5>
        <Link
          href="/stores/new"
          className="btn btn-primary-600 radius-8 px-20 py-11 d-flex align-items-center gap-2"
        >
          <Icon icon="lucide:plus" className="icon text-lg" />
          Create New Store
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
                <th scope="col">Slug</th>
                <th scope="col">Address</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store, index) => {
                const storeKey = store.documentId || store.id || index;

                return (
                  <tr key={storeKey}>
                    <td>
                      <div className="form-check style-check d-flex align-items-center">
                        <input className="form-check-input" type="checkbox" />
                        <label className="form-check-label">{index + 1}</label>
                      </div>
                    </td>
                    <td>
                      <h6 className="text-md mb-0 fw-medium">
                        {store.name || "N/A"}
                      </h6>
                    </td>
                    <td>
                      <span className="text-muted">{store.slug || "N/A"}</span>
                    </td>
                    <td>
                      <p className="text-sm text-muted mb-0">
                        {store.address
                          ? store.address.length > 80
                            ? `${store.address.substring(0, 80)}...`
                            : store.address
                          : "N/A"}
                      </p>
                    </td>
                    <td>
                      <Link
                        href={`/stores/${store.documentId || store.id}`}
                        className="w-32-px h-32-px me-8 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                        title="View"
                      >
                        <Icon icon="iconamoon:eye-light" />
                      </Link>
                      <Link
                        href={`/stores/${store.documentId || store.id}/edit`}
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
                            store.documentId || store.id,
                            store.name || "this store"
                          )
                        }
                        disabled={deleteStoreMutation.isPending}
                      >
                        {deleteStoreMutation.isPending ? (
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

export default StoresLayer;
