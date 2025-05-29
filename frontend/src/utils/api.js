import axios from "axios";

// บังคับใช้ Production API เท่านั้น
const API_BASE_URL = "https://spinwheel-production.up.railway.app/api";

console.log("🚀 API Base URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // เพิ่ม timeout เป็น 15 วินาที
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    console.log(
      `📤 Making ${config.method?.toUpperCase()} request to:`,
      config.url
    );

    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    console.log(
      `✅ Successful response from ${response.config.url}:`,
      response.status
    );
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });

    // Handle token expiration
    if (error.response?.status === 401) {
      console.log("🔑 Token expired, clearing auth data");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");

      // เฉพาะเมื่ออยู่ในหน้า admin เท่านั้นที่จะ redirect
      if (window.location.pathname.startsWith("/admin")) {
        window.location.href = "/admin";
      }
    }

    // Handle network errors
    if (error.code === "NETWORK_ERROR" || error.code === "ECONNABORTED") {
      console.error("🌐 Network error or timeout:", error.message);
      error.message =
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
    }

    return Promise.reject(error);
  }
);

// Helper function to test API connection
export const testApiConnection = async () => {
  try {
    console.log("🔍 Testing API connection...");
    const response = await api.get("/wheel/health");
    console.log("✅ API connection test successful:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("❌ API connection test failed:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// Helper function to get prizes with better error handling
export const getPrizes = async () => {
  try {
    console.log("🎁 Fetching prizes...");
    const response = await api.get("/wheel/prizes");

    if (!Array.isArray(response.data)) {
      throw new Error("Invalid prizes data format");
    }

    console.log(`✅ Successfully fetched ${response.data.length} prizes`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching prizes:", error);
    throw error;
  }
};

// Helper function to spin wheel with better error handling
export const spinWheel = async (tokenCode) => {
  try {
    console.log("🎲 Spinning wheel with token:", tokenCode);
    const response = await api.post("/wheel/spin", { tokenCode });
    console.log("🎉 Spin successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error spinning wheel:", error);
    throw error;
  }
};

export default api;
