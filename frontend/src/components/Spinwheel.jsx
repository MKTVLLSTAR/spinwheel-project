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

  useEffect(() => {
    fetchPrizes();
  }, []);

  useEffect(() => {
    if (prizes.length > 0 && !isLoadingPrizes) {
      console.log(
        "🎨 Drawing wheel with prizes (Backend order):",
        prizes.map((p, i) => `${i}: ${p.name} (ID: ${p._id.slice(-6)})`)
      );
      drawWheel();
    }
  }, [prizes, isLoadingPrizes]);

  const fetchPrizes = async () => {
    try {
      setIsLoadingPrizes(true);
      console.log(
        "📡 Fetching prizes from:",
        api.defaults.baseURL + "/wheel/prizes"
      );

      const response = await api.get("/wheel/prizes");
      console.log("📦 Raw prizes from backend:", response.data);

      if (response.data && Array.isArray(response.data)) {
        // ใช้ลำดับเดียวกับที่ Backend ส่งมา (เรียงตาม createdAt: 1)
        setPrizes(response.data);
        setError("");
        console.log(
          "✅ Prizes in exact backend order:",
          response.data.map((p, i) => `${i}: ${p.name}`)
        );
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

    console.log("🎨 Drawing wheel with", prizes.length, "prizes");

    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 30;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw outer golden ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 25, 0, 2 * Math.PI);
    const outerGradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );
    outerGradient.addColorStop(0, "#FFD700");
    outerGradient.addColorStop(0.3, "#FFA500");
    outerGradient.addColorStop(0.7, "#FF8C00");
    outerGradient.addColorStop(1, "#FFD700");
    ctx.fillStyle = outerGradient;
    ctx.fill();

    // Draw inner dark red ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#8B0000";
    ctx.fill();

    // Draw decorative golden studs
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

    // สำคัญ: ใช้การคำนวณแบบเดียวกับ Backend
    const anglePerSegment = (2 * Math.PI) / prizes.length;

    // กำหนดสีรางวัล
    const redGoldColors = [
      "#DC143C",
      "#B22222",
      "#8B0000",
      "#A0522D",
      "#CD853F",
      "#DAA520",
      "#B8860B",
      "#FF6347",
      "#D2691E",
      "#FF4500",
      "#FF0000",
      "#8B4513",
    ];

    // วาดรางวัลแต่ละชิ้น โดยเริ่มจากด้านบนและหมุนตามเข็มนาฬิกา
    prizes.forEach((prize, index) => {
      // เริ่มจากด้านบน (-90°) และหมุนตามเข็มนาฬิกา
      const startAngle = -Math.PI / 2 + index * anglePerSegment;
      const endAngle = startAngle + anglePerSegment;

      const segmentColor =
        prize.color || redGoldColors[index % redGoldColors.length];

      console.log(
        `🎨 Drawing segment ${index}: "${prize.name}" from ${(
          (startAngle * 180) /
          Math.PI
        ).toFixed(1)}° to ${((endAngle * 180) / Math.PI).toFixed(1)}°`
      );

      // วาดส่วนหลัก
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);

      // สร้าง gradient
      const segmentGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      segmentGradient.addColorStop(0, segmentColor + "DD");
      segmentGradient.addColorStop(1, segmentColor);
      ctx.fillStyle = segmentGradient;
      ctx.fill();

      // วาดเส้นขอบทอง
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.stroke();

      // เพิ่มเงา
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

      // เส้นขอบทอง
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 4;
      ctx.strokeText(prize.name, 0, 0);

      // เส้นขอบดำ
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.strokeText(prize.name, 0, 0);

      // ข้อความสีขาว
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

    const centerGradient = ctx.createRadialGradient(
      centerX - 8,
      centerY - 8,
      0,
      centerX,
      centerY,
      25
    );
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

    if (prizes.length === 0) {
      setError("ไม่มีรางวัลให้หมุน กรุณารอสักครู่หรือรีเฟรชหน้า");
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

      // ค้นหารางวัลจาก Backend response
      const winningPrizeId = response.data.prize._id;
      console.log("🎯 Backend selected prize ID:", winningPrizeId);
      console.log("🎯 Backend selected prize name:", response.data.prize.name);

      // ค้นหา index ของรางวัลใน Frontend array
      const prizeIndex = prizes.findIndex((p) => p._id === winningPrizeId);
      console.log("🔍 Prize index in frontend array:", prizeIndex);

      if (prizeIndex === -1) {
        console.error("❌ Cannot find winning prize in frontend prizes array");
        console.log("Backend prize ID:", winningPrizeId);
        console.log(
          "Frontend prize IDs:",
          prizes.map((p) => ({ name: p.name, id: p._id }))
        );
        setError("เกิดข้อผิดพลาดในการค้นหารางวัล");
        setIsSpinning(false);
        return;
      }

      console.log(
        "✅ Found prize at index:",
        prizeIndex,
        "Name:",
        prizes[prizeIndex].name
      );

      // คำนวณการหมุน - ใช้วิธีเดียวกับการวาด Canvas
      const anglePerSegment = 360 / prizes.length;

      // ตำแหน่งของรางวัลบนวงล้อ (index 0 = 0°, index 1 = anglePerSegment°, ...)
      const prizeAngleOnWheel = prizeIndex * anglePerSegment;

      // เข็มอยู่ที่ด้านบน (0°) เราต้องหมุนให้รางวัลมาอยู่ตำแหน่งนั้น
      // เนื่องจากวงล้อหมุนตามเข็มนาฬิกา เราต้องหมุนในทิศทางตรงข้าม
      const targetRotation = -prizeAngleOnWheel;

      console.log(
        `📐 Prize ${prizeIndex} is at ${prizeAngleOnWheel}° on wheel`
      );
      console.log(
        `🎯 Need to rotate wheel by ${targetRotation}° to bring prize to pointer`
      );

      // เพิ่มการหมุนหลายรอบเพื่อให้สวยงาม
      const spins = 5 + Math.random() * 3; // หมุน 5-8 รอบ
      const randomOffset = (Math.random() - 0.5) * 10; // ความสุ่ม ±5°
      const finalRotation = 360 * spins + targetRotation + randomOffset;

      console.log(`🎢 Final rotation calculation:`);
      console.log(`   - Base spins: ${(360 * spins).toFixed(1)}°`);
      console.log(`   - Target: ${targetRotation.toFixed(1)}°`);
      console.log(`   - Random: ${randomOffset.toFixed(1)}°`);
      console.log(`   - Total: ${finalRotation.toFixed(1)}°`);

      setRotation((prev) => {
        const newRotation = prev + finalRotation;
        console.log(
          `🔄 Wheel rotation: ${prev.toFixed(1)}° → ${newRotation.toFixed(1)}°`
        );
        return newRotation;
      });

      // แสดงผลลัพธ์หลังจากหมุนเสร็จ
      setTimeout(() => {
        console.log("🎉 Spin animation completed!");
        console.log("🏆 Winner should be:", response.data.prize.name);
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
    if (typeof window === "undefined")
      return { frame: 500, canvas: 450, container: 480 };

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

          {/* Golden particles */}
          {[...Array(15)].map((_, i) => (
            <div
              key={`gold-${i}`}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <Sparkles
                className="text-yellow-400 opacity-30"
                size={Math.random() * 12 + 6}
              />
            </div>
          ))}
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-2 sm:px-4 py-4">
          <div className="max-w-7xl mx-auto text-center w-full">
            {/* Header */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <div className="flex items-center justify-center mb-2 sm:mb-4">
                <Crown className="w-8 h-8 sm:w-12 lg:w-16 text-yellow-400 mr-2 sm:mr-4" />
                <h1 className="text-3xl sm:text-5xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 drop-shadow-lg">
                  วงล้อ ALLSTAR
                </h1>
                <Crown className="w-8 h-8 sm:w-12 lg:w-16 text-yellow-400 ml-2 sm:mr-4" />
              </div>
              <div className="bg-gradient-to-r from-yellow-400 to-red-500 h-0.5 lg:h-1 w-32 sm:w-48 lg:w-64 mx-auto rounded-full mb-2 sm:mb-4"></div>
              <p className="text-sm sm:text-lg lg:text-2xl text-yellow-200 mb-1 sm:mb-2 px-2">
                ใส่โค้ดโทเค็นแล้วหมุนเพื่อลุ้นรางวัล!
              </p>
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 text-yellow-300">
                <Star className="w-4 h-4 sm:w-5 lg:w-6" />
                <span className="text-sm sm:text-base lg:text-lg">
                  โชคดีๆ ทู๊กกกกกโคนนนนนนนนนน
                </span>
                <Star className="w-4 h-4 sm:w-5 lg:w-6" />
              </div>
            </div>

            {/* Loading State */}
            {isLoadingPrizes && (
              <div className="mb-6 text-center">
                <div className="inline-flex items-center space-x-2 text-yellow-200">
                  <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังโหลดรางวัล...</span>
                </div>
              </div>
            )}

            {/* Wheel Container */}
            {!isLoadingPrizes && prizes.length > 0 && (
              <div className="relative mb-4 sm:mb-6 lg:mb-8 flex items-center justify-center my-10 md:mt-20">
                <div className="relative flex items-center justify-center">
                  {/* Decorative Frame */}
                  <div
                    className="absolute rounded-full border-4 sm:border-6 lg:border-8 border-yellow-400 shadow-2xl flex items-center justify-center"
                    style={{
                      width: `${wheelSize.frame}px`,
                      height: `${wheelSize.frame}px`,
                      background:
                        "conic-gradient(from 0deg, #FFD700, #FF8C00, #DC143C, #8B0000, #FFD700)",
                      padding: "8px",
                    }}
                  >
                    <div className="w-full h-full rounded-full border-2 sm:border-3 lg:border-4 border-red-800 bg-gradient-to-r from-red-900 to-yellow-900"></div>
                  </div>

                  {/* Corner Ornaments */}
                  {[
                    { pos: "top-left", icon: Crown, top: -24, left: -24 },
                    { pos: "top-right", icon: Trophy, top: -24, right: -24 },
                    { pos: "bottom-left", icon: Gift, bottom: -24, left: -24 },
                    {
                      pos: "bottom-right",
                      icon: Star,
                      bottom: -24,
                      right: -24,
                    },
                  ].map(({ pos, icon: Icon, ...style }) => (
                    <div
                      key={pos}
                      className="absolute w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-yellow-400 rounded-full flex items-center justify-center border-2 sm:border-3 lg:border-4 border-red-800"
                      style={style}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-800" />
                    </div>
                  ))}

                  {/* Main Wheel */}
                  <div
                    className="relative flex items-center justify-center"
                    style={{
                      width: `${wheelSize.container}px`,
                      height: `${wheelSize.container}px`,
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={wheelSize.canvas}
                      height={wheelSize.canvas}
                      className="rounded-full transition-transform duration-[4000ms] ease-out shadow-2xl"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        filter: "drop-shadow(0 15px 35px rgba(0,0,0,0.5))",
                      }}
                    />

                    {/* Pointer - ชี้ที่ด้านบน */}
                    <div
                      className="absolute flex items-center justify-center"
                      style={{
                        top: `-${wheelSize.canvas < 400 ? "35" : "45"}px`,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 10,
                      }}
                    >
                      <div className="relative">
                        <div
                          className="bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 rounded-t-full border-3 border-red-800 shadow-lg"
                          style={{
                            width: wheelSize.canvas < 400 ? "16px" : "24px",
                            height: wheelSize.canvas < 400 ? "25px" : "35px",
                          }}
                        ></div>

                        <div
                          className="absolute left-1/2 transform -translate-x-1/2"
                          style={{
                            bottom: wheelSize.canvas < 400 ? "-12px" : "-18px",
                            width: 0,
                            height: 0,
                            borderLeft: `${
                              wheelSize.canvas < 400 ? "8" : "12"
                            }px solid transparent`,
                            borderRight: `${
                              wheelSize.canvas < 400 ? "8" : "12"
                            }px solid transparent`,
                            borderTop: `${
                              wheelSize.canvas < 400 ? "15" : "20"
                            }px solid #EAB308`,
                            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                          }}
                        ></div>

                        <div
                          className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-red-500 to-red-700 rounded-full border-2 border-yellow-200 shadow-sm"
                          style={{
                            width: wheelSize.canvas < 400 ? "8px" : "12px",
                            height: wheelSize.canvas < 400 ? "8px" : "12px",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Prizes State */}
            {!isLoadingPrizes && prizes.length === 0 && !error && (
              <div className="mb-6 p-8 bg-gradient-to-r from-red-900/50 to-yellow-900/50 backdrop-blur-xl rounded-2xl border-2 border-yellow-400">
                <Gift className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl text-yellow-200 mb-2">ยังไม่มีรางวัล</h3>
                <p className="text-yellow-300 mb-4">
                  กรุณาติดต่อ Admin เพื่อเพิ่มรางวัลในระบบ
                </p>
                <button
                  onClick={fetchPrizes}
                  className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-red-900 rounded-lg font-medium transition-colors duration-200"
                >
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            )}

            {/* Token Input */}
            {!isLoadingPrizes && prizes.length > 0 && (
              <div className="bg-gradient-to-r from-red-900/50 to-yellow-900/50 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-6 lg:p-8 mb-6 border-2 border-yellow-400 shadow-2xl max-w-4xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
                  <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6">
                    <div className="p-4 lg:p-5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-lg border-2 border-red-800">
                      <Coins className="w-8 h-8 lg:w-12 lg:h-12 text-red-800" />
                    </div>
                    <input
                      type="text"
                      placeholder="รหัสโทเค็น 8 ตัวอักษร"
                      value={tokenCode}
                      onChange={(e) =>
                        setTokenCode(e.target.value.toUpperCase())
                      }
                      className="px-6 lg:px-8 py-4 lg:py-5 rounded-xl lg:rounded-2xl border-3 border-yellow-400 bg-red-800/40 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-yellow-400/50 focus:border-yellow-300 text-center font-mono text-xl lg:text-2xl uppercase tracking-widest text-yellow-100 placeholder-yellow-300/50 w-full sm:w-80 lg:w-96 font-bold shadow-inner placeholder:text-sm placeholder:font-normal"
                      maxLength={8}
                      disabled={isSpinning}
                      style={{
                        backgroundColor: "rgba(139, 0, 0, 0.6)",
                        textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSpin}
                    disabled={
                      isSpinning || !tokenCode.trim() || prizes.length === 0
                    }
                    className={`px-8 lg:px-12 py-4 lg:py-5 rounded-xl lg:rounded-2xl font-bold text-lg lg:text-xl transition-all duration-300 transform border-2 w-full sm:w-auto ${
                      isSpinning || !tokenCode.trim() || prizes.length === 0
                        ? "bg-gray-600 cursor-not-allowed opacity-50 border-gray-500"
                        : "bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 hover:from-yellow-300 hover:via-red-400 hover:to-yellow-300 text-red-900 shadow-2xl hover:shadow-yellow-400/25 hover:scale-105 active:scale-95 border-yellow-300"
                    }`}
                  >
                    {isSpinning ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-6 h-6 border-3 border-red-800 border-t-transparent rounded-full animate-spin"></div>
                        <span>กำลังหมุน...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-3">
                        <span>หมุนเลย!</span>
                        <Crown className="w-6 h-6" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-600/30 border-2 border-red-400 text-red-200 px-6 py-4 rounded-xl lg:rounded-2xl mb-6 backdrop-blur-sm max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">⚠️</span>
                  <span className="text-lg font-medium">{error}</span>
                </div>
                <div className="mt-2 text-center">
                  <button
                    onClick={fetchPrizes}
                    className="px-4 py-2 bg-red-500/50 hover:bg-red-500/70 text-red-100 rounded-lg transition-colors duration-200 text-sm"
                  >
                    ลองโหลดรางวัลใหม่
                  </button>
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="bg-gradient-to-r from-yellow-400 to-red-500 rounded-2xl lg:rounded-3xl p-6 lg:p-8 mb-6 shadow-2xl transform animate-bounce border-4 border-yellow-300 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-5xl lg:text-6xl mb-4">👑</div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-red-900 mb-4">
                    ยินดีด้วย!
                  </h3>
                  <div className="bg-red-900/20 backdrop-blur-sm rounded-xl lg:rounded-2xl p-6 mb-4 border-2 border-yellow-300">
                    <p className="text-xl lg:text-2xl text-red-900 mb-2">
                      คุณได้รับรางวัล:
                    </p>
                    <p className="text-3xl lg:text-4xl font-bold text-yellow-800 mb-2">
                      {result.name}
                    </p>
                    {result.description && (
                      <p className="text-lg text-red-800">
                        {result.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={resetWheel}
                    className="px-8 py-3 bg-red-900/30 hover:bg-red-900/50 text-yellow-100 rounded-xl transition-all duration-200 inline-flex items-center gap-3 backdrop-blur-sm font-medium border-2 border-yellow-400"
                  >
                    <RotateCcw className="w-5 h-5" />
                    หมุนใหม่อีกครั้ง
                  </button>
                </div>
              </div>
            )}

            {/* Prize List */}
            {!isLoadingPrizes && prizes.length > 0 && (
              <div className="bg-gradient-to-r from-red-900/50 to-yellow-900/50 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-6 lg:p-8 border-2 border-yellow-400 shadow-2xl max-w-6xl mx-auto">
                <h3 className="text-xl lg:text-2xl font-bold text-yellow-200 mb-6 flex items-center justify-center">
                  <Trophy className="w-6 h-6 lg:w-8 lg:h-8 mr-3 text-yellow-400" />
                  รางวัลทั้งหมด ({prizes.length} รางวัล)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                  {prizes.map((prize, index) => (
                    <div
                      key={prize._id}
                      className="p-3 lg:p-4 rounded-xl lg:rounded-2xl text-yellow-100 border-2 border-yellow-400/50 backdrop-blur-sm hover:bg-yellow-400/10 transition-all duration-300 transform hover:scale-105 shadow-lg"
                      style={{
                        backgroundColor: `${prize.color}20`,
                      }}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center text-xl lg:text-2xl mb-2">
                          <Gift className="text-orange-500" />
                        </div>
                        <div className="font-bold text-sm lg:text-lg mb-1">
                          {prize.name}
                        </div>
                        {prize.description && (
                          <div className="text-xs lg:text-sm opacity-80">
                            {prize.description}
                          </div>
                        )}
                        <div className="text-xs text-yellow-300 mt-2 font-mono">
                          #{index} •{" "}
                          {(index * (360 / prizes.length)).toFixed(0)}° •{" "}
                          {prize.probability}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Debug Info */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-8 bg-black/70 text-white p-4 rounded-lg text-left max-w-4xl mx-auto text-sm">
                <h4 className="font-bold mb-2 text-green-400">
                  🎯 FRONTEND-ONLY FIX - Matches Backend Logic!
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-green-400">
                      ✅ API Base URL: {api.defaults.baseURL}
                    </p>
                    <p className="text-blue-400">
                      🎁 Prizes loaded: {prizes.length}
                    </p>
                    <p className="text-purple-400">
                      ⏳ Is loading: {isLoadingPrizes.toString()}
                    </p>
                    <p className="text-red-400">❌ Has error: {!!error}</p>
                    <p className="text-yellow-400">
                      🔄 Current rotation: {rotation.toFixed(1)}°
                    </p>
                  </div>
                  <div>
                    {prizes.length > 0 && (
                      <>
                        <p className="font-bold text-cyan-400 mb-1">
                          🎯 Prize positions (Backend order):
                        </p>
                        <div className="max-h-32 overflow-y-auto">
                          {prizes.map((prize, index) => {
                            const angle = (
                              (index * 360) /
                              prizes.length
                            ).toFixed(0);
                            return (
                              <p
                                key={prize._id}
                                className="text-xs text-gray-300"
                              >
                                #{index}: {prize.name} → {angle}° (ID:{" "}
                                {prize._id.slice(-6)})
                              </p>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-600">
                  <p className="text-xs text-green-400">
                    ✨ Frontend คำนวณตำแหน่งแบบเดียวกับ Backend - ไม่ต้องแก้
                    Railway!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SpinWheel;
