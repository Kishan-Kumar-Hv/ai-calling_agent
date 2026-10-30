import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Radio, 
  Bot, 
  User as UserIcon, 
  MessageSquare, 
  PhoneOff, 
  PhoneForwarded, 
  Volume2, 
  Activity, 
  Headphones,
  Mic,
  MicOff,
  Sparkles,
  Zap,
  CheckCircle2,
  VolumeX,
  PhoneCall
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

type VoiceCallStatus = "connecting" | "agent_speaking" | "listening" | "analyzing";

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
  const [currentDuration, setCurrentDuration] = useState(activeCall?.durationSec ?? 3);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);
  const [callVoiceStatus, setCallVoiceStatus] = useState<VoiceCallStatus>("connecting");
  const [liveInterimSpeech, setLiveInterimSpeech] = useState("");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);
  const hasSpokenGreetingRef = useRef(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<any>(null);
  const callVoiceStatusRef = useRef<VoiceCallStatus>("connecting");
  const isMicMutedRef = useRef(false);
  const accumulatedSpeechRef = useRef<string>("");

  callVoiceStatusRef.current = callVoiceStatus;
  isMicMutedRef.current = isMicMuted;

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

  // Helper to safely stop listening
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Helper to start continuous listening
  const startListening = useCallback(() => {
    if (isMicMutedRef.current) return;
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.start();
      setCallVoiceStatus("listening");
      setLiveInterimSpeech("");
      accumulatedSpeechRef.current = "";
    } catch (e: any) {
      // If already started, it's fine
      if (!e.message?.includes("already started")) {
        console.warn("[startListening] error:", e);
      }
    }
  }, []);

  // Helper to speak agent response via Deepgram Aura TTS with Web Speech fallback
  const speakAgentResponse = useCallback(
    async (text: string) => {
      stopListening();
      setCallVoiceStatus("agent_speaking");

      if (!audioFeedbackEnabled) {
        // If audio output is disabled, immediately resume listening
        setTimeout(() => {
          setCallVoiceStatus("listening");
          startListening();
        }, 500);
        return;
      }

      try {
        // 1. High-fidelity Deepgram Aura Neural TTS (sub-200ms)
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

          audio.onplay = () => {
            setCallVoiceStatus("agent_speaking");
          };

          audio.onended = () => {
            // Once Riya finishes speaking, automatically open mic for customer's reply!
            setCallVoiceStatus("listening");
            startListening();
          };

          audio.onerror = () => {
            console.warn("[Deepgram Audio] Playback failed, falling back to Web Speech");
            fallbackWebSpeech(text);
          };

          await audio.play();
          return;
        }
      } catch (err) {
        console.warn("[Deepgram TTS] API failed, falling back to Web Speech:", err);
      }

      fallbackWebSpeech(text);
    },
    [audioFeedbackEnabled, startListening, stopListening]
  );

  const fallbackWebSpeech = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) {
        setCallVoiceStatus("listening");
        startListening();
        return;
      }
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

        utterance.onend = () => {
          setCallVoiceStatus("listening");
          startListening();
        };
        utterance.onerror = () => {
          setCallVoiceStatus("listening");
          startListening();
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        setCallVoiceStatus("listening");
        startListening();
      }
    },
    [startListening]
  );

  // Process customer voice turn through Gemini 3.5 Flash-Lite
  const handleProcessCustomerTurn = useCallback(
    async (speechText: string) => {
      if (!speechText.trim() || !activeCall) return;

      const currentCustomerSpeech = speechText.trim();
      stopListening();
      setLiveInterimSpeech("");
      setCallVoiceStatus("analyzing");

      const customerTurnId = "t_cust_" + Date.now();
      const timestampStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

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
        // 2. Call Gemini Voice Pipeline to analyze speech & extract entities
        const analysis = await api.sendVoiceTurn({
          shopId: selectedShop?.id,
          customerSpeech: currentCustomerSpeech,
          conversationHistory: activeCall.transcript.map((t) => ({
            speaker: t.speaker,
            text: t.text,
          })),
          currentPhase: activeCall.phase,
          callSid: activeCall.callSid,
          leadName: activeCall.leadName,
          leadPhoneNumber: activeCall.leadPhoneNumber,
        });

        // 3. Update the active call state with Gemini's deep analysis
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
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }),
                  entities: analysis.keyEntityTags || [],
                },
              ],
            };
          });
        }

        // 4. Speak response aloud with Deepgram Aura (microphone resumes automatically upon audio finish!)
        speakAgentResponse(analysis.agentResponse);
      } catch (err: any) {
        console.error("[LiveCallMonitor] Voice turn failed:", err);
        const fallbackResponse = `Haan bilkul ${activeCall.leadName} ji! Maine aapke number pe catalog details bhej diya hai.`;
        speakAgentResponse(fallbackResponse);
      }
    },
    [activeCall, onUpdateActiveCall, selectedShop?.id, speakAgentResponse, stopListening]
  );

  // Initialize Speech Recognition for continuous hands-free voice dialogue
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicPermissionError(
        "Microphone voice recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN"; // Accurately captures Indian English, Hindi, and Hinglish

    recognition.onresult = (event: any) => {
      // If Riya is speaking or analyzing, disregard mic input to prevent echo
      if (
        callVoiceStatusRef.current === "agent_speaking" ||
        callVoiceStatusRef.current === "analyzing" ||
        isMicMutedRef.current
      ) {
        return;
      }

      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }

      const activeText = (accumulatedSpeechRef.current + " " + final + " " + interim).trim();
      if (activeText) {
        setLiveInterimSpeech(activeText);
      }

      if (final) {
        accumulatedSpeechRef.current = (accumulatedSpeechRef.current + " " + final).trim();
      }

      // Voice Activity Detection (VAD): If user pauses speaking for 1.2s, trigger AI response!
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      const currentAccumulated = accumulatedSpeechRef.current || interim;
      if (currentAccumulated.trim().length > 0) {
        silenceTimerRef.current = setTimeout(() => {
          const textToProcess = accumulatedSpeechRef.current || liveInterimSpeech;
          accumulatedSpeechRef.current = "";
          if (textToProcess && textToProcess.trim().length > 0) {
            handleProcessCustomerTurn(textToProcess);
          }
        }, 1200);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        // Normal silence timeout from browser, keep listening
        return;
      }
      if (event.error === "not-allowed") {
        setMicPermissionError(
          "Microphone permission was denied. Please allow microphone in your browser to speak with Riya."
        );
        return;
      }
      console.warn("[SpeechRecognition] error:", event.error);
    };

    recognition.onend = () => {
      // If call is still in listening mode, automatically restart to maintain live voice line
      if (callVoiceStatusRef.current === "listening" && !isMicMutedRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // ignore
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (e) {}
    };
  }, [handleProcessCustomerTurn, liveInterimSpeech]);

  // Auto-speak initial greeting when call connects, then open mic for customer
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
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeCall?.callSid, speakAgentResponse]);

  const toggleMicMute = () => {
    if (isMicMuted) {
      setIsMicMuted(false);
      startListening();
    } else {
      setIsMicMuted(true);
      stopListening();
      setCallVoiceStatus("agent_speaking");
    }
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
          The AI Voice SDR is on standby. Dial a lead from the missed calls queue or start an instant dial from the dashboard.
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
                <PhoneCall className="w-6 h-6 animate-pulse" />
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white absolute -top-1 -right-1 animate-ping" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Conversational Call
                </span>
                <span className="font-mono text-xs text-slate-400">{activeCall.callSid}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                Connected: <span className="text-blue-600">{activeCall.leadName}</span> ({activeCall.leadPhoneNumber})
              </h2>
              <p className="text-xs text-slate-500">
                Store: <span className="text-slate-800 font-semibold">{selectedShop?.name || activeCall.shopName}</span> • AI SDR: <span className="text-blue-700 font-semibold">{selectedShop?.aiSettings?.personaName || "Riya"}</span>
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
              onClick={toggleMicMute}
              title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center space-x-1.5 ${
                isMicMuted
                  ? "bg-rose-50 text-rose-700 border-rose-300"
                  : "bg-emerald-50 text-emerald-800 border-emerald-300"
              }`}
            >
              {isMicMuted ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4 text-emerald-600" />}
              <span>{isMicMuted ? "Mic Muted" : "Mic Live"}</span>
            </button>

            <button
              onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
              title="Toggle AI Voice Audio Output"
              className={`p-2 rounded-lg border text-xs font-medium transition ${
                audioFeedbackEnabled
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-slate-50 text-slate-400 border-slate-200"
              }`}
            >
              {audioFeedbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
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
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End & Save Call</span>
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

      {/* Permission Warning if Microphone Blocked */}
      {micPermissionError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-3">
          <MicOff className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold">Microphone Permission Needed for Real Voice Interaction</p>
            <p className="text-amber-700">{micPermissionError}</p>
          </div>
        </div>
      )}

      {/* LIVE VOICE HUD: Hands-Free Voice Dialogue Center Stage */}
      <div className={`rounded-2xl p-6 border transition-all ${
        callVoiceStatus === "listening"
          ? "bg-emerald-950/90 border-emerald-500 shadow-md text-white"
          : callVoiceStatus === "analyzing"
          ? "bg-amber-950/90 border-amber-500 shadow-md text-white"
          : "bg-slate-900 border-blue-500 shadow-md text-white"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${
                callVoiceStatus === "listening"
                  ? "bg-emerald-400 animate-ping"
                  : callVoiceStatus === "analyzing"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-blue-400 animate-pulse"
              }`} />
              <h3 className="text-sm font-extrabold uppercase tracking-wider font-mono">
                {callVoiceStatus === "listening" && "Microphone Live — Speak Freely Now!"}
                {callVoiceStatus === "analyzing" && "Riya is Analyzing Your Speech with Gemini 3.5..."}
                {callVoiceStatus === "agent_speaking" && "Riya is Speaking (Deepgram Aura Audio)..."}
                {callVoiceStatus === "connecting" && "Call Connecting..."}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              {callVoiceStatus === "listening"
                ? "Talk naturally into your microphone in English, Hindi, or Hinglish. Riya will automatically detect when you finish and reply out loud."
                : callVoiceStatus === "analyzing"
                ? "Extracting buyer entities, quantity, budget, and sentiment in sub-350ms..."
                : "Deepgram Aura Neural Speech is playing through your speaker."}
            </p>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono shrink-0">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deepgram Aura + Gemini 3.5</span>
          </div>
        </div>

        {/* Dynamic Voice Waveform Animation */}
        <div className="flex items-center gap-1.5 h-12 pt-4 px-1">
          {Array.from({ length: 36 }).map((_, i) => {
            const listeningHeights = [35, 80, 50, 95, 40, 90, 60, 100, 45, 85, 30, 75, 95, 40, 85, 60, 90, 50, 75, 95, 40, 80, 55, 90, 35, 70, 95, 45, 85, 60, 90, 40, 75, 85, 45, 65];
            const speakingHeights = [20, 50, 30, 70, 40, 85, 50, 75, 35, 65, 25, 60, 80, 30, 70, 50, 80, 40, 65, 75, 30, 65, 45, 70, 25, 55, 75, 35, 70, 50, 75, 30, 60, 70, 35, 50];
            const isListening = callVoiceStatus === "listening";
            const h = isListening
              ? listeningHeights[i % listeningHeights.length]
              : speakingHeights[i % speakingHeights.length];

            return (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  callVoiceStatus === "listening"
                    ? "bg-emerald-400 animate-pulse"
                    : callVoiceStatus === "analyzing"
                    ? "bg-amber-400"
                    : "bg-blue-400"
                }`}
              />
            );
          })}
        </div>

        {/* Live Spoken Speech Preview (Updates as words come out of your mouth) */}
        {liveInterimSpeech && callVoiceStatus === "listening" && (
          <div className="mt-4 p-3 rounded-xl bg-black/50 border border-emerald-500/40 text-xs text-emerald-200 flex items-center space-x-2">
            <Mic className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
            <p className="italic">
              Hearing you say: <strong className="text-white font-normal">"{liveInterimSpeech}"</strong>
            </p>
          </div>
        )}
      </div>

      {/* Main Grid: Real-time Analysis & Turn-by-Turn Audio Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Extracted Entities Live Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl clean-panel p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Extracted Buyer Entities</span>
              </h4>
              <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                Score: {activeCall.scoreBand} 🔥
              </span>
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
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Timeline / Urgency:</span>
                <span className="text-blue-700 font-bold">
                  {activeCall.extractedEntities.timeline || "Immediate"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Sentiment:</span>
                <span className="text-slate-900 font-semibold capitalize">
                  {activeCall.sentiment}
                </span>
              </div>
            </div>

            {/* Mid-Call WhatsApp Action */}
            <div className="pt-2">
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
                    ? "✓ WhatsApp Catalog Sent Mid-Call!"
                    : "Push WhatsApp Catalog to Prospect"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Turn-by-Turn Audio Transcript */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl clean-panel p-5 flex-1 flex flex-col justify-between space-y-4 min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Live Audio Transcript</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                Hinglish / English / Hindi
              </span>
            </div>

            {/* Conversation Log Feed */}
            <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {activeCall.transcript.map((turn) => (
                <div
                  key={turn.id}
                  className={`p-3 rounded-xl text-xs space-y-1.5 transition-all ${
                    turn.speaker === "agent"
                      ? "bg-blue-50/70 border border-blue-200 text-slate-800"
                      : "bg-white border border-slate-200 shadow-2xs text-slate-900 ml-6"
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

              {callVoiceStatus === "analyzing" && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center space-x-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Gemini is analyzing your voice and synthesizing spoken response...</span>
                </div>
              )}
              <div ref={transcriptBottomRef} />
            </div>

            {/* Supervisor Whisper Tool (Private to agent) */}
            <div className="pt-3 border-t border-slate-100">
              <form onSubmit={handleSendWhisper} className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Headphones className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={whisperInput}
                    onChange={(e) => setWhisperInput(e.target.value)}
                    placeholder="Supervisor whisper tip (injected into agent's ear, caller cannot hear)..."
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
  );
};
