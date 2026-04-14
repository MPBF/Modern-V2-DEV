export interface DimensionRange {
  min: number;
  max: number;
  unit: string;
}

export interface HandleRule {
  min_width?: number;
  min_thickness?: number;
}

export interface PrintArea {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: string;
}

export interface CompatibilityRule {
  if: Record<string, number>;
  then: Record<string, number>;
  message_ar: string;
  type: 'error' | 'warning' | 'suggestion';
}

export interface BagTypeRules {
  id: string;
  label_ar: string;
  label_en: string;
  description_ar: string;
  icon: string;
  material_allowed: string[];
  handle_allowed: string[];
  handle_rules: Record<string, HandleRule>;
  thickness: DimensionRange;
  width: DimensionRange;
  length_plain: DimensionRange;
  length_printed: DimensionRange;
  side_gusset: DimensionRange;
  side_gusset_supported: boolean;
  print_colors: { min: number; max: number };
  bag_colors: string[];
  printable: boolean;
  print_area: {
    front: PrintArea;
    back: PrintArea;
  };
  compatibility_rules: CompatibilityRule[];
}

export interface MaterialInfo {
  id: string;
  label_ar: string;
  label_en: string;
  description_ar: string;
  min_thickness: number;
  max_thickness: number;
  transparency: 'transparent' | 'semi_transparent' | 'opaque';
  surface: string;
  flexibility: string;
}

export interface BagColorInfo {
  id: string;
  label_ar: string;
  label_en: string;
  hex: string;
  opacity: number;
  is_transparent: boolean;
}

export interface HandleInfo {
  id: string;
  label_ar: string;
  label_en: string;
  icon: string;
}

export const MATERIALS: Record<string, MaterialInfo> = {
  HDPE: {
    id: "HDPE",
    label_ar: "بولي إيثيلين عالي الكثافة",
    label_en: "HDPE",
    description_ar: "مادة قوية ومقاومة، مناسبة للأكياس الخفيفة والمتوسطة",
    min_thickness: 8,
    max_thickness: 50,
    transparency: "semi_transparent",
    surface: "خشن قليلاً",
    flexibility: "متوسط",
  },
  LDPE: {
    id: "LDPE",
    label_ar: "بولي إيثيلين منخفض الكثافة",
    label_en: "LDPE",
    description_ar: "مادة مرنة وناعمة، مناسبة للأكياس الكبيرة والثقيلة",
    min_thickness: 15,
    max_thickness: 100,
    transparency: "transparent",
    surface: "ناعم ولامع",
    flexibility: "عالي",
  },
  LLDPE: {
    id: "LLDPE",
    label_ar: "بولي إيثيلين خطي منخفض الكثافة",
    label_en: "LLDPE",
    description_ar: "مادة متينة جداً مع مقاومة عالية للتمزق",
    min_thickness: 12,
    max_thickness: 80,
    transparency: "semi_transparent",
    surface: "ناعم",
    flexibility: "عالي جداً",
  },
  Blend: {
    id: "Blend",
    label_ar: "خلطة مواد",
    label_en: "Blend",
    description_ar: "مزيج من مواد مختلفة للحصول على خصائص متوازنة",
    min_thickness: 12,
    max_thickness: 80,
    transparency: "semi_transparent",
    surface: "متنوع",
    flexibility: "متوسط-عالي",
  },
};

export const BAG_COLORS: Record<string, BagColorInfo> = {
  white: { id: "white", label_ar: "أبيض", label_en: "White", hex: "#FFFFFF", opacity: 1, is_transparent: false },
  transparent: { id: "transparent", label_ar: "شفاف", label_en: "Transparent", hex: "#E8F4F8", opacity: 0.3, is_transparent: true },
  black: { id: "black", label_ar: "أسود", label_en: "Black", hex: "#1A1A1A", opacity: 1, is_transparent: false },
  red: { id: "red", label_ar: "أحمر", label_en: "Red", hex: "#DC2626", opacity: 1, is_transparent: false },
  blue: { id: "blue", label_ar: "أزرق", label_en: "Blue", hex: "#2563EB", opacity: 1, is_transparent: false },
  green: { id: "green", label_ar: "أخضر", label_en: "Green", hex: "#16A34A", opacity: 1, is_transparent: false },
  yellow: { id: "yellow", label_ar: "أصفر", label_en: "Yellow", hex: "#EAB308", opacity: 1, is_transparent: false },
  gray: { id: "gray", label_ar: "رمادي", label_en: "Gray", hex: "#6B7280", opacity: 1, is_transparent: false },
};

export const HANDLES: Record<string, HandleInfo> = {
  none: { id: "none", label_ar: "بدون مقبض", label_en: "None", icon: "⊘" },
  tshirt: { id: "tshirt", label_ar: "تيشرت", label_en: "T-shirt", icon: "👕" },
  die_cut: { id: "die_cut", label_ar: "فتحة يد", label_en: "Die Cut", icon: "🖐" },
  reinforced: { id: "reinforced", label_ar: "مقبض مقوى", label_en: "Reinforced", icon: "💪" },
  custom_cut: { id: "custom_cut", label_ar: "قص مخصص", label_en: "Custom Cut", icon: "✂️" },
};

export const BAG_TYPES: Record<string, BagTypeRules> = {
  tshirt: {
    id: "tshirt",
    label_ar: "كيس تيشرت",
    label_en: "T-shirt Bag",
    description_ar: "كيس بمقبض على شكل تيشرت، مناسب للتسوق والسوبرماركت",
    icon: "👕",
    material_allowed: ["HDPE", "LDPE", "LLDPE", "Blend"],
    handle_allowed: ["tshirt"],
    handle_rules: {},
    thickness: { min: 10, max: 40, unit: "ميكرون" },
    width: { min: 20, max: 70, unit: "سم" },
    length_plain: { min: 30, max: 110, unit: "سم" },
    length_printed: { min: 35, max: 100, unit: "سم" },
    side_gusset: { min: 5, max: 20, unit: "سم" },
    side_gusset_supported: true,
    print_colors: { min: 1, max: 4 },
    bag_colors: ["white", "transparent", "red", "blue", "green", "black", "yellow"],
    printable: true,
    print_area: {
      front: { x: 15, y: 25, width: 70, height: 40, unit: "percent" },
      back: { x: 15, y: 25, width: 70, height: 40, unit: "percent" },
    },
    compatibility_rules: [
      { if: { width_gt: 50 }, then: { thickness_min: 18 }, message_ar: "للعروض الكبيرة (أكثر من 50 سم) يُنصح برفع السماكة إلى 18 ميكرون على الأقل", type: "warning" },
      { if: { width_gt: 60 }, then: { thickness_min: 25 }, message_ar: "العرض الكبير جداً يتطلب سماكة لا تقل عن 25 ميكرون", type: "error" },
    ],
  },
  travel: {
    id: "travel",
    label_ar: "كيس سفري / بدون يد",
    label_en: "Travel / No Handle Bag",
    description_ar: "كيس بدون مقبض، مناسب للتغليف والشحن",
    icon: "📦",
    material_allowed: ["HDPE", "LDPE", "LLDPE", "Blend"],
    handle_allowed: ["none"],
    handle_rules: {},
    thickness: { min: 15, max: 80, unit: "ميكرون" },
    width: { min: 15, max: 100, unit: "سم" },
    length_plain: { min: 20, max: 150, unit: "سم" },
    length_printed: { min: 25, max: 140, unit: "سم" },
    side_gusset: { min: 0, max: 25, unit: "سم" },
    side_gusset_supported: true,
    print_colors: { min: 1, max: 6 },
    bag_colors: ["white", "transparent", "black", "red", "blue", "green", "yellow", "gray"],
    printable: true,
    print_area: {
      front: { x: 10, y: 10, width: 80, height: 60, unit: "percent" },
      back: { x: 10, y: 10, width: 80, height: 60, unit: "percent" },
    },
    compatibility_rules: [
      { if: { width_gt: 70 }, then: { thickness_min: 25 }, message_ar: "للعروض الكبيرة يجب رفع السماكة", type: "warning" },
    ],
  },
  die_cut: {
    id: "die_cut",
    label_ar: "كيس مقصوص",
    label_en: "Die Cut Bag",
    description_ar: "كيس بفتحة يد مقصوصة، مناسب للمحلات التجارية",
    icon: "🛍️",
    material_allowed: ["HDPE", "LDPE", "LLDPE"],
    handle_allowed: ["die_cut"],
    handle_rules: {
      die_cut: { min_width: 20, min_thickness: 20 },
    },
    thickness: { min: 20, max: 80, unit: "ميكرون" },
    width: { min: 20, max: 60, unit: "سم" },
    length_plain: { min: 25, max: 80, unit: "سم" },
    length_printed: { min: 30, max: 75, unit: "سم" },
    side_gusset: { min: 3, max: 15, unit: "سم" },
    side_gusset_supported: true,
    print_colors: { min: 1, max: 6 },
    bag_colors: ["white", "transparent", "black", "red", "blue", "green", "yellow"],
    printable: true,
    print_area: {
      front: { x: 10, y: 20, width: 80, height: 50, unit: "percent" },
      back: { x: 10, y: 20, width: 80, height: 50, unit: "percent" },
    },
    compatibility_rules: [
      { if: { width_lt: 25 }, then: { thickness_min: 30 }, message_ar: "الأكياس المقصوصة الصغيرة تحتاج سماكة أعلى", type: "warning" },
    ],
  },
  roll: {
    id: "roll",
    label_ar: "كيس رول",
    label_en: "Roll Bag",
    description_ar: "أكياس على شكل رول متصل، مناسبة للاستخدام اليومي",
    icon: "🧻",
    material_allowed: ["HDPE", "LDPE"],
    handle_allowed: ["none"],
    handle_rules: {},
    thickness: { min: 8, max: 30, unit: "ميكرون" },
    width: { min: 15, max: 50, unit: "سم" },
    length_plain: { min: 20, max: 60, unit: "سم" },
    length_printed: { min: 25, max: 55, unit: "سم" },
    side_gusset: { min: 0, max: 0, unit: "سم" },
    side_gusset_supported: false,
    print_colors: { min: 1, max: 2 },
    bag_colors: ["white", "transparent", "black", "yellow"],
    printable: true,
    print_area: {
      front: { x: 10, y: 15, width: 80, height: 50, unit: "percent" },
      back: { x: 10, y: 15, width: 80, height: 50, unit: "percent" },
    },
    compatibility_rules: [],
  },
  garbage: {
    id: "garbage",
    label_ar: "كيس نفايات",
    label_en: "Garbage Bag",
    description_ar: "كيس قوي ومتين مخصص للنفايات",
    icon: "🗑️",
    material_allowed: ["LDPE", "LLDPE", "Blend"],
    handle_allowed: ["none", "tshirt"],
    handle_rules: {
      tshirt: { min_width: 40, min_thickness: 20 },
    },
    thickness: { min: 20, max: 100, unit: "ميكرون" },
    width: { min: 40, max: 120, unit: "سم" },
    length_plain: { min: 50, max: 200, unit: "سم" },
    length_printed: { min: 55, max: 180, unit: "سم" },
    side_gusset: { min: 0, max: 0, unit: "سم" },
    side_gusset_supported: false,
    print_colors: { min: 1, max: 2 },
    bag_colors: ["black", "white", "blue", "green", "red", "gray"],
    printable: true,
    print_area: {
      front: { x: 15, y: 20, width: 70, height: 40, unit: "percent" },
      back: { x: 15, y: 20, width: 70, height: 40, unit: "percent" },
    },
    compatibility_rules: [
      { if: { length_gt: 150 }, then: { thickness_min: 40 }, message_ar: "الأكياس الطويلة تتطلب سماكة عالية", type: "warning" },
    ],
  },
  bottom_seal: {
    id: "bottom_seal",
    label_ar: "كيس لحام سفلي",
    label_en: "Bottom Seal Bag",
    description_ar: "كيس ملحوم من الأسفل، مناسب للتغليف الصناعي",
    icon: "📄",
    material_allowed: ["LDPE", "LLDPE", "Blend"],
    handle_allowed: ["none", "die_cut", "reinforced"],
    handle_rules: {
      die_cut: { min_width: 20, min_thickness: 25 },
      reinforced: { min_width: 25, min_thickness: 30 },
    },
    thickness: { min: 15, max: 80, unit: "ميكرون" },
    width: { min: 10, max: 80, unit: "سم" },
    length_plain: { min: 15, max: 120, unit: "سم" },
    length_printed: { min: 20, max: 110, unit: "سم" },
    side_gusset: { min: 0, max: 15, unit: "سم" },
    side_gusset_supported: true,
    print_colors: { min: 1, max: 6 },
    bag_colors: ["white", "transparent", "black", "red", "blue", "green", "yellow", "gray"],
    printable: true,
    print_area: {
      front: { x: 10, y: 10, width: 80, height: 65, unit: "percent" },
      back: { x: 10, y: 10, width: 80, height: 65, unit: "percent" },
    },
    compatibility_rules: [],
  },
  side_seal: {
    id: "side_seal",
    label_ar: "كيس لحام جانبي",
    label_en: "Side Seal Bag",
    description_ar: "كيس ملحوم من الجوانب، مناسب للتغليف والعرض",
    icon: "📋",
    material_allowed: ["LDPE", "LLDPE"],
    handle_allowed: ["none", "die_cut"],
    handle_rules: {
      die_cut: { min_width: 20, min_thickness: 20 },
    },
    thickness: { min: 15, max: 60, unit: "ميكرون" },
    width: { min: 10, max: 70, unit: "سم" },
    length_plain: { min: 15, max: 100, unit: "سم" },
    length_printed: { min: 20, max: 95, unit: "سم" },
    side_gusset: { min: 0, max: 0, unit: "سم" },
    side_gusset_supported: false,
    print_colors: { min: 1, max: 4 },
    bag_colors: ["white", "transparent", "black", "red", "blue", "green", "yellow"],
    printable: true,
    print_area: {
      front: { x: 10, y: 10, width: 80, height: 60, unit: "percent" },
      back: { x: 10, y: 10, width: 80, height: 60, unit: "percent" },
    },
    compatibility_rules: [],
  },
};

export const PRINT_COLORS_PALETTE = [
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
];
