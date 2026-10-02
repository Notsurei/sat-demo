"use client";

import React from "react";

import parser, {
  domToReact,
  Element,
  type DOMNode,
  type HTMLReactParserOptions,
} from "html-react-parser";

import MathText from "./MathJax";

interface ParsedMathTextProps {
  text: string | null | undefined;
}

const reactAttributeMap: Record<string, string> = {
  "stroke-width": "strokeWidth",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",

  "fill-rule": "fillRule",
  "clip-rule": "clipRule",

  "font-size": "fontSize",
  "font-weight": "fontWeight",
  "font-family": "fontFamily",

  "text-anchor": "textAnchor",
  "dominant-baseline": "dominantBaseline",
  "alignment-baseline": "alignmentBaseline",

  "letter-spacing": "letterSpacing",
  "word-spacing": "wordSpacing",

  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",

  "fill-opacity": "fillOpacity",
  "stroke-opacity": "strokeOpacity",

  "shape-rendering": "shapeRendering",

  "color-interpolation": "colorInterpolation",
  "color-interpolation-filters": "colorInterpolationFilters",

  "vector-effect": "vectorEffect",

  "accept-charset": "acceptCharset",
  class: "className",
  for: "htmlFor",
  "http-equiv": "httpEquiv",
  tabindex: "tabIndex",
  colspan: "colSpan",
  rowspan: "rowSpan",
  cellpadding: "cellPadding",
  cellspacing: "cellSpacing",
  contenteditable: "contentEditable",
  crossorigin: "crossOrigin",
  datetime: "dateTime",
  maxlength: "maxLength",
  minlength: "minLength",
  readonly: "readOnly",
  spellcheck: "spellCheck",
};

const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function parseStyleString(
  styleString: string | undefined,
): Record<string, string> {
  if (!styleString) {
    return {};
  }

  const styleObject: Record<string, string> = {};

  styleString.split(";").forEach((declaration) => {
    const trimmed = declaration.trim();

    if (!trimmed) return;

    const colonIndex = trimmed.indexOf(":");

    if (colonIndex === -1) return;

    const property = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    if (!property || !value) return;

    const camelCaseProperty = property.replace(
      /-([a-z])/g,
      (_, letter: string) => letter.toUpperCase(),
    );

    styleObject[camelCaseProperty] = value;
  });

  return styleObject;
}

function normalizeAttributes(
  attribs: Record<string, string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(attribs)) {
    if (key === "style") {
      result.style = parseStyleString(value);
      continue;
    }

    const reactKey = reactAttributeMap[key] ?? key;

    result[reactKey] = value;
  }

  return result;
}

function isElement(node: DOMNode): node is Element {
  return (
    node.type === "tag" &&
    "name" in node &&
    "attribs" in node &&
    "children" in node
  );
}

function getTableClassName(
  tagName: string,
  existingClassName?: string,
): string | undefined {
  switch (tagName) {
    case "table":
      return ["my-4", "w-full", "border-collapse", "text-sm", existingClassName]
        .filter(Boolean)
        .join(" ");

    case "thead":
      return ["bg-default-100", "dark:bg-default-800", existingClassName]
        .filter(Boolean)
        .join(" ");

    case "tbody":
      return existingClassName;

    case "tr":
      return [
        "border-b",
        "border-default-200",
        "dark:border-default-700",
        existingClassName,
      ]
        .filter(Boolean)
        .join(" ");

    case "th":
      return [
        "border",
        "border-default-200",
        "px-3",
        "py-2",
        "text-left",
        "font-semibold",
        "text-default-800",
        "dark:border-default-700",
        "dark:text-default-100",
        existingClassName,
      ]
        .filter(Boolean)
        .join(" ");

    case "td":
      return [
        "border",
        "border-default-200",
        "px-3",
        "py-2",
        "align-top",
        "text-default-700",
        "dark:border-default-700",
        "dark:text-default-300",
        existingClassName,
      ]
        .filter(Boolean)
        .join(" ");

    case "caption":
      return [
        "mb-2",
        "text-left",
        "font-medium",
        "text-default-700",
        "dark:text-default-300",
        existingClassName,
      ]
        .filter(Boolean)
        .join(" ");

    default:
      return existingClassName;
  }
}

interface CrossTextBlock {
  label: string;
  body: string;
}

function splitCrossText(text: string): CrossTextBlock[] | null {
  const markerRegex = /\b(Text|Passage)\s+(1|2)\b/gi;

  const matches: { index: number; length: number; label: string }[] = [];

  let m: RegExpExecArray | null;

  while ((m = markerRegex.exec(text)) !== null) {
    matches.push({
      index: m.index,
      length: m[0].length,
      label: `${m[1]} ${m[2]}`,
    });
  }

  if (matches.length !== 2) {
    return null;
  }

  matches.sort((a, b) => a.index - b.index);

  const blocks: CrossTextBlock[] = [];

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];

    const start = current.index + current.length;
    const end = next ? next.index : text.length;

    let body = text.slice(start, end);

    body = body.replace(/^\s*:?\s*/, "");

    body = body.replace(/^(?:<\/(?:strong|b|em|i|span|h[1-6])>\s*)+/i, "");

    body = body.replace(
      /(?:\s*<(?:p|div|h[1-6]|strong|b|em|i|span)[^>]*>\s*)+$/i,
      "",
    );

    body = body.trim();

    blocks.push({
      label: current.label,
      body,
    });
  }

  return blocks;
}

function renderParsed(text: string): React.ReactNode {
  const options: HTMLReactParserOptions = {
    replace(node) {
      if (node.type === "text") {
        const content = node.data;

        if (!content.trim()) {
          return content;
        }

        return <MathText text={content} />;
      }

      if (isElement(node)) {
        const tagName = node.name.toLowerCase();

        const props = normalizeAttributes(node.attribs);

        if (
          [
            "table",
            "thead",
            "tbody",
            "tfoot",
            "tr",
            "th",
            "td",
            "caption",
          ].includes(tagName)
        ) {
          const existingClassName =
            typeof props.className === "string" ? props.className : undefined;

          const className = getTableClassName(tagName, existingClassName);

          if (className) {
            props.className = className;
          }
        }

        if (tagName === "table") {
          return (
            <div className="my-4 w-full overflow-x-auto">
              {React.createElement(
                "table",
                props,
                domToReact(node.children as DOMNode[], options),
              )}
            </div>
          );
        }

        if (voidElements.has(tagName)) {
          return React.createElement(tagName, props);
        }

        return React.createElement(
          tagName,
          props,
          domToReact(node.children as DOMNode[], options),
        );
      }

      return undefined;
    },
  };

  return parser(text, options);
}

export default function ParsedMathText({ text }: ParsedMathTextProps) {
  if (!text) {
    return null;
  }

  const crossText = splitCrossText(text);

  if (crossText) {
    return (
      <div className="space-y-4">
        {crossText.map((block, idx) => (
          <div
            key={`${block.label}-${idx}`}
            className="
              rounded-2xl
              border border-default-200
              bg-default-50/60
              p-4 sm:p-5
              dark:border-default-700 dark:bg-default-800/40
            "
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className="
                  inline-flex items-center justify-center
                  rounded-full
                  bg-primary/10
                  px-3 py-0.5
                  text-[11px] font-bold uppercase tracking-wide
                  text-primary
                "
              >
                {block.label}
              </span>

              <span className="h-px flex-1 bg-default-200 dark:bg-default-700" />
            </div>

            <div className="leading-relaxed text-default-800 dark:text-default-200">
              {renderParsed(block.body)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <>{renderParsed(text)}</>;
}
