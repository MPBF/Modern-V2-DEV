import { getAllowedMaterials } from "../../lib/bag-rules-engine";
import { MATERIALS } from "../../lib/bag-rules";

interface MaterialStepProps {
  value: string;
  onChange: (material: string) => void;
  bagType: string;
}

export function MaterialStep({ value, onChange, bagType }: MaterialStepProps) {
  const allowed = getAllowedMaterials(bagType);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">اختر المادة</h2>
      <p className="text-gray-500 text-sm mb-6">نوع المادة الخام المستخدمة في تصنيع الكيس</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allowed.map((mat) => (
          <button
            key={mat.id}
            onClick={() => onChange(mat.id)}
            className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-right transition-all ${
              value === mat.id
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-blue-700 text-sm">{mat.label_en}</span>
              {value === mat.id && <span className="text-blue-500">✓</span>}
            </div>
            <div className="font-semibold text-gray-900">{mat.label_ar}</div>
            <div className="text-xs text-gray-500">{mat.description_ar}</div>
            <div className="flex gap-3 mt-1 text-xs text-gray-400">
              <span>السماكة: {mat.min_thickness}-{mat.max_thickness} ميكرون</span>
              <span>السطح: {mat.surface}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
