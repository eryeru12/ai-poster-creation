import React from "react";

interface PromoInitialSelectionProps {
  candidates: Array<{ imagePath: string; status: string; suggestion?: string }>;
  onSelect: (imagePath: string) => void;
}

export function PromoInitialSelection({ candidates, onSelect }: PromoInitialSelectionProps) {
  const succeeded = candidates.filter((c) => c.status === "succeeded");
  const hasFailures = candidates.some((c) => c.status === "failed");

  return (
    <div style={{ padding: "16px 0" }}>
      <div className="wp-promo-step-indicator" style={{ marginBottom: 16 }}>
        初始生成 — 选择一个版本作为基础
      </div>

      <div className="wp-promo-initial-list">
        {succeeded.map((c, i) => (
          <div
            key={i}
            className="wp-promo-initial-card"
            onClick={() => onSelect(c.imagePath)}
          >
            <img
              src={`/api/download?path=${encodeURIComponent(c.imagePath)}`}
              alt={`候选 ${i + 1}`}
            />
            <div className="wp-promo-initial-card__body">
              <div className="wp-promo-initial-card__label">
                方案 {i + 1}
              </div>
              <div className="wp-promo-initial-card__suggestion">
                {c.suggestion || "优化建议暂无"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasFailures && (
        <div className="wp-note" style={{ textAlign: "center", marginTop: 12 }}>
          部分方案生成失败，请从成功的版本中选择
        </div>
      )}
    </div>
  );
}

PromoInitialSelection.displayName = "PromoInitialSelection";
