import React, { useState } from 'react';
import { Plus, AlertTriangle, Package, Eye, ShoppingCart, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchBar, StatusBadge, SectionHeader, KPICard, Drawer, InfoGrid, ProgressBar, formatCurrency, Modal, FormField } from '../components/ui';
import type { InventoryItem, InventoryCategory } from '../types';
import { useERP } from '../context/ERPContext';

export function Inventory() {
  const navigate = useNavigate();
  const { inventory, suppliers, addInventoryItem, updateInventoryItem, addPurchaseRequest } = useERP();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // New Item form state
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('Raw Material');
  const [material, setMaterial] = useState('Mild Steel (IS 2062)');
  const [currentStock, setCurrentStock] = useState(20);
  const [unit, setUnit] = useState('Nos');
  const [reorderLevel, setReorderLevel] = useState(5);
  const [averageCost, setAverageCost] = useState(3500);

  const categories = ['All', 'Raw Material', 'Components', 'Fabricated Parts', 'Finished Goods', 'Consumables'];
  const lowStock = inventory.filter(i => i.availableStock <= i.reorderLevel);
  const outOfStock = inventory.filter(i => i.availableStock === 0);

  const filtered = inventory.filter(i => {
    const matchSearch = i.itemName.toLowerCase().includes(search.toLowerCase()) ||
      i.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      (i.material ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || i.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.availableStock === 0) return { label: 'Out of Stock', variant: 'danger' as const };
    if (item.availableStock <= item.reorderLevel) return { label: 'Low Stock', variant: 'warning' as const };
    return { label: 'In Stock', variant: 'success' as const };
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const code = itemCode || `ITM-${Date.now().toString().slice(-4)}`;
    const newItem: InventoryItem = {
      id: `INV-${Date.now()}`,
      itemCode: code,
      itemName,
      category,
      subCategory: 'Structural / Machinery Part',
      material,
      currentStock: Number(currentStock) || 0,
      reservedStock: 0,
      availableStock: Number(currentStock) || 0,
      unit,
      reorderLevel: Number(reorderLevel) || 5,
      minStock: 2,
      maxStock: 50,
      averageCost: Number(averageCost) || 1000,
      lastPurchaseRate: Number(averageCost) || 1000,
      lastPurchaseDate: new Date().toISOString().split('T')[0],
      warehouse: 'Plant Makarpura GIDC',
      rack: 'Bay A-1',
      hsnCode: '84283900',
      gstPercent: 18,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    addInventoryItem(newItem);
    setAddOpen(false);
    setSelected(newItem);
  };

  const handleRaisePR = (item: InventoryItem) => {
    const newPR = {
      id: `PR-${Date.now()}`,
      prNumber: `PR-2026-${String(Date.now()).slice(-4)}`,
      requestedBy: 'Store In-Charge',
      department: 'Purchase' as const,
      priority: 'High' as const,
      status: 'Pending Approval' as const,
      items: [
        {
          id: 'pri-1',
          itemCode: item.itemCode,
          itemName: item.itemName,
          specification: item.material || 'Standard specification',
          quantity: item.reorderLevel * 2 || 10,
          unit: item.unit,
          requiredDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        }
      ],
      createdAt: new Date().toISOString().split('T')[0],
    };
    addPurchaseRequest(newPR);
    setAlertMsg(`Purchase Request ${newPR.prNumber} generated for ${item.itemName}!`);
    setTimeout(() => setAlertMsg(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Inventory & Stock Master"
        subtitle={`${inventory.length} items catalogued · ${lowStock.length} below reorder level`}
        actions={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search stock items..." className="w-64" />
            <select className="select w-auto text-xs" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={14} /> Add New Item
            </button>
          </>
        }
      />

      {alertMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-sm animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600" />
            <span>{alertMsg}</span>
          </div>
          <button className="btn-secondary text-xs py-1" onClick={() => navigate('/purchase-requests')}>
            View in Purchase Requests <ArrowRight size={11} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="p-2.5 rounded-xl bg-blue-50"><Package className="w-5 h-5 text-blue-600" /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="p-2.5 rounded-xl bg-emerald-50"><Package className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">In Stock</p>
            <p className="text-2xl font-bold text-gray-900">{inventory.filter(i => i.availableStock > i.reorderLevel).length}</p>
          </div>
        </div>
        <div className="kpi-card border-amber-200 bg-amber-50/30">
          <div className="p-2.5 rounded-xl bg-amber-100"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Low Stock</p>
            <p className="text-2xl font-bold text-amber-700">{lowStock.length}</p>
          </div>
        </div>
        <div className="kpi-card border-red-200 bg-red-50/30">
          <div className="p-2.5 rounded-xl bg-red-100"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Out of Stock</p>
            <p className="text-2xl font-bold text-red-700">{outOfStock.length}</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-th">Item Code</th>
              <th className="table-th">Item Name</th>
              <th className="table-th">Category</th>
              <th className="table-th">Material/Grade</th>
              <th className="table-th text-right">Stock</th>
              <th className="table-th text-right">Reserved</th>
              <th className="table-th text-right">Available</th>
              <th className="table-th">Stock Level</th>
              <th className="table-th">Status</th>
              <th className="table-th w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const status = getStockStatus(item);
              const stockPercent = item.maxStock ? Math.round((item.currentStock / item.maxStock) * 100) : 50;
              return (
                <tr key={item.id} className="table-row" onClick={() => setSelected(item)}>
                  <td className="table-td font-mono text-xs text-brand-700 font-semibold">{item.itemCode}</td>
                  <td className="table-td font-semibold text-sm text-gray-900">{item.itemName}</td>
                  <td className="table-td text-xs text-gray-600">{item.category}</td>
                  <td className="table-td text-xs text-gray-600">{item.material}</td>
                  <td className="table-td text-right font-bold">{item.currentStock} {item.unit}</td>
                  <td className="table-td text-right text-amber-600 font-semibold">{item.reservedStock}</td>
                  <td className="table-td text-right">
                    <span className={`font-bold ${item.availableStock <= item.reorderLevel ? 'text-red-600' : 'text-emerald-600'}`}>
                      {item.availableStock} {item.unit}
                    </span>
                  </td>
                  <td className="table-td w-24">
                    <ProgressBar percent={stockPercent} size="sm" color={status.variant === 'danger' ? 'bg-red-500' : status.variant === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'} />
                  </td>
                  <td className="table-td"><StatusBadge status={status.label} variant={status.variant} /></td>
                  <td className="table-td"><Eye size={14} className="text-gray-300" /></td>
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
          title={selected.itemName}
          subtitle={`${selected.itemCode} · ${selected.category}`}
          actions={
            <button className="btn-primary text-xs" onClick={() => handleRaisePR(selected)}>
              <ShoppingCart size={12} /> Raise Purchase Request
            </button>
          }
        >
          <div className="p-6 space-y-6">
            <div className={`rounded-xl p-4 border ${selected.availableStock <= selected.reorderLevel ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{selected.availableStock} <span className="text-sm font-normal text-gray-500">{selected.unit}</span></p>
                  <p className="text-xs text-gray-500">Available Stock for Production</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-600">Reserved: {selected.reservedStock} {selected.unit}</p>
                  <p className="text-xs font-semibold text-gray-600">Reorder Level: {selected.reorderLevel} {selected.unit}</p>
                </div>
              </div>
            </div>

            <InfoGrid items={[
              { label: 'Item Code', value: selected.itemCode },
              { label: 'Category', value: selected.category },
              { label: 'Material', value: selected.material },
              { label: 'Unit of Measure', value: selected.unit },
              { label: 'Reorder Min', value: `${selected.reorderLevel} ${selected.unit}` },
              { label: 'Plant Store', value: selected.warehouse },
              { label: 'Average Cost', value: formatCurrency(selected.averageCost) },
              { label: 'Last Purchase Rate', value: selected.lastPurchaseRate ? formatCurrency(selected.lastPurchaseRate) : '—' },
            ]} />

            <button
              className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2"
              onClick={() => handleRaisePR(selected)}
            >
              <ShoppingCart size={14} /> Raise Purchase Request to Procurement
            </button>
          </div>
        </Drawer>
      )}

      {/* Add Item Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Inventory Stock Item"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleCreateItem}>Save Item</button>
          </div>
        }
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Item Name" required>
              <input className="input" placeholder="e.g. MS Heavy Plate 10mm" value={itemName} onChange={e => setItemName(e.target.value)} required />
            </FormField>
            <FormField label="Item Code (optional)">
              <input className="input font-mono uppercase" placeholder="Auto-generated if blank" value={itemCode} onChange={e => setItemCode(e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category" required>
              <select className="select" value={category} onChange={e => setCategory(e.target.value as InventoryCategory)}>
                {['Raw Material', 'Components', 'Fabricated Parts', 'Finished Goods', 'Consumables'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Material / Grade" required>
              <input className="input" value={material} onChange={e => setMaterial(e.target.value)} required />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Initial Stock" required>
              <input type="number" className="input font-bold" value={currentStock} onChange={e => setCurrentStock(Number(e.target.value))} min={0} required />
            </FormField>
            <FormField label="Unit" required>
              <select className="select" value={unit} onChange={e => setUnit(e.target.value)}>
                <option>Nos</option><option>Kg</option><option>Mtr</option><option>Set</option><option>Ltr</option>
              </select>
            </FormField>
            <FormField label="Reorder Level" required>
              <input type="number" className="input font-bold" value={reorderLevel} onChange={e => setReorderLevel(Number(e.target.value))} min={1} required />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
