import { useState, useCallback, useMemo } from "react";
import {
  ChevronRight, ChevronLeft, RotateCcw, CheckCircle2, Loader2,
  Tag, Printer, Beaker, Ruler, Hand, Palette, Image as ImageIcon, ClipboardList, Factory,
  AlertTriangle, ShieldAlert, User, Phone, Send, PartyPopper,
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

  const renderStep = () => {
    if (!current) return null;
    switch (current.id) {
      case "contact":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">أهلاً بك 👋</h2>
              <p className="text-gray-500 text-sm">سنتواصل معك بأقرب وقت بعد إرسال طلبك</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">الاسم الكامل</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  placeholder="مثال: أحمد محمد"
                  className="h-12 text-base pr-10"
                  value={contact.name}
                  onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                  data-testid="input-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">رقم الجوال</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  placeholder="05xxxxxxxx"
                  className="h-12 text-base pr-10 text-right"
                  value={contact.phone}
                  onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  data-testid="input-phone"
                />
              </div>
              <p className="text-[11px] text-gray-400">سيتم استخدام الرقم للتواصل بشأن طلبك فقط</p>
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
            <h2 className="text-xl font-bold text-gray-900 mb-1">مراجعة الطلب</h2>
            <p className="text-gray-500 text-sm mb-4">تأكد من البيانات قبل الإرسال</p>

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 mb-4">
              <BagPreview config={config} size="lg" showDimensions />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-700 mb-2">بيانات التواصل</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">الاسم</div>
                <div className="text-gray-900 font-medium text-left">{contact.name}</div>
                <div className="text-gray-500">الجوال</div>
                <div className="text-gray-900 font-medium text-left" dir="ltr">{normalizePhone(contact.phone)}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-700 mb-2">مواصفات الكيس</h3>
              <div className="space-y-1.5 text-sm">
                {summary.map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500">{s.label}</span>
                    <span className="text-gray-900 font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {validation && validation.errors.length > 0 && (
              <div className="space-y-2 mb-4">
                {validation.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-100">
                    <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{e.message}</span>
                  </div>
                ))}
              </div>
            )}
            {validation && validation.warnings.length > 0 && (
              <div className="space-y-2 mb-4">
                {validation.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 bg-amber-50 text-amber-700 text-sm p-3 rounded-xl border border-amber-100">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            )}

            {submitResult && !submitResult.success && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-100 mb-4">
                {submitResult.error}
              </div>
            )}
          </div>
        );
      case "done":
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 mb-4">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">تم استلام طلبك بنجاح 🎉</h2>
            <p className="text-gray-500 text-sm mb-4">سنتواصل معك على الرقم المُسجّل خلال أقرب وقت</p>
            {submitResult?.reference && (
              <div className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold border border-blue-100 mb-6">
                رقم المرجع: {submitResult.reference}
              </div>
            )}
            <div>
              <Button onClick={resetAll} variant="outline" className="gap-2 h-12 px-6 rounded-xl" data-testid="button-new-design">
                <RotateCcw className="h-4 w-4" />
                طلب تصميم آخر
              </Button>
            </div>
          </div>
        );
    }
  };

  const isReview = current?.id === "review";
  const isDone = current?.id === "done";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/40 to-emerald-50/30" dir="rtl">
      {/* Sticky compact header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
              <Factory className="text-white h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate">صمّم كيسك</h1>
              <p className="text-[10px] text-gray-400 truncate">MPBF — مصنع الأكياس البلاستيكية</p>
            </div>
          </div>
          {!isDone && (
            <button
              onClick={resetAll}
              className="text-[11px] text-gray-400 hover:text-red-500 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors shrink-0"
              data-testid="button-reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>إعادة</span>
            </button>
          )}
        </div>

        {/* Progress bar */}
        {!isDone && (
          <div className="px-4 pb-3">
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-gray-400">
                الخطوة {safeIndex + 1} من {visibleSteps.length}
                {current && <span className="mr-1 text-gray-500"> • {current.label}</span>}
              </span>
              <span className="text-[10px] font-semibold text-blue-600">{Math.round(progress)}%</span>
            </div>
          </div>
        )}
      </header>

      {/* Step content */}
      <main className="px-4 pt-4 pb-32 max-w-xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5 animate-in fade-in duration-300">
          {renderStep()}
        </div>

        {/* Compact summary on later steps (not on review/done/contact) */}
        {summary.length > 0 && !isReview && !isDone && current?.id !== "contact" && (
          <div className="mt-3 bg-white/70 backdrop-blur-sm border border-gray-100 rounded-2xl p-3">
            <div className="flex flex-wrap gap-1.5">
              {summary.slice(0, 6).map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100"
                >
                  <span className="text-gray-500">{item.label}:</span>
                  <span className="font-semibold">{item.value}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sticky bottom action bar */}
      {!isDone && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)]">
          <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-2" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <Button
              variant="outline"
              onClick={goBack}
              disabled={safeIndex === 0 || submitting}
              className="h-12 px-4 rounded-xl gap-1 text-gray-600"
              data-testid="button-back"
            >
              <ChevronRight className="h-4 w-4" />
              السابق
            </Button>
            {isReview ? (
              <Button
                onClick={submit}
                disabled={submitting || !validation?.isValid}
                className="flex-1 h-12 rounded-xl gap-2 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md shadow-emerald-200 disabled:opacity-50"
                data-testid="button-submit"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!canProceed()}
                className="flex-1 h-12 rounded-xl gap-2 bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
                data-testid="button-next"
              >
                {safeIndex === visibleSteps.length - 2 ? "مراجعة الطلب" : "التالي"}
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
