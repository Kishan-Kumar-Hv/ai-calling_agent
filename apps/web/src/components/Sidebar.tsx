import React from "react";
import { 
  Store, 
  BookOpen, 
  PhoneCall, 
  Radio, 
  ShieldCheck, 
  LogOut, 
  ChevronDown,
  Building2,
  Sparkles
} from "lucide-react";
import { NavView } from "./Navbar";
import { Shop, User } from "../types";

interface SidebarProps {
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
  user: User | null;
  onLogout: () => void;
  shops: Shop[];
  selectedShop: Shop | null;
  onSelectShop: (shop: Shop) => void;
  isCallActive: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  user,
  onLogout,
  shops,
  selectedShop,
  onSelectShop,
  isCallActive,
}) => {
  const [shopMenuOpen, setShopMenuOpen] = React.useState(false);

  const navItems = [
    {
      id: "shops" as NavView,
      label: "Stores",
      subLabel: "Branches & Telephony",
      icon: Store,
    },
    {
      id: "catalog" as NavView,
      label: "Product Catalog",
      subLabel: "SKUs & Wholesale Pricing",
      icon: BookOpen,
    },
    {
      id: "missed-calls" as NavView,
      label: "Missed Calls Queue",
      subLabel: "Recovery & Concurrency",
      icon: PhoneCall,
    },
    {
      id: "live-monitor" as NavView,
      label: "Live AI Call Simulator",
      subLabel: "Real-Time Conversation",
      icon: Radio,
      badge: isCallActive ? "LIVE" : undefined,
    },
    {
      id: "admin" as NavView,
      label: "Admin Talks",
      subLabel: "Platform Intelligence & Audits",
      icon: ShieldCheck,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-screen">
      {/* Brand Logo Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-extrabold text-lg text-white tracking-tight">Involynk</span>
              <span className="text-blue-500 font-extrabold text-lg">.ai</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise AI Voice SDR</p>
          </div>
        </div>
      </div>

      {/* Store Branch Switcher */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
        <label className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider px-2 block mb-1">
          Active Branch
        </label>
        <div className="relative">
          <button
            onClick={() => setShopMenuOpen(!shopMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition shadow-inner"
          >
            <div className="flex items-center space-x-2 truncate">
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">{selectedShop?.name || "Select Branch"}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          </button>

          {shopMenuOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 text-xs">
              {shops.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectShop(s);
                    setShopMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-700/80 flex items-center justify-between transition ${
                    s.id === selectedShop?.id ? "text-blue-400 font-bold bg-slate-700/40" : "text-slate-300"
                  }`}
                >
                  <span className="truncate">{s.name}</span>
                  {s.id === selectedShop?.id && <span className="text-[10px] font-mono text-blue-400">ACTIVE</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation List - Exact Clean Order */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">
          Workspace Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                isActive
                  ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium"
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"
                  }`}
                />
                <div className="truncate">
                  <div className="text-xs leading-snug">{item.label}</div>
                  <div className={`text-[10px] leading-tight ${isActive ? "text-blue-200" : "text-slate-500"}`}>
                    {item.subLabel}
                  </div>
                </div>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name?.[0]?.toUpperCase() || "M"}
            </div>
            <div className="truncate text-xs">
              <p className="font-bold text-white truncate">{user?.name || "Merchant Owner"}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.businessName || "Store"}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
