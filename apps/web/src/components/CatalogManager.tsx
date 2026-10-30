import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Edit3, Save, X, Package, Tag, IndianRupee, AlertTriangle,
  CheckCircle, RefreshCw, ShoppingBag, Loader2, BookOpen, ChevronDown
} from "lucide-react";
import { Shop } from "../types";
import { api } from "../api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  category: string;
  priceRetail: number;
  priceWholesale?: number;
  unit: string;
  minOrderQty: number;
  maxOrderQty?: number;
  stockStatus: "in_stock" | "limited" | "out_of_stock";
  stockQty?: number;
  tags: string[];
  imageUrl?: string;
  isActive?: boolean;
}

const UNITS = ["piece", "kg", "gram", "box", "pack", "dozen", "litre", "ml", "set", "bundle", "bag"];
const STOCK_STATUSES: { value: Product["stockStatus"]; label: string; color: string }[] = [
  { value: "in_stock",    label: "In Stock",    color: "text-green-600  bg-green-50  border-green-200" },
  { value: "limited",     label: "Limited",     color: "text-amber-600  bg-amber-50  border-amber-200" },
  { value: "out_of_stock",label: "Out of Stock",color: "text-red-600    bg-red-50    border-red-200"   },
];

const CATEGORY_SUGGESTIONS = [
  "Dry Fruits", "Spices", "Gift Hampers", "Sweets & Mithai", "Snacks",
  "Beverages", "Bakery", "Dairy", "Groceries", "Personal Care",
  "Electronics", "Clothing", "Footwear", "Stationery", "General"
];

const EMPTY_FORM: Omit<Product, "id" | "shopId"> = {
  name: "", description: "", category: "", priceRetail: 0,
  priceWholesale: undefined, unit: "piece", minOrderQty: 1,
  maxOrderQty: undefined, stockStatus: "in_stock",
  stockQty: undefined, tags: [], imageUrl: "",
};

// ─── CatalogManager Component ─────────────────────────────────────────────────

interface CatalogManagerProps {
  selectedShop: Shop | null;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({ selectedShop }) => {
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState<Omit<Product, "id" | "shopId">>(EMPTY_FORM);
  const [tagInput, setTagInput]       = useState("");
  const [filterCategory, setFilterCat]= useState("All");
  const [successMsg, setSuccessMsg]   = useState("");
  const [errorMsg, setErrorMsg]       = useState("");

  // ── Load products for current shop ──────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    if (!selectedShop?.id) return;
    setLoading(true);
    try {
      const data = await api.getCatalog(selectedShop.id);
      setProducts(data);
    } catch (err: any) {
      setErrorMsg("Failed to load catalog: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedShop?.id]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };
  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setTagInput("");
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (p: Product) => {
    setForm({
      name: p.name, description: p.description, category: p.category,
      priceRetail: p.priceRetail, priceWholesale: p.priceWholesale,
      unit: p.unit, minOrderQty: p.minOrderQty, maxOrderQty: p.maxOrderQty,
      stockStatus: p.stockStatus, stockQty: p.stockQty,
      tags: p.tags, imageUrl: p.imageUrl || "",
    });
    setTagInput("");
    setEditingId(p.id);
    setShowForm(true);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));

  // ── Save (create or update) ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedShop?.id) return;
    if (!form.name.trim()) { showError("Product name is required"); return; }
    if (form.priceRetail <= 0)  { showError("Price must be greater than 0"); return; }

    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.updateProduct(editingId, { ...form, shopId: selectedShop.id });
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        showSuccess("Product updated ✓");
      } else {
        const created = await api.createProduct({ ...form, shopId: selectedShop.id });
        setProducts((prev) => [created, ...prev]);
        showSuccess("Product added to catalog ✓");
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      showError("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Remove this product from the catalog?")) return;
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showSuccess("Product removed ✓");
    } catch (err: any) {
      showError("Failed to delete: " + err.message);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────────
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];
  const filtered   = filterCategory === "All" ? products : products.filter((p) => p.category === filterCategory);

  const stockBadge = (s: Product["stockStatus"]) => {
    const st = STOCK_STATUSES.find((x) => x.value === s)!;
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>;
  };

  // ─── Guard: no shop selected ────────────────────────────────────────────────
  if (!selectedShop) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-400 space-y-3">
        <ShoppingBag className="w-12 h-12 opacity-30" />
        <p className="font-semibold text-slate-500">Select a store from the Stores tab to manage its product catalog.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-green-600" />
            Product Catalog
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {selectedShop.name} · {products.length} product{products.length !== 1 ? "s" : ""}
            {" · "}
            <span className="font-medium text-green-700">AI uses this list during live calls</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadProducts}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={openAddForm}
            className="px-4 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Toast Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
          <AlertTriangle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      {/* AI Tip Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-start gap-2.5">
        <Package className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          <strong>How the AI uses your catalog:</strong> When a customer asks "kya hai?" or asks for prices, Riya
          reads <em>your exact products and prices</em> from this list and never hallucinates items or figures.
          Add all your SKUs, set wholesale prices for bulk buyers, and mark out-of-stock items.
        </span>
      </div>

      {/* Category Filter */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                filterCategory === cat
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-green-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">
              {editingId ? "Edit Product" : "Add New Product"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Product Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Premium Kaju (Cashew W240)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <input
                list="category-suggestions"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Dry Fruits"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <datalist id="category-suggestions">
                {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Retail Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Retail Price (₹) *</label>
              <input
                type="number" min="0" step="0.5"
                value={form.priceRetail || ""}
                onChange={(e) => setForm((f) => ({ ...f, priceRetail: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 850"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Wholesale Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Wholesale Price (₹) <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                type="number" min="0" step="0.5"
                value={form.priceWholesale ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, priceWholesale: e.target.value ? parseFloat(e.target.value) : undefined }))}
                placeholder="e.g. 720 for bulk buyers"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Min Order Qty */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Min Order Qty</label>
              <input
                type="number" min="1"
                value={form.minOrderQty}
                onChange={(e) => setForm((f) => ({ ...f, minOrderQty: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Stock Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Stock Status</label>
              <select
                value={form.stockStatus}
                onChange={(e) => setForm((f) => ({ ...f, stockStatus: e.target.value as Product["stockStatus"] }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {STOCK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description <span className="font-normal text-slate-400">(AI will say this to customers)</span></label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Premium grade W240 cashews, ideal for gifting. Fresh stock from Kerala."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Tags */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tags <span className="font-normal text-slate-400">(help AI route customer intent)</span></label>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="festive, gifting, bulk, vip …"
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button onClick={addTag} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200">
                  + Add Tag
                </button>
              </div>
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? "Update Product" : "Save to Catalog"}
            </button>
          </div>
        </div>
      )}

      {/* Product List */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading catalog…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 text-slate-400 space-y-3">
          <Package className="w-12 h-12 opacity-25" />
          <p className="text-sm font-medium text-slate-500">
            {products.length === 0
              ? "Your catalog is empty. Click \"Add Product\" to get started."
              : "No products match this category filter."}
          </p>
          {products.length === 0 && (
            <button onClick={openAddForm} className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700">
              + Add First Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-3">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{p.name}</p>
                  <p className="text-xs text-slate-400 font-medium">{p.category || "General"}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditForm(p)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit product"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from catalog"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Prices */}
              <div className="flex items-baseline gap-3">
                <span className="text-lg font-extrabold text-slate-900">₹{p.priceRetail.toLocaleString("en-IN")}<span className="text-xs font-medium text-slate-400">/{p.unit}</span></span>
                {p.priceWholesale && (
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Bulk: ₹{p.priceWholesale.toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              {/* Stock + min order */}
              <div className="flex items-center gap-2 flex-wrap">
                {stockBadge(p.stockStatus)}
                {p.minOrderQty > 1 && (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Min {p.minOrderQty} {p.unit}
                  </span>
                )}
              </div>

              {/* Description */}
              {p.description && (
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{p.description}</p>
              )}

              {/* Tags */}
              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.tags.map((t) => (
                    <span key={t} className="text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">#{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
