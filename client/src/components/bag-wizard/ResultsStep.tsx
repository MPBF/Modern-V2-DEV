import { useRef, useCallback } from "react";
import { type BagConfiguration, type ValidationResult, getBagTypeRules, getHangerHeight } from "../../lib/bag-rules-engine";
import { MATERIALS, BAG_COLORS, HANDLES } from "../../lib/bag-rules";
import { BagPreview } from "./BagPreview";
import { Button } from "../ui/button";
import { Download, FileJson, Image, RotateCcw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ResultsStepProps {
  config: BagConfiguration;
  validation: ValidationResult;
  onRestart: () => void;
}

export function ResultsStep({ config, validation, onRestart }: ResultsStepProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const rules = getBagTypeRules(config.bagType);
  const material = MATERIALS[config.material];
  const bagColor = BAG_COLORS[config.bagColor];
  const handle = HANDLES[config.handle];

  const specs = [
    { label: "نوع الكيس", value: rules?.label_ar || "-" },
    { label: "المادة", value: material ? `${material.label_ar} (${material.label_en})` : "-" },
    { label: "العرض", value: `${config.width} سم` },
    { label: "الطول", value: `${config.length} سم` },
    { label: "السماكة", value: `${config.thickness} ميكرون` },
    { label: "الدخلة الجانبية", value: config.sideGusset > 0 ? `${config.sideGusset} سم` : "لا يوجد" },
    { label: "المقبض", value: config.handle === "hanger" ? `${handle?.label_ar} (ارتفاع ${getHangerHeight(config)} سم)` : (handle?.label_ar || "بدون") },
    { label: "لون الكيس", value: bagColor?.label_ar || "-" },
    { label: "الطباعة", value: config.isPrinted ? "مطبوع" : "سادة" },
    ...(config.isPrinted ? [
      { label: "جهة الطباعة", value: config.printSide === "both" ? "وجهين" : "وجه واحد" },
      { label: "عدد ألوان الطباعة", value: `${config.printColors.length}` },
    ] : []),
  ];

  const exportJSON = useCallback(() => {
    const data = {
      configuration: {
        bagType: config.bagType,
        bagTypeLabel: rules?.label_ar,
        material: config.material,
        materialLabel: material?.label_ar,
        width: config.width,
        length: config.length,
        thickness: config.thickness,
        sideGusset: config.sideGusset,
        handle: config.handle,
        handleLabel: handle?.label_ar,
        handleHeight: config.handle === "hanger" ? getHangerHeight(config) : undefined,
        bagColor: config.bagColor,
        bagColorLabel: bagColor?.label_ar,
        isPrinted: config.isPrinted,
        printSide: config.printSide,
        printColorsCount: config.printColorsCount,
        printColors: config.printColors,
        printColorShades: config.printColorShades,
        hasDesignImage: !!config.printDesign?.logoUrl,
        designTexts: config.printDesign?.texts?.map(t => ({ text: t.value, color: t.color, size: t.size })) || [],
      },
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bag-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config, validation, rules, material, handle, bagColor]);

  const exportImage = useCallback(async () => {
    const svgEl = previewRef.current?.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `bag-preview-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const exportPDF = useCallback(async () => {
    const specsHtml = specs.map(s => `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;color:#374151">${s.label}</td><td style="padding:8px;border-bottom:1px solid #eee;color:#6b7280">${s.value}</td></tr>`).join("");

    const validationHtml = validation.isValid
      ? '<div style="background:#dcfce7;color:#166534;padding:12px;border-radius:8px;margin:16px 0">✅ صالح للتصنيع</div>'
      : '<div style="background:#fee2e2;color:#991b1b;padding:12px;border-radius:8px;margin:16px 0">❌ غير صالح للتصنيع</div>';

    const errorsHtml = validation.errors.map(e => `<li style="color:#dc2626;margin:4px 0">${e.message}</li>`).join("");
    const warningsHtml = validation.warnings.map(w => `<li style="color:#d97706;margin:4px 0">${w.message}</li>`).join("");

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="UTF-8"><title>مواصفات الكيس</title></head>
      <body style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px">
        <h1 style="text-align:center;color:#1e40af;margin-bottom:8px">بطاقة مواصفات المنتج</h1>
        <p style="text-align:center;color:#9ca3af;margin-bottom:32px">معالج تصميم الأكياس البلاستيكية</p>
        ${validationHtml}
        <table style="width:100%;border-collapse:collapse;margin:24px 0">${specsHtml}</table>
        ${errorsHtml ? `<h3 style="color:#dc2626">الأخطاء</h3><ul>${errorsHtml}</ul>` : ""}
        ${warningsHtml ? `<h3 style="color:#d97706">التحذيرات</h3><ul>${warningsHtml}</ul>` : ""}
        <p style="text-align:center;color:#9ca3af;margin-top:32px;font-size:12px">تاريخ التصدير: ${new Date().toLocaleDateString("ar-SA")}</p>
      </body></html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  }, [specs, validation]);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">النتيجة النهائية</h2>
      <p className="text-gray-500 text-sm mb-6">ملخص المواصفات وحالة التصنيع</p>

      <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
        validation.isValid
          ? "bg-green-50 border border-green-200"
          : "bg-red-50 border border-red-200"
      }`}>
        {validation.isValid ? (
          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
        ) : (
          <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
        )}
        <div>
          <div className={`font-bold ${validation.isValid ? "text-green-700" : "text-red-700"}`}>
            {validation.isValid ? "صالح للتصنيع ✓" : "غير صالح للتصنيع ✗"}
          </div>
          {!validation.isValid && (
            <div className="text-sm text-red-600 mt-1">
              {validation.errors.length} خطأ يجب معالجته
            </div>
          )}
        </div>
      </div>

      {validation.errors.length > 0 && (
        <div className="mb-4 space-y-2">
          {validation.errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
              <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {validation.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 bg-gray-50 rounded-xl mb-6">
        {specs.map((spec, i) => (
          <div key={i} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-0">
            <span className="text-sm font-medium text-gray-600">{spec.label}</span>
            <span className="text-sm text-gray-900">{spec.value}</span>
          </div>
        ))}
      </div>

      <div ref={previewRef} className="flex justify-center mb-6">
        <BagPreview config={config} size="lg" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Button onClick={exportPDF} variant="outline" className="gap-2 h-12">
          <Download className="h-4 w-4" />
          <span className="text-xs">تنزيل PDF</span>
        </Button>
        <Button onClick={exportImage} variant="outline" className="gap-2 h-12">
          <Image className="h-4 w-4" />
          <span className="text-xs">تنزيل صورة</span>
        </Button>
        <Button onClick={exportJSON} variant="outline" className="gap-2 h-12">
          <FileJson className="h-4 w-4" />
          <span className="text-xs">تصدير JSON</span>
        </Button>
        <Button onClick={onRestart} variant="outline" className="gap-2 h-12 text-blue-600 border-blue-200">
          <RotateCcw className="h-4 w-4" />
          <span className="text-xs">تصميم جديد</span>
        </Button>
      </div>
    </div>
  );
}
