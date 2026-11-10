// Genera los íconos PNG de la PWA con ImageResponse (next/og).
// Uso: node scripts/generate-icons.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";

const BACKGROUND = "#0a0a0a";
const ACCENT = "#3987e5";

// Ícono "dumbbell" de Lucide (viewBox 24×24, trazo de 2).
const PATHS = [
  "M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z",
  "m2.5 21.5 1.4-1.4",
  "m20.1 3.9 1.4-1.4",
  "M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z",
  "m9.6 14.4 4.8-4.8",
];

/**
 * @param size lado en px
 * @param glyphRatio proporción del lado que ocupa el dibujo (los maskable usan
 *   menos, porque el sistema puede recortar hasta el 80% central)
 * @param radius radio de las esquinas (0 = cuadrado, para maskable y apple)
 */
function icon(size, glyphRatio, radius = 0) {
  const glyph = Math.round(size * glyphRatio);
  return new ImageResponse(
    h(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BACKGROUND,
          borderRadius: radius,
        },
      },
      h(
        "svg",
        {
          width: glyph,
          height: glyph,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: ACCENT,
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        ...PATHS.map((d) => h("path", { d, key: d })),
      ),
    ),
    { width: size, height: size },
  );
}

const outputs = [
  // Manifest
  ["public/icons/icon-192.png", icon(192, 0.6, 0)],
  ["public/icons/icon-512.png", icon(512, 0.6, 0)],
  ["public/icons/maskable-512.png", icon(512, 0.45, 0)],
  // iOS (pantalla de inicio) y favicon
  ["src/app/apple-icon.png", icon(180, 0.6, 0)],
  ["src/app/icon.png", icon(64, 0.72, 14)],
];

await mkdir("public/icons", { recursive: true });
for (const [path, response] of outputs) {
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
  console.log("✓", path);
}
