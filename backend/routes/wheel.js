const express = require("express");
const Prize = require("../models/Prize");
const Token = require("../models/Token");
const SpinResult = require("../models/SpinResult");
const router = express.Router();

// Get active prizes (public)
router.get("/prizes", async (req, res) => {
  try {
    console.log("Fetching active prizes...");

    const prizes = await Prize.find({ isActive: true })
      .sort({ createdAt: 1 })
      .select("name description probability color isActive createdAt")
      .lean();

    console.log(
      `Found ${prizes.length} active prizes:`,
      prizes.map((p) => p.name)
    );

    if (prizes.length === 0) {
      console.log("No active prizes found");
      return res.json([]);
    }

    // Validate prizes
    const validPrizes = prizes.filter((prize) => {
      const isValid = prize.name && typeof prize.probability === "number";
      if (!isValid) {
        console.warn("Invalid prize found:", prize);
      }
      return isValid;
    });

    console.log(`Returning ${validPrizes.length} valid prizes`);
    res.json(validPrizes);
  } catch (error) {
    console.error("Error fetching prizes:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      details: "ไม่สามารถโหลดข้อมูลรางวัลได้",
    });
  }
});

// Spin wheel (public) - ป้องกันการใช้ token ซ้ำ
router.post("/spin", async (req, res) => {
  try {
    const { tokenCode } = req.body;

    console.log(`🎲 Spin request with token: ${tokenCode}`);

    if (!tokenCode) {
      return res.status(400).json({ message: "Token code is required" });
    }

    // Validate token with enhanced security
    const token = await Token.findOne({
      tokenCode: tokenCode.toUpperCase(),
      isUsed: false,
      isDeleted: false,
      expiresAt: { $gt: new Date() },
    });

    if (!token) {
      console.log(
        `❌ Invalid, expired, deleted, or already used token: ${tokenCode}`
      );
      return res.status(404).json({
        message: "Invalid, expired, or already used token",
      });
    }

    console.log(`✅ Valid token found: ${token.tokenCode}`);

    // Double-check to prevent race conditions
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
      console.log(`❌ Token was already used or became invalid: ${tokenCode}`);
      return res.status(409).json({
        message: "Token has already been used or is no longer valid",
      });
    }

    console.log(`🔒 Token ${tokenCheck.tokenCode} marked as used`);

    // Get active prizes
    const prizes = await Prize.find({ isActive: true })
      .sort({ createdAt: 1 })
      .lean();

    if (prizes.length === 0) {
      console.log("❌ No active prizes available");
      return res.status(400).json({ message: "No prizes available" });
    }

    console.log(`🎁 Found ${prizes.length} active prizes for spinning`);

    // Calculate total probability
    const totalProbability = prizes.reduce(
      (sum, prize) => sum + (prize.probability || 0),
      0
    );

    console.log(`📊 Total probability: ${totalProbability}%`);

    if (totalProbability === 0) {
      console.log("❌ Total probability is 0");
      return res
        .status(400)
        .json({ message: "Prize probabilities not configured properly" });
    }

    // Calculate random prize based on probability
    const random = Math.random() * totalProbability;
    console.log(
      `🎲 Random value: ${random.toFixed(2)} (out of ${totalProbability})`
    );

    let currentProbability = 0;
    let selectedPrize = prizes[0]; // Default fallback

    for (const prize of prizes) {
      currentProbability += prize.probability || 0;
      console.log(
        `🔍 Checking prize "${
          prize.name
        }" - cumulative probability: ${currentProbability.toFixed(2)}`
      );

      if (random <= currentProbability) {
        selectedPrize = prize;
        console.log(`🎯 Selected prize: "${selectedPrize.name}"`);
        break;
      }
    }

    // Save spin result
    const spinResult = new SpinResult({
      tokenCode: tokenCheck.tokenCode,
      prize: selectedPrize._id,
      userAgent: req.get("User-Agent"),
      ipAddress:
        req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
    });

    await spinResult.save();
    console.log(`💾 Spin result saved with ID: ${spinResult._id}`);

    // Send response
    const response = {
      success: true,
      prize: {
        _id: selectedPrize._id,
        name: selectedPrize.name,
        description: selectedPrize.description,
        color: selectedPrize.color,
        probability: selectedPrize.probability,
      },
      spinId: spinResult._id,
      tokenUsed: {
        code: tokenCheck.tokenCode,
        usedAt: tokenCheck.usedAt,
      },
      message: "Spin successful",
    };

    console.log("📤 Sending response:", {
      prizeName: response.prize.name,
      tokenCode: response.tokenUsed.code,
    });

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

// Get spin statistics (public)
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

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Wheel API is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
