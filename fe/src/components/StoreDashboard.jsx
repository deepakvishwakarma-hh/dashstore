"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useStoreDashboard } from "@/hook/useStoreDashboard";
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const StoreDashboard = ({ storeName }) => {
  const [filterType, setFilterType] = useState("yearly");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

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

    return params;
  }, [filterType, selectedYear, selectedMonth, customFromDate, customToDate]);

  const isCustomRangeIncomplete =
    filterType === "custom" && (!customFromDate || !customToDate);

  const {
    data: dashboardData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useStoreDashboard(storeName, queryParams, {
    enabled: !isCustomRangeIncomplete && !!storeName,
  });

  const resolvedFilterYear = dashboardData?.filter?.year;
  useEffect(() => {
    if (
      typeof resolvedFilterYear === "number" &&
      resolvedFilterYear.toString() !== selectedYear
    ) {
      setSelectedYear(resolvedFilterYear.toString());
    }
  }, [resolvedFilterYear, selectedYear]);

  const resolvedFilterMonth = dashboardData?.filter?.month;
  useEffect(() => {
    if (
      filterType === "monthly" &&
      typeof resolvedFilterMonth === "number" &&
      resolvedFilterMonth.toString() !== selectedMonth
    ) {
      setSelectedMonth(resolvedFilterMonth.toString());
    }
  }, [filterType, resolvedFilterMonth, selectedMonth]);

  const metadata = dashboardData?.metadata ?? {};
  const availableYears = metadata.availableYears ?? [];
  const availableMonthsByYear = metadata.availableMonthsByYear ?? {};
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

  const totals = dashboardData?.totals ?? {};
  const highlights = dashboardData?.highlights ?? {};
  const charts = dashboardData?.charts ?? {};
  const storeInfo = dashboardData?.store ?? {};

  const stats = useMemo(
    () => ({
      totalQuantity: totals.totalQuantity ?? 0,
      topCategories: highlights.topCategories ?? [],
      topProducts: highlights.topProducts ?? [],
    }),
    [totals, highlights]
  );

  const salesStatsData = useMemo(() => {
    if (!charts.salesStats) {
      return {
        dates: [],
        values: [],
        series: [],
        isMultipleSeries: false,
      };
    }

    const labels = charts.salesStats.labels ?? [];
    const series = charts.salesStats.series ?? [];
    const isMultipleSeries =
      charts.salesStats.isMultipleSeries ?? series.length > 1;

    return {
      dates: labels,
      values:
        !isMultipleSeries && series.length > 0 ? series[0].data ?? [] : [],
      series,
      isMultipleSeries,
    };
  }, [charts.salesStats]);

  const categoryDistribution = useMemo(() => {
    if (!charts.categoryDistribution) {
      return {
        categories: [],
        values: [],
      };
    }

    return {
      categories: charts.categoryDistribution.labels ?? [],
      values: charts.categoryDistribution.values ?? [],
    };
  }, [charts.categoryDistribution]);

  const productDistribution = useMemo(() => {
    if (!charts.productDistribution) {
      return {
        products: [],
        values: [],
      };
    }

    return {
      products: charts.productDistribution.labels ?? [],
      values: charts.productDistribution.values ?? [],
    };
  }, [charts.productDistribution]);

  const topProductsBySales = charts.topProducts ?? [];
  const monthlySalesData = charts.monthlySales ?? { months: [], sales: [] };

  const currentTarget = totals.currentTarget ?? 0;
  const targetProgress = Math.min(Math.max(totals.targetProgress ?? 0, 0), 100);
  const remainingTarget =
    totals.remainingTarget ?? Math.max(currentTarget - stats.totalQuantity, 0);
  const todaySales = totals.todaySales ?? 0;
  const percentageChange = totals.percentageChange ?? 0;
  const previousPeriodSales = totals.previousPeriodSales ?? 0;

  const isInitialLoading = isLoading && !dashboardData;
  const errorMessage =
    error?.response?.data?.error?.message ||
    error?.response?.data?.error ||
    error?.message ||
    null;

  const displayStoreName = storeInfo.name || storeName;

  // Chart options
  const salesStatsChartOptions = useMemo(
    () => ({
      chart: {
        type:
          filterType === "yearly" || filterType === "monthly" ? "line" : "area",
        height: 300,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      dataLabels: { enabled: false },
      markers: {
        size: filterType === "yearly" || filterType === "monthly" ? 4 : 0,
        hover: {
          size: 6,
        },
      },
      stroke: {
        curve: "smooth",
        width: 3,
        colors:
          filterType === "yearly" || filterType === "monthly"
            ? undefined
            : ["#487FFF"],
      },
      fill:
        filterType === "yearly" || filterType === "monthly"
          ? {
              type: "solid",
              opacity: 0.05,
            }
          : {
              type: "gradient",
              gradient: {
                shadeIntensity: 1,
                inverseColors: false,
                opacityFrom: 0.3,
                opacityTo: 0.1,
                stops: [0, 90, 100],
              },
            },
      xaxis: {
        categories: salesStatsData.dates,
        title: {
          text:
            filterType === "yearly"
              ? "Month"
              : filterType === "monthly"
              ? "Week"
              : "Date",
        },
      },
      yaxis: { title: { text: "Sales" } },
      colors:
        filterType === "yearly" || filterType === "monthly"
          ? [
              "#487FFF",
              "#10B981",
              "#F59E0B",
              "#EF4444",
              "#8B5CF6",
              "#EC4899",
              "#06B6D4",
              "#84CC16",
              "#F97316",
              "#6366F1",
              "#14B8A6",
              "#A855F7",
            ]
          : ["#487FFF"],
      grid: {
        borderColor: "#e7e7e7",
        strokeDashArray: 3,
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      tooltip: { theme: "light" },
      legend: {
        show: filterType === "yearly" || filterType === "monthly",
        position: "top",
        horizontalAlign: "right",
      },
    }),
    [salesStatsData.dates, filterType]
  );

  const salesStatsChartSeries = useMemo(() => {
    if (salesStatsData.series && salesStatsData.series.length > 0) {
      return salesStatsData.series;
    }
    return [
      {
        name: "Sales",
        data: salesStatsData.values || [],
      },
    ];
  }, [salesStatsData]);

  const categoryPieChartOptions = {
    chart: { type: "donut", height: 300 },
    labels: categoryDistribution.categories,
    colors: ["#487FFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"],
    legend: { position: "bottom" },
    tooltip: { theme: "light" },
  };

  const categoryPieChartSeries = categoryDistribution.values;

  const productPieChartOptions = {
    chart: { type: "donut", height: 350 },
    labels: productDistribution.products,
    colors: [
      "#487FFF",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#84CC16",
      "#F97316",
      "#A855F7",
    ],
    legend: { position: "bottom" },
    tooltip: { theme: "light" },
  };

  const productPieChartSeries = productDistribution.values;

  const topProductsBarChartOptions = {
    chart: {
      type: "bar",
      height: 350,
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
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: topProductsBySales.map((item) => item.product),
      labels: {
        rotate: -45,
        rotateAlways: true,
        style: {
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      title: {
        text: "Sales",
      },
    },
    fill: {
      opacity: 1,
      colors: ["#487FFF"],
    },
    colors: ["#487FFF"],
    grid: {
      borderColor: "#e7e7e7",
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: function (val) {
          return val.toLocaleString() + " units";
        },
      },
    },
  };

  const topProductsBarChartSeries = [
    {
      name: "Sales",
      data: topProductsBySales.map((item) => item.sales),
    },
  ];

  if (isInitialLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-primary-light">
            Loading store dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Failed to load dashboard data</h4>
        <p>
          {errorMessage ||
            "An error occurred while fetching store dashboard data."}
        </p>
        <hr />
        <button className="btn btn-danger" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Store Info Header */}
      <div className="card mb-4">
        <div className="card-body p-24">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div className="w-60-px h-60-px bg-primary rounded-circle d-flex justify-content-center align-items-center">
                <Icon
                  icon="solar:shop-2-bold"
                  className="text-white text-2xl"
                />
              </div>
              <div>
                <h4 className="fw-bold mb-1">{displayStoreName}</h4>
                <p className="text-primary-light mb-0">Store Dashboard</p>
              </div>
            </div>
            <Link href="/store-comparison">
              <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2">
                <Icon icon="solar:graph-up-bold" />
                Compare with Other Stores
              </button>
            </Link>
          </div>
        </div>
      </div>

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
                <option value="tomorrow">Tomorrow</option>
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
            <div className="col-md-2">
              <label className="form-label fw-semibold d-block">&nbsp;</label>
              <button
                className="btn btn-primary w-100"
                onClick={() => refetch()}
                disabled={isCustomRangeIncomplete || isFetching}
              >
                {isFetching ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Loading...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:filter-bold" className="me-2" />
                    Apply Filter
                  </>
                )}
              </button>
            </div>
          </div>
          {isCustomRangeIncomplete && (
            <div className="alert alert-warning mt-3 mb-0" role="alert">
              Please select both "From Date" and "To Date" for custom date
              range.
            </div>
          )}
        </div>
      </div>

      {/* Top Bar Statistics */}
      <br />
      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 gy-4">
        <div className="col">
          <div className="card shadow-none border bg-gradient-start-1 h-100">
            <div className="card-body p-20">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <p className="fw-medium text-primary-light mb-1">
                    Total Quantity Sold
                  </p>
                  <h6 className="mb-0">
                    {stats.totalQuantity.toLocaleString()}
                  </h6>
                </div>
                <div className="w-50-px h-50-px bg-cyan rounded-circle d-flex justify-content-center align-items-center">
                  <Icon
                    icon="solar:cart-large-4-bold"
                    className="text-white text-2xl mb-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-none border bg-gradient-start-3 h-100">
            <div className="card-body p-20">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <p className="fw-medium text-primary-light mb-1">
                    Top Category
                  </p>
                  <h6 className="mb-0">
                    {stats.topCategories[0]?.category || "N/A"}
                  </h6>
                  <p className="text-sm text-primary-light mb-0 mt-1">
                    {stats.topCategories[0]?.sales || 0} units
                  </p>
                </div>
                <div className="w-50-px h-50-px bg-info rounded-circle d-flex justify-content-center align-items-center">
                  <Icon
                    icon="solar:tag-bold"
                    className="text-white text-2xl mb-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-none border bg-gradient-start-4 h-100">
            <div className="card-body p-20">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <p className="fw-medium text-primary-light mb-1">
                    Top Product
                  </p>
                  <h6 className="mb-0">
                    {stats.topProducts[0]?.product || "N/A"}
                  </h6>
                  <p className="text-sm text-primary-light mb-0 mt-1">
                    {stats.topProducts[0]?.sales || 0} units
                  </p>
                </div>
                <div className="w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center">
                  <Icon
                    icon="solar:box-bold"
                    className="text-white text-2xl mb-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-none border bg-gradient-start-2 h-100">
            <div className="card-body p-20">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <p className="fw-medium text-primary-light mb-1">
                    Store Name
                  </p>
                  <h6 className="mb-0">{displayStoreName}</h6>
                </div>
                <div className="w-50-px h-50-px bg-purple rounded-circle d-flex justify-content-center align-items-center">
                  <Icon
                    icon="solar:shop-2-bold"
                    className="text-white text-2xl mb-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <br />

      {/* Sales Stats Overview and Category Distribution */}
      <div className="row gy-4 mb-4">
        <div className="col-xxl-8 col-xl-12">
          <div className="card h-100">
            <div className="card-header border-bottom bg-base py-16 px-24">
              <h6 className="text-lg fw-semibold mb-0">Sales Stats Overview</h6>
              {filterType === "yearly" && (
                <p className="text-sm text-primary-light mb-0 mt-1">
                  Showing all years with monthly breakdown
                </p>
              )}
              {filterType === "monthly" && selectedYear && (
                <p className="text-sm text-primary-light mb-0 mt-1">
                  Showing all months with weekly breakdown for {selectedYear}
                </p>
              )}
            </div>
            <div className="card-body p-24">
              <ReactApexChart
                options={salesStatsChartOptions}
                series={salesStatsChartSeries}
                type={salesStatsChartOptions.chart.type}
                height={300}
              />
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-xl-12">
          <div className="card h-100">
            <div className="card-header border-bottom bg-base py-16 px-24">
              <h6 className="text-lg fw-semibold mb-0">
                Category Distribution
              </h6>
            </div>
            <div className="card-body p-24">
              <ReactApexChart
                options={categoryPieChartOptions}
                series={categoryPieChartSeries}
                type="donut"
                height={300}
              />
            </div>
          </div>
        </div>
      </div>

      <br />

      {/* Top Products by Sales and Product Distribution */}
      <div className="row gy-4 mb-4">
        <div className="col-xxl-8 col-xl-12">
          <div className="card h-100">
            <div className="card-header border-bottom bg-base py-16 px-24">
              <h6 className="text-lg fw-semibold mb-0">
                Top Products by Sales
              </h6>
            </div>
            <div className="card-body p-24">
              <ReactApexChart
                options={topProductsBarChartOptions}
                series={topProductsBarChartSeries}
                type="bar"
                height={350}
              />
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-xl-12">
          <div className="card h-100">
            <div className="card-header border-bottom bg-base py-16 px-24">
              <h6 className="text-lg fw-semibold mb-0">Product Distribution</h6>
            </div>
            <div className="card-body p-24">
              <ReactApexChart
                options={productPieChartOptions}
                series={productPieChartSeries}
                type="donut"
                height={350}
              />
            </div>
          </div>
        </div>
      </div>

      <br />

      {/* Targets Analysis */}
      <div className="row gy-4 mb-4">
        {/* Left Side - Monthly Target with Semi-Circular Gauge */}
        <div className="col-lg-4 col-xl-3">
          <div className="card h-100">
            <div className="card-header border-bottom bg-base py-16 px-24">
              <div>
                <h6 className="text-lg fw-semibold mb-1">
                  {filterType === "yearly" ? "Yearly" : "Monthly"} Target
                </h6>
                <p className="text-sm text-primary-light mb-0">
                  Target you've set for each{" "}
                  {filterType === "yearly" ? "year" : "month"}
                </p>
              </div>
            </div>
            <div className="card-body p-24">
              <div className="d-flex flex-column align-items-center">
                {/* Semi-Circular Gauge Chart */}
                <div
                  className="position-relative mb-4"
                  style={{ width: "100%", maxWidth: "300px" }}
                >
                  <ReactApexChart
                    options={{
                      chart: {
                        type: "radialBar",
                        height: 200,
                        toolbar: { show: false },
                      },
                      plotOptions: {
                        radialBar: {
                          startAngle: -90,
                          endAngle: 90,
                          hollow: {
                            margin: 0,
                            size: "70%",
                            background: "transparent",
                          },
                          track: {
                            background: "#E3E6E9",
                            strokeWidth: "100%",
                          },
                          dataLabels: {
                            show: true,
                            name: {
                              show: false,
                            },
                            value: {
                              offsetY: -10,
                              fontSize: "32px",
                              fontWeight: 700,
                              color: "#1F2937",
                              formatter: function (val) {
                                return val.toFixed(2) + "%";
                              },
                            },
                          },
                        },
                      },
                      fill: {
                        type: "gradient",
                        gradient: {
                          shade: "light",
                          type: "horizontal",
                          shadeIntensity: 0.5,
                          gradientToColors: ["#487FFF"],
                          inverseColors: false,
                          opacityFrom: 1,
                          opacityTo: 1,
                          stops: [0, 100],
                        },
                      },
                      colors: ["#487FFF"],
                      stroke: {
                        lineCap: "round",
                      },
                      labels: [""],
                    }}
                    series={[targetProgress]}
                    type="radialBar"
                    height={200}
                  />
                  {percentageChange > 0 && (
                    <div
                      className="position-absolute"
                      style={{ bottom: "20px", right: "20px" }}
                    >
                      <span className="badge bg-success">
                        +{percentageChange.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Summary Text */}
                <div className="text-center mb-4">
                  <p className="text-sm text-primary-light mb-0">
                    You sold{" "}
                    <span className="fw-bold text-primary">
                      {todaySales.toLocaleString()}
                    </span>{" "}
                    units today,{" "}
                    {percentageChange > 0 ? (
                      <span>
                        it's higher than last{" "}
                        {filterType === "yearly" ? "year" : "month"}. Keep up
                        your good trends!
                      </span>
                    ) : (
                      <span>
                        it's lower than last{" "}
                        {filterType === "yearly" ? "year" : "month"}. Let's
                        improve!
                      </span>
                    )}
                  </p>
                </div>

                {/* Three Metrics */}
                <div className="d-flex justify-content-between w-100 gap-3">
                  <div className="text-center flex-fill">
                    <p className="text-xs text-primary-light mb-1">Target</p>
                    <h6 className="fw-bold mb-1">
                      {(currentTarget / 1000).toFixed(0)}k
                    </h6>
                    <Icon
                      icon="bxs:down-arrow"
                      className="text-danger"
                      style={{ fontSize: "12px" }}
                    />
                  </div>
                  <div className="text-center flex-fill">
                    <p className="text-xs text-primary-light mb-1">Sales</p>
                    <h6 className="fw-bold mb-1 text-success">
                      {(stats.totalQuantity / 1000).toFixed(1)}k
                    </h6>
                    <Icon
                      icon="bxs:up-arrow"
                      className="text-success"
                      style={{ fontSize: "12px" }}
                    />
                  </div>
                  <div className="text-center flex-fill">
                    <p className="text-xs text-primary-light mb-1">Today</p>
                    <h6 className="fw-bold mb-1 text-primary">
                      {(todaySales / 1000).toFixed(1)}k
                    </h6>
                    <Icon
                      icon="bxs:up-arrow"
                      className="text-success"
                      style={{ fontSize: "12px" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Statistic Line Chart */}
        <div className="col-lg-8 col-xl-9">
          <div className="card h-100">
            <div className="card-header border-bottom bg-base py-16 px-24">
              <div>
                <h6 className="text-lg fw-semibold mb-1">Statistic</h6>
                <p className="text-sm text-primary-light mb-0">
                  Up and down of your store for each month
                </p>
              </div>
            </div>
            <div className="card-body p-24">
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
                  colors: ["#487FFF", "#F59E0B"],
                  xaxis: {
                    categories: monthlySalesData.months,
                    labels: {
                      style: {
                        fontSize: "12px",
                      },
                    },
                  },
                  yaxis: {
                    labels: {
                      formatter: function (val) {
                        return (val / 1000).toFixed(0) + "k";
                      },
                      style: {
                        fontSize: "12px",
                      },
                    },
                  },
                  legend: {
                    position: "top",
                    horizontalAlign: "right",
                    markers: {
                      width: 8,
                      height: 8,
                      radius: 4,
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
                    name: "Sales",
                    data: monthlySalesData.sales,
                  },
                  {
                    name: "Sales Statistics",
                    data: monthlySalesData.sales.map((val) => val * 0.7),
                  },
                ]}
                type="line"
                height={300}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StoreDashboard;
