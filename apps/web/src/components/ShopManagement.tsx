import React, { useState } from "react";
import { 
  Store, 
  Plus, 
  Edit3, 
  Save, 
  MapPin, 
  Phone, 
  Clock, 
  Bot, 
  AlertCircle, 
  CheckCircle,
  Sliders
} from "lucide-react";
import { Shop } from "../types";

interface ShopManagementProps {
  shops: Shop[];
  selectedShop: Shop | null;
  onSelectShop: (shop: Shop) => void;
  onUpdateShop: (updatedShop: Shop) => void;
  onAddShop: (newShop: Shop) => void;
}

export const ShopManagement: React.FC<ShopManagementProps> = ({
  shops,
  selectedShop,
  onSelectShop,
  onUpdateShop,
  onAddShop,
}) => {
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(shops.length === 0);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New shop form state
  const [newShopName, setNewShopName] = useState("");
  const [newCategory, setNewCategory] = useState<Shop["category"]>("Retail");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newHours, setNewHours] = useState("09:30 AM - 09:30 PM (IST)");
  const [newPersona, setNewPersona] = useState("Riya");
  const [newLanguage, setNewLanguage] = useState<Shop["aiSettings"]["language"]>("hinglish");

  const handleEditClick = (shop: Shop) => {
    setEditingShop({ ...shop });
    setIsAddingNew(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;
    onUpdateShop(editingShop);
    setEditingShop(null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCreateShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName) return;

    const created: Shop = {
      id: "shop_" + Math.random().toString(36).substring(2, 9),
      name: newShopName,
      category: newCategory,
      phone: newPhone,
      address: newAddress,
      operatingHours: newHours,
      bannerImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
      observedGaps: [
        "Unlisted on Google Maps local rankings",
        "No automated missed-call callback during peak walk-in rush"
      ],
      aiSettings: {
        personaName: newPersona,
        language: newLanguage,
        tone: "Friendly & Empathetic",
        autoWhatsApp: true,
        whatsappTemplate: "Hi {{name}}! Calling from {{shop_name}}. Sorry we missed your call. Here is our direct WhatsApp catalog: {{portfolio_url}}",
        transferNumber: newPhone,
        maxRetries: 3,
        callPacingSeconds: 8,
      },
      metrics: {
        totalMissedRecovered: 0,
        conversionRate: 0,
        revenueSaved: "₹0",
        avgLatencyMs: 310,
      },
    };

    onAddShop(created);
    setIsAddingNew(false);
    setNewShopName("");
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Store Franchise Management
            </h2>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {shops.length} Private Outlets
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
              <span>🔒 Encrypted Tenant Vault</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your private store locations, operating hours, and dedicated AI voice personas. Each outlet is strictly isolated to your account.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddingNew(true);
            setEditingShop(null);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Store Branch</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Store configurations & AI SDR settings successfully updated in live database!</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Store List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Owned Outlets
          </h3>

          <div className="space-y-3">
            {shops.map((shop) => {
              const isSelected = selectedShop?.id === shop.id;
              return (
                <div
                  key={shop.id}
                  onClick={() => onSelectShop(shop)}
                  className={`cursor-pointer rounded-xl overflow-hidden border transition-all ${
                    isSelected
                      ? "bg-white border-2 border-blue-600 shadow-md"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  {/* Store Banner */}
                  <div className="relative h-28 w-full overflow-hidden">
                    <img
                      src={shop.bannerImage}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-slate-900">
                        {shop.category}
                      </span>
                      <span className="text-[10px] font-mono bg-black/50 px-2 py-0.5 rounded text-white">
                        AI: {shop.aiSettings.personaName} ({shop.aiSettings.language})
                      </span>
                    </div>
                  </div>

                  {/* Store Info */}
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{shop.name}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(shop);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
                        title="Edit Shop"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center space-x-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{shop.address}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">Recovered Calls:</span>
                      <span className="text-blue-600 font-bold">{shop.metrics.totalMissedRecovered} calls</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed / Edit View */}
        <div className="lg:col-span-7">
          {isAddingNew ? (
            /* Add Form */
            <div className="rounded-2xl clean-panel p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Store className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-base text-slate-900">Register New Store Branch</h3>
                </div>
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateShop} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Store / Clinic Name</label>
                  <input
                    type="text"
                    required
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    placeholder="e.g. Kishan Dry Fruits - Indiranagar Branch"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Business Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as Shop["category"])}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                    >
                      <option value="Dry Fruits & Spices">Dry Fruits & Spices</option>
                      <option value="Bakery & Cafe">Bakery & Cafe</option>
                      <option value="Healthcare Clinic">Healthcare Clinic</option>
                      <option value="Retail">Retail</option>
                      <option value="Jewelry">Jewelry</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Salon & Spa">Salon & Spa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Store Helpline / Caller ID</label>
                    <input
                      type="text"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+91 84319 80422"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Store Physical Address</label>
                  <input
                    type="text"
                    required
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5 uppercase tracking-wider font-mono">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span>AI SDR Voice Persona Setup</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Agent Voice Name</label>
                      <input
                        type="text"
                        value={newPersona}
                        onChange={(e) => setNewPersona(e.target.value)}
                        placeholder="e.g. Riya"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Dialect / Code-Switching</label>
                      <select
                        value={newLanguage}
                        onChange={(e) => setNewLanguage(e.target.value as Shop["aiSettings"]["language"])}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                      >
                        <option value="hinglish">Hinglish (Hindi + English Native Mix)</option>
                        <option value="en-IN">Indian English Accent</option>
                        <option value="hi-IN">Pure Hindi</option>
                        <option value="kn-IN">Kannada + English Mix (Bangalore)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs"
                >
                  Save Store & Initialize AI Agent
                </button>
              </form>
            </div>
          ) : editingShop ? (
            /* Edit Form */
            <div className="rounded-2xl clean-panel p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-base text-slate-900">Edit Store: {editingShop.name}</h3>
                </div>
                <button
                  onClick={() => setEditingShop(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Done Editing
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Store Name</label>
                  <input
                    type="text"
                    required
                    value={editingShop.name}
                    onChange={(e) => setEditingShop({ ...editingShop, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Phone / Twilio Line</label>
                    <input
                      type="text"
                      required
                      value={editingShop.phone}
                      onChange={(e) => setEditingShop({ ...editingShop, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Operating Hours</label>
                    <input
                      type="text"
                      value={editingShop.operatingHours}
                      onChange={(e) => setEditingShop({ ...editingShop, operatingHours: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Store Address</label>
                  <input
                    type="text"
                    value={editingShop.address}
                    onChange={(e) => setEditingShop({ ...editingShop, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5 uppercase tracking-wider font-mono">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>AI Persona Settings</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Agent Name</label>
                      <input
                        type="text"
                        value={editingShop.aiSettings.personaName}
                        onChange={(e) =>
                          setEditingShop({
                            ...editingShop,
                            aiSettings: { ...editingShop.aiSettings, personaName: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Language</label>
                      <select
                        value={editingShop.aiSettings.language}
                        onChange={(e) =>
                          setEditingShop({
                            ...editingShop,
                            aiSettings: {
                              ...editingShop.aiSettings,
                              language: e.target.value as Shop["aiSettings"]["language"],
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                      >
                        <option value="hinglish">Hinglish</option>
                        <option value="en-IN">Indian English</option>
                        <option value="hi-IN">Hindi</option>
                        <option value="kn-IN">Kannada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Tone</label>
                      <select
                        value={editingShop.aiSettings.tone}
                        onChange={(e) =>
                          setEditingShop({
                            ...editingShop,
                            aiSettings: {
                              ...editingShop.aiSettings,
                              tone: e.target.value as Shop["aiSettings"]["tone"],
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                      >
                        <option value="Friendly & Empathetic">Friendly & Empathetic</option>
                        <option value="Urgent & Direct">Urgent & Direct</option>
                        <option value="Executive & Polished">Executive & Polished</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Mid-Call WhatsApp Message
                    </label>
                    <textarea
                      rows={2}
                      value={editingShop.aiSettings.whatsappTemplate}
                      onChange={(e) =>
                        setEditingShop({
                          ...editingShop,
                          aiSettings: { ...editingShop.aiSettings, whatsappTemplate: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono text-xs focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Manager Phone (For Human Escalation)
                    </label>
                    <input
                      type="text"
                      value={editingShop.aiSettings.transferNumber}
                      onChange={(e) =>
                        setEditingShop({
                          ...editingShop,
                          aiSettings: { ...editingShop.aiSettings, transferNumber: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Live Store Configurations</span>
                </button>
              </form>
            </div>
          ) : selectedShop ? (
            /* Selected View */
            <div className="rounded-2xl clean-panel p-6 space-y-6">
              {/* Banner */}
              <div className="relative rounded-xl overflow-hidden h-44 border border-slate-200">
                <img
                  src={selectedShop.bannerImage}
                  alt={selectedShop.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase">
                      {selectedShop.category}
                    </span>
                    <h3 className="text-xl font-extrabold mt-1">
                      {selectedShop.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleEditClick(selectedShop)}
                    className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-800 text-xs font-semibold hover:bg-white transition-colors flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Store</span>
                  </button>
                </div>
              </div>

              {/* Info row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-blue-600" />
                    <span>Helpline</span>
                  </div>
                  <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                    {selectedShop.phone}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Hours</span>
                  </div>
                  <div className="font-semibold text-slate-800 text-xs mt-0.5">
                    {selectedShop.operatingHours}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <Bot className="w-3 h-3 text-emerald-600" />
                    <span>Voice SDR</span>
                  </div>
                  <div className="font-semibold text-blue-700 text-xs mt-0.5">
                    {selectedShop.aiSettings.personaName} ({selectedShop.aiSettings.language})
                  </div>
                </div>
              </div>

              {/* Observed Gaps */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5 uppercase tracking-wider font-mono">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Observed Digital Gaps (AI Calling Hooks)</span>
                </h4>
                <div className="space-y-1 pt-1">
                  {selectedShop.observedGaps && selectedShop.observedGaps.length > 0 ? (
                    selectedShop.observedGaps.map((gap, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{gap}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No operational gaps reported for this branch.</p>
                  )}
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Missed Recovered</p>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">{selectedShop.metrics.totalMissedRecovered}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Conversion</p>
                  <p className="text-lg font-extrabold text-blue-600 mt-0.5">{selectedShop.metrics.conversionRate}%</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Revenue Saved</p>
                  <p className="text-lg font-extrabold text-emerald-600 mt-0.5">{selectedShop.metrics.revenueSaved}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Voice Latency</p>
                  <p className="text-lg font-extrabold text-teal-600 font-mono mt-0.5">{selectedShop.metrics.avgLatencyMs}ms</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl clean-panel p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                <Store className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Store Outlet Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your database is ready. Click below to add your first physical retail or e-commerce outlet.
              </p>
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Store Branch</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
