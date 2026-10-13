// The share image layout for a site (docs/02 §5.11, SharePreview mockup): drawn by satori at build
// time, so only inline styles and plain colours (no CSS variables, no SVG text).
import { LogoMark } from "@/components/brand/Logo";
import { WindRose } from "@/components/domain/WindRose";
import type { WindArc } from "@/lib/types";

const INK = "#0F1B26";
const MUTED = "#4B5A68";

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };

export interface SiteShareImageProps {
  brand: { name: string; descriptor: string };
  name: string;
  region: string;
  details: string[]; // e.g. "Published range: NNE–ENE", "PG2 / HG Supervised"
  managedBy?: string;
  ranges: WindArc[] | "all";
  footer: string;
}

export function SiteShareImage(p: SiteShareImageProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#EEF2F5",
        padding: 56,
        color: INK,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <LogoMark size={72} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 40, fontWeight: 700 }}>{p.brand.name}</span>
          <span style={{ fontSize: 22, color: MUTED }}>{p.brand.descriptor}</span>
        </div>
      </div>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
          <span style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>{p.name}</span>
          <span style={{ fontSize: 34, color: MUTED, marginTop: 10 }}>{p.region}</span>
          {p.details.length > 0 && (
            <span style={{ fontSize: 30, marginTop: 18 }}>{p.details.join(" · ")}</span>
          )}
          {p.managedBy && (
            <span style={{ fontSize: 30, marginTop: 10, color: "#1A3F94" }}>{p.managedBy}</span>
          )}
        </div>
        <WindRose
          ranges={p.ranges}
          size={260}
          colours={{
            face: "#FFFFFF",
            edge: "#C9D3DC",
            range: "#1F4FBF",
            marginal: "#F0A04B",
            ink: INK,
            label: "#3A4754",
          }}
        />
      </div>
      <span style={{ fontSize: 22, color: MUTED }}>{p.footer}</span>
    </div>
  );
}
