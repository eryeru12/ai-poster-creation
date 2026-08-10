import React from "react";
import type { PhaseOperations, OptimizationOperation, DetailPageImage, PromoPhase } from "@ai-poster/shared";
import { ProgressBar } from "./ProgressBar";

interface PromoJobStatus {
  jobId: string;
  status: string;
  progress: number;
  total?: number;
}

interface PromoRightPanelProps {
  currentStep: number;
  promoPhase: PromoPhase;
  phaseOperations: PhaseOperations | null;
  selectedOptions: Record<string, string>;
  userSupplement: string;
  detailPageImages: DetailPageImage[];
  promoJobStatus: PromoJobStatus | null;
  initialCandidates?: Array<{ imagePath: string; status: string }>;
  onSelectOption: (operationId: string, optionId: string) => void;
  onConfirm: () => void;
  onRestart: () => void;
  onUserSupplementChange: (text: string) => void;
  onExport: (format: "png" | "jpg") => void;
  onDetailPagesGenerate: () => void;
}

const PHASE_NAMES: Record<string, string> = {
  style: "风格定调",
  structure: "结构深化",
  ecommerce: "电商落地",
};

const NEXT_STEP_LABELS: Record<number, string> = {
  0: "初始图",
  1: "风格定调",
  2: "结构深化",
  3: "电商落地",
};

function hasAllSelections(selectedOptions: Record<string, string>, operations: OptimizationOperation[]): boolean {
  return operations.length > 0 && operations.every((op) => selectedOptions[op.id]);
}

export function PromoRightPanel({
  currentStep,
  promoPhase,
  phaseOperations,
  selectedOptions,
  userSupplement,
  detailPageImages,
  promoJobStatus,
  initialCandidates,
  onSelectOption,
  onConfirm,
  onRestart,
  onUserSupplementChange,
  onExport,
  onDetailPagesGenerate,
}: PromoRightPanelProps) {

  const isGeneratingDetail = promoPhase === "generating" && (promoJobStatus?.total && promoJobStatus.total > 1);
  const isLastPhase = currentStep >= 3;

  return (
    <div className="wp-promo-right">
      <div className="wp-card" style={{ padding: 16 }}>

        {/* Input: hint */}
        {promoPhase === "input" && (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💡</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--wp-text-secondary)" }}>
              开始创作
            </div>
            <div className="wp-note" style={{ fontSize: 12 }}>
              上传商品图并输入描述，点击生成后 AI 将为您创作宣传图
            </div>
          </div>
        )}

        {/* Generating: progress */}
        {promoPhase === "generating" && (
          <div style={{ textAlign: "center", padding: "24px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--wp-text-secondary)" }}>
              {isGeneratingDetail
                ? "正在生成详情页..."
                : `正在生成${NEXT_STEP_LABELS[currentStep] || "图片"}`}
            </div>
            <ProgressBar
              mode="promo"
              current={promoJobStatus?.progress || 0}
              total={promoJobStatus?.total || 1}
            />
            <div className="wp-note" style={{ fontSize: 11, marginTop: 8 }}>
              AI 正在根据优化方向创作新版本
            </div>
          </div>
        )}

        {/* Optimizing: initial candidate selection guidance */}
        {promoPhase === "optimizing" && initialCandidates && initialCandidates.length > 1 && (
          <div style={{ textAlign: "center", padding: "24px 16px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎨</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              选择初始方案
            </div>
            <div className="wp-note" style={{ fontSize: 12 }}>
              从左方 {initialCandidates.filter(c => c.status === "succeeded").length} 个 AI 生成的候选图中选择一个作为基础版本，然后进入分步优化
            </div>
          </div>
        )}

        {/* Optimizing: phase operations */}
        {promoPhase === "optimizing" && !(initialCandidates && initialCandidates.length > 1) && (
          <>
            <div className="wp-promo-right__header">
              {phaseOperations
                ? PHASE_NAMES[phaseOperations.phase] || "优化"
                : "正在分析..."}
            </div>

            {phaseOperations ? (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
                  {phaseOperations.operations.map((op) => (
                    <div key={op.id} className="wp-promo-operation">
                      <div className="wp-promo-operation__label">{op.label}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {op.options.map((opt) => {
                          const isSelected = selectedOptions[op.id] === opt.id;
                          return (
                            <div
                              key={opt.id}
                              className={`wp-promo-suggestion${isSelected ? " wp-promo-suggestion--selected" : ""}`}
                              onClick={() => onSelectOption(op.id, opt.id)}
                            >
                              <div className="wp-promo-suggestion__radio" />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.text}</div>
                                <div className="wp-promo-suggestion__text" style={{ fontSize: 11 }}>
                                  {opt.promptModification}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* User supplement */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--wp-text-secondary)", display: "block", marginBottom: 4 }}>
                    补充说明（可选）
                  </label>
                  <textarea
                    className="wp-field"
                    style={{ width: "100%", minHeight: 52, resize: "vertical", fontSize: 12 }}
                    placeholder="对优化建议的补充..."
                    value={userSupplement}
                    onChange={(e) => onUserSupplementChange(e.target.value)}
                    maxLength={200}
                  />
                  <div style={{ fontSize: 10, color: "var(--wp-text-tertiary)", textAlign: "right", marginTop: 2 }}>
                    {userSupplement.length}/200
                  </div>
                </div>

                <button
                  className="wp-btn wp-btn--primary wp-btn--lg"
                  style={{ width: "100%", background: "var(--wp-primary-gradient)", marginBottom: 8 }}
                  disabled={!hasAllSelections(selectedOptions, phaseOperations.operations)}
                  onClick={onConfirm}
                >
                  确认并生成{NEXT_STEP_LABELS[currentStep] || "下一步"}
                </button>
                <button
                  className="wp-btn wp-btn--outline wp-btn--lg"
                  style={{ width: "100%", marginBottom: 8 }}
                  onClick={() => onDetailPagesGenerate()}
                >
                  跳过优化，生成详情页
                </button>
              </>
            ) : (
              <div className="wp-note" style={{ textAlign: "center", padding: 16, marginBottom: 12 }}>
                {isLastPhase ? "优化完成，可生成详情页" : "正在生成优化建议..."}
              </div>
            )}

            {isLastPhase && phaseOperations === null && (
              <button
                className="wp-btn wp-btn--primary wp-btn--lg"
                style={{ width: "100%", background: "var(--wp-primary-gradient)", marginBottom: 8 }}
                onClick={() => onDetailPagesGenerate()}
              >
                生成详情页
              </button>
            )}

            <button className="wp-btn wp-btn--quiet wp-btn--sm" style={{ width: "100%" }} onClick={onRestart}>
              重新开始
            </button>
          </>
        )}

        {/* Detail: export */}
        {promoPhase === "detail" && (
          <>
            <div className="wp-promo-right__header">导出选项</div>
            {detailPageImages.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  className="wp-btn wp-btn--primary"
                  style={{ width: "100%" }}
                  onClick={() => onExport("png")}
                >
                  导出 PNG
                </button>
                <button
                  className="wp-btn wp-btn--primary"
                  style={{ width: "100%" }}
                  onClick={() => onExport("jpg")}
                >
                  导出 JPG
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div className="wp-note" style={{ marginBottom: 12, fontSize: 12 }}>
                  点击下方按钮生成 4 张连续详情页
                </div>
                <button
                  className="wp-btn wp-btn--primary wp-btn--lg"
                  style={{ width: "100%", background: "var(--wp-primary-gradient)" }}
                  onClick={() => onDetailPagesGenerate()}
                >
                  生成详情页
                </button>
              </div>
            )}
            <button
              className="wp-btn wp-btn--quiet wp-btn--sm"
              style={{ width: "100%", marginTop: 8 }}
              onClick={onRestart}
            >
              重新开始
            </button>
          </>
        )}

        {/* Result: export */}
        {promoPhase === "result" && (
          <>
            <div className="wp-promo-right__header">导出选项</div>
            <button
              className="wp-btn wp-btn--primary"
              style={{ width: "100%", marginBottom: 8 }}
              onClick={() => onExport("png")}
            >
              导出 PNG
            </button>
            <button
              className="wp-btn wp-btn--primary"
              style={{ width: "100%", marginBottom: 8 }}
              onClick={() => onExport("jpg")}
            >
              导出 JPG
            </button>
            <button
              className="wp-btn wp-btn--quiet wp-btn--sm"
              style={{ width: "100%" }}
              onClick={onRestart}
            >
              重新开始
            </button>
          </>
        )}

        {/* Error: retry */}
        {promoPhase === "error" && (
          <div style={{ textAlign: "center", padding: "24px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--wp-error)" }}>
              生成失败
            </div>
            <div className="wp-note" style={{ fontSize: 12, marginBottom: 16 }}>
              AI 暂时无法完成生成，请重试
            </div>
            <button
              className="wp-btn wp-btn--primary"
              style={{ width: "100%" }}
              onClick={onConfirm}
            >
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

PromoRightPanel.displayName = "PromoRightPanel";
