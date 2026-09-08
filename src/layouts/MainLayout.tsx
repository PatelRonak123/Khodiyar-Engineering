import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingCart,
  Package,
  Hammer,
  CheckSquare,
  Truck,
  UserCog,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Factory,
  Layers,
  ClipboardList,
  Wrench,
  Building2,
  List,
  ReceiptText,
  Menu,
  X,
  Bell,
  CalendarCheck,
  UserCheck,
  Check,
  DollarSign,
} from "lucide-react";
import { useERP } from "../context/ERPContext";
import { ROLE_DEFINITIONS } from "../types";

const LOGO_URL = "https://cpimg.tistatic.com//131928/6/template_photo_1.png";

interface NavItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: <LayoutDashboard size={16} /> },
  { label: "Inquiries", path: "/inquiries", icon: <FileText size={16} /> },
  { label: "Designs", path: "/designs", icon: <Layers size={16} /> },
  { label: "BOM", path: "/bom", icon: <List size={16} /> },
  { label: "Quotations", path: "/quotations", icon: <ReceiptText size={16} /> },

  { label: "Job 360° View", path: "/jobs", icon: <ClipboardList size={14} /> },
  { label: "Fabrication", path: "/fabrication", icon: <Hammer size={14} /> },
  {
    label: "Production Orders",
    path: "/production",
    icon: <Factory size={14} />,
  },
  { label: "Assembly", path: "/assembly", icon: <Wrench size={14} /> },
  { label: "Quality Control", path: "/qc", icon: <CheckSquare size={14} /> },
  { label: "Dispatch", path: "/dispatch", icon: <Truck size={14} /> },

  {
    label: "Inventory & Stock",
    path: "/inventory",
    icon: <Package size={14} />,
  },
  { label: "Suppliers", path: "/suppliers", icon: <Building2 size={14} /> },
  {
    label: "Purchase Requests",
    path: "/purchase-requests",
    icon: <ClipboardList size={14} />,
  },

  {
    label: "Accounting & Finance",
    path: "/accounting",
    icon: <DollarSign size={16} />,
  },

  {
    label: "Employee Directory",
    path: "/employees",
    icon: <Users size={14} />,
  },
  { label: "Tasks & Kanban", path: "/tasks", icon: <CheckSquare size={14} /> },
  {
    label: "Leave Management",
    path: "/leaves",
    icon: <CalendarCheck size={14} />,
  },

  {
    label: "Reports & Analytics",
    path: "/reports",
    icon: <BarChart3 size={16} />,
  },
  { label: "Settings", path: "/settings", icon: <Settings size={16} /> },
];

function NavGroup({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation();
  const isChildActive = item.children?.some(
    (c) => c.path && location.pathname.startsWith(c.path),
  );
  const [open, setOpen] = useState(isChildActive ?? false);

  if (!item.children) {
    return (
      <NavLink
        to={item.path!}
        className={({ isActive }) =>
          `sidebar-item ${isActive ? "sidebar-item-active" : ""}`
        }
        end={item.path === "/"}
      >
        {item.icon}
        {!collapsed && <span className="flex-1">{item.label}</span>}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        className={`sidebar-item w-full ${isChildActive && !open ? "text-brand-300" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        {item.icon}
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </>
        )}
      </button>
      {open && !collapsed && (
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path!}
              className={({ isActive }) =>
                `sidebar-item text-xs py-2 ${isActive ? "sidebar-item-active" : ""}`
              }
            >
              {child.icon}
              <span>{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onOpenUserSwitch: () => void;
}

function Sidebar({ collapsed, onToggle, onOpenUserSwitch }: SidebarProps) {
  const { currentUser, currentRole } = useERP();
  const roleInfo =
    ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.super_admin;

  // Filter modules dynamically based on selected role
  const visibleNavItems = React.useMemo(() => {
    if (currentRole === "super_admin") return navItems;
    const paths = roleInfo.allowedPaths || [];
    return navItems
      .map((item) => {
        if (item.path) {
          return paths.includes(item.path) ? item : null;
        }
        if (item.children) {
          const filteredChildren = item.children.filter(
            (c) => c.path && paths.includes(c.path),
          );
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
          return null;
        }
        return null;
      })
      .filter(Boolean) as NavItem[];
  }, [currentRole, roleInfo]);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-navy-900 flex flex-col transition-all duration-300 z-40 shadow-2xl ${collapsed ? "w-16" : "w-60"}`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-3.5 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-center bg-white rounded-lg px-2 py-1 flex-1 overflow-hidden h-10 shadow-sm">
          <img
            src={LOGO_URL}
            alt="Khodiyar Engineering"
            className="h-full w-auto object-contain max-w-full"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              el.parentElement!.innerHTML =
                '<span class="text-brand-600 font-bold text-sm tracking-wide">KHODIYAR</span>';
            }}
          />
        </div>
        <button
          onClick={onToggle}
          className="ml-2 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0"
          title="Toggle Sidebar"
        >
          <Menu size={16} />
        </button>
      </div>

      {/* Role Indicator Banner when in employee mode */}
      {!collapsed && currentRole !== "super_admin" && (
        <div className="px-3 pt-2.5 pb-1">
          <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-300 block">
              Active Role Workspace
            </span>
            <span className="text-xs font-extrabold text-white">
              {roleInfo.label}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {visibleNavItems.map((item) => (
          <NavGroup key={item.label} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer Profile / Switcher */}
      <div className="border-t border-white/10 px-3 py-3 shrink-0 bg-black/20">
        <div
          onClick={onOpenUserSwitch}
          className={`flex items-center gap-2.5 cursor-pointer hover:bg-white/10 p-1.5 rounded-xl transition-all ${collapsed ? "justify-center" : ""}`}
          title="Click to Switch Logged-in User & Role"
        >
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-md">
            {currentUser.name.charAt(0)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-bold truncate">
                {currentUser.name}
              </p>
              <p className="text-brand-300 text-[11px] truncate flex items-center gap-1 font-medium">
                {roleInfo.label}
              </p>
            </div>
          )}
          {!collapsed && (
            <span className="text-gray-400 hover:text-white text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
              Switch
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// TOP BAR
// ─────────────────────────────────────────────
interface TopBarProps {
  sidebarWidth: number;
  onOpenUserSwitch: () => void;
}

function TopBar({ sidebarWidth, onOpenUserSwitch }: TopBarProps) {
  const location = useLocation();
  const { currentUser, currentRole } = useERP();
  const [notifOpen, setNotifOpen] = useState(false);

  const roleInfo =
    ROLE_DEFINITIONS[currentRole] || ROLE_DEFINITIONS.super_admin;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/")
      return currentRole === "super_admin"
        ? "Manufacturing Dashboard"
        : "Employee Dashboard";
    const segments = path.split("/").filter(Boolean);
    return segments[segments.length - 1]
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <header
      className="fixed top-0 right-0 h-14 bg-white border-b border-gray-200 z-30 flex items-center px-6 gap-4 shadow-sm"
      style={{ left: sidebarWidth }}
    >
      <div className="flex-1">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          {getPageTitle()}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleInfo.badgeColor}`}
          >
            {roleInfo.label}
          </span>
        </h2>
        <p className="text-[11px] text-gray-400 font-medium">
          KHODIYAR ENGINEERING ERP · {currentUser.department} Department
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* User Role Switcher Button */}
        <button
          onClick={onOpenUserSwitch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-brand-300 bg-gray-50 hover:bg-brand-50/50 transition-all text-xs font-semibold text-gray-700 shadow-sm"
          title="Switch active user or preview other roles"
        >
          <UserCheck size={14} className="text-brand-600" />
          <span className="hidden sm:inline">
            Role: <strong>{roleInfo.label}</strong>
          </span>
          <ChevronDown size={12} className="text-gray-400" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 relative"
            onClick={() => setNotifOpen((o) => !o)}
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in z-50">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Notifications
              </p>
              {[
                { text: "QC completed for JOB-2026-003", time: "10 mins ago" },
                {
                  text: "Low stock alert: SS304 Sheet 4mm",
                  time: "1 hour ago",
                },
                {
                  text: "Leave request approved for Priya Nair",
                  time: "2 hours ago",
                },
                {
                  text: "New inquiry from Metro Packaging",
                  time: "3 hours ago",
                },
              ].map((n, i) => (
                <div
                  key={i}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                >
                  <p className="text-xs font-medium text-gray-800">{n.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Profile Avatar Pill */}
        <div
          onClick={onOpenUserSwitch}
          className="flex items-center gap-2 pl-1 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs group-hover:ring-2 group-hover:ring-brand-500 transition-all shadow-sm">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-gray-800 leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-gray-400">
              {currentUser.employeeId || "Super Admin"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────
// USER & ROLE SWITCHER MODAL
// ─────────────────────────────────────────────
interface UserSwitcherModalProps {
  open: boolean;
  onClose: () => void;
}

function UserSwitcherModal({ open, onClose }: UserSwitcherModalProps) {
  const { currentUser, switchUser, employees } = useERP();

  if (!open) return null;

  const handleSelect = (idOrAdmin: string) => {
    switchUser(idOrAdmin);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-linear-to-r from-navy-900 to-navy-800 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <UserCheck size={18} className="text-brand-400" /> Switch
              Logged-in User & Role
            </h3>
            <p className="text-xs text-gray-300 mt-0.5">
              Test the exact dashboard & module access for any staff member
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          {/* Super Admin Option */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Management / Administration
            </p>
            <div
              onClick={() => handleSelect("ADMIN")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                currentUser.id === "ADMIN-01"
                  ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  DP
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-gray-900">
                      Dilip Panchal
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-200">
                      Super Admin
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Managing Director · Full ERP Control
                  </p>
                </div>
              </div>
              {currentUser.id === "ADMIN-01" && (
                <Check size={16} className="text-brand-600" />
              )}
            </div>
          </div>

          {/* Department Employees */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Department Employees
            </p>
            <div className="space-y-2">
              {employees.map((emp) => {
                const roleDef =
                  ROLE_DEFINITIONS[emp.role || "sales"] ||
                  ROLE_DEFINITIONS.sales;
                const isSelected = currentUser.id === emp.id;
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleSelect(emp.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-navy-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-gray-900">
                            {emp.name}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleDef.badgeColor}`}
                          >
                            {roleDef.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {emp.designation} · {emp.department}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-brand-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="btn-secondary text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN LAYOUT
// ─────────────────────────────────────────────
interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [userSwitchOpen, setUserSwitchOpen] = useState(false);
  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        onOpenUserSwitch={() => setUserSwitchOpen(true)}
      />
      <TopBar
        sidebarWidth={sidebarWidth}
        onOpenUserSwitch={() => setUserSwitchOpen(true)}
      />
      <UserSwitcherModal
        open={userSwitchOpen}
        onClose={() => setUserSwitchOpen(false)}
      />
      <main
        className="pt-14 min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

export default MainLayout;
