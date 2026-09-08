"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/zustand/auth-store";
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

export default function SignIn({ switchMode, onSuccess }: Props) {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, setLoading } = useAuthStore();

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
      setLoading(true);
      const res = await axios.post("/api/auth/signin", input, {
        withCredentials: true,
      });
      return res.data;
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Invalid email or password";

      setErrors((prev) => ({
        ...prev,
        general: message,
      }));

      return null;
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {
      email: "",
      password: "",
      general: "",
    };

    if (!input.email) newErrors.email = "Email is required";
    if (!input.password) newErrors.password = "Password is required";

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

    const isValid = validate();
    if (!isValid) return;

    const data = await sendRequest();

    if (data && data.user) {
      login(data.user);

      if (onSuccess) {
        onSuccess();
      }

      router.replace("/pages/home");
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
      className="flex flex-col gap-4 justify-center"
      onSubmit={handleSubmit}
    >
      <TextField
        isRequired
        isInvalid={!!errors.email}
        className="flex flex-col gap-1"
      >
        <Label className="text-foreground">Email</Label>
        <Input
          value={input.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="you@example.com"
          className="bg-default-100 text-foreground border border-default-200 rounded-xl h-10"
        />
        {errors.email && <FieldError>{errors.email}</FieldError>}
      </TextField>

      <TextField
        isRequired
        isInvalid={!!errors.password}
        className="flex flex-col gap-1"
      >
        <Label className="text-foreground">Password</Label>
        <Input
          type="password"
          value={input.password}
          placeholder="Enter your password"
          onChange={(e) => handleChange("password", e.target.value)}
          className="bg-default-100 text-foreground border border-default-200 rounded-xl h-10"
        />
        {errors.password && <FieldError>{errors.password}</FieldError>}
      </TextField>

      {errors.general && (
        <p className="text-danger text-sm text-center">{errors.general}</p>
      )}

      <div className="mt-2 flex flex-col items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          className="w-full max-w-[320px] text-white font-semibold rounded-2xl h-10"
          isDisabled={isLoading}
        >
          {isLoading ? <Spinner color="current" /> : "Sign In"}
        </Button>
      </div>

      <div className="text-center text-sm text-default-500 mt-3 space-y-1">
        <p>
          <button
            type="button"
            onClick={() => switchMode?.("signup")}
            className="text-primary hover:text-primary-600 transition-colors cursor-pointer hover:text-blue-300"
          >
            Don't have an account? Sign up
          </button>
        </p>
        <p>
          <button
            type="button"
            onClick={() => switchMode?.("email-forgot-pass")}
            className="text-default-500 hover:text-default-700 transition-colors cursor-pointer hover:text-blue-300"
          >
            Forgot password?
          </button>
        </p>
      </div>
    </Form>
  );
}