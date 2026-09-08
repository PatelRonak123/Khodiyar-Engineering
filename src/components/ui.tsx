import React from 'react';
import { CheckCircle, Clock, XCircle, Loader, ChevronRight, MinusCircle } from 'lucide-react';

// ─────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'purple' | 'blue' | 'orange';

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger:  'bg-red-50 text-red-700 ring-1 ring-red-200',
  info:    'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  gray:    'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  purple:  'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  blue:    'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  orange:  'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  gray:    'bg-gray-400',
  purple:  'bg-purple-500',
  blue:    'bg-sky-500',
  orange:  'bg-orange-500',
};

export function getStatusVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (['completed', 'approved', 'passed', 'active', 'delivered', 'converted', 'accepted', 'fully received'].some(v => s.includes(v))) return 'success';
  if (['in progress', 'in production', 'fabrication', 'assembly', 'dispatched'].some(v => s.includes(v))) return 'blue';
  if (['pending', 'planned', 'review', 'awaiting', 'submitted', 'new', 'draft'].some(v => s.includes(v))) return 'warning';
  if (['failed', 'rejected', 'blocked', 'cancelled', 'lost', 'rework'].some(v => s.includes(v))) return 'danger';
  if (['on hold', 'waiting', 'expired', 'inactive'].some(v => s.includes(v))) return 'gray';
  if (['sent', 'released', 'negotiation', 'under'].some(v => s.includes(v))) return 'purple';
  if (['qc', 'quality', 'inspection'].some(v => s.includes(v))) return 'orange';
  if (['high', 'urgent'].some(v => s.includes(v))) return 'danger';
  if (['medium'].some(v => s.includes(v))) return 'orange';
  if (['low'].some(v => s.includes(v))) return 'info';
  return 'gray';
}

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, variant, dot = true, size = 'md' }: StatusBadgeProps) {
  const v = variant ?? getStatusVariant(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'} ${variantClasses[v]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[v]}`} />}
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────
// PRIORITY BADGE
// ─────────────────────────────────────────────
export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, BadgeVariant> = {
    Urgent: 'danger', High: 'orange', Medium: 'warning', Low: 'info',
  };
  return <StatusBadge status={priority} variant={map[priority] ?? 'gray'} />;
}

// ─────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: { value: number; label: string };
  subtitle?: string;
  onClick?: () => void;
  alert?: boolean;
}

export function KPICard({ title, value, icon, iconBg = 'bg-brand-50', trend, subtitle, onClick, alert }: KPICardProps) {
  return (
    <div
      className={`kpi-card ${onClick ? 'cursor-pointer' : ''} ${alert ? 'border-red-200 bg-red-50/30' : ''}`}
      onClick={onClick}
    >
      <div className={`p-2.5 rounded-xl ${iconBg} shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        <p className={`text-2xl font-bold mt-0.5 ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DATA TABLE
// ─────────────────────────────────────────────
interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  keyExtractor?: (row: T) => string;
}

export function DataTable<T extends Record<string, unknown>>({ data, columns, onRowClick, emptyMessage = 'No records found', loading, keyExtractor }: DataTableProps<T>) {
  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader className="w-6 h-6 text-brand-600 animate-spin" />
      <span className="ml-2 text-sm text-gray-500">Loading...</span>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map(col => (
              <th key={String(col.key)} className={`table-th ${col.width ?? ''}`}>{col.header}</th>
            ))}
            {onRowClick && <th className="table-th w-8" />}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onRowClick ? 1 : 0)} className="py-16 text-center text-sm text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={keyExtractor ? keyExtractor(row) : idx}
                className={`table-row ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td key={String(col.key)} className="table-td">
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                  </td>
                ))}
                {onRowClick && (
                  <td className="table-td">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full' | string;
  footer?: React.ReactNode;
}

const modalSizeMap: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  '3xl': 'max-w-6xl',
  '4xl': 'max-w-7xl',
  full: 'max-w-full',
};

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl', size, footer }: ModalProps) {
  if (!open) return null;
  const widthClass = size ? (modalSizeMap[size] || size) : maxWidth;
  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className={`modal-box ${widthClass}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">{footer}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DRAWER
// ─────────────────────────────────────────────
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Drawer({ open, onClose, title, children, subtitle, actions }: DrawerProps) {
  if (!open) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel animate-slide-in">
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-2">
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// SEARCH BAR
// ─────────────────────────────────────────────
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        className="input pl-9 pr-8"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100">
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────
export interface ProgressBarProps {
  percent?: number;
  value?: number;
  max?: number;
  color?: string;
  label?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  percent,
  value,
  max = 100,
  color = 'bg-brand-600',
  label = false,
  showLabel,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const finalVal = value !== undefined ? value : (percent !== undefined ? percent : 0);
  const calculatedPercent = Math.min(100, Math.max(0, Math.round((finalVal / max) * 100)));
  const displayLabel = showLabel !== undefined ? showLabel : label;
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${color} ${heights[size]} rounded-full transition-all duration-300`}
          style={{ width: `${calculatedPercent}%` }}
        />
      </div>
      {displayLabel && <span className="text-xs font-semibold text-gray-600 min-w-8 text-right">{calculatedPercent}%</span>}
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, actions }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-gray-300">{icon}</div>}
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-400 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// STAT ROW
// ─────────────────────────────────────────────
interface StatRowProps {
  label: string;
  value: React.ReactNode;
  bordered?: boolean;
}

export function StatRow({ label, value, bordered = true }: StatRowProps) {
  return (
    <div className={`flex items-center justify-between py-3 ${bordered ? 'border-b border-gray-100 last:border-0' : ''}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// TIMELINE
// ─────────────────────────────────────────────
type TimelineStepStatus = 'completed' | 'active' | 'pending' | 'failed';

interface TimelineStep {
  id: string;
  label: string;
  status: TimelineStepStatus;
  date?: string;
}

interface TimelineProps {
  steps: TimelineStep[];
  onStepClick?: (step: TimelineStep) => void;
}

const stepColors: Record<TimelineStepStatus, { dot: string; line: string; label: string; icon: React.ReactNode }> = {
  completed: { dot: 'bg-emerald-500 border-emerald-500 text-white', line: 'bg-emerald-400', label: 'text-emerald-700', icon: <CheckCircle className="w-4 h-4" /> },
  active:    { dot: 'bg-brand-600 border-brand-600 text-white animate-pulse', line: 'bg-gray-200', label: 'text-brand-700 font-bold', icon: <Loader className="w-4 h-4 animate-spin" /> },
  pending:   { dot: 'bg-white border-gray-300 text-gray-400', line: 'bg-gray-200', label: 'text-gray-400', icon: <MinusCircle className="w-4 h-4" /> },
  failed:    { dot: 'bg-red-500 border-red-500 text-white', line: 'bg-red-300', label: 'text-red-600', icon: <XCircle className="w-4 h-4" /> },
};

export function HorizontalTimeline({ steps, onStepClick }: TimelineProps) {
  return (
    <div className="flex items-start overflow-x-auto pb-2">
      {steps.map((step, idx) => {
        const colors = stepColors[step.status];
        return (
          <React.Fragment key={step.id}>
            <div
              className={`flex flex-col items-center min-w-20 ${onStepClick ? 'cursor-pointer' : ''}`}
              onClick={() => onStepClick?.(step)}
            >
              <div className={`timeline-dot border-2 ${colors.dot}`}>
                {colors.icon}
              </div>
              <span className={`text-xs text-center mt-2 leading-tight ${colors.label}`}>{step.label}</span>
              {step.date && <span className="text-xs text-gray-400 mt-0.5">{step.date}</span>}
            </div>
            {idx < steps.length - 1 && (
              <div className={`timeline-line ${steps[idx + 1].status === 'pending' ? 'bg-gray-200' : steps[idx].status === 'completed' ? 'bg-emerald-300' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// ACTIVITY TIMELINE
// ─────────────────────────────────────────────
import type { ActivityLog } from '../types';

interface ActivityTimelineProps {
  activities: ActivityLog[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="space-y-4">
      {activities.map(act => (
        <div key={act.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-brand-600" />
            </div>
            <div className="w-0.5 bg-gray-100 flex-1 mt-2" />
          </div>
          <div className="pb-4 flex-1">
            <p className="text-sm font-medium text-gray-800">{act.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">{new Date(act.performedAt).toLocaleString('en-IN')}</span>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-xs text-gray-500">{act.performedBy}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-hide ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`tab-btn flex items-center gap-1.5 ${active === tab.id ? 'tab-btn-active' : ''}`}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-xs rounded-full px-1.5 py-0.5 ml-1 ${active === tab.id ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// INFO GRID
// ─────────────────────────────────────────────
interface InfoItem { label: string; value: React.ReactNode }

export function InfoGrid({ items, cols = 2 }: { items: InfoItem[]; cols?: 2 | 3 | 4 }) {
  const colClasses = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' };
  return (
    <div className={`grid ${colClasses[cols]} gap-4`}>
      {items.map((item, i) => (
        <div key={i}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{item.label}</p>
          <p className="text-sm font-medium text-gray-800 mt-0.5">{item.value ?? '—'}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// FORM FIELD
// ─────────────────────────────────────────────
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

export function FormField({ label, required, error, children, hint }: FormFieldProps) {
  return (
    <div>
      <label className={`label ${required ? "after:content-['*'] after:text-red-500 after:ml-0.5" : ''}`}>{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// CURRENCY FORMAT
// ─────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

// ─────────────────────────────────────────────
// WORKFLOW PIPELINE BANNER
// ─────────────────────────────────────────────
interface WorkflowPipelineBannerProps {
  currentStep: number;
}

export function WorkflowPipelineBanner({ currentStep }: WorkflowPipelineBannerProps) {
  const steps = [
    { num: 1, label: 'Inquiry', path: '/inquiries' },
    { num: 2, label: 'Design', path: '/designs' },
    { num: 3, label: 'BOM', path: '/bom' },
    { num: 4, label: 'Quotation', path: '/quotations' },
    { num: 5, label: 'Production (Jobs)', path: '/jobs' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mb-4">
      <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide py-1">
        {steps.map((s, idx) => {
          const isCurrent = s.num === currentStep;
          const isPassed = s.num < currentStep;
          return (
            <React.Fragment key={s.num}>
              <a
                href={s.path}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-300'
                    : isPassed
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    isCurrent
                      ? 'bg-white text-brand-700'
                      : isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isPassed ? '✓' : s.num}
                </span>
                <span>{s.label}</span>
              </a>
              {idx < steps.length - 1 && (
                <span className={`text-xs font-bold shrink-0 ${isPassed ? 'text-emerald-500' : 'text-gray-300'}`}>
                  →
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
