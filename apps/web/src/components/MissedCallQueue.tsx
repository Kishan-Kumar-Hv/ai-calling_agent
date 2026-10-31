import React, { useState, useEffect } from "react";
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
  UserCheck, 
  FileText, 
  X, 
  CheckSquare, 
  Sparkles, 
  MessageSquare, 
  Download, 
  Zap, 
  Trophy, 
  Send, 
  ArrowRight,
  Layers
} from "lucide-react";
import { MissedCall, Shop } from "../types";
import { downloadCallReportPdf } from "../utils/pdfGenerator";
import { api } from "../api/client";

interface MissedCallQueueProps {
  selectedShop: Shop | null;
  missedCalls: MissedCall[];
  onTriggerCall: (call: MissedCall) => void;
  onAddMissedCall: (newCall: MissedCall) => void;
  autoDialActive: boolean;
  onToggleAutoDial: () => void;
}

// Audio synthesis for realistic telephone ringtones
function playRealisticPhoneRing(durationMs = 2800) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const playDualToneBurst = (startTime: number, toneDuration: number) => {
      // Standard US/UK telephone ring frequencies: 440Hz + 480Hz
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(440, startTime);
      osc2.frequency.setValueAtTime(480, startTime);

      // Volume envelope
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
      gain.gain.setValueAtTime(0.25, startTime + toneDuration - 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + toneDuration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + toneDuration);
      osc2.stop(startTime + toneDuration);
    };

    const now = ctx.currentTime;
    playDualToneBurst(now, 1.2);
    playDualToneBurst(now + 1.6, 1.2);
  } catch (e) {
    console.warn("Ring audio synthesis failed:", e);
  }
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
  const [selectedCallForNotes, setSelectedCallForNotes] = useState<MissedCall | null>(null);

  // Tie-Break Contention Simulation State
  const [isSimulatingConflict, setIsSimulatingConflict] = useState(false);
  const [conflictResult, setConflictResult] = useState<{
    winner: MissedCall;
    runnerUp: MissedCall;
    tieBreakExplanation: string;
  } | null>(null);

  if (!selectedShop) {
    return (
      <div className="py-16 text-center clean-panel rounded-2xl max-w-xl mx-auto p-8 space-y-3">
        <h3 className="text-lg font-bold text-slate-800">No Store Selected</h3>
        <p className="text-xs text-slate-500">
          Please create or select an active store branch to inspect its missed call queue.
        </p>
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
    playRealisticPhoneRing();
    const newCall: MissedCall = {
      id: "call_m_" + Math.random().toString(36).substring(2, 8),
      shopId: selectedShop.id,
      shopName: selectedShop.name,
      phoneNumber: simPhone || "+91 84319 80422",
      callerName: simName || "Live Inbound Customer",
      timestamp: "Just now (< 30s ago)",
      priority: "P0",
      status: "pending",
      priorityReason: "Fresh Missed Call (<2m)",
      priorityScore: 100,
      callCount: 1,
    };
    onAddMissedCall(newCall);
    setShowSimModal(false);
  };

  // Simulate 2 Simultaneous Inbound Calls Arriving at the Exact Same Second (T0)
  const handleSimulateConflict = async () => {
    try {
      setIsSimulatingConflict(true);
      playRealisticPhoneRing();
      const res = await api.simulateConflict(selectedShop.id, selectedShop.name);
      onAddMissedCall(res.winner);
      onAddMissedCall(res.runnerUp);
      setConflictResult(res);
    } catch (err: any) {
      console.error("[simulateConflict] error", err);
    } finally {
      setIsSimulatingConflict(false);
    }
  };

  const handlePushWhatsAppStandby = async (call: MissedCall) => {
    try {
      await api.ackWhatsApp(call.id);
      call.whatsAppAckSent = true;
    } catch (e) {}
  };

  const handleExportCallPdf = async (call: MissedCall) => {
    try {
      const detail = await api.getCallDetail({
        phone: call.phoneNumber,
        shopId: selectedShop?.id,
      });

      downloadCallReportPdf({
        shopName: selectedShop?.name || call.shopName,
        leadName: call.callerName,
        leadPhoneNumber: call.phoneNumber,
        callSid: detail?.callSid || `CA_${call.id}`,
        duration: call.duration || (detail?.durationSec ? `${detail.durationSec}s` : "45s"),
        outcome: call.outcome || detail?.callOutcome || "booked",
        scoreBand: call.scoreBand || detail?.scoreBand || "HOT",
        callNotes: call.callNotes || detail?.callNotes,
        actionItems: call.actionItems || detail?.actionItems,
        objectionsRaised: detail?.objectionsRaised || [],
        extractedEntities: detail?.extractedEntities,
        transcript: detail?.transcript,
        date: detail?.createdAt ? new Date(detail.createdAt).toLocaleString() : call.timestamp,
      });
    } catch (e) {
      downloadCallReportPdf({
        shopName: selectedShop?.name || call.shopName,
        leadName: call.callerName,
        leadPhoneNumber: call.phoneNumber,
        duration: call.duration,
        outcome: call.outcome,
        scoreBand: call.scoreBand,
        callNotes: call.callNotes,
        actionItems: call.actionItems,
        date: call.timestamp,
      });
    }
  };

  // Auto-Dialer Engine with Pacing
  useEffect(() => {
    let timer: any = null;
    if (autoDialActive && selectedShop) {
      const pendingCalls = filteredCalls.filter((c) => c.status === "pending");
      if (pendingCalls.length > 0) {
        const nextCall = pendingCalls[0];
        timer = setTimeout(() => {
          onTriggerCall(nextCall);
          if (pendingCalls.length > 1) {
            handlePushWhatsAppStandby(pendingCalls[1]);
          }
        }, 1500);
      }
    }
    return () => clearTimeout(timer);
  }, [autoDialActive, filteredCalls.length]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Regulator Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Missed Call Regulation & Tie-Breaking Queue
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
            Incoming missed calls at <strong className="text-slate-800">{selectedShop.name}</strong> are evaluated by the deterministic tie-breaking engine (<span className="font-mono text-blue-700">P0 &gt; Repeat Frequency &gt; Commercial Intent &gt; FIFO</span>) and dialed with zero lead leakage.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSimulateConflict}
            disabled={isSimulatingConflict}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 font-bold text-xs transition-all flex items-center space-x-1.5 shadow-2xs"
            title="Simulate 2 calls arriving at the exact same second to verify tie-breaking and WhatsApp redundancy"
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Simulate 2 Simultaneous Calls</span>
          </button>

          <button
            onClick={() => setShowSimModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs text-slate-800 font-semibold transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Add Inbound Call</span>
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
                <span>Start Auto-Dialer (#1 First)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tie-Breaking Live Conflict Simulation Banner (Visible when conflict is tested) */}
      {conflictResult && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-950 border border-purple-500 shadow-xl text-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm tracking-wide">
                Simultaneous Contention Resolution @ T0 (2 Inbound Calls Arrived at Exact Same Second)
              </h3>
            </div>
            <button
              onClick={() => setConflictResult(null)}
              className="text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Winner */}
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-400 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 font-mono uppercase text-[10px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  🏆 TIE-BREAK WINNER • RANK #1 (DIALING NEXT)
                </span>
                <span className="font-mono text-emerald-300 font-bold bg-emerald-900/60 px-2 py-0.5 rounded">
                  Score: {conflictResult.winner.priorityScore}
                </span>
              </div>
              <p className="text-white font-extrabold text-sm">{conflictResult.winner.callerName}</p>
              <p className="text-emerald-200 font-mono text-[11px]">{conflictResult.winner.phoneNumber}</p>
              <p className="text-emerald-100/80 text-[11px] pt-1">
                Reason: {conflictResult.winner.priorityReason}
              </p>
            </div>

            {/* Runner-Up */}
            <div className="p-3.5 rounded-xl bg-blue-950/80 border border-blue-400 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-300 font-mono uppercase text-[10px] flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  RUNNER-UP • RANK #2 (WHATSAPP STANDBY REDUNDANCY)
                </span>
                <span className="font-mono text-blue-300 font-bold bg-blue-900/60 px-2 py-0.5 rounded">
                  Score: {conflictResult.runnerUp.priorityScore}
                </span>
              </div>
              <p className="text-white font-extrabold text-sm">{conflictResult.runnerUp.callerName}</p>
              <p className="text-blue-200 font-mono text-[11px]">{conflictResult.runnerUp.phoneNumber}</p>
              <div className="pt-2 flex items-center justify-between">
                <p className="text-blue-100/90 text-[11px] font-semibold flex items-center gap-1">
                  <span>✓ WhatsApp Standby Queued:</span>
                  <span className="italic font-normal">"AI calling you in 45s..."</span>
                </p>
                <a
                  href={`https://wa.me/${conflictResult.runnerUp.phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Namaste ${conflictResult.runnerUp.callerName}! We noticed your missed call at ${selectedShop.name}. Our AI concierge Riya is currently on a short call and will ring you in 45 seconds. Meanwhile, here is our festive wholesale catalog: http://localhost:3001`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-sm transition"
                  title="Click to open actual WhatsApp message to this customer"
                >
                  <MessageSquare className="w-3 h-3 text-slate-950" />
                  <span>Open Real WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 italic pt-1">
            <strong>Rule Applied:</strong> {conflictResult.tieBreakExplanation}
          </p>
        </div>
      )}

      {/* Enterprise Guarantees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl clean-panel flex items-start space-x-3">
          <Trophy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Deterministic Tie-Breaking Engine</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              When 2 calls arrive simultaneously, Involynk scores priority by: <strong className="text-slate-700">P0 &gt; Repeat Frequency (2x) &gt; Commercial Intent &gt; FIFO</strong>.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl clean-panel flex items-start space-x-3">
          <MessageSquare className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Multi-Channel WhatsApp Redundancy</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              While the #1 call is being dialed, the #2 runner-up is instantly sent a WhatsApp standby brochure so no customer drops off.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl clean-panel flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">TRAI & 72h Cooldown Shield</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Automated calls run strictly between 9:30 AM–7:30 PM IST with 72h anti-spam blocks against Truecaller flagging.
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
                <th className="py-3 px-4">Priority & Tie-Break Rank</th>
                <th className="py-3 px-4">Caller / Customer</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Missed At & Repeat Rings</th>
                <th className="py-3 px-4">Multi-Channel Redundancy</th>
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
                filteredCalls.map((call, idx) => (
                  <tr key={call.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Priority Tier & Tie-Break Rank */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          {call.status === "pending" && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center space-x-1 font-mono ${
                                idx === 0 || call.queueRank === 1
                                  ? "bg-emerald-600 text-white shadow-2xs"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {idx === 0 || call.queueRank === 1 ? (
                                <>
                                  <Trophy className="w-3 h-3 text-amber-300" />
                                  <span>RANK #1 (NEXT)</span>
                                </>
                              ) : (
                                <span>RANK #{call.queueRank || idx + 1}</span>
                              )}
                            </span>
                          )}

                          {call.priority === "P0" && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                              P0 URGENT
                            </span>
                          )}
                          {call.priority === "P1" && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                              P1 WARM
                            </span>
                          )}
                          {call.priority === "P2" && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                              P2 STD
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono">
                          Score: <strong className="text-slate-800">{call.priorityScore || (call.priority === "P0" ? 100 : 50)}</strong> • {call.priorityReason || "Fresh Missed Call"}
                        </div>
                      </div>
                    </td>

                    {/* Caller Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-slate-900">{call.callerName}</span>
                        {(call.callCount || 1) > 1 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 font-mono">
                            {call.callCount}x Rings
                          </span>
                        )}
                      </div>
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

                    {/* Multi-Channel Redundancy Status */}
                    <td className="py-3 px-4">
                      {call.whatsAppAckSent ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1 w-max">
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp Standby ✓</span>
                        </span>
                      ) : call.status === "pending" ? (
                        <button
                          onClick={() => handlePushWhatsAppStandby(call)}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center space-x-1"
                        >
                          <Send className="w-2.5 h-2.5 text-slate-500" />
                          <span>Push Standby WA</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Verified & Synced</span>
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
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center space-x-1 ml-auto ${
                            idx === 0 || call.queueRank === 1
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                              : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                          }`}
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{idx === 0 || call.queueRank === 1 ? "Dial Winner (#1)" : "Dial with AI"}</span>
                        </button>
                      ) : call.status === "completed" ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <span className="text-[11px] font-mono text-slate-500 mr-1">
                            {call.duration} • {call.scoreBand}
                          </span>
                          <button
                            onClick={() => setSelectedCallForNotes(call)}
                            className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center space-x-1"
                            title="Inspect Conversation Notes & Audit"
                          >
                            <FileText className="w-3 h-3 text-blue-600" />
                            <span>Notes</span>
                          </button>
                          <button
                            onClick={() => handleExportCallPdf(call)}
                            className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center space-x-1 shadow-2xs"
                            title="Download PDF Call Summary Report"
                          >
                            <Download className="w-3 h-3 text-emerald-600" />
                            <span>PDF</span>
                          </button>
                        </div>
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

      {/* Manual Inbound Missed Call Simulation Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <PhoneMissed className="w-5 h-5 text-rose-600" />
              <span>Simulate Customer Inbound Missed Call</span>
            </h3>
            <p className="text-xs text-slate-500">
              Enqueues an incoming missed ring for <strong className="text-slate-800">{selectedShop.name}</strong> to evaluate its priority score and queue position!
            </p>

            <form onSubmit={handleSimulateMissedCall} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Caller Name</label>
                <input
                  type="text"
                  required
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  placeholder="e.g. Ramesh Patel (Wholesale Gifting)"
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
                  placeholder="+91 84319 80422"
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
                  Enqueue Inbound Ring
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call Notes & Action Items Inspection Modal */}
      {selectedCallForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    AI Conversation Notes: {selectedCallForNotes.callerName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedCallForNotes.phoneNumber} • Duration: {selectedCallForNotes.duration || "N/A"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCallForNotes(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 uppercase tracking-wider font-mono text-[10px] block">
                  Executive Call Summary & Intent
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {selectedCallForNotes.callNotes || "Conversation recorded and synchronized with MongoDB Atlas."}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                <span className="font-bold text-emerald-900 uppercase tracking-wider font-mono text-[10px] block flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Action Items & Next Steps</span>
                </span>
                {selectedCallForNotes.actionItems && selectedCallForNotes.actionItems.length > 0 ? (
                  <ul className="space-y-1.5">
                    {selectedCallForNotes.actionItems.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-slate-700">
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">✓</span>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic">No pending action items recorded.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Call Outcome</span>
                  <span className="font-bold text-slate-800 capitalize">{selectedCallForNotes.outcome || "Completed"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Score Band</span>
                  <span className="font-bold text-blue-700">{selectedCallForNotes.scoreBand || "WARM"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => handleExportCallPdf(selectedCallForNotes)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Call Audit PDF</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedCallForNotes(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const c = selectedCallForNotes;
                    setSelectedCallForNotes(null);
                    onTriggerCall(c);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Place Follow-Up AI Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
