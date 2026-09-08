"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/zustand/auth-store";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuth();
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return children;
}
