import React, { useState } from "react";
import { 
  PhoneMissed, 
  Play, 
  Pause, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Filter, 
  CheckCircle,
  Plus,
  Flame,
  UserCheck
} from "lucide-react";
import { MissedCall, Shop } from "../types";

interface MissedCallQueueProps {
  selectedShop: Shop | null;
  missedCalls: MissedCall[];
  onTriggerCall: (call: MissedCall) => void;
  onAddMissedCall: (newCall: MissedCall) => void;
  autoDialActive: boolean;
  onToggleAutoDial: () => void;
}

export const MissedCallQueue: React.FC<MissedCallQueueProps> = ({
  selectedShop,
  missedCalls,
  onTriggerCall,
  onAddMissedCall,
  autoDialActive,
  onToggleAutoDial,
}) => {
  const [filterPriority, setFilterPriority] = useState<"ALL" | "P0" | "P1" | "P2">("ALL");
  const [simPhone, setSimPhone] = useState("");
  const [simName, setSimName] = useState("");
  const [showSimModal, setShowSimModal] = useState(false);

  if (!selectedShop) {
    return (
      <div className="py-16 text-center clean-panel rounded-2xl max-w-xl mx-auto p-8 space-y-3">
        <h3 className="text-lg font-bold text-slate-800">No Store Selected</h3>
        <p className="text-xs text-slate-500">Please create or select an active store branch to inspect its missed call queue.</p>
      </div>
    );
  }

  const shopCalls = missedCalls.filter((c) => c.shopId === selectedShop.id);
  const filteredCalls = shopCalls.filter((c) => {
    if (filterPriority === "ALL") return true;
    return c.priority === filterPriority;
  });

  const pendingCount = shopCalls.filter((c) => c.status === "pending").length;
  const p0Count = shopCalls.filter((c) => c.priority === "P0" && c.status === "pending").length;

  const handleSimulateMissedCall = (e: React.FormEvent) => {
    e.preventDefault();
    const newCall: MissedCall = {
      id: "call_m_" + Math.random().toString(36).substring(2, 8),
      shopId: selectedShop.id,
      shopName: selectedShop.name,
      phoneNumber: simPhone || "+91 84319 80422",
      callerName: simName || "Live Inbound Customer",
      timestamp: "Just now (< 30s ago)",
      priority: "P0",
      status: "pending",
    };
    onAddMissedCall(newCall);
    setShowSimModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Regulator Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Missed Call Regulation Queue
            </h2>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {pendingCount} Pending Recovery
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              🔒 Scoped to {selectedShop.name.split("-")[0]}
            </span>
            {p0Count > 0 && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>{p0Count} P0 VIP Urgent Calls</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming customer rings missed at <strong className="text-slate-800">{selectedShop.name}</strong> are prioritized by intent, checked against 72h anti-spam cooldown, and dialed.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSimModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs text-slate-800 font-semibold transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Simulate Incoming Missed Call</span>
          </button>

          <button
            onClick={onToggleAutoDial}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-xs ${
              autoDialActive
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {autoDialActive ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Auto-Dialer</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Resume Auto-Dialer (P0 First)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Enterprise Guarantees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl clean-panel flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">72-Hour Anti-Spam Cooldown</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Blocks repeat dials within 72 hours to prevent carrier spam flags and Truecaller negative ratings.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl clean-panel flex items-start space-x-3">
          <Flame className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">P0 Inbound Queue Jumping</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Fresh missed calls (&lt; 2 mins old) bypass background queues for an immediate sub-30s callback.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl clean-panel flex items-start space-x-3">
          <UserCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Per-Store Database Storage</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Call summaries, customer objections, and WhatsApp delivery logs are stored in this outlet's database.
            </p>
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Priority Filter:</span>
          </span>
          {(["ALL", "P0", "P1", "P2"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-1 rounded-md font-mono text-xs transition-colors ${
                filterPriority === p
                  ? "bg-slate-900 text-white font-bold"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Auto-Pacing: <span className="text-slate-800 font-bold">{selectedShop.aiSettings.callPacingSeconds}s</span> between calls
        </div>
      </div>

      {/* Missed Calls Table */}
      <div className="rounded-2xl clean-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Caller / Customer</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Missed At</th>
                <th className="py-3 px-4">Cooldown & Compliance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Autonomous Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No missed calls found matching this priority filter.
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Priority Tier */}
                    <td className="py-3 px-4">
                      {call.priority === "P0" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1 w-max">
                          <Flame className="w-3 h-3 text-rose-600" />
                          <span>P0 (URGENT)</span>
                        </span>
                      )}
                      {call.priority === "P1" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 w-max block font-mono">
                          P1 (WARM)
                        </span>
                      )}
                      {call.priority === "P2" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 w-max block font-mono">
                          P2 (STANDARD)
                        </span>
                      )}
                    </td>

                    {/* Caller Name */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {call.callerName}
                    </td>

                    {/* Phone Number */}
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {call.phoneNumber}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{call.timestamp}</span>
                    </td>

                    {/* Cooldown Status */}
                    <td className="py-3 px-4">
                      {call.status === "cooldown_blocked" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1 w-max">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>{call.cooldownUntil ?? "Cooldown Active"}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1 w-max">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Verified • Ready to Call</span>
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {call.status === "pending" && (
                        <span className="text-amber-700 font-semibold text-[11px] flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>In Queue</span>
                        </span>
                      )}
                      {call.status === "dialing" && (
                        <span className="text-blue-700 font-bold text-[11px] flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                          <span>Dialing Now...</span>
                        </span>
                      )}
                      {call.status === "completed" && (
                        <span className="text-emerald-700 font-semibold text-[11px]">
                          ✓ Completed ({call.outcome === "booked" ? "Deal Booked" : "Follow-Up Sent"})
                        </span>
                      )}
                      {call.status === "cooldown_blocked" && (
                        <span className="text-slate-400 text-[11px]">
                          Skipped by Guard
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      {call.status === "pending" ? (
                        <button
                          onClick={() => onTriggerCall(call)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition-all flex items-center space-x-1 ml-auto"
                        >
                          <Play className="w-3.5 h-3.5 text-blue-600" />
                          <span>Dial with AI</span>
                        </button>
                      ) : call.status === "completed" ? (
                        <span className="text-[11px] font-mono text-slate-500">
                          {call.duration} • Score: {call.scoreBand}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">No Action</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <PhoneMissed className="w-5 h-5 text-rose-600" />
              <span>Simulate Customer Inbound Missed Call</span>
            </h3>
            <p className="text-xs text-slate-500">
              Enqueues an incoming missed ring for <strong className="text-slate-800">{selectedShop.name}</strong> to watch the AI prioritize it as P0 and trigger the callback!
            </p>

            <form onSubmit={handleSimulateMissedCall} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Caller Name</label>
                <input
                  type="text"
                  required
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Caller Phone Number</label>
                <input
                  type="text"
                  required
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs"
                >
                  Enqueue as P0 Urgent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
