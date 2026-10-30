import React, { useState, useEffect, useRef } from "react";
import { 
  Radio, 
  Bot, 
  User as UserIcon, 
  MessageSquare, 
  PhoneOff, 
  PhoneForwarded, 
  Send, 
  Volume2, 
  Activity, 
  Headphones,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap
} from "lucide-react";
import { LiveCallSession, CallPhase, Shop } from "../types";
import { api } from "../api/client";

interface LiveCallMonitorProps {
  activeCall: LiveCallSession | null;
  selectedShop: Shop | null;
  onEndCall: () => void;
  onUpdateActiveCall?: (updater: (prev: LiveCallSession | null) => LiveCallSession | null) => void;
  onTriggerWhatsAppMidCall: () => void;
  onSupervisorWhisper: (message: string) => void;
  onTransferToHuman: () => void;
}

const PHASES: CallPhase[] = [
  "GREETING",
  "DISCOVERY",
  "QUALIFICATION",
  "OBJECTION_HANDLING",
  "PITCH",
  "BOOKING",
  "CONFIRMATION",
  "CLOSE"
];

export const LiveCallMonitor: React.FC<LiveCallMonitorProps> = ({
  activeCall,
  selectedShop,
  onEndCall,
  onUpdateActiveCall,
  onTriggerWhatsAppMidCall,
  onSupervisorWhisper,
  onTransferToHuman,
}) => {
  const [whisperInput, setWhisperInput] = useState("");
  const [customerVoiceInput, setCustomerVoiceInput] = useState("");
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [isGeminiAnalyzing, setIsGeminiAnalyzing] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(activeCall?.durationSec ?? 3);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);
  const hasSpokenGreetingRef = useRef(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll transcript when new turns arrive
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeCall?.transcript]);

  // Duration counter
  useEffect(() => {
    if (!activeCall) return;
    const interval = setInterval(() => {
      setCurrentDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall]);

  // Auto-speak initial greeting when call starts
  useEffect(() => {
    if (
      activeCall &&
      activeCall.transcript.length === 1 &&
      activeCall.transcript[0].speaker === "agent" &&
      !hasSpokenGreetingRef.current
    ) {
      hasSpokenGreetingRef.current = true;
      const timer = setTimeout(() => {
        speakAgentResponse(activeCall.transcript[0].text);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeCall?.callSid]);

  // Initialize Web Speech API for voice microphone input with real-time interim results
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN"; // Supports Indian English and common Hinglish phrases

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (interim) {
          setCustomerVoiceInput(interim);
        }
        if (final) {
          setCustomerVoiceInput(final);
          handleProcessCustomerTurn(final);
          setIsListeningMic(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("[SpeechRecognition] error:", event.error);
        setIsListeningMic(false);
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      recognitionRef.current = recognition;
    }
  }, [activeCall, selectedShop]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Microphone voice recognition is not supported in this browser. You can type customer speech into the box.");
      return;
    }

    if (isListeningMic) {
      recognitionRef.current.stop();
      setIsListeningMic(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListeningMic(true);
      } catch (err) {
        console.error("Mic start error", err);
      }
    }
  };

  const speakAgentResponse = async (text: string) => {
    if (!audioFeedbackEnabled) return;

    try {
      // 1. High-fidelity Deepgram Aura Neural TTS (sub-200ms lifelike voice)
      const res = await fetch("http://localhost:4000/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, model: "aura-asteria-en" }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
        }
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;
        audio.play().catch((err) => {
          console.warn("[Deepgram Audio] Playback blocked, using browser TTS:", err);
          fallbackWebSpeech(text);
        });
        return;
      }
    } catch (err) {
      console.warn("[Deepgram TTS] API failed, falling back to Web Speech:", err);
    }

    fallbackWebSpeech(text);
  };

  const fallbackWebSpeech = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(
        (v) => v.lang.includes("IN") || v.name.toLowerCase().includes("india")
      );
      if (indianVoice) utterance.voice = indianVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS fallback error:", e);
    }
  };

  const handleProcessCustomerTurn = async (speechText: string) => {
    if (!speechText.trim() || !activeCall) return;

    const currentCustomerSpeech = speechText.trim();
    setCustomerVoiceInput("");
    setIsGeminiAnalyzing(true);

    const customerTurnId = "t_cust_" + Date.now();
    const timestampStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    // 1. Immediately append customer's speech to transcript
    if (onUpdateActiveCall) {
      onUpdateActiveCall((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          activeSpeaker: "agent",
          transcript: [
            ...prev.transcript,
            {
              id: customerTurnId,
              speaker: "customer",
              text: currentCustomerSpeech,
              timestamp: timestampStr,
            },
          ],
        };
      });
    }

    try {
      // 2. Call Gemini Voice Pipeline to analyze speech & generate intelligent Hinglish SDR response
      const analysis = await api.sendVoiceTurn({
        shopId: selectedShop?.id,
        customerSpeech: currentCustomerSpeech,
        conversationHistory: activeCall.transcript.map((t) => ({ speaker: t.speaker, text: t.text })),
        currentPhase: activeCall.phase,
        callSid: activeCall.callSid,
        leadName: activeCall.leadName,
        leadPhoneNumber: activeCall.leadPhoneNumber,
      });

      // 3. Play voice speech synthesis so user hears the response
      speakAgentResponse(analysis.agentResponse);

      // 4. Update the active call state with Gemini's deep analysis
      if (onUpdateActiveCall) {
        onUpdateActiveCall((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            phase: analysis.detectedPhase || prev.phase,
            sentiment: analysis.sentiment || prev.sentiment,
            scoreBand: analysis.scoreBand || prev.scoreBand,
            whatsAppPushed: analysis.whatsAppPushed || prev.whatsAppPushed,
            whatsAppOpened: analysis.whatsAppPushed || prev.whatsAppOpened,
            extractedEntities: {
              ...prev.extractedEntities,
              ...analysis.extractedEntities,
            },
            transcript: [
              ...prev.transcript,
              {
                id: "t_agent_" + Date.now(),
                speaker: "agent",
                text: analysis.agentResponse,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                entities: analysis.keyEntityTags || [],
              },
            ],
          };
        });
      }
    } catch (err: any) {
      console.error("[LiveCallMonitor] Voice turn failed:", err);
      // Fallback response if offline
      const fallbackResponse = `Haan bilkul ${activeCall.leadName} ji! Maine aapke number pe hamara details share kar diya hai. Anything else I can assist with?`;
      speakAgentResponse(fallbackResponse);

      if (onUpdateActiveCall) {
        onUpdateActiveCall((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            transcript: [
              ...prev.transcript,
              {
                id: "t_agent_" + Date.now(),
                speaker: "agent",
                text: fallbackResponse,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ],
          };
        });
      }
    } finally {
      setIsGeminiAnalyzing(false);
    }
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerVoiceInput) return;
    handleProcessCustomerTurn(customerVoiceInput);
  };

  const handleSendWhisper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whisperInput) return;
    onSupervisorWhisper(whisperInput);
    setWhisperInput("");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!activeCall) {
    return (
      <div className="py-24 text-center rounded-2xl clean-panel p-8 max-w-2xl mx-auto space-y-3">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <Radio className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Active Phone Call in Stream</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The AI Voice SDR is on standby. Trigger a missed-call callback from the queue or launch an instant test dial from the dashboard.
        </p>
      </div>
    );
  }

  const phaseIndex = PHASES.indexOf(activeCall.phase);

  return (
    <div className="space-y-6">
      {/* Top Call Info Card */}
      <div className="rounded-2xl clean-panel p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white absolute -top-1 -right-1 animate-ping" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                  Live Gemini 3.5 Flash-Lite Stream
                </span>
                <span className="font-mono text-xs text-slate-400">{activeCall.callSid}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                Calling: <span className="text-blue-600">{activeCall.leadName}</span> ({activeCall.leadPhoneNumber})
              </h2>
              <p className="text-xs text-slate-500">
                Store: <span className="text-slate-800 font-semibold">{selectedShop?.name || activeCall.shopName}</span>
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
              <span className="text-slate-500">Duration: </span>
              <span className="text-slate-900 font-bold">{formatTime(currentDuration)}</span>
            </div>

            <button
              onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
              title="Toggle AI Voice Audio Output"
              className={`p-2 rounded-lg border text-xs font-medium transition ${
                audioFeedbackEnabled
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-slate-50 text-slate-400 border-slate-200"
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              onClick={onTransferToHuman}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <PhoneForwarded className="w-3.5 h-3.5 text-blue-600" />
              <span>Transfer to Manager</span>
            </button>

            <button
              onClick={onEndCall}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Complete & Save Call</span>
            </button>
          </div>
        </div>

        {/* Phase Timeline Stepper */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
            <span>Conversational Phase Progress:</span>
            <span className="text-blue-600 font-mono font-bold uppercase">{activeCall.phase}</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {PHASES.map((p, idx) => {
              const isPast = idx < phaseIndex;
              const isCurrent = idx === phaseIndex;
              return (
                <div
                  key={p}
                  className={`py-1.5 px-1 rounded-md text-[10px] font-bold text-center uppercase tracking-tight transition-all ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-xs scale-102"
                      : isPast
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {p}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Telephony Visualizer & Live Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Real-time Analysis & Omnichannel WhatsApp Actions */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Speaker Card */}
          <div className="rounded-2xl clean-panel p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Active Telephony Stream
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sub-350ms Reflex</span>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-slate-200">
                    {selectedShop?.aiSettings?.personaName || "Riya"} (AI Voice SDR)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">Deepgram Aura + Gemini 3.5</span>
              </div>

              {/* Dynamic Waveform Bars */}
              <div className="flex items-center gap-1 h-8 px-1">
                {Array.from({ length: 28 }).map((_, i) => {
                  const heights = [30, 70, 45, 90, 60, 100, 35, 80, 50, 95, 40, 75, 85, 30, 65, 90, 40, 70, 55, 85, 30, 60, 95, 40, 80, 50, 65, 35];
                  const h = heights[i % heights.length];
                  return (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className={`w-1 rounded-full transition-all ${
                        isGeminiAnalyzing ? "bg-amber-400 animate-pulse" : "bg-blue-500"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span>Sentiment: <strong className="text-white capitalize">{activeCall.sentiment}</strong></span>
                <span>Lead Score: <strong className="text-red-400">{activeCall.scoreBand} 🔥</strong></span>
              </div>
            </div>

            {/* Mid-Call WhatsApp Action */}
            <div className="space-y-2 pt-1">
              <button
                onClick={onTriggerWhatsAppMidCall}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  activeCall.whatsAppPushed
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>
                  {activeCall.whatsAppPushed
                    ? "✓ WhatsApp Catalog Pushed Mid-Call!"
                    : "Push WhatsApp Catalog to Prospect Mid-Call"}
                </span>
              </button>
            </div>
          </div>

          {/* Extracted Entities Live Card */}
          <div className="rounded-2xl clean-panel p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Gemini Entity Extraction & Intent</span>
              </h4>
              {isGeminiAnalyzing && (
                <span className="text-[10px] text-blue-600 font-semibold animate-pulse">
                  Analyzing Voice...
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Customer Intent:</span>
                <span className="text-slate-900 font-semibold text-right max-w-[200px] truncate">
                  {activeCall.extractedEntities.intent || "Product & Price Inquiry"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Quantity / Scale:</span>
                <span className="text-slate-900 font-semibold">
                  {activeCall.extractedEntities.teamSize || "—"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Budget Signal:</span>
                <span className="text-emerald-700 font-bold">
                  {activeCall.extractedEntities.budgetSignal || "Flexible"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Timeline / Urgency:</span>
                <span className="text-blue-700 font-bold">
                  {activeCall.extractedEntities.timeline || "Immediate"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Turn-by-Turn Transcript & Human Voice Interaction */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl clean-panel p-5 flex-1 flex flex-col justify-between space-y-4 min-h-[580px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Live Turn-by-Turn Audio Transcript</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                Code-Switching: Hinglish (Hindi/English)
              </span>
            </div>

            {/* Conversation Log Feed */}
            <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
              {activeCall.transcript.map((turn) => (
                <div
                  key={turn.id}
                  className={`p-3 rounded-xl text-xs space-y-1.5 transition-all ${
                    turn.speaker === "agent"
                      ? "bg-blue-50/70 border border-blue-200 text-slate-800"
                      : "bg-white border border-slate-200 shadow-2xs text-slate-900 ml-5"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span
                      className={`font-bold ${
                        turn.speaker === "agent" ? "text-blue-700" : "text-amber-700"
                      }`}
                    >
                      {turn.speaker === "agent"
                        ? `${selectedShop?.aiSettings?.personaName || "Riya"} (AI Voice SDR)`
                        : activeCall.leadName}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {turn.speaker === "agent" && (
                        <button
                          type="button"
                          onClick={() => speakAgentResponse(turn.text)}
                          title="Replay Voice Audio"
                          className="p-1 rounded hover:bg-blue-100 text-blue-600 transition"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                      <span className="text-slate-400">{turn.timestamp}</span>
                    </div>
                  </div>
                  <p className="leading-relaxed">{turn.text}</p>
                  {turn.entities && turn.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {turn.entities.map((ent, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-mono font-medium"
                        >
                          {ent}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isGeminiAnalyzing && (
                <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-200/60 text-xs text-blue-700 flex items-center space-x-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>Gemini is analyzing human voice & synthesizing Hinglish response...</span>
                </div>
              )}
              <div ref={transcriptBottomRef} />
            </div>

            {/* Interactive Human Voice / Speech Input Section */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-blue-600" />
                  Speak or Type as Customer to Test AI Voice SDR:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Press Mic to talk out loud
                </span>
              </div>

              {/* 1-Click Quick Voice Test Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Haan hume Diwali corporate gifting ke liye 200 boxes chahiye wholesale rate pe",
                  "Can we order a custom 3-tier Belgian Chocolate cake for Friday evening?",
                  "I have severe molar toothache, is there an appointment today?",
                  "Catalog aur wholesale price list WhatsApp pe bhej sakte ho abhi?",
                  "Can I speak directly to the store manager?",
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleProcessCustomerTurn(chip)}
                    className="text-[10px] bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-600 px-2 py-1 rounded-md transition truncate max-w-full"
                  >
                    "{chip}"
                  </button>
                ))}
              </div>

              {/* Voice & Text Input Form */}
              <form onSubmit={handleCustomerSubmit} className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={toggleMic}
                  title="Click to speak using microphone"
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center shrink-0 ${
                    isListeningMic
                      ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                  }`}
                >
                  {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-600" />}
                </button>

                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customerVoiceInput}
                    onChange={(e) => setCustomerVoiceInput(e.target.value)}
                    placeholder={
                      isListeningMic
                        ? "Listening to your voice now... speak in English or Hindi..."
                        : "Type customer speech or click mic to talk..."
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!customerVoiceInput.trim() || isGeminiAnalyzing}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs transition-all flex items-center space-x-1.5 shadow-xs shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>

              {/* Supervisor Whisper Input */}
              <div className="pt-2">
                <form onSubmit={handleSendWhisper} className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Headphones className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={whisperInput}
                      onChange={(e) => setWhisperInput(e.target.value)}
                      placeholder="Supervisor whisper tip to AI agent in real-time (caller cannot hear this)..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono shadow-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-[11px] transition-all flex items-center space-x-1 shadow-xs"
                  >
                    <span>Whisper</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
