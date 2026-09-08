import React, { useState, useMemo } from 'react';
import {
  CalendarDays, CheckCircle, XCircle, Clock,
  UserX, Eye, ArrowRight,
  Check, X, HeartHandshake,
  CalendarCheck, Palmtree, Stethoscope, Award, Coffee
} from 'lucide-react';
import { SearchBar, StatusBadge, Drawer, InfoGrid, FormField, Modal, KPICard } from '../components/ui';
import type { LeaveRequest, LeaveType } from '../types';
import { useERP } from '../context/ERPContext';

const leaveTypeIcons: Record<LeaveType, React.ReactNode> = {
  'Casual Leave': <Coffee size={14} className="text-amber-600" />,
  'Sick Leave': <Stethoscope size={14} className="text-rose-600" />,
  'Paid Leave': <Palmtree size={14} className="text-emerald-600" />,
  'Compensatory Off': <Award size={14} className="text-blue-600" />,
  'Maternity / Paternity': <HeartHandshake size={14} className="text-purple-600" />,
  'Unpaid Leave': <CalendarDays size={14} className="text-gray-600" />,
};

const leaveTypeBg: Record<LeaveType, string> = {
  'Casual Leave': 'bg-amber-50 text-amber-800 border-amber-200',
  'Sick Leave': 'bg-rose-50 text-rose-800 border-rose-200',
  'Paid Leave': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Compensatory Off': 'bg-blue-50 text-blue-800 border-blue-200',
  'Maternity / Paternity': 'bg-purple-50 text-purple-800 border-purple-200',
  'Unpaid Leave': 'bg-gray-50 text-gray-800 border-gray-200',
};

const deptColors: Record<string, string> = {
  'Design': 'bg-purple-100 text-purple-700',
  'Sales': 'bg-blue-100 text-blue-700',
  'Purchase': 'bg-amber-100 text-amber-700',
  'Fabrication': 'bg-orange-100 text-orange-700',
  'Assembly': 'bg-indigo-100 text-indigo-700',
  'Quality Control': 'bg-teal-100 text-teal-700',
  'Dispatch': 'bg-emerald-100 text-emerald-700',
  'Production': 'bg-red-100 text-red-700',
  'Accounts': 'bg-gray-100 text-gray-700',
  'Inventory': 'bg-cyan-100 text-cyan-700',
};

// Default quotas for employees
const DEFAULT_QUOTAS = {
  casual: 12,
  sick: 8,
  paid: 18,
  compOff: 3,
};

export function Leaves() {
  const { employees, leaveRequests, approveLeaveRequest, rejectLeaveRequest } = useERP();

  // Admin Tab: 'requests' | 'calendar' | 'balances'
  const [adminTab, setAdminTab] = useState<'requests' | 'calendar' | 'balances'>('requests');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Modals & Drawers
  const [approveModalReq, setApproveModalReq] = useState<LeaveRequest | null>(null);
  const [rejectModalReq, setRejectModalReq] = useState<LeaveRequest | null>(null);
  const [adminRemarkInput, setAdminRemarkInput] = useState('');
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);

  // Calculate balances for a specific employee
  const getEmployeeBalances = (empId: string) => {
    const empLeaves = leaveRequests.filter(l => l.employeeId === empId);

    const usedCasual = empLeaves
      .filter(l => l.leaveType === 'Casual Leave' && l.status === 'Approved')
      .reduce((acc, l) => acc + l.totalDays, 0);
    const pendingCasual = empLeaves
      .filter(l => l.leaveType === 'Casual Leave' && l.status === 'Pending')
      .reduce((acc, l) => acc + l.totalDays, 0);

    const usedSick = empLeaves
      .filter(l => l.leaveType === 'Sick Leave' && l.status === 'Approved')
      .reduce((acc, l) => acc + l.totalDays, 0);
    const pendingSick = empLeaves
      .filter(l => l.leaveType === 'Sick Leave' && l.status === 'Pending')
      .reduce((acc, l) => acc + l.totalDays, 0);

    const usedPaid = empLeaves
      .filter(l => l.leaveType === 'Paid Leave' && l.status === 'Approved')
      .reduce((acc, l) => acc + l.totalDays, 0);
    const pendingPaid = empLeaves
      .filter(l => l.leaveType === 'Paid Leave' && l.status === 'Pending')
      .reduce((acc, l) => acc + l.totalDays, 0);

    const usedCompOff = empLeaves
      .filter(l => l.leaveType === 'Compensatory Off' && l.status === 'Approved')
      .reduce((acc, l) => acc + l.totalDays, 0);
    const pendingCompOff = empLeaves
      .filter(l => l.leaveType === 'Compensatory Off' && l.status === 'Pending')
      .reduce((acc, l) => acc + l.totalDays, 0);

    return {
      casual: {
        total: DEFAULT_QUOTAS.casual,
        used: usedCasual,
        pending: pendingCasual,
        remaining: Math.max(0, DEFAULT_QUOTAS.casual - usedCasual),
      },
      sick: {
        total: DEFAULT_QUOTAS.sick,
        used: usedSick,
        pending: pendingSick,
        remaining: Math.max(0, DEFAULT_QUOTAS.sick - usedSick),
      },
      paid: {
        total: DEFAULT_QUOTAS.paid,
        used: usedPaid,
        pending: pendingPaid,
        remaining: Math.max(0, DEFAULT_QUOTAS.paid - usedPaid),
      },
      compOff: {
        total: DEFAULT_QUOTAS.compOff,
        used: usedCompOff,
        pending: pendingCompOff,
        remaining: Math.max(0, DEFAULT_QUOTAS.compOff - usedCompOff),
      },
    };
  };

  // Filtered requests for admin
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter(l => {
      const matchSearch =
        l.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        l.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
        l.leaveNumber.toLowerCase().includes(search.toLowerCase()) ||
        l.reason.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || l.status === statusFilter;
      const matchDept = deptFilter === 'All' || l.department === deptFilter;
      const matchType = typeFilter === 'All' || l.leaveType === typeFilter;
      return matchSearch && matchStatus && matchDept && matchType;
    });
  }, [leaveRequests, search, statusFilter, deptFilter, typeFilter]);

  // Pending requests for Admin
  const pendingRequests = leaveRequests.filter(l => l.status === 'Pending');
  const approvedRequests = leaveRequests.filter(l => l.status === 'Approved');
  const rejectedRequests = leaveRequests.filter(l => l.status === 'Rejected');

  // Check overlap for a given request
  const checkOverlappingLeaves = (req: LeaveRequest) => {
    return leaveRequests.filter(other =>
      other.id !== req.id &&
      other.department === req.department &&
      (other.status === 'Approved' || other.status === 'Pending') &&
      !(new Date(other.endDate) < new Date(req.startDate) || new Date(other.startDate) > new Date(req.endDate))
    );
  };

  // Employees on leave today
  const todayStr = new Date().toISOString().split('T')[0];
  const onLeaveToday = leaveRequests.filter(l =>
    l.status === 'Approved' &&
    l.startDate <= todayStr &&
    l.endDate >= todayStr
  );

  const handleConfirmApproval = () => {
    if (approveModalReq) {
      approveLeaveRequest(approveModalReq.id, adminRemarkInput.trim() || 'Approved by Administrator', 'Dilip Panchal (Admin)');
      setApproveModalReq(null);
      setAdminRemarkInput('');
    }
  };

  const handleConfirmRejection = () => {
    if (rejectModalReq) {
      if (!rejectReasonInput.trim()) {
        alert('Please provide a reason for rejecting the leave request.');
        return;
      }
      rejectLeaveRequest(rejectModalReq.id, rejectReasonInput.trim(), 'Dilip Panchal (Admin)');
      setRejectModalReq(null);
      setRejectReasonInput('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
            <CalendarCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Review, approve, reject employee leaves and track departmental leave quotas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Admin Portal & Approval Desk</span>
        </div>
      </div>

      {/* ── ADMIN OVERVIEW STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pending Approvals"
          value={pendingRequests.length}
          icon={<Clock size={20} className="text-amber-600" />}
          iconBg="bg-amber-50"
          subtitle={pendingRequests.length > 0 ? 'Requires administrative action' : 'All caught up!'}
          alert={pendingRequests.length > 0}
          onClick={() => {
            setAdminTab('requests');
            setStatusFilter('Pending');
          }}
        />
        <KPICard
          title="On Leave Today"
          value={onLeaveToday.length}
          icon={<UserX size={20} className="text-purple-600" />}
          iconBg="bg-purple-50"
          subtitle={
            onLeaveToday.length > 0
              ? onLeaveToday.map(l => l.employeeName.split(' ')[0]).join(', ')
              : 'All staff on duty today'
          }
        />
        <KPICard
          title="Approved This Month"
          value={approvedRequests.length}
          icon={<CheckCircle size={20} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          subtitle="Planned staff leaves"
          onClick={() => {
            setAdminTab('requests');
            setStatusFilter('Approved');
          }}
        />
        <KPICard
          title="Rejected Requests"
          value={rejectedRequests.length}
          icon={<XCircle size={20} className="text-rose-600" />}
          iconBg="bg-rose-50"
          subtitle="With admin remarks"
          onClick={() => {
            setAdminTab('requests');
            setStatusFilter('Rejected');
          }}
        />
      </div>

      {/* ── PENDING APPROVALS ACTION BANNER ── */}
      {pendingRequests.length > 0 && (
        <div className="card p-5 border-amber-200 bg-linear-to-r from-amber-50/70 via-white to-amber-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {pendingRequests.length}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Pending Leave Requests Awaiting Your Approval</h3>
                <p className="text-xs text-gray-500">Review reason, duration, and overlap before approving</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
              Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map(req => {
              const overlaps = checkOverlappingLeaves(req);
              return (
                <div
                  key={req.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[11px] font-semibold text-brand-700">{req.leaveNumber}</span>
                        <h4 className="font-bold text-gray-900 text-sm mt-0.5">{req.employeeName}</h4>
                        <p className="text-xs text-gray-500">{req.employeeCode} · {req.department}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${leaveTypeBg[req.leaveType]}`}>
                        {req.leaveType}
                      </span>
                    </div>

                    <div className="mt-3 bg-gray-50 rounded-lg p-2.5 space-y-1.5 text-xs text-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Leave Period:</span>
                        <span className="font-semibold text-gray-800">
                          {req.startDate === req.endDate ? req.startDate : `${req.startDate} to ${req.endDate}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span className="font-semibold text-brand-700">{req.totalDays} Day(s) ({req.duration})</span>
                      </div>
                      {req.handoverToEmployeeName && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Handover to:</span>
                          <span className="font-medium text-gray-800">{req.handoverToEmployeeName}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-600 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      <span className="font-semibold text-gray-700">REASON:</span>
                      <p className="italic mt-0.5 line-clamp-2">"{req.reason}"</p>
                    </div>

                    {/* Department Overlap Warning */}
                    {overlaps.length > 0 && (
                      <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 flex items-start gap-1.5">
                        <span className="font-bold">⚠️ Warning:</span>
                        <span>
                          {overlaps.length} other team member(s) from {req.department} also away around these dates ({overlaps.map(o => o.employeeName.split(' ')[0]).join(', ')}).
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
                    <button
                      onClick={() => setSelectedReq(req)}
                      className="text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1"
                    >
                      <Eye size={13} /> View
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setRejectModalReq(req);
                          setRejectReasonInput('');
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
                      >
                        <X size={13} /> Reject
                      </button>
                      <button
                        onClick={() => {
                          setApproveModalReq(req);
                          setAdminRemarkInput('Approved');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Check size={13} /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ADMIN NAVIGATION TABS ── */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdminTab('requests')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              adminTab === 'requests'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Leave Requests ({leaveRequests.length})
          </button>
          <button
            onClick={() => setAdminTab('calendar')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              adminTab === 'calendar'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Department Leave Calendar
          </button>
          <button
            onClick={() => setAdminTab('balances')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              adminTab === 'balances'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Employee Leave Quotas & Balances
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      {adminTab === 'calendar' ? (
        /* ── CALENDAR VIEW ── */
        <div className="card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <CalendarDays size={18} className="text-brand-600" /> Upcoming Scheduled Leaves & Availability
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Overview of approved and pending employee absences to prevent shop-floor bottlenecks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Filter Department:</span>
              <select
                className="select w-auto text-xs"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                {['All', ...Array.from(new Set(employees.map(e => e.department)))].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {leaveRequests
              .filter(l => (deptFilter === 'All' || l.department === deptFilter) && l.status !== 'Cancelled' && l.status !== 'Rejected')
              .map(req => (
                <div key={req.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50/80 px-3 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700 shrink-0">
                      {req.employeeName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{req.employeeName}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${deptColors[req.department] || 'bg-gray-100'}`}>
                          {req.department}
                        </span>
                        <StatusBadge status={req.status} size="sm" />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {req.leaveType} · Reason: <span className="italic">{req.reason}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 font-medium">
                      📅 {req.startDate === req.endDate ? req.startDate : `${req.startDate} → ${req.endDate}`}
                    </div>
                    <span className="font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-md border border-brand-100">
                      {req.totalDays} Day(s)
                    </span>
                    <button
                      onClick={() => setSelectedReq(req)}
                      className="btn-secondary text-xs py-1 px-2.5"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : adminTab === 'balances' ? (
        /* ── BALANCES & QUOTAS MASTER TABLE ── */
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Staff Leave Entitlements & Utilization Report</h3>
              <p className="text-xs text-gray-500">Annual quotas: Casual (12d), Sick (8d), Paid (18d), Comp-Off (3d)</p>
            </div>
            <SearchBar value={search} onChange={setSearch} placeholder="Search employees..." className="w-64" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="table-th">Employee</th>
                  <th className="table-th">Department</th>
                  <th className="table-th text-center">Casual Leave (12)</th>
                  <th className="table-th text-center">Sick Leave (8)</th>
                  <th className="table-th text-center">Paid Leave (18)</th>
                  <th className="table-th text-center">Comp Off (3)</th>
                  <th className="table-th text-center">Total Utilized</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees
                  .filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.employeeId.toLowerCase().includes(search.toLowerCase()))
                  .map(emp => {
                    const bal = getEmployeeBalances(emp.id);
                    const totalUsed = bal.casual.used + bal.sick.used + bal.paid.used + bal.compOff.used;
                    return (
                      <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="table-td">
                          <div className="font-bold text-sm text-gray-900">{emp.name}</div>
                          <div className="text-xs text-gray-400 font-mono">{emp.employeeId} · {emp.designation}</div>
                        </td>
                        <td className="table-td">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${deptColors[emp.department] || 'bg-gray-100'}`}>
                            {emp.department}
                          </span>
                        </td>
                        <td className="table-td text-center">
                          <span className="font-bold text-gray-900">{bal.casual.remaining}</span>
                          <span className="text-xs text-gray-400 ml-1">left ({bal.casual.used} used)</span>
                        </td>
                        <td className="table-td text-center">
                          <span className="font-bold text-gray-900">{bal.sick.remaining}</span>
                          <span className="text-xs text-gray-400 ml-1">left ({bal.sick.used} used)</span>
                        </td>
                        <td className="table-td text-center">
                          <span className="font-bold text-gray-900">{bal.paid.remaining}</span>
                          <span className="text-xs text-gray-400 ml-1">left ({bal.paid.used} used)</span>
                        </td>
                        <td className="table-td text-center">
                          <span className="font-bold text-gray-900">{bal.compOff.remaining}</span>
                          <span className="text-xs text-gray-400 ml-1">left ({bal.compOff.used} used)</span>
                        </td>
                        <td className="table-td text-center">
                          <span className="font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-md text-xs">
                            {totalUsed} Days
                          </span>
                        </td>
                        <td className="table-td text-right">
                          <button
                            onClick={() => {
                              setSearch(emp.name);
                              setAdminTab('requests');
                            }}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline inline-flex items-center gap-1"
                          >
                            View Leaves <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── DEFAULT REQUESTS LIST / TABLE ── */
        <div className="card overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by name, ID, reason..."
                className="w-64"
              />

              <select
                className="select w-auto text-xs"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                className="select w-auto text-xs"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                {['All', ...Array.from(new Set(employees.map(e => e.department)))].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                className="select w-auto text-xs"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="All">All Leave Types</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Paid Leave">Paid Leave</option>
                <option value="Compensatory Off">Compensatory Off</option>
                <option value="Maternity / Paternity">Maternity / Paternity</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Showing <strong>{filteredRequests.length}</strong> request(s)
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70">
                  <th className="table-th">Leave #</th>
                  <th className="table-th">Employee</th>
                  <th className="table-th">Leave Type</th>
                  <th className="table-th">Leave Dates & Duration</th>
                  <th className="table-th">Reason</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Applied On</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                      <CalendarDays size={36} className="mx-auto text-gray-300 mb-2" />
                      No leave requests found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map(req => (
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedReq(req)}
                    >
                      <td className="table-td">
                        <span className="font-mono text-xs font-bold text-brand-700">{req.leaveNumber}</span>
                      </td>
                      <td className="table-td">
                        <div className="font-bold text-sm text-gray-900">{req.employeeName}</div>
                        <div className="text-xs text-gray-400">{req.employeeCode} · {req.department}</div>
                      </td>
                      <td className="table-td">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${leaveTypeBg[req.leaveType]}`}>
                          {leaveTypeIcons[req.leaveType]}
                          {req.leaveType}
                        </span>
                      </td>
                      <td className="table-td text-xs">
                        <div className="font-semibold text-gray-900">
                          {req.startDate === req.endDate ? req.startDate : `${req.startDate} → ${req.endDate}`}
                        </div>
                        <span className="text-gray-500 font-medium">
                          {req.totalDays} Day(s) ({req.duration})
                        </span>
                      </td>
                      <td className="table-td text-xs text-gray-600 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                        {req.handoverToEmployeeName && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Handover: <strong className="text-gray-600">{req.handoverToEmployeeName}</strong>
                          </p>
                        )}
                      </td>
                      <td className="table-td">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="table-td text-xs text-gray-500">
                        {req.appliedAt ? req.appliedAt.split('T')[0] : '—'}
                      </td>
                      <td className="table-td text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Admin Actions */}
                          {req.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setApproveModalReq(req);
                                  setAdminRemarkInput('Approved');
                                }}
                                title="Approve Request"
                                className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalReq(req);
                                  setRejectReasonInput('');
                                }}
                                title="Reject Request"
                                className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setSelectedReq(req)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: APPROVE LEAVE WITH REMARKS ── */}
      {approveModalReq && (
        <Modal
          open={!!approveModalReq}
          onClose={() => setApproveModalReq(null)}
          title="Approve Leave Request"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setApproveModalReq(null)}>
                Cancel
              </button>
              <button type="button" className="btn-primary bg-emerald-600 hover:bg-emerald-700" onClick={handleConfirmApproval}>
                <Check size={14} /> Confirm Approval
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between font-semibold text-emerald-900">
                <span>Employee: {approveModalReq.employeeName} ({approveModalReq.employeeCode})</span>
                <span>{approveModalReq.department}</span>
              </div>
              <p className="text-emerald-800">
                <strong>Period:</strong> {approveModalReq.startDate} to {approveModalReq.endDate} ({approveModalReq.totalDays} Days · {approveModalReq.leaveType})
              </p>
              <p className="text-emerald-700 italic">
                <strong>Reason:</strong> "{approveModalReq.reason}"
              </p>
            </div>

            <FormField label="Admin Remarks / Approval Note">
              <input
                className="input"
                placeholder="e.g. Approved. Handover confirmed with supervisor."
                value={adminRemarkInput}
                onChange={e => setAdminRemarkInput(e.target.value)}
              />
            </FormField>
          </div>
        </Modal>
      )}

      {/* ── MODAL: REJECT LEAVE WITH REASON ── */}
      {rejectModalReq && (
        <Modal
          open={!!rejectModalReq}
          onClose={() => setRejectModalReq(null)}
          title="Reject Leave Request"
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setRejectModalReq(null)}>
                Cancel
              </button>
              <button type="button" className="btn-primary bg-rose-600 hover:bg-rose-700" onClick={handleConfirmRejection}>
                <X size={14} /> Confirm Rejection
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between font-semibold text-rose-900">
                <span>Employee: {rejectModalReq.employeeName} ({rejectModalReq.employeeCode})</span>
                <span>{rejectModalReq.department}</span>
              </div>
              <p className="text-rose-800">
                <strong>Period:</strong> {rejectModalReq.startDate} to {rejectModalReq.endDate} ({rejectModalReq.totalDays} Days · {rejectModalReq.leaveType})
              </p>
              <p className="text-rose-700 italic">
                <strong>Employee Reason:</strong> "{rejectModalReq.reason}"
              </p>
            </div>

            <FormField label="Rejection Reason (Mandatory)" required>
              <textarea
                className="input h-24 py-2 resize-none"
                placeholder="Provide clear reason why this request cannot be accommodated (e.g. critical production deadline, key staff shortage)..."
                value={rejectReasonInput}
                onChange={e => setRejectReasonInput(e.target.value)}
                required
              />
            </FormField>
          </div>
        </Modal>
      )}

      {/* ── DRAWER: LEAVE REQUEST DETAILS ── */}
      {selectedReq && (
        <Drawer
          open={!!selectedReq}
          onClose={() => setSelectedReq(null)}
          title={selectedReq.leaveNumber}
          subtitle={`${selectedReq.employeeName} · ${selectedReq.leaveType}`}
        >
          <div className="p-6 space-y-6">
            {/* Header summary card */}
            <div className="p-5 bg-linear-to-r from-navy-900 to-navy-800 rounded-2xl text-white space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-brand-300 font-bold">{selectedReq.leaveNumber}</span>
                <StatusBadge status={selectedReq.status} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedReq.employeeName}</h3>
                <p className="text-xs text-gray-300">{selectedReq.employeeCode} · {selectedReq.department} Department</p>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span>Total Absence: <strong>{selectedReq.totalDays} Day(s)</strong></span>
                <span className="bg-white/10 px-2.5 py-1 rounded-full font-semibold">{selectedReq.leaveType}</span>
              </div>
            </div>

            {/* Info Grid */}
            <InfoGrid
              items={[
                { label: 'Start Date', value: selectedReq.startDate },
                { label: 'End Date', value: selectedReq.endDate },
                { label: 'Duration Type', value: selectedReq.duration },
                { label: 'Applied At', value: selectedReq.appliedAt ? selectedReq.appliedAt.replace('T', ' ') : '—' },
                { label: 'Handover Colleague', value: selectedReq.handoverToEmployeeName || 'None assigned' },
                { label: 'Emergency Contact', value: selectedReq.contactDuringLeave || '—' },
                { label: 'Reviewed By', value: selectedReq.reviewedBy || 'Pending Review' },
                { label: 'Reviewed At', value: selectedReq.reviewedAt ? selectedReq.reviewedAt.replace('T', ' ') : '—' },
              ]}
            />

            {/* Reason Block */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Employee's Stated Reason</p>
              <p className="text-sm text-gray-800 leading-relaxed font-medium">{selectedReq.reason}</p>
            </div>

            {/* Admin Remarks Block */}
            {selectedReq.adminRemarks && (
              <div className="p-4 bg-brand-50/60 border border-brand-100 rounded-xl space-y-1">
                <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">Administrator Remarks</p>
                <p className="text-sm text-gray-900 leading-relaxed italic">{selectedReq.adminRemarks}</p>
              </div>
            )}

            {/* Action buttons inside drawer */}
            {selectedReq.status === 'Pending' && (
              <div className="pt-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    setRejectModalReq(selectedReq);
                    setSelectedReq(null);
                  }}
                  className="btn-secondary flex-1 text-rose-700 border-rose-200 hover:bg-rose-50 justify-center"
                >
                  <X size={14} /> Reject Request
                </button>
                <button
                  onClick={() => {
                    setApproveModalReq(selectedReq);
                    setSelectedReq(null);
                  }}
                  className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 justify-center"
                >
                  <Check size={14} /> Approve Request
                </button>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}

export default Leaves;
