'use client';
import ModuleReportPage from "@/app/components/report/module-report-page";

export default function RwModuleReportPage() {
  return (
    <ModuleReportPage
      subjectLabel="Reading & Writing"
      subjectFilter="SAT_RW"
      apiPathTemplate="/api/rw-module-test/sessions/{id}/result"
      titleKey="rw"
      gradientClass="from-red-500 via-rose-500 to-pink-500"
    />
  );
}