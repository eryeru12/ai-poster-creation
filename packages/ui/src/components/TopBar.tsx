import React from "react";
import type { AppPhase } from "@ai-poster/shared";

export interface TopBarProps {
  appPhase: AppPhase;
  posterPhase?: "generation" | "editing";
  onNewCreation?: () => void;
  onBackToDashboard?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onExport?: (format: "png" | "jpg") => void;
}

export function TopBar({
  appPhase,
  posterPhase,
  onNewCreation,
  onBackToDashboard,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
}: TopBarProps) {
  return (
    <header
      className="wp-glass"
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        borderBottom: "1px solid var(--wp-border)",
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Back button for promo */}
        {appPhase === "promo" && onBackToDashboard && (
          <button className="wp-btn wp-btn--sm wp-btn--quiet" onClick={onBackToDashboard}>
            ← 返回仪表盘
          </button>
        )}

        {/* Back button for poster generation */}
        {appPhase === "poster" && posterPhase === "generation" && onBackToDashboard && (
          <button className="wp-btn wp-btn--sm wp-btn--quiet" onClick={onBackToDashboard}>
            ← 返回仪表盘
          </button>
        )}

        {/* Logo */}
        <span
          className="wp-h2"
          style={{
            background: "var(--wp-primary-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          🍊 AI 海报生成器
        </span>

        {/* Poster editing actions */}
        {appPhase === "poster" && posterPhase === "editing" && (
          <>
            <div style={{ width: 1, height: 20, background: "var(--wp-border)", margin: "0 4px" }} />
            {onBackToDashboard && (
              <button className="wp-btn wp-btn--sm wp-btn--quiet" onClick={onBackToDashboard}>
                ← 仪表盘
              </button>
            )}
            <button className="wp-btn wp-btn--sm wp-btn--quiet" onClick={onSave}>
              💾 保存
            </button>
            <button
              className="wp-btn wp-btn--sm wp-btn--quiet wp-btn--icon"
              onClick={onUndo}
              disabled={!canUndo}
              title="撤销 (Ctrl+Z)"
            >
              ↩
            </button>
            <button
              className="wp-btn wp-btn--sm wp-btn--quiet wp-btn--icon"
              onClick={onRedo}
              disabled={!canRedo}
              title="重做 (Ctrl+Shift+Z)"
            >
              ↪
            </button>
          </>
        )}
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Dashboard: New creation button */}
        {appPhase === "dashboard" && onNewCreation && (
          <button className="wp-btn wp-btn--primary" onClick={onNewCreation}>
            + 新建创作
          </button>
        )}

        {/* Poster editing: export buttons */}
        {appPhase === "poster" && posterPhase === "editing" && onExport && (
          <>
            <button className="wp-btn wp-btn--primary wp-btn--sm" onClick={() => onExport("png")}>
              导出 PNG
            </button>
            <button className="wp-btn wp-btn--sm" onClick={() => onExport("jpg")}>
              导出 JPG
            </button>
          </>
        )}
      </div>
    </header>
  );
}
