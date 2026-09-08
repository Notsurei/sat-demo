import { RefObject, useCallback } from "react";
import { HighlightColor } from "../types";

export function useHighlight(passageRef: RefObject<HTMLDivElement | null>) {
  const applyHighlight = useCallback(
    (color: HighlightColor) => {
      const passageElement = passageRef.current;
      if (!passageElement) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;

      const range = sel.getRangeAt(0);

      if (!passageElement.contains(range.commonAncestorContainer)) return;

      const span = document.createElement("span");
      span.className = `hl-${color}`;

      try {
        range.surroundContents(span);
      } catch {
        const frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);
      }

      sel.removeAllRanges();
    },
    [passageRef],
  );

  const clearHighlights = useCallback(() => {
    const passageElement = passageRef.current;
    if (!passageElement) return;

    passageElement
      .querySelectorAll(".hl-yellow,.hl-blue,.hl-green,.hl-pink")
      .forEach((el) => {
        const parent = el.parentNode!;
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      });
  }, [passageRef]);

  return {
    applyHighlight,
    clearHighlights,
  };
}
