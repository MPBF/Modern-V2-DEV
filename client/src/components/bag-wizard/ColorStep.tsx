import { getAllowedColors, type BagConfiguration } from "../../lib/bag-rules-engine";

interface ColorStepProps {
  config: BagConfiguration;
  onChange: (color: string) => void;
}

export function ColorStep({ config, onChange }: ColorStepProps) {
  const allowed = getAllowedColors(config.bagType);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">لون الكيس</h2>
      <p className="text-gray-500 text-sm mb-6">اختر لون المادة الأساسي للكيس</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {allowed.map((color) => (
          <button
            key={color.id}
            onClick={() => onChange(color.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              config.bagColor === color.id
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
            }`}
          >
            <div
              className="w-12 h-12 rounded-full border-2 shadow-inner"
              style={{
                backgroundColor: color.hex,
                borderColor: color.id === "white" || color.id === "transparent" ? "#d1d5db" : color.hex,
                opacity: color.opacity,
                backgroundImage: color.is_transparent
                  ? "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 12px 12px"
                  : undefined,
              }}
            />
            <span className="font-medium text-gray-700 text-sm">{color.label_ar}</span>
            {config.bagColor === color.id && <span className="text-blue-500 text-xs">✓ محدد</span>}
          </button>
        ))}
      </div>

      {config.isPrinted && config.bagColor && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          💡 سيتم تقييم تباين ألوان الطباعة مع لون الكيس في خطوة الطباعة
        </div>
      )}
    </div>
  );
}
