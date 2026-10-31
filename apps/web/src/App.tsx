import React, { useState, useEffect } from "react";
import { Navbar, NavView } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { HomePage } from "./components/HomePage";
import { FeaturesPage } from "./components/FeaturesPage";
import { AboutPage } from "./components/AboutPage";
import { LoginPage } from "./components/LoginPage";
import { DashboardOverview } from "./components/DashboardOverview";
import { ShopManagement } from "./components/ShopManagement";
import { MissedCallQueue } from "./components/MissedCallQueue";
import { LiveCallMonitor } from "./components/LiveCallMonitor";
import { AdminPortal } from "./components/AdminPortal";
import { CatalogManager } from "./components/CatalogManager";
import { 
  initialUser, 
  initialShops, 
  initialMissedCalls, 
  initialActiveCall 
} from "./data/mockData";
import { User, Shop, MissedCall, LiveCallSession } from "./types";
import { api } from "./api/client";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [missedCalls, setMissedCalls] = useState<MissedCall[]>([]);
  const [activeCall, setActiveCall] = useState<LiveCallSession | null>(null);
  const [currentView, setCurrentView] = useState<NavView>("home");
  const [autoDialActive, setAutoDialActive] = useState(true);

  // Restore session from localStorage & verify with server
  useEffect(() => {
    async function restoreSession() {
      const stored = api.getStoredUser();
      if (stored) {
        setUser(stored);
      }
      const verified = await api.getMe();
      if (verified) {
        setUser(verified);
      }
    }
    restoreSession();
  }, []);

  // Load private stores and missed calls when owner logs in
  useEffect(() => {
    if (!user) return;

    async function loadTenantData() {
      try {
        const userShops = await api.getShops();
        setShops(userShops || []);
        if (userShops && userShops.length > 0) {
          setSelectedShop(userShops[0]);
          const shopCalls = await api.getMissedCalls(userShops[0].id);
          setMissedCalls(shopCalls || []);
        } else {
          setSelectedShop(null);
          setMissedCalls([]);
        }
      } catch (err) {
        console.error("[app] error loading shops:", err);
        setShops([]);
        setSelectedShop(null);
        setMissedCalls([]);
      }
    }

    loadTenantData();
  }, [user]);

  // Load store-specific missed calls when switching stores
  useEffect(() => {
    if (!user || !selectedShop) return;
    const shopId = selectedShop.id;

    async function loadShopCalls() {
      try {
        const calls = await api.getMissedCalls(shopId);
        setMissedCalls(calls || []);
      } catch (err) {
        setMissedCalls([]);
      }
    }

    loadShopCalls();
  }, [selectedShop?.id]);

  // Trigger outbound call for a lead
  const handleTriggerCall = async (call: MissedCall) => {
    if (!selectedShop) return;
    setMissedCalls((prev) =>
      prev.map((c) => (c.id === call.id ? { ...c, status: "dialing" } : c))
    );

    const newSession: LiveCallSession = {
      callSid: "CA_" + Math.random().toString(36).substring(2, 10),
      shopId: selectedShop.id,
      shopName: selectedShop.name,
      leadName: call.callerName,
      leadPhoneNumber: call.phoneNumber,
      activeSpeaker: "agent",
      phase: "GREETING",
      sentiment: "curious",
      scoreBand: "WARM",
      durationSec: 3,
      whatsAppPushed: false,
      whatsAppOpened: false,
      supervisorListening: false,
      extractedEntities: {
        companyName: call.callerName + " Store",
        timeline: "Diwali Season (Immediate)",
        budgetSignal: "Flexible",
      },
      callNotes: call.callNotes || `Inbound missed call callback initiated for ${call.callerName} (${call.phoneNumber}). Initializing discovery on customer inquiry.`,
      actionItems: call.actionItems && call.actionItems.length > 0 ? call.actionItems : [`Conduct discovery on customer inquiry`, `Qualify requirement timeline and budget`],
      objectionsRaised: [],
      twilioDetails: {
        outboundNumber: selectedShop.twilioConfig?.enabled && selectedShop.twilioConfig?.phoneNumber ? selectedShop.twilioConfig.phoneNumber : "Browser Audio Gateway (+1-800-INVOLYNK)",
        status: "in-progress"
      },
      transcript: [
        {
          id: "t_init",
          speaker: "agent",
          text: `Hello ${call.callerName}! This is ${selectedShop.aiSettings.personaName} calling from ${selectedShop.name}. We noticed we missed your call a moment ago—how may I assist you with your order today?`,
          timestamp: "00:02",
          sentiment: "positive",
        },
      ],
    };

    setActiveCall(newSession);
    setCurrentView("live-monitor");

    // Pure in-app simulation: do not place outbound PSTN phone calls to avoid ringing real physical phones
    // The conversation runs directly through your laptop microphone and speakers inside the app!
  };

  const handleEndCall = async () => {
    if (!activeCall) return;

    try {
      await api.saveCallRecord({
        shopId: selectedShop?.id,
        callSid: activeCall.callSid,
        leadName: activeCall.leadName,
        leadPhoneNumber: activeCall.leadPhoneNumber,
        phase: activeCall.phase,
        sentiment: activeCall.sentiment,
        scoreBand: activeCall.scoreBand,
        durationSec: activeCall.durationSec,
        callOutcome: activeCall.scoreBand === "HOT" ? "booked" : "follow_up",
        transcript: activeCall.transcript,
        extractedEntities: activeCall.extractedEntities,
        whatsAppPushed: activeCall.whatsAppPushed,
        callNotes: activeCall.callNotes,
        actionItems: activeCall.actionItems,
        objectionsRaised: activeCall.objectionsRaised,
        twilioDetails: activeCall.twilioDetails,
      });

      // Refresh stores so metrics are synced with MongoDB Atlas
      const refreshedShops = await api.getShops();
      setShops(refreshedShops || []);
      const updatedShop = refreshedShops.find((s) => s.id === selectedShop?.id);
      if (updatedShop) setSelectedShop(updatedShop);

      // Refresh missed calls from MongoDB Atlas
      if (selectedShop?.id) {
        const refreshedCalls = await api.getMissedCalls(selectedShop.id);
        setMissedCalls(refreshedCalls || []);
      }
    } catch (err) {
      console.warn("[app] Failed to save call record:", err);
    }

    setMissedCalls((prev) =>
      prev.map((c) =>
        c.phoneNumber === activeCall.leadPhoneNumber
          ? {
              ...c,
              status: "completed",
              duration: `${Math.floor(activeCall.durationSec / 60)}m ${activeCall.durationSec % 60}s`,
              outcome: activeCall.scoreBand === "HOT" ? "booked" : "follow_up",
              scoreBand: activeCall.scoreBand,
            }
          : c
      )
    );

    setActiveCall(null);
  };

  const handleTriggerWhatsAppMidCall = () => {
    if (!activeCall) return;
    setActiveCall((prev) =>
      prev
        ? {
            ...prev,
            whatsAppPushed: true,
            whatsAppOpened: true,
            transcript: [
              ...prev.transcript,
              {
                id: "t_wa_" + Date.now(),
                speaker: "agent",
                text: `Maine just abhi aapke WhatsApp pe hamara catalog aur exclusive booking link bhej diya hai! You can review it right on your phone screen.`,
                timestamp: "00:46",
                sentiment: "positive",
              },
            ],
          }
        : null
    );
  };

  const handleSupervisorWhisper = (msg: string) => {
    if (!activeCall) return;
    setActiveCall((prev) =>
      prev
        ? {
            ...prev,
            supervisorListening: true,
            transcript: [
              ...prev.transcript,
              {
                id: "t_whisp_" + Date.now(),
                speaker: "agent",
                text: `[Supervisor Injected Tip]: "${msg}"`,
                timestamp: "00:52",
                sentiment: "positive",
              },
            ],
          }
        : null
    );
  };

  const handleTransferToHuman = () => {
    if (!activeCall) return;
    const transferNum = selectedShop?.aiSettings?.transferNumber || "Store Manager";
    alert(`Transferring live call ${activeCall.callSid} directly to Manager number: ${transferNum}`);
    handleEndCall();
  };

  // Add store with backend persistence
  const handleAddShop = async (newShop: Shop) => {
    try {
      const saved = await api.createShop(newShop);
      setShops((prev) => [saved, ...prev]);
      setSelectedShop(saved);
    } catch (e) {
      setShops((prev) => [newShop, ...prev]);
      setSelectedShop(newShop);
    }
  };

  // Update store with backend persistence
  const handleUpdateShop = async (updated: Shop) => {
    try {
      const saved = await api.updateShop(updated.id, updated);
      setShops((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      if (selectedShop?.id === saved.id) setSelectedShop(saved);
    } catch (e) {
      setShops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (selectedShop?.id === updated.id) setSelectedShop(updated);
    }
  };

  // Enqueue missed call with backend persistence
  const handleAddMissedCall = async (newCall: MissedCall) => {
    // If call already has an ID (e.g. from simulateConflict API), prepend immediately to avoid re-creation
    if (newCall.id && (newCall.id.startsWith("call_sim_") || newCall.id.length === 24)) {
      setMissedCalls((prev) => {
        const filtered = prev.filter((c) => c.id !== newCall.id);
        return [newCall, ...filtered];
      });
      return;
    }

    try {
      const saved = await api.createMissedCall(newCall);
      setMissedCalls((prev) => [saved, ...prev]);
    } catch (e) {
      setMissedCalls((prev) => [newCall, ...prev]);
    }
  };

  const isPublicView = ["home", "features", "about", "login", "register"].includes(currentView);

  if (isPublicView) {
    return (
      <div className="min-h-screen bg-enterprise-pattern text-slate-900 flex flex-col font-sans">
        <Navbar
          currentView={currentView}
          setCurrentView={setCurrentView}
          user={user}
          onLogout={() => {
            api.logout();
            setUser(null);
            setShops([]);
            setSelectedShop(null);
            setMissedCalls([]);
            setActiveCall(null);
            setCurrentView("home");
          }}
          shops={shops}
          selectedShop={selectedShop}
          onSelectShop={setSelectedShop}
          isCallActive={Boolean(activeCall)}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentView === "home" && (
            <HomePage
              onGetStarted={() => {
                if (user) setCurrentView("shops");
                else setCurrentView("register");
              }}
              onExploreFeatures={() => setCurrentView("features")}
            />
          )}

          {currentView === "features" && (
            <FeaturesPage onGoToConsole={() => setCurrentView(user ? "shops" : "login")} />
          )}

          {currentView === "about" && (
            <AboutPage onGoToConsole={() => setCurrentView(user ? "shops" : "login")} />
          )}

          {currentView === "login" && (
            <LoginPage
              initialMode="login"
              onAuthSuccess={(u) => {
                setUser(u);
                setCurrentView("shops");
              }}
              onCancel={() => setCurrentView("home")}
            />
          )}

          {currentView === "register" && (
            <LoginPage
              initialMode="register"
              onAuthSuccess={(u) => {
                setUser(u);
                setCurrentView("shops");
              }}
              onCancel={() => setCurrentView("home")}
            />
          )}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <p>© 2026 Involynk AI Calling Platform. Multi-Tenant MongoDB Atlas Architecture.</p>
        </footer>
      </div>
    );
  }

  // ─── AUTHENTICATED CONSOLE: CLEAN LEFT SIDEBAR WORKFLOW ─────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* 1. CLEAN LEFT SIDEBAR */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onLogout={() => {
          api.logout();
          setUser(null);
          setShops([]);
          setSelectedShop(null);
          setMissedCalls([]);
          setActiveCall(null);
          setCurrentView("home");
        }}
        shops={shops}
        selectedShop={selectedShop}
        onSelectShop={setSelectedShop}
        isCallActive={Boolean(activeCall)}
      />

      {/* 2. MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-14 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium uppercase font-mono">Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800 capitalize">
              {currentView === "shops"
                ? "Stores & Telephony Configuration"
                : currentView === "catalog"
                ? "Product Catalog & Wholesale Inventory"
                : currentView === "missed-calls"
                ? "Missed Calls Queue & Concurrency Resolution"
                : currentView === "live-monitor"
                ? "Live AI Voice Call Simulator"
                : "Admin Talks Intelligence Portal"}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Twilio Trunk Active: +1 (575) 221-3417
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {/* Step 1: Stores */}
          {(currentView === "shops" || currentView === "dashboard") && (
            <ShopManagement
              shops={shops}
              selectedShop={selectedShop}
              onSelectShop={setSelectedShop}
              onUpdateShop={handleUpdateShop}
              onAddShop={handleAddShop}
            />
          )}

          {/* Step 2: Catalog */}
          {currentView === "catalog" && (
            <CatalogManager selectedShop={selectedShop} />
          )}

          {/* Step 3: Missed Calls Queue & 2-Call Concurrency */}
          {currentView === "missed-calls" && (
            <MissedCallQueue
              selectedShop={selectedShop}
              missedCalls={missedCalls}
              onTriggerCall={handleTriggerCall}
              onAddMissedCall={handleAddMissedCall}
              autoDialActive={autoDialActive}
              onToggleAutoDial={() => setAutoDialActive(!autoDialActive)}
            />
          )}

          {/* Step 4: Live Call Simulator */}
          {currentView === "live-monitor" && (
            <LiveCallMonitor
              activeCall={activeCall}
              selectedShop={selectedShop}
              onEndCall={handleEndCall}
              onUpdateActiveCall={setActiveCall}
              onTriggerWhatsAppMidCall={handleTriggerWhatsAppMidCall}
              onSupervisorWhisper={handleSupervisorWhisper}
              onTransferToHuman={handleTransferToHuman}
            />
          )}

          {/* Step 5: Admin Talks */}
          {currentView === "admin" && (
            <AdminPortal />
          )}
        </main>
      </div>
    </div>
  );
}
export default App;
