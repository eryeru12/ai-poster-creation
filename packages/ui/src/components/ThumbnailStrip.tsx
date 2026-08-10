import React from "react";
import type { GeneratedImage } from "@ai-poster/shared";
import { LAYOUTS } from "@ai-poster/shared";

interface ThumbnailStripProps {
  images: GeneratedImage[];
  selectedLayout: string | null;
  onSelect: (layoutId: string) => void;
}

export function ThumbnailStrip({ images, selectedLayout, onSelect }: ThumbnailStripProps) {
  return (
    <div style={{ overflow: "auto" }}>
      {LAYOUTS.map((layout) => {
        const img = images.find(
          (i) => i.layoutId === layout.layoutId && i.status === "succeeded"
        );
        const isSelected = layout.layoutId === selectedLayout;

        return (
          <div
            key={layout.layoutId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 14px",
              cursor: "pointer",
              borderLeft: isSelected ? "3px solid var(--wp-primary)" : "3px solid transparent",
              background: isSelected ? "var(--wp-primary-soft)" : "transparent",
              transition: "background var(--wp-fast) ease",
            }}
            onClick={() => onSelect(layout.layoutId)}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.background = "var(--wp-surface-hover)";
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: 56,
                height: 74,
                borderRadius: "var(--wp-radius-sm)",
                background: img
                  ? `url(/api/image?path=${encodeURIComponent(img.imagePath)}) center/cover no-repeat`
                  : "var(--wp-bg-canvas)",
                flexShrink: 0,
                border: isSelected ? "1px solid var(--wp-selection)" : "1px solid var(--wp-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: "var(--wp-text-tertiary)",
              }}
            >
              {!img && layout.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "var(--wp-primary)" : "var(--wp-text-primary)" }}>
                {layout.name}
              </div>
              <div className="wp-note" style={{ fontSize: 11 }}>
                {img ? "已生成" : "生成中..."}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
