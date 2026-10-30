import React, { useState } from "react";
import { 
  PhoneCall, 
  Store, 
  Radio, 
  ChevronDown, 
  LayoutDashboard,
  Zap,
  Building2,
  ArrowRight,
  LogOut,
  ArrowLeft,
  ShieldCheck
} from "lucide-react";
import { Shop, User } from "../types";

export type NavView = 
  | "home" 
  | "features" 
  | "about" 
  | "login" 
  | "register" 
  | "dashboard" 
  | "shops" 
  | "missed-calls" 
  | "live-monitor"
  | "admin";

interface NavbarProps {
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
  user: User | null;
  onLogout: () => void;
  shops: Shop[];
  selectedShop: Shop | null;
  onSelectShop: (shop: Shop) => void;
  isCallActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  user,
  onLogout,
  shops,
  selectedShop,
  onSelectShop,
  isCallActive,
}) => {
  const [shopMenuOpen, setShopMenuOpen] = useState(false);

  const isPublicPage = ["home", "features", "about", "login", "register"].includes(currentView);

  // 1. PUBLIC MARKETING WEBSITE NAVBAR
  if (isPublicPage) {
    return (
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div 
              className="flex items-center space-x-3 cursor-pointer" 
              onClick={() => setCurrentView("home")}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Involynk<span className="text-blue-600">.ai</span>
                </span>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                  Autonomous AI Voice SDR for Retail & Franchises
                </p>
              </div>
            </div>

            {/* Public Links */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setCurrentView("home")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === "home"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setCurrentView("features")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === "features"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Features
              </button>
              <button
                onClick={() => setCurrentView("about")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === "about"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                About Us
              </button>
              <button
                onClick={() => setCurrentView("admin")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                  currentView === "admin"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Admin Portal</span>
              </button>
            </nav>

            {/* Right Side: Auth / Go to Console */}
            <div className="flex items-center space-x-2.5">
              {user ? (
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <span>Business Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentView("login")}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setCurrentView("register")}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
                  >
                    Register Business
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // 2. CONSOLE APP NAVBAR (When inside Dashboard, Shops, Missed Calls, Live Monitor)
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Public site back link */}
          <div className="flex items-center space-x-4">
            <div 
              className="flex items-center space-x-2.5 cursor-pointer" 
              onClick={() => setCurrentView("dashboard")}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <PhoneCall className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Involynk<span className="text-blue-600"> Console</span>
              </span>
            </div>

            <button
              onClick={() => setCurrentView("home")}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 pl-2 border-l border-slate-200"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Public Website</span>
            </button>
          </div>

          {/* Console Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                currentView === "dashboard"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setCurrentView("shops")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                currentView === "shops"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span>Stores ({shops.length})</span>
            </button>
            <button
              onClick={() => setCurrentView("missed-calls")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                currentView === "missed-calls"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Missed Calls Queue</span>
            </button>
            <button
              onClick={() => setCurrentView("live-monitor")}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                currentView === "live-monitor"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>Live Call Monitor</span>
              {isCallActive && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>
            <button
              onClick={() => setCurrentView("admin")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                currentView === "admin"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Admin Talks</span>
            </button>
          </nav>

          {/* Right Console Actions: Store Switcher & User */}
          <div className="flex items-center space-x-3">
            {/* Active Outlet Switcher */}
            {selectedShop ? (
              <div className="relative">
                <button
                  onClick={() => setShopMenuOpen(!shopMenuOpen)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 hover:border-slate-400 text-xs font-semibold text-slate-800 transition-all shadow-2xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="max-w-[130px] truncate">{selectedShop.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {shopMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Active Outlet
                    </div>
                    {shops.map((shop) => (
                      <button
                        key={shop.id}
                        onClick={() => {
                          onSelectShop(shop);
                          setShopMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2.5 transition-colors ${
                          selectedShop.id === shop.id
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-md overflow-hidden shrink-0 border border-slate-200">
                          <img src={shop.bannerImage} alt={shop.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="truncate">
                          <div className="truncate font-semibold">{shop.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{shop.category}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setCurrentView("shops")}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition"
              >
                + Add Store
              </button>
            )}

            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 pl-2 pr-1.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                <img
                  src={user?.avatar ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                  alt="Avatar"
                  className="w-6 h-6 rounded-md object-cover border border-slate-200"
                />
                <span className="hidden sm:block text-xs font-semibold text-slate-800">
                  {user?.name.split(" ")[0] ?? "Owner"}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-slate-100"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
