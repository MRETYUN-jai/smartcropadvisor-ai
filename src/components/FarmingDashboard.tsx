"use client"

import React, { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Sprout,
  Tractor,
  Wheat,
  CloudRain,
  Leaf,
  Crop,
  LandPlot,
  SquareActivity,
  Carrot,
  Bean,
  Grape,
  WheatOff,
  Salad,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"

type CropType = "wheat" | "rice" | "maize" | "soybean" | "vegetables" | "grapes"
type Practice = "organic" | "drip" | "no-till" | "mulching"

interface Task {
  id: string
  title: string
  due: string
  done: boolean
  category: "field" | "irrigation" | "fertilizer" | "pest" | "harvest"
}

interface PriceRow {
  crop: CropType
  marketPricePerQuintal: number
}

interface CostRow {
  item: string
  category: "seeds" | "fertilizers" | "pesticides" | "labor" | "other"
  cost: number
}

interface WeatherDay {
  day: string
  tempMin: number
  tempMax: number
  rainMM: number
  suggestion: string
}

interface FarmingDashboardProps {
  className?: string
  style?: React.CSSProperties
}

const cropIconMap: Record<CropType, React.ReactNode> = {
  wheat: <Wheat className="size-4 text-foreground" aria-hidden="true" />,
  rice: <Crop className="size-4 text-foreground" aria-hidden="true" />,
  maize: <Sprout className="size-4 text-foreground" aria-hidden="true" />,
  soybean: <Bean className="size-4 text-foreground" aria-hidden="true" />,
  vegetables: <Salad className="size-4 text-foreground" aria-hidden="true" />,
  grapes: <Grape className="size-4 text-foreground" aria-hidden="true" />,
}

export default function FarmingDashboard({ className = "", style }: FarmingDashboardProps) {
  // Farm profile state
  const [crop, setCrop] = useState<CropType | undefined>(undefined)
  const [fieldSize, setFieldSize] = useState<string>("2.5")
  const [location, setLocation] = useState<string>("Wardha, Maharashtra")
  const [practices, setPractices] = useState<Practice[]>(["drip"])
  const [enableReminders, setEnableReminders] = useState(true)

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([
    { id: "t1", title: "Irrigate north plot", due: "Today", done: false, category: "irrigation" },
    { id: "t2", title: "Apply NPK 10-26-26", due: "Fri", done: false, category: "fertilizer" },
    { id: "t3", title: "Scout for aphids", due: "Sat", done: true, category: "pest" },
  ])
  const [newTask, setNewTask] = useState("")

  // Weather mock (would be from API in production)
  const weather: WeatherDay[] = [
    { day: "Mon", tempMin: 22, tempMax: 31, rainMM: 1, suggestion: "Light irrigation ok" },
    { day: "Tue", tempMin: 23, tempMax: 32, rainMM: 6, suggestion: "Delay spraying" },
    { day: "Wed", tempMin: 21, tempMax: 30, rainMM: 0, suggestion: "Fertilize morning" },
    { day: "Thu", tempMin: 22, tempMax: 33, rainMM: 12, suggestion: "Harvest not advised" },
    { day: "Fri", tempMin: 22, tempMax: 31, rainMM: 2, suggestion: "Plan weeding" },
    { day: "Sat", tempMin: 23, tempMax: 34, rainMM: 0, suggestion: "Good for spraying" },
    { day: "Sun", tempMin: 24, tempMax: 35, rainMM: 8, suggestion: "Check drainage" },
  ]

  // Soil health mock
  const soil = { moisture: 62, ph: 6.5, nitrogen: 58, phosphorus: 44, potassium: 66 }

  // Market and cost data
  const prices: PriceRow[] = [
    { crop: "wheat", marketPricePerQuintal: 2350 },
    { crop: "soybean", marketPricePerQuintal: 4850 },
    { crop: "vegetables", marketPricePerQuintal: 1800 },
  ]
  const costs: CostRow[] = [
    { item: "Certified seeds", category: "seeds", cost: 4200 },
    { item: "Urea + DAP", category: "fertilizers", cost: 3100 },
    { item: "Imidacloprid", category: "pesticides", cost: 950 },
    { item: "Labor (weeding)", category: "labor", cost: 1500 },
  ]
  const estimatedYieldQuintal = 18 // mock, would depend on crop and field size

  const totalCosts = useMemo(() => costs.reduce((a, c) => a + c.cost, 0), [costs])
  const selectedMarketPrice =
    prices.find((p) => p.crop === (crop ?? "wheat"))?.marketPricePerQuintal ?? prices[0].marketPricePerQuintal
  const revenueEstimate = Math.round(estimatedYieldQuintal * selectedMarketPrice)
  const profitEstimate = revenueEstimate - totalCosts

  // Growth stage mock per crop
  const stage = useMemo(() => {
    if (!crop) return { label: "Select crop", progress: 0 }
    const stages: Record<CropType, { label: string; progress: number }> = {
      wheat: { label: "Tillering", progress: 45 },
      rice: { label: "Panicle Initiation", progress: 52 },
      maize: { label: "V6 Vegetative", progress: 40 },
      soybean: { label: "Flowering", progress: 60 },
      vegetables: { label: "Vegetative", progress: 35 },
      grapes: { label: "Berry Set", progress: 55 },
    }
    return stages[crop]
  }, [crop])

  const health = 78 // mock health score

  function togglePractice(p: Practice) {
    setPractices((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function addTask() {
    const title = newTask.trim()
    if (!title) {
      toast.error("Task cannot be empty")
      return
    }
    const t: Task = {
      id: Math.random().toString(36).slice(2),
      title,
      due: "This week",
      done: false,
      category: "field",
    }
    setTasks((prev) => [t, ...prev])
    setNewTask("")
    if (enableReminders) toast.success("Task added and reminder set")
  }

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    )
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    toast.message("Task removed")
  }

  return (
    <section
      className={`w-full max-w-full ${className}`}
      style={style}
      aria-label="Farming advisory dashboard"
    >
      <div className="space-y-6">
        <header className="flex flex-col gap-2">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Farming Advisory Dashboard</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Personalized insights for your fields, crops, and upcoming activities.
          </p>
        </header>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-secondary">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Tractor className="size-5 text-primary" aria-hidden="true" />
                    Farm Profile
                  </CardTitle>
                  <CardDescription>Set your crop, field size, and practices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      inputMode="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Village, District"
                      className="bg-secondary"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="fieldSize">Field size (acres)</Label>
                    <Input
                      id="fieldSize"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={fieldSize}
                      onChange={(e) => setFieldSize(e.target.value)}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label>Crop type</Label>
                    <Select onValueChange={(v: CropType) => setCrop(v)}>
                      <SelectTrigger className="bg-secondary">
                        <SelectValue placeholder="Choose crop" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wheat">Wheat</SelectItem>
                        <SelectItem value="rice">Rice</SelectItem>
                        <SelectItem value="maize">Maize</SelectItem>
                        <SelectItem value="soybean">Soybean</SelectItem>
                        <SelectItem value="vegetables">Vegetables</SelectItem>
                        <SelectItem value="grapes">Grapes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Practices</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["organic", "drip", "no-till", "mulching"] as Practice[]).map((p) => {
                        const active = practices.includes(p)
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => togglePractice(p)}
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-muted"
                            }`}
                            aria-pressed={active}
                          >
                            <Leaf className="size-3.5" aria-hidden="true" />
                            {p}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reminders">Reminders</Label>
                      <p className="text-xs text-muted-foreground">Get task notifications</p>
                    </div>
                    <Switch
                      id="reminders"
                      checked={enableReminders}
                      onCheckedChange={setEnableReminders}
                      aria-label="Toggle reminders"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <SquareActivity className="size-5 text-primary" aria-hidden="true" />
                    Crop Status
                  </CardTitle>
                  <CardDescription>Growth, health, and next actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-accent text-accent-foreground">
                      {crop ? (
                        <span className="inline-flex items-center gap-1">
                          {cropIconMap[crop]}
                          {crop}
                        </span>
                      ) : (
                        "No crop selected"
                      )}
                    </Badge>
                    <span className="text-sm text-muted-foreground break-words">
                      {location}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Growth stage</span>
                        <span className="text-sm text-muted-foreground">{stage.label}</span>
                      </div>
                      <Progress value={stage.progress} className="h-2 mt-2" />
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="text-xs text-muted-foreground">Health score</p>
                      <p className="text-lg font-semibold">{health}%</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="text-xs text-muted-foreground">Field size</p>
                      <p className="text-lg font-semibold">{Number(fieldSize || 0).toFixed(1)} ac</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="text-xs text-muted-foreground">Practices</p>
                      <p className="text-lg font-semibold">{practices.length}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Recommended actions</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CloudRain className="mt-0.5 size-4 text-primary" aria-hidden="true" />
                        <span className="text-sm">
                          Irrigate 12–15 mm late evening. Skip if rainfall exceeds 5 mm.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sprout className="mt-0.5 size-4 text-primary" aria-hidden="true" />
                        <span className="text-sm">
                          Apply 20 kg/acre urea during {stage.label.toLowerCase()} stage.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Carrot className="mt-0.5 size-4 text-primary" aria-hidden="true" />
                        <span className="text-sm">Hand weeding scheduled Friday morning.</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <CloudRain className="size-5 text-primary" aria-hidden="true" />
                    Weather (7-day)
                  </CardTitle>
                  <CardDescription>Forecast and activity suggestions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {weather.map((d, i) => {
                      const heavy = d.rainMM >= 8
                      return (
                        <div
                          key={i}
                          className={`rounded-lg border bg-secondary p-3 transition-colors ${
                            heavy ? "border-destructive/40" : "border-border/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{d.day}</span>
                            <Badge variant="secondary" className={heavy ? "bg-destructive text-destructive-foreground" : "bg-accent text-accent-foreground"}>
                              {d.rainMM} mm
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-sm">
                            <span>{d.tempMin}°</span>
                            <span className="text-muted-foreground">/</span>
                            <span>{d.tempMax}°C</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{d.suggestion}</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
              <Card className="bg-card md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <LandPlot className="size-5 text-primary" aria-hidden="true" />
                    Soil Health
                  </CardTitle>
                  <CardDescription>Moisture, pH, and nutrient status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-secondary p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Moisture</span>
                        <CloudRain className="size-4 text-primary" aria-hidden="true" />
                      </div>
                      <Progress value={soil.moisture} className="h-2 mt-3" />
                      <p className="mt-2 text-sm">{soil.moisture}%</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Soil pH</span>
                        <Leaf className="size-4 text-primary" aria-hidden="true" />
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${(soil.ph / 14) * 100}%` }}
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-2 text-sm">pH {soil.ph}</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Nutrients</span>
                        <Sprout className="size-4 text-primary" aria-hidden="true" />
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>N</span>
                          <span>{soil.nitrogen}%</span>
                        </div>
                        <Progress value={soil.nitrogen} className="h-1.5" />
                        <div className="flex items-center justify-between text-xs">
                          <span>P</span>
                          <span>{soil.phosphorus}%</span>
                        </div>
                        <Progress value={soil.phosphorus} className="h-1.5" />
                        <div className="flex items-center justify-between text-xs">
                          <span>K</span>
                          <span>{soil.potassium}%</span>
                        </div>
                        <Progress value={soil.potassium} className="h-1.5" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-secondary p-4">
                    <p className="text-sm font-medium">Soil advice</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      With pH {soil.ph}, use balanced NPK and add organic matter. Schedule irrigation on low-rain days.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="size-5 text-primary" aria-hidden="true" />
                    Personalized Tips
                  </CardTitle>
                  <CardDescription>Tailored to your crop and history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-sm">
                      {crop ? `Based on ${crop} and ${location}` : "Select crop to get precise tips"}:
                    </p>
                    <ul className="mt-2 list-disc pl-5 text-sm">
                      <li>Spray in early morning to reduce drift.</li>
                      <li>Keep 3–4 cm water level if rice; otherwise avoid waterlogging.</li>
                      <li>Scout twice a week for pests after rainfall events.</li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      className="w-full"
                      onClick={() => toast.success("Recommendations refreshed")}
                    >
                      Refresh recommendations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="planning" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
              <Card className="bg-card md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Crop className="size-5 text-primary" aria-hidden="true" />
                    Seasonal Calendar
                  </CardTitle>
                  <CardDescription>Planting, fertilizing, harvesting</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[280px]">
                    <ul className="space-y-3 pr-2">
                      {[
                        { month: "Jun", action: "Sowing", detail: "Use certified seeds; seed rate 40 kg/acre" },
                        { month: "Jul", action: "Basal fertilizer", detail: "DAP 50 kg/acre at sowing" },
                        { month: "Aug", action: "Weeding", detail: "Inter-cultivation after 20 days" },
                        { month: "Sep", action: "Top dressing", detail: "Urea 25 kg/acre at tillering" },
                        { month: "Oct", action: "Pest management", detail: "Aphid monitoring and spray if threshold" },
                        { month: "Nov", action: "Irrigation", detail: "Flowering stage; avoid stress" },
                        { month: "Dec", action: "Harvesting", detail: "Grain moisture ~18%; harvest in morning" },
                      ].map((e, idx) => (
                        <li key={idx} className="flex items-start gap-3 rounded-lg border bg-secondary p-3">
                          <Badge variant="secondary" className="bg-accent text-accent-foreground shrink-0">
                            {e.month}
                          </Badge>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{e.action}</p>
                            <p className="text-sm text-muted-foreground break-words">{e.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <SquareActivity className="size-5 text-primary" aria-hidden="true" />
                    Tasks
                  </CardTitle>
                  <CardDescription>Daily activities and reminders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add a task"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      className="bg-secondary"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTask()
                      }}
                      aria-label="New task"
                    />
                    <Button onClick={addTask} aria-label="Add task">Add</Button>
                  </div>
                  <Separator />
                  <ScrollArea className="h-[260px]">
                    <ul className="space-y-2 pr-2">
                      {tasks.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center justify-between gap-3 rounded-lg border bg-secondary p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-muted text-foreground">
                                {t.category}
                              </Badge>
                              <span className={`text-sm ${t.done ? "line-through text-muted-foreground" : ""} truncate`}>
                                {t.title}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{t.due}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant={t.done ? "secondary" : "default"}
                              onClick={() => toggleTask(t.id)}
                              aria-pressed={t.done}
                              className="px-2"
                            >
                              {t.done ? "Undo" : "Done"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => removeTask(t.id)} className="px-2">
                              Remove
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <Progress
                      value={
                        tasks.length === 0
                          ? 0
                          : Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100)
                      }
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
              <Card className="bg-card md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Tractor className="size-5 text-primary" aria-hidden="true" />
                    Market Prices
                  </CardTitle>
                  <CardDescription>Local mandi rates (per quintal)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {prices.map((p, i) => (
                      <div key={i} className="rounded-lg border bg-secondary p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize inline-flex items-center gap-1">
                            {cropIconMap[p.crop]} {p.crop}
                          </span>
                          <Badge variant="secondary" className="bg-accent text-accent-foreground">
                            ₹{p.marketPricePerQuintal.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-secondary p-4">
                      <p className="text-sm font-medium">Costs</p>
                      <ul className="mt-2 space-y-2">
                        {costs.map((c, i) => (
                          <li key={i} className="flex items-center justify-between gap-2">
                            <span className="text-sm truncate">{c.item}</span>
                            <span className="text-sm font-semibold">₹{c.cost.toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-center justify-between border-t pt-3">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="text-sm font-semibold">
                          ₹{totalCosts.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-secondary p-4">
                      <p className="text-sm font-medium">Profit/Loss Estimate</p>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Expected yield</span>
                          <span>{estimatedYieldQuintal} qtl</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Price/qtl</span>
                          <span>₹{selectedMarketPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Revenue</span>
                          <span className="font-semibold">₹{revenueEstimate.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Costs</span>
                          <span className="font-semibold">₹{totalCosts.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm border-t pt-2">
                          <span>Profit/Loss</span>
                          <span
                            className={`font-semibold ${
                              profitEstimate >= 0 ? "text-primary" : "text-destructive"
                            }`}
                          >
                            ₹{profitEstimate.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        className="mt-3 w-full"
                        onClick={() => toast.success("Finance summary exported")}
                      >
                        Export summary
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <WheatOff className="size-5 text-primary" aria-hidden="true" />
                    Input Tracker
                  </CardTitle>
                  <CardDescription>Seeds, fertilizers, pesticides</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border bg-secondary p-3">
                    <p className="text-sm font-medium">Recent Purchases</p>
                    <ul className="mt-2 space-y-2">
                      <li className="flex items-center justify-between text-sm">
                        <span>Wheat seeds</span>
                        <span>₹1,800</span>
                      </li>
                      <li className="flex items-center justify-between text-sm">
                        <span>DAP 50kg</span>
                        <span>₹1,350</span>
                      </li>
                      <li className="flex items-center justify-between text-sm">
                        <span>Herbicide</span>
                        <span>₹650</span>
                      </li>
                    </ul>
                  </div>
                  <Button variant="secondary" className="w-full bg-accent text-accent-foreground hover:bg-accent/80">
                    Add new input
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
              <Card className="bg-card md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="size-5 text-primary" aria-hidden="true" />
                    Expert Tips
                  </CardTitle>
                  <CardDescription>Best practices and crop advisories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-secondary p-4">
                      <p className="text-sm font-medium">Irrigation timing</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Water early morning or late evening to reduce evaporation and stress.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-secondary p-4">
                      <p className="text-sm font-medium">Fertilizer placement</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Band placement near root zone improves uptake and reduces loss.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-secondary p-4">
                      <p className="text-sm font-medium">Pest thresholds</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Apply control only when pest population crosses economic threshold.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-secondary p-4">
                      <p className="text-sm font-medium">Post-harvest</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Dry grains to safe moisture and store in clean, aerated bins.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Tractor className="size-5 text-primary" aria-hidden="true" />
                    Schemes & Subsidies
                  </CardTitle>
                  <CardDescription>Government support programs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border bg-secondary p-3">
                    <p className="text-sm font-medium">PM-KUSUM</p>
                    <p className="text-sm text-muted-foreground">
                      Subsidy for solar pumps and renewable energy for irrigation.
                    </p>
                    <Badge className="mt-2" variant="secondary">Open</Badge>
                  </div>
                  <div className="rounded-lg border bg-secondary p-3">
                    <p className="text-sm font-medium">Soil Health Card</p>
                    <p className="text-sm text-muted-foreground">
                      Free soil testing and tailored nutrient recommendations.
                    </p>
                    <Badge className="mt-2" variant="secondary">Available</Badge>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => toast.message("Scheme details downloaded")}
                  >
                    Download details
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}