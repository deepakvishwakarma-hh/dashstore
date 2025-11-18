"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
import { useStoreComparison } from "@/hook/useStoreComparison";
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const StoreComparison = () => {
  const [filterType, setFilterType] = useState("yearly");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const [selectedStoreSlugs, setSelectedStoreSlugs] = useState([]);

  const isCustomRangeIncomplete =
    filterType === "custom" && (!customFromDate || !customToDate);

  const queryParams = useMemo(() => {
    const params = {
      filterType,
    };

    if ((filterType === "yearly" || filterType === "monthly") && selectedYear) {
      const yearAsNumber = parseInt(selectedYear, 10);
      if (!Number.isNaN(yearAsNumber)) {
        params.year = yearAsNumber;
      }
    }

    if (filterType === "monthly" && selectedMonth) {
      const monthAsNumber = parseInt(selectedMonth, 10);
      if (!Number.isNaN(monthAsNumber)) {
        params.month = monthAsNumber;
      }
    }

    if (filterType === "custom" && customFromDate && customToDate) {
      params.fromDate = customFromDate;
      params.toDate = customToDate;
    }

    if (selectedStoreSlugs.length > 0) {
      params.storeSlugs = selectedStoreSlugs.join(",");
    }

    return params;
  }, [
    filterType,
    selectedYear,
    selectedMonth,
    customFromDate,
    customToDate,
    selectedStoreSlugs,
  ]);

  const {
    data: comparisonData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useStoreComparison(queryParams, {
    enabled: !isCustomRangeIncomplete,
  });

  const metadata = comparisonData?.metadata ?? {};
  const filterInfo = comparisonData?.filter ?? {};
  const availableYears = metadata.availableYears ?? [];
  const availableMonthsByYear = metadata.availableMonthsByYear ?? {};
  const availableStores = metadata.availableStores ?? [];

  const availableMonths = useMemo(() => {
    if (!selectedYear) {
      return [];
    }
    return (
      availableMonthsByYear[selectedYear] ??
      availableMonthsByYear[Number(selectedYear)] ??
      []
    );
  }, [availableMonthsByYear, selectedYear]);

  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0].toString());
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    if (
      availableMonths.length > 0 &&
      !selectedMonth &&
      filterType === "monthly"
    ) {
      setSelectedMonth(availableMonths[0].toString());
    }
  }, [availableMonths, selectedMonth, filterType]);

  const appliedStoreSlugs = filterInfo?.appliedStoreSlugs ?? [];

  useEffect(() => {
    if (selectedStoreSlugs.length === 0 && appliedStoreSlugs.length > 0) {
      setSelectedStoreSlugs(appliedStoreSlugs);
    }
  }, [appliedStoreSlugs, selectedStoreSlugs.length]);

  const handleStoreToggle = (storeSlug) => {
    if (!storeSlug) return;
    setSelectedStoreSlugs((prev) => {
      if (prev.includes(storeSlug)) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((slug) => slug !== storeSlug);
      }
      return [...prev, storeSlug];
    });
  };

  const storeOptions = useMemo(() => {
    const seen = new Set();
    return availableStores
      .filter((store) => {
        if (!store.slug) return false;
        if (seen.has(store.slug)) return false;
        seen.add(store.slug);
        return true;
      })
      .map((store) => ({
        slug: store.slug,
        name: store.name,
      }));
  }, [availableStores]);

  const storeColors = [
    "#487FFF",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  const storeComparisonData = useMemo(() => {
    if (!comparisonData?.stores) {
      return [];
    }
    return comparisonData.stores.map((store, index) => ({
      storeName: store.storename || store.storeSlug || `Store ${index + 1}`,
      storeSlug: store.storeSlug,
      totalSales: store.totalSales ?? 0,
      topCategory: store.topCategory ?? "N/A",
      topProduct: store.topProduct ?? "N/A",
      categorySales: store.categorySales ?? [],
      productSales: store.productSales ?? [],
      monthlyData: store.monthlySales ?? { months: [], sales: [] },
    }));
  }, [comparisonData?.stores]);

  const comparisonChartData = useMemo(() => {
    const chart = comparisonData?.charts?.comparison;
    if (!chart) {
      return { months: [], series: [] };
    }
    const coloredSeries = (chart.series ?? []).map((series, index) => ({
      ...series,
      color: storeColors[index % storeColors.length],
    }));
    return {
      months: chart.months ?? [],
      series: coloredSeries,
    };
  }, [comparisonData?.charts?.comparison, storeColors]);

  return (
    <>
      {/* Filter Section */}
      <div className="card mb-4">
        <div className="card-body p-24">
          <div className="row g-3 align-items-end">
            <div className="col-md-2">
              <label className="form-label fw-semibold">Filter Type</label>
              <select
                className="form-select"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  if (e.target.value !== "custom") {
                    setCustomFromDate("");
                    setCustomToDate("");
                  }
                  if (e.target.value !== "monthly") {
                    setSelectedMonth("");
                  }
                }}
              >
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
                <option value="yesterday">Yesterday</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
            {filterType === "yearly" && (
              <div className="col-md-2">
                <label className="form-label fw-semibold">Select Year</label>
                <select
                  className="form-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {filterType === "monthly" && (
              <>
                <div className="col-md-2">
                  <label className="form-label fw-semibold">Select Year</label>
                  <select
                    className="form-select"
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setSelectedMonth("");
                    }}
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold">Select Month</label>
                  <select
                    className="form-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {availableMonths.map((month) => {
                      const monthNames = [
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ];
                      return (
                        <option key={month} value={month}>
                          {monthNames[month]}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </>
            )}
            {filterType === "custom" && (
              <>
                <div className="col-md-2">
                  <label className="form-label fw-semibold">From Date</label>
                  <input
                    type="date"
                    className="form-select"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold">To Date</label>
                  <input
                    type="date"
                    className="form-select"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Store Selection */}
      <div className="card mb-4">
        <div className="card-header border-bottom bg-base py-12 px-20">
          <h6 className="text-md fw-semibold mb-0">Select Stores to Compare</h6>
        </div>
        <div className="card-body p-16">
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-muted">Loading stores...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-4">
              <p className="text-danger">
                Error loading stores: {error?.message}
              </p>
            </div>
          ) : (
            <div className="row g-2">
              {storeOptions.map((store, index) => (
                <div
                  key={`${store.slug}-${index}`}
                  className="col-lg-2 col-md-2 col-sm-3 col-4"
                >
                  <div
                    className={`card border cursor-pointer ${
                      selectedStoreSlugs.includes(store.slug)
                        ? "border-primary"
                        : ""
                    }`}
                    onClick={() => handleStoreToggle(store.slug)}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.3s",
                      backgroundColor: selectedStoreSlugs.includes(store.slug)
                        ? "#E8F0FE"
                        : "",
                    }}
                  >
                    <div className="card-body p-12 text-center">
                      <Icon
                        icon="solar:shop-2-bold"
                        className="text-lg mb-1"
                        style={{
                          color: selectedStoreSlugs.includes(store.slug)
                            ? "#487FFF"
                            : "",
                        }}
                      />
                      <p
                        className="mb-0 fw-semibold text-sm"
                        style={{
                          fontSize: "12px",
                          color: selectedStoreSlugs.includes(store.slug)
                            ? "#487FFF"
                            : "",
                        }}
                      >
                        {store.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedStoreSlugs.length > 0 && (
        <>
          {isLoading || isFetching ? (
            <div className="card mb-4">
              <div className="card-body p-24 text-center">
                <p className="text-muted">Loading comparison data...</p>
              </div>
            </div>
          ) : isError ? (
            <div className="card mb-4">
              <div className="card-body p-24 text-center">
                <p className="text-danger">
                  Error loading comparison data: {error?.message}
                </p>
                <button
                  className="btn btn-primary mt-2"
                  onClick={() => refetch()}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : storeComparisonData.length === 0 ? (
            <div className="card mb-4">
              <div className="card-body p-24 text-center">
                <p className="text-muted">No comparison data available</p>
              </div>
            </div>
          ) : (
            <>
              {/* Store Comparison Cards */}
              <div className="row gy-2 mb-2">
                {storeComparisonData.map((store, index) => (
                  <div key={store.storeName} className="col-lg-4 col-md-6">
                    <div className="card h-100">
                      <div className="card-header border-bottom bg-base py-12 px-16">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: "10px",
                              height: "10px",
                              backgroundColor:
                                storeColors[index % storeColors.length],
                              borderRadius: "50%",
                            }}
                          ></div>
                          <h6 className="text-md fw-semibold mb-0">
                            {store.storeName}
                          </h6>
                        </div>
                      </div>
                      <div className="card-body p-16">
                        <div className="mb-2">
                          <p className="text-xs text-primary-light mb-1">
                            Total Sales
                          </p>
                          <h5 className="fw-bold mb-0">
                            {store.totalSales.toLocaleString()}
                          </h5>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs text-primary-light mb-1">
                            Top Category
                          </p>
                          <span className="badge bg-info">
                            {store.topCategory}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-primary-light mb-1">
                            Top Product
                          </p>
                          <span className="badge bg-success">
                            {store.topProduct}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison Charts - Side by Side */}
              <div className="row gy-2 mb-2">
                {/* Sales Comparison Over Time */}
                <div className="col-lg-6 col-xl-6">
                  <div className="card h-100">
                    <div className="card-header border-bottom bg-base py-12 px-16">
                      <h6 className="text-md fw-semibold mb-0">
                        Sales Comparison Over Time
                      </h6>
                    </div>
                    <div className="card-body p-16">
                      <ReactApexChart
                        options={{
                          chart: {
                            type: "line",
                            height: 300,
                            toolbar: { show: false },
                            zoom: { enabled: false },
                          },
                          stroke: {
                            curve: "smooth",
                            width: 3,
                          },
                          colors: comparisonChartData.series.map(
                            (s) => s.color
                          ),
                          xaxis: {
                            categories: comparisonChartData.months,
                            labels: {
                              style: {
                                fontSize: "12px",
                              },
                            },
                          },
                          yaxis: {
                            title: {
                              text: "Sales Units",
                            },
                            labels: {
                              formatter: function (val) {
                                return val.toLocaleString();
                              },
                            },
                          },
                          legend: {
                            position: "top",
                            horizontalAlign: "right",
                          },
                          grid: {
                            borderColor: "#e7e7e7",
                            strokeDashArray: 3,
                          },
                          tooltip: {
                            theme: "light",
                            y: {
                              formatter: function (val) {
                                return val.toLocaleString() + " units";
                              },
                            },
                          },
                        }}
                        series={comparisonChartData.series}
                        type="line"
                        height={300}
                      />
                    </div>
                  </div>
                </div>

                {/* Total Sales Comparison */}
                <div className="col-lg-6 col-xl-6">
                  <div className="card h-100">
                    <div className="card-header border-bottom bg-base py-12 px-16">
                      <h6 className="text-md fw-semibold mb-0">
                        Total Sales Comparison
                      </h6>
                    </div>
                    <div className="card-body p-16">
                      <ReactApexChart
                        options={{
                          chart: {
                            type: "bar",
                            height: 300,
                            toolbar: { show: false },
                          },
                          plotOptions: {
                            bar: {
                              horizontal: false,
                              columnWidth: "55%",
                              borderRadius: 4,
                            },
                          },
                          dataLabels: {
                            enabled: true,
                            formatter: function (val) {
                              return val.toLocaleString();
                            },
                          },
                          colors: comparisonChartData.series.map(
                            (s) => s.color
                          ),
                          xaxis: {
                            categories: storeComparisonData.map(
                              (s) => s.storeName
                            ),
                            labels: {
                              style: {
                                fontSize: "12px",
                              },
                            },
                          },
                          yaxis: {
                            title: {
                              text: "Sales Units",
                            },
                            labels: {
                              formatter: function (val) {
                                return val.toLocaleString();
                              },
                            },
                          },
                          grid: {
                            borderColor: "#e7e7e7",
                            strokeDashArray: 3,
                          },
                          tooltip: {
                            theme: "light",
                            y: {
                              formatter: function (val) {
                                return val.toLocaleString() + " units";
                              },
                            },
                          },
                        }}
                        series={[
                          {
                            name: "Total Sales",
                            data: storeComparisonData.map((s) => s.totalSales),
                          },
                        ]}
                        type="bar"
                        height={300}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Comparison Table */}
              <div className="row gy-2">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header border-bottom bg-base py-12 px-16">
                      <h6 className="text-md fw-semibold mb-0">
                        Detailed Store Comparison
                      </h6>
                    </div>
                    <div className="card-body p-16">
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Store Name</th>
                              <th className="text-end">Total Sales</th>
                              <th>Top Category</th>
                              <th>Top Product</th>
                              <th className="text-end">Performance %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {storeComparisonData
                              .sort((a, b) => b.totalSales - a.totalSales)
                              .map((store, index) => {
                                const maxSales = Math.max(
                                  ...storeComparisonData.map(
                                    (s) => s.totalSales
                                  )
                                );
                                const performance =
                                  (store.totalSales / maxSales) * 100;
                                return (
                                  <tr key={store.storeName}>
                                    <td>
                                      <div className="d-flex align-items-center gap-2">
                                        <div
                                          style={{
                                            width: "12px",
                                            height: "12px",
                                            backgroundColor:
                                              storeColors[
                                                index % storeColors.length
                                              ],
                                            borderRadius: "50%",
                                          }}
                                        ></div>
                                        <span className="fw-semibold">
                                          {store.storeName}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="text-end fw-bold">
                                      {store.totalSales.toLocaleString()}
                                    </td>
                                    <td>
                                      <span className="badge bg-info">
                                        {store.topCategory}
                                      </span>
                                    </td>
                                    <td>
                                      <span className="badge bg-success">
                                        {store.topProduct}
                                      </span>
                                    </td>
                                    <td className="text-end">
                                      <div className="d-flex align-items-center justify-content-end gap-2">
                                        <div
                                          className="progress"
                                          style={{
                                            width: "100px",
                                            height: "8px",
                                          }}
                                        >
                                          <div
                                            className="progress-bar"
                                            role="progressbar"
                                            style={{
                                              width: `${performance}%`,
                                              backgroundColor:
                                                storeColors[
                                                  index % storeColors.length
                                                ],
                                            }}
                                          ></div>
                                        </div>
                                        <span className="fw-semibold">
                                          {performance.toFixed(1)}%
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {selectedStoreSlugs.length === 0 && !isLoading && (
        <div className="card">
          <div className="card-body p-24 text-center">
            <Icon
              icon="solar:shop-2-bold"
              className="text-4xl text-primary-light mb-3"
            />
            <h6 className="fw-semibold mb-2">No Stores Selected</h6>
            <p className="text-primary-light mb-0">
              Please select at least one store from above to view comparison
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default StoreComparison;
