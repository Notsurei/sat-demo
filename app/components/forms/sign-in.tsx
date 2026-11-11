"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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

import { useAuthStore } from "@/zustand/auth-store";

import { Props } from "./props";

export default function SignIn({ switchMode, onSuccess }: Props) {
  const router = useRouter();
  const t = useTranslations("auth.signIn");
  const tErr = useTranslations("auth.errors");

  const { login, isAuthenticated } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [input, setInput] = React.useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = React.useState({
    email: "",
    password: "",
    general: "",
  });

  const sendRequest = async () => {
    try {
      const res = await axios.post("/api/auth/signin", input, {
        withCredentials: true,
      });

      return res.data;
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : tErr("invalidCredentials");

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
      password: "",
      general: "",
    };

    if (!input.email) newErrors.email = tErr("emailRequired");
    if (!input.password) newErrors.password = tErr("passwordRequired");

    setErrors(newErrors);

    return !newErrors.email && !newErrors.password;
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/pages/home");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const data = await sendRequest();

      if (!data?.success || !data?.user) {
        return;
      }

      if (!data.user.isVerified) {
        setErrors((prev) => ({
          ...prev,
          general:
            tErr("emailNotVerified")
        }));

        return;
      }
      login(data.user);

      onSuccess?.();
      router.replace("/pages/home");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    setInput((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));
  };

  return (
    <Form
      className="flex flex-col justify-center gap-4"
      onSubmit={handleSubmit}
    >
      <TextField
        isRequired
        isInvalid={!!errors.email}
        className="flex flex-col gap-1"
      >
        <Label className="text-foreground">{t("emailLabel")}</Label>

        <Input
          value={input.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder={t("emailPlaceholder")}
          className="h-10 rounded-xl border border-default-200 bg-default-100 text-foreground"
        />

        {errors.email && (
          <FieldError>{errors.email}</FieldError>
        )}
      </TextField>

      <TextField
        isRequired
        isInvalid={!!errors.password}
        className="flex flex-col gap-1"
      >
        <Label className="text-foreground">{t("passwordLabel")}</Label>

        <Input
          type="password"
          value={input.password}
          placeholder={t("passwordPlaceholder")}
          onChange={(e) => handleChange("password", e.target.value)}
          className="h-10 rounded-xl border border-default-200 bg-default-100 text-foreground"
        />

        {errors.password && (
          <FieldError>{errors.password}</FieldError>
        )}
      </TextField>

      {errors.general && (
        <p className="text-center text-sm text-danger">
          {errors.general}
        </p>
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
            t("signInButton")
          )}
        </Button>
      </div>

      <div className="mt-3 space-y-1 text-center text-sm text-default-500">
        <p>
          <button
            type="button"
            onClick={() => switchMode?.("signup")}
            className="cursor-pointer text-primary transition-colors hover:text-primary-600 hover:text-blue-300"
          >
            {t("noAccountPrompt")}
          </button>
        </p>

        <p>
          <button
            type="button"
            onClick={() => switchMode?.("email-forgot-pass")}
            className="cursor-pointer text-default-500 transition-colors hover:text-default-700 hover:text-blue-300"
          >
            {t("forgotPasswordPrompt")}
          </button>
        </p>

        <p>
          <button
            type="button"
            onClick={() => switchMode?.("resend-verification")}
            className="cursor-pointer text-default-500 transition-colors hover:text-default-700 hover:text-blue-300"
          >
            {t("noVerified")}
          </button>
        </p>
      </div>
    </Form>
  );
}
