// Draws the app icons (docs/02 §6 S10) from the Catavento mark. Run when the logo changes:
//   pnpm exec tsx scripts/make-icons.tsx
// The PNGs are committed under public/icons/.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { LogoMark } from "@/components/brand/Logo";

async function icon(
  file: string,
  size: number,
  padding: number,
  background: string,
): Promise<void> {
  const mark = Math.round(size - 2 * padding);
  const image = new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background,
      }}
    >
      <LogoMark size={mark} />
    </div>,
    { width: size, height: size },
  );
  writeFileSync(
    path.join(process.cwd(), "public", "icons", file),
    Buffer.from(await image.arrayBuffer()),
  );
}

async function main(): Promise<void> {
  await icon("icon-192.png", 192, 16, "#FFFFFF");
  await icon("icon-512.png", 512, 40, "#FFFFFF");
  // Maskable icons keep the mark inside the central safe zone (80%).
  await icon("icon-maskable-512.png", 512, 110, "#FFFFFF");
  await icon("apple-touch-icon.png", 180, 18, "#FFFFFF");
  console.log("icons written to public/icons/");
}

void main();
