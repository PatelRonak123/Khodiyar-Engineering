import React, { useState } from 'react';
import { Plus, Eye, CheckCircle, Printer, Truck, FileText, Package } from 'lucide-react';
import { SearchBar, StatusBadge, SectionHeader, Drawer, InfoGrid, FormField, Modal } from '../components/ui';
import type { DispatchOrder } from '../types';
import { useERP } from '../context/ERPContext';

export function Dispatch() {
  const { dispatchOrders, jobs, customers, addDispatchOrder, updateDispatchOrder } = useERP();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DispatchOrder | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [docModal, setDocModal] = useState<string | null>(null);

  // Form state
  const [jobId, setJobId] = useState(jobs[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [transporter, setTransporter] = useState('V-Trans Logistics India Ltd');
  const [vehicleNumber, setVehicleNumber] = useState('GJ-06-AX-8912');
  const [lrNumber, setLrNumber] = useState('LR-VT-90218');
  const [packingDetails, setPackingDetails] = useState('Heavy wooden saddle crating with waterproof shrink wrapping for drive module and pulleys.');

  const filtered = dispatchOrders.filter(d => {
    const cust = customers.find(c => c.id === d.customerId);
    const job = jobs.find(j => j.id === d.jobId);
    return d.dispatchNumber.toLowerCase().includes(search.toLowerCase()) ||
      (cust?.companyName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (job?.jobNumber ?? '').toLowerCase().includes(search.toLowerCase());
  });

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const relatedJob = jobs.find(j => j.id === jobId);
    const newDispatch: DispatchOrder = {
      id: `DISP-${Date.now()}`,
      dispatchNumber: `DSP-2026-${String(dispatchOrders.length + 1).padStart(3, '0')}`,
      jobId: jobId || jobs[0]?.id || 'JOB-001',
      customerId: relatedJob?.customerId || customers[0]?.id || 'CUST-001',
      dispatchDate: new Date().toISOString().split('T')[0],
      quantity: Number(quantity) || 1,
      packingDetails,
      transporter,
      vehicleNumber,
      lrNumber,
      eWayBillNumber: `EWB-24${String(Date.now()).slice(-10)}`,
      invoiceNumber: `INV-2026-${String(Date.now()).slice(-4)}`,
      deliveryAddress: customers.find(c => c.id === relatedJob?.customerId)?.shippingAddress || {
        line1: 'GIDC Industrial Area', city: 'Vadodara', state: 'Gujarat', pincode: '390010', country: 'India'
      },
      status: 'Dispatched',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    addDispatchOrder(newDispatch);
    setAddOpen(false);
    setSelected(newDispatch);
  };

  const handleDispatchNow = (dispatch: DispatchOrder) => {
    updateDispatchOrder(dispatch.id, { status: 'Delivered' });
    if (selected && selected.id === dispatch.id) {
      setSelected(prev => prev ? { ...prev, status: 'Delivered' } : null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Dispatch & Delivery Management"
        subtitle={`${dispatchOrders.length} dispatches · Final equipment handover, logistics and shipping documents`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search dispatch..." className="w-64" />
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> Create Dispatch Order
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-th">Dispatch No</th>
              <th className="table-th">Job Ref</th>
              <th className="table-th">Customer / Consignee</th>
              <th className="table-th text-center">Qty</th>
              <th className="table-th">Dispatch Date</th>
              <th className="table-th">Transporter / Vehicle</th>
              <th className="table-th">Invoice Ref</th>
              <th className="table-th">Status</th>
              <th className="table-th w-28">Documents</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => {
              const cust = customers.find(c => c.id === d.customerId);
              const job = jobs.find(j => j.id === d.jobId);
              return (
                <tr key={d.id} className="table-row" onClick={() => setSelected(d)}>
                  <td className="table-td font-mono font-semibold text-brand-700 text-xs">{d.dispatchNumber}</td>
                  <td className="table-td font-mono text-blue-700 text-xs">{job?.jobNumber ?? 'JOB-001'}</td>
                  <td className="table-td font-semibold text-sm text-gray-900">{cust?.companyName ?? 'Customer'}</td>
                  <td className="table-td text-center font-bold">{d.quantity}</td>
                  <td className="table-td text-xs text-gray-500 font-medium">{d.dispatchDate ?? 'Ready'}</td>
                  <td className="table-td">
                    <p className="text-xs font-semibold text-gray-800">{d.transporter ?? 'Self Logistics'}</p>
                    <p className="text-[11px] text-gray-400 font-mono">{d.vehicleNumber ?? '—'}</p>
                  </td>
                  <td className="table-td text-xs font-mono text-gray-600">{d.invoiceNumber ?? 'INV-2026-001'}</td>
                  <td className="table-td"><StatusBadge status={d.status} /></td>
                  <td className="table-td">
                    <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
                        onClick={() => { setSelected(d); setDocModal('Delivery Challan'); }}
                        title="Print Documents"
                      >
                        <Printer size={12} /> Print
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
          title={selected.dispatchNumber}
          subtitle={customers.find(c => c.id === selected.customerId)?.companyName}
          actions={
            <div className="flex gap-2">
              <button className="btn-secondary text-xs" onClick={() => window.print()}>
                <Printer size={12} /> Print Shipping Pack
              </button>
              {selected.status !== 'Delivered' && (
                <button className="btn-success text-xs" onClick={() => handleDispatchNow(selected)}>
                  <CheckCircle size={12} /> Mark as Delivered
                </button>
              )}
            </div>
          }
        >
          <div className="p-6 space-y-6">
            <div className={`rounded-xl p-4 border ${selected.status === 'Delivered' ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">Shipment Status: {selected.status}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Dispatched on {selected.dispatchDate}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <InfoGrid items={[
              { label: 'Dispatch Number', value: selected.dispatchNumber },
              { label: 'Job Ref', value: jobs.find(j => j.id === selected.jobId)?.jobNumber ?? '—' },
              { label: 'Tax Invoice No', value: selected.invoiceNumber ?? '—' },
              { label: 'E-Way Bill No', value: selected.eWayBillNumber ?? '—' },
              { label: 'Transporter', value: selected.transporter ?? '—' },
              { label: 'Vehicle Number', value: selected.vehicleNumber ?? '—' },
              { label: 'LR Number', value: selected.lrNumber ?? '—' },
              { label: 'Quantity', value: `${selected.quantity} Units` },
            ]} />

            <div>
              <p className="label mb-2">Packing Details & Fastening</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                {selected.packingDetails}
              </p>
            </div>

            <div>
              <p className="label mb-2">Consignee Delivery Address</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                {selected.deliveryAddress.line1}, {selected.deliveryAddress.city} — {selected.deliveryAddress.pincode}, {selected.deliveryAddress.state}
              </p>
            </div>

            <div>
              <p className="label mb-3">One-Click Dispatch Document Printing</p>
              <div className="grid grid-cols-2 gap-2.5">
                {['Tax Invoice (GST)', 'Delivery Challan (Ex-Works)', 'E-Way Bill Slip', 'Packing List & MOC Certificate'].map(doc => (
                  <button
                    key={doc}
                    type="button"
                    className="border border-gray-200 rounded-xl p-3 text-left hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer shadow-sm group"
                    onClick={() => { setDocModal(doc); }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-800 group-hover:text-brand-700">{doc}</p>
                      <Printer size={14} className="text-gray-400 group-hover:text-brand-600" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Official Khodiyar format</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Document Print Modal */}
      <Modal
        open={!!docModal}
        onClose={() => setDocModal(null)}
        title={docModal || 'Dispatch Document'}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setDocModal(null)}>Close</button>
            <button className="btn-primary" onClick={() => window.print()}>
              <Printer size={14} /> Print Document
            </button>
          </div>
        }
      >
        <div className="p-6 bg-white space-y-4 border border-gray-200 rounded-xl font-sans">
          <div className="border-b-2 border-brand-600 pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-gray-900">KHODIYAR ENGINEERING</h2>
              <p className="text-xs text-gray-500">Makarpura GIDC, Vadodara, Gujarat</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-brand-600 uppercase">{docModal}</p>
              <p className="text-xs text-gray-500 font-mono">{selected?.dispatchNumber}</p>
            </div>
          </div>
          <div className="text-xs space-y-2 text-gray-700">
            <div className="flex justify-between"><span className="text-gray-500">Consignee:</span><strong>{customers.find(c => c.id === selected?.customerId)?.companyName}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Vehicle No:</span><strong>{selected?.vehicleNumber}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">LR / Transporter:</span><strong>{selected?.lrNumber} ({selected?.transporter})</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Quantity:</span><strong>{selected?.quantity} Nos Custom Conveyor Unit</strong></div>
          </div>
          <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
            ✓ Equipment inspected, approved, fastened, and dispatched in sound working order.
          </p>
        </div>
      </Modal>

      {/* New Dispatch Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Create Dispatch Challan & Logistics Order"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleCreateDispatch}>Issue Dispatch</button>
          </div>
        }
      >
        <form onSubmit={handleCreateDispatch} className="space-y-4">
          <FormField label="Select QC-Approved Job" required>
            <select className="select" value={jobId} onChange={e => setJobId(e.target.value)}>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.jobNumber} — {j.productName}</option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Transporter Name" required>
              <input className="input" value={transporter} onChange={e => setTransporter(e.target.value)} required />
            </FormField>
            <FormField label="Vehicle Number" required>
              <input className="input" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} required />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Lorry Receipt (LR) Number" required>
              <input className="input" value={lrNumber} onChange={e => setLrNumber(e.target.value)} required />
            </FormField>
            <FormField label="Quantity (Units)" required>
              <input type="number" className="input font-bold" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} required />
            </FormField>
          </div>
          <FormField label="Packing & Fastening Instructions" required>
            <textarea className="input" rows={2} value={packingDetails} onChange={e => setPackingDetails(e.target.value)} required />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
