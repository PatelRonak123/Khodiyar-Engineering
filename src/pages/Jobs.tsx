import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Eye, Factory, CheckCircle, Clock, AlertTriangle,
  ChevronRight, BarChart2, Clipboard, FileText, Package,
  Hammer, Layers, Shield, Truck, Users, DollarSign, ArrowRight, Play
} from 'lucide-react';
import {
  SearchBar, StatusBadge, PriorityBadge, SectionHeader, ProgressBar,
  Tabs, HorizontalTimeline, InfoGrid, formatCurrency, ActivityTimeline,
  Drawer, Modal, FormField, WorkflowPipelineBanner
} from '../components/ui';
import type { Job, JobStage, Priority } from '../types';
import { useERP } from '../context/ERPContext';

// ─── JOB STAGE TIMELINE ──────────────────────
const STAGES: JobStage[] = ['Inquiry','Design','BOM','Quotation','Customer PO','Fabrication','Production','Assembly','QC','Dispatch'];

function getStageStatus(job: Job, stage: JobStage) {
  const stageIdx = STAGES.indexOf(stage);
  const currentIdx = STAGES.indexOf(job.currentStage);
  if (stageIdx < currentIdx) return 'completed';
  if (stageIdx === currentIdx) return 'active';
  return 'pending';
}

// ─── JOB 360° VIEW ───────────────────────────
function Job360({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const {
    jobs, customers, products, designs, boms, quotations,
    salesOrders, fabricationOrders, productionOrders, assemblyOrders,
    qcInspections, dispatchOrders, tasks, activityLogs, jobCosts,
    updateJob, updateFabricationOrder, updateProductionOrder, updateAssemblyOrder,
    updateQCInspection, addDispatchOrder
  } = useERP();

  const job = jobs.find(j => j.id === jobId);
  if (!job) return null;

  const customer = customers.find(c => c.id === job.customerId);
  const product = products.find(p => p.id === job.productId);
  const design = designs.find(d => d.jobId === job.id);
  const bom = boms.find(b => b.jobId === job.id);
  const quotation = quotations.find(q => q.jobId === job.id);
  const salesOrder = salesOrders.find(s => s.jobId === job.id);
  const prodOrder = productionOrders.find(p => p.jobId === job.id);
  const assemblyOrder = assemblyOrders.find(a => a.jobId === job.id);
  const qcInspection = qcInspections.find(q => q.jobId === job.id);
  const dispatchOrder = dispatchOrders.find(d => d.jobId === job.id);
  const jobTasks = tasks.filter(t => t.jobId === job.id);
  const jobActivity = activityLogs.filter(a => a.jobId === job.id);
  const jobCost = jobCosts.find(c => c.jobId === job.id);
  const fabOrders = fabricationOrders.filter(f => f.jobId === job.id);

  const currentIdx = STAGES.indexOf(job.currentStage);
  const nextStage = currentIdx < STAGES.length - 1 ? STAGES[currentIdx + 1] : null;

  const handleAdvanceStage = () => {
    if (!nextStage) return;
    const newProgress = Math.min(100, Math.round(((currentIdx + 2) / STAGES.length) * 100));
    updateJob(job.id, {
      currentStage: nextStage,
      progressPercent: newProgress,
      status: nextStage === 'Dispatch' ? 'Completed' : 'Active',
    });
  };

  const handleCompleteFab = (fabId: string) => {
    updateFabricationOrder(fabId, { status: 'Completed', completionPercent: 100 });
  };

  const handlePassQC = (qcId: string) => {
    updateQCInspection(qcId, { overallResult: 'Passed' });
    updateJob(job.id, { currentStage: 'Dispatch', progressPercent: 95 });
  };

  const timelineSteps = STAGES.map(stage => ({
    id: stage,
    label: stage,
    status: getStageStatus(job, stage) as 'completed' | 'active' | 'pending' | 'failed',
    date: stage === job.currentStage ? 'Active' : undefined,
  }));

  const tabs360 = [
    { id: 'overview', label: 'Overview', icon: <Eye size={12} /> },
    { id: 'customer', label: 'Customer P.O', icon: <Users size={12} /> },
    { id: 'design', label: 'Design', icon: <FileText size={12} /> },
    { id: 'bom', label: 'BOM', icon: <Clipboard size={12} />, count: bom?.items.length },
    { id: 'materials', label: 'Materials', icon: <Package size={12} /> },
    { id: 'fabrication', label: 'Fabrication', icon: <Hammer size={12} />, count: fabOrders.length },
    { id: 'production', label: 'Production', icon: <Factory size={12} /> },
    { id: 'assembly', label: 'Assembly', icon: <Layers size={12} /> },
    { id: 'qc', label: 'QC', icon: <Shield size={12} /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckCircle size={12} />, count: jobTasks.length },
    { id: 'dispatch', label: 'Dispatch', icon: <Truck size={12} /> },
    { id: 'costing', label: 'Costing', icon: <DollarSign size={12} /> },
    { id: 'activity', label: 'Activity', icon: <Clock size={12} />, count: jobActivity.length },
  ];

  return (
    <Drawer
      open={true}
      onClose={onClose}
      title={job.jobNumber}
      subtitle={`${customer?.companyName ?? 'Customer'} · ${job.productName}`}
      actions={
        <div className="flex items-center gap-2">
          {nextStage && (
            <button className="btn-primary text-xs" onClick={handleAdvanceStage}>
              Advance to {nextStage} <ArrowRight size={12} />
            </button>
          )}
          <PriorityBadge priority={job.priority} />
          <StatusBadge status={job.currentStage} />
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Job Progress Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-navy-900 to-navy-800 text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-white">{job.productName}</p>
              <p className="text-xs text-gray-300">Qty: {job.quantity} Nos · Stage: <strong className="text-brand-400">{job.currentStage}</strong> · Due: {job.plannedEndDate}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{job.progressPercent}%</p>
              <p className="text-xs text-gray-300">Complete</p>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${job.progressPercent}%` }} />
          </div>
        </div>

        {/* Timeline */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 overflow-x-auto flex-shrink-0">
          <HorizontalTimeline steps={timelineSteps} />
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100 overflow-x-auto scrollbar-hide flex-shrink-0 bg-white">
          <Tabs tabs={tabs360} active={tab} onChange={setTab} />
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Job Value', value: formatCurrency(job.estimatedValue), bg: 'bg-blue-50', color: 'text-blue-700' },
                  { label: 'Current Stage', value: job.currentStage, bg: 'bg-amber-50', color: 'text-amber-700' },
                  { label: 'Quantity', value: `${job.quantity} Nos`, bg: 'bg-purple-50', color: 'text-purple-700' },
                  { label: 'Due Date', value: job.plannedEndDate, bg: 'bg-emerald-50', color: 'text-emerald-700' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <InfoGrid items={[
                { label: 'Job Number', value: <span className="font-mono text-brand-700 font-bold">{job.jobNumber}</span> },
                { label: 'Current Stage', value: <StatusBadge status={job.currentStage} /> },
                { label: 'Production Status', value: <StatusBadge status={job.status} /> },
                { label: 'Priority', value: <PriorityBadge priority={job.priority} /> },
                { label: 'Planned Start', value: job.plannedStartDate },
                { label: 'Planned Due Date', value: job.plannedEndDate },
                { label: 'Customer', value: customer?.companyName ?? '—' },
                { label: 'Plant Location', value: 'Makarpura GIDC, Vadodara' },
              ]} />

              {nextStage && (
                <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Next Manufacturing Milestone: {nextStage}</p>
                    <p className="text-xs text-gray-500">Advance this job to the next stage in the production cycle</p>
                  </div>
                  <button className="btn-primary text-xs" onClick={handleAdvanceStage}>
                    Advance to {nextStage} <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CUSTOMER */}
          {tab === 'customer' && customer && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <p className="text-xl font-bold text-gray-900">{customer.companyName}</p>
                <p className="text-gray-600 font-medium">{customer.contactPerson} · {customer.industry}</p>
                <div className="flex gap-3 mt-3">
                  <span className="text-xs bg-white px-2.5 py-1 rounded-full font-semibold border">{customer.mobile}</span>
                  <span className="text-xs bg-white px-2.5 py-1 rounded-full font-semibold border">{customer.email}</span>
                </div>
              </div>
              <InfoGrid items={[
                { label: 'Customer Code', value: customer.customerCode },
                { label: 'GST Number', value: customer.gstNumber ?? '—' },
                { label: 'Payment Terms', value: customer.paymentTerms },
                { label: 'Customer Type', value: customer.customerType },
                { label: 'Credit Limit', value: formatCurrency(customer.creditLimit) },
                { label: 'Outstanding', value: formatCurrency(customer.outstandingAmount) },
              ]} />
              {salesOrder && (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Customer PO Details</p>
                  <InfoGrid items={[
                    { label: 'PO Number', value: <span className="font-mono text-blue-700 font-bold">{salesOrder.poNumber}</span> },
                    { label: 'PO Date', value: salesOrder.poDate },
                    { label: 'Committed Delivery', value: salesOrder.deliveryDate },
                    { label: 'PO Value', value: formatCurrency(salesOrder.totalAmount) },
                    { label: 'Advance Paid', value: <span className="text-emerald-700 font-bold">{formatCurrency(salesOrder.paidAmount)}</span> },
                    { label: 'Balance Due', value: <span className="text-red-600 font-bold">{formatCurrency(salesOrder.balanceAmount)}</span> },
                  ]} />
                </div>
              )}
            </div>
          )}

          {/* DESIGN */}
          {tab === 'design' && (
            <div className="space-y-4">
              {design ? (
                <>
                  <div className={`rounded-xl p-4 border ${design.status === 'Customer Approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{design.designNumber}</span>
                      <StatusBadge status={design.status} />
                    </div>
                  </div>
                  <InfoGrid items={[
                    { label: 'Design Number', value: design.designNumber },
                    { label: 'Revision', value: <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-sm font-bold">{design.currentRevision}</span> },
                    { label: 'Designer', value: design.designer },
                    { label: 'Dimensions', value: design.dimensions },
                    { label: 'MOC / Material', value: design.material },
                  ]} />
                  <div>
                    <p className="label mb-2">Technical Specifications</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100">{design.technicalSpecs}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FileText size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No design drawing attached yet</p>
                  <button className="btn-primary mt-3 text-xs" onClick={() => navigate('/designs')}>Create Design</button>
                </div>
              )}
            </div>
          )}

          {/* BOM */}
          {tab === 'bom' && (
            <div className="space-y-4">
              {bom ? (
                <>
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div>
                      <p className="font-bold text-gray-900">{bom.bomNumber}</p>
                      <p className="text-xs text-gray-500">Revision {bom.revision} · {bom.items.length} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand-700">{formatCurrency(bom.totalEstimatedCost)}</p>
                      <StatusBadge status={bom.status} />
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="table-th text-xs">#</th>
                          <th className="table-th text-xs">Item</th>
                          <th className="table-th text-xs">Specification</th>
                          <th className="table-th text-xs text-right">Qty</th>
                          <th className="table-th text-xs text-right">Stock</th>
                          <th className="table-th text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bom.items.map(item => (
                          <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="table-td text-xs text-gray-400">{item.lineNo}</td>
                            <td className="table-td">
                              <p className="font-medium text-gray-800">{item.itemName}</p>
                              <p className="text-gray-400 font-mono text-[11px]">{item.itemCode}</p>
                            </td>
                            <td className="table-td text-gray-500 max-w-[140px] truncate">{item.specification}</td>
                            <td className="table-td text-right font-bold">{item.quantity} {item.unit}</td>
                            <td className="table-td text-right">
                              <span className={item.isAvailable ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                                {item.availableStock ?? 0}
                              </span>
                            </td>
                            <td className="table-td">
                              {item.isAvailable
                                ? <StatusBadge status="Available" variant="success" size="sm" dot />
                                : <StatusBadge status="Short" variant="danger" size="sm" dot />
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Clipboard size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No BOM created yet</p>
                  <button className="btn-primary mt-3 text-xs" onClick={() => navigate('/bom')}>Create BOM</button>
                </div>
              )}
            </div>
          )}

          {/* FABRICATION */}
          {tab === 'fabrication' && (
            <div className="space-y-3">
              {fabOrders.map(fab => (
                <div key={fab.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm font-mono text-brand-700">{fab.fabOrderNumber}</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{fab.component}</p>
                      <p className="text-xs text-gray-500">{fab.material} · Work Center: <strong>{fab.workCenter}</strong></p>
                    </div>
                    <StatusBadge status={fab.status} />
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Fabrication Progress</span>
                      <span className="font-bold">{fab.completionPercent}%</span>
                    </div>
                    <ProgressBar percent={fab.completionPercent} size="sm" color={fab.status === 'Completed' ? 'bg-emerald-500' : 'bg-brand-600'} />
                  </div>
                  {fab.status !== 'Completed' && (
                    <button
                      className="btn-success text-xs mt-3 w-full py-1.5 flex items-center justify-center gap-1.5"
                      onClick={() => handleCompleteFab(fab.id)}
                    >
                      <CheckCircle size={12} /> Mark Fabrication Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* PRODUCTION */}
          {tab === 'production' && (
            <div className="space-y-4">
              {prodOrder ? (
                <>
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <p className="font-bold font-mono text-brand-700">{prodOrder.productionOrderNumber}</p>
                      <StatusBadge status={prodOrder.status} />
                    </div>
                    <div className="mt-3">
                      <ProgressBar percent={prodOrder.progressPercent} label />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {prodOrder.stages.map(stage => (
                      <div key={stage.stage} className={`flex items-center gap-3 p-3 rounded-lg border ${
                        stage.status === 'Completed' ? 'border-emerald-100 bg-emerald-50' :
                        stage.status === 'In Progress' ? 'border-brand-200 bg-brand-50' :
                        'border-gray-100'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          stage.status === 'Completed' ? 'bg-emerald-500 text-white' :
                          stage.status === 'In Progress' ? 'bg-brand-600 text-white' : 'bg-gray-200'
                        }`}>
                          {stage.status === 'Completed' ? <CheckCircle size={12} /> : <Factory size={12} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{stage.stage}</p>
                          <p className="text-xs text-gray-400">Target: {job.plannedEndDate}</p>
                        </div>
                        <StatusBadge status={stage.status} size="sm" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Factory size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Production order not initialized</p>
                  <button className="btn-primary mt-3 text-xs" onClick={() => navigate('/production')}>Initialize Production</button>
                </div>
              )}
            </div>
          )}

          {/* QC */}
          {tab === 'qc' && (
            <div className="space-y-4">
              {qcInspection ? (
                <>
                  <div className={`rounded-xl p-4 border ${qcInspection.overallResult === 'Passed' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{qcInspection.qcNumber}</p>
                        <p className="text-xs text-gray-500">Inspector: {qcInspection.inspector} · {qcInspection.inspectionDate}</p>
                      </div>
                      <StatusBadge status={qcInspection.overallResult} />
                    </div>
                  </div>
                  {qcInspection.overallResult !== 'Passed' && (
                    <button
                      className="btn-success text-xs w-full py-2 flex items-center justify-center gap-1.5"
                      onClick={() => handlePassQC(qcInspection.id)}
                    >
                      <CheckCircle size={13} /> Approve QC and Unlock Dispatch
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Shield size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No QC inspection recorded</p>
                  <button className="btn-primary mt-3 text-xs" onClick={() => navigate('/qc')}>Create Inspection</button>
                </div>
              )}
            </div>
          )}

          {/* DISPATCH */}
          {tab === 'dispatch' && (
            <div className="space-y-4">
              {dispatchOrder ? (
                <InfoGrid items={[
                  { label: 'Dispatch Number', value: dispatchOrder.dispatchNumber },
                  { label: 'Status', value: <StatusBadge status={dispatchOrder.status} /> },
                  { label: 'Dispatch Date', value: dispatchOrder.dispatchDate ?? 'Ready for transport' },
                  { label: 'Transporter', value: dispatchOrder.transporter ?? 'Transporter Assigned' },
                  { label: 'Vehicle No', value: dispatchOrder.vehicleNumber ?? 'GJ-06-XX-1234' },
                  { label: 'LR Number', value: dispatchOrder.lrNumber ?? 'LR-90218' },
                ]} />
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Truck size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Dispatch stage</p>
                  <button className="btn-primary mt-3 text-xs" onClick={() => navigate('/dispatch')}>Create Dispatch Order</button>
                </div>
              )}
            </div>
          )}

          {/* TASKS */}
          {tab === 'tasks' && (
            <div className="space-y-3">
              {jobTasks.map(task => (
                <div key={task.id} className="border border-gray-200 rounded-xl p-3.5 bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{task.taskName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{task.department} · Due: {task.dueDate}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ACTIVITY */}
          {tab === 'activity' && (
            <ActivityTimeline activities={jobActivity} />
          )}

        </div>
      </div>
    </Drawer>
  );
}

// ─── JOBS LIST ────────────────────────────────
export function Jobs() {
  const navigate = useNavigate();
  const { jobs, customers, addJob } = useERP();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [selected360, setSelected360] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // New Job Form
  const [productName, setProductName] = useState('Custom Conveyor Assembly');
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [estimatedValue, setEstimatedValue] = useState(420000);
  const [plannedEndDate, setPlannedEndDate] = useState(new Date(Date.now() + 86400000 * 21).toISOString().split('T')[0]);
  const [priority, setPriority] = useState<Priority>('High');

  const filtered = jobs.filter(j => {
    const cust = customers.find(c => c.id === j.customerId);
    const matchSearch = j.jobNumber.toLowerCase().includes(search.toLowerCase()) ||
      j.productName.toLowerCase().includes(search.toLowerCase()) ||
      (cust?.companyName ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'All' || j.currentStage === stageFilter;
    return matchSearch && matchStage;
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const newJob: Job = {
      id: `JOB-${Date.now()}`,
      jobNumber: `JOB-2026-${String(jobs.length + 1).padStart(3, '0')}`,
      customerId: customerId || customers[0]?.id || 'CUST-001',
      productId: 'PROD-001',
      productName,
      quantity: Number(quantity) || 1,
      currentStage: 'Fabrication',
      status: 'Active',
      progressPercent: 15,
      priority,
      estimatedValue: Number(estimatedValue),
      plannedStartDate: new Date().toISOString().split('T')[0],
      plannedEndDate,
      configuration: { category: 'Custom Industrial Machinery' },
      createdAt: new Date().toISOString().split('T')[0],
    };
    addJob(newJob);
    setAddOpen(false);
    setSelected360(newJob.id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <WorkflowPipelineBanner currentStep={6} />

      <SectionHeader
        title="Manufacturing Jobs (Shop Floor)"
        subtitle={`${jobs.length} production jobs · Track complete 360° lifecycle from Design to Dispatch`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search jobs..." className="w-64" />
            <select className="select w-auto text-xs" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
              <option value="All">All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> New Production Job
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-th">Job Number</th>
              <th className="table-th">Customer</th>
              <th className="table-th">Product Description</th>
              <th className="table-th text-center">Qty</th>
              <th className="table-th">Stage</th>
              <th className="table-th">Progress</th>
              <th className="table-th">Priority</th>
              <th className="table-th text-right">Job Value</th>
              <th className="table-th">Due Date</th>
              <th className="table-th w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(job => {
              const customer = customers.find(c => c.id === job.customerId);
              return (
                <tr
                  key={job.id}
                  className="table-row"
                  onClick={() => setSelected360(job.id)}
                >
                  <td className="table-td">
                    <span className="font-mono font-bold text-brand-700">{job.jobNumber}</span>
                  </td>
                  <td className="table-td font-semibold text-gray-900">{customer?.companyName ?? 'Customer'}</td>
                  <td className="table-td max-w-[200px]">
                    <p className="truncate text-sm text-gray-800 font-medium">{job.productName}</p>
                    <p className="text-xs text-gray-400 font-mono">{job.productId}</p>
                  </td>
                  <td className="table-td text-center font-bold">{job.quantity}</td>
                  <td className="table-td"><StatusBadge status={job.currentStage} /></td>
                  <td className="table-td w-36">
                    <ProgressBar percent={job.progressPercent} size="sm" label />
                  </td>
                  <td className="table-td"><PriorityBadge priority={job.priority} /></td>
                  <td className="table-td text-right font-bold text-gray-900">{formatCurrency(job.estimatedValue)}</td>
                  <td className="table-td text-xs text-gray-500 font-medium">{job.plannedEndDate}</td>
                  <td className="table-td">
                    <button
                      className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                      onClick={(e) => { e.stopPropagation(); setSelected360(job.id); }}
                    >
                      360° <Eye size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected360 && (
        <Job360 jobId={selected360} onClose={() => setSelected360(null)} />
      )}

      {/* New Job Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Start New Production Job"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleCreateJob}>Launch Job 360°</button>
          </div>
        }
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          <FormField label="Product / Machine Description" required>
            <input className="input" value={productName} onChange={e => setProductName(e.target.value)} required />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Customer" required>
              <select className="select" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
            </FormField>
            <FormField label="Quantity (Nos)" required>
              <input type="number" className="input font-bold" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} required />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Estimated Value (₹)" required>
              <input type="number" className="input font-bold" value={estimatedValue} onChange={e => setEstimatedValue(Number(e.target.value))} required />
            </FormField>
            <FormField label="Planned Completion Date" required>
              <input type="date" className="input font-bold" value={plannedEndDate} onChange={e => setPlannedEndDate(e.target.value)} required />
            </FormField>
            <FormField label="Priority" required>
              <select className="select" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
