const mongoose = require("mongoose");

const prizeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // 🔥 เพิ่มฟิลด์ position สำหรับจัดลำดับรางวัลในวงล้อ (0-7)
    position: {
      type: Number,
      min: 0,
      max: 7,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index สำหรับ position
prizeSchema.index({ position: 1 });
prizeSchema.index({ isActive: 1, position: 1 });

module.exports = mongoose.model("Prize", prizeSchema);
