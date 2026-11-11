"use client";

import React from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  TextField,
  Label,
  Spinner,
} from "@heroui/react";
import axios from "axios";

import { Props } from "./props";
import { useTranslations } from "next-intl";

export default function ResendVerification({ switchMode }: Props) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const t = useTranslations("auth.resendEmail");

  const [email, setEmail] = React.useState("");

  const [errors, setErrors] = React.useState({
    email: "",
    general: "",
  });

  const sendRequest = async () => {
    try {
      const res = await axios.post("/api/auth/resend-verification", {
        email: email.trim(),
      });

      return res.data;
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Unable to resend verification email.";

      setErrors((prev) => ({
        ...prev,
        general: message,
      }));

      return null;
    }
  };

  const validate = () => {
    const newErrors = {
      email: "",
      general: "",
    };

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    setErrors(newErrors);

    return !newErrors.email;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const data = await sendRequest();

      if (!data?.success) {
        return;
      }

      setIsSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (value: string) => {
    setEmail(value);

    setErrors({
      email: "",
      general: "",
    });

    setIsSent(false);
  };

  if (isSent) {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-foreground">
            {t("checkYourEmail")}
          </h3>

          <p className="text-sm text-default-500">
            {t("ifNotVerified")}
          </p>

          <p className="break-all font-medium text-foreground">
            {email.trim()}
          </p>

          <p className="text-sm text-default-500">
            {t("checkInbox")}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          className="h-10 w-full max-w-[320px] rounded-2xl font-semibold text-white"
          onPress={() => switchMode?.("signin")}
        >
          {t("backToSignIn")}
        </Button>
      </div>
    );
  }

  return (
    <Form
      className="flex flex-col justify-center gap-4"
      onSubmit={handleSubmit}
    >
      <div className="text-center">
        <p className="text-sm text-default-500">
          {t("enterEmail")}
        </p>
      </div>

      <TextField
        isRequired
        isInvalid={!!errors.email}
        className="flex flex-col gap-1"
      >
        <Label className="text-foreground">Email</Label>

        <Input
          type="email"
          value={email}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="you@example.com"
          className="h-10 rounded-xl border border-default-200 bg-default-100 text-foreground"
        />

        {errors.email && <FieldError>{errors.email}</FieldError>}
      </TextField>

      {errors.general && (
        <p className="text-center text-sm text-danger">{errors.general}</p>
      )}

      <div className="mt-2 flex flex-col items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          className="h-10 w-full max-w-[320px] rounded-2xl font-semibold text-white"
          isDisabled={isSubmitting}
        >
          {isSubmitting ? (
            <Spinner color="current" />
          ) : (
            "Resend verification email"
          )}
        </Button>
      </div>

      <div className="mt-3 text-center text-sm text-default-500">
        <button
          type="button"
          onClick={() => switchMode?.("signin")}
          className="cursor-pointer text-default-500 transition-colors hover:text-default-700 hover:text-blue-300"
        >
          {t("backToSignIn")}
        </button>
      </div>
    </Form>
  );
}
