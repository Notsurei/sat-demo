"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  FieldError,
  Form,
  Input,
  TextField,
  Label,
  Select,
  ListBox,
} from "@heroui/react";
import axios from "axios";
import { useAuthStore } from "@/zustand/auth-store";
import { Props } from "./props";

export default function SignUp({ switchMode }: Props) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedCountryKey, setSelectedCountryKey] =
    React.useState<React.Key>("VN");

  const [input, setInput] = React.useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
  });
  const normalizePhone = (countryCode: string, phone: string) => {
    let value = phone.trim().replace(/\D/g, "");
    const codesWithLeadingZero = new Set([
      "+84",
      "+81",
      "+82",
      "+44",
      "+33",
      "+49",
      "+61",
      "+91",
      "+65",
    ]);

    if (codesWithLeadingZero.has(countryCode) && value.startsWith("0")) {
      value = value.substring(1);
    }

    return `${countryCode}${value}`;
  };

  const [errors, setErrors] = React.useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    general: "",
  });

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

  const validate = () => {
    const newErrors = {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      gender: "",
      general: "",
    };

    if (!input.firstName) newErrors.firstName = "First name is required";
    if (!input.lastName) newErrors.lastName = "Last name is required";

    if (!input.phone) {
      newErrors.phone = "Phone number is required";
    } else if (
      !/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/.test(
        input.phone,
      )
    ) {
      newErrors.phone = "Invalid phone number format";
    }

    if (!input.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!input.password) {
      newErrors.password = "Password is required";
    } else if (input.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!input.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (input.password !== input.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!input.gender) newErrors.gender = "Please select your gender";

    setErrors(newErrors);

    return Object.values(newErrors).every((err) => !err);
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/pages/home");
    }
  }, [isAuthenticated, router]);

  const sendRequest = async () => {
    const selectedCountry = COUNTRY_CODES.find(
      (c) => c.key === selectedCountryKey,
    );
    const countryCode = selectedCountry?.code || "+84";

    const formattedPhone = normalizePhone(countryCode, input.phone);

    try {
      const res = await axios.post("/api/auth/signup", {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: formattedPhone,
        email: input.email,
        password: input.password,
        gender: input.gender,
      });

      return res.data;
    } catch (err: any) {
      const message = err?.response?.data?.error || "Signup failed";

      setErrors((prev) => ({
        ...prev,
        general: message,
      }));

      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validate();
    if (!isValid) return;

    setIsLoading(true);
    const data = await sendRequest();
    setIsLoading(false);

    if (data) {
      if (switchMode) {
        switchMode("signin");
      } else {
        router.push("/signin");
      }
    }
  };

  const COUNTRY_CODES = [
    {
      key: "VN",
      label: "🇻🇳 +84",
      code: "+84",
    },
    {
      key: "US",
      label: "🇺🇸 +1",
      code: "+1",
    },
    // {
    //   key: "JP",
    //   label: "🇯🇵 +81",
    //   code: "+81",
    // },
    // {
    //   key: "KR",
    //   label: "🇰🇷 +82",
    //   code: "+82",
    // },
  ];
  const GENDER_OPTIONS = [
    { key: "MALE", label: "Male" },
    { key: "FEMALE", label: "Female" },
    { key: "OTHERS", label: "Others" },
  ] as const;

  const textFields = [
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      placeholder: "John",
      half: true,
    },
    {
      name: "lastName",
      label: "Last Name",
      type: "text",
      placeholder: "Doe",
      half: true,
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "john@example.com",
      half: false,
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "tel",
      placeholder: "+1 234 567 8900",
      half: true,
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Minimum 6 characters",
      half: true,
    },
    {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      placeholder: "Re-enter password",
      half: true,
    },
  ];

  return (
    <Form className="w-full max-w-xl mx-auto space-y-5" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        {textFields.slice(0, 2).map((field) => (
          <TextField
            key={field.name}
            isRequired
            isInvalid={!!errors[field.name as keyof typeof errors]}
            className="space-y-1"
          >
            <Label className="text-sm font-medium text-zinc-300">
              {field.label}
            </Label>

            <Input
              type={field.type}
              placeholder={field.placeholder}
              value={input[field.name as keyof typeof input]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="h-11 rounded-xl"
            />

            {errors[field.name as keyof typeof errors] && (
              <FieldError>
                {errors[field.name as keyof typeof errors]}
              </FieldError>
            )}
          </TextField>
        ))}
      </div>

      <TextField isRequired isInvalid={!!errors.email} className="space-y-1">
        <Label className="text-sm font-medium text-slate-700">
          Email Address
        </Label>

        <Input
          type="email"
          placeholder="john@example.com"
          value={input.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className="h-11 rounded-xl"
        />

        {errors.email && <FieldError>{errors.email}</FieldError>}
      </TextField>

      <div>
        <TextField isRequired isInvalid={!!errors.phone} className="space-y-1">
          <Label className="text-sm font-medium text-slate-700">
            Phone Number
          </Label>
          <div className="flex gap-2">
            {/* <select
              value={selectedCountryKey}
              onChange={(e) => setSelectedCountryKey(e.target.value)}
              className="h-11 w-28 shrink-0 rounded-xl border border-zinc-300 px-3 text-sm transition cursor-pointer focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            >
              {COUNTRY_CODES.map((country) => (
                <option key={country.key} value={country.key}>
                  {country.label}
                </option>
              ))}
            </select> */}
            <Select
              isRequired
              placeholder="Regions"
              className="w-full"
              onSelectionChange={(key) => setSelectedCountryKey(key ?? "VN")}
            >
              <Select.Trigger className="flex h-11 items-center justify-between rounded-xl">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>

              <Select.Popover>
                <ListBox selectionMode="single">
                  {COUNTRY_CODES.map((country) => (
                    <ListBox.Item
                      key={country.key}
                      id={country.key}
                      textValue={country.key}
                    >
                      {country.label}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Input
              className="flex-1"
              placeholder="Phone number"
              value={input.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>
          {errors.phone && <FieldError>{errors.phone}</FieldError>}

          {input.phone && (
            <p className="mt-1 text-xs text-slate-500">
              📱 Will be saved as:{" "}
              <span className="font-medium text-blue-600">
                {normalizePhone(
                  COUNTRY_CODES.find((c) => c.key === selectedCountryKey)
                    ?.code || "+84",
                  input.phone,
                )}
              </span>
            </p>
          )}
        </TextField>

        <div>
          <Label className="text-sm font-medium text-slate-700">Gender</Label>

          <Select isRequired placeholder="Select gender" className="w-full">
            <Select.Trigger className="flex h-11 items-center justify-between rounded-xl">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>

            <Select.Popover>
              <ListBox selectionMode="single">
                {GENDER_OPTIONS.map((gender) => (
                  <ListBox.Item
                    key={gender.key}
                    id={gender.key}
                    textValue={gender.key}
                  >
                    {gender.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          {errors.gender && <FieldError>{errors.gender}</FieldError>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {textFields.slice(4).map((field) => (
          <TextField
            key={field.name}
            isRequired
            isInvalid={!!errors[field.name as keyof typeof errors]}
            className="space-y-1"
          >
            <Label className="text-sm font-medium text-zinc-300">
              {field.label}
            </Label>

            <Input
              type={field.type}
              placeholder={field.placeholder}
              value={input[field.name as keyof typeof input]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="h-11 rounded-xl"
            />

            {errors[field.name as keyof typeof errors] && (
              <FieldError>
                {errors[field.name as keyof typeof errors]}
              </FieldError>
            )}
          </TextField>
        ))}
      </div>

      {errors.general && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400 text-center">{errors.general}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-11 rounded-xl font-semibold text-white"
      >
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>

      <div className="text-center text-sm text-default-500 mt-3 space-y-1">
        {" "}
        <p>
          <button
            type="button"
            onClick={() => switchMode?.("signin")}
            className="text-primary hover:text-primary-600 transition-colors cursor-pointer hover:text-blue-300"
          >
            Already have an account? Sign in
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
