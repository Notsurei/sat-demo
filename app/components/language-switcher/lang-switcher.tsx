"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Globe } from "@gravity-ui/icons";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_META: Record<string, { flag: string; label: string }> = {
  en: { flag: "🇺🇸", label: "English" },
  vi: { flag: "🇻🇳", label: "Tiếng Việt" },
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");

  const current = LOCALE_META[locale] ?? LOCALE_META.en;

  const handleSelect = (nextLocale: string) => {
    if (nextLocale === locale) return;

    router.replace(pathname, {
      locale: nextLocale,
    });
  };

  return (
    <Dropdown>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        aria-label={t("language")}
      >
        <Globe width={16} />
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown width={14} />
      </Button>

      <Dropdown.Popover>
        <Dropdown.Menu
          aria-label={t("language")}
          selectionMode="single"
          selectedKeys={new Set([locale])}
          onAction={(key) => handleSelect(String(key))}
        >
          {routing.locales.map((loc) => {
            const meta = LOCALE_META[loc] ?? {
              flag: "🌐",
              label: loc,
            };

            return (
              <Dropdown.Item key={loc} id={loc} textValue={meta.label}>
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <span>{meta.flag}</span>
                    <span>{meta.label}</span>
                  </span>

                  {loc === locale && <Check width={14} />}
                </div>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}