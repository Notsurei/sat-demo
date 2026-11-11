'use client';
import ModuleHistoryPage from "@/app/components/history/module-history-page";

export default function RwModuleHistoryPage() {
  return (
    <ModuleHistoryPage
      subject="SAT_RW"
      subjectLabel="Reading & Writing"
      apiPath="/api/rw-module-test/history"
      sessionPath="/rw-module-test"
      reportPath="/pages/rw-module-report"
      titleKey="rw"
    />
  );
}