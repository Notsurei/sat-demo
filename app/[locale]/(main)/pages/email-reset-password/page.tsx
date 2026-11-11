"use client";

import React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Button,
  Form,
  Input,
  Label,
  Modal,
  TextField,
  toast,
} from "@heroui/react";
import { useTranslations } from "next-intl";

import OTPInput from "@/app/components/OTP/OTPinput";
import MailForgotPassword from "@/app/components/forms/email-forgot-password";

export default function ResetPasswordPage() {
  const t = useTranslations("resetPassword");
  const router = useRouter();

  const [otp, setOtp] = React.useState("");
  const [verified, setVerified] = React.useState(false);
  const [isResendOpen, setIsResendOpen] = React.useState(false);

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const verifyOTP = async () => {
    setError("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "/api/auth/email-reset-password",
        {
          token: otp,
        }
      );

      if (response.data?.success) {
        setVerified(true);
        toast.success("OTP verified successfully!");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.log("VERIFY OTP ERROR:", {
          url: err.config?.url,
          method: err.config?.method,
          status: err.response?.status,
          data: err.response?.data,
        });

        setError(
          err.response?.data?.error ||
          `Request failed: ${err.response?.status}`
        );
      } else {
        console.error(err);
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6 || password.length > 100) {
      setError("Password must be between 6 and 100 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.danger(t("toast.passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "/api/auth/email-reset-password",
        {
          token: otp,
          newPass: password,
        }
      );

      if (response.data?.success) {
        toast.success(t("toast.passwordChanged"));

        setOtp("");
        setPassword("");
        setConfirmPassword("");
        setVerified(false);

        router.replace("/");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error ||
          "Unable to reset password. Please try again."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-divider bg-content1 p-8 shadow-xl">

        {!verified ? (
          <>
            {/* STEP 1: OTP VERIFICATION */}

            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold leading-tight">
                {t("verify.title")}
              </h1>

              <p className="mt-3 text-default-500 leading-relaxed">
                {t("verify.description")}
              </p>
            </div>

            <OTPInput
              length={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setError("");
              }}
            />

            {error && (
              <p className="mt-4 text-center text-sm text-danger">
                {error}
              </p>
            )}

            <Button
              className="mt-8 w-full"
              variant="primary"
              size="lg"
              isDisabled={otp.length !== 6 || loading}
              isPending={loading}
              onPress={verifyOTP}
            >
              {loading ? "Verifying..." : t("verify.verifyButton")}
            </Button>

            <Button
              variant="tertiary"
              className="mt-3 w-full text-primary"
              onPress={() => setIsResendOpen(true)}
            >
              {t("verify.resendPrompt")}
            </Button>

            {/* RESEND OTP MODAL */}

            <Modal
              isOpen={isResendOpen}
              onOpenChange={setIsResendOpen}
            >
              <Modal.Backdrop>
                <Modal.Container>
                  <Modal.Dialog className="sm:max-w-md">
                    <Modal.CloseTrigger />

                    <Modal.Header>
                      <Modal.Heading>
                        {t("verify.resendModalTitle")}
                      </Modal.Heading>
                    </Modal.Header>

                    <Modal.Body>
                      <MailForgotPassword
                        switchMode={() => { }}
                        showFooter={false}
                      />
                    </Modal.Body>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          </>
        ) : (
          <>
            {/* STEP 2: RESET PASSWORD */}

            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold leading-tight">
                {t("createPassword.title")}
              </h1>

              <p className="mt-3 text-default-500 leading-relaxed">
                {t("createPassword.description")}
              </p>
            </div>

            <Form
              className="flex flex-col gap-5"
              onSubmit={resetPassword}
            >
              <TextField className="w-full">
                <Label>
                  {t("createPassword.newPasswordLabel")}
                </Label>

                <Input
                  type="password"
                  placeholder={t(
                    "createPassword.newPasswordPlaceholder"
                  )}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                />
              </TextField>

              <TextField className="w-full">
                <Label>
                  {t("createPassword.confirmPasswordLabel")}
                </Label>

                <Input
                  type="password"
                  placeholder={t(
                    "createPassword.confirmPasswordPlaceholder"
                  )}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                />
              </TextField>

              {error && (
                <p className="w-full text-sm text-danger">
                  {error}
                </p>
              )}

              <Button
                className="mt-3 w-full"
                variant="primary"
                size="lg"
                type="submit"
                isDisabled={loading}
                isPending={loading}
              >
                {loading
                  ? "Resetting..."
                  : t("createPassword.resetButton")}
              </Button>
            </Form>
          </>
        )}
      </div>
    </main>
  );
}