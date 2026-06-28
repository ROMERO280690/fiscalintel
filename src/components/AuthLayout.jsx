import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0B14] via-[#1A1C2E] to-[#0D0E1A] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00C7D9] to-[#00A8BD] mb-4 shadow-lg shadow-[#00C7D9]/20">
            <Icon className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="text-slate-400 mt-2">{subtitle}</p>}
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-slate-400 mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}