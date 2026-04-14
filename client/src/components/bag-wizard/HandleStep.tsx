import { getAllowedHandles, type BagConfiguration, getBagTypeRules } from "../../lib/bag-rules-engine";

interface HandleStepProps {
  config: BagConfiguration;
  onChange: (handle: string) => void;
}

export function HandleStep({ config, onChange }: HandleStepProps) {
  const allowed = getAllowedHandles(config.bagType);
  const rules = getBagTypeRules(config.bagType);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">المقبض</h2>
      <p className="text-gray-500 text-sm mb-6">اختر نوع المقبض المناسب</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allowed.map((handle) => {
          const handleRule = rules?.handle_rules[handle.id];
          const isDisabled = handleRule && (
            (handleRule.min_width && config.width > 0 && config.width < handleRule.min_width) ||
            (handleRule.min_thickness && config.thickness > 0 && config.thickness < handleRule.min_thickness)
          );

          return (
            <button
              key={handle.id}
              onClick={() => !isDisabled && onChange(handle.id)}
              disabled={!!isDisabled}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-right transition-all ${
                config.handle === handle.id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : isDisabled
                  ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl">{handle.icon}</span>
              <div>
                <div className="font-semibold text-gray-900">{handle.label_ar}</div>
                <div className="text-xs text-gray-400">{handle.label_en}</div>
                {isDisabled && handleRule && (
                  <div className="text-xs text-red-500 mt-1">
                    {handleRule.min_width && config.width < handleRule.min_width && `يتطلب عرض ${handleRule.min_width}+ سم`}
                    {handleRule.min_thickness && config.thickness < handleRule.min_thickness && ` | يتطلب سماكة ${handleRule.min_thickness}+ ميكرون`}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {allowed.length === 1 && (
        <p className="text-sm text-gray-400 mt-3">هذا النوع من الأكياس يدعم نوع مقبض واحد فقط</p>
      )}
    </div>
  );
}
