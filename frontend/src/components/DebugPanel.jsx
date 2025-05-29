import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bug,
} from "lucide-react";
import { testApiConnection, getPrizes } from "../utils/api";

const DebugPanel = ({ isVisible, onClose }) => {
  const [apiStatus, setApiStatus] = useState(null);
  const [prizesData, setPrizesData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-9), { message, type, timestamp }]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    addLog("กำลังทดสอบการเชื่อมต่อ API...", "info");

    try {
      const result = await testApiConnection();
      setApiStatus(result);

      if (result.success) {
        addLog("✅ เชื่อมต่อ API สำเร็จ", "success");
      } else {
        addLog(`❌ เชื่อมต่อ API ไม่สำเร็จ: ${result.error}`, "error");
      }
    } catch (error) {
      addLog(`❌ ข้อผิดพลาด: ${error.message}`, "error");
      setApiStatus({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testPrizes = async () => {
    setIsLoading(true);
    addLog("กำลังทดสอบการโหลดรางวัล...", "info");

    try {
      const prizes = await getPrizes();
      setPrizesData(prizes);
      addLog(`✅ โหลดรางวัลสำเร็จ: ${prizes.length} รางวัล`, "success");
    } catch (error) {
      addLog(`❌ โหลดรางวัลไม่สำเร็จ: ${error.message}`, "error");
      setPrizesData({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    addLog("🔍 เริ่มการทดสอบทั้งหมด", "info");
    await testConnection();
    await testPrizes();
    addLog("✅ การทดสอบเสร็จสิ้น", "success");
  };

  useEffect(() => {
    if (isVisible) {
      runAllTests();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getStatusIcon = (status) => {
    if (!status) return <RefreshCw className="w-4 h-4 text-gray-400" />;
    return status.success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "error":
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <AlertCircle className="w-3 h-3 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Bug className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Debug Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Status */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              {getStatusIcon(apiStatus)}
              <span>API Connection</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Base URL:</strong>{" "}
                {import.meta.env.VITE_API_URL || "Default"}
              </div>
              <div>
                <strong>Status:</strong>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs ${
                    apiStatus?.success
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {apiStatus?.success ? "Connected" : "Disconnected"}
                </span>
              </div>
              {apiStatus?.error && (
                <div>
                  <strong>Error:</strong>
                  <span className="text-red-600 ml-2">{apiStatus.error}</span>
                </div>
              )}
            </div>
            <button
              onClick={testConnection}
              disabled={isLoading}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Testing..." : "Test Connection"}
            </button>
          </div>

          {/* Prizes Data */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              {prizesData ? (
                Array.isArray(prizesData) ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )
              ) : (
                <RefreshCw className="w-5 h-5 text-gray-400" />
              )}
              <span>Prizes Data</span>
            </h3>
            <div className="space-y-2 text-sm">
              {Array.isArray(prizesData) ? (
                <>
                  <div>
                    <strong>Count:</strong> {prizesData.length}
                  </div>
                  <div>
                    <strong>Names:</strong>
                  </div>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {prizesData.map((prize, index) => (
                      <li key={index}>
                        {prize.name} ({prize.probability}%)
                      </li>
                    ))}
                  </ul>
                </>
              ) : prizesData?.error ? (
                <div className="text-red-600">
                  <strong>Error:</strong> {prizesData.error}
                </div>
              ) : (
                <div className="text-gray-500">ยังไม่มีข้อมูล</div>
              )}
            </div>
            <button
              onClick={testPrizes}
              disabled={isLoading}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Test Prizes"}
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="mt-6 bg-gray-50 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Environment:</strong> {import.meta.env.MODE}
            </div>
            <div>
              <strong>User Agent:</strong>{" "}
              {navigator.userAgent.substring(0, 50)}...
            </div>
            <div>
              <strong>Screen Size:</strong> {window.innerWidth} x{" "}
              {window.innerHeight}
            </div>
            <div>
              <strong>Current URL:</strong> {window.location.href}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="mt-6 bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Logs</h3>
            <button
              onClick={() => setLogs([])}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-sm">ไม่มี logs</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  {getLogIcon(log.type)}
                  <span className="text-gray-500 text-xs">{log.timestamp}</span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-4">
          <button
            onClick={runAllTests}
            disabled={isLoading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? "Running..." : "Run All Tests"}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
