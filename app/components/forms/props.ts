export type Props = {
  switchMode: (mode: "signin" | "signup" | "email-forgot-pass" | "resend-verification") => void;
  onSuccess?: () => void;
  showFooter: boolean
};