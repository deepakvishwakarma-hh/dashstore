"use client";
import React, { useState, useMemo, useEffect } from "react";
import salesData from "@/data/sales.json";
import configData from "@/data/config.json";
import { Icon } from "@iconify/react";
import Link from "next/link";
import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const StoreDashboard = ({ storeName }) => {
  const [filterType, setFilterType] = useState("yearly");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  // Extract unique years and months from data (filtered by store)
  const availableYears = useMemo(() => {
    const years = new Set();
    salesData
      .filter((item) => item.storename === storeName)
      .forEach((item) => {
        const year = new Date(item.date).getFullYear();
        years.add(year);
      });
    return Array.from(years).sort((a, b) => b - a);
  }, [storeName]);

  const availableMonths = useMemo(() => {
    const months = new Set();
    salesData
      .filter((item) => item.storename === storeName)
      .forEach((item) => {
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
  }, [storeName, selectedYear]);

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
          return salesData.filter((item) => item.storename === storeName);
        }
        break;
      case "monthly":
        if (selectedYear && selectedMonth) {
          const year = parseInt(selectedYear);
          const month = parseInt(selectedMonth);
          startDate = new Date(year, month, 1);
          endDate = new Date(year, month + 1, 0, 23, 59, 59);
        } else {
          return salesData.filter((item) => item.storename === storeName);
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
          return salesData.filter((item) => item.storename === storeName);
        }
        break;
      default:
        return salesData.filter((item) => item.storename === storeName);
    }

    return salesData.filter((item) => {
      const itemDate = new Date(item.date);
      return (
        item.storename === storeName &&
        itemDate >= startDate &&
        itemDate <= endDate
      );
    });
  };

  const filteredData = useMemo(
    () => getFilteredData(),
    [
      storeName,
      filterType,
      selectedYear,
      selectedMonth,
      customFromDate,
      customToDate,
    ]
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const totalQuantity = filteredData.reduce(
      (sum, item) => sum + item.sale,
      0
    );

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
      topCategories,
      topProducts,
    };
  }, [filteredData]);

  // Sales stats overview data
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

  // Top stores by sales (for chart) - will show this store's performance over time
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

  // Calculate dynamic target
  const currentTarget = useMemo(() => {
    if (filteredData.length === 0 || stats.totalQuantity === 0) return 0;

    const multiplier = 1.8;
    const calculatedTarget = Math.ceil(stats.totalQuantity * multiplier);
    const roundedTarget = Math.max(
      1000,
      Math.ceil(calculatedTarget / 1000) * 1000
    );

    return roundedTarget;
  }, [filteredData, stats.totalQuantity]);

  // Calculate target progress
  const targetProgress = useMemo(() => {
    if (currentTarget === 0) return 0;
    return Math.min((stats.totalQuantity / currentTarget) * 100, 100);
  }, [stats.totalQuantity, currentTarget]);

  // Calculate remaining target
  const remainingTarget = useMemo(() => {
    return Math.max(currentTarget - stats.totalQuantity, 0);
  }, [currentTarget, stats.totalQuantity]);

  // Calculate today's sales
  const todaySales = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    return filteredData
      .filter((item) => item.date === todayStr)
      .reduce((sum, item) => sum + item.sale, 0);
  }, [filteredData]);

  // Calculate previous period sales for comparison
  const previousPeriodSales = useMemo(() => {
    let startDate, endDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filterType === "yearly" && selectedYear) {
      const year = parseInt(selectedYear);
      startDate = new Date(year - 1, 0, 1);
      endDate = new Date(year - 1, 11, 31, 23, 59, 59);
    } else if (filterType === "monthly" && selectedYear && selectedMonth) {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      return 0;
    }

    return salesData
      .filter((item) => {
        const itemDate = new Date(item.date);
        return (
          item.storename === storeName &&
          itemDate >= startDate &&
          itemDate <= endDate
        );
      })
      .reduce((sum, item) => sum + item.sale, 0);
  }, [storeName, filterType, selectedYear, selectedMonth]);

  // Calculate percentage change
  const percentageChange = useMemo(() => {
    if (previousPeriodSales === 0) return 0;
    return (
      ((stats.totalQuantity - previousPeriodSales) / previousPeriodSales) * 100
    );
  }, [stats.totalQuantity, previousPeriodSales]);

  // Monthly sales data for line chart
  const monthlySalesData = useMemo(() => {
    const monthlyData = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    filteredData.forEach((item) => {
      const date = new Date(item.date);
      const monthKey = `${monthNames[date.getMonth()]}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += item.sale;
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      return monthNames.indexOf(a) - monthNames.indexOf(b);
    });

    return {
      months: sortedMonths,
      sales: sortedMonths.map((month) => monthlyData[month] || 0),
    };
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

  // Top Stores Horizontal Bar Chart (showing this store's performance)
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
                <h4 className="fw-bold mb-1">{storeName}</h4>
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
                  <h6 className="mb-0">{storeName}</h6>
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

      {/* Top Products by Sales and Top Stores by Sales */}
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
              <h6 className="text-lg fw-semibold mb-0">Store Performance</h6>
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
