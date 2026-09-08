import React, { useState } from 'react';
import { Plus, Eye, CheckCircle, ArrowRight, ShoppingCart, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchBar, StatusBadge, PriorityBadge, SectionHeader, Drawer, InfoGrid, formatCurrency, Tabs, Modal, FormField } from '../components/ui';
import type { PurchaseRequest, PurchaseOrder, Priority, Department } from '../types';
import { useERP } from '../context/ERPContext';

export function PurchaseRequests() {
  const navigate = useNavigate();
  const { purchaseRequests, jobs, addPurchaseRequest, updatePurchaseRequest, addPurchaseOrder, suppliers } = useERP();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PurchaseRequest | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Form State
  const [jobId, setJobId] = useState(jobs[0]?.id || '');
  const [requestedBy, setRequestedBy] = useState('Dilip Panchal');
  const [department, setDepartment] = useState<Department>('Fabrication');
  const [priority, setPriority] = useState<Priority>('High');
  const [itemName, setItemName] = useState('Nylon Conveyor Belt 650mm');
  const [itemCode, setItemCode] = useState('COMP-BLT-001');
  const [quantity, setQuantity] = useState(25);
  const [unit, setUnit] = useState('Mtr');

  const filtered = purchaseRequests.filter(p =>
    p.prNumber.toLowerCase().includes(search.toLowerCase()) ||
    (jobs.find(j => j.id === p.jobId)?.jobNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
    p.requestedBy.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreatePR = (e: React.FormEvent) => {
    e.preventDefault();
    const newPR: PurchaseRequest = {
      id: `PR-${Date.now()}`,
      prNumber: `PR-2026-${String(purchaseRequests.length + 1).padStart(3, '0')}`,
      jobId: jobId || jobs[0]?.id || 'JOB-001',
      requestedBy,
      department,
      priority,
      status: 'Pending Approval',
      items: [
        {
          id: 'pri-1',
          itemCode: itemCode || 'RM-STEEL-001',
          itemName,
          specification: 'Standard industrial grade as per drawing',
          quantity: Number(quantity) || 1,
          unit,
          requiredDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        }
      ],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    addPurchaseRequest(newPR);
    setAddOpen(false);
    setSelected(newPR);
  };

  const handleApprovePR = (pr: PurchaseRequest) => {
    updatePurchaseRequest(pr.id, { status: 'Approved', approvedBy: 'Dilip Panchal' });
    if (selected && selected.id === pr.id) {
      setSelected(prev => prev ? { ...prev, status: 'Approved', approvedBy: 'Dilip Panchal' } : null);
    }
  };

  const handleConvertToPO = (pr: PurchaseRequest) => {
    const newPO: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      poNumber: `PO-2026-${String(Date.now()).slice(-4)}`,
      prId: pr.id,
      supplierId: suppliers[0]?.id || 'SUP-001',
      jobId: pr.jobId,
      status: 'Issued',
      deliveryDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      paymentTerms: '30 Days Net',
      deliveryTerms: 'Door Delivery Makarpura GIDC',
      items: pr.items.map((item, idx) => ({
        id: `poi-${idx + 1}`,
        itemCode: item.itemCode,
        itemName: item.itemName,
        specification: item.specification,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: 1200,
        totalPrice: item.quantity * 1200,
        receivedQuantity: 0,
        pendingQuantity: item.quantity,
      })),
      subtotal: pr.items.reduce((acc, i) => acc + (i.quantity * 1200), 0),
      gstAmount: Math.round(pr.items.reduce((acc, i) => acc + (i.quantity * 1200), 0) * 0.18),
      totalAmount: Math.round(pr.items.reduce((acc, i) => acc + (i.quantity * 1200), 0) * 1.18),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    addPurchaseOrder(newPO);
    updatePurchaseRequest(pr.id, { status: 'Ordered' });
    alert(`✅ Purchase Order ${newPO.poNumber} successfully issued to supplier!`);
    navigate('/purchase-orders');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Purchase Requests (PR)"
        subtitle={`${purchaseRequests.length} purchase requests · Material requisitions from shop floor`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search PR..." className="w-64" />
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> New PR
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-th">PR Number</th>
              <th className="table-th">Job Ref</th>
              <th className="table-th">Requested By</th>
              <th className="table-th">Department</th>
              <th className="table-th text-center">Items</th>
              <th className="table-th">Priority</th>
              <th className="table-th">Date</th>
              <th className="table-th">Approved By</th>
              <th className="table-th">Status</th>
              <th className="table-th w-28">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(pr => (
              <tr key={pr.id} className="table-row" onClick={() => setSelected(pr)}>
                <td className="table-td font-mono font-semibold text-brand-700 text-xs">{pr.prNumber}</td>
                <td className="table-td font-mono text-blue-700 text-xs">{jobs.find(j => j.id === pr.jobId)?.jobNumber ?? '—'}</td>
                <td className="table-td font-medium text-sm text-gray-800">{pr.requestedBy}</td>
                <td className="table-td text-xs text-gray-600 font-semibold">{pr.department}</td>
                <td className="table-td text-center font-bold">{pr.items.length}</td>
                <td className="table-td"><PriorityBadge priority={pr.priority} /></td>
                <td className="table-td text-xs text-gray-500">{pr.createdAt}</td>
                <td className="table-td text-sm text-gray-600">{pr.approvedBy ?? '—'}</td>
                <td className="table-td"><StatusBadge status={pr.status} /></td>
                <td className="table-td">
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    {pr.status === 'Approved' ? (
                      <button
                        className="btn-primary text-xs py-1 px-2 flex items-center gap-1"
                        onClick={() => handleConvertToPO(pr)}
                      >
                        Create PO <ArrowRight size={11} />
                      </button>
                    ) : (
                      <button
                        className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
                        onClick={() => setSelected(pr)}
                      >
                        View <Eye size={11} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.prNumber}
          subtitle={`${selected.requestedBy} · ${selected.items.length} items`}
          actions={
            <div className="flex gap-2">
              {selected.status === 'Pending Approval' && (
                <button className="btn-success text-xs" onClick={() => handleApprovePR(selected)}>
                  <CheckCircle size={12} /> Approve PR
                </button>
              )}
              {selected.status === 'Approved' && (
                <button className="btn-primary text-xs" onClick={() => handleConvertToPO(selected)}>
                  <ShoppingCart size={12} /> Issue Purchase Order
                </button>
              )}
            </div>
          }
        >
          <div className="p-6 space-y-5">
            <InfoGrid items={[
              { label: 'PR Number', value: selected.prNumber },
              { label: 'Job Ref', value: jobs.find(j => j.id === selected.jobId)?.jobNumber ?? '—' },
              { label: 'Requested By', value: selected.requestedBy },
              { label: 'Department', value: selected.department },
              { label: 'Priority', value: <PriorityBadge priority={selected.priority} /> },
              { label: 'Date', value: selected.createdAt },
              { label: 'Approved By', value: selected.approvedBy ?? '—' },
              { label: 'Status', value: <StatusBadge status={selected.status} /> },
            ]} />

            <div>
              <p className="label mb-3">Requisition Items</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="table-th text-xs">Item</th>
                      <th className="table-th text-xs">Specification</th>
                      <th className="table-th text-xs text-right">Qty</th>
                      <th className="table-th text-xs">Required By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map(item => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="table-td">
                          <p className="font-semibold text-gray-800">{item.itemName}</p>
                          <p className="text-gray-400 font-mono text-[11px]">{item.itemCode}</p>
                        </td>
                        <td className="table-td text-gray-500">{item.specification}</td>
                        <td className="table-td text-right font-bold">{item.quantity} {item.unit}</td>
                        <td className="table-td text-gray-500">{item.requiredDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selected.status === 'Approved' && (
              <button
                className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2"
                onClick={() => handleConvertToPO(selected)}
              >
                <ShoppingCart size={14} /> Convert to Official Purchase Order
              </button>
            )}
          </div>
        </Drawer>
      )}

      {/* New PR Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Create Purchase Requisition (PR)"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleCreatePR}>Submit PR</button>
          </div>
        }
      >
        <form onSubmit={handleCreatePR} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Related Job" required>
              <select className="select" value={jobId} onChange={e => setJobId(e.target.value)}>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.jobNumber} — {j.productName}</option>)}
              </select>
            </FormField>
            <FormField label="Department" required>
              <select className="select" value={department} onChange={e => setDepartment(e.target.value as Department)}>
                <option>Fabrication</option><option>Purchase</option><option>Assembly</option><option>Design</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Item Name / Description" required>
              <input className="input" value={itemName} onChange={e => setItemName(e.target.value)} required />
            </FormField>
            <FormField label="Item Code">
              <input className="input font-mono uppercase" value={itemCode} onChange={e => setItemCode(e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Quantity" required>
              <input type="number" className="input font-bold" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} required />
            </FormField>
            <FormField label="Unit" required>
              <select className="select" value={unit} onChange={e => setUnit(e.target.value)}>
                <option>Mtr</option><option>Nos</option><option>Kg</option><option>Set</option><option>Ltr</option>
              </select>
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function PurchaseOrders() {
  const { purchaseOrders, suppliers, jobs, addPurchaseOrder, updatePurchaseOrder } = useERP();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // New PO Form state
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [itemDesc, setItemDesc] = useState('ISMC 100 Structural Channels IS2062');
  const [qty, setQty] = useState(10);
  const [unitRate, setUnitRate] = useState(3200);
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);

  const filtered = purchaseOrders.filter(p =>
    p.poNumber.toLowerCase().includes(search.toLowerCase()) ||
    (suppliers.find(s => s.id === p.supplierId)?.companyName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = Number(qty) * Number(unitRate);
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;

    const newPO: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      poNumber: `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      supplierId: supplierId || suppliers[0]?.id || 'SUP-001',
      jobId: jobs[0]?.id || 'JOB-001',
      status: 'Issued',
      deliveryDate,
      paymentTerms: '30 Days Net',
      deliveryTerms: 'Door Delivery Makarpura GIDC',
      items: [
        {
          id: 'poi-1',
          itemCode: 'RM-MS-CH-001',
          itemName: itemDesc,
          specification: '100x50mm x 6m length',
          quantity: Number(qty) || 1,
          unit: 'Nos',
          unitPrice: Number(unitRate),
          totalPrice: subtotal,
          receivedQuantity: 0,
          pendingQuantity: Number(qty) || 1,
        }
      ],
      subtotal,
      gstAmount: gst,
      totalAmount: total,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    addPurchaseOrder(newPO);
    setAddOpen(false);
    setSelected(newPO);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Purchase Orders (Vendor PO)"
        subtitle={`${purchaseOrders.length} purchase orders · ${formatCurrency(purchaseOrders.reduce((a, p) => a + p.totalAmount, 0))} procurement total`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search PO..." className="w-64" />
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> New Vendor PO
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-th">PO Number</th>
              <th className="table-th">Supplier</th>
              <th className="table-th">Items</th>
              <th className="table-th">Expected Delivery</th>
              <th className="table-th text-right">Order Value</th>
              <th className="table-th">Payment Terms</th>
              <th className="table-th">Status</th>
              <th className="table-th w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(po => {
              const supplier = suppliers.find(s => s.id === po.supplierId);
              return (
                <tr key={po.id} className="table-row" onClick={() => setSelected(po)}>
                  <td className="table-td font-mono font-semibold text-brand-700 text-xs">{po.poNumber}</td>
                  <td className="table-td font-semibold text-sm text-gray-900">{supplier?.companyName ?? 'Supplier'}</td>
                  <td className="table-td text-xs text-gray-600 max-w-[160px] truncate">{po.items[0]?.itemName}</td>
                  <td className="table-td text-xs text-gray-500 font-medium">{po.deliveryDate}</td>
                  <td className="table-td text-right font-bold text-gray-900">{formatCurrency(po.totalAmount)}</td>
                  <td className="table-td text-xs text-gray-600">{po.paymentTerms}</td>
                  <td className="table-td"><StatusBadge status={po.status} /></td>
                  <td className="table-td"><Eye size={14} className="text-gray-300" /></td>
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
          title={selected.poNumber}
          subtitle={suppliers.find(s => s.id === selected.supplierId)?.companyName}
          actions={
            <button className="btn-secondary text-xs" onClick={() => window.print()}>
              Print Vendor PO
            </button>
          }
        >
          <div className="p-6 space-y-5">
            <InfoGrid items={[
              { label: 'PO Number', value: selected.poNumber },
              { label: 'Supplier', value: suppliers.find(s => s.id === selected.supplierId)?.companyName ?? '—' },
              { label: 'Delivery Date', value: selected.deliveryDate },
              { label: 'Payment Terms', value: selected.paymentTerms },
              { label: 'Status', value: <StatusBadge status={selected.status} /> },
              { label: 'Total Value', value: <span className="font-bold text-brand-700">{formatCurrency(selected.totalAmount)}</span> },
            ]} />
            <div>
              <p className="label mb-2">Order Line Items</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="table-th text-xs">Item</th>
                      <th className="table-th text-xs text-right">Qty</th>
                      <th className="table-th text-xs text-right">Rate</th>
                      <th className="table-th text-xs text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map(i => (
                      <tr key={i.id} className="border-b border-gray-50">
                        <td className="table-td font-medium">{i.itemName}</td>
                        <td className="table-td text-right font-bold">{i.quantity} {i.unit}</td>
                        <td className="table-td text-right">{formatCurrency(i.unitPrice)}</td>
                        <td className="table-td text-right font-bold text-gray-900">{formatCurrency(i.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* New Vendor PO Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Issue Purchase Order (Vendor PO)"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleCreatePO}>Issue PO</button>
          </div>
        }
      >
        <form onSubmit={handleCreatePO} className="space-y-4">
          <FormField label="Select Supplier" required>
            <select className="select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName} ({s.category})</option>)}
            </select>
          </FormField>
          <FormField label="Material / Item Description" required>
            <input className="input" value={itemDesc} onChange={e => setItemDesc(e.target.value)} required />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Quantity (Units)" required>
              <input type="number" className="input font-bold" value={qty} onChange={e => setQty(Number(e.target.value))} min={1} required />
            </FormField>
            <FormField label="Unit Rate (₹)" required>
              <input type="number" className="input font-bold" value={unitRate} onChange={e => setUnitRate(Number(e.target.value))} required />
            </FormField>
          </div>
          <FormField label="Committed Delivery Date" required>
            <input type="date" className="input font-bold" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} required />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
