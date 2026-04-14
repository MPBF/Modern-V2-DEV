import { getBagTypeRules } from "../../lib/bag-rules-engine";

interface PrintStatusStepProps {
  value: boolean;
  onChange: (isPrinted: boolean) => void;
  bagType: string;
}

export function PrintStatusStep({ value, onChange, bagType }: PrintStatusStepProps) {
  const rules = getBagTypeRules(bagType);
  const canPrint = rules?.printable !== false;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">حالة الطباعة</h2>
      <p className="text-gray-500 text-sm mb-6">هل تريد طباعة تصميم على الكيس؟</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onChange(false)}
          className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
            !value
              ? "border-blue-500 bg-blue-50 shadow-md"
              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
          }`}
        >
          <div className="text-5xl">📄</div>
          <div className="font-semibold text-gray-900 text-lg">سادة</div>
          <div className="text-sm text-gray-500 text-center">كيس بدون طباعة - لون واحد فقط</div>
        </button>

        <button
          onClick={() => canPrint && onChange(true)}
          disabled={!canPrint}
          className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
            value
              ? "border-blue-500 bg-blue-50 shadow-md"
              : canPrint
              ? "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
          }`}
        >
          <div className="text-5xl">🎨</div>
          <div className="font-semibold text-gray-900 text-lg">مطبوع</div>
          <div className="text-sm text-gray-500 text-center">
            {canPrint ? "كيس مع طباعة شعار أو تصميم" : "الطباعة غير متاحة لهذا النوع"}
          </div>
        </button>
      </div>

      {value && canPrint && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          💡 سيتم إضافة خطوات إعداد الطباعة وتصميم الطباعة في المراحل القادمة
        </div>
      )}
    </div>
  );
}
