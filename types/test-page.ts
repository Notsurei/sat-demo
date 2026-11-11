export interface ApiOption {
  id: string;
  label: string;
  content: string;
}

export interface ConfirmConfig {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger" | "warning";
  onConfirm: () => void | Promise<void>;
}