import React, { useState, useMemo } from 'react';
import {
  CheckSquare, CalendarCheck, Plus, Layers, FileText, Factory,
  ShieldCheck, ShoppingCart, Check, Sparkles, Building2,
  DollarSign, Stethoscope, Palmtree, Coffee, Play, CheckCircle2,
  Truck, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KPICard, StatusBadge, PriorityBadge, Modal, FormField } from '../components/ui';
import type { TaskStatus, LeaveRequest, LeaveType, LeaveDuration } from '../types';
import { ROLE_DEFINITIONS } from '../types';
import { useERP } from '../context/ERPContext';
import { formatCurrencyINR } from '../utils/exportUtils';

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const {
    currentUser, currentRole, tasks, jobs, leaveRequests,
    inquiries, designs, boms, purchaseRequests,
    fabricationOrders, qcInspections, inventory,
    dispatchOrders, invoices, vendorBills,
    customers, suppliers, employees, updateTask, addLeaveRequest
  } = useERP();

  const [taskFilter, setTaskFilter] = useState<'All' | 'Todo' | 'In Progress' | 'Completed'>('In Progress');
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  // Form State for Leave Application
  const [formLeaveType, setFormLeaveType] = useState<LeaveType>('Casual Leave');
  const [formDuration, setFormDuration] = useState<LeaveDuration>('Full Day');
  const [formStartDate, setFormStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [formEndDate, setFormEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [formReason, setFormReason] = useState('');
  const [formContact, setFormContact] = useState(currentUser?.phone || '');

  // Calculate days for the leave form
  const calculatedDays = useMemo(() => {
    if (formDuration === 'First Half' || formDuration === 'Second Half') return 0.5;
    if (formDuration === 'Full Day') return 1;
    if (!formStartDate || !formEndDate) return 1;
    const start = new Date(formStartDate);
    const end = new Date(formEndDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [formDuration, formStartDate, formEndDate]);

  // Tasks assigned to this specific employee
  const myTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter(t =>
      t.assignedEmployeeId === currentUser.id ||
      t.assignedEmployeeId === currentUser.employeeId ||
      t.assignedEmployeeId === currentUser.name
    );
  }, [tasks, currentUser]);

  const pendingTasks = useMemo(() => myTasks.filter(t => t.status !== 'Completed'), [myTasks]);
  const inProgressTasks = useMemo(() => myTasks.filter(t => t.status === 'In Progress'), [myTasks]);
  const completedTasks = useMemo(() => myTasks.filter(t => t.status === 'Completed'), [myTasks]);

  // Filtered task list for the widget
  const displayedTasks = useMemo(() => {
    if (taskFilter === 'All') return myTasks;
    return myTasks.filter(t => t.status === taskFilter);
  }, [myTasks, taskFilter]);

  // Leaves of this employee
  const myLeaves = useMemo(() => {
    if (!currentUser) return [];
    return leaveRequests.filter(l =>
      l.employeeId === currentUser.id ||
      l.employeeId === currentUser.employeeId ||
      l.employeeName === currentUser.name
    );
  }, [leaveRequests, currentUser]);

  const approvedLeavesCount = useMemo(() => {
    return myLeaves.filter(l => l.status === 'Approved').reduce((a, b) => a + (b.totalDays || 1), 0);
  }, [myLeaves]);

  const remainingLeaveDays = Math.max(0, (12 + 8 + 18) - approvedLeavesCount);

  // Role info definition
  const roleInfo = ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.sales;

  // ─────────────────────────────────────────────────────────────
  // DEPARTMENT-SPECIFIC AND EMPLOYEE-SPECIFIC DATA FEEDS
  // ─────────────────────────────────────────────────────────────

  // 1. Sales Data for Sales Specialist (e.g. Amit Shah / Priya Nair)
  const myInquiries = useMemo(() => {
    return inquiries.filter(i =>
      i.salesPerson === currentUser.name ||
      i.salesPerson === currentUser.id ||
      !i.salesPerson
    );
  }, [inquiries, currentUser]);

  const myCustomers = useMemo(() => {
    return customers.filter(c =>
      c.assignedSalesPerson === currentUser.name ||
      c.assignedSalesPerson === currentUser.id
    );
  }, [customers, currentUser]);

  // 2. Design Data for Design Engineer (e.g. Rakesh Verma)
  const myDesigns = useMemo(() => {
    return designs.filter(d =>
      d.designer === currentUser.name ||
      d.designer === currentUser.id ||
      d.designer?.includes(currentUser.name.split(' ')[0])
    );
  }, [designs, currentUser]);

  const myBoms = useMemo(() => {
    return boms.filter(b =>
      b.preparedBy === currentUser.name ||
      b.preparedBy === currentUser.id ||
      b.preparedBy?.includes(currentUser.name.split(' ')[0])
    );
  }, [boms, currentUser]);

  // 3. Purchase Data for Purchase Manager (e.g. Sunil Tiwari)
  const myPurchaseRequests = useMemo(() => {
    return purchaseRequests.filter(pr => pr.status === 'Submitted' || pr.status === 'Approved' || pr.requestedBy === currentUser.name);
  }, [purchaseRequests, currentUser]);

  // 4. Fabrication & Production Data (e.g. Mahesh Solanki / Jagdish Prajapati)
  const myFabOrders = useMemo(() => {
    return fabricationOrders.filter(f =>
      f.assignedEmployeeId === currentUser.id ||
      f.assignedEmployeeId === currentUser.employeeId ||
      (currentUser.workCenter && f.workCenter === currentUser.workCenter)
    );
  }, [fabricationOrders, currentUser]);

  // 5. QC Data for QC Inspector (e.g. Kamlesh Rathod)
  const myQcInspections = useMemo(() => {
    return qcInspections.filter(q =>
      q.inspector === currentUser.name ||
      q.inspector === currentUser.id
    );
  }, [qcInspections, currentUser]);

  // 6. Inventory Data for Inventory Manager (e.g. Deepak Vasava)
  const myLowStockItems = useMemo(() => {
    return inventory.filter(i => (i.currentStock || 0) <= (i.reorderLevel || 0));
  }, [inventory]);

  // 7. Dispatch Data for Dispatch Coordinator (e.g. Bhavesh Parmar)
  const myDispatchOrders = useMemo(() => {
    return dispatchOrders;
  }, [dispatchOrders]);

  // 8. Accounts Data for Accounts Specialist (e.g. Kiran Desai)
  const myInvoices = useMemo(() => {
    return invoices;
  }, [invoices]);

  const myVendorBills = useMemo(() => {
    return vendorBills;
  }, [vendorBills]);

  // Handle task status update
  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask(taskId, {
      status: newStatus,
      completedAt: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : undefined
    });
  };

  // Handle quick apply leave
  const handleApplyLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!formReason.trim()) {
      alert('Please enter a reason for your leave.');
      return;
    }

    const newReq: LeaveRequest = {
      id: `LEV-${Date.now()}`,
      leaveNumber: `LR-${new Date().getFullYear()}-${String(leaveRequests.length + 1).padStart(3, '0')}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeCode: currentUser.employeeId || 'KE-EMP',
      department: currentUser.department,
      leaveType: formLeaveType,
      startDate: formStartDate,
      endDate: formDuration === 'First Half' || formDuration === 'Second Half' || formDuration === 'Full Day' ? formStartDate : formEndDate,
      duration: formDuration,
      totalDays: calculatedDays,
      reason: formReason.trim(),
      contactDuringLeave: formContact,
      status: 'Pending',
      appliedAt: new Date().toISOString().split('T')[0],
    };

    addLeaveRequest(newReq);
    setApplyModalOpen(false);
    setFormReason('');
  };

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-gray-500">
        Please select an active user profile to view your personal dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── PERSONALIZED HERO BANNER ── */}
      <div className="bg-linear-to-r from-navy-900 via-navy-800 to-navy-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-brand-600 to-brand-400 flex items-center justify-center font-extrabold text-2xl shadow-lg border border-white/20 shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">Welcome back, {currentUser.name}!</h1>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${roleInfo.badgeColor} bg-white text-gray-900 shadow-sm`}>
                  {roleInfo.label}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">
                {currentUser.designation || 'Staff Member'} · <span className="text-brand-300 font-semibold">{currentUser.department} Department</span> · <span className="font-mono text-xs text-gray-400">{currentUser.employeeId || 'ID: Active'}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · Status: <span className="text-emerald-400 font-semibold">● Active on Duty</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setApplyModalOpen(true)}
              className="btn-primary flex items-center gap-1.5 shadow-lg hover:shadow-brand-600/30 cursor-pointer font-bold"
            >
              <CalendarCheck size={15} /> Apply Leave
            </button>
            <button
              onClick={() => navigate('/tasks')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckSquare size={15} /> My Kanban Board
            </button>
          </div>
        </div>
      </div>

      {/* ── EMPLOYEE KPI METRICS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="My Assigned Tasks"
          value={pendingTasks.length}
          icon={<CheckSquare className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
          subtitle={`${inProgressTasks.length} In Progress · ${completedTasks.length} Done`}
          alert={pendingTasks.length > 3}
          onClick={() => { setTaskFilter('In Progress'); }}
        />
        
        {/* Department specific KPI */}
        {currentRole === 'sales' && (
          <KPICard
            title="My Sales Inquiries"
            value={myInquiries.length}
            icon={<FileText className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-50"
            subtitle={`${myCustomers.length} Assigned Clients`}
            onClick={() => navigate('/inquiries')}
          />
        )}

        {currentRole === 'design_engineer' && (
          <KPICard
            title="My CAD Drawings"
            value={myDesigns.length || designs.length}
            icon={<Layers className="w-5 h-5 text-purple-600" />}
            iconBg="bg-purple-50"
            subtitle={`${myBoms.length || boms.length} Active BOMs`}
            onClick={() => navigate('/designs')}
          />
        )}

        {currentRole === 'purchase' && (
          <KPICard
            title="Purchase Requisitions"
            value={myPurchaseRequests.length}
            icon={<ShoppingCart className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-50"
            subtitle={`${suppliers.length} Active Suppliers`}
            onClick={() => navigate('/purchase-requests')}
          />
        )}

        {currentRole === 'production_manager' && (
          <KPICard
            title="My Fabrication Orders"
            value={myFabOrders.length || fabricationOrders.length}
            icon={<Factory className="w-5 h-5 text-orange-600" />}
            iconBg="bg-orange-50"
            subtitle="Shop floor work orders"
            onClick={() => navigate('/fabrication')}
          />
        )}

        {currentRole === 'qc_inspector' && (
          <KPICard
            title="My QC Inspections"
            value={myQcInspections.length || qcInspections.length}
            icon={<ShieldCheck className="w-5 h-5 text-teal-600" />}
            iconBg="bg-teal-50"
            subtitle="Quality audits conducted"
            onClick={() => navigate('/qc')}
          />
        )}

        {currentRole === 'inventory_manager' && (
          <KPICard
            title="Low Stock Alerts"
            value={myLowStockItems.length}
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
            iconBg="bg-red-50"
            subtitle={`${inventory.length} SKUs in store`}
            alert={myLowStockItems.length > 0}
            onClick={() => navigate('/inventory')}
          />
        )}

        {currentRole === 'dispatch' && (
          <KPICard
            title="Dispatches Handled"
            value={myDispatchOrders.length}
            icon={<Truck className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            subtitle="Shipments & E-Way bills"
            onClick={() => navigate('/dispatch')}
          />
        )}

        {currentRole === 'accounts' && (
          <KPICard
            title="Invoices Issued"
            value={myInvoices.length}
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            subtitle={`${myVendorBills.length} Vendor Bills`}
            onClick={() => navigate('/accounting')}
          />
        )}

        <KPICard
          title="Leave Balance Available"
          value={`${remainingLeaveDays} Days`}
          icon={<Palmtree className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          subtitle={`${approvedLeavesCount} Days Taken this Year`}
          onClick={() => navigate('/leaves')}
        />
        
        <KPICard
          title="Department Team"
          value={employees.filter(e => e.department === currentUser.department).length}
          icon={<Building2 className="w-5 h-5 text-slate-600" />}
          iconBg="bg-slate-50"
          subtitle={`${currentUser.department} Department`}
        />
      </div>

      {/* ── MAIN WORKSPACE SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Assigned Tasks & Work Queue (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ── 1. MY ASSIGNED TASKS WIDGET ── */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <CheckSquare size={18} className="text-brand-600" /> My Assigned Tasks ({myTasks.length})
                </h3>
                <p className="text-xs text-gray-500">Live work items assigned specifically to {currentUser.name}</p>
              </div>

              {/* Task Status Filter Pills */}
              <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-0.5">
                {(['In Progress', 'Todo', 'Completed', 'All'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTaskFilter(tab)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      taskFilter === tab
                        ? 'bg-navy-900 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              {displayedTasks.length === 0 ? (
                <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                  <p className="font-bold text-sm text-gray-800">No tasks in this list!</p>
                  <p className="text-xs text-gray-400 mt-0.5">You have no tasks marked as "{taskFilter}".</p>
                </div>
              ) : (
                displayedTasks.map(task => {
                  const job = jobs.find(j => j.id === task.jobId);
                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl border border-gray-200 bg-white hover:border-brand-200 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-700">{task.taskId}</span>
                          <PriorityBadge priority={task.priority} />
                          <StatusBadge status={task.status} size="sm" />
                          {job && (
                            <span className="font-mono text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">
                              {job.jobNumber}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-gray-900">{task.taskName}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>📅 Due: <strong>{task.dueDate}</strong></span>
                          <span>⏱ Est: <strong>{task.estimatedHours} hrs</strong></span>
                          {task.actualHours && <span>⏱ Actual: <strong>{task.actualHours} hrs</strong></span>}
                          {job && <span className="truncate">📦 {job.productName}</span>}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        {task.status === 'Todo' && (
                          <button
                            onClick={() => handleTaskStatusChange(task.id, 'In Progress')}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Play size={12} /> Start Work
                          </button>
                        )}
                        {task.status === 'In Progress' && (
                          <button
                            onClick={() => handleTaskStatusChange(task.id, 'Completed')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Check size={13} /> Complete Task
                          </button>
                        )}
                        {task.status === 'Completed' && (
                          <button
                            onClick={() => handleTaskStatusChange(task.id, 'In Progress')}
                            className="btn-secondary text-xs py-1.5 px-2.5 text-gray-600 cursor-pointer"
                            title="Reopen Task"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── 2. DYNAMIC OPERATIONAL FEED BASED ON LOGGED-IN EMPLOYEE'S DEPARTMENT ── */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Sparkles size={18} className="text-brand-600" />
                {currentUser.department} Department Work Queue
              </h3>
              <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                {roleInfo.label} View
              </span>
            </div>

            {/* SALES FEED */}
            {currentRole === 'sales' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Customer inquiries assigned to {currentUser.name}:</p>
                {myInquiries.length > 0 ? (
                  <div className="space-y-2">
                    {myInquiries.slice(0, 4).map(inq => {
                      const cust = customers.find(c => c.id === inq.customerId);
                      return (
                        <div key={inq.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-brand-700">{inq.inquiryNumber}</span>
                              <StatusBadge status={inq.status} size="sm" />
                            </div>
                            <p className="font-bold text-gray-900 mt-1">{cust?.companyName || inq.contactPerson}</p>
                            <p className="text-gray-500">{inq.productCategory} · Qty: {inq.quantity}</p>
                          </div>
                          <button onClick={() => navigate('/inquiries')} className="btn-secondary text-xs px-2.5 py-1">
                            Open Lead →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No inquiries assigned yet.</p>
                )}
              </div>
            )}

            {/* DESIGN FEED */}
            {currentRole === 'design_engineer' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Engineering drawings & CAD projects:</p>
                <div className="space-y-2">
                  {designs.slice(0, 4).map(d => (
                    <div key={d.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-purple-700">{d.designNumber}</span>
                          <StatusBadge status={d.status} size="sm" />
                        </div>
                        <p className="font-bold text-gray-900 mt-1">Job: {d.jobId} · Rev: {d.currentRevision}</p>
                        <p className="text-gray-500">{d.dimensions} · Material: {d.material}</p>
                      </div>
                      <button onClick={() => navigate('/designs')} className="btn-secondary text-xs px-2.5 py-1">
                        View CAD →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PURCHASE FEED */}
            {currentRole === 'purchase' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Purchase requests waiting for PO generation:</p>
                <div className="space-y-2">
                  {purchaseRequests.slice(0, 4).map(pr => (
                    <div key={pr.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-700">{pr.prNumber}</span>
                          <StatusBadge status={pr.status} size="sm" />
                        </div>
                        <p className="font-bold text-gray-900 mt-1">{pr.items?.map(it => it.itemName).join(', ') || 'Materials'}</p>
                        <p className="text-gray-500">Requested by: {pr.requestedBy} ({pr.department})</p>
                      </div>
                      <button onClick={() => navigate('/purchase-requests')} className="btn-secondary text-xs px-2.5 py-1">
                        Create PO →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRODUCTION & FABRICATION FEED */}
            {currentRole === 'production_manager' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Shop floor fabrication & assembly orders:</p>
                <div className="space-y-2">
                  {fabricationOrders.slice(0, 4).map(fab => (
                    <div key={fab.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-orange-700">{fab.fabOrderNumber}</span>
                          <StatusBadge status={fab.status} size="sm" />
                        </div>
                        <p className="font-bold text-gray-900 mt-1">{fab.component} ({fab.workCenter})</p>
                        <p className="text-gray-500">Job: {fab.jobId} · Progress: {fab.completionPercent}%</p>
                      </div>
                      <button onClick={() => navigate('/fabrication')} className="btn-secondary text-xs px-2.5 py-1">
                        Update Shop Floor →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QC FEED */}
            {currentRole === 'qc_inspector' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Quality inspections & test reports:</p>
                <div className="space-y-2">
                  {qcInspections.slice(0, 4).map(qc => (
                    <div key={qc.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-700">{qc.qcNumber}</span>
                          <StatusBadge status={qc.overallResult} size="sm" />
                        </div>
                        <p className="font-bold text-gray-900 mt-1">Job: {qc.jobId} · Type: {qc.inspectionType}</p>
                        <p className="text-gray-500">Date: {qc.inspectionDate} · Inspector: {qc.inspector}</p>
                      </div>
                      <button onClick={() => navigate('/qc')} className="btn-secondary text-xs px-2.5 py-1">
                        Open Report →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* INVENTORY FEED */}
            {currentRole === 'inventory_manager' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Critical items below reorder threshold:</p>
                <div className="space-y-2">
                  {inventory.filter(i => (i.currentStock || 0) <= (i.reorderLevel || 0)).slice(0, 4).map(item => (
                    <div key={item.id} className="p-3 bg-red-50/50 rounded-xl border border-red-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-red-700">{item.itemCode}</span>
                        <p className="font-bold text-gray-900 mt-1">{item.itemName}</p>
                        <p className="text-red-600 font-semibold">Stock: {item.currentStock} {item.unit} (Reorder: {item.reorderLevel})</p>
                      </div>
                      <button onClick={() => navigate('/inventory')} className="btn-secondary text-xs px-2.5 py-1">
                        Stock Inward →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DISPATCH FEED */}
            {currentRole === 'dispatch' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Active shipment dispatches:</p>
                <div className="space-y-2">
                  {dispatchOrders.slice(0, 4).map(d => (
                    <div key={d.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-700">{d.dispatchNumber}</span>
                          <StatusBadge status={d.status} size="sm" />
                        </div>
                        <p className="font-bold text-gray-900 mt-1">Job: {d.jobId} · Transporter: {d.transporter}</p>
                        <p className="text-gray-500">Vehicle: {d.vehicleNumber} · LR: {d.lrNumber}</p>
                      </div>
                      <button onClick={() => navigate('/dispatch')} className="btn-secondary text-xs px-2.5 py-1">
                        Track Delivery →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACCOUNTS FEED */}
            {currentRole === 'accounts' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Recent customer tax invoices & receipts:</p>
                <div className="space-y-2">
                  {invoices.slice(0, 4).map(inv => (
                    <div key={inv.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-700">{inv.invoiceNumber}</span>
                          <StatusBadge status={inv.status} size="sm" />
                        </div>
                        <p className="font-bold text-gray-900 mt-1">Total: {formatCurrencyINR(inv.totalAmount)}</p>
                        <p className="text-gray-500">Due: {inv.dueDate} · Balance: {formatCurrencyINR(inv.balanceDue)}</p>
                      </div>
                      <button onClick={() => navigate('/accounting')} className="btn-secondary text-xs px-2.5 py-1">
                        View Invoice →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leave Quota & Department Colleagues */}
        <div className="space-y-6">
          {/* Leave Quota Card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <CalendarCheck size={16} className="text-brand-600" /> My Leave Quotas
                </h3>
                <p className="text-xs text-gray-500">Annual entitlements</p>
              </div>
              <button
                onClick={() => setApplyModalOpen(true)}
                className="text-xs text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Apply
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-900 flex items-center gap-1"><Coffee size={13} /> Casual Leave</span>
                  <span className="font-bold text-gray-900">10 / 12 Days Left</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '83%' }} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-rose-900 flex items-center gap-1"><Stethoscope size={13} /> Sick Leave</span>
                  <span className="font-bold text-gray-900">7 / 8 Days Left</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '87%' }} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-900 flex items-center gap-1"><Palmtree size={13} /> Paid / Earned</span>
                  <span className="font-bold text-gray-900">15 / 18 Days Left</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '83%' }} />
                </div>
              </div>
            </div>

            {/* Recent Leave Requests */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700">My Leave Applications</span>
                <button
                  onClick={() => navigate('/leaves')}
                  className="text-[11px] text-brand-600 hover:underline font-semibold cursor-pointer"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-2">
                {myLeaves.length > 0 ? (
                  myLeaves.slice(0, 3).map(l => (
                    <div key={l.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-gray-900">{l.leaveType}</p>
                        <p className="text-[11px] text-gray-500">{l.startDate} · {l.totalDays}d</p>
                      </div>
                      <StatusBadge status={l.status} size="sm" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No leave applications on record.</p>
                )}
              </div>
            </div>
          </div>

          {/* Department Colleagues Info */}
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <Building2 size={16} className="text-brand-600" /> {currentUser.department} Department Team
            </h3>
            <p className="text-xs text-gray-500">Your colleagues in {currentUser.department}</p>
            <div className="space-y-2">
              {employees
                .filter(e => e.department === currentUser.department)
                .slice(0, 5)
                .map(emp => (
                  <div key={emp.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-navy-800 text-white flex items-center justify-center font-bold text-[11px]">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{emp.name}</p>
                        <p className="text-[10px] text-gray-400">{emp.designation}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                      {emp.role || 'staff'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL: APPLY LEAVE ── */}
      <Modal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Submit Leave Request"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary text-xs cursor-pointer" onClick={() => setApplyModalOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary text-xs font-bold cursor-pointer" onClick={handleApplyLeaveSubmit}>Submit Leave Request</button>
          </div>
        }
      >
        <form onSubmit={handleApplyLeaveSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Leave Type" required>
              <select
                className="select text-xs"
                value={formLeaveType}
                onChange={e => setFormLeaveType(e.target.value as LeaveType)}
                required
              >
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Paid Leave">Paid Leave</option>
                <option value="Compensatory Off">Compensatory Off</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </FormField>

            <FormField label="Duration Type" required>
              <select
                className="select text-xs"
                value={formDuration}
                onChange={e => setFormDuration(e.target.value as LeaveDuration)}
                required
              >
                <option value="Full Day">Single Full Day</option>
                <option value="First Half">Half Day (Morning)</option>
                <option value="Second Half">Half Day (Afternoon)</option>
                <option value="Multiple Days">Multiple Days</option>
              </select>
            </FormField>

            <FormField label={formDuration === 'Multiple Days' ? 'Start Date' : 'Leave Date'} required>
              <input
                type="date"
                className="input text-xs"
                value={formStartDate}
                onChange={e => setFormStartDate(e.target.value)}
                required
              />
            </FormField>

            {formDuration === 'Multiple Days' && (
              <FormField label="End Date" required>
                <input
                  type="date"
                  className="input text-xs"
                  value={formEndDate}
                  onChange={e => setFormEndDate(e.target.value)}
                  min={formStartDate}
                  required
                />
              </FormField>
            )}

            <FormField label="Contact During Leave">
              <input
                className="input text-xs"
                placeholder="Mobile number"
                value={formContact}
                onChange={e => setFormContact(e.target.value)}
              />
            </FormField>

            <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-center justify-between">
              <span className="font-bold text-gray-700">Calculated Days:</span>
              <span className="font-black text-brand-700 text-sm">{calculatedDays} Day(s)</span>
            </div>
          </div>

          <FormField label="Reason for Leave" required>
            <textarea
              className="textarea text-xs"
              placeholder="State the reason for your leave request..."
              rows={3}
              value={formReason}
              onChange={e => setFormReason(e.target.value)}
              required
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

export default EmployeeDashboard;
