import React, { useState } from "react";
import { X, Store, Lock, Phone, Mail, User as UserIcon, ArrowRight } from "lucide-react";
import { User } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("Kishan Kumar");
  const [businessName, setBusinessName] = useState("Kishan Enterprises");
  const [phoneNumber, setPhoneNumber] = useState("+91 84319 80422");
  const [email, setEmail] = useState("kishan@involynk.com");
  const [password, setPassword] = useState("••••••••");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name: fullName || "Kishan Kumar",
      email: email || "kishan@involynk.com",
      phone: phoneNumber || "+91 84319 80422",
      businessName: businessName || "Kishan Enterprises",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    };
    onAuthSuccess(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 mb-5">
          <div className="inline-flex p-2.5 rounded-xl bg-blue-50 text-blue-600 mb-1">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {isRegister ? "Register Business Owner Account" : "Sign In to Business Console"}
          </h3>
          <p className="text-xs text-slate-500">
            {isRegister
              ? "Create your business portal to manage stores and missed-call AI voice SDRs"
              : "Access your store branches, active dial queues, and live call transcripts"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-lg mb-5">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              !isRegister ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              isRegister ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Register Business
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Owner Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kishan Kumar"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
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
                    placeholder="e.g. Kishan Dry Fruits & Spices"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
              </div>
            </>
          )}

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
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Used for supervisor escalations and WhatsApp demo reports.
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
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
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5"
          >
            <span>{isRegister ? "Create Owner Account" : "Access Stores Console"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
