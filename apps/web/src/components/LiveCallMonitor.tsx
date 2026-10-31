import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Bot, 
  User as UserIcon, 
  MessageSquare, 
  PhoneOff, 
  PhoneForwarded, 
  Volume2, 
  VolumeX,
  Activity, 
  Headphones,
  Mic,
  MicOff,
  Sparkles,
  Zap,
  PhoneCall,
  Send,
  Play,
  FileText,
  CheckSquare,
  AlertTriangle,
  Phone,
  Shield,
  Download
} from "lucide-react";
import { LiveCallSession, CallPhase, Shop } from "../types";
import { api } from "../api/client";
import { downloadCallReportPdf } from "../utils/pdfGenerator";

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

type CallStatus = "connecting" | "agent_speaking" | "listening" | "analyzing";

function cleanRecognizedSpeech(text: string): string {
  if (!text) return text;
  return text
    .replace(/\bcampers\b/gi, "hampers")
    .replace(/\bpamper\b/gi, "hamper")
    .replace(/\bkid not\b/gi, "kitna")
    .replace(/\bcould not\b/gi, "kitna")
    .replace(/\bcar you\b/gi, "kaju")
    .replace(/\bcaju\b/gi, "kaju")
    .replace(/\bbad ham\b/gi, "badam")
    .replace(/\bpiece star\b/gi, "pista")
    .replace(/\bindira nagar\b/gi, "Indiranagar")
    .replace(/\bindentifying\b/gi, "inquiring");
}

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
  const [callStatus, setCallStatus] = useState<CallStatus>("connecting");
  const [liveSpeech, setLiveSpeech] = useState("");
  const [micVolume, setMicVolume] = useState(0);
  const [isMicReady, setIsMicReady] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [lastAgentText, setLastAgentText] = useState("");
  const [sttLang, setSttLang] = useState<"en-IN" | "hi-IN">(
    selectedShop?.aiSettings?.language === "hi-IN" ? "hi-IN" : "en-IN"
  );

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);

  const callStatusRef = useRef<CallStatus>("connecting");
  const isMutedRef = useRef(false);
  const speakerMutedRef = useRef(true);
  const liveSpeechRef = useRef("");

  callStatusRef.current = callStatus;
  isMutedRef.current = isMuted;
  speakerMutedRef.current = speakerMuted;
  liveSpeechRef.current = liveSpeech;

  // Auto-scroll transcript
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

  // Play audio response using Deepgram Aura TTS with Web Speech fallback
  const playAgentVoice = useCallback(
    async (text: string) => {
      setLastAgentText(text);
      setCallStatus("agent_speaking");

      // Pause mic recognition while agent is speaking to avoid hearing own voice
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      // If laptop speaker is muted (e.g. talking on phone directly), do not play through browser speaker
      if (speakerMutedRef.current) {
        const estimatedDurationMs = Math.min(Math.max(text.split(" ").length * 350, 1800), 5000);
        setTimeout(() => {
          setCallStatus("listening");
          startMicListening();
        }, estimatedDurationMs);
        return;
      }

      const ttsUrl = `http://localhost:4000/api/voice/tts?text=${encodeURIComponent(text)}&model=aura-asteria-en`;

      try {
        if (activeAudioRef.current) {
          activeAudioRef.current.pause();
          activeAudioRef.current = null;
        }

        const audio = new Audio(ttsUrl);
        activeAudioRef.current = audio;

        audio.onended = () => {
          setCallStatus("listening");
          startMicListening();
        };

        audio.onerror = () => {
          console.warn("[Deepgram] Audio playback failed, using Web Speech fallback");
          fallbackSpeak(text);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setAutoplayBlocked(false);
            })
            .catch((err) => {
              console.warn("[Audio] Autoplay prevented by browser:", err.message);
              setAutoplayBlocked(true);
              fallbackSpeak(text);
            });
        }
      } catch (err) {
        console.warn("[TTS] Error starting audio:", err);
        fallbackSpeak(text);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const fallbackSpeak = useCallback((text: string) => {
    if (speakerMutedRef.current || !("speechSynthesis" in window)) {
      setCallStatus("listening");
      startMicListening();
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
        setCallStatus("listening");
        startMicListening();
      };
      utterance.onerror = () => {
        setCallStatus("listening");
        startMicListening();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setCallStatus("listening");
      startMicListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Process customer voice turn through Gemini 3.5 Flash-Lite
  const sendCustomerTurn = useCallback(
    async (speechText: string) => {
      if (!speechText.trim() || !activeCall) return;

      const currentSpeech = speechText.trim();
      setLiveSpeech("");
      liveSpeechRef.current = "";
      setCallStatus("analyzing");

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const turnId = "t_cust_" + Date.now();
      const timestamp = new Date().toLocaleTimeString([], {
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
                id: turnId,
                speaker: "customer",
                text: currentSpeech,
                timestamp,
              },
            ],
          };
        });
      }

      try {
        // 2. Call Gemini Voice Pipeline
        const analysis = await api.sendVoiceTurn({
          shopId: selectedShop?.id,
          customerSpeech: currentSpeech,
          conversationHistory: activeCall.transcript.map((t) => ({
            speaker: t.speaker,
            text: t.text,
          })),
          currentPhase: activeCall.phase,
          callSid: activeCall.callSid,
          leadName: activeCall.leadName,
          leadPhoneNumber: activeCall.leadPhoneNumber,
        });

        // 3. Update the active call state with Gemini's analysis
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
              callNotes: analysis.callNotes || prev.callNotes,
              actionItems: analysis.actionItems && analysis.actionItems.length > 0 ? analysis.actionItems : prev.actionItems,
              objectionsRaised: analysis.objectionsRaised && analysis.objectionsRaised.length > 0 ? analysis.objectionsRaised : prev.objectionsRaised,
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

        // 4. Speak response aloud with Deepgram Aura (resumes mic when audio finishes)
        playAgentVoice(analysis.agentResponse);
      } catch (err: any) {
        console.error("[sendCustomerTurn] failed:", err);
        const fallback = `Haan bilkul ${activeCall.leadName} ji! Maine aapke number pe catalog bhej diya hai.`;
        playAgentVoice(fallback);
      }
    },
    [activeCall, onUpdateActiveCall, playAgentVoice, selectedShop?.id]
  );

  // Start speech recognition
  const startMicListening = useCallback(() => {
    if (isMutedRef.current) return;
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.start();
      setCallStatus("listening");
    } catch (e: any) {
      if (!e.message?.includes("already started")) {
        console.warn("[startMicListening] error:", e);
      }
    }
  }, []);

  // Initialize Microphone Hardware (getUserMedia) + SpeechRecognition
  useEffect(() => {
    let isCancelled = false;

    async function initAudioHardware() {
      try {
        setMicError(null);
        // 1. Request microphone permission from the browser
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isCancelled) return;

        mediaStreamRef.current = stream;
        setIsMicReady(true);

        // 2. Attach AnalyserNode to measure real-time mic volume (VU meter)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (isCancelled) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }

        // 3. Setup Web Speech Recognition
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = sttLang; // Indian English or Hindi

          recognition.onresult = (event: any) => {
            // Disregard if agent is speaking
            if (callStatusRef.current === "agent_speaking" || isMutedRef.current) {
              return;
            }

            let fullInterim = "";
            let fullFinal = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const text = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                fullFinal += text + " ";
              } else {
                fullInterim += text;
              }
            }

            const rawSpoken = (fullFinal || fullInterim).trim();
            const currentSpoken = cleanRecognizedSpeech(rawSpoken);
            if (currentSpoken) {
              setLiveSpeech(currentSpoken);
              liveSpeechRef.current = currentSpoken;
            }

            // VAD: When user pauses for 2.2 seconds, automatically send the spoken sentence!
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }

            if (currentSpoken.length > 2) {
              silenceTimerRef.current = setTimeout(() => {
                const speechToSend = liveSpeechRef.current || currentSpoken;
                if (speechToSend && speechToSend.trim().length > 0) {
                  sendCustomerTurn(speechToSend);
                }
              }, 2200);
            }
          };

          recognition.onerror = (event: any) => {
            if (event.error === "no-speech") return;
            console.warn("[SpeechRecognition] error:", event.error);
          };

          recognition.onend = () => {
            // Re-open if still in listening state
            if (callStatusRef.current === "listening" && !isMutedRef.current) {
              try {
                recognition.start();
              } catch (e) {}
            }
          };

          recognitionRef.current = recognition;
        }

        // 4. Speak initial agent greeting once hardware is ready
        if (
          activeCall &&
          activeCall.transcript.length === 1 &&
          activeCall.transcript[0].speaker === "agent"
        ) {
          playAgentVoice(activeCall.transcript[0].text);
        } else {
          setCallStatus("listening");
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }
        }
      } catch (err: any) {
        console.error("[initAudioHardware] error:", err);
        setMicError(
          "Microphone permission is required. Please click 'Allow' in your browser address bar to speak directly with Riya."
        );
      }
    }

    initAudioHardware();

    return () => {
      isCancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSendSpeech = () => {
    if (!liveSpeech.trim()) return;
    sendCustomerTurn(liveSpeech);
  };

  const handleManualDoneSpeaking = () => {
    if (liveSpeech.trim()) {
      sendCustomerTurn(liveSpeech);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      isMutedRef.current = false;
      startMicListening();
    } else {
      setIsMuted(true);
      isMutedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      setCallStatus("agent_speaking");
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
          <PhoneCall className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Active Phone Call</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The AI Voice SDR is on standby. Dial a lead from the missed calls queue to start a live voice conversation.
        </p>
      </div>
    );
  }

  const phaseIndex = PHASES.indexOf(activeCall.phase);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
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
                  Live Conversational Line
                </span>
                <span className="font-mono text-xs text-slate-400">{activeCall.callSid}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                Connected with: <span className="text-blue-600">{activeCall.leadName}</span> ({activeCall.leadPhoneNumber})
              </h2>
              <p className="text-xs text-slate-500">
                Store: <span className="text-slate-800 font-semibold">{selectedShop?.name || activeCall.shopName}</span> • Voice SDR: <span className="text-blue-700 font-semibold">{selectedShop?.aiSettings?.personaName || "Riya"}</span>
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
              <span className="text-slate-500">Duration: </span>
              <span className="text-slate-900 font-bold">{formatTime(currentDuration)}</span>
            </div>

            <button
              onClick={toggleMute}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center space-x-1.5 ${
                isMuted
                  ? "bg-rose-50 text-rose-700 border-rose-300"
                  : "bg-emerald-50 text-emerald-800 border-emerald-300"
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4 text-emerald-600" />}
              <span>{isMuted ? "Mic Muted" : "Mic Live"}</span>
            </button>

            <button
              onClick={() => {
                const nextState = !speakerMuted;
                setSpeakerMuted(nextState);
                speakerMutedRef.current = nextState;
                if (nextState && activeAudioRef.current) {
                  activeAudioRef.current.pause();
                }
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center space-x-1.5 ${
                speakerMuted
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-blue-50 text-blue-800 border-blue-300"
              }`}
              title={speakerMuted ? "Laptop speaker is OFF (Audio heard on phone)" : "Laptop speaker is ON"}
            >
              {speakerMuted ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
              <span>{speakerMuted ? "Laptop Speaker: OFF (Phone Mode)" : "Laptop Speaker: ON"}</span>
            </button>

            <button
              onClick={() => {
                if (!activeCall) return;
                downloadCallReportPdf({
                  shopName: selectedShop?.name || activeCall.shopName,
                  leadName: activeCall.leadName,
                  leadPhoneNumber: activeCall.leadPhoneNumber,
                  callSid: activeCall.callSid,
                  duration: `${currentDuration}s`,
                  outcome: activeCall.scoreBand === "HOT" ? "booked" : "follow_up",
                  scoreBand: activeCall.scoreBand,
                  callNotes: activeCall.callNotes,
                  actionItems: activeCall.actionItems,
                  objectionsRaised: activeCall.objectionsRaised,
                  extractedEntities: activeCall.extractedEntities,
                  transcript: activeCall.transcript.map((t) => ({
                    speaker: t.speaker,
                    text: t.text,
                    timestamp: t.timestamp,
                  })),
                  date: new Date().toLocaleString(),
                });
              }}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs"
              title="Export live conversation audit PDF right now"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF Report</span>
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

        {/* Phase Stepper */}
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

      {/* Browser Autoplay Notice (If browser prevented instant audio play) */}
      {autoplayBlocked && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>Click below to allow audio playback from Riya:</span>
          </div>
          <button
            onClick={() => playAgentVoice(lastAgentText || activeCall.transcript[0]?.text || "Hello!")}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Play Riya's Audio</span>
          </button>
        </div>
      )}

      {/* Mic Permission Warning */}
      {micError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center space-x-3">
          <MicOff className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold">Microphone Permission Required</p>
            <p className="text-rose-700">{micError}</p>
          </div>
        </div>
      )}

      {/* LIVE VOICE HUD: True Conversational Voice Stage */}
      <div className={`rounded-2xl p-6 border transition-all ${
        callStatus === "listening"
          ? "bg-emerald-950/95 border-emerald-500 shadow-lg text-white"
          : callStatus === "analyzing"
          ? "bg-amber-950/95 border-amber-500 shadow-lg text-white"
          : "bg-slate-900 border-blue-500 shadow-lg text-white"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className={`w-3.5 h-3.5 rounded-full ${
                callStatus === "listening"
                  ? "bg-emerald-400 animate-ping"
                  : callStatus === "analyzing"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-blue-400 animate-pulse"
              }`} />
              <h3 className="text-base font-extrabold uppercase tracking-wide font-mono">
                {callStatus === "listening" && "🎤 Microphone Live — Speak Freely Now!"}
                {callStatus === "analyzing" && "⚡ Analyzing Your Words (Gemini 3.5)..."}
                {callStatus === "agent_speaking" && "🔊 Riya is Speaking (Deepgram Aura Audio)..."}
                {callStatus === "connecting" && "Initializing Audio Hardware..."}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              {callStatus === "listening"
                ? "Talk naturally into your microphone in English, Hindi, or Hinglish. Pause or click 'Done Speaking' to get Riya's reply."
                : callStatus === "analyzing"
                ? "Extracting buyer intent, quantity, and budget..."
                : "Deepgram Aura Neural Audio is playing aloud through your speakers."}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Real Hardware Mic VU Volume Level */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mic Level: </span>
              <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden ml-1">
                <div
                  style={{ width: `${Math.max(5, micVolume)}%` }}
                  className={`h-full transition-all duration-75 ${
                    micVolume > 20 ? "bg-emerald-400" : "bg-slate-600"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-emerald-400">
              <Zap className="w-3.5 h-3.5" />
              <span>Sub-350ms</span>
            </div>
          </div>
        </div>

        {/* Dynamic Voice Waveform Animation */}
        <div className="flex items-center gap-1.5 h-12 pt-4 px-1">
          {Array.from({ length: 36 }).map((_, i) => {
            const isListening = callStatus === "listening";
            // If listening, wave height reacts to real mic volume!
            const dynamicHeight = isListening
              ? Math.max(15, Math.min(100, (micVolume * 1.5) + ((i % 5) * 8)))
              : [25, 60, 40, 80, 50, 90, 45, 75, 30, 65, 85, 40, 70, 95, 50, 80, 40, 65][i % 18];

            return (
              <div
                key={i}
                style={{ height: `${dynamicHeight}%` }}
                className={`flex-1 rounded-full transition-all duration-75 ${
                  callStatus === "listening"
                    ? micVolume > 15
                      ? "bg-emerald-300"
                      : "bg-emerald-600"
                    : callStatus === "analyzing"
                    ? "bg-amber-400"
                    : "bg-blue-400"
                }`}
              />
            );
          })}
        </div>

        {/* Live Hearing Words Box with Instant Done Speaking Button */}
        <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 flex items-center space-x-2 text-xs">
              <Mic className={`w-4 h-4 shrink-0 ${callStatus === "listening" ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
              <span className="text-slate-400 text-xs shrink-0 font-medium">Spoken Input:</span>
              <input
                type="text"
                value={liveSpeech}
                onChange={(e) => {
                  setLiveSpeech(e.target.value);
                  liveSpeechRef.current = e.target.value;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && liveSpeech.trim()) {
                    handleManualDoneSpeaking();
                  }
                }}
                placeholder={
                  callStatus === "listening"
                    ? "Speak into mic or type here if words were misheard..."
                    : "Microphone paused while Riya is responding..."
                }
                className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono shadow-inner"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <select
                value={sttLang}
                onChange={(e) => setSttLang(e.target.value as "en-IN" | "hi-IN")}
                className="bg-black/40 border border-white/20 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-emerald-300 focus:outline-none"
              >
                <option value="en-IN">Speech: en-IN (Indian English)</option>
                <option value="hi-IN">Speech: hi-IN (Hindi / Hinglish)</option>
              </select>

              {callStatus === "listening" && (
                <button
                  onClick={handleManualDoneSpeaking}
                  disabled={!liveSpeech.trim()}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs transition flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Words</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Clickable Spoken Phrases (Helps if microphone has background noise) */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 text-[10px] font-mono mr-1">Quick Test Prompts:</span>
            {[
              "Mujhe 50 boxes dry fruits gift hampers chahiye",
              "Wholesale bulk discount kitna milega?",
              "Indiranagar delivery slot confirm karo",
              "Haan WhatsApp pe catalog bhej do",
              "Store Manager se baat karni hai",
            ].map((phrase, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setLiveSpeech(phrase);
                  liveSpeechRef.current = phrase;
                  sendCustomerTurn(phrase);
                }}
                className="px-2.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors"
              >
                "{phrase}"
              </button>
            ))}
          </div>
        </div>
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

          {/* Real-time Dynamic AI Conversation Notes & Executive Summary */}
          <div className="rounded-2xl clean-panel p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Live AI Conversation Notes</span>
              </h4>
              <span className="text-[10px] text-blue-700 font-mono font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-200 animate-pulse">
                Auto-Updating
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {activeCall.callNotes || "Analyzing live conversation... Key intent, customer requirements, and objections will appear here in real-time."}
            </p>
          </div>

          {/* Action Items & Follow-ups Identified by AI */}
          <div className="rounded-2xl clean-panel p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Action Items & Next Steps</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                {activeCall.actionItems?.length || 0} Tasks
              </span>
            </div>

            {activeCall.actionItems && activeCall.actionItems.length > 0 ? (
              <ul className="space-y-2">
                {activeCall.actionItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start space-x-2 text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100"
                  >
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic py-1">
                No pending action items yet. AI will capture commitments made during the call.
              </p>
            )}
          </div>

          {/* Customer Objections Identified */}
          {activeCall.objectionsRaised && activeCall.objectionsRaised.length > 0 && (
            <div className="rounded-2xl clean-panel p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Objections Handled</span>
                </h4>
                <span className="text-[10px] text-amber-700 font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                  {activeCall.objectionsRaised.length} Raised
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeCall.objectionsRaised.map((obj, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1"
                  >
                    <span>⚠️</span>
                    <span>{obj}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Active Twilio Telephony Details Card */}
          <div className="rounded-2xl clean-panel p-4 space-y-2 bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Twilio Telephony Line</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                Active PSTN Line
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Caller ID / Number</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedShop?.twilioConfig?.phoneNumber || activeCall.twilioDetails?.outboundNumber || "+1-800-INVOLYNK"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Routing Mode</span>
                <span className="font-semibold text-blue-700">
                  {selectedShop?.twilioConfig?.enabled ? "Twilio PSTN Bridge" : "Browser HD Voice"}
                </span>
              </div>
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
                Deepgram Aura + Gemini 3.5
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
                          onClick={() => playAgentVoice(turn.text)}
                          title="Replay Voice Audio"
                          className="p-1 rounded hover:bg-blue-100 text-blue-600 transition"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
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

              {callStatus === "analyzing" && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center space-x-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Gemini is analyzing your voice & synthesizing spoken reply...</span>
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
