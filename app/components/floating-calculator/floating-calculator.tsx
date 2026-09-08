"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRotateLeft, Xmark } from "@gravity-ui/icons";
import { Button } from "@heroui/react";

interface CalculatorProps {
  onClose?: () => void;
}

export default function Calculator({ onClose }: CalculatorProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [open, setOpen] = useState(true);

  const dragData = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startBottom: 0,
  });

  const toggleCalc = () => {
    setOpen((prev) => {
      const newOpen = !prev;
      if (!newOpen && onClose) {
        onClose();
      }
      return newOpen;
    });
  };

  const resetCalc = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === "BUTTON") return;
    if (!panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();

    dragData.current.dragging = true;
    dragData.current.startX = e.clientX;
    dragData.current.startY = e.clientY;
    dragData.current.startLeft = rect.left;
    dragData.current.startBottom = window.innerHeight - rect.bottom;
  };

  const mouseMove = useCallback((e: MouseEvent) => {
    if (!dragData.current.dragging || !panelRef.current) return;

    const dx = e.clientX - dragData.current.startX;
    const dy = e.clientY - dragData.current.startY;

    const newLeft = Math.max(
      0,
      Math.min(
        window.innerWidth - 100,
        dragData.current.startLeft + dx
      )
    );

    const newBottom = Math.max(
      0,
      Math.min(
        window.innerHeight - 50,
        dragData.current.startBottom - dy
      )
    );

    panelRef.current.style.left = `${newLeft}px`;
    panelRef.current.style.bottom = `${newBottom}px`;
    panelRef.current.style.right = "auto";
  }, []);

  const mouseUp = useCallback(() => {
    dragData.current.dragging = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", mouseUp);

    return () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", mouseUp);
    };
  }, [mouseMove, mouseUp]);

  return (
    <div
      ref={panelRef}
      className={`fixed bottom-4 right-4 w-[450px] overflow-hidden rounded-xl border bg-white shadow-xl transition ${open ? "translate-y-0" : "translate-y-[420px]"
        }`}
    >
      <div
        onMouseDown={handleMouseDown}
        className="flex cursor-move items-center justify-between bg-blue-600 px-4 py-3 text-white"
      >
        <span>🧮 Desmos Calculator</span>

        <div className="flex gap-2">
          <Button
            onClick={resetCalc}
            className="rounded bg-white/20 px-2"
          >
            <ArrowRotateLeft />
          </Button>

          <Button
            onClick={toggleCalc}
            className="rounded bg-white/20 px-2"
          >
            <Xmark />
          </Button>
        </div>
      </div>

      <iframe
        ref={iframeRef}
        src="https://www.desmos.com/calculator?lang=en&branding=false"
        className="h-[500px] w-full"
      />
    </div>
  );
}