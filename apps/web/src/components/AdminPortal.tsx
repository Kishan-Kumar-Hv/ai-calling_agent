import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  PhoneCall,
  MessageSquare,
  Clock,
  Sparkles,
  Play,
  Pause,
  Download,
  Store,
  Users,
  TrendingUp,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  X,
  Volume2,
  Calendar,
  Send,
  Zap,
  FileText,
  CheckSquare,
  Phone,
} from "lucide-react";
import { AdminTalk, AdminStats } from "../types";
import { api } from "../api/client";
import { downloadCallReportPdf } from "../utils/pdfGenerator";

export const AdminPortal: React.FC = () => {
  const [talks, setTalks] = useState<AdminTalk[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState("ALL");
  const [selectedOutcome, setSelectedOutcome] = useState("ALL");
  const [selectedScoreBand, setSelectedScoreBand] = useState("ALL");

  // Selected Talk for Inspection Drawer
  const [selectedTalk, setSelectedTalk] = useState<AdminTalk | null>(null);

  // Audio Player State Simulation
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5>(1);

  const fetchPlatformData = async () => {
    try {
      setError(null);
      const [talksData, statsData] = await Promise.all([
        api.getAdminTalks({
          search: searchQuery || undefined,
          shopName: selectedStore !== "ALL" ? selectedStore : undefined,
          outcome: selectedOutcome !== "ALL" ? selectedOutcome : undefined,
          scoreBand: selectedScoreBand !== "ALL" ? selectedScoreBand : undefined,
        }),
        api.getAdminStats(),
      ]);

      setTalks(talksData);
      setStats(statsData);

      // Auto-select first talk if none selected or if previously selected is gone
      if (!selectedTalk && talksData.length > 0) {
        setSelectedTalk(talksData[0]);
      }
    } catch (err: any) {
      console.error("[AdminPortal] fetch error:", err);
      setError(err.message || "Failed to fetch platform talks");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, [selectedStore, selectedOutcome, selectedScoreBand]);

  // Audio simulation timer
  useEffect(() => {
    let interval: any = null;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 2 * playbackSpeed;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio, playbackSpeed]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPlatformData();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlatformData();
  };

  // Extract unique store names for filter dropdown
  const storeNames = Array.from(new Set(talks.map((t) => t.shopName))).filter(Boolean);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner / Super Admin Notice */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Super Admin Audit View
            </span>
            <p className="text-xs text-slate-300">
              Cross-Tenant Central Audit: Viewing all stores, audio streams, and transcripts across MongoDB Atlas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Atlas Sync Active
            </div>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-md border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Platform Conversation Audits
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Inspect multi-turn AI dialogues, Hinglish code-switching, detected buyer entities, and booking outcomes across all client stores.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const jsonStr = JSON.stringify(talks, null, 2);
                const blob = new Blob([jsonStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `involynk-platform-talks-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
              }}
              className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export Platform Logs
            </button>
          </div>
        </div>

        {/* Global Platform KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Talks</span>
              <PhoneCall className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats?.totalCalls ?? talks.length}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> Dialed Outbound
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Stores</span>
              <Store className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats?.totalStores ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Live in Atlas</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Conversion</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats?.overallConversionRate ?? 0}%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Booked / Follow-up</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Revenue Saved</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats?.totalRevenueBooked ?? "₹0"}</div>
            <div className="text-xs text-slate-500 mt-1">Recovered orders</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Avg Latency</span>
              <Zap className="w-4 h-4 text-violet-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats?.avgConversationalLatency ?? "0ms"}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Sub-350ms pipeline</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">TRAI Guard</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">{stats?.traiComplianceScore ?? "100%"}</div>
            <div className="text-xs text-slate-500 mt-1">Zero violations</div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search across all talks by customer name, phone, outlet, or intent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5" />
                Filters:
              </div>

              {/* Store Filter */}
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Stores & Chains</option>
                {storeNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Outcome Filter */}
              <select
                value={selectedOutcome}
                onChange={(e) => setSelectedOutcome(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Outcomes</option>
                <option value="booked">Booked (Converted)</option>
                <option value="follow_up">Follow-Up Required</option>
                <option value="escalated">Escalated to Human</option>
                <option value="not_interested">Not Interested</option>
              </select>

              {/* Lead Score Filter */}
              <select
                value={selectedScoreBand}
                onChange={(e) => setSelectedScoreBand(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Score Bands</option>
                <option value="HOT">HOT Lead 🔥</option>
                <option value="WARM">WARM Lead ⚡</option>
                <option value="COLD">COLD Lead ❄️</option>
              </select>

              {(searchQuery || selectedStore !== "ALL" || selectedOutcome !== "ALL" || selectedScoreBand !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStore("ALL");
                    setSelectedOutcome("ALL");
                    setSelectedScoreBand("ALL");
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content: Split Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Talks Table / List (7 columns on desktop) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Platform Talks Stream</h2>
                <p className="text-xs text-slate-500">Showing {talks.length} recorded conversations from live database</p>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Live Turn Audits
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-500">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-3" />
                <p className="text-sm font-medium">Fetching conversation audits from Atlas...</p>
              </div>
            ) : talks.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-700">No talks match your filter criteria</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting the filters or search query.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {talks.map((talk) => {
                  const isSelected = selectedTalk?.id === talk.id || selectedTalk?.callSid === talk.callSid;
                  return (
                    <div
                      key={talk.id || talk.callSid}
                      onClick={() => {
                        setSelectedTalk(talk);
                        setIsPlayingAudio(false);
                        setAudioProgress(0);
                      }}
                      className={`p-4 cursor-pointer transition hover:bg-slate-50/80 ${
                        isSelected ? "bg-blue-50/50 border-l-4 border-blue-600" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-slate-900 truncate">
                              {talk.leadName}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {talk.leadPhoneNumber}
                            </span>
                            {talk.scoreBand === "HOT" && (
                              <span className="inline-flex items-center text-[10px] font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                                HOT 🔥
                              </span>
                            )}
                            {talk.scoreBand === "WARM" && (
                              <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                WARM ⚡
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 font-medium mb-1.5 flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{talk.shopName}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400 text-[11px]">Owner: {talk.ownerName}</span>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-1 italic">
                            "{talk.transcript?.[talk.transcript.length - 1]?.text || 'Call completed'}"
                          </p>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0">
                          {talk.callOutcome === "booked" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Booked
                            </span>
                          )}
                          {talk.callOutcome === "follow_up" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              Follow Up
                            </span>
                          )}
                          {talk.callOutcome === "escalated" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              Escalated
                            </span>
                          )}

                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>{formatDuration(talk.durationSec)}</span>
                            {talk.whatsAppPushed && (
                              <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-emerald-200">
                                WhatsApp ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Conversation Inspector (5 columns on desktop) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            {selectedTalk ? (
              <div>
                {/* Inspector Header */}
                <div className="p-5 border-b border-slate-200 bg-slate-50/70">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
                        SID: {selectedTalk.callSid}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {selectedTalk.leadName}
                      </h3>
                      <p className="text-xs text-slate-500">{selectedTalk.leadPhoneNumber}</p>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider text-blue-700 bg-blue-100 border border-blue-200">
                        Phase: {selectedTalk.phase}
                      </span>
                      <button
                        onClick={() =>
                          downloadCallReportPdf({
                            shopName: selectedTalk.shopName,
                            leadName: selectedTalk.leadName,
                            leadPhoneNumber: selectedTalk.leadPhoneNumber,
                            callSid: selectedTalk.callSid,
                            duration: selectedTalk.durationSec,
                            outcome: selectedTalk.callOutcome,
                            scoreBand: selectedTalk.scoreBand,
                            callNotes: selectedTalk.callNotes,
                            actionItems: selectedTalk.actionItems,
                            objectionsRaised: selectedTalk.objectionsRaised,
                            extractedEntities: selectedTalk.extractedEntities,
                            transcript: selectedTalk.transcript,
                            date: new Date(selectedTalk.createdAt).toLocaleString(),
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition"
                        title="Export Full Call Audit as PDF"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export PDF</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200/80">
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">{selectedTalk.shopName}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {new Date(selectedTalk.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>

                {/* Simulated Audio Player Visualizer */}
                <div className="p-4 bg-slate-900 text-white border-b border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                      HQ Call Audio Recording
                    </span>
                    <div className="flex items-center gap-1">
                      {([1, 1.25, 1.5] as const).map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setPlaybackSpeed(spd)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            playbackSpeed === spd
                              ? "bg-blue-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Waveform Bar Simulation */}
                  <div className="flex items-center gap-1 h-8 mb-3 px-1">
                    {Array.from({ length: 32 }).map((_, i) => {
                      const heights = [30, 60, 40, 80, 95, 45, 70, 85, 30, 50, 90, 65, 40, 75, 100, 50, 35, 70, 85, 40, 60, 90, 45, 80, 30, 65, 95, 40, 55, 75, 35, 50];
                      const height = heights[i % heights.length];
                      const isPlayed = (i / 32) * 100 <= audioProgress;
                      return (
                        <div
                          key={i}
                          style={{ height: `${height}%` }}
                          className={`w-1 rounded-full transition-all ${
                            isPlayed ? "bg-blue-500" : "bg-slate-700"
                          }`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    >
                      {isPlayingAudio ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" /> Pause Recording
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" /> Play Call Recording
                        </>
                      )}
                    </button>
                    <span className="text-xs text-slate-400 font-mono">
                      {formatDuration(Math.round((selectedTalk.durationSec * audioProgress) / 100))} / {formatDuration(selectedTalk.durationSec)}
                    </span>
                  </div>
                </div>

                {/* Structured Intelligence & Entity Extraction Card */}
                <div className="p-4 bg-blue-50/60 border-b border-blue-100">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    AI Extracted Intelligence
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Intent</span>
                      <span className="font-medium text-slate-800">
                        {selectedTalk.extractedEntities?.intent || "General Ingestion"}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Budget Signal</span>
                      <span className="font-medium text-slate-800">
                        {selectedTalk.extractedEntities?.budgetSignal || "Undisclosed"}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Party / Team Size</span>
                      <span className="font-medium text-slate-800">
                        {selectedTalk.extractedEntities?.teamSize || "Single Lead"}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Timeline</span>
                      <span className="font-medium text-slate-800">
                        {selectedTalk.extractedEntities?.timeline || "Standard"}
                      </span>
                    </div>
                  </div>

                  {selectedTalk.whatsAppPushed && (
                    <div className="mt-2.5 flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Send className="w-3 h-3 text-emerald-600" />
                        Mid-Call WhatsApp Brochure Pushed
                      </span>
                      <span className="text-[10px] font-semibold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                        Opened by Client
                      </span>
                    </div>
                  )}

                  {/* Executive Call Notes & Summary */}
                  {selectedTalk.callNotes && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100 shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500 font-mono">
                        <FileText className="w-3 h-3 text-blue-600" />
                        <span>AI Executive Call Notes</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {selectedTalk.callNotes}
                      </p>
                    </div>
                  )}

                  {/* Action Items */}
                  {selectedTalk.actionItems && selectedTalk.actionItems.length > 0 && (
                    <div className="mt-2.5 p-3 bg-emerald-50/70 rounded-lg border border-emerald-100 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-800 font-mono">
                        <CheckSquare className="w-3 h-3 text-emerald-600" />
                        <span>Action Items & Next Steps</span>
                      </div>
                      <ul className="space-y-1">
                        {selectedTalk.actionItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Objections Handled */}
                  {selectedTalk.objectionsRaised && selectedTalk.objectionsRaised.length > 0 && (
                    <div className="mt-2.5 p-2.5 bg-amber-50/70 rounded-lg border border-amber-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-amber-800 font-mono">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Customer Objections Encountered</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedTalk.objectionsRaised.map((obj, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Twilio Telephony Line */}
                  {selectedTalk.twilioDetails && (
                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-blue-100">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-blue-600" />
                        Line: {selectedTalk.twilioDetails.outboundNumber || "+1-800-INVOLYNK"}
                      </span>
                      <span className="text-blue-700 font-bold capitalize">
                        {selectedTalk.twilioDetails.status || "Active"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Turn-by-Turn Speech Transcript */}
                <div className="p-4 max-h-[380px] overflow-y-auto space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Turn-By-Turn Speech Audit
                  </div>

                  {selectedTalk.transcript?.map((turn, idx) => {
                    const isAgent = turn.speaker === "agent";
                    return (
                      <div
                        key={idx}
                        className={`flex gap-2.5 ${isAgent ? "items-start" : "items-start flex-row-reverse"}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isAgent
                              ? "bg-blue-600 text-white"
                              : "bg-slate-700 text-white"
                          }`}
                        >
                          {isAgent ? "AI" : "C"}
                        </div>

                        <div
                          className={`max-w-[82%] rounded-xl p-3 text-xs leading-relaxed ${
                            isAgent
                              ? "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                              : "bg-blue-600 text-white rounded-tr-none"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <span className={`text-[10px] font-bold ${isAgent ? "text-blue-700" : "text-blue-100"}`}>
                              {isAgent ? "Involynk Voice Agent" : selectedTalk.leadName}
                            </span>
                            <span className={`text-[10px] font-mono ${isAgent ? "text-slate-400" : "text-blue-200"}`}>
                              {turn.timestamp}
                            </span>
                          </div>
                          <p>{turn.text}</p>

                          {turn.entities && turn.entities.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {turn.entities.map((ent, eIdx) => (
                                <span
                                  key={eIdx}
                                  className="text-[9px] font-semibold bg-white/20 text-white px-1.5 py-0.5 rounded"
                                >
                                  {ent}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">Select any conversation from the list to inspect audio & transcript</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

