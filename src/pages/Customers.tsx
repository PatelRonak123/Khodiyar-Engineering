import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Phone, Mail, MapPin, TrendingUp, Eye } from 'lucide-react';
import { customers, inquiries, quotations, salesOrders, jobs } from '../data/mockData';
import { SearchBar, StatusBadge, SectionHeader, Drawer, InfoGrid, StatRow, formatCurrency, Tabs } from '../components/ui';
import type { Customer } from '../types';

export function Customers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [tab, setTab] = useState('overview');

  const filtered = customers.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
    c.customerCode.toLowerCase().includes(search.toLowerCase())
  );

  const typeBg: Record<string, string> = {
    Premium: 'bg-purple-50 text-purple-700',
    Regular: 'bg-blue-50 text-blue-700',
    New: 'bg-emerald-50 text-emerald-700',
    Govt: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Customer Management"
        subtitle={`${customers.length} customers registered`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." className="w-64" />
            <button className="btn-primary"><Plus size={14} /> Add Customer</button>
          </>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-th">Code</th>
              <th className="table-th">Company</th>
              <th className="table-th">Contact</th>
              <th className="table-th">Industry</th>
              <th className="table-th">Type</th>
              <th className="table-th">Outstanding</th>
              <th className="table-th">Credit Limit</th>
              <th className="table-th w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="table-row" onClick={() => setSelected(c)}>
                <td className="table-td font-mono text-xs text-brand-700 font-semibold">{c.customerCode}</td>
                <td className="table-td">
                  <div>
                    <p className="font-semibold text-gray-900">{c.companyName}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />{c.billingAddress.city}, {c.billingAddress.state}
                    </p>
                  </div>
                </td>
                <td className="table-td">
                  <div>
                    <p className="text-sm font-medium">{c.contactPerson}</p>
                    <p className="text-xs text-gray-400">{c.mobile}</p>
                  </div>
                </td>
                <td className="table-td text-sm text-gray-600">{c.industry}</td>
                <td className="table-td">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${typeBg[c.customerType]}`}>
                    {c.customerType}
                  </span>
                </td>
                <td className="table-td">
                  <span className={`font-semibold ${c.outstandingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(c.outstandingAmount)}
                  </span>
                </td>
                <td className="table-td text-gray-600">{formatCurrency(c.creditLimit)}</td>
                <td className="table-td">
                  <Eye size={14} className="text-gray-300 hover:text-brand-600 transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Drawer */}
      {selected && (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.companyName}
          subtitle={`${selected.customerCode} · ${selected.industry}`}
          actions={
            <button className="btn-primary text-xs" onClick={() => navigate('/inquiries')}>
              <Plus size={12} /> New Inquiry
            </button>
          }
        >
          <div className="p-6 space-y-6">
            {/* Tabs */}
            <Tabs
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'inquiries', label: 'Inquiries', count: inquiries.filter(i => i.customerId === selected.id).length },
                { id: 'orders', label: 'Orders', count: salesOrders.filter(o => o.customerId === selected.id).length },
                { id: 'jobs', label: 'Jobs', count: jobs.filter(j => j.customerId === selected.id).length },
              ]}
              active={tab}
              onChange={setTab}
            />

            {tab === 'overview' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Orders', value: salesOrders.filter(o => o.customerId === selected.id).length, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Outstanding', value: formatCurrency(selected.outstandingAmount), color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Credit Limit', value: formatCurrency(selected.creditLimit), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                      <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                <InfoGrid items={[
                  { label: 'Contact Person', value: selected.contactPerson },
                  { label: 'Mobile', value: selected.mobile },
                  { label: 'Email', value: selected.email },
                  { label: 'GST Number', value: selected.gstNumber ?? '—' },
                  { label: 'Payment Terms', value: selected.paymentTerms },
                  { label: 'Customer Type', value: selected.customerType },
                  { label: 'Sales Person', value: selected.assignedSalesPerson },
                  { label: 'Member Since', value: selected.createdAt },
                ]} />
                <div>
                  <p className="label">Billing Address</p>
                  <p className="text-sm text-gray-600">
                    {selected.billingAddress.line1}, {selected.billingAddress.city} — {selected.billingAddress.pincode}, {selected.billingAddress.state}
                  </p>
                </div>
              </div>
            )}

            {tab === 'inquiries' && (
              <div className="space-y-3">
                {inquiries.filter(i => i.customerId === selected.id).map(inq => (
                  <div key={inq.id} className="p-4 rounded-xl border border-gray-100 hover:border-brand-200 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{inq.inquiryNumber}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{inq.productCategory} · Qty: {inq.quantity}</p>
                      </div>
                      <StatusBadge status={inq.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{inq.inquiryDate}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === 'orders' && (
              <div className="space-y-3">
                {salesOrders.filter(o => o.customerId === selected.id).map(ord => (
                  <div key={ord.id} className="p-4 rounded-xl border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{ord.poNumber}</p>
                        <p className="text-xs text-gray-500 mt-0.5">PO Date: {ord.poDate}</p>
                      </div>
                      <StatusBadge status={ord.status} />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">Total Amount</span>
                      <span className="font-bold text-gray-900">{formatCurrency(ord.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Balance Due</span>
                      <span className="font-semibold text-red-600">{formatCurrency(ord.balanceAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'jobs' && (
              <div className="space-y-3">
                {jobs.filter(j => j.customerId === selected.id).map(job => (
                  <div key={job.id} className="p-4 rounded-xl border border-gray-100 cursor-pointer hover:border-brand-200"
                    onClick={() => { setSelected(null); navigate(`/jobs/${job.id}`); }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm font-mono text-brand-700">{job.jobNumber}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{job.productName}</p>
                      </div>
                      <StatusBadge status={job.currentStage} />
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Progress</span><span>{job.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${job.progressPercent}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}
