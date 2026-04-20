import { useState, useCallback, useMemo } from "react";
import {
  ChevronRight, ChevronLeft, RotateCcw, CheckCircle2, Loader2,
  Tag, Printer, Beaker, Ruler, Hand, Palette, Image as ImageIcon, ClipboardList, Factory,
  AlertTriangle, ShieldAlert, User, Phone, Send, PartyPopper, Sparkles,
  ChevronDown, ChevronUp, Package,
} from "lucide-react";
import { MATERIALS, BAG_COLORS, HANDLES } from "../lib/bag-rules";
import { BagTypeStep } from "../components/bag-wizard/BagTypeStep";
import { PrintStatusStep } from "../components/bag-wizard/PrintStatusStep";
import { MaterialStep } from "../components/bag-wizard/MaterialStep";
import { DimensionsStep } from "../components/bag-wizard/DimensionsStep";
import { HandleStep } from "../components/bag-wizard/HandleStep";
import { ColorStep } from "../components/bag-wizard/ColorStep";
import { PrintingStep } from "../components/bag-wizard/PrintingStep";
import { BagPreview } from "../components/bag-wizard/BagPreview";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  type BagConfiguration,
  DEFAULT_CONFIG,
  validateConfiguration,
  getDefaultsForBagType,
  getBagTypeRules,
  getBagsPerKg,
  getBagWeightGrams,
  getHangerHeight,
} from "../lib/bag-rules-engine";

type StepId =
  | "contact" | "bagType" | "printStatus" | "material" | "dimensions"
  | "handle" | "color" | "printing" | "review" | "done";

interface Step {
  id: StepId;
  label: string;
  Icon: any;
}

const ALL_STEPS: Step[] = [
  { id: "contact", label: "بياناتك", Icon: User },
  { id: "bagType", label: "نوع الكيس", Icon: Tag },
  { id: "printStatus", label: "الطباعة", Icon: Printer },
  { id: "material", label: "المادة", Icon: Beaker },
  { id: "dimensions", label: "الأبعاد", Icon: Ruler },
  { id: "handle", label: "المقبض", Icon: Hand },
  { id: "color", label: "اللون", Icon: Palette },
  { id: "printing", label: "إعداد الطباعة", Icon: ImageIcon },
  { id: "review", label: "المراجعة", Icon: ClipboardList },
];

function normalizePhone(raw: string): string {
  const trimmed = raw.replace(/\s|-/g, "");
  if (/^05\d{8}$/.test(trimmed)) return "+966" + trimmed.slice(1);
  if (/^5\d{8}$/.test(trimmed)) return "+966" + trimmed;
  if (/^\+?\d{8,15}$/.test(trimmed)) return trimmed.startsWith("+") ? trimmed : "+" + trimmed;
  return trimmed;
}

function isValidPhone(raw: string): boolean {
  const t = raw.replace(/\s|-/g, "");
  return /^(05\d{8}|5\d{8}|\+?\d{8,15})$/.test(t);
}

export default function MpbfBagQuote() {
  const [config, setConfig] = useState<BagConfiguration>({ ...DEFAULT_CONFIG });
  const [stepIndex, setStepIndex] = useState(0);
  const [contact, setContact] = useState({ name: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; reference?: string; error?: string } | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(true);

  const updateConfig = useCallback((updates: Partial<BagConfiguration>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleBagTypeChange = useCallback((bagType: string) => {
    const defaults = getDefaultsForBagType(bagType, false);
    setConfig({ ...DEFAULT_CONFIG, bagType, ...defaults, isPrinted: false });
  }, []);

  const handlePrintStatusChange = useCallback((isPrinted: boolean) => {
    const defaults = getDefaultsForBagType(config.bagType, isPrinted);
    updateConfig({
      isPrinted,
      length: defaults.length || config.length,
      printColorsCount: isPrinted ? defaults.printColorsCount || 1 : 0,
    });
  }, [config.bagType, config.length, updateConfig]);

  const visibleSteps = useMemo<Step[]>(
    () => ALL_STEPS.filter((s) => config.isPrinted || s.id !== "printing"),
    [config.isPrinted]
  );

  const isSuccess = !!submitResult?.success;
  const current: Step | undefined = isSuccess
    ? { id: "done", label: "تم", Icon: PartyPopper }
    : visibleSteps[Math.min(stepIndex, visibleSteps.length - 1)];
  const safeIndex = isSuccess ? visibleSteps.length : Math.min(stepIndex, visibleSteps.length - 1);
  const progress = isSuccess ? 100 : (safeIndex / Math.max(1, visibleSteps.length - 1)) * 100;

  const validation = config.bagType ? validateConfiguration(config) : null;

  const summary = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];
    const rules = config.bagType ? getBagTypeRules(config.bagType) : null;
    if (rules) items.push({ label: "النوع", value: rules.label_ar });
    if (config.material && MATERIALS[config.material]) items.push({ label: "المادة", value: MATERIALS[config.material].label_ar });
    if (config.width > 0 && config.length > 0) items.push({ label: "الأبعاد", value: `${config.width}×${config.length} سم` });
    if (config.thickness > 0) items.push({ label: "السماكة", value: `${config.thickness} ميكرون` });
    if (config.handle && HANDLES[config.handle]) {
      const handleLabel = config.handle === "hanger"
        ? `${HANDLES[config.handle].label_ar} (ارتفاع ${getHangerHeight(config)} سم)`
        : HANDLES[config.handle].label_ar;
      items.push({ label: "المقبض", value: handleLabel });
    }
    if (config.bagColor && BAG_COLORS[config.bagColor]) items.push({ label: "لون الكيس", value: BAG_COLORS[config.bagColor].label_ar });
    items.push({ label: "الطباعة", value: config.isPrinted ? `مطبوع (${config.printColors.length} ألوان)` : "سادة" });
    const w = getBagWeightGrams(config);
    if (w) items.push({ label: "الوزن التقديري", value: `${w.toFixed(2)} غم` });
    const bpk = getBagsPerKg(config);
    if (bpk) items.push({ label: "عدد الأكياس / كجم", value: `≈ ${bpk.toLocaleString("ar-EG")}` });
    return items;
  }, [config]);

  const canProceed = (): boolean => {
    if (!current) return false;
    const rules = config.bagType ? getBagTypeRules(config.bagType) : null;
    switch (current.id) {
      case "contact":
        return contact.name.trim().length >= 2 && isValidPhone(contact.phone);
      case "bagType": return !!config.bagType;
      case "printStatus": return true;
      case "material": return !!config.material && !!rules?.material_allowed.includes(config.material);
      case "dimensions": {
        if (!rules || config.width <= 0 || config.length <= 0 || config.thickness <= 0) return false;
        const lengthLimits = config.isPrinted ? rules.length_printed : rules.length_plain;
        const widthLimits = config.isPrinted && rules.width_printed ? rules.width_printed : rules.width;
        return (
          config.width >= widthLimits.min && config.width <= widthLimits.max &&
          config.length >= lengthLimits.min && config.length <= lengthLimits.max &&
          config.thickness >= rules.thickness.min && config.thickness <= rules.thickness.max
        );
      }
      case "handle": return !!config.handle;
      case "color": return !!config.bagColor;
      case "printing": return config.printColors.length > 0 && config.printColors.length <= (rules?.print_colors.max || 4);
      case "review": return true;
      default: return false;
    }
  };

  const goNext = () => {
    if (safeIndex < visibleSteps.length - 1) setStepIndex(safeIndex + 1);
  };
  const goBack = () => {
    if (safeIndex > 0) setStepIndex(safeIndex - 1);
  };

  const resetAll = () => {
    setConfig({ ...DEFAULT_CONFIG });
    setContact({ name: "", phone: "" });
    setStepIndex(0);
    setSubmitResult(null);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const phone = normalizePhone(contact.phone);
      const cfgPayload = {
        bagType: config.bagType,
        bagTypeLabel: getBagTypeRules(config.bagType)?.label_ar,
        isPrinted: config.isPrinted,
        material: config.material,
        materialLabel: MATERIALS[config.material]?.label_ar,
        width: config.width,
        length: config.length,
        sideGusset: config.sideGusset,
        thickness: config.thickness,
        handle: config.handle,
        handleLabel: HANDLES[config.handle]?.label_ar,
        handleHeight: config.handle === "hanger" ? getHangerHeight(config) : undefined,
        bagColor: config.bagColor,
        bagColorLabel: BAG_COLORS[config.bagColor]?.label_ar,
        printSide: config.printSide,
        printColors: config.printColors,
        printColorShades: config.printColorShades,
        designTexts: config.printDesign?.texts?.map((t) => ({
          text: t.value, color: t.color, size: t.size, x: t.x, y: t.y,
        })) || [],
      };
      const res = await fetch("/api/public/bag-design-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: contact.name.trim(), phone },
          configuration: cfgPayload,
          summary,
          validation: validation ? {
            isValid: validation.isValid,
            errors: validation.errors.map((e) => ({ message: e.message })),
            warnings: validation.warnings.map((w) => ({ message: w.message })),
          } : undefined,
        }),
      });
      const json = await res.json();
      if (json?.success) {
        setSubmitResult({ success: true, reference: json.reference });
      } else {
        setSubmitResult({ success: false, error: json?.error || "تعذر إرسال الطلب" });
      }
    } catch (err: any) {
      setSubmitResult({ success: false, error: err?.message || "خطأ في الشبكة" });
    } finally {
      setSubmitting(false);
    }
  };

  const isReview = current?.id === "review";
  const isDone = current?.id === "done";
  const isContact = current?.id === "contact";
  const showPreview = !isDone && !isReview;

  const renderStep = () => {
    if (!current) return null;
    switch (current.id) {
      case "contact":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">أهلاً بك</h2>
              <p className="text-slate-300 text-base leading-relaxed">صمّم الكيس المثالي لعملك<br/>وسنتواصل معك بعرض السعر</p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base font-bold text-white">الاسم الكامل</Label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400" />
                <Input
                  id="name"
                  placeholder="مثال: أحمد محمد"
                  className="h-14 text-lg pr-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 rounded-2xl"
                  value={contact.name}
                  onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                  data-testid="input-name"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="phone" className="text-base font-bold text-white">رقم الجوال</Label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400" />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  placeholder="05xxxxxxxx"
                  className="h-14 text-lg pr-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 rounded-2xl text-right"
                  value={contact.phone}
                  onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  data-testid="input-phone"
                />
              </div>
              <p className="text-xs text-slate-400 text-center">سيتم استخدام الرقم للتواصل بشأن طلبك فقط</p>
            </div>
          </div>
        );
      case "bagType":
        return <BagTypeStep value={config.bagType} onChange={handleBagTypeChange} />;
      case "printStatus":
        return <PrintStatusStep value={config.isPrinted} onChange={handlePrintStatusChange} bagType={config.bagType} />;
      case "material":
        return <MaterialStep value={config.material} onChange={(m) => updateConfig({ material: m })} bagType={config.bagType} />;
      case "dimensions":
        return <DimensionsStep config={config} onChange={updateConfig} />;
      case "handle":
        return <HandleStep config={config} onChange={(h) => updateConfig({ handle: h })} />;
      case "color":
        return <ColorStep config={config} onChange={(c) => updateConfig({ bagColor: c })} />;
      case "printing":
        return <PrintingStep config={config} onChange={updateConfig} />;
      case "review":
        return (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">مراجعة الطلب</h2>
              <p className="text-slate-300 text-sm">تحقق من بياناتك ومواصفات التصميم قبل الإرسال</p>
            </div>

            <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 mb-5 shadow-2xl shadow-black/40">
              <BagPreview config={config} size="lg" showDimensions />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 mb-4">
              <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" /> بيانات التواصل
              </h3>
              <div className="grid grid-cols-2 gap-3 text-base">
                <div className="text-slate-400">الاسم</div>
                <div className="text-white font-semibold text-left">{contact.name}</div>
                <div className="text-slate-400">الجوال</div>
                <div className="text-white font-semibold text-left" dir="ltr">{normalizePhone(contact.phone)}</div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 mb-4">
              <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" /> مواصفات الكيس
              </h3>
              <div className="space-y-1 text-base">
                {summary.map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-slate-400">{s.label}</span>
                    <span className="text-white font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {validation && validation.errors.length > 0 && (
              <div className="space-y-2 mb-4">
                {validation.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 bg-red-500/10 text-red-300 text-sm p-4 rounded-2xl border border-red-500/30">
                    <ShieldAlert className="h-5 w-5 mt-0.5 shrink-0" />
                    <span>{e.message}</span>
                  </div>
                ))}
              </div>
            )}
            {validation && validation.warnings.length > 0 && (
              <div className="space-y-2 mb-4">
                {validation.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 bg-amber-500/10 text-amber-300 text-sm p-4 rounded-2xl border border-amber-500/30">
                    <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            )}

            {submitResult && !submitResult.success && (
              <div className="bg-red-500/10 text-red-300 text-sm p-4 rounded-2xl border border-red-500/30 mb-4">
                {submitResult.error}
              </div>
            )}
          </div>
        );
      case "done":
        return (
          <div className="text-center py-10">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-500/40 animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">تم استلام طلبك بنجاح</h2>
            <p className="text-slate-300 text-base mb-6 leading-relaxed">شكراً لاختيارك MPBF<br/>سنتواصل معك على الرقم المُسجّل قريباً</p>
            {submitResult?.reference && (
              <div className="inline-block bg-amber-500/10 text-amber-300 px-5 py-2.5 rounded-full text-sm font-bold border border-amber-500/30 mb-8">
                رقم المرجع: {submitResult.reference}
              </div>
            )}
            <div>
              <Button onClick={resetAll} variant="outline" className="gap-2 h-13 px-8 rounded-2xl bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white" data-testid="button-new-design">
                <RotateCcw className="h-4 w-4" />
                طلب تصميم جديد
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl" style={{
      background: "radial-gradient(ellipse at top, #1e293b 0%, #0f172a 50%, #020617 100%)"
    }}>
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sticky premium header */}
      <header className="relative z-30 backdrop-blur-xl bg-slate-950/60 border-b border-white/5 sticky top-0">
        <div className="px-4 py-3.5 flex items-center justify-between gap-2 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-amber-400 blur-md opacity-50 rounded-xl" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                <Factory className="text-white h-5 w-5" strokeWidth={2.5} />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-extrabold text-white truncate tracking-tight">صمّم كيسك</h1>
              <p className="text-[11px] text-amber-400/80 truncate font-medium">MPBF · مصنع الأكياس البلاستيكية الحديث</p>
            </div>
          </div>
          {!isDone && (
            <button
              onClick={resetAll}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all shrink-0 font-medium"
              data-testid="button-reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>إعادة</span>
            </button>
          )}
        </div>

        {/* Progress section */}
        {!isDone && (
          <div className="px-4 pb-3.5 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {current?.Icon && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/30">
                    <current.Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-white leading-tight">{current?.label}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">الخطوة {safeIndex + 1} من {visibleSteps.length}</div>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400 tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-amber-400 via-amber-500 to-amber-600 rounded-full transition-all duration-700 shadow-lg shadow-amber-500/50"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Persistent Bag Preview */}
      {showPreview && (
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-4">
          <div className="rounded-3xl bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-950/90 border border-amber-500/20 shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-xl">
            <button
              onClick={() => setPreviewExpanded(!previewExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center">
                  <Package className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white leading-tight">معاينة التصميم</div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {config.bagType ? "تتحدّث مع كل تغيير" : "ستظهر بعد اختيار النوع"}
                  </div>
                </div>
              </div>
              {previewExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            {previewExpanded && (
              <div className="px-3 pb-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 p-2 overflow-hidden">
                  {config.bagType ? (
                    <div className="flex items-center justify-center" style={{ maxHeight: 280 }}>
                      <div className="scale-[0.55] sm:scale-75 origin-center" style={{ height: 280 }}>
                        <BagPreview config={config} size="md" showDimensions={!isContact} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-44 text-slate-600">
                      <Package className="h-12 w-12 mb-2 text-slate-400" />
                      <p className="text-sm font-bold">سيظهر تصميم كيسك هنا</p>
                      <p className="text-[11px] mt-1 text-slate-500">اختر نوع الكيس لرؤية المعاينة المباشرة</p>
                    </div>
                  )}
                </div>
                {summary.length > 0 && config.bagType && (
                  <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                    {summary.slice(0, 4).map((item, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/20 font-medium"
                      >
                        <span className="text-slate-400">{item.label}:</span>
                        <span className="font-bold">{item.value}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step content */}
      <main className="relative z-10 px-4 pt-4 pb-32 max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/40 p-5 sm:p-7 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bag-wizard-dark">
            {renderStep()}
          </div>
        </div>
      </main>

      {/* Sticky bottom action bar */}
      {!isDone && (
        <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl bg-slate-950/80 border-t border-white/10 shadow-[0_-8px_30px_-4px_rgba(0,0,0,0.5)]">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2.5" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <Button
              variant="outline"
              onClick={goBack}
              disabled={safeIndex === 0 || submitting}
              className="h-13 px-4 rounded-2xl gap-1 text-slate-300 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-30"
              data-testid="button-back"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="text-base">السابق</span>
            </Button>
            {isReview ? (
              <Button
                onClick={submit}
                disabled={submitting || !validation?.isValid}
                className="flex-1 h-13 rounded-2xl gap-2 bg-gradient-to-l from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50 text-base font-bold"
                data-testid="button-submit"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!canProceed()}
                className="flex-1 h-13 rounded-2xl gap-2 bg-gradient-to-l from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-900 shadow-lg shadow-amber-500/30 disabled:opacity-40 disabled:shadow-none text-base font-bold"
                data-testid="button-next"
              >
                {safeIndex === visibleSteps.length - 2 ? "مراجعة الطلب" : "التالي"}
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Wizard step text overrides for dark theme */}
      <style>{`
        .bag-wizard-dark h2, .bag-wizard-dark h3 { color: #ffffff !important; }
        .bag-wizard-dark p { color: #cbd5e1 !important; }
        .bag-wizard-dark label { color: #f1f5f9 !important; }
        .bag-wizard-dark .text-gray-900, .bag-wizard-dark .text-gray-800, .bag-wizard-dark .text-gray-700 { color: #f1f5f9 !important; }
        .bag-wizard-dark .text-gray-600, .bag-wizard-dark .text-gray-500 { color: #cbd5e1 !important; }
        .bag-wizard-dark .text-gray-400 { color: #94a3b8 !important; }
        .bag-wizard-dark .bg-white { background-color: rgba(255,255,255,0.05) !important; backdrop-filter: blur(8px); }
        .bag-wizard-dark .bg-gray-50, .bag-wizard-dark .bg-gray-100 { background-color: rgba(255,255,255,0.04) !important; }
        .bag-wizard-dark .bg-blue-50 { background-color: rgba(251,191,36,0.10) !important; }
        .bag-wizard-dark .text-blue-700, .bag-wizard-dark .text-blue-600 { color: #fbbf24 !important; }
        .bag-wizard-dark .border-blue-200, .bag-wizard-dark .border-blue-100 { border-color: rgba(251,191,36,0.30) !important; }
        .bag-wizard-dark .border-gray-200, .bag-wizard-dark .border-gray-100 { border-color: rgba(255,255,255,0.10) !important; }
        .bag-wizard-dark .ring-blue-500, .bag-wizard-dark .ring-blue-600 { --tw-ring-color: #fbbf24 !important; }
        .bag-wizard-dark .border-blue-500, .bag-wizard-dark .border-blue-600 { border-color: #fbbf24 !important; }
        .bag-wizard-dark .bg-blue-500, .bag-wizard-dark .bg-blue-600 { background-color: #f59e0b !important; }
        .bag-wizard-dark input, .bag-wizard-dark select { background-color: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.10) !important; color: #ffffff !important; }
      `}</style>
    </div>
  );
}
