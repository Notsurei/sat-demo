export type Props = {
  switchMode: (mode: "signin" | "signup" | "email-forgot-pass") => void;
  onSuccess?: () => void;
  showFooter: boolean
};