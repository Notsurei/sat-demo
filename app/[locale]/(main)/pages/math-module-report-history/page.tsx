'use client';
import ModuleHistoryPage from "@/app/components/history/module-history-page";

export default function MathModuleHistoryPage() {
  return (
    <ModuleHistoryPage
      subject="SAT_MATH"
      subjectLabel="Math"
      apiPath="/api/math-module-test/history"
      sessionPath="/math-module-test"
      reportPath="/pages/math-module-report"
      titleKey="math"
    />
  );
}