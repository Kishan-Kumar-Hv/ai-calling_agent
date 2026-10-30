import React from "react";
import { 
  Zap, 
  ShieldCheck, 
  MessageSquare, 
  Globe2, 
  Headphones, 
  Clock, 
  Store, 
  PhoneCall, 
  Cpu, 
  ArrowRight,
  CheckCircle2,
  PhoneForwarded,
  Layers,
  Database
} from "lucide-react";

interface FeaturesPageProps {
  onGoToConsole: () => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onGoToConsole }) => {
  return (
    <div className="space-y-16">
      {/* Header with Enterprise Telephony Background */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/80" />

        <div className="relative max-w-4xl mx-auto px-6 py-14 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
            <Cpu className="w-3.5 h-3.5" />
            <span>Architecture & Technology Specifications</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Engineered for High-Reliability Telephony
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A look under the hood at the 6 core technological breakthroughs that power Involynk's enterprise calling engine.
          </p>
        </div>
      </div>

      {/* Feature 1: Priority Queue */}
      <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
            Breakthrough #1: Priority Scheduling
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900">
            P0-to-P3 Dynamic Priority Dispatcher
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Standard dialers use FIFO (First-In, First-Out) loops where hot inbound leads wait behind 2,000 cold CSV records. Involynk guarantees a sub-30 second callback for fresh missed calls (P0) with dedicated reserved telephony trunks.
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>P0 (Urgent):</strong> Missed &lt; 2 minutes ago — Dispatched immediately.</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>P1 (Scheduled):</strong> Booked customer follow-ups at the exact minute.</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>P2 (Background):</strong> Nurturing leads during low-traffic windows.</span>
            </li>
          </ul>
        </div>
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-3">
          <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Live Priority Routing Logic</div>
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="text-rose-600 font-bold flex items-center justify-between">
              <span>P0_VIP_OVERRIDE</span>
              <span>Latency: 28s</span>
            </div>
            <p className="text-slate-600 text-[11px]">Inbound ring detected at Kishan Dry Fruits. Jumping to position #1 on Trunk Channel A.</p>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="text-emerald-700 font-bold flex items-center justify-between">
              <span>72H_COOLDOWN_GUARD</span>
              <span>Passed (0 Dials)</span>
            </div>
            <p className="text-slate-600 text-[11px]">Number not called in previous 72 hours. Anti-harassment compliance verified.</p>
          </div>
        </div>
      </div>

      {/* Feature 2: Fluid Hinglish Speech Engine */}
      <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 order-2 lg:order-1 p-6 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-3">
          <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Conversational Code-Switching</div>
          <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-800 space-y-1">
            <span className="text-blue-700 font-bold">Caller: </span>
            <span>"Website toh theek hai madam, but pricing ka kya scene hai? Bahut costly hoga na?"</span>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
            <span className="text-blue-700 font-bold">AI SDR: </span>
            <span>"Arre bilkul nahi sir! Hamare plans local shops ke budget ke hisab se monthly bane hain. Maine catalog WhatsApp pe bhej diya hai."</span>
          </div>
        </div>
        <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Globe2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
            Breakthrough #2: Native Code-Switching
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900">
            Sub-350ms Fluid Hinglish & Regional Accents
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            In the Indian market, people speak natural code-switched Hindi and English ("Hinglish"). Standard English models sound foreign and robotic. Our pipeline leverages Deepgram Flux with Gemini Flash to mirror the prospect's vernacular cadence with human-like fillers and pauses.
          </p>
        </div>
      </div>

      {/* Feature 3: Mid-Call WhatsApp & Supervisor Takeover */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            Mid-Call Synchronous WhatsApp Delivery
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Instead of waiting 10 minutes after a call ends, the agent triggers a WhatsApp message containing product photos, custom vouchers, or calendar links *while still talking*, confirming delivery before hanging up.
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Headphones className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            Supervisor Whisper & Instant Manager Transfer
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Store owners can listen in to live calls from the web dashboard, whisper tactical discount tips to the AI without the caller hearing, or click "Transfer to Manager" to immediately ring their mobile phone.
          </p>
        </div>
      </div>

      {/* CTA Card */}
      <div className="rounded-3xl bg-blue-600 p-8 sm:p-12 text-center text-white space-y-5 shadow-sm">
        <h2 className="text-2xl sm:text-4xl font-extrabold">Ready to Test the Voice Engine?</h2>
        <p className="text-sm text-blue-100 max-w-xl mx-auto">
          Access the live business owner console to configure store branches and test missed-call callbacks.
        </p>
        <button
          onClick={onGoToConsole}
          className="px-8 py-3.5 rounded-xl bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 transition-all shadow-md inline-flex items-center space-x-2"
        >
          <span>Open Business Console</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

