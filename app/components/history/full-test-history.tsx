"use client";

import RecentTestHistory from "./recent-test-history";
import type { TestHistoryProps } from "./type";

export default function RecentFullTestHistory(
  props: TestHistoryProps,
) {
  return (
    <RecentTestHistory
      {...props}
      titleKey="fullTestTitle"
      descriptionKey="fullTestDescription"
      reportHistoryPath="/pages/full-test-report-history"
      reportPath="/pages/full-test-report"
    />
  );
}