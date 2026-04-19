import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import PageLayout from "../components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import { getHangerHeightCm } from "../lib/bag-rules-engine";
import { 
  Scale, Palette, Droplets, Calculator, FileSpreadsheet, 
  Ruler, Clock, Printer, ChevronLeft, ChevronRight,
  Package, PaintBucket, Barcode, FlaskConical, Plus, Trash2, Eye, Archive, FileText, Pencil, Search
} from "lucide-react";
import JsBarcode from "jsbarcode";

type TabId =
  | "bag-weight"
  | "colors"
  | "color-mix"
  | "ink-usage"
  | "order-cost"
  | "order-cost-advanced"
  | "roll"
  | "thickness"
  | "job-time"
  | "barcode"
  | "blends";

interface TabDef { 
  id: TabId; 
  labelKey: string; 
  descriptionKey: string;
  icon: typeof Scale;
}

const tabDefs: TabDef[] = [
  { id: "bag-weight", labelKey: "tools.tabs.bagWeight", descriptionKey: "tools.tabs.bagWeightDesc", icon: Scale },
  { id: "colors", labelKey: "tools.tabs.colors", descriptionKey: "tools.tabs.colorsDesc", icon: Palette },
  { id: "color-mix", labelKey: "tools.tabs.colorMix", descriptionKey: "tools.tabs.colorMixDesc", icon: PaintBucket },
  { id: "ink-usage", labelKey: "tools.tabs.inkUsage", descriptionKey: "tools.tabs.inkUsageDesc", icon: Droplets },
  { id: "order-cost", labelKey: "tools.tabs.orderCost", descriptionKey: "tools.tabs.orderCostDesc", icon: Calculator },
  { id: "order-cost-advanced", labelKey: "tools.tabs.orderCostAdvanced", descriptionKey: "tools.tabs.orderCostAdvancedDesc", icon: FileSpreadsheet },
  { id: "roll", labelKey: "tools.tabs.roll", descriptionKey: "tools.tabs.rollDesc", icon: Package },
  { id: "thickness", labelKey: "tools.tabs.thickness", descriptionKey: "tools.tabs.thicknessDesc", icon: Ruler },
  { id: "job-time", labelKey: "tools.tabs.jobTime", descriptionKey: "tools.tabs.jobTimeDesc", icon: Clock },
  { id: "barcode", labelKey: "tools.tabs.barcode", descriptionKey: "tools.tabs.barcodeDesc", icon: Barcode },
  { id: "blends", labelKey: "tools.tabs.blends", descriptionKey: "tools.tabs.blendsDesc", icon: FlaskConical },
];

export default function ToolsPage(): JSX.Element {
  const { t } = useTranslation();
  return (
    <PageLayout title={t("tools.title")} description={t("tools.description")}>
      <ToolsContent />
    </PageLayout>
  );
}

function ToolsContent(): JSX.Element {
  const { t } = useTranslation();
  const STORAGE_KEY = "mpbf_tools_active_tab";
  const [active, setActive] = useState<TabId>(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY)) as TabId | null;
    return saved ?? "bag-weight";
  });
  const [sharedBagWeightG, setSharedBagWeightG] = useState<number>(0);
  const [sharedBagDims, setSharedBagDims] = useState<{ widthCm: number; lengthCm: number } | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const bagWeightPrintRef = useRef<(() => void) | null>(null);

  useEffect(() => { 
    try { window.localStorage.setItem(STORAGE_KEY, active); } catch {} 
  }, [active]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const activeTab = tabDefs.find(tab => tab.id === active);
  const ActiveIcon = activeTab?.icon || Scale;

  return (
    <div className="space-y-4 pb-24 md:pb-6">
      {/* Mobile: Horizontal Scrollable Tabs */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-slate-900/80 shadow-md rounded-full h-8 w-8 md:hidden"
          onClick={() => scrollTabs('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-slate-900/80 shadow-md rounded-full h-8 w-8 md:hidden"
          onClick={() => scrollTabs('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div 
          ref={tabsRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-8 md:px-0 pb-2 md:flex-wrap md:overflow-visible"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabDefs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  whitespace-nowrap transition-all duration-200 flex-shrink-0
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                    : 'bg-white dark:bg-slate-800 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tool Header */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary text-primary-foreground">
            <ActiveIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{activeTab ? t(activeTab.labelKey) : ""}</h2>
            <p className="text-sm text-muted-foreground">{activeTab ? t(activeTab.descriptionKey) : ""}</p>
          </div>
          <Button variant="outline" size="sm" className="mr-auto" onClick={() => {
            if (active === "bag-weight" && bagWeightPrintRef.current) {
              bagWeightPrintRef.current();
            } else {
              window.print();
            }
          }}>
            <Printer className="h-4 w-4 ml-2" />
            {t("common.print")}
          </Button>
        </CardContent>
      </Card>

      {/* Tool Content */}
      <Card>
        <CardContent className="p-4 md:p-6">
          {active === "bag-weight" && (
            <BagWeightCalculator
              onBagWeight={(g) => setSharedBagWeightG(g)}
              onDims={(d) => setSharedBagDims(d)}
              onPrintRef={(fn) => { bagWeightPrintRef.current = fn; }}
            />
          )}
          {active === "colors" && <ColorTools />}
          {active === "color-mix" && <ColorMixTools />}
          {active === "ink-usage" && <InkUsageCalculator sharedDims={sharedBagDims} />}
          {active === "order-cost" && <OrderCostCalculator sharedBagWeightG={sharedBagWeightG} />}
          {active === "order-cost-advanced" && <OrderCostAdvanced sharedBagWeightG={sharedBagWeightG} />}
          {active === "roll" && <RollTools />}
          {active === "thickness" && <ThicknessConverter />}
          {active === "job-time" && <JobTimePlanner />}
          {active === "barcode" && <BarcodeGenerator />}
          {active === "blends" && <BlendsTool />}
        </CardContent>
      </Card>
    </div>
  );
}

// ===================== Shared Components =====================

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
  hint?: string;
}

function InputField({ label, value, onChange, step = 0.1, suffix, hint }: InputFieldProps): JSX.Element {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          onChange={(e) => onChange(toNumber(e.target.value))}
          className="pl-3 pr-12"
        />
        {suffix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function TextField({ label, value, onChange, placeholder }: TextFieldProps): JSX.Element {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}

function SelectField({ label, value, onChange, options, hint }: SelectFieldProps): JSX.Element {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface ResultCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function ResultCard({ label, value, highlight }: ResultCardProps): JSX.Element {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-primary/10 border-2 border-primary' : 'bg-slate-50 dark:bg-slate-800'}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-primary' : ''}`}>{value}</p>
    </div>
  );
}

// ===================== 1) حاسبة وزن الأكياس =====================

type BagType = "hanger" | "banana" | "no-handle" | "table-cover";

function migrateLegacyBagType(t: unknown): BagType {
  if (t === "hanger" || t === "banana" || t === "no-handle" || t === "table-cover") return t;
  if (t === "side-gusset" || t === "flat") return "no-handle";
  return "no-handle";
}

interface BagWeightRecord {
  id: number;
  createdAt: string;
  bagType: BagType;
  widthCm: number;
  lengthCm: number;
  sideGussetCm: number;
  thicknessMicron: number;
  layers: number;
  density: number;
  gramsPerBag: number;
  bagsPerKg: number;
  areaM2: number;
}

interface ApiBagWeightRecord {
  id: number;
  user_id: number;
  bag_type: string;
  width_cm: string;
  length_cm: string;
  side_gusset_cm: string;
  thickness_micron: string;
  layers: number;
  density: string;
  grams_per_bag: string;
  bags_per_kg: string;
  area_m2: string;
  created_at: string;
}

function mapApiBagWeightRecord(r: ApiBagWeightRecord): BagWeightRecord {
  const num = (v: string | number) => (typeof v === "number" ? v : parseFloat(v));
  return {
    id: r.id,
    createdAt: new Date(r.created_at).toLocaleString("en-US"),
    bagType: migrateLegacyBagType(r.bag_type as BagType),
    widthCm: num(r.width_cm),
    lengthCm: num(r.length_cm),
    sideGussetCm: num(r.side_gusset_cm),
    thicknessMicron: num(r.thickness_micron),
    layers: r.layers,
    density: num(r.density),
    gramsPerBag: num(r.grams_per_bag),
    bagsPerKg: num(r.bags_per_kg),
    areaM2: num(r.area_m2),
  };
}

const BAG_HISTORY_KEY = "mpbf_bag_weight_history";
const BAG_HISTORY_MIGRATED_KEY = "mpbf_bag_weight_history_migrated";

interface LegacyBagWeightRecord {
  id?: string | number;
  createdAt?: string;
  bagType?: unknown;
  widthCm?: number;
  lengthCm?: number;
  sideGussetCm?: number;
  thicknessMicron?: number;
  layers?: number;
  density?: number;
  gramsPerBag?: number;
  bagsPerKg?: number;
  areaM2?: number;
}

function useBagWeightHistory() {
  const { toast } = useToast();
  const { data: rawData = [] } = useQuery<ApiBagWeightRecord[]>({
    queryKey: ["/api/bag-weight-records"],
  });
  const history = useMemo(() => rawData.map(mapApiBagWeightRecord), [rawData]);
  const migrationRan = useRef(false);

  useEffect(() => {
    if (migrationRan.current) return;
    migrationRan.current = true;
    if (typeof window === "undefined") return;
    let raw: string | null;
    try {
      if (window.localStorage.getItem(BAG_HISTORY_MIGRATED_KEY) === "1") return;
      raw = window.localStorage.getItem(BAG_HISTORY_KEY);
    } catch {
      return;
    }
    if (!raw) {
      try { window.localStorage.setItem(BAG_HISTORY_MIGRATED_KEY, "1"); } catch {}
      return;
    }
    let parsed: LegacyBagWeightRecord[] = [];
    try {
      const data = JSON.parse(raw);
      parsed = Array.isArray(data) ? data : [];
    } catch {
      try {
        window.localStorage.removeItem(BAG_HISTORY_KEY);
        window.localStorage.setItem(BAG_HISTORY_MIGRATED_KEY, "1");
      } catch {}
      return;
    }
    if (parsed.length === 0) {
      try {
        window.localStorage.removeItem(BAG_HISTORY_KEY);
        window.localStorage.setItem(BAG_HISTORY_MIGRATED_KEY, "1");
      } catch {}
      return;
    }
    const ordered = [...parsed].reverse();
    const remaining = [...parsed];
    const totalCount = ordered.length;
    (async () => {
      let migratedCount = 0;
      try {
        for (const r of ordered) {
          const payload = {
            bag_type: migrateLegacyBagType(r.bagType),
            width_cm: String(r.widthCm ?? 0),
            length_cm: String(r.lengthCm ?? 0),
            side_gusset_cm: String(r.sideGussetCm ?? 0),
            thickness_micron: String(r.thicknessMicron ?? 0),
            layers: typeof r.layers === "number" ? r.layers : 1,
            density: String(r.density ?? 0.95),
            grams_per_bag: String(r.gramsPerBag ?? 0),
            bags_per_kg: String(r.bagsPerKg ?? 0),
            area_m2: String(r.areaM2 ?? 0),
          };
          const res = await apiRequest("/api/bag-weight-records", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          await res.json().catch(() => null);
          migratedCount++;
          const idx = remaining.lastIndexOf(r);
          if (idx >= 0) remaining.splice(idx, 1);
          try {
            if (remaining.length > 0) {
              window.localStorage.setItem(BAG_HISTORY_KEY, JSON.stringify(remaining));
            } else {
              window.localStorage.removeItem(BAG_HISTORY_KEY);
            }
          } catch {}
        }
        try {
          window.localStorage.removeItem(BAG_HISTORY_KEY);
          window.localStorage.setItem(BAG_HISTORY_MIGRATED_KEY, "1");
        } catch {}
        queryClient.invalidateQueries({ queryKey: ["/api/bag-weight-records"] });
        if (migratedCount > 0) {
          toast({
            title: "تم نقل السجلات",
            description: `تم نقل ${migratedCount} سجل من المتصفح إلى حسابك`,
          });
        }
      } catch (err) {
        console.warn("[bag-weight migration] partial failure", { migratedCount, totalCount, err });
        if (migratedCount > 0) {
          queryClient.invalidateQueries({ queryKey: ["/api/bag-weight-records"] });
        }
        migrationRan.current = false;
      }
    })();
  }, [toast]);

  const addMutation = useMutation({
    mutationFn: async (record: Omit<BagWeightRecord, "id" | "createdAt">) => {
      const payload = {
        bag_type: record.bagType,
        width_cm: String(record.widthCm),
        length_cm: String(record.lengthCm),
        side_gusset_cm: String(record.sideGussetCm),
        thickness_micron: String(record.thicknessMicron),
        layers: record.layers,
        density: String(record.density),
        grams_per_bag: String(record.gramsPerBag),
        bags_per_kg: String(record.bagsPerKg),
        area_m2: String(record.areaM2),
      };
      const res = await apiRequest("/api/bag-weight-records", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bag-weight-records"] });
    },
    onError: (err: any) => {
      toast({ title: "خطأ في الحفظ", description: err?.message || "تعذر حفظ السجل", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/bag-weight-records/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bag-weight-records"] });
    },
    onError: (err: any) => {
      toast({ title: "خطأ في الحذف", description: err?.message || "تعذر حذف السجل", variant: "destructive" });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/bag-weight-records", { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bag-weight-records"] });
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err?.message || "تعذر مسح السجلات", variant: "destructive" });
    },
  });

  return {
    history,
    addRecord: (record: Omit<BagWeightRecord, "id" | "createdAt">) => addMutation.mutate(record),
    clearHistory: () => clearMutation.mutate(),
    deleteRecord: (id: number) => deleteMutation.mutate(id),
    isSaving: addMutation.isPending,
  };
}

function bagTypeUsesGusset(type: BagType): boolean {
  return type === "hanger" || type === "banana";
}

interface BagShapeSvgProps {
  type: BagType;
  widthCm: number;
  lengthCm: number;
  sideGussetCm: number;
  className?: string;
}

function BagShapeSvg({ type, widthCm, lengthCm, sideGussetCm, className }: BagShapeSvgProps): JSX.Element {
  const uid = useId().replace(/:/g, "_");
  const gradId = `bagBodyGrad_${uid}`;
  const shadowId = `bagShadow_${uid}`;

  const isTableCover = type === "table-cover";

  const svgW = 220;
  const svgH = 280;

  const widthRef = isTableCover ? 100 : 60;
  const lengthRef = isTableCover ? 70 : 80;

  const wr = widthCm > 0 ? Math.max(0.35, Math.min(1, widthCm / widthRef)) : 0.7;
  const lr = lengthCm > 0 ? Math.max(0.35, Math.min(1, lengthCm / lengthRef)) : 0.7;

  const bagW = Math.round(svgW * 0.7 * wr);
  const hangerCm = type === "hanger" ? getHangerHeightCm(widthCm, lengthCm) : 0;
  const totalLenForRatio = type === "hanger" ? lengthCm + hangerCm : lengthCm;
  const totalLengthRefMax = type === "hanger" ? lengthRef + 25 : lengthRef;
  const totalLr = totalLenForRatio > 0
    ? Math.max(0.35, Math.min(1, totalLenForRatio / totalLengthRefMax))
    : lr;
  const bagH = Math.round(svgH * 0.7 * totalLr);

  const earH = type === "hanger" && lengthCm > 0
    ? Math.max(14, Math.min(bagH * 0.4, bagH * (hangerCm / Math.max(1, lengthCm + hangerCm))))
    : 0;

  const bagX = Math.round((svgW - bagW) / 2);
  const bagY = Math.round((svgH - bagH - earH) / 2 + earH);

  const fill = isTableCover ? "#fce7f3" : "#dbeafe";
  const stroke = isTableCover ? "#db2777" : "#2563eb";
  const accent = isTableCover ? "#be185d" : "#1d4ed8";

  const sideGussetW = sideGussetCm > 0 && bagTypeUsesGusset(type)
    ? Math.max(bagW * 0.06, Math.min(bagW * 0.2, (sideGussetCm / Math.max(1, widthCm || widthRef)) * bagW))
    : 0;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Bag preview"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fill} stopOpacity="0.9" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.7" />
        </linearGradient>
        <filter id={shadowId}>
          <feDropShadow dx="2" dy="3" stdDeviation="2" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Hanger ear (above body) */}
      {type === "hanger" && earH > 0 && (() => {
        const cutoutW = bagW * 0.3;
        const cutoutDepth = earH * 0.7;
        const cutoutCX = bagX + bagW / 2;
        const earTopY = bagY - earH;
        const cutoutBottomY = earTopY + cutoutDepth;
        const r = cutoutW * 0.35;
        return (
          <path
            d={`M${bagX},${bagY}
                L${bagX},${earTopY + 2}
                Q${bagX},${earTopY} ${bagX + 2},${earTopY}
                L${cutoutCX - cutoutW / 2},${earTopY}
                L${cutoutCX - cutoutW / 2},${cutoutBottomY - r}
                Q${cutoutCX - cutoutW / 2},${cutoutBottomY} ${cutoutCX - cutoutW / 2 + r},${cutoutBottomY}
                L${cutoutCX + cutoutW / 2 - r},${cutoutBottomY}
                Q${cutoutCX + cutoutW / 2},${cutoutBottomY} ${cutoutCX + cutoutW / 2},${cutoutBottomY - r}
                L${cutoutCX + cutoutW / 2},${earTopY}
                L${bagX + bagW - 2},${earTopY}
                Q${bagX + bagW},${earTopY} ${bagX + bagW},${earTopY + 2}
                L${bagX + bagW},${bagY} Z`}
            fill={`url(#${gradId})`}
            stroke={stroke}
            strokeWidth="1.2"
          />
        );
      })()}

      {/* Bag body */}
      <rect
        x={bagX}
        y={bagY}
        width={bagW}
        height={bagH}
        rx={isTableCover ? "4" : "3"}
        fill={`url(#${gradId})`}
        stroke={stroke}
        strokeWidth="1.4"
        filter={`url(#${shadowId})`}
      />

      {/* Side gusset overlay */}
      {sideGussetW > 0 && (
        <>
          <rect
            x={bagX + 1}
            y={bagY + 1}
            width={sideGussetW}
            height={bagH - 2}
            fill={fill}
            fillOpacity="0.55"
          />
          <rect
            x={bagX + bagW - sideGussetW - 1}
            y={bagY + 1}
            width={sideGussetW}
            height={bagH - 2}
            fill={fill}
            fillOpacity="0.55"
          />
          <line
            x1={bagX + sideGussetW}
            y1={bagY}
            x2={bagX + sideGussetW}
            y2={bagY + bagH}
            stroke={stroke}
            strokeWidth="0.6"
            strokeDasharray="3,3"
            opacity="0.35"
          />
          <line
            x1={bagX + bagW - sideGussetW}
            y1={bagY}
            x2={bagX + bagW - sideGussetW}
            y2={bagY + bagH}
            stroke={stroke}
            strokeWidth="0.6"
            strokeDasharray="3,3"
            opacity="0.35"
          />
        </>
      )}

      {/* Banana handle die-cut: fixed 8cm wide × 2cm tall */}
      {type === "banana" && (() => {
        const w8 = widthCm > 0 ? widthCm : 30;
        const cutoutWidthRatio = Math.min(0.7, 8 / w8);
        const lForH = lengthCm > 0 ? lengthCm : 40;
        const cutoutHeightRatio = Math.min(0.12, 2 / lForH);
        const holeW = bagW * cutoutWidthRatio;
        const holeH = bagH * cutoutHeightRatio;
        const cx = bagX + bagW / 2;
        const cy = bagY + Math.max(holeH * 1.6, bagH * 0.07);
        return (
          <g>
            <path
              d={`M${cx - holeW / 2},${cy}
                  Q${cx},${cy + holeH * 1.7} ${cx + holeW / 2},${cy}
                  Q${cx},${cy - holeH * 0.4} ${cx - holeW / 2},${cy} Z`}
              fill="#ffffff"
              stroke={accent}
              strokeWidth="1.1"
            />
            <text
              x={cx}
              y={cy - holeH * 1.4}
              textAnchor="middle"
              fontSize="9"
              fill={accent}
              fontWeight="600"
              opacity="0.75"
            >
              8 × 2 سم
            </text>
          </g>
        );
      })()}

      {/* Table cover decorative pattern */}
      {isTableCover && (
        <>
          <line
            x1={bagX + 8}
            y1={bagY + bagH * 0.5}
            x2={bagX + bagW - 8}
            y2={bagY + bagH * 0.5}
            stroke={accent}
            strokeWidth="0.5"
            strokeDasharray="6,4"
            opacity="0.35"
          />
          <line
            x1={bagX + bagW * 0.5}
            y1={bagY + 8}
            x2={bagX + bagW * 0.5}
            y2={bagY + bagH - 8}
            stroke={accent}
            strokeWidth="0.5"
            strokeDasharray="6,4"
            opacity="0.35"
          />
        </>
      )}

      {/* Bottom seal line */}
      <line
        x1={bagX}
        y1={bagY + bagH}
        x2={bagX + bagW}
        y2={bagY + bagH}
        stroke={accent}
        strokeWidth="1.5"
        opacity="0.55"
      />

      {/* Hanger height label */}
      {type === "hanger" && earH > 0 && (
        <text
          x={bagX + bagW + 4}
          y={bagY - earH / 2 + 3}
          fontSize="9"
          fill={accent}
          fontWeight="600"
        >
          {hangerCm} سم
        </text>
      )}
    </svg>
  );
}

interface BagWeightCalculatorProps {
  onBagWeight?: (gramsPerBag: number) => void;
  onPrintRef?: (fn: () => void) => void;
  onDims?: (d: { widthCm: number; lengthCm: number }) => void;
}

function BagWeightCalculator({ onBagWeight, onDims, onPrintRef }: BagWeightCalculatorProps): JSX.Element {
  const { t } = useTranslation();
  const [bagType, setBagType] = useState<BagType>("hanger");
  const [widthCm, setWidthCm] = useState<number>(30);
  const [lengthCm, setLengthCm] = useState<number>(40);
  const [thicknessMicron, setThicknessMicron] = useState<number>(18);
  const [layers, setLayers] = useState<number>(2);
  const [density, setDensity] = useState<number>(0.95);
  const [sideGussetCm, setSideGussetCm] = useState<number>(0);
  const { history, addRecord, clearHistory, deleteRecord } = useBagWeightHistory();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const usesGusset = bagTypeUsesGusset(bagType);
  const isTableCover = bagType === "table-cover";

  useEffect(() => { onDims?.({ widthCm, lengthCm }); }, [widthCm, lengthCm, onDims]);

  const hangerCm = useMemo(
    () => (bagType === "hanger" ? getHangerHeightCm(toNumber(widthCm), toNumber(lengthCm)) : 0),
    [bagType, widthCm, lengthCm],
  );

  const result = useMemo(() => {
    const t_cm = toNumber(thicknessMicron) * 1e-4;
    const w = toNumber(widthCm);
    const l = toNumber(lengthCm);
    const g = toNumber(sideGussetCm);
    const effWidth = usesGusset ? w + 2 * g : w;
    const effLength = (bagType === "hanger" && l > 0 && w > 0) ? l + hangerCm : l;
    const layersUsed = isTableCover ? 1 : Math.max(1, toNumber(layers));
    const gramsPerBag = Math.max(0, effWidth * effLength * layersUsed * t_cm * toNumber(density));
    const bagsPerKg = gramsPerBag > 0 ? 1000 / gramsPerBag : 0;
    const areaM2 = (effWidth / 100) * (effLength / 100);
    return { gramsPerBag, bagsPerKg, areaM2 } as const;
  }, [bagType, widthCm, lengthCm, thicknessMicron, layers, density, sideGussetCm, usesGusset, isTableCover, hangerCm]);

  useEffect(() => { onBagWeight?.(result.gramsPerBag || 0); }, [result.gramsPerBag, onBagWeight]);

  const handleSaveRecord = () => {
    addRecord({
      bagType,
      widthCm,
      lengthCm,
      sideGussetCm: usesGusset ? sideGussetCm : 0,
      thicknessMicron,
      layers: isTableCover ? 1 : layers,
      density,
      gramsPerBag: result.gramsPerBag,
      bagsPerKg: result.bagsPerKg,
      areaM2: result.areaM2,
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === history.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(history.map(r => r.id)));
  };

  const selectedRecords = history.filter(r => selectedIds.has(r.id));
  const getBagTypeLabel = (type: BagType) => {
    switch (type) {
      case "hanger": return t("tools.bagWeight.hanger");
      case "banana": return t("tools.bagWeight.banana");
      case "no-handle": return t("tools.bagWeight.noHandle");
      case "table-cover": return t("tools.bagWeight.tableCover");
      default: return type;
    }
  };

  const directPrint = (records: BagWeightRecord[]) => {
    if (records.length === 0) return;
    const isAr = document.documentElement.dir === "rtl";
    const dir = isAr ? "rtl" : "ltr";
    const rows = records.map(r => `
      <tr>
        <td>${getBagTypeLabel(r.bagType)}</td>
        <td>${r.widthCm} × ${r.lengthCm}</td>
        <td>${r.thicknessMicron} μm</td>
        <td>${r.layers}</td>
        <td>${r.density}</td>
        ${bagTypeUsesGusset(r.bagType) && r.sideGussetCm > 0 ? `<td>${r.sideGussetCm}</td>` : `<td>-</td>`}
        <td style="font-weight:bold;color:#1a365d">${fmtFixed(r.gramsPerBag, 3)}</td>
        <td>${fmtFixed(r.bagsPerKg, 1)}</td>
        <td>${fmtFixed(r.areaM2, 4)}</td>
        <td style="font-size:11px;color:#888">${r.createdAt || ""}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${isAr ? "ar" : "en"}">
<head>
<meta charset="UTF-8">
<title>${t("tools.bagWeight.printTitle")}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Tahoma,sans-serif;padding:20mm 15mm;background:#fff;color:#333;direction:${dir}}
  h1{text-align:center;font-size:22px;color:#1a365d;margin-bottom:6px}
  .subtitle{text-align:center;font-size:13px;color:#666;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#1a365d;color:#fff;padding:8px 6px;border:1px solid #ccc;white-space:nowrap}
  td{padding:7px 6px;border:1px solid #ddd;text-align:center}
  tbody tr:nth-child(even){background:#f5f7fa}
  .footer{margin-top:20px;text-align:center;font-size:10px;color:#aaa}
  @media print{@page{size:A4 landscape;margin:10mm}}
</style>
</head>
<body>
  <h1>${t("tools.bagWeight.printTitle")}</h1>
  <p class="subtitle">${new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })} — ${records.length > 1 ? records.length + " " + t("tools.bagWeight.records") : ""}</p>
  <table>
    <thead>
      <tr>
        <th>${t("tools.bagWeight.type")}</th>
        <th>${t("tools.bagWeight.dimensions")}</th>
        <th>${t("tools.bagWeight.thickness")}</th>
        <th>${t("tools.bagWeight.layers")}</th>
        <th>${t("tools.bagWeight.density")}</th>
        <th>${t("tools.bagWeight.gusset")}</th>
        <th>${t("tools.bagWeight.weightPerBag")}</th>
        <th>${t("tools.bagWeight.bagsPerKg")}</th>
        <th>${t("tools.bagWeight.area")}</th>
        <th>${t("tools.bagWeight.date")}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">${t("tools.bagWeight.printFooter")}</div>
</body>
</html>`;
    const w = window.open("", "_blank", "width=900,height=600");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const handlePrintSelected = () => {
    if (selectedIds.size === 0) return;
    directPrint(selectedRecords);
  };

  const handlePrintCurrent = () => {
    const currentRecord: BagWeightRecord = {
      id: 0,
      createdAt: new Date().toLocaleString("en-US"),
      bagType,
      widthCm,
      lengthCm,
      sideGussetCm: usesGusset ? sideGussetCm : 0,
      thicknessMicron,
      layers: isTableCover ? 1 : layers,
      density,
      gramsPerBag: result.gramsPerBag,
      bagsPerKg: result.bagsPerKg,
      areaM2: result.areaM2,
    };
    directPrint([currentRecord]);
  };

  useEffect(() => { onPrintRef?.(handlePrintCurrent); });

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-4">
              <SelectField
                label={t("tools.bagWeight.type")}
                value={bagType}
                onChange={(v) => setBagType(v as BagType)}
                options={[
                  { value: "hanger", label: t("tools.bagWeight.hanger") },
                  { value: "banana", label: t("tools.bagWeight.banana") },
                  { value: "no-handle", label: t("tools.bagWeight.noHandle") },
                  { value: "table-cover", label: t("tools.bagWeight.tableCover") },
                ]}
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField label={t("tools.bagWeight.width")} value={widthCm} onChange={setWidthCm} suffix={t("tools.common.cm")} />
                <InputField label={t("tools.bagWeight.length")} value={lengthCm} onChange={setLengthCm} suffix={t("tools.common.cm")} />
              </div>
              {usesGusset ? (
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label={t("tools.bagWeight.gusset")}
                    value={sideGussetCm}
                    onChange={setSideGussetCm}
                    suffix={t("tools.common.cm")}
                    hint={t("tools.bagWeight.perSide")}
                  />
                  <InputField label={t("tools.bagWeight.thickness")} value={thicknessMicron} onChange={setThicknessMicron} suffix="μm" />
                </div>
              ) : (
                <InputField label={t("tools.bagWeight.thickness")} value={thicknessMicron} onChange={setThicknessMicron} suffix="μm" />
              )}
              <div className="grid grid-cols-2 gap-3">
                {!isTableCover && (
                  <InputField label={t("tools.bagWeight.layers")} value={layers} onChange={setLayers} step={1} />
                )}
                <InputField label={t("tools.bagWeight.density")} value={density} onChange={setDensity} step={0.01} suffix="g/cm³" />
              </div>
              {bagType === "hanger" && (
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg px-3 py-2">
                  {t("tools.bagWeight.hangerHeightAuto", { value: hangerCm })}
                </div>
              )}
            </div>
            <div className="hidden md:flex w-36 flex-shrink-0 flex-col items-center gap-2">
              <BagShapeSvg
                type={bagType}
                widthCm={toNumber(widthCm)}
                lengthCm={toNumber(lengthCm)}
                sideGussetCm={usesGusset ? toNumber(sideGussetCm) : 0}
                className="w-full h-auto transition-all duration-300"
              />
              <span className="text-[11px] font-medium text-muted-foreground text-center">
                {getBagTypeLabel(bagType)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="md:hidden flex flex-col items-center gap-1 mb-4">
            <BagShapeSvg
              type={bagType}
              widthCm={toNumber(widthCm)}
              lengthCm={toNumber(lengthCm)}
              sideGussetCm={usesGusset ? toNumber(sideGussetCm) : 0}
              className="w-28 h-auto"
            />
            <span className="text-[11px] font-medium text-muted-foreground">
              {getBagTypeLabel(bagType)}
            </span>
          </div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            {t("tools.bagWeight.results")}
          </h3>
          <div className="grid gap-3">
            <ResultCard label={t("tools.bagWeight.weightPerBag")} value={`${fmtFixed(result.gramsPerBag, 3)} ${t("tools.common.gram")}`} highlight />
            <ResultCard label={t("tools.bagWeight.bagsPerKg")} value={`${fmtFixed(result.bagsPerKg, 1)} ${t("tools.common.bag")}`} />
            <ResultCard label={t("tools.bagWeight.area")} value={`${fmtFixed(result.areaM2, 4)} ${t("tools.common.sqm")}`} />
          </div>
          <Button onClick={handleSaveRecord} className="w-full">
            <Scale className="h-4 w-4 ml-2" />
            {t("tools.bagWeight.saveRecord")}
          </Button>
        </div>
      </div>

      {history.length > 0 && (
        <Card className="print:hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("tools.bagWeight.history")} ({history.length})</CardTitle>
              <div className="flex gap-2">
                {selectedIds.size > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrintSelected}>
                    <Printer className="h-4 w-4 ml-1" />
                    {t("tools.bagWeight.printSelected")} ({selectedIds.size})
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={clearHistory} className="text-destructive">
                  {t("tools.bagWeight.clearHistory")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer pb-2 border-b">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selectedIds.size === history.length && history.length > 0}
                  onChange={toggleSelectAll}
                />
                <span className="font-medium">{t("tools.bagWeight.selectAll")}</span>
              </label>
              {history.map((record) => (
                <div
                  key={record.id}
                  className={`p-3 rounded-lg border transition-colors ${selectedIds.has(record.id) ? 'bg-primary/5 border-primary' : 'bg-slate-50 dark:bg-slate-800 border-transparent'}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="rounded mt-1"
                      checked={selectedIds.has(record.id)}
                      onChange={() => toggleSelect(record.id)}
                    />
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t("tools.bagWeight.type")}:</span>
                        <span className="mr-1 font-medium">{getBagTypeLabel(record.bagType)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("tools.bagWeight.dimensions")}:</span>
                        <span className="mr-1">
                          {record.widthCm}×{record.lengthCm} {t("tools.common.cm")}
                          {record.sideGussetCm > 0 && ` + ${t("tools.bagWeight.gusset").replace(/\s*\(.*\)/, "")} ${record.sideGussetCm}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("tools.bagWeight.weight")}:</span>
                        <span className="mr-1 font-bold text-primary">{fmtFixed(record.gramsPerBag, 3)} {t("tools.common.gram")}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("tools.bagWeight.bagsPerKg")}:</span>
                        <span className="mr-1">{fmtFixed(record.bagsPerKg, 1)}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRecord(record.id)}>×</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 mr-6">{record.createdAt}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

// ===================== 2) أدوات الألوان =====================

function ColorTools(): JSX.Element {
  const { t } = useTranslation();
  const [c, setC] = useState<number>(0);
  const [m, setM] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [k, setK] = useState<number>(0);
  const rgb = useMemo(() => cmykToRgb(c, m, y, k), [c, m, y, k]);
  const hex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          {t("tools.colors.cmykToRgb")}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Cyan %" value={c} onChange={setC} step={1} suffix="%" />
          <InputField label="Magenta %" value={m} onChange={setM} step={1} suffix="%" />
          <InputField label="Yellow %" value={y} onChange={setY} step={1} suffix="%" />
          <InputField label="Key %" value={k} onChange={setK} step={1} suffix="%" />
        </div>
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <div className="w-20 h-20 rounded-xl border-2 shadow-inner" style={{ backgroundColor: hex }} />
          <div className="space-y-1">
            <p className="text-sm"><span className="text-muted-foreground">RGB:</span> {rgb.r}, {rgb.g}, {rgb.b}</p>
            <p className="text-sm"><span className="text-muted-foreground">HEX:</span> <Badge variant="outline">{hex}</Badge></p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          {t("tools.colors.rgbToCmyk")}
        </h3>
        <RgbToCmykWidget />
      </div>
    </div>
  );
}

function RgbToCmykWidget(): JSX.Element {
  const [r, setR] = useState<number>(255);
  const [g, setG] = useState<number>(255);
  const [b, setB] = useState<number>(255);
  const cmyk = useMemo(() => rgbToCmyk(r, g, b), [r, g, b]);
  const hex = useMemo(() => rgbToHex(r, g, b), [r, g, b]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <InputField label="R" value={r} onChange={setR} step={1} />
        <InputField label="G" value={g} onChange={setG} step={1} />
        <InputField label="B" value={b} onChange={setB} step={1} />
      </div>
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
        <div className="w-20 h-20 rounded-xl border-2 shadow-inner" style={{ backgroundColor: hex }} />
        <div className="space-y-1">
          <p className="text-sm"><span className="text-muted-foreground">HEX:</span> <Badge variant="outline">{hex}</Badge></p>
          <p className="text-sm"><span className="text-muted-foreground">CMYK:</span> {cmyk.c}% / {cmyk.m}% / {cmyk.y}% / {cmyk.k}%</p>
        </div>
      </div>
    </div>
  );
}

// ===================== 3) خلطات اللون =====================

function ColorMixTools(): JSX.Element {
  const { t } = useTranslation();
  const [hex, setHex] = useState<string>("#008DCB");
  const [cmyk, setCmyk] = useState<CMYK>(() => rgbToCmyk(0, 141, 203));
  const [totalInkPct, setTotalInkPct] = useState<number>(100);
  const [palette, setPalette] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function onHexChange(v: string) {
    const clean = normalizeHex(v);
    setHex(clean);
    const { r, g, b } = hexToRgb(clean);
    setCmyk(rgbToCmyk(r, g, b));
  }

  function handleImageUpload(file: File) {
    const img = new Image();
    img.onload = () => {
      const cvs = canvasRef.current ?? document.createElement("canvas");
      const ctx = cvs.getContext("2d");
      if (!ctx) return;
      const W = 240, H = Math.max(120, Math.floor((img.height / img.width) * 240));
      cvs.width = W; cvs.height = H;
      ctx.drawImage(img, 0, 0, W, H);
      const data = ctx.getImageData(0, 0, W, H).data;
      const buckets: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const R = r >> 5, G = g >> 5, B = b >> 5;
        const key = `${R}-${G}-${B}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }
      const entries = Object.entries(buckets).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const pal = entries.map(([k]) => {
        const [R, G, B] = k.split("-").map((n) => Number(n));
        return rgbToHex(R * 32 + 16, G * 32 + 16, B * 32 + 16);
      });
      setPalette(pal);
      if (pal[0]) onHexChange(pal[0]);
    };
    img.src = URL.createObjectURL(file);
  }

  const mix = useMemo(() => {
    const total = Math.max(1, cmyk.c + cmyk.m + cmyk.y + cmyk.k);
    const factor = totalInkPct / total;
    return {
      C: round(cmyk.c * factor, 1),
      M: round(cmyk.m * factor, 1),
      Y: round(cmyk.y * factor, 1),
      K: round(cmyk.k * factor, 1),
    };
  }, [cmyk, totalInkPct]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <TextField label={t("tools.colorMix.hexCode")} value={hex} onChange={onHexChange} placeholder="#RRGGBB" />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="C %" value={cmyk.c} onChange={(v) => setCmyk({ ...cmyk, c: v })} step={1} />
          <InputField label="M %" value={cmyk.m} onChange={(v) => setCmyk({ ...cmyk, m: v })} step={1} />
          <InputField label="Y %" value={cmyk.y} onChange={(v) => setCmyk({ ...cmyk, y: v })} step={1} />
          <InputField label="K %" value={cmyk.k} onChange={(v) => setCmyk({ ...cmyk, k: v })} step={1} />
        </div>
        <InputField label={t("tools.colorMix.mixTotal")} value={totalInkPct} onChange={setTotalInkPct} step={1} suffix="%" />
        
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl border-2" style={{ backgroundColor: hex }} />
            <div>
              <p className="font-semibold">{t("tools.colorMix.suggestedMix")}</p>
              <p className="text-sm text-muted-foreground">{t("tools.colorMix.fromTotal")} {totalInkPct}%</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <ResultCard label="C" value={`${mix.C}%`} />
            <ResultCard label="M" value={`${mix.M}%`} />
            <ResultCard label="Y" value={`${mix.Y}%`} />
            <ResultCard label="K" value={`${mix.K}%`} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">{t("tools.colorMix.extractColors")}</h3>
        <div className="border-2 border-dashed rounded-xl p-6 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <PaintBucket className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("tools.colorMix.clickToUpload")}</p>
          </label>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {palette.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("tools.colorMix.extractedColors")}</p>
            <div className="grid grid-cols-6 gap-2">
              {palette.map((p) => (
                <button
                  key={p}
                  className="aspect-square rounded-lg border-2 hover:scale-110 transition-transform"
                  style={{ backgroundColor: p }}
                  title={p}
                  onClick={() => onHexChange(p)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== 4) استهلاك الحبر =====================

function InkUsageCalculator({ sharedDims }: { sharedDims: { widthCm: number; lengthCm: number } | null }): JSX.Element {
  const { t } = useTranslation();
  const [widthCm, setWidthCm] = useState<number>(sharedDims?.widthCm ?? 30);
  const [lengthCm, setLengthCm] = useState<number>(sharedDims?.lengthCm ?? 40);
  const [printSides, setPrintSides] = useState<string>("1");
  const [coveragePct, setCoveragePct] = useState<number>(30);
  const [inkLaydownGsm, setInkLaydownGsm] = useState<number>(1.2);
  const [qty, setQty] = useState<number>(10000);

  useEffect(() => { 
    if (sharedDims) { 
      setWidthCm(sharedDims.widthCm); 
      setLengthCm(sharedDims.lengthCm); 
    } 
  }, [sharedDims]);

  const result = useMemo(() => {
    const area_m2 = (toNumber(widthCm) / 100) * (toNumber(lengthCm) / 100);
    const printed_m2_per_bag = area_m2 * (toNumber(coveragePct) / 100) * Number(printSides);
    const total_printed_m2 = printed_m2_per_bag * toNumber(qty);
    const ink_grams = total_printed_m2 * toNumber(inkLaydownGsm);
    const ink_kg = ink_grams / 1000;
    return { printed_m2_per_bag, total_printed_m2, ink_kg } as const;
  }, [widthCm, lengthCm, printSides, coveragePct, inkLaydownGsm, qty]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputField label={t("tools.bagWeight.width")} value={widthCm} onChange={setWidthCm} suffix={t("tools.common.cm")} />
          <InputField label={t("tools.bagWeight.length")} value={lengthCm} onChange={setLengthCm} suffix={t("tools.common.cm")} />
        </div>
        <SelectField
          label={t("tools.inkUsage.printSides")}
          value={printSides}
          onChange={setPrintSides}
          options={[
            { value: "1", label: t("tools.inkUsage.oneSide") },
            { value: "2", label: t("tools.inkUsage.twoSides") },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <InputField label={t("tools.inkUsage.coverage")} value={coveragePct} onChange={setCoveragePct} step={1} suffix="%" />
          <InputField label={t("tools.inkUsage.inkLaydown")} value={inkLaydownGsm} onChange={setInkLaydownGsm} suffix="g/m²" />
        </div>
        <InputField label={t("tools.inkUsage.quantity")} value={qty} onChange={setQty} step={500} suffix={t("tools.common.piece")} />
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          {t("tools.inkUsage.results")}
        </h3>
        <div className="grid gap-3">
          <ResultCard label={t("tools.inkUsage.printedAreaPerBag")} value={`${fmtFixed(result.printed_m2_per_bag, 4)} ${t("tools.common.sqm")}`} />
          <ResultCard label={t("tools.inkUsage.totalArea")} value={`${fmtFixed(result.total_printed_m2, 2)} ${t("tools.common.sqm")}`} />
          <ResultCard label={t("tools.inkUsage.inkRequired")} value={`${fmtFixed(result.ink_kg, 2)} ${t("tools.common.kg")}`} highlight />
        </div>
      </div>
    </div>
  );
}

// ===================== 5) تكلفة سريعة =====================

function OrderCostCalculator({ sharedBagWeightG = 0 }: { sharedBagWeightG?: number }): JSX.Element {
  const { t } = useTranslation();
  const [qty, setQty] = useState<number>(10000);
  const [bagWeightG, setBagWeightG] = useState<number>(sharedBagWeightG || 5);
  const [useShared, setUseShared] = useState<boolean>(Boolean(sharedBagWeightG));
  const [materialPricePerKg, setMaterialPricePerKg] = useState<number>(7.0);
  const [wastePct, setWastePct] = useState<number>(4);
  const [extrusionCostPerKg, setExtrusionCostPerKg] = useState<number>(1.0);
  const [cuttingCostPer1000, setCuttingCostPer1000] = useState<number>(6.0);
  const [colors, setColors] = useState<number>(0);
  const [printCostPerColorPer1000, setPrintCostPerColorPer1000] = useState<number>(5.0);
  const [marginPct, setMarginPct] = useState<number>(10);

  useEffect(() => { if (useShared) setBagWeightG(sharedBagWeightG || 0); }, [sharedBagWeightG, useShared]);

  const result = useMemo(() => {
    const weightPerBagG = toNumber(bagWeightG);
    const totalWeightKg = (toNumber(qty) * weightPerBagG) / 1_000_000;
    const materialKg = totalWeightKg * (1 + toNumber(wastePct) / 100);
    const materialCost = materialKg * toNumber(materialPricePerKg);
    const extrusionCost = materialKg * toNumber(extrusionCostPerKg);
    const cuttingCost = (toNumber(qty) / 1000) * toNumber(cuttingCostPer1000);
    const printingCost = (toNumber(qty) / 1000) * toNumber(colors) * toNumber(printCostPerColorPer1000);
    const subtotal = materialCost + extrusionCost + cuttingCost + printingCost;
    const margin = subtotal * (toNumber(marginPct) / 100);
    const total = subtotal + margin;
    return {
      materialKg, materialCost, extrusionCost, cuttingCost, printingCost,
      subtotal, margin, total,
      unitPrice: total / Math.max(1, toNumber(qty)),
      pricePerKg: total / Math.max(0.000001, materialKg)
    } as const;
  }, [qty, bagWeightG, wastePct, materialPricePerKg, extrusionCostPerKg, cuttingCostPer1000, colors, printCostPerColorPer1000, marginPct]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="rounded"
            checked={useShared}
            onChange={(e) => setUseShared(e.target.checked)}
          />
          {t("tools.orderCost.useBagWeight")} ({fmtFixed(sharedBagWeightG, 3)} {t("tools.common.gram")})
        </label>
        {!useShared && <InputField label={t("tools.orderCost.bagWeight")} value={bagWeightG} onChange={setBagWeightG} suffix={t("tools.common.gram")} />}
        <InputField label={t("tools.orderCost.quantity")} value={qty} onChange={setQty} step={500} suffix={t("tools.common.piece")} />
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-3">
          <InputField label={t("tools.orderCost.materialPrice")} value={materialPricePerKg} onChange={setMaterialPricePerKg} suffix={t("tools.common.sarPerKg")} />
          <InputField label={t("tools.orderCost.wastePct")} value={wastePct} onChange={setWastePct} suffix="%" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label={t("tools.orderCost.extrusionCost")} value={extrusionCostPerKg} onChange={setExtrusionCostPerKg} suffix={t("tools.common.sarPerKg")} />
          <InputField label={t("tools.orderCost.cuttingCost")} value={cuttingCostPer1000} onChange={setCuttingCostPer1000} suffix={t("tools.orderCostAdvanced.per1000")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label={t("tools.orderCost.colorsCount")} value={colors} onChange={setColors} step={1} />
          <InputField label={t("tools.orderCost.printingCost")} value={printCostPerColorPer1000} onChange={setPrintCostPerColorPer1000} suffix={t("tools.common.sarPerColor")} />
        </div>
        <InputField label={t("tools.orderCost.profitMargin")} value={marginPct} onChange={setMarginPct} suffix="%" />
      </div>
      
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          {t("tools.orderCost.results")}
        </h3>
        <div className="grid gap-2">
          <ResultCard label={t("tools.orderCost.materialWeight")} value={`${fmtFixed(result.materialKg, 2)} ${t("tools.common.kg")}`} />
          <ResultCard label={t("tools.orderCost.materialCostResult")} value={`${fmtFixed(result.materialCost, 2)} ${t("tools.common.sar")}`} />
          <ResultCard label={t("tools.orderCost.extrusionCostResult")} value={`${fmtFixed(result.extrusionCost, 2)} ${t("tools.common.sar")}`} />
          <ResultCard label={t("tools.orderCost.cuttingCostResult")} value={`${fmtFixed(result.cuttingCost, 2)} ${t("tools.common.sar")}`} />
          {colors > 0 && <ResultCard label={t("tools.orderCost.printingCostResult")} value={`${fmtFixed(result.printingCost, 2)} ${t("tools.common.sar")}`} />}
        </div>
        <Separator />
        <div className="grid gap-2">
          <ResultCard label={t("tools.orderCost.subtotal")} value={`${fmtFixed(result.subtotal, 2)} ${t("tools.common.sar")}`} />
          <ResultCard label={t("tools.orderCost.profit")} value={`${fmtFixed(result.margin, 2)} ${t("tools.common.sar")}`} />
          <ResultCard label={t("tools.orderCost.total")} value={`${fmtFixed(result.total, 2)} ${t("tools.common.sar")}`} highlight />
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-2">
          <ResultCard label={t("tools.orderCost.unitPrice")} value={`${fmtFixed(result.unitPrice, 2)} ${t("tools.common.sar")}`} />
          <ResultCard label={t("tools.orderCost.pricePerKg")} value={`${fmtFixed(result.pricePerKg, 2)} ${t("tools.common.sar")}`} />
        </div>
      </div>
    </div>
  );
}

// ===================== 6) تكلفة متقدمة =====================

interface BomItem { name: string; pct: number; pricePerKg: number; }
interface OtherCost { name: string; type: "perKg" | "per1000" | "fixed"; value: number; }

function OrderCostAdvanced({ sharedBagWeightG = 0 }: { sharedBagWeightG?: number }): JSX.Element {
  const { t } = useTranslation();
  const [qty, setQty] = useState<number>(10000);
  const [bagWeightG, setBagWeightG] = useState<number>(sharedBagWeightG || 5);
  const [useShared, setUseShared] = useState<boolean>(Boolean(sharedBagWeightG));
  const [bom, setBom] = useState<BomItem[]>([
    { name: "HDPE Base", pct: 90, pricePerKg: 7.0 },
    { name: "Masterbatch", pct: 8, pricePerKg: 12.0 },
    { name: "Additive", pct: 2, pricePerKg: 18.0 },
  ]);
  const [otherCosts, setOtherCosts] = useState<OtherCost[]>([
    { name: "Energy Cost", type: "perKg", value: 0.4 },
    { name: "Cutting", type: "per1000", value: 6.0 },
    { name: "Setup", type: "fixed", value: 50 },
  ]);
  const [wastePct, setWastePct] = useState<number>(4);
  const [colors, setColors] = useState<number>(0);
  const [printCostPerColorPer1000, setPrintCostPerColorPer1000] = useState<number>(5.0);
  const [marginPct, setMarginPct] = useState<number>(10);

  useEffect(() => { if (useShared) setBagWeightG(sharedBagWeightG || 0); }, [sharedBagWeightG, useShared]);

  const blend = useMemo(() => {
    const totalPct = Math.max(1, bom.reduce((s, r) => s + toNumber(r.pct), 0));
    const norm = bom.map((r) => ({ ...r, weight: r.pct / totalPct }));
    const pricePerKg = norm.reduce((sum, r) => sum + r.weight * toNumber(r.pricePerKg), 0);
    return { pricePerKg } as const;
  }, [bom]);

  const result = useMemo(() => {
    const weightPerBagG = toNumber(bagWeightG);
    const totalWeightKg = (toNumber(qty) * weightPerBagG) / 1_000_000;
    const materialKg = totalWeightKg * (1 + toNumber(wastePct) / 100);
    const materialCost = materialKg * blend.pricePerKg;
    const others = otherCosts.reduce((acc, c) => {
      if (c.type === "perKg") acc.sum += materialKg * toNumber(c.value);
      else if (c.type === "per1000") acc.sum += (toNumber(qty) / 1000) * toNumber(c.value);
      else acc.sum += toNumber(c.value);
      return acc;
    }, { sum: 0 }).sum;
    const printingCost = (toNumber(qty) / 1000) * toNumber(colors) * toNumber(printCostPerColorPer1000);
    const subtotal = materialCost + others + printingCost;
    const margin = subtotal * (toNumber(marginPct) / 100);
    const total = subtotal + margin;
    return {
      materialKg, blendPrice: blend.pricePerKg, materialCost, otherCosts: others,
      printingCost, subtotal, margin, total,
      unitPrice: total / Math.max(1, toNumber(qty)),
      pricePerKg: total / Math.max(0.000001, materialKg),
    } as const;
  }, [qty, bagWeightG, wastePct, blend.pricePerKg, otherCosts, colors, printCostPerColorPer1000, marginPct]);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="rounded" checked={useShared} onChange={(e) => setUseShared(e.target.checked)} />
            {t("tools.orderCost.useBagWeight")}
          </label>
          {!useShared && <InputField label={t("tools.orderCost.bagWeight")} value={bagWeightG} onChange={setBagWeightG} suffix={t("tools.common.gram")} />}
          <InputField label={t("tools.orderCost.quantity")} value={qty} onChange={setQty} step={500} suffix={t("tools.common.piece")} />
          <InputField label={t("tools.orderCost.wastePct")} value={wastePct} onChange={setWastePct} suffix="%" />
          
          <Separator />
          
          <h4 className="font-semibold">{t("tools.orderCostAdvanced.bomComponents")}</h4>
          <BomTable rows={bom} setRows={setBom} />
        </div>
        
        <div className="space-y-4">
          <h4 className="font-semibold">{t("tools.orderCostAdvanced.otherCosts")}</h4>
          <OtherCostsTable rows={otherCosts} setRows={setOtherCosts} />
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-3">
            <InputField label={t("tools.orderCost.colorsCount")} value={colors} onChange={setColors} step={1} />
            <InputField label={t("tools.orderCost.printingCost")} value={printCostPerColorPer1000} onChange={setPrintCostPerColorPer1000} suffix={t("tools.common.sarPerColor")} />
          </div>
          <InputField label={t("tools.orderCost.profitMargin")} value={marginPct} onChange={setMarginPct} suffix="%" />
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          {t("tools.orderCostAdvanced.costResults")}
        </h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ResultCard label={t("tools.orderCostAdvanced.blendPrice")} value={`${fmtFixed(result.blendPrice, 2)} ${t("tools.common.sarPerKg")}`} />
          <ResultCard label={t("tools.orderCostAdvanced.materialWeight")} value={`${fmtFixed(result.materialKg, 2)} ${t("tools.common.kg")}`} />
          <ResultCard label={t("tools.orderCostAdvanced.materialCost")} value={`${fmtFixed(result.materialCost, 2)} ${t("tools.common.sar")}`} />
          <ResultCard label={t("tools.orderCostAdvanced.otherCostsResult")} value={`${fmtFixed(result.otherCosts, 2)} ${t("tools.common.sar")}`} />
        </div>
        <Separator className="my-4" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ResultCard label={t("tools.orderCost.subtotal")} value={`${fmtFixed(result.subtotal, 2)} ${t("tools.common.sar")}`} />
          <ResultCard label={t("tools.orderCost.profit")} value={`${fmtFixed(result.margin, 2)} ${t("tools.common.sar")}`} />
          <ResultCard label={t("tools.orderCost.total")} value={`${fmtFixed(result.total, 2)} ${t("tools.common.sar")}`} highlight />
          <ResultCard label={t("tools.orderCost.unitPrice")} value={`${fmtFixed(result.unitPrice, 2)} ${t("tools.common.sar")}`} />
        </div>
      </div>
    </div>
  );
}

function BomTable({ rows, setRows }: { rows: BomItem[]; setRows: (r: BomItem[]) => void }): JSX.Element {
  const { t } = useTranslation();
  const updateRow = (idx: number, patch: Partial<BomItem>) => {
    setRows(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const addRow = () => setRows([...rows, { name: t("tools.orderCostAdvanced.newComponent"), pct: 0, pricePerKg: 0 }]);
  const delRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <Input className="col-span-5" value={r.name} onChange={(e) => updateRow(i, { name: e.target.value })} placeholder={t("tools.orderCostAdvanced.name")} />
          <Input type="number" className="col-span-2" value={r.pct} step={0.1} onChange={(e) => updateRow(i, { pct: Number(e.target.value) })} placeholder="%" />
          <Input type="number" className="col-span-3" value={r.pricePerKg} step={0.1} onChange={(e) => updateRow(i, { pricePerKg: Number(e.target.value) })} placeholder={t("tools.orderCostAdvanced.price")} />
          <Button variant="ghost" size="sm" className="col-span-2 text-destructive" onClick={() => delRow(i)}>{t("tools.orderCostAdvanced.delete")}</Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addRow}>{t("tools.orderCostAdvanced.addComponent")}</Button>
    </div>
  );
}

function OtherCostsTable({ rows, setRows }: { rows: OtherCost[]; setRows: (r: OtherCost[]) => void }): JSX.Element {
  const { t } = useTranslation();
  const updateRow = (idx: number, patch: Partial<OtherCost>) => setRows(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const addRow = () => setRows([...rows, { name: t("tools.orderCostAdvanced.newCost"), type: "fixed", value: 0 }]);
  const delRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <Input className="col-span-4" value={r.name} onChange={(e) => updateRow(i, { name: e.target.value })} />
          <Select value={r.type} onValueChange={(v) => updateRow(i, { type: v as OtherCost["type"] })}>
            <SelectTrigger className="col-span-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="perKg">{t("tools.orderCostAdvanced.perKg")}</SelectItem>
              <SelectItem value="per1000">{t("tools.orderCostAdvanced.per1000")}</SelectItem>
              <SelectItem value="fixed">{t("tools.orderCostAdvanced.fixed")}</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" className="col-span-3" value={r.value} step={0.1} onChange={(e) => updateRow(i, { value: Number(e.target.value) })} />
          <Button variant="ghost" size="sm" className="col-span-2 text-destructive" onClick={() => delRow(i)}>{t("tools.orderCostAdvanced.delete")}</Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addRow}>{t("tools.orderCostAdvanced.addCost")}</Button>
    </div>
  );
}

// ===================== 7) أدوات الرول =====================

function RollTools(): JSX.Element {
  const { t } = useTranslation();
  const [rollWeightKg, setRollWeightKg] = useState<number>(25);
  const [coreWeightKg, setCoreWeightKg] = useState<number>(0.4);
  const [rollWidthCm, setRollWidthCm] = useState<number>(60);
  const [rollThicknessMicron, setRollThicknessMicron] = useState<number>(18);
  const [rollDensity, setRollDensity] = useState<number>(0.95);

  const netRollWeightG = Math.max(0, toNumber(rollWeightKg) - toNumber(coreWeightKg)) * 1000;
  const thicknessCm = toNumber(rollThicknessMicron) * 1e-4;

  const lengthM = useMemo(() => {
    const denom = toNumber(rollWidthCm) * thicknessCm * toNumber(rollDensity) * 100;
    if (denom <= 0) return 0;
    return netRollWeightG / denom;
  }, [netRollWeightG, rollWidthCm, thicknessCm, rollDensity]);

  const [targetLengthM, setTargetLengthM] = useState<number>(1000);
  const [tWidthCm, setTWidthCm] = useState<number>(60);
  const [tThicknessMicron, setTThicknessMicron] = useState<number>(18);
  const [tDensity, setTDensity] = useState<number>(0.95);
  const tThicknessCm = toNumber(tThicknessMicron) * 1e-4;

  const neededWeightKg = useMemo(() => {
    const grams = toNumber(tWidthCm) * tThicknessCm * toNumber(targetLengthM) * 100 * toNumber(tDensity);
    return grams / 1000;
  }, [targetLengthM, tWidthCm, tThicknessCm, tDensity]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {t("tools.roll.weightToLength")}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <InputField label={t("tools.roll.rollWeight")} value={rollWeightKg} onChange={setRollWeightKg} suffix={t("tools.common.kg")} />
          <InputField label={t("tools.roll.coreWeight")} value={coreWeightKg} onChange={setCoreWeightKg} suffix={t("tools.common.kg")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label={t("tools.roll.width")} value={rollWidthCm} onChange={setRollWidthCm} suffix={t("tools.common.cm")} />
          <InputField label={t("tools.roll.thickness")} value={rollThicknessMicron} onChange={setRollThicknessMicron} suffix="μm" />
        </div>
        <InputField label={t("tools.roll.density")} value={rollDensity} onChange={setRollDensity} suffix="g/cm³" />
        <ResultCard label={t("tools.roll.estimatedLength")} value={`${fmtFixed(lengthM, 1)} ${t("tools.common.meter")}`} highlight />
      </div>
      
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {t("tools.roll.lengthToWeight")}
        </h4>
        <InputField label={t("tools.roll.targetLength")} value={targetLengthM} onChange={setTargetLengthM} suffix={t("tools.common.meter")} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label={t("tools.roll.width")} value={tWidthCm} onChange={setTWidthCm} suffix={t("tools.common.cm")} />
          <InputField label={t("tools.roll.thickness")} value={tThicknessMicron} onChange={setTThicknessMicron} suffix="μm" />
        </div>
        <InputField label={t("tools.roll.density")} value={tDensity} onChange={setTDensity} suffix="g/cm³" />
        <ResultCard label={t("tools.roll.requiredWeight")} value={`${fmtFixed(neededWeightKg, 2)} ${t("tools.common.kg")}`} highlight />
      </div>
    </div>
  );
}

// ===================== 8) تحويل السماكة =====================

function ThicknessConverter(): JSX.Element {
  const { t } = useTranslation();
  const [micron, setMicron] = useState<number>(20);
  const mm = useMemo(() => toNumber(micron) / 1000, [micron]);
  const gauge = useMemo(() => toNumber(micron) * 4, [micron]);

  const [mmIn, setMmIn] = useState<number>(0.02);
  const micronFromMm = useMemo(() => toNumber(mmIn) * 1000, [mmIn]);
  const gaugeFromMm = useMemo(() => micronFromMm * 4, [micronFromMm]);

  const [gaugeIn, setGaugeIn] = useState<number>(80);
  const micronFromGauge = useMemo(() => toNumber(gaugeIn) * 0.25, [gaugeIn]);
  const mmFromGauge = useMemo(() => micronFromGauge / 1000, [micronFromGauge]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
        <h4 className="font-semibold flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary" />
          {t("tools.thickness.fromMicron")}
        </h4>
        <InputField label={t("tools.thickness.micron")} value={micron} onChange={setMicron} suffix="μm" />
        <div className="grid gap-2">
          <ResultCard label={t("tools.thickness.mm")} value={fmtFixed(mm, 4)} />
          <ResultCard label={t("tools.thickness.gauge")} value={fmtFixed(gauge, 1)} />
        </div>
      </div>
      
      <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
        <h4 className="font-semibold flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary" />
          {t("tools.thickness.fromMm")}
        </h4>
        <InputField label={t("tools.thickness.mm")} value={mmIn} onChange={setMmIn} step={0.001} suffix="mm" />
        <div className="grid gap-2">
          <ResultCard label={t("tools.thickness.micron")} value={fmtFixed(micronFromMm, 1)} />
          <ResultCard label={t("tools.thickness.gauge")} value={fmtFixed(gaugeFromMm, 1)} />
        </div>
      </div>
      
      <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
        <h4 className="font-semibold flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary" />
          {t("tools.thickness.fromGauge")}
        </h4>
        <InputField label={t("tools.thickness.gauge")} value={gaugeIn} onChange={setGaugeIn} step={1} />
        <div className="grid gap-2">
          <ResultCard label={t("tools.thickness.micron")} value={fmtFixed(micronFromGauge, 1)} />
          <ResultCard label={t("tools.thickness.mm")} value={fmtFixed(mmFromGauge, 4)} />
        </div>
      </div>
    </div>
  );
}

// ===================== 9) زمن التشغيل =====================

function JobTimePlanner(): JSX.Element {
  const { t } = useTranslation();
  const [qty, setQty] = useState<number>(10000);
  const [bagWeightG, setBagWeightG] = useState<number>(5);
  const [extrusionKgPerHr, setExtrusionKgPerHr] = useState<number>(35);
  const [cutBagsPerMin, setCutBagsPerMin] = useState<number>(120);
  const [printMPerMin, setPrintMPerMin] = useState<number>(60);
  const [bagLengthCm, setBagLengthCm] = useState<number>(40);
  const [setupExtruderHr, setSetupExtruderHr] = useState<number>(0.5);
  const [setupCutterHr, setSetupCutterHr] = useState<number>(0.3);
  const [setupPrinterHr, setSetupPrinterHr] = useState<number>(0.7);
  const [colors, setColors] = useState<number>(0);
  const [changeoverPerColorMin, setChangeoverPerColorMin] = useState<number>(8);

  const result = useMemo(() => {
    const totalKg = (toNumber(qty) * toNumber(bagWeightG)) / 1000 / 1000;
    const extrusionHours = totalKg / Math.max(1e-6, toNumber(extrusionKgPerHr)) + toNumber(setupExtruderHr);
    const totalMeters = (toNumber(qty) * (toNumber(bagLengthCm) / 100));
    const printCore = totalMeters / Math.max(1e-6, toNumber(printMPerMin)) / 60;
    const printChangeovers = (toNumber(colors) > 0 ? (toNumber(colors) - 1) * (toNumber(changeoverPerColorMin) / 60) : 0);
    const printHours = printCore + printChangeovers + toNumber(setupPrinterHr);
    const cutCore = (toNumber(qty) / Math.max(1e-6, toNumber(cutBagsPerMin))) / 60;
    const cutHours = cutCore + toNumber(setupCutterHr);
    const totalHours = extrusionHours + printHours + cutHours;
    return { totalKg, extrusionHours, printHours, cutHours, totalHours } as const;
  }, [qty, bagWeightG, extrusionKgPerHr, cutBagsPerMin, printMPerMin, bagLengthCm, setupExtruderHr, setupCutterHr, setupPrinterHr, colors, changeoverPerColorMin]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputField label={t("tools.jobTime.quantity")} value={qty} onChange={setQty} step={500} suffix={t("tools.common.piece")} />
          <InputField label={t("tools.jobTime.bagWeight")} value={bagWeightG} onChange={setBagWeightG} suffix={t("tools.common.gram")} />
        </div>
        
        <Separator />
        <h4 className="font-semibold text-sm text-muted-foreground">{t("tools.jobTime.productionSpeeds")}</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <InputField label={t("tools.jobTime.extrusionSpeed")} value={extrusionKgPerHr} onChange={setExtrusionKgPerHr} suffix={t("tools.common.kgPerHour")} />
          <InputField label={t("tools.jobTime.cuttingSpeed")} value={cutBagsPerMin} onChange={setCutBagsPerMin} suffix={t("tools.common.piecesPerMin")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label={t("tools.jobTime.printingSpeed")} value={printMPerMin} onChange={setPrintMPerMin} suffix={t("tools.common.metersPerMin")} />
          <InputField label={t("tools.jobTime.bagLength")} value={bagLengthCm} onChange={setBagLengthCm} suffix={t("tools.common.cm")} />
        </div>
        
        <Separator />
        <h4 className="font-semibold text-sm text-muted-foreground">{t("tools.jobTime.setupTimes")}</h4>
        
        <div className="grid grid-cols-3 gap-3">
          <InputField label={t("tools.jobTime.extrusionSetup")} value={setupExtruderHr} onChange={setSetupExtruderHr} suffix={t("tools.common.hour")} />
          <InputField label={t("tools.jobTime.cuttingSetup")} value={setupCutterHr} onChange={setSetupCutterHr} suffix={t("tools.common.hour")} />
          <InputField label={t("tools.jobTime.printingSetup")} value={setupPrinterHr} onChange={setSetupPrinterHr} suffix={t("tools.common.hour")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label={t("tools.jobTime.colorsCount")} value={colors} onChange={setColors} step={1} />
          <InputField label={t("tools.jobTime.colorChangeTime")} value={changeoverPerColorMin} onChange={setChangeoverPerColorMin} suffix={t("tools.common.minute")} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {t("tools.jobTime.timeEstimate")}
        </h3>
        <div className="grid gap-3">
          <ResultCard label={t("tools.jobTime.materialWeight")} value={`${fmtFixed(result.totalKg, 2)} ${t("tools.common.kg")}`} />
          <ResultCard label={t("tools.jobTime.extrusionHours")} value={`${fmtFixed(result.extrusionHours, 2)} ${t("tools.common.hour")}`} />
          <ResultCard label={t("tools.jobTime.printingHours")} value={`${fmtFixed(result.printHours, 2)} ${t("tools.common.hour")}`} />
          <ResultCard label={t("tools.jobTime.cuttingHours")} value={`${fmtFixed(result.cutHours, 2)} ${t("tools.common.hour")}`} />
        </div>
        <Separator />
        <ResultCard label={t("tools.jobTime.totalHours")} value={`${fmtFixed(result.totalHours, 2)} ${t("tools.common.hour")}`} highlight />
        <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          {t("tools.jobTime.note")}
        </p>
      </div>
    </div>
  );
}

// ===================== Barcode Generator =====================

type BarcodeFormat = "CODE128" | "EAN13" | "EAN8" | "CODE39" | "ITF14" | "UPC" | "pharmacode";
type BarcodeSize = "small" | "medium" | "large" | "xlarge" | "label50x25" | "label55x40" | "label100x150";

interface BarcodeSizeData {
  width: number;
  height: number;
  fontSize: number;
  displayWidth: number;
  displayHeight: number;
  printWidthMm: number;
  printHeightMm: number;
}

const barcodeSizeData: Record<BarcodeSize, BarcodeSizeData> = {
  small: { width: 2, height: 30, fontSize: 10, displayWidth: 150, displayHeight: 50, printWidthMm: 38, printHeightMm: 13 },
  medium: { width: 2.5, height: 50, fontSize: 12, displayWidth: 200, displayHeight: 70, printWidthMm: 50, printHeightMm: 25 },
  large: { width: 3, height: 80, fontSize: 14, displayWidth: 280, displayHeight: 100, printWidthMm: 70, printHeightMm: 35 },
  xlarge: { width: 4, height: 100, fontSize: 16, displayWidth: 350, displayHeight: 130, printWidthMm: 90, printHeightMm: 50 },
  label50x25: { width: 2.5, height: 45, fontSize: 11, displayWidth: 189, displayHeight: 94, printWidthMm: 50, printHeightMm: 25 },
  label55x40: { width: 3, height: 70, fontSize: 12, displayWidth: 208, displayHeight: 151, printWidthMm: 55, printHeightMm: 40 },
  label100x150: { width: 4, height: 200, fontSize: 18, displayWidth: 378, displayHeight: 567, printWidthMm: 100, printHeightMm: 150 },
};

const barcodeFormatValues: BarcodeFormat[] = ["CODE128", "EAN13", "EAN8", "CODE39", "ITF14", "UPC", "pharmacode"];

const formatDefaultValues: Record<BarcodeFormat, string> = {
  CODE128: "1234567890",
  EAN13: "590123412345",
  EAN8: "9638507",
  CODE39: "ABC-1234",
  ITF14: "1234567890123",
  UPC: "01234567890",
  pharmacode: "1234",
};

type BarcodeValidationKey = "ean13" | "ean8" | "itf14" | "upc" | "code39" | "pharmacode";

const BARCODE_VALIDATION_RULES: Record<string, { test: (v: string) => boolean; key: BarcodeValidationKey }> = {
  EAN13: { test: (v) => /^\d{12,13}$/.test(v), key: "ean13" },
  EAN8: { test: (v) => /^\d{7,8}$/.test(v), key: "ean8" },
  ITF14: { test: (v) => /^\d{13,14}$/.test(v), key: "itf14" },
  UPC: { test: (v) => /^\d{11,12}$/.test(v), key: "upc" },
  CODE39: { test: (v) => /^[A-Z0-9\-. $/+%]+$/i.test(v), key: "code39" },
  pharmacode: { test: (v) => /^\d+$/.test(v) && parseInt(v, 10) >= 3 && parseInt(v, 10) <= 131070, key: "pharmacode" },
};

function validateBarcodeInput(value: string, format: BarcodeFormat, t: (key: string) => string): string | null {
  if (!value) return null;
  const rule = BARCODE_VALIDATION_RULES[format];
  if (!rule) return null;
  if (!rule.test(value)) return t(`tools.barcode.validation.${rule.key}`);
  return null;
}

function BarcodeGenerator(): JSX.Element {
  const { t } = useTranslation();
  const [barcodeValue, setBarcodeValue] = useState<string>("1234567890");
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const [size, setSize] = useState<BarcodeSize>("medium");
  const [showText, setShowText] = useState<boolean>(true);
  const [customText, setCustomText] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string>("");
  const svgRef = useRef<SVGSVGElement>(null);

  const handleFormatChange = (newFormat: BarcodeFormat) => {
    setFormat(newFormat);
    const validationError = validateBarcodeInput(barcodeValue, newFormat, t);
    if (validationError) {
      setBarcodeValue(formatDefaultValues[newFormat]);
    }
    setError("");
  };

  useEffect(() => {
    if (svgRef.current && barcodeValue) {
      const validationError = validateBarcodeInput(barcodeValue, format, t);
      if (validationError) {
        setError(validationError);
        return;
      }
      try {
        const sizeConfig = barcodeSizeData[size];
        JsBarcode(svgRef.current, barcodeValue, {
          format,
          width: sizeConfig.width,
          height: sizeConfig.height,
          displayValue: showText,
          fontSize: sizeConfig.fontSize,
          margin: 10,
          background: "#ffffff",
          lineColor: "#000000",
        });
        setError("");
      } catch (err: any) {
        setError(t("tools.barcode.invalidValue"));
      }
    }
  }, [barcodeValue, format, size, showText, t]);

  const handlePrint = () => {
    if (!svgRef.current || error) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const base64Svg = btoa(unescape(encodeURIComponent(svgData)));
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;
    
    const sizeConfig = barcodeSizeData[size];
    const labelWidthMm = sizeConfig.printWidthMm;
    const labelHeightMm = sizeConfig.printHeightMm;
    
    const barcodeItems = Array(quantity).fill(null).map(() => 
      `<div class="barcode-item">
        <img src="${dataUrl}" style="max-width:100%;max-height:${customText ? '75%' : '90%'};object-fit:contain;" />
        ${customText ? `<div class="custom-text">${customText}</div>` : ''}
      </div>`
    ).join("");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <title>${t("tools.barcode.printTitle")}</title>
          <style>
            @page {
              size: ${labelWidthMm}mm ${labelHeightMm}mm;
              margin: 0;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
            }
            .barcode-item { 
              width: ${labelWidthMm}mm;
              height: ${labelHeightMm}mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              page-break-after: always;
              padding: 1mm;
            }
            .barcode-item:last-child { page-break-after: auto; }
            .custom-text {
              font-size: ${Math.max(8, Math.floor(labelHeightMm / 8))}px;
              font-weight: bold;
              text-align: center;
              margin-top: 1mm;
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            @media screen {
              body { padding: 10px; text-align: center; }
              .barcode-item { 
                border: 1px dashed #ccc; 
                margin: 5px auto;
                display: inline-flex;
              }
              .no-print { margin-bottom: 5px; }
            }
            @media print { 
              .no-print { display: none !important; } 
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button onclick="window.print()" style="padding:10px 30px;font-size:16px;cursor:pointer;margin-bottom:10px;">
              ${t("tools.barcode.printNow")}
            </button>
            <p style="color:#666;font-size:14px;">${t("tools.barcode.labelSize")}: ${labelWidthMm}×${labelHeightMm} ${t("common.mm") || "مم"}</p>
          </div>
          ${barcodeItems}
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Barcode className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("tools.barcode.title")}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("tools.barcode.value")}</Label>
            <Input
              value={barcodeValue}
              onChange={(e) => setBarcodeValue(e.target.value)}
              placeholder={t("tools.barcode.valuePlaceholder")}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("tools.barcode.format")}</Label>
            <Select value={format} onValueChange={(v) => handleFormatChange(v as BarcodeFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {barcodeFormatValues.map((f) => (
                  <SelectItem key={f} value={f}>
                    <span className="font-medium">{t(`tools.barcode.formats.${f}`)}</span>
                    <span className="text-xs text-muted-foreground mr-2">({t(`tools.barcode.formats.${f}Hint`)})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("tools.barcode.size")}</Label>
            <Select value={size} onValueChange={(v) => setSize(v as BarcodeSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(barcodeSizeData) as BarcodeSize[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`tools.barcode.sizes.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showText"
                checked={showText}
                onChange={(e) => setShowText(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="showText" className="cursor-pointer">
                {t("tools.barcode.showText")}
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("tools.barcode.customText")}</Label>
            <Input
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={t("tools.barcode.customTextPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("tools.barcode.quantity")}</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
            />
          </div>

          <Button onClick={handlePrint} disabled={!!error || !barcodeValue} className="w-full">
            <Printer className="h-4 w-4 ml-2" />
            {t("tools.barcode.print")} ({quantity} {t("tools.barcode.copies")})
          </Button>
        </div>

        <div className="space-y-4">
          <Label>{t("tools.barcode.preview")}</Label>
          <div className="border rounded-lg p-6 bg-white flex items-center justify-center min-h-[200px]">
            {error ? (
              <div className="text-red-500 text-center">
                <p>{error}</p>
                <p className="text-xs mt-2">{t("tools.barcode.checkFormat")}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg ref={svgRef}></svg>
                {customText && (
                  <p className="mt-2 font-bold text-sm">{customText}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">{t("tools.barcode.tips")}</h4>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>{t("tools.barcode.tip1")}</li>
              <li>{t("tools.barcode.tip2")}</li>
              <li>{t("tools.barcode.tip3")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== 11) أداة الخلطات التجريبية =====================

const MATERIAL_TYPES = ["HDPE", "LDPE", "LLDPE", "Filler", "Filler CLEAR", "Process Aid", "COLOR", "Removal", "Recycle"] as const;

interface BlendItem {
  id: string;
  screw: "A" | "B";
  material_type: string;
  quantity: number;
}

interface BlendFormData {
  machine_id: string;
  screw_type: "A" | "ABA";
  notes: string;
  motor_speed_a: string;
  heater1_a: string;
  heater2_a: string;
  heater3_a: string;
  motor_speed_b: string;
  heater1_b: string;
  heater2_b: string;
  heater3_b: string;
  heater_filter: string;
  heater_mold: string;
  heater_mold_head: string;
  film_size_cm: string;
  thickness_u: string;
}

function BlendsTool(): JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [view, setView] = useState<"form" | "archive">("form");
  const [selectedBlendId, setSelectedBlendId] = useState<number | null>(null);
  const [editingBlendId, setEditingBlendId] = useState<number | null>(null);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveMachineFilter, setArchiveMachineFilter] = useState<string>("all");

  const [form, setForm] = useState<BlendFormData>({
    machine_id: "",
    screw_type: "A",
    notes: "",
    motor_speed_a: "", heater1_a: "", heater2_a: "", heater3_a: "",
    motor_speed_b: "", heater1_b: "", heater2_b: "", heater3_b: "",
    heater_filter: "", heater_mold: "", heater_mold_head: "",
    film_size_cm: "", thickness_u: "",
  });

  const [items, setItems] = useState<BlendItem[]>([]);

  const { data: machinesData } = useQuery<any[]>({
    queryKey: ["/api/machines"],
  });
  const extruders = useMemo(() => (machinesData || []).filter((m: any) => m.type === "extruder"), [machinesData]);

  const selectedMachine = useMemo(() => extruders.find((m: any) => m.id === form.machine_id), [extruders, form.machine_id]);
  const derivedScrewType = selectedMachine?.screw_type === "ABA" ? "ABA" : "A";
  const isABA = derivedScrewType === "ABA";

  const { data: blendsData, isLoading: blendsLoading } = useQuery<any[]>({
    queryKey: ["/api/experimental-blends"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("/api/experimental-blends", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experimental-blends"] });
      toast({ title: t("tools.blends.blendSaved") });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: error.message || "خطأ في حفظ الخلطة", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/experimental-blends/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experimental-blends"] });
      toast({ title: t("tools.blends.blendDeleted") });
      setSelectedBlendId(null);
    },
    onError: (error: any) => {
      toast({ title: error.message || "خطأ في حذف الخلطة", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest(`/api/experimental-blends/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experimental-blends"] });
      toast({ title: t("tools.blends.blendUpdated") });
      setEditingBlendId(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: error.message || "خطأ في تحديث الخلطة", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setForm({
      machine_id: "", screw_type: "A", notes: "",
      motor_speed_a: "", heater1_a: "", heater2_a: "", heater3_a: "",
      motor_speed_b: "", heater1_b: "", heater2_b: "", heater3_b: "",
      heater_filter: "", heater_mold: "", heater_mold_head: "",
      film_size_cm: "", thickness_u: "",
    });
    setItems([]);
    setEditingBlendId(null);
  };

  const loadBlendForEdit = (blend: any) => {
    setForm({
      machine_id: blend.machine_id || "",
      screw_type: blend.screw_type || "A",
      notes: blend.notes || "",
      motor_speed_a: blend.motor_speed_a || "",
      heater1_a: blend.heater1_a || "",
      heater2_a: blend.heater2_a || "",
      heater3_a: blend.heater3_a || "",
      motor_speed_b: blend.motor_speed_b || "",
      heater1_b: blend.heater1_b || "",
      heater2_b: blend.heater2_b || "",
      heater3_b: blend.heater3_b || "",
      heater_filter: blend.heater_filter || "",
      heater_mold: blend.heater_mold || "",
      heater_mold_head: blend.heater_mold_head || "",
      film_size_cm: blend.film_size_cm || "",
      thickness_u: blend.thickness_u || "",
    });
    const blendItems = (blend.items || []).map((i: any) => ({
      id: String(i.id || Date.now() + Math.random()),
      screw: i.screw as "A" | "B",
      material_type: i.material_type,
      quantity: parseFloat(i.quantity || "0"),
    }));
    setItems(blendItems);
    setEditingBlendId(blend.id);
    setView("form");
  };

  const addItem = (screw: "A" | "B") => {
    setItems(prev => [...prev, { id: Date.now().toString(), screw, material_type: "", quantity: 0 }]);
  };

  const updateItem = (id: string, field: keyof BlendItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const screwAItems = items.filter(i => i.screw === "A");
  const screwBItems = items.filter(i => i.screw === "B");
  const totalA = screwAItems.reduce((sum, i) => sum + toNumber(i.quantity), 0);
  const totalB = screwBItems.reduce((sum, i) => sum + toNumber(i.quantity), 0);
  const totalAll = totalA + totalB;

  const getPercentage = (qty: number, total: number) => total > 0 ? ((qty / total) * 100).toFixed(1) : "0.0";

  const handleSave = () => {
    if (!form.machine_id) return;
    const validItems = items.filter(i => i.material_type && i.quantity > 0);
    if (validItems.length === 0) return;

    const itemsPayload = validItems.map(i => {
      const screwTotal = i.screw === "A" ? totalA : totalB;
      return {
        screw: i.screw,
        material_type: i.material_type,
        quantity: i.quantity.toString(),
        percentage: screwTotal > 0 ? ((i.quantity / screwTotal) * 100).toFixed(2) : "0",
      };
    });

    const commonPayload = {
      machine_id: form.machine_id,
      screw_type: derivedScrewType,
      notes: form.notes || null,
      motor_speed_a: form.motor_speed_a || null,
      heater1_a: form.heater1_a || null,
      heater2_a: form.heater2_a || null,
      heater3_a: form.heater3_a || null,
      motor_speed_b: form.motor_speed_b || null,
      heater1_b: form.heater1_b || null,
      heater2_b: form.heater2_b || null,
      heater3_b: form.heater3_b || null,
      heater_filter: form.heater_filter || null,
      heater_mold: form.heater_mold || null,
      heater_mold_head: form.heater_mold_head || null,
      film_size_cm: form.film_size_cm || null,
      thickness_u: form.thickness_u || null,
      items: itemsPayload,
    };

    if (editingBlendId) {
      updateMutation.mutate({ id: editingBlendId, data: commonPayload });
    } else {
      const blendNumber = `EXP-${Date.now().toString(36).toUpperCase()}`;
      createMutation.mutate({ ...commonPayload, blend_number: blendNumber });
    }
  };

  const printForm = (filled: boolean, blend?: any) => {
    const isAr = document.documentElement.dir === "rtl";
    const dir = isAr ? "rtl" : "ltr";

    const machName = filled && blend ? (extruders.find((m: any) => m.id === blend.machine_id)?.name_ar || blend.machine_id) : "";
    const blendItems = filled && blend ? (blend.items || []) : [];
    const aItems = blendItems.filter((i: any) => i.screw === "A");
    const bItems = blendItems.filter((i: any) => i.screw === "B");

    const materialRows = (rowItems: any[], screwLabel: string) => {
      if (rowItems.length === 0) return "";
      const tA = rowItems.reduce((s: number, i: any) => s + parseFloat(i.quantity || "0"), 0);
      return rowItems.map((i: any) => `
        <tr>
          <td>${screwLabel}</td>
          <td>${i.material_type}</td>
          <td>${filled ? parseFloat(i.quantity || "0").toFixed(2) : ""}</td>
          <td>${filled && tA > 0 ? ((parseFloat(i.quantity || "0") / tA) * 100).toFixed(1) + "%" : ""}</td>
        </tr>
      `).join("") + `
        <tr style="background:#e2e8f0;font-weight:bold">
          <td colspan="2">${t("tools.blends.totalQuantity")} ${screwLabel}</td>
          <td>${filled ? tA.toFixed(2) : ""}</td>
          <td>100%</td>
        </tr>`;
    };

    const evalRowFilled = (label: string, val: any) =>
      `<tr><td style="width:40%;font-weight:600">${label}</td><td>${filled ? (val || "") : ""}</td></tr>`;

    const title = filled ? t("tools.blends.evaluationForm") : t("tools.blends.emptyEvaluationForm");

    const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${isAr ? "ar" : "en"}">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,sans-serif;padding:15mm;background:#fff;color:#333;direction:${dir}}
h1{text-align:center;font-size:20px;color:#1a365d;margin-bottom:4px}
.subtitle{text-align:center;font-size:12px;color:#666;margin-bottom:16px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
.info-item{display:flex;gap:8px;font-size:13px}
.info-label{font-weight:600;color:#1a365d;min-width:100px}
table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px}
th{background:#1a365d;color:#fff;padding:6px;border:1px solid #ccc}
td{padding:6px;border:1px solid #ddd;text-align:center}
tbody tr:nth-child(even){background:#f5f7fa}
.section-title{font-size:14px;font-weight:700;color:#1a365d;margin:12px 0 6px;border-bottom:2px solid #1a365d;padding-bottom:4px}
.eval-table td{text-align:${isAr ? "right" : "left"};height:32px}
.footer{margin-top:20px;text-align:center;font-size:10px;color:#aaa}
@media print{@page{size:A4;margin:10mm}}
</style>
</head>
<body>
<h1>${title}</h1>
<p class="subtitle">${new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", { year:"numeric", month:"long", day:"numeric" })}${filled && blend ? " — " + blend.blend_number : ""}</p>

<div class="info-grid">
  <div class="info-item"><span class="info-label">${t("tools.blends.machine")}:</span><span>${filled ? machName : "________________"}</span></div>
  <div class="info-item"><span class="info-label">${t("tools.blends.screwType")}:</span><span>${filled ? blend?.screw_type : "________________"}</span></div>
</div>

<div class="section-title">${t("tools.blends.materialComposition")}</div>
<table>
<thead><tr><th>${t("tools.blends.screwType")}</th><th>${t("tools.blends.material")}</th><th>${t("tools.blends.quantity")}</th><th>${t("tools.blends.percentage")}</th></tr></thead>
<tbody>
${filled ? materialRows(aItems, "A") : `<tr><td>A</td><td></td><td></td><td></td></tr><tr><td>A</td><td></td><td></td><td></td></tr><tr><td>A</td><td></td><td></td><td></td></tr><tr><td>A</td><td></td><td></td><td></td></tr><tr style="background:#e2e8f0;font-weight:bold"><td colspan="2">${t("tools.blends.totalQuantity")} A</td><td></td><td></td></tr>`}
${filled ? materialRows(bItems, "B") : `<tr><td>B</td><td></td><td></td><td></td></tr><tr><td>B</td><td></td><td></td><td></td></tr><tr style="background:#e2e8f0;font-weight:bold"><td colspan="2">${t("tools.blends.totalQuantity")} B</td><td></td><td></td></tr>`}
<tr style="background:#cbd5e1;font-weight:bold"><td colspan="2">${t("tools.blends.overallSummary")}</td><td>${filled ? (aItems.reduce((s: number, i: any) => s + parseFloat(i.quantity || "0"), 0) + bItems.reduce((s: number, i: any) => s + parseFloat(i.quantity || "0"), 0)).toFixed(2) : ""}</td><td>100%</td></tr>
</tbody>
</table>

<div class="section-title">${t("tools.blends.evaluationCriteria")} - ${t("tools.blends.screwA")}</div>
<table class="eval-table">
${evalRowFilled(t("tools.blends.motorSpeed") + " (RPM)", filled && blend?.motor_speed_a)}
${evalRowFilled(t("tools.blends.heater1"), filled && blend?.heater1_a)}
${evalRowFilled(t("tools.blends.heater2"), filled && blend?.heater2_a)}
${evalRowFilled(t("tools.blends.heater3"), filled && blend?.heater3_a)}
</table>

<div class="section-title">${t("tools.blends.evaluationCriteria")} - ${t("tools.blends.screwB")}</div>
<table class="eval-table">
${evalRowFilled(t("tools.blends.motorSpeed") + " (RPM)", filled && blend?.motor_speed_b)}
${evalRowFilled(t("tools.blends.heater1"), filled && blend?.heater1_b)}
${evalRowFilled(t("tools.blends.heater2"), filled && blend?.heater2_b)}
${evalRowFilled(t("tools.blends.heater3"), filled && blend?.heater3_b)}
</table>

<div class="section-title">${t("tools.blends.overallSettings")}</div>
<table class="eval-table">
${evalRowFilled(t("tools.blends.heaterFilter"), filled && blend?.heater_filter)}
${evalRowFilled(t("tools.blends.heaterMold"), filled && blend?.heater_mold)}
${evalRowFilled(t("tools.blends.heaterMoldHead"), filled && blend?.heater_mold_head)}
${evalRowFilled(t("tools.blends.filmSize"), filled && blend?.film_size_cm)}
${evalRowFilled(t("tools.blends.thickness"), filled && blend?.thickness_u)}
</table>

<div class="section-title">${t("tools.blends.notes")}</div>
<div style="border:1px solid #ddd;min-height:60px;padding:8px;font-size:12px">${filled && blend?.notes ? blend.notes : ""}</div>

<div class="footer">${t("tools.blends.evaluationForm")} — ${new Date().toLocaleDateString()}</div>
</body></html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  };

  const renderMaterialSection = (screw: "A" | "B", screwItems: BlendItem[], screwTotal: number) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{screw === "A" ? t("tools.blends.screwA") : t("tools.blends.screwB")}</h4>
        <Button size="sm" variant="outline" onClick={() => addItem(screw)}>
          <Plus className="h-3 w-3 ml-1" />
          {t("tools.blends.addMaterial")}
        </Button>
      </div>
      {screwItems.map(item => (
        <div key={item.id} className="flex items-center gap-2">
          <Select value={item.material_type} onValueChange={(v) => updateItem(item.id, "material_type", v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("tools.blends.material")} />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_TYPES.map(mt => (
                <SelectItem key={mt} value={mt}>{mt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder={t("tools.blends.quantity")}
            value={item.quantity || ""}
            onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
            className="w-[100px]"
          />
          <Badge variant="secondary" className="min-w-[60px] justify-center">
            {getPercentage(item.quantity, screwTotal)}%
          </Badge>
          <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)} className="h-8 w-8 text-red-500">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {screwItems.length > 0 && (
        <div className="flex items-center gap-2 pt-1 border-t">
          <span className="text-sm font-semibold">{t("tools.blends.totalQuantity")}:</span>
          <Badge variant="default">{screwTotal.toFixed(2)}</Badge>
        </div>
      )}
    </div>
  );

  if (selectedBlendId) {
    const blend = (blendsData || []).find((b: any) => b.id === selectedBlendId);
    if (!blend) return <div>{t("common.loading")}</div>;
    const blendItems = blend.items || [];
    const aItems = blendItems.filter((i: any) => i.screw === "A");
    const bItems = blendItems.filter((i: any) => i.screw === "B");
    const tA = aItems.reduce((s: number, i: any) => s + parseFloat(i.quantity || "0"), 0);
    const tB = bItems.reduce((s: number, i: any) => s + parseFloat(i.quantity || "0"), 0);
    const machName = extruders.find((m: any) => m.id === blend.machine_id)?.name_ar || extruders.find((m: any) => m.id === blend.machine_id)?.name || blend.machine_id;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedBlendId(null)}>
            <ChevronRight className="h-4 w-4 ml-1" />
            {t("common.back")}
          </Button>
          <h3 className="font-bold text-lg">{blend.blend_number}</h3>
          <div className="mr-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => printForm(false)}>
              <FileText className="h-4 w-4 ml-1" />
              {t("tools.blends.printEmpty")}
            </Button>
            <Button size="sm" variant="default" onClick={() => printForm(true, blend)}>
              <Printer className="h-4 w-4 ml-1" />
              {t("tools.blends.printFilled")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <p className="text-xs text-muted-foreground">{t("tools.blends.machine")}</p>
            <p className="font-semibold">{machName}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <p className="text-xs text-muted-foreground">{t("tools.blends.date")}</p>
            <p className="font-semibold">{new Date(blend.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">{t("tools.blends.materialComposition")}</h4>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="p-2 border">{t("tools.blends.screwType")}</th>
                <th className="p-2 border">{t("tools.blends.material")}</th>
                <th className="p-2 border">{t("tools.blends.quantity")}</th>
                <th className="p-2 border">{t("tools.blends.percentage")}</th>
                <th className="p-2 border">{t("tools.blends.overallPercentage")}</th>
              </tr>
            </thead>
            <tbody>
              {aItems.map((i: any, idx: number) => {
                const qty = parseFloat(i.quantity);
                return (
                  <tr key={idx} className="even:bg-slate-50 dark:even:bg-slate-800">
                    <td className="p-2 border text-center">A</td>
                    <td className="p-2 border text-center">{i.material_type}</td>
                    <td className="p-2 border text-center">{qty.toFixed(2)}</td>
                    <td className="p-2 border text-center">{tA > 0 ? ((qty / tA) * 100).toFixed(1) : 0}%</td>
                    <td className="p-2 border text-center">{(tA + tB) > 0 ? ((qty / (tA + tB)) * 100).toFixed(1) : 0}%</td>
                  </tr>
                );
              })}
              {aItems.length > 0 && (
                <tr className="bg-slate-200 dark:bg-slate-700 font-bold">
                  <td className="p-2 border text-center" colSpan={2}>{t("tools.blends.screwASummary")}</td>
                  <td className="p-2 border text-center">{tA.toFixed(2)}</td>
                  <td className="p-2 border text-center">100%</td>
                  <td className="p-2 border text-center">{(tA + tB) > 0 ? ((tA / (tA + tB)) * 100).toFixed(1) : 0}%</td>
                </tr>
              )}
              {bItems.map((i: any, idx: number) => {
                const qty = parseFloat(i.quantity);
                return (
                  <tr key={idx} className="even:bg-slate-50 dark:even:bg-slate-800">
                    <td className="p-2 border text-center">B</td>
                    <td className="p-2 border text-center">{i.material_type}</td>
                    <td className="p-2 border text-center">{qty.toFixed(2)}</td>
                    <td className="p-2 border text-center">{tB > 0 ? ((qty / tB) * 100).toFixed(1) : 0}%</td>
                    <td className="p-2 border text-center">{(tA + tB) > 0 ? ((qty / (tA + tB)) * 100).toFixed(1) : 0}%</td>
                  </tr>
                );
              })}
              {bItems.length > 0 && (
                <tr className="bg-slate-200 dark:bg-slate-700 font-bold">
                  <td className="p-2 border text-center" colSpan={2}>{t("tools.blends.screwBSummary")}</td>
                  <td className="p-2 border text-center">{tB.toFixed(2)}</td>
                  <td className="p-2 border text-center">100%</td>
                  <td className="p-2 border text-center">{(tA + tB) > 0 ? ((tB / (tA + tB)) * 100).toFixed(1) : 0}%</td>
                </tr>
              )}
              <tr className="bg-primary/10 font-bold">
                <td className="p-2 border text-center" colSpan={2}>{t("tools.blends.overallSummary")}</td>
                <td className="p-2 border text-center">{(tA + tB).toFixed(2)}</td>
                <td className="p-2 border text-center">—</td>
                <td className="p-2 border text-center">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">{t("tools.blends.screwSettings")} - {t("tools.blends.screwA")}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span className="text-muted-foreground">{t("tools.blends.motorSpeed")} (RPM):</span> <span className="font-medium">{blend.motor_speed_a || "-"}</span></div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span className="text-muted-foreground">{t("tools.blends.heater1")}:</span> <span className="font-medium">{blend.heater1_a || "-"}</span></div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span className="text-muted-foreground">{t("tools.blends.heater2")}:</span> <span className="font-medium">{blend.heater2_a || "-"}</span></div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span className="text-muted-foreground">{t("tools.blends.heater3")}:</span> <span className="font-medium">{blend.heater3_a || "-"}</span></div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{t("tools.blends.screwSettings")} - {t("tools.blends.screwB")}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span className="text-muted-foreground">{t("tools.blends.motorSpeed")} (RPM):</span> <span className="font-medium">{blend.motor_speed_b || "-"}</span></div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span className="text-muted-foreground">{t("tools.blends.heater1")}:</span> <span className="font-medium">{blend.heater1_b || "-"}</span></div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span className="text-muted-foreground">{t("tools.blends.heater2")}:</span> <span className="font-medium">{blend.heater2_b || "-"}</span></div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span className="text-muted-foreground">{t("tools.blends.heater3")}:</span> <span className="font-medium">{blend.heater3_b || "-"}</span></div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">{t("tools.blends.overallSettings")}</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span className="text-muted-foreground">{t("tools.blends.heaterFilter")}:</span> <span className="font-medium">{blend.heater_filter || "-"}</span></div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span className="text-muted-foreground">{t("tools.blends.heaterMold")}:</span> <span className="font-medium">{blend.heater_mold || "-"}</span></div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span className="text-muted-foreground">{t("tools.blends.heaterMoldHead")}:</span> <span className="font-medium">{blend.heater_mold_head || "-"}</span></div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span className="text-muted-foreground">{t("tools.blends.filmSize")}:</span> <span className="font-medium">{blend.film_size_cm || "-"}</span></div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span className="text-muted-foreground">{t("tools.blends.thickness")}:</span> <span className="font-medium">{blend.thickness_u || "-"}</span></div>
          </div>
        </div>

        {blend.notes && (
          <div>
            <h4 className="font-semibold mb-1">{t("tools.blends.notes")}</h4>
            <p className="text-sm p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">{blend.notes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant={view === "form" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("form")}
        >
          <FlaskConical className="h-4 w-4 ml-1" />
          {t("tools.blends.newBlend")}
        </Button>
        <Button
          variant={view === "archive" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("archive")}
        >
          <Archive className="h-4 w-4 ml-1" />
          {t("tools.blends.archive")}
          {blendsData && blendsData.length > 0 && (
            <Badge variant="secondary" className="mr-1">{blendsData.length}</Badge>
          )}
        </Button>
      </div>

      {view === "form" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("tools.blends.selectMachine")}</Label>
              <Select value={form.machine_id} onValueChange={(v) => setForm(prev => ({ ...prev, machine_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("tools.blends.selectMachine")} />
                </SelectTrigger>
                <SelectContent>
                  {extruders.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.name_ar || m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              {renderMaterialSection("A", screwAItems, totalA)}
            </div>
            <div className="border rounded-lg p-3">
              {renderMaterialSection("B", screwBItems, totalB)}
            </div>
          </div>

          {totalAll > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-bold text-sm mb-3">{t("tools.blends.combinedMaterials")}</h4>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="p-2 border">{t("tools.blends.material")}</th>
                    <th className="p-2 border">{t("tools.blends.screwA")}</th>
                    <th className="p-2 border">{t("tools.blends.screwB")}</th>
                    <th className="p-2 border">{t("tools.blends.totalQuantity")}</th>
                    <th className="p-2 border">{t("tools.blends.overallPercentage")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const allMaterials = new Map<string, { a: number; b: number }>();
                    screwAItems.forEach(i => {
                      const cur = allMaterials.get(i.material_type) || { a: 0, b: 0 };
                      cur.a += toNumber(i.quantity);
                      allMaterials.set(i.material_type, cur);
                    });
                    screwBItems.forEach(i => {
                      const cur = allMaterials.get(i.material_type) || { a: 0, b: 0 };
                      cur.b += toNumber(i.quantity);
                      allMaterials.set(i.material_type, cur);
                    });
                    return Array.from(allMaterials.entries()).map(([mat, vals]) => {
                      const matTotal = vals.a + vals.b;
                      return (
                        <tr key={mat} className="even:bg-slate-50 dark:even:bg-slate-800">
                          <td className="p-2 border text-center font-medium">{mat}</td>
                          <td className="p-2 border text-center">{vals.a > 0 ? vals.a.toFixed(2) : "—"}</td>
                          <td className="p-2 border text-center">{vals.b > 0 ? vals.b.toFixed(2) : "—"}</td>
                          <td className="p-2 border text-center font-semibold">{matTotal.toFixed(2)}</td>
                          <td className="p-2 border text-center">{getPercentage(matTotal, totalAll)}%</td>
                        </tr>
                      );
                    });
                  })()}
                  <tr className="bg-primary/10 font-bold">
                    <td className="p-2 border text-center">{t("tools.blends.overallSummary")}</td>
                    <td className="p-2 border text-center">{totalA.toFixed(2)}</td>
                    <td className="p-2 border text-center">{totalB > 0 ? totalB.toFixed(2) : "—"}</td>
                    <td className="p-2 border text-center text-primary">{totalAll.toFixed(2)}</td>
                    <td className="p-2 border text-center">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 border rounded-lg p-3">
              <h4 className="font-semibold text-sm">{t("tools.blends.evaluationCriteria")} - {t("tools.blends.screwA")}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t("tools.blends.motorSpeed")} (RPM 0-50)</Label>
                  <Input type="number" min="0" max="50" step="0.1" value={form.motor_speed_a} onChange={(e) => setForm(p => ({ ...p, motor_speed_a: e.target.value }))} placeholder="0-50 RPM" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("tools.blends.heater1")}</Label>
                  <Input value={form.heater1_a} onChange={(e) => setForm(p => ({ ...p, heater1_a: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("tools.blends.heater2")}</Label>
                  <Input value={form.heater2_a} onChange={(e) => setForm(p => ({ ...p, heater2_a: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("tools.blends.heater3")}</Label>
                  <Input value={form.heater3_a} onChange={(e) => setForm(p => ({ ...p, heater3_a: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="space-y-3 border rounded-lg p-3">
              <h4 className="font-semibold text-sm">{t("tools.blends.evaluationCriteria")} - {t("tools.blends.screwB")}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t("tools.blends.motorSpeed")} (RPM 0-50)</Label>
                  <Input type="number" min="0" max="50" step="0.1" value={form.motor_speed_b} onChange={(e) => setForm(p => ({ ...p, motor_speed_b: e.target.value }))} placeholder="0-50 RPM" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("tools.blends.heater1")}</Label>
                  <Input value={form.heater1_b} onChange={(e) => setForm(p => ({ ...p, heater1_b: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("tools.blends.heater2")}</Label>
                  <Input value={form.heater2_b} onChange={(e) => setForm(p => ({ ...p, heater2_b: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("tools.blends.heater3")}</Label>
                  <Input value={form.heater3_b} onChange={(e) => setForm(p => ({ ...p, heater3_b: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">{t("tools.blends.overallSettings")}</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("tools.blends.heaterFilter")}</Label>
                <Input value={form.heater_filter} onChange={(e) => setForm(p => ({ ...p, heater_filter: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("tools.blends.heaterMold")}</Label>
                <Input value={form.heater_mold} onChange={(e) => setForm(p => ({ ...p, heater_mold: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("tools.blends.heaterMoldHead")}</Label>
                <Input value={form.heater_mold_head} onChange={(e) => setForm(p => ({ ...p, heater_mold_head: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("tools.blends.filmSize")}</Label>
                <Input value={form.film_size_cm} onChange={(e) => setForm(p => ({ ...p, film_size_cm: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("tools.blends.thickness")}</Label>
                <Input value={form.thickness_u} onChange={(e) => setForm(p => ({ ...p, thickness_u: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("tools.blends.notes")}</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder={t("tools.blends.notes")}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={!form.machine_id || items.filter(i => i.material_type && i.quantity > 0).length === 0 || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? t("common.saving") : editingBlendId ? t("tools.blends.editBlend") : t("tools.blends.saveBlend")}
            </Button>
            <Button variant="outline" onClick={() => printForm(false)}>
              <FileText className="h-4 w-4 ml-1" />
              {t("tools.blends.printEmpty")}
            </Button>
            {items.filter(i => i.material_type && i.quantity > 0).length > 0 && (
              <Button variant="outline" onClick={() => {
                const currentBlend = {
                  machine_id: form.machine_id,
                  screw_type: form.screw_type,
                  notes: form.notes,
                  motor_speed_a: form.motor_speed_a,
                  heater1_a: form.heater1_a, heater2_a: form.heater2_a, heater3_a: form.heater3_a,
                  motor_speed_b: form.motor_speed_b,
                  heater1_b: form.heater1_b, heater2_b: form.heater2_b, heater3_b: form.heater3_b,
                  heater_filter: form.heater_filter, heater_mold: form.heater_mold, heater_mold_head: form.heater_mold_head,
                  film_size_cm: form.film_size_cm, thickness_u: form.thickness_u,
                  items: items.filter(i => i.material_type && i.quantity > 0).map(i => ({
                    screw: i.screw, material_type: i.material_type, quantity: i.quantity.toString(),
                  })),
                };
                printForm(true, currentBlend);
              }}>
                <Printer className="h-4 w-4 ml-1" />
                {t("tools.blends.printFilled")}
              </Button>
            )}
          </div>
        </div>
      )}

      {view === "archive" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("tools.blends.searchBlends")}
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={archiveMachineFilter} onValueChange={setArchiveMachineFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t("tools.blends.filterByMachine")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("tools.blends.allMachines")}</SelectItem>
                {extruders.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.name_ar || m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {blendsLoading && <p className="text-center text-muted-foreground">{t("common.loading")}</p>}
          {!blendsLoading && (!blendsData || blendsData.length === 0) && (
            <p className="text-center text-muted-foreground py-8">{t("tools.blends.noBlends")}</p>
          )}
          {(blendsData || [])
            .filter((blend: any) => {
              if (archiveMachineFilter !== "all" && blend.machine_id !== archiveMachineFilter) return false;
              if (!archiveSearch.trim()) return true;
              const q = archiveSearch.toLowerCase();
              const machName = extruders.find((m: any) => m.id === blend.machine_id)?.name_ar || extruders.find((m: any) => m.id === blend.machine_id)?.name || "";
              return (
                (blend.blend_number || "").toLowerCase().includes(q) ||
                machName.toLowerCase().includes(q) ||
                (blend.notes || "").toLowerCase().includes(q)
              );
            })
            .map((blend: any) => {
            const blendItems = blend.items || [];
            const tTotal = blendItems.reduce((s: number, i: any) => s + parseFloat(i.quantity || "0"), 0);
            const machName = extruders.find((m: any) => m.id === blend.machine_id)?.name_ar || extruders.find((m: any) => m.id === blend.machine_id)?.name || blend.machine_id;

            return (
              <div key={blend.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <FlaskConical className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{blend.blend_number}</span>
                    <Badge variant="outline" className="text-xs">{machName}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(blend.created_at).toLocaleDateString()} — {blendItems.length} {t("tools.blends.material")} — {tTotal.toFixed(1)} {t("common.kg")}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedBlendId(blend.id)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => loadBlendForEdit(blend)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => {
                    if (confirm(t("tools.blends.confirmDelete"))) {
                      deleteMutation.mutate(blend.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===================== Utility Functions =====================

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function round(v: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

function fmtFixed(v: number, d: number): string {
  return toNumber(v).toFixed(d);
}

interface CMYK { c: number; m: number; y: number; k: number; }

function cmykToRgb(c: number, m: number, y: number, k: number): { r: number; g: number; b: number } {
  const C = toNumber(c) / 100, M = toNumber(m) / 100, Y = toNumber(y) / 100, K = toNumber(k) / 100;
  const r = Math.round(255 * (1 - C) * (1 - K));
  const g = Math.round(255 * (1 - M) * (1 - K));
  const b = Math.round(255 * (1 - Y) * (1 - K));
  return { r, g, b };
}

function rgbToCmyk(r: number, g: number, b: number): CMYK {
  const R = toNumber(r) / 255, G = toNumber(g) / 255, B = toNumber(b) / 255;
  const K = 1 - Math.max(R, G, B);
  if (K === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const C = (1 - R - K) / (1 - K);
  const M = (1 - G - K) / (1 - K);
  const Y = (1 - B - K) / (1 - K);
  return { c: Math.round(C * 100), m: Math.round(M * 100), y: Math.round(Y * 100), k: Math.round(K * 100) };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function normalizeHex(v: string): string {
  let h = v.trim().toUpperCase();
  if (!h.startsWith("#")) h = "#" + h;
  if (h.length === 4) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  return h.slice(0, 7);
}
