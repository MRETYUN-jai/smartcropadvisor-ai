"use client";

import React, { useMemo, useState } from "react";
import { Sprout, Mic, Camera, LayoutGrid, LibraryBig } from "lucide-react";
import VoiceAssistant from "@/components/VoiceAssistant";
import CropImageAnalysis from "@/components/CropImageAnalysis";
import FarmingDashboard from "@/components/FarmingDashboard";
import ResourceLibrary from "@/components/ResourceLibrary";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type AppTab = "assistant" | "analysis" | "dashboard" | "resources";

const uiLanguages = [
  { code: "en", label: "English (India)", speech: "en-IN" },
  { code: "hi", label: "हिन्दी (Hindi)", speech: "hi-IN" },
  { code: "bn", label: "বাংলা (Bengali)", speech: "bn-IN" },
  { code: "mr", label: "मराठी (Marathi)", speech: "mr-IN" },
  { code: "ta", label: "தமிழ் (Tamil)", speech: "ta-IN" },
  { code: "te", label: "తెలుగు (Telugu)", speech: "te-IN" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)", speech: "kn-IN" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)", speech: "pa-IN" },
] as const;

export default function Page() {
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [uiLang, setUiLang] = useState<string>("en");

  const speechLang = useMemo(() => {
    return uiLanguages.find((l) => l.code === uiLang)?.speech ?? "en-IN";
  }, [uiLang]);

  const resourceLangs = useMemo(
    () => uiLanguages.map((l) => ({ code: l.code, label: l.label.split(" (")[0] })),
    []
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 py-6 sm:py-8">
      <header className="mb-6 sm:mb-8">
        <Card className="bg-card border border-border rounded-2xl p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-accent text-primary flex items-center justify-center shrink-0">
                <Sprout className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
                  Smart Crop Advisory System
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">
                  AI assistant, image analysis, personalized advisories, and resources for smallholder farmers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border bg-secondary px-2.5 py-2">
                <span className="text-xs text-muted-foreground">Language</span>
                <Select value={uiLang} onValueChange={setUiLang}>
                  <SelectTrigger className="h-8 w-[140px] bg-secondary">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {uiLanguages.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="secondary" className="bg-accent text-accent-foreground hidden sm:inline-flex">
                Mobile-first • Offline-friendly
              </Badge>
            </div>
          </div>

          <Separator className="my-4" />

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AppTab)} className="w-full">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 bg-muted">
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="assistant" className="gap-2">
                <Mic className="h-4 w-4" />
                Voice Assistant
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2">
                <Camera className="h-4 w-4" />
                Image Analysis
              </TabsTrigger>
              <TabsTrigger value="resources" className="gap-2">
                <LibraryBig className="h-4 w-4" />
                Resources
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
      </header>

      <section className="space-y-6 sm:space-y-8">
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 gap-6">
            <FarmingDashboard />
          </div>
        )}

        {activeTab === "assistant" && (
          <div className="grid grid-cols-1 gap-6">
            <VoiceAssistant initialLanguage={speechLang} />
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="grid grid-cols-1 gap-6">
            <CropImageAnalysis />
          </div>
        )}

        {activeTab === "resources" && (
          <div className="grid grid-cols-1 gap-6">
            <ResourceLibrary languages={resourceLangs} defaultLanguageCode={uiLang} />
          </div>
        )}
      </section>
    </main>
  );
}