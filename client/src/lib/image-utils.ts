export interface ExtractedColor {
  hex: string;
  percentage: number;
  label?: string;
}

export function removeBackground(
  imageUrl: string,
  threshold: number = 30
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const corners = [
          getPixel(data, 0, 0, canvas.width),
          getPixel(data, canvas.width - 1, 0, canvas.width),
          getPixel(data, 0, canvas.height - 1, canvas.width),
          getPixel(data, canvas.width - 1, canvas.height - 1, canvas.width),
        ];

        const bgColor = averageColor(corners);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const dist = Math.sqrt(
            (r - bgColor.r) ** 2 + (g - bgColor.g) ** 2 + (b - bgColor.b) ** 2
          );
          if (dist < threshold) {
            data[i + 3] = 0;
          } else if (dist < threshold * 1.5) {
            data[i + 3] = Math.round((dist - threshold) / (threshold * 0.5) * 255);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to process image"));
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

export function extractColors(imageUrl: string, maxColors: number = 6): Promise<ExtractedColor[]> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 100;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        const pixels: Array<[number, number, number]> = [];
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (r > 240 && g > 240 && b > 240) continue;
          if (r < 15 && g < 15 && b < 15) continue;
          pixels.push([
            Math.round(r / 16) * 16,
            Math.round(g / 16) * 16,
            Math.round(b / 16) * 16,
          ]);
        }

        if (pixels.length === 0) {
          resolve([]);
          return;
        }

        const colorMap = new Map<string, number>();
        for (const [r, g, b] of pixels) {
          const key = `${r},${g},${b}`;
          colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        const sorted = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1]);

        const results: ExtractedColor[] = [];
        const totalPixels = pixels.length;

        for (const [key, count] of sorted) {
          if (results.length >= maxColors) break;
          const [r, g, b] = key.split(",").map(Number);
          const hex = rgbToHex(r, g, b);

          const tooClose = results.some((existing) => {
            const existingRgb = hexToRgb(existing.hex);
            if (!existingRgb) return false;
            const dist = Math.sqrt(
              (r - existingRgb.r) ** 2 +
              (g - existingRgb.g) ** 2 +
              (b - existingRgb.b) ** 2
            );
            return dist < 60;
          });

          if (!tooClose) {
            results.push({
              hex,
              percentage: Math.round((count / totalPixels) * 100),
            });
          }
        }

        resolve(results);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to extract colors"));
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

function getPixel(data: Uint8ClampedArray, x: number, y: number, width: number) {
  const i = (y * width + x) * 4;
  return { r: data[i], g: data[i + 1], b: data[i + 2] };
}

function averageColor(colors: Array<{ r: number; g: number; b: number }>) {
  const sum = colors.reduce(
    (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
    { r: 0, g: 0, b: 0 }
  );
  const n = colors.length;
  return { r: Math.round(sum.r / n), g: Math.round(sum.g / n), b: Math.round(sum.b / n) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}
