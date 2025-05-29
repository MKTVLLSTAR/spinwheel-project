// 📁 src/components/PrizeManager.jsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Palette,
  AlertCircle,
  RefreshCw,
  Gift,
  Percent,
} from "lucide-react";
import api from "../utils/api";

const PrizeManager = () => {
  const [prizes, setPrizes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPrize, setEditingPrize] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    probability: 10,
    color: "#3B82F6",
    isActive: true,
  });

  const defaultColors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
    "#14B8A6",
    "#F43F5E",
  ];

  useEffect(() => {
    fetchPrizes();
  }, []);

  const fetchPrizes = async () => {
    try {
      const response = await api.get("/admin/prizes");
      setPrizes(response.data);
    } catch (error) {
      console.error("Error fetching prizes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      probability: 10,
      color: "#3B82F6",
      isActive: true,
    });
    setEditingPrize(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.name.trim()) {
      alert("กรุณาใส่ชื่อรางวัล");
      return;
    }

    if (formData.probability < 0 || formData.probability > 100) {
      alert("ความน่าจะเป็นต้องอยู่ระหว่าง 0-100");
      return;
    }

    try {
      if (editingPrize) {
        // Update existing prize
        await api.put(`/admin/prizes/${editingPrize._id}`, formData);
        alert("อัปเดตรางวัลเรียบร้อยแล้ว!");
      } else {
        // Create new prize
        await api.post("/admin/prizes", formData);
        alert("สร้างรางวัลเรียบร้อยแล้ว!");
      }

      await fetchPrizes();
      resetForm();
    } catch (error) {
      alert(
        "เกิดข้อผิดพลาด: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const handleEdit = (prize) => {
    setFormData({
      name: prize.name,
      description: prize.description || "",
      probability: prize.probability,
      color: prize.color,
      isActive: prize.isActive,
    });
    setEditingPrize(prize);
    setShowCreateForm(true);
  };

  const handleDelete = async (prizeId) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบรางวัลนี้?")) return;

    try {
      await api.delete(`/admin/prizes/${prizeId}`);
      await fetchPrizes();
      alert("ลบรางวัลเรียบร้อยแล้ว!");
    } catch (error) {
      alert(
        "เกิดข้อผิดพลาดในการลบรางวัล: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const toggleActive = async (prize) => {
    try {
      await api.put(`/admin/prizes/${prize._id}`, {
        ...prize,
        isActive: !prize.isActive,
      });
      await fetchPrizes();
    } catch (error) {
      alert(
        "เกิดข้อผิดพลาด: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const getTotalProbability = () => {
    return prizes
      .filter((p) => p.isActive)
      .reduce((sum, prize) => sum + prize.probability, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">จัดการรางวัล</h2>
            <p className="text-gray-600 mt-1">
              สร้างและจัดการรางวัลสำหรับวงล้อ
            </p>
            <div className="mt-2">
              <span className="text-sm text-gray-500">
                รวมความน่าจะเป็น (เฉพาะที่เปิดใช้งาน):{" "}
              </span>
              <span
                className={`font-bold ${
                  getTotalProbability() === 100
                    ? "text-green-600"
                    : "text-orange-600"
                }`}
              >
                {getTotalProbability()}%
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรางวัลใหม่</span>
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {editingPrize ? "แก้ไขรางวัล" : "เพิ่มรางวัลใหม่"}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อรางวัล *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น รางวัลที่ 1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ความน่าจะเป็น (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.probability}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      probability: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำอธิบาย
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="คำอธิบายรางวัล (ไม่บังคับ)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สีรางวัล
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                      formData.color === color
                        ? "border-gray-800 scale-110"
                        : "border-gray-300 hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-gray-500" />
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-12 h-8 rounded border border-gray-300"
                />
                <span className="text-sm text-gray-600 font-mono">
                  {formData.color}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                เปิดใช้งานรางวัลนี้
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <Save className="w-4 h-4" />
                <span>{editingPrize ? "อัปเดต" : "สร้าง"}รางวัล</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Prizes List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              รายการรางวัล ({prizes.length})
            </h3>
            <button
              onClick={fetchPrizes}
              className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">กำลังโหลด...</p>
          </div>
        ) : prizes.length === 0 ? (
          <div className="p-8 text-center">
            <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">ยังไม่มีรางวัล</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              เพิ่มรางวัลแรก
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {prizes.map((prize) => (
              <div
                key={prize._id}
                className="p-6 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: prize.color }}
                    >
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-semibold text-gray-800">
                          {prize.name}
                        </h4>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            prize.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {prize.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </span>
                      </div>
                      {prize.description && (
                        <p className="text-gray-600 text-sm mt-1">
                          {prize.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Percent className="w-4 h-4" />
                          <span>ความน่าจะเป็น: {prize.probability}%</span>
                        </div>
                        <span>สี: {prize.color}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleActive(prize)}
                      className={`px-3 py-1 text-sm font-medium rounded transition-colors duration-200 ${
                        prize.isActive
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : "bg-green-100 text-green-800 hover:bg-green-200"
                      }`}
                    >
                      {prize.isActive ? "ปิด" : "เปิด"}
                    </button>
                    <button
                      onClick={() => handleEdit(prize)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors duration-200"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prize._id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Probability Warning */}
      {getTotalProbability() !== 100 && prizes.some((p) => p.isActive) && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="text-orange-800 font-medium">คำเตือน</h4>
              <p className="text-orange-700 text-sm mt-1">
                รวมความน่าจะเป็นของรางวัลที่เปิดใช้งานไม่เท่ากับ 100%
                อาจส่งผลต่อความแม่นยำในการสุ่มรางวัล
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrizeManager;
