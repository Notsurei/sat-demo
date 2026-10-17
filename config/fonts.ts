import {
  Plus_Jakarta_Sans as FontSans,
  JetBrains_Mono as FontMono,
} from "next/font/google";

export const fontSans = FontSans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  fallback: [
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "monospace",
  ],
});