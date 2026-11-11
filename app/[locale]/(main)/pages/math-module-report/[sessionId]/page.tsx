'use client';
import ModuleReportPage from "@/app/components/report/module-report-page";

export default function MathModuleReportPage() {
  return (
    <ModuleReportPage
      subjectLabel="Math"
      subjectFilter="SAT_MATH"
      apiPathTemplate="/api/math-module-test/sessions/{id}/result"
      titleKey="math"
      gradientClass="from-orange-500 via-amber-500 to-yellow-500"
    />
  );
}