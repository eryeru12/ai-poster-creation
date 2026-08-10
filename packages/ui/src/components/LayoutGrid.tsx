import React, { useState } from "react";
import type { GeneratedImage } from "@ai-poster/shared";
import { LAYOUTS } from "@ai-poster/shared";

export interface LayoutGridProps {
  images: GeneratedImage[];
  onSelect: (layoutId: string) => void;
  onStartEdit: () => void;
}

export function LayoutGrid({ images, onSelect, onStartEdit }: LayoutGridProps) {
  const [previewLayout, setPreviewLayout] = useState<string | null>(null);

  const previewImg = previewLayout
    ? images.find((i) => i.layoutId === previewLayout && i.status === "succeeded")
    : null;

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 960, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div className="wp-h2">选择版式</div>
          <div className="wp-note" style={{ marginTop: 4 }}>
            点击一张海报底图放大预览，然后开始编辑
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {LAYOUTS.map((layout) => {
            const img = images.find(
              (i) => i.layoutId === layout.layoutId && i.status === "succeeded"
            );
            const isFailed = images.find(
              (i) => i.layoutId === layout.layoutId && i.status === "failed"
            );

            return (
              <div
                key={layout.layoutId}
                className="wp-card"
                style={{
                  aspectRatio: "3/4",
                  padding: 0,
                  overflow: "hidden",
                  cursor: "pointer",
                  position: "relative",
                  background: img
                    ? `url(/api/image?path=${encodeURIComponent(img.imagePath)}) center/cover no-repeat`
                    : "var(--wp-bg-canvas)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  transition: "transform var(--wp-fast) ease, box-shadow var(--wp-fast) ease",
                }}
                onClick={() => {
                  if (img) {
                    onSelect(layout.layoutId);
                    setPreviewLayout(layout.layoutId);
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--wp-shadow-elevated)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                {!img && !isFailed && (
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                    <div className="wp-skel" style={{ width: "80%", height: "60%", borderRadius: "var(--wp-radius-md)" }} />
                  </div>
                )}
                {isFailed && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <div style={{ fontSize: 24 }}>⚠️</div>
                    <div className="wp-note" style={{ color: "var(--wp-error)" }}>生成失败</div>
                    <button
                      className="wp-btn wp-btn--sm wp-btn--danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Retry logic handled by parent
                      }}
                    >
                      重试
                    </button>
                  </div>
                )}
                {/* Name overlay */}
                <div
                  style={{
                    background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                    padding: "24px 10px 8px",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {layout.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview modal */}
      {previewLayout && previewImg && (
        <div className="wp-scrim" onClick={() => setPreviewLayout(null)}>
          <div
            className="wp-modal"
            style={{ padding: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "3/4",
                background: `url(/api/image?path=${encodeURIComponent(previewImg.imagePath)}) center/contain no-repeat`,
                borderRadius: "var(--wp-radius-md)",
                marginBottom: 16,
                maxHeight: "60vh",
              }}
            />
            <div className="wp-spread">
              <span className="wp-h3">
                {LAYOUTS.find((l) => l.layoutId === previewLayout)?.name || previewLayout}
              </span>
              <button className="wp-btn wp-btn--primary wp-btn--lg" onClick={onStartEdit}>
                开始编辑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
