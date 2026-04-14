import { getDimensionLimits, type BagConfiguration, getSuggestedThickness } from "../../lib/bag-rules-engine";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface DimensionsStepProps {
  config: BagConfiguration;
  onChange: (updates: Partial<BagConfiguration>) => void;
}

function DimensionField({
  label,
  unit,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const isError = value > 0 && (value < min || value > max);

  return (
    <div className={`p-4 rounded-xl border ${disabled ? "opacity-40 pointer-events-none" : ""} ${isError ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <Label className="font-semibold text-gray-700">{label}</Label>
        <span className="text-xs text-gray-400">{min} - {max} {unit}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Slider
            min={min}
            max={max}
            step={1}
            value={[Math.max(min, Math.min(max, value || min))]}
            onValueChange={([v]) => onChange(v)}
          />
        </div>
        <div className="w-24">
          <Input
            type="number"
            min={min}
            max={max}
            value={value || ""}
            onChange={(e) => onChange(Number(e.target.value))}
            className={`text-center font-mono ${isError ? "border-red-400" : ""}`}
          />
        </div>
        <span className="text-xs text-gray-500 w-14">{unit}</span>
      </div>
      {isError && (
        <p className="text-xs text-red-500 mt-1">
          {value < min ? `القيمة أقل من الحد الأدنى (${min})` : `القيمة أعلى من الحد الأقصى (${max})`}
        </p>
      )}
    </div>
  );
}

export function DimensionsStep({ config, onChange }: DimensionsStepProps) {
  const limits = getDimensionLimits(config.bagType, config.isPrinted);
  if (!limits) return null;

  const suggestedThickness = getSuggestedThickness(config);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">الأبعاد والسماكة</h2>
      <p className="text-gray-500 text-sm mb-6">حدد أبعاد الكيس المطلوبة ضمن الحدود المسموحة</p>

      <div className="space-y-4">
        <DimensionField
          label="العرض"
          unit={limits.width.unit}
          value={config.width}
          min={limits.width.min}
          max={limits.width.max}
          onChange={(v) => onChange({ width: v })}
        />

        <DimensionField
          label={config.isPrinted ? "الطول (مطبوع)" : "الطول (سادة)"}
          unit={limits.length.unit}
          value={config.length}
          min={limits.length.min}
          max={limits.length.max}
          onChange={(v) => onChange({ length: v })}
        />

        <DimensionField
          label="السماكة"
          unit={limits.thickness.unit}
          value={config.thickness}
          min={limits.thickness.min}
          max={limits.thickness.max}
          onChange={(v) => onChange({ thickness: v })}
        />

        {suggestedThickness && config.thickness > 0 && config.thickness < suggestedThickness && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-sm">
            <span className="text-amber-700">💡 السماكة المقترحة لهذه الأبعاد: <strong>{suggestedThickness} ميكرون</strong></span>
            <Button size="sm" variant="outline" onClick={() => onChange({ thickness: suggestedThickness })} className="text-amber-700 border-amber-300">
              استخدام المقترح
            </Button>
          </div>
        )}

        <DimensionField
          label="الدخلة الجانبية"
          unit={limits.sideGusset.unit}
          value={config.sideGusset}
          min={limits.sideGusset.min}
          max={limits.sideGusset.max}
          onChange={(v) => onChange({ sideGusset: v })}
          disabled={!limits.sideGussetSupported}
        />

        {!limits.sideGussetSupported && (
          <p className="text-xs text-gray-400 -mt-2 mr-2">الدخلات الجانبية غير مدعومة لهذا النوع من الأكياس</p>
        )}
      </div>
    </div>
  );
}
