import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Customer, Supplier, Employee, Product, Inquiry, Job,
  Design, BOM, Quotation, SalesOrder, PurchaseRequest,
  PurchaseOrder, InventoryItem, FabricationOrder, ProductionOrder,
  AssemblyOrder, QCInspection, DispatchOrder, Task, ActivityLog, JobCost,
  LeaveRequest, UserRole, Department, Invoice, PaymentReceipt, VendorBill
} from '../types';
import * as initialData from '../data/mockData';

export interface CurrentUserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  department: Department;
  designation?: string;
  skills?: string[];
  phone?: string;
  workCenter?: string;
  isSuperAdmin?: boolean;
}

export const SUPER_ADMIN_USER: CurrentUserSession = {
  id: 'ADMIN-01',
  name: 'Dilip Panchal',
  email: 'dilip.panchal@khodiyarengineering.in',
  role: 'super_admin',
  department: 'Administration',
  designation: 'Managing Director & Super Admin',
  phone: '9824012345',
  isSuperAdmin: true,
};

interface ERPContextType {
  // Data
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  products: Product[];
  inquiries: Inquiry[];
  jobs: Job[];
  designs: Design[];
  boms: BOM[];
  quotations: Quotation[];
  salesOrders: SalesOrder[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  inventory: InventoryItem[];
  fabricationOrders: FabricationOrder[];
  productionOrders: ProductionOrder[];
  assemblyOrders: AssemblyOrder[];
  qcInspections: QCInspection[];
  dispatchOrders: DispatchOrder[];
  tasks: Task[];
  jobCosts: JobCost[];
  activityLogs: ActivityLog[];
  leaveRequests: LeaveRequest[];
  invoices: Invoice[];
  paymentReceipts: PaymentReceipt[];
  vendorBills: VendorBill[];

  // Current Logged-in User / Role
  currentUser: CurrentUserSession;
  currentRole: UserRole;
  setCurrentUser: (user: CurrentUserSession) => void;
  switchUser: (userIdOrAdmin: string) => void;
  updateEmployeeRole: (employeeId: string, role: UserRole) => void;

  // Mutators
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  
  addInquiry: (inquiry: Inquiry) => void;
  updateInquiry: (id: string, updates: Partial<Inquiry>) => void;
  
  addQuotation: (quotation: Quotation) => void;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  
  addSalesOrder: (salesOrder: SalesOrder) => void;
  
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  
  addDesign: (design: Design) => void;
  updateDesign: (id: string, updates: Partial<Design>) => void;
  
  addBOM: (bom: BOM) => void;
  updateBOM: (id: string, updates: Partial<BOM>) => void;
  
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  
  addPurchaseRequest: (pr: PurchaseRequest) => void;
  updatePurchaseRequest: (id: string, updates: Partial<PurchaseRequest>) => void;
  
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  addInventoryItem: (item: InventoryItem) => void;
  
  addFabricationOrder: (fab: FabricationOrder) => void;
  updateFabricationOrder: (id: string, updates: Partial<FabricationOrder>) => void;
  
  addProductionOrder: (prod: ProductionOrder) => void;
  updateProductionOrder: (id: string, updates: Partial<ProductionOrder>) => void;
  
  addAssemblyOrder: (asm: AssemblyOrder) => void;
  updateAssemblyOrder: (id: string, updates: Partial<AssemblyOrder>) => void;
  
  addQCInspection: (qc: QCInspection) => void;
  updateQCInspection: (id: string, updates: Partial<QCInspection>) => void;
  
  addDispatchOrder: (dispatch: DispatchOrder) => void;
  updateDispatchOrder: (id: string, updates: Partial<DispatchOrder>) => void;
  
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  
  addLeaveRequest: (req: LeaveRequest) => void;
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void;
  approveLeaveRequest: (id: string, remarks?: string, reviewerName?: string) => void;
  rejectLeaveRequest: (id: string, remarks: string, reviewerName?: string) => void;
  cancelLeaveRequest: (id: string) => void;
  deleteLeaveRequest: (id: string) => void;

  // Accounting Mutators
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  addPaymentReceipt: (receipt: PaymentReceipt) => void;
  addVendorBill: (bill: VendorBill) => void;
  updateVendorBill: (id: string, updates: Partial<VendorBill>) => void;
  recordVendorPayment: (id: string, amount: number, paymentRef: string) => void;

  addActivityLog: (log: ActivityLog) => void;
  resetAllData: () => void;
}

const ERPContext = createContext<ERPContextType | null>(null);

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`ke_erp_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn(`Error loading ${key} from localStorage:`, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`ke_erp_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error saving ${key} to localStorage:`, e);
  }
}

export function ERPProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage('customers', initialData.customers));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadFromStorage('suppliers', initialData.suppliers));
  const [employees, setEmployees] = useState<Employee[]>(() => loadFromStorage('employees', initialData.employees));
  const [products] = useState<Product[]>(initialData.products);
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => loadFromStorage('inquiries', initialData.inquiries));
  const [jobs, setJobs] = useState<Job[]>(() => loadFromStorage('jobs', initialData.jobs));
  const [designs, setDesigns] = useState<Design[]>(() => loadFromStorage('designs', initialData.designs));
  const [boms, setBoms] = useState<BOM[]>(() => loadFromStorage('boms', initialData.boms));
  const [quotations, setQuotations] = useState<Quotation[]>(() => loadFromStorage('quotations', initialData.quotations));
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => loadFromStorage('salesOrders', initialData.salesOrders));
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => loadFromStorage('purchaseRequests', initialData.purchaseRequests));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => loadFromStorage('purchaseOrders', initialData.purchaseOrders));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadFromStorage('inventory', initialData.inventory));
  const [fabricationOrders, setFabricationOrders] = useState<FabricationOrder[]>(() => loadFromStorage('fabricationOrders', initialData.fabricationOrders));
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(() => loadFromStorage('productionOrders', initialData.productionOrders));
  const [assemblyOrders, setAssemblyOrders] = useState<AssemblyOrder[]>(() => loadFromStorage('assemblyOrders', initialData.assemblyOrders));
  const [qcInspections, setQcInspections] = useState<QCInspection[]>(() => loadFromStorage('qcInspections', initialData.qcInspections));
  const [dispatchOrders, setDispatchOrders] = useState<DispatchOrder[]>(() => loadFromStorage('dispatchOrders', initialData.dispatchOrders));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('tasks', initialData.tasks));
  const [jobCosts] = useState<JobCost[]>(initialData.jobCosts);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadFromStorage('activityLogs', initialData.activityLog));
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => loadFromStorage('leaveRequests', initialData.leaveRequests || []));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadFromStorage('invoices', initialData.invoices || []));
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>(() => loadFromStorage('paymentReceipts', initialData.paymentReceipts || []));
  const [vendorBills, setVendorBills] = useState<VendorBill[]>(() => loadFromStorage('vendorBills', initialData.vendorBills || []));

  // Current Logged-in User
  const [currentUser, setCurrentUser] = useState<CurrentUserSession>(() => {
    return loadFromStorage('currentUser', SUPER_ADMIN_USER);
  });

  const currentRole: UserRole = currentUser?.role || 'super_admin';

  // Sync to localStorage on change
  useEffect(() => { saveToStorage('customers', customers); }, [customers]);
  useEffect(() => { saveToStorage('suppliers', suppliers); }, [suppliers]);
  useEffect(() => { saveToStorage('employees', employees); }, [employees]);
  useEffect(() => { saveToStorage('inquiries', inquiries); }, [inquiries]);
  useEffect(() => { saveToStorage('jobs', jobs); }, [jobs]);
  useEffect(() => { saveToStorage('designs', designs); }, [designs]);
  useEffect(() => { saveToStorage('boms', boms); }, [boms]);
  useEffect(() => { saveToStorage('quotations', quotations); }, [quotations]);
  useEffect(() => { saveToStorage('salesOrders', salesOrders); }, [salesOrders]);
  useEffect(() => { saveToStorage('purchaseRequests', purchaseRequests); }, [purchaseRequests]);
  useEffect(() => { saveToStorage('purchaseOrders', purchaseOrders); }, [purchaseOrders]);
  useEffect(() => { saveToStorage('inventory', inventory); }, [inventory]);
  useEffect(() => { saveToStorage('fabricationOrders', fabricationOrders); }, [fabricationOrders]);
  useEffect(() => { saveToStorage('productionOrders', productionOrders); }, [productionOrders]);
  useEffect(() => { saveToStorage('assemblyOrders', assemblyOrders); }, [assemblyOrders]);
  useEffect(() => { saveToStorage('qcInspections', qcInspections); }, [qcInspections]);
  useEffect(() => { saveToStorage('dispatchOrders', dispatchOrders); }, [dispatchOrders]);
  useEffect(() => { saveToStorage('tasks', tasks); }, [tasks]);
  useEffect(() => { saveToStorage('activityLogs', activityLogs); }, [activityLogs]);
  useEffect(() => { saveToStorage('leaveRequests', leaveRequests); }, [leaveRequests]);
  useEffect(() => { saveToStorage('invoices', invoices); }, [invoices]);
  useEffect(() => { saveToStorage('paymentReceipts', paymentReceipts); }, [paymentReceipts]);
  useEffect(() => { saveToStorage('vendorBills', vendorBills); }, [vendorBills]);
  useEffect(() => { saveToStorage('currentUser', currentUser); }, [currentUser]);

  // Switch Active User / Role
  const switchUser = (userIdOrAdmin: string) => {
    if (userIdOrAdmin === 'ADMIN' || userIdOrAdmin === 'ADMIN-01') {
      setCurrentUser(SUPER_ADMIN_USER);
      return;
    }
    const emp = employees.find(e => e.id === userIdOrAdmin || e.employeeId === userIdOrAdmin);
    if (emp) {
      const userSession: CurrentUserSession = {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role || 'sales',
        employeeId: emp.employeeId,
        department: emp.department,
        designation: emp.designation,
        skills: emp.skills,
        phone: emp.phone,
        workCenter: emp.workCenter,
        isSuperAdmin: false,
      };
      setCurrentUser(userSession);
    }
  };

  // Update Employee System Role
  const updateEmployeeRole = (employeeId: string, role: UserRole) => {
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, role } : e));
    // If the updated employee is currently logged in, sync their session role too
    if (currentUser.id === employeeId) {
      setCurrentUser(prev => ({ ...prev, role }));
    }

    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      addActivityLog({
        id: `AL-${Date.now()}`,
        entityType: 'Employee',
        entityId: employeeId,
        action: 'Role Updated',
        description: `Admin updated ${emp.name}'s system role to ${role}`,
        performedBy: 'Dilip Panchal (Admin)',
        performedAt: new Date().toISOString(),
      });
    }
  };

  // Actions
  const addCustomer = (customer: Customer) => setCustomers(prev => [customer, ...prev]);
  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addInquiry = (inquiry: Inquiry) => {
    setInquiries(prev => [inquiry, ...prev]);
    addActivityLog({
      id: `AL-${Date.now()}`,
      jobId: inquiry.jobId,
      entityType: 'Inquiry',
      entityId: inquiry.id,
      action: 'Created',
      description: `Inquiry ${inquiry.inquiryNumber} received for ${inquiry.productCategory}`,
      performedBy: inquiry.salesPerson || currentUser?.name || 'Admin',
      performedAt: new Date().toISOString(),
    });
  };
  const updateInquiry = (id: string, updates: Partial<Inquiry>) => {
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const addQuotation = (quotation: Quotation) => setQuotations(prev => [quotation, ...prev]);
  const updateQuotation = (id: string, updates: Partial<Quotation>) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const addSalesOrder = (salesOrder: SalesOrder) => setSalesOrders(prev => [salesOrder, ...prev]);

  const addJob = (job: Job) => setJobs(prev => [job, ...prev]);
  const updateJob = (id: string, updates: Partial<Job>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  };

  const addDesign = (design: Design) => setDesigns(prev => [design, ...prev]);
  const updateDesign = (id: string, updates: Partial<Design>) => {
    setDesigns(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const addBOM = (bom: BOM) => setBoms(prev => [bom, ...prev]);
  const updateBOM = (id: string, updates: Partial<BOM>) => {
    setBoms(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const addSupplier = (supplier: Supplier) => setSuppliers(prev => [supplier, ...prev]);
  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addPurchaseRequest = (pr: PurchaseRequest) => setPurchaseRequests(prev => [pr, ...prev]);
  const updatePurchaseRequest = (id: string, updates: Partial<PurchaseRequest>) => {
    setPurchaseRequests(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addPurchaseOrder = (po: PurchaseOrder) => setPurchaseOrders(prev => [po, ...prev]);
  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addInventoryItem = (item: InventoryItem) => setInventory(prev => [item, ...prev]);
  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const addFabricationOrder = (fab: FabricationOrder) => setFabricationOrders(prev => [fab, ...prev]);
  const updateFabricationOrder = (id: string, updates: Partial<FabricationOrder>) => {
    setFabricationOrders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const addProductionOrder = (prod: ProductionOrder) => setProductionOrders(prev => [prod, ...prev]);
  const updateProductionOrder = (id: string, updates: Partial<ProductionOrder>) => {
    setProductionOrders(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addAssemblyOrder = (asm: AssemblyOrder) => setAssemblyOrders(prev => [asm, ...prev]);
  const updateAssemblyOrder = (id: string, updates: Partial<AssemblyOrder>) => {
    setAssemblyOrders(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const addQCInspection = (qc: QCInspection) => setQcInspections(prev => [qc, ...prev]);
  const updateQCInspection = (id: string, updates: Partial<QCInspection>) => {
    setQcInspections(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const addDispatchOrder = (dispatch: DispatchOrder) => setDispatchOrders(prev => [dispatch, ...prev]);
  const updateDispatchOrder = (id: string, updates: Partial<DispatchOrder>) => {
    setDispatchOrders(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const addTask = (task: Task) => setTasks(prev => [task, ...prev]);
  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addEmployee = (employee: Employee) => setEmployees(prev => [employee, ...prev]);
  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const addLeaveRequest = (req: LeaveRequest) => {
    setLeaveRequests(prev => [req, ...prev]);
    addActivityLog({
      id: `AL-${Date.now()}`,
      entityType: 'LeaveRequest',
      entityId: req.id,
      action: 'Created',
      description: `${req.employeeName} (${req.department}) applied for ${req.totalDays} day(s) ${req.leaveType} (${req.startDate} to ${req.endDate})`,
      performedBy: req.employeeName,
      performedAt: new Date().toISOString(),
    });
  };

  const updateLeaveRequest = (id: string, updates: Partial<LeaveRequest>) => {
    setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const approveLeaveRequest = (id: string, remarks?: string, reviewerName: string = 'Dilip Panchal (Admin)') => {
    const existing = leaveRequests.find(l => l.id === id);
    setLeaveRequests(prev => prev.map(l => l.id === id ? {
      ...l,
      status: 'Approved',
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      adminRemarks: remarks || l.adminRemarks || 'Approved',
    } : l));

    if (existing) {
      addActivityLog({
        id: `AL-${Date.now()}`,
        entityType: 'LeaveRequest',
        entityId: id,
        action: 'Approved',
        description: `Leave ${existing.leaveNumber} for ${existing.employeeName} approved by ${reviewerName}`,
        performedBy: reviewerName,
        performedAt: new Date().toISOString(),
      });
    }
  };

  const rejectLeaveRequest = (id: string, remarks: string, reviewerName: string = 'Dilip Panchal (Admin)') => {
    const existing = leaveRequests.find(l => l.id === id);
    setLeaveRequests(prev => prev.map(l => l.id === id ? {
      ...l,
      status: 'Rejected',
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      adminRemarks: remarks,
    } : l));

    if (existing) {
      addActivityLog({
        id: `AL-${Date.now()}`,
        entityType: 'LeaveRequest',
        entityId: id,
        action: 'Rejected',
        description: `Leave ${existing.leaveNumber} for ${existing.employeeName} rejected: "${remarks}"`,
        performedBy: reviewerName,
        performedAt: new Date().toISOString(),
      });
    }
  };

  const cancelLeaveRequest = (id: string) => {
    const existing = leaveRequests.find(l => l.id === id);
    setLeaveRequests(prev => prev.map(l => l.id === id ? {
      ...l,
      status: 'Cancelled',
    } : l));

    if (existing) {
      addActivityLog({
        id: `AL-${Date.now()}`,
        entityType: 'LeaveRequest',
        entityId: id,
        action: 'Cancelled',
        description: `Leave request ${existing.leaveNumber} was cancelled by ${existing.employeeName}`,
        performedBy: existing.employeeName,
        performedAt: new Date().toISOString(),
      });
    }
  };

  const deleteLeaveRequest = (id: string) => {
    setLeaveRequests(prev => prev.filter(l => l.id !== id));
  };

  // ── Accounting Mutators ──
  const addInvoice = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
    addActivityLog({
      id: `AL-${Date.now()}`,
      entityType: 'Invoice',
      entityId: invoice.id,
      action: 'Created',
      description: `Tax Invoice ${invoice.invoiceNumber} created for amount ₹${invoice.totalAmount.toLocaleString('en-IN')}`,
      performedBy: currentUser?.name || 'Super Admin',
      performedAt: new Date().toISOString(),
    });
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
  };

  const addPaymentReceipt = (receipt: PaymentReceipt) => {
    setPaymentReceipts(prev => [receipt, ...prev]);
    
    // Automatically update the matching invoice balance & status
    setInvoices(prev => prev.map(inv => {
      if (inv.id === receipt.invoiceId || inv.invoiceNumber === receipt.invoiceNumber) {
        const newPaid = (inv.paidAmount || 0) + receipt.amountReceived;
        const newBalance = Math.max(0, inv.totalAmount - newPaid);
        const newStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';
        return {
          ...inv,
          paidAmount: newPaid,
          balanceDue: newBalance,
          status: newStatus,
        };
      }
      return inv;
    }));

    addActivityLog({
      id: `AL-${Date.now()}`,
      entityType: 'PaymentReceipt',
      entityId: receipt.id,
      action: 'Recorded',
      description: `Payment Receipt ${receipt.receiptNumber} of ₹${receipt.amountReceived.toLocaleString('en-IN')} received for Invoice ${receipt.invoiceNumber}`,
      performedBy: currentUser?.name || 'Accounts Specialist',
      performedAt: new Date().toISOString(),
    });
  };

  const addVendorBill = (bill: VendorBill) => {
    setVendorBills(prev => [bill, ...prev]);
    addActivityLog({
      id: `AL-${Date.now()}`,
      entityType: 'VendorBill',
      entityId: bill.id,
      action: 'Created',
      description: `Vendor Bill ${bill.billNumber} created for amount ₹${bill.totalAmount.toLocaleString('en-IN')}`,
      performedBy: currentUser?.name || 'Accounts Specialist',
      performedAt: new Date().toISOString(),
    });
  };

  const updateVendorBill = (id: string, updates: Partial<VendorBill>) => {
    setVendorBills(prev => prev.map(vb => vb.id === id ? { ...vb, ...updates } : vb));
  };

  const recordVendorPayment = (id: string, amount: number, paymentRef: string) => {
    setVendorBills(prev => prev.map(vb => {
      if (vb.id === id) {
        const newPaid = (vb.paidAmount || 0) + amount;
        const newBalance = Math.max(0, vb.totalAmount - newPaid);
        const newStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';
        return {
          ...vb,
          paidAmount: newPaid,
          balanceDue: newBalance,
          status: newStatus,
          paymentRef,
          paidDate: new Date().toISOString().split('T')[0],
        };
      }
      return vb;
    }));

    addActivityLog({
      id: `AL-${Date.now()}`,
      entityType: 'VendorBill',
      entityId: id,
      action: 'Paid',
      description: `Payment of ₹${amount.toLocaleString('en-IN')} recorded for Vendor Bill with Ref: ${paymentRef}`,
      performedBy: currentUser?.name || 'Accounts Specialist',
      performedAt: new Date().toISOString(),
    });
  };

  const addActivityLog = (log: ActivityLog) => setActivityLogs(prev => [log, ...prev]);

  const resetAllData = () => {
    setCustomers(initialData.customers);
    setSuppliers(initialData.suppliers);
    setEmployees(initialData.employees);
    setInquiries(initialData.inquiries);
    setJobs(initialData.jobs);
    setDesigns(initialData.designs);
    setBoms(initialData.boms);
    setQuotations(initialData.quotations);
    setSalesOrders(initialData.salesOrders);
    setPurchaseRequests(initialData.purchaseRequests);
    setPurchaseOrders(initialData.purchaseOrders);
    setInventory(initialData.inventory);
    setFabricationOrders(initialData.fabricationOrders);
    setProductionOrders(initialData.productionOrders);
    setAssemblyOrders(initialData.assemblyOrders);
    setQcInspections(initialData.qcInspections);
    setDispatchOrders(initialData.dispatchOrders);
    setTasks(initialData.tasks);
    setActivityLogs(initialData.activityLog);
    setLeaveRequests(initialData.leaveRequests || []);
    setInvoices(initialData.invoices || []);
    setPaymentReceipts(initialData.paymentReceipts || []);
    setVendorBills(initialData.vendorBills || []);
    setCurrentUser(SUPER_ADMIN_USER);
    localStorage.clear();
  };

  return (
    <ERPContext.Provider
      value={{
        customers, suppliers, employees, products, inquiries, jobs, designs, boms,
        quotations, salesOrders, purchaseRequests, purchaseOrders, inventory,
        fabricationOrders, productionOrders, assemblyOrders, qcInspections, dispatchOrders,
        tasks, jobCosts, activityLogs, leaveRequests,
        invoices, paymentReceipts, vendorBills,
        currentUser, currentRole, setCurrentUser, switchUser, updateEmployeeRole,
        addCustomer, updateCustomer, addInquiry, updateInquiry, addQuotation, updateQuotation,
        addSalesOrder, addJob, updateJob, addDesign, updateDesign, addBOM, updateBOM,
        addSupplier, updateSupplier, addPurchaseRequest, updatePurchaseRequest,
        addPurchaseOrder, updatePurchaseOrder, addInventoryItem, updateInventoryItem,
        addFabricationOrder, updateFabricationOrder, addProductionOrder, updateProductionOrder,
        addAssemblyOrder, updateAssemblyOrder, addQCInspection, updateQCInspection,
        addDispatchOrder, updateDispatchOrder, addTask, updateTask, addEmployee, updateEmployee,
        addLeaveRequest, updateLeaveRequest, approveLeaveRequest, rejectLeaveRequest,
        cancelLeaveRequest, deleteLeaveRequest,
        addInvoice, updateInvoice, addPaymentReceipt, addVendorBill, updateVendorBill, recordVendorPayment,
        addActivityLog, resetAllData
      }}
    >
      {children}
    </ERPContext.Provider>
  );
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
}
