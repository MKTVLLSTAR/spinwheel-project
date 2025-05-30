const express = require("express");
const Prize = require("../models/Prize");
const Token = require("../models/Token");
const SpinResult = require("../models/SpinResult");
const router = express.Router();

// Get active prizes (public) - แก้ไขให้รองรับ 8 รางวัลคงที่
router.get("/prizes", async (req, res) => {
  try {
    console.log("Fetching active prizes for wheel...");

    // ดึงรางวัลที่เปิดใช้งาน เรียงตาม position หรือ createdAt
    let prizes = await Prize.find({ isActive: true })
      .sort({ position: 1, createdAt: 1 })
      .select("name description probability color isActive position")
      .lean();

    console.log(`Found ${prizes.length} active prizes from database`);

    // ตรวจสอบว่ามีรางวัลเกิน 8 อันไหม
    if (prizes.length > 8) {
      console.warn(
        `⚠️ Too many prizes (${prizes.length}), limiting to first 8`
      );
      prizes = prizes.slice(0, 8);
    }

    // ถ้ารางวัลน้อยกว่า 8 อัน ให้เพิ่มรางวัล "ไม่ได้รางวัล" เติมให้ครบ 8 อัน
    while (prizes.length < 8) {
      const emptySlot = {
        _id: `empty_${prizes.length}`,
        name: "ไม่ได้รางวัล",
        description: "โชคไม่ดี ลองใหม่อีกครั้ง",
        probability: 0,
        color: "#6B7280",
        isActive: true,
        position: prizes.length,
      };
      prizes.push(emptySlot);
      console.log(`Added empty slot at position ${prizes.length - 1}`);
    }

    // กำหนด position ให้แต่ละรางวัล (0-7)
    prizes.forEach((prize, index) => {
      prize.wheelPosition = index;
    });

    console.log("Final wheel configuration:");
    prizes.forEach((prize, index) => {
      console.log(`Position ${index}: "${prize.name}" (${prize.probability}%)`);
    });

    res.json(prizes);
  } catch (error) {
    console.error("Error fetching prizes:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      details: "ไม่สามารถโหลดข้อมูลรางวัลได้",
    });
  }
});

// Spin wheel (public) - แก้ไขให้คำนวณตำแหน่งถูกต้อง
router.post("/spin", async (req, res) => {
  try {
    const { tokenCode } = req.body;

    console.log(`🎲 Spin request with token: ${tokenCode}`);

    if (!tokenCode) {
      return res.status(400).json({ message: "Token code is required" });
    }

    // Validate token
    const token = await Token.findOne({
      tokenCode: tokenCode.toUpperCase(),
      isUsed: false,
      isDeleted: false,
      expiresAt: { $gt: new Date() },
    });

    if (!token) {
      console.log(`❌ Invalid token: ${tokenCode}`);
      return res.status(404).json({
        message: "Invalid, expired, or already used token",
      });
    }

    // Mark token as used
    const tokenCheck = await Token.findOneAndUpdate(
      {
        _id: token._id,
        isUsed: false,
        isDeleted: false,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          isUsed: true,
          usedAt: new Date(),
          usedBy: {
            userAgent: req.get("User-Agent"),
            ipAddress:
              req.ip ||
              req.connection.remoteAddress ||
              req.socket.remoteAddress,
          },
        },
      },
      { new: true }
    );

    if (!tokenCheck) {
      console.log(`❌ Token already used: ${tokenCode}`);
      return res.status(409).json({
        message: "Token has already been used or is no longer valid",
      });
    }

    console.log(`✅ Token ${tokenCode} marked as used`);

    // Get active prizes และสร้างวงล้อ 8 ช่อง
    let prizes = await Prize.find({ isActive: true })
      .sort({ position: 1, createdAt: 1 })
      .lean();

    if (prizes.length > 8) {
      prizes = prizes.slice(0, 8);
    }

    // เติมช่องว่างถ้าน้อยกว่า 8
    const originalPrizeIds = prizes.map((p) => p._id.toString());
    while (prizes.length < 8) {
      prizes.push({
        _id: `empty_${prizes.length}`,
        name: "ไม่ได้รางวัล",
        description: "โชคไม่ดี ลองใหม่อีกครั้ง",
        probability: 0,
        color: "#6B7280",
        isActive: true,
      });
    }

    console.log(`🎁 Wheel configured with ${prizes.length} slots`);

    // คำนวณการสุ่มรางวัลตามความน่าจะเป็น
    const realPrizes = prizes.filter(
      (p) => !p._id.toString().startsWith("empty_") && p.probability > 0
    );
    const totalProbability = realPrizes.reduce(
      (sum, prize) => sum + prize.probability,
      0
    );

    console.log(`📊 Total probability from real prizes: ${totalProbability}%`);

    let selectedPrize;
    let selectedIndex;

    if (totalProbability === 0 || realPrizes.length === 0) {
      // ถ้าไม่มีรางวัลหรือความน่าจะเป็นเป็น 0 ให้เลือก "ไม่ได้รางวัล"
      const emptyPrizes = prizes.filter((p) =>
        p._id.toString().startsWith("empty_")
      );
      selectedPrize =
        emptyPrizes[Math.floor(Math.random() * emptyPrizes.length)];
      selectedIndex = prizes.findIndex((p) => p._id === selectedPrize._id);
    } else {
      // สุ่มรางวัลตามความน่าจะเป็น
      const random = Math.random() * totalProbability;
      console.log(
        `🎲 Random value: ${random.toFixed(2)} (out of ${totalProbability})`
      );

      let currentProbability = 0;
      selectedPrize = realPrizes[0]; // Default fallback

      for (const prize of realPrizes) {
        currentProbability += prize.probability;
        if (random <= currentProbability) {
          selectedPrize = prize;
          break;
        }
      }

      // หา index ของรางวัลที่ถูกเลือกในวงล้อ
      selectedIndex = prizes.findIndex(
        (p) => p._id.toString() === selectedPrize._id.toString()
      );
    }

    console.log(
      `🎯 Selected prize: "${selectedPrize.name}" at wheel position ${selectedIndex}`
    );

    // บันทึกผลการหมุน (เฉพาะรางวัลจริง)
    let spinResult = null;
    if (!selectedPrize._id.toString().startsWith("empty_")) {
      spinResult = new SpinResult({
        tokenCode: tokenCheck.tokenCode,
        prize: selectedPrize._id,
        userAgent: req.get("User-Agent"),
        ipAddress:
          req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
      });
      await spinResult.save();
      console.log(`💾 Spin result saved: ${spinResult._id}`);
    }

    // ส่งผลลัพธ์กลับไป Frontend
    const response = {
      success: true,
      prize: {
        _id: selectedPrize._id,
        name: selectedPrize.name,
        description: selectedPrize.description,
        color: selectedPrize.color,
        probability: selectedPrize.probability,
      },
      wheelPosition: selectedIndex, // 🔥 ส่งตำแหน่งที่แน่นอนในวงล้อ (0-7)
      spinId: spinResult?._id || null,
      tokenUsed: {
        code: tokenCheck.tokenCode,
        usedAt: tokenCheck.usedAt,
      },
      message: "Spin successful",
      // เพิ่มข้อมูล debug
      debug: {
        totalSlots: prizes.length,
        realPrizes: realPrizes.length,
        totalProbability: totalProbability,
      },
    };

    console.log("📤 Sending response with wheelPosition:", selectedIndex);
    res.json(response);
  } catch (error) {
    console.error("❌ Spin wheel error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      details: "เกิดข้อผิดพลาดในการหมุนวงล้อ",
    });
  }
});

// ส่วนอื่นๆ เหมือนเดิม...
router.get("/stats", async (req, res) => {
  try {
    const totalSpins = await SpinResult.countDocuments();
    const totalPrizes = await Prize.countDocuments({ isActive: true });
    const totalActiveTokens = await Token.countDocuments({
      isUsed: false,
      isDeleted: false,
      expiresAt: { $gt: new Date() },
    });

    res.json({
      totalSpins,
      totalPrizes,
      totalActiveTokens,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching wheel stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Wheel API is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
