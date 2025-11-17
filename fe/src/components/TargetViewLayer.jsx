"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import { fetchTargetById } from "@/lib/targetApi";

const formatPeriod = (target) => {
  if (!target) return "N/A";
  if (target.period_type === "monthly" && target.month) {
    return `${target.period_type || "monthly"} (${target.month}${
      target.year ? `/${target.year}` : ""
    })`;
  }
  return `${target.period_type || "yearly"}${
    target.year ? ` (${target.year})` : ""
  }`;
};

const getRelationLabel = (relation, fallback = "N/A") => {
  if (!relation) return fallback;
  return (
    relation.name ||
    relation.slug ||
    relation.email ||
    relation.mobile ||
    fallback
  );
};

const TargetViewLayer = ({ targetId }) => {
  const router = useRouter();
  const {
    data: target,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["target", targetId],
    queryFn: () => fetchTargetById(targetId),
    enabled: !!targetId,
  });

  const periodLabel = useMemo(() => formatPeriod(target), [target]);
  const storeLabel = useMemo(
    () =>
      target?.type === "store"
        ? getRelationLabel(target.store, "Store not linked")
        : "Overall",
    [target]
  );

  if (isLoading) {
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

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <Icon icon="lucide:alert-circle" className="me-2" />
            Error:{" "}
            {error?.response?.data?.error?.message ||
              error?.message ||
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
        <div>
          <h5 className="card-title mb-1">Target Details</h5>
          <p className="text-muted mb-0">
            Document ID: {target.documentId || target.id}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link
            href={`/targets/${targetId}/edit`}
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
        <div className="row gy-4">
          <div className="col-lg-4">
            <div className="border rounded-3 p-3 h-100">
              <p className="text-muted mb-1">Type</p>
              <h6 className="text-capitalize mb-0">{target.type || "N/A"}</h6>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="border rounded-3 p-3 h-100">
              <p className="text-muted mb-1">Scope</p>
              <h6 className="mb-0">{storeLabel}</h6>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="border rounded-3 p-3 h-100">
              <p className="text-muted mb-1">Period</p>
              <h6 className="text-capitalize mb-0">{periodLabel}</h6>
            </div>
          </div>
        </div>

        <div className="row gy-4 mt-1">
          <div className="col-lg-4">
            <div className="border rounded-3 p-3 h-100">
              <p className="text-muted mb-1">Category</p>
              <h6 className="mb-0">
                {getRelationLabel(target.category, "Not set")}
              </h6>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="border rounded-3 p-3 h-100">
              <p className="text-muted mb-1">Product</p>
              <h6 className="mb-0">
                {getRelationLabel(target.product, "Not set")}
              </h6>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="border rounded-3 p-3 h-100">
              <p className="text-muted mb-1">Employee</p>
              <h6 className="mb-0">
                {getRelationLabel(target.employee, "Not set")}
              </h6>
            </div>
          </div>
        </div>

        <div className="row gy-4 mt-1">
          <div className="col-lg-6">
            <div className="border rounded-3 p-3 h-100">
              <p className="text-muted mb-1">Target Quantity</p>
              <h4 className="mb-0">
                {target.target_quantity !== null &&
                target.target_quantity !== undefined
                  ? target.target_quantity.toLocaleString()
                  : "N/A"}
              </h4>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="border rounded-3 p-3 h-100">
              <p className="text-muted mb-1">Target Revenue</p>
              <h4 className="mb-0">
                {target.target_revenue_achieved !== null &&
                target.target_revenue_achieved !== undefined
                  ? target.target_revenue_achieved.toLocaleString()
                  : "N/A"}
              </h4>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-muted mb-1">Identifiers</p>
          <div className="d-flex flex-wrap gap-3">
            <span className="badge bg-secondary-subtle text-secondary-emphasis px-12 py-8">
              ID: {target.id}
            </span>
            {target.documentId && (
              <span className="badge bg-secondary-subtle text-secondary-emphasis px-12 py-8">
                Document ID: {target.documentId}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetViewLayer;
