import React, { useState, useEffect, useRef } from "react";
import {
  Gift,
  Coins,
  RotateCcw,
  Crown,
  Trophy,
  Star,
  Sparkles,
} from "lucide-react";
import api from "../utils/api";

const SpinWheel = () => {
  const [prizes, setPrizes] = useState([]);
  const [tokenCode, setTokenCode] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [rotation, setRotation] = useState(0);
  const [isLoadingPrizes, setIsLoadingPrizes] = useState(true);
  const canvasRef = useRef(null);

  // 🔥 กำหนดให้วงล้อมีแค่ 8 ช่องเสมอ
  const WHEEL_SLOTS = 8;
  const DEGREES_PER_SLOT = 360 / WHEEL_SLOTS; // 45 degrees per slot

  useEffect(() => {
    fetchPrizes();
  }, []);

  useEffect(() => {
    if (prizes.length > 0 && !isLoadingPrizes) {
      console.log("🎨 Drawing wheel with prizes:", prizes.map((p, i) => `${i}: ${p.name}`));
      drawWheel();
    }
  }, [prizes, isLoadingPrizes]);

  const fetchPrizes = async () => {
    try {
      setIsLoadingPrizes(true);
      console.log("📡 Fetching prizes from:", api.defaults.baseURL + "/wheel/prizes");

      const response = await api.get("/wheel/prizes");
      console.log("📦 Raw prizes from backend:", response.data);

      if (response.data && Array.isArray(response.data)) {
        // Backend จะส่งมา 8 รางวัลเสมอ (รวมช่องว่าง)
        if (response.data.length !== WHEEL_SLOTS) {
          console.warn(`⚠️ Expected ${WHEEL_SLOTS} prizes, got ${response.data.length}`);
        }
        
        setPrizes(response.data);
        setError("");
        console.log("✅ Wheel configured with", response.data.length, "slots");
      } else {
        console.error("❌ Invalid prizes data format:", response.data);
        setError("ข้อมูลรางวัลไม่ถูกต้อง");
        setPrizes([]);
      }
    } catch (err) {
      console.error("❌ Error fetching prizes:", err);
      setError(
        "ไม่สามารถโหลดรางวัลได้: " +
          (err.response?.data?.message || err.message)
      );
      setPrizes([]);
    } finally {
      setIsLoadingPrizes(false);
    }
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas || prizes.length === 0) {
      console.log("❌ Cannot draw wheel: canvas or prizes missing");
      return;
    }

    console.log(`🎨 Drawing wheel with ${prizes.length} prizes (should be ${WHEEL_SLOTS})`);

    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 30;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw outer decorative rings
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 25, 0, 2 * Math.PI);
    const outerGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    outerGradient.addColorStop(0, "#FFD700");
    outerGradient.addColorStop(0.3, "#FFA500");
    outerGradient.addColorStop(0.7, "#FF8C00");
    outerGradient.addColorStop(1, "#FFD700");
    ctx.fillStyle = outerGradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#8B0000";
    ctx.fill();

    // Draw decorative studs
    const studCount = 24;
    for (let i = 0; i < studCount; i++) {
      const angle = (i / studCount) * 2 * Math.PI;
      const studX = centerX + Math.cos(angle) * (radius + 15);
      const studY = centerY + Math.sin(angle) * (radius + 15);

      ctx.beginPath();
      ctx.arc(studX, studY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "#FFD700";
      ctx.fill();
      ctx.strokeStyle = "#B8860B";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 🔥 วาดรางวัล 8 ช่อง โดยเริ่มจากด้านบน (12 o'clock) และเรียงตามเข็มนาฬิกา
    const anglePerSegment = (2 * Math.PI) / WHEEL_SLOTS;
    
    const defaultColors = [
      "#DC143C", "#1E40AF", "#059669", "#D97706", 
      "#7C3AED", "#BE185D", "#0891B2", "#65A30D"
    ];

    prizes.forEach((prize, index) => {
      // เริ่มจากด้านบน (-90°) และหมุนตามเข็มนาฬิกา
      const startAngle = -Math.PI / 2 + index * anglePerSegment;
      const endAngle = startAngle + anglePerSegment;

      const segmentColor = prize.color || defaultColors[index % defaultColors.length];

      console.log(`🎨 Drawing slot ${index}: "${prize.name}" from ${((startAngle * 180) / Math.PI).toFixed(1)}° to ${((endAngle * 180) / Math.PI).toFixed(1)}°`);

      // วาดส่วนหลัก
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);

      const segmentGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      segmentGradient.addColorStop(0, segmentColor + "DD");
      segmentGradient.addColorStop(1, segmentColor);
      ctx.fillStyle = segmentGradient;
      ctx.fill();

      // เส้นขอบทอง
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.stroke();

      // เงาใน
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 15, startAngle, endAngle);
      ctx.fillStyle = "rgba(255, 215, 0, 0.2)";
      ctx.fill();

      // วาดข้อความ
      const textAngle = startAngle + anglePerSegment / 2;
      const textRadius = radius * 0.7;
      const textX = centerX + Math.cos(textAngle) * textRadius;
      const textY = centerY + Math.sin(textAngle) * textRadius;

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);

      const fontSize = window.innerWidth < 768 ? 14 : 18;
      ctx.font = `bold ${fontSize}px "Prompt", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // เส้นขอบข้อความ
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 4;
      ctx.strokeText(prize.name, 0, 0);

      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.strokeText(prize.name, 0, 0);

      // ข้อความ
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(prize.name, 0, 0);

      ctx.restore();
    });

    // วาดวงกลมตรงกลาง
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFD700";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = "#8B0000";
    ctx.fill();

    const centerGradient = ctx.createRadialGradient(centerX - 8, centerY - 8, 0, centerX, centerY, 25);
    centerGradient.addColorStop(0, "#FFFF99");
    centerGradient.addColorStop(0.5, "#FFD700");
    centerGradient.addColorStop(1, "#B8860B");

    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = centerGradient;
    ctx.fill();

    ctx.strokeStyle = "#8B0000";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const handleSpin = async () => {
    if (!tokenCode.trim()) {
      setError("กรุณาใส่โค้ดโทเค็น");
      return;
    }

    if (prizes.length !== WHEEL_SLOTS) {
      setError("ระบบวงล้อยังไม่พร้อม กรุณารอสักครู่หรือรีเฟรชหน้า");
      return;
    }

    setIsSpinning(true);
    setError("");
    setResult(null);

    try {
      console.log("🎲 Spinning with token:", tokenCode.trim());
      const response = await api.post("/wheel/spin", {
        tokenCode: tokenCode.trim(),
      });

      console.log("📨 Backend spin response:", response.data);

      // 🔥 ใช้ wheelPosition ที่ Backend ส่งมาโดยตรง
      const winningPosition = response.data.wheelPosition;
      console.log("🎯 Backend selected position:", winningPosition);

      if (winningPosition < 0 || winningPosition >= WHEEL_SLOTS) {
        console.error("❌ Invalid wheel position:", winningPosition);
        setError("ตำแหน่งรางวัลไม่ถูกต้อง");
        setIsSpinning(false);
        return;
      }

      // 🔥 คำนวณการหมุนให้ตรงกับตำแหน่งที่ Backend กำหนด
      // เข็มอยู่ที่ด้านบน (0°) ต้องหมุนให้รางวัลมาอยู่ตำแหน่งนั้น
      const targetAngle = winningPosition * DEGREES_PER_SLOT;
      const finalTargetAngle = -targetAngle; // หมุนทวนเข็มนาฬิกาเพื่อให้รางวัลมาอยู่ที่เข็ม
      
      // เพิ่มการหมุนหลายรอบ + random offset เล็กน้อย
      const spins = 5 + Math.random() * 3; // 5-8 รอบ
      const randomOffset = (Math.random() - 0.5) * 8; // ±4 degrees
      const totalRotation = 360 * spins + finalTargetAngle + randomOffset;

      console.log(`🎢 Rotation calculation:`);
      console.log(`   - Winning position: ${winningPosition}`);
      console.log(`   - Target angle: ${targetAngle}°`);
      console.log(`   - Final target: ${finalTargetAngle}°`);
      console.log(`   - Spins: ${(360 * spins).toFixed(1)}°`);
      console.log(`   - Random offset: ${randomOffset.toFixed(1)}°`);
      console.log(`   - Total rotation: ${totalRotation.toFixed(1)}°`);

      setRotation((prev) => {
        const newRotation = prev + totalRotation;
        console.log(`🔄 Wheel rotation: ${prev.toFixed(1)}° → ${newRotation.toFixed(1)}°`);
        return newRotation;
      });

      // แสดงผลลัพธ์หลังจากหมุนเสร็จ
      setTimeout(() => {
        console.log("🎉 Spin animation completed!");
        console.log("🏆 Winner:", response.data.prize.name);
        setResult(response.data.prize);
        setIsSpinning(false);
        setTokenCode("");
      }, 4000);

    } catch (err) {
      console.error("❌ Spin error:", err);
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด");
      setIsSpinning(false);
    }
  };

  const resetWheel = () => {
    setResult(null);
    setError("");
  };

  // Get responsive wheel size
  const getWheelSize = () => {
    if (typeof window === "undefined") return { frame: 500, canvas: 450, container: 480 };

    const screenWidth = window.innerWidth;
    if (screenWidth < 640) {
      const size = Math.min(screenWidth * 0.9, 380);
      return {
        frame: size,
        canvas: size - 50,
        container: size - 20,
      };
    } else if (screenWidth < 1024) {
      return {
        frame: 450,
        canvas: 400,
        container: 430,
      };
    } else {
      return {
        frame: 600,
        canvas: 550,
        container: 580,
      };
    }
  };

  const wheelSize = getWheelSize();

  return (
    <>
      {/* Global Prompt Font Import */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
          
          * {
            font-family: 'Prompt', sans-serif !important;
          }

          input {
            font-size: 16px !important;
          }

          html {
            scroll-behavior: smooth;
          }
        `}
      </style>

      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-yellow-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <Star
                className="text-yellow-300 opacity-40"
                size={Math.random() * 15 + 8}
              />
            </div>
          ))}

          {[...Array(15)].map((_, i) => (
            <div
              key={`gold-${i}`}
              className="absolute animate-