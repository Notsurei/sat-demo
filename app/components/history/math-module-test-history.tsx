"use client";

import RecentTestHistory from "./recent-test-history";
import type { TestHistoryProps } from "./type";

export default function RecentMathModuleHistory(props: TestHistoryProps) {
  return (
    <RecentTestHistory
      {...props}
      titleKey="mathModuleTitle"
      descriptionKey="mathModuleDescription"
      reportHistoryPath="/pages/math-module-report-history"
      reportPath="/pages/math-module-report"
    />
  );
}
