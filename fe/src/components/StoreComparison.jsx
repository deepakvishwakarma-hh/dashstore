"use client";
import React, { useState, useMemo, useEffect } from "react";
import salesData from "@/data/sales.json";
import configData from "@/data/config.json";
import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const StoreComparison = () => {
  const [filterType, setFilterType] = useState("yearly");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const [selectedStores, setSelectedStores] = useState([]);

  // Extract unique years and months from data
  const availableYears = useMemo(() => {
    const years = new Set();
    salesData.forEach((item) => {
      const year = new Date(item.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
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

  // Get all available stores
  const availableStores = useMemo(() => {
    const stores = new Set();
    salesData.forEach((item) => {
      stores.add(item.storename);
    });
    return Array.from(stores).sort();
  }, []);

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

  // Set default stores (top 3) on mount
  useEffect(() => {
    if (availableStores.length > 0 && selectedStores.length === 0) {
      // Get top 3 stores by total sales
      const storeSales = {};
      salesData.forEach((item) => {
        storeSales[item.storename] =
          (storeSales[item.storename] || 0) + item.sale;
      });
      const topStores = Object.entries(storeSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([store]) => store);
      setSelectedStores(topStores);
    }
  }, [availableStores, selectedStores.length]);

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
      case "yesterday":
        const todayYesterday = new Date();
        todayYesterday.setHours(0, 0, 0, 0);
        startDate = new Date(todayYesterday);
        startDate.setDate(todayYesterday.getDate() - 1);
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

  // Store comparison data
  const storeComparisonData = useMemo(() => {
    if (selectedStores.length === 0) return [];

    return selectedStores.map((storeName) => {
      const storeData = filteredData.filter(
        (item) => item.storename === storeName
      );

      const totalSales = storeData.reduce((sum, item) => sum + item.sale, 0);

      // Category breakdown
      const categorySales = {};
      storeData.forEach((item) => {
        categorySales[item.category] =
          (categorySales[item.category] || 0) + item.sale;
      });
      const topCategory =
        Object.entries(categorySales).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "N/A";

      // Product breakdown
      const productSales = {};
      storeData.forEach((item) => {
        productSales[item.product] =
          (productSales[item.product] || 0) + item.sale;
      });
      const topProduct =
        Object.entries(productSales).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "N/A";

      // Monthly sales data
      const monthlyData = {};
      storeData.forEach((item) => {
        const date = new Date(item.date);
        const monthKey = date.toLocaleString("default", { month: "short" });
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + item.sale;
      });

      return {
        storeName,
        totalSales,
        topCategory,
        topProduct,
        categorySales,
        productSales,
        monthlyData,
      };
    });
  }, [filteredData, selectedStores]);

  // Colors for stores
  const storeColors = [
    "#487FFF",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  // Comparison chart data
  const comparisonChartData = useMemo(() => {
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
    const allMonths = new Set();

    storeComparisonData.forEach((store) => {
      Object.keys(store.monthlyData).forEach((month) => allMonths.add(month));
    });

    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      return monthNames.indexOf(a) - monthNames.indexOf(b);
    });

    return {
      months: sortedMonths,
      series: storeComparisonData.map((store, index) => ({
        name: store.storeName,
        data: sortedMonths.map((month) => store.monthlyData[month] || 0),
        color: storeColors[index % storeColors.length],
      })),
    };
  }, [storeComparisonData]);

  const handleStoreToggle = (storeName) => {
    setSelectedStores((prev) => {
      if (prev.includes(storeName)) {
        return prev.filter((s) => s !== storeName);
      } else {
        return [...prev, storeName];
      }
    });
  };

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
          <div className="row g-2">
            {availableStores.map((store) => (
              <div key={store} className="col-lg-2 col-md-2 col-sm-3 col-4">
                <div
                  className={`card border cursor-pointer ${
                    selectedStores.includes(store) ? "border-primary" : ""
                  }`}
                  onClick={() => handleStoreToggle(store)}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.3s",
                    backgroundColor: selectedStores.includes(store)
                      ? "#E8F0FE"
                      : "",
                  }}
                >
                  <div className="card-body p-12 text-center">
                    <Icon
                      icon="solar:shop-2-bold"
                      className="text-lg mb-1"
                      style={{
                        color: selectedStores.includes(store) ? "#487FFF" : "",
                      }}
                    />
                    <p
                      className="mb-0 fw-semibold text-sm"
                      style={{
                        fontSize: "12px",
                        color: selectedStores.includes(store) ? "#487FFF" : "",
                      }}
                    >
                      {store}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedStores.length > 0 && (
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
                      <span className="badge bg-info">{store.topCategory}</span>
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
                      colors: comparisonChartData.series.map((s) => s.color),
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
                      colors: comparisonChartData.series.map((s) => s.color),
                      xaxis: {
                        categories: storeComparisonData.map((s) => s.storeName),
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
                              ...storeComparisonData.map((s) => s.totalSales)
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
                                      style={{ width: "100px", height: "8px" }}
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

      {selectedStores.length === 0 && (
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
