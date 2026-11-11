import type { TestHistory } from "./type";

export function formatHistoryDate(
  date: string | number | null | undefined,
): string {
  if (date === null || date === undefined || date === "") {
    return "Unknown date";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

export function formatHistoryTime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) {
    return "0m";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function getAnsweredQuestions(test: TestHistory): number {
  return (test.totalCorrect ?? 0) + (test.totalWrong ?? 0);
}

export function getUnansweredQuestions(
  totalQuestions: number,
  answeredQuestions: number,
): number {
  return Math.max(0, totalQuestions - answeredQuestions);
}

export function getHistoryAccuracy(
  correctCount: number,
  totalQuestions: number,
): number {
  if (totalQuestions <= 0) return 0;
  return Math.round((correctCount / totalQuestions) * 100);
}

export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return "text-success";
  if (accuracy >= 60) return "text-warning";
  return "text-danger";
}

export function getHistoryStatusName(status: TestHistory["status"]): string {
  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "IN_PROGRESS":
      return "In Progress";
    case "ABANDONED":
      return "Abandoned";
    case "EXPIRED":
      return "Expired";
    default:
      return status;
  }
}

export function getHistoryStatusColor(
  status: TestHistory["status"],
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "IN_PROGRESS":
      return "warning";
    case "ABANDONED":
    case "EXPIRED":
      return "danger";
    default:
      return "default";
  }
}

export function isHistoryCompleted(status: TestHistory["status"]): boolean {
  return status === "COMPLETED";
}

export function isHistoryInProgress(status: TestHistory["status"]): boolean {
  return status === "IN_PROGRESS";
}

export function isHistoryAbandoned(status: TestHistory["status"]): boolean {
  return status === "ABANDONED";
}

export function isHistoryExpired(status: TestHistory["status"]): boolean {
  return status === "EXPIRED";
}
