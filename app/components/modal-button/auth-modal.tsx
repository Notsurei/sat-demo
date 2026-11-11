"use client";

import React from "react";
import { Modal, Button } from "@heroui/react";

import SignIn from "../forms/sign-in";
import SignUp from "../forms/sign-up";
import MailForgotPassword from "../forms/email-forgot-password";
import ResendVerification from "../forms/resend-verification";
import {useTranslations} from "next-intl";

export type AuthMode =
  | "signin"
  | "signup"
  | "email-forgot-pass"
  | "resend-verification";

export default function AuthModal() {
  const [mode, setMode] = React.useState<AuthMode>("signin");
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useTranslations("auth");

  const closeModal = () => {
    setIsOpen(false);
    setMode("signin");
  };

  return (
    <>
      <Button
        variant="secondary"
        onPress={() => setIsOpen(true)}
      >
        {t("signIn.SignIn")}
      </Button>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[380px]">
              <Modal.CloseTrigger />

              <Modal.Header>
                <Modal.Heading>
                  {mode === "signin" && "Welcome"}
                  {mode === "signup" && "Create account"}
                  {mode === "email-forgot-pass" && "Reset password"}
                  {mode === "resend-verification" &&
                    "Verify your email"}
                </Modal.Heading>
              </Modal.Header>

              <Modal.Body>
                {mode === "signin" && (
                  <SignIn
                    switchMode={setMode}
                    onSuccess={closeModal}
                    showFooter
                  />
                )}

                {mode === "signup" && (
                  <SignUp
                    switchMode={setMode}
                    showFooter
                  />
                )}

                {mode === "email-forgot-pass" && (
                  <MailForgotPassword
                    switchMode={setMode}
                    showFooter
                  />
                )}

                {mode === "resend-verification" && (
                  <ResendVerification
                    switchMode={setMode}
                    showFooter
                  />
                )}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
