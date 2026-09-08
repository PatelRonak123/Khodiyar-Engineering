// ============================================================
// KHODIYAR ENGINEERING ERP — TYPE DEFINITIONS
// ============================================================

// ── Auth ────────────────────────────────────────────────────
// ── Auth ────────────────────────────────────────────────────
export type UserRole =
  | 'super_admin' | 'sales' | 'design_engineer'
  | 'purchase' | 'production_manager' | 'qc_inspector'
  | 'inventory_manager' | 'dispatch' | 'accounts';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  avatar?: string;
  department: Department;
}

// ── Common ───────────────────────────────────────────────────
export type Department =
  | 'Sales' | 'Design' | 'Engineering' | 'Purchase'
  | 'Fabrication' | 'Production' | 'Assembly'
  | 'Quality Control' | 'Inventory' | 'Dispatch'
  | 'Accounts' | 'Administration';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

// ── Employee ─────────────────────────────────────────────────
export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  photo?: string;
  department: Department;
  designation: string;
  phone: string;
  email: string;
  joiningDate: string;
  skills: string[];
  role?: UserRole;
  workCenter?: WorkCenterType;
  supervisor?: string;
  status: 'Active' | 'Inactive' | 'On Leave';
}

export interface RoleInfo {
  role: UserRole;
  label: string;
  description: string;
  allowedModules: string[];
  allowedPaths: string[];
  badgeColor: string;
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleInfo> = {
  super_admin: {
    role: 'super_admin',
    label: 'Super Admin',
    description: 'Full administrative access across all ERP modules and settings',
    allowedModules: ['Dashboard', 'Pre-Production', 'Production & Shop Floor', 'Inventory & Procurement', 'Accounting & Finance', 'Workforce', 'Reports & Analytics', 'Settings'],
    allowedPaths: [
      '/', '/inquiries', '/designs', '/bom', '/quotations', '/sales-orders',
      '/jobs', '/fabrication', '/production', '/assembly', '/qc', '/dispatch',
      '/inventory', '/suppliers', '/purchase-requests', '/purchase-orders',
      '/accounting', '/employees', '/tasks', '/leaves', '/reports', '/settings'
    ],
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
  },
  sales: {
    role: 'sales',
    label: 'Sales Specialist',
    description: 'Manage Customer Inquiries, Quotations, and Sales Orders',
    allowedModules: ['Dashboard', 'Inquiries', 'Quotations', 'Directory', 'Tasks', 'Leaves'],
    allowedPaths: ['/', '/inquiries', '/quotations', '/customers', '/employees', '/tasks', '/leaves'],
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  design_engineer: {
    role: 'design_engineer',
    label: 'Design Engineer',
    description: 'Engineering Drawings, 2D/3D CAD specifications, and BOM drafting',
    allowedModules: ['Dashboard', 'Inquiries', 'Designs', 'BOM', 'Jobs', 'Tasks', 'Leaves'],
    allowedPaths: ['/', '/inquiries', '/designs', '/bom', '/jobs', '/employees', '/tasks', '/leaves'],
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  purchase: {
    role: 'purchase',
    label: 'Purchase Manager',
    description: 'Supplier directory, Purchase Requests, and Purchase Orders',
    allowedModules: ['Dashboard', 'Inventory', 'Suppliers', 'Purchase Requests', 'Purchase Orders', 'Tasks', 'Leaves'],
    allowedPaths: ['/', '/inventory', '/suppliers', '/purchase-requests', '/purchase-orders', '/employees', '/tasks', '/leaves'],
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  production_manager: {
    role: 'production_manager',
    label: 'Production Manager',
    description: 'Shop floor orders, Fabrication, Assembly, and Job 360 view',
    allowedModules: ['Dashboard', 'Job 360', 'Fabrication', 'Production Orders', 'Assembly', 'Stock', 'Tasks', 'Leaves'],
    allowedPaths: ['/', '/jobs', '/fabrication', '/production', '/assembly', '/inventory', '/purchase-requests', '/employees', '/tasks', '/leaves'],
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  qc_inspector: {
    role: 'qc_inspector',
    label: 'QC Inspector',
    description: 'Quality Control parameter tests, inspections, and QC approvals',
    allowedModules: ['Dashboard', 'Job 360', 'Quality Control', 'Dispatch', 'Tasks', 'Leaves'],
    allowedPaths: ['/', '/jobs', '/qc', '/dispatch', '/employees', '/tasks', '/leaves'],
    badgeColor: 'bg-teal-100 text-teal-700 border-teal-200',
  },
  inventory_manager: {
    role: 'inventory_manager',
    label: 'Store & Inventory Manager',
    description: 'Raw materials stock, Reorder alerts, and Material receipts',
    allowedModules: ['Dashboard', 'Inventory & Stock', 'Suppliers', 'Purchase Requests', 'Purchase Orders', 'Tasks', 'Leaves'],
    allowedPaths: ['/', '/inventory', '/suppliers', '/purchase-requests', '/purchase-orders', '/employees', '/tasks', '/leaves'],
    badgeColor: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  },
  dispatch: {
    role: 'dispatch',
    label: 'Dispatch Coordinator',
    description: 'Dispatch orders, packing lists, transport logistics, and e-way bills',
    allowedModules: ['Dashboard', 'Job 360', 'Dispatch', 'Inventory', 'Tasks', 'Leaves'],
    allowedPaths: ['/', '/jobs', '/dispatch', '/inventory', '/employees', '/tasks', '/leaves'],
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  accounts: {
    role: 'accounts',
    label: 'Accounts Specialist',
    description: 'Tax Invoices, Customer Receipts, Vendor Bills, Job Costing, and GST reports',
    allowedModules: ['Dashboard', 'Accounting & Finance', 'Quotations', 'Reports & Analytics', 'Tasks', 'Leaves'],
    allowedPaths: ['/', '/accounting', '/quotations', '/reports', '/employees', '/tasks', '/leaves'],
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
};

// ── Customer ─────────────────────────────────────────────────
export type CustomerType = 'Regular' | 'Premium' | 'New' | 'Govt';

export interface Customer {
  id: string;
  customerCode: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  gstNumber?: string;
  billingAddress: Address;
  shippingAddress: Address;
  industry: string;
  customerType: CustomerType;
  paymentTerms: string;
  creditLimit: number;
  assignedSalesPerson: string;
  notes?: string;
  createdAt: string;
  outstandingAmount: number;
}

// ── Supplier ─────────────────────────────────────────────────
export interface Supplier {
  id: string;
  supplierCode: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  gstNumber?: string;
  address: Address;
  materialsSupplied: string[];
  paymentTerms: string;
  rating: number; // 1-5
  lastPurchaseDate?: string;
  outstandingAmount: number;
  status: 'Active' | 'Inactive' | 'Blacklisted';
}

// ── Product ──────────────────────────────────────────────────
export type ProductCategory =
  | 'Belt Conveyor' | 'Chain Conveyor' | 'Screw Conveyor'
  | 'Bucket Elevator' | 'Roller Conveyor' | 'Pouch Conveyor'
  | 'Pallet Conveyor' | 'Rotary Vacuum Dryer' | 'Ribbon Blender'
  | 'Vibro Sifter' | 'Rotary Airlock Valve' | 'SS Mixing Tank'
  | 'Industrial Pan Mixer' | 'Jacketed Vessel';

export interface ProductSpec {
  field: string;
  label: string;
  unit?: string;
  options?: string[];
  type: 'text' | 'number' | 'select';
}

export interface Product {
  id: string;
  productCode: string;
  name: string;
  category: ProductCategory;
  description: string;
  baseSpecs: ProductSpec[];
  image?: string;
  isCustomizable: boolean;
}

export interface ProductConfiguration {
  id: string;
  productId: string;
  jobId?: string;
  specs: Record<string, string | number>;
  notes?: string;
}

// ── Inquiry ──────────────────────────────────────────────────
export type InquiryStatus =
  | 'New' | 'Under Review' | 'Design Required' | 'Quotation Pending'
  | 'Quotation Sent' | 'Negotiation' | 'Won' | 'Lost' | 'Converted to Order';

export type InquirySource =
  | 'Phone' | 'Email' | 'Website' | 'Reference' | 'Exhibition' | 'Direct Visit';

export interface Inquiry {
  id: string;
  inquiryNumber: string;
  inquiryDate: string;
  customerId: string;
  contactPerson: string;
  phone: string;
  email: string;
  source: InquirySource;
  salesPerson: string;
  expectedOrderDate?: string;
  priority: Priority;
  status: InquiryStatus;
  productId: string;
  productCategory: ProductCategory;
  quantity: number;
  configuration: Record<string, string | number>;
  application?: string;
  specialRequirements?: string;
  additionalNotes?: string;
  jobId?: string;
  designId?: string;
  quotationId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Job ──────────────────────────────────────────────────────
export type JobStage =
  | 'Inquiry' | 'Design' | 'BOM' | 'Quotation'
  | 'Customer PO' | 'Fabrication' | 'Production'
  | 'Assembly' | 'QC' | 'Dispatch' | 'Closed';

export type JobStatus = 'Active' | 'On Hold' | 'Completed' | 'Cancelled';

export interface Job {
  id: string;
  jobNumber: string;
  inquiryId: string;
  customerId: string;
  productId: string;
  productName: string;
  quantity: number;
  currentStage: JobStage;
  status: JobStatus;
  priority: Priority;
  salesOrderId?: string;
  designId?: string;
  bomId?: string;
  quotationId?: string;
  productionOrderId?: string;
  fabricationOrderIds: string[];
  assemblyOrderId?: string;
  qcInspectionId?: string;
  dispatchOrderId?: string;
  configuration: Record<string, string | number>;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  assignedManager?: string;
  progressPercent: number;
  estimatedValue: number;
  actualValue?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Design ───────────────────────────────────────────────────
export type DesignStatus =
  | 'Draft' | 'Under Review' | 'Awaiting Customer Approval'
  | 'Customer Approved' | 'Rejected' | 'Revised';

export interface DesignRevision {
  revisionNumber: string; // REV-01, REV-02
  date: string;
  changedBy: string;
  changes: string;
  status: DesignStatus;
  drawingRef?: string;
}

export interface Design {
  id: string;
  designNumber: string;
  jobId: string;
  inquiryId?: string;
  productId?: string;
  currentRevision: string;
  designer: string;
  designDate: string;
  dimensions: string;
  material: string;
  technicalSpecs: string;
  status: DesignStatus;
  revisions: DesignRevision[];
  customerDrawingRef?: string;
  internalDrawingRef?: string;
  notes?: string;
  imageUrl?: string;
  cadDrawingUrl?: string;
  pdfDrawingUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

// ── BOM ──────────────────────────────────────────────────────
export type BOMStatus = 'Draft' | 'Under Review' | 'Approved' | 'Revised' | 'Obsolete';

export interface BOMItem {
  id: string;
  lineNo: number;
  itemCode: string;
  itemName: string;
  material: string;
  specification: string;
  quantity: number;
  unit: string;
  estimatedWeight?: number;
  availableStock?: number;
  requiredQuantity?: number;
  wastagePercent?: number;
  alternativeMaterial?: string;
  unitCost?: number;
  totalCost?: number;
  isAvailable?: boolean;
}

export interface BOM {
  id: string;
  bomNumber: string;
  jobId: string;
  productId: string;
  revision: string;
  quantity: number;
  preparedBy: string;
  approvedBy?: string;
  status: BOMStatus;
  items: BOMItem[];
  totalEstimatedCost: number;
  totalWeight: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Quotation ────────────────────────────────────────────────
export type QuotationStatus =
  | 'Draft' | 'Sent' | 'Under Negotiation' | 'Accepted'
  | 'Rejected' | 'Expired' | 'Revised' | 'Converted';

export interface QuotationLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  revision: string; // QT-001, QT-001-R1
  customerId: string;
  inquiryId: string;
  jobId?: string;
  productId: string;
  configuration: Record<string, string | number>;
  lineItems: QuotationLineItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  freightCharges: number;
  installationCharges: number;
  otherCharges: number;
  taxableAmount: number;
  gstPercent: number;
  gstAmount: number;
  totalAmount: number;
  paymentTerms: string;
  deliveryWeeks: number;
  warrantyMonths: number;
  validityDays: number;
  status: QuotationStatus;
  notes?: string;
  termsConditions?: string;
  createdAt: string;
  sentAt?: string;
  expiresAt?: string;
}

// ── Sales Order ──────────────────────────────────────────────
export type SalesOrderStatus =
  | 'Confirmed' | 'Production Initiated' | 'In Production'
  | 'QC Pending' | 'Ready for Dispatch' | 'Dispatched' | 'Closed';

export interface SalesOrder {
  id: string;
  poNumber: string;
  poDate: string;
  customerId: string;
  quotationId: string;
  jobId?: string;
  productId: string;
  quantity: number;
  configuration: Record<string, string | number>;
  deliveryDate: string;
  paymentTerms: string;
  shippingAddress: Address;
  billingAddress: Address;
  customerPoAttachment?: string;
  specialInstructions?: string;
  status: SalesOrderStatus;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  createdAt: string;
}

// ── Purchase ─────────────────────────────────────────────────
export type PRStatus =
  | 'Draft' | 'Submitted' | 'Approved' | 'RFQ Sent'
  | 'PO Created' | 'Partial Receipt' | 'Completed' | 'Cancelled';

export interface PurchaseRequestItem {
  id: string;
  itemCode: string;
  itemName: string;
  specification: string;
  quantity: number;
  unit: string;
  requiredDate: string;
  estimatedRate?: number;
}

export interface PurchaseRequest {
  id: string;
  prNumber: string;
  jobId?: string;
  bomId?: string;
  requestedBy: string;
  department: Department;
  items: PurchaseRequestItem[];
  status: PRStatus;
  priority: Priority;
  notes?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export type POStatus =
  | 'Draft' | 'Sent' | 'Acknowledged' | 'Partial Receipt'
  | 'Fully Received' | 'Cancelled';

export interface POItem {
  id: string;
  itemCode: string;
  itemName: string;
  specification: string;
  quantity: number;
  unit: string;
  rate: number;
  gstPercent: number;
  total: number;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  poDate: string;
  supplierId: string;
  prId?: string;
  jobId?: string;
  items: POItem[];
  subtotal: number;
  gstAmount: number;
  freightCharges: number;
  totalAmount: number;
  paymentTerms: string;
  deliveryDate: string;
  deliveryAddress: Address;
  status: POStatus;
  notes?: string;
  createdAt: string;
}

export interface MaterialReceipt {
  id: string;
  grnNumber: string;
  poId: string;
  supplierId: string;
  receivedDate: string;
  receivedBy: string;
  items: {
    poItemId: string;
    itemCode: string;
    itemName: string;
    orderedQty: number;
    receivedQty: number;
    rejectedQty: number;
    unit: string;
    remarks?: string;
  }[];
  qualityStatus: 'Pending QC' | 'Accepted' | 'Partially Accepted' | 'Rejected';
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
}

// ── Inventory ────────────────────────────────────────────────
export type ItemCategory =
  | 'Raw Material' | 'Components' | 'Fabricated Parts' | 'Finished Goods' | 'Consumables';

export type ItemSubCategory =
  | 'MS Sheet' | 'SS Sheet' | 'MS Angle' | 'MS Channel' | 'MS Pipe'
  | 'SS Pipe' | 'SS Shaft' | 'Bearings' | 'Gearbox' | 'Motors'
  | 'Couplings' | 'Chain' | 'Sprocket' | 'Fasteners' | 'Conveyor Frame'
  | 'Support Bracket' | 'Hopper' | 'Chute' | 'Base Plate' | 'Other';

export interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: ItemCategory;
  subCategory: ItemSubCategory;
  material: string;
  grade?: string;
  unit: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderLevel: number;
  maxStock?: number;
  warehouse: string;
  rack?: string;
  supplierId?: string;
  averageCost: number;
  lastPurchaseRate?: number;
  lastPurchaseDate?: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  movementDate: string;
  itemId: string;
  movementType: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  unit: string;
  referenceType: 'PO' | 'GRN' | 'Production' | 'Fabrication' | 'Adjustment';
  referenceId: string;
  jobId?: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

// ── Fabrication ──────────────────────────────────────────────
export type WorkCenterType =
  | 'Cutting' | 'Welding' | 'Machining' | 'Drilling'
  | 'Grinding' | 'Assembly' | 'Finishing' | 'Painting';

export type FabricationStatus =
  | 'Planned' | 'Material Pending' | 'In Progress'
  | 'On Hold' | 'Completed' | 'Rework';

export interface FabricationOrder {
  id: string;
  fabOrderNumber: string;
  jobId: string;
  productionOrderId?: string;
  component: string;
  material: string;
  specification: string;
  quantity: number;
  unit: string;
  workCenter: WorkCenterType;
  assignedEmployeeId?: string;
  startDate: string;
  expectedCompletion: string;
  actualCompletion?: string;
  status: FabricationStatus;
  priority: Priority;
  remarks?: string;
  completionPercent: number;
  createdAt: string;
}

// ── Production ───────────────────────────────────────────────
export type ProductionStage =
  | 'Material Preparation' | 'Fabrication' | 'Sub-Assembly'
  | 'Main Assembly' | 'Electrical / Motor Installation'
  | 'Finishing' | 'Testing' | 'QC' | 'Dispatch Ready';

export type ProductionStatus =
  | 'Planned' | 'Released' | 'In Progress' | 'On Hold'
  | 'Completed' | 'Cancelled';

export interface ProductionStageStatus {
  stage: ProductionStage;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Skipped';
  startDate?: string;
  completedDate?: string;
  assignedTo?: string;
  remarks?: string;
}

export interface ProductionOrder {
  id: string;
  productionOrderNumber: string;
  jobId: string;
  salesOrderId?: string;
  customerId: string;
  productId: string;
  quantity: number;
  bomId: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  priority: Priority;
  productionManager: string;
  assignedTeam: string[];
  status: ProductionStatus;
  currentStage: ProductionStage;
  stages: ProductionStageStatus[];
  progressPercent: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Assembly ─────────────────────────────────────────────────
export type AssemblyStatus =
  | 'Pending' | 'In Progress' | 'Completed' | 'On Hold' | 'Rework';

export interface AssemblyChecklistItem {
  id: string;
  step: string;
  description: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  remarks?: string;
}

export interface AssemblyOrder {
  id: string;
  assemblyOrderNumber: string;
  jobId: string;
  productionOrderId?: string;
  productId: string;
  components: string[];
  assignedTeam: string[];
  workstation: string;
  startTime?: string;
  endTime?: string;
  status: AssemblyStatus;
  checklist: AssemblyChecklistItem[];
  progressPercent: number;
  remarks?: string;
  createdAt: string;
}

// ── QC ───────────────────────────────────────────────────────
export type QCResult = 'Passed' | 'Failed' | 'Passed with Observation' | 'Rework Required';
export type InspectionType = 'In-Process' | 'Final Inspection' | 'Customer Inspection';

export interface QCParameter {
  id: string;
  parameter: string;
  expectedValue: string;
  actualValue: string;
  unit?: string;
  result: 'Pass' | 'Fail' | 'Observation';
  remarks?: string;
}

export interface QCInspection {
  id: string;
  qcNumber: string;
  jobId: string;
  productionOrderId?: string;
  productId: string;
  inspector: string;
  inspectionDate: string;
  inspectionType: InspectionType;
  parameters: QCParameter[];
  overallResult: QCResult;
  observations?: string;
  photos?: string[];
  testReportRef?: string;
  reworkOrderId?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface ReworkOrder {
  id: string;
  reworkNumber: string;
  jobId: string;
  qcInspectionId: string;
  defects: string;
  reworkInstructions: string;
  assignedTo: string;
  targetDate: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Re-inspected';
  completedAt?: string;
  createdAt: string;
}

// ── Dispatch ─────────────────────────────────────────────────
export type DispatchStatus =
  | 'QC Approved' | 'Packing' | 'Ready for Dispatch'
  | 'Dispatched' | 'In Transit' | 'Delivered';

export interface DispatchOrder {
  id: string;
  dispatchNumber: string;
  jobId: string;
  salesOrderId?: string;
  qcInspectionId?: string;
  customerId: string;
  productId: string;
  quantity: number;
  packingDetails: string;
  transporter?: string;
  vehicleNumber?: string;
  lrNumber?: string;
  lrDate?: string;
  dispatchDate: string;
  deliveryAddress: Address;
  eWayBillNumber?: string;
  invoiceNumber?: string;
  status: DispatchStatus;
  deliveredDate?: string;
  documents: {
    invoice?: string;
    eWayBill?: string;
    lr?: string;
    packingList?: string;
    qcCertificate?: string;
    installationManual?: string;
  };
  notes?: string;
  createdAt: string;
}

// ── Task ─────────────────────────────────────────────────────
export type TaskStatus = 'Todo' | 'In Progress' | 'Waiting' | 'Completed' | 'Blocked';

export interface Task {
  id: string;
  taskId: string;
  taskName: string;
  jobId?: string;
  department: Department;
  assignedEmployeeId: string;
  priority: Priority;
  startDate: string;
  dueDate: string;
  estimatedHours?: number;
  actualHours?: number;
  status: TaskStatus;
  dependencies?: string[];
  attachments?: string[];
  comments?: TaskComment[];
  description?: string;
  completedAt?: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

// ── Document ─────────────────────────────────────────────────
export type DocumentType =
  | 'Customer Drawing' | 'Design Drawing' | 'BOM' | 'Quotation'
  | 'Customer PO' | 'Purchase Order' | 'Supplier Invoice'
  | 'Production Document' | 'QC Report' | 'Dispatch Document'
  | 'Installation Manual' | 'Photo' | 'Video' | 'Other';

export interface Document {
  id: string;
  jobId: string;
  documentType: DocumentType;
  fileName: string;
  fileSize?: number;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
  referenceId?: string;
  notes?: string;
}

// ── Job Costing ──────────────────────────────────────────────
export interface CostLineItem {
  category: string;
  description: string;
  estimatedCost: number;
  actualCost: number;
}

export interface JobCost {
  id: string;
  jobId: string;
  costItems: CostLineItem[];
  totalEstimatedCost: number;
  totalActualCost: number;
  sellingPrice: number;
  estimatedMargin: number;
  actualMargin?: number;
  estimatedMarginPercent: number;
  actualMarginPercent?: number;
  variance?: number;
  updatedAt: string;
}

// ── Activity Log ─────────────────────────────────────────────
export interface ActivityLog {
  id: string;
  jobId?: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  performedBy: string;
  performedAt: string;
  metadata?: Record<string, unknown>;
}

// ── Leave Management ─────────────────────────────────────────
export type LeaveType =
  | 'Casual Leave'
  | 'Sick Leave'
  | 'Paid Leave'
  | 'Compensatory Off'
  | 'Maternity / Paternity'
  | 'Unpaid Leave';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type LeaveDuration = 'Full Day' | 'First Half' | 'Second Half' | 'Multiple Days';

export interface LeaveRequest {
  id: string;
  leaveNumber: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: Department;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  duration: LeaveDuration;
  totalDays: number;
  reason: string;
  contactDuringLeave?: string;
  handoverToEmployeeId?: string;
  handoverToEmployeeName?: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminRemarks?: string;
  attachmentName?: string;
}

export interface LeaveBalanceCategory {
  total: number;
  used: number;
  pending: number;
  remaining: number;
}

export interface LeaveBalance {
  employeeId: string;
  employeeName: string;
  department: Department;
  casualLeave: LeaveBalanceCategory;
  sickLeave: LeaveBalanceCategory;
  paidLeave: LeaveBalanceCategory;
  compOff: LeaveBalanceCategory;
}

// ── Accounting & Finance ──────────────────────────────────────
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue' | 'Cancelled';
export type PaymentMode = 'NEFT/RTGS' | 'Cheque' | 'UPI' | 'Bank Transfer' | 'Cash' | 'Credit Card';
export type VendorBillStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Paid' | 'Partially Paid' | 'Overdue';

export interface InvoiceLineItem {
  id: string;
  itemDescription: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  gstRate: number; // e.g. 18%
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  jobId?: string;
  salesOrderId?: string;
  poNumber?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalGst: number;
  roundOff?: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  paymentTerms: string;
  bankDetails?: {
    bankName: string;
    accountNo: string;
    ifscCode: string;
    branch: string;
  };
  notes?: string;
  eWayBillNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  customerId: string;
  invoiceId: string;
  invoiceNumber: string;
  amountReceived: number;
  tdsDeducted?: number;
  netAmount: number;
  paymentMode: PaymentMode;
  transactionRef: string;
  bankName?: string;
  notes?: string;
  receivedBy: string;
  createdAt: string;
}

export interface VendorBill {
  id: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  supplierId: string;
  poId?: string;
  poNumber?: string;
  jobId?: string;
  description: string;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: VendorBillStatus;
  paymentTerms: string;
  paymentRef?: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

export interface GSTSummary {
  month: string;
  year: number;
  totalSalesTaxable: number;
  outputCgst: number;
  outputSgst: number;
  outputIgst: number;
  totalOutputGst: number;
  totalPurchaseTaxable: number;
  inputCgst: number;
  inputSgst: number;
  inputIgst: number;
  totalInputItc: number;
  netGstPayable: number;
}
