import { CircleFill } from '@gravity-ui/icons';

export const HIGHLIGHT_COLORS = [
  { color: "yellow", bg: "#fef9c3", label: <CircleFill className='text-yellow-200' />, title: "Yellow highlight" },
  { color: "blue", bg: "#dbeafe", label: <CircleFill className='text-blue-500' />, title: "Blue highlight" },
  { color: "green", bg: "#d1fae5", label: <CircleFill className='text-green-400' />, title: "Green highlight" },
  { color: "pink", bg: "#fce7f3", label: <CircleFill className='text-pink-400' />, title: "Pink highlight" },
] as const;

export const DRAW_BUTTONS = [
  {
    color: "#2563eb",
    bg: "#dbeafe",
    text: "#1d4ed8",
    label: "B",
    title: "Blue pen",
  },
  {
    color: "#dc2626",
    bg: "#fee2e2",
    text: "#dc2626",
    label: "R",
    title: "Red pen",
  },
  {
    color: "#111",
    bg: "#f1f5f9",
    text: "#111",
    label: "K",
    title: "Black pen",
  },
] as const;

export const ANNOT_TOOLBAR_HTML = `
<div id="annot-bar" style="position:fixed;top:68px;left:50%;transform:translateX(-50%);z-index:9999;
  background:#fff;border:1px solid #ccc;border-radius:24px;
  box-shadow:0 3px 14px rgba(0,0,0,.18);user-select:none;
  display:flex;align-items:center;gap:4px;padding:4px 8px;white-space:nowrap;">
  <div id="annot-drag-handle" title="Drag to move" style="cursor:move;padding:0 5px 0 2px;color:#94a3b8;font-size:16px;line-height:1;">⠿</div>
  <button class="annot-btn" data-mode="highlight" data-color="yellow"><CircleFill className='text-yellow-200'/></button>
  <button class="annot-btn" data-mode="highlight" data-color="blue"><CircleFill className='text-blue-500'/></button>
  <button class="annot-btn" data-mode="highlight" data-color="green"><CircleFill className='text-green-400'/></button>
  <button class="annot-btn" data-mode="highlight" data-color="pink"><CircleFill className='text-pink-400'/></button>
  <div style="width:1px;height:20px;background:#e2e8f0;margin:0 2px;"></div>
  <button class="annot-btn" id="draw-btn-blue" data-mode="draw" data-color="#2563eb" style="background:#dbeafe;color:#1d4ed8;font-weight:900;font-size:12px;width:26px;height:26px;">B</button>
  <button class="annot-btn" id="draw-btn-red" data-mode="draw" data-color="#dc2626" style="background:#fee2e2;color:#dc2626;font-weight:900;font-size:12px;width:26px;height:26px;">R</button>
  <button class="annot-btn" id="draw-btn-black" data-mode="draw" data-color="#111" style="background:#f1f5f9;color:#111;font-weight:900;font-size:12px;width:26px;height:26px;">K</button>
  <div style="width:1px;height:20px;background:#e2e8f0;margin:0 2px;"></div>
  <button class="annot-btn" id="clear-highlights-btn" title="Clear highlights" style="background:#fee2e2;font-size:12px;width:26px;height:26px;">🚫</button>
  <button class="annot-btn" id="clear-drawings-btn" title="Clear drawings" style="background:#fef3c7;font-size:12px;width:26px;height:26px;">🗑️</button>
  <button class="annot-btn" id="close-annot-btn" title="Close" style="background:#f1f5f9;font-size:12px;width:26px;height:26px;font-weight:900;">✕</button>
</div>
`;
