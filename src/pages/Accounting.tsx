import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  Receipt, CreditCard, Building2, CheckCircle2,
  AlertCircle, Clock, Search, Eye, Printer, Download,
  ShieldCheck, Scale, Check,
  Landmark, Plus
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import {
  SectionHeader, Drawer,
  formatCurrency, Modal
} from '../components/ui';
import type {
  Invoice, InvoiceLineItem, PaymentMode,
  PaymentReceipt, VendorBill
} from '../types';
import { gstSummaries } from '../data/mockData';

export function Accounting() {
  const {
    invoices, paymentReceipts, vendorBills, customers, suppliers, jobs,
    addInvoice, addPaymentReceipt, addVendorBill,
    recordVendorPayment, currentUser
  } = useERP();

  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'receipts' | 'bills' | 'costing' | 'gst'>('overview');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('All');
  const [billStatusFilter, setBillStatusFilter] = useState<string>('All');

  // Modal / Drawer states
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewInvoiceDrawer, setViewInvoiceDrawer] = useState(false);
  const [recordReceiptOpen, setRecordReceiptOpen] = useState(false);
  const [receiptTargetInvoice, setReceiptTargetInvoice] = useState<Invoice | null>(null);
  const [createBillOpen, setCreateBillOpen] = useState(false);
  const [payBillOpen, setPayBillOpen] = useState(false);
  const [selectedBillForPay, setSelectedBillForPay] = useState<VendorBill | null>(null);

  // ── Financial Overview Aggregations ──
  const totalInvoiced = useMemo(() => invoices.reduce((sum, inv) => sum + inv.totalAmount, 0), [invoices]);
  const totalCollected = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0), [invoices]);
  const totalReceivables = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0), [invoices]);
  const totalPayables = useMemo(() => vendorBills.reduce((sum, vb) => sum + (vb.balanceDue || 0), 0), [vendorBills]);
  const totalBilledByVendors = useMemo(() => vendorBills.reduce((sum, vb) => sum + vb.totalAmount, 0), [vendorBills]);
  const totalPaidToVendors = useMemo(() => vendorBills.reduce((sum, vb) => sum + (vb.paidAmount || 0), 0), [vendorBills]);

  const overdueInvoices = useMemo(() => invoices.filter(inv => inv.status === 'Overdue'), [invoices]);
  const overdueAmount = useMemo(() => overdueInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0), [overdueInvoices]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const cust = customers.find(c => c.id === inv.customerId);
      const custName = cust?.companyName || '';
      const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.poNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = invoiceStatusFilter === 'All' || inv.status === invoiceStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, customers, searchQuery, invoiceStatusFilter]);

  // Filtered Vendor Bills
  const filteredBills = useMemo(() => {
    return vendorBills.filter(bill => {
      const supp = suppliers.find(s => s.id === bill.supplierId);
      const suppName = supp?.companyName || '';
      const matchesSearch = bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        suppName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = billStatusFilter === 'All' || bill.status === billStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vendorBills, suppliers, searchQuery, billStatusFilter]);

  // ── Form States for New Tax Invoice ──
  const [newInvJobId, setNewInvJobId] = useState('');
  const [newInvCustomerId, setNewInvCustomerId] = useState('');
  const [newInvPoNumber, setNewInvPoNumber] = useState('');
  const [newInvDueDate, setNewInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [newInvTerms, setNewInvTerms] = useState('50% Advance, Balance on Dispatch');
  const [newInvItems, setNewInvItems] = useState<Array<{
    itemDescription: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    rate: number;
    gstRate: number;
  }>>([
    { itemDescription: '', hsnCode: '8428', quantity: 1, unit: 'Set', rate: 0, gstRate: 18 }
  ]);

  // Auto-populate customer when job is selected
  const handleJobSelect = (jobId: string) => {
    setNewInvJobId(jobId);
    const selectedJob = jobs.find(j => j.id === jobId);
    if (selectedJob) {
      setNewInvCustomerId(selectedJob.customerId);
      setNewInvItems([
        {
          itemDescription: `${selectedJob.jobNumber} - ${selectedJob.productName}`,
          hsnCode: '8428',
          quantity: selectedJob.quantity || 1,
          unit: 'Set',
          rate: (selectedJob.estimatedValue || 450000) / (selectedJob.quantity || 1),
          gstRate: 18
        }
      ]);
    }
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvCustomerId) {
      alert('Please select a customer.');
      return;
    }

    const computedItems: InvoiceLineItem[] = newInvItems.map((item, idx) => {
      const amount = item.quantity * item.rate;
      const gstAmt = amount * (item.gstRate / 100);
      const cgst = gstAmt / 2;
      const sgst = gstAmt / 2;
      return {
        id: `ITEM-${idx + 1}`,
        itemDescription: item.itemDescription || 'Industrial Equipment',
        hsnCode: item.hsnCode || '8428',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'Set',
        rate: Number(item.rate) || 0,
        amount,
        gstRate: Number(item.gstRate) || 18,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: 0,
        total: amount + gstAmt,
      };
    });

    const subtotal = computedItems.reduce((sum, it) => sum + it.amount, 0);
    const cgstTotal = computedItems.reduce((sum, it) => sum + it.cgstAmount, 0);
    const sgstTotal = computedItems.reduce((sum, it) => sum + it.sgstAmount, 0);
    const totalGst = cgstTotal + sgstTotal;
    const totalAmount = subtotal + totalGst;

    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: newInvDueDate,
      customerId: newInvCustomerId,
      jobId: newInvJobId || undefined,
      poNumber: newInvPoNumber || undefined,
      items: computedItems,
      subtotal,
      cgstTotal,
      sgstTotal,
      igstTotal: 0,
      totalGst,
      roundOff: 0,
      totalAmount,
      paidAmount: 0,
      balanceDue: totalAmount,
      status: 'Sent',
      paymentTerms: newInvTerms,
      bankDetails: {
        bankName: 'HDFC Bank Ltd',
        accountNo: '50200012345678',
        ifscCode: 'HDFC0001234',
        branch: 'Makarpura GIDC, Vadodara'
      },
      createdAt: new Date().toISOString().split('T')[0],
    };

    addInvoice(newInvoice);
    setCreateInvoiceOpen(false);
    setSelectedInvoice(newInvoice);
    setViewInvoiceDrawer(true);
  };

  // ── Form States for Payment Receipt ──
  const [rcptAmount, setRcptAmount] = useState<number>(0);
  const [rcptMode, setRcptMode] = useState<PaymentMode>('NEFT/RTGS');
  const [rcptRef, setRcptRef] = useState('');
  const [rcptBank, setRcptBank] = useState('HDFC Bank');
  const [rcptNotes, setRcptNotes] = useState('');

  const openRecordReceiptModal = (inv: Invoice) => {
    setReceiptTargetInvoice(inv);
    setRcptAmount(inv.balanceDue);
    setRcptRef(`UTR-${Date.now().toString().slice(-6)}`);
    setRecordReceiptOpen(true);
  };

  const handleRecordReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptTargetInvoice) return;
    if (rcptAmount <= 0) {
      alert('Please enter a valid received amount.');
      return;
    }

    const newReceipt: PaymentReceipt = {
      id: `RCPT-${Date.now()}`,
      receiptNumber: `RCPT-2026-${String(paymentReceipts.length + 1).padStart(3, '0')}`,
      receiptDate: new Date().toISOString().split('T')[0],
      customerId: receiptTargetInvoice.customerId,
      invoiceId: receiptTargetInvoice.id,
      invoiceNumber: receiptTargetInvoice.invoiceNumber,
      amountReceived: Number(rcptAmount),
      tdsDeducted: 0,
      netAmount: Number(rcptAmount),
      paymentMode: rcptMode,
      transactionRef: rcptRef || `TXN-${Date.now()}`,
      bankName: rcptBank,
      notes: rcptNotes,
      receivedBy: currentUser?.name || 'Accounts Specialist',
      createdAt: new Date().toISOString().split('T')[0],
    };

    addPaymentReceipt(newReceipt);
    setRecordReceiptOpen(false);
    setReceiptTargetInvoice(null);
  };

  // ── Form States for Vendor Bill Payment ──
  const [payBillAmount, setPayBillAmount] = useState<number>(0);
  const [payBillRef, setPayBillRef] = useState('');

  const openPayBillModal = (bill: VendorBill) => {
    setSelectedBillForPay(bill);
    setPayBillAmount(bill.balanceDue);
    setPayBillRef(`NEFT-HDFC-${Date.now().toString().slice(-6)}`);
    setPayBillOpen(true);
  };

  const handlePayBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForPay) return;
    if (payBillAmount <= 0) {
      alert('Please enter a valid payout amount.');
      return;
    }

    recordVendorPayment(selectedBillForPay.id, Number(payBillAmount), payBillRef);
    setPayBillOpen(false);
    setSelectedBillForPay(null);
  };

  // ── Form States for New Vendor Bill ──
  const [newBillSuppId, setNewBillSuppId] = useState('');
  const [newBillDesc, setNewBillDesc] = useState('');
  const [newBillSubtotal, setNewBillSubtotal] = useState<number>(0);
  const [newBillGstRate, setNewBillGstRate] = useState<number>(18);
  const [newBillDueDate, setNewBillDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [newBillTerms, setNewBillTerms] = useState('30 Days Credit');

  const handleCreateBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillSuppId || newBillSubtotal <= 0) {
      alert('Please select a supplier and enter the bill amount.');
      return;
    }

    const gst = newBillSubtotal * (newBillGstRate / 100);
    const total = newBillSubtotal + gst;

    const newBill: VendorBill = {
      id: `VB-${Date.now()}`,
      billNumber: `VB-2026-${String(vendorBills.length + 1).padStart(3, '0')}`,
      billDate: new Date().toISOString().split('T')[0],
      dueDate: newBillDueDate,
      supplierId: newBillSuppId,
      description: newBillDesc || 'Raw Material / Components Supply',
      subtotal: Number(newBillSubtotal),
      gstAmount: gst,
      totalAmount: total,
      paidAmount: 0,
      balanceDue: total,
      status: 'Approved',
      paymentTerms: newBillTerms,
      createdAt: new Date().toISOString().split('T')[0],
    };

    addVendorBill(newBill);
    setCreateBillOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── SECTION HEADER ── */}
      <SectionHeader
        title="Accounting & Financial Management"
        subtitle="Manage Customer Tax Invoices (AR), Vendor Bills (AP), Payment Vouchers, Job Profitability & GST Compliance"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateInvoiceOpen(true)}
              className="btn-primary flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} /> Create Tax Invoice
            </button>
            <button
              onClick={() => setCreateBillOpen(true)}
              className="btn-secondary flex items-center gap-1.5 border-gray-300 hover:bg-gray-50"
            >
              <Plus size={15} /> Record Vendor Bill
            </button>
          </div>
        }
      />

      {/* ── TOP FINANCIAL KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="card p-5 border-l-4 border-l-brand-600 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Sales Invoiced</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Receipt size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(totalInvoiced)}</p>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1">
              <ArrowUpRight size={14} /> {invoices.length} Tax Invoices Raised
            </div>
          </div>
        </div>

        {/* Collections Received */}
        <div className="card p-5 border-l-4 border-l-emerald-600 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Collections (AR)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalCollected)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : 0}% Realized Collection Rate
            </p>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="card p-5 border-l-4 border-l-amber-500 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Outstanding Receivables</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-amber-600">{formatCurrency(totalReceivables)}</p>
            <p className="text-xs text-red-600 font-semibold mt-1">
              {formatCurrency(overdueAmount)} Overdue ({overdueInvoices.length} invoices)
            </p>
          </div>
        </div>

        {/* Accounts Payable to Vendors */}
        <div className="card p-5 border-l-4 border-l-purple-600 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor Payables (AP)</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Building2 size={20} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-purple-700">{formatCurrency(totalPayables)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Paid {formatCurrency(totalPaidToVendors)} of {formatCurrency(totalBilledByVendors)}
            </p>
          </div>
        </div>
      </div>

      {/* ── MODULE NAVIGATION TABS ── */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 overflow-x-auto pb-px">
          {[
            { key: 'overview', label: '📊 Financial Overview', count: undefined },
            { key: 'invoices', label: '🧾 Tax Invoices (AR)', count: invoices.length },
            { key: 'receipts', label: '💳 Payment Receipts', count: paymentReceipts.length },
            { key: 'bills', label: '📦 Vendor Bills (AP)', count: vendorBills.length },
            { key: 'costing', label: '⚙️ Job Profitability', count: jobs.length },
            { key: 'gst', label: '🏛️ GST Compliance', count: gstSummaries.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key as any); setSearchQuery(''); }}
              className={`py-3 px-1 border-b-2 font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 1: FINANCIAL OVERVIEW                                   */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cashflow & Margin Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Net Liquidity / Cash Flow Health */}
            <div className="card p-5 space-y-4">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Landmark size={18} className="text-brand-600" /> Working Capital & Cash Position
              </h3>
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-xs text-gray-700 font-semibold">Net Collections (Customer Inflow)</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(totalCollected)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                  <span className="text-xs text-gray-700 font-semibold">Vendor Outflow (Purchases Paid)</span>
                  <span className="font-bold text-rose-700">-{formatCurrency(totalPaidToVendors)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-xs text-blue-950 font-bold">Net Operating Cash Balance</span>
                  <span className="font-extrabold text-blue-900 text-base">{formatCurrency(totalCollected - totalPaidToVendors)}</span>
                </div>
              </div>
            </div>

            {/* GST Summary Quick Box */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Scale size={18} className="text-purple-600" /> GST Tax Liability (Aug 2026)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  GSTR-3B Ready
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Output GST on Sales (GSTR-1)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(gstSummaries[0]?.totalOutputGst || 332100)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Input Tax Credit on Purchases (GSTR-2B)</span>
                  <span className="font-semibold text-emerald-600">-{formatCurrency(gstSummaries[0]?.totalInputItc || 67140)}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Net GST Payable to Govt</span>
                  <span className="font-extrabold text-sm text-brand-600">{formatCurrency(gstSummaries[0]?.netGstPayable || 264960)}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('gst')}
                className="w-full btn-secondary text-xs py-2 justify-center"
              >
                View Full GSTR-1 & ITC Statement →
              </button>
            </div>

            {/* Recent Payments Received Feed */}
            <div className="card p-5 space-y-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" /> Recent Payment Receipts
              </h3>
              <div className="space-y-2.5">
                {paymentReceipts.slice(0, 3).map(rcpt => {
                  const cust = customers.find(c => c.id === rcpt.customerId);
                  return (
                    <div key={rcpt.id} className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{cust?.companyName || 'Customer'}</p>
                        <p className="text-[11px] text-gray-500">{rcpt.receiptNumber} · {rcpt.paymentMode}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600 block">{formatCurrency(rcpt.amountReceived)}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{rcpt.receiptDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pending Invoices Requiring Follow-up */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-500" /> Pending & Overdue Invoices Requiring Follow-up
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Prompt customer payment reminders to ensure steady cash flow</p>
              </div>
              <button onClick={() => setActiveTab('invoices')} className="text-xs font-bold text-brand-600 hover:underline">
                View All Invoices →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-left">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Invoice Date</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                    <th className="py-2.5 px-3 text-right">Balance Due</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.filter(i => i.status !== 'Paid').map(inv => {
                    const cust = customers.find(c => c.id === inv.customerId);
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3 font-mono font-bold text-brand-700">{inv.invoiceNumber}</td>
                        <td className="py-3 px-3 font-semibold text-gray-900">{cust?.companyName || 'Customer'}</td>
                        <td className="py-3 px-3 text-gray-500">{inv.invoiceDate}</td>
                        <td className="py-3 px-3 text-gray-600 font-medium">{inv.dueDate}</td>
                        <td className="py-3 px-3 text-right font-semibold">{formatCurrency(inv.totalAmount)}</td>
                        <td className="py-3 px-3 text-right font-bold text-amber-700">{formatCurrency(inv.balanceDue)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            inv.status === 'Overdue'
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => openRecordReceiptModal(inv)}
                            className="btn-primary text-[11px] py-1 px-2.5"
                          >
                            <CreditCard size={12} /> Record Payment
                          </button>
                          <button
                            onClick={() => { setSelectedInvoice(inv); setViewInvoiceDrawer(true); }}
                            className="p-1 text-gray-400 hover:text-gray-700"
                            title="View Invoice"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 2: TAX INVOICES (AR)                                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoice #, customer name, PO..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input pl-9 text-xs py-1.5"
                />
              </div>
              <select
                value={invoiceStatusFilter}
                onChange={e => setInvoiceStatusFilter(e.target.value)}
                className="select text-xs py-1.5 w-auto"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold">
                Showing {filteredInvoices.length} invoices
              </span>
              <button
                onClick={() => setCreateInvoiceOpen(true)}
                className="btn-primary text-xs py-1.5"
              >
                <Plus size={14} /> New Invoice
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-left">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Job / Project</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Taxable Subtotal</th>
                  <th className="py-3 px-4 text-right">GST</th>
                  <th className="py-3 px-4 text-right">Total (INR)</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map(inv => {
                  const cust = customers.find(c => c.id === inv.customerId);
                  const job = jobs.find(j => j.id === inv.jobId);
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-700">{inv.invoiceNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">{cust?.companyName || 'Customer'}</td>
                      <td className="py-3.5 px-4 text-gray-600 font-medium">
                        {job ? `${job.jobNumber} (${job.productName.slice(0, 20)}...)` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">{inv.invoiceDate}</td>
                      <td className="py-3.5 px-4 text-gray-600">{inv.dueDate}</td>
                      <td className="py-3.5 px-4 text-right font-medium">{formatCurrency(inv.subtotal)}</td>
                      <td className="py-3.5 px-4 text-right text-gray-500">{formatCurrency(inv.totalGst)}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-700">
                        {inv.balanceDue > 0 ? formatCurrency(inv.balanceDue) : <span className="text-emerald-600">₹0 (Paid)</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : inv.status === 'Partially Paid'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : inv.status === 'Overdue'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => { setSelectedInvoice(inv); setViewInvoiceDrawer(true); }}
                          className="btn-secondary text-[11px] py-1 px-2.5"
                          title="View & Print Tax Invoice"
                        >
                          <Printer size={13} /> View Invoice
                        </button>
                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => openRecordReceiptModal(inv)}
                            className="btn-primary text-[11px] py-1 px-2.5"
                            title="Record Customer Payment"
                          >
                            <CreditCard size={13} /> Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 3: CUSTOMER PAYMENT RECEIPTS                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          <div className="card p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Customer Payment Receipt Vouchers</h3>
              <p className="text-xs text-gray-500 mt-0.5">Log of all NEFT, RTGS, Cheque, and Bank Transfer collections</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              Total Realized: {formatCurrency(totalCollected)}
            </span>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-left">
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Invoice Reference</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Transaction UTR / Ref</th>
                  <th className="py-3 px-4">Deposited Bank</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paymentReceipts.map(rcpt => {
                  const cust = customers.find(c => c.id === rcpt.customerId);
                  return (
                    <tr key={rcpt.id} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{rcpt.receiptNumber}</td>
                      <td className="py-3.5 px-4 text-gray-500">{rcpt.receiptDate}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">{cust?.companyName || 'Customer'}</td>
                      <td className="py-3.5 px-4 font-mono text-brand-600">{rcpt.invoiceNumber}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold">
                          {rcpt.paymentMode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-700">{rcpt.transactionRef}</td>
                      <td className="py-3.5 px-4 text-gray-600">{rcpt.bankName || 'HDFC Bank'}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                        {formatCurrency(rcpt.amountReceived)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">{rcpt.receivedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 4: VENDOR BILLS (AP)                                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bill #, supplier name, item..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input pl-9 text-xs py-1.5"
                />
              </div>
              <select
                value={billStatusFilter}
                onChange={e => setBillStatusFilter(e.target.value)}
                className="select text-xs py-1.5 w-auto"
              >
                <option value="All">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <button
              onClick={() => setCreateBillOpen(true)}
              className="btn-primary text-xs py-1.5"
            >
              <Plus size={14} /> New Vendor Bill
            </button>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-left">
                  <th className="py-3 px-4">Bill No</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Item / Description</th>
                  <th className="py-3 px-4">PO Ref</th>
                  <th className="py-3 px-4">Bill Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Bill Total</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBills.map(bill => {
                  const supp = suppliers.find(s => s.id === bill.supplierId);
                  return (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{bill.billNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">{supp?.companyName || 'Supplier'}</td>
                      <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">{bill.description}</td>
                      <td className="py-3.5 px-4 font-mono text-gray-500">{bill.poNumber || '—'}</td>
                      <td className="py-3.5 px-4 text-gray-500">{bill.billDate}</td>
                      <td className="py-3.5 px-4 text-gray-600">{bill.dueDate}</td>
                      <td className="py-3.5 px-4 text-right font-semibold">{formatCurrency(bill.totalAmount)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                        {bill.balanceDue > 0 ? formatCurrency(bill.balanceDue) : <span className="text-emerald-600">₹0 (Paid)</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          bill.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : bill.status === 'Partially Paid'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-purple-100 text-purple-700 border-purple-200'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {bill.balanceDue > 0 ? (
                          <button
                            onClick={() => openPayBillModal(bill)}
                            className="btn-primary text-[11px] py-1 px-2.5"
                          >
                            Pay Bill
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                            <Check size={12} /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 5: JOB COSTING & PROFITABILITY                         */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'costing' && (
        <div className="space-y-4">
          <div className="card p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Job Costing & Profit Margin Realization</h3>
              <p className="text-xs text-gray-500 mt-0.5">Comparison of Contract Selling Price vs Actual BOM Materials, Fabrication Labor & Overheads</p>
            </div>
            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-xl border border-brand-200">
              Target Margin: 25.0%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map(job => {
              const cust = customers.find(c => c.id === job.customerId);
              const inv = invoices.find(i => i.jobId === job.id);
              const sellingPrice = job.estimatedValue || 450000;
              const estMaterial = sellingPrice * 0.48;
              const estLabor = sellingPrice * 0.20;
              const estOverheads = sellingPrice * 0.07;
              const totalEstCost = estMaterial + estLabor + estOverheads;
              const profitMargin = sellingPrice - totalEstCost;
              const marginPercent = ((profitMargin / sellingPrice) * 100).toFixed(1);

              return (
                <div key={job.id} className="card p-5 space-y-4 hover:border-brand-300 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-600">{job.jobNumber}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {job.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 mt-1">{job.productName}</h4>
                      <p className="text-xs text-gray-500">{cust?.companyName || 'Customer'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">Contract Value</span>
                      <span className="font-extrabold text-sm text-gray-900">{formatCurrency(sellingPrice)}</span>
                    </div>
                  </div>

                  {/* Cost Breakdown Progress Meters */}
                  <div className="space-y-2 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center text-gray-700">
                      <span>BOM Material Cost (48%)</span>
                      <span className="font-semibold">{formatCurrency(estMaterial)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-700">
                      <span>Fabrication & Assembly Labor (20%)</span>
                      <span className="font-semibold">{formatCurrency(estLabor)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-700">
                      <span>Factory Overheads & Consumables (7%)</span>
                      <span className="font-semibold">{formatCurrency(estOverheads)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center font-bold text-gray-900">
                      <span>Total Manufacturing Cost</span>
                      <span>{formatCurrency(totalEstCost)}</span>
                    </div>
                  </div>

                  {/* Margin Summary Bar */}
                  <div className="p-3 rounded-xl bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Estimated Profit Margin</span>
                      <span className="font-extrabold text-base text-emerald-700">{formatCurrency(profitMargin)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-emerald-700">{marginPercent}%</span>
                      <span className="text-[10px] font-bold text-emerald-600 block">Gross Margin</span>
                    </div>
                  </div>

                  {inv && (
                    <div className="text-xs flex items-center justify-between text-gray-500 pt-1">
                      <span>Invoiced: <strong className="text-gray-900">{inv.invoiceNumber}</strong></span>
                      <span>Paid: <strong className="text-emerald-600">{formatCurrency(inv.paidAmount)}</strong></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 6: GST COMPLIANCE & REPORTS                             */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'gst' && (
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-brand-600" /> Monthly GST Filing & Reconciliation Statement
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Khodiyar Engineering GSTIN: <strong className="text-gray-900">24AABCK1234F1Z8</strong></p>
              </div>
              <button
                onClick={() => window.print()}
                className="btn-secondary text-xs py-1.5 flex items-center gap-1.5"
              >
                <Download size={13} /> Export GSTR Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* GSTR-1 Output Tax */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wide">1. GSTR-1 Outward Supplies (Sales)</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">Sales Invoices</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Taxable Value (Machinery Sold):</span>
                    <span className="font-bold text-gray-900">{formatCurrency(gstSummaries[0]?.totalSalesTaxable || 1845000)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>CGST Collected (9%):</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(gstSummaries[0]?.outputCgst || 166050)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>SGST Collected (9%):</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(gstSummaries[0]?.outputSgst || 166050)}</span>
                  </div>
                  <div className="pt-2 border-t border-blue-200 flex justify-between font-bold text-blue-950">
                    <span>Total Output GST Liability:</span>
                    <span>{formatCurrency(gstSummaries[0]?.totalOutputGst || 332100)}</span>
                  </div>
                </div>
              </div>

              {/* GSTR-2B Input Tax Credit */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-emerald-900 uppercase tracking-wide">2. GSTR-2B Input Tax Credit (Purchases)</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">ITC Claim</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Taxable Raw Material / Component Purchases:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(gstSummaries[0]?.totalPurchaseTaxable || 373000)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Input CGST Credit (9%):</span>
                    <span className="font-semibold text-emerald-700">{formatCurrency(gstSummaries[0]?.inputCgst || 33570)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Input SGST Credit (9%):</span>
                    <span className="font-semibold text-emerald-700">{formatCurrency(gstSummaries[0]?.inputSgst || 33570)}</span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-emerald-950">
                    <span>Total Eligible ITC:</span>
                    <span>{formatCurrency(gstSummaries[0]?.totalInputItc || 67140)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net GSTR-3B Computation */}
            <div className="p-4 rounded-2xl bg-navy-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-brand-300 font-bold uppercase tracking-wider block">GSTR-3B Net Tax Calculation</span>
                <p className="text-xl font-extrabold mt-0.5">
                  Net GST Payable: {formatCurrency(gstSummaries[0]?.netGstPayable || 264960)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Output GST (₹3,32,100) minus Input ITC (₹67,140) · Due Date: 20th of next month</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> Ready for Portal Upload
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: CREATE TAX INVOICE                                   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal
        open={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        title="Generate New GST Tax Invoice"
        size="lg"
      >
        <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1 font-semibold">Select Job / Project (Optional Auto-fill):</label>
              <select
                value={newInvJobId}
                onChange={e => handleJobSelect(e.target.value)}
                className="select"
              >
                <option value="">-- Choose Job --</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.jobNumber} - {j.productName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label mb-1 font-semibold">Customer Name: *</label>
              <select
                value={newInvCustomerId}
                onChange={e => setNewInvCustomerId(e.target.value)}
                required
                className="select"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.gstNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label mb-1 font-semibold">Customer PO Reference:</label>
              <input
                type="text"
                placeholder="e.g. PO-ABC-2026-88"
                value={newInvPoNumber}
                onChange={e => setNewInvPoNumber(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label mb-1 font-semibold">Payment Due Date: *</label>
              <input
                type="date"
                required
                value={newInvDueDate}
                onChange={e => setNewInvDueDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="label font-bold text-gray-900">Invoice Line Items & GST Rates:</label>
              <button
                type="button"
                onClick={() => setNewInvItems(prev => [...prev, { itemDescription: '', hsnCode: '8428', quantity: 1, unit: 'Set', rate: 0, gstRate: 18 }])}
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <Plus size={13} /> Add Line Item
              </button>
            </div>

            {newInvItems.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-12 sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Item description (e.g. Industrial Belt Conveyor 10m)"
                      required
                      value={item.itemDescription}
                      onChange={e => {
                        const val = e.target.value;
                        setNewInvItems(prev => prev.map((it, i) => i === idx ? { ...it, itemDescription: val } : it));
                      }}
                      className="input py-1"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="text"
                      placeholder="HSN (8428)"
                      value={item.hsnCode}
                      onChange={e => {
                        const val = e.target.value;
                        setNewInvItems(prev => prev.map((it, i) => i === idx ? { ...it, hsnCode: val } : it));
                      }}
                      className="input py-1"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setNewInvItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                      }}
                      className="input py-1"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      placeholder="Rate (₹)"
                      min="0"
                      value={item.rate}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setNewInvItems(prev => prev.map((it, i) => i === idx ? { ...it, rate: val } : it));
                      }}
                      className="input py-1 font-semibold"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-gray-500 pt-1">
                  <span>Line Total: <strong>{formatCurrency(item.quantity * item.rate * 1.18)}</strong> (incl. 18% GST)</span>
                  {newInvItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setNewInvItems(prev => prev.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="label mb-1 font-semibold">Payment Terms:</label>
            <input
              type="text"
              value={newInvTerms}
              onChange={e => setNewInvTerms(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setCreateInvoiceOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Check size={14} /> Create & View Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: RECORD CUSTOMER PAYMENT RECEIPT                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal
        open={recordReceiptOpen}
        onClose={() => setRecordReceiptOpen(false)}
        title="Record Customer Payment Receipt"
        size="md"
      >
        {receiptTargetInvoice && (
          <form onSubmit={handleRecordReceiptSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-brand-900">{receiptTargetInvoice.invoiceNumber}</p>
                <p className="text-gray-600">Total: {formatCurrency(receiptTargetInvoice.totalAmount)}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-500 block uppercase">Balance Due</span>
                <span className="font-extrabold text-sm text-amber-700">{formatCurrency(receiptTargetInvoice.balanceDue)}</span>
              </div>
            </div>

            <div>
              <label className="label mb-1 font-semibold">Amount Received (INR): *</label>
              <input
                type="number"
                required
                min="1"
                max={receiptTargetInvoice.balanceDue}
                value={rcptAmount}
                onChange={e => setRcptAmount(Number(e.target.value))}
                className="input text-sm font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label mb-1 font-semibold">Payment Mode: *</label>
                <select
                  value={rcptMode}
                  onChange={e => setRcptMode(e.target.value as PaymentMode)}
                  className="select"
                >
                  <option value="NEFT/RTGS">NEFT / RTGS</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="label mb-1 font-semibold">Bank Name:</label>
                <input
                  type="text"
                  value={rcptBank}
                  onChange={e => setRcptBank(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label mb-1 font-semibold">UTR / Cheque / Transaction Number: *</label>
              <input
                type="text"
                required
                placeholder="e.g. AXISN2624108821 or CHQ-449102"
                value={rcptRef}
                onChange={e => setRcptRef(e.target.value)}
                className="input font-mono"
              />
            </div>

            <div>
              <label className="label mb-1 font-semibold">Remarks / Notes:</label>
              <input
                type="text"
                placeholder="e.g. Part payment against final delivery acceptance"
                value={rcptNotes}
                onChange={e => setRcptNotes(e.target.value)}
                className="input"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setRecordReceiptOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <Check size={14} /> Confirm Payment Entry
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: RECORD VENDOR BILL                                   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal
        open={createBillOpen}
        onClose={() => setCreateBillOpen(false)}
        title="Record Supplier / Vendor Purchase Bill"
        size="md"
      >
        <form onSubmit={handleCreateBillSubmit} className="space-y-4 text-xs">
          <div>
            <label className="label mb-1 font-semibold">Select Supplier: *</label>
            <select
              value={newBillSuppId}
              onChange={e => setNewBillSuppId(e.target.value)}
              required
              className="select"
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.companyName} ({s.materialsSupplied?.[0] || 'Supplier'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label mb-1 font-semibold">Bill Description / Materials: *</label>
            <input
              type="text"
              required
              placeholder="e.g. MS Plates 10mm IS2062 & Channels"
              value={newBillDesc}
              onChange={e => setNewBillDesc(e.target.value)}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-1 font-semibold">Taxable Subtotal (INR): *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="Amount before tax"
                value={newBillSubtotal || ''}
                onChange={e => setNewBillSubtotal(Number(e.target.value))}
                className="input font-bold"
              />
            </div>

            <div>
              <label className="label mb-1 font-semibold">GST Rate (%):</label>
              <select
                value={newBillGstRate}
                onChange={e => setNewBillGstRate(Number(e.target.value))}
                className="select"
              >
                <option value={18}>18% (Standard Engineering)</option>
                <option value={12}>12% (Machinery Parts)</option>
                <option value={28}>28% (Specialized Electricals)</option>
                <option value={5}>5%</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-1 font-semibold">Payment Due Date: *</label>
              <input
                type="date"
                required
                value={newBillDueDate}
                onChange={e => setNewBillDueDate(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label mb-1 font-semibold">Payment Terms:</label>
              <input
                type="text"
                value={newBillTerms}
                onChange={e => setNewBillTerms(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex justify-between items-center text-xs">
            <span>Total Bill Payable (with GST):</span>
            <strong className="text-sm text-purple-900">
              {formatCurrency(newBillSubtotal + (newBillSubtotal * (newBillGstRate / 100)))}
            </strong>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setCreateBillOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Check size={14} /> Record Vendor Bill
            </button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: PAY VENDOR BILL                                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal
        open={payBillOpen}
        onClose={() => setPayBillOpen(false)}
        title="Record Payout to Supplier"
        size="md"
      >
        {selectedBillForPay && (
          <form onSubmit={handlePayBillSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-purple-950">{selectedBillForPay.billNumber}</p>
                <p className="text-gray-600">{selectedBillForPay.description}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-500 block">Balance Payable</span>
                <span className="font-extrabold text-sm text-rose-700">{formatCurrency(selectedBillForPay.balanceDue)}</span>
              </div>
            </div>

            <div>
              <label className="label mb-1 font-semibold">Payment Amount (INR): *</label>
              <input
                type="number"
                required
                min="1"
                max={selectedBillForPay.balanceDue}
                value={payBillAmount}
                onChange={e => setPayBillAmount(Number(e.target.value))}
                className="input text-sm font-bold"
              />
            </div>

            <div>
              <label className="label mb-1 font-semibold">Bank UTR / Transaction Reference: *</label>
              <input
                type="text"
                required
                value={payBillRef}
                onChange={e => setPayBillRef(e.target.value)}
                className="input font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setPayBillOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <Check size={14} /> Release Payment
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* DRAWER: PRINTABLE GST TAX INVOICE VIEW                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      {selectedInvoice && (
        <Drawer
          open={viewInvoiceDrawer}
          onClose={() => setViewInvoiceDrawer(false)}
          title={`Tax Invoice: ${selectedInvoice.invoiceNumber}`}
          subtitle={`Status: ${selectedInvoice.status} · Total: ${formatCurrency(selectedInvoice.totalAmount)}`}
        >
          <div className="p-6 space-y-6 text-xs font-sans">
            {/* Printable Document Box */}
            <div className="border border-gray-300 rounded-2xl p-6 bg-white shadow-sm space-y-6 print:border-none print:p-0">
              {/* Header Letterhead */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-brand-700 tracking-wide">KHODIYAR ENGINEERING</h2>
                  <p className="text-gray-600 text-[11px] mt-0.5">Plot No. 45, GIDC Industrial Estate, Makarpura, Vadodara, Gujarat - 390010</p>
                  <p className="text-gray-600 text-[11px]">GSTIN: <strong className="text-gray-900">24AABCK1234F1Z8</strong> | PAN: <strong className="text-gray-900">AABCK1234F</strong></p>
                  <p className="text-gray-600 text-[11px]">Email: accounts@khodiyarengineering.in | Phone: +91 98240 12345</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-brand-50 text-brand-700 font-extrabold text-sm rounded-lg border border-brand-200 block text-center">
                    TAX INVOICE
                  </span>
                  <p className="font-mono font-bold text-gray-900 mt-2">{selectedInvoice.invoiceNumber}</p>
                  <p className="text-gray-500 text-[11px]">Date: {selectedInvoice.invoiceDate}</p>
                  <p className="text-gray-500 text-[11px]">Due: {selectedInvoice.dueDate}</p>
                </div>
              </div>

              {/* Bill To & Ship To Details */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Billed To (Customer):</span>
                  {(() => {
                    const cust = customers.find(c => c.id === selectedInvoice.customerId);
                    return (
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-900 text-sm">{cust?.companyName || 'Valued Customer'}</p>
                        <p className="text-gray-600">{cust?.billingAddress?.line1 || 'Industrial Area'}, {cust?.billingAddress?.city || 'Vadodara'}</p>
                        <p className="text-gray-600">GSTIN: <strong>{cust?.gstNumber || '24ABCDE1234F1Z5'}</strong></p>
                        <p className="text-gray-600">Contact: {cust?.contactPerson} ({cust?.mobile})</p>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Order References:</span>
                  <div className="space-y-1 text-gray-700">
                    <p>Customer PO No: <strong>{selectedInvoice.poNumber || 'N/A'}</strong></p>
                    <p>Job Reference: <strong>{selectedInvoice.jobId || 'JOB-2026-001'}</strong></p>
                    <p>Payment Terms: <strong>{selectedInvoice.paymentTerms}</strong></p>
                    {selectedInvoice.eWayBillNumber && (
                      <p>e-Way Bill No: <strong className="font-mono">{selectedInvoice.eWayBillNumber}</strong></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 text-left">#</th>
                    <th className="py-2.5 px-3 text-left">Item Description & Specifications</th>
                    <th className="py-2.5 px-3 text-center">HSN</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-3 px-3 text-gray-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-gray-900">{item.itemDescription}</p>
                        <p className="text-[11px] text-gray-500">Includes complete fabrication, motor testing, and line trials</p>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{item.hsnCode}</td>
                      <td className="py-3 px-3 text-center font-bold">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-3 text-right font-medium">{formatCurrency(item.rate)}</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculations and Bank Details */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider block">Company Bank Details for RTGS/NEFT:</span>
                  <p className="font-bold text-gray-900">{selectedInvoice.bankDetails?.bankName || 'HDFC Bank Ltd'}</p>
                  <p className="text-gray-600">A/C No: <strong className="font-mono text-gray-900">{selectedInvoice.bankDetails?.accountNo || '50200012345678'}</strong></p>
                  <p className="text-gray-600">IFSC Code: <strong className="font-mono text-gray-900">{selectedInvoice.bankDetails?.ifscCode || 'HDFC0001234'}</strong></p>
                  <p className="text-gray-600">Branch: {selectedInvoice.bankDetails?.branch || 'Makarpura GIDC, Vadodara'}</p>
                </div>

                <div className="space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-gray-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>CGST (9%):</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedInvoice.cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>SGST (9%):</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedInvoice.sgstTotal)}</span>
                  </div>
                  <div className="pt-2 border-t-2 border-gray-900 flex justify-between items-center text-sm font-extrabold text-gray-900">
                    <span>Total Amount:</span>
                    <span className="text-brand-700">{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold pt-1 text-emerald-700">
                    <span>Paid Amount:</span>
                    <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-amber-700">
                    <span>Balance Payable:</span>
                    <span>{formatCurrency(selectedInvoice.balanceDue)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t flex justify-between items-end text-xs text-gray-500">
                <div>
                  <p className="text-[11px]">Subject to Vadodara Jurisdiction</p>
                  <p className="text-[11px]">This is a Computer Generated Tax Invoice</p>
                </div>
                <div className="text-center space-y-8">
                  <p className="font-bold text-gray-900">For KHODIYAR ENGINEERING</p>
                  <p className="border-t border-gray-400 pt-1 font-semibold text-gray-600">Authorized Signatory</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => window.print()}
                className="btn-primary text-xs py-2 flex items-center gap-1.5"
              >
                <Printer size={14} /> Print / Save as PDF
              </button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
