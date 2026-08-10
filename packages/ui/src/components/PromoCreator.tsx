import React, { useState, useRef, useCallback } from "react";
import type { PromoPhase, PromoCopyContent, PhaseOperations, OptimizationOperation, StepImage, DetailPageImage, OptimizationPhase } from "@ai-poster/shared";
import { ProgressBar } from "./ProgressBar";
import { PromoStepSidebar } from "./PromoStepSidebar";
import { PromoRightPanel } from "./PromoRightPanel";
import { PromoOptimizing } from "./PromoOptimizing";
import { PromoDetailPages } from "./PromoDetailPages";
import { PromoInitialSelection } from "./PromoInitialSelection";

interface PromoImage {
  imagePath: string;
  width: number;
  height: number;
  suggestion?: string;
}

interface PromoJobStatus {
  jobId: string;
  status: string;
  progress: number;
  total?: number;
}

interface PromoCreatorProps {
  promoPhase: PromoPhase;
  productImage: File | null;
  productImagePreview: string;
  promoPrompt: string;
  promoImage: PromoImage | null;
  promoCopy: PromoCopyContent | null;
  promoJobStatus: PromoJobStatus | null;
  currentStep: number;
  stepImages: StepImage[];
  phaseOperations: PhaseOperations | null;
  selectedOptions: Record<string, string>;
  detailPageImages: DetailPageImage[];
  phaseHistory: Array<{ step: number; phase: OptimizationPhase; operations: OptimizationOperation[]; selectedOptions: Record<string, string> }>;
  onImageUpload: (file: File) => void;
  onPromptChange: (text: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
  onRegenerate: () => void;
  onExport: (format: "png" | "jpg") => void;
  userSupplement: string;
  onSelectOption: (operationId: string, optionId: string) => void;
  onConfirmOptimize: () => void;
  onDetailPagesGenerate: () => void;
  onGoToStep: (step: number) => void;
  onGoToDetail: () => void;
  onUserSupplementChange: (text: string) => void;
  initialCandidates: Array<{ imagePath: string; status: string; suggestion?: string }>;
  onSelectInitialImage: (imagePath: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const PHASE_GEN_LABELS: Record<number, string> = { 0: "初始图", 1: "风格定调", 2: "结构深化", 3: "电商落地" };
const PHASE_GEN_DESC: Record<number, string> = { 0: "商品图和描述", 1: "风格定调方向", 2: "结构深化方向", 3: "电商落地方向" };

export function PromoCreator({
  promoPhase,
  productImage,
  productImagePreview,
  promoPrompt,
  promoImage,
  promoCopy,
  promoJobStatus,
  currentStep,
  stepImages,
  phaseOperations,
  selectedOptions,
  detailPageImages,
  phaseHistory,
  onImageUpload,
  onPromptChange,
  onGenerate,
  onCancel,
  onRegenerate,
  onExport,
  userSupplement,
  onSelectOption,
  onConfirmOptimize,
  onDetailPagesGenerate,
  onGoToStep,
  onGoToDetail,
  onUserSupplementChange,
  initialCandidates,
  onSelectInitialImage,
}: PromoCreatorProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert("仅支持 PNG、JPG、WebP 格式的图片");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert("图片大小不能超过 10MB");
        return;
      }
      onImageUpload(file);
    },
    [onImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const canGenerate = promoPrompt.trim().length > 0;

  const promoImageUrl = promoImage
    ? `/api/download?path=${encodeURIComponent(promoImage.imagePath)}`
    : "";

  return (
    <div className="wp-bg-warm" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Floating orbs */}
      <div className="wp-float-orb" />
      <div className="wp-float-orb" />
      <div className="wp-float-orb" />

      {/* === PERSISTENT 3-COLUMN LAYOUT === */}
      <div className="wp-promo-layout">
        {/* LEFT: Step sidebar */}
        <PromoStepSidebar
          currentStep={currentStep}
          stepImages={stepImages}
          detailPageImages={detailPageImages}
          phaseHistory={phaseHistory}
          promoPhase={promoPhase}
          initialCandidates={initialCandidates}
          onGoToStep={onGoToStep}
          onGoToDetail={onGoToDetail}
        />

        {/* CENTER: Content varies by phase */}
        <div className="wp-promo-center">
          {/* Input Phase */}
          {promoPhase === "input" && (
            <div className="wp-card" style={{ maxWidth: 520, margin: "0 auto", padding: 32, textAlign: "center" }}>
              <div className="wp-h2" style={{ marginBottom: 24 }}>商品宣传图</div>

              {/* Upload zone */}
              {!productImagePreview ? (
                <div
                  className={`wp-upload-zone ${isDragOver ? "wp-upload-zone--drag" : ""}`}
                  style={{ margin: "0 auto 20px" }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
                  <div>拖拽或点击上传商品图 <span style={{ color: "var(--wp-text-tertiary)" }}>(可选)</span></div>
                  <div style={{ fontSize: 11, color: "var(--wp-text-tertiary)" }}>支持 PNG/JPG/WEBP，最大 10MB</div>
                </div>
              ) : (
                <div style={{ margin: "0 auto 20px", position: "relative", width: 280, height: 280 }}>
                  <img
                    src={productImagePreview}
                    alt="商品预览"
                    className="wp-upload-zone__preview"
                  />
                  <button
                    className="wp-btn wp-btn--sm wp-btn--quiet"
                    style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(255,255,255,0.9)" }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    重新上传
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={handleInputChange}
              />

              {/* Prompt input */}
              <div style={{ marginBottom: 20, textAlign: "left" }}>
                <label className="wp-label" style={{ marginBottom: 6, display: "block" }}>
                  ✏️ 商品特色描述
                </label>
                <textarea
                  className="wp-field"
                  style={{ width: "100%", minHeight: 100, resize: "vertical" }}
                  placeholder="描述商品特色和期望的宣传图风格..."
                  value={promoPrompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  maxLength={500}
                />
                <div style={{ fontSize: 11, color: "var(--wp-text-tertiary)", textAlign: "right", marginTop: 4 }}>
                  {promoPrompt.length}/500
                </div>
              </div>

              {/* Generate button */}
              <button
                className="wp-btn wp-btn--primary wp-btn--lg"
                style={{ width: "100%", background: "var(--wp-primary-gradient)" }}
                disabled={!canGenerate}
                onClick={onGenerate}
              >
                生成宣传图
              </button>
            </div>
          )}

          {/* Generating Phase */}
          {promoPhase === "generating" && (
            <div className="wp-card" style={{ maxWidth: 520, margin: "0 auto", padding: 32, textAlign: "center" }}>
              <div className="wp-h2" style={{ marginBottom: 12 }}>
                {(promoJobStatus?.total && promoJobStatus.total > 1) ? "正在生成详情页..." : `正在生成${PHASE_GEN_LABELS[currentStep] || "图片"}`}
              </div>
              <div className="wp-note" style={{ marginBottom: 24 }}>
                {(promoJobStatus?.total && promoJobStatus.total > 1)
                  ? "AI 正在生成首屏、卖点、规格、售后 4 张详情页"
                  : `AI 正在根据${PHASE_GEN_DESC[currentStep] || "优化方向"}创作新版本`}
              </div>
              <div style={{ width: "100%", marginBottom: 16 }}>
                <ProgressBar
                  mode="promo"
                  current={promoJobStatus?.progress || 0}
                  total={promoJobStatus?.total || 1}
                />
              </div>
              <button className="wp-btn wp-btn--sm wp-btn--quiet" onClick={onCancel}>
                取消生成
              </button>
            </div>
          )}

          {/* Optimizing Phase */}
          {promoPhase === "optimizing" && initialCandidates.length > 1 && stepImages.length === 0 && (
            <PromoInitialSelection
              candidates={initialCandidates}
              onSelect={onSelectInitialImage}
            />
          )}
          {promoPhase === "optimizing" && !(initialCandidates.length > 1 && stepImages.length === 0) && (
            <PromoOptimizing
              currentStep={currentStep}
              stepImages={stepImages}
              currentImageUrl={promoImageUrl}
              phaseHistory={phaseHistory}
              onGoToStep={onGoToStep}
              suggestion={promoImage?.suggestion}
            />
          )}

          {/* Detail Phase */}
          {promoPhase === "detail" && (
            <PromoDetailPages
              stepImages={stepImages}
              detailPageImages={detailPageImages}
              promoJobStatus={promoJobStatus}
              isGenerating={false}
              onGenerate={onDetailPagesGenerate}
              onGoToStep={onGoToStep}
            />
          )}

          {/* Result Phase (legacy) */}
          {promoPhase === "result" && (
            <div className="wp-card" style={{ maxWidth: 640, margin: "0 auto", padding: 32, maxHeight: "85vh", overflow: "auto" }}>
              <div className="wp-h2" style={{ marginBottom: 20, textAlign: "center" }}>生成完成</div>

              {promoImageUrl && (
                <img
                  src={promoImageUrl}
                  alt="宣传图"
                  className="wp-promo-result__image"
                  style={{ display: "block", margin: "0 auto 20px" }}
                />
              )}

              {promoCopy && (
                <div className="wp-promo-result__copy">
                  {promoCopy.promoTitle && (
                    <div className="wp-promo-result__copy-title">{promoCopy.promoTitle}</div>
                  )}
                  {promoCopy.promoDescription && (
                    <div className="wp-promo-result__copy-desc">{promoCopy.promoDescription}</div>
                  )}
                  {promoCopy.promoHighlights && promoCopy.promoHighlights.length > 0 && (
                    <div className="wp-promo-result__highlights">
                      {promoCopy.promoHighlights.map((h, i) => (
                        <span key={i} className="wp-promo-result__highlight-tag">{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {promoImage?.suggestion && (
                <div className="wp-promo-result__suggestion">
                  <div className="wp-promo-result__suggestion-label">AI 优化建议</div>
                  <div className="wp-promo-result__suggestion-text">{promoImage.suggestion}</div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
                <button className="wp-btn wp-btn--quiet" onClick={onRegenerate}>
                  重新生成
                </button>
              </div>
            </div>
          )}

          {/* Error Phase */}
          {promoPhase === "error" && (
            <div className="wp-card" style={{ maxWidth: 480, margin: "0 auto", padding: 32, textAlign: "center", borderColor: "var(--wp-error)", border: "2px solid var(--wp-error)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>😞</div>
              <div className="wp-h2" style={{ marginBottom: 8 }}>生成失败</div>
              <div className="wp-note" style={{ marginBottom: 20 }}>
                AI 暂时无法完成宣传图生成，请检查网络连接或稍后重试
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <button className="wp-btn wp-btn--primary" onClick={onGenerate}>
                  重试
                </button>
                <button className="wp-btn wp-btn--quiet" onClick={onRegenerate}>
                  修改参数
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Contextual panel */}
        <PromoRightPanel
          currentStep={currentStep}
          promoPhase={promoPhase}
          phaseOperations={phaseOperations}
          selectedOptions={selectedOptions}
          userSupplement={userSupplement}
          detailPageImages={detailPageImages}
          promoJobStatus={promoJobStatus}
          initialCandidates={initialCandidates}
          onSelectOption={onSelectOption}
          onConfirm={onConfirmOptimize}
          onRestart={onRegenerate}
          onUserSupplementChange={onUserSupplementChange}
          onExport={onExport}
          onDetailPagesGenerate={onDetailPagesGenerate}
        />
      </div>
    </div>
  );
}

PromoCreator.displayName = "PromoCreator";
