"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Zone = "head" | "chest" | "abdomen" | "limbs";

const ZONE_MAP: Record<string, Zone> = {
  "airway": "head",
  "ems operations": "head",
  "clinical judgment": "head",
  "respiration": "chest",
  "ventilation": "chest",
  "cardiology": "chest",
  "trauma": "limbs",
  "medical": "abdomen",
  "medical & obgyn": "abdomen",
  "obgyn": "abdomen",
};

type CategoryPerformanceStore = Record<
  string,
  { attempts: number; correct: number; total: number; lastPct: number; lastAt: number; lastMode: "exam" | "shift" | "study" }
>;

function safeJSON<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();
}

function zoneForDomain(domain: string): Zone {
  const d = norm(domain);

  // direct map
  if (ZONE_MAP[d]) return ZONE_MAP[d];

  // fuzzy contains
  for (const [k, z] of Object.entries(ZONE_MAP)) {
    if (d.includes(k)) return z;
  }

  // fallback
  return "chest";
}

export default function BodyHeatmap() {
  const [weakDomain, setWeakDomain] = useState<string>("Trauma");
  const [weakPct, setWeakPct] = useState<number>(0);
  const [activeZone, setActiveZone] = useState<Zone>("chest");

  useEffect(() => {
    const wd = localStorage.getItem("weakestDomain") || "Trauma";
    setWeakDomain(wd);
    setActiveZone(zoneForDomain(wd));

    // Pull the % from category-performance (the source of truth)
    const perf = safeJSON<CategoryPerformanceStore>(localStorage.getItem("category-performance"), {});
    const exact = perf[wd]?.lastPct;

    // If not exact match (due to naming differences), try normalized match:
    if (typeof exact === "number") {
      setWeakPct(exact);
    } else {
      const wdN = norm(wd);
      const foundKey = Object.keys(perf).find((k) => norm(k) === wdN) || Object.keys(perf).find((k) => wdN.includes(norm(k)) || norm(k).includes(wdN));
      setWeakPct(typeof perf[foundKey || ""]?.lastPct === "number" ? perf[foundKey || ""]!.lastPct : 0);
    }
  }, []);

  const { pulseColor, pulseFill } = useMemo(() => {
    const pct = weakPct;
    const color = pct < 60 ? "#EF4444" : "#F59E0B"; // red/orange
    const fill = pct < 60 ? "rgba(239, 68, 68, 0.18)" : "rgba(245, 158, 11, 0.18)";
    return { pulseColor: color, pulseFill: fill };
  }, [weakPct]);

  const href = `/station?category=${encodeURIComponent(weakDomain)}`;

  const strokeFor = (z: Zone) => (activeZone === z ? pulseColor : "rgba(255,255,255,0.2)");
  const strokeWFor = (z: Zone) => (activeZone === z ? 1.5 : 0.6);
  const fillFor = (z: Zone) => (activeZone === z ? pulseFill : "rgba(255,255,255,0.02)");
  const animateFor = (z: Zone) => (activeZone === z ? { opacity: [0.6, 1, 0.6] } : undefined);

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)] pointer-events-none" />

      {/* Scanner Line */}
      <motion.div
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 8, ease: "linear", repeat: Infinity }}
        className="absolute left-0 right-0 h-[2px] bg-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.8)] z-20 pointer-events-none"
      />

      {/* SVG Body (use onClick instead of Link inside svg) */}
      <svg
        width="240"
        height="420"
        viewBox="0 0 100 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="z-10 drop-shadow-[0_0_25px_rgba(59,130,246,0.15)]"
      >
        {/* HEAD */}
        <motion.path
          d="M50 12 L 65 20 L 62 45 L 50 55 L 38 45 L 35 20 Z"
          stroke={strokeFor("head")}
          strokeWidth={strokeWFor("head")}
          fill={fillFor("head")}
          animate={animateFor("head")}
          transition={{ duration: 2, repeat: Infinity }}
          className="cursor-pointer hover:fill-blue-500/20 transition-colors"
          onClick={() => (window.location.href = href)}
        />

        {/* CHEST */}
        <motion.path
          d="M52 58 L 85 62 L 75 95 L 52 90 Z"
          stroke={strokeFor("chest")}
          strokeWidth={strokeWFor("chest")}
          fill={fillFor("chest")}
          animate={animateFor("chest")}
          transition={{ duration: 2, repeat: Infinity }}
          className="cursor-pointer hover:fill-blue-500/20"
          onClick={() => (window.location.href = href)}
        />
        <motion.path
          d="M48 58 L 15 62 L 25 95 L 48 90 Z"
          stroke={strokeFor("chest")}
          strokeWidth={strokeWFor("chest")}
          fill={fillFor("chest")}
          animate={animateFor("chest")}
          transition={{ duration: 2, repeat: Infinity }}
          className="cursor-pointer hover:fill-blue-500/20"
          onClick={() => (window.location.href = href)}
        />
        <path d="M50 58 L 48 90 L 50 110 L 52 90 Z" fill="rgba(255,255,255,0.1)" />

        {/* ABDOMEN */}
        <motion.path
          d="M30 100 L 70 100 L 65 135 L 35 135 Z"
          stroke={strokeFor("abdomen")}
          strokeWidth={strokeWFor("abdomen")}
          fill={fillFor("abdomen")}
          animate={animateFor("abdomen")}
          transition={{ duration: 2, repeat: Infinity }}
          className="cursor-pointer hover:fill-blue-500/20"
          onClick={() => (window.location.href = href)}
        />

        {/* LIMBS */}
        <motion.path d="M15 62 L 5 80 L 12 85 L 25 70 Z" stroke="rgba(255,255,255,0.2)" fill="rgba(255,255,255,0.02)" />
        <motion.path d="M85 62 L 95 80 L 88 85 L 75 70 Z" stroke="rgba(255,255,255,0.2)" fill="rgba(255,255,255,0.02)" />

        <motion.path
          d="M35 135 L 65 135 L 60 180 L 40 180 Z"
          stroke={strokeFor("limbs")}
          strokeWidth={strokeWFor("limbs")}
          fill={fillFor("limbs")}
          animate={animateFor("limbs")}
          transition={{ duration: 2, repeat: Infinity }}
          className="cursor-pointer hover:fill-blue-500/20"
          onClick={() => (window.location.href = href)}
        />
      </svg>

      {/* HUD Labels */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-24 right-2 md:right-16 text-right"
      >
        <div className="flex items-center justify-end gap-2">
          <span className="text-[10px] font-black font-mono tracking-widest text-slate-300">DIAGNOSTIC</span>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: pulseColor }} />
        </div>

        <div
          className="bg-slate-900/80 border border-white/10 backdrop-blur-md px-3 py-2 rounded-lg mt-1 border-r-2"
          style={{ borderRightColor: pulseColor }}
        >
          <div className="text-[9px] text-slate-400 font-mono mb-0.5">PRIORITY FOCUS</div>
          <div className="text-xs font-black text-white">{weakDomain.toUpperCase()}</div>
          <div className="text-xs font-mono" style={{ color: pulseColor }}>
            {weakPct}% ACCURACY
          </div>
        </div>

        <Link href={href} className="text-[9px] underline text-slate-500 hover:text-white mt-1 block">
          Tap body to fix &rarr;
        </Link>
      </motion.div>

      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-20 left-2 md:left-16"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black font-mono tracking-widest text-emerald-500">SYSTEM STABLE</span>
        </div>
        <div className="h-[1px] w-12 bg-emerald-500/30 my-1" />
        <div className="text-[9px] text-slate-500 font-mono">
          Consistency trending up.
        </div>
      </motion.div>
    </div>
  );
}
