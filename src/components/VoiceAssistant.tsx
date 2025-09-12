"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, MicOff, Languages, Volume1, Speaker, Headphones, Headset, HeadphoneOff, Keyboard, Captions, Ear, Podcast, MessageCircleQuestionMark, MicVocal, MonitorDown, Speech } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type ConversationTurn = {
  id: string;
  lang: string;
  query: string;
  response: string;
  timestamp: number;
};

type LanguageOption = { code: string; label: string };

export interface VoiceAssistantProps {
  className?: string;
  initialLanguage?: string;
  supportedLanguages?: LanguageOption[];
  onSubmitQuery?: (query: string, lang: string) => Promise<string> | string;
  autoStartListening?: boolean;
  compact?: boolean;
}

export default function VoiceAssistant({
  className,
  initialLanguage = "en-IN",
  supportedLanguages = [
    { code: "en-IN", label: "English (India)" },
    { code: "hi-IN", label: "हिन्दी (Hindi)" },
    { code: "bn-IN", label: "বাংলা (Bengali)" },
    { code: "mr-IN", label: "मराठी (Marathi)" },
    { code: "ta-IN", label: "தமிழ் (Tamil)" },
    { code: "te-IN", label: "తెలుగు (Telugu)" },
    { code: "kn-IN", label: "ಕನ್ನಡ (Kannada)" },
    { code: "pa-IN", label: "ਪੰਜਾਬੀ (Punjabi)" },
  ],
  onSubmitQuery,
  autoStartListening = false,
  compact = false,
}: VoiceAssistantProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [language, setLanguage] = useState(initialLanguage);
  const [isOnline, setIsOnline] = useState(true);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(0.9);
  const [rate, setRate] = useState<number>(1);
  const [hasSpeechInput, setHasSpeechInput] = useState<boolean | null>(null);
  const [hasSpeechOutput, setHasSpeechOutput] = useState<boolean | null>(null);
  const [manualQuery, setManualQuery] = useState("");

  // Recognition and TTS refs
  const recognitionRef = useRef<any | null>(null);
  const speechSupportedRef = useRef(false);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mountedRef = useRef(false);

  // Quick voice command shortcuts
  const quickCommands = useMemo(
    () => [
      { id: "disease", label: "Crop disease diagnosis", icon: MessageCircleQuestionMark, text: "Diagnose crop disease from symptoms" },
      { id: "weather", label: "Weather forecast", icon: MicVocal, text: "Weather forecast for my farm for next 3 days" },
      { id: "irrigation", label: "Irrigation schedule", icon: Ear, text: "Irrigation schedule for my crop and soil moisture" },
      { id: "fertilizer", label: "Fertilizer advice", icon: Captions, text: "Recommended fertilizer and dosage for current crop stage" },
    ],
    []
  );

  // Online/offline detection
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => {
        setIsOnline(false);
        toast.warning("You are offline. Voice features may be limited.");
      };
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Initialize Speech APIs safely in client
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    if (typeof window === "undefined") return;

    // Speech recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechSupportedRef.current = true;
      setHasSpeechInput(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.lang = language;
      recognitionRef.current.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setTranscript((prev) => (prev ? `${prev} ${transcriptPiece}` : transcriptPiece));
          } else {
            interim += transcriptPiece;
          }
        }
        if (interim) {
          setTranscript((prev) => (prev ? prev : interim));
        }
      };
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
      recognitionRef.current.onerror = (e: any) => {
        setIsRecording(false);
        toast.error(`Mic error: ${e?.error || "Unknown error"}`);
      };
    } else {
      setHasSpeechInput(false);
    }

    // Speech synthesis support
    if ("speechSynthesis" in window) {
      synthesisRef.current = window.speechSynthesis;
      setHasSpeechOutput(true);
    } else {
      setHasSpeechOutput(false);
    }
  }, [language]);

  // Keep recognition language in sync
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const startListening = useCallback(() => {
    if (!speechSupportedRef.current || !recognitionRef.current) {
      toast.info("Voice input not supported. Use keyboard input below.");
      return;
    }
    try {
      setTranscript("");
      recognitionRef.current?.start();
    } catch {
      // Ignore repeated start call errors
    }
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  }, []);

  // Auto-start listening if requested and supported
  useEffect(() => {
    if (autoStartListening && hasSpeechInput) {
      const t = setTimeout(() => startListening(), 400);
      return () => clearTimeout(t);
    }
  }, [autoStartListening, hasSpeechInput, startListening]);

  // Process query either with provided handler or simulated
  const processQuery = useCallback(
    async (query: string) => {
      const q = query.trim();
      if (!q) {
        toast.message("Please say or type your question.");
        return;
      }
      setIsProcessing(true);
      setAiResponse("");
      try {
        let result: string;
        if (onSubmitQuery) {
          const maybe = onSubmitQuery(q, language);
          result = typeof maybe === "string" ? maybe : await maybe;
        } else {
          // Simulate AI response locally when no handler is provided
          await new Promise((r) => setTimeout(r, 900));
          result =
            "Here is your advisory based on the question. For precise recommendations, ensure your crop type and location are set in your profile.";
        }
        setAiResponse(result);
        const turn: ConversationTurn = {
          id: `${Date.now()}`,
          lang: language,
          query: q,
          response: result,
          timestamp: Date.now(),
        };
        setHistory((prev) => [turn, ...prev].slice(0, 25));
        // Autoplay TTS if available
        if (synthesisRef.current && hasSpeechOutput) {
          speak(result, language);
        }
      } catch (e: any) {
        toast.error("Failed to get response. Check connectivity.");
      } finally {
        setIsProcessing(false);
      }
    },
    [hasSpeechOutput, language, onSubmitQuery]
  );

  // TTS helpers
  const stopTts = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setTtsPlaying(false);
      currentUtteranceRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, langCode: string) => {
      if (!synthesisRef.current) return;
      stopTts();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = langCode;
      u.volume = Math.min(1, Math.max(0, volume));
      u.rate = Math.min(2, Math.max(0.5, rate));
      u.onstart = () => setTtsPlaying(true);
      u.onend = () => setTtsPlaying(false);
      u.onerror = () => {
        setTtsPlaying(false);
        toast.error("Speech playback error.");
      };
      currentUtteranceRef.current = u;
      synthesisRef.current.speak(u);
    },
    [rate, stopTts, volume]
  );

  const pauseTts = useCallback(() => {
    if (synthesisRef.current && synthesisRef.current.speaking) {
      synthesisRef.current.pause();
      setTtsPlaying(false);
    }
  }, []);

  const resumeTts = useCallback(() => {
    if (synthesisRef.current && synthesisRef.current.paused) {
      synthesisRef.current.resume();
      setTtsPlaying(true);
    }
  }, []);

  const handleQuickCommand = useCallback(
    (text: string) => {
      setTranscript(text);
      processQuery(text);
    },
    [processQuery]
  );

  const handleSubmitManual = useCallback(() => {
    processQuery(manualQuery || transcript);
  }, [manualQuery, processQuery, transcript]);

  return (
    <Card
      role="region"
      aria-label="AI voice assistant"
      className={cn(
        "w-full max-w-full bg-card rounded-2xl border border-border shadow-sm p-4 sm:p-6",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Podcast className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-lg sm:text-xl font-semibold truncate">Voice Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            {hasSpeechInput === false && (
              <Badge variant="secondary" className="bg-muted text-foreground">
                <Keyboard className="h-3.5 w-3.5 mr-1" /> No mic support
              </Badge>
            )}
            {hasSpeechOutput === false && (
              <Badge variant="secondary" className="bg-muted text-foreground">
                <HeadphoneOff className="h-3.5 w-3.5 mr-1" /> No TTS
              </Badge>
            )}
          </div>
          <Badge
            variant={isOnline ? "secondary" : "destructive"}
            className={cn(
              "gap-1",
              isOnline ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground"
            )}
            aria-live="polite"
          >
            <MonitorDown className="h-3.5 w-3.5" />
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Controls row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="lang">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-primary" />
              Language
            </div>
          </Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="lang" className="bg-secondary">
              <SelectValue placeholder="Choose language" />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Volume1 className="h-4 w-4 text-primary" />
                Volume
              </span>
              <span className="text-muted-foreground text-xs">{Math.round(volume * 100)}%</span>
            </div>
          </Label>
          <Slider
            value={[volume]}
            onValueChange={(v) => setVolume(v[0])}
            min={0}
            max={1}
            step={0.01}
            aria-label="Volume"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Speaker className="h-4 w-4 text-primary" />
                Speech rate
              </span>
              <span className="text-muted-foreground text-xs">{rate.toFixed(2)}x</span>
            </div>
          </Label>
          <Slider
            value={[rate]}
            onValueChange={(v) => setRate(v[0])}
            min={0.5}
            max={1.75}
            step={0.05}
            aria-label="Speech rate"
          />
        </div>
      </div>

      {/* Mic and transcription */}
      <div className={cn("mt-6 grid gap-4", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-[auto_1fr]")}>
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Visual ring */}
            <div
              className={cn(
                "absolute inset-0 rounded-full transition-all",
                isRecording ? "animate-ping bg-primary/30" : "bg-transparent"
              )}
              aria-hidden
            />
            <Button
              type="button"
              size="lg"
              variant="default"
              aria-pressed={isRecording}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
              onClick={isRecording ? stopListening : startListening}
              className={cn(
                "relative z-10 h-20 w-20 sm:h-24 sm:w-24 rounded-full shadow-md",
                isRecording ? "bg-primary text-primary-foreground" : "bg-accent text-primary hover:bg-accent"
              )}
            >
              {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </Button>
          </div>
        </div>

        <div className="min-w-0">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="transcript" className="flex items-center gap-2">
                <Speech className="h-4 w-4 text-primary" />
                You said
                {isRecording && (
                  <span className="text-xs text-muted-foreground">(listening...)</span>
                )}
                {isProcessing && !isRecording && (
                  <span className="text-xs text-muted-foreground">(processing...)</span>
                )}
              </Label>
              <Textarea
                id="transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={hasSpeechInput === false ? "Type your question…" : "Speak or type your question…"}
                className="bg-secondary min-h-20"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setTranscript("")}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSubmitManual()}
                  disabled={isProcessing || (!transcript && !manualQuery)}
                >
                  Ask
                </Button>
              </div>
              {hasSpeechInput === false && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Keyboard className="h-3.5 w-3.5" />
                  Microphone not supported. Use the keyboard to ask questions.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ai-response" className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-primary" />
                AI response
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => speak(aiResponse || "No response yet.", language)}
                  disabled={!aiResponse || !hasSpeechOutput}
                >
                  Play
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={pauseTts}
                  disabled={!aiResponse || !hasSpeechOutput}
                >
                  Pause
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={resumeTts}
                  disabled={!aiResponse || !hasSpeechOutput}
                >
                  Resume
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={stopTts}
                  disabled={!aiResponse || !hasSpeechOutput}
                >
                  Stop
                </Button>
                {ttsPlaying ? (
                  <Badge className="bg-accent text-accent-foreground">Speaking…</Badge>
                ) : null}
              </div>
              <Textarea
                id="ai-response"
                readOnly
                value={aiResponse}
                placeholder="AI response will appear here."
                className="bg-secondary min-h-28"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick commands */}
      <div className="mt-6">
        <Label className="mb-2 flex items-center gap-2">
          <MessageCircleQuestionMark className="h-4 w-4 text-primary" />
          Quick voice commands
        </Label>
        <div className="flex flex-wrap gap-2">
          {quickCommands.map((c) => {
            const Icon = c.icon;
            return (
              <Button
                key={c.id}
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => handleQuickCommand(c.text)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {c.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* History */}
      <div className="mt-6">
        <Label className="mb-2 flex items-center gap-2">
          <Captions className="h-4 w-4 text-primary" />
          Conversation history
        </Label>
        <Card className="bg-secondary border-border">
          <ScrollArea className="max-h-64">
            <ul className="divide-y divide-border">
              {history.length === 0 ? (
                <li className="p-4 text-sm text-muted-foreground">No conversations yet.</li>
              ) : (
                history.map((h) => (
                  <li key={h.id} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-accent text-accent-foreground">
                          {supportedLanguages.find((l) => l.code === h.lang)?.label || h.lang}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(h.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Play response"
                          onClick={() => speak(h.response, h.lang)}
                        >
                          <Speaker className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-2">
                      <div className="text-sm">
                        <span className="font-semibold">You: </span>
                        <span className="break-words">{h.query}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold">AI: </span>
                        <span className="break-words">{h.response}</span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </ScrollArea>
        </Card>
      </div>

      {/* Footer hints */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Headset className="h-3.5 w-3.5" />
          Touch-friendly controls
        </div>
        <div className="flex items-center gap-1.5">
          <Ear className="h-3.5 w-3.5" />
          Supports multiple local languages
        </div>
        <div className="flex items-center gap-1.5">
          <Speaker className="h-3.5 w-3.5" />
          Text-to-speech playback
        </div>
      </div>
    </Card>
  );
}