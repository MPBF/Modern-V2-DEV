import { type BagConfiguration, getBagTypeRules, checkPrintContrast } from "../../lib/bag-rules-engine";
import { PRINT_COLORS_PALETTE, BAG_COLORS } from "../../lib/bag-rules";
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";

interface PrintingStepProps {
  config: BagConfiguration;
  onChange: (updates: Partial<BagConfiguration>) => void;
}

export function PrintingStep({ config, onChange }: PrintingStepProps) {
  const rules = getBagTypeRules(config.bagType);
  if (!rules) return null;

  const maxColors = rules.print_colors.max;
  const minColors = rules.print_colors.min;

  const handleColorToggle = (colorId: string) => {
    const current = [...config.printColors];
    const idx = current.indexOf(colorId);

    if (idx >= 0) {
      if (current.length > 1) {
        current.splice(idx, 1);
        onChange({ printColors: current, printColorsCount: current.length });
      }
    } else if (current.length < maxColors) {
      current.push(colorId);
      onChange({ printColors: current, printColorsCount: current.length });
    }
  };

  const bagColor = BAG_COLORS[config.bagColor];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">إعداد الطباعة</h2>
      <p className="text-gray-500 text-sm mb-6">حدد إعدادات الطباعة على الكيس</p>

      <div className="space-y-6">
        <div>
          <Label className="font-semibold text-gray-700 mb-3 block">جهة الطباعة</Label>
          <div className="flex gap-3">
            {[
              { value: "front" as const, label: "وجه واحد" },
              { value: "both" as const, label: "وجهين" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ printSide: opt.value })}
                className={`flex-1 p-3 rounded-lg border-2 text-center font-medium transition-all ${
                  config.printSide === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="font-semibold text-gray-700">عدد ألوان الطباعة</Label>
            <span className="text-sm text-gray-500">{config.printColorsCount} من {maxColors}</span>
          </div>
          <Slider
            min={minColors}
            max={maxColors}
            step={1}
            value={[config.printColorsCount]}
            onValueChange={([v]) => {
              const newColors = config.printColors.slice(0, v);
              while (newColors.length < v) {
                const available = PRINT_COLORS_PALETTE.find(c => !newColors.includes(c.id));
                if (available) newColors.push(available.id);
                else break;
              }
              onChange({ printColorsCount: v, printColors: newColors });
            }}
          />
        </div>

        <div>
          <Label className="font-semibold text-gray-700 mb-3 block">
            اختر ألوان الطباعة ({config.printColors.length}/{config.printColorsCount})
          </Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {PRINT_COLORS_PALETTE.map((color) => {
              const isSelected = config.printColors.includes(color.id);
              const contrast = bagColor ? checkPrintContrast(config.bagColor, color.hex) : { good: true, message: "" };
              const isDisabled = !isSelected && config.printColors.length >= config.printColorsCount;

              return (
                <button
                  key={color.id}
                  onClick={() => handleColorToggle(color.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border-2 text-sm transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : isDisabled
                      ? "border-gray-100 opacity-40 cursor-not-allowed"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border shadow-sm flex-shrink-0"
                    style={{ backgroundColor: color.hex, borderColor: color.hex === "#FFFFFF" ? "#d1d5db" : color.hex }}
                  />
                  <span className="text-gray-700 truncate">{color.label_ar}</span>
                  {isSelected && !contrast.good && <span className="text-amber-500 text-xs">⚠️</span>}
                </button>
              );
            })}
          </div>
        </div>

        {config.printColors.map((pc) => {
          const colorEntry = PRINT_COLORS_PALETTE.find(c => c.id === pc);
          if (!colorEntry) return null;
          const contrast = checkPrintContrast(config.bagColor, colorEntry.hex);
          if (contrast.good) return null;
          return (
            <div key={pc} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              ⚠️ {colorEntry.label_ar}: {contrast.message}
            </div>
          );
        })}
      </div>
    </div>
  );
}
