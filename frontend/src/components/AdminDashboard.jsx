// 📁 src/components/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  Coins,
  Gift,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Crown,
  Shield,
} from "lucide-react";
import api from "../utils/api";
import TokenManager from "./TokenManager";
import PrizeManager from "./PrizeManager";
import ResultsViewer from "./ResultsViewer";
import UserManager from "./UserManager";

const AdminDashboard = ({ user, onLogout }) => {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    onLogout();
  };

  const menuItems = [
    { id: "dashboard", label: "แดชบอร์ด", icon: BarChart3 },
    { id: "tokens", label: "จัดการโทเค็น", icon: Coins },
    { id: "prizes", label: "จัดการรางวัล", icon: Gift },
    { id: "results", label: "ผลการหมุน", icon: Eye },
    ...(user?.role === "superadmin"
      ? [{ id: "users", label: "จัดการผู้ใช้", icon: Users }]
      : []),
  ];

  const StatCard = ({ title, value, icon: Icon, color = "blue" }) => (
    <div
      className={`bg-gradient-to-r from-${color}-500 to-${color}-600 rounded-xl p-6 text-white`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-3xl font-bold">{isLoading ? "..." : value}</p>
        </div>
        <Icon className="w-12 h-12 opacity-80" />
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3">
          {user?.role === "superadmin" ? (
            <Crown className="w-8 h-8 text-yellow-300" />
          ) : (
            <Shield className="w-8 h-8 text-blue-200" />
          )}
          <div>
            <h2 className="text-2xl font-bold">
              ยินดีต้อนรับ, {user?.username}!
            </h2>
            <p className="text-blue-100">
              {user?.role === "superadmin"
                ? "Super Administrator"
                : "Administrator"}{" "}
              - จัดการระบบ Spin Wheel
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="โทเค็นทั้งหมด"
          value={stats.totalTokens || 0}
          icon={Coins}
          color="blue"
        />
        <StatCard
          title="โทเค็นที่ใช้แล้ว"
          value={stats.usedTokens || 0}
          icon={RefreshCw}
          color="green"
        />
        <StatCard
          title="โทเค็นที่เหลือ"
          value={stats.availableTokens || 0}
          icon={Settings}
          color="yellow"
        />
        <StatCard
          title="จำนวนการหมุน"
          value={stats.totalSpins || 0}
          icon={Gift}
          color="purple"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Status */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Coins className="w-5 h-5 mr-2 text-blue-600" />
            สถานะโทเค็น
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ใช้งานได้</span>
              <span className="font-bold text-green-600">
                {stats.availableTokens || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ใช้แล้ว</span>
              <span className="font-bold text-blue-600">
                {stats.usedTokens || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">หมดอายุ</span>
              <span className="font-bold text-red-600">
                {stats.expiredTokens || 0}
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">รวม</span>
                <span className="font-bold text-gray-800">
                  {stats.totalTokens || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-600" />
            ข้อมูลระบบ
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">สถานะระบบ</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                ออนไลน์
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">บทบาท</span>
              <span
                className={`px-2 py-1 rounded text-sm font-medium ${
                  user?.role === "superadmin"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {user?.role === "superadmin" ? "Super Admin" : "Admin"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">การหมุนวันนี้</span>
              <span className="font-bold text-purple-600">
                {/* คำนวณจากข้อมูลที่มี หรือ 0 */}0
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">อัปเดตล่าสุด</span>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString("th-TH")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          การดำเนินการด่วน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setCurrentTab("tokens")}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors duration-200 group"
          >
            <Plus className="w-6 h-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-blue-800 font-medium">สร้างโทเค็นใหม่</p>
            <p className="text-blue-600 text-sm mt-1">
              เพิ่มโทเค็นสำหรับผู้ใช้
            </p>
          </button>

          <button
            onClick={() => setCurrentTab("prizes")}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors duration-200 group"
          >
            <Gift className="w-6 h-6 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-green-800 font-medium">จัดการรางวัล</p>
            <p className="text-green-600 text-sm mt-1">เพิ่มหรือแก้ไขรางวัล</p>
          </button>

          <button
            onClick={() => setCurrentTab("results")}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors duration-200 group"
          >
            <Eye className="w-6 h-6 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-purple-800 font-medium">ดูผลการหมุน</p>
            <p className="text-purple-600 text-sm mt-1">สถิติและข้อมูล</p>
          </button>

          {user?.role === "superadmin" && (
            <button
              onClick={() => setCurrentTab("users")}
              className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-colors duration-200 group"
            >
              <Users className="w-6 h-6 text-yellow-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-yellow-800 font-medium">จัดการผู้ใช้</p>
              <p className="text-yellow-600 text-sm mt-1">Admin accounts</p>
            </button>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchStats}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return renderDashboard();
      case "tokens":
        return <TokenManager onStatsUpdate={fetchStats} />;
      case "prizes":
        return <PrizeManager />;
      case "results":
        return <ResultsViewer />;
      case "users":
        return user?.role === "superadmin" ? (
          <UserManager />
        ) : (
          renderDashboard()
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard (ALLSTAR)
              </h1>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                {user?.role === "superadmin" ? (
                  <Crown className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Shield className="w-4 h-4 text-blue-500" />
                )}
                <span>{user?.username}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {user?.role === "superadmin" ? "Super Admin" : "Admin"}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm transition-colors duration-200"
              >
                ไปหน้าหมุนวงล้อ
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-800 px-3 py-2 rounded-md text-sm transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-lg p-4 sticky top-24">
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setCurrentTab(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                          currentTab === item.id
                            ? "bg-blue-100 text-blue-800 font-medium shadow-sm transform scale-105"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            currentTab === item.id
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                        />
                        <span>{item.label}</span>
                        {item.id === "users" && user?.role === "superadmin" && (
                          <Crown className="w-3 h-3 text-yellow-500 ml-auto" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
