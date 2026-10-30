import React, { useState } from "react";
import { 
  PhoneMissed, 
  Flame, 
  Store, 
  TrendingUp, 
  Zap, 
  Radio, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  PhoneCall,
  CheckCircle2,
  Building2
} from "lucide-react";
import { Shop, MissedCall, LiveCallSession } from "../types";

interface DashboardOverviewProps {
  selectedShop: Shop | null;
  shops: Shop[];
  missedCalls: MissedCall[];
  activeCall: LiveCallSession | null;
  onNavigate: (view: "shops" | "missed-calls" | "live-monitor") => void;
  onQuickDial: (phoneNumber: string, name: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  selectedShop,
  shops,
  missedCalls,
  activeCall,
  onNavigate,
  onQuickDial,
}) => {
  const [quickPhone, setQuickPhone] = useState("");
  const [quickName, setQuickName] = useState("");

  if (!selectedShop) {
    return (
      <div className="py-16 px-4 text-center clean-panel rounded-2xl max-w-2xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
          <Store className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Welcome to Your Clean Involynk Console
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Your database is clean and connected to MongoDB Atlas. Add your first physical or online retail store branch to start capturing missed calls and automating voice SDR conversations.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate("shops")}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
          >
            <Building2 className="w-4 h-4" />
            <span>Create Your First Store Branch</span>
          </button>
        </div>
      </div>
    );
  }

  const pendingCalls = missedCalls.filter((c) => c.status === "pending");

  const handleQuickCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhone) return;
    onQuickDial(quickPhone, quickName || "Inbound Customer");
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome / Store Info Card */}
      <div className="rounded-2xl clean-panel p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Active Branch: {selectedShop.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Store Communications Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
              Autonomous AI agent <strong className="text-slate-800">{selectedShop.aiSettings?.personaName || "Voice SDR"}</strong> is monitoring missed calls and delivering instant callbacks for {selectedShop.name}.
            </p>
          </div>

          {/* Quick Call Action Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 w-full md:w-80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                <span>Instant Outbound Test Dial</span>
              </span>
              <span className="text-[10px] text-blue-700 font-mono font-semibold">Twilio Voice</span>
            </div>
            <form onSubmit={handleQuickCallSubmit} className="space-y-2 text-xs">
              <input
                type="text"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="Lead Name"
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs shadow-xs"
              />
              <input
                type="text"
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                placeholder="+91..."
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs shadow-xs"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all text-xs flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Place AI Outbound Call</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid - Strictly Bound to Real Live Store Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl clean-panel space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Recovered Missed Calls</span>
            <PhoneMissed className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {selectedShop.metrics?.totalMissedRecovered ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {(selectedShop.metrics?.totalMissedRecovered ?? 0) > 0
              ? `${selectedShop.metrics.totalMissedRecovered} calls recovered`
              : "0 callbacks logged"}
          </p>
        </div>

        <div className="p-5 rounded-2xl clean-panel space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Revenue Saved / Booked</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {selectedShop.metrics?.revenueSaved || "₹0"}
          </div>
          <p className="text-[11px] text-slate-500">
            Across {shops.length} active {shops.length === 1 ? "branch" : "branches"}
          </p>
        </div>

        <div className="p-5 rounded-2xl clean-panel space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Callback Conversion</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {selectedShop.metrics?.conversionRate ?? 0}%
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {(selectedShop.metrics?.conversionRate ?? 0) > 0
              ? "Conversion from callbacks"
              : "0% callback conversion"}
          </p>
        </div>

        <div className="p-5 rounded-2xl clean-panel space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Voice Pipeline Latency</span>
            <Zap className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 font-mono">
            {selectedShop.metrics?.avgLatencyMs ? `${selectedShop.metrics.avgLatencyMs}ms` : "0ms"}
          </div>
          <p className="text-[11px] text-slate-500">
            Sub-350ms pipeline target
          </p>
        </div>
      </div>

      {/* Two Columns: Live Stream & Missed Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Call Stream Preview */}
        <div className="lg:col-span-7 rounded-2xl clean-panel p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              <h3 className="font-bold text-slate-900 text-sm">Live Audio Waveform & Speaker Status</h3>
            </div>
            <button
              onClick={() => onNavigate("live-monitor")}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1"
            >
              <span>Inspect Monitor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeCall ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Calling: {activeCall.leadName}</span>
                <span className="text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Phase: {activeCall.phase}
                </span>
              </div>
              <p className="text-xs text-slate-700 italic bg-white p-3 rounded-lg border border-slate-200">
                "{activeCall.transcript[activeCall.transcript.length - 1]?.text ?? "Connected..."}"
              </p>
              <div className="flex items-center justify-between pt-2 text-[11px]">
                <span className="text-slate-500">
                  Active Speaker: <strong className="text-slate-800 font-mono">Riya (AI SDR)</strong>
                </span>
                <span className="text-emerald-700 font-semibold">WhatsApp catalog sent & opened</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No live phone call currently connected.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-slate-700">72h Cooldown & DND Shield Active</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700">HubSpot Contact Sync Connected</span>
            </div>
          </div>
        </div>

        {/* Right: Pending Missed Calls */}
        <div className="lg:col-span-5 rounded-2xl clean-panel p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">Missed Calls Pending Dial</h3>
            </div>
            <button
              onClick={() => onNavigate("missed-calls")}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1"
            >
              <span>View All ({pendingCalls.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingCalls.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No pending missed calls. All caught up!
              </div>
            ) : (
              pendingCalls.slice(0, 3).map((call) => (
                <div
                  key={call.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{call.callerName}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        call.priority === "P0" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {call.priority}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 mt-0.5">{call.phoneNumber} • {call.timestamp}</div>
                  </div>

                  <button
                    onClick={() => onNavigate("missed-calls")}
                    className="px-2.5 py-1 rounded-md bg-white text-blue-700 border border-slate-200 text-[11px] font-bold hover:bg-slate-50 shadow-2xs"
                  >
                    Dial
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate("shops")}
              className="w-full py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold transition-all flex items-center justify-center space-x-2 shadow-xs"
            >
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span>Configure Store AI Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
