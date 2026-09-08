import React, { useState } from 'react';
import { CheckCircle, Factory, Plus, Eye, ArrowRight, Shield, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchBar, StatusBadge, SectionHeader, Drawer, InfoGrid, Modal, FormField } from '../components/ui';
import type { QCInspection } from '../types';
import { useERP } from '../context/ERPContext';

export function QualityControl() {
  const navigate = useNavigate();
  const { qcInspections, jobs, addQCInspection, updateQCInspection, updateJob } = useERP();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<QCInspection | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // New QC Form
  const [jobId, setJobId] = useState(jobs[0]?.id || '');
  const [inspectionType, setInspectionType] = useState('Final Inspection');
  const [inspector, setInspector] = useState('Dilip Panchal');
  const [observations, setObservations] = useState('All weld seams verified with DPT check. Bearing alignment and no-load vibration tests within permissible limits.');

  const filtered = qcInspections.filter(q => {
    const job = jobs.find(j => j.id === q.jobId);
    return q.qcNumber.toLowerCase().includes(search.toLowerCase()) ||
      (job?.jobNumber ?? '').toLowerCase().includes(search.toLowerCase());
  });

  const handleCreateQC = (e: React.FormEvent) => {
    e.preventDefault();
    const newQC: QCInspection = {
      id: `QC-${Date.now()}`,
      qcNumber: `QC-2026-${String(qcInspections.length + 1).padStart(3, '0')}`,
      jobId: jobId || jobs[0]?.id || 'JOB-001',
      inspectionType: inspectionType as any,
      inspector,
      inspectionDate: new Date().toISOString().split('T')[0],
      overallResult: 'Passed',
      observations,
      parameters: [
        { id: 'qcp-1', parameter: 'Weld Quality & Penetration', standard: 'IS 816', expectedValue: 'No porosity, uniform 6mm fillet', actualValue: 'Conforms', result: 'Pass' },
        { id: 'qcp-2', parameter: 'Pulley & Shaft Alignment', standard: 'ISO 10816', expectedValue: '< 0.05 mm runout', actualValue: '0.03 mm', result: 'Pass' },
        { id: 'qcp-3', parameter: 'No-Load Motor Run Test', standard: 'IS 325', expectedValue: '1440 RPM, Current < 4.2A', actualValue: '1435 RPM, 3.8A', result: 'Pass' },
        { id: 'qcp-4', parameter: 'Epoxy Primer & Topcoat DFT', standard: 'SSPC-PA 2', expectedValue: '120-150 microns', actualValue: '135 microns', result: 'Pass' },
      ],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    addQCInspection(newQC);
    setAddOpen(false);
    setSelected(newQC);
  };

  const handleApproveForDispatch = (qc: QCInspection) => {
    updateQCInspection(qc.id, { overallResult: 'Passed' });
    updateJob(qc.jobId, { currentStage: 'Dispatch', progressPercent: 95 });
    alert(`✅ QC ${qc.qcNumber} Approved! Job released for Dispatch.`);
    navigate('/dispatch');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Quality Control & Inspection (QC)"
        subtitle={`${qcInspections.length} inspections · ${qcInspections.filter(q => q.overallResult === 'Passed').length} passed for dispatch`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search QC..." className="w-64" />
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> New Inspection
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-th">QC Number</th>
              <th className="table-th">Job Ref</th>
              <th className="table-th">Inspection Type</th>
              <th className="table-th">Lead Inspector</th>
              <th className="table-th">Date</th>
              <th className="table-th">Quality Parameters</th>
              <th className="table-th">Overall Result</th>
              <th className="table-th w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(qc => {
              const job = jobs.find(j => j.id === qc.jobId);
              const passCount = qc.parameters.filter(p => p.result === 'Pass').length;
              return (
                <tr key={qc.id} className="table-row" onClick={() => setSelected(qc)}>
                  <td className="table-td font-mono font-semibold text-brand-700 text-xs">{qc.qcNumber}</td>
                  <td className="table-td font-mono text-blue-700 text-xs">{job?.jobNumber ?? 'JOB-001'}</td>
                  <td className="table-td text-sm font-medium text-gray-800">{qc.inspectionType}</td>
                  <td className="table-td text-sm text-gray-600">{qc.inspector}</td>
                  <td className="table-td text-xs text-gray-500">{qc.inspectionDate}</td>
                  <td className="table-td">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {passCount}/{qc.parameters.length} Pass
                    </span>
                  </td>
                  <td className="table-td"><StatusBadge status={qc.overallResult} /></td>
                  <td className="table-td">
                    <button
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-brand-600"
                      onClick={(e) => { e.stopPropagation(); setSelected(qc); }}
                    >
                      <Eye size={14} />
                    </button>
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
          title={selected.qcNumber}
          subtitle={`${selected.inspectionType} · ${selected.inspector}`}
          actions={
            <div className="flex gap-2">
              <button className="btn-secondary text-xs" onClick={() => window.print()}>
                <Printer size={12} /> Print QC Certificate
              </button>
              {selected.overallResult === 'Passed' ? (
                <button className="btn-success text-xs" onClick={() => handleApproveForDispatch(selected)}>
                  <CheckCircle size={12} /> Release for Dispatch
                </button>
              ) : (
                <button className="btn-success text-xs" onClick={() => handleApproveForDispatch(selected)}>
                  <CheckCircle size={12} /> Approve QC
                </button>
              )}
            </div>
          }
        >
          <div className="p-6 space-y-6">
            <div className={`rounded-xl p-4 border ${
              selected.overallResult === 'Passed' ? 'bg-emerald-50 border-emerald-200' :
              selected.overallResult === 'Failed' ? 'bg-red-50 border-red-200' :
              'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">Overall Inspection Decision</p>
                  <p className="text-xs text-gray-500 mt-0.5">{selected.inspectionDate} · Checked by {selected.inspector}</p>
                </div>
                <StatusBadge status={selected.overallResult} />
              </div>
              {selected.observations && (
                <p className="mt-3 text-xs text-gray-700 bg-white/70 rounded-lg p-3 border leading-relaxed">{selected.observations}</p>
              )}
            </div>

            <div>
              <p className="label mb-3">Dimensional & Functional Checkpoints</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="table-th text-xs">Parameter</th>
                      <th className="table-th text-xs">Acceptance Norm</th>
                      <th className="table-th text-xs">Actual Observed</th>
                      <th className="table-th text-xs">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.parameters.map(p => (
                      <tr key={p.id} className="border-b border-gray-50">
                        <td className="table-td text-xs font-semibold text-gray-800">{p.parameter}</td>
                        <td className="table-td text-xs text-gray-500">{p.expectedValue}</td>
                        <td className="table-td text-xs font-medium">{p.actualValue}</td>
                        <td className="table-td">
                          <span className="text-xs font-bold text-emerald-600">✓ {p.result}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              className="btn-success w-full text-xs py-2.5 flex items-center justify-center gap-2"
              onClick={() => handleApproveForDispatch(selected)}
            >
              <CheckCircle size={14} /> Approve QC and Move to Dispatch Stage
            </button>
          </div>
        </Drawer>
      )}

      {/* New QC Inspection Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Record Quality Inspection (QC)"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleCreateQC}>Save & Approve Inspection</button>
          </div>
        }
      >
        <form onSubmit={handleCreateQC} className="space-y-4">
          <FormField label="Related Job" required>
            <select className="select" value={jobId} onChange={e => setJobId(e.target.value)}>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.jobNumber} — {j.productName}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Inspection Stage / Type" required>
              <select className="select" value={inspectionType} onChange={e => setInspectionType(e.target.value)}>
                <option>Final Inspection</option>
                <option>In-Process QC</option>
                <option>Material Incoming QC</option>
                <option>Pre-Dispatch Test</option>
              </select>
            </FormField>
            <FormField label="Lead Quality Inspector" required>
              <select className="select" value={inspector} onChange={e => setInspector(e.target.value)}>
                <option>Dilip Panchal</option>
                <option>Jagdish Prajapati</option>
              </select>
            </FormField>
          </div>
          <FormField label="Inspection Findings & Observations" required>
            <textarea className="input" rows={3} value={observations} onChange={e => setObservations(e.target.value)} required />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
