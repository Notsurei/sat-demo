"use client";

import React from "react";
import { Button, Form, Input, Label, Modal, TextField, toast } from "@heroui/react";

import OTPInput from "../../../components/OTP/OTPinput";
import MailForgotPassword from "@/app/components/forms/email-forgot-password";

export default function ResetPasswordPage() {
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
      toast.danger("Passwords do not match");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert("Password changed successfully.");
    }, 1000);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-divider bg-content1 p-8 shadow-xl">
        {!verified ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold">Verify Reset Code</h1>

              <p className="mt-3 text-default-500">
                Enter the 6-digit verification code that we sent to your email.
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
              Verify Code
            </Button>

            <Button
              variant="tertiary"
              className="mt-3 w-full text-primary"
              onPress={() => setIsResendOpen(true)}
            >
              Didn't receive the code? Resend
            </Button>
            <Modal isOpen={isResendOpen} onOpenChange={setIsResendOpen}>
              <Modal.Backdrop>
                <Modal.Container>
                  <Modal.Dialog className="sm:max-w-md">
                    <Modal.CloseTrigger />

                    <Modal.Header>
                      <Modal.Heading>Resend Verification Code</Modal.Heading>
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
              <h1 className="text-3xl font-bold">Create New Password</h1>

              <p className="mt-3 text-default-500">
                Your identity has been verified. Please choose a new password.
              </p>
            </div>

            <Form className="flex flex-col gap-5" onSubmit={resetPassword}>
              <TextField className="w-full">
                <Label>New Password</Label>

                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </TextField>

              <TextField className="w-full">
                <Label>Confirm Password</Label>

                <Input
                  type="password"
                  placeholder="Confirm password"
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
                Reset Password
              </Button>
            </Form>
          </>
        )}
      </div>
    </main>
  );
}
