import {
  BAG_TYPES, MATERIALS, BAG_COLORS, HANDLES,
  type BagTypeRules, type MaterialInfo, type BagColorInfo, type HandleInfo,
} from "./bag-rules";

export interface BagConfiguration {
  bagType: string;
  isPrinted: boolean;
  material: string;
  width: number;
  length: number;
  sideGusset: number;
  thickness: number;
  handle: string;
  bagColor: string;
  printSide: 'front' | 'back' | 'both';
  printColorsCount: number;
  printColors: string[];
  printColorShades: Record<string, string>;
  printDesign?: {
    logoUrl?: string;
    logoFile?: File;
    texts: Array<{
      value: string;
      x: number;
      y: number;
      size: number;
      color: string;
    }>;
    scale: number;
    rotation: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface ValidationMessage {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  suggestions: Array<{ field: string; suggestedValue: number | string; message: string }>;
}

export const DEFAULT_CONFIG: BagConfiguration = {
  bagType: "",
  isPrinted: false,
  material: "",
  width: 0,
  length: 0,
  sideGusset: 0,
  thickness: 0,
  handle: "",
  bagColor: "white",
  printSide: "front",
  printColorsCount: 1,
  printColors: ["black"],
  printColorShades: {},
  printDesign: {
    texts: [],
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
  },
};

export function getBagTypeRules(bagType: string): BagTypeRules | null {
  return BAG_TYPES[bagType] || null;
}

export function getAllowedMaterials(bagType: string): MaterialInfo[] {
  const rules = getBagTypeRules(bagType);
  if (!rules) return [];
  return rules.material_allowed
    .map((id) => MATERIALS[id])
    .filter(Boolean);
}

export function getAllowedHandles(bagType: string): HandleInfo[] {
  const rules = getBagTypeRules(bagType);
  if (!rules) return [];
  return rules.handle_allowed
    .map((id) => HANDLES[id])
    .filter(Boolean);
}

export function getAllowedColors(bagType: string): BagColorInfo[] {
  const rules = getBagTypeRules(bagType);
  if (!rules) return [];
  return rules.bag_colors
    .map((id) => BAG_COLORS[id])
    .filter(Boolean);
}

export function getDimensionLimits(bagType: string, isPrinted: boolean, currentWidth?: number) {
  const rules = getBagTypeRules(bagType);
  if (!rules) return null;

  const widthLimits = isPrinted && rules.width_printed ? rules.width_printed : rules.width;

  let sideGussetMax = rules.side_gusset.max;
  if (rules.side_gusset_supported && currentWidth && currentWidth > 0) {
    const halfWidth = Math.floor(currentWidth / 2) - 1;
    sideGussetMax = Math.min(rules.side_gusset.max, Math.max(rules.side_gusset.min, halfWidth));
  }

  return {
    thickness: rules.thickness,
    width: widthLimits,
    length: isPrinted ? rules.length_printed : rules.length_plain,
    sideGusset: rules.side_gusset_supported
      ? { ...rules.side_gusset, max: sideGussetMax }
      : { min: 0, max: 0, unit: "سم" },
    sideGussetSupported: rules.side_gusset_supported,
  };
}

export function getBagWeightGrams(config: BagConfiguration): number | null {
  if (config.width <= 0 || config.length <= 0 || config.thickness <= 0) return null;
  const material = MATERIALS[config.material];
  if (!material) return null;

  // Two-layer film bag area (front + back) plus side gussets if present
  const widthCm = config.width;
  const lengthCm = config.length;
  const thicknessCm = config.thickness / 10000; // microns -> cm
  const gussetCm = config.sideGusset > 0 ? config.sideGusset : 0;

  // Effective film area in cm^2
  const filmArea = 2 * lengthCm * (widthCm + gussetCm);

  // Volume = area * thickness; mass = volume * density (g/cm^3)
  const grams = filmArea * thicknessCm * material.density;

  // Add ~5% extra for handles/seals/scrap
  return grams * 1.05;
}

export function getBagsPerKg(config: BagConfiguration): number | null {
  const w = getBagWeightGrams(config);
  if (!w || w <= 0) return null;
  return Math.round(1000 / w);
}

export const HANGER_MIN_HEIGHT_CM = 12;
export const HANGER_MAX_HEIGHT_CM = 25;
const HANGER_DEFAULT_WIDTH_MAX_CM = 70;
const HANGER_DEFAULT_LENGTH_MAX_CM = 100;

export function getHangerHeightCm(
  widthCm: number,
  lengthCm: number,
  opts?: { bagType?: string; isPrinted?: boolean },
): number {
  const rules = opts?.bagType ? getBagTypeRules(opts.bagType) : null;
  const widthMax = rules
    ? (opts?.isPrinted && rules.width_printed ? rules.width_printed.max : rules.width.max)
    : HANGER_DEFAULT_WIDTH_MAX_CM;
  const lengthMax = rules
    ? (opts?.isPrinted ? rules.length_printed.max : rules.length_plain.max)
    : HANGER_DEFAULT_LENGTH_MAX_CM;

  const widthRatio = widthCm > 0 ? Math.min(1, widthCm / widthMax) : 0.5;
  const lengthRatio = lengthCm > 0 ? Math.min(1, lengthCm / lengthMax) : 0.5;
  const sizeRatio = widthRatio * 0.6 + lengthRatio * 0.4;

  return Math.round(
    HANGER_MIN_HEIGHT_CM + sizeRatio * (HANGER_MAX_HEIGHT_CM - HANGER_MIN_HEIGHT_CM),
  );
}

export function getHangerHeight(config: BagConfiguration): number {
  const rules = getBagTypeRules(config.bagType);
  if (!rules || config.handle !== "hanger") return 0;
  return getHangerHeightCm(config.width, config.length, {
    bagType: config.bagType,
    isPrinted: config.isPrinted,
  });
}

export function getPrintArea(bagType: string) {
  const rules = getBagTypeRules(bagType);
  if (!rules) return null;
  return rules.print_area;
}

export function checkPrintContrast(bagColorId: string, printColorHex: string): { good: boolean; message: string } {
  const bagColor = BAG_COLORS[bagColorId];
  if (!bagColor) return { good: true, message: "" };

  const bagHex = bagColor.hex;
  const bagRgb = hexToRgb(bagHex);
  const printRgb = hexToRgb(printColorHex);

  if (!bagRgb || !printRgb) return { good: true, message: "" };

  const bagLum = relativeLuminance(bagRgb);
  const printLum = relativeLuminance(printRgb);
  const contrast = (Math.max(bagLum, printLum) + 0.05) / (Math.min(bagLum, printLum) + 0.05);

  if (contrast < 2) {
    return { good: false, message: "تباين ضعيف جداً - لون الطباعة قريب جداً من لون الكيس ولن يكون واضحاً" };
  }
  if (contrast < 3) {
    return { good: false, message: "تباين منخفض - قد لا يكون لون الطباعة واضحاً على هذا اللون" };
  }
  return { good: true, message: "" };
}

export function getSuggestedThickness(config: BagConfiguration): number | null {
  const rules = getBagTypeRules(config.bagType);
  if (!rules) return null;

  let suggested = rules.thickness.min;

  if (config.width > 50) suggested = Math.max(suggested, 40);
  if (config.width > 70) suggested = Math.max(suggested, 50);
  if (config.length > 80) suggested = Math.max(suggested, 45);

  const material = MATERIALS[config.material];
  if (material) {
    suggested = Math.max(suggested, material.min_thickness);
  }

  return suggested;
}

export function validateConfiguration(config: BagConfiguration): ValidationResult {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];
  const suggestions: Array<{ field: string; suggestedValue: number | string; message: string }> = [];

  const rules = getBagTypeRules(config.bagType);
  if (!rules) {
    errors.push({ field: "bagType", message: "يجب اختيار نوع الكيس" });
    return { isValid: false, errors, warnings, suggestions };
  }

  if (!config.material) {
    errors.push({ field: "material", message: "يجب اختيار المادة" });
  } else if (!rules.material_allowed.includes(config.material)) {
    errors.push({ field: "material", message: `المادة "${MATERIALS[config.material]?.label_ar}" غير مدعومة لهذا النوع من الأكياس` });
  } else {
    const mat = MATERIALS[config.material];
    if (mat && config.thickness > 0) {
      if (config.thickness < mat.min_thickness) {
        errors.push({ field: "thickness", message: `السماكة أقل من الحد الأدنى لمادة ${mat.label_ar} (${mat.min_thickness} ميكرون)` });
      }
      if (config.thickness > mat.max_thickness) {
        errors.push({ field: "thickness", message: `السماكة أعلى من الحد الأقصى لمادة ${mat.label_ar} (${mat.max_thickness} ميكرون)` });
      }
    }
  }

  if (config.thickness > 0) {
    if (config.thickness < rules.thickness.min) {
      errors.push({ field: "thickness", message: `السماكة أقل من الحد الأدنى (${rules.thickness.min} ${rules.thickness.unit})` });
      suggestions.push({ field: "thickness", suggestedValue: rules.thickness.min, message: `الحد الأدنى المسموح: ${rules.thickness.min} ${rules.thickness.unit}` });
    }
    if (config.thickness > rules.thickness.max) {
      errors.push({ field: "thickness", message: `السماكة أعلى من الحد الأقصى (${rules.thickness.max} ${rules.thickness.unit})` });
      suggestions.push({ field: "thickness", suggestedValue: rules.thickness.max, message: `الحد الأقصى المسموح: ${rules.thickness.max} ${rules.thickness.unit}` });
    }
  }

  const widthLimits = config.isPrinted && rules.width_printed ? rules.width_printed : rules.width;
  if (config.width > 0) {
    if (config.width < widthLimits.min) {
      errors.push({ field: "width", message: `العرض أقل من الحد الأدنى (${widthLimits.min} ${widthLimits.unit})` });
    }
    if (config.width > widthLimits.max) {
      errors.push({ field: "width", message: `العرض أعلى من الحد الأقصى (${widthLimits.max} ${widthLimits.unit})` });
    }
  }

  const lengthLimits = config.isPrinted ? rules.length_printed : rules.length_plain;
  if (config.length > 0) {
    if (config.length < lengthLimits.min) {
      errors.push({ field: "length", message: `الطول أقل من الحد الأدنى (${lengthLimits.min} ${lengthLimits.unit})` });
    }
    if (config.length > lengthLimits.max) {
      errors.push({ field: "length", message: `الطول أعلى من الحد الأقصى (${lengthLimits.max} ${lengthLimits.unit})` });
    }
  }

  if (!rules.side_gusset_supported && config.sideGusset > 0) {
    errors.push({ field: "sideGusset", message: "الدخلات الجانبية غير مدعومة لهذا النوع من الأكياس" });
  }
  if (rules.side_gusset_supported && config.sideGusset > 0) {
    if (config.sideGusset < rules.side_gusset.min) {
      errors.push({ field: "sideGusset", message: `الدخلة الجانبية أقل من الحد الأدنى (${rules.side_gusset.min} ${rules.side_gusset.unit})` });
    }
    const maxGusset = config.width > 0 ? Math.floor(config.width / 2) - 1 : rules.side_gusset.max;
    if (config.sideGusset >= Math.floor(config.width / 2) && config.width > 0) {
      errors.push({ field: "sideGusset", message: "الدخلة الجانبية يجب أن تكون أقل من نصف العرض" });
    } else if (config.sideGusset > rules.side_gusset.max) {
      errors.push({ field: "sideGusset", message: `الدخلة الجانبية أعلى من الحد الأقصى (${rules.side_gusset.max} ${rules.side_gusset.unit})` });
    }
    if (config.width > 0 && config.sideGusset > config.width * 0.4) {
      warnings.push({ field: "sideGusset", message: "الدخلة الجانبية كبيرة نسبياً مقارنة بالعرض" });
    }
  }

  if (config.handle && !rules.handle_allowed.includes(config.handle)) {
    errors.push({ field: "handle", message: "نوع المقبض غير مدعوم لهذا الكيس" });
  }
  if (config.handle && rules.handle_rules[config.handle]) {
    const hr = rules.handle_rules[config.handle];
    if (hr.min_width && config.width > 0 && config.width < hr.min_width) {
      errors.push({ field: "handle", message: `هذا المقبض يتطلب عرضاً لا يقل عن ${hr.min_width} سم` });
    }
    if (hr.min_thickness && config.thickness > 0 && config.thickness < hr.min_thickness) {
      errors.push({ field: "handle", message: `هذا المقبض يتطلب سماكة لا تقل عن ${hr.min_thickness} ميكرون` });
    }
  }

  if (config.bagColor && !rules.bag_colors.includes(config.bagColor)) {
    errors.push({ field: "bagColor", message: "لون الكيس غير متاح لهذا النوع" });
  }

  if (config.isPrinted) {
    if (!rules.printable) {
      errors.push({ field: "isPrinted", message: "الطباعة غير مدعومة لهذا النوع من الأكياس" });
    }
    if (config.printColors.length < rules.print_colors.min) {
      errors.push({ field: "printColors", message: `يجب اختيار ${rules.print_colors.min} لون على الأقل` });
    }
    if (config.printColors.length > rules.print_colors.max) {
      errors.push({ field: "printColors", message: `أقصى عدد للألوان ${rules.print_colors.max}` });
    }
  }

  if (rules.compatibility_rules) {
    for (const rule of rules.compatibility_rules) {
      let conditionMet = true;
      for (const [key, val] of Object.entries(rule.if)) {
        if (key === "width_gt" && config.width <= val) conditionMet = false;
        if (key === "width_lt" && config.width >= val) conditionMet = false;
        if (key === "length_gt" && config.length <= val) conditionMet = false;
        if (key === "thickness_lt" && config.thickness >= val) conditionMet = false;
      }
      if (conditionMet) {
        let actionViolated = false;
        for (const [key, val] of Object.entries(rule.then)) {
          if (key === "thickness_min" && config.thickness > 0 && config.thickness < val) actionViolated = true;
        }
        if (actionViolated) {
          if (rule.type === "error") {
            errors.push({ field: "compatibility", message: rule.message_ar });
          } else if (rule.type === "warning") {
            warnings.push({ field: "compatibility", message: rule.message_ar });
          } else {
            const sugVal = Object.entries(rule.then).find(([k]) => k === "thickness_min");
            if (sugVal) {
              suggestions.push({ field: "thickness", suggestedValue: sugVal[1], message: rule.message_ar });
            }
          }
        }
      }
    }
  }

  if (config.isPrinted && config.printColors.length > 0 && config.bagColor) {
    for (const pc of config.printColors) {
      const colorEntry = PRINT_COLORS.find((c) => c.id === pc);
      if (colorEntry) {
        const shade = config.printColorShades?.[pc];
        const colorHex = shade || colorEntry.hex;
        const contrast = checkPrintContrast(config.bagColor, colorHex);
        if (!contrast.good) {
          warnings.push({ field: "printColors", message: `${colorEntry.label_ar}: ${contrast.message}` });
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors, warnings, suggestions };
}

export function getDefaultsForBagType(bagType: string, isPrinted: boolean): Partial<BagConfiguration> {
  const rules = getBagTypeRules(bagType);
  if (!rules) return {};

  const widthLimits = isPrinted && rules.width_printed ? rules.width_printed : rules.width;
  const lengthLimits = isPrinted ? rules.length_printed : rules.length_plain;

  return {
    material: rules.material_allowed[0] || "",
    width: Math.round((widthLimits.min + widthLimits.max) / 2),
    length: Math.round((lengthLimits.min + lengthLimits.max) / 2),
    thickness: Math.round((rules.thickness.min + rules.thickness.max) / 2),
    sideGusset: rules.side_gusset_supported ? rules.side_gusset.min : 0,
    handle: rules.handle_allowed[0] || "none",
    bagColor: rules.bag_colors[0] || "white",
    printColorsCount: isPrinted ? rules.print_colors.min : 0,
    printColorShades: {},
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

const PRINT_COLORS = [
  { id: "black", label_ar: "أسود", hex: "#000000" },
  { id: "red", label_ar: "أحمر", hex: "#DC2626" },
  { id: "blue", label_ar: "أزرق", hex: "#2563EB" },
  { id: "green", label_ar: "أخضر", hex: "#16A34A" },
  { id: "yellow", label_ar: "أصفر", hex: "#EAB308" },
  { id: "white", label_ar: "أبيض", hex: "#FFFFFF" },
  { id: "orange", label_ar: "برتقالي", hex: "#EA580C" },
  { id: "purple", label_ar: "بنفسجي", hex: "#7C3AED" },
  { id: "brown", label_ar: "بني", hex: "#92400E" },
  { id: "gold", label_ar: "ذهبي", hex: "#CA8A04" },
  { id: "silver", label_ar: "فضي", hex: "#9CA3AF" },
  { id: "pink", label_ar: "وردي", hex: "#EC4899" },
  { id: "maroon", label_ar: "مارون", hex: "#800000" },
  { id: "turquoise", label_ar: "تركواز", hex: "#40E0D0" },
  { id: "skyblue", label_ar: "سماوي", hex: "#38BDF8" },
  { id: "olive", label_ar: "زيتي", hex: "#6B8E23" },
  { id: "beige", label_ar: "بيج", hex: "#D2B48C" },
  { id: "gray", label_ar: "رمادي", hex: "#6B7280" },
];
