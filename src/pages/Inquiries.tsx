import React, { useState } from 'react';
import { Plus, ArrowRight, Building2, UserPlus, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchBar, StatusBadge, PriorityBadge, SectionHeader, Modal, FormField, InfoGrid, Drawer, ActivityTimeline, WorkflowPipelineBanner } from '../components/ui';
import type { Inquiry, Customer, InquiryStatus, Priority, InquirySource, ProductCategory } from '../types';
import { useERP } from '../context/ERPContext';

const statusOrder: InquiryStatus[] = ['New', 'Under Review', 'Design Required', 'Quotation Pending', 'Quotation Sent', 'Negotiation', 'Won', 'Lost', 'Converted to Order'];

const statusColors: Record<string, string> = {
  'New': 'bg-blue-50 border-blue-200',
  'Under Review': 'bg-amber-50 border-amber-200',
  'Design Required': 'bg-purple-50 border-purple-200',
  'Quotation Pending': 'bg-orange-50 border-orange-200',
  'Quotation Sent': 'bg-cyan-50 border-cyan-200',
  'Negotiation': 'bg-indigo-50 border-indigo-200',
  'Won': 'bg-emerald-50 border-emerald-200',
  'Lost': 'bg-red-50 border-red-200',
  'Converted to Order': 'bg-gray-50 border-gray-200',
};

export function Inquiries() {
  const navigate = useNavigate();
  const { customers: customerList, inquiries: inquiryList, designs, addCustomer, addInquiry, activityLogs } = useERP();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Form State
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  // New Customer Fields
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('');
  const newState = 'Gujarat';
  const [newAddress, setNewAddress] = useState('');
  const [newGst, setNewGst] = useState('');
  const [newIndustry, setNewIndustry] = useState('Food Processing');

  // Inquiry Fields
  const [productCategory, setProductCategory] = useState<ProductCategory>('Belt Conveyor');
  const [quantity, setQuantity] = useState(1);
  const [salesPerson, setSalesPerson] = useState('Amit Shah');
  const [priority, setPriority] = useState<Priority>('High');
  const [source, setSource] = useState<InquirySource>('Phone');
  const [expectedOrderDate, setExpectedOrderDate] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');

  const filtered = inquiryList.filter(i => {
    const cust = customerList.find(c => c.id === i.customerId);
    const matchSearch = i.inquiryNumber.toLowerCase().includes(search.toLowerCase()) ||
      (cust?.companyName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      i.productCategory.toLowerCase().includes(search.toLowerCase()) ||
      i.contactPerson.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getCustomer = (id: string) => customerList.find(c => c.id === id);

  const handleCreateInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    let custId = selectedCustomerId;
    let contactP = '';
    let phoneP = '';
    let emailP = '';

    if (isNewCustomer) {
      if (!newCompanyName || !newContactPerson || !newMobile) {
        alert('Please fill company name, contact person, and mobile number.');
        return;
      }
      const newCustId = `CUST-${String(customerList.length + 1).padStart(3, '0')}`;
      const newCust: Customer = {
        id: newCustId,
        customerCode: newCustId,
        companyName: newCompanyName,
        contactPerson: newContactPerson,
        mobile: newMobile,
        email: newEmail || `${newContactPerson.toLowerCase().replace(/\s+/g, '')}@${newCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        gstNumber: newGst || undefined,
        billingAddress: {
          line1: newAddress || 'Industrial Area',
          city: newCity || 'Vadodara',
          state: newState || 'Gujarat',
          pincode: '390010',
          country: 'India',
        },
        shippingAddress: {
          line1: newAddress || 'Industrial Area',
          city: newCity || 'Vadodara',
          state: newState || 'Gujarat',
          pincode: '390010',
          country: 'India',
        },
        industry: newIndustry,
        customerType: 'New',
        paymentTerms: '30 Days',
        creditLimit: 500000,
        assignedSalesPerson: salesPerson,
        outstandingAmount: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      addCustomer(newCust);
      custId = newCustId;
      contactP = newContactPerson;
      phoneP = newMobile;
      emailP = newEmail;
    } else {
      if (!selectedCustomerId) {
        alert('Please select an existing customer or switch to New Customer.');
        return;
      }
      const existing = customerList.find(c => c.id === selectedCustomerId);
      if (existing) {
        contactP = existing.contactPerson;
        phoneP = existing.mobile;
        emailP = existing.email;
      }
    }

    const inqNumber = `INQ-2026-${String(inquiryList.length + 1).padStart(3, '0')}`;
    const newInquiry: Inquiry = {
      id: `INQ-${String(inquiryList.length + 1).padStart(3, '0')}`,
      inquiryNumber: inqNumber,
      inquiryDate: new Date().toISOString().split('T')[0],
      customerId: custId,
      contactPerson: contactP,
      phone: phoneP,
      email: emailP,
      source: source,
      salesPerson: salesPerson,
      expectedOrderDate: expectedOrderDate || undefined,
      priority: priority,
      status: 'New',
      productId: 'PROD-001',
      productCategory: productCategory,
      quantity: Number(quantity) || 1,
      configuration: { category: productCategory },
      specialRequirements: specialRequirements || undefined,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    addInquiry(newInquiry);
    setAddOpen(false);
    setSelected(newInquiry);

    // Reset Form
    setIsNewCustomer(false);
    setSelectedCustomerId('');
    setNewCompanyName('');
    setNewContactPerson('');
    setNewMobile('');
    setNewEmail('');
    setNewCity('');
    setNewAddress('');
    setSpecialRequirements('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <WorkflowPipelineBanner currentStep={1} />

      <SectionHeader
        title="1. Inquiry & Client Intake"
        subtitle={`${inquiryList.length} inquiries · Start new requirements with existing or new customer directly`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search inquiries or customer..." className="w-64" />
            <select className="select w-auto text-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              {statusOrder.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> New Inquiry / Customer
            </button>
          </>
        }
      />

      {/* Status summary pills */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'New', 'Under Review', 'Design Required', 'Quotation Pending', 'Converted to Order', 'Won', 'Lost'].map(s => {
          const count = s === 'All' ? inquiryList.length : inquiryList.filter(i => i.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                statusFilter === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
              }`}
            >
              {s} <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-th">Inquiry No</th>
              <th className="table-th">Date</th>
              <th className="table-th">Customer / Company</th>
              <th className="table-th">Product Requirement</th>
              <th className="table-th text-center">Qty</th>
              <th className="table-th">Sales Executive</th>
              <th className="table-th">Priority</th>
              <th className="table-th">Status</th>
              <th className="table-th w-32">Next Workflow Step</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inq => {
              const cust = getCustomer(inq.customerId);
              return (
                <tr key={inq.id} className="table-row" onClick={() => setSelected(inq)}>
                  <td className="table-td font-mono font-semibold text-brand-700 text-xs">{inq.inquiryNumber}</td>
                  <td className="table-td text-xs text-gray-500">{inq.inquiryDate}</td>
                  <td className="table-td">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{cust?.companyName ?? 'Customer'}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> {inq.phone || cust?.mobile || '—'} · {inq.contactPerson}
                      </p>
                    </div>
                  </td>
                  <td className="table-td">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{inq.productCategory}</p>
                      <p className="text-xs text-gray-400">Source: {inq.source}</p>
                    </div>
                  </td>
                  <td className="table-td text-center font-bold">{inq.quantity}</td>
                  <td className="table-td text-sm text-gray-600">{inq.salesPerson}</td>
                  <td className="table-td"><PriorityBadge priority={inq.priority} /></td>
                  <td className="table-td"><StatusBadge status={inq.status} /></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      {inq.status === 'Converted to Order' || inq.status === 'Won' ? (
                        <button
                          className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800"
                          onClick={() => navigate('/jobs')}
                        >
                          Job 360 <ArrowRight size={11} />
                        </button>
                      ) : (inq.status === 'Quotation Pending' || inq.status === 'Quotation Sent' || inq.status === 'Negotiation' || designs.some(d => (d.inquiryId && d.inquiryId === inq.id) || (inq.designId && d.id === inq.designId))) ? (
                        <button
                          className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1 bg-amber-600 hover:bg-amber-700"
                          onClick={() => navigate('/quotations')}
                        >
                          Quotation <ArrowRight size={11} />
                        </button>
                      ) : (
                        <button
                          className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                          onClick={() => navigate('/designs')}
                        >
                          Design <ArrowRight size={11} />
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

      {/* Inquiry Detail Drawer */}
      {selected && (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.inquiryNumber}
          subtitle={`${getCustomer(selected.customerId)?.companyName ?? 'Customer'} · ${selected.productCategory}`}
          actions={
            <div className="flex items-center gap-2">
              {designs.some(d => (d.inquiryId && d.inquiryId === selected.id) || (selected.designId && d.id === selected.designId)) && (
                <button className="btn-secondary text-xs" onClick={() => navigate('/designs')}>
                  View CAD Drawing
                </button>
              )}
              {selected.status === 'Converted to Order' || selected.status === 'Won' ? (
                <button className="btn-primary text-xs" onClick={() => navigate('/jobs')}>
                  View Job 360 <ArrowRight size={12} />
                </button>
              ) : (selected.status === 'Quotation Pending' || selected.status === 'Quotation Sent' || selected.status === 'Negotiation') ? (
                <button className="btn-primary text-xs" onClick={() => navigate('/quotations')}>
                  Proceed to 4. Quotation <ArrowRight size={12} />
                </button>
              ) : (
                <button className="btn-primary text-xs" onClick={() => navigate('/designs')}>
                  Proceed to 2. Design Drawing <ArrowRight size={12} />
                </button>
              )}
            </div>
          }
        >
          <div className="p-6 space-y-6">
            {/* Status banner */}
            <div className={`rounded-xl p-4 border ${statusColors[selected.status] ?? 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <StatusBadge status={selected.status} />
                <PriorityBadge priority={selected.priority} />
              </div>
            </div>

            {/* Customer Details Card (Inline 360 view) */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-brand-600" />
                  <h3 className="text-sm font-bold text-gray-900">Customer Details</h3>
                </div>
                <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border text-gray-500">
                  {getCustomer(selected.customerId)?.customerCode ?? 'NEW'}
                </span>
              </div>
              <InfoGrid items={[
                { label: 'Company Name', value: getCustomer(selected.customerId)?.companyName ?? '—' },
                { label: 'Contact Person', value: selected.contactPerson || getCustomer(selected.customerId)?.contactPerson || '—' },
                { label: 'Mobile Number', value: selected.phone || getCustomer(selected.customerId)?.mobile || '—' },
                { label: 'Email', value: selected.email || getCustomer(selected.customerId)?.email || '—' },
                { label: 'GST Number', value: getCustomer(selected.customerId)?.gstNumber ?? 'Not Provided' },
                { label: 'Industry', value: getCustomer(selected.customerId)?.industry ?? 'Manufacturing' },
                { label: 'Location', value: `${getCustomer(selected.customerId)?.billingAddress.city ?? 'Vadodara'}, ${getCustomer(selected.customerId)?.billingAddress.state ?? 'Gujarat'}` },
                { label: 'Payment Terms', value: getCustomer(selected.customerId)?.paymentTerms ?? '30 Days' },
              ]} />
            </div>

            {/* Inquiry Info */}
            <div>
              <p className="label mb-3">Inquiry Specification</p>
              <InfoGrid items={[
                { label: 'Inquiry Date', value: selected.inquiryDate },
                { label: 'Sales Executive', value: selected.salesPerson },
                { label: 'Source', value: selected.source },
                { label: 'Expected Order', value: selected.expectedOrderDate ?? '—' },
                { label: 'Product Category', value: selected.productCategory },
                { label: 'Quantity Required', value: `${selected.quantity} Nos` },
              ]} />
            </div>

            {selected.specialRequirements && (
              <div>
                <p className="label mb-2">Technical / Special Requirements</p>
                <p className="text-sm text-gray-700 bg-amber-50 rounded-lg p-3 border border-amber-100">
                  {selected.specialRequirements}
                </p>
              </div>
            )}

            {/* Activity */}
            <div>
              <p className="label mb-3">Activity & History</p>
              <ActivityTimeline activities={activityLogs.filter(a => a.jobId === selected.jobId || a.entityId === selected.id).slice(0, 4)} />
            </div>
          </div>
        </Drawer>
      )}

      {/* Add Inquiry with New Customer Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Direct Inquiry & Customer Entry"
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-between items-center w-full">
            <span className="text-xs text-gray-500">
              {isNewCustomer ? '✨ Creates new customer profile + generates inquiry' : 'Links inquiry to selected customer'}
            </span>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleCreateInquiry}>Create Inquiry</button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleCreateInquiry} className="space-y-5">
          {/* Customer Selection Toggle */}
          <div className="bg-gray-100 p-1 rounded-xl flex">
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                !isNewCustomer ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setIsNewCustomer(false)}
            >
              <Building2 size={14} /> Select Existing Customer
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                isNewCustomer ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setIsNewCustomer(true)}
            >
              <UserPlus size={14} /> + New Customer Entry
            </button>
          </div>

          {/* Existing Customer Selector */}
          {!isNewCustomer ? (
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <FormField label="Select Customer" required>
                <select
                  className="select font-medium"
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  required
                >
                  <option value="">-- Choose registered customer --</option>
                  {customerList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.contactPerson} · {c.billingAddress.city})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          ) : (
            /* New Customer Inline Form */
            <div className="p-4 border border-brand-200 rounded-xl bg-brand-50/30 space-y-3">
              <p className="text-xs font-bold text-brand-700 uppercase tracking-wide flex items-center gap-1">
                <UserPlus size={13} /> New Customer Information
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Company Name" required>
                  <input
                    className="input"
                    placeholder="e.g. Apex Pharma Machinery Ltd."
                    value={newCompanyName}
                    onChange={e => setNewCompanyName(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Contact Person" required>
                  <input
                    className="input"
                    placeholder="e.g. Sandeep Patel"
                    value={newContactPerson}
                    onChange={e => setNewContactPerson(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Mobile Number" required>
                  <input
                    className="input"
                    placeholder="e.g. 9825012345"
                    value={newMobile}
                    onChange={e => setNewMobile(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Email">
                  <input
                    type="email"
                    className="input"
                    placeholder="e.g. sandeep@apexmachinery.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                  />
                </FormField>
                <FormField label="City / Location">
                  <input
                    className="input"
                    placeholder="e.g. Vadodara, Ahmedabad, Halol"
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                  />
                </FormField>
                <FormField label="GST Number">
                  <input
                    className="input font-mono uppercase"
                    placeholder="e.g. 24AABCU9603R1ZM"
                    value={newGst}
                    onChange={e => setNewGst(e.target.value)}
                  />
                </FormField>
                <div className="col-span-2">
                  <FormField label="Address / Industrial Area">
                    <input
                      className="input"
                      placeholder="e.g. Plot 45, GIDC Phase-2, Makarpura"
                      value={newAddress}
                      onChange={e => setNewAddress(e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label="Industry">
                    <select
                      className="select"
                      value={newIndustry}
                      onChange={e => setNewIndustry(e.target.value)}
                    >
                      <option>Food Processing</option>
                      <option>Chemical / Fertilizer</option>
                      <option>Pharmaceutical</option>
                      <option>Engineering & Machinery</option>
                      <option>Packaging & Logistics</option>
                      <option>Agriculture & Grain</option>
                    </select>
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* Product & Inquiry Requirements */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Product & Requirement Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Product Category" required>
                <select
                  className="select"
                  value={productCategory}
                  onChange={e => setProductCategory(e.target.value as ProductCategory)}
                >
                  {['Belt Conveyor','Chain Conveyor','Screw Conveyor','Bucket Elevator','SS Mixing Tank','Ribbon Blender','Vibro Sifter'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Quantity (Nos)" required>
                <input
                  type="number"
                  className="input font-bold"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  min={1}
                  required
                />
              </FormField>
              <FormField label="Sales Executive" required>
                <select
                  className="select"
                  value={salesPerson}
                  onChange={e => setSalesPerson(e.target.value)}
                >
                  <option>Amit Shah</option>
                  <option>Priya Nair</option>
                </select>
              </FormField>
              <FormField label="Priority" required>
                <select
                  className="select"
                  value={priority}
                  onChange={e => setPriority(e.target.value as Priority)}
                >
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </FormField>
              <FormField label="Lead Source">
                <select
                  className="select"
                  value={source}
                  onChange={e => setSource(e.target.value as InquirySource)}
                >
                  <option value="Phone">Phone / Direct Call</option>
                  <option value="Email">Email Inquiry</option>
                  <option value="Website">Website / IndiaMART</option>
                  <option value="Reference">Customer Reference</option>
                  <option value="Exhibition">Exhibition / Expo</option>
                  <option value="Direct Visit">Direct Visit</option>
                </select>
              </FormField>
              <FormField label="Expected Order Date">
                <input
                  type="date"
                  className="input"
                  value={expectedOrderDate}
                  onChange={e => setExpectedOrderDate(e.target.value)}
                />
              </FormField>
              <div className="col-span-2">
                <FormField label="Special Technical Specifications / Requirements">
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="e.g. 30 Feet length, 600mm belt width, MS structure, 2HP motor, emergency stop..."
                    value={specialRequirements}
                    onChange={e => setSpecialRequirements(e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
