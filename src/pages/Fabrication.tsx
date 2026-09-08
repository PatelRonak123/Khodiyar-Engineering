import React, { useState } from 'react';
import { Plus, Eye, CheckCircle, Hammer, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchBar, StatusBadge, PriorityBadge, SectionHeader, Drawer, InfoGrid, ProgressBar, Modal, FormField } from '../components/ui';
import type { FabricationOrder, WorkCenterType, Priority } from '../types';
import { useERP } from '../context/ERPContext';

const workCenterColors: Record<string, string> = {
  Cutting: 'bg-blue-100 text-blue-700',
  Welding: 'bg-orange-100 text-orange-700',
  Machining: 'bg-purple-100 text-purple-700',
  Drilling: 'bg-cyan-100 text-cyan-700',
  Grinding: 'bg-yellow-100 text-yellow-700',
  Assembly: 'bg-emerald-100 text-emerald-700',
  Finishing: 'bg-pink-100 text-pink-700',
  Painting: 'bg-indigo-100 text-indigo-700',
};

export function Fabrication() {
  const navigate = useNavigate();
  const { fabricationOrders, jobs, employees, addFabricationOrder, updateFabricationOrder } = useERP();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState<FabricationOrder | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // New Fab Order Form
  const [jobId, setJobId] = useState(jobs[0]?.id || '');
  const [component, setComponent] = useState('Main Structural Truss & Stringer Frame');
  const [material, setMaterial] = useState('ISMC 100 Channel + 8mm MS Plate');
  const [specification, setSpecification] = useState('Cut, bevel and weld 10M length truss with intermediate cross members');
  const [workCenter, setWorkCenter] = useState<WorkCenterType>('Welding');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(employees[0]?.id || 'EMP-005');
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<Priority>('High');
  const [expectedCompletion, setExpectedCompletion] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);

  const filtered = fabricationOrders.filter(f => {
    const job = jobs.find(j => j.id === f.jobId);
    const matchSearch = f.fabOrderNumber.toLowerCase().includes(search.toLowerCase()) ||
      f.component.toLowerCase().includes(search.toLowerCase()) ||
      (job?.jobNumber ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateFab = (e: React.FormEvent) => {
    e.preventDefault();
    const newFab: FabricationOrder = {
      id: `FAB-${Date.now()}`,
      fabOrderNumber: `FAB-2026-${String(fabricationOrders.length + 1).padStart(3, '0')}`,
      jobId: jobId || jobs[0]?.id || 'JOB-001',
      component,
      material,
      specification,
      quantity: Number(quantity) || 1,
      unit: 'Set',
      workCenter,
      assignedEmployeeId,
      startDate: new Date().toISOString().split('T')[0],
      expectedCompletion,
      status: 'In Progress',
      completionPercent: 10,
      priority,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    addFabricationOrder(newFab);
    setAddOpen(false);
    setSelected(newFab);
  };

  const handleStatusChange = (fabId: string, status: FabricationOrder['status'], completionPercent: number) => {
    updateFabricationOrder(fabId, { status, completionPercent });
    if (selected && selected.id === fabId) {
      setSelected(prev => prev ? { ...prev, status, completionPercent } : null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Fabrication Orders (Shop Floor)"
        subtitle={`${fabricationOrders.length} fabrication orders · ${fabricationOrders.filter(f => f.status === 'In Progress').length} in progress`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search fabrication..." className="w-64" />
            <select className="select w-auto text-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              {['Planned','Material Pending','In Progress','On Hold','Completed','Rework'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> New Fab Order
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-th">Order No</th>
              <th className="table-th">Job Ref</th>
              <th className="table-th">Component</th>
              <th className="table-th">Work Center</th>
              <th className="table-th">Fabricator</th>
              <th className="table-th">Priority</th>
              <th className="table-th">Expected Due</th>
              <th className="table-th">Progress</th>
              <th className="table-th">Status</th>
              <th className="table-th w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(fab => {
              const job = jobs.find(j => j.id === fab.jobId);
              const emp = employees.find(e => e.id === fab.assignedEmployeeId);
              return (
                <tr key={fab.id} className="table-row" onClick={() => setSelected(fab)}>
                  <td className="table-td font-mono font-semibold text-brand-700 text-xs">{fab.fabOrderNumber}</td>
                  <td className="table-td font-mono text-blue-700 text-xs">{job?.jobNumber ?? 'JOB-001'}</td>
                  <td className="table-td">
                    <p className="font-semibold text-sm text-gray-900">{fab.component}</p>
                    <p className="text-xs text-gray-400">{fab.material}</p>
                  </td>
                  <td className="table-td">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${workCenterColors[fab.workCenter] ?? 'bg-gray-100 text-gray-600'}`}>
                      {fab.workCenter}
                    </span>
                  </td>
                  <td className="table-td text-sm font-medium text-gray-800">{emp?.name ?? 'Assigned'}</td>
                  <td className="table-td"><PriorityBadge priority={fab.priority} /></td>
                  <td className="table-td text-xs text-gray-500 font-medium">{fab.expectedCompletion}</td>
                  <td className="table-td w-28">
                    <ProgressBar
                      percent={fab.completionPercent}
                      size="sm"
                      label
                      color={fab.status === 'Completed' ? 'bg-emerald-500' : fab.status === 'In Progress' ? 'bg-brand-600' : 'bg-gray-300'}
                    />
                  </td>
                  <td className="table-td"><StatusBadge status={fab.status} /></td>
                  <td className="table-td">
                    <button
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-brand-600"
                      onClick={(e) => { e.stopPropagation(); setSelected(fab); }}
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.fabOrderNumber}
          subtitle={`${selected.component} · ${selected.workCenter}`}
          actions={
            selected.status !== 'Completed' ? (
              <button
                className="btn-success text-xs"
                onClick={() => handleStatusChange(selected.id, 'Completed', 100)}
              >
                <CheckCircle size={12} /> Mark Complete
              </button>
            ) : (
              <button className="btn-primary text-xs" onClick={() => navigate('/qc')}>
                Proceed to QC <ArrowRight size={12} />
              </button>
            )
          }
        >
          <div className="p-6 space-y-6">
            <div className={`rounded-xl p-4 border ${selected.status === 'Completed' ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status={selected.status} />
                <PriorityBadge priority={selected.priority} />
              </div>
              <ProgressBar percent={selected.completionPercent} label />
            </div>

            <InfoGrid items={[
              { label: 'Component', value: selected.component },
              { label: 'Raw Material', value: selected.material },
              { label: 'Work Center', value: selected.workCenter },
              { label: 'Quantity', value: `${selected.quantity} ${selected.unit}` },
              { label: 'Start Date', value: selected.startDate },
              { label: 'Expected Due', value: selected.expectedCompletion },
              { label: 'Assigned Fabricator', value: employees.find(e => e.id === selected.assignedEmployeeId)?.name ?? '—' },
              { label: 'Job Ref', value: jobs.find(j => j.id === selected.jobId)?.jobNumber ?? '—' },
            ]} />

            <div>
              <p className="label mb-2">Fabrication Specifications & Instructions</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100 leading-relaxed">
                {selected.specification}
              </p>
            </div>

            {selected.status !== 'Completed' && (
              <div className="flex gap-2 pt-2">
                <button
                  className="btn-secondary text-xs flex-1"
                  onClick={() => handleStatusChange(selected.id, 'On Hold', selected.completionPercent)}
                >
                  Put On Hold
                </button>
                <button
                  className="btn-success text-xs flex-1"
                  onClick={() => handleStatusChange(selected.id, 'Completed', 100)}
                >
                  <CheckCircle size={12} /> Mark Complete (100%)
                </button>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* New Fab Order Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Create Fabrication Work Order"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleCreateFab}>Issue Fab Order</button>
          </div>
        }
      >
        <form onSubmit={handleCreateFab} className="space-y-4">
          <FormField label="Related Production Job" required>
            <select className="select" value={jobId} onChange={e => setJobId(e.target.value)}>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.jobNumber} — {j.productName}</option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Component / Sub-Assembly" required>
              <input className="input" value={component} onChange={e => setComponent(e.target.value)} required />
            </FormField>
            <FormField label="Work Center" required>
              <select className="select" value={workCenter} onChange={e => setWorkCenter(e.target.value as WorkCenterType)}>
                {Object.keys(workCenterColors).map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Raw Material Used" required>
              <input className="input" value={material} onChange={e => setMaterial(e.target.value)} required />
            </FormField>
            <FormField label="Assign Fabricator" required>
              <select className="select" value={assignedEmployeeId} onChange={e => setAssignedEmployeeId(e.target.value)}>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Fabrication Specification & Quality Norms" required>
            <textarea className="input" rows={2} value={specification} onChange={e => setSpecification(e.target.value)} required />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
