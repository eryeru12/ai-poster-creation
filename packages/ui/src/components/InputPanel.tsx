import React from "react";
import type { CopyContent } from "@ai-poster/shared";

interface InputPanelProps {
  theme: string;
  scene: string;
  style: string;
  size: { width: number; height: number };
  isGeneratingCopy: boolean;
  copy: CopyContent | null;
  onThemeChange: (v: string) => void;
  onSceneChange: (v: string) => void;
  onStyleChange: (v: string) => void;
  onSizeChange: (v: { width: number; height: number }) => void;
  onReferenceImageChange: (f: File | null) => void;
  onGenerateCopy: () => void;
  onGenerateImages: () => void;
  onCopyChange: (copy: CopyContent) => void;
}

const STYLES = ["简约", "高级", "活泼", "商务", "国风", "科技", "清新", "复古"];
const SIZES = [
  { label: "竖版海报 (1080×1920)", width: 1080, height: 1920 },
  { label: "横版海报 (1920×1080)", width: 1920, height: 1080 },
  { label: "方形 (1080×1080)", width: 1080, height: 1080 },
  { label: "小红书 (1242×1660)", width: 1242, height: 1660 },
];

export function InputPanel({
  theme,
  scene,
  style,
  size,
  isGeneratingCopy,
  copy,
  onThemeChange,
  onSceneChange,
  onStyleChange,
  onSizeChange,
  onReferenceImageChange,
  onGenerateCopy,
  onGenerateImages,
  onCopyChange,
}: InputPanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="wp-card" style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div className="wp-h1" style={{ marginBottom: 4 }}>创建海报</div>
          <div className="wp-note">输入需求，AI 帮你生成海报</div>
        </div>

        <div className="wp-stack" style={{ gap: 16 }}>
          {/* Theme */}
          <div>
            <label className="wp-note" style={{ display: "block", marginBottom: 4 }}>海报主题</label>
            <input
              className="wp-field"
              placeholder="例：新品上市、618大促、中秋活动"
              value={theme}
              onChange={(e) => onThemeChange(e.target.value)}
            />
          </div>

          {/* Scene */}
          <div>
            <label className="wp-note" style={{ display: "block", marginBottom: 4 }}>使用场景</label>
            <input
              className="wp-field"
              placeholder="例：朋友圈推广、门店展示、电商详情"
              value={scene}
              onChange={(e) => onSceneChange(e.target.value)}
            />
          </div>

          {/* Style */}
          <div>
            <label className="wp-note" style={{ display: "block", marginBottom: 4 }}>风格偏好</label>
            <div className="wp-seg" style={{ flexWrap: "wrap" }}>
              {STYLES.map((s) => (
                <button
                  key={s}
                  aria-selected={style === s}
                  onClick={() => onStyleChange(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="wp-note" style={{ display: "block", marginBottom: 4 }}>海报尺寸</label>
            <select
              className="wp-field"
              value={`${size.width}x${size.height}`}
              onChange={(e) => {
                const [w, h] = e.target.value.split("x").map(Number);
                onSizeChange({ width: w, height: h });
              }}
            >
              {SIZES.map((s) => (
                <option key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reference Image */}
          <div>
            <label className="wp-note" style={{ display: "block", marginBottom: 4 }}>参考图（可选）</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => onReferenceImageChange(e.target.files?.[0] || null)}
            />
            <div
              className="wp-slot"
              onClick={() => fileInputRef.current?.click()}
            >
              📷 点击上传参考图
            </div>
          </div>

          {/* Buttons */}
          {!copy && (
            <button
              className="wp-btn wp-btn--primary wp-btn--lg"
              style={{ width: "100%" }}
              onClick={onGenerateCopy}
              disabled={isGeneratingCopy || !theme || !scene || !style}
            >
              {isGeneratingCopy ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="wp-skel" style={{ width: 60, height: 8, display: "inline-block" }} />
                  文案生成中...
                </span>
              ) : (
                "✨ 开始生成"
              )}
            </button>
          )}

          {/* Copy Preview */}
          {copy && (
            <div className="wp-panel" style={{ padding: 14 }}>
              <div className="wp-label" style={{ marginBottom: 8 }}>生成文案</div>
              <div className="wp-stack" style={{ gap: 6, fontSize: 13 }}>
                <div><span style={{ color: "var(--wp-text-tertiary)" }}>主标题：</span><strong>{copy.mainTitle}</strong></div>
                {copy.subTitle && <div><span style={{ color: "var(--wp-text-tertiary)" }}>副标题：</span>{copy.subTitle}</div>}
                {copy.hookLine && <div><span style={{ color: "var(--wp-text-tertiary)" }}>引流句：</span>{copy.hookLine}</div>}
                {copy.activityInfo && <div><span style={{ color: "var(--wp-text-tertiary)" }}>活动信息：</span>{copy.activityInfo}</div>}
                {copy.footerNote && <div><span style={{ color: "var(--wp-text-tertiary)" }}>备注：</span>{copy.footerNote}</div>}
              </div>
              <button
                className="wp-btn wp-btn--primary wp-btn--lg"
                style={{ width: "100%", marginTop: 12 }}
                onClick={onGenerateImages}
              >
                生成 8 种版式底图
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
