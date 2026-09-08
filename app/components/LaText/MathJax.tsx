"use client";

import { MathJax } from "better-react-mathjax";

interface Props {
  text: string;
}

export default function MathText({ text }: Props) {
  return (
    <MathJax dynamic inline={false}>
      {text}
    </MathJax>
  );
}