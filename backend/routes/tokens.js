const express = require("express");
const Token = require("../models/Token");
const { auth } = require("../middleware/auth");
const router = express.Router();

// Generate random token code
const generateTokenCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Create tokens (admin/superadmin)
router.post("/create", auth, async (req, res) => {
  try {
    const { quantity = 1 } = req.body;

    if (quantity < 1 || quantity > 100) {
      return res
        .status(400)
        .json({ message: "Quantity must be between 1 and 100" });
    }

    const tokens = [];
    for (let i = 0; i < quantity; i++) {
      let tokenCode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 100;

      // ตรวจสอบความซ้ำกับทุก token ที่เคยมี (รวมที่ถูกลบ)
      while (!isUnique && attempts < maxAttempts) {
        tokenCode = generateTokenCode();

        // ตรวจสอบทั้ง active และ deleted tokens
        const existing = await Token.findOne({ tokenCode });

        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error(
          `Cannot generate unique token after ${maxAttempts} attempts`
        );
      }

      tokens.push({
        tokenCode,
        createdBy: req.user._id,
      });
    }

    const createdTokens = await Token.insertMany(tokens);

    console.log(`✅ Created ${quantity} tokens by ${req.user.username}`);

    res.status(201).json({
      message: `${quantity} token(s) created successfully`,
      tokens: createdTokens.map((t) => ({
        id: t._id,
        tokenCode: t.tokenCode,
        expiresAt: t.expiresAt,
        status: t.getStatus(),
      })),
    });
  } catch (error) {
    console.error("Create tokens error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all tokens (admin/superadmin) - เฉพาะที่ไม่ได้ลบ
router.get("/", auth, async (req, res) => {
  try {
    const tokens = await Token.find({ isDeleted: false })
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    const tokensWithStatus = tokens.map((token) => ({
      ...token.toObject(),
      status: token.getStatus(),
    }));

    res.json(tokensWithStatus);
  } catch (error) {
    console.error("Get tokens error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get token usage history (admin/superadmin)
router.get("/history", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const tokens = await Token.getUsageHistory({ page, limit });
    const totalUsed = await Token.countDocuments({
      isUsed: true,
      isDeleted: false,
    });

    const tokensWithStatus = tokens.map((token) => ({
      ...token.toObject(),
      status: token.getStatus(),
    }));

    res.json({
      tokens: tokensWithStatus,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsed / limit),
        totalTokens: totalUsed,
        hasMore: page * limit < totalUsed,
      },
    });
  } catch (error) {
    console.error("Get token history error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get token statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const now = new Date();

    const [
      totalTokens,
      activeTokens,
      usedTokens,
      expiredTokens,
      deletedTokens,
      totalEverCreated,
    ] = await Promise.all([
      Token.countDocuments({ isDeleted: false }),
      Token.countDocuments({
        isUsed: false,
        isDeleted: false,
        expiresAt: { $gt: now },
      }),
      Token.countDocuments({
        isUsed: true,
        isDeleted: false,
      }),
      Token.countDocuments({
        isUsed: false,
        isDeleted: false,
        expiresAt: { $lte: now },
      }),
      Token.countDocuments({ isDeleted: true }),
      Token.countDocuments({}), // ทั้งหมดที่เคยสร้าง
    ]);

    res.json({
      totalTokens,
      activeTokens,
      usedTokens,
      expiredTokens,
      deletedTokens,
      totalEverCreated,
      availableTokens: activeTokens,
    });
  } catch (error) {
    console.error("Get token stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Hard delete expired tokens (superadmin only) - ลบจริงออกจาก DB
router.delete("/hard-cleanup-expired", auth, async (req, res) => {
  try {
    // เฉพาะ superadmin เท่านั้น
    if (req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({ message: "Access denied. Superadmin only." });
    }

    const result = await Token.deleteMany({
      isUsed: false,
      expiresAt: { $lte: new Date() },
    });

    console.log(
      `🗑️ Hard deleted ${result.deletedCount} expired tokens by ${req.user.username}`
    );

    res.json({
      message: `Permanently deleted ${result.deletedCount} expired tokens`,
      deletedCount: result.deletedCount,
      warning: "These tokens are permanently removed from database",
    });
  } catch (error) {
    console.error("Hard cleanup expired tokens error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Soft delete expired tokens (admin/superadmin) - แค่ซ่อน
router.delete("/soft-cleanup-expired", auth, async (req, res) => {
  try {
    const result = await Token.updateMany(
      {
        isUsed: false,
        isDeleted: false,
        expiresAt: { $lte: new Date() },
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user._id,
        },
      }
    );

    console.log(
      `🙈 Soft deleted ${result.modifiedCount} expired tokens by ${req.user.username}`
    );

    res.json({
      message: `Hidden ${result.modifiedCount} expired tokens (soft delete)`,
      deletedCount: result.modifiedCount,
      note: "Tokens are hidden but remain in database to prevent code reuse",
    });
  } catch (error) {
    console.error("Soft cleanup expired tokens error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete specific token (admin/superadmin) - Soft delete
router.delete("/:tokenId", auth, async (req, res) => {
  try {
    const { tokenId } = req.params;

    const token = await Token.findById(tokenId);
    if (!token || token.isDeleted) {
      return res.status(404).json({ message: "Token not found" });
    }

    await token.softDelete(req.user._id);

    console.log(
      `🗑️ Soft deleted token ${token.tokenCode} by ${req.user.username}`
    );

    res.json({
      message: "Token deleted successfully (soft delete)",
      tokenCode: token.tokenCode,
      note: "Token is hidden to prevent code reuse",
    });
  } catch (error) {
    console.error("Delete token error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Bulk soft delete tokens (admin/superadmin)
router.delete("/bulk/:type", auth, async (req, res) => {
  try {
    const { type } = req.params;
    let query = { isDeleted: false };

    switch (type) {
      case "expired":
        query.isUsed = false;
        query.expiresAt = { $lte: new Date() };
        break;
      case "used":
        query.isUsed = true;
        break;
      case "all-unused":
        query.isUsed = false;
        break;
      default:
        return res.status(400).json({ message: "Invalid deletion type" });
    }

    const result = await Token.updateMany(query, {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id,
      },
    });

    console.log(
      `🗑️ Bulk soft deleted ${result.modifiedCount} ${type} tokens by ${req.user.username}`
    );

    res.json({
      message: `Hidden ${result.modifiedCount} tokens (soft delete)`,
      deletedCount: result.modifiedCount,
      type,
      note: "Tokens are hidden to prevent code reuse",
    });
  } catch (error) {
    console.error("Bulk delete tokens error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Check token blacklist/history (public) - ตรวจสอบว่าโค้ดเคยใช้ไหม
router.post("/check-history", async (req, res) => {
  try {
    const { tokenCode } = req.body;

    if (!tokenCode) {
      return res.status(400).json({ message: "Token code is required" });
    }

    const token = await Token.findOne({ tokenCode: tokenCode.toUpperCase() });

    if (!token) {
      return res.json({
        exists: false,
        message: "Token code never existed",
      });
    }

    const status = token.getStatus();
    const response = {
      exists: true,
      status,
      isUsed: token.isUsed,
      isDeleted: token.isDeleted,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
    };

    if (token.isUsed) {
      response.usedAt = token.usedAt;
      response.message = "This token was already used";
    } else if (token.isDeleted) {
      response.deletedAt = token.deletedAt;
      response.message = "This token was deleted/deactivated";
    } else if (status === "expired") {
      response.message = "This token has expired";
    } else {
      response.message = "Token is valid and available";
    }

    res.json(response);
  } catch (error) {
    console.error("Check token history error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Validate token (public) - ป้องกันการใช้ซ้ำ
router.post("/validate", async (req, res) => {
  try {
    const { tokenCode } = req.body;

    if (!tokenCode) {
      return res.status(400).json({ message: "Token code is required" });
    }

    const token = await Token.findOne({ tokenCode: tokenCode.toUpperCase() });

    if (!token) {
      return res.status(404).json({
        message: "Token not found",
        reason: "invalid",
      });
    }

    if (token.isDeleted) {
      return res.status(410).json({
        message: "Token has been deactivated",
        reason: "deleted",
      });
    }

    if (token.isUsed) {
      return res.status(410).json({
        message: "Token has already been used",
        reason: "used",
        usedAt: token.usedAt,
      });
    }

    if (new Date() > token.expiresAt) {
      return res.status(410).json({
        message: "Token has expired",
        reason: "expired",
        expiresAt: token.expiresAt,
      });
    }

    res.json({
      valid: true,
      tokenId: token._id,
      expiresAt: token.expiresAt,
      status: token.getStatus(),
    });
  } catch (error) {
    console.error("Validate token error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
