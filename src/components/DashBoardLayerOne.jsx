"use client";
import React, { useState, useMemo, useEffect } from "react";
import salesData from "@/data/sales.json";
import configData from "@/data/config.json";
import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const DashBoardLayerOne = () => {
  const [filterType, setFilterType] = useState("yearly");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  // Extract unique years and months from data
  const availableYears = useMemo(() => {
    const years = new Set();
    salesData.forEach((item) => {
      const year = new Date(item.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, []);

  const availableMonths = useMemo(() => {
    const months = new Set();
    salesData.forEach((item) => {
      const date = new Date(item.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      if (selectedYear && year === parseInt(selectedYear)) {
        months.add(month);
      } else if (!selectedYear) {
        months.add(month);
      }
    });
    return Array.from(months).sort((a, b) => a - b);
  }, [selectedYear]);

  // Set default year and month on mount
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

  // Date filtering logic
  const getFilteredData = () => {
    let startDate, endDate;

    switch (filterType) {
      case "yearly":
        if (selectedYear) {
          const year = parseInt(selectedYear);
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 11, 31, 23, 59, 59);
        } else {
          return salesData;
        }
        break;
      case "monthly":
        if (selectedYear && selectedMonth) {
          const year = parseInt(selectedYear);
          const month = parseInt(selectedMonth);
          startDate = new Date(year, month, 1);
          endDate = new Date(year, month + 1, 0, 23, 59, 59);
        } else {
          return salesData;
        }
        break;
      case "weekly":
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59);
        break;
      case "daily":
        const todayDaily = new Date();
        todayDaily.setHours(0, 0, 0, 0);
        startDate = new Date(todayDaily);
        endDate = new Date(todayDaily);
        endDate.setHours(23, 59, 59);
        break;
      case "tomorrow":
        const todayTomorrow = new Date();
        todayTomorrow.setHours(0, 0, 0, 0);
        startDate = new Date(todayTomorrow);
        startDate.setDate(todayTomorrow.getDate() + 1);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59);
        break;
      case "custom":
        if (customFromDate && customToDate) {
          startDate = new Date(customFromDate);
          endDate = new Date(customToDate);
          endDate.setHours(23, 59, 59);
        } else {
          return salesData;
        }
        break;
      default:
        return salesData;
    }

    return salesData.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const filteredData = useMemo(
    () => getFilteredData(),
    [filterType, selectedYear, selectedMonth, customFromDate, customToDate]
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const totalQuantity = filteredData.reduce(
      (sum, item) => sum + item.sale,
      0
    );
    const uniqueStores = new Set(filteredData.map((item) => item.storename))
      .size;

    // Top categories
    const categorySales = {};
    filteredData.forEach((item) => {
      categorySales[item.category] =
        (categorySales[item.category] || 0) + item.sale;
    });
    const topCategories = Object.entries(categorySales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, sales]) => ({ category, sales }));

    // Top products
    const productSales = {};
    filteredData.forEach((item) => {
      productSales[item.product] =
        (productSales[item.product] || 0) + item.sale;
    });
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([product, sales]) => ({ product, sales }));

    return {
      totalQuantity,
      totalStores: uniqueStores,
      topCategories,
      topProducts,
    };
  }, [filteredData]);

  // Sales stats overview data (daily/weekly/monthly breakdown)
  const salesStatsData = useMemo(() => {
    const dateGroups = {};

    filteredData.forEach((item) => {
      const date = item.date;
      if (!dateGroups[date]) {
        dateGroups[date] = 0;
      }
      dateGroups[date] += item.sale;
    });

    const sortedDates = Object.keys(dateGroups).sort();
    return {
      dates: sortedDates,
      values: sortedDates.map((date) => dateGroups[date]),
    };
  }, [filteredData]);

  // Category distribution data
  const categoryDistribution = useMemo(() => {
    const categorySales = {};
    filteredData.forEach((item) => {
      categorySales[item.category] =
        (categorySales[item.category] || 0) + item.sale;
    });

    return {
      categories: Object.keys(categorySales),
      values: Object.values(categorySales),
    };
  }, [filteredData]);

  // Top products by sales
  const topProductsBySales = useMemo(() => {
    const productSales = {};
    filteredData.forEach((item) => {
      productSales[item.product] =
        (productSales[item.product] || 0) + item.sale;
    });

    return Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([product, sales]) => ({ product, sales }));
  }, [filteredData]);

  // Top categories by sales
  const topCategoriesBySales = useMemo(() => {
    const categorySales = {};
    filteredData.forEach((item) => {
      categorySales[item.category] =
        (categorySales[item.category] || 0) + item.sale;
    });

    return Object.entries(categorySales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, sales]) => ({ category, sales }));
  }, [filteredData]);

  // Top stores by sales (for chart)
  const topStoresBySales = useMemo(() => {
    const storeSales = {};
    filteredData.forEach((item) => {
      storeSales[item.storename] =
        (storeSales[item.storename] || 0) + item.sale;
    });

    return Object.entries(storeSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([storename, sales]) => ({ storename, sales }));
  }, [filteredData]);

  // Top stores performance
  const topStores = useMemo(() => {
    const storeSales = {};
    filteredData.forEach((item) => {
      if (!storeSales[item.storename]) {
        storeSales[item.storename] = {
          totalSales: 0,
          categories: {},
          products: {},
        };
      }
      storeSales[item.storename].totalSales += item.sale;
      storeSales[item.storename].categories[item.category] =
        (storeSales[item.storename].categories[item.category] || 0) + item.sale;
      storeSales[item.storename].products[item.product] =
        (storeSales[item.storename].products[item.product] || 0) + item.sale;
    });

    return Object.entries(storeSales)
      .map(([storename, data]) => ({
        storename,
        totalSales: data.totalSales,
        topCategory:
          Object.entries(data.categories).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "N/A",
        topProduct:
          Object.entries(data.products).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "N/A",
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);
  }, [filteredData]);

  // Chart options
  const salesStatsChartOptions = {
    chart: {
      type: "area",
      height: 300,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3, colors: ["#487FFF"] },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.3,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    xaxis: { categories: salesStatsData.dates },
    yaxis: { title: { text: "Sales" } },
    colors: ["#487FFF"],
    tooltip: { theme: "light" },
  };

  const salesStatsChartSeries = [
    {
      name: "Sales",
      data: salesStatsData.values,
    },
  ];

  const categoryPieChartOptions = {
    chart: { type: "donut", height: 300 },
    labels: categoryDistribution.categories,
    colors: ["#487FFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"],
    legend: { position: "bottom" },
    tooltip: { theme: "light" },
  };

  const categoryPieChartSeries = categoryDistribution.values;

  // Top Products Bar Chart
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

  // Top Stores Horizontal Bar Chart
  const topStoresBarChartOptions = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "70%",
        borderRadius: 8,
        dataLabels: {
          position: "right",
        },
      },
    },
    dataLabels: {
      enabled: true,
      textAnchor: "start",
      style: {
        colors: ["#fff"],
        fontSize: "12px",
        fontWeight: 600,
      },
      formatter: function (val) {
        return val.toLocaleString();
      },
      offsetX: 0,
      dropShadow: {
        enabled: false,
      },
    },
    colors: ["#10B981"],
    xaxis: {
      categories: topStoresBySales.map((item) => item.storename),
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: 600,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: 600,
        },
      },
    },
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
          show: false,
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
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.4,
        gradientToColors: ["#059669"],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.8,
        stops: [0, 100],
      },
    },
  };

  const topStoresBarChartSeries = [
    {
      name: "Sales",
      data: topStoresBySales.map((item) => item.sales),
    },
  ];

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
                      setSelectedMonth(""); // Reset month when year changes
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
                onClick={() => {
                  // Force re-render by updating state
                  setFilterType(filterType);
                }}
              >
                <Icon icon="solar:filter-bold" className="me-2" />
                Apply Filter
              </button>
            </div>
          </div>
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
          <div className="card shadow-none border bg-gradient-start-2 h-100">
            <div className="card-body p-20">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <p className="fw-medium text-primary-light mb-1">
                    Total Stores
                  </p>
                  <h6 className="mb-0">{stats.totalStores}</h6>
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
      </div>
      <br />

      {/* Sales Stats Overview and Category Distribution */}
      <div className="row gy-4 mb-4">
        <div className="col-xxl-6 col-xl-12">
          <div className="card h-100">
            <div className="card-header border-bottom bg-base py-16 px-24">
              <h6 className="text-lg fw-semibold mb-0">Sales Stats Overview</h6>
            </div>
            <div className="card-body p-24">
              <ReactApexChart
                options={salesStatsChartOptions}
                series={salesStatsChartSeries}
                type="area"
                height={300}
              />
            </div>
          </div>
        </div>

        <div className="col-xxl-6 col-xl-12">
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

      {/* Top Products by Sales and Top Categories by Sales */}
      <div className="row gy-4 mb-4">
        <div className="col-xxl-6 col-xl-12">
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

        <div className="col-xxl-6 col-xl-12">
          <div className="card h-100">
            <div className="card-header border-bottom bg-base py-16 px-24">
              <h6 className="text-lg fw-semibold mb-0">Top Stores by Sales</h6>
            </div>
            <div className="card-body p-24">
              <ReactApexChart
                options={topStoresBarChartOptions}
                series={topStoresBarChartSeries}
                type="bar"
                height={350}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Targets Analysis */}
      <div className="row gy-4 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header border-bottom bg-base py-16 px-24">
              <h6 className="text-lg fw-semibold mb-0">Targets Analysis</h6>
            </div>
            <div className="card-body p-24">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="card border bg-base">
                    <div className="card-body">
                      <h6 className="text-sm text-primary-light mb-2">
                        Monthly Target
                      </h6>
                      <h4 className="fw-bold mb-2">50,000</h4>
                      <div className="progress" style={{ height: "8px" }}>
                        <div
                          className="progress-bar bg-primary"
                          role="progressbar"
                          style={{
                            width: `${Math.min(
                              (stats.totalQuantity / 50000) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-primary-light mt-2 mb-0">
                        {((stats.totalQuantity / 50000) * 100).toFixed(1)}%
                        achieved
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border bg-base">
                    <div className="card-body">
                      <h6 className="text-sm text-primary-light mb-2">
                        Weekly Target
                      </h6>
                      <h4 className="fw-bold mb-2">12,500</h4>
                      <div className="progress" style={{ height: "8px" }}>
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{
                            width: `${Math.min(
                              (stats.totalQuantity / 12500) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-primary-light mt-2 mb-0">
                        {((stats.totalQuantity / 12500) * 100).toFixed(1)}%
                        achieved
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border bg-base">
                    <div className="card-body">
                      <h6 className="text-sm text-primary-light mb-2">
                        Daily Target
                      </h6>
                      <h4 className="fw-bold mb-2">1,800</h4>
                      <div className="progress" style={{ height: "8px" }}>
                        <div
                          className="progress-bar bg-warning"
                          role="progressbar"
                          style={{
                            width: `${Math.min(
                              (stats.totalQuantity / 1800) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-primary-light mt-2 mb-0">
                        {((stats.totalQuantity / 1800) * 100).toFixed(1)}%
                        achieved
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Stores Performance */}
      <div className="row gy-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header border-bottom bg-base py-16 px-24">
              <h6 className="text-lg fw-semibold mb-0">
                Top Stores Performance
              </h6>
            </div>
            <div className="card-body p-24">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Store Name</th>
                      <th className="text-end">Total Sales</th>
                      <th>Top Category</th>
                      <th>Top Product</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topStores.map((store, index) => (
                      <tr key={store.storename}>
                        <td>
                          <span className="badge bg-primary">{index + 1}</span>
                        </td>
                        <td className="fw-semibold">{store.storename}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashBoardLayerOne;
