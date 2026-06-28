import React from "react";

export default function DashboardShell({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="min-h-full">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-0.5">
          {Icon && <Icon className="w-4 h-4 text-violet-400" />}
          <h2 className="text-[13px] font-bold text-white/90 tracking-wide uppercase">{title}</h2>
        </div>
        <p className="text-[11px] text-white/40 ml-6">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}