"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

const navItems = [
  { id: "dashboard", href: "/dashboard", label: "Station", icon: <GridIcon /> },
  { id: "sim", href: "/simulator", label: "Simulate", icon: <PulseIcon /> },
  { id: "study", href: "/study", label: "Study", icon: <LayersIcon /> },
  { id: "profile", href: "/profile", label: "Identity", icon: <UserIcon /> },
];

export default function Dock() {
  const pathname = usePathname();
  const [level, setLevel] = useState("EMT");

  // Sync theme with the rest of the app
  useEffect(() => {
    // We use an interval or event listener in a real app, 
    // but checking on mount/render is fine for this scope
    setLevel(localStorage.getItem("userLevel") || "EMT");
  }, []);

  const isP = level === "Paramedic";

  // Dynamic Theme Colors
  const theme = useMemo(() => ({
    activeBg: isP ? "bg-rose-500/20" : "bg-cyan-500/20",
    activeText: isP ? "text-rose-400" : "text-cyan-400",
    activeGlow: isP ? "shadow-[0_0_20px_rgba(244,63,94,0.4)]" : "shadow-[0_0_20px_rgba(34,211,238,0.4)]",
    border: isP ? "border-rose-500/20" : "border-cyan-500/20",
  }), [isP]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full px-4 max-w-[400px]">
      <div className="relative">
        
        {/* Outer Glow (Ambient) */}
        <div className={`absolute -inset-1 rounded-3xl blur-xl opacity-20 ${isP ? "bg-rose-600" : "bg-cyan-600"}`} />

        <nav className="relative flex items-center justify-between p-2 bg-[#020617]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={item.id} 
                href={item.href} 
                className="relative flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all group"
              >
                {/* Active Indicator (The "Spotlight") */}
                {isActive && (
                  <motion.div
                    layoutId="dock-pill"
                    className={`absolute inset-0 rounded-2xl ${theme.activeBg} border ${theme.border} ${theme.activeGlow}`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {/* Icon & Label */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <span className={`transition-colors duration-300 ${isActive ? theme.activeText : "text-slate-500 group-hover:text-slate-300"}`}>
                    {item.icon}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-300 ${isActive ? "text-white" : "text-slate-600 group-hover:text-slate-400"}`}>
                    {item.label}
                  </span>
                </div>

                {/* Active Dot (Small detail) */}
                {isActive && (
                   <motion.div 
                     layoutId="dock-dot"
                     className={`absolute bottom-1 w-1 h-1 rounded-full ${isP ? "bg-rose-500" : "bg-cyan-400"}`}
                   />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// --- Custom SVGs for the "Technical" Look ---

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
