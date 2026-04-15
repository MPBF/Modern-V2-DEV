import { useState, useRef, useEffect } from "react";
import { type BagConfiguration, getBagTypeRules, checkPrintContrast } from "../../lib/bag-rules-engine";
import { PRINT_COLORS_PALETTE, BAG_COLORS } from "../../lib/bag-rules";
import { removeBackground, extractColors, type ExtractedColor } from "../../lib/image-utils";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import {
  Upload, Type, Trash2, ImageIcon, Loader2,
  Palette, X, Plus, Eraser, ScanSearch,
} from "lucide-react";

interface PrintingStepProps {
  config: BagConfiguration;
  onChange: (updates: Partial<BagConfiguration>) => void;
}

export function PrintingStep({ config, onChange }: PrintingStepProps) {
  const rules = getBagTypeRules(config.bagType);
  if (!rules) return null;

  const maxColors = rules.print_colors.max;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newText, setNewText] = useState("");
  const [selectedTextColor, setSelectedTextColor] = useState(config.printColors[0] || "black");
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
  const [bgThreshold, setBgThreshold] = useState(30);

  const design = config.printDesign || { texts: [], scale: 1, rotation: 0, offsetX: 0, offsetY: 0 };
  const prevLogoUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!config.printColors.includes(selectedTextColor)) {
      setSelectedTextColor(config.printColors[0] || "black");
    }

    const invalidTexts = design.texts.filter(t => !config.printColors.includes(t.color));
    if (invalidTexts.length > 0) {
      const fallback = config.printColors[0] || "black";
      const fixedTexts = design.texts.map(t =>
        config.printColors.includes(t.color) ? t : { ...t, color: fallback }
      );
      onChange({ printDesign: { ...design, texts: fixedTexts } });
    }
  }, [config.printColors.join(",")]);

  useEffect(() => {
    return () => {
      if (prevLogoUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(prevLogoUrlRef.current);
      }
    };
  }, []);

  const updateDesign = (updates: Partial<typeof design>) => {
    if (updates.logoUrl !== undefined && prevLogoUrlRef.current?.startsWith("blob:") && prevLogoUrlRef.current !== updates.logoUrl) {
      URL.revokeObjectURL(prevLogoUrlRef.current);
    }
    if (updates.logoUrl !== undefined) {
      prevLogoUrlRef.current = updates.logoUrl;
    }
    onChange({ printDesign: { ...design, ...updates } });
  };

  const handleColorToggle = (colorId: string) => {
    const current = [...config.printColors];
    const idx = current.indexOf(colorId);

    if (idx >= 0) {
      if (current.length > 1) {
        current.splice(idx, 1);
        const newShades = { ...config.printColorShades };
        delete newShades[colorId];
        onChange({ printColors: current, printColorsCount: current.length, printColorShades: newShades });
      }
    } else if (current.length < maxColors) {
      current.push(colorId);
      onChange({ printColors: current, printColorsCount: current.length });
    }
  };

  const handleShadeChange = (colorId: string, shade: string) => {
    onChange({
      printColorShades: { ...config.printColorShades, [colorId]: shade },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("يرجى رفع ملف بصيغة PNG أو JPG أو SVG أو WebP فقط");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("حجم الملف يجب أن لا يتجاوز 10 ميجابايت");
      return;
    }

    const url = URL.createObjectURL(file);
    updateDesign({ logoUrl: url, logoFile: file });
    if (fileInputRef.current) fileInputRef.current.value = "";

    setIsExtractingColors(true);
    try {
      const colors = await extractColors(url, 6);
      setExtractedColors(colors);
    } catch {
      setExtractedColors([]);
    }
    setIsExtractingColors(false);
  };

  const handleRemoveBackground = async () => {
    if (!design.logoUrl) return;
    setIsRemovingBg(true);
    try {
      const processed = await removeBackground(design.logoUrl, bgThreshold);
      updateDesign({ logoUrl: processed });

      const colors = await extractColors(processed, 6);
      setExtractedColors(colors);
    } catch {
      alert("حدث خطأ أثناء إزالة الخلفية");
    }
    setIsRemovingBg(false);
  };

  const handleExtractColors = async () => {
    if (!design.logoUrl) return;
    setIsExtractingColors(true);
    try {
      const colors = await extractColors(design.logoUrl, 6);
      setExtractedColors(colors);
    } catch {
      setExtractedColors([]);
    }
    setIsExtractingColors(false);
  };

  const addText = () => {
    if (!newText.trim()) return;
    const texts = [...design.texts, {
      value: newText.trim(),
      x: 50,
      y: 50,
      size: 24,
      color: selectedTextColor,
    }];
    updateDesign({ texts });
    setNewText("");
  };

  const removeText = (index: number) => {
    const texts = design.texts.filter((_, i) => i !== index);
    updateDesign({ texts });
  };

  const updateTextColor = (index: number, colorId: string) => {
    const texts = [...design.texts];
    texts[index] = { ...texts[index], color: colorId };
    updateDesign({ texts });
  };

  const updateTextSize = (index: number, size: number) => {
    const texts = [...design.texts];
    texts[index] = { ...texts[index], size };
    updateDesign({ texts });
  };

  const bagColor = BAG_COLORS[config.bagColor];

  const availableTextColors = config.printColors
    .map(id => PRINT_COLORS_PALETTE.find(c => c.id === id))
    .filter(Boolean);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">إعداد الطباعة</h2>
      <p className="text-gray-500 text-sm mb-6">حدد ألوان الطباعة وأضف النصوص والتصميم</p>

      <div className="space-y-8">
        {/* Section 1: Print Side */}
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

        {/* Section 2: Color Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="font-semibold text-gray-700">
              <Palette className="h-4 w-4 inline ml-1.5" />
              ألوان الطباعة
            </Label>
            <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
              config.printColors.length >= maxColors
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {config.printColors.length} / {maxColors}
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-3">اضغط لاختيار الألوان (بحد أقصى {maxColors} ألوان)</p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {PRINT_COLORS_PALETTE.map((color) => {
              const isSelected = config.printColors.includes(color.id);
              const contrast = bagColor ? checkPrintContrast(config.bagColor, color.hex) : { good: true, message: "" };
              const isDisabled = !isSelected && config.printColors.length >= maxColors;

              return (
                <button
                  key={color.id}
                  onClick={() => handleColorToggle(color.id)}
                  disabled={isDisabled}
                  className={`relative flex items-center gap-2 p-2.5 rounded-lg border-2 text-sm transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : isDisabled
                      ? "border-gray-100 opacity-40 cursor-not-allowed"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border shadow-sm flex-shrink-0"
                    style={{
                      backgroundColor: config.printColorShades?.[color.id] || color.hex,
                      borderColor: color.hex === "#FFFFFF" ? "#d1d5db" : color.hex,
                    }}
                  />
                  <span className="text-gray-700 truncate">{color.label_ar}</span>
                  {isSelected && (
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-blue-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-sm">
                      {config.printColors.indexOf(color.id) + 1}
                    </span>
                  )}
                  {isSelected && !contrast.good && <span className="text-amber-500 text-xs">⚠️</span>}
                </button>
              );
            })}
          </div>

          {config.printColors.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label className="text-sm text-gray-500">ضبط درجة اللون</Label>
              {config.printColors.map((pc) => {
                const colorEntry = PRINT_COLORS_PALETTE.find(c => c.id === pc);
                if (!colorEntry) return null;
                const currentShade = config.printColorShades?.[pc] || colorEntry.hex;

                return (
                  <div key={pc} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <div
                      className="w-7 h-7 rounded-full border-2 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: currentShade, borderColor: currentShade === "#FFFFFF" ? "#d1d5db" : currentShade }}
                    />
                    <span className="text-sm font-medium text-gray-700 min-w-[50px]">{colorEntry.label_ar}</span>
                    <Input
                      type="color"
                      value={currentShade}
                      onChange={(e) => handleShadeChange(pc, e.target.value)}
                      className="w-10 h-7 p-0 border-0 cursor-pointer"
                    />
                    <span className="text-xs text-gray-400 font-mono">{currentShade}</span>
                    {currentShade !== colorEntry.hex && (
                      <button
                        onClick={() => handleShadeChange(pc, colorEntry.hex)}
                        className="text-xs text-blue-500 hover:text-blue-700 mr-auto"
                      >
                        إعادة تعيين
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {config.printColors.map((pc) => {
            const colorEntry = PRINT_COLORS_PALETTE.find(c => c.id === pc);
            if (!colorEntry) return null;
            const shade = config.printColorShades?.[pc] || colorEntry.hex;
            const contrast = checkPrintContrast(config.bagColor, shade);
            if (contrast.good) return null;
            return (
              <div key={pc} className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                ⚠️ {colorEntry.label_ar}: {contrast.message}
              </div>
            );
          })}
        </div>

        {/* Section 3: Text Elements */}
        <div>
          <Label className="font-semibold text-gray-700 mb-3 block">
            <Type className="h-4 w-4 inline ml-1.5" />
            إضافة نصوص
          </Label>

          <div className="flex gap-2 mb-3">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="اكتب النص المطلوب..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && addText()}
            />
            {availableTextColors.length > 0 && (
              <div className="flex items-center gap-1 border rounded-md px-2 bg-white">
                {availableTextColors.map((c) => c && (
                  <button
                    key={c.id}
                    onClick={() => setSelectedTextColor(c.id)}
                    className={`w-6 h-6 rounded-full border-2 transition-all flex-shrink-0 ${
                      selectedTextColor === c.id ? "border-blue-500 scale-110 shadow-sm" : "border-gray-200"
                    }`}
                    style={{ backgroundColor: config.printColorShades?.[c.id] || c.hex }}
                    title={c.label_ar}
                  />
                ))}
              </div>
            )}
            <Button onClick={addText} size="sm" className="gap-1 shrink-0" disabled={!newText.trim()}>
              <Plus className="h-3 w-3" />
              إضافة
            </Button>
          </div>

          {design.texts.length > 0 && (
            <div className="space-y-2">
              {design.texts.map((text, i) => {
                const colorInfo = PRINT_COLORS_PALETTE.find(c => c.id === text.color);
                const shade = config.printColorShades?.[text.color] || colorInfo?.hex || "#000";
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-5 h-5 rounded-full border flex-shrink-0" style={{ backgroundColor: shade }} />
                    <span className="font-medium text-gray-800 flex-1 truncate">{text.value}</span>

                    <div className="flex items-center gap-1">
                      {availableTextColors.map((c) => c && (
                        <button
                          key={c.id}
                          onClick={() => updateTextColor(i, c.id)}
                          className={`w-5 h-5 rounded-full border-2 transition-all flex-shrink-0 ${
                            text.color === c.id ? "border-blue-500 scale-110" : "border-gray-200 opacity-60"
                          }`}
                          style={{ backgroundColor: config.printColorShades?.[c.id] || c.hex }}
                          title={c.label_ar}
                        />
                      ))}
                    </div>

                    <select
                      value={text.size}
                      onChange={(e) => updateTextSize(i, Number(e.target.value))}
                      className="border rounded px-1.5 py-0.5 text-xs w-16"
                    >
                      {[12, 16, 20, 24, 28, 32, 36, 40, 48].map(s => (
                        <option key={s} value={s}>{s}px</option>
                      ))}
                    </select>

                    <Button size="sm" variant="ghost" className="text-red-400 h-7 w-7 p-0" onClick={() => removeText(i)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 4: Design Image */}
        <div>
          <Label className="font-semibold text-gray-700 mb-3 block">
            <ImageIcon className="h-4 w-4 inline ml-1.5" />
            صورة التصميم
          </Label>

          <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center">
            {design.logoUrl ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={design.logoUrl}
                    alt="التصميم"
                    className="max-h-36 mx-auto object-contain rounded-lg"
                    style={{ background: "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50%/16px 16px" }}
                  />
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    تغيير الصورة
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveBackground}
                    disabled={isRemovingBg}
                    className="gap-1.5"
                  >
                    {isRemovingBg ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eraser className="h-3 w-3" />}
                    إزالة الخلفية
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExtractColors}
                    disabled={isExtractingColors}
                    className="gap-1.5"
                  >
                    {isExtractingColors ? <Loader2 className="h-3 w-3 animate-spin" /> : <ScanSearch className="h-3 w-3" />}
                    تحليل الألوان
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500"
                    onClick={() => {
                      updateDesign({ logoUrl: undefined, logoFile: undefined });
                      setExtractedColors([]);
                    }}
                  >
                    <Trash2 className="h-3 w-3 ml-1" />
                    حذف
                  </Button>
                </div>

                <div className="flex items-center gap-2 justify-center">
                  <Label className="text-xs text-gray-400">حساسية إزالة الخلفية</Label>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={bgThreshold}
                    onChange={(e) => setBgThreshold(Number(e.target.value))}
                    className="w-24 h-1.5 accent-blue-500"
                  />
                  <span className="text-xs text-gray-400 w-6">{bgThreshold}</span>
                </div>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="py-8 w-full group">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" />
                <p className="text-gray-600 font-medium group-hover:text-blue-600 transition-colors">ارفع صورة التصميم</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG, WebP — حتى 10 ميجابايت</p>
                <p className="text-xs text-gray-400">سيتم تحليل ألوان الصورة تلقائياً</p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {extractedColors.length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-gray-600 font-medium">
                  ألوان مستخرجة من الصورة ({extractedColors.length})
                </Label>
                <span className="text-xs text-gray-400">عدد ألوان الطباعة المطلوب: {Math.min(extractedColors.length, maxColors)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {extractedColors.map((ec, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
                    <div className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: ec.hex }} />
                    <span className="text-xs font-mono text-gray-500">{ec.hex}</span>
                    <span className="text-xs text-gray-400">{ec.percentage}%</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                عدد ألوان الطباعة المستخرج: <strong className="text-gray-600">{Math.min(extractedColors.length, maxColors)}</strong> —
                حدد الألوان المطابقة من القائمة أعلاه
              </p>
            </div>
          )}
        </div>

        {/* Section 5: Design positioning */}
        {(design.logoUrl || design.texts.length > 0) && (
          <div>
            <Label className="font-semibold text-gray-700 mb-3 block">ضبط موضع التصميم</Label>
            <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm text-gray-600">حجم التصميم</Label>
                  <span className="text-xs text-gray-400">{Math.round(design.scale * 100)}%</span>
                </div>
                <Slider min={30} max={200} step={5} value={[design.scale * 100]} onValueChange={([v]) => updateDesign({ scale: v / 100 })} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm text-gray-600">التموضع الأفقي</Label>
                  <span className="text-xs text-gray-400">{design.offsetX}%</span>
                </div>
                <Slider min={-50} max={50} step={1} value={[design.offsetX]} onValueChange={([v]) => updateDesign({ offsetX: v })} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm text-gray-600">التموضع الرأسي</Label>
                  <span className="text-xs text-gray-400">{design.offsetY}%</span>
                </div>
                <Slider min={-50} max={50} step={1} value={[design.offsetY]} onValueChange={([v]) => updateDesign({ offsetY: v })} />
              </div>
            </div>
          </div>
        )}

        {!design.logoUrl && design.texts.length === 0 && config.printColors.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-600 text-center border border-blue-100">
            يمكنك إضافة نصوص أو صورة تصميم، أو تخطي هذا الجزء إذا لم تكن التفاصيل متوفرة حالياً
          </div>
        )}
      </div>
    </div>
  );
}
