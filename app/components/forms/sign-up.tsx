"use client";

import React from "react";
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
import { useTranslations } from "next-intl";
import axios from "axios";
import {
  parsePhoneNumber,
  isValidPhoneNumber,
  type CountryCode,
} from "libphonenumber-js";

import { useAuthStore } from "@/zustand/auth-store";
import { useRouter } from "@/i18n/navigation";

import { Props } from "./props";


const COUNTRY_CODES = [
  { key: "VN", label: "🇻🇳 +84", code: "+84" },
  { key: "US", label: "🇺🇸 +1", code: "+1" },
  // { key: "JP", label: "🇯🇵 +81", code: "+81" },
  // { key: "KR", label: "🇰🇷 +82", code: "+82" },
] as const;

const GENDER_OPTION_KEYS = [
  { key: "MALE", labelKey: "male" },
  { key: "FEMALE", labelKey: "female" },
  { key: "OTHERS", labelKey: "others" },
] as const;

const normalizePhone = (countryKey: string, phone: string): string => {
  try {
    const parsed = parsePhoneNumber(phone, countryKey as CountryCode);
    return parsed.number;
  } catch {
    return "";
  }
};

export default function SignUp({ switchMode }: Props) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const t = useTranslations("auth.signUp");
  const tErr = useTranslations("auth.signUpErrors");

  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedCountryKey, setSelectedCountryKey] =
    React.useState<string>("VN");

  const [input, setInput] = React.useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
  });

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
    setInput((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
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

    if (!input.firstName) newErrors.firstName = tErr("firstNameRequired");
    if (!input.lastName) newErrors.lastName = tErr("lastNameRequired");

    // ✅ Xác thực số điện thoại bằng libphonenumber-js
    if (!input.phone) {
      newErrors.phone = tErr("phoneRequired");
    } else {
      const formattedPhone = normalizePhone(selectedCountryKey, input.phone);

      if (!formattedPhone || !isValidPhoneNumber(formattedPhone)) {
        newErrors.phone = tErr("phoneInvalid");
      }
    }

    if (!input.email) {
      newErrors.email = tErr("emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      newErrors.email = tErr("emailInvalid");
    }

    if (!input.password) {
      newErrors.password = tErr("passwordRequired");
    } else if (input.password.length < 6) {
      newErrors.password = tErr("passwordMinLength");
    }

    if (!input.confirmPassword) {
      newErrors.confirmPassword = tErr("confirmPasswordRequired");
    } else if (input.password !== input.confirmPassword) {
      newErrors.confirmPassword = tErr("passwordsDoNotMatch");
    }

    if (!input.gender) newErrors.gender = tErr("genderRequired");

    setErrors(newErrors);

    return Object.values(newErrors).every((err) => !err);
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/pages/home");
    }
  }, [isAuthenticated, router]);

  const sendRequest = async () => {
    const formattedPhone = normalizePhone(selectedCountryKey, input.phone);

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
      const message = err?.response?.data?.error || tErr("signupFailed");

      setErrors((prev) => ({ ...prev, general: message }));

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

  const halfFields = [
    {
      name: "firstName" as const,
      label: t("fields.firstNameLabel"),
      type: "text",
      placeholder: t("fields.firstNamePlaceholder"),
    },
    {
      name: "lastName" as const,
      label: t("fields.lastNameLabel"),
      type: "text",
      placeholder: t("fields.lastNamePlaceholder"),
    },
    {
      name: "password" as const,
      label: t("fields.passwordLabel"),
      type: "password",
      placeholder: t("fields.passwordPlaceholder"),
    },
    {
      name: "confirmPassword" as const,
      label: t("fields.confirmPasswordLabel"),
      type: "password",
      placeholder: t("fields.confirmPasswordPlaceholder"),
    },
  ];

  const phonePreview = normalizePhone(selectedCountryKey, input.phone);

  return (
    <Form className="mx-auto w-full max-w-xl space-y-5" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        {halfFields.slice(0, 2).map((field) => (
          <TextField
            key={field.name}
            isRequired
            isInvalid={!!errors[field.name]}
            className="space-y-1"
          >
            <Label className="text-sm font-medium text-foreground">
              {field.label}
            </Label>

            <Input
              type={field.type}
              placeholder={field.placeholder}
              value={input[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="h-11 rounded-xl"
            />

            {errors[field.name] && <FieldError>{errors[field.name]}</FieldError>}
          </TextField>
        ))}
      </div>

      <TextField isRequired isInvalid={!!errors.email} className="space-y-1">
        <Label className="text-sm font-medium text-slate-700">
          {t("fields.emailLabel")}
        </Label>

        <Input
          type="email"
          placeholder={t("fields.emailPlaceholder")}
          value={input.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className="h-11 rounded-xl"
        />

        {errors.email && <FieldError>{errors.email}</FieldError>}
      </TextField>

      <div>
        <TextField isRequired isInvalid={!!errors.phone} className="space-y-1">
          <Label className="text-sm font-medium text-slate-700">
            {t("fields.phoneLabel")}
          </Label>

          <div className="flex gap-2">
            <Select
              isRequired
              placeholder={t("fields.phoneRegionsPlaceholder")}
              selectedKey={selectedCountryKey}
              onSelectionChange={(key) =>
                setSelectedCountryKey(key ? String(key) : "VN")
              }
              className="w-32 shrink-0"
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
                      textValue={country.label}
                    >
                      {country.label}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Input
              className="h-11 flex-1 rounded-xl"
              placeholder={t("fields.phonePlaceholder")}
              value={input.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          {errors.phone && <FieldError>{errors.phone}</FieldError>}

          {input.phone && phonePreview && (
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {t("phonePreview")}{" "}
              <span className="font-medium text-blue-600">{phonePreview}</span>
            </p>
          )}
        </TextField>

        <div className="mt-4">
          <Label className="text-sm font-medium text-slate-700">
            {t("fields.genderLabel")}
          </Label>

          <Select
            isRequired
            placeholder={t("fields.genderPlaceholder")}
            selectedKey={input.gender || undefined}
            onSelectionChange={(key) =>
              handleChange("gender", String(key ?? ""))
            }
            className="w-full"
          >
            <Select.Trigger className="flex h-11 items-center justify-between rounded-xl">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>

            <Select.Popover>
              <ListBox selectionMode="single">
                {GENDER_OPTION_KEYS.map((gender) => (
                  <ListBox.Item
                    key={gender.key}
                    id={gender.key}
                    textValue={t(`genderOptions.${gender.labelKey}`)}
                  >
                    {t(`genderOptions.${gender.labelKey}`)}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          {errors.gender && <FieldError>{errors.gender}</FieldError>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {halfFields.slice(2).map((field) => (
          <TextField
            key={field.name}
            isRequired
            isInvalid={!!errors[field.name]}
            className="space-y-1"
          >
            <Label className="text-sm font-medium text-foreground">
              {field.label}
            </Label>

            <Input
              type={field.type}
              placeholder={field.placeholder}
              value={input[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="h-11 rounded-xl"
            />

            {errors[field.name] && <FieldError>{errors[field.name]}</FieldError>}
          </TextField>
        ))}
      </div>

      {errors.general && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-center text-sm text-red-400">{errors.general}</p>
        </div>
      )}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl font-semibold text-white"
        isDisabled={isLoading}
      >
        {isLoading ? t("creatingButton") : t("createButton")}
      </Button>

      <div className="mt-3 space-y-1 text-center text-sm text-default-500">
        <p>
          <button
            type="button"
            onClick={() => switchMode?.("signin")}
            className="cursor-pointer text-primary transition-colors hover:text-primary-600 hover:text-blue-300"
          >
            {t("haveAccountPrompt")}
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
      </div>
    </Form>
  );
}