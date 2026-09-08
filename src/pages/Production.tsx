import React, { useState } from 'react';
import { Plus, Eye, CheckCircle } from 'lucide-react';
import { SearchBar, StatusBadge, SectionHeader, Drawer, InfoGrid, ProgressBar } from '../components/ui';
import type { ProductionOrder, AssemblyOrder } from '../types';
import { useERP } from '../context/ERPContext';

export function Production() {
  const { productionOrders, jobs, customers, employees, updateProductionOrder } = useERP();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ProductionOrder | null>(null);

  const filtered = productionOrders.filter(p => {
    const job = jobs.find(j => j.id === p.jobId);
    return p.productionOrderNumber.toLowerCase().includes(search.toLowerCase()) ||
      job?.jobNumber.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Production Orders"
        subtitle={`${productionOrders.length} production orders`}
        actions={<>
          <SearchBar value={search} onChange={setSearch} placeholder="Search production..." className="w-64" />
          <button className="btn-primary"><Plus size={14} /> New Order</button>
        </>}
      />
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            <th className="table-th">Order No</th>
            <th className="table-th">Job</th>
            <th className="table-th">Customer</th>
            <th className="table-th">Current Stage</th>
            <th className="table-th">Manager</th>
            <th className="table-th">Planned End</th>
            <th className="table-th">Progress</th>
            <th className="table-th">Status</th>
            <th className="table-th w-8"></th>
          </tr></thead>
          <tbody>
            {filtered.map(prod => {
              const job = jobs.find(j => j.id === prod.jobId);
              const cust = job ? customers.find(c => c.id === job.customerId) : null;
              return (
                <tr key={prod.id} className="table-row" onClick={() => setSelected(prod)}>
                  <td className="table-td font-mono font-semibold text-brand-700 text-xs">{prod.productionOrderNumber}</td>
                  <td className="table-td font-mono text-blue-700 text-xs">{job?.jobNumber}</td>
                  <td className="table-td font-medium text-sm">{cust?.companyName}</td>
                  <td className="table-td"><StatusBadge status={prod.currentStage} /></td>
                  <td className="table-td text-sm">{employees.find(e=>e.id===prod.productionManager)?.name}</td>
                  <td className="table-td text-xs text-gray-500">{prod.plannedEnd}</td>
                  <td className="table-td w-32"><ProgressBar percent={prod.progressPercent} size="sm" label /></td>
                  <td className="table-td"><StatusBadge status={prod.status} /></td>
                  <td className="table-td"><Eye size={14} className="text-gray-300" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected.productionOrderNumber}
          subtitle={`Stage: ${selected.currentStage}`}>
          <div className="p-6 space-y-5">
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status={selected.status} />
                <p className="text-xl font-bold text-orange-700">{selected.progressPercent}%</p>
              </div>
              <ProgressBar percent={selected.progressPercent} color="bg-orange-500" />
            </div>
            <InfoGrid items={[
              { label: 'Planned Start', value: selected.plannedStart },
              { label: 'Planned End', value: selected.plannedEnd },
              { label: 'Actual Start', value: selected.actualStart ?? '—' },
              { label: 'Manager', value: employees.find(e=>e.id===selected.productionManager)?.name ?? '—' },
              { label: 'Quantity', value: selected.quantity },
              { label: 'Priority', value: selected.priority },
            ]} />
            <div>
              <p className="label mb-3">Production Stages</p>
              <div className="space-y-2">
                {selected.stages.map(stage => (
                  <div key={stage.stage} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    stage.status==='Completed'?'border-emerald-100 bg-emerald-50':
                    stage.status==='In Progress'?'border-brand-200 bg-brand-50':
                    'border-gray-100'
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      stage.status==='Completed'?'bg-emerald-500':
                      stage.status==='In Progress'?'bg-brand-600':'bg-gray-200'
                    }`}>
                      {stage.status==='Completed'&&<CheckCircle size={11} className="text-white"/>}
                    </div>
                    <p className={`text-sm flex-1 font-medium ${stage.status==='Pending'?'text-gray-400':'text-gray-800'}`}>
                      {stage.stage}
                    </p>
                    <StatusBadge status={stage.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}

export function Assembly() {
  const { assemblyOrders, jobs, updateAssemblyOrder } = useERP();
  const [selected, setSelected] = useState<AssemblyOrder | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Assembly Orders"
        subtitle={`${assemblyOrders.length} assembly orders`}
        actions={<button className="btn-primary"><Plus size={14} /> New Assembly Order</button>}
      />
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            <th className="table-th">Order No</th>
            <th className="table-th">Job</th>
            <th className="table-th">Components</th>
            <th className="table-th">Workstation</th>
            <th className="table-th">Progress</th>
            <th className="table-th">Status</th>
            <th className="table-th w-8"></th>
          </tr></thead>
          <tbody>
            {assemblyOrders.map(asm => {
              const job = jobs.find(j => j.id === asm.jobId);
              const done = asm.checklist.filter(c=>c.completed).length;
              return (
                <tr key={asm.id} className="table-row" onClick={() => setSelected(asm)}>
                  <td className="table-td font-mono font-semibold text-brand-700 text-xs">{asm.assemblyOrderNumber}</td>
                  <td className="table-td font-mono text-blue-700 text-xs">{job?.jobNumber}</td>
                  <td className="table-td text-sm text-gray-600">{asm.components.length} components ({done}/{asm.checklist.length} steps done)</td>
                  <td className="table-td text-sm text-gray-600">{asm.workstation}</td>
                  <td className="table-td w-32"><ProgressBar percent={asm.progressPercent} size="sm" label color="bg-purple-500" /></td>
                  <td className="table-td"><StatusBadge status={asm.status} /></td>
                  <td className="table-td"><Eye size={14} className="text-gray-300" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected.assemblyOrderNumber}
          subtitle={`${selected.workstation} · ${selected.progressPercent}% complete`}>
          <div className="p-6 space-y-5">
            <ProgressBar percent={selected.progressPercent} color="bg-purple-500" label />
            <div><p className="label mb-2">Components Required</p>
              <div className="flex flex-wrap gap-2">{selected.components.map(c=><span key={c} className="bg-purple-50 text-purple-700 text-xs px-3 py-1.5 rounded-full font-semibold">{c}</span>)}</div>
            </div>
            <div>
              <p className="label mb-3">Assembly Checklist</p>
              <div className="space-y-2">
                {selected.checklist.map(item => (
                  <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border ${item.completed?'border-emerald-100 bg-emerald-50':'border-gray-100'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${item.completed?'bg-emerald-500 border-emerald-500':'border-gray-300'}`}>
                      {item.completed&&<CheckCircle size={11} className="text-white"/>}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${item.completed?'text-gray-400 line-through':'text-gray-800'}`}>
                        Step {item.step}: {item.description}
                      </p>
                      {item.completedBy&&<p className="text-xs text-gray-400 mt-0.5">{item.completedBy} · {item.completedAt?.split('T')[0]}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
