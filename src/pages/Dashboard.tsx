import { useState } from 'react';
import {
  ClipboardList, Factory, CheckSquare, Truck, AlertTriangle,
  Users, ShoppingCart, TrendingUp, BarChart2, Activity,
  Hammer, Layers, Plus, ArrowRight, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { KPICard, StatusBadge, ProgressBar, ActivityTimeline } from '../components/ui';
import { useERP } from '../context/ERPContext';
import { EmployeeDashboard } from './EmployeeDashboard';

const monthlyRevenue = [
  { month: 'Mar', value: 8.2 }, { month: 'Apr', value: 12.5 }, { month: 'May', value: 9.8 },
  { month: 'Jun', value: 15.3 }, { month: 'Jul', value: 14.1 }, { month: 'Aug', value: 18.5 },
];

export function Dashboard() {
  const navigate = useNavigate();
  const {
    jobs, inquiries, quotations, inventory, activityLogs,
    fabricationOrders, qcInspections, employees, tasks, customers,
    currentRole
  } = useERP();

  const [activeStage, setActiveStage] = useState<string | null>(null);

  // If user is a department employee (non-super admin), render their dedicated EmployeeDashboard
  if (currentRole !== 'super_admin') {
    return <EmployeeDashboard />;
  }

  // Super Admin view: Strictly Manufacturing & Operational Overview (no employee personal view toggle)
  const lowStockItems = inventory.filter(i => i.availableStock <= i.reorderLevel);
  const pendingFabrication = fabricationOrders.filter(f => f.status === 'In Progress' || f.status === 'Planned');
  const qcPending = qcInspections.filter(q => q.overallResult !== 'Passed');
  const totalPipelineVal = jobs.reduce((acc, j) => acc + (j.estimatedValue || 0), 0);

  const kpis = [
    { title: 'Total Inquiries', value: inquiries.length, icon: <ClipboardList className="w-5 h-5 text-blue-600" />, iconBg: 'bg-blue-50', subtitle: `${inquiries.filter(i => i.status === 'New').length} new` },
    { title: 'Pending Quotations', value: quotations.filter(q => q.status === 'Draft' || q.status === 'Sent').length, icon: <ShoppingCart className="w-5 h-5 text-amber-600" />, iconBg: 'bg-amber-50', subtitle: 'Awaiting response' },
    { title: 'Active Jobs', value: jobs.filter(j => j.status === 'Active').length, icon: <Factory className="w-5 h-5 text-brand-600" />, iconBg: 'bg-brand-50', subtitle: 'In manufacturing' },
    { title: 'Pending Fabrication', value: pendingFabrication.length, icon: <Hammer className="w-5 h-5 text-purple-600" />, iconBg: 'bg-purple-50', subtitle: `${fabricationOrders.filter(f=>f.status==='Completed').length} done` },
    { title: 'Assembly Orders', value: jobs.filter(j => j.currentStage === 'Assembly').length, icon: <Layers className="w-5 h-5 text-indigo-600" />, iconBg: 'bg-indigo-50', subtitle: 'In assembly bay' },
    { title: 'QC Inspections', value: qcInspections.length, icon: <CheckSquare className="w-5 h-5 text-orange-600" />, iconBg: 'bg-orange-50', subtitle: `${qcPending.length} pending` },
    { title: 'Ready for Dispatch', value: jobs.filter(j => j.currentStage === 'Dispatch').length || 1, icon: <Truck className="w-5 h-5 text-emerald-600" />, iconBg: 'bg-emerald-50', subtitle: 'Approved' },
    { title: 'Low Stock Items', value: lowStockItems.length, icon: <AlertTriangle className="w-5 h-5 text-red-600" />, iconBg: 'bg-red-50', subtitle: 'Reorder required', alert: lowStockItems.length > 0 },
    { title: 'Pending Tasks', value: tasks.filter(t => t.status !== 'Completed').length, icon: <Activity className="w-5 h-5 text-teal-600" />, iconBg: 'bg-teal-50', subtitle: 'Across all jobs' },
    { title: 'Active Employees', value: employees.filter(e => e.status === 'Active').length, icon: <Users className="w-5 h-5 text-slate-600" />, iconBg: 'bg-slate-50', subtitle: 'Staff count' },
    { title: 'Monthly Revenue', value: '₹18.5L', icon: <TrendingUp className="w-5 h-5 text-green-600" />, iconBg: 'bg-green-50', subtitle: 'FY 2026-27' },
    { title: 'Pipeline Value', value: `₹${(totalPipelineVal / 100000).toFixed(1)}L`, icon: <BarChart2 className="w-5 h-5 text-cyan-600" />, iconBg: 'bg-cyan-50', subtitle: 'Active jobs total' },
  ];

  const pipelineStages = [
    { stage: 'Inquiry',      count: inquiries.length, completed: inquiries.filter(i=>i.status==='Converted to Order').length, pending: inquiries.filter(i=>i.status!=='Converted to Order').length, color: '#3b82f6', path: '/inquiries' },
    { stage: 'Design',       count: jobs.filter(j=>j.designId).length || 5, completed: 4, pending: 1, color: '#8b5cf6', path: '/designs' },
    { stage: 'BOM',          count: jobs.filter(j=>j.bomId).length || 5, completed: 4, pending: 1, color: '#a855f7', path: '/bom' },
    { stage: 'Quotation',    count: quotations.length, completed: quotations.filter(q=>q.status==='Converted').length, pending: quotations.filter(q=>q.status!=='Converted').length, color: '#f59e0b', path: '/quotations' },
    { stage: 'Customer PO',  count: quotations.filter(q=>q.status==='Converted').length, completed: quotations.filter(q=>q.status==='Converted').length, pending: 0, color: '#10b981', path: '/sales-orders' },
    { stage: 'Fabrication',  count: fabricationOrders.length, completed: fabricationOrders.filter(f=>f.status==='Completed').length, pending: fabricationOrders.filter(f=>f.status!=='Completed').length, color: '#ef4444', path: '/fabrication' },
    { stage: 'Production',   count: jobs.filter(j=>j.productionOrderId).length || 3, completed: 1, pending: 2, color: '#f97316', path: '/production' },
    { stage: 'Assembly',     count: jobs.filter(j=>j.assemblyOrderId).length || 2, completed: 0, pending: 1, color: '#6366f1', path: '/assembly' },
    { stage: 'QC',           count: qcInspections.length, completed: qcInspections.filter(q=>q.overallResult==='Passed').length, pending: qcInspections.filter(q=>q.overallResult!=='Passed').length, color: '#14b8a6', path: '/qc' },
    { stage: 'Dispatch',     count: jobs.filter(j=>j.currentStage==='Dispatch').length || 1, completed: 0, pending: 1, color: '#22c55e', path: '/dispatch' },
  ];

  const jobStatusData = [
    { name: 'Fabrication', value: jobs.filter(j => j.currentStage === 'Fabrication').length || 2, color: '#ef4444' },
    { name: 'Assembly', value: jobs.filter(j => j.currentStage === 'Assembly').length || 1, color: '#6366f1' },
    { name: 'Production', value: jobs.filter(j => j.currentStage === 'Production').length || 1, color: '#f97316' },
    { name: 'QC', value: jobs.filter(j => j.currentStage === 'QC').length || 1, color: '#14b8a6' },
  ];

  const displayedJobs = activeStage
    ? jobs.filter(j => j.currentStage === activeStage)
    : jobs;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Manufacturing Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' '} · KHODIYAR ENGINEERING, Vadodara
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => navigate('/inquiries')}>
            <Plus size={14} /> New Inquiry / Customer
          </button>
          <button className="btn-primary" onClick={() => navigate('/jobs')}>
            <Factory size={14} /> View All Jobs
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {kpis.map(kpi => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Production Pipeline */}
      <div className="card">
        <div className="card-header">
          <h2 className="section-title flex items-center gap-2">
            <Activity size={18} className="text-brand-600" />
            Production Pipeline
          </h2>
          <p className="text-xs text-gray-400">Click a stage to filter active jobs</p>
        </div>
        <div className="p-6">
          <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
            {pipelineStages.map((stage, idx) => (
              <div key={stage.stage} className="flex items-center gap-2 shrink-0">
                <div
                  className={`pipeline-node w-24 cursor-pointer transition-all duration-200 ${
                    activeStage === stage.stage
                      ? 'shadow-lg scale-105 border-2'
                      : 'border border-gray-200 hover:border-gray-300 hover:shadow'
                  }`}
                  style={activeStage === stage.stage ? { borderColor: stage.color, backgroundColor: stage.color + '10' } : {}}
                  onClick={() => setActiveStage(a => a === stage.stage ? null : stage.stage)}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: stage.color + '20' }}>
                    <span className="text-lg font-bold" style={{ color: stage.color }}>{stage.count}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 text-center leading-tight">{stage.stage}</p>
                  <div className="flex justify-center gap-1 mt-2 flex-wrap">
                    {stage.completed > 0 && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-1 rounded">{stage.completed}✓</span>
                    )}
                    {stage.pending > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1 rounded">{stage.pending}●</span>
                    )}
                  </div>
                </div>
                {idx < pipelineStages.length - 1 && (
                  <ArrowRight size={16} className="text-gray-300 shrink-0" />
                )}
              </div>
            ))}
          </div>
          {activeStage && (
            <p className="text-xs text-gray-400 mt-3">
              Showing jobs in <strong>{activeStage}</strong> stage.
              <button onClick={() => setActiveStage(null)} className="ml-1 text-brand-600 hover:underline">Clear filter</button>
            </p>
          )}
        </div>
      </div>

      {/* Two column: Jobs + Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active Jobs Table */}
        <div className="xl:col-span-2 card">
          <div className="card-header">
            <h2 className="section-title flex items-center gap-2">
              <Factory size={18} className="text-brand-600" />
              Active Production Jobs
              {activeStage && <span className="text-xs text-brand-600 font-normal">— {activeStage}</span>}
            </h2>
            <button onClick={() => navigate('/jobs')} className="btn-ghost text-xs">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Job Number</th>
                  <th className="table-th">Product</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Current Stage</th>
                  <th className="table-th">Progress</th>
                  <th className="table-th">Status</th>
                  <th className="table-th w-8"></th>
                </tr>
              </thead>
              <tbody>
                {displayedJobs.map(job => {
                  const cust = customers.find(c => c.id === job.customerId);
                  return (
                    <tr key={job.id} className="table-row" onClick={() => navigate('/jobs')}>
                      <td className="table-td font-mono font-semibold text-brand-700 text-xs">
                        {job.jobNumber}
                      </td>
                      <td className="table-td font-medium text-sm text-gray-900 max-w-50 truncate">
                        {job.productName}
                      </td>
                      <td className="table-td text-xs text-gray-600">
                        {cust?.companyName ?? job.customerId}
                      </td>
                      <td className="table-td">
                        <span className="badge-blue text-xs">{job.currentStage}</span>
                      </td>
                      <td className="table-td w-32">
                        <ProgressBar value={job.progressPercent} showLabel size="sm" />
                      </td>
                      <td className="table-td">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="table-td text-gray-400">
                        <Eye size={14} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Column */}
        <div className="space-y-6">
          {/* Revenue Trend */}
          <div className="card p-5">
            <h3 className="section-title mb-3">Monthly Revenue (₹ Lakh)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e50001" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#e50001" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`₹${v}L`, 'Revenue']} />
                <Area type="monotone" dataKey="value" stroke="#e50001" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stage Distribution Pie */}
          <div className="card p-5">
            <h3 className="section-title mb-2">Stage Distribution</h3>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={jobStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                  dataKey="value" paddingAngle={3}>
                  {jobStatusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="card p-6">
        <div className="card-header pb-4">
          <h2 className="section-title flex items-center gap-2">
            <Activity size={18} className="text-brand-600" />
            Recent Factory Activity
          </h2>
          <span className="text-xs text-gray-400">Live operational events</span>
        </div>
        <ActivityTimeline activities={activityLogs.slice(0, 5)} />
      </div>
    </div>
  );
}
