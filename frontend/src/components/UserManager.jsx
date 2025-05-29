import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Shield,
  Crown,
  Calendar,
  User,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import api from "../utils/api";

const UserManager = () => {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await api.get("/auth/admins");
      setAdmins(response.data);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ username: "", password: "" });
    setShowCreateForm(false);
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      alert("กรุณาใส่ชื่อผู้ใช้");
      return;
    }

    if (formData.password.length < 6) {
      alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setIsCreating(true);
    try {
      await api.post("/auth/create-admin", formData);
      await fetchAdmins();
      resetForm();
      alert("สร้าง Admin เรียบร้อยแล้ว!");
    } catch (error) {
      alert(
        "เกิดข้อผิดพลาด: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (adminId, username) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบ Admin "${username}"?`)) return;

    try {
      await api.delete(`/auth/admin/${adminId}`);
      await fetchAdmins();
      alert("ลบ Admin เรียบร้อยแล้ว!");
    } catch (error) {
      alert(
        "เกิดข้อผิดพลาดในการลบ Admin: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Crown className="w-6 h-6 text-yellow-500 mr-2" />
              จัดการผู้ใช้งาน
            </h2>
            <p className="text-gray-600 mt-1">
              สร้างและจัดการ Admin accounts (เฉพาะ Super Admin)
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่ม Admin ใหม่</span>
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              เพิ่ม Admin ใหม่
            </h3>
            <button
              onClick={resetForm}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อผู้ใช้ *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อผู้ใช้สำหรับ Admin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่าน *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 text-xs"
                  title="สุ่มรหัสผ่าน"
                >
                  สุ่ม
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                รหัสผ่านควรมีความแข็งแกร่งและเก็บไว้ในที่ปลอดภัย
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isCreating}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors duration-200 ${
                  isCreating
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isCreating ? "กำลังสร้าง..." : "สร้าง Admin"}</span>
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

      {/* Admins List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              รายการ Admin ({admins.length})
            </h3>
            <button
              onClick={fetchAdmins}
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
        ) : admins.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">ยังไม่มี Admin</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              เพิ่ม Admin คนแรก
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {admins.map((admin) => (
              <div
                key={admin._id}
                className="p-6 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-semibold text-gray-800">
                          {admin.username}
                        </h4>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Admin
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            สร้างเมื่อ:{" "}
                            {new Date(admin.createdAt).toLocaleDateString(
                              "th-TH"
                            )}
                          </span>
                        </div>
                        {admin.createdBy && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>สร้างโดย: {admin.createdBy.username}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDelete(admin._id, admin.username)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-200"
                      title="ลบ Admin"
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

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="text-yellow-800 font-medium">ข้อควรระวัง</h4>
            <ul className="text-yellow-700 text-sm mt-1 space-y-1">
              <li>
                • บัญชี Admin จะมีสิทธิ์จัดการโทเค็น รางวัล
                และดูข้อมูลการหมุนทั้งหมด
              </li>
              <li>
                • เก็บรหัสผ่าน Admin ไว้ในที่ปลอดภัยและไม่เปิดเผยต่อผู้อื่น
              </li>
              <li>• ควรเปลี่ยนรหัสผ่านเป็นระยะ และตั้งรหัสผ่านให้แข็งแรง</li>
              <li>• เฉพาะ Super Admin เท่านั้นที่สามารถสร้างและลบ Admin ได้</li>
              <li>• หากต้องการยุติบทบาทแอดมิน ติดต่อ Super Admin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManager;
