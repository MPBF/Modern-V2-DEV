import { BAG_TYPES } from "../../lib/bag-rules";

interface BagTypeStepProps {
  value: string;
  onChange: (bagType: string) => void;
}

export function BagTypeStep({ value, onChange }: BagTypeStepProps) {
  const types = Object.values(BAG_TYPES);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">اختر نوع الكيس</h2>
      <p className="text-gray-500 text-sm mb-6">حدد نوع الكيس المطلوب لتظهر لك الخيارات المناسبة</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => onChange(type.id)}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 text-right transition-all ${
              value === type.id
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
            }`}
          >
            <span className="text-2xl mt-0.5">{type.icon}</span>
            <div>
              <div className="font-semibold text-gray-900">{type.label_ar}</div>
              <div className="text-xs text-gray-500 mt-1">{type.description_ar}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
