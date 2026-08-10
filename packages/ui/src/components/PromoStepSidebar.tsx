import React from "react";
import type { OptimizationOperation, StepImage, DetailPageImage, PromoPhase, OptimizationPhase } from "@ai-poster/shared";

interface PromoStepSidebarProps {
  currentStep: number;
  stepImages: StepImage[];
  detailPageImages: DetailPageImage[];
  phaseHistory: Array<{ step: number; phase: OptimizationPhase; operations: OptimizationOperation[]; selectedOptions: Record<string, string> }>;
  promoPhase: PromoPhase;
  initialCandidates?: Array<{ imagePath: string; status: string }>;
  onGoToStep: (step: number) => void;
  onGoToDetail: () => void;
}

const PHASES = [
  { index: 1, label: "风格定调" },
  { index: 2, label: "结构深化" },
  { index: 3, label: "电商落地" },
];

export function PromoStepSidebar({
  currentStep,
  stepImages,
  detailPageImages,
  phaseHistory,
  promoPhase,
  initialCandidates,
  onGoToStep,
  onGoToDetail,
}: PromoStepSidebarProps) {
  const hasDetail = detailPageImages.length > 0;
  const isDetailActive = promoPhase === "detail";

  const getPhaseStatus = (phaseIndex: number): "completed" | "active" | "pending" => {
    if (currentStep > phaseIndex) return "completed";
    if (currentStep === phaseIndex) return "active";
    return "pending";
  };

  const getPhaseThumb = (phaseIndex: number) => {
    const resultImg = stepImages.find((s) => s.step === phaseIndex + 1);
    if (resultImg) return resultImg;
    const inputImg = stepImages.find((s) => s.step === phaseIndex);
    return inputImg || null;
  };

  const getSelectedSummary = (phaseIndex: number): string => {
    const entry = phaseHistory.find((h) => h.step === phaseIndex);
    if (!entry) return "";
    const texts: string[] = [];
    for (const op of entry.operations) {
      const optId = entry.selectedOptions[op.id];
      if (optId) {
        const opt = op.options.find((o) => o.id === optId);
        if (opt) texts.push(opt.text);
      }
    }
    return texts.join(" · ");
  };

  return (
    <div className="wp-promo-sidebar">
      <div className="wp-promo-sidebar__header">优化阶段</div>

      {PHASES.map(({ index, label }) => {
        const status = getPhaseStatus(index);
        const img = getPhaseThumb(index);
        const summary = getSelectedSummary(index);
        const isClickable = status === "completed";

        let cls = "wp-promo-sidebar__step";
        if (status === "active") cls += " wp-promo-sidebar__step--active";
        else if (status === "completed") cls += " wp-promo-sidebar__step--completed";
        else cls += " wp-promo-sidebar__step--pending";

        return (
          <div
            key={`phase-${index}`}
            className={cls}
            onClick={() => { if (isClickable) onGoToStep(index); }}
          >
            <div className="wp-promo-sidebar__thumb">
              {img ? (
                <img
                  src={`/api/download?path=${encodeURIComponent(img.imagePath)}`}
                  alt={label}
                />
              ) : (index === 1 && initialCandidates && initialCandidates.length > 1) ? (
                <img
                  src={`/api/download?path=${encodeURIComponent(initialCandidates[0].imagePath)}`}
                  alt="候选"
                />
              ) : (
                <div className="wp-promo-sidebar__thumb-placeholder">{status === "active" ? "..." : "—"}</div>
              )}
            </div>
            <div className="wp-promo-sidebar__info">
              <div className="wp-promo-sidebar__label">
                {index}. {label}
              </div>
              <div className="wp-promo-sidebar__status">
                {(index === 1 && initialCandidates && initialCandidates.length > 1 && !img)
                  ? "选择中"
                  : status === "completed" ? "已完成" : status === "active" ? "进行中" : "待开始"}
              </div>
              {summary && (
                <div className="wp-promo-sidebar__suggestion-text">{summary}</div>
              )}
            </div>
          </div>
        );
      })}

      {/* Detail pages step */}
      {(() => {
        let cls = "wp-promo-sidebar__step";
        if (hasDetail) cls += " wp-promo-sidebar__step--completed";
        else if (isDetailActive) cls += " wp-promo-sidebar__step--active";
        else if (currentStep >= 1) cls += " wp-promo-sidebar__step--pending";
        else cls += " wp-promo-sidebar__step--pending";

        const detailClickable = currentStep >= 1 && !isDetailActive;

        return (
          <div
            key="detail"
            className={cls}
            onClick={() => { if (detailClickable) onGoToDetail(); }}
          >
            <div className="wp-promo-sidebar__thumb">
              {hasDetail ? (
                <img
                  src={`/api/download?path=${encodeURIComponent(detailPageImages[0].imagePath)}`}
                  alt="详情页"
                />
              ) : (
                <div className="wp-promo-sidebar__thumb-placeholder">{isDetailActive ? "..." : "—"}</div>
              )}
            </div>
            <div className="wp-promo-sidebar__info">
              <div className="wp-promo-sidebar__label">
                详情页
              </div>
              <div className="wp-promo-sidebar__status">
                {hasDetail ? "已完成" : isDetailActive ? "进行中" : "待开始"}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

PromoStepSidebar.displayName = "PromoStepSidebar";
