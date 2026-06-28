import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { CompanyProvider } from '@/lib/CompanyContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Pages
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import Documents from '@/pages/Documents';
import Tasks from '@/pages/Tasks';
import TaxFilings from '@/pages/TaxFilings';
import AIAssistant from '@/pages/AIAssistant';
import Payroll from '@/pages/Payroll';
import Accounting from '@/pages/Accounting';
import TaxCalendar from '@/pages/TaxCalendar';
import Review from '@/pages/Review';
import GemeloFiscal from '@/pages/GemeloFiscal';
import Invoicing from '@/pages/Invoicing';
import Treasury from '@/pages/Treasury';
import Corporate from '@/pages/Corporate';
import IIBBConvenio from '@/pages/IIBBConvenio';
import FinancialReports from '@/pages/FinancialReports';
import BankReconciliation from '@/pages/BankReconciliation';
import Agents from '@/pages/Agents';
import NormativaMotor from '@/pages/NormativaMotor';
import AccountPlanPage from '@/pages/AccountPlanPage';
import AuditPage from '@/pages/AuditPage';
import ClientPortal from '@/pages/ClientPortal';
import Companies from '@/pages/Companies';
import Onboarding from '@/pages/Onboarding';
import ARCASettings from '@/pages/ARCASettings';
import HelpCenter from '@/pages/HelpCenter';
import Team from '@/pages/Team';
import TaxAutomation from '@/pages/TaxAutomation';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F5F5F7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#00C7D9] rounded-full animate-spin"></div>
          <p className="text-[13px] text-slate-500">Cargando ContaIA...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tax-filings" element={<TaxFilings />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/tax-calendar" element={<TaxCalendar />} />
          <Route path="/review" element={<Review />} />
          <Route path="/gemelo-fiscal" element={<GemeloFiscal />} />
          <Route path="/invoicing" element={<Invoicing />} />
          <Route path="/treasury" element={<Treasury />} />
          <Route path="/corporate" element={<Corporate />} />
          <Route path="/iibb-convenio" element={<IIBBConvenio />} />
          <Route path="/financial-reports" element={<FinancialReports />} />
          <Route path="/bank-reconciliation" element={<BankReconciliation />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/normativa" element={<NormativaMotor />} />
          <Route path="/account-plan" element={<AccountPlanPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/portal" element={<ClientPortal />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/settings/arca" element={<ARCASettings />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/team" element={<Team />} />
          <Route path="/tax-automation" element={<TaxAutomation />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
      </CompanyProvider>
    </AuthProvider>
  )
}

export default App