import { useState, useRef } from "react";
import { type BagConfiguration, getPrintArea } from "../../lib/bag-rules-engine";
import { PRINT_COLORS_PALETTE } from "../../lib/bag-rules";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Upload, Type, Trash2 } from "lucide-react";

interface PrintDesignStepProps {
  config: BagConfiguration;
  onChange: (updates: Partial<BagConfiguration>) => void;
}

export function PrintDesignStep({ config, onChange }: PrintDesignStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newText, setNewText] = useState("");
  const [selectedTextColor, setSelectedTextColor] = useState("black");

  const printArea = getPrintArea(config.bagType);
  const design = config.printDesign || { texts: [], scale: 1, rotation: 0, offsetX: 0, offsetY: 0 };

  const updateDesign = (updates: Partial<typeof design>) => {
    onChange({ printDesign: { ...design, ...updates } });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      alert("يرجى رفع ملف بصيغة PNG أو JPG أو SVG فقط");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("حجم الملف يجب أن لا يتجاوز 5 ميجابايت");
      return;
    }

    const url = URL.createObjectURL(file);
    updateDesign({ logoUrl: url, logoFile: file });
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

  const availableColors = config.printColors
    .map(id => PRINT_COLORS_PALETTE.find(c => c.id === id))
    .filter(Boolean);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">تصميم الطباعة</h2>
      <p className="text-gray-500 text-sm mb-6">ارفع شعارك وأضف نصوصاً لمعاينة شكل الطباعة على الكيس</p>

      <div className="space-y-6">
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center">
          {design.logoUrl ? (
            <div className="space-y-3">
              <img src={design.logoUrl} alt="الشعار" className="max-h-32 mx-auto object-contain" />
              <div className="flex justify-center gap-2">
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  تغيير الشعار
                </Button>
                <Button size="sm" variant="outline" className="text-red-500" onClick={() => updateDesign({ logoUrl: undefined, logoFile: undefined })}>
                  <Trash2 className="h-3 w-3 ml-1" />
                  حذف
                </Button>
              </div>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="py-8 w-full">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 font-medium">ارفع شعار أو صورة</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG - حتى 5 ميجابايت</p>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div>
          <Label className="font-semibold text-gray-700 mb-3 block">إضافة نص</Label>
          <div className="flex gap-2">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="اكتب النص المطلوب..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && addText()}
            />
            <select
              value={selectedTextColor}
              onChange={(e) => setSelectedTextColor(e.target.value)}
              className="border rounded-md px-2 text-sm"
            >
              {availableColors.map((c) => c && (
                <option key={c.id} value={c.id}>{c.label_ar}</option>
              ))}
            </select>
            <Button onClick={addText} size="sm" className="gap-1">
              <Type className="h-3 w-3" />
              إضافة
            </Button>
          </div>
        </div>

        {design.texts.length > 0 && (
          <div className="space-y-2">
            <Label className="font-semibold text-gray-700">النصوص المضافة</Label>
            {design.texts.map((text, i) => {
              const colorInfo = PRINT_COLORS_PALETTE.find(c => c.id === text.color);
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: colorInfo?.hex || "#000" }} />
                    <span className="font-medium">{text.value}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-400 h-7" onClick={() => removeText(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {(design.logoUrl || design.texts.length > 0) && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-gray-600">حجم التصميم</Label>
                <span className="text-xs text-gray-400">{Math.round(design.scale * 100)}%</span>
              </div>
              <Slider min={30} max={200} step={5} value={[design.scale * 100]} onValueChange={([v]) => updateDesign({ scale: v / 100 })} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-gray-600">التموضع الأفقي</Label>
                <span className="text-xs text-gray-400">{design.offsetX}%</span>
              </div>
              <Slider min={-50} max={50} step={1} value={[design.offsetX]} onValueChange={([v]) => updateDesign({ offsetX: v })} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-gray-600">التموضع الرأسي</Label>
                <span className="text-xs text-gray-400">{design.offsetY}%</span>
              </div>
              <Slider min={-50} max={50} step={1} value={[design.offsetY]} onValueChange={([v]) => updateDesign({ offsetY: v })} />
            </div>
          </div>
        )}

        {!design.logoUrl && design.texts.length === 0 && (
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
            يمكنك تخطي هذه الخطوة إذا لم تكن تفاصيل التصميم متوفرة حالياً
          </div>
        )}
      </div>
    </div>
  );
}
