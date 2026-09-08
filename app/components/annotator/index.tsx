"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { AnnotatorProps } from "./types";
import Toolbar from "./ToolBar";
import Canvas, { CanvasHandle } from "./Canvas";
import { useAnnotator } from "./hooks/useAnnotator";
import { useHighlight } from "./hooks/useHightLight";
import { HighlightColor } from "./types";
import parse from "html-react-parser";

export default function Annotator({
  passageId,
  passageContent,
  enabled = true,
  isOpen,
  onToggle,
  children,
}: AnnotatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<CanvasHandle>(null);

  const { state, setMode, reset } = useAnnotator(passageId);

  const { applyHighlight, clearHighlights } = useHighlight(containerRef);

  useEffect(() => {
    if (!enabled) return;

    if (isOpen) {
      setMode("none", "yellow");
    } else {
      reset();
    }
  }, [enabled, isOpen, reset, setMode]);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      if (state.mode !== "highlight") return;

      requestAnimationFrame(() => {
        applyHighlight(state.color as HighlightColor);
      });
    };

    container.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
    };
  }, [enabled, state.mode, state.color, applyHighlight]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const drawing = state.mode === "draw";

    canvasRef.current.enable(drawing);

    if (drawing) {
      canvasRef.current.setStyle(state.color);
    }
  }, [state.mode, state.color]);

  const clearDrawings = useCallback(() => {
    canvasRef.current?.clear();
  }, []);

  const handleModeChange = (
    mode: "highlight" | "draw" | "none",
    color: string
  ) => {
    setMode(mode, color as any);
  };

  if (!enabled) {
    return (
      <div
        ref={containerRef}
        className="prose dark:prose-invert max-w-none"
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
      }}
    >
      <Toolbar
        isOpen={isOpen}
        currentMode={state.mode}
        currentColor={state.color}
        onModeChange={handleModeChange}
        onClearHighlights={clearHighlights}
        onClearDrawings={clearDrawings}
        onClose={onToggle}
      />

      <Canvas
        ref={canvasRef}
        enabled={state.mode === "draw"}
        color={state.color}
      />

      <div className="prose dark:prose-invert max-w-none">
        {children}
      </div>

      <style>{`
        .hl-yellow{
          background:#fef08a;
        }

        .hl-blue{
          background:#93c5fd;
        }

        .hl-green{
          background:#86efac;
        }

        .hl-pink{
          background:#fbcfe8;
        }

        .annot-btn.active{
          outline:2px solid #2563eb;
          outline-offset:2px;
          border-radius:12px;
        }
      `}</style>
    </div>
  );
}