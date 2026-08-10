import React from "react";

export type NavIcon = "posters" | "copy" | "layers" | "export";

export interface LeftNavProps {
  activeNav: NavIcon | null;
  onNavChange: (icon: NavIcon) => void;
}

const ITEMS: { id: NavIcon; icon: string; label: string }[] = [
  { id: "posters", icon: "🖼", label: "版式" },
  { id: "copy", icon: "📝", label: "文案" },
  { id: "layers", icon: "📑", label: "图层" },
  { id: "export", icon: "📤", label: "导出" },
];

export function LeftNav({ activeNav, onNavChange }: LeftNavProps) {
  return (
    <nav
      className="wp-glass"
      style={{
        width: 80,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 12,
        gap: 4,
        borderRight: "1px solid var(--wp-border)",
      }}
    >
      {ITEMS.map((item) => (
        <button
          key={item.id}
          className={`wp-nav-icon ${activeNav === item.id ? "wp-nav-icon--active" : ""}`}
          onClick={() => onNavChange(item.id)}
          title={item.label}
        >
          <span className="wp-nav-icon__icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
