import { useState, useCallback } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ChevronRight, ChevronLeft, RotateCcw, Home, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { BagTypeStep } from "../components/bag-wizard/BagTypeStep";
import { PrintStatusStep } from "../components/bag-wizard/PrintStatusStep";
import { MaterialStep } from "../components/bag-wizard/MaterialStep";
import { DimensionsStep } from "../components/bag-wizard/DimensionsStep";
import { HandleStep } from "../components/bag-wizard/HandleStep";
import { ColorStep } from "../components/bag-wizard/ColorStep";
import { PrintingStep } from "../components/bag-wizard/PrintingStep";
import { PrintDesignStep } from "../components/bag-wizard/PrintDesignStep";
import { ResultsStep } from "../components/bag-wizard/ResultsStep";
import { BagPreview } from "../components/bag-wizard/BagPreview";
import {
  type BagConfiguration,
  DEFAULT_CONFIG,
  validateConfiguration,
  getDefaultsForBagType,
  getBagTypeRules,
} from "../lib/bag-rules-engine";

const STEPS = [
  { id: "bagType", label: "نوع الكيس", icon: "🏷️" },
  { id: "printStatus", label: "الطباعة", icon: "🖨️" },
  { id: "material", label: "المادة", icon: "🧪" },
  { id: "dimensions", label: "الأبعاد", icon: "📐" },
  { id: "handle", label: "المقبض", icon: "✋" },
  { id: "color", label: "اللون", icon: "🎨" },
  { id: "printing", label: "إعداد الطباعة", icon: "🖼️" },
  { id: "printDesign", label: "تصميم الطباعة", icon: "✏️" },
  { id: "results", label: "النتيجة", icon: "📋" },
];

export default function BagConfigurator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<BagConfiguration>({ ...DEFAULT_CONFIG });

  const updateConfig = useCallback((updates: Partial<BagConfiguration>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleBagTypeChange = useCallback((bagType: string) => {
    const defaults = getDefaultsForBagType(bagType, false);
    setConfig({
      ...DEFAULT_CONFIG,
      bagType,
      ...defaults,
      isPrinted: false,
    });
  }, []);

  const handlePrintStatusChange = useCallback((isPrinted: boolean) => {
    const defaults = getDefaultsForBagType(config.bagType, isPrinted);
    updateConfig({
      isPrinted,
      length: defaults.length || config.length,
      printColorsCount: isPrinted ? defaults.printColorsCount || 1 : 0,
    });
  }, [config.bagType, config.length, updateConfig]);

  const getVisibleSteps = () => {
    if (!config.isPrinted) {
      return STEPS.filter((s) => s.id !== "printing" && s.id !== "printDesign");
    }
    return STEPS;
  };

  const visibleSteps = getVisibleSteps();
  const visibleIndex = Math.min(currentStep, visibleSteps.length - 1);

  const canGoNext = () => {
    const step = visibleSteps[visibleIndex];
    if (!step) return false;

    const rules = config.bagType ? getBagTypeRules(config.bagType) : null;

    switch (step.id) {
      case "bagType": return !!config.bagType;
      case "printStatus": return true;
      case "material": {
        if (!config.material || !rules) return false;
        return rules.material_allowed.includes(config.material);
      }
      case "dimensions": {
        if (!rules || config.width <= 0 || config.length <= 0 || config.thickness <= 0) return false;
        const lengthLimits = config.isPrinted ? rules.length_printed : rules.length_plain;
        const widthOk = config.width >= rules.width.min && config.width <= rules.width.max;
        const lengthOk = config.length >= lengthLimits.min && config.length <= lengthLimits.max;
        const thicknessOk = config.thickness >= rules.thickness.min && config.thickness <= rules.thickness.max;
        return widthOk && lengthOk && thicknessOk;
      }
      case "handle": return !!config.handle;
      case "color": return !!config.bagColor;
      case "printing": return config.printColorsCount > 0 && config.printColors.length === config.printColorsCount;
      case "printDesign": return true;
      case "results": return false;
      default: return true;
    }
  };

  const goNext = () => {
    if (visibleIndex < visibleSteps.length - 1) {
      setCurrentStep(visibleIndex + 1);
    }
  };

  const goBack = () => {
    if (visibleIndex > 0) {
      setCurrentStep(visibleIndex - 1);
    }
  };

  const goToStep = (index: number) => {
    if (index <= visibleIndex) {
      setCurrentStep(index);
    }
  };

  const resetWizard = () => {
    setConfig({ ...DEFAULT_CONFIG });
    setCurrentStep(0);
  };

  const validation = config.bagType ? validateConfiguration(config) : null;
  const currentStepId = visibleSteps[visibleIndex]?.id;
  const progress = ((visibleIndex) / (visibleSteps.length - 1)) * 100;

  const renderStep = () => {
    switch (currentStepId) {
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
      case "printDesign":
        return <PrintDesignStep config={config} onChange={updateConfig} />;
      case "results":
        return <ResultsStep config={config} validation={validation!} onRestart={resetWizard} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20" dir="rtl">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white text-lg">🏭</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">معالج تصميم الأكياس</h1>
              <p className="text-xs text-gray-400 hidden sm:block">صمّم كيسك البلاستيكي خطوة بخطوة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetWizard} className="text-gray-500 gap-1.5 hover:text-red-500 hover:bg-red-50 transition-colors">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">إعادة البدء</span>
            </Button>
            <Link href="/" className="inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">الرئيسية</span>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3">
          <div className="relative">
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
              <div
                className="absolute top-0 right-0 h-full bg-gradient-to-l from-blue-600 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">الخطوة {visibleIndex + 1} من {visibleSteps.length}</span>
              <span className="text-xs font-medium text-blue-600">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
          {visibleSteps.map((step, i) => {
            const isActive = i === visibleIndex;
            const isCompleted = i < visibleIndex;
            const isDisabled = i > visibleIndex;

            return (
              <button
                key={step.id}
                onClick={() => goToStep(i)}
                disabled={isDisabled}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    : "bg-white text-gray-300 border border-gray-100 cursor-not-allowed"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <span className="text-base leading-none">{step.icon}</span>
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden text-xs">{i + 1}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="lg:col-span-7 xl:col-span-8">
            <Card className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
              <CardContent className="p-5 sm:p-6">
                <div className="min-h-[380px]">
                  {renderStep()}
                </div>

                {currentStepId !== "results" && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      onClick={goBack}
                      disabled={visibleIndex === 0}
                      className="gap-2 text-gray-500 hover:text-gray-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>

                    <Button
                      onClick={goNext}
                      disabled={!canGoNext()}
                      className="gap-2 bg-gradient-to-l from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md shadow-blue-200 px-6 rounded-xl disabled:opacity-50 disabled:shadow-none"
                    >
                      {visibleIndex === visibleSteps.length - 2 ? "عرض النتيجة" : "التالي"}
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-[130px] space-y-4">
              <Card className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-l from-gray-50 to-white px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600 text-center">المعاينة المباشرة</h3>
                </div>
                <CardContent className="p-4">
                  <BagPreview config={config} />
                </CardContent>
              </Card>

              {validation && (validation.warnings.length > 0 || validation.errors.length > 0) && currentStepId !== "results" && (
                <Card className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                  <CardContent className="p-4 space-y-2">
                    {validation.errors.map((e, i) => (
                      <div key={`e-${i}`} className="flex items-start gap-2.5 bg-red-50 text-red-700 text-sm p-2.5 rounded-lg border border-red-100">
                        <span className="text-red-500 mt-0.5 shrink-0">⛔</span>
                        <span>{e.message}</span>
                      </div>
                    ))}
                    {validation.warnings.map((w, i) => (
                      <div key={`w-${i}`} className="flex items-start gap-2.5 bg-amber-50 text-amber-700 text-sm p-2.5 rounded-lg border border-amber-100">
                        <span className="text-amber-500 mt-0.5 shrink-0">⚠️</span>
                        <span>{w.message}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
