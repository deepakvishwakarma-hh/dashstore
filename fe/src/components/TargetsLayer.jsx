"use client";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import toast from "react-hot-toast";
import strapiApi from "@/lib/strapi";
import { normalizeTarget, targetPopulateQuery } from "@/lib/targetApi";

const fetchTargets = async () => {
  const response = await strapiApi.get(`/targets?${targetPopulateQuery}`);
  const targetsData = response.data?.data || response.data || [];
  return targetsData.map((target) => normalizeTarget(target)).filter(Boolean);
};

const formatPeriod = (target) => {
  if (!target) return "N/A";
  if (target.period_type === "monthly" && target.month) {
    return `${target.period_type || "monthly"} - ${target.month}${
      target.year ? ` ${target.year}` : ""
    }`;
  }
  return `${target.period_type || "yearly"}${
    target.year ? ` - ${target.year}` : ""
  }`;
};

const getRelationName = (relation) => {
  if (!relation) return "N/A";
  return (
    relation.name || relation.slug || relation.email || relation.mobile || "N/A"
  );
};

const TargetsLayer = () => {
  const queryClient = useQueryClient();
  const {
    data: targets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["targets"],
    queryFn: fetchTargets,
  });

  const deleteTargetMutation = useMutation({
    mutationFn: async (targetId) => {
      await strapiApi.delete(`/targets/${targetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targets"] });
      toast.success("Target deleted successfully!");
    },
    onError: (mutationError) => {
      toast.error(
        mutationError?.response?.data?.error?.message ||
          mutationError?.message ||
          "Failed to delete target"
      );
    },
  });

  const targetsWithMeta = useMemo(
    () =>
      targets.map((target) => ({
        ...target,
        storeName:
          target.type === "store" ? getRelationName(target.store) : "Overall",
        categoryName: getRelationName(target.category),
        productName: getRelationName(target.product),
        employeeName: getRelationName(target.employee),
        periodLabel: formatPeriod(target),
      })),
    [targets]
  );

  const handleDelete = (targetId) => {
    if (
      confirm(
        "Are you sure you want to delete this target? This action cannot be undone."
      )
    ) {
      deleteTargetMutation.mutate(targetId);
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading targets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to fetch targets. Please ensure the Strapi backend is running.";
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

  if (targetsWithMeta.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <Icon
            icon="solar:target-bold"
            className="text-muted mb-3"
            style={{ fontSize: "48px" }}
          />
          <h5 className="mb-2">No targets found</h5>
          <p className="text-muted mb-4">
            There are no targets available at the moment.
          </p>
          <Link
            href="/targets/new"
            className="btn btn-primary-600 radius-8 px-20 py-11 d-inline-flex align-items-center gap-2"
          >
            <Icon icon="lucide:plus" className="icon text-lg" />
            Create New Target
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card basic-data-table">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h5 className="card-title mb-0">Targets List</h5>
        <Link
          href="/targets/new"
          className="btn btn-primary-600 radius-8 px-20 py-11 d-flex align-items-center gap-2"
        >
          <Icon icon="lucide:plus" className="icon text-lg" />
          Create New Target
        </Link>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table bordered-table mb-0">
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Scope</th>
                <th scope="col">Period</th>
                <th scope="col">Category</th>
                <th scope="col">Product</th>
                <th scope="col">Employee</th>
                <th scope="col">Target Qty</th>
                <th scope="col">Revenue</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {targetsWithMeta.map((target) => {
                const targetKey = target.documentId || target.id;
                return (
                  <tr key={targetKey}>
                    <td className="text-capitalize">{target.type || "N/A"}</td>
                    <td>{target.storeName}</td>
                    <td className="text-capitalize">{target.periodLabel}</td>
                    <td>{target.categoryName}</td>
                    <td>{target.productName}</td>
                    <td>{target.employeeName}</td>
                    <td>
                      {target.target_quantity !== null &&
                      target.target_quantity !== undefined
                        ? target.target_quantity.toLocaleString()
                        : "N/A"}
                    </td>
                    <td>
                      {target.target_revenue_achieved !== null &&
                      target.target_revenue_achieved !== undefined
                        ? target.target_revenue_achieved.toLocaleString()
                        : "N/A"}
                    </td>
                    <td>
                      <Link
                        href={`/targets/${target.documentId || target.id}`}
                        className="w-32-px h-32-px me-8 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                        title="View"
                      >
                        <Icon icon="iconamoon:eye-light" />
                      </Link>
                      <Link
                        href={`/targets/${target.documentId || target.id}/edit`}
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
                          handleDelete(target.documentId || target.id)
                        }
                        disabled={deleteTargetMutation.isPending}
                      >
                        {deleteTargetMutation.isPending ? (
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

export default TargetsLayer;
