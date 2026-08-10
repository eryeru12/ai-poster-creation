import React, { useState } from "react";
import type { StepImage, DetailPageImage } from "@ai-poster/shared";
import { ProgressBar } from "./ProgressBar";

interface PromoDetailPagesProps {
  stepImages: StepImage[];
  detailPageImages: DetailPageImage[];
  promoJobStatus: { status: string; progress: number } | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onGoToStep: (step: number) => void;
}

const SUB_TYPE_LABELS: Record<string, string> = {
  "首屏": "首屏展示",
  "卖点": "卖点详情",
  "规格": "规格参数",
  "售后": "售后保障",
};

export function PromoDetailPages({
  detailPageImages,
  promoJobStatus,
  isGenerating,
  onGenerate,
}: PromoDetailPagesProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const succeededImages = detailPageImages.filter((img) => img.status === "succeeded" && img.imagePath);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewIndex !== null && previewIndex > 0) setPreviewIndex(previewIndex - 1);
  };
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewIndex !== null && previewIndex < succeededImages.length - 1) setPreviewIndex(previewIndex + 1);
  };

  return (
    <div style={{ flex: 1, minWidth: 0, padding: "16px 0" }}>
      <div className="wp-promo-step-indicator" style={{ marginBottom: 16 }}>
        <strong>Step 4</strong> — 连续详情页多图
      </div>

      {isGenerating && (
        <div className="wp-card" style={{ maxWidth: 520, margin: "0 auto", padding: 32, textAlign: "center" }}>
          <div className="wp-h2" style={{ marginBottom: 12 }}>正在生成详情页...</div>
          <div className="wp-note" style={{ marginBottom: 24 }}>
            AI 正在生成首屏、卖点、规格、售后 4 张详情页
          </div>
          <ProgressBar mode="promo" current={promoJobStatus?.progress || 0} total={4} />
        </div>
      )}

      {!isGenerating && detailPageImages.length > 0 && (
        <div className="wp-promo-detail-grid">
          {detailPageImages.map((img, idx) => {
            const isSucceeded = img.status === "succeeded" && img.imagePath;
            const displayIdx = succeededImages.findIndex((s) => s.imagePath === img.imagePath);
            return (
              <div
                key={img.subType}
                className="wp-promo-detail-card"
                style={isSucceeded ? { cursor: "pointer" } : undefined}
                onClick={() => { if (isSucceeded && displayIdx >= 0) setPreviewIndex(displayIdx); }}
              >
                {isSucceeded ? (
                  <img
                    src={`/api/download?path=${encodeURIComponent(img.imagePath)}`}
                    alt={img.subType}
                  />
                ) : (
                  <div style={{
                    width: "100%", aspectRatio: "9/16", background: "var(--wp-bg-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--wp-text-tertiary)", fontSize: 12,
                  }}>
                    {img.status === "failed" ? `生成失败: ${img.error || "未知错误"}` : "加载中..."}
                  </div>
                )}
                <div className="wp-promo-detail-card__label">
                  {SUB_TYPE_LABELS[img.subType] || img.subType}
                  {img.status === "failed" && <span style={{ color: "var(--wp-error)", marginLeft: 4 }}>(失败)</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isGenerating && detailPageImages.length === 0 && (
        <div className="wp-card" style={{ maxWidth: 480, margin: "0 auto", padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div className="wp-h3" style={{ marginBottom: 8 }}>生成详情页</div>
          <div className="wp-note" style={{ marginBottom: 20 }}>
            将生成 4 张连续详情页：首屏展示、卖点详情、规格参数、售后保障
          </div>
          <button
            className="wp-btn wp-btn--primary wp-btn--lg"
            style={{ width: "100%", background: "var(--wp-primary-gradient)" }}
            onClick={() => onGenerate()}
          >
            生成详情页
          </button>
        </div>
      )}

      {/* Lightbox */}
      {previewIndex !== null && succeededImages[previewIndex] && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.9)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setPreviewIndex(null)}
        >
          <button
            onClick={handlePrev}
            disabled={previewIndex === 0}
            style={{
              position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.15)", color: "#fff", border: "none",
              borderRadius: 6, padding: "12px 16px", fontSize: 20, cursor: "pointer",
              opacity: previewIndex === 0 ? 0.3 : 1,
            }}
          >
            ◀
          </button>
          <img
            src={`/api/download?path=${encodeURIComponent(succeededImages[previewIndex].imagePath)}`}
            alt={succeededImages[previewIndex].subType}
            style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain", borderRadius: 4 }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={handleNext}
            disabled={previewIndex === succeededImages.length - 1}
            style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.15)", color: "#fff", border: "none",
              borderRadius: 6, padding: "12px 16px", fontSize: 20, cursor: "pointer",
              opacity: previewIndex === succeededImages.length - 1 ? 0.3 : 1,
            }}
          >
            ▶
          </button>
          <div style={{
            position: "absolute", top: 16, right: 16,
            color: "#fff", fontSize: 14, opacity: 0.7,
          }}>
            {previewIndex + 1} / {succeededImages.length} — {SUB_TYPE_LABELS[succeededImages[previewIndex].subType] || succeededImages[previewIndex].subType}
          </div>
          <button
            onClick={() => setPreviewIndex(null)}
            style={{
              position: "absolute", top: 16, left: 16,
              background: "rgba(255,255,255,0.15)", color: "#fff", border: "none",
              borderRadius: 6, padding: "8px 12px", fontSize: 16, cursor: "pointer",
            }}
          >
            ✕ 关闭
          </button>
        </div>
      )}
    </div>
  );
}

PromoDetailPages.displayName = "PromoDetailPages";
