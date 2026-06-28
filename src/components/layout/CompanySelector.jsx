import React, { useState } from "react";
import { Building2, ChevronDown, GitBranch, Check, Plus } from "lucide-react";
import { useCompany } from "@/lib/CompanyContext";
import { Link } from "react-router-dom";

export default function CompanySelector({ collapsed = false }) {
  const {
    orgCompanies,
    companyBranches,
    activeCompany,
    activeBranch,
    setActiveCompany,
    setActiveBranch,
  } = useCompany();

  const [open, setOpen] = useState(false);

  if (!activeCompany && orgCompanies.length === 0) {
    return (
      <Link to="/companies"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00C7D9]/10 border border-[#00C7D9]/20 text-[#00C7D9] hover:bg-[#00C7D9]/20 transition-colors">
        <Plus className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span className="text-[12px] font-medium">Nueva empresa</span>}
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
      >
        {/* Color dot */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-[11px]"
          style={{ backgroundColor: activeCompany?.color || "#00C7D9" }}
        >
          {activeCompany?.fantasy_name?.[0] || activeCompany?.business_name?.[0] || "E"}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">
                {activeCompany?.fantasy_name || activeCompany?.business_name || "Sin empresa"}
              </p>
              {activeBranch && (
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-0.5">
                  <GitBranch className="w-2.5 h-2.5" /> {activeBranch.name}
                </p>
              )}
              {!activeBranch && (
                <p className="text-[10px] text-slate-400 truncate">{activeCompany?.cuit || "Todas las sucursales"}</p>
              )}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#1A1A2E] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[220px]">

            {/* Companies */}
            <div className="p-2">
              <p className="text-[10px] text-slate-500 uppercase font-semibold px-2 py-1.5 tracking-wider">Empresas</p>
              {orgCompanies.map(company => (
                <button
                  key={company.id}
                  onClick={() => { setActiveCompany(company); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ backgroundColor: company.color || "#00C7D9" }}
                  >
                    {company.fantasy_name?.[0] || company.business_name?.[0] || "E"}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[12px] font-medium text-white truncate">
                      {company.fantasy_name || company.business_name}
                    </p>
                    <p className="text-[10px] text-slate-400">{company.cuit}</p>
                  </div>
                  {activeCompany?.id === company.id && (
                    <Check className="w-3.5 h-3.5 text-[#00C7D9] flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Branches for active company */}
            {companyBranches.length > 0 && (
              <>
                <div className="border-t border-white/5 p-2">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold px-2 py-1.5 tracking-wider">Sucursales</p>
                  <button
                    onClick={() => { setActiveBranch(null); setOpen(false); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[12px] text-slate-300">Todas las sucursales</span>
                    {!activeBranch && <Check className="w-3 h-3 text-[#00C7D9] ml-auto" />}
                  </button>
                  {companyBranches.map(branch => (
                    <button
                      key={branch.id}
                      onClick={() => { setActiveBranch(branch); setOpen(false); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[12px] text-slate-300">{branch.name}</span>
                      {activeBranch?.id === branch.id && <Check className="w-3 h-3 text-[#00C7D9] ml-auto" />}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Manage */}
            <div className="border-t border-white/5 p-2">
              <Link
                to="/companies"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#00C7D9]" />
                <span className="text-[12px] text-[#00C7D9]">Gestionar empresas</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}