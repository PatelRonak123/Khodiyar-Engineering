import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, Factory, Package, Users, Download, Printer, Eye,
  FileSpreadsheet, DollarSign, ShoppingCart, ShieldCheck, Truck,
  CheckCircle2, Calendar, Search, X, Sparkles, Layers, ArrowDownToLine, RefreshCw, FileText
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { exportToCSV, formatCurrencyINR } from '../utils/exportUtils';

// Static Chart Data
const monthlyRevenue = [
  { month: 'Mar', revenue: 8.2, orders: 3 },
  { month: 'Apr', revenue: 12.5, orders: 5 },
  { month: 'May', revenue: 9.8, orders: 4 },
  { month: 'Jun', revenue: 15.3, orders: 6 },
  { month: 'Jul', revenue: 14.1, orders: 5 },
  { month: 'Aug', revenue: 18.5, orders: 7 },
];

const productMix = [
  { name: 'Belt Conveyor', value: 28, color: '#e50001' },
  { name: 'Bucket Elevator', value: 22, color: '#222335' },
  { name: 'Screw Conveyor', value: 20, color: '#3b82f6' },
  { name: 'SS Mixing Tank', value: 15, color: '#10b981' },
  { name: 'Ribbon Blender', value: 10, color: '#f59e0b' },
  { name: 'Others', value: 5, color: '#6b7280' },
];

const jobEfficiency = [
  { stage: 'Design', onTime: 90, delayed: 10 },
  { stage: 'BOM', onTime: 95, delayed: 5 },
  { stage: 'Fabrication', onTime: 75, delayed: 25 },
  { stage: 'Assembly', onTime: 80, delayed: 20 },
  { stage: 'QC', onTime: 92, delayed: 8 },
  { stage: 'Dispatch', onTime: 88, delayed: 12 },
];

const topCustomers = [
  { name: 'Sunrise Chemicals', value: 6.58, orders: 1 },
  { name: 'Shree Industries', value: 3.80, orders: 1 },
  { name: 'Patel Engineering', value: 4.96, orders: 1 },
  { name: 'ABC Food Processing', value: 2.11, orders: 1 },
  { name: 'Gujarat Agro', value: 3.34, orders: 1 },
];

type ReportCategory = 'all' | 'sales' | 'purchase' | 'production' | 'qc' | 'inventory' | 'finance' | 'workforce' | 'dispatch';

interface ReportDefinition {
  id: string;
  category: ReportCategory;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  badge: string;
  getSummary: () => { count: number; countLabel: string; value?: string; valueLabel?: string };
  getHeaders: () => string[];
  getRows: () => (string | number)[][];
}

export function Reports() {
  const erp = useERP();
  const {
    currentUser, customers, suppliers, employees, products, inquiries,
    quotations, salesOrders, jobs, fabricationOrders, assemblyOrders,
    productionOrders, qcInspections, inventory, purchaseOrders,
    purchaseRequests, invoices, paymentReceipts, vendorBills,
    dispatchOrders, tasks, leaveRequests
  } = erp;

  const [activeTab, setActiveTab] = useState<'overview' | 'downloads'>('downloads');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'fy2627' | 'month' | 'q1' | 'q2'>('all');
  const [previewReport, setPreviewReport] = useState<ReportDefinition | null>(null);
  const [printModalReport, setPrintModalReport] = useState<ReportDefinition | null>(null);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  // Helper to show temporary notification
  const triggerSuccessNotification = (msg: string) => {
    setDownloadSuccessMsg(msg);
    setTimeout(() => {
      setDownloadSuccessMsg(null);
    }, 4000);
  };

  // ─────────────────────────────────────────────────────────────
  // REPORT DEFINITIONS WITH LIVE CONTEXT DATA
  // ─────────────────────────────────────────────────────────────
  const reportDefinitions: ReportDefinition[] = useMemo(() => [
    {
      id: 'sales_orders',
      category: 'sales',
      title: 'Sales & Inquiries Report',
      description: 'Comprehensive log of customer inquiries, quotations submitted, won deals, and confirmed sales orders.',
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      iconBg: 'bg-blue-50 border-blue-100',
      badge: 'Sales & CRM',
      getSummary: () => {
        const totalSalesVal = salesOrders.reduce((sum, so) => sum + (so.totalAmount || 0), 0);
        return {
          count: salesOrders.length + inquiries.length + quotations.length,
          countLabel: 'Total Records',
          value: formatCurrencyINR(totalSalesVal),
          valueLabel: 'Total Confirmed Orders'
        };
      },
      getHeaders: () => [
        'Record Type', 'Ref Number', 'Date', 'Customer Name', 'Product', 'Quantity', 'Total Amount / Value', 'Status', 'Sales Person / Rep', 'Delivery Due Date'
      ],
      getRows: () => {
        const rows: (string | number)[][] = [];
        
        salesOrders.forEach(so => {
          const cust = customers.find(c => c.id === so.customerId);
          const prod = products.find(p => p.id === so.productId);
          rows.push([
            'Sales Order',
            so.poNumber || so.id,
            so.poDate || so.createdAt || '2026-08-15',
            cust ? cust.companyName : (so.customerId || 'Customer'),
            prod ? prod.name : 'Industrial Equipment',
            so.quantity || 1,
            formatCurrencyINR(so.totalAmount),
            so.status,
            cust?.assignedSalesPerson || 'Amit Shah',
            so.deliveryDate || '2026-09-30'
          ]);
        });

        quotations.forEach(q => {
          const cust = customers.find(c => c.id === q.customerId);
          const prod = products.find(p => p.id === q.productId);
          rows.push([
            'Quotation',
            q.quotationNumber,
            q.createdAt || '2026-08-10',
            cust ? cust.companyName : (q.customerId || 'Customer'),
            prod ? prod.name : 'Heavy Machinery',
            1,
            formatCurrencyINR(q.totalAmount),
            q.status,
            cust?.assignedSalesPerson || 'Sales Dept',
            '-'
          ]);
        });

        inquiries.forEach(inq => {
          const cust = customers.find(c => c.id === inq.customerId);
          rows.push([
            'Inquiry',
            inq.inquiryNumber,
            inq.inquiryDate || inq.createdAt || '2026-08-01',
            cust ? cust.companyName : inq.contactPerson,
            inq.productCategory || 'Equipment',
            inq.quantity || 1,
            'TBD',
            inq.status,
            inq.salesPerson || 'Amit Shah',
            inq.expectedOrderDate || '-'
          ]);
        });

        return rows;
      }
    },
    {
      id: 'purchase_procurement',
      category: 'purchase',
      title: 'Purchase & Procurement Report',
      description: 'Vendor purchase orders, requisitions, material rates, delivery schedules, and fulfillment statuses.',
      icon: <ShoppingCart className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-100',
      badge: 'Procurement',
      getSummary: () => {
        const totalPOVal = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
        return {
          count: purchaseOrders.length + purchaseRequests.length,
          countLabel: 'Total PO & PRs',
          value: formatCurrencyINR(totalPOVal),
          valueLabel: 'Total Purchase Spend'
        };
      },
      getHeaders: () => [
        'Document Type', 'Ref Number', 'Date', 'Supplier / Vendor', 'Items / Specs', 'Total Amount', 'Payment Terms', 'Status', 'Expected Delivery', 'Department / Creator'
      ],
      getRows: () => {
        const rows: (string | number)[][] = [];

        purchaseOrders.forEach(po => {
          const sup = suppliers.find(s => s.id === po.supplierId);
          rows.push([
            'Purchase Order',
            po.poNumber,
            po.poDate || po.createdAt || '2026-08-12',
            sup ? sup.companyName : 'Supplier',
            po.items?.map(it => `${it.itemName} (${it.quantity} ${it.unit})`).join('; ') || 'Raw Materials',
            formatCurrencyINR(po.totalAmount),
            po.paymentTerms || '30 Days',
            po.status,
            po.deliveryDate || '2026-09-10',
            'Purchase Dept'
          ]);
        });

        purchaseRequests.forEach(pr => {
          const totalEstimated = pr.items?.reduce((sum, it) => sum + ((it.quantity || 0) * (it.estimatedRate || 0)), 0) || 0;
          rows.push([
            'Purchase Request',
            pr.prNumber,
            pr.createdAt || '2026-08-05',
            'Requisition',
            pr.items?.map(it => `${it.itemName} (${it.quantity} ${it.unit})`).join('; ') || 'Material Request',
            formatCurrencyINR(totalEstimated),
            '-',
            pr.status,
            pr.items?.[0]?.requiredDate || '2026-08-25',
            `${pr.requestedBy} (${pr.department})`
          ]);
        });

        return rows;
      }
    },
    {
      id: 'production_shopfloor',
      category: 'production',
      title: 'Production & Shop Floor Report',
      description: 'Active fabrication orders, sub-assemblies, machine allocation, job milestones, and progress metrics.',
      icon: <Factory className="w-5 h-5 text-purple-600" />,
      iconBg: 'bg-purple-50 border-purple-100',
      badge: 'Manufacturing',
      getSummary: () => {
        const activeJobsCount = jobs.filter(j => j.status === 'Active').length;
        const totalFabOrders = fabricationOrders.length + assemblyOrders.length + productionOrders.length;
        return {
          count: totalFabOrders,
          countLabel: 'Active Work Orders',
          value: `${activeJobsCount} Active Jobs`,
          valueLabel: 'On Shop Floor'
        };
      },
      getHeaders: () => [
        'Order ID', 'Job Ref', 'Order Type', 'Component / Stage', 'Work Center', 'Quantity', 'Assigned Team', 'Start Date', 'Target Date', 'Status', 'Completion %'
      ],
      getRows: () => {
        const rows: (string | number)[][] = [];

        fabricationOrders.forEach(fab => {
          const emp = employees.find(e => e.id === fab.assignedEmployeeId);
          rows.push([
            fab.fabOrderNumber || fab.id,
            fab.jobId,
            'Fabrication Order',
            fab.component,
            fab.workCenter,
            `${fab.quantity} ${fab.unit}`,
            emp ? emp.name : 'Fabrication Team',
            fab.startDate || '2026-08-01',
            fab.expectedCompletion || '2026-08-20',
            fab.status,
            `${fab.completionPercent || 0}%`
          ]);
        });

        assemblyOrders.forEach(asm => {
          rows.push([
            asm.assemblyOrderNumber || asm.id,
            asm.jobId,
            'Assembly Order',
            asm.components?.join(', ') || 'Assembly Order',
            asm.workstation || 'Main Line',
            '1 Unit',
            asm.assignedTeam?.join(', ') || 'Assembly Team',
            asm.startTime || '2026-08-10',
            asm.endTime || '2026-08-28',
            asm.status,
            `${asm.progressPercent || 0}%`
          ]);
        });

        productionOrders.forEach(prod => {
          rows.push([
            prod.productionOrderNumber || prod.id,
            prod.jobId,
            'Production Order',
            prod.currentStage,
            'Shop Floor Main',
            `${prod.quantity} Units`,
            prod.productionManager || prod.assignedTeam?.join(', ') || 'Production Team',
            prod.plannedStart || '2026-08-05',
            prod.plannedEnd || '2026-09-10',
            prod.status,
            `${prod.progressPercent || 0}%`
          ]);
        });

        return rows;
      }
    },
    {
      id: 'quality_control',
      category: 'qc',
      title: 'Quality Control (QC) & Inspection Report',
      description: 'Stage inspection logs, dimension verifications, testing parameters, defect records, and pass/fail audits.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
      badge: 'Quality Assurance',
      getSummary: () => {
        const passedCount = qcInspections.filter(q => q.overallResult === 'Passed').length;
        const passRate = qcInspections.length > 0 ? Math.round((passedCount / qcInspections.length) * 100) : 100;
        return {
          count: qcInspections.length,
          countLabel: 'Total Inspections',
          value: `${passRate}%`,
          valueLabel: 'Overall Pass Rate'
        };
      },
      getHeaders: () => [
        'Inspection No', 'Job Ref', 'Inspection Type', 'Inspector Name', 'Inspection Date', 'Parameters Tested', 'Pass/Fail Result', 'Observations & Remarks'
      ],
      getRows: () => {
        return qcInspections.map(qc => {
          const passParams = qc.parameters?.filter(p => p.result === 'Pass').length || 0;
          const totalParams = qc.parameters?.length || 0;
          return [
            qc.qcNumber || qc.id,
            qc.jobId,
            qc.inspectionType,
            qc.inspector,
            qc.inspectionDate || '2026-08-18',
            `${passParams}/${totalParams} Verified`,
            qc.overallResult,
            qc.observations || 'Dimensions and tolerances verified.'
          ];
        });
      }
    },
    {
      id: 'inventory_stock',
      category: 'inventory',
      title: 'Inventory & Stock Valuation Report',
      description: 'Stock levels of raw materials, sheet metal, motors, hardware, reorder alerts, and total store valuation.',
      icon: <Package className="w-5 h-5 text-cyan-600" />,
      iconBg: 'bg-cyan-50 border-cyan-100',
      badge: 'Store & Stock',
      getSummary: () => {
        const totalValuation = inventory.reduce((sum, item) => sum + ((item.currentStock || 0) * (item.averageCost || 0)), 0);
        const lowStockCount = inventory.filter(item => (item.currentStock || 0) <= (item.reorderLevel || 0)).length;
        return {
          count: inventory.length,
          countLabel: 'Total SKUs',
          value: formatCurrencyINR(totalValuation),
          valueLabel: lowStockCount > 0 ? `${lowStockCount} Low Stock Items` : 'Healthy Inventory'
        };
      },
      getHeaders: () => [
        'Item Code', 'Item Name', 'Category', 'Sub Category', 'Current Stock', 'Unit', 'Avg Cost (INR)', 'Total Valuation (INR)', 'Reorder Level', 'Warehouse Location', 'Stock Status'
      ],
      getRows: () => {
        return inventory.map(item => {
          const totalVal = (item.currentStock || 0) * (item.averageCost || 0);
          const isLow = (item.currentStock || 0) <= (item.reorderLevel || 0);
          return [
            item.itemCode,
            item.itemName,
            item.category,
            item.subCategory,
            item.currentStock,
            item.unit,
            formatCurrencyINR(item.averageCost),
            formatCurrencyINR(totalVal),
            item.reorderLevel,
            `${item.warehouse} ${item.rack ? `(Rack ${item.rack})` : ''}`,
            isLow ? 'Low Stock / Reorder Needed' : 'Adequate Stock'
          ];
        });
      }
    },
    {
      id: 'financial_accounting',
      category: 'finance',
      title: 'Financial, Invoices & GST Report',
      description: 'Tax invoices issued, customer receipts, vendor bills payable, GST (CGST/SGST/IGST), and cash flow summary.',
      icon: <DollarSign className="w-5 h-5 text-emerald-700" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
      badge: 'Accounts & Tax',
      getSummary: () => {
        const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        const totalReceived = paymentReceipts.reduce((sum, pr) => sum + (pr.amountReceived || 0), 0);
        return {
          count: invoices.length + vendorBills.length + paymentReceipts.length,
          countLabel: 'Transactions',
          value: formatCurrencyINR(totalInvoiced),
          valueLabel: `Collected: ${formatCurrencyINR(totalReceived)}`
        };
      },
      getHeaders: () => [
        'Document Type', 'Doc Number', 'Date', 'Party Name (Customer/Vendor)', 'Taxable Amount', 'Total GST', 'Total Amount', 'Paid / Received', 'Due Balance', 'Payment Status', 'Due Date'
      ],
      getRows: () => {
        const rows: (string | number)[][] = [];

        invoices.forEach(inv => {
          const cust = customers.find(c => c.id === inv.customerId);
          rows.push([
            'Tax Invoice',
            inv.invoiceNumber,
            inv.invoiceDate || '2026-08-14',
            cust ? cust.companyName : 'Customer',
            formatCurrencyINR(inv.subtotal),
            formatCurrencyINR(inv.totalGst),
            formatCurrencyINR(inv.totalAmount),
            formatCurrencyINR(inv.paidAmount || 0),
            formatCurrencyINR(inv.balanceDue || (inv.totalAmount - (inv.paidAmount || 0))),
            inv.status,
            inv.dueDate || '2026-09-15'
          ]);
        });

        vendorBills.forEach(vb => {
          const sup = suppliers.find(s => s.id === vb.supplierId);
          rows.push([
            'Vendor Bill',
            vb.billNumber,
            vb.billDate || '2026-08-10',
            sup ? sup.companyName : 'Vendor',
            formatCurrencyINR(vb.subtotal),
            formatCurrencyINR(vb.gstAmount),
            formatCurrencyINR(vb.totalAmount),
            formatCurrencyINR(vb.paidAmount || 0),
            formatCurrencyINR(vb.balanceDue || (vb.totalAmount - (vb.paidAmount || 0))),
            vb.status,
            vb.dueDate || '2026-09-10'
          ]);
        });

        paymentReceipts.forEach(pr => {
          const cust = customers.find(c => c.id === pr.customerId);
          rows.push([
            'Payment Receipt',
            pr.receiptNumber,
            pr.receiptDate || '2026-08-20',
            cust ? cust.companyName : 'Customer',
            '-',
            '-',
            formatCurrencyINR(pr.amountReceived),
            formatCurrencyINR(pr.amountReceived),
            '₹0',
            'Completed',
            pr.paymentMode || 'Bank Transfer'
          ]);
        });

        return rows;
      }
    },
    {
      id: 'workforce_employees',
      category: 'workforce',
      title: 'Workforce & Department Performance Report',
      description: 'Employee headcount, department distribution, assigned tasks, completion metrics, and leave summaries.',
      icon: <Users className="w-5 h-5 text-indigo-600" />,
      iconBg: 'bg-indigo-50 border-indigo-100',
      badge: 'Human Resources',
      getSummary: () => {
        const activeEmp = employees.filter(e => e.status === 'Active').length;
        const totalTasksCompleted = tasks.filter(t => t.status === 'Completed').length;
        return {
          count: employees.length,
          countLabel: 'Staff Members',
          value: `${activeEmp} Active`,
          valueLabel: `${totalTasksCompleted} Tasks Completed`
        };
      },
      getHeaders: () => [
        'Employee ID', 'Full Name', 'Department', 'Designation', 'Phone', 'Email', 'Assigned Tasks', 'Completed Tasks', 'Active Leaves', 'Employment Status'
      ],
      getRows: () => {
        return employees.map(emp => {
          const empTasks = tasks.filter(t => t.assignedEmployeeId === emp.id || t.assignedEmployeeId === emp.employeeId);
          const doneTasks = empTasks.filter(t => t.status === 'Completed').length;
          const empLeaves = leaveRequests.filter(l => l.employeeId === emp.id || l.employeeName === emp.name).length;
          return [
            emp.employeeId || emp.id,
            emp.name,
            emp.department,
            emp.designation || 'Staff',
            emp.phone || '-',
            emp.email || '-',
            empTasks.length,
            doneTasks,
            empLeaves,
            emp.status || 'Active'
          ];
        });
      }
    },
    {
      id: 'dispatch_logistics',
      category: 'dispatch',
      title: 'Dispatch & Logistics Delivery Report',
      description: 'Finished goods dispatch tracking, transporter details, vehicle numbers, LR tracking, and delivery receipts.',
      icon: <Truck className="w-5 h-5 text-teal-600" />,
      iconBg: 'bg-teal-50 border-teal-100',
      badge: 'Logistics',
      getSummary: () => {
        const deliveredCount = dispatchOrders.filter(d => d.status === 'Delivered').length;
        return {
          count: dispatchOrders.length,
          countLabel: 'Dispatch Orders',
          value: `${deliveredCount} Delivered`,
          valueLabel: 'Successful Deliveries'
        };
      },
      getHeaders: () => [
        'Dispatch Ref', 'Job Ref', 'Customer Name', 'Product', 'Quantity', 'Transporter Name', 'LR Number', 'Vehicle No', 'Dispatch Date', 'Delivery Status', 'E-Way Bill'
      ],
      getRows: () => {
        return dispatchOrders.map(d => {
          const cust = customers.find(c => c.id === d.customerId);
          const prod = products.find(p => p.id === d.productId);
          return [
            d.dispatchNumber || d.id,
            d.jobId,
            cust ? cust.companyName : 'Customer',
            prod ? prod.name : 'Industrial Machine',
            d.quantity || 1,
            d.transporter || 'V-Trans Logistics',
            d.lrNumber || 'VT-984210',
            d.vehicleNumber || 'GJ-06-AX-8910',
            d.dispatchDate || '2026-08-22',
            d.status || 'Delivered',
            d.eWayBillNumber || '241088739102'
          ];
        });
      }
    },
  ], [
    customers, suppliers, employees, products, inquiries, quotations,
    salesOrders, jobs, fabricationOrders, assemblyOrders,
    productionOrders, qcInspections, inventory, purchaseOrders,
    purchaseRequests, invoices, paymentReceipts, vendorBills,
    dispatchOrders, tasks, leaveRequests
  ]);

  // Filtered reports by category and search
  const filteredReports = useMemo(() => {
    return reportDefinitions.filter(r => {
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchSearch = searchQuery === '' ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [reportDefinitions, selectedCategory, searchQuery]);

  // Handler for single report download
  const handleDownloadReport = (rep: ReportDefinition) => {
    const today = new Date().toISOString().split('T')[0];
    const filename = `Khodiyar_${rep.id.toUpperCase()}_REPORT_${today}.csv`;
    const headers = rep.getHeaders();
    const rows = rep.getRows();
    exportToCSV(filename, headers, rows);
    triggerSuccessNotification(`Downloaded "${rep.title}" successfully!`);
  };

  // Handler for batch downloading all reports
  const handleDownloadAllReports = async () => {
    setIsBatchDownloading(true);
    triggerSuccessNotification('Starting batch export of all 8 individual reports...');

    for (let i = 0; i < reportDefinitions.length; i++) {
      const rep = reportDefinitions[i];
      const today = new Date().toISOString().split('T')[0];
      const filename = `Khodiyar_${rep.id.toUpperCase()}_REPORT_${today}.csv`;
      const headers = rep.getHeaders();
      const rows = rep.getRows();
      exportToCSV(filename, headers, rows);
      // Brief delay to prevent browser download queue throttling
      await new Promise(res => setTimeout(res, 400));
    }

    setIsBatchDownloading(false);
    triggerSuccessNotification('All 8 ERP reports downloaded successfully!');
  };

  // Handler for Master Combined Summary Export
  const handleDownloadMasterReport = () => {
    const today = new Date().toISOString().split('T')[0];
    const filename = `Khodiyar_MASTER_EXECUTIVE_SUMMARY_${today}.csv`;
    
    const headers = ['Module / Domain', 'Report Title', 'Key Metric / Count', 'Financial / Primary Valuation', 'Summary Status'];
    const rows = reportDefinitions.map(rep => {
      const summary = rep.getSummary();
      return [
        rep.badge,
        rep.title,
        `${summary.count} ${summary.countLabel}`,
        summary.value || '-',
        summary.valueLabel || 'Active'
      ];
    });

    exportToCSV(filename, headers, rows);
    triggerSuccessNotification('Downloaded Master Executive Summary CSV!');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {downloadSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-gray-700 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Export Complete</p>
            <p className="text-sm font-medium">{downloadSuccessMsg}</p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-linear-to-r from-navy-900 via-navy-800 to-navy-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold tracking-wide uppercase flex items-center gap-1.5">
                <Sparkles size={12} /> Executive Analytics & Export Hub
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                Admin Access Granted
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Reports & Business Intelligence</h1>
            <p className="text-navy-200 text-sm mt-1 max-w-2xl">
              Real-time analytics, financial audits, and multi-domain report downloads for Sales, Procurement, Shop Floor, Quality, Inventory, and Workforce.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadMasterReport}
              className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs px-4 py-2.5 flex items-center gap-2 backdrop-blur-sm transition-all"
              title="Download high-level summary of all modules in one CSV"
            >
              <FileSpreadsheet size={15} className="text-emerald-400" />
              Master Summary CSV
            </button>
            <button
              onClick={handleDownloadAllReports}
              disabled={isBatchDownloading}
              className="btn-primary bg-brand-600 hover:bg-brand-700 text-white text-xs px-5 py-2.5 flex items-center gap-2 shadow-lg shadow-brand-900/40 transition-all cursor-pointer font-bold"
            >
              {isBatchDownloading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Downloading All (8)...
                </>
              ) : (
                <>
                  <ArrowDownToLine size={16} />
                  Download All Reports (8)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'downloads'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-navy-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Download size={14} /> Report Download Center ({reportDefinitions.length})
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-navy-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers size={14} /> Visual Charts & Performance KPIs
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: DOWNLOAD REPORT CENTER (ADMIN INDIVIDUAL REPORTS)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'downloads' && (
        <div className="space-y-6">
          {/* Controls Bar: Search & Category Filter */}
          <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
              {[
                { id: 'all', label: 'All Reports' },
                { id: 'sales', label: 'Sales & Orders' },
                { id: 'purchase', label: 'Procurement' },
                { id: 'production', label: 'Manufacturing' },
                { id: 'qc', label: 'Quality Control' },
                { id: 'inventory', label: 'Inventory' },
                { id: 'finance', label: 'Financials & Tax' },
                { id: 'workforce', label: 'Workforce' },
                { id: 'dispatch', label: 'Dispatch' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as ReportCategory)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search and Period Filter */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-44 sm:w-56"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-600">
                <Calendar size={13} className="text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">All Time (YTD)</option>
                  <option value="fy2627">FY 2026-27</option>
                  <option value="month">Current Month</option>
                  <option value="q1">Q1 (Apr–Jun)</option>
                  <option value="q2">Q2 (Jul–Sep)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Individual Report Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {filteredReports.map(rep => {
              const summary = rep.getSummary();
              return (
                <div
                  key={rep.id}
                  className="card p-6 flex flex-col justify-between hover:shadow-md hover:border-gray-300 transition-all group"
                >
                  <div>
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl border ${rep.iconBg} shrink-0`}>
                          {rep.icon}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                            {rep.badge}
                          </span>
                          <h3 className="text-base font-bold text-gray-900 mt-1 group-hover:text-brand-600 transition-colors">
                            {rep.title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                      {rep.description}
                    </p>

                    {/* Summary Metric Pills */}
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 mb-5">
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{summary.countLabel}</p>
                        <p className="text-base font-bold text-gray-800 mt-0.5">{summary.count}</p>
                      </div>
                      {summary.value && (
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{summary.valueLabel || 'Metric'}</p>
                          <p className="text-base font-bold text-emerald-700 mt-0.5">{summary.value}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewReport(rep)}
                        className="btn-ghost text-xs px-2.5 py-1.5 text-gray-600 hover:text-navy-900 hover:bg-gray-100 rounded-lg flex items-center gap-1.5 cursor-pointer"
                        title="Quick Preview Data Table"
                      >
                        <Eye size={14} /> Preview
                      </button>
                      <button
                        onClick={() => setPrintModalReport(rep)}
                        className="btn-ghost text-xs px-2.5 py-1.5 text-gray-600 hover:text-navy-900 hover:bg-gray-100 rounded-lg flex items-center gap-1.5 cursor-pointer"
                        title="Print / Save Formatted PDF"
                      >
                        <Printer size={14} /> Print / PDF
                      </button>
                    </div>

                    <button
                      onClick={() => handleDownloadReport(rep)}
                      className="btn-primary text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold shadow-sm cursor-pointer"
                    >
                      <Download size={13} /> Download CSV
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredReports.length === 0 && (
            <div className="card p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <FileText size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-700">No reports matched your search</h3>
              <p className="text-xs text-gray-500 mt-1">Try resetting the category filter or changing your keyword.</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="btn-secondary text-xs mt-4"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: VISUAL OVERVIEW & CHARTS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue (YTD)', value: '₹78.3L', change: '+22% YoY', color: 'text-emerald-700', icon: <TrendingUp className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50' },
              { label: 'Active Jobs', value: jobs.filter(j => j.status === 'Active').length.toString(), change: 'On schedule', color: 'text-blue-700', icon: <Factory className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
              { label: 'Orders Delivered', value: dispatchOrders.length.toString(), change: '100% On-time dispatch', color: 'text-purple-700', icon: <Package className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50' },
              { label: 'Active Customers', value: customers.length.toString(), change: 'High retention rate', color: 'text-amber-700', icon: <Users className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50' },
            ].map(k => (
              <div key={k.label} className="card flex items-start gap-3.5 p-5">
                <div className={`p-3 rounded-xl ${k.bg} shrink-0`}>{k.icon}</div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{k.label}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{k.change}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Monthly Revenue Trend (₹ Lakh)</h3>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+18.5% Growth</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e50001" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#e50001" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`₹${v}L`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#e50001" fill="url(#revGrad2)" strokeWidth={2.5} dot={{ r: 4, fill: '#e50001' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Product Mix */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Product Mix by Revenue Share</h3>
                <span className="text-xs font-semibold text-gray-500">Conveyors & Vessels</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={productMix} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                    dataKey="value" paddingAngle={2} label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}>
                    {productMix.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Job Efficiency */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Manufacturing Stage Efficiency (%)</h3>
                <span className="text-xs font-semibold text-emerald-600">Avg 86% On-Time</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={jobEfficiency} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="stage" type="category" width={85} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="onTime" name="On Time %" fill="#10b981" stackId="a" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="delayed" name="Delayed %" fill="#ef4444" stackId="a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Customers */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Top Key Accounts by Revenue (₹L)</h3>
                <span className="text-xs font-semibold text-blue-600">Enterprise Clients</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topCustomers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`₹${v}L`, 'Revenue']} />
                  <Bar dataKey="value" name="Revenue (₹L)" fill="#222335" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders / Revenue table */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="section-title">Monthly Performance Financial Summary</h2>
              <button
                onClick={() => handleDownloadReport(reportDefinitions[0])}
                className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} /> Export Data
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-th">Month</th>
                    <th className="table-th text-right">Inquiries</th>
                    <th className="table-th text-right">Orders Received</th>
                    <th className="table-th text-right">Orders Delivered</th>
                    <th className="table-th text-right">Revenue (₹L)</th>
                    <th className="table-th text-right">Avg Job Value (₹L)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { month: 'March 2026',  inq: 3, recv: 2, del: 2, rev: 8.2, avg: 4.1 },
                    { month: 'April 2026',  inq: 5, recv: 4, del: 3, rev: 12.5, avg: 3.1 },
                    { month: 'May 2026',    inq: 4, recv: 3, del: 4, rev: 9.8, avg: 3.3 },
                    { month: 'June 2026',   inq: 6, recv: 5, del: 5, rev: 15.3, avg: 3.1 },
                    { month: 'July 2026',   inq: 5, recv: 5, del: 4, rev: 14.1, avg: 2.8 },
                    { month: 'August 2026', inq: 7, recv: 5, del: 3, rev: 18.5, avg: 3.7 },
                  ].map((row, i) => (
                    <tr key={i} className="table-row hover:bg-gray-50/50">
                      <td className="table-td font-medium">{row.month}</td>
                      <td className="table-td text-right">{row.inq}</td>
                      <td className="table-td text-right">{row.recv}</td>
                      <td className="table-td text-right">{row.del}</td>
                      <td className="table-td text-right font-bold text-emerald-700">₹{row.rev}L</td>
                      <td className="table-td text-right text-gray-600">₹{row.avg}L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: QUICK DATA PREVIEW
      ───────────────────────────────────────────────────────────── */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${previewReport.iconBg}`}>
                  {previewReport.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                      {previewReport.badge}
                    </span>
                    <span className="text-xs text-gray-500">Live Preview</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mt-0.5">{previewReport.title}</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadReport(previewReport)}
                  className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  <Download size={13} /> Export CSV
                </button>
                <button
                  onClick={() => setPreviewReport(null)}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Table Body */}
            <div className="flex-1 overflow-auto p-5">
              {(() => {
                const headers = previewReport.getHeaders();
                const rows = previewReport.getRows();
                return (
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-xs font-semibold text-gray-500 flex justify-between">
                      <span>Total Records: {rows.length} rows</span>
                      <span>Format: UTF-8 Comma-Separated Values (CSV)</span>
                    </div>
                    <div className="overflow-x-auto max-h-[50vh]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold text-gray-700 border-b border-gray-200 w-10">#</th>
                            {headers.map((h, i) => (
                              <th key={i} className="py-2.5 px-3 font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {rows.map((row, rIndex) => (
                            <tr key={rIndex} className="hover:bg-blue-50/40">
                              <td className="py-2 px-3 text-gray-400 font-mono text-[11px]">{rIndex + 1}</td>
                              {row.map((val, cIndex) => (
                                <td key={cIndex} className="py-2 px-3 text-gray-800 whitespace-nowrap">
                                  {String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <p>Khodiyar Engineering ERP • Auto-synchronized with live operational data</p>
              <button
                onClick={() => setPreviewReport(null)}
                className="btn-secondary text-xs px-4 py-1.5 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: PRINT / SAVE PDF VIEW
      ───────────────────────────────────────────────────────────── */}
      {printModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 print:border-none print:shadow-none print:max-h-none print:w-full">
            {/* Modal Toolbar (hidden on actual print) */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={16} className="text-gray-600" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Printable Official Report</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  <Printer size={13} /> Print Document
                </button>
                <button
                  onClick={() => setPrintModalReport(null)}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="flex-1 overflow-auto p-8 bg-white text-gray-900 font-sans" id="printable-report-sheet">
              {/* Document Header */}
              <div className="border-b-2 border-brand-600 pb-5 mb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black text-navy-950 tracking-tight">KHODIYAR ENGINEERING</h1>
                  <p className="text-xs text-gray-600 mt-0.5">Plot No. 124, GIDC Phase-2, Vatva, Ahmedabad - 382445, Gujarat, India</p>
                  <p className="text-xs text-gray-500">GSTIN: 24AAECK9821M1Z4 | Email: info@khodiyarengineering.in | Phone: +91 98240 12345</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded uppercase tracking-wider mb-1">
                    {printModalReport.badge}
                  </span>
                  <p className="text-xs text-gray-500">Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-xs text-gray-500">Prepared By: {currentUser.name} ({currentUser.role})</p>
                </div>
              </div>

              {/* Report Title & Metadata */}
              <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">{printModalReport.title}</h2>
                <p className="text-xs text-gray-600 mt-0.5">{printModalReport.description}</p>
                {(() => {
                  const summary = printModalReport.getSummary();
                  return (
                    <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-200 text-xs">
                      <div>
                        <span className="text-gray-500">{summary.countLabel}: </span>
                        <span className="font-bold text-gray-900">{summary.count}</span>
                      </div>
                      {summary.value && (
                        <div>
                          <span className="text-gray-500">{summary.valueLabel}: </span>
                          <span className="font-bold text-emerald-700">{summary.value}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Financial Year: </span>
                        <span className="font-bold text-gray-900">2026-2027</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Data Table */}
              {(() => {
                const headers = printModalReport.getHeaders();
                const rows = printModalReport.getRows();
                return (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                          <th className="py-2.5 px-2.5 font-bold text-gray-800 w-8 text-center">#</th>
                          {headers.map((h, i) => (
                            <th key={i} className="py-2.5 px-2.5 font-bold text-gray-800">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {rows.map((row, rIndex) => (
                          <tr key={rIndex} className={rIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className="py-2 px-2.5 text-center text-gray-400 font-mono text-[10px]">{rIndex + 1}</td>
                            {row.map((val, cIndex) => (
                              <td key={cIndex} className="py-2 px-2.5 text-gray-800">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Signatures Footer */}
              <div className="mt-12 pt-6 border-t border-gray-300 grid grid-cols-3 gap-8 text-center text-xs text-gray-600">
                <div>
                  <div className="h-10 border-b border-gray-400 mb-1" />
                  <p className="font-semibold text-gray-800">Prepared By</p>
                  <p className="text-[10px] text-gray-500">{currentUser.name}</p>
                </div>
                <div>
                  <div className="h-10 border-b border-gray-400 mb-1" />
                  <p className="font-semibold text-gray-800">Department Head</p>
                  <p className="text-[10px] text-gray-500">Verified & Approved</p>
                </div>
                <div>
                  <div className="h-10 border-b border-gray-400 mb-1" />
                  <p className="font-semibold text-gray-800">Managing Director</p>
                  <p className="text-[10px] text-gray-500">Khodiyar Engineering</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
