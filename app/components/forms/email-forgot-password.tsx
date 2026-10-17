"use client";

import React from "react";
import axios from "axios";
import { useTranslations } from "next-intl";
import {
  Button,
  FieldError,
  Form,
  Input,
  TextField,
  Label,
} from "@heroui/react";

import { Props } from "./props";

export default function MailForgotPassword({
  switchMode,
  showFooter = true,
}: Props) {
  const t = useTranslations("auth.forgotPassword");
  const tErr = useTranslations("auth.forgotPasswordErrors");

  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleChange = (value: string) => {
    setEmail(value);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await axios.post("/api/auth/email-forgot-password", {
        email,
      });
      setSuccess(t("successMessage"));
    } catch (err: any) {
      if (err.response) {
        setError(err.response?.data?.error || tErr("requestFailed"));
      } else if (err.request) {
        setError(tErr("networkError"));
      } else {
        setError(tErr("genericError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      className="flex flex-col justify-center gap-4"
      onSubmit={handleSubmit}
    >
      <TextField isRequired isInvalid={!!error} className="flex flex-col gap-1">
        <Label className="text-foreground">{t("emailLabel")}</Label>
        <Input
          type="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(e) => handleChange(e.target.value)}
          className="h-10 rounded-xl border border-default-200 bg-default-100 text-foreground"
        />
        {error && <FieldError>{error}</FieldError>}
      </TextField>

      {success && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-3">
          <p className="text-center text-sm text-success">{success}</p>
        </div>
      )}

      <div className="mt-2 flex flex-col items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          className="h-10 w-full max-w-[320px] rounded-2xl font-semibold text-white"
        >
          {loading ? t("sendingButton") : t("submitButton")}
        </Button>
      </div>

      {showFooter && (
        <div className="mt-3 space-y-1 text-center text-sm text-default-500">
          <p>
            <button
              type="button"
              onClick={() => switchMode?.("signin")}
              className="cursor-pointer text-primary transition-colors hover:text-primary-600 hover:text-blue-300"
            >
              {t("backToSignIn")}
            </button>
          </p>
          <p>
            <button
              type="button"
              onClick={() => switchMode?.("signup")}
              className="cursor-pointer text-default-500 transition-colors hover:text-default-700 hover:text-blue-300"
            >
              {t("noAccountPrompt")}
            </button>
          </p>
        </div>
      )}
    </Form>
  );
}