import { useId } from "react";
import { type BagConfiguration, getBagTypeRules, getPrintArea } from "../../lib/bag-rules-engine";
import { BAG_COLORS, MATERIALS, PRINT_COLORS_PALETTE } from "../../lib/bag-rules";

interface BagPreviewProps {
  config: BagConfiguration;
  size?: "sm" | "md" | "lg";
}

export function BagPreview({ config, size = "md" }: BagPreviewProps) {
  const uid = useId().replace(/:/g, "_");

  if (!config.bagType) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl">
        <p className="text-gray-400 text-sm">اختر نوع الكيس لعرض المعاينة</p>
      </div>
    );
  }

  const rules = getBagTypeRules(config.bagType);
  if (!rules) return null;

  const bagColor = BAG_COLORS[config.bagColor] || BAG_COLORS.white;
  const material = MATERIALS[config.material];

  const svgWidth = size === "lg" ? 400 : size === "md" ? 300 : 200;
  const svgHeight = size === "lg" ? 500 : size === "md" ? 400 : 280;

  const widthRatio = config.width > 0 ? Math.max(0.4, Math.min(1, config.width / rules.width.max)) : 0.7;
  const lengthRatio = config.length > 0 ? Math.max(0.4, Math.min(1, config.length / (config.isPrinted ? rules.length_printed.max : rules.length_plain.max))) : 0.7;

  const bagW = svgWidth * 0.6 * widthRatio;
  const bagH = svgHeight * 0.6 * lengthRatio;
  const bagX = (svgWidth - bagW) / 2;
  const bagY = svgHeight * 0.25;

  const isTransparent = bagColor.is_transparent;
  const fillColor = bagColor.hex;
  const fillOpacity = isTransparent ? 0.15 : bagColor.opacity;

  const perspectiveOffset = bagW * 0.08;
  const sideWidth = config.sideGusset > 0 ? Math.min(bagW * 0.15, config.sideGusset * 2) : 0;

  const gradId = `bg_${uid}`;
  const sideGradId = `sg_${uid}`;
  const shadowId = `sh_${uid}`;
  const patternId = `tp_${uid}`;
  const clipId = `cl_${uid}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="drop-shadow-lg">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={fillColor} stopOpacity={fillOpacity * 0.85} />
            <stop offset="50%" stopColor={fillColor} stopOpacity={fillOpacity} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={fillOpacity * 0.7} />
          </linearGradient>

          <linearGradient id={sideGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={fillColor} stopOpacity={fillOpacity * 0.5} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={fillOpacity * 0.7} />
          </linearGradient>

          <filter id={shadowId}>
            <feDropShadow dx="3" dy="5" stdDeviation="4" floodOpacity="0.15" />
          </filter>

          {isTransparent && (
            <pattern id={patternId} width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="5" height="5" fill="#e5e7eb" />
              <rect x="5" y="5" width="5" height="5" fill="#e5e7eb" />
              <rect x="5" y="0" width="5" height="5" fill="#f9fafb" />
              <rect x="0" y="5" width="5" height="5" fill="#f9fafb" />
            </pattern>
          )}

          <clipPath id={clipId}>
            <rect x={bagX} y={bagY} width={bagW} height={bagH} rx="3" />
          </clipPath>
        </defs>

        {isTransparent && (
          <rect x={bagX} y={bagY} width={bagW} height={bagH} rx="3" fill={`url(#${patternId})`} />
        )}

        {sideWidth > 0 && (
          <polygon
            points={`${bagX + bagW},${bagY} ${bagX + bagW + sideWidth},${bagY + perspectiveOffset} ${bagX + bagW + sideWidth},${bagY + bagH + perspectiveOffset} ${bagX + bagW},${bagY + bagH}`}
            fill={`url(#${sideGradId})`}
            stroke={isTransparent ? "#d1d5db" : darkenColor(fillColor, 20)}
            strokeWidth="0.5"
            opacity={0.7}
          />
        )}

        <rect
          x={bagX}
          y={bagY}
          width={bagW}
          height={bagH}
          rx="3"
          fill={`url(#${gradId})`}
          stroke={isTransparent ? "#d1d5db" : darkenColor(fillColor, 30)}
          strokeWidth="1"
          filter={`url(#${shadowId})`}
        />

        {renderHandle(config, bagX, bagY, bagW, bagH, fillColor, fillOpacity)}

        <line x1={bagX} y1={bagY + bagH} x2={bagX + bagW} y2={bagY + bagH} stroke={darkenColor(fillColor, 40)} strokeWidth="2" opacity="0.6" />

        {isTransparent && (
          <>
            <line x1={bagX + bagW * 0.3} y1={bagY + bagH * 0.2} x2={bagX + bagW * 0.7} y2={bagY + bagH * 0.25} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <line x1={bagX + bagW * 0.2} y1={bagY + bagH * 0.4} x2={bagX + bagW * 0.5} y2={bagY + bagH * 0.42} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          </>
        )}

        {config.isPrinted && config.printDesign && renderPrintDesign(config, bagX, bagY, bagW, bagH, clipId)}

        {material && (
          <>
            <line x1={bagX + 8} y1={bagY + bagH * 0.1} x2={bagX + 8} y2={bagY + bagH * 0.9}
              stroke={isTransparent ? "rgba(200,200,200,0.3)" : "rgba(255,255,255,0.15)"} strokeWidth="0.5" strokeDasharray="3,6" />
            <line x1={bagX + bagW - 8} y1={bagY + bagH * 0.1} x2={bagX + bagW - 8} y2={bagY + bagH * 0.9}
              stroke={isTransparent ? "rgba(200,200,200,0.3)" : "rgba(255,255,255,0.15)"} strokeWidth="0.5" strokeDasharray="3,6" />
          </>
        )}
      </svg>

      <div className="mt-3 text-center space-y-1">
        <div className="text-sm font-semibold text-gray-700">{rules.label_ar}</div>
        {config.width > 0 && config.length > 0 && (
          <div className="text-xs text-gray-400">
            {config.width} × {config.length} سم
            {config.sideGusset > 0 && ` | دخلة ${config.sideGusset} سم`}
            {config.thickness > 0 && ` | ${config.thickness} ميكرون`}
          </div>
        )}
      </div>
    </div>
  );
}

function renderHandle(config: BagConfiguration, x: number, y: number, w: number, h: number, color: string, opacity: number) {
  const stroke = darkenColor(color, 30);

  switch (config.handle) {
    case "tshirt": {
      const earH = h * 0.12;
      const earW = w * 0.25;
      const gapW = w * 0.2;
      return (
        <g>
          <path
            d={`M${x + w / 2 - gapW / 2},${y} L${x + w * 0.15},${y} L${x + w * 0.1},${y - earH} Q${x + w * 0.15},${y - earH - 5} ${x + w * 0.2},${y - earH} L${x + w * 0.35},${y}`}
            fill={color} fillOpacity={opacity * 0.9} stroke={stroke} strokeWidth="1"
          />
          <path
            d={`M${x + w / 2 + gapW / 2},${y} L${x + w * 0.65},${y} L${x + w * 0.8},${y - earH} Q${x + w * 0.85},${y - earH - 5} ${x + w * 0.9},${y - earH} L${x + w * 0.85},${y}`}
            fill={color} fillOpacity={opacity * 0.9} stroke={stroke} strokeWidth="1"
          />
          <ellipse cx={x + w * 0.25} cy={y - earH * 0.4} rx={earW * 0.3} ry={earH * 0.35} fill="none" stroke={stroke} strokeWidth="1" />
          <ellipse cx={x + w * 0.75} cy={y - earH * 0.4} rx={earW * 0.3} ry={earH * 0.35} fill="none" stroke={stroke} strokeWidth="1" />
        </g>
      );
    }
    case "die_cut": {
      const holeW = w * 0.25;
      const holeH = h * 0.06;
      return (
        <ellipse cx={x + w / 2} cy={y + h * 0.06} rx={holeW / 2} ry={holeH / 2} fill="white" stroke={stroke} strokeWidth="1" />
      );
    }
    case "reinforced": {
      const patchH = h * 0.08;
      return (
        <g>
          <rect x={x + w * 0.15} y={y} width={w * 0.7} height={patchH} fill={darkenColor(color, 15)} fillOpacity={opacity} stroke={stroke} strokeWidth="0.5" rx="2" />
          <ellipse cx={x + w / 2} cy={y + patchH * 0.5} rx={w * 0.12} ry={patchH * 0.35} fill="white" stroke={stroke} strokeWidth="0.8" />
        </g>
      );
    }
    case "custom_cut": {
      const cutW = w * 0.3;
      const cutH = h * 0.05;
      return (
        <rect x={x + (w - cutW) / 2} y={y + h * 0.03} width={cutW} height={cutH} rx={cutH / 2} fill="white" stroke={stroke} strokeWidth="0.8" />
      );
    }
    default:
      return null;
  }
}

function renderPrintDesign(config: BagConfiguration, bagX: number, bagY: number, bagW: number, bagH: number, clipId: string) {
  const design = config.printDesign;
  if (!design) return null;

  const printAreaRules = getPrintArea(config.bagType);
  const pa = printAreaRules?.front || { x: 15, y: 20, width: 70, height: 50 };

  const printAreaX = bagX + bagW * (pa.x / 100);
  const printAreaY = bagY + bagH * (pa.y / 100);
  const printAreaW = bagW * (pa.width / 100);
  const printAreaH = bagH * (pa.height / 100);

  const offsetX = (design.offsetX / 100) * printAreaW;
  const offsetY = (design.offsetY / 100) * printAreaH;

  const centerX = printAreaX + printAreaW / 2 + offsetX;
  const centerY = printAreaY + printAreaH / 2 + offsetY;

  return (
    <g clipPath={`url(#${clipId})`}>
      <rect
        x={printAreaX} y={printAreaY} width={printAreaW} height={printAreaH}
        fill="none" stroke="rgba(100,100,255,0.2)" strokeWidth="0.5" strokeDasharray="3,3" rx="2"
      />

      {design.logoUrl && (
        <image
          href={design.logoUrl}
          x={centerX - (printAreaW * 0.4 * design.scale) / 2}
          y={centerY - (printAreaH * 0.4 * design.scale) / 2}
          width={printAreaW * 0.4 * design.scale}
          height={printAreaH * 0.4 * design.scale}
          preserveAspectRatio="xMidYMid meet"
          opacity={0.9}
          transform={`rotate(${design.rotation}, ${centerX}, ${centerY})`}
        />
      )}

      {design.texts.map((text, i) => {
        const colorInfo = PRINT_COLORS_PALETTE.find(c => c.id === text.color);
        const textY = design.logoUrl
          ? centerY + (printAreaH * 0.25 * design.scale) + (i * 20)
          : centerY + (i * 22) - ((design.texts.length - 1) * 11);

        return (
          <text
            key={i}
            x={centerX}
            y={textY}
            textAnchor="middle"
            fill={colorInfo?.hex || "#000"}
            fontSize={Math.max(10, Math.min(24, text.size * design.scale * 0.6))}
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            opacity={0.9}
          >
            {text.value}
          </text>
        );
      })}
    </g>
  );
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
  const b = Math.max(0, (num & 0x0000FF) - amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}
