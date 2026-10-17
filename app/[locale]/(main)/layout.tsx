// app/[locale]/(main)/layout.tsx
"use client";

import { Navbar } from "@/app/components/navbar/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">{children}</main>
    </div>
  );
}