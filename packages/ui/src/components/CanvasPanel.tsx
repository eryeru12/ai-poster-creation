import React, { useRef, useCallback, useState } from "react";
import type { GeneratedImage, TextElement } from "@ai-poster/shared";
import { LAYOUTS } from "@ai-poster/shared";

type AppPhase = "generation" | "editing";

interface CanvasPanelProps {
  phase: AppPhase;
  selectedLayout: string | null;
  generatedImages: GeneratedImage[];
  textElements: TextElement[];
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onResizeElement: (id: string, width: number, height: number) => void;
}

type HandleDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export function CanvasPanel({
  phase,
  selectedLayout,
  generatedImages,
  textElements,
  selectedElement,
  onSelectElement,
  onMoveElement,
  onResizeElement,
}: CanvasPanelProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [resizing, setResizing] = useState<{
    id: string;
    handle: HandleDir;
    startX: number;
    startY: number;
    origW: number;
    origH: number;
    origX: number;
    origY: number;
  } | null>(null);

  const layout = selectedLayout
    ? LAYOUTS.find((l) => l.layoutId === selectedLayout)
    : null;

  const backgroundImage = selectedLayout
    ? generatedImages.find(
        (img) => img.layoutId === selectedLayout && img.status === "succeeded"
      )
    : null;

  // Move handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const el = textElements.find((t) => t.id === id);
      if (!el) return;
      setDragging({ id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y });
      onSelectElement(id);
    },
    [textElements, onSelectElement]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;

      if (dragging) {
        const el = textElements.find((t) => t.id === dragging.id);
        if (!el) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const dx = (e.clientX - dragging.startX) / rect.width;
        const dy = (e.clientY - dragging.startY) / rect.height;
        const layoutDef = selectedLayout
          ? LAYOUTS.find((l) => l.layoutId === selectedLayout)
          : null;
        const zone = layoutDef?.constraintZones[el.fieldKey];
        let newX = dragging.origX + dx;
        let newY = dragging.origY + dy;
        if (zone) {
          newX = Math.max(zone.x, Math.min(zone.x + zone.width - el.width, newX));
          newY = Math.max(zone.y, Math.min(zone.y + zone.height - el.height, newY));
        } else {
          newX = Math.max(0, Math.min(1 - el.width, newX));
          newY = Math.max(0, Math.min(1 - el.height, newY));
        }
        onMoveElement(dragging.id, newX, newY);
      }

      if (resizing) {
        const el = textElements.find((t) => t.id === resizing.id);
        if (!el) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const dx = (e.clientX - resizing.startX) / rect.width;
        const dy = (e.clientY - resizing.startY) / rect.height;
        const layoutDef = selectedLayout
          ? LAYOUTS.find((l) => l.layoutId === selectedLayout)
          : null;
        const zone = layoutDef?.constraintZones[el.fieldKey];

        let newW = resizing.origW;
        let newH = resizing.origH;
        let newX = resizing.origX;
        let newY = resizing.origY;

        const MIN_W = 0.05;
        const MIN_H = 0.03;

        switch (resizing.handle) {
          case "e": newW = Math.max(MIN_W, resizing.origW + dx); break;
          case "w": newW = Math.max(MIN_W, resizing.origW - dx); newX = resizing.origX + dx; break;
          case "s": newH = Math.max(MIN_H, resizing.origH + dy); break;
          case "n": newH = Math.max(MIN_H, resizing.origH - dy); newY = resizing.origY + dy; break;
          case "se": newW = Math.max(MIN_W, resizing.origW + dx); newH = Math.max(MIN_H, resizing.origH + dy); break;
          case "sw": newW = Math.max(MIN_W, resizing.origW - dx); newH = Math.max(MIN_H, resizing.origH + dy); newX = resizing.origX + dx; break;
          case "ne": newW = Math.max(MIN_W, resizing.origW + dx); newH = Math.max(MIN_H, resizing.origH - dy); newY = resizing.origY + dy; break;
          case "nw": newW = Math.max(MIN_W, resizing.origW - dx); newH = Math.max(MIN_H, resizing.origH - dy); newX = resizing.origX + dx; newY = resizing.origY + dy; break;
        }

        if (zone) {
          newX = Math.max(zone.x, newX);
          newY = Math.max(zone.y, newY);
          if (newX + newW > zone.x + zone.width) newW = zone.x + zone.width - newX;
          if (newY + newH > zone.y + zone.height) newH = zone.y + zone.height - newY;
        }

        onMoveElement(resizing.id, newX, newY);
        onResizeElement(resizing.id, newW, newH);
      }
    },
    [dragging, resizing, onMoveElement, onResizeElement, textElements, selectedLayout]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, id: string, handle: HandleDir) => {
      e.stopPropagation();
      e.preventDefault();
      const el = textElements.find((t) => t.id === id);
      if (!el) return;
      setResizing({
        id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        origW: el.width,
        origH: el.height,
        origX: el.x,
        origY: el.y,
      });
    },
    [textElements]
  );

  // Editing view
  return (
    <div
      ref={canvasRef}
      className="wp-canvas"
      style={{
        height: "100%",
        position: "relative",
        background: backgroundImage
          ? `url(/api/image?path=${encodeURIComponent(backgroundImage.imagePath)}) center/contain no-repeat`
          : "var(--wp-bg-canvas)",
        cursor: dragging ? "grabbing" : "default",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => onSelectElement(null)}
    >
      {/* Constraint zone visualization */}
      {layout && phase === "editing" && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {Object.entries(layout.constraintZones).map(([field, zone]) => {
            const related = textElements.find((el) => el.fieldKey === field);
            return (
              <div
                key={field}
                style={{
                  position: "absolute",
                  left: `${zone.x * 100}%`,
                  top: `${zone.y * 100}%`,
                  width: `${zone.width * 100}%`,
                  height: `${zone.height * 100}%`,
                  border: "1px dashed var(--wp-border)",
                  borderRadius: 4,
                  opacity: related && selectedElement === related.id ? 0.8 : 0.25,
                  transition: "opacity 0.2s",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Text elements */}
      {textElements.map((el) => {
        const isSelected = el.id === selectedElement;
        return (
          <div
            key={el.id}
            className={`wp-canvas__element ${isSelected ? "wp-canvas__element--selected" : ""}`}
            style={{
              left: `${el.x * 100}%`,
              top: `${el.y * 100}%`,
              width: `${el.width * 100}%`,
              height: `${el.height * 100}%`,
              display: "flex",
              alignItems: "center",
              justifyContent:
                el.textAlign === "center"
                  ? "center"
                  : el.textAlign === "right"
                  ? "flex-end"
                  : "flex-start",
              padding: 6,
            }}
            onMouseDown={(e) => handleMouseDown(e, el.id)}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              style={{
                fontSize: el.fontSize,
                fontFamily: el.fontFamily,
                color: el.color,
                fontWeight: el.fieldKey === "mainTitle" ? 800 : 400,
                lineHeight: el.lineHeight || 1.3,
                textAlign: el.textAlign,
                width: "100%",
                wordBreak: "break-word",
              }}
            >
              {el.text}
            </span>

            {/* 8 resize handles */}
            {isSelected && (
              <>
                {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as HandleDir[]).map((dir) => (
                  <div
                    key={dir}
                    className={`wp-handle wp-handle--${dir}`}
                    onMouseDown={(e) => handleResizeStart(e, el.id, dir)}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
