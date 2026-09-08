import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Printer, ArrowRight, Eye, CheckCircle, Download, ShoppingCart, Building2, ClipboardList } from 'lucide-react';
import { SearchBar, StatusBadge, SectionHeader, Drawer, InfoGrid, formatCurrency, Modal, FormField, WorkflowPipelineBanner } from '../components/ui';
import type { Quotation, SalesOrder, QuotationLineItem, BOM } from '../types';
import { useERP } from '../context/ERPContext';

const LOGO_URL = 'https://cpimg.tistatic.com//131928/6/template_photo_1.png';

function QuotationPrintPreview({ q }: { q: Quotation }) {
  const { customers } = useERP();
  const customer = customers.find(c => c.id === q.customerId);
  return (
    <div className="bg-white p-8 text-sm font-sans min-w-[700px]">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-brand-600 pb-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            <img src={LOGO_URL} className="w-full h-full object-contain" alt="Logo" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">KHODIYAR ENGINEERING</h1>
            <p className="text-xs text-gray-500">Building No. 750/A/2, Makarpura GIDC, Vadodara – 390010, Gujarat</p>
            <p className="text-xs text-gray-500">GST: 24AZDPP3013A1Z5 | Email: info@khodiyarengineering.in | Phone: +91 98250 12345</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-brand-600">QUOTATION</p>
          <p className="text-lg font-bold font-mono">{q.quotationNumber}</p>
          {q.revision !== 'R1' && <p className="text-sm text-amber-600 font-semibold">Revision: {q.revision}</p>}
          <p className="text-xs text-gray-500 mt-1">Date: {q.createdAt}</p>
          {q.expiresAt && <p className="text-xs text-gray-500">Valid Until: {q.expiresAt}</p>}
        </div>
      </div>

      {/* Customer / Product info */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Customer Details</p>
          <p className="font-bold text-gray-900 text-base">{customer?.companyName}</p>
          <p className="text-gray-700 font-medium">{customer?.contactPerson} · {customer?.mobile}</p>
          <p className="text-gray-500 text-xs mt-1">{customer?.billingAddress.line1}</p>
          <p className="text-gray-500 text-xs">{customer?.billingAddress.city} – {customer?.billingAddress.pincode}, {customer?.billingAddress.state}</p>
          {customer?.gstNumber && <p className="text-gray-600 text-xs font-mono mt-1 font-semibold">GSTIN: {customer.gstNumber}</p>}
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Commercial & Delivery Terms</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Delivery Lead Time:</span><span className="font-semibold">{q.deliveryWeeks} Weeks from advance payment</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment Terms:</span><span className="font-semibold text-right max-w-[180px]">{q.paymentTerms}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Equipment Warranty:</span><span className="font-semibold">{q.warrantyMonths} Months</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Offer Validity:</span><span className="font-semibold">{q.validityDays} Days</span></div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <table className="w-full border border-gray-200 rounded-lg overflow-hidden mb-6">
        <thead className="bg-navy-900 text-white">
          <tr>
            <th className="py-2.5 px-3 text-left text-xs font-bold w-8">Sr.</th>
            <th className="py-2.5 px-3 text-left text-xs font-bold">Equipment Description & Specifications</th>
            <th className="py-2.5 px-3 text-center text-xs font-bold w-16">Qty</th>
            <th className="py-2.5 px-3 text-center text-xs font-bold w-16">Unit</th>
            <th className="py-2.5 px-3 text-right text-xs font-bold w-32">Unit Rate</th>
            <th className="py-2.5 px-3 text-right text-xs font-bold w-32">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {q.lineItems.map((li, idx) => (
            <tr key={li.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="py-3 px-3 text-xs text-gray-500">{idx + 1}</td>
              <td className="py-3 px-3 text-xs text-gray-800 font-medium leading-relaxed">{li.description}</td>
              <td className="py-3 px-3 text-xs text-center font-bold">{li.quantity}</td>
              <td className="py-3 px-3 text-xs text-center text-gray-500">{li.unit}</td>
              <td className="py-3 px-3 text-xs text-right">{formatCurrency(li.unitPrice)}</td>
              <td className="py-3 px-3 text-xs text-right font-bold text-gray-900">{formatCurrency(li.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-80 space-y-1.5 text-sm bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span className="font-semibold">{formatCurrency(q.subtotal)}</span></div>
          {q.discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Special Discount:</span><span>- {formatCurrency(q.discountAmount)}</span></div>}
          {q.freightCharges > 0 && <div className="flex justify-between"><span className="text-gray-500">Freight & Packaging:</span><span>{formatCurrency(q.freightCharges)}</span></div>}
          <div className="flex justify-between border-t border-gray-200 pt-1.5"><span className="text-gray-600 font-semibold">Taxable Value:</span><span className="font-bold">{formatCurrency(q.taxableAmount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">GST ({q.gstPercent}%):</span><span className="font-semibold">{formatCurrency(q.gstAmount)}</span></div>
          <div className="flex justify-between text-base font-bold border-t-2 border-brand-600 pt-2 text-brand-700">
            <span>Grand Total (INR):</span><span>{formatCurrency(q.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-6 text-xs text-gray-500">
        <p className="font-bold text-gray-700 mb-1">Standard Terms & Conditions:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>Prices are Ex-Works Vadodara. Transit insurance and freight extra if applicable.</li>
          <li>Delivery schedule commences from the date of advance payment receipt and engineering drawing clearance.</li>
          <li>1 Year manufacturer warranty against manufacturing defects.</li>
        </ul>
        <div className="flex justify-between mt-10 pt-4">
          <div><p className="font-bold text-gray-700">Customer Acceptance</p><p className="mt-8 border-t border-gray-300 text-xs">Authorised Signature & Stamp</p></div>
          <div className="text-right"><p className="font-bold text-gray-700">For KHODIYAR ENGINEERING</p><p className="mt-8 border-t border-gray-300 text-xs">Proprietor / Authorised Signatory</p></div>
        </div>
      </div>
    </div>
  );
}

export function Quotations() {
  const navigate = useNavigate();
  const { quotations, boms, customers, inquiries, jobs, addQuotation, updateQuotation, addSalesOrder, addJob } = useERP();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [printQ, setPrintQ] = useState<Quotation | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // New Quotation Form state
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [inquiryId, setInquiryId] = useState(inquiries[0]?.id || '');
  const [itemDesc, setItemDesc] = useState('Heavy Duty Belt Conveyor 10M Length, 650mm Belt Width, 3HP Geared Motor Drive Assembly');
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(380000);
  const [deliveryWeeks, setDeliveryWeeks] = useState(3);
  const [paymentTerms, setPaymentTerms] = useState('40% Advance, 60% against dispatch inspection');

  // BOMs ready for quotation
  const pendingBOMs = boms.filter(b => !quotations.some(q => q.jobId === b.jobId));

  const filtered = quotations.filter(q => {
    const cust = customers.find(c => c.id === q.customerId);
    return q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      (cust?.companyName ?? '').toLowerCase().includes(search.toLowerCase());
  });

  const handleOpenQuotationForBOM = (bom: BOM) => {
    const job = jobs.find(j => j.id === bom.jobId);
    const suggestedPrice = Math.round(bom.totalEstimatedCost * 1.35); // 35% standard margin
    if (job) {
      setCustomerId(job.customerId);
      setItemDesc(`${job.productName} — Manufactured as per approved BOM ${bom.bomNumber}`);
    }
    setUnitPrice(suggestedPrice);
    setAddOpen(true);
  };

  const handlePrint = (q: Quotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrintQ(q);
    setPrintOpen(true);
  };

  const handleConvertToOrder = (q: Quotation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const poNumber = `PO-CUST-${String(Date.now()).slice(-4)}`;
    
    // 1. Update quotation status
    updateQuotation(q.id, { status: 'Converted' });

    // 2. Create customer sales order (P.O)
    const newSO: SalesOrder = {
      id: `SO-${Date.now()}`,
      poNumber: poNumber,
      poDate: new Date().toISOString().split('T')[0],
      customerId: q.customerId,
      quotationId: q.id,
      jobId: q.jobId,
      productName: q.lineItems[0]?.description.slice(0, 40) || 'Custom Machinery',
      quantity: q.lineItems[0]?.quantity || 1,
      totalAmount: q.totalAmount,
      paidAmount: Math.round(q.totalAmount * 0.4),
      balanceAmount: Math.round(q.totalAmount * 0.6),
      deliveryDate: new Date(Date.now() + 86400000 * 7 * q.deliveryWeeks).toISOString().split('T')[0],
      paymentTerms: q.paymentTerms,
      shippingAddress: customers.find(c => c.id === q.customerId)?.shippingAddress || {
        line1: 'GIDC Industrial Area', city: 'Vadodara', state: 'Gujarat', pincode: '390010', country: 'India'
      },
      status: 'In Progress',
      createdAt: new Date().toISOString().split('T')[0],
    };
    addSalesOrder(newSO);

    // 3. Create or activate production Job 360
    const newJob = {
      id: q.jobId || `JOB-${Date.now()}`,
      jobNumber: `JOB-2026-${String(Date.now()).slice(-3)}`,
      customerId: q.customerId,
      productId: 'PROD-001',
      productName: q.lineItems[0]?.description.slice(0, 40) || 'Custom Machinery',
      quantity: q.lineItems[0]?.quantity || 1,
      currentStage: 'Fabrication' as const,
      status: 'Active' as const,
      progressPercent: 30,
      priority: 'High' as const,
      estimatedValue: q.totalAmount,
      plannedStartDate: new Date().toISOString().split('T')[0],
      plannedEndDate: new Date(Date.now() + 86400000 * 7 * q.deliveryWeeks).toISOString().split('T')[0],
      configuration: { category: 'Machinery' },
      createdAt: new Date().toISOString().split('T')[0],
    };
    addJob(newJob);

    alert(`✅ Quotation ${q.quotationNumber} confirmed! Production Job started in shop floor.`);
    navigate('/jobs');
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = Number(qty) * Number(unitPrice);
    const gstAmount = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + gstAmount;

    const newQuotation: Quotation = {
      id: `QUOT-${Date.now()}`,
      quotationNumber: `QTN-2026-${String(quotations.length + 1).padStart(3, '0')}`,
      inquiryId: inquiryId || inquiries[0]?.id || 'INQ-001',
      customerId: customerId || customers[0]?.id || 'CUST-001',
      jobId: `JOB-${Date.now()}`,
      revision: 'R1',
      status: 'Sent',
      deliveryWeeks: Number(deliveryWeeks) || 3,
      paymentTerms,
      warrantyMonths: 12,
      validityDays: 30,
      lineItems: [
        {
          id: 'li-1',
          description: itemDesc,
          quantity: Number(qty) || 1,
          unit: 'Nos',
          unitPrice: Number(unitPrice),
          total: subtotal,
        }
      ],
      subtotal,
      discountAmount: 0,
      taxableAmount: subtotal,
      gstPercent: 18,
      gstAmount,
      totalAmount,
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    };

    addQuotation(newQuotation);
    setAddOpen(false);
    setSelected(newQuotation);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <WorkflowPipelineBanner currentStep={4} />

      <SectionHeader
        title="4. Quotation Management"
        subtitle={`${quotations.length} quotations · Commercial proposals and pricing offers`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search quotations..." className="w-64" />
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> New Quotation
            </button>
          </>
        }
      />

      {/* BOMs Awaiting Quotation Queue */}
      {pendingBOMs.length > 0 && (
        <div className="card p-4 border-amber-200 bg-amber-50/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-amber-700" />
              <h3 className="text-sm font-bold text-amber-900">
                Approved BOMs Ready for Commercial Quotation ({pendingBOMs.length})
              </h3>
            </div>
            <span className="text-xs text-amber-700 font-medium">Click to create quotation with estimated cost</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingBOMs.map(bom => {
              const job = jobs.find(j => j.id === bom.jobId);
              const cust = job ? customers.find(c => c.id === job.customerId) : null;
              return (
                <div key={bom.id} className="bg-white rounded-xl p-3 border border-amber-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-brand-700">{bom.bomNumber}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">BOM Ready</span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 mt-1">{cust?.companyName ?? 'Customer'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Est. Cost: <strong className="text-gray-900">{formatCurrency(bom.totalEstimatedCost)}</strong></p>
                  </div>
                  <button
                    className="btn-primary text-xs w-full mt-3 py-1.5 flex items-center justify-center gap-1.5"
                    onClick={() => handleOpenQuotationForBOM(bom)}
                  >
                    <Plus size={13} /> Generate Quotation from BOM <ArrowRight size={11} />
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
              <th className="table-th">Quotation No</th>
              <th className="table-th">Rev</th>
              <th className="table-th">Customer</th>
              <th className="table-th">Equipment</th>
              <th className="table-th text-right">Amount (₹)</th>
              <th className="table-th">Lead Time</th>
              <th className="table-th">Valid Until</th>
              <th className="table-th">Status</th>
              <th className="table-th w-32">Next Step</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(q => {
              const cust = customers.find(c => c.id === q.customerId);
              return (
                <tr key={q.id} className="table-row" onClick={() => setSelected(q)}>
                  <td className="table-td font-mono font-semibold text-brand-700 text-xs">{q.quotationNumber}</td>
                  <td className="table-td">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono font-bold">{q.revision}</span>
                  </td>
                  <td className="table-td">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{cust?.companyName ?? 'Customer'}</p>
                      <p className="text-xs text-gray-400">{cust?.contactPerson}</p>
                    </div>
                  </td>
                  <td className="table-td text-xs text-gray-600 max-w-[160px] truncate">
                    {q.lineItems[0]?.description}
                  </td>
                  <td className="table-td text-right">
                    <div>
                      <p className="font-bold text-gray-900">{formatCurrency(q.totalAmount)}</p>
                      <p className="text-[11px] text-gray-400">incl. 18% GST</p>
                    </div>
                  </td>
                  <td className="table-td text-sm text-gray-600 font-semibold">{q.deliveryWeeks} Weeks</td>
                  <td className="table-td text-xs text-gray-500">{q.expiresAt ?? '—'}</td>
                  <td className="table-td"><StatusBadge status={q.status} /></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => handlePrint(q, e)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                        title="Print Preview"
                      >
                        <Printer size={14} />
                      </button>
                      {q.status !== 'Converted' ? (
                        <button
                          onClick={e => handleConvertToOrder(q, e)}
                          className="btn-success text-xs py-1 px-2 flex items-center gap-1"
                          title="Convert to Production Job"
                        >
                          <CheckCircle size={11} /> Start Production
                        </button>
                      ) : (
                        <button
                          className="btn-primary text-xs py-1 px-2 flex items-center gap-1"
                          onClick={() => navigate('/jobs')}
                        >
                          Job 360° <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quotation Detail Drawer */}
      {selected && (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.quotationNumber}
          subtitle={`${customers.find(c => c.id === selected.customerId)?.companyName} · ${formatCurrency(selected.totalAmount)}`}
          actions={
            <div className="flex gap-2">
              <button className="btn-secondary text-xs" onClick={() => { setPrintQ(selected); setPrintOpen(true); }}>
                <Printer size={12} /> Print Preview
              </button>
              {selected.status !== 'Converted' ? (
                <button className="btn-success text-xs" onClick={() => handleConvertToOrder(selected)}>
                  <CheckCircle size={12} /> Convert to Step 5: Production Job
                </button>
              ) : (
                <button className="btn-primary text-xs" onClick={() => navigate('/jobs')}>
                  Open Production Job 360° <ArrowRight size={12} />
                </button>
              )}
            </div>
          }
        >
          <div className="p-6">
            <QuotationPrintPreview q={selected} />
          </div>
        </Drawer>
      )}

      {/* Print Modal */}
      <Modal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        title="Quotation Document Preview"
        maxWidth="max-w-4xl"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setPrintOpen(false)}>Close</button>
            <button className="btn-primary" onClick={() => window.print()}>
              <Printer size={14} /> Print / Save as PDF
            </button>
          </div>
        }
      >
        {printQ && <QuotationPrintPreview q={printQ} />}
      </Modal>

      {/* New Quotation Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Create Official Quotation"
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleCreateQuotation}>Generate Quotation</button>
          </div>
        }
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Customer" required>
              <select className="select" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                {customers.map(c => <option key={c.id} value={c.id}>{c.companyName} ({c.contactPerson})</option>)}
              </select>
            </FormField>
            <FormField label="Inquiry Reference" required>
              <select className="select" value={inquiryId} onChange={e => setInquiryId(e.target.value)}>
                {inquiries.map(i => <option key={i.id} value={i.id}>{i.inquiryNumber} — {i.productCategory}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Equipment Description & Specification" required>
            <textarea
              className="input"
              rows={2}
              value={itemDesc}
              onChange={e => setItemDesc(e.target.value)}
              required
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Quantity (Nos)" required>
              <input type="number" className="input font-bold" value={qty} onChange={e => setQty(Number(e.target.value))} min={1} required />
            </FormField>
            <FormField label="Unit Rate (₹)" required>
              <input type="number" className="input font-bold" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} required />
            </FormField>
            <FormField label="Delivery Lead Time (Weeks)" required>
              <input type="number" className="input font-bold" value={deliveryWeeks} onChange={e => setDeliveryWeeks(Number(e.target.value))} min={1} required />
            </FormField>
          </div>

          <FormField label="Commercial Payment Terms" required>
            <input className="input" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} required />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
