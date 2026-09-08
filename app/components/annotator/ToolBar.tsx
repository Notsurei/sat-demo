'use client';

import React, { useRef, useEffect } from 'react';
import { HIGHLIGHT_COLORS, DRAW_BUTTONS } from './constants';
import { Ban, Grip, TrashBin, Xmark } from '@gravity-ui/icons';

interface ToolbarProps {
  isOpen: boolean;
  currentMode: 'highlight' | 'draw' | 'none';
  currentColor: string;
  onModeChange: (mode: 'highlight' | 'draw' | 'none', color: string) => void;
  onClearHighlights: () => void;
  onClearDrawings: () => void;
  onClose: () => void;
}

export default function Toolbar({
  isOpen,
  currentMode,
  currentColor,
  onModeChange,
  onClearHighlights,
  onClearDrawings,
  onClose,
}: ToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dragData = useRef({ dragging: false, ox: 0, oy: 0 });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const bar = toolbarRef.current;
    if (!bar) {
      return;
    }

    const handle = bar.querySelector('#annot-drag-handle') as HTMLElement;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON') return;

      e.preventDefault();

      const rect = bar.getBoundingClientRect();
      bar.style.left = rect.left + 'px';
      bar.style.top = rect.top + 'px';
      bar.style.transform = 'none';
      bar.style.right = 'auto';
      bar.style.bottom = 'auto';

      dragData.current = {
        dragging: true,
        ox: e.clientX - rect.left,
        oy: e.clientY - rect.top,
      };

      bar.style.cursor = 'grabbing';
      handle.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragData.current.dragging) return;

      let newLeft = e.clientX - dragData.current.ox;
      let newTop = e.clientY - dragData.current.oy;

      const maxX = window.innerWidth - bar.offsetWidth;
      const maxY = window.innerHeight - bar.offsetHeight;
      newLeft = Math.max(0, Math.min(maxX, newLeft));
      newTop = Math.max(0, Math.min(maxY, newTop));

      bar.style.left = newLeft + 'px';
      bar.style.top = newTop + 'px';
    };

    const onMouseUp = () => {
      if (dragData.current.dragging) {
        dragData.current.dragging = false;
        bar.style.cursor = '';
        handle.style.cursor = 'grab';
      }
    };

    handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isActive = (mode: string, color: string) => {
    return currentMode === mode && currentColor === color;
  };

  return (
    <div
      ref={toolbarRef}
      id="annot-bar"
      style={{
        position: 'fixed',
        top: 68,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: 24,
        boxShadow: '0 3px 14px rgba(0,0,0,.18)',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        whiteSpace: 'nowrap',
        pointerEvents: 'all',
      }}
    >
      <span
        id="annot-drag-handle"
        style={{
          cursor: 'grab',
          padding: '0 5px 0 2px',
          color: '#94a3b8',
          fontSize: 16,
          userSelect: 'none',
          lineHeight: 1,
        }}
      >
        <Grip />
      </span>

      {HIGHLIGHT_COLORS.map(({ color, bg, label, title }) => (
        <button
          key={color}
          className={`annot-btn ${isActive('highlight', color) ? 'active' : ''}`}
          onClick={() => onModeChange('highlight', color)}
          style={{
            background: bg,
            padding: '4px 6px',
            borderRadius: 12,
            border: isActive('highlight', color) ? '2px solid #2563eb' : 'none',
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: 1,
          }}
          title={title}
        >
          {label}
        </button>
      ))}

      <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 2px' }} />

      {DRAW_BUTTONS.map(({ color, bg, text, label, title }) => (
        <button
          key={color}
          className={`annot-btn ${isActive('draw', color) ? 'active' : ''}`}
          onClick={() => onModeChange('draw', color)}
          style={{
            background: bg,
            color: text,
            fontWeight: 900,
            fontSize: 12,
            width: 26,
            height: 26,
            borderRadius: 12,
            border: isActive('draw', color) ? '2px solid #2563eb' : 'none',
            cursor: 'pointer',
            lineHeight: 1,
          }}
          title={title}
        >
          {label}
        </button>
      ))}

      <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 2px' }} />

      <button
        onClick={onClearHighlights}
        style={{
          background: "#fee2e2",
          width: 26,
          height: 26,
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
        title="Clear highlights"
      >
        <Ban className='text-red-400' width={16} height={16} />
      </button>

      <button
        onClick={onClearDrawings}
        style={{
          background: "#fef3c7",
          width: 26,
          height: 26,
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
        title="Clear drawings"
      >
        <TrashBin color="#475569" width={16} height={16} />
      </button>

      <button
        onClick={onClose}
        style={{
          background: '#f1f5f9',
          fontSize: 14,
          width: 26,
          height: 26,
          borderRadius: 12,
          border: 'none',
          fontWeight: 900,
          cursor: 'pointer',
          lineHeight: 1,
        }}
        title="Close"
      >
        <Xmark className='text-red-700' />
      </button>
    </div>
  );
}