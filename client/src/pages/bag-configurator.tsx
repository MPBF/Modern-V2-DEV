import { useState, useCallback } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">معالج تصميم الأكياس البلاستيكية</h1>
          <p className="text-gray-500">صمّم كيسك البلاستيكي خطوة بخطوة مع محاكاة بصرية فورية</p>
        </div>

        <div className="mb-6 overflow-x-auto">
          <div className="flex items-center justify-center gap-1 min-w-max px-4">
            {visibleSteps.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(i)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    i === visibleIndex
                      ? "bg-blue-600 text-white shadow-lg scale-105"
                      : i < visibleIndex
                      ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={i > visibleIndex}
                >
                  <span>{step.icon}</span>
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
                {i < visibleSteps.length - 1 && (
                  <ChevronLeft className={`h-4 w-4 mx-1 ${i < visibleIndex ? "text-green-400" : "text-gray-300"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card className="shadow-xl border-0">
              <CardContent className="p-6">
                {renderStep()}

                {currentStepId !== "results" && (
                  <div className="flex items-center justify-between mt-8 pt-4 border-t">
                    <Button variant="outline" onClick={goBack} disabled={visibleIndex === 0} className="gap-2">
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={resetWizard} className="text-gray-400 gap-1">
                        <RotateCcw className="h-3 w-3" />
                        إعادة
                      </Button>
                      <Button onClick={goNext} disabled={!canGoNext()} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        {visibleIndex === visibleSteps.length - 2 ? "عرض النتيجة" : "التالي"}
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <Card className="shadow-xl border-0 overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-3 text-center">المعاينة المباشرة</h3>
                  <BagPreview config={config} />
                </CardContent>
              </Card>

              {validation && (validation.warnings.length > 0 || validation.errors.length > 0) && currentStepId !== "results" && (
                <Card className="shadow-lg border-0 mt-4">
                  <CardContent className="p-4">
                    {validation.errors.map((e, i) => (
                      <div key={`e-${i}`} className="flex items-start gap-2 text-red-600 text-sm mb-2">
                        <span className="text-red-500 mt-0.5">⛔</span>
                        <span>{e.message}</span>
                      </div>
                    ))}
                    {validation.warnings.map((w, i) => (
                      <div key={`w-${i}`} className="flex items-start gap-2 text-amber-600 text-sm mb-2">
                        <span className="text-amber-500 mt-0.5">⚠️</span>
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
