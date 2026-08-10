import React, { useState } from "react";
import type { StepImage, OptimizationPhase } from "@ai-poster/shared";

interface PromoOptimizingProps {
  currentStep: number;
  stepImages: StepImage[];
  currentImageUrl: string;
  phaseHistory: Array<{ step: number; phase: OptimizationPhase }>;
  onGoToStep: (step: number) => void;
  suggestion?: string;
}

const PHASE_LABELS: Record<number, string> = {
  1: "风格定调",
  2: "结构深化",
  3: "电商落地",
};

function getStepLabel(step: number): string {
  return PHASE_LABELS[step] || `优化 ${step}`;
}

export function PromoOptimizing({
  currentStep,
  stepImages,
  currentImageUrl,
  onGoToStep,
  suggestion,
}: PromoOptimizingProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [previewFull, setPreviewFull] = useState(false);
  const currentImage = stepImages.find((s) => s.step === currentStep);

  return (
    <div style={{ flex: 1, minWidth: 0, padding: "16px 0" }}>
      {/* Step indicator */}
      <div className="wp-promo-step-indicator" style={{ marginBottom: 12 }}>
        {getStepLabel(currentStep)} — 当前结果
      </div>

      {/* Current result image - constrained height */}
      <div className="wp-card" style={{ padding: 20, textAlign: "center" }}>
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt="当前结果"
            onClick={() => setPreviewFull(true)}
            style={{
              maxHeight: "60vh",
              maxWidth: "100%",
              borderRadius: 8,
              border: "1px solid var(--wp-border)",
              cursor: "pointer",
              objectFit: "contain",
            }}
          />
        ) : (
          <div className="wp-note" style={{ padding: 60 }}>加载中...</div>
        )}
        {currentImageUrl && (
          <div style={{ fontSize: 11, color: "var(--wp-text-tertiary)", marginTop: 8 }}>
            点击图片查看大图
          </div>
        )}
      </div>

      {/* VLM Optimization Suggestion */}
      {suggestion && currentStep === 1 && (
        <div className="wp-promo-result__suggestion" style={{ marginTop: 12 }}>
          <div className="wp-promo-result__suggestion-label">AI 优化建议</div>
          <div className="wp-promo-result__suggestion-text">{suggestion}</div>
        </div>
      )}

      {/* Full-size preview overlay */}
      {previewFull && currentImageUrl && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.9)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setPreviewFull(false)}
        >
          <img
            src={currentImageUrl}
            alt="当前结果"
            style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain", borderRadius: 4 }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewFull(false)}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(255,255,255,0.15)", color: "#fff", border: "none",
              borderRadius: 6, padding: "8px 12px", fontSize: 16, cursor: "pointer",
            }}
          >
            ✕ 关闭
          </button>
        </div>
      )}

      {/* Prompt sent to model */}
      {currentImage?.prompt && (
        <div className="wp-card" style={{ padding: 12, marginTop: 12 }}>
          <div
            style={{ fontSize: 12, fontWeight: 600, color: "var(--wp-text-secondary)", cursor: "pointer", userSelect: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            onClick={() => setShowPrompt(!showPrompt)}
          >
            <span>发送给模型的提示词</span>
            <span style={{ fontSize: 10 }}>{showPrompt ? "收起 ▲" : "展开 ▼"}</span>
          </div>
          {showPrompt && (
            <div style={{
              marginTop: 8,
              padding: 10,
              background: "var(--wp-bg-muted)",
              borderRadius: 6,
              fontSize: 11,
              lineHeight: 1.7,
              color: "var(--wp-text-secondary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 200,
              overflow: "auto",
            }}>
              {currentImage.prompt}
            </div>
          )}
        </div>
      )}

      {/* Step thumbnails row */}
      <div className="wp-promo-steps" style={{ marginTop: 16 }}>
        <div className="wp-promo-steps__row">
          {stepImages.map((stepImg) => {
            const step = stepImg.step;
            const isActive = step === currentStep;
            let cls = "wp-promo-step-thumb";
            if (isActive) cls += " wp-promo-step-thumb--active";
            else cls += " wp-promo-step-thumb--completed";

            return (
              <div
                key={step}
                className={cls}
                onClick={() => { if (!isActive) onGoToStep(step); }}
                style={!isActive ? { cursor: "pointer" } : undefined}
              >
                <img src={`/api/download?path=${encodeURIComponent(stepImg.imagePath)}`} alt={getStepLabel(step)} />
                <span className="wp-promo-step-thumb__label">{getStepLabel(step)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

PromoOptimizing.displayName = "PromoOptimizing";
