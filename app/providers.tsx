"use client";

import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
  themeProps?: Record<string, unknown>;
}

export function Providers({ children }: ProvidersProps) {
  return <>{children}</>;
}