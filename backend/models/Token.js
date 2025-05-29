const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    tokenCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // เพิ่มข้อมูลการใช้งาน
    usedBy: {
      userAgent: String,
      ipAddress: String,
    },
    // เพิ่มสถานะสำหรับการลบ
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Auto delete expired tokens (เฉพาะตัวที่ไม่ได้ใช้งาน)
tokenSchema.index(
  {
    expiresAt: 1,
    isUsed: 1,
  },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: {
      isUsed: false,
      isDeleted: false,
    },
  }
);

// Index สำหรับการค้นหา
tokenSchema.index({ tokenCode: 1, isUsed: 1, isDeleted: 1 });
tokenSchema.index({ createdBy: 1, createdAt: -1 });
tokenSchema.index({ isUsed: 1, usedAt: -1 });
tokenSchema.index({ isDeleted: 1 });

// Method สำหรับตรวจสอบสถานะ token
tokenSchema.methods.getStatus = function () {
  if (this.isDeleted) return "deleted";
  if (this.isUsed) return "used";
  if (new Date() > this.expiresAt) return "expired";
  return "active";
};

// Method สำหรับ soft delete
tokenSchema.methods.softDelete = function (deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Static method สำหรับดึง token ที่ใช้งานได้
tokenSchema.statics.findActive = function () {
  return this.find({
    isUsed: false,
    isDeleted: false,
    expiresAt: { $gt: new Date() },
  });
};

// Static method สำหรับดึงประวัติการใช้งาน
tokenSchema.statics.getUsageHistory = function (options = {}) {
  const { page = 1, limit = 50, createdBy } = options;

  const query = {
    isUsed: true,
    isDeleted: false,
  };

  if (createdBy) {
    query.createdBy = createdBy;
  }

  return this.find(query)
    .populate("createdBy", "username")
    .sort({ usedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

module.exports = mongoose.model("Token", tokenSchema);
