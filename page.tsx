"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Dock from "@/components/Dock";
import Link from "next/link";
import { motion } from "framer-motion";
import { questions } from "@/lib/questions";

const icons: Record<string, string> = {
  // Existing
  "Patient Treatment": "🚑",
  "Primary Assessment": "👁️",
  "Secondary Assessment": "🩺",
  "Scene Size-Up": "⚠️",
  "EMS Operations": "🚁",
  "Clinical Judgment": "🧠",
  "Airway": "🫁",
  "Cardiology": "❤️",
  "Trauma": "🦴",
  "Medical & OBGYN": "👶",
  "Respiration": "😮‍💨", // Updated to allow Airway to keep 🫁
  "Ventilation": "💨",
  "Medical": "💊",

  // New Categories
  "Airway/Ventilation": "😷",         // Mask / BVM
  "Cardiology & Resuscitation": "⚡",   // Defibrillation
  "ECG & Arrhythmias": "📉",            // Rhythm Strip / Graph
  "ECG/Resuscitation": "💓",            // Beating Heart / ROSC
  "Medical Critical Care": "🚨",        // Critical Alert
  "Medical Emergencies (ALS)": "🏥",    // IV / ALS Skills
  "Pharmacology": "🧪",                 // Vials / Meds (Distinct from pill)
  "Trauma & Critical Care": "🩹",       // Bandage / Wound Care
  "Behavioral & Special Populations": "🌀", // Mental Health / Spiral
  "EMS Operations & Documentation": "📋", // Clipboard / PCR
  "Geriatrics & Special Populations": "👴", // Elderly
  "Medical Emergencies": "🤒",          // General Sickness
  "OB/GYN & Neonatal": "🤰",            // Pregnancy
  "Pediatrics": "🧸",                   // Teddy Bear
  "Pediatrics & OB": "🍼",              // Bottle / Newborn
  "Respiratory & Cardiac": "🫀",        // Anatomical Heart
  "Trauma & Bleeding": "🩸",    // Blood Drop
  "Pharmacology/Critical Care": "💉",
  "Airway & Respiratory": "🌬️",
  "Cardiac/Neuro/Endocrine": "⚕️",
"EMS Ops/Ethics/Documentation": "⚖️",
  "Trauma & Bleeding Control": "🩸",
"Airway & Ventilation": "😮‍💨",
"Cardiology/ECG & Arrest": "💓",
};

type Level = "EMT" | "Paramedic";

function safeJSON<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export default function StudyHub() {
  const [userLevel, setUserLevel] = useState<Level>("EMT");
  const [masteredIds, setMasteredIds] = useState<number[]>([]);
  const [weakDomain, setWeakDomain] = useState<string>("");

  // Keep this page “live”: refresh when user returns from Station
  const syncFromStorage = useCallback(() => {
    const storedLevel = (localStorage.getItem("userLevel") as Level) || "EMT";
    const normalized: Level = storedLevel === "Paramedic" ? "Paramedic" : "EMT";
    setUserLevel(normalized);

    const savedMastery = safeJSON<number[]>(localStorage.getItem("mastered-ids"), []);
    setMasteredIds(Array.isArray(savedMastery) ? savedMastery : []);

    const savedWeakness = localStorage.getItem("weakestDomain") || "";
    setWeakDomain(savedWeakness);
  }, []);

  useEffect(() => {
    syncFromStorage();

    const onFocus = () => syncFromStorage();
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncFromStorage();
    };
    const onStorage = (e: StorageEvent) => {
      // only re-sync when relevant keys change
      if (!e.key) return;
      if (["userLevel", "mastered-ids", "weakestDomain"].includes(e.key)) syncFromStorage();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, [syncFromStorage]);

  const isP = userLevel === "Paramedic";

  const theme = useMemo(
    () => ({
      bg: isP ? "bg-[#0B1022]" : "bg-[#0F172A]",
      accent: isP ? "text-rose-400" : "text-cyan-400",
      border: isP ? "border-rose-500/20" : "border-cyan-500/20",
      hoverBorder: isP ? "hover:border-rose-500/50" : "hover:border-cyan-500/50",
      hoverBg: isP ? "hover:bg-rose-500/5" : "hover:bg-cyan-500/5",
      ringColor: isP ? "#F43F5E" : "#22D3EE",
      gradient: isP ? "from-rose-600/20 to-transparent" : "from-cyan-600/20 to-transparent",
      drillBtn: isP ? "bg-rose-500/15 text-rose-200 border-rose-500/30 hover:bg-rose-500/25" : "bg-cyan-500/15 text-cyan-200 border-cyan-500/30 hover:bg-cyan-500/25",
      studyBtn: "bg-white text-black hover:scale-[1.02]",
    }),
    [isP]
  );

  // Questions for this level
  const levelQuestions = useMemo(() => {
    return questions.filter((q) => q.level === userLevel);
  }, [userLevel]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(levelQuestions.map((q) => q.category)));
    return cats.sort((a, b) => a.localeCompare(b));
  }, [levelQuestions]);

  const masteredSet = useMemo(() => new Set(masteredIds), [masteredIds]);

  const totalProgress = useMemo(() => {
    const total = levelQuestions.length || 1;
    const masteredCount = levelQuestions.reduce((acc, q) => acc + (masteredSet.has(q.id) ? 1 : 0), 0);
    return clamp(Math.round((masteredCount / total) * 100));
  }, [levelQuestions, masteredSet]);

  const getCategoryStats = useCallback(
    (category: string) => {
      const catQs = levelQuestions.filter((q) => q.category === category);
      const total = catQs.length || 0;
      const mastered = catQs.reduce((acc, q) => acc + (masteredSet.has(q.id) ? 1 : 0), 0);
      const pct = total ? clamp(Math.round((mastered / total) * 100)) : 0;
      return { total, mastered, pct };
    },
    [levelQuestions, masteredSet]
  );

  const donut = useMemo(() => {
    const r = 24;
    const c = 2 * Math.PI * r;
    return {
      r,
      c,
      offset: c - (totalProgress / 100) * c,
    };
  }, [totalProgress]);

  // Build links
  const studyLink = (cat: string) => `/station?mode=study&category=${encodeURIComponent(cat)}`; // untimed
  const drillLink = (cat: string) => `/station?category=${encodeURIComponent(cat)}`; // timed shift

  return (
    <div className={`min-h-screen ${theme.bg} text-white pb-32 relative overflow-hidden`}>
      {/* Background FX */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(transparent_50%,#fff_50%)] bg-[length:100%_4px]" />
      <div className={`fixed -top-40 -right-40 w-96 h-96 ${isP ? "bg-rose-600/10" : "bg-cyan-500/10"} blur-[100px] rounded-full`} />

      {/* Header */}
      <header className="px-6 pt-8 pb-6 relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${theme.border} ${theme.accent} bg-white/5`}>
                Library
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">{userLevel} Protocol</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Study Hub</h1>
            <p className="mt-2 text-[11px] text-slate-400 font-semibold">
              Tap a domain to study untimed. Use the drill button for a timed 15-minute shift.
            </p>
          </div>

          {/* Total Progress Donut */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r={donut.r} stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
              <circle
                cx="28"
                cy="28"
                r={donut.r}
                stroke={theme.ringColor}
                strokeWidth="4"
                fill="none"
                strokeDasharray={donut.c}
                strokeDashoffset={donut.offset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold">{totalProgress}%</span>
          </div>
        </div>

        {/* Weakness Banner */}
        {weakDomain && (
          <div className={`mt-6 p-4 rounded-xl border ${theme.border} bg-gradient-to-r ${theme.gradient} flex items-center justify-between gap-3`}>
            <div>
              <div className="text-[10px] text-white/60 uppercase tracking-widest font-bold mb-1">Priority Focus</div>
              <div className="text-lg font-black text-white">{weakDomain}</div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={studyLink(weakDomain)}
                className={`px-4 py-2 rounded-lg text-xs font-black border border-white/10 ${theme.studyBtn} transition-transform`}
              >
                STUDY
              </Link>
              <Link
                href={drillLink(weakDomain)}
                className={`px-4 py-2 rounded-lg text-xs font-black border ${theme.drillBtn} transition-colors`}
              >
                15-MIN DRILL
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Grid */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {categories.map((cat) => {
          const { pct, mastered, total } = getCategoryStats(cat);
          const radius = 18;
          const circumference = 2 * Math.PI * radius;
          const dashOffset = circumference - (pct / 100) * circumference;

          const isMastered = pct === 100;
          const isPriority = cat === weakDomain;

          return (
            <motion.div
              key={cat}
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              className={`relative bg-slate-900/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl group transition-all ${theme.hoverBorder} ${theme.hoverBg} overflow-hidden`}
            >
              {/* Priority Glow */}
              {isPriority && <div className={`absolute left-0 top-0 bottom-0 w-1 ${isP ? "bg-rose-500" : "bg-cyan-400"}`} />}

              <div className="flex items-center justify-between gap-3">
                {/* Left: Icon + Text */}
                <Link href={studyLink(cat)} className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-white/5 transition-transform group-hover:scale-110 ${
                      isMastered ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-300"
                    }`}
                    aria-hidden
                  >
                    {isMastered ? "✓" : icons[cat] || "📚"}
                  </div>

                  <div className="min-w-0">
                    <h3 className={`font-bold text-lg leading-tight truncate ${isPriority ? "text-white" : "text-slate-200"}`}>{cat}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {isPriority && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white font-bold uppercase tracking-wide">
                          Priority
                        </span>
                      )}
                      <p className={`text-xs ${isMastered ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                        {isMastered ? "MASTERED" : `${pct}% • ${mastered}/${total}`}
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Right: Ring + Drill button */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Progress Ring */}
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="none" />
                      <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke={isMastered ? "#10B981" : theme.ringColor}
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-black text-white/80">{pct}%</span>
                  </div>

                  {/* Timed Drill Action */}
                  <Link
                    href={drillLink(cat)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-black border transition-colors ${theme.drillBtn}`}
                    aria-label={`Start 15-minute drill for ${cat}`}
                  >
                    DRILL
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Dock />
    </div>
  );
}
