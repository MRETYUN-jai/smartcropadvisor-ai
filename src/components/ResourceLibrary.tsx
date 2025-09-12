"use client";

import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Sprout,
  LibraryBig,
  BookText,
  BookUser,
  Bean,
  BookOpenCheck,
  BookOpen,
  Wheat,
  WheatOff,
  Salad,
  LandPlot,
  Carrot,
  Tractor,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type LanguageOption = {
  code: string;
  label: string;
};

type ResourceItem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  type: "guide" | "video" | "doc" | "tip";
  downloadable?: boolean;
  durationMin?: number;
  icon?: React.ReactNode;
};

type Contact = {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  location?: string;
  org?: string;
  hours?: string;
  category: "expert" | "gov" | "helpline";
};

export interface ResourceLibraryProps {
  className?: string;
  style?: React.CSSProperties;
  languages?: LanguageOption[];
  defaultLanguageCode?: string;
  initialQuery?: string;
  onSearchChange?: (query: string) => void;
}

const defaultLanguages: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "te", label: "తెలుగు" },
  { code: "ta", label: "தமிழ்" },
  { code: "mr", label: "मराठी" },
];

const guides: ResourceItem[] = [
  {
    id: "g1",
    title: "Rice Cultivation: Land Prep to Harvest",
    description:
      "Comprehensive, step-by-step guide covering nursery raising, transplanting, irrigation, nutrient management, and harvesting.",
    tags: ["rice", "irrigation", "harvest"],
    type: "guide",
    downloadable: true,
    icon: <Wheat className="h-5 w-5 text-primary" aria-hidden="true" />,
  },
  {
    id: "g2",
    title: "Tomato: High-Yield Practices",
    description:
      "From seed selection to staking and pest control schedules, maximize tomato yield sustainably.",
    tags: ["tomato", "staking", "schedule"],
    type: "guide",
    downloadable: true,
    icon: <Carrot className="h-5 w-5 text-primary" aria-hidden="true" />,
  },
  {
    id: "g3",
    title: "Soil Health: Organic Matter & Structure",
    description:
      "Identify soil texture, improve organic matter, and plan seasonal rotations.",
    tags: ["soil", "organic", "rotation"],
    type: "doc",
    downloadable: true,
    icon: <LandPlot className="h-5 w-5 text-primary" aria-hidden="true" />,
  },
];

const pests: ResourceItem[] = [
  {
    id: "p1",
    title: "Rice Brown Planthopper Identification",
    description:
      "Visual ID, damage symptoms, and integrated management measures.",
    tags: ["rice", "planthopper", "IPM"],
    type: "doc",
    icon: <WheatOff className="h-5 w-5 text-primary" aria-hidden="true" />,
  },
  {
    id: "p2",
    title: "Late Blight in Potato: Alerts & Control",
    description:
      "Weather-linked alerts, resistant varieties, and spray schedule guidance.",
    tags: ["potato", "disease", "weather"],
    type: "doc",
    icon: <Bean className="h-5 w-5 text-primary" aria-hidden="true" />,
  },
];

const sustainable: ResourceItem[] = [
  {
    id: "s1",
    title: "Integrated Pest Management Toolkit",
    description:
      "Biological controls, trap crops, threshold-based decisions, and record-keeping templates.",
    tags: ["IPM", "biological", "threshold"],
    type: "doc",
    downloadable: true,
    icon: <Sprout className="h-5 w-5 text-primary" aria-hidden="true" />,
  },
  {
    id: "s2",
    title: "Water-Smart Irrigation",
    description:
      "Scheduling with soil moisture, micro-irrigation basics, and reducing losses.",
    tags: ["irrigation", "water", "drip"],
    type: "doc",
    downloadable: true,
    icon: <BookOpenCheck className="h-5 w-5 text-primary" aria-hidden="true" />,
  },
];

const seasonal: ResourceItem[] = [
  {
    id: "t1",
    title: "Monsoon Readiness: Field Drainage",
    description:
      "Ditch design, residue management, and disease prevention in wet spells.",
    tags: ["monsoon", "drainage"],
    type: "tip",
    icon: <Salad className="h-5 w-5 text-primary" aria-hidden="true" />,
  },
  {
    id: "t2",
    title: "Rabi Sowing Window Guide",
    description:
      "Optimal sowing periods by region and variety for higher germination.",
    tags: ["rabi", "sowing"],
    type: "tip",
    icon: <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />,
  },
];

const videos: ResourceItem[] = [
  {
    id: "v1",
    title: "Drip Irrigation Setup in 20 Minutes",
    description:
      "A step-by-step video tutorial on parts, layout, filtration, and maintenance.",
    tags: ["video", "irrigation", "drip"],
    type: "video",
    downloadable: true,
    durationMin: 12,
    icon: <BookText className="h-5 w-5 text-primary" aria-hidden="true" />,
  },
  {
    id: "v2",
    title: "Compost Making for Healthy Soil",
    description:
      "Learn aerobic composting with farm residues and correct carbon-nitrogen balance.",
    tags: ["video", "compost", "soil"],
    type: "video",
    downloadable: true,
    durationMin: 9,
    icon: <LibraryBig className="h-5 w-5 text-primary" aria-hidden="true" />,
  },
];

const contacts: Contact[] = [
  {
    id: "c1",
    name: "Dr. S. Kumar",
    role: "Crop Specialist, Horticulture",
    phone: "+91 98450 12345",
    email: "s.kumar@agriuniv.edu",
    location: "District Agri Univ Center",
    category: "expert",
    hours: "Mon–Fri, 10:00–17:00",
    org: "State Agricultural University",
  },
  {
    id: "c2",
    name: "District Agriculture Office",
    role: "Govt Support & Subsidies",
    phone: "1800-180-1551",
    location: "Block HQ, Sector 3",
    category: "gov",
    hours: "Mon–Sat, 09:00–18:00",
    org: "Department of Agriculture",
  },
  {
    id: "c3",
    name: "Kisan Call Center",
    role: "Farmer Helpline",
    phone: "1800-180-1551",
    category: "helpline",
    hours: "24x7",
    org: "Govt of India",
  },
];

const categories = [
  { key: "guides", label: "Guides", count: guides.length },
  { key: "pests", label: "Pests & Diseases", count: pests.length },
  { key: "sustainable", label: "Sustainable", count: sustainable.length },
  { key: "seasonal", label: "Seasonal", count: seasonal.length },
  { key: "videos", label: "Videos", count: videos.length },
  { key: "species", label: "Species", count: 0 },
  { key: "calculators", label: "Calculators", count: 4 },
  { key: "directory", label: "Directory", count: contacts.length },
  { key: "community", label: "Community", count: 1 },
] as const;

export default function ResourceLibrary({
  className,
  style,
  languages = defaultLanguages,
  defaultLanguageCode = "en",
  initialQuery = "",
  onSearchChange,
}: ResourceLibraryProps) {
  const [query, setQuery] = useState(initialQuery);
  const [language, setLanguage] = useState(defaultLanguageCode);
  const [offlineMode, setOfflineMode] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [downloads, setDownloads] = useState<Set<string>>(new Set());

  const allItems: ResourceItem[] = useMemo(
    () => [...guides, ...pests, ...sustainable, ...seasonal, ...videos],
    []
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [allItems, query]);

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast("Removed from bookmarks", { description: "Item unstarred." });
      } else {
        next.add(id);
        toast("Added to bookmarks", { description: "Find it in your saved items." });
      }
      return next;
    });
  };

  const handleDownload = (id: string, title: string) => {
    setDownloads((prev) => new Set(prev).add(id));
    toast("Download started", { description: `Saving "${title}" for offline use.` });
  };

  const handleUpdatesSubscribe = () => {
    toast("Subscribed", {
      description:
        "You will receive content update notifications for your language.",
    });
  };

  const isBookmarked = (id: string) => bookmarks.has(id);
  const isDownloaded = (id: string) => downloads.has(id);

  return (
    <section
      className={cn(
        "w-full max-w-full rounded-[var(--radius)] bg-card shadow-sm border",
        "p-4 sm:p-6 md:p-8",
        className
      )}
      style={style}
      aria-label="Farming Resource Library"
    >
      <div className="flex flex-col gap-4">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-accent text-primary flex items-center justify-center shrink-0">
              <LibraryBig aria-hidden="true" className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl md:text-2xl tracking-tight">
                Knowledge Base & Resources
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5 break-words">
                Trusted guides, videos, calculators, and local support for smart farming.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Select
              value={language}
              onValueChange={(v) => {
                setLanguage(v);
                toast("Language updated", { description: `Showing content preferences for ${languages.find(l => l.code === v)?.label ?? v}.` });
              }}
            >
              <SelectTrigger
                className="w-[140px] bg-secondary"
                aria-label="Select content language"
              >
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="bg-secondary"
              onClick={handleUpdatesSubscribe}
            >
              <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              Get updates
            </Button>
          </div>
        </header>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <Label htmlFor="resource-search" className="sr-only">
              Search resources
            </Label>
            <div className="relative">
              <Input
                id="resource-search"
                placeholder="Search guides, videos, pests, tips..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  onSearchChange?.(e.target.value);
                }}
                className="bg-secondary pr-10"
                aria-label="Search across resources"
              />
              <BookText
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {query ? `${filtered.length} results` : `${allItems.length} items available`}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2">
            <Switch
              id="offline-switch"
              checked={offlineMode}
              onCheckedChange={(v) => {
                setOfflineMode(v);
                toast(v ? "Offline mode on" : "Offline mode off", {
                  description: v
                    ? "Downloaded items are available without internet."
                    : "Online content will stream normally.",
                });
              }}
              aria-label="Toggle offline reading mode"
            />
            <div className="min-w-0">
              <Label htmlFor="offline-switch" className="text-sm">
                Offline reading
              </Label>
              <p className="text-xs text-muted-foreground">
                {offlineMode ? "Showing downloaded-first." : "Stream and save for later."}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        <Tabs defaultValue="guides" className="w-full">
          <TabsList className="flex w-full overflow-x-auto">
            {categories.map((c) => (
              <TabsTrigger
                key={c.key}
                value={c.key}
                className="data-[state=active]:bg-accent"
              >
                {c.label}
                <Badge variant="secondary" className="ml-2 rounded-full">
                  {c.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="guides" className="mt-4">
            <ResourceGrid
              items={guides}
              query={query}
              filteredIds={new Set(filtered.map((f) => f.id))}
              isBookmarked={isBookmarked}
              onToggleBookmark={toggleBookmark}
              onDownload={handleDownload}
              isDownloaded={isDownloaded}
            />
          </TabsContent>

          <TabsContent value="pests" className="mt-4">
            <ResourceGrid
              items={pests}
              query={query}
              filteredIds={new Set(filtered.map((f) => f.id))}
              isBookmarked={isBookmarked}
              onToggleBookmark={toggleBookmark}
              onDownload={handleDownload}
              isDownloaded={isDownloaded}
            />
          </TabsContent>

          <TabsContent value="sustainable" className="mt-4">
            <ResourceGrid
              items={sustainable}
              query={query}
              filteredIds={new Set(filtered.map((f) => f.id))}
              isBookmarked={isBookmarked}
              onToggleBookmark={toggleBookmark}
              onDownload={handleDownload}
              isDownloaded={isDownloaded}
            />
          </TabsContent>

          <TabsContent value="seasonal" className="mt-4">
            <ResourceGrid
              items={seasonal}
              query={query}
              filteredIds={new Set(filtered.map((f) => f.id))}
              isBookmarked={isBookmarked}
              onToggleBookmark={toggleBookmark}
              onDownload={handleDownload}
              isDownloaded={isDownloaded}
            />
          </TabsContent>

          <TabsContent value="videos" className="mt-4">
            <VideoGrid
              items={videos}
              query={query}
              filteredIds={new Set(filtered.map((f) => f.id))}
              onDownload={handleDownload}
              isDownloaded={isDownloaded}
              isBookmarked={isBookmarked}
              onToggleBookmark={toggleBookmark}
            />
          </TabsContent>

          <TabsContent value="species" className="mt-4">
            <SpeciesBrowser query={query} />
          </TabsContent>

          <TabsContent value="calculators" className="mt-4">
            <CalculatorSuite />
          </TabsContent>

          <TabsContent value="directory" className="mt-4">
            <Directory contacts={contacts} />
          </TabsContent>

          <TabsContent value="community" className="mt-4">
            <CommunitySection />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function SpeciesBrowser({ query }: { query: string }) {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState<number>(1);
  const pageSize = 12;
  const [total, setTotal] = React.useState<number>(0);

  React.useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        if (query.trim()) params.set("q", query.trim());
        const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
        const res = await fetch(`/api/species?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        if (!active) return;
        setItems(data.data || []);
        setTotal(data.total || 0);
      } catch (e: any) {
        if (!active) return;
        setError(e.message || "Failed to load species");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [query, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${total} species`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="bg-secondary"
          >
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="bg-secondary"
          >
            Next
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="bg-secondary">
          <CardContent className="py-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((s) => (
            <Card key={s.id} className="bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-tight truncate">
                      {s.commonName}
                    </CardTitle>
                    <CardDescription className="truncate">
                      <em>{s.scientificName}</em>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-accent text-accent-foreground capitalize">
                    {s.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {s.region ? (
                    <Badge variant="secondary" className="bg-secondary">{s.region}</Badge>
                  ) : null}
                  {s.seasonality ? (
                    <Badge variant="secondary" className="bg-secondary">{s.seasonality}</Badge>
                  ) : null}
                  {Array.isArray(s.tags) && s.tags.slice(0, 2).map((t: string) => (
                    <Badge key={t} variant="secondary" className="bg-secondary">{t}</Badge>
                  ))}
                </div>
                {s.uses ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.uses}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceGrid({
  items,
  query,
  filteredIds,
  isBookmarked,
  onToggleBookmark,
  onDownload,
  isDownloaded,
}: {
  items: ResourceItem[];
  query: string;
  filteredIds: Set<string>;
  isBookmarked: (id: string) => boolean;
  onToggleBookmark: (id: string) => void;
  onDownload: (id: string, title: string) => void;
  isDownloaded: (id: string) => boolean;
}) {
  const visible = items.filter((it) => !query || filteredIds.has(it.id));
  if (visible.length === 0) {
    return (
      <Card className="bg-secondary">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No results in this category.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {visible.map((r) => (
        <Card
          key={r.id}
          className="bg-card hover:shadow-md transition-shadow"
          role="article"
          aria-labelledby={`${r.id}-title`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                  {r.icon ?? <LibraryBig className="h-4 w-4 text-primary" aria-hidden="true" />}
                </div>
                <CardTitle
                  id={`${r.id}-title`}
                  className="text-base md:text-lg leading-tight line-clamp-2"
                >
                  {r.title}
                </CardTitle>
              </div>
              <Button
                variant={isBookmarked(r.id) ? "default" : "outline"}
                className={cn(
                  "h-8",
                  isBookmarked(r.id) ? "bg-primary text-primary-foreground" : "bg-secondary"
                )}
                onClick={() => onToggleBookmark(r.id)}
                aria-pressed={isBookmarked(r.id)}
                aria-label={isBookmarked(r.id) ? "Remove bookmark" : "Add bookmark"}
              >
                <BookUser className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <CardDescription className="mt-2 line-clamp-3">
              {r.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {r.tags.map((t) => (
                <Badge key={t} variant="secondary" className="bg-secondary">
                  {t}
                </Badge>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {r.type === "guide" && (
                  <Badge variant="outline" className="bg-secondary">
                    Guide
                  </Badge>
                )}
                {r.type === "doc" && (
                  <Badge variant="outline" className="bg-secondary">
                    Doc
                  </Badge>
                )}
                {r.type === "tip" && (
                  <Badge variant="outline" className="bg-secondary">
                    Tip
                  </Badge>
                )}
                {r.downloadable && (
                  <Badge variant="outline" className="bg-accent text-primary">
                    Offline-ready
                  </Badge>
                )}
              </div>
              {r.downloadable && (
                <Button
                  size="sm"
                  variant={isDownloaded(r.id) ? "secondary" : "outline"}
                  className="bg-secondary"
                  onClick={() => onDownload(r.id, r.title)}
                  aria-label={isDownloaded(r.id) ? "Downloaded" : "Download for offline"}
                >
                  <BookOpenCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                  {isDownloaded(r.id) ? "Saved" : "Download"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function VideoGrid({
  items,
  query,
  filteredIds,
  onDownload,
  isDownloaded,
  isBookmarked,
  onToggleBookmark,
}: {
  items: ResourceItem[];
  query: string;
  filteredIds: Set<string>;
  onDownload: (id: string, title: string) => void;
  isDownloaded: (id: string) => boolean;
  isBookmarked: (id: string) => boolean;
  onToggleBookmark: (id: string) => void;
}) {
  const visible = items.filter((it) => !query || filteredIds.has(it.id));
  if (visible.length === 0) {
    return (
      <Card className="bg-secondary">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No videos match your search.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {visible.map((v) => (
        <Card key={v.id} className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                  {v.icon ?? <BookText className="h-4 w-4 text-primary" aria-hidden="true" />}
                </div>
                <CardTitle className="text-base md:text-lg leading-tight line-clamp-2">
                  {v.title}
                </CardTitle>
              </div>
              <Button
                variant={isBookmarked(v.id) ? "default" : "outline"}
                className={cn(
                  "h-8",
                  isBookmarked(v.id) ? "bg-primary text-primary-foreground" : "bg-secondary"
                )}
                onClick={() => onToggleBookmark(v.id)}
                aria-pressed={isBookmarked(v.id)}
                aria-label={isBookmarked(v.id) ? "Remove bookmark" : "Add bookmark"}
              >
                <BookUser className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <CardDescription className="mt-2 line-clamp-3">
              {v.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-secondary">
                  Video
                </Badge>
                {typeof v.durationMin === "number" && (
                  <Badge variant="secondary" className="bg-secondary">
                    {v.durationMin} min
                  </Badge>
                )}
              </div>
              {v.downloadable && (
                <Button
                  size="sm"
                  variant={isDownloaded(v.id) ? "secondary" : "outline"}
                  className="bg-secondary"
                  onClick={() => onDownload(v.id, v.title)}
                  aria-label={isDownloaded(v.id) ? "Downloaded" : "Download video"}
                >
                  <BookOpenCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                  {isDownloaded(v.id) ? "Saved" : "Download"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CalculatorSuite() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SeedCalculator />
      <FertilizerCalculator />
      <IrrigationCalculator />
      <YieldEstimator />
    </div>
  );
}

function SeedCalculator() {
  const [area, setArea] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const areaNum = Number(area) || 0;
  const rateNum = Number(rate) || 0;
  const total = areaNum * rateNum;

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wheat className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">Seed Quantity</CardTitle>
        </div>
        <CardDescription>Estimate seed required by area</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="seed-area">Area (acre)</Label>
            <Input
              id="seed-area"
              inputMode="decimal"
              placeholder="e.g., 2"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="bg-secondary"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="seed-rate">Seed rate (kg/acre)</Label>
            <Input
              id="seed-rate"
              inputMode="decimal"
              placeholder="e.g., 8"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="bg-secondary"
            />
          </div>
        </div>
        <ResultTile
          label="Total seed required"
          value={Number.isFinite(total) ? `${total.toFixed(2)} kg` : "—"}
          icon={<Bean className="h-4 w-4 text-primary" aria-hidden="true" />}
        />
      </CardContent>
    </Card>
  );
}

function FertilizerCalculator() {
  const [n, setN] = useState<string>("");
  const [p, setP] = useState<string>("");
  const [k, setK] = useState<string>("");
  const [area, setArea] = useState<string>("");

  const areaNum = Number(area) || 0;
  const totalN = (Number(n) || 0) * areaNum;
  const totalP = (Number(p) || 0) * areaNum;
  const totalK = (Number(k) || 0) * areaNum;

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Salad className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">Fertilizer Requirement</CardTitle>
        </div>
        <CardDescription>N-P-K recommendation by area</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="fert-area">Area (acre)</Label>
            <Input
              id="fert-area"
              inputMode="decimal"
              placeholder="e.g., 1.5"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="bg-secondary"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fert-n">N (kg/acre)</Label>
            <Input
              id="fert-n"
              inputMode="decimal"
              placeholder="e.g., 50"
              value={n}
              onChange={(e) => setN(e.target.value)}
              className="bg-secondary"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fert-p">P (kg/acre)</Label>
            <Input
              id="fert-p"
              inputMode="decimal"
              placeholder="e.g., 25"
              value={p}
              onChange={(e) => setP(e.target.value)}
              className="bg-secondary"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fert-k">K (kg/acre)</Label>
            <Input
              id="fert-k"
              inputMode="decimal"
              placeholder="e.g., 25"
              value={k}
              onChange={(e) => setK(e.target.value)}
              className="bg-secondary"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <ResultTile label="Total N" value={`${totalN.toFixed(2)} kg`} />
          <ResultTile label="Total P" value={`${totalP.toFixed(2)} kg`} />
          <ResultTile label="Total K" value={`${totalK.toFixed(2)} kg`} />
        </div>
      </CardContent>
    </Card>
  );
}

function IrrigationCalculator() {
  const [area, setArea] = useState<string>("");
  const [depth, setDepth] = useState<string>("");
  // Water volume (m3) ≈ area(ha) * depth(mm)
  const ha = (Number(area) || 0) / 2.471; // acres to hectares
  const mm = Number(depth) || 0;
  const volumeM3 = ha * mm;
  const liters = volumeM3 * 1000;

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Tractor className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">Irrigation Scheduling</CardTitle>
        </div>
        <CardDescription>Water volume per irrigation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="irr-area">Area (acre)</Label>
            <Input
              id="irr-area"
              inputMode="decimal"
              placeholder="e.g., 3"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="bg-secondary"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="irr-depth">Depth (mm)</Label>
            <Input
              id="irr-depth"
              inputMode="decimal"
              placeholder="e.g., 40"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              className="bg-secondary"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ResultTile label="Volume" value={`${volumeM3.toFixed(2)} m³`} />
          <ResultTile label="Approx. liters" value={`${liters.toFixed(0)} L`} />
        </div>
      </CardContent>
    </Card>
  );
}

function YieldEstimator() {
  const [plants, setPlants] = useState<string>("");
  const [yieldPer, setYieldPer] = useState<string>("");
  const p = Number(plants) || 0;
  const y = Number(yieldPer) || 0;
  const totalKg = p * y;
  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Carrot className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">Crop Yield Estimation</CardTitle>
        </div>
        <CardDescription>Estimate total produce</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="yield-plants">Plants (count)</Label>
            <Input
              id="yield-plants"
              inputMode="numeric"
              placeholder="e.g., 1200"
              value={plants}
              onChange={(e) => setPlants(e.target.value)}
              className="bg-secondary"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="yield-per">Yield per plant (kg)</Label>
            <Input
              id="yield-per"
              inputMode="decimal"
              placeholder="e.g., 0.2"
              value={yieldPer}
              onChange={(e) => setYieldPer(e.target.value)}
              className="bg-secondary"
            />
          </div>
        </div>
        <ResultTile label="Estimated yield" value={`${totalKg.toFixed(2)} kg`} />
      </CardContent>
    </Card>
  );
}

function ResultTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-secondary px-3 py-2">
      <div className="flex items-center gap-2">
        {icon ? (
          <div className="h-6 w-6 rounded-md bg-accent flex items-center justify-center">
            {icon}
          </div>
        ) : null}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function Directory({ contacts }: { contacts: Contact[] }) {
  const experts = contacts.filter((c) => c.category === "expert");
  const gov = contacts.filter((c) => c.category === "gov");
  const helpline = contacts.filter((c) => c.category === "helpline");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookUser className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base">Local Experts</CardTitle>
          </div>
          <CardDescription>Connect with specialists in your district</CardDescription>
        </CardHeader>
        <CardContent>
          {experts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No experts available.</p>
          ) : (
            <div className="space-y-3">
              {experts.map((c) => (
                <DirectoryRow key={c.id} c={c} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base">Govt Offices & Helplines</CardTitle>
          </div>
          <CardDescription>Official agriculture support</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="gov">
              <AccordionTrigger className="text-sm">Government Offices</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {gov.map((c) => (
                    <DirectoryRow key={c.id} c={c} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="helpline">
              <AccordionTrigger className="text-sm">Helplines</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {helpline.map((c) => (
                    <DirectoryRow key={c.id} c={c} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

function DirectoryRow({ c }: { c: Contact }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-secondary p-3">
      <div className="min-w-0">
        <p className="font-medium leading-tight">{c.name}</p>
        <p className="text-xs text-muted-foreground">{c.role}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {c.phone && <Badge variant="secondary" className="bg-secondary">📞 {c.phone}</Badge>}
          {c.email && <Badge variant="secondary" className="bg-secondary">✉️ {c.email}</Badge>}
          {c.location && <Badge variant="secondary" className="bg-secondary">📍 {c.location}</Badge>}
          {c.hours && <Badge variant="secondary" className="bg-secondary">⏱ {c.hours}</Badge>}
          {c.org && <Badge variant="secondary" className="bg-secondary">🏛 {c.org}</Badge>}
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="bg-card"
        onClick={() =>
          toast("Contact details copied", {
            description:
              [c.name, c.role, c.phone, c.email].filter(Boolean).join(" • "),
          })
        }
        aria-label={`Copy contact details for ${c.name}`}
      >
        <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
        Copy
      </Button>
    </div>
  );
}

function CommunitySection() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <LibraryBig className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">Community Forum</CardTitle>
        </div>
        <CardDescription>
          Share experiences, ask questions, and learn from fellow farmers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-secondary p-3">
          <p className="text-sm">
            Join discussions on pest management, market prices, irrigation tips, and success
            stories. Connect with local farmer groups and experts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-secondary">pest-control</Badge>
          <Badge variant="secondary" className="bg-secondary">soil-health</Badge>
          <Badge variant="secondary" className="bg-secondary">market</Badge>
          <Badge variant="secondary" className="bg-secondary">irrigation</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() =>
              toast("Forum opening soon", {
                description: "Community features will be available in the next update.",
              })
            }
            className="bg-primary text-primary-foreground"
          >
            <BookText className="mr-2 h-4 w-4" aria-hidden="true" />
            Open Forum
          </Button>
          <Button
            variant="outline"
            className="bg-secondary"
            onClick={() =>
              toast("Success stories", {
                description:
                  "Read how farmers improved yields with sustainable practices.",
              })
            }
          >
            <Sprout className="mr-2 h-4 w-4" aria-hidden="true" />
            Success Stories
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}