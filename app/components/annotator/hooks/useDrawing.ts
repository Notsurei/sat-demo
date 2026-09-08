// components/annotator/hooks/useDrawing.ts
import { useRef, useEffect, useCallback } from 'react';

// ✅ Cho phép canvasRef có thể là null
export function useDrawing(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawing = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext('2d');
  }, [canvasRef]);

  const setDrawStyle = useCallback((color: string, lineWidth: number = 3) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    isDrawing.current = true;
    lastX.current = (e as MouseEvent).clientX - rect.left;
    lastY.current = (e as MouseEvent).clientY - rect.top;
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    if (!isDrawing.current || !ctxRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e as MouseEvent).clientX - rect.left;
    const y = (e as MouseEvent).clientY - rect.top;
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(lastX.current, lastY.current);
    const mx = (lastX.current + x) / 2;
    const my = (lastY.current + y) / 2;
    ctx.quadraticCurveTo(lastX.current, lastY.current, mx, my);
    ctx.stroke();
    lastX.current = x;
    lastY.current = y;
  }, []);

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  return { setDrawStyle, startDraw, draw, stopDraw, clearCanvas };
}