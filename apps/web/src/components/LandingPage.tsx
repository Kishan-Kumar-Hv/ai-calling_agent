import React from "react";
import { 
  PhoneCall, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare, 
  Radio, 
  Bot, 
  Store, 
  Clock, 
  Check, 
  Flame,
  Globe2,
  Building2,
  PhoneForwarded,
  Sparkles
} from "lucide-react";
import { Shop } from "../types";

interface LandingPageProps {
  onGetStarted: () => void;
  onViewLiveMonitor: () => void;
  selectedShop: Shop;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onViewLiveMonitor,
  selectedShop,
}) => {
  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto pt-10 pb-20">
        {/* Top Tag */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/90 text-xs font-semibold text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Autonomous Inbound & Missed-Call Voice SDR</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-normal">Sub-350ms Indian Multilingual</span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-4xl mx-auto space-y-5">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Never Lose a Customer to a{" "}
            <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">
              Missed Phone Call.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            When busy retail stores, bakeries, and clinics miss customer calls, 80% never call back. 
            <strong className="text-slate-900 font-semibold"> Involynk automatically rings them back within 30 seconds</strong>, conducts a natural conversational callback in Hinglish or English, pushes WhatsApp catalogs mid-call, and synchronizes the deal directly to your store's CRM.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>Launch Business Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onViewLiveMonitor}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 transition-all flex items-center justify-center space-x-2 shadow-xs"
            >
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Inspect Live Audio Stream</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>TRAI 9:30 AM–7:30 PM Time Guard</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>72-Hour Anti-Spam Cooldown</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Natural Code-Switching (Hinglish)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mid-Call WhatsApp Delivery</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Call Simulation Card */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="rounded-2xl clean-panel-elevated p-6 sm:p-7">
            {/* Header inside card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-slate-900">Live Voice Agent: "Riya"</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                      Active (Twilio + Deepgram)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Auto-recovering missed call for: <span className="text-slate-800 font-semibold">{selectedShop.name}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
                  Latency: <span className="text-blue-600 font-bold">295ms</span>
                </div>
                <button
                  onClick={onViewLiveMonitor}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <span>Open Full Monitor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Split dialog & audio waveform */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
              {/* Left: Speaker status */}
              <div className="md:col-span-5 space-y-3">
                {/* Agent Card */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 font-mono">
                      Speaking (AI SDR)
                    </span>
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  </div>
                  <div className="flex items-center space-x-2.5 mt-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      R
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Riya (Voice SDR)</p>
                      <p className="text-[11px] text-slate-500">Deepgram Aura-2 • 8kHz μ-law</p>
                    </div>
                  </div>
                  {/* Clean audio bars */}
                  <div className="flex items-center justify-between gap-1 h-7 mt-3 px-2 bg-white rounded-lg border border-blue-200">
                    {[40, 75, 90, 60, 30, 85, 100, 65, 45, 90, 70, 40, 95, 60, 30].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-blue-600 transition-all duration-300"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Customer Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                      V
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Vikram Malhotra</p>
                      <p className="text-[11px] text-slate-500">Deepgram Flux STT Stream</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>WhatsApp catalog pushed & opened mid-call</span>
                </div>
              </div>

              {/* Right: Conversation preview */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                    <span className="text-blue-700 font-bold">[00:03] Riya: </span>
                    <span className="text-slate-800">
                      "Namaste Vikram ji! Riya calling from Kishan Dry Fruits. Noticed we missed your ring—how can I help with your order?"
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                    <span className="text-amber-700 font-bold">[00:15] Customer: </span>
                    <span className="text-slate-800">
                      "Haan actually Diwali corporate gifting ke liye 200 boxes of walnuts aur almonds chahiye the..."
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <span className="text-emerald-700 font-bold">[00:45] Riya (In-Call WhatsApp): </span>
                    <span>
                      "Maine just abhi aapke WhatsApp number pe hamara festive catalog bhej diya hai! Check your phone right now."
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1.5 font-semibold text-slate-700">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>Lead Score: <strong>HOT (5/5)</strong></span>
                  </span>
                  <span className="text-emerald-700 font-semibold">Synced to Store Database</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
              Enterprise Telephony Architecture
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900">
              Built to Solve Real Telephony Challenges
            </h3>
            <p className="text-sm text-slate-500">
              Unlike generic wrappers, Involynk solves carrier spam blocks, priority starvation, and multilingual nuances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">P0-to-P3 Priority Dispatcher</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prioritizes fresh missed calls under 2 minutes so warm buyers are called back immediately, preventing starvation behind cold batch lists.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Globe2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Fluid Hinglish Code-Switching</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Natural conversational code-switching between Hindi, English, and regional accents without translation lag or robotic pauses.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Mid-Call Synchronous WhatsApp</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pushes interactive quotes, catalogs, and booking links while the prospect is still on the phone, verifying live receipt before hanging up.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">72-Hour Cooldown & TRAI Shield</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Built-in frequency capping, NCPR DND scrubbing, and legal calling hours (9:30 AM–7:30 PM IST) to prevent telecom penalties.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-20">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
              Simple Pricing
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900">
              Predictable Plans for Growing Stores
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
              <div>
                <h4 className="text-base font-bold text-slate-900">Single Outlet</h4>
                <p className="text-xs text-slate-500 mt-0.5">For local retail shops & single doctor clinics</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900">₹2,499</span>
                  <span className="text-xs text-slate-500 ml-1">/ month</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Up to 300 Missed Call Recoveries</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>1 Custom Voice Persona</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>WhatsApp Follow-Up Link</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>TRAI Compliance & DND Filtering</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition-colors"
              >
                Start 14-Day Free Trial
              </button>
            </div>

            {/* Growth */}
            <div className="p-6 rounded-2xl bg-white border-2 border-blue-600 shadow-md relative flex flex-col justify-between space-y-6">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] tracking-wide uppercase">
                Most Popular
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Multi-Branch Franchise</h4>
                <p className="text-xs text-slate-500 mt-0.5">For expanding retail chains & busy practices</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900">₹6,999</span>
                  <span className="text-xs text-slate-500 ml-1">/ month</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Up to 1,500 Missed Call Recoveries</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Manage Up to 5 Stores / Locations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>P0 Instant Priority Queue Dispatch</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Live Audio Waveform & Supervisor Takeover</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                Select Growth Plan
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
              <div>
                <h4 className="text-base font-bold text-slate-900">Custom Enterprise</h4>
                <p className="text-xs text-slate-500 mt-0.5">For 100+ stores, hospitals, and real estate brands</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900">Custom</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Calling Channels</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dedicated SIP Trunks & Dynamic CLI</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>10 Indian Regional Languages</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>99.95% Availability SLA</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition-colors"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
