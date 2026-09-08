import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Inquiries } from './pages/Inquiries';
import { Quotations } from './pages/Quotations';
import { Designs } from './pages/Designs';
import { BOMPage } from './pages/BOM';
import { Suppliers } from './pages/Suppliers';
import { PurchaseRequests, PurchaseOrders } from './pages/Procurement';
import { Inventory } from './pages/Inventory';
import { Jobs } from './pages/Jobs';
import { Fabrication } from './pages/Fabrication';
import { Production, Assembly } from './pages/Production';
import { QualityControl } from './pages/QualityControl';
import { Dispatch } from './pages/Dispatch';
import { EmployeeList } from './pages/Employees';
import { Tasks } from './pages/Tasks';
import { Leaves } from './pages/Leaves';
import { Accounting } from './pages/Accounting';
import { Reports } from './pages/Reports';
import { ERPProvider } from './context/ERPContext';

// Placeholder for unbuilt pages
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-100 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="text-gray-400 mt-2">This module is coming soon.</p>
    </div>
  );
}

export default function App() {
  return (
    <ERPProvider>
      <BrowserRouter>
        <MainLayout>
          <Routes>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />

          {/* CRM & Pre-Production */}
          <Route path="/customers" element={<Navigate to="/inquiries" replace />} />
          <Route path="/inquiries" element={<Inquiries />} />
          <Route path="/designs" element={<Designs />} />
          <Route path="/bom" element={<BOMPage />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/sales-orders" element={<Navigate to="/jobs" replace />} />

          {/* Procurement */}
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchase-requests" element={<PurchaseRequests />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/goods-receipt" element={<ComingSoon title="Goods Receipt" />} />

          {/* Inventory */}
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/stock" element={<Inventory />} />
          <Route path="/material-issue" element={<ComingSoon title="Material Issue" />} />

          {/* Manufacturing */}
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<Jobs />} />
          <Route path="/fabrication" element={<Fabrication />} />
          <Route path="/production" element={<Production />} />
          <Route path="/assembly" element={<Assembly />} />
          <Route path="/work-centers" element={<ComingSoon title="Work Centers" />} />

          {/* Quality */}
          <Route path="/qc" element={<QualityControl />} />
          <Route path="/qc-reports" element={<QualityControl />} />
          <Route path="/rework" element={<ComingSoon title="Rework Management" />} />

          {/* Dispatch */}
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/packing" element={<Dispatch />} />

          {/* Employees & Workforce */}
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/leaves" element={<Leaves />} />

          {/* Accounting & Finance */}
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/invoices" element={<Accounting />} />

          {/* Reports */}
          <Route path="/reports" element={<Reports />} />

          {/* Settings */}
          <Route path="/settings" element={<ComingSoon title="Settings" />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  </ERPProvider>
  );
}
