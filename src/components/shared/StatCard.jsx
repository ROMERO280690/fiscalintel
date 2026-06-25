import React from "react";

export default function StatCard({ icon: Icon, label, value, subtitle, trend, color = "cyan" }) {
  const colorMap = {
    cyan: "bg-[#E0F7FA] text-[#00A8BD]",
    amber: "bg-amber-50 text-amber-600",
    coral: "bg-rose-50 text-rose-600",
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]} transition-transform group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <p className="text-[32px] font-bold text-[#1A1A2E] leading-none tracking-tight">{value}</p>
      <p className="text-[13px] font-medium text-slate-500 mt-1">{label}</p>
      {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}