import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  return (
    <div className="flex min-h-screen bg-[#0A0B14]">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {isDashboard ? (
          <Outlet />
        ) : (
          <div className="p-4 lg:p-6 pt-14 lg:pt-6">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}