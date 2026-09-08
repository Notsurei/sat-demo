// components/annotator/hooks/useDragToolbar.ts
import { useEffect, useRef } from "react";

export function useDragToolbar(
  toolbarRef: React.RefObject<HTMLDivElement | null>,
) {
  const dragData = useRef({ dragging: false, ox: 0, oy: 0 });

  useEffect(() => {
    console.log("🔌 useDragToolbar: effect running");
    const bar = toolbarRef.current;
    if (!bar) {
      console.warn("❌ useDragToolbar: toolbarRef not ready");
      return;
    }
    console.log("✅ useDragToolbar: toolbarRef found", bar);

    const handle = bar.querySelector("#annot-drag-handle") as HTMLElement;
    if (!handle) {
      console.warn("❌ Drag handle not found");
      return;
    }
    console.log("✅ Drag handle found");

    // ─── Sự kiện mousedown trên toàn bộ toolbar ────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Nếu click vào button thì không kéo
      if (target.tagName === "BUTTON" || target.closest("button")) {
        console.log("mousedown on button, skipping drag");
        return;
      }
      console.log("mousedown on draggable area");

      e.preventDefault();

      const rect = bar.getBoundingClientRect();
      // Chuyển sang position: fixed
      bar.style.left = rect.left + "px";
      bar.style.top = rect.top + "px";
      bar.style.transform = "none";
      bar.style.right = "auto";
      bar.style.bottom = "auto";

      dragData.current = {
        dragging: true,
        ox: e.clientX - rect.left,
        oy: e.clientY - rect.top,
      };

      bar.style.cursor = "grabbing";
      handle.style.cursor = "grabbing";
      console.log("🖱️ Started dragging");
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragData.current.dragging) return;

      let newLeft = e.clientX - dragData.current.ox;
      let newTop = e.clientY - dragData.current.oy;

      const maxX = window.innerWidth - bar.offsetWidth;
      const maxY = window.innerHeight - bar.offsetHeight;
      newLeft = Math.max(0, Math.min(maxX, newLeft));
      newTop = Math.max(0, Math.min(maxY, newTop));

      bar.style.left = newLeft + "px";
      bar.style.top = newTop + "px";
    };

    const onMouseUp = () => {
      if (dragData.current.dragging) {
        dragData.current.dragging = false;
        bar.style.cursor = "";
        handle.style.cursor = "grab";
        console.log("🖱️ Stopped dragging");
      }
    };

    // ─── Gắn sự kiện vào toolbar ────────────────────────────────────────────
    bar.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      bar.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [toolbarRef]);
}