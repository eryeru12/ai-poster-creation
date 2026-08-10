import React from "react";

interface ModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mode: "poster" | "promo") => void;
}

export function ModeSelector({ isOpen, onClose, onSelect }: ModeSelectorProps) {
  if (!isOpen) return null;

  return (
    <div
      className="wp-scrim"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        animation: "wp-fade-in 200ms ease",
      }}
      onClick={onClose}
    >
      <div
        className="wp-card"
        style={{
          width: 520,
          padding: 32,
          borderRadius: "var(--wp-radius-xl)",
          boxShadow: "var(--wp-shadow-elevated)",
          background: "var(--wp-surface)",
          animation: "wp-scale-in 300ms ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span className="wp-h2">选择创作类型</span>
          <button className="wp-btn wp-btn--sm wp-btn--quiet wp-btn--icon" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Mode cards */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          {/* Poster */}
          <button
            className="wp-mode-card"
            onClick={() => onSelect("poster")}
            style={{
              width: 220,
              height: 260,
              padding: 24,
              borderRadius: "var(--wp-radius-lg)",
              border: "2px solid var(--wp-border)",
              background: "var(--wp-surface)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              textAlign: "center",
              fontFamily: "inherit",
              transition: "transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease",
            }}
          >
            <div style={{ fontSize: 64 }}>🎨</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--wp-text-primary)" }}>海报制作</div>
            <div style={{ fontSize: 13, color: "var(--wp-text-tertiary)", lineHeight: 1.6 }}>
              AI 生成 8 种版式<br />
              在线编辑微调<br />
              文案精准嵌入
            </div>
          </button>

          {/* Promo */}
          <button
            className="wp-mode-card"
            onClick={() => onSelect("promo")}
            style={{
              width: 220,
              height: 260,
              padding: 24,
              borderRadius: "var(--wp-radius-lg)",
              border: "2px solid var(--wp-border)",
              background: "var(--wp-surface)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              textAlign: "center",
              fontFamily: "inherit",
              transition: "transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease",
            }}
          >
            <div style={{ fontSize: 64 }}>📦</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--wp-text-primary)" }}>宣传图制作</div>
            <div style={{ fontSize: 13, color: "var(--wp-text-tertiary)", lineHeight: 1.6 }}>
              上传商品图片<br />
              AI 生成宣传图<br />
              自动输出文案
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

ModeSelector.displayName = "ModeSelector";
