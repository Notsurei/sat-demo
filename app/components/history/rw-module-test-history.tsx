"use client";

import RecentTestHistory from "./recent-test-history";
import type { TestHistoryProps } from "./type";

export default function RecentRWModuleHistory(props: TestHistoryProps) {
  return (
    <RecentTestHistory
      {...props}
      titleKey="rwModuleTitle"
      descriptionKey="rwModuleDescription"
      reportHistoryPath="/pages/rw-module-report-history"
      reportPath="/pages/rw-module-report"
    />
  );
}
