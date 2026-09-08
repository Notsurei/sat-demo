"use client";

import React from "react";
import axios from "axios";
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
      const res = await axios.post("/api/auth/email-forgot-password", {
        email,
      });
      setSuccess(
        "✅ If an account exists, instructions were sent to your email.",
      );
    } catch (err: any) {
      if (err.response) {
        setError(err.response?.data?.error || "Failed to request reset");
      } else if (err.request) {
        setError("Network error. Please try again.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      className="flex flex-col gap-4 justify-center"
      onSubmit={handleSubmit}
    >
      <TextField isRequired isInvalid={!!error} className="flex flex-col gap-1">
        <Label className="text-foreground">Email Address</Label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => handleChange(e.target.value)}
          className="bg-default-100 text-foreground border border-default-200 rounded-xl h-10"
        />
        {error && <FieldError>{error}</FieldError>}
      </TextField>

      {success && (
        <div className="bg-success/10 border border-success/30 rounded-xl p-3">
          <p className="text-success text-sm text-center">{success}</p>
        </div>
      )}

      <div className="mt-2 flex flex-col items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          className="w-full max-w-[320px] text-white font-semibold rounded-2xl h-10"
        >
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </div>

      {showFooter && (
        <div className="text-center text-sm text-default-500 mt-3 space-y-1">
          <p>
            <button
              type="button"
              onClick={() => switchMode?.("signin")}
              className="text-primary hover:text-primary-600 transition-colors cursor-pointer hover:text-blue-300"
            >
              ← Back to sign in
            </button>
          </p>
          <p>
            <button
              type="button"
              onClick={() => switchMode?.("signup")}
              className="text-default-500 hover:text-default-700 transition-colors cursor-pointer hover:text-blue-300"
            >
              Don't have an account? Sign up
            </button>
          </p>
        </div>
      )}
    </Form>
  );
}
