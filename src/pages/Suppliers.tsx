import React, { useState } from 'react';
import { Plus, Eye, Phone, Mail, MapPin } from 'lucide-react';
import { SearchBar, StatusBadge, SectionHeader, Drawer, InfoGrid, FormField, Modal } from '../components/ui';
import type { Supplier } from '../types';
import { useERP } from '../context/ERPContext';

export function Suppliers() {
  const { suppliers, addSupplier } = useERP();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Raw Material (Steel & Plates)');
  const [city, setCity] = useState('Vadodara');
  const [gstNumber, setGstNumber] = useState('');

  const filtered = suppliers.filter(s =>
    s.companyName.toLowerCase().includes(search.toLowerCase()) ||
    s.supplierCode.toLowerCase().includes(search.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !phone) {
      alert('Please fill company name and phone number.');
      return;
    }
    const newSupplier: Supplier = {
      id: `SUP-${Date.now()}`,
      supplierCode: `SUP-2026-${String(suppliers.length + 1).padStart(3, '0')}`,
      companyName,
      contactPerson,
      phone,
      email: email || `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}@supplier.com`,
      category,
      gstNumber: gstNumber || '24AAACT1234F1Z5',
      address: {
        line1: 'GIDC Industrial Estate',
        city,
        state: 'Gujarat',
        pincode: '390010',
        country: 'India',
      },
      rating: 4.5,
      paymentTerms: '30 Days Net',
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    addSupplier(newSupplier);
    setAddOpen(false);
    setSelected(newSupplier);
    setCompanyName('');
    setPhone('');
    setContactPerson('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Supplier Management"
        subtitle={`${suppliers.length} vendors registered · Raw material, bought-out components & motor drives`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search suppliers..." className="w-64" />
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> Add Supplier
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-th">Supplier Code</th>
              <th className="table-th">Company Name</th>
              <th className="table-th">Material Category</th>
              <th className="table-th">Contact Person</th>
              <th className="table-th">Phone</th>
              <th className="table-th">City</th>
              <th className="table-th">Rating</th>
              <th className="table-th">Status</th>
              <th className="table-th w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="table-row" onClick={() => setSelected(s)}>
                <td className="table-td font-mono font-semibold text-brand-700 text-xs">{s.supplierCode}</td>
                <td className="table-td font-semibold text-sm text-gray-900">{s.companyName}</td>
                <td className="table-td text-xs text-gray-600 font-medium">{s.category}</td>
                <td className="table-td text-sm text-gray-700">{s.contactPerson}</td>
                <td className="table-td text-xs text-gray-500 font-medium">{s.phone}</td>
                <td className="table-td text-xs text-gray-500">{s.address.city}</td>
                <td className="table-td">
                  <span className="text-amber-600 font-bold text-xs">★ {s.rating}</span>
                </td>
                <td className="table-td"><StatusBadge status={s.status} /></td>
                <td className="table-td"><Eye size={14} className="text-gray-300" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.companyName}
          subtitle={`${selected.supplierCode} · ${selected.category}`}
        >
          <div className="p-6 space-y-6">
            <InfoGrid items={[
              { label: 'Supplier Code', value: selected.supplierCode },
              { label: 'Category', value: selected.category },
              { label: 'Contact Person', value: selected.contactPerson },
              { label: 'Phone', value: selected.phone },
              { label: 'Email', value: selected.email },
              { label: 'GST Number', value: selected.gstNumber ?? '—' },
              { label: 'Payment Terms', value: selected.paymentTerms },
              { label: 'Rating', value: `★ ${selected.rating} / 5.0` },
            ]} />

            <div>
              <p className="label mb-2">Vendor Address</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                {selected.address.line1}, {selected.address.city} — {selected.address.pincode}, {selected.address.state}
              </p>
            </div>
          </div>
        </Drawer>
      )}

      {/* Add Supplier Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Verified Supplier / Vendor"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleCreateSupplier}>Save Supplier</button>
          </div>
        }
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Company / Vendor Name" required>
              <input className="input" placeholder="e.g. Gujarat Steel Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
            </FormField>
            <FormField label="Contact Person" required>
              <input className="input" placeholder="e.g. Suresh Shah" value={contactPerson} onChange={e => setContactPerson(e.target.value)} required />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phone / Mobile" required>
              <input className="input" placeholder="10 digit number" value={phone} onChange={e => setPhone(e.target.value)} required />
            </FormField>
            <FormField label="Email">
              <input type="email" className="input" placeholder="vendor email" value={email} onChange={e => setEmail(e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category" required>
              <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                <option>Raw Material (Steel & Plates)</option>
                <option>Motors & Gearboxes</option>
                <option>Bearings & Hardware</option>
                <option>Rubber & Conveyor Belts</option>
                <option>Electrical & VFD Panels</option>
                <option>Paints & Consumables</option>
              </select>
            </FormField>
            <FormField label="City / Industrial Area">
              <input className="input" value={city} onChange={e => setCity(e.target.value)} />
            </FormField>
          </div>
          <FormField label="GST Number">
            <input className="input font-mono uppercase" placeholder="e.g. 24AABCU9603R1ZM" value={gstNumber} onChange={e => setGstNumber(e.target.value)} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
