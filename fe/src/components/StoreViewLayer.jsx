"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import { fetchStoreById } from "@/lib/storeApi";

const StoreViewLayer = ({ storeId }) => {
  const router = useRouter();
  const {
    data: store,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["store", storeId],
    queryFn: () => fetchStoreById(storeId),
    enabled: !!storeId,
  });

  if (isLoading) {
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

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <Icon icon="lucide:alert-circle" className="me-2" />
            Error:{" "}
            {error?.response?.data?.error?.message ||
              error?.message ||
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
        <div>
          <h5 className="card-title mb-1">Store Details</h5>
          <p className="text-muted mb-0">{store.slug}</p>
        </div>
        <div className="d-flex gap-2">
          <Link
            href={`/stores/${storeId}/edit`}
            className="btn btn-success-600 d-inline-flex align-items-center gap-2"
          >
            <Icon icon="lucide:edit" />
            Edit
          </Link>
          <button className="btn btn-secondary" onClick={() => router.back()}>
            <Icon icon="lucide:arrow-left" className="me-2" />
            Back
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="mb-4">
          <h3 className="mb-2">{store.name || "N/A"}</h3>
          <p className="text-muted mb-0">
            Store ID: {store.documentId || store.id || "N/A"}
          </p>
        </div>

        <div className="row gy-4 mb-4">
          <div className="col-lg-12">
            <div className="border rounded-3 p-3 h-100">
              <p className="text-muted mb-1">Slug</p>
              <h6 className="mb-0">{store.slug || "N/A"}</h6>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h6 className="fw-semibold mb-2">Address</h6>
          <p className="text-muted mb-0">
            {store.address || "No address provided"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StoreViewLayer;
