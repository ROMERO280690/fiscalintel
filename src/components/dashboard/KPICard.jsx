import React from "react";

const colorMap = {
  violet: { bg: "bg-violet-500/15", icon: "text-violet-400", val: "text-white" },
  blue:   { bg: "bg-blue-500/15",   icon: "text-blue-400",   val: "text-white" },
  indigo: { bg: "bg-indigo-500/15", icon: "text-indigo-400", val: "text-white" },
  green:  { bg: "bg-emerald-500/15",icon: "text-emerald-400",val: "text-emerald-300" },
  amber:  { bg: "bg-amber-500/15",  icon: "text-amber-400",  val: "text-amber-300" },
  red:    { bg: "bg-red-500/15",    icon: "text-red-400",    val: "text-red-300" },
};

export default function KPICard({ label, value, delta, color = "violet", icon: Icon, sub }) {
  const c = colorMap[color] || colorMap.violet;
  return (
    <div className="bg-white/5 border border-white/8 rounded-xl p-3.5 hover:bg-white/8 transition-colors">
      <div className="flex items-center justify-between mb-2">
        {Icon && (
          <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center`}>
            <Icon className={`w-3.5 h-3.5 ${c.icon}`} />
          </div>
        )}
        {delta !== undefined && (
          <span className={`text-[10px] font-semibold ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {delta >= 0 ? "+" : ""}{delta}%
          </span>
        )}
      </div>
      <p className={`text-xl font-bold font-mono ${c.val}`}>{value}</p>
      <p className="text-[11px] text-white/50 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
    </div>
  );
}