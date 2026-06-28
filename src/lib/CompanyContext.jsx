import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [organizations, setOrganizations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [activeOrg, setActiveOrgState] = useState(null);
  const [activeCompany, setActiveCompanyState] = useState(null);
  const [activeBranch, setActiveBranchState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trialInfo, setTrialInfo] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [orgs, comps, brs] = await Promise.all([
        base44.entities.Organization.list("-created_date", 100),
        base44.entities.Company.list("-created_date", 200),
        base44.entities.Branch.list("-created_date", 200),
      ]);
      setOrganizations(orgs);
      setCompanies(comps);
      setBranches(brs);

      // Calculate trial info
      const firstOrg = orgs[0] || null;
      if (firstOrg?.trial_end_date) {
        const today = new Date();
        const endDate = new Date(firstOrg.trial_end_date);
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        setTrialInfo({
          daysLeft,
          endDate: firstOrg.trial_end_date,
          expired: firstOrg.trial_expired || daysLeft < 0,
        });
      }

      // Restore from localStorage
      const savedOrgId = localStorage.getItem("contaia_active_org");
      const savedCompanyId = localStorage.getItem("contaia_active_company");
      const savedBranchId = localStorage.getItem("contaia_active_branch");

      const org = orgs.find(o => o.id === savedOrgId) || orgs[0] || null;
      setActiveOrgState(org);

      const orgCompanies = comps.filter(c => c.organization_id === org?.id);
      const company = orgCompanies.find(c => c.id === savedCompanyId) || orgCompanies[0] || null;
      setActiveCompanyState(company);

      const compBranches = brs.filter(b => b.company_id === company?.id);
      const branch = compBranches.find(b => b.id === savedBranchId) || null;
      setActiveBranchState(branch);
    } catch (e) {
      console.error("CompanyContext load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const setActiveOrg = (org) => {
    setActiveOrgState(org);
    localStorage.setItem("contaia_active_org", org?.id || "");
    // Reset company and branch when org changes
    const orgCompanies = companies.filter(c => c.organization_id === org?.id);
    const firstCompany = orgCompanies[0] || null;
    setActiveCompanyState(firstCompany);
    setActiveBranchState(null);
    localStorage.setItem("contaia_active_company", firstCompany?.id || "");
    localStorage.setItem("contaia_active_branch", "");
  };

  const setActiveCompany = (company) => {
    setActiveCompanyState(company);
    localStorage.setItem("contaia_active_company", company?.id || "");
    setActiveBranchState(null);
    localStorage.setItem("contaia_active_branch", "");
  };

  const setActiveBranch = (branch) => {
    setActiveBranchState(branch);
    localStorage.setItem("contaia_active_branch", branch?.id || "");
  };

  // Companies belonging to the active org
  const orgCompanies = companies.filter(c => c.organization_id === activeOrg?.id);
  // Branches of the active company
  const companyBranches = branches.filter(b => b.company_id === activeCompany?.id);

  // The key filter to apply to ALL entity queries for data isolation
  const companyFilter = activeCompany ? { company_id: activeCompany.id } : {};
  const branchFilter = activeBranch ? { branch_id: activeBranch.id } : {};

  return (
    <CompanyContext.Provider value={{
      // State
      organizations,
      companies,
      branches,
      orgCompanies,
      companyBranches,
      activeOrg,
      activeCompany,
      activeBranch,
      loading,
      trialInfo,
      // Setters
      setActiveOrg,
      setActiveCompany,
      setActiveBranch,
      // Filters for queries
      companyFilter,
      branchFilter,
      // Reload
      reload: loadAll,
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}