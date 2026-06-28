import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useCompany } from "@/lib/CompanyContext";
import TrialBanner from "@/components/shared/TrialBanner";

export default function AppLayout() {
  const location = useLocation();
  const { trialInfo } = useCompany();
  const isDashboard = location.pathname === "/";

  return (
    <div className="flex min-h-screen bg-[#0A0B14]">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {trialInfo && trialInfo.daysLeft <= 30 && !trialInfo.expired && (
          <TrialBanner trialEndDays={trialInfo.daysLeft} onDismiss={() => {}} />
        )}
        {isDashboard ? (
          <Outlet />
        ) : (
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}