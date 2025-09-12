"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Camera,
  Image as ImageIcon,
  Images,
  Scan,
  ImageOff,
  GalleryThumbnails,
  FileScan,
  GalleryVertical,
  ImageDown,
  MonitorCheck,
  Crop as CropIcon,
  Tractor,
  Lasso,
  ImageUpscale,
  ImagePlay,
  InspectionPanel,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

type AnalysisResult = {
  label: string
  confidence: number
  details: string
  recommendations: string[]
  severity: "low" | "moderate" | "high" | "critical"
}

type HistoryItem = {
  id: string
  date: string
  crop: string
  issueType: string
  image: string
  processedImage?: string
  result?: AnalysisResult
  progressLog: { date: string; note: string }[]
  status: "analyzed" | "queued"
}

interface CropImageAnalysisProps {
  className?: string
  defaultCrop?: "rice" | "wheat" | "cotton" | "maize" | "sugarcane" | "soybean" | "potato" | "tomato"
}

const LS_HISTORY_KEY = "sca.crop.history.v1"

const crops = ["rice", "wheat", "cotton", "maize", "sugarcane", "soybean", "potato", "tomato"] as const
const issueTypes = ["disease", "pest", "nutrient-deficiency"] as const

export default function CropImageAnalysis({ className, defaultCrop = "rice" }: CropImageAnalysisProps) {
  const [selectedCrop, setSelectedCrop] = useState<string>(defaultCrop)
  const [issueType, setIssueType] = useState<string>("disease")
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [isCapturing, setIsCapturing] = useState(false)
  const [tab, setTab] = useState<"capture" | "upload" | "history">("capture")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load history on client
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_HISTORY_KEY) : null
      if (raw) {
        setHistory(JSON.parse(raw) as HistoryItem[])
      }
    } catch {
      // ignore
    }
  }, [])

  // Persist history
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history))
    } catch {
      // ignore
    }
  }, [history])

  // Camera start/stop
  const startCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera not supported on this device.")
      return
    }
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
      setIsCapturing(true)
      toast.success("Camera started")
    } catch (e) {
      setError("Unable to access camera. Please grant permission or use upload.")
      toast.error("Camera permission denied")
    }
  }, [])

  const stopCamera = useCallback(() => {
    const video = videoRef.current
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream
      stream.getTracks().forEach((t) => t.stop())
      video.srcObject = null
    }
    setIsCapturing(false)
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const w = video.videoWidth || 1280
    const h = video.videoHeight || 720
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
    setActiveImage(dataUrl)
    setProcessedImage(null)
    setResult(null)
    setQualityWarnings([])
    setTab("upload")
    evaluateQuality(dataUrl).then((warnings) => setQualityWarnings(warnings))
    toast.success("Photo captured")
  }, [])

  // File handling
  const onFileSelected = useCallback((file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      setActiveImage(dataUrl)
      setProcessedImage(null)
      setResult(null)
      setQualityWarnings([])
      evaluateQuality(dataUrl).then((warnings) => setQualityWarnings(warnings))
      toast.success("Image loaded")
    }
    reader.readAsDataURL(file)
  }, [])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) onFileSelected(file)
  }, [onFileSelected])

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // Quality evaluation: simple heuristics (dimensions + brightness)
  async function evaluateQuality(dataUrl: string): Promise<string[]> {
    const warnings: string[] = []
    try {
      const img = await loadImage(dataUrl)
      if (img.width < 640 || img.height < 480) {
        warnings.push("Low resolution image detected. Capture closer or use a higher resolution.")
      }
      const brightness = await estimateBrightness(img)
      if (brightness < 60) {
        warnings.push("Image appears too dark. Move to better lighting or avoid strong shadows.")
      } else if (brightness > 200) {
        warnings.push("Image appears overexposed. Reduce glare or avoid direct harsh sunlight.")
      }
    } catch {
      // ignore
    }
    return warnings
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  async function estimateBrightness(img: HTMLImageElement): Promise<number> {
    const canvas = document.createElement("canvas")
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext("2d")
    if (!ctx) return 128
    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, Math.min(200, img.width), Math.min(200, img.height)).data
    let total = 0
    let count = 0
    for (let i = 0; i < data.length; i += 4 * 16) { // sample sparsely for perf
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      total += (r + g + b) / 3
      count++
    }
    return total / Math.max(1, count)
  }

  // Mock analysis
  const analyze = useCallback(async () => {
    setError(null)
    if (!activeImage) {
      setError("Please capture or upload a crop image first.")
      toast.error("No image to analyze")
      return
    }
    setIsAnalyzing(true)
    setProgress(0)
    setResult(null)
    setProcessedImage(null)

    const id = crypto.randomUUID()
    const queuedItem: HistoryItem = {
      id,
      date: new Date().toISOString(),
      crop: selectedCrop,
      issueType,
      image: activeImage,
      status: navigator.onLine ? "analyzed" : "queued",
      progressLog: [],
    }

    if (!navigator.onLine) {
      setHistory((prev) => [queuedItem, ...prev])
      toast.message("Saved offline", {
        description: "Will analyze automatically when online.",
      })
      setIsAnalyzing(false)
      return
    }

    // Simulate progressive analysis
    for (let p of [12, 24, 36, 48, 60, 72, 84, 92, 100]) {
      await new Promise((r) => setTimeout(r, 300))
      setProgress(p)
    }

    const mock = mockDiagnosis(selectedCrop, issueType)
    setResult(mock)

    // produce a subtle "processed" overlay
    try {
      const processed = await renderProcessed(activeImage)
      setProcessedImage(processed)
    } catch {
      setProcessedImage(null)
    }

    setHistory((prev) => [
      {
        ...queuedItem,
        result: mock,
        processedImage: processedImage || undefined,
        status: "analyzed",
      },
      ...prev,
    ])
    toast.success("Analysis complete")
    setIsAnalyzing(false)
  }, [activeImage, selectedCrop, issueType, processedImage])

  // Re-analyze queued when online again
  useEffect(() => {
    function handleOnline() {
      const queued = history.filter((h) => h.status === "queued")
      if (queued.length === 0) return
      toast.message("Back online", { description: "Analyzing saved images..." })
      queued.forEach(async (item) => {
        const mock = mockDiagnosis(item.crop, item.issueType)
        setHistory((prev) =>
          prev.map((h) =>
            h.id === item.id
              ? { ...h, result: mock, status: "analyzed" }
              : h
          )
        )
      })
    }
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline)
      return () => window.removeEventListener("online", handleOnline)
    }
  }, [history])

  // Simple processed rendering: add bounding box overlay impression
  async function renderProcessed(dataUrl: string): Promise<string> {
    const img = await loadImage(dataUrl)
    const canvas = document.createElement("canvas")
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext("2d")
    if (!ctx) return dataUrl
    ctx.drawImage(img, 0, 0)
    // draw green translucent box to mimic detected area
    const w = Math.floor(img.width * 0.4)
    const h = Math.floor(img.height * 0.4)
    const x = Math.floor((img.width - w) / 2)
    const y = Math.floor((img.height - h) / 2)
    ctx.strokeStyle = "#0f766e"
    ctx.lineWidth = Math.max(2, Math.floor(img.width / 400))
    ctx.fillStyle = "rgba(15,118,110,0.15)"
    ctx.fillRect(x, y, w, h)
    ctx.strokeRect(x, y, w, h)
    return canvas.toDataURL("image/jpeg", 0.92)
  }

  function mockDiagnosis(crop: string, issue: string): AnalysisResult {
    const labels: Record<string, string[]> = {
      disease: ["Leaf blight", "Rust", "Powdery mildew", "Leaf spot"],
      pest: ["Aphid infestation", "Stem borer", "Whitefly damage", "Armyworm"],
      "nutrient-deficiency": ["Nitrogen deficiency", "Potassium deficiency", "Phosphorus deficiency", "Iron chlorosis"],
    }
    const label = labels[issue]?.[Math.floor(Math.random() * labels[issue].length)] || "General issue"
    const confidence = Math.round((0.68 + Math.random() * 0.28) * 100) / 100
    const sevPick = confidence > 0.85 ? ["moderate", "high"] : ["low", "moderate"]
    const severity = sevPick[Math.floor(Math.random() * sevPick.length)] as AnalysisResult["severity"]
    const recommendations = [
      "Remove severely affected leaves to reduce spread.",
      "Apply recommended treatment during early morning or late afternoon.",
      "Improve field sanitation and avoid overhead irrigation if possible.",
    ]
    const details = `Detected signs consistent with ${label.toLowerCase()} on ${crop}.`
    return { label, confidence, details, recommendations, severity }
  }

  const severityStyles = useMemo(() => {
    return {
      low: "bg-accent text-[--color-accent-foreground]",
      moderate: "bg-chart-4/10 text-[--color-foreground]",
      high: "bg-destructive/10 text-destructive",
      critical: "bg-destructive text-destructive-foreground",
    } as Record<AnalysisResult["severity"], string>
  }, [])

  const handleShare = useCallback(async () => {
    if (!result || !activeImage) {
      toast.error("No analysis to share yet.")
      return
    }
    const shareText = `Crop: ${selectedCrop}\nIssue: ${issueType}\nDiagnosis: ${result.label} (conf: ${(result.confidence * 100).toFixed(0)}%)\nSeverity: ${result.severity}`
    if (navigator.share) {
      try {
        await navigator.share({ title: "Crop Analysis Result", text: shareText })
        toast.success("Shared")
      } catch {
        // canceled
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      toast.success("Copied summary to clipboard")
    }
  }, [result, activeImage, selectedCrop, issueType])

  const addProgressNote = useCallback(() => {
    if (!result || !activeImage) {
      toast.error("Run analysis before tracking progress.")
      return
    }
    if (!note.trim()) {
      toast.error("Add a brief note first.")
      return
    }
    const now = new Date().toISOString()
    // add to most recent matching item (same image)
    setHistory((prev) => {
      const idx = prev.findIndex((h) => h.image === activeImage)
      if (idx === -1) return prev
      const updated = [...prev]
      updated[idx] = {
        ...updated[idx],
        progressLog: [{ date: now, note: note.trim() }, ...updated[idx].progressLog],
      }
      return updated
    })
    setNote("")
    toast.success("Progress noted")
  }, [note, result, activeImage])

  const resetActive = useCallback(() => {
    setActiveImage(null)
    setProcessedImage(null)
    setResult(null)
    setProgress(0)
    setQualityWarnings([])
    setError(null)
  }, [])

  return (
    <section className={cn("w-full max-w-full", className)} aria-label="Crop Image Analysis">
      <Card className="bg-card border border-border rounded-lg shadow-sm">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <MonitorCheck className="h-5 w-5 text-[--color-primary]" aria-hidden />
            <CardTitle className="text-lg sm:text-xl">Crop Image Analysis</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Capture or upload a crop image to assess health, diagnose issues, and get treatment recommendations.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="crop">Crop</Label>
              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger id="crop" className="bg-secondary">
                  <SelectValue placeholder="Select crop" />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((c) => (
                    <SelectItem key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issue">Issue type</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger id="issue" className="bg-secondary">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disease">Disease</SelectItem>
                  <SelectItem value="pest">Pest</SelectItem>
                  <SelectItem value="nutrient-deficiency">Nutrient deficiency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Progress note (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="E.g., sprayed fungicide today"
                  className="bg-secondary"
                />
                <Button type="button" onClick={addProgressNote} variant="secondary" aria-label="Add progress note">
                  <Tractor className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-muted">
              <TabsTrigger value="capture" className="gap-1">
                <Camera className="h-4 w-4" /> Capture
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-1">
                <Images className="h-4 w-4" /> Upload
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1">
                <GalleryThumbnails className="h-4 w-4" /> History
              </TabsTrigger>
            </TabsList>

            {/* Capture */}
            <TabsContent value="capture" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-[1fr]">
                <div className="relative bg-secondary rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted">
                    <div className="flex items-center gap-2">
                      <ImagePlay className="h-4 w-4 text-[--color-primary]" />
                      <span className="text-sm font-medium">Live camera</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isCapturing ? (
                        <Button type="button" size="sm" onClick={startCamera}>
                          <Camera className="h-4 w-4 mr-1" /> Start
                        </Button>
                      ) : (
                        <Button type="button" variant="secondary" size="sm" onClick={stopCamera}>
                          <ImageOff className="h-4 w-4 mr-1" /> Stop
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        onClick={capturePhoto}
                        disabled={!isCapturing}
                      >
                        <Scan className="h-4 w-4 mr-1" /> Capture
                      </Button>
                    </div>
                  </div>
                  <div className="relative aspect-video bg-card">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      aria-label="Camera preview"
                    />
                  </div>
                </div>

                <div className="bg-secondary rounded-lg border border-border p-4">
                  <div className="flex items-start gap-3">
                    <InspectionPanel className="h-5 w-5 text-[--color-primary] mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Photo tips for best results</p>
                      <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <li className="flex gap-2"><Lasso className="h-4 w-4 mt-0.5" /> Focus on affected leaves clearly.</li>
                        <li className="flex gap-2"><ImageUpscale className="h-4 w-4 mt-0.5" /> Fill frame with leaf; avoid background clutter.</li>
                        <li className="flex gap-2"><CropIcon className="h-4 w-4 mt-0.5" /> Capture from top-down at 30–45° angle.</li>
                        <li className="flex gap-2"><ImageDown className="h-4 w-4 mt-0.5" /> Use soft daylight; avoid harsh glare or deep shadows.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </TabsContent>

            {/* Upload */}
            <TabsContent value="upload" className="mt-4">
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                className="border-2 border-dashed border-input rounded-lg bg-secondary p-6 text-center transition-colors"
                aria-label="Drag and drop image area"
              >
                <div className="flex flex-col items-center gap-2">
                  <GalleryVertical className="h-6 w-6 text-[--color-primary]" aria-hidden />
                  <p className="text-sm">
                    Drag and drop a crop image here, or choose from your gallery
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onFileSelected(file)
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => inputRef.current?.click()}
                    >
                      <ImageIcon className="h-4 w-4 mr-1" /> Choose image
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (!activeImage) {
                          toast.error("No image selected")
                          return
                        }
                        // Download current image
                        const a = document.createElement("a")
                        a.href = activeImage
                        a.download = `crop-${selectedCrop}.jpg`
                        a.click()
                      }}
                    >
                      <ImageDown className="h-4 w-4 mr-1" /> Save image
                    </Button>
                  </div>
                </div>
              </div>

              {activeImage ? (
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <figure className="bg-card rounded-lg border border-border p-2">
                    <figcaption className="flex items-center gap-2 px-2 py-1">
                      <ImageIcon className="h-4 w-4 text-[--color-primary]" />
                      <span className="text-sm font-medium">Original</span>
                    </figcaption>
                    <div className="relative overflow-hidden rounded-md">
                      <img
                        src={activeImage}
                        alt="Selected crop image"
                        className="w-full h-auto max-w-full object-contain"
                      />
                    </div>
                  </figure>
                  <figure className="bg-card rounded-lg border border-border p-2">
                    <figcaption className="flex items-center gap-2 px-2 py-1">
                      <FileScan className="h-4 w-4 text-[--color-primary]" />
                      <span className="text-sm font-medium">After analysis</span>
                    </figcaption>
                    <div className="relative overflow-hidden rounded-md min-h-24 flex items-center justify-center">
                      {processedImage ? (
                        <img
                          src={processedImage}
                          alt="Processed crop analysis overlay"
                          className="w-full h-auto max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Scan className="h-4 w-4" /> No processed view yet
                        </div>
                      )}
                    </div>
                  </figure>
                </div>
              ) : (
                <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
                  <ImageOff className="h-4 w-4" /> No image selected
                </div>
              )}

              {/* Quality warnings and analysis actions */}
              <div className="mt-4 flex flex-col gap-3">
                {qualityWarnings.length > 0 && (
                  <div className="bg-accent/60 border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MonitorCheck className="h-4 w-4 text-[--color-primary]" />
                      <span className="text-sm font-medium">Image quality suggestions</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      {qualityWarnings.map((w, i) => (
                        <li key={i} className="break-words">{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 text-destructive border border-destructive/40 rounded-lg p-3 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={analyze} disabled={!activeImage || isAnalyzing}>
                    <Scan className="h-4 w-4 mr-1" />
                    {isAnalyzing ? "Analyzing..." : "Analyze image"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={resetActive}>
                    <Images className="h-4 w-4 mr-1" /> New image
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleShare}
                    disabled={!result}
                  >
                    <GalleryThumbnails className="h-4 w-4 mr-1" /> Share
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      toast.message("Contact local extension", {
                        description:
                          "Please reach out to your local agricultural extension officer with the shared summary.",
                      })
                    }}
                  >
                    <Tractor className="h-4 w-4 mr-1" /> Extension services
                  </Button>
                </div>

                {isAnalyzing && (
                  <div className="rounded-lg border border-border p-3 bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileScan className="h-4 w-4 text-[--color-primary]" />
                        <span className="text-sm font-medium">Running analysis</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {result && (
                  <div className="grid gap-4 sm:grid-cols-5">
                    <div className="sm:col-span-3 bg-card border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <InspectionPanel className="h-5 w-5 text-[--color-primary]" />
                          <h3 className="text-base font-semibold break-words">
                            {result.label}
                          </h3>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Confidence {(result.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 break-words">
                        {result.details}
                      </p>
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Recommendations</p>
                        <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                          {result.recommendations.map((r, i) => (
                            <li key={i} className="break-words">{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="sm:col-span-2 bg-card border border-border rounded-lg p-4">
                      <p className="text-sm font-medium">Severity</p>
                      <div className={cn("mt-2 inline-flex px-2.5 py-1 rounded-md text-xs", severityStyles[result.severity])}>
                        {result.severity.toUpperCase()}
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Follow-up tips</p>
                        <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                          <li>Reassess in 3–5 days and log progress.</li>
                          <li>If worsening, consult a local expert.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* History */}
            <TabsContent value="history" className="mt-4">
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <GalleryThumbnails className="h-4 w-4" /> No history yet
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <ScrollArea className="w-full max-w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {history.map((h) => (
                        <div key={h.id} className="border border-border rounded-lg bg-card overflow-hidden">
                          <div className="relative aspect-video bg-secondary">
                            <img
                              src={h.processedImage || h.image}
                              alt={`${h.crop} ${h.issueType} analysis`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 flex gap-1">
                              <Badge variant="secondary" className="text-xs capitalize">{h.crop}</Badge>
                              <Badge variant="secondary" className="text-xs capitalize">{h.issueType.replace("-", " ")}</Badge>
                              {h.status === "queued" && (
                                <Badge className="text-xs bg-chart-4/10 text-foreground">Queued</Badge>
                              )}
                            </div>
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{h.result?.label ?? "Pending analysis"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(h.date).toLocaleString()}
                                </p>
                              </div>
                              {h.result && (
                                <Badge variant="outline" className="text-xs">
                                  {(h.result.confidence * 100).toFixed(0)}%
                                </Badge>
                              )}
                            </div>
                            {h.result && (
                              <div className="text-xs text-muted-foreground line-clamp-3">
                                {h.result.details}
                              </div>
                            )}
                            {h.progressLog.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium mb-1">Progress</p>
                                <ul className="space-y-1">
                                  {h.progressLog.slice(0, 2).map((p, i) => (
                                    <li key={i} className="text-xs text-muted-foreground break-words">
                                      • {new Date(p.date).toLocaleDateString()}: {p.note}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setActiveImage(h.image)
                                  setProcessedImage(h.processedImage || null)
                                  setResult(h.result || null)
                                  setSelectedCrop(h.crop)
                                  setIssueType(h.issueType)
                                  setTab("upload")
                                  toast.success("Loaded from history")
                                }}
                              >
                                <ImageIcon className="h-4 w-4 mr-1" /> Load
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setHistory((prev) => prev.filter((x) => x.id !== h.id))
                                  toast.success("Removed from history")
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 items-stretch">
          <div className="grid sm:grid-cols-3 gap-3 w-full">
            <div className="bg-secondary rounded-md p-3 border border-border">
              <div className="flex items-center gap-2">
                <CropIcon className="h-4 w-4 text-[--color-primary]" />
                <span className="text-sm font-medium">Optimal framing</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Keep the affected leaf centered and fill most of the frame. Hold steady for a clear image.
              </p>
            </div>
            <div className="bg-secondary rounded-md p-3 border border-border">
              <div className="flex items-center gap-2">
                <ImageUpscale className="h-4 w-4 text-[--color-primary]" />
                <span className="text-sm font-medium">Lighting</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use natural diffused light. Avoid backlighting and strong reflections on glossy leaves.
              </p>
            </div>
            <div className="bg-secondary rounded-md p-3 border border-border">
              <div className="flex items-center gap-2">
                <MonitorCheck className="h-4 w-4 text-[--color-primary]" />
                <span className="text-sm font-medium">Angle</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Shoot at 30–45° angle to show texture and lesions clearly. Take multiple angles if unsure.
              </p>
            </div>
          </div>
          <div aria-live="polite" className="sr-only">
            {isAnalyzing ? `Analyzing image ${progress} percent` : result ? `Analysis complete: ${result.label}` : ""}
          </div>
        </CardFooter>
      </Card>
    </section>
  )
}