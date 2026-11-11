import React from "react";
import { Spinner } from "@heroui/react";

export function TestLoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-default-50">
      <Spinner size="lg" />
      <span className="ml-4 text-default-500">{label}</span>
    </div>
  );
}

export function TestErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-default-50 p-6">
      <div className="text-center">
        <p className="mb-4 text-lg font-semibold text-danger">❌ {message}</p>
        <button
          onClick={() => (window.location.href = "/pages/home")}
          className="rounded-lg bg-primary px-4 py-2 text-white"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}