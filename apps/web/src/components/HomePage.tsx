import React from "react";
import { 
  PhoneCall, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare, 
  Store, 
  Clock, 
  Globe2, 
  Flame, 
  Check, 
  PhoneForwarded,
  Award,
  Users,
  Building2
} from "lucide-react";
import { Shop } from "../types";

interface HomePageProps {
  onGetStarted: () => void;
  onExploreFeatures: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onGetStarted,
  onExploreFeatures,
}) => {
  return (
    <div className="space-y-20 pb-12">
      {/* 1. HERO SECTION WITH AUTHENTIC RETAIL / TELEPHONY BACKGROUND */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/80" />

        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Autonomous Inbound Voice SDR for Indian Retailers & Franchises</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-normal">Sub-350ms Hinglish Latency</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            Turn Every Missed Customer Ring Into{" "}
            <span className="text-blue-600">Guaranteed Sales.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            When busy retail counters, bakeries, and clinics miss phone calls during rush hours, 
            <strong className="text-slate-900 font-semibold"> over 80% of buyers call a competitor</strong>. Involynk automatically rings them back within 30 seconds, talks naturally in fluent Hinglish, answers catalog questions, and pushes WhatsApp links mid-call.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onExploreFeatures}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 transition-all flex items-center justify-center space-x-2 shadow-2xs"
            >
              <span>Explore Features & Architecture</span>
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
      </div>

      {/* 2. HOW IT WORKS: THE 3-STEP RECOVERY WORKFLOW */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
            How Involynk Works
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            From Missed Call to Booked Deal in 60 Seconds
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            A frictionless workflow that works quietly in the background without changing your existing store phone numbers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center">
              01
            </div>
            <h4 className="text-base font-bold text-slate-900">1. Customer Calls Your Store</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              A high-intent buyer dials your store about pricing or catering orders while your counter staff is busy with walk-in customers. The call goes unanswered.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center">
              02
            </div>
            <h4 className="text-base font-bold text-slate-900">2. Autonomous Sub-30s Callback</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our priority scheduler identifies the fresh missed call (P0) and calls the customer back immediately with a polite, conversational AI representative speaking natural Hinglish.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center">
              03
            </div>
            <h4 className="text-base font-bold text-slate-900">3. Mid-Call WhatsApp & Close</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              The agent answers questions, pushes your product catalog or appointment slot directly to their WhatsApp while still talking, and logs the qualified deal in your database.
            </p>
          </div>
        </div>
      </div>

      {/* 3. CORE BENEFITS FOR MULTI-BRANCH RETAILERS */}
      <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 space-y-8">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
            Enterprise Value
          </span>
          <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Stop Losing Footfall & High-Ticket Orders
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every phone call in Indian retail is a customer ready to spend money. Here is why enterprise store networks deploy Involynk across all branches:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-slate-800">
          <div className="space-y-2">
            <div className="text-3xl font-extrabold text-blue-400 font-mono">68%</div>
            <h4 className="text-sm font-bold text-white">Callback Recovery Rate</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Over 2 out of 3 customers who hang up are successfully recovered within 30 seconds.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">312ms</div>
            <h4 className="text-sm font-bold text-white">Conversational Reflex</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ultra-low latency audio streaming so the conversation feels fluid, polite, and human.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-extrabold text-amber-400 font-mono">100%</div>
            <h4 className="text-sm font-bold text-white">TRAI & DND Compliant</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatic 72-hour anti-spam cooldown and strict adherence to 9:30 AM–7:30 PM calling hours.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-extrabold text-rose-400 font-mono">₹4.20</div>
            <h4 className="text-sm font-bold text-white">Cost Per Qualified Call</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              A fraction of the cost of hiring dedicated tele-callers or manual call center operators.
            </p>
          </div>
        </div>
      </div>

      {/* 4. REAL CUSTOMER CASE STUDIES WITH AUTHENTIC STORE VISUALS */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
            Proven Results
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Trusted by Indian Retailers, Bakeries & Clinics
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=200&q=80"
                alt="Store"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Kishan Dry Fruits</h4>
                <p className="text-xs text-slate-500">Indiranagar, Bangalore</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "During festival rush, we were missing 40 to 50 calls daily while attending walk-in counter customers. Involynk recovered 142 orders in two weeks worth ₹1.84 Lakhs."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
              <span>+68.4% Missed Recovery</span>
              <span>Kishan Kumar, Owner</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80"
                alt="Bakery"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Amit Artisan Bakery</h4>
                <p className="text-xs text-slate-500">Koramangala, Bangalore</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Customers calling about custom cakes hated waiting on busy lines. The AI calls them back in seconds, sends the menu via WhatsApp, and books catering orders autonomously."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
              <span>₹92,400 Orders Saved</span>
              <span>Amit Sharma, Founder</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=200&q=80"
                alt="Clinic"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Apex Dental Clinic</h4>
                <p className="text-xs text-slate-500">Jayanagar, Bangalore</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Patients with dental aches never leave voicemails. The sub-30 second callback booked 215 appointments with zero receptionist overhead during off-hours."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
              <span>74.2% Patient Booking</span>
              <span>Dr. Ramesh, Chief Surgeon</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PRICING SECTION */}
      <div className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
            Transparent Pricing
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Simple Plans for Growing Stores
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

      {/* 6. BOTTOM CALL TO ACTION */}
      <div className="rounded-3xl bg-blue-600 p-8 sm:p-12 text-center text-white space-y-5 shadow-sm">
        <h2 className="text-2xl sm:text-4xl font-extrabold">Start Recovering Missed Calls Today</h2>
        <p className="text-sm text-blue-100 max-w-xl mx-auto">
          Set up your store profile in 2 minutes and experience autonomous sub-30 second callbacks.
        </p>
        <button
          onClick={onGetStarted}
          className="px-8 py-3.5 rounded-xl bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 transition-all shadow-md inline-flex items-center space-x-2"
        >
          <span>Create Free Account</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
