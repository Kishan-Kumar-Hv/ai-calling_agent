import React, { useState } from "react";
import { Store, Lock, Phone, Mail, User as UserIcon, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { User } from "../types";
import { api } from "../api/client";

interface LoginPageProps {
  initialMode: "login" | "register";
  onAuthSuccess: (user: User) => void;
  onCancel: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialMode,
  onAuthSuccess,
  onCancel,
}) => {
  const [isRegister, setIsRegister] = useState(initialMode === "register");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (isRegister) {
        const res = await api.register({
          name: fullName,
          email,
          password,
          phone: phoneNumber,
          businessName,
        });
        onAuthSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 rounded-3xl clean-panel overflow-hidden shadow-md">
        {/* Left Side: Brand Value & Context */}
        <div className="md:col-span-5 bg-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />

          <div className="relative space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Involynk Business Console
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Complete private ownership over your store branches, custom voice SDR personas, missed-call pacing, and live speaker detection.
            </p>
          </div>

          <div className="relative space-y-3 pt-8 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Private Tenant Isolation (MongoDB Atlas)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Multi-Outlet Franchise Access Control</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sub-350ms Indian Accent Conversational AI</span>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="md:col-span-7 bg-white p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setErrorMsg("");
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    !isRegister
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setErrorMsg("");
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isRegister
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Register Business
                </button>
              </div>

              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Back to Website
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-extrabold text-slate-900">
                {isRegister ? "Register Your Business" : "Welcome Back"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isRegister
                  ? "Create a dedicated merchant account with private store database isolation."
                  : "Sign in to manage your private stores, queues, and AI SDR agents."}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Your Full Name</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Kishan Kumar"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Company / Brand Name</label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Kishan Enterprises"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">WhatsApp / Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 84319 80422"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourcompany.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm flex items-center justify-center space-x-2 text-sm mt-4 disabled:opacity-50"
              >
                <span>{loading ? "Authenticating with MongoDB Atlas..." : isRegister ? "Create Private Account" : "Access Console"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live MongoDB Atlas Cluster Connected
            </span>
            <span>Enterprise Multi-Tenant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
