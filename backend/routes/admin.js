const express = require("express");
const Prize = require("../models/Prize");
const SpinResult = require("../models/SpinResult");
const Token = require("../models/Token");
const { auth } = require("../middleware/auth");
const router = express.Router();

// Get dashboard stats
router.get("/stats", auth, async (req, res) => {
  try {
    const totalTokens = await Token.countDocuments();
    const usedTokens = await Token.countDocuments({ isUsed: true });
    const expiredTokens = await Token.countDocuments({
      expiresAt: { $lt: new Date() },
    });
    const totalSpins = await SpinResult.countDocuments();

    res.json({
      totalTokens,
      usedTokens,
      expiredTokens,
      availableTokens: totalTokens - usedTokens - expiredTokens,
      totalSpins,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ==================== PRIZE MANAGEMENT ====================

// Get all prizes
router.get("/prizes", auth, async (req, res) => {
  try {
    const prizes = await Prize.find().sort({ createdAt: -1 });
    res.json(prizes);
  } catch (error) {
    console.error("Error fetching prizes:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new prize
router.post("/prizes", auth, async (req, res) => {
  try {
    const prize = new Prize(req.body);
    await prize.save();
    res.status(201).json(prize);
  } catch (error) {
    console.error("Error creating prize:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update prize - Fixed parameter name
router.put("/prizes/:prizeId", auth, async (req, res) => {
  try {
    const { prizeId } = req.params;

    const prize = await Prize.findByIdAndUpdate(prizeId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!prize) {
      return res.status(404).json({ message: "Prize not found" });
    }

    res.json(prize);
  } catch (error) {
    console.error("Error updating prize:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete prize - Fixed parameter name
router.delete("/prizes/:prizeId", auth, async (req, res) => {
  try {
    const { prizeId } = req.params;

    const prize = await Prize.findByIdAndDelete(prizeId);
    if (!prize) {
      return res.status(404).json({ message: "Prize not found" });
    }

    res.json({ message: "Prize deleted successfully" });
  } catch (error) {
    console.error("Error deleting prize:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ==================== SPIN RESULTS ====================

// Get spin results with basic pagination
router.get("/results", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const results = await SpinResult.find()
      .populate("prize", "name description color")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalResults = await SpinResult.countDocuments();

    res.json({
      results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalResults / limit),
        totalResults,
        hasMore: skip + results.length < totalResults,
      },
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get result statistics
router.get("/results/stats", auth, async (req, res) => {
  try {
    const totalSpins = await SpinResult.countDocuments();
    const uniqueTokens = await SpinResult.distinct("tokenCode");

    // Simple prize stats without complex aggregation
    const results = await SpinResult.find().populate("prize", "name").lean();

    const prizeStats = {};
    results.forEach((result) => {
      const prizeName = result.prize?.name || "Unknown";
      prizeStats[prizeName] = (prizeStats[prizeName] || 0) + 1;
    });

    // Find most popular prize
    let mostPopularPrize = "ไม่มีข้อมูล";
    let maxCount = 0;

    Object.entries(prizeStats).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostPopularPrize = name;
      }
    });

    res.json({
      totalSpins,
      uniqueTokens: uniqueTokens.length,
      prizeStats,
      mostPopularPrize,
    });
  } catch (error) {
    console.error("Error fetching result stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete spin result - Fixed parameter name
router.delete("/results/:resultId", auth, async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await SpinResult.findByIdAndDelete(resultId);
    if (!result) {
      return res.status(404).json({ message: "Spin result not found" });
    }

    res.json({ message: "Spin result deleted successfully" });
  } catch (error) {
    console.error("Error deleting result:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
