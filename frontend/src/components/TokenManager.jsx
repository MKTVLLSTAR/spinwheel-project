import React, { useState, useEffect } from "react";
import {
  Plus,
  Download,
  Copy,
  Check,
  Calendar,
  User,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  History,
  BarChart3,
  Clock,
  Shield,
  X,
  CheckCircle,
} from "lucide-react";
import api from "../utils/api";

const TokenManager = ({ onStatsUpdate }) => {
  const [activeTab, setActiveTab] = useState("active");
  const [tokens, setTokens] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [copiedToken, setCopiedToken] = useState("");
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({});

  useEffect(() => {
    if (activeTab === "active") {
      fetchTokens();
    } else if (activeTab === "history") {
      fetchHistory();
    }
    fetchStats();
  }, [activeTab, historyPage]);

  const fetchTokens = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/tokens");
      setTokens(response.data);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(
        `/tokens/history?page=${historyPage}&limit=50`
      );
      setHistory(response.data.tokens);
      setHistoryPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching token history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/tokens/stats");
      setStats(response.data);
      onStatsUpdate?.();
    } catch (error) {
      console.error("Error fetching token stats:", error);
    }
  };

  const createTokens = async () => {
    setIsCreating(true);
    try {
      await api.post("/tokens/create", { quantity });
      await fetchTokens();
      await fetchStats();
      setQuantity(10);
      alert(`สร้างโทเค็น ${quantity} ตัวเรียบร้อยแล้ว!`);
    } catch (error) {
      alert(
        "เกิดข้อผิดพลาดในการสร้างโทเค็น: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setIsCreating(false);
    }
  };

  const deleteToken = async (tokenId, tokenCode) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบโทเค็น "${tokenCode}"?`)) return;

    try {
      await api.delete(`/tokens/${tokenId}`);
      await fetchTokens();
      await fetchStats();
      alert("ลบโทเค็นเรียบร้อยแล้ว!");
    } catch (error) {
      alert(
        "เกิดข้อผิดพลาดในการลบโทเค็น: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const bulkDelete = async (type) => {
    const typeNames = {
      expired: "หมดอายุ",
      used: "ใช้แล้ว",
      "all-unused": "ไม่ได้ใช้ทั้งหมด",
    };

    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบโทเค็น${typeNames[type]}ทั้งหมด?`))
      return;

    try {
      const response = await api.delete(`/tokens/bulk/${type}`);
      await fetchTokens();
      await fetchStats();
      alert(`ลบโทเค็น ${response.data.deletedCount} ตัวเรียบร้อยแล้ว!`);
    } catch (error) {
      alert(
        "เกิดข้อผิดพลาดในการลบโทเค็น: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const cleanupExpired = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบโทเค็นหมดอายุทั้งหมด?")) return;

    try {
      const response = await api.delete("/tokens/cleanup-expired");
      await fetchTokens();
      await fetchStats();
      alert(
        `ล้างโทเค็นหมดอายุ ${response.data.deletedCount} ตัวเรียบร้อยแล้ว!`
      );
    } catch (error) {
      alert(
        "เกิดข้อผิดพลาด: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(text);
      setTimeout(() => setCopiedToken(""), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const exportTokens = (data, filename) => {
    const csvContent = [
      [
        "Token Code",
        "Status",
        "Created Date",
        "Expires Date",
        "Used Date",
        "Created By",
        "User Agent",
        "IP Address",
      ],
      ...data.map((token) => [
        token.tokenCode,
        getTokenStatus(token),
        new Date(token.createdAt).toLocaleDateString("th-TH"),
        new Date(token.expiresAt).toLocaleDateString("th-TH"),
        token.usedAt ? new Date(token.usedAt).toLocaleDateString("th-TH") : "",
        token.createdBy?.username || "",
        token.usedBy?.userAgent || "",
        token.usedBy?.ipAddress || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.click();
  };

  const getTokenStatus = (token) => {
    if (token.status) return token.status;
    if (token.isUsed) return "used";
    if (new Date(token.expiresAt) < new Date()) return "expired";
    return "active";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "used":
        return "text-blue-600 bg-blue-100";
      case "expired":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "ใช้ได้";
      case "used":
        return "ใช้แล้ว";
      case "expired":
        return "หมดอายุ";
      default:
        return "ไม่ทราบ";
    }
  };

  const filteredTokens = tokens.filter((token) => {
    const matchesSearch = token.tokenCode
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const status = getTokenStatus(token);
    const matchesFilter = filterStatus === "all" || status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const TabButton = ({ id, label, icon: Icon, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
        activeTab === id
          ? "bg-blue-100 text-blue-800 font-medium"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {count !== undefined && (
        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
          {count}
        </span>
      )}
    </button>
  );

  const StatsCard = ({ title, value, icon: Icon, color = "blue" }) => (
    <div
      className={`bg-gradient-to-r from-${color}-500 to-${color}-600 rounded-xl p-4 text-white`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-2xl font-bold">{value || 0}</p>
        </div>
        <Icon className="w-8 h-8 opacity-80" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">จัดการโทเค็น</h2>
            <p className="text-gray-600 mt-1">
              สร้างและจัดการโทเค็นสำหรับหมุนวงล้อ (อายุ 2 วัน)
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                exportTokens(
                  activeTab === "active" ? filteredTokens : history,
                  `tokens_${activeTab}_${
                    new Date().toISOString().split("T")[0]
                  }.csv`
                )
              }
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="ทั้งหมด"
          value={stats.totalTokens}
          icon={BarChart3}
          color="blue"
        />
        <StatsCard
          title="ใช้ได้"
          value={stats.activeTokens}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="ใช้แล้ว"
          value={stats.usedTokens}
          icon={History}
          color="purple"
        />
        <StatsCard
          title="หมดอายุ"
          value={stats.expiredTokens}
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="ถูกลบ"
          value={stats.deletedTokens}
          icon={Trash2}
          color="red"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex space-x-2 mb-6">
          <TabButton
            id="active"
            label="โทเค็นที่ใช้งานได้"
            icon={Shield}
            count={stats.totalTokens}
          />
          <TabButton
            id="history"
            label="ประวัติการใช้งาน"
            icon={History}
            count={stats.usedTokens}
          />
        </div>

        {/* Active Tokens Tab */}
        {activeTab === "active" && (
          <>
            {/* Create Tokens */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                สร้างโทเค็นใหม่
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวนโทเค็น (1-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.min(
                          100,
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating}
                  />
                </div>
                <button
                  onClick={createTokens}
                  disabled={isCreating}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isCreating
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreating ? "กำลังสร้าง..." : "สร้างโทเค็น"}</span>
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                การจัดการแบบกลุ่ม
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => bulkDelete("expired")}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ลบหมดอายุ ({stats.expiredTokens})</span>
                </button>
                <button
                  onClick={() => bulkDelete("used")}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ลบใช้แล้ว ({stats.usedTokens})</span>
                </button>
                <button
                  onClick={cleanupExpired}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>ล้างหมดอายุ</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาโทเค็น..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="active">ใช้ได้</option>
                  <option value="used">ใช้แล้ว</option>
                  <option value="expired">หมดอายุ</option>
                </select>
              </div>
              <button
                onClick={fetchTokens}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>รีเฟรช</span>
              </button>
            </div>

            {/* Tokens Table */}
            <div className="overflow-x-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  รายการโทเค็น ({filteredTokens.length})
                </h3>
              </div>

              {isLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">กำลังโหลด...</p>
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">ไม่พบโทเค็น</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        โทเค็น
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่สร้าง
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันหมดอายุ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ผู้สร้าง
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTokens.map((token) => {
                      const status = getTokenStatus(token);
                      return (
                        <tr key={token._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-mono text-lg font-bold text-gray-900">
                              {token.tokenCode}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                status
                              )}`}
                            >
                              {getStatusText(status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(token.createdAt).toLocaleDateString(
                                  "th-TH"
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {new Date(token.expiresAt).toLocaleDateString(
                                  "th-TH"
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>
                                {token.createdBy?.username || "ไม่ทราบ"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => copyToClipboard(token.tokenCode)}
                                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors duration-200"
                              >
                                {copiedToken === token.tokenCode ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                                <span>
                                  {copiedToken === token.tokenCode
                                    ? "คัดลอกแล้ว"
                                    : "คัดลอก"}
                                </span>
                              </button>
                              <button
                                onClick={() =>
                                  deleteToken(token._id, token.tokenCode)
                                }
                                className="flex items-center space-x-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>ลบ</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                ประวัติการใช้งานโทเค็น ({historyPagination.totalTokens || 0})
              </h3>
              <button
                onClick={fetchHistory}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>รีเฟรช</span>
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">กำลังโหลดประวัติ...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center">
                <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">ไม่มีประวัติการใช้งาน</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          โทเค็น
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          วันที่ใช้
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ผู้สร้าง
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Agent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.map((token) => (
                        <tr key={token._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-mono text-lg font-bold text-gray-900">
                              {token.tokenCode}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <div>
                                <div>
                                  {new Date(token.usedAt).toLocaleDateString(
                                    "th-TH"
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(token.usedAt).toLocaleTimeString(
                                    "th-TH"
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>
                                {token.createdBy?.username || "ไม่ทราบ"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div
                              className="max-w-xs truncate"
                              title={token.usedBy?.userAgent}
                            >
                              {token.usedBy?.userAgent || "ไม่ทราบ"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                            {token.usedBy?.ipAddress || "ไม่ทราบ"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {historyPagination.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      แสดง {(historyPagination.currentPage - 1) * 50 + 1} -{" "}
                      {Math.min(
                        historyPagination.currentPage * 50,
                        historyPagination.totalTokens
                      )}{" "}
                      จาก {historyPagination.totalTokens} รายการ
                    </div>
                    <div className="flex space-x-2">
                      {historyPagination.currentPage > 1 && (
                        <button
                          onClick={() => setHistoryPage(historyPage - 1)}
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                        >
                          ก่อนหน้า
                        </button>
                      )}
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {historyPagination.currentPage} /{" "}
                        {historyPagination.totalPages}
                      </span>
                      {historyPagination.hasMore && (
                        <button
                          onClick={() => setHistoryPage(historyPage + 1)}
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                        >
                          ถัดไป
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TokenManager;
