import React, { useState } from 'react';
import { Plus, Eye, AlertTriangle, CheckCircle, ArrowRight, ClipboardList, ShoppingCart, Layers, ReceiptText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchBar, StatusBadge, SectionHeader, Drawer, InfoGrid, ProgressBar, formatCurrency, Modal, FormField, WorkflowPipelineBanner } from '../components/ui';
import type { BOM, BOMItem, PurchaseRequest, Design } from '../types';
import { useERP } from '../context/ERPContext';

export function BOMPage() {
  const navigate = useNavigate();
  const { boms, designs, jobs, customers, inventory, addBOM, updateBOM, addPurchaseRequest } = useERP();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<BOM | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // New BOM form state
  const [jobId, setJobId] = useState(jobs[0]?.id || '');
  const [designId, setDesignId] = useState(designs[0]?.id || '');
  const [preparedBy, setPreparedBy] = useState('Dilip Panchal');
  const [totalWeight, setTotalWeight] = useState(450);

  // Designs waiting for BOM
  const pendingDesigns = designs.filter(d => !boms.some(b => b.designId === d.id || b.jobId === d.jobId));

  const filtered = boms.filter(b => {
    const job = jobs.find(j => j.id === b.jobId);
    const cust = job ? customers.find(c => c.id === job.customerId) : null;
    return b.bomNumber.toLowerCase().includes(search.toLowerCase()) ||
      (cust?.companyName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (job?.productName ?? '').toLowerCase().includes(search.toLowerCase());
  });

  const handleOpenBOMForDesign = (d: Design) => {
    setDesignId(d.id);
    setJobId(d.jobId);
    setPreparedBy(d.designer || 'Dilip Panchal');
    setAddOpen(true);
  };

  const handleCreateBOM = (e: React.FormEvent) => {
    e.preventDefault();
    const relatedJob = jobs.find(j => j.id === jobId);
    const defaultItems: BOMItem[] = [
      { id: 'bi-1', lineNo: 1, itemCode: 'RM-MS-PL-001', itemName: 'MS Plate 8mm IS2062', specification: '2500x1250x8mm', quantity: 4, unit: 'Nos', isAvailable: true, availableStock: 15, unitCost: 4500, totalCost: 18000 },
      { id: 'bi-2', lineNo: 2, itemCode: 'RM-MS-CH-001', itemName: 'ISMC Channel 100x50', specification: '100x50mm x 6m length', quantity: 6, unit: 'Nos', isAvailable: true, availableStock: 22, unitCost: 3200, totalCost: 19200 },
      { id: 'bi-3', lineNo: 3, itemCode: 'COMP-MOT-001', itemName: 'Geared Motor 3HP 415V', specification: '3HP / 2.2kW, 50 RPM output', quantity: 1, unit: 'Nos', isAvailable: true, availableStock: 2, unitCost: 28000, totalCost: 28000 },
      { id: 'bi-4', lineNo: 4, itemCode: 'COMP-BLT-001', itemName: 'Nylon Conveyor Belt', specification: '650mm W x 3-ply x 5mm top/bottom', quantity: 25, unit: 'Mtr', isAvailable: false, availableStock: 0, unitCost: 1100, totalCost: 27500 },
    ];
    const totalCost = defaultItems.reduce((acc, i) => acc + i.totalCost, 0);

    const newBOM: BOM = {
      id: `BOM-${Date.now()}`,
      bomNumber: `BOM-2026-${String(boms.length + 1).padStart(3, '0')}`,
      jobId: jobId || jobs[0]?.id || 'JOB-001',
      designId: designId || relatedJob?.designId || 'DES-001',
      revision: 'R1',
      status: 'Approved',
      preparedBy,
      approvedBy: 'Dilip Panchal',
      quantity: 1,
      totalWeight: Number(totalWeight) || 450,
      totalEstimatedCost: totalCost,
      items: defaultItems,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    addBOM(newBOM);
    setAddOpen(false);
    setSelected(newBOM);
  };

  const handleGeneratePR = (bom: BOM) => {
    const shortItems = bom.items.filter(i => !i.isAvailable);
    if (shortItems.length === 0) {
      alert('All items in this BOM are already in stock!');
      return;
    }
    const newPR: PurchaseRequest = {
      id: `PR-${Date.now()}`,
      prNumber: `PR-2026-${String(Date.now()).slice(-4)}`,
      jobId: bom.jobId,
      requestedBy: bom.preparedBy || 'Production Team',
      department: 'Purchase',
      priority: 'High',
      status: 'Approved',
      approvedBy: 'Dilip Panchal',
      items: shortItems.map((item, idx) => ({
        id: `pri-${idx + 1}`,
        itemCode: item.itemCode,
        itemName: item.itemName,
        specification: item.specification,
        quantity: item.quantity,
        unit: item.unit,
        requiredDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      })),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    addPurchaseRequest(newPR);
    setAlertMsg(`Purchase Request ${newPR.prNumber} generated for ${shortItems.length} short materials!`);
    setTimeout(() => setAlertMsg(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <WorkflowPipelineBanner currentStep={3} />

      <SectionHeader
        title="3. Bill of Materials (BOM)"
        subtitle={`${boms.length} BOMs · Material requirements planning and inventory availability`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search BOM..." className="w-64" />
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> New BOM
            </button>
          </>
        }
      />

      {alertMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-sm animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600" />
            <span>{alertMsg}</span>
          </div>
          <button className="btn-secondary text-xs py-1" onClick={() => navigate('/purchase-requests')}>
            View in Purchase Requests <ArrowRight size={11} />
          </button>
        </div>
      )}

      {/* Designs waiting for BOM Queue */}
      {pendingDesigns.length > 0 && (
        <div className="card p-4 border-amber-200 bg-amber-50/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-amber-700" />
              <h3 className="text-sm font-bold text-amber-900">
                Approved Designs Awaiting BOM Generation ({pendingDesigns.length})
              </h3>
            </div>
            <span className="text-xs text-amber-700 font-medium">Click to create material structure</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingDesigns.map(d => {
              const job = jobs.find(j => j.id === d.jobId);
              const cust = job ? customers.find(c => c.id === job.customerId) : null;
              return (
                <div key={d.id} className="bg-white rounded-xl p-3 border border-amber-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-brand-700">{d.designNumber}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Approved</span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 mt-1">{cust?.companyName ?? 'Customer'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{d.dimensions}</p>
                  </div>
                  <button
                    className="btn-primary text-xs w-full mt-3 py-1.5 flex items-center justify-center gap-1.5"
                    onClick={() => handleOpenBOMForDesign(d)}
                  >
                    <ClipboardList size={13} /> Generate BOM for this Design <ArrowRight size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-th">BOM Number</th>
              <th className="table-th">Job Ref</th>
              <th className="table-th">Customer</th>
              <th className="table-th">Rev</th>
              <th className="table-th">Items Summary</th>
              <th className="table-th">Est. Cost</th>
              <th className="table-th">Prepared By</th>
              <th className="table-th">Status</th>
              <th className="table-th w-32">Next Step</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => {
              const job = jobs.find(j => j.id === b.jobId);
              const cust = job ? customers.find(c => c.id === job.customerId) : null;
              const shortItems = b.items.filter(i => !i.isAvailable).length;
              return (
                <tr key={b.id} className="table-row" onClick={() => setSelected(b)}>
                  <td className="table-td font-mono font-semibold text-brand-700 text-xs">{b.bomNumber}</td>
                  <td className="table-td font-mono text-blue-700 text-xs">{job?.jobNumber ?? 'JOB-2026-001'}</td>
                  <td className="table-td font-semibold text-sm text-gray-900">{cust?.companyName ?? 'Customer'}</td>
                  <td className="table-td"><span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs font-bold">{b.revision}</span></td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{b.items.length} items</span>
                      {shortItems > 0 ? (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 font-bold flex items-center gap-0.5">
                          <AlertTriangle size={11} /> {shortItems} short
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                          <CheckCircle size={11} /> 100% in stock
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="table-td font-semibold text-gray-900">{formatCurrency(b.totalEstimatedCost)}</td>
                  <td className="table-td text-sm text-gray-600 font-medium">{b.preparedBy}</td>
                  <td className="table-td"><StatusBadge status={b.status} /></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                        onClick={() => navigate('/quotations')}
                      >
                        Quotation <ArrowRight size={11} />
                      </button>
                    </div>
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
          title={selected.bomNumber}
          subtitle={`${selected.items.length} materials · ${formatCurrency(selected.totalEstimatedCost)}`}
          actions={
            <div className="flex gap-2">
              {selected.items.some(i => !i.isAvailable) && (
                <button className="btn-secondary text-xs" onClick={() => handleGeneratePR(selected)}>
                  <ShoppingCart size={12} /> Raise PR for Short Items
                </button>
              )}
              <button className="btn-primary text-xs" onClick={() => navigate('/quotations')}>
                Proceed to 4. Quotation <ArrowRight size={12} />
              </button>
            </div>
          }
        >
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Items', value: selected.items.length, bg: 'bg-blue-50', color: 'text-blue-700' },
                { label: 'In Stock', value: selected.items.filter(i => i.isAvailable).length, bg: 'bg-emerald-50', color: 'text-emerald-700' },
                { label: 'Stock Shortage', value: selected.items.filter(i => !i.isAvailable).length, bg: 'bg-red-50', color: 'text-red-600' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <InfoGrid items={[
              { label: 'BOM Number', value: selected.bomNumber },
              { label: 'Revision', value: selected.revision },
              { label: 'Approval Status', value: <StatusBadge status={selected.status} /> },
              { label: 'Prepared By', value: selected.preparedBy },
              { label: 'Approved By', value: selected.approvedBy ?? '—' },
              { label: 'Estimated Weight', value: `${selected.totalWeight} kg` },
              { label: 'Total Material Cost', value: formatCurrency(selected.totalEstimatedCost) },
              { label: 'Job Ref', value: jobs.find(j => j.id === selected.jobId)?.jobNumber ?? '—' },
            ]} />

            <div>
              <p className="label mb-3">Material Requirements Breakdown</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="table-th text-xs">#</th>
                      <th className="table-th text-xs">Material / Component</th>
                      <th className="table-th text-xs">Specification</th>
                      <th className="table-th text-xs text-right">Req Qty</th>
                      <th className="table-th text-xs text-right">In Stock</th>
                      <th className="table-th text-xs text-right">Est. Unit Cost</th>
                      <th className="table-th text-xs">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map(item => (
                      <tr key={item.id} className={`border-b border-gray-50 ${!item.isAvailable ? 'bg-red-50/40' : ''}`}>
                        <td className="table-td text-xs text-gray-400">{item.lineNo}</td>
                        <td className="table-td">
                          <p className="font-semibold text-gray-800">{item.itemName}</p>
                          <p className="text-gray-400 font-mono text-[11px]">{item.itemCode}</p>
                        </td>
                        <td className="table-td text-gray-500 max-w-[140px] truncate">{item.specification}</td>
                        <td className="table-td text-right font-bold">{item.quantity} {item.unit}</td>
                        <td className="table-td text-right">
                          <span className={item.isAvailable ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                            {item.availableStock ?? 0}
                          </span>
                        </td>
                        <td className="table-td text-right font-medium">{item.unitCost ? formatCurrency(item.unitCost) : '—'}</td>
                        <td className="table-td">
                          {item.isAvailable ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle size={12} /> Available
                            </span>
                          ) : (
                            <span className="text-red-600 font-bold flex items-center gap-1">
                              <AlertTriangle size={12} /> Short
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2"
              onClick={() => navigate('/quotations')}
            >
              <ReceiptText size={14} /> Proceed to Step 4: Commercial Quotation
            </button>
          </div>
        </Drawer>
      )}

      {/* New BOM Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Create Bill of Materials (BOM)"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleCreateBOM}>Save & Approve BOM</button>
          </div>
        }
      >
        <form onSubmit={handleCreateBOM} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Related Engineering Design" required>
              <select className="select" value={designId} onChange={e => setDesignId(e.target.value)}>
                {designs.map(d => (
                  <option key={d.id} value={d.id}>{d.designNumber} ({d.material})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Production Job" required>
              <select className="select" value={jobId} onChange={e => setJobId(e.target.value)}>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.jobNumber} — {j.productName}</option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Prepared By (Engineer)" required>
              <select className="select" value={preparedBy} onChange={e => setPreparedBy(e.target.value)}>
                <option>Dilip Panchal</option>
                <option>Ramesh Patel</option>
              </select>
            </FormField>
            <FormField label="Estimated Total Weight (kg)" required>
              <input
                type="number"
                className="input font-bold"
                value={totalWeight}
                onChange={e => setTotalWeight(Number(e.target.value))}
                required
              />
            </FormField>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
            ✨ Material structure (MS Plates, ISMC Channels, Geared Motor, Bearings, Conveyor Belt) will be automatically linked and stock availability checked.
          </div>
        </form>
      </Modal>
    </div>
  );
}
