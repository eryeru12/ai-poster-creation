import React from "react";
import type { DashboardItem } from "@ai-poster/shared";

interface DashboardProps {
  projects: DashboardItem[];
  loading: boolean;
  onOpenProject: (item: DashboardItem) => void;
  onNewCreation: () => void;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

export function Dashboard({ projects, loading, onOpenProject, onNewCreation }: DashboardProps) {
  // Loading state
  if (loading) {
    return (
      <div className="wp-bg-warm" style={{ flex: 1, padding: 24 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div className="wp-skel" style={{ width: 180, height: 28, borderRadius: 8 }} />
            <div className="wp-skel" style={{ width: 120, height: 40, borderRadius: 12 }} />
          </div>
          <div className="wp-dashboard-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="wp-card" style={{ width: 200, height: 220 }}>
                <div className="wp-skel" style={{ width: "100%", height: 150 }} />
                <div style={{ padding: 8 }}>
                  <div className="wp-skel" style={{ width: "60%", height: 16, borderRadius: 4, marginBottom: 8 }} />
                  <div className="wp-skel" style={{ width: "40%", height: 12, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="wp-bg-warm" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="wp-dashboard-empty" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎨</div>
          <div className="wp-h2" style={{ marginBottom: 8 }}>还没有作品</div>
          <div className="wp-body" style={{ color: "var(--wp-text-tertiary)", marginBottom: 24 }}>
            创建你的第一张海报或商品宣传图
          </div>
          <button className="wp-btn wp-btn--primary wp-btn--lg" onClick={onNewCreation}>
            + 新建创作
          </button>
        </div>
      </div>
    );
  }

  // Project list
  return (
    <div className="wp-bg-warm" style={{ flex: 1, overflow: "auto" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span className="wp-h2">📊 我的作品</span>
            <span className="wp-note" style={{ color: "var(--wp-text-tertiary)" }}>
              {projects.length} 个作品
            </span>
          </div>
          <button className="wp-btn wp-btn--primary" onClick={onNewCreation}>
            + 新建创作
          </button>
        </div>

        <div className="wp-dashboard-grid">
          {projects.map((item) => (
            <button
              key={item.id}
              className="wp-dashboard-card"
              onClick={() => onOpenProject(item)}
              style={{
                width: 200,
                height: 220,
                display: "flex",
                flexDirection: "column",
                textAlign: "left",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {/* Thumbnail */}
              <div
                className="wp-dashboard-card__thumb"
                style={{
                  width: "100%",
                  height: 150,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  background: item.type === "poster"
                    ? "linear-gradient(135deg, #FFF0E8, #FFE0D0)"
                    : "linear-gradient(135deg, #E8FFF4, #D0FFE8)",
                }}
              >
                {item.type === "poster" ? "🎨" : "📦"}
              </div>

              {/* Info */}
              <div style={{ padding: "8px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    className={item.type === "poster" ? "wp-badge--poster" : "wp-badge--promo"}
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: "18px",
                      background: item.type === "poster" ? "#FFF0E8" : "#E8FFF4",
                      color: item.type === "poster" ? "#FF6B6B" : "#4ECDC4",
                    }}
                  >
                    {item.type === "poster" ? "海报" : "宣传图"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--wp-text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.title || "未命名"}
                </div>
                <div style={{ fontSize: 12, color: "var(--wp-text-tertiary)" }}>
                  {formatDate(item.updatedAt) || formatDate(item.createdAt)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Dashboard.displayName = "Dashboard";
