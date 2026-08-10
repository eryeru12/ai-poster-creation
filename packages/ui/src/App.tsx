import React, { useState, useCallback, useEffect, useRef } from "react";
import type {
  CopyContent,
  GeneratedImage,
  TextElement,
  ProjectState,
  AppPhase,
} from "@ai-poster/shared";
import { LAYOUTS } from "@ai-poster/shared";
import { TopBar } from "./components/TopBar";
import { LeftNav, type NavIcon } from "./components/LeftNav";
import { ExpandPanel } from "./components/ExpandPanel";
import { CopyPanel } from "./components/CopyPanel";
import { InputPanel } from "./components/InputPanel";
import { LayoutGrid } from "./components/LayoutGrid";
import { ProgressBar } from "./components/ProgressBar";
import { CanvasPanel } from "./components/CanvasPanel";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { ThumbnailStrip } from "./components/ThumbnailStrip";
import { Dashboard } from "./components/Dashboard";
import { ModeSelector } from "./components/ModeSelector";
import { PromoCreator } from "./components/PromoCreator";
import { usePromoGeneration } from "./hooks/usePromoGeneration";

type PosterPhase = "generation" | "editing";
type GenSubPhase = "input" | "generating" | "layout_select";

interface JobStatus {
  jobId: string;
  status: string;
  progress: number;
  total: number;
  images: Array<{
    layoutId: string;
    imagePath: string;
    status: string;
  }>;
}

interface DashboardItem {
  id: string;
  type: "poster" | "promo";
  title: string;
  thumbnailPath?: string;
  createdAt: string;
  updatedAt: string;
}

export default function App() {
  // === Top-level phase ===
  const [appPhase, setAppPhase] = useState<AppPhase>("dashboard");

  // === Dashboard state ===
  const [projects, setProjects] = useState<DashboardItem[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [modeSelectorOpen, setModeSelectorOpen] = useState(false);

  // === Poster state ===
  const [posterPhase, setPosterPhase] = useState<PosterPhase>("generation");
  const [genSubPhase, setGenSubPhase] = useState<GenSubPhase>("input");
  const [projectId, setProjectId] = useState<string>("");
  const [theme, setTheme] = useState("");
  const [scene, setScene] = useState("");
  const [style, setStyle] = useState("");
  const [size, setSize] = useState({ width: 1080, height: 1920 });
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [copy, setCopy] = useState<CopyContent | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<NavIcon | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>("");

  // === Promo state (via hook) ===
  const promo = usePromoGeneration();

  // === Undo/redo stacks (poster editing) ===
  const undoStack = useRef<TextElement[][]>([]);
  const redoStack = useRef<TextElement[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushUndo = useCallback((elements: TextElement[]) => {
    undoStack.current.push(elements);
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  // === Load dashboard projects ===
  const loadProjects = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.items || []);
      }
    } catch {
      // Keep stale list on error
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (appPhase === "dashboard") {
      loadProjects();
    }
  }, [appPhase, loadProjects]);

  // === Mode selection handlers ===
  const handleNewCreation = useCallback(() => {
    setModeSelectorOpen(true);
  }, []);

  const handleSelectMode = useCallback((mode: "poster" | "promo") => {
    setModeSelectorOpen(false);
    if (mode === "poster") {
      setPosterPhase("generation");
      setGenSubPhase("input");
      setAppPhase("poster");
    } else {
      promo.initNewPromo();
      setAppPhase("promo");
    }
  }, [promo]);

  // === Open existing project ===
  const handleOpenProject = useCallback(async (item: DashboardItem) => {
    try {
      if (item.type === "poster") {
        const res = await fetch(`/api/project/${item.id}`);
        if (!res.ok) throw new Error("Not found");
        const state: ProjectState = await res.json();
        setProjectId(item.id);
        setTheme(state.input?.theme || "");
        setScene(state.input?.scene || "");
        setStyle(state.input?.style || "");
        setSize(state.input?.size || { width: 1080, height: 1920 });
        if (state.copy) setCopy(state.copy);
        if (state.generatedImages) setGeneratedImages(state.generatedImages);
        if (state.selectedLayout) setSelectedLayout(state.selectedLayout);
        if (state.textElements) setTextElements(state.textElements);
        if (state.selectedLayout && state.textElements?.length) {
          setPosterPhase("editing");
        } else if (state.generatedImages?.length) {
          setPosterPhase("generation");
          setGenSubPhase("layout_select");
        } else {
          setPosterPhase("generation");
          setGenSubPhase("input");
        }
        setAppPhase("poster");
      } else if (item.type === "promo") {
        const res = await fetch(`/api/promo/${item.id}`);
        if (!res.ok) throw new Error("Not found");
        const state = await res.json();
        promo.restorePromo(state);
        setAppPhase("promo");
      }
    } catch {
      setError("项目未找到");
    }
  }, [promo]);

  // === Back to dashboard ===
  const handleBackToDashboard = useCallback(async () => {
    if (appPhase === "poster" && projectId) {
      await handleSave();
    } else if (appPhase === "promo" && promo.promoId) {
      await promo.handleSavePromo();
    }
    setAppPhase("dashboard");
  }, [appPhase, projectId, promo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== POSTER HANDLERS =====

  const handleGenerateCopy = useCallback(async () => {
    if (!theme || !scene || !style) return;
    setIsGeneratingCopy(true);
    setError(null);
    try {
      const res = await fetch("/api/generate/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, scene, style }),
      });
      if (!res.ok) throw new Error("Failed to generate copy");
      const data = await res.json();
      setCopy(data.copy);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copy generation failed");
    } finally {
      setIsGeneratingCopy(false);
    }
  }, [theme, scene, style]);

  const handleGenerateImages = useCallback(async () => {
    setGenSubPhase("generating");
    setError(null);
    try {
      const params: Record<string, unknown> = { style, size };
      if (referenceImage) {
        const formData = new FormData();
        formData.append("image", referenceImage);
        const uploadRes = await fetch("/api/upload/reference", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const { path } = await uploadRes.json();
          params.referenceImage = { path, mode: "composition" };
        }
      }
      const body = {
        requestId: `req-${Date.now()}`,
        params,
      };
      const res = await fetch("/api/generate/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to start generation");
      const { jobId } = await res.json();
      pollJobStatus(jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setGenSubPhase("input");
    }
  }, [style, size, referenceImage]);

  const pollJobStatus = useCallback((jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/job/${jobId}/status`);
        const data = (await res.json()) as JobStatus;
        setJobStatus(data);
        if (data.images.length > 0) {
          setGeneratedImages((prev) => {
            const map = new Map(prev.map((i) => [i.layoutId, i]));
            for (const img of data.images) {
              if (img.status === "succeeded") {
                map.set(img.layoutId, {
                  layoutId: img.layoutId,
                  imagePath: img.imagePath,
                  status: "succeeded",
                });
              }
            }
            return Array.from(map.values());
          });
        }
        if (data.status === "succeeded" || data.status === "failed") {
          clearInterval(interval);
          if (data.status === "succeeded") {
            setGenSubPhase("layout_select");
          } else {
            setError("Some images failed to generate");
          }
        }
      } catch {
        clearInterval(interval);
        setError("Lost connection to generation job");
      }
    }, 1000);
  }, []);

  const handleSelectLayout = useCallback(
    (layoutId: string) => {
      setSelectedLayout(layoutId);
      if (copy) {
        const layout = LAYOUTS.find((l) => l.layoutId === layoutId);
        if (layout) {
          const elements: TextElement[] = [];
          const fields = [
            "mainTitle",
            "subTitle",
            "hookLine",
            "activityInfo",
            "footerNote",
          ] as const;
          for (const field of fields) {
            const zone = layout.constraintZones[field];
            const text = copy[field];
            if (zone && text) {
              elements.push({
                id: `${layoutId}-${field}`,
                fieldKey: field,
                text,
                x: zone.x,
                y: zone.y,
                width: zone.width,
                height: zone.height,
                fontSize: field === "mainTitle" ? 48 : 24,
                fontFamily: "sans-serif",
                color: "#2D2D2D",
                textAlign: "center" as const,
              });
            }
          }
          setTextElements(elements);
          undoStack.current = [];
          redoStack.current = [];
          setCanUndo(false);
          setCanRedo(false);
        }
      }
    },
    [copy]
  );

  const handleStartEdit = useCallback(() => {
    setPosterPhase("editing");
    setGenSubPhase("input");
  }, []);

  const handleSave = useCallback(async () => {
    if (!projectId && !theme) return;
    const pid = projectId || `proj-${Date.now()}`;
    if (!projectId) setProjectId(pid);

    setSaveStatus("保存中...");
    const state: Partial<ProjectState> = {
      title: theme || "Untitled Poster",
      input: { theme, scene, style, size },
      copy: copy || undefined,
      selectedLayout: selectedLayout || undefined,
      generatedImages,
      textElements,
    };
    try {
      await fetch(`/api/project/${pid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const now = new Date().toLocaleTimeString();
      setSaveStatus(`已自动保存 ${now}`);
    } catch {
      setSaveStatus("保存失败");
    }
  }, [projectId, theme, scene, style, size, copy, selectedLayout, generatedImages, textElements]);

  // Auto-save for poster editing
  useEffect(() => {
    if (appPhase === "poster" && posterPhase === "editing") {
      const timer = setTimeout(handleSave, 500);
      return () => clearTimeout(timer);
    }
  }, [textElements, selectedLayout, appPhase, posterPhase, handleSave]);

  const handleExport = useCallback(
    async (format: "png" | "jpg") => {
      if (!projectId || !selectedLayout) return;
      setError(null);
      try {
        const res = await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, posterId: selectedLayout, format }),
        });
        if (!res.ok) throw new Error("Export failed");
        const { filePath } = await res.json();
        const a = document.createElement("a");
        a.href = `/api/download?path=${encodeURIComponent(filePath)}`;
        a.download = `poster.${format}`;
        a.click();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Export failed");
      }
    },
    [projectId, selectedLayout]
  );

  const handleUndo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (prev) {
      redoStack.current.push(textElements);
      setTextElements(prev);
      setCanRedo(true);
      setCanUndo(undoStack.current.length > 0);
    }
  }, [textElements]);

  const handleRedo = useCallback(() => {
    const next = redoStack.current.pop();
    if (next) {
      undoStack.current.push(textElements);
      setTextElements(next);
      setCanUndo(true);
      setCanRedo(redoStack.current.length > 0);
    }
  }, [textElements]);

  // Keyboard shortcuts (poster editing only)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, handleUndo, handleRedo]);

  // ===== RENDER: Dashboard =====
  if (appPhase === "dashboard") {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <TopBar appPhase="dashboard" onNewCreation={handleNewCreation} />
        <Dashboard
          projects={projects}
          loading={dashboardLoading}
          onOpenProject={handleOpenProject}
          onNewCreation={handleNewCreation}
        />
        <ModeSelector
          isOpen={modeSelectorOpen}
          onClose={() => setModeSelectorOpen(false)}
          onSelect={handleSelectMode}
        />
      </div>
    );
  }

  // ===== RENDER: Poster =====
  if (appPhase === "poster") {
    if (posterPhase === "generation") {
      return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
          <TopBar appPhase="poster" posterPhase="generation" onBackToDashboard={handleBackToDashboard} />

          <div className="wp-bg-warm" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="wp-float-orb" />
            <div className="wp-float-orb" />
            <div className="wp-float-orb" />
            <div className="wp-float-orb" />

            {error && (
              <div className="wp-toast wp-toast--error" style={{ position: "fixed", top: 64, right: 16, zIndex: 100 }}>
                <span>{error}</span>
                <button className="wp-btn wp-btn--sm wp-btn--quiet" onClick={() => setError(null)}>
                  关闭
                </button>
              </div>
            )}

            {genSubPhase === "input" && (
              <InputPanel
                theme={theme}
                scene={scene}
                style={style}
                size={size}
                isGeneratingCopy={isGeneratingCopy}
                copy={copy}
                onThemeChange={setTheme}
                onSceneChange={setScene}
                onStyleChange={setStyle}
                onSizeChange={setSize}
                onReferenceImageChange={setReferenceImage}
                onGenerateCopy={handleGenerateCopy}
                onGenerateImages={handleGenerateImages}
                onCopyChange={setCopy}
              />
            )}

            {genSubPhase === "generating" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
                <div className="wp-h2">正在生成海报底图...</div>
                <div className="wp-note">8 种版式并行生成中，请稍候</div>
                <div style={{ width: 320 }}>
                  <ProgressBar current={jobStatus?.progress || 0} total={jobStatus?.total || 8} />
                </div>
                {jobStatus && (
                  <div className="wp-note">
                    已完成：{jobStatus.progress}/{jobStatus.total}
                  </div>
                )}
              </div>
            )}

            {genSubPhase === "layout_select" && (
              <LayoutGrid
                images={generatedImages}
                onSelect={handleSelectLayout}
                onStartEdit={handleStartEdit}
              />
            )}
          </div>
        </div>
      );
    }

    // === Editing Phase ===
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <TopBar
          appPhase="poster"
          posterPhase="editing"
          onBackToDashboard={handleBackToDashboard}
          onSave={handleSave}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onExport={handleExport}
        />

        {error && (
          <div className="wp-toast wp-toast--error" style={{ position: "fixed", top: 64, right: 16, zIndex: 100 }}>
            <span>{error}</span>
            <button className="wp-btn wp-btn--sm wp-btn--quiet" onClick={() => setError(null)}>
              关闭
            </button>
          </div>
        )}

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <LeftNav activeNav={activeNav} onNavChange={(icon) => setActiveNav(activeNav === icon ? null : icon)} />

          <ExpandPanel
            isOpen={activeNav !== null}
            title={
              activeNav === "posters" ? "版式列表" :
              activeNav === "copy" ? "文案编辑" :
              activeNav === "layers" ? "图层" : "导出"
            }
            onClose={() => setActiveNav(null)}
          >
            {activeNav === "posters" && (
              <ThumbnailStrip
                images={generatedImages}
                selectedLayout={selectedLayout}
                onSelect={handleSelectLayout}
              />
            )}
            {activeNav === "copy" && (
              <CopyPanel
                copy={copy}
                textElements={textElements}
                onCopyChange={setCopy}
                onTextElementsChange={(els) => {
                  pushUndo(textElements);
                  setTextElements(els);
                }}
              />
            )}
            {activeNav === "layers" && (
              <div className="wp-stack" style={{ padding: 12 }}>
                {textElements.map((el) => (
                  <button
                    key={el.id}
                    className={`wp-btn wp-btn--sm ${el.id === selectedElement ? "wp-btn--primary" : ""}`}
                    onClick={() => setSelectedElement(el.id)}
                  >
                    {el.fieldKey === "mainTitle" ? "主标题" :
                     el.fieldKey === "subTitle" ? "副标题" :
                     el.fieldKey === "hookLine" ? "引流句" :
                     el.fieldKey === "activityInfo" ? "活动信息" : "备注"}
                  </button>
                ))}
                {textElements.length === 0 && (
                  <div className="wp-note" style={{ textAlign: "center", padding: 20 }}>
                    暂无文字元素
                  </div>
                )}
              </div>
            )}
            {activeNav === "export" && (
              <div className="wp-stack" style={{ padding: 16, gap: 12 }}>
                <div className="wp-h3">导出海报</div>
                <button className="wp-btn wp-btn--primary wp-btn--lg" style={{ width: "100%" }} onClick={() => handleExport("png")}>
                  导出 PNG
                </button>
                <button className="wp-btn wp-btn--lg" style={{ width: "100%" }} onClick={() => handleExport("jpg")}>
                  导出 JPG
                </button>
              </div>
            )}
          </ExpandPanel>

          <div style={{ flex: 1, minWidth: 0 }}>
            <CanvasPanel
              phase={posterPhase}
              selectedLayout={selectedLayout}
              generatedImages={generatedImages}
              textElements={textElements}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              onMoveElement={(id, x, y) => {
                pushUndo(textElements);
                setTextElements((prev) =>
                  prev.map((el) => (el.id === id ? { ...el, x, y } : el))
                );
              }}
              onResizeElement={(id, width, height) => {
                pushUndo(textElements);
                setTextElements((prev) =>
                  prev.map((el) => (el.id === id ? { ...el, width, height } : el))
                );
              }}
            />
          </div>

          <PropertiesPanel
            selectedElement={selectedElement ? textElements.find((e) => e.id === selectedElement) || null : null}
            onElementChange={(id, updates) => {
              pushUndo(textElements);
              setTextElements((prev) =>
                prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
              );
            }}
          />
        </div>

        <div className="wp-statusbar">
          <span>{projectId || "新项目"}</span>
          <span>{saveStatus}</span>
        </div>
      </div>
    );
  }

  // ===== RENDER: Promo =====

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar appPhase="promo" onBackToDashboard={handleBackToDashboard} />

      {(promo.error || error) && (
        <div className="wp-toast wp-toast--error" style={{ position: "fixed", top: 64, right: 16, zIndex: 100 }}>
          <span>{promo.error || error}</span>
          <button className="wp-btn wp-btn--sm wp-btn--quiet" onClick={() => { promo.setError(null); setError(null); }}>
            关闭
          </button>
        </div>
      )}

      <PromoCreator
          promoPhase={promo.promoPhase}
          productImage={promo.productImage}
          productImagePreview={promo.productImagePreview}
          promoPrompt={promo.promoPrompt}
          promoImage={promo.promoImage}
          promoCopy={promo.promoCopy}
          promoJobStatus={promo.promoJobStatus}
          currentStep={promo.currentStep}
          stepImages={promo.stepImages}
          phaseOperations={promo.phaseOperations}
          selectedOptions={promo.selectedOptions}
          detailPageImages={promo.detailPageImages}
          phaseHistory={promo.phaseHistory}
          onImageUpload={promo.handlePromoImageUpload}
          onPromptChange={promo.handlePromoPromptChange}
          onGenerate={promo.handlePromoGenerate}
          onCancel={promo.handlePromoCancel}
          onRegenerate={promo.handlePromoRegenerate}
          onExport={promo.handlePromoExport}
          onSelectOption={promo.handleSelectOption}
          onConfirmOptimize={promo.handleConfirmOptimize}
          onDetailPagesGenerate={promo.handleDetailPagesGenerate}
          onGoToStep={promo.handleGoToStep}
          onGoToDetail={promo.handleGoToDetail}
          userSupplement={promo.userSupplement}
          onUserSupplementChange={promo.setUserSupplement}
          initialCandidates={promo.initialCandidates}
          onSelectInitialImage={promo.handleSelectInitialImage}
        />
    </div>
  );
}
