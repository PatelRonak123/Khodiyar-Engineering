import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, CalendarCheck, ShieldCheck, Check, LogIn, Mail, Phone,
  Calendar, CheckSquare, Factory, Shield, Activity, Award,
  Clock, X, ArrowRight, UserCheck, Download, Printer, User,
  Briefcase, AlertCircle, FileText, ChevronRight
} from 'lucide-react';
import { SearchBar, StatusBadge, PriorityBadge, SectionHeader, FormField, Modal } from '../components/ui';
import type { Employee, Department, UserRole, Task, LeaveRequest } from '../types';
import { ROLE_DEFINITIONS } from '../types';
import { useERP } from '../context/ERPContext';
import { exportToCSV } from '../utils/exportUtils';

const deptColors: Record<string, string> = {
  'Design': 'bg-purple-100 text-purple-700 border-purple-200',
  'Sales': 'bg-blue-100 text-blue-700 border-blue-200',
  'Purchase': 'bg-amber-100 text-amber-700 border-amber-200',
  'Fabrication': 'bg-orange-100 text-orange-700 border-orange-200',
  'Assembly': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Quality Control': 'bg-teal-100 text-teal-700 border-teal-200',
  'Dispatch': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Production': 'bg-red-100 text-red-700 border-red-200',
  'Accounts': 'bg-gray-100 text-gray-700 border-gray-200',
  'Inventory': 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const avatarBgs = [
  'bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-600',
  'bg-rose-600', 'bg-indigo-600', 'bg-cyan-600', 'bg-orange-600',
  'bg-teal-600', 'bg-gray-600'
];

type DetailTab = 'overview' | 'tasks' | 'leaves' | 'operations' | 'role' | 'activity';

export function EmployeeList() {
  const navigate = useNavigate();
  const {
    employees, addEmployee, updateEmployeeRole, switchUser,
    tasks, leaveRequests, fabricationOrders, assemblyOrders,
    productionOrders, qcInspections, activityLogs
  } = useERP();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');

  // Role Assignment inside Modal
  const [assignedRole, setAssignedRole] = useState<UserRole>('sales');
  const [roleSavedSuccess, setRoleSavedSuccess] = useState(false);

  // Form state for adding employee
  const [name, setName] = useState('');
  const [department, setDepartment] = useState<Department>('Fabrication');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState<UserRole>('production_manager');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [skills, setSkills] = useState('Welding, Machining');

  const departments = ['All', ...Array.from(new Set(employees.map(e => e.department)))];

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All' || e.department === deptFilter;
    const matchRole = roleFilter === 'All' || (e.role || 'sales') === roleFilter;
    return matchSearch && matchDept && matchRole;
  });

  const handleSelectEmployee = (emp: Employee) => {
    setSelected(emp);
    setAssignedRole(emp.role || 'sales');
    setRoleSavedSuccess(false);
    setDetailTab('overview');
  };

  const handleSaveRole = () => {
    if (selected) {
      updateEmployeeRole(selected.id, assignedRole);
      setSelected(prev => prev ? { ...prev, role: assignedRole } : null);
      setRoleSavedSuccess(true);
      setTimeout(() => setRoleSavedSuccess(false), 3000);
    }
  };

  const handleSwitchToEmployee = (emp: Employee) => {
    switchUser(emp.id);
    setSelected(null);
    navigate('/');
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Please enter employee name and phone number.');
      return;
    }
    const newEmp: Employee = {
      id: `EMP-${Date.now()}`,
      employeeId: `KE-${String(employees.length + 1).padStart(3, '0')}`,
      name,
      department,
      designation: designation || `${department} Specialist`,
      role,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@khodiyarengineering.in`,
      joiningDate: new Date().toISOString().split('T')[0],
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      status: 'Active',
    };
    addEmployee(newEmp);
    setAddOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setDesignation('');
    setRole('production_manager');
  };

  // Helper to export single employee profile as CSV
  const handleExportEmployeeDossier = (emp: Employee) => {
    const empTasks = tasks.filter(t => t.assignedEmployeeId === emp.id || t.assignedEmployeeId === emp.employeeId);
    const empLeaves = leaveRequests.filter(l => l.employeeId === emp.id || l.employeeName === emp.name);
    
    const headers = ['Category', 'Field', 'Value'];
    const rows = [
      ['Profile', 'Employee ID', emp.employeeId],
      ['Profile', 'Full Name', emp.name],
      ['Profile', 'Department', emp.department],
      ['Profile', 'Designation', emp.designation],
      ['Profile', 'System Role', ROLE_DEFINITIONS[emp.role || 'sales']?.label || 'Staff'],
      ['Profile', 'Phone', emp.phone],
      ['Profile', 'Email', emp.email],
      ['Profile', 'Joining Date', emp.joiningDate],
      ['Profile', 'Status', emp.status],
      ['Profile', 'Skills', emp.skills.join(', ')],
      ['Metrics', 'Total Tasks Assigned', empTasks.length.toString()],
      ['Metrics', 'Completed Tasks', empTasks.filter(t => t.status === 'Completed').length.toString()],
      ['Metrics', 'Leave Applications', empLeaves.length.toString()],
      ['Metrics', 'Approved Leaves', empLeaves.filter(l => l.status === 'Approved').length.toString()],
    ];

    exportToCSV(`Employee_${emp.employeeId}_${emp.name.replace(/\s+/g, '_')}_Dossier.csv`, headers, rows);
  };

  // Data aggregations for currently selected employee
  const selectedTasks = selected
    ? tasks.filter(t => t.assignedEmployeeId === selected.id || t.assignedEmployeeId === selected.employeeId)
    : [];

  const selectedLeaves = selected
    ? leaveRequests.filter(l => l.employeeId === selected.id || l.employeeName === selected.name)
    : [];

  const selectedFabs = selected
    ? fabricationOrders.filter(f => f.assignedEmployeeId === selected.id || f.assignedEmployeeId === selected.employeeId)
    : [];

  const selectedAssemblies = selected
    ? assemblyOrders.filter(a => a.assignedTeam?.some(t => t.toLowerCase().includes(selected.name.toLowerCase()) || t === selected.id))
    : [];

  const selectedProds = selected
    ? productionOrders.filter(p => p.productionManager === selected.id || p.assignedTeam?.includes(selected.name))
    : [];

  const selectedQCs = selected
    ? qcInspections.filter(q => q.inspector === selected.name || q.inspector === selected.id)
    : [];

  const selectedLogs = selected
    ? activityLogs.filter(a => a.performedBy === selected.name || a.performedBy === selected.id)
    : [];

  const completedTasksCount = selectedTasks.filter(t => t.status === 'Completed').length;
  const taskCompletionRate = selectedTasks.length > 0 ? Math.round((completedTasksCount / selectedTasks.length) * 100) : 100;
  const approvedLeavesCount = selectedLeaves.filter(l => l.status === 'Approved').reduce((sum, l) => sum + (l.totalDays || 1), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <SectionHeader
        title="Employee Directory & Workforce 360°"
        subtitle={`${employees.length} team members registered · Click on any employee to view complete tasks, leaves, operational records, and system permissions.`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search employee, ID, role, skills..." className="w-64" />
            <select className="select w-auto text-xs font-semibold" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="select w-auto text-xs font-semibold" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="All">All Roles</option>
              {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => (
                <option key={key} value={key}>{def.label}</option>
              ))}
            </select>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white shadow-xs">
              {['card', 'list'].map(v => (
                <button key={v} onClick={() => setViewMode(v as 'card' | 'list')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${viewMode === v ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <button className="btn-primary cursor-pointer font-bold shadow-sm" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> Add Employee
            </button>
          </>
        }
      />

      {/* ── CARD VIEW ── */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((emp, idx) => {
            const roleDef = ROLE_DEFINITIONS[emp.role || 'sales'] || ROLE_DEFINITIONS.sales;
            const empTasks = tasks.filter(t => t.assignedEmployeeId === emp.id || t.assignedEmployeeId === emp.employeeId);
            const empLeaves = leaveRequests.filter(l => l.employeeId === emp.id || l.employeeName === emp.name);

            return (
              <div
                key={emp.id}
                className="card p-5 cursor-pointer hover:border-brand-300 hover:shadow-lg transition-all flex flex-col justify-between group border border-gray-200"
                onClick={() => handleSelectEmployee(emp)}
              >
                <div>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl ${avatarBgs[idx % avatarBgs.length]} flex items-center justify-center mb-3 shadow-md text-white font-extrabold text-2xl group-hover:scale-105 transition-transform`}>
                      {emp.name.charAt(0)}
                    </div>
                    <p className="font-bold text-gray-900 text-base group-hover:text-brand-600 transition-colors">{emp.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{emp.designation}</p>

                    <div className="flex flex-wrap gap-1.5 justify-center mt-2.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${deptColors[emp.department] ?? 'bg-gray-100 text-gray-700'}`}>
                        {emp.department}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleDef.badgeColor}`}>
                        {roleDef.label}
                      </span>
                    </div>

                    {/* Quick Metric Badges */}
                    <div className="grid grid-cols-2 gap-2 w-full mt-4 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-left">
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Tasks</p>
                        <p className="text-xs font-bold text-gray-800">{empTasks.filter(t => t.status === 'Completed').length}/{empTasks.length} Done</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Leaves</p>
                        <p className="text-xs font-bold text-gray-800">{empLeaves.length} Applications</p>
                      </div>
                    </div>

                    <div className="flex gap-1 flex-wrap justify-center mt-3">
                      {emp.skills.slice(0, 3).map(s => (
                        <span key={s} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">{s}</span>
                      ))}
                      {emp.skills.length > 3 && <span className="text-[11px] text-gray-400 font-medium">+{emp.skills.length - 3}</span>}
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="font-mono text-xs font-semibold text-gray-600">{emp.employeeId}</span>
                  <span className="text-brand-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View Full 360° →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden border border-gray-200">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/75">
                <th className="table-th">Employee ID</th>
                <th className="table-th">Name & Profile</th>
                <th className="table-th">Department</th>
                <th className="table-th">Designation</th>
                <th className="table-th">System Role</th>
                <th className="table-th">Tasks</th>
                <th className="table-th">Leaves</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, idx) => {
                const roleDef = ROLE_DEFINITIONS[emp.role || 'sales'] || ROLE_DEFINITIONS.sales;
                const empTasks = tasks.filter(t => t.assignedEmployeeId === emp.id || t.assignedEmployeeId === emp.employeeId);
                const empLeaves = leaveRequests.filter(l => l.employeeId === emp.id || l.employeeName === emp.name);

                return (
                  <tr
                    key={emp.id}
                    className="table-row hover:bg-blue-50/40 cursor-pointer"
                    onClick={() => handleSelectEmployee(emp)}
                  >
                    <td className="table-td font-mono text-xs text-brand-700 font-bold">{emp.employeeId}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${avatarBgs[idx % avatarBgs.length]} flex items-center justify-center shrink-0 text-white text-sm font-bold shadow-xs`}>
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{emp.name}</p>
                          <p className="text-[11px] text-gray-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${deptColors[emp.department] ?? 'bg-gray-100 text-gray-700'}`}>
                        {emp.department}
                      </span>
                    </td>
                    <td className="table-td text-sm font-medium text-gray-700">{emp.designation}</td>
                    <td className="table-td">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${roleDef.badgeColor}`}>
                        {roleDef.label}
                      </span>
                    </td>
                    <td className="table-td text-xs font-semibold text-gray-700">
                      {empTasks.filter(t => t.status === 'Completed').length}/{empTasks.length} Done
                    </td>
                    <td className="table-td text-xs font-semibold text-gray-700">
                      {empLeaves.length} records
                    </td>
                    <td className="table-td"><StatusBadge status={emp.status} /></td>
                    <td className="table-td text-right">
                      <button className="btn-secondary text-xs px-3 py-1 font-bold text-brand-700 hover:bg-brand-50 border-brand-200">
                        View 360° Data
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EMPLOYEE 360° COMPLETE DETAILS MODAL
      ───────────────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Modal Header Profile Banner */}
            <div className="bg-linear-to-r from-navy-900 via-navy-800 to-navy-950 text-white p-6 relative overflow-hidden shrink-0">
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl ${avatarBgs[employees.indexOf(selected) % avatarBgs.length]} flex items-center justify-center shadow-xl text-white text-3xl font-extrabold shrink-0 border-2 border-white/20`}>
                    {selected.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold tracking-tight text-white">{selected.name}</h2>
                      <span className="font-mono text-xs bg-white/10 px-2.5 py-0.5 rounded-md border border-white/20 text-brand-300 font-semibold">
                        {selected.employeeId}
                      </span>
                      <StatusBadge status={selected.status} />
                    </div>
                    <p className="text-sm text-navy-200 mt-0.5">{selected.designation} • {selected.department} Department</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-navy-300 flex-wrap">
                      <span className="flex items-center gap-1.5"><Phone size={13} className="text-brand-400" /> {selected.phone}</span>
                      <span className="flex items-center gap-1.5"><Mail size={13} className="text-brand-400" /> {selected.email}</span>
                      <span className="flex items-center gap-1.5"><Calendar size={13} className="text-brand-400" /> Joined {selected.joiningDate}</span>
                    </div>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleExportEmployeeDossier(selected)}
                    className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
                    title="Export employee data dossier to CSV"
                  >
                    <Download size={13} /> Export CSV
                  </button>
                  <button
                    onClick={() => handleSwitchToEmployee(selected)}
                    className="btn-primary bg-brand-600 hover:bg-brand-700 text-white text-xs px-3.5 py-1.5 flex items-center gap-1.5 font-bold cursor-pointer shadow-md"
                    title="Switch user session to act as this employee"
                  >
                    <LogIn size={13} /> Act As User
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="w-8 h-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs inside Modal */}
              <div className="flex items-center gap-1 mt-6 pt-4 border-t border-white/10 overflow-x-auto scrollbar-none text-xs">
                {[
                  { id: 'overview', label: 'Overview & Profile', icon: <User size={13} />, count: null },
                  { id: 'tasks', label: 'Tasks & Kanban', icon: <CheckSquare size={13} />, count: selectedTasks.length },
                  { id: 'leaves', label: 'Leave & Attendance', icon: <CalendarCheck size={13} />, count: selectedLeaves.length },
                  { id: 'operations', label: 'Shop Floor & Orders', icon: <Factory size={13} />, count: selectedFabs.length + selectedAssemblies.length + selectedProds.length + selectedQCs.length },
                  { id: 'role', label: 'Role & Permissions', icon: <ShieldCheck size={13} />, count: null },
                  { id: 'activity', label: 'Activity Logs', icon: <Activity size={13} />, count: selectedLogs.length },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id as DetailTab)}
                    className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      detailTab === tab.id
                        ? 'bg-white text-navy-950 shadow-md'
                        : 'text-navy-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        detailTab === tab.id ? 'bg-navy-950 text-white' : 'bg-white/20 text-white'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body with Tab Contents */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              {/* ───────────────── TAB 1: OVERVIEW ───────────────── */}
              {detailTab === 'overview' && (
                <div className="space-y-6">
                  {/* Summary Metric KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="card p-4 bg-white border border-gray-200">
                      <div className="flex items-center gap-2.5 text-blue-600 mb-1">
                        <CheckSquare size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Tasks Completed</span>
                      </div>
                      <p className="text-2xl font-black text-gray-900">{completedTasksCount} / {selectedTasks.length}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{taskCompletionRate}% completion rate</p>
                    </div>

                    <div className="card p-4 bg-white border border-gray-200">
                      <div className="flex items-center gap-2.5 text-emerald-600 mb-1">
                        <CalendarCheck size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Leaves Taken</span>
                      </div>
                      <p className="text-2xl font-black text-gray-900">{approvedLeavesCount} <span className="text-sm font-medium text-gray-500">Days</span></p>
                      <p className="text-xs text-gray-500 mt-0.5">{selectedLeaves.length} applications total</p>
                    </div>

                    <div className="card p-4 bg-white border border-gray-200">
                      <div className="flex items-center gap-2.5 text-purple-600 mb-1">
                        <Factory size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Work Orders</span>
                      </div>
                      <p className="text-2xl font-black text-gray-900">{selectedFabs.length + selectedAssemblies.length + selectedProds.length}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Manufacturing jobs</p>
                    </div>

                    <div className="card p-4 bg-white border border-gray-200">
                      <div className="flex items-center gap-2.5 text-amber-600 mb-1">
                        <ShieldCheck size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Access Level</span>
                      </div>
                      <p className="text-base font-bold text-gray-900 truncate">{ROLE_DEFINITIONS[selected.role || 'sales']?.label || 'Staff'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{ROLE_DEFINITIONS[selected.role || 'sales']?.allowedModules.length || 6} modules</p>
                    </div>
                  </div>

                  {/* Profile Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employment Demographics */}
                    <div className="card p-5 bg-white border border-gray-200 space-y-4">
                      <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <Briefcase size={16} className="text-brand-600" /> Employment & Organizational Data
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-400 font-semibold uppercase text-[10px]">Employee Code</p>
                          <p className="font-bold text-gray-900 mt-0.5 font-mono">{selected.employeeId}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-semibold uppercase text-[10px]">Department</p>
                          <p className="font-bold text-gray-900 mt-0.5">{selected.department}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-semibold uppercase text-[10px]">Designation</p>
                          <p className="font-bold text-gray-900 mt-0.5">{selected.designation}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-semibold uppercase text-[10px]">Employment Status</p>
                          <div className="mt-0.5"><StatusBadge status={selected.status} /></div>
                        </div>
                        <div>
                          <p className="text-gray-400 font-semibold uppercase text-[10px]">Joining Date</p>
                          <p className="font-bold text-gray-900 mt-0.5">{selected.joiningDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-semibold uppercase text-[10px]">Work Center / Shift</p>
                          <p className="font-bold text-gray-900 mt-0.5">Vatva Plant — General Shift</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Personal Info */}
                    <div className="card p-5 bg-white border border-gray-200 space-y-4">
                      <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <Phone size={16} className="text-brand-600" /> Contact & Communication
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-400 font-semibold uppercase text-[10px]">Phone Number</p>
                          <p className="font-bold text-gray-900 mt-0.5">{selected.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-semibold uppercase text-[10px]">Official Work Email</p>
                          <p className="font-bold text-gray-900 mt-0.5 truncate">{selected.email}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-400 font-semibold uppercase text-[10px]">Factory Address</p>
                          <p className="font-medium text-gray-700 mt-0.5">Plot No. 124, GIDC Phase-2, Vatva, Ahmedabad, Gujarat</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills & Competencies */}
                  <div className="card p-5 bg-white border border-gray-200">
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3 mb-3">
                      <Award size={16} className="text-brand-600" /> Skills, Certifications & Competencies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.skills.map(s => (
                        <span key={s} className="bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-brand-200 shadow-xs">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ───────────────── TAB 2: TASKS & KANBAN ───────────────── */}
              {detailTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-gray-900">Assigned Tasks ({selectedTasks.length})</h3>
                      <p className="text-xs text-gray-500">All workflow milestones and shop floor assignments assigned to {selected.name}.</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                      {completedTasksCount} / {selectedTasks.length} Completed
                    </span>
                  </div>

                  {selectedTasks.length > 0 ? (
                    <div className="card overflow-hidden bg-white border border-gray-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold text-gray-700">Task ID</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-700">Task Title</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-700">Department</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-700">Priority</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-700">Due Date</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedTasks.map(t => (
                            <tr key={t.id} className="hover:bg-blue-50/40">
                              <td className="py-2.5 px-3 font-mono font-bold text-brand-700">{t.taskId || t.id}</td>
                              <td className="py-2.5 px-3 font-bold text-gray-900">{t.taskName}</td>
                              <td className="py-2.5 px-3 text-gray-600">{t.department}</td>
                              <td className="py-2.5 px-3"><PriorityBadge priority={t.priority} /></td>
                              <td className="py-2.5 px-3 text-gray-600">{t.dueDate}</td>
                              <td className="py-2.5 px-3"><StatusBadge status={t.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="card p-12 text-center bg-white border border-gray-200">
                      <CheckSquare size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-bold text-gray-700">No tasks currently assigned</p>
                      <p className="text-xs text-gray-400 mt-1">This employee is not assigned to any pending tasks.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ───────────────── TAB 3: LEAVE & ATTENDANCE ───────────────── */}
              {detailTab === 'leaves' && (
                <div className="space-y-5">
                  {/* Leave Quota Balance Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Casual Leave (CL)', used: 2, total: 12, color: 'text-blue-700 bg-blue-50 border-blue-200' },
                      { label: 'Sick Leave (SL)', used: 1, total: 10, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                      { label: 'Paid Leave (PL)', used: 4, total: 15, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                      { label: 'Comp Off', used: 0, total: 3, color: 'text-purple-700 bg-purple-50 border-purple-200' },
                    ].map(quota => (
                      <div key={quota.label} className={`p-3.5 rounded-xl border ${quota.color}`}>
                        <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">{quota.label}</p>
                        <p className="text-xl font-black mt-1">{quota.total - quota.used} <span className="text-xs font-semibold opacity-70">Left</span></p>
                        <p className="text-[11px] opacity-75 mt-0.5">{quota.used} of {quota.total} days taken</p>
                      </div>
                    ))}
                  </div>

                  {/* Leave Requests Table */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-base text-gray-900">Leave History ({selectedLeaves.length})</h3>
                        <p className="text-xs text-gray-500">Record of applied, approved, and completed leaves.</p>
                      </div>
                      <button
                        onClick={() => navigate('/leaves')}
                        className="btn-secondary text-xs text-brand-700 border-brand-200 hover:bg-brand-50"
                      >
                        Open Leave Management →
                      </button>
                    </div>

                    {selectedLeaves.length > 0 ? (
                      <div className="card overflow-hidden bg-white border border-gray-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="py-2.5 px-3 font-semibold text-gray-700">Leave No</th>
                              <th className="py-2.5 px-3 font-semibold text-gray-700">Type</th>
                              <th className="py-2.5 px-3 font-semibold text-gray-700">Dates</th>
                              <th className="py-2.5 px-3 font-semibold text-gray-700 text-center">Days</th>
                              <th className="py-2.5 px-3 font-semibold text-gray-700">Reason</th>
                              <th className="py-2.5 px-3 font-semibold text-gray-700">Status</th>
                              <th className="py-2.5 px-3 font-semibold text-gray-700">Reviewed By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedLeaves.map(l => (
                              <tr key={l.id} className="hover:bg-blue-50/40">
                                <td className="py-2.5 px-3 font-mono font-bold text-brand-700">{l.leaveNumber || l.id}</td>
                                <td className="py-2.5 px-3 font-bold text-gray-800">{l.leaveType}</td>
                                <td className="py-2.5 px-3 text-gray-600">{l.startDate} to {l.endDate}</td>
                                <td className="py-2.5 px-3 text-center font-bold text-gray-900">{l.totalDays || 1}</td>
                                <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">{l.reason}</td>
                                <td className="py-2.5 px-3"><StatusBadge status={l.status} /></td>
                                <td className="py-2.5 px-3 text-gray-500">{l.reviewedBy || 'Admin'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="card p-12 text-center bg-white border border-gray-200">
                        <CalendarCheck size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm font-bold text-gray-700">No leave records on file</p>
                        <p className="text-xs text-gray-400 mt-1">This employee has 100% attendance with zero leave requests recorded.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ───────────────── TAB 4: OPERATIONS & SHOP FLOOR ───────────────── */}
              {detailTab === 'operations' && (
                <div className="space-y-6">
                  {/* Fabrication Orders */}
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2 mb-2">
                      <Factory size={15} className="text-orange-600" /> Fabrication Orders Assigned ({selectedFabs.length})
                    </h4>
                    {selectedFabs.length > 0 ? (
                      <div className="card overflow-hidden bg-white border border-gray-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="py-2 px-3">Order No</th>
                              <th className="py-2 px-3">Job ID</th>
                              <th className="py-2 px-3">Component</th>
                              <th className="py-2 px-3">Work Center</th>
                              <th className="py-2 px-3">Target Date</th>
                              <th className="py-2 px-3">Progress</th>
                              <th className="py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedFabs.map(f => (
                              <tr key={f.id} className="hover:bg-gray-50">
                                <td className="py-2 px-3 font-mono font-bold text-brand-700">{f.fabOrderNumber}</td>
                                <td className="py-2 px-3 font-semibold">{f.jobId}</td>
                                <td className="py-2 px-3">{f.component}</td>
                                <td className="py-2 px-3">{f.workCenter}</td>
                                <td className="py-2 px-3">{f.expectedCompletion}</td>
                                <td className="py-2 px-3 font-bold text-emerald-700">{f.completionPercent}%</td>
                                <td className="py-2 px-3"><StatusBadge status={f.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic bg-white p-3 rounded-lg border border-gray-100">No active fabrication orders.</p>
                    )}
                  </div>

                  {/* Assembly Orders */}
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2 mb-2">
                      <Factory size={15} className="text-indigo-600" /> Assembly Orders Assigned ({selectedAssemblies.length})
                    </h4>
                    {selectedAssemblies.length > 0 ? (
                      <div className="card overflow-hidden bg-white border border-gray-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="py-2 px-3">Assembly No</th>
                              <th className="py-2 px-3">Job ID</th>
                              <th className="py-2 px-3">Workstation</th>
                              <th className="py-2 px-3">Progress</th>
                              <th className="py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedAssemblies.map(a => (
                              <tr key={a.id} className="hover:bg-gray-50">
                                <td className="py-2 px-3 font-mono font-bold text-brand-700">{a.assemblyOrderNumber}</td>
                                <td className="py-2 px-3 font-semibold">{a.jobId}</td>
                                <td className="py-2 px-3">{a.workstation}</td>
                                <td className="py-2 px-3 font-bold text-emerald-700">{a.progressPercent}%</td>
                                <td className="py-2 px-3"><StatusBadge status={a.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic bg-white p-3 rounded-lg border border-gray-100">No active assembly orders.</p>
                    )}
                  </div>

                  {/* QC Inspections */}
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2 mb-2">
                      <Shield size={15} className="text-teal-600" /> Quality Inspections Handled ({selectedQCs.length})
                    </h4>
                    {selectedQCs.length > 0 ? (
                      <div className="card overflow-hidden bg-white border border-gray-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="py-2 px-3">QC Number</th>
                              <th className="py-2 px-3">Job ID</th>
                              <th className="py-2 px-3">Inspection Type</th>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Overall Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedQCs.map(q => (
                              <tr key={q.id} className="hover:bg-gray-50">
                                <td className="py-2 px-3 font-mono font-bold text-brand-700">{q.qcNumber}</td>
                                <td className="py-2 px-3 font-semibold">{q.jobId}</td>
                                <td className="py-2 px-3">{q.inspectionType}</td>
                                <td className="py-2 px-3">{q.inspectionDate}</td>
                                <td className="py-2 px-3"><StatusBadge status={q.overallResult} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic bg-white p-3 rounded-lg border border-gray-100">No quality inspections conducted.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ───────────────── TAB 5: ROLE & PERMISSIONS ───────────────── */}
              {detailTab === 'role' && (
                <div className="space-y-6">
                  <div className="p-5 bg-white border border-brand-200 rounded-2xl space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck size={20} className="text-brand-600" />
                        <div>
                          <h4 className="font-bold text-base text-gray-900">Manage System Role & Permissions</h4>
                          <p className="text-xs text-gray-500">Configure administrative access levels and workflow permissions for {selected.name}.</p>
                        </div>
                      </div>
                      {roleSavedSuccess && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                          <Check size={14} /> Permissions Updated!
                        </span>
                      )}
                    </div>

                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1.5 block">Select System Role:</label>
                        <select
                          className="select bg-gray-50 font-medium text-xs w-full"
                          value={assignedRole}
                          onChange={e => setAssignedRole(e.target.value as UserRole)}
                        >
                          {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => (
                            <option key={key} value={key}>
                              {def.label} — {def.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Live Role Preview Card */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2">
                        <div className="flex items-center justify-between font-bold text-gray-900">
                          <span className="text-sm">Active Role: {ROLE_DEFINITIONS[assignedRole]?.label}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border ${ROLE_DEFINITIONS[assignedRole]?.badgeColor}`}>
                            {assignedRole}
                          </span>
                        </div>
                        <p className="text-gray-600">{ROLE_DEFINITIONS[assignedRole]?.description}</p>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Accessible ERP Modules:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {ROLE_DEFINITIONS[assignedRole]?.allowedModules.map(mod => (
                              <span key={mod} className="text-xs bg-white text-navy-900 font-bold px-2.5 py-1 rounded-md border border-gray-200 shadow-xs">
                                ✓ {mod}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleSaveRole}
                          className="btn-primary text-xs py-2 px-5 font-bold shadow-sm cursor-pointer"
                        >
                          <Check size={14} /> Save Role Assignment
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchToEmployee(selected)}
                          className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 text-navy-900 border-navy-300 hover:bg-navy-50 cursor-pointer font-semibold"
                        >
                          <LogIn size={13} /> Act As {selected.name}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ───────────────── TAB 6: ACTIVITY LOGS ───────────────── */}
              {detailTab === 'activity' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-gray-900">Audit Trail & Action Log ({selectedLogs.length})</h3>
                      <p className="text-xs text-gray-500">History of actions executed by {selected.name} across the ERP.</p>
                    </div>
                  </div>

                  {selectedLogs.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedLogs.map(log => (
                        <div key={log.id} className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <Activity size={15} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{log.action}: {log.description}</p>
                              <p className="text-[11px] text-gray-500 font-mono">Entity: {log.entityType} ({log.entityId})</p>
                            </div>
                          </div>
                          <span className="text-[11px] text-gray-400 whitespace-nowrap">{log.performedAt}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="card p-12 text-center bg-white border border-gray-200">
                      <Activity size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-bold text-gray-700">No recent activity logs</p>
                      <p className="text-xs text-gray-400 mt-1">Actions performed by this user will be tracked here in real-time.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 shrink-0">
              <p>Khodiyar Engineering ERP • Workforce Management & Role-Based Access Control</p>
              <button
                onClick={() => setSelected(null)}
                className="btn-secondary text-xs px-4 py-1.5 cursor-pointer font-bold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD EMPLOYEE MODAL WITH ROLE SELECTION ── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Employee"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary text-xs cursor-pointer" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary text-xs font-bold cursor-pointer" onClick={handleSaveEmployee}>Save Employee</button>
          </div>
        }
      >
        <form onSubmit={handleSaveEmployee} className="grid grid-cols-2 gap-4 text-xs">
          <FormField label="Full Name" required>
            <input className="input text-xs" placeholder="Employee full name" value={name} onChange={e => setName(e.target.value)} required />
          </FormField>
          <FormField label="Department" required>
            <select className="select text-xs" value={department} onChange={e => setDepartment(e.target.value as Department)}>
              {Object.keys(deptColors).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </FormField>
          <FormField label="Designation" required>
            <input className="input text-xs" placeholder="Job title / designation" value={designation} onChange={e => setDesignation(e.target.value)} required />
          </FormField>
          <FormField label="System Role / Access Level" required>
            <select className="select text-xs" value={role} onChange={e => setRole(e.target.value as UserRole)}>
              {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => (
                <option key={key} value={key}>{def.label} ({key})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Phone" required>
            <input className="input text-xs" placeholder="10 digit mobile number" value={phone} onChange={e => setPhone(e.target.value)} required />
          </FormField>
          <FormField label="Email">
            <input type="email" className="input text-xs" placeholder="work email" value={email} onChange={e => setEmail(e.target.value)} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Skills (comma separated)">
              <input className="input text-xs" placeholder="Welding, AutoCAD, CNC..." value={skills} onChange={e => setSkills(e.target.value)} />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default EmployeeList;
