'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { useDrawing } from './hooks/useDrawing';

export interface CanvasHandle {
  clear: () => void;
  setStyle: (color: string, lineWidth?: number) => void;
  enable: (enabled: boolean) => void;
}

interface CanvasProps {
  color: string;
  lineWidth?: number;
  enabled: boolean;
  onDrawStart?: (e: MouseEvent) => void;
  onDrawMove?: (e: MouseEvent) => void;
  onDrawEnd?: () => void;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(({
  color,
  lineWidth = 3,
  enabled,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { setDrawStyle, startDraw, draw, stopDraw, clearCanvas } = useDrawing(canvasRef);

  useEffect(() => {
    setDrawStyle(color, lineWidth);
  }, [color, lineWidth, setDrawStyle]);

  useImperativeHandle(ref, () => ({
    clear: clearCanvas,
    setStyle: setDrawStyle,
    enable: (enable: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.style.pointerEvents = enable ? 'all' : 'none';
      canvas.style.cursor = enable ? 'crosshair' : 'default';
    },
  }));

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const resize = () => {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    startDraw(e as any);
    onDrawStart?.(e as any);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled) return;
    draw(e as any);
    onDrawMove?.(e as any);
  };

  const handleMouseUp = () => {
    if (!enabled) return;
    stopDraw();
    onDrawEnd?.();
  };

  const handleMouseLeave = () => {
    if (!enabled) return;
    stopDraw();
    onDrawEnd?.();
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 800,
        pointerEvents: enabled ? 'all' : 'none',
        cursor: enabled ? 'crosshair' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
});

Canvas.displayName = 'Canvas';
export default Canvas;