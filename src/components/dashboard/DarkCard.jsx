import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function DarkCard({ title, icon: Icon, iconColor = "text-violet-400", children, className = "", linkTo, linkLabel }) {
  return (
    <div className={`bg-white/5 border border-white/8 rounded-xl p-4 hover:bg-white/6 transition-colors ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-3.5 h-3.5 ${iconColor}`} />}
          <h3 className="text-[12px] font-semibold text-white/80">{title}</h3>
        </div>
        {linkTo && (
          <Link to={linkTo} className="text-[10px] text-white/30 hover:text-violet-400 flex items-center gap-0.5 transition-colors">
            {linkLabel || "Ver todo"} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}