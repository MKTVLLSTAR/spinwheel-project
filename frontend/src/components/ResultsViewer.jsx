import React, { useState, useEffect } from "react";
import {
  Eye,
  Calendar,
  Gift,
  User,
  Monitor,
  RefreshCw,
  Download,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  PieChart,
  AlertCircle,
} from "lucide-react";
import api from "../utils/api";

const ResultsViewer = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrize, setSelectedPrize] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    hasMore: false,
  });

  useEffect(() => {
    fetchResults();
    fetchStats();
  }, []);

  const fetchResults = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/admin/results?page=${page}&limit=50`);

      // Handle both old and new API response formats
      if (response.data.results) {
        setResults(response.data.results);
        setPagination(response.data.pagination);
      } else {
        setResults(response.data);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalResults: response.data.length,
          hasMore: false,
        });
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/results/stats");
      console.log("Stats from backend:", response.data); // Debug log
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const exportResults = () => {
    const csvContent = [
      ["Token Code", "Prize", "Date", "Time", "User Agent", "IP Address"],
      ...filteredResults.map((result) => [
        result.tokenCode,
        result.prize?.name || "ไม่ทราบ",
        new Date(result.createdAt).toLocaleDateString("th-TH"),
        new Date(result.createdAt).toLocaleTimeString("th-TH"),
        result.userAgent || "",
        result.ipAddress || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `spin_results_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.click();
  };

  const getDateFilteredResults = (results) => {
    const now = new Date();
    switch (dateFilter) {
      case "today":
        return results.filter((r) => {
          const resultDate = new Date(r.createdAt);
          return resultDate.toDateString() === now.toDateString();
        });
      case "week":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return results.filter((r) => new Date(r.createdAt) >= weekAgo);
      case "month":
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return results.filter((r) => new Date(r.createdAt) >= monthAgo);
      default:
        return results;
    }
  };

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.tokenCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (result.prize?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesPrize =
      selectedPrize === "all" || result.prize?._id === selectedPrize;
    return matchesSearch && matchesPrize;
  });

  const dateFilteredResults = getDateFilteredResults(filteredResults);

  const uniquePrizes = [
    ...new Set(results.map((r) => r.prize).filter(Boolean)),
  ];

  // Helper function to safely convert value to string
  const safeToString = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (typeof value === "object") {
      // If it's an object, try to get name property
      return value.name || "ไม่ทราบ";
    }
    return String(value);
  };

  // Fixed StatCard with bulletproof rendering
  const StatCard = ({ title, value, icon: Icon, color = "blue" }) => {
    const colorMap = {
      blue: "bg-gradient-to-r from-blue-500 to-blue-600",
      green: "bg-gradient-to-r from-green-500 to-green-600",
      purple: "bg-gradient-to-r from-purple-500 to-purple-600",
      orange: "bg-gradient-to-r from-orange-500 to-orange-600",
      red: "bg-gradient-to-r from-red-500 to-red-600",
      yellow: "bg-gradient-to-r from-yellow-500 to-yellow-600",
    };

    // Safe value processing
    const displayValue = safeToString(value);
    const truncatedValue =
      displayValue.length > 12
        ? displayValue.substring(0, 12) + "..."
        : displayValue;

    return (
      <div
        className={`${
          colorMap[color] || colorMap.blue
        } rounded-xl p-6 text-white shadow-lg`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">{title}</p>
            <p className="text-3xl font-bold" title={displayValue}>
              {truncatedValue}
            </p>
          </div>
          <Icon className="w-12 h-12 opacity-80" />
        </div>
      </div>
    );
  };

  const getUserAgent = (userAgent) => {
    if (!userAgent) return "ไม่ทราบ";
    if (userAgent.includes("Mobile")) return "📱 มือถือ";
    if (userAgent.includes("Chrome")) return "🌐 Chrome";
    if (userAgent.includes("Firefox")) return "🔥 Firefox";
    if (userAgent.includes("Safari")) return "🧭 Safari";
    return "💻 อื่นๆ";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">ผลการหมุนวงล้อ</h2>
            <p className="text-gray-600 mt-1">
              ดูข้อมูลและสถิติการหมุนวงล้อทั้งหมด
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => fetchResults()}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>รีเฟรช</span>
            </button>
            <button
              onClick={exportResults}
              disabled={dateFilteredResults.length === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                dateFilteredResults.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="จำนวนการหมุนทั้งหมด"
          value={stats.totalSpins || 0}
          icon={BarChart3}
          color="blue"
        />
        <StatCard
          title="โทเค็นที่ใช้งาน"
          value={stats.uniqueTokens || 0}
          icon={User}
          color="green"
        />
        <StatCard
          title="รางวัลยอดนิยม"
          value={stats.mostPopularPrize || "ไม่มีข้อมูล"}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="ผลลัพธ์ที่กรอง"
          value={dateFilteredResults.length}
          icon={Calendar}
          color="orange"
        />
      </div>

      {/* Prize Statistics */}
      {stats.prizeStats && Object.keys(stats.prizeStats).length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            สถิติรางวัล
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.prizeStats).map(([prize, count]) => (
              <div
                key={prize}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-gray-700 font-medium">{prize}</span>
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-bold">
                    {count}
                  </span>
                  <span className="text-gray-500 text-sm">
                    (
                    {stats.totalSpins
                      ? ((count / stats.totalSpins) * 100).toFixed(1)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ค้นหา
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาโทเค็นหรือรางวัล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              กรองตามรางวัล
            </label>
            <select
              value={selectedPrize}
              onChange={(e) => setSelectedPrize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">รางวัลทั้งหมด</option>
              {uniquePrizes.map((prize) => (
                <option key={prize._id} value={prize._id}>
                  {prize.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              กรองตามวันที่
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="today">วันนี้</option>
              <option value="week">7 วันที่แล้ว</option>
              <option value="month">30 วันที่แล้ว</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            ผลการหมุน ({dateFilteredResults.length} รายการ)
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : dateFilteredResults.length === 0 ? (
          <div className="p-8 text-center">
            <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">ไม่พบผลการหมุน</p>
            {(searchTerm ||
              selectedPrize !== "all" ||
              dateFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedPrize("all");
                  setDateFilter("all");
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    โทเค็น
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รางวัล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่/เวลา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    อุปกรณ์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dateFilteredResults.map((result, index) => (
                  <tr key={result._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm font-bold text-gray-900">
                        {result.tokenCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: result.prize?.color || "#3B82F6",
                          }}
                        >
                          <Gift className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {result.prize?.name || "ไม่ทราบ"}
                          </div>
                          {result.prize?.description && (
                            <div className="text-xs text-gray-500">
                              {result.prize.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <div>
                          <div>
                            {new Date(result.createdAt).toLocaleDateString(
                              "th-TH"
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(result.createdAt).toLocaleTimeString(
                              "th-TH"
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Monitor className="w-4 h-4" />
                        <span>{getUserAgent(result.userAgent)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {result.ipAddress || "ไม่ทราบ"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              แสดง {(pagination.currentPage - 1) * 50 + 1} -{" "}
              {Math.min(pagination.currentPage * 50, pagination.totalResults)}
              จาก {pagination.totalResults} รายการ
            </div>
            <div className="flex space-x-2">
              {pagination.currentPage > 1 && (
                <button
                  onClick={() => fetchResults(pagination.currentPage - 1)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  ก่อนหน้า
                </button>
              )}
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              {pagination.hasMore && (
                <button
                  onClick={() => fetchResults(pagination.currentPage + 1)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  ถัดไป
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {dateFilteredResults.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            สรุปข้อมูลที่แสดง
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {dateFilteredResults.length}
              </div>
              <div className="text-sm text-blue-800">ครั้งที่หมุน</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {new Set(dateFilteredResults.map((r) => r.tokenCode)).size}
              </div>
              <div className="text-sm text-green-800">โทเค็นที่ใช้</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {
                  new Set(
                    dateFilteredResults.map((r) => r.prize?._id).filter(Boolean)
                  ).size
                }
              </div>
              <div className="text-sm text-purple-800">รางวัลที่ได้</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsViewer;
