import React, { useState } from "react";
import type { TextElement } from "@ai-poster/shared";

interface PropertiesPanelProps {
  selectedElement: TextElement | null;
  onElementChange: (id: string, updates: Partial<TextElement>) => void;
}

type TabId = "content" | "style";

const FONTS = [
  { label: "系统默认", value: "sans-serif" },
  { label: "宋体", value: "SimSun, serif" },
  { label: "黑体", value: "SimHei, sans-serif" },
  { label: "微软雅黑", value: "Microsoft YaHei, sans-serif" },
  { label: "楷体", value: "KaiTi, serif" },
];

const COLORS = [
  "#2D2D2D", "#FF6B6B", "#FF8E53", "#FFD93D", "#4ECDC4",
  "#6CCFFF", "#FFFFFF", "#7B6F6B",
];

export function PropertiesPanel({ selectedElement, onElementChange }: PropertiesPanelProps) {
  const [tab, setTab] = useState<TabId>("style");

  if (!selectedElement) {
    return (
      <div
        style={{
          width: 280,
          flexShrink: 0,
          height: "100%",
          background: "var(--wp-surface)",
          borderLeft: "1px solid var(--wp-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div className="wp-note" style={{ textAlign: "center" }}>
          点击画布上的文字进行编辑
        </div>
      </div>
    );
  }

  const fieldLabel =
    selectedElement.fieldKey === "mainTitle" ? "主标题" :
    selectedElement.fieldKey === "subTitle" ? "副标题" :
    selectedElement.fieldKey === "hookLine" ? "引流句" :
    selectedElement.fieldKey === "activityInfo" ? "活动信息" : "底部备注";

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        height: "100%",
        background: "var(--wp-surface)",
        borderLeft: "1px solid var(--wp-border)",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      {/* Tabs */}
      <div className="wp-tabs" style={{ flexShrink: 0 }}>
        <button aria-selected={tab === "content"} onClick={() => setTab("content")}>
          属性
        </button>
        <button aria-selected={tab === "style"} onClick={() => setTab("style")}>
          样式
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
        {/* Content Tab */}
        {tab === "content" && (
          <div className="wp-stack" style={{ gap: 14 }}>
            <div className="wp-label">{fieldLabel}</div>
            <textarea
              className="wp-field"
              value={selectedElement.text}
              onChange={(e) => onElementChange(selectedElement.id, { text: e.target.value })}
              rows={3}
            />
            <div className="wp-note">修改内容将同步到画布和文案面板</div>
          </div>
        )}

        {/* Style Tab */}
        {tab === "style" && (
          <div className="wp-stack" style={{ gap: 16 }}>
            {/* Font */}
            <div>
              <label className="wp-label" style={{ display: "block", marginBottom: 4 }}>字体</label>
              <select
                className="wp-field"
                value={selectedElement.fontFamily}
                onChange={(e) => onElementChange(selectedElement.id, { fontFamily: e.target.value })}
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div className="wp-formrow">
              <span>字号</span>
              <input
                className="wp-field wp-field--num"
                type="number"
                value={selectedElement.fontSize}
                onChange={(e) => onElementChange(selectedElement.id, { fontSize: Number(e.target.value) })}
                min={8}
                max={200}
              />
            </div>

            {/* Line Height */}
            <div className="wp-formrow">
              <span>行间距</span>
              <input
                className="wp-field wp-field--num"
                type="number"
                value={selectedElement.lineHeight || 1.3}
                onChange={(e) => onElementChange(selectedElement.id, { lineHeight: Number(e.target.value) })}
                min={1.0}
                max={3.0}
                step={0.1}
              />
            </div>

            {/* Color */}
            <div>
              <label className="wp-label" style={{ display: "block", marginBottom: 6 }}>颜色</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: "var(--wp-radius-sm)",
                      background: c,
                      border: selectedElement.color === c
                        ? "2px solid var(--wp-selection)"
                        : "1px solid var(--wp-border)",
                      cursor: "pointer",
                      boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px var(--wp-border)" : undefined,
                    }}
                    onClick={() => onElementChange(selectedElement.id, { color: c })}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Text Align */}
            <div>
              <label className="wp-label" style={{ display: "block", marginBottom: 4 }}>对齐</label>
              <div className="wp-seg">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    aria-selected={selectedElement.textAlign === align}
                    onClick={() => onElementChange(selectedElement.id, { textAlign: align })}
                  >
                    {align === "left" ? "左" : align === "center" ? "中" : "右"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
