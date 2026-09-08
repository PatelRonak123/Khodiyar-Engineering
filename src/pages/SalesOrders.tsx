import React, { useState } from 'react';
import { Plus, Eye, Printer, ArrowRight, CheckCircle, Factory, ShoppingCart, ReceiptText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchBar, StatusBadge, SectionHeader, Drawer, InfoGrid, formatCurrency, Modal, FormField, WorkflowPipelineBanner } from '../components/ui';
import type { SalesOrder, Quotation } from '../types';
import { useERP } from '../context/ERPContext';

export function SalesOrders() {
  const navigate = useNavigate();
  const { salesOrders, quotations, customers, jobs, addSalesOrder, addJob, updateQuotation } = useERP();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SalesOrder | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Record PO Form state
  const [poNumber, setPoNumber] = useState('');
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [productName, setProductName] = useState('Heavy Duty Belt Conveyor 10M Length');
  const [quantity, setQuantity] = useState(1);
  const [totalAmount, setTotalAmount] = useState(448400);
  const [advancePercent, setAdvancePercent] = useState(40);
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 86400000 * 21).toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState('40% Advance, 60% against dispatch inspection');

  // Quotations awaiting customer PO
  const pendingQuotations = quotations.filter(q => q.status === 'Sent' || q.status === 'Won' || !salesOrders.some(s => s.quotationId === q.id));

  const filtered = salesOrders.filter(o => {
    const cust = customers.find(c => c.id === o.customerId);
    return o.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      (cust?.companyName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (o.productName ?? '').toLowerCase().includes(search.toLowerCase());
  });

  const handleOpenPOForQuotation = (q: Quotation) => {
    setCustomerId(q.customerId);
    setProductName(q.lineItems[0]?.description || 'Industrial Machinery');
    setQuantity(q.lineItems[0]?.quantity || 1);
    setTotalAmount(q.totalAmount);
    setDeliveryDate(new Date(Date.now() + 86400000 * 7 * q.deliveryWeeks).toISOString().split('T')[0]);
    setPaymentTerms(q.paymentTerms);
    setPoNumber(`PO-CUST-${String(Date.now()).slice(-4)}`);
    setAddOpen(true);
  };

  const handleRecordPO = (e: React.FormEvent) => {
    e.preventDefault();
    const poNum = poNumber || `PO-KE-${String(Date.now()).slice(-4)}`;
    const paid = Math.round((Number(totalAmount) * Number(advancePercent)) / 100);
    const balance = Number(totalAmount) - paid;
    const jobId = `JOB-${Date.now()}`;

    const newSO: SalesOrder = {
      id: `SO-${Date.now()}`,
      poNumber: poNum,
      poDate: new Date().toISOString().split('T')[0],
      customerId: customerId || customers[0]?.id || 'CUST-001',
      jobId,
      productName,
      quantity: Number(quantity) || 1,
      totalAmount: Number(totalAmount),
      paidAmount: paid,
      balanceAmount: balance,
      deliveryDate,
      paymentTerms,
      shippingAddress: customers.find(c => c.id === customerId)?.shippingAddress || {
        line1: 'GIDC Industrial Area', city: 'Vadodara', state: 'Gujarat', pincode: '390010', country: 'India'
      },
      status: 'Confirmed',
      createdAt: new Date().toISOString().split('T')[0],
    };

    addSalesOrder(newSO);

    // Auto-create Production Job 360
    const newJob = {
      id: jobId,
      jobNumber: `JOB-2026-${String(jobs.length + 1).padStart(3, '0')}`,
      customerId: customerId || customers[0]?.id || 'CUST-001',
      productId: 'PROD-001',
      productName,
      quantity: Number(quantity) || 1,
      currentStage: 'Fabrication' as const,
      status: 'Active' as const,
      progressPercent: 20,
      priority: 'High' as const,
      estimatedValue: Number(totalAmount),
      plannedStartDate: new Date().toISOString().split('T')[0],
      plannedEndDate: deliveryDate,
      configuration: { category: 'Custom Industrial Machinery' },
      createdAt: new Date().toISOString().split('T')[0],
    };
    addJob(newJob);

    setAddOpen(false);
    setSelected(newSO);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <WorkflowPipelineBanner currentStep={5} />

      <SectionHeader
        title="5. Customer Purchase Orders (Sales Orders)"
        subtitle={`${salesOrders.length} confirmed orders · ${formatCurrency(salesOrders.reduce((a, o) => a + o.totalAmount, 0))} total order book`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search customer PO..." className="w-64" />
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> Record Customer P.O
            </button>
          </>
        }
      />

      {/* Quotations awaiting PO queue */}
      {pendingQuotations.length > 0 && (
        <div className="card p-4 border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ReceiptText size={16} className="text-emerald-700" />
              <h3 className="text-sm font-bold text-emerald-900">
                Quotations Ready to Convert into Customer P.O ({pendingQuotations.length})
              </h3>
            </div>
            <span className="text-xs text-emerald-700 font-medium">Click to confirm order and launch production</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingQuotations.slice(0, 3).map(q => {
              const cust = customers.find(c => c.id === q.customerId);
              return (
                <div key={q.id} className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-brand-700">{q.quotationNumber}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">{formatCurrency(q.totalAmount)}</span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 mt-1">{cust?.companyName ?? 'Customer'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{q.lineItems[0]?.description}</p>
                  </div>
                  <button
                    className="btn-primary text-xs w-full mt-3 py-1.5 flex items-center justify-center gap-1.5"
                    onClick={() => handleOpenPOForQuotation(q)}
                  >
                    <ShoppingCart size={13} /> Record Customer PO & Start Job <ArrowRight size={11} />
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
              <th className="table-th">Customer P.O No</th>
              <th className="table-th">PO Date</th>
              <th className="table-th">Customer / Client</th>
              <th className="table-th">Product Description</th>
              <th className="table-th text-center">Qty</th>
              <th className="table-th">Delivery Date</th>
              <th className="table-th text-right">Order Value</th>
              <th className="table-th text-right">Advance Paid</th>
              <th className="table-th">Status</th>
              <th className="table-th w-32">Next Step</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => {
              const cust = customers.find(c => c.id === o.customerId);
              return (
                <tr key={o.id} className="table-row" onClick={() => setSelected(o)}>
                  <td className="table-td font-mono font-semibold text-brand-700 text-xs">{o.poNumber}</td>
                  <td className="table-td text-xs text-gray-500">{o.poDate}</td>
                  <td className="table-td font-semibold text-sm text-gray-900">{cust?.companyName ?? 'Customer'}</td>
                  <td className="table-td text-xs text-gray-600 max-w-[160px] truncate">{o.productName ?? 'Machinery'}</td>
                  <td className="table-td text-center font-bold">{o.quantity}</td>
                  <td className="table-td text-xs text-gray-500 font-medium">{o.deliveryDate}</td>
                  <td className="table-td text-right font-bold text-gray-900">{formatCurrency(o.totalAmount)}</td>
                  <td className="table-td text-right text-emerald-600 font-bold">{formatCurrency(o.paidAmount)}</td>
                  <td className="table-td"><StatusBadge status={o.status} /></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                        onClick={() => navigate('/jobs')}
                      >
                        Production <Factory size={11} />
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
          title={selected.poNumber}
          subtitle={customers.find(c => c.id === selected.customerId)?.companyName}
          actions={
            <div className="flex gap-2">
              <button className="btn-primary text-xs" onClick={() => navigate('/jobs')}>
                <Factory size={12} /> Open Job 360° in Production (Step 6)
              </button>
            </div>
          }
        >
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Order Value', value: formatCurrency(selected.totalAmount), color: 'text-blue-700', bg: 'bg-blue-50' },
                { label: 'Advance Received', value: formatCurrency(selected.paidAmount), color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'Balance on Dispatch', value: formatCurrency(selected.balanceAmount), color: 'text-red-600', bg: 'bg-red-50' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <p className={`font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <InfoGrid items={[
              { label: 'Customer PO', value: selected.poNumber },
              { label: 'PO Date', value: selected.poDate },
              { label: 'Committed Delivery', value: selected.deliveryDate },
              { label: 'Payment Terms', value: selected.paymentTerms },
              { label: 'Production Status', value: <StatusBadge status={selected.status} /> },
              { label: 'Quantity Ordered', value: `${selected.quantity} Nos` },
            ]} />

            <div>
              <p className="label mb-2">Delivery & Shipping Address</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                {selected.shippingAddress.line1}, {selected.shippingAddress.city} — {selected.shippingAddress.pincode}, {selected.shippingAddress.state}
              </p>
            </div>

            <button
              className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2"
              onClick={() => navigate('/jobs')}
            >
              <Factory size={14} /> Open Production Job 360° (Step 6)
            </button>
          </div>
        </Drawer>
      )}

      {/* Record PO Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Record Customer Purchase Order (P.O)"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleRecordPO}>Save & Start Production</button>
          </div>
        }
      >
        <form onSubmit={handleRecordPO} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Customer PO Number" required>
              <input
                className="input font-mono font-bold"
                placeholder="e.g. PO-APEX-2026-902"
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Customer" required>
              <select className="select" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                {customers.map(c => <option key={c.id} value={c.id}>{c.companyName} ({c.contactPerson})</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Product / Equipment Description" required>
            <input className="input" value={productName} onChange={e => setProductName(e.target.value)} required />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Quantity (Nos)" required>
              <input type="number" className="input font-bold" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} required />
            </FormField>
            <FormField label="Total PO Value (₹)" required>
              <input type="number" className="input font-bold" value={totalAmount} onChange={e => setTotalAmount(Number(e.target.value))} required />
            </FormField>
            <FormField label="Advance Received (%)" required>
              <input type="number" className="input font-bold" value={advancePercent} onChange={e => setAdvancePercent(Number(e.target.value))} min={0} max={100} required />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Committed Delivery Date" required>
              <input type="date" className="input font-bold" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} required />
            </FormField>
            <FormField label="Commercial Payment Terms" required>
              <input className="input" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} required />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
