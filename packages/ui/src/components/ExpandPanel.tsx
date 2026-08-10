import React from "react";

export interface ExpandPanelProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export function ExpandPanel({ isOpen, title, onClose, children }: ExpandPanelProps) {
  return (
    <div
      style={{
        width: isOpen ? 328 : 0,
        flexShrink: 0,
        overflow: "hidden",
        opacity: isOpen ? 1 : 0,
        transition: "width 300ms ease-in-out, opacity 300ms ease-in-out",
        background: "var(--wp-surface)",
        borderRight: isOpen ? "1px solid var(--wp-border)" : "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="wp-spread"
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--wp-border)",
          flexShrink: 0,
        }}
      >
        <span className="wp-h3" style={{ fontSize: 14 }}>{title}</span>
        <button className="wp-btn wp-btn--sm wp-btn--quiet wp-btn--icon" onClick={onClose}>
          ✕
        </button>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
}
