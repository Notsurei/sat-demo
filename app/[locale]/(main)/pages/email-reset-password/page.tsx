"use client";

import React from "react";
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

  const [otp, setOtp] = React.useState("");
  const [verified, setVerified] = React.useState(false);
  const [isResendOpen, setIsResendOpen] = React.useState(false);

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [_loading, setLoading] = React.useState(false);

  const verifyOTP = async () => {
    if (otp.length !== 6) return;

    setLoading(true);

    setTimeout(() => {
      setVerified(true);
      setLoading(false);
    }, 800);
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.danger(t("toast.passwordMismatch"));
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast.success(t("toast.passwordChanged"));
    }, 1000);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-divider bg-content1 p-8 shadow-xl">
        {!verified ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold leading-tight">
                {t("verify.title")}
              </h1>

              <p className="mt-3 text-default-500 leading-relaxed">
                {t("verify.description")}
              </p>
            </div>

            <OTPInput length={6} value={otp} onChange={setOtp} />

            <Button
              className="mt-8 w-full"
              variant="primary"
              size="lg"
              isDisabled={otp.length !== 6}
              onPress={verifyOTP}
            >
              {t("verify.verifyButton")}
            </Button>

            <Button
              variant="tertiary"
              className="mt-3 w-full text-primary"
              onPress={() => setIsResendOpen(true)}
            >
              {t("verify.resendPrompt")}
            </Button>

            <Modal isOpen={isResendOpen} onOpenChange={setIsResendOpen}>
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
                        switchMode={() => {}}
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
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold leading-tight">
                {t("createPassword.title")}
              </h1>

              <p className="mt-3 text-default-500 leading-relaxed">
                {t("createPassword.description")}
              </p>
            </div>

            <Form className="flex flex-col gap-5" onSubmit={resetPassword}>
              <TextField className="w-full">
                <Label>{t("createPassword.newPasswordLabel")}</Label>

                <Input
                  type="password"
                  placeholder={t("createPassword.newPasswordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </TextField>

              <TextField className="w-full">
                <Label>{t("createPassword.confirmPasswordLabel")}</Label>

                <Input
                  type="password"
                  placeholder={t("createPassword.confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </TextField>

              <Button
                className="mt-3 w-full"
                variant="primary"
                size="lg"
                type="submit"
              >
                {t("createPassword.resetButton")}
              </Button>
            </Form>
          </>
        )}
      </div>
    </main>
  );
}