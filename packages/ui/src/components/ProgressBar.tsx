import React from "react";

interface ProgressBarProps {
  current: number;
  total: number;
  mode?: "poster" | "promo";
}

export function ProgressBar({ current, total, mode = "poster" }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const isIndeterminate = mode === "promo" || (current === 0 && total > 0);

  return (
    <div className="wp-stack" style={{ gap: 8, alignItems: "center" }}>
      <div className={`wp-bar ${isIndeterminate ? "wp-bar--indet" : ""}`} style={{ width: "100%" }}>
        <i style={{ width: isIndeterminate ? undefined : `${pct}%` }} />
      </div>
      {mode === "poster" && (
        <div className="wp-note wp-num" style={{ textAlign: "center" }}>
          {current}/{total}
        </div>
      )}
      {mode === "promo" && (
        <div className="wp-note" style={{ textAlign: "center" }}>
          正在生成宣传图...
        </div>
      )}
    </div>
  );
}
