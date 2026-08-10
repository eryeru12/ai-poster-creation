import React from "react";
import type { CopyContent, TextElement } from "@ai-poster/shared";

export interface CopyPanelProps {
  copy: CopyContent | null;
  textElements: TextElement[];
  onCopyChange: (copy: CopyContent) => void;
  onTextElementsChange: (elements: TextElement[]) => void;
}

const FIELDS: { key: keyof CopyContent; label: string }[] = [
  { key: "mainTitle", label: "主标题" },
  { key: "subTitle", label: "副标题" },
  { key: "hookLine", label: "引流句" },
  { key: "activityInfo", label: "活动信息" },
  { key: "footerNote", label: "底部备注" },
];

export function CopyPanel({ copy, textElements, onCopyChange, onTextElementsChange }: CopyPanelProps) {
  if (!copy) {
    return (
      <div className="wp-note" style={{ textAlign: "center", padding: 20 }}>
        暂无文案，请先生成
      </div>
    );
  }

  const handleFieldChange = (field: keyof CopyContent, value: string) => {
    const newCopy = { ...copy, [field]: value };
    onCopyChange(newCopy);

    // Sync to text elements
    const newElements = textElements.map((el) => {
      if (el.fieldKey === field) {
        return { ...el, text: value };
      }
      return el;
    });
    onTextElementsChange(newElements);
  };

  return (
    <div className="wp-stack" style={{ padding: 14, gap: 14 }}>
      {FIELDS.map(({ key, label }) => (
        <div key={key}>
          <label className="wp-label" style={{ display: "block", marginBottom: 4 }}>{label}</label>
          {key === "activityInfo" || key === "footerNote" ? (
            <textarea
              className="wp-field"
              value={copy[key] || ""}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              rows={2}
            />
          ) : (
            <input
              className="wp-field"
              value={copy[key] || ""}
              onChange={(e) => handleFieldChange(key, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
