import React, { useState, useRef } from 'react';
import {
  Plus, Eye, CheckCircle, ArrowRight, Layers, ClipboardList,
  UploadCloud, Image as ImageIcon, X, ZoomIn, LayoutGrid, List as ListIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchBar, StatusBadge, SectionHeader, Drawer, InfoGrid, FormField, Modal, WorkflowPipelineBanner } from '../components/ui';
import type { Design, Inquiry, Job } from '../types';
import { useERP } from '../context/ERPContext';

// Preset sample CAD drawings for quick selection
const SAMPLE_CAD_PRESETS = [
  {
    name: 'Belt Conveyor CAD',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Z-Bucket Elevator Drawing',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'SS Screw Conveyor Blueprint',
    url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'SS Mixing Tank 3D CAD',
    url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Ribbon Blender Schematic',
    url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
  },
];

export function Designs() {
  const navigate = useNavigate();
  const { designs, jobs, customers, inquiries, addDesign, updateDesign, updateInquiry, addJob, addActivityLog } = useERP();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Design | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Form state
  const [selectedInquiryId, setSelectedInquiryId] = useState('');
  const [jobId, setJobId] = useState(jobs[0]?.id || '');
  const [designer, setDesigner] = useState('Dilip Panchal');
  const [dimensions, setDimensions] = useState('Length: 10m, Belt Width: 650mm, Height: 1.2m');
  const [material, setMaterial] = useState('Mild Steel (IS 2062 Gr.B)');
  const [technicalSpecs, setTechnicalSpecs] = useState('Heavy duty modular structural frame with return idlers, take-up pulley assembly, geared motor drive 3HP.');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Inquiries that need design (filter out inquiries that have a design or have moved past design)
  const pendingInquiries = inquiries.filter(i => {
    // Check if design already exists for this inquiry
    const hasDesign = designs.some(d =>
      (d.inquiryId && d.inquiryId === i.id) ||
      (i.jobId && d.jobId === i.jobId) ||
      (i.designId && d.id === i.designId) ||
      (d.designNumber && d.designNumber.includes(i.inquiryNumber))
    );
    if (hasDesign) return false;
    // Exclude if inquiry is already past design stage
    if (['Quotation Pending', 'Quotation Sent', 'Negotiation', 'Won', 'Lost', 'Converted to Order'].includes(i.status)) {
      return false;
    }
    return true;
  });

  const filtered = designs.filter(d => {
    const job = jobs.find(j => j.id === d.jobId);
    const inq = d.inquiryId ? inquiries.find(i => i.id === d.inquiryId) : (job ? inquiries.find(i => i.id === job.inquiryId) : null);
    const cust = job ? customers.find(c => c.id === job.customerId) : (inq ? customers.find(c => c.id === inq.customerId) : null);
    return d.designNumber.toLowerCase().includes(search.toLowerCase()) ||
      (cust?.companyName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (job?.productName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (inq?.productCategory ?? '').toLowerCase().includes(search.toLowerCase()) ||
      d.designer.toLowerCase().includes(search.toLowerCase());
  });

  const handleOpenDesignForInquiry = (inq: Inquiry) => {
    setSelectedInquiryId(inq.id);
    if (inq.jobId) {
      setJobId(inq.jobId);
    }
    setDimensions(`Custom Size for ${inq.productCategory} (${inq.quantity} Nos)`);
    setTechnicalSpecs(`Customer Requirement: ${inq.specialRequirements || inq.productCategory + ' specification'}. MOC: Mild Steel IS 2062.`);
    setUploadedImageUrl(SAMPLE_CAD_PRESETS[0].url);
    setImageFileName('sample_cad_drawing.png');
    setAddOpen(true);
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateDesign = (e: React.FormEvent) => {
    e.preventDefault();
    const newDesignId = `DES-${Date.now()}`;
    const newDesignNumber = `DSGN-2026-${String(designs.length + 1).padStart(3, '0')}`;
    
    let linkedJobId = jobId;
    const targetInquiry = selectedInquiryId ? inquiries.find(i => i.id === selectedInquiryId) : null;

    if (targetInquiry) {
      if (targetInquiry.jobId) {
        linkedJobId = targetInquiry.jobId;
      } else {
        // Create a new production job for this inquiry so it connects through the whole ERP pipeline
        linkedJobId = `JOB-${Date.now()}`;
        const newJob: Job = {
          id: linkedJobId,
          jobNumber: `JOB-2026-${String(jobs.length + 1).padStart(3, '0')}`,
          inquiryId: targetInquiry.id,
          customerId: targetInquiry.customerId,
          productId: targetInquiry.productId || 'PROD-001',
          productName: `${targetInquiry.productCategory} (${targetInquiry.quantity} Nos)`,
          quantity: targetInquiry.quantity || 1,
          currentStage: 'BOM',
          status: 'Active',
          priority: targetInquiry.priority || 'High',
          designId: newDesignId,
          fabricationOrderIds: [],
          configuration: targetInquiry.configuration || {},
          plannedStartDate: new Date().toISOString().split('T')[0],
          plannedEndDate: targetInquiry.expectedOrderDate || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
          progressPercent: 20,
          estimatedValue: 150000,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        };
        addJob(newJob);
      }
    }

    if (!linkedJobId) {
      linkedJobId = jobs[0]?.id || 'JOB-001';
    }

    const newDesign: Design = {
      id: newDesignId,
      designNumber: newDesignNumber,
      jobId: linkedJobId,
      inquiryId: selectedInquiryId || undefined,
      productId: targetInquiry?.productId,
      currentRevision: 'R1',
      status: 'Customer Approved',
      designer,
      dimensions,
      material,
      technicalSpecs,
      imageUrl: uploadedImageUrl || SAMPLE_CAD_PRESETS[0].url,
      cadDrawingUrl: 'drawings/DWG-2026-001.dwg',
      pdfDrawingUrl: 'drawings/DWG-2026-001.pdf',
      designDate: new Date().toISOString().split('T')[0],
      revisions: [
        {
          revisionNumber: 'R1',
          changedBy: designer,
          date: new Date().toISOString().split('T')[0],
          changes: 'Initial CAD drawings and general arrangement layout approved.',
          status: 'Customer Approved'
        }
      ],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    addDesign(newDesign);

    if (selectedInquiryId) {
      updateInquiry(selectedInquiryId, {
        status: 'Quotation Pending',
        jobId: linkedJobId,
        designId: newDesignId,
        updatedAt: new Date().toISOString().split('T')[0],
      });

      addActivityLog({
        id: `AL-${Date.now()}`,
        jobId: linkedJobId,
        entityType: 'Design',
        entityId: newDesignId,
        action: 'Design Approved',
        description: `Engineering CAD design ${newDesignNumber} created and approved for Inquiry ${targetInquiry?.inquiryNumber || selectedInquiryId}`,
        performedBy: designer,
        performedAt: new Date().toISOString(),
      });
    }

    setAddOpen(false);
    setSelected(newDesign);
    setSelectedInquiryId('');
    setUploadedImageUrl('');
    setImageFileName('');
  };

  const handleApprove = (id: string) => {
    updateDesign(id, { status: 'Customer Approved' });
    if (selected && selected.id === id) {
      setSelected(prev => prev ? { ...prev, status: 'Customer Approved' } : null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <WorkflowPipelineBanner currentStep={2} />

      <SectionHeader
        title="2. Engineering Design Management"
        subtitle={`${designs.length} engineering designs with 2D/3D CAD drawings & technical specifications`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search designs, customer, product..." className="w-64" />
            
            {/* View Mode Toggle */}
            <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'card' ? 'bg-navy-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Card View with Design Preview"
              >
                <LayoutGrid size={13} /> Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-navy-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Table View"
              >
                <ListIcon size={13} /> Table
              </button>
            </div>

            <button
              className="btn-primary"
              onClick={() => {
                setSelectedInquiryId('');
                setUploadedImageUrl(SAMPLE_CAD_PRESETS[0].url);
                setImageFileName('sample_conveyor_blueprint.png');
                setAddOpen(true);
              }}
            >
              <Plus size={14} /> New Design
            </button>
          </>
        }
      />

      {/* Incoming Inquiries Queue */}
      {pendingInquiries.length > 0 && (
        <div className="card p-4 border-purple-200 bg-purple-50/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-purple-700" />
              <h3 className="text-sm font-bold text-purple-900">
                Inquiries Waiting for Engineering Design ({pendingInquiries.length})
              </h3>
            </div>
            <span className="text-xs text-purple-700 font-medium">Click to generate CAD drawing specifications</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingInquiries.slice(0, 3).map(inq => {
              const cust = customers.find(c => c.id === inq.customerId);
              return (
                <div key={inq.id} className="bg-white rounded-xl p-3 border border-purple-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-purple-700">{inq.inquiryNumber}</span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">{inq.productCategory}</span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 mt-1">{cust?.companyName ?? 'Customer'}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{inq.specialRequirements || 'Custom dimensions required'}</p>
                  </div>
                  <button
                    className="btn-primary text-xs w-full mt-3 py-1.5 flex items-center justify-center gap-1.5"
                    onClick={() => handleOpenDesignForInquiry(inq)}
                  >
                    <Layers size={13} /> Design This Requirement <ArrowRight size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CARD / GRID VIEW WITH LARGE DRAWING PREVIEWS ── */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(d => {
            const job = jobs.find(j => j.id === d.jobId);
            const cust = job ? customers.find(c => c.id === job.customerId) : null;
            return (
              <div
                key={d.id}
                onClick={() => setSelected(d)}
                className="card overflow-hidden hover:border-brand-300 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
              >
                {/* Design Image Thumbnail Banner */}
                <div className="relative h-44 bg-gray-900 overflow-hidden">
                  {d.imageUrl ? (
                    <img
                      src={d.imageUrl}
                      alt={d.designNumber}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-800">
                      <ImageIcon size={32} className="text-gray-600 mb-1" />
                      <span className="text-xs font-mono">No Drawing Uploaded</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-black/70 backdrop-blur-md text-white rounded-md border border-white/20">
                      {d.designNumber}
                    </span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-brand-600 text-white rounded-md shadow-sm">
                      {d.currentRevision}
                    </span>
                  </div>

                  {/* Zoom Image Button */}
                  {d.imageUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImage({ url: d.imageUrl!, title: `${d.designNumber} - ${job?.productName || 'CAD Drawing'}` });
                      }}
                      className="absolute bottom-2.5 right-2.5 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md transition-colors"
                      title="Enlarge Drawing"
                    >
                      <ZoomIn size={14} />
                    </button>
                  )}

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-2.5 left-2.5 text-white">
                    <p className="text-xs font-bold truncate max-w-55">{job?.productName ?? 'Custom Machinery'}</p>
                    <p className="text-[11px] text-gray-300">{cust?.companyName ?? 'Customer'}</p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-400">Dimensions:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-45" title={d.dimensions}>
                        {d.dimensions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-400">Material (MOC):</span>
                      <span className="font-semibold text-gray-800 truncate max-w-45" title={d.material}>
                        {d.material}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-400">Lead Designer:</span>
                      <span className="font-medium text-gray-700">{d.designer}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-400">Approval Status:</span>
                      <StatusBadge status={d.status} size="sm" />
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setSelected(d)}
                      className="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center"
                    >
                      <Eye size={13} /> View Specs
                    </button>
                    <button
                      className="btn-primary text-xs py-1.5 px-3 flex-1 justify-center"
                      onClick={() => navigate('/bom')}
                    >
                      BOM <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW WITH DRAWING THUMBNAILS ── */
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Drawing</th>
                <th className="table-th">Design No</th>
                <th className="table-th">Job Ref</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Product Requirement</th>
                <th className="table-th">Rev</th>
                <th className="table-th">Lead Designer</th>
                <th className="table-th">Date</th>
                <th className="table-th">Status</th>
                <th className="table-th w-32">Next Step</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const job = jobs.find(j => j.id === d.jobId);
                const cust = job ? customers.find(c => c.id === job.customerId) : null;
                return (
                  <tr key={d.id} className="table-row" onClick={() => setSelected(d)}>
                    <td className="table-td w-16" onClick={e => e.stopPropagation()}>
                      {d.imageUrl ? (
                        <div
                          className="w-12 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-900 cursor-pointer relative group shrink-0"
                          onClick={() => setLightboxImage({ url: d.imageUrl!, title: `${d.designNumber} Drawing` })}
                        >
                          <img src={d.imageUrl} alt={d.designNumber} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn size={12} />
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                          <ImageIcon size={14} />
                        </div>
                      )}
                    </td>
                    <td className="table-td font-mono font-semibold text-brand-700 text-xs">{d.designNumber}</td>
                    <td className="table-td font-mono text-blue-700 text-xs">{job?.jobNumber ?? 'JOB-2026-001'}</td>
                    <td className="table-td font-semibold text-sm text-gray-900">{cust?.companyName ?? 'Customer'}</td>
                    <td className="table-td text-sm text-gray-700 max-w-45 truncate">{job?.productName ?? 'Custom Machinery'}</td>
                    <td className="table-td">
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs font-bold">{d.currentRevision}</span>
                    </td>
                    <td className="table-td text-sm text-gray-600 font-medium">{d.designer}</td>
                    <td className="table-td text-xs text-gray-500">{d.designDate}</td>
                    <td className="table-td"><StatusBadge status={d.status} /></td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
                          onClick={() => navigate('/bom')}
                        >
                          BOM <ArrowRight size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DESIGN DETAILS DRAWER ── */}
      {selected && (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.designNumber}
          subtitle={`${selected.designer} · ${selected.currentRevision}`}
          actions={
            <div className="flex gap-2">
              {selected.status !== 'Customer Approved' && (
                <button className="btn-success text-xs" onClick={() => handleApprove(selected.id)}>
                  <CheckCircle size={12} /> Approve Design
                </button>
              )}
              <button className="btn-primary text-xs" onClick={() => navigate('/bom')}>
                Proceed to 3. BOM <ArrowRight size={12} />
              </button>
            </div>
          }
        >
          <div className="p-6 space-y-6">
            {/* Design Image Preview in Drawer */}
            {selected.imageUrl ? (
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-md bg-gray-950 relative group">
                <img
                  src={selected.imageUrl}
                  alt={selected.designNumber}
                  className="w-full h-56 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  onClick={() => setLightboxImage({ url: selected.imageUrl!, title: `${selected.designNumber} - CAD Blueprint` })}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setLightboxImage({ url: selected.imageUrl!, title: `${selected.designNumber} - CAD Blueprint` })}
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-lg"
                >
                  <ZoomIn size={13} /> Enlarge Blueprint
                </button>
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="text-xs font-mono font-bold">{selected.designNumber} · 2D/3D Model</p>
                  <p className="text-[11px] text-gray-300">Uploaded Engineering Specification</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-400 bg-gray-50">
                <ImageIcon size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-600">No Design Image Attached</p>
              </div>
            )}

            <div className={`rounded-xl p-4 border ${selected.status === 'Customer Approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">Design Approval Status</p>
                  <p className="text-xs text-gray-500 mt-0.5">Approved designs unlock BOM and fabrication</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <InfoGrid items={[
              { label: 'Design Number', value: selected.designNumber },
              { label: 'Current Revision', value: selected.currentRevision },
              { label: 'Lead Designer', value: selected.designer },
              { label: 'Release Date', value: selected.designDate },
              { label: 'Overall Dimensions', value: selected.dimensions },
              { label: 'MOC / Material', value: selected.material },
            ]} />

            <div>
              <p className="label mb-2">Technical Specifications & Notes</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed">
                {selected.technicalSpecs}
              </p>
            </div>

            <button
              className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2"
              onClick={() => navigate('/bom')}
            >
              <ArrowRight size={14} /> Proceed to Step 3: Bill of Materials (BOM)
            </button>
          </div>
        </Drawer>
      )}

      {/* ── NEW DESIGN MODAL WITH IMAGE UPLOAD ── */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Create Engineering Design Drawing"
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleCreateDesign}>Save & Approve Design</button>
          </div>
        }
      >
        <form onSubmit={handleCreateDesign} className="space-y-4">
          {/* Linked Inquiry Banner or Selector */}
          {selectedInquiryId ? (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <ClipboardList size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-purple-900">
                      Designing Requirement: {inquiries.find(i => i.id === selectedInquiryId)?.inquiryNumber}
                    </span>
                    <span className="text-[11px] bg-purple-200 text-purple-800 font-semibold px-2 py-0.5 rounded-full">
                      {inquiries.find(i => i.id === selectedInquiryId)?.productCategory}
                    </span>
                  </div>
                  <p className="text-purple-700 text-xs mt-0.5">
                    Customer: {customers.find(c => c.id === inquiries.find(i => i.id === selectedInquiryId)?.customerId)?.companyName ?? 'Customer'} · Qty: {inquiries.find(i => i.id === selectedInquiryId)?.quantity} Nos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiryId('')}
                className="text-xs text-purple-700 hover:text-purple-900 underline font-semibold px-2 py-1 rounded hover:bg-purple-100 transition-colors"
              >
                Switch to Standard Job
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Link to Customer Inquiry (Optional)">
                <select
                  className="select"
                  value={selectedInquiryId}
                  onChange={e => {
                    const inqId = e.target.value;
                    setSelectedInquiryId(inqId);
                    if (inqId) {
                      const inq = inquiries.find(i => i.id === inqId);
                      if (inq) {
                        setDimensions(`Custom Size for ${inq.productCategory} (${inq.quantity} Nos)`);
                        setTechnicalSpecs(`Customer Requirement: ${inq.specialRequirements || inq.productCategory + ' specification'}. MOC: Mild Steel IS 2062.`);
                      }
                    }
                  }}
                >
                  <option value="">-- No Direct Inquiry (Standalone CAD) --</option>
                  {inquiries.map(i => {
                    const cust = customers.find(c => c.id === i.customerId);
                    return (
                      <option key={i.id} value={i.id}>
                        {i.inquiryNumber} — {cust?.companyName || 'Customer'} ({i.productCategory})
                      </option>
                    );
                  })}
                </select>
              </FormField>

              <FormField label="Related Production Job" required={!selectedInquiryId}>
                <select className="select" value={jobId} onChange={e => setJobId(e.target.value)}>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.jobNumber} — {j.productName}</option>
                  ))}
                </select>
              </FormField>
            </div>
          )}

          {/* ── IMAGE / DRAWING UPLOAD COMPONENT ── */}
          <div className="space-y-2">
            <label className="label flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon size={14} className="text-brand-600" /> Upload 2D/3D CAD Drawing / Design Image
              </span>
              {uploadedImageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setUploadedImageUrl('');
                    setImageFileName('');
                  }}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                >
                  <X size={12} /> Remove Image
                </button>
              )}
            </label>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {uploadedImageUrl ? (
              /* Uploaded Image Preview */
              <div className="relative rounded-2xl overflow-hidden border border-brand-200 bg-gray-900 group h-44">
                <img
                  src={uploadedImageUrl}
                  alt="Design Preview"
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <UploadCloud size={13} /> Change Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxImage({ url: uploadedImageUrl, title: 'Uploaded Design Preview' })}
                    className="px-3 py-1.5 bg-black/70 text-white rounded-lg text-xs font-semibold hover:bg-black/90 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <ZoomIn size={13} /> Preview Full
                  </button>
                </div>
                {imageFileName && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[11px] px-2 py-0.5 rounded backdrop-blur-sm truncate max-w-xs">
                    📁 {imageFileName}
                  </div>
                )}
              </div>
            ) : (
              /* Drag & Drop Upload Zone */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-gray-50/50 hover:bg-brand-50/20 flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-sm">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Click to upload or drag & drop CAD drawing image</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Supports PNG, JPG, JPEG, WEBP or Blueprint renders</p>
                </div>
              </div>
            )}

            {/* Quick Sample CAD Presets */}
            <div className="pt-1">
              <p className="text-[11px] font-semibold text-gray-500 mb-1.5">Or choose a preset engineering template:</p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_CAD_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setUploadedImageUrl(preset.url);
                      setImageFileName(`${preset.name.toLowerCase().replace(/\s+/g, '_')}.png`);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                      uploadedImageUrl === preset.url
                        ? 'bg-brand-50 border-brand-300 text-brand-700 font-bold'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Lead Designer" required>
              <select className="select" value={designer} onChange={e => setDesigner(e.target.value)}>
                <option>Dilip Panchal</option>
                <option>Rakesh Verma</option>
                <option>Ramesh Patel</option>
                <option>Harshil Mistry</option>
              </select>
            </FormField>
            <FormField label="Material of Construction (MOC)" required>
              <input className="input" value={material} onChange={e => setMaterial(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Overall Dimensions & Size" required>
            <input className="input" value={dimensions} onChange={e => setDimensions(e.target.value)} />
          </FormField>
          <FormField label="Technical Specifications & Notes" required>
            <textarea className="input" rows={3} value={technicalSpecs} onChange={e => setTechnicalSpecs(e.target.value)} />
          </FormField>
        </form>
      </Modal>

      {/* ── LIGHTBOX / FULL IMAGE MODAL ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-gray-950 rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gray-900 border-b border-white/10 flex items-center justify-between text-white">
              <span className="font-bold text-sm truncate">{lightboxImage.title}</span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Image display */}
            <div className="flex-1 overflow-auto p-2 flex items-center justify-center">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Designs;
