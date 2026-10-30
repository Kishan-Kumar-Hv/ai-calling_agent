import React from "react";
import { 
  Building2, 
  ShieldCheck, 
  Award, 
  Users, 
  PhoneCall, 
  TrendingUp, 
  Globe2, 
  HeartHandshake, 
  ArrowRight,
  CheckCircle2
} from "lucide-react";

interface AboutPageProps {
  onGoToConsole: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onGoToConsole }) => {
  return (
    <div className="space-y-16">
      {/* Hero with Business Team Background */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/80" />

        <div className="relative max-w-4xl mx-auto px-6 py-14 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
            <Building2 className="w-3.5 h-3.5" />
            <span>Company & Purpose</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Empowering Indian Commerce with Voice Intelligence
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Involynk is building India's enterprise telephony infrastructure to ensure no local business ever loses a customer to a missed phone call.
          </p>
        </div>
      </div>

      {/* The Indian Context & Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
            The ₹50,000 Crore Problem
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Why We Built Involynk for Indian Retailers & Franchises
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            In India, phone calls represent high buying intent. Whether ordering custom Diwali dry fruit hampers, booking weekend catering from a bakery, or reserving an urgent dental consultation, customers call directly.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            However, during peak counter rush, staff are busy attending walk-in visitors. Phone lines ring out. In over 80% of cases, frustrated customers immediately search Google Maps and call the next competitor. Involynk was created to bridge this exact gap with automated, polite, sub-30 second callbacks.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-2xl font-extrabold text-slate-900">₹6.89L+</span>
              <p className="text-xs text-slate-500">Revenue recovered for beta merchants</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-2xl font-extrabold text-blue-600 font-mono">312ms</span>
              <p className="text-xs text-slate-500">Average voice conversational latency</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1000&q=80"
            alt="Retail Store Counter"
            className="w-full h-80 object-cover"
          />
        </div>
      </div>

      {/* Core Principles */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
            Our Guiding Pillars
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Telephony Standards We Never Compromise On
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">TRAI & Anti-Spam Rigor</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              We enforce strict 72-hour anti-harassment cooldowns and adhere strictly to TRAI 9:30 AM to 7:30 PM calling hour limits. We reject spam tactics.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Globe2 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Vernacular First</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              We design our models specifically for the Indian linguistic reality: natural code-switching between Hindi, English, Kannada, and regional market nuances.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Human-in-the-Loop</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI should never trap a customer. We provide one-click manager transfers and live supervisor takeover so high-value deals always get human attention.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Card */}
      <div className="rounded-3xl bg-slate-900 p-8 sm:p-12 text-center text-white space-y-5 shadow-sm">
        <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to Explore the Platform?</h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Sign in or register your business to configure stores and test live AI callbacks.
        </p>
        <button
          onClick={onGoToConsole}
          className="px-8 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-md inline-flex items-center space-x-2"
        >
          <span>Open Business Console</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

